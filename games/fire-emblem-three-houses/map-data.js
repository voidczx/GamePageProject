window.FE3H_MAP_DATA = (() => {
  const battleToScenario = window.FE3H_MAP_SCENARIOS?.battleToScenario;
  if (!battleToScenario) throw new Error("map-scenarios.js must load before map-data.js");
  const assetRoot = "https://assets.fedatamine.com/3h/minimaps";
  const battleRoot = "https://houses.fedatamine.com/en-us/battles";
  const paralogueImage = (slug) => `https://www.fe3h.com/assets/images%2Fparalogues%2F${slug}.webp`;

  // FE Datamine exports the same 24 px-per-tile minimaps used by the game.
  // crop removes the transparent 1024 px canvas while cols/rows preserve the
  // real logical grid for exact tile-coordinate annotations.
  const terrainSpecs = {
    1:  { canvas:[1024,1024], crop:[71,70,482,530], cols:20, rows:22 },
    2:  { canvas:[1024,1024], crop:[71,71,434,722], cols:18, rows:30 },
    3:  { canvas:[1024,1024], crop:[71,71,602,482], cols:25, rows:20 },
    4:  { canvas:[1024,1024], crop:[71,71,554,626], cols:23, rows:26 },
    5:  { canvas:[1024,1024], crop:[71,71,506,602], cols:21, rows:25 },
    6:  { canvas:[1024,1024], crop:[72,72,528,552], cols:22, rows:23 },
    7:  { canvas:[1024,1024], crop:[72,72,720,720], cols:30, rows:30 },
    8:  { canvas:[1024,1024], crop:[71,71,506,530], cols:21, rows:22 },
    9:  { canvas:[1024,1024], crop:[71,71,482,482], cols:20, rows:20 },
    10: { canvas:[1024,1024], crop:[71,71,482,722], cols:20, rows:30 },
    11: { canvas:[1024,1024], crop:[71,71,506,626], cols:21, rows:26 },
    12: { canvas:[1024,1024], crop:[71,71,602,770], cols:25, rows:32 },
    13: { canvas:[1024,1024], crop:[71,71,626,410], cols:26, rows:17 },
    14: { canvas:[1024,1024], crop:[71,71,482,626], cols:20, rows:26 },
    15: { canvas:[1024,1024], crop:[71,71,482,722], cols:20, rows:30 },
    16: { canvas:[1024,1024], crop:[71,71,698,482], cols:29, rows:20 },
    17: { canvas:[1024,1024], crop:[71,71,722,722], cols:30, rows:30 },
    18: { canvas:[1024,1024], crop:[71,71,602,770], cols:25, rows:32 },
    19: { canvas:[1024,1024], crop:[71,71,602,770], cols:25, rows:32 },
    20: { canvas:[1024,1024], crop:[71,71,650,650], cols:27, rows:27 },
    21: { canvas:[1024,1024], crop:[71,71,722,602], cols:30, rows:25 },
    22: { canvas:[1024,1024], crop:[71,71,722,722], cols:30, rows:30 },
    23: { canvas:[1024,1024], crop:[71,71,722,650], cols:30, rows:27 },
    24: { canvas:[1024,1024], crop:[71,71,722,722], cols:30, rows:30 },
    25: { canvas:[1024,1024], crop:[71,71,722,722], cols:30, rows:30 },
    26: { canvas:[1024,1024], crop:[71,71,722,722], cols:30, rows:30 },
    27: { canvas:[1024,1024], crop:[71,71,722,602], cols:30, rows:25 },
    28: { canvas:[1024,1024], crop:[71,71,602,602], cols:25, rows:25 },
    29: { canvas:[1024,1024], crop:[71,71,506,482], cols:21, rows:20 },
    30: { canvas:[1024,1024], crop:[71,71,506,506], cols:21, rows:21 },
    31: { canvas:[1024,1024], crop:[71,71,482,626], cols:20, rows:26 },
    32: { canvas:[1024,1024], crop:[71,71,602,602], cols:25, rows:25 },
    33: { canvas:[1024,1024], crop:[71,71,602,410], cols:25, rows:17 },
    34: { canvas:[1024,1024], crop:[71,71,506,506], cols:21, rows:21 },
    35: { canvas:[1024,512],  crop:[71,71,626,362], cols:26, rows:15 },
    36: { canvas:[512,1024],  crop:[71,71,338,722], cols:14, rows:30 }
  };

  const terrainByBattle = {
    1:1, 2:2, 3:3, 4:4, 5:5, 6:6, 7:7, 8:8, 9:9, 10:10, 11:11, 12:12,
    13:13, 14:14, 15:15, 16:16, 17:7, 18:7, 19:17, 20:17, 21:26, 22:18,
    23:22, 24:19, 25:17, 26:20, 27:18, 28:12, 29:21, 30:19, 31:12, 32:16,
    33:22, 34:14, 35:23, 36:24, 37:25, 38:11, 39:23, 40:27, 41:28, 42:2,
    43:36, 44:33, 45:30, 46:33, 47:10, 48:33, 49:15, 50:10, 51:32, 52:31,
    53:34, 54:35, 55:35, 56:34, 57:27, 58:29, 59:36, 60:22, 93:18, 94:32,
    // The Secret Merchant reuses the Plateau / Falling Short of Heaven map:
    // https://www.neoseeker.com/fire-emblem-three-houses/paralogue_battles/The_Secret_Merchant
    97:30
  };

  const records = {};
  const register = (id, fedatamineBattle, extra = {}) => {
    const terrainId = terrainByBattle[fedatamineBattle];
    records[id] = {
      fedatamineBattle,
      terrainId: terrainId || null,
      terrain: terrainId ? {
        ...terrainSpecs[terrainId],
        source: `${assetRoot}/${terrainId}/0.png`
      } : null,
      source: `${battleRoot}/${fedatamineBattle}`,
      ...extra
    };
  };

  Object.entries(battleToScenario).forEach(([id, scenario]) => register(id, scenario));

  const paralogueSlugs = {
    war_weak:"war_for_the_weak", true_chivalry:"true_chivalry", forgotten:"the_forgotten",
    land_golden_deer:"land_of_the_golden_deer", rumored_nuptials:"rumored_nuptials",
    death_toll:"death_toll", falling_heaven:"falling_short_of_heaven",
    tales_red_canyon:"tales_of_the_red_canyon", cursed_relic:"a_cursed_relic",
    black_market:"black_market_scheme", dividing_world:"dividing_the_world",
    face_beneath:"the_face_beneath", legend_lake:"legend_of_the_lake",
    retribution:"retribution", forgotten_hero:"forgotten_hero",
    foreign_land:"foreign_land_and_sky", weathervanes:"weathervanes_of_fodlan",
    silver_maiden:"the_silver_maiden", sleeping_sand:"the_sleeping_sand_legend",
    insurmountable:"insurmountable", darkness_beneath:"darkness_beneath_the_earth",
    ocean_view:"an_ocean_view", oil_water:"oil_and_water",
    sword_shield:"sword_and_shield_of_seiros", secret_merchant:"the_secret_merchant",
    eternal_guardian:"eternal_guardian"
  };
  Object.entries(paralogueSlugs).forEach(([id, slug]) => {
    records[`pl-${id}`].referenceImage = paralogueImage(slug);
  });

  return { terrainSpecs, records };
})();
