const FE3H_MAP_SCENARIOS = (() => {
  // Canonical mapping from every guide battle record to the matching
  // FE Datamine battle/scenario id. Several routes intentionally reuse the
  // same scenario when the in-game map and battle setup are shared.
  const battleToScenario = Object.freeze({
    "wc-1": 1,
    "wc-2": 2,
    "wc-3": 3,
    "wc-4": 4,
    "wc-5": 5,
    "wc-6": 6,
    "wc-7": 7,
    "wc-8": 8,
    "wc-9": 9,
    "wc-10": 10,
    "wc-11": 11,
    "wc-12": 12,

    "am-13": 13,
    "am-14": 14,
    "am-15": 15,
    "am-16": 16,
    "am-17": 17,
    "am-18": 21,
    "am-19": 23,
    "am-20": 25,
    "am-21": 27,
    "am-22": 30,

    "vw-13": 13,
    "vw-14": 14,
    "vw-15": 15,
    "vw-16": 16,
    "vw-17": 17,
    "vw-18": 20,
    "vw-19": 22,
    "vw-20": 24,
    "vw-21": 26,
    "vw-22": 29,

    "cf-12": 31,
    "cf-13": 32,
    "cf-14": 33,
    "cf-15": 34,
    "cf-16": 35,
    "cf-17": 36,
    "cf-18": 37,

    "ss-13": 13,
    "ss-14": 14,
    "ss-15": 15,
    "ss-16": 16,
    "ss-17": 20,
    "ss-18": 22,
    "ss-19": 24,
    "ss-20": 26,
    "ss-21": 28,

    "pl-war_weak": 43,
    "pl-true_chivalry": 44,
    "pl-forgotten": 46,
    "pl-land_golden_deer": 54,
    "pl-rumored_nuptials": 49,
    "pl-death_toll": 55,
    "pl-falling_heaven": 45,
    "pl-tales_red_canyon": 42,
    "pl-cursed_relic": 94,
    "pl-black_market": 93,
    "pl-dividing_world": 57,
    "pl-face_beneath": 47,
    "pl-legend_lake": 52,
    "pl-retribution": 51,
    "pl-forgotten_hero": 56,
    "pl-foreign_land": 53,
    "pl-weathervanes": 48,
    "pl-silver_maiden": 39,
    "pl-sleeping_sand": 41,
    "pl-insurmountable": 40,
    "pl-darkness_beneath": 50,
    "pl-ocean_view": 58,
    "pl-oil_water": 59,
    "pl-sword_shield": 60,
    "pl-secret_merchant": 97,
    "pl-eternal_guardian": 38
  });

  function indicesForScenario(id) {
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new TypeError("scenario id must be a positive safe integer");
    }

    return Object.freeze({
      bai: 83 + (2 * id),
      bsi: 84 + (2 * id),
      terrain: 365 + id
    });
  }

  const battleIdsByScenario = {};
  for (const [battleId, scenarioId] of Object.entries(battleToScenario)) {
    (battleIdsByScenario[scenarioId] ||= []).push(battleId);
  }

  const manifest = Object.freeze(Object.keys(battleIdsByScenario)
    .map(Number)
    .sort((left, right) => left - right)
    .map((id) => Object.freeze({
      id,
      ...indicesForScenario(id),
      battleIds: Object.freeze([...battleIdsByScenario[id]].sort())
    })));

  const byId = Object.freeze(Object.fromEntries(
    manifest.map((scenario) => [scenario.id, scenario])
  ));

  function scenarioForBattle(battleId) {
    const scenarioId = battleToScenario[battleId];
    return scenarioId === undefined ? null : byId[scenarioId];
  }

  return Object.freeze({
    battleToScenario,
    manifest,
    byId,
    indicesForScenario,
    scenarioForBattle
  });
})();

if (typeof window !== "undefined") window.FE3H_MAP_SCENARIOS = FE3H_MAP_SCENARIOS;
if (typeof module !== "undefined") module.exports = FE3H_MAP_SCENARIOS;
