"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { buildSemanticMap } = require("../tools/map-import");
const { createBaiFixture, createTerrainFixture } = require("../tools/map-import/test/fixtures");
const { auditBattle, buildReport, loadData } = require("./map-fidelity-audit");

function completeSemanticMap() {
  return {
    version: 1,
    grid: { cols: 3, rows: 3, bounds: { x: 0, y: 0, width: 3, height: 3 } },
    tiles: Array.from({ length: 9 }, (_, index) => ({
      x: index % 3,
      y: Math.floor(index / 3),
      base: 0,
      overlay: 0
    })),
    units: [
      { slot: 0, x: 0, y: 0, team: "player", items: [], scriptSpawn: false },
      { slot: 1, x: 1, y: 0, team: "enemy", classId: 4, className: "Fighter", items: [], scriptSpawn: false }
    ],
    spawnDefinitions: [
      { slot: 7, team: "enemy", classId: 4, className: "Fighter", items: [{ id: 17, name: "Steel Sword", droppable: true }], scriptSpawn: true }
    ],
    treasures: [],
    events: [
      {
        type: "reinforcement",
        trigger: { turn: 2, phase: "enemy" },
        spawns: [{ slot: 7, x: 2, y: 2 }]
      }
    ],
    completeness: {
      terrain: true,
      units: true,
      spawnDefinitions: true,
      items: true,
      treasures: true,
      events: true,
      bounds: true
    }
  };
}

function auditSemantic(semantic) {
  return auditBattle(
    { id: "test-map", variantId: "test-map@AM", title: "Test Map", kind: "monthly", route: "AM", chapter: 1 },
    { semantic }
  );
}

test("fidelity audit expands the 74 maps into applicable route variants", () => {
  const { data, mapData, mapDetails } = loadData();
  const report = buildReport(data, mapData, mapDetails);

  assert.equal(report.summary.discoveredBattles, 74);
  assert.equal(report.summary.auditedVariants, 164);
  assert.equal(report.battles.filter((entry) => entry.id === "wc-12").length, 3);
  assert.equal(report.battles.filter((entry) => entry.id === "pl-war_weak").length, 1);
  assert.deepEqual(
    report.battles.filter((entry) => entry.id === "cf-12").map((entry) => entry.route),
    ["CF"]
  );
});

test("fidelity audit resolves one generated semantic route without leaking it to others", () => {
  const { data, mapData, mapDetails } = loadData();
  const semantic = buildSemanticMap({
    terrain: createTerrainFixture(),
    bai: createBaiFixture(),
    route: 0
  });
  const details = {
    ...mapDetails,
    records: { "wc-1": { version: 1, scenario: 1, variants: { AM: semantic } } }
  };
  const report = buildReport(data, mapData, details);
  const azureMoon = report.battles.find((entry) => entry.variantId === "wc-1@AM");
  const verdantWind = report.battles.find((entry) => entry.variantId === "wc-1@VW");

  assert.equal(report.summary.semanticRecords, 1);
  assert.equal(azureMoon.semanticPresent, true);
  assert.equal(azureMoon.grid.source, "semantic.grid");
  assert.equal(verdantWind.semanticPresent, false);
  assert.ok(verdantWind.issues.some((entry) => entry.code === "ROUTE_VARIANT_MISSING"));
});

test("fidelity audit separates initial units from coordinate-free spawn definitions", () => {
  const result = auditSemantic(completeSemanticMap());

  assert.equal(result.ok, true);
  assert.deepEqual(result.units.initial, { player: 1, enemy: 1, npc: 0 });
  assert.equal(result.spawnDefinitions.count, 1);
  assert.equal(result.events.reinforcement.count, 1);
  assert.equal(result.events.reinforcement.coordinates, 1);
  assert.ok(!result.issues.some((entry) => entry.code === "COORDINATE_MISSING"));
});

test("fidelity audit rejects script-generated definitions left in initial units without demanding coordinates", () => {
  const semantic = completeSemanticMap();
  semantic.units.push({ slot: 8, team: "enemy", items: [], scriptSpawn: true });
  const result = auditSemantic(semantic);

  assert.ok(result.issues.some((entry) => entry.code === "SCRIPT_UNIT_NOT_SEPARATED"));
  assert.ok(!result.issues.some((entry) => entry.code === "COORDINATE_MISSING" && entry.path === "semantic.units[2].position"));
});

test("fidelity audit requires every initial unit coordinate to stay inside the grid", () => {
  const semantic = completeSemanticMap();
  semantic.units[0].x = 3;
  const result = auditSemantic(semantic);

  assert.ok(result.issues.some((entry) => entry.code === "COORDINATE_OUT_OF_BOUNDS" && entry.path === "semantic.units[0].position"));
});

test("fidelity audit accepts reinforcement references by definition ID", () => {
  const semantic = completeSemanticMap();
  semantic.spawnDefinitions = [
    { definitionId: "north-mage", team: "enemy", classId: 4, className: "Fighter", items: [], scriptSpawn: true }
  ];
  semantic.events[0].spawns = [{ definitionId: "north-mage", x: 2, y: 2 }];
  const result = auditSemantic(semantic);

  assert.equal(result.ok, true);
  assert.deepEqual(result.spawnDefinitions.ids, ["north-mage"]);
});

test("fidelity audit requires readable enemy class, item, and treasure names", () => {
  const semantic = completeSemanticMap();
  delete semantic.units[1].className;
  delete semantic.spawnDefinitions[0].className;
  delete semantic.spawnDefinitions[0].items[0].name;
  semantic.treasures = [{ x: 2, y: 1, items: [{ id: 8 }] }];
  const result = auditSemantic(semantic);
  const codes = result.issues.map((entry) => entry.code);

  assert.ok(codes.includes("UNIT_CLASS_NAME_MISSING"));
  assert.ok(codes.includes("SPAWN_CLASS_NAME_MISSING"));
  assert.ok(codes.includes("ITEM_NAME_MISSING"));
  assert.ok(codes.includes("TREASURE_CONTENT_NAME_MISSING"));
});

test("fidelity audit rejects incomplete or dangling reinforcement and ambush events", () => {
  const semantic = completeSemanticMap();
  semantic.events = [
    { type: "reinforcement", trigger: { turn: 3 }, spawns: [{ slot: 99, x: 2, y: 2 }] },
    { type: "ambush", spawns: [{ slot: 7, x: 2, y: 1 }] },
    { type: "reinforcement", trigger: { condition: "boss defeated" }, spawnSlots: [7] },
    { type: "ambush", trigger: { area: "west" }, spawns: [{ x: 1, y: 2 }] }
  ];
  const result = auditSemantic(semantic);
  const codes = result.issues.map((entry) => entry.code);

  assert.ok(codes.includes("SPAWN_REFERENCE_UNKNOWN"));
  assert.ok(codes.includes("EVENT_TRIGGER_MISSING"));
  assert.ok(codes.includes("SPAWN_COORDINATES_MISSING"));
  assert.ok(codes.includes("SPAWN_REFERENCE_MISSING"));
  assert.equal(result.events.reinforcement.count, 2);
  assert.equal(result.events.ambush.count, 2);
});
