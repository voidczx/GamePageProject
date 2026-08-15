const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const context = vm.createContext({ window: {}, console });

for (const file of [
  "map-scenarios.js",
  "map-data.js",
  "route-battles-am-vw.js",
  "route-battles-cf-ss.js",
  "paralogue-battles.js",
  "data.js"
]) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename: file });
}

const scenarios = context.window.FE3H_MAP_SCENARIOS;
const data = context.window.FE3H_DATA;
const existingRecords = context.window.FE3H_MAP_DATA.records;
const monthlyBattles = [...data.battles, ...Object.values(data.routeBattles).flat()];
const paralogueBattles = data.paralogues.map((entry) => entry.battle);
const allBattles = [...monthlyBattles, ...paralogueBattles];

assert.equal(monthlyBattles.length, 48, "monthly battle baseline changed");
assert.equal(paralogueBattles.length, 26, "paralogue battle baseline changed");
assert.equal(allBattles.length, 74, "scenario mapping must cover all 74 battle records");

const mappedBattleIds = Object.keys(scenarios.battleToScenario).sort();
const currentBattleIds = allBattles.map((battle) => battle.id).sort();
assert.deepEqual(mappedBattleIds, currentBattleIds, "battle-to-scenario manifest is missing or contains stale battle ids");

for (const battle of allBattles) {
  const scenarioId = scenarios.battleToScenario[battle.id];
  assert.equal(
    scenarioId,
    existingRecords[battle.id]?.fedatamineBattle,
    `${battle.id} no longer matches the existing FE Datamine scenario mapping`
  );
  assert.equal(scenarios.scenarioForBattle(battle.id)?.id, scenarioId, `${battle.id} reverse lookup failed`);
}
assert.equal(scenarios.scenarioForBattle("missing-battle"), null, "unknown battle lookup must be explicit");

const uniqueScenarioIds = [...new Set(Object.values(scenarios.battleToScenario))].sort((a, b) => a - b);
assert.equal(uniqueScenarioIds.length, 61, "74 battle records must resolve to 61 unique scenarios");
assert.equal(scenarios.manifest.length, 61, "manifest must contain one entry per unique scenario");
assert.deepEqual(Array.from(scenarios.manifest, (entry) => entry.id), uniqueScenarioIds, "manifest ids must be unique and sorted");

for (const entry of scenarios.manifest) {
  assert.equal(entry.bai, 83 + (2 * entry.id), `scenario ${entry.id} BAI index is wrong`);
  assert.equal(entry.bsi, 84 + (2 * entry.id), `scenario ${entry.id} BSI index is wrong`);
  assert.equal(entry.terrain, 365 + entry.id, `scenario ${entry.id} terrain index is wrong`);
  assert.deepEqual(
    Array.from(entry.battleIds),
    mappedBattleIds.filter((battleId) => scenarios.battleToScenario[battleId] === entry.id),
    `scenario ${entry.id} reverse battle list is incomplete`
  );
  assert.equal(scenarios.byId[entry.id], entry, `scenario ${entry.id} byId lookup failed`);
}

assert.deepEqual(
  { ...scenarios.indicesForScenario(31) },
  { bai: 145, bsi: 146, terrain: 396 },
  "index calculator regression"
);
assert.throws(() => scenarios.indicesForScenario(0), /positive safe integer/);
assert.throws(() => scenarios.indicesForScenario(1.5), /positive safe integer/);

const specialRouteMappings = {
  "am-18": 21,
  "am-20": 25,
  "am-22": 30,
  "vw-18": 20,
  "vw-22": 29,
  "cf-12": 31,
  "cf-18": 37,
  "ss-17": 20,
  "ss-21": 28,
  "pl-black_market": 93,
  "pl-cursed_relic": 94,
  "pl-secret_merchant": 97
};
for (const [battleId, expectedScenario] of Object.entries(specialRouteMappings)) {
  assert.equal(scenarios.battleToScenario[battleId], expectedScenario, `${battleId} special scenario mapping is wrong`);
}

console.log("FE3H scenario manifest OK: 74 battle records, 61 unique scenarios, index formulas verified.");
