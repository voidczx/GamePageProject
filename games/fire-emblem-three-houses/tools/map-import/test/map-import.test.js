"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const test = require("node:test");

const {
  TERRAIN_BYTE_LENGTH,
  parseTerrain,
  parseBai,
  parseBsi,
  buildSemanticMap
} = require("..");
const { createTerrainFixture, createBaiFixture, createBsiFixture } = require("./fixtures");
const catalogs = require("../catalogs");

test("generated BAI catalogs cover every audited display-name domain", () => {
  assert.deepEqual(Object.fromEntries(Object.entries(catalogs).map(([key, value]) => [key, Object.keys(value).length])), {
    characters: 79,
    classes: 90,
    items: 748,
    skills: 238,
    battalions: 200,
    spells: 38,
    combatArts: 80,
    rotations: 6,
    genders: 3,
    movement: 2,
    commanderStatuses: 4
  });
  assert.equal(catalogs.classes[4], "Fighter");
  assert.equal(catalogs.items[17], "Steel Sword");
  assert.equal(catalogs.battalions[10], "Empire Infantry");
});

test("parseTerrain reads the complete 32x32 two-layer grid and visible bounds", () => {
  const terrain = parseTerrain(createTerrainFixture());
  assert.deepEqual(terrain.header, [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(terrain.grid, {
    cols: 32,
    rows: 32,
    bounds: { x: 3, y: 2, width: 3, height: 3 }
  });
  assert.equal(terrain.boundsReliable, true);
  assert.equal(terrain.tiles.length, 1024);
  assert.deepEqual(terrain.tiles[2 * 32 + 3], { x: 3, y: 2, base: 46, overlay: 17 });
});

test("parseTerrain falls back to full bounds when every tile is zero", () => {
  const terrain = parseTerrain(Buffer.alloc(TERRAIN_BYTE_LENGTH));
  assert.deepEqual(terrain.grid.bounds, { x: 0, y: 0, width: 32, height: 32 });
  assert.equal(terrain.boundsReliable, false);
});

test("parseBai selects a route and normalizes unit IDs, teams, items, and flags", () => {
  const routeZero = parseBai(createBaiFixture(), { route: 0 });
  assert.equal(routeZero.units.length, 2);
  const enemy = routeZero.units[0];
  assert.deepEqual({
    slot: enemy.slot,
    x: enemy.x,
    y: enemy.y,
    team: enemy.team,
    characterId: enemy.characterId,
    characterName: enemy.characterName,
    classId: enemy.classId,
    className: enemy.className,
    level: enemy.level,
    scriptSpawn: enemy.scriptSpawn,
    commander: enemy.commander
  }, {
    slot: 0,
    x: 255,
    y: 254,
    team: "enemy",
    characterId: 10,
    characterName: "Dorothea",
    classId: 4,
    className: "Fighter",
    level: 31,
    scriptSpawn: true,
    commander: true
  });
  assert.deepEqual(enemy.items, [
    { id: 17, name: "Steel Sword", droppable: true },
    { id: 601, name: "Iron Shield", droppable: true }
  ]);
  assert.deepEqual(enemy.skills, [1, 5]);
  assert.deepEqual(enemy.skillNames, ["Sword Prowess Lv.2", "Lance Prowess Lv.1"]);
  assert.deepEqual(enemy.spells, [{ id: 0, name: "Fire" }, { id: 4, name: "Thoron" }]);
  assert.deepEqual(enemy.combatArt, { id: 1, name: "Wrath Strike" });
  assert.deepEqual(enemy.rotation, { id: 6, name: "Down" });
  assert.deepEqual(enemy.movement, { id: 3, name: "Can Move But Wont", canMove: false });
  assert.deepEqual(enemy.battalion, { enabled: true, id: 10, name: "Empire Infantry", level: 3 });
  assert.deepEqual(enemy.gender, { id: 2, name: "Forced Female" });

  const player = routeZero.units[1];
  assert.deepEqual(
    { slot: player.slot, x: player.x, y: player.y, team: player.team, characterId: player.characterId, classId: player.classId, items: player.items, skills: player.skills, scriptSpawn: player.scriptSpawn, commander: player.commander },
    { slot: 5, x: 1, y: 2, team: "player", characterId: null, classId: null, items: [], skills: [], scriptSpawn: false, commander: false }
  );

  const routeOne = parseBai(createBaiFixture(), { route: 1 });
  assert.equal(routeOne.units.length, 1);
  assert.equal(routeOne.units[0].team, "enemy", "yellow enemy team must normalize to enemy");
  assert.equal(routeOne.units[0].slot, 2);
});

test("buildSemanticMap separates scripted definitions from initial render units", () => {
  const result = buildSemanticMap({
    terrain: createTerrainFixture(),
    bai: createBaiFixture(),
    route: 0
  });

  assert.equal(result.version, 1);
  assert.deepEqual(result.grid.bounds, { x: 3, y: 2, width: 3, height: 3 });
  assert.equal(result.tiles.length, 1024);
  assert.equal(result.units.length, 1);
  assert.equal(result.units[0].slot, 5);
  assert.equal(result.units[0].scriptSpawn, false);
  assert.equal(result.spawnDefinitions.length, 1);
  assert.equal(result.spawnDefinitions[0].slot, 0);
  assert.equal(result.spawnDefinitions[0].className, "Fighter");
  assert.equal(result.spawnDefinitions[0].items[0].name, "Steel Sword");
  assert.equal(result.spawnDefinitions[0].scriptSpawn, true);
  assert.deepEqual(result.treasures, [{ x: 3, y: 2, kind: "chest", label: "宝箱 1", items: [] }]);
  assert.deepEqual(result.events, []);
  assert.deepEqual(result.completeness, {
    terrain: true,
    units: true,
    spawnDefinitions: true,
    items: true,
    treasures: false,
    treasurePositions: true,
    events: false,
    eventCandidates: false,
    bounds: true
  });
});

test("parseBsi decodes verified condition and action boundaries", () => {
  const result = parseBsi(createBsiFixture());
  assert.equal(result.header.eventCount, 1);
  assert.equal(result.events[0].eventNum, 7);
  assert.deepEqual(result.events[0].trigger, { type: 2000, param1: 0, param2: 0, param3: 0 });
  assert.deepEqual(result.events[0].conditions.commands.map((entry) => entry.name), [
    "difficulty",
    "turn-number",
    "any-unit-in-rectangle"
  ]);
  assert.equal(result.events[0].conditions.commands[0].difficulty, "MADDENING");
  assert.equal(result.events[0].conditions.commands[1].turn, 3);
  assert.deepEqual(result.events[0].conditions.commands[2].area, { left: 1, top: 2, right: 4, bottom: 5 });
  assert.deepEqual(result.events[0].middle.raw, [15000, 0, 0, 0]);
  assert.deepEqual(result.events[0].actions.commands.map((entry) => entry.name), [
    "spawn-unit",
    "spawn-spooky",
    "grant-droppable-item",
    "grant-item-quantity"
  ]);
  assert.deepEqual(result.events[0].actions.commands[0].bai, { raw: 0, version: 0, slot: 0 });
  assert.deepEqual(result.events[0].actions.commands[1].position, { x: 8, y: 9 });
  assert.equal(result.events[0].actions.countMatches, true);
  assert.equal(result.audit.semantic, false);
  assert.equal(result.audit.sectionsComplete, true);
});

test("parseBsi stops an unknown opcode without guessing a new boundary", () => {
  const fixture = createBsiFixture();
  fixture.writeUInt32LE(9999, 0x70);
  const result = parseBsi(fixture);

  assert.equal(result.events[0].conditions.complete, false);
  assert.equal(result.events[0].conditions.commands.length, 0);
  assert.equal(result.events[0].conditions.opaqueRemainder.opcode, 9999);
  assert.equal(result.events[0].actions.complete, true, "an opaque condition must not corrupt the independent action section");
});

test("buildSemanticMap links BSI spawn and reward candidates without inventing ambush timing", () => {
  const result = buildSemanticMap({
    terrain: createTerrainFixture(),
    bai: createBaiFixture(),
    bsi: createBsiFixture(),
    route: 0
  });

  assert.equal(result.events.length, 4);
  assert.equal(result.events.filter((entry) => entry.type === "reinforcement").length, 2);
  assert.equal(result.events[0].label, "Reinforcement: Dorothea");
  assert.match(result.events[0].summary, /Fighter.*Steel Sword \(drop\)/);
  assert.deepEqual(result.events[0].spawnSlots, [0]);
  assert.deepEqual(result.events[0].spawns, [], "out-of-grid BAI placeholders are not map coordinates");
  assert.deepEqual(result.events[1].spawns, [{ slot: 0, x: 8, y: 9 }]);
  assert.equal(result.events[1].ambushStatus, "unverified");
  assert.equal(result.events[2].type, "reward");
  assert.equal(result.completeness.eventCandidates, true);
  assert.equal(result.completeness.events, false);
});

test("parsers reject truncated input and invalid routes", () => {
  assert.throws(() => parseTerrain(Buffer.alloc(TERRAIN_BYTE_LENGTH - 1)), /exactly 2056 bytes/);
  assert.throws(() => parseBai(createBaiFixture(), { route: 3 }), /integer from 0 to 2/);
  assert.throws(() => parseBai(Buffer.alloc(24), { route: 0 }), /requires bytes/);
  assert.throws(() => parseBsi(Buffer.alloc(24)), /56-byte header/);
});

test("CLI writes the semantic object to stdout", () => {
  const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "fe3h-map-import-"));
  try {
    const terrainPath = path.join(tempDirectory, "terrain.bin");
    const baiPath = path.join(tempDirectory, "battle.bai");
    fs.writeFileSync(terrainPath, createTerrainFixture());
    fs.writeFileSync(baiPath, createBaiFixture());

    const result = spawnSync(process.execPath, [
      path.resolve(__dirname, "..", "cli.js"),
      "--terrain", terrainPath,
      "--bai", baiPath,
      "--route", "1",
      "--compact"
    ], { encoding: "utf8" });

    assert.equal(result.status, 0, result.stderr);
    const output = JSON.parse(result.stdout);
    assert.equal(output.version, 1);
    assert.equal(output.units.length, 1);
    assert.equal(output.units[0].slot, 2);
    assert.deepEqual(output.spawnDefinitions, []);
  } finally {
    fs.rmSync(tempDirectory, { recursive: true, force: true });
  }
});
