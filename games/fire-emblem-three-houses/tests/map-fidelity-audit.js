#!/usr/bin/env node

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const EXPECTED_BATTLE_COUNT = 74;
const REQUIRED_TEAMS = ["player", "enemy", "npc"];
const REQUIRED_COMPLETENESS = ["terrain", "units", "spawnDefinitions", "items", "treasures", "events", "bounds"];
const KNOWN_EVENT_TYPES = new Set(["reinforcement", "ambush"]);

function parseArguments(argv) {
  const options = { format: "human", strict: false };

  for (const argument of argv) {
    if (argument === "--strict") options.strict = true;
    else if (argument === "--json") options.format = "json";
    else if (argument === "--both") options.format = "both";
    else if (argument === "--human") options.format = "human";
    else if (argument === "--help" || argument === "-h") options.help = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }

  return options;
}

function usage() {
  return [
    "Usage: node tests/map-fidelity-audit.js [--human|--json|--both] [--strict]",
    "",
    "  default    Print a human-readable audit and always exit 0.",
    "  --json     Print machine-readable JSON only.",
    "  --both     Print the human report followed by JSON.",
    "  --strict   Exit 1 when any fidelity requirement is unmet.",
    "  --help     Show this help text."
  ].join("\n");
}

function loadData() {
  const context = vm.createContext({ window: {}, console });
  const files = [
    "map-scenarios.js",
    "map-data.js",
    "map-details.js",
    "route-battles-am-vw.js",
    "route-battles-cf-ss.js",
    "paralogue-battles.js",
    "data.js"
  ];

  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename: file });
  }

  return {
    data: context.window.FE3H_DATA,
    mapData: context.window.FE3H_MAP_DATA,
    mapDetails: context.window.FE3H_MAP_DETAILS
  };
}

function battleInventory(data) {
  const monthly = [...data.battles, ...Object.values(data.routeBattles).flat()];
  return [
    ...monthly.map((battle) => ({
      id: battle.id,
      title: battle.title,
      kind: "monthly",
      route: battle.route || "WC",
      chapter: battle.chapter,
      routes: battle.route
        ? [battle.route]
        : battle.chapter === 12
          ? ["AM", "VW", "SS"]
          : ["AM", "VW", "CF", "SS"]
    })),
    ...data.paralogues.map((entry) => ({
      id: entry.battle.id,
      title: entry.battle.title,
      kind: "paralogue",
      route: "PARALOGUE",
      chapter: entry.battle.chapter,
      routes: [...new Set((entry.availability || []).flatMap((range) => range.routes || []))]
    }))
  ];
}

function hasOwn(object, key) {
  return object != null && Object.prototype.hasOwnProperty.call(object, key);
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function positiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function nonEmptyIdentity(value) {
  if (typeof value === "string") return value.trim().length > 0;
  if (!isObject(value)) return false;
  return ["id", "name", "label", "type", "kind", "terrain", "item", "itemId", "class", "classId"]
    .some((key) => (typeof value[key] === "string" && value[key].trim().length > 0)
      || (Number.isSafeInteger(value[key]) && value[key] >= 0));
}

function nonEmptyDisplayName(value) {
  if (typeof value === "string") return value.trim() !== "";
  return isObject(value) && typeof value.name === "string" && value.name.trim() !== "";
}

function normalizeTeam(team) {
  const value = typeof team === "string" ? team.toLowerCase() : "";
  if (["player", "blue"].includes(value)) return "player";
  if (["enemy", "red"].includes(value)) return "enemy";
  if (["npc", "ally", "third", "green"].includes(value)) return "npc";
  return null;
}

function issue(result, code, pathName, message, details) {
  const entry = { code, path: pathName, message };
  if (details !== undefined) entry.details = details;
  result.issues.push(entry);
}

function schemaMismatch(result, pathName, message) {
  issue(result, "SCHEMA_MISMATCH", pathName, message);
  result.schemaMismatch = true;
}

function resolveGrid(record, result) {
  const semantic = isObject(record?.semantic) ? record.semantic : null;
  let grid = semantic && isObject(semantic.grid) ? semantic.grid : null;
  let source = grid ? "semantic.grid" : null;

  if (!grid && isObject(record?.grid)) {
    grid = record.grid;
    source = "grid";
    schemaMismatch(result, "grid", "Grid must move to record.semantic.grid.");
  }
  if (!grid && isObject(record?.terrain)) {
    grid = record.terrain;
    source = "terrain";
    schemaMismatch(result, "terrain", "Legacy terrain dimensions are readable but are not record.semantic.grid.");
  }

  if (!grid) {
    issue(result, "GRID_MISSING", "semantic.grid", "No logical grid is available; a reference image does not count as a grid.");
    return { present: false, valid: false, source: null, cols: null, rows: null, boundsValid: false };
  }

  const cols = grid.cols;
  const rows = grid.rows;
  let valid = true;
  if (!positiveInteger(cols) || !positiveInteger(rows)) {
    valid = false;
    issue(result, "GRID_DIMENSIONS_INVALID", `${source}.cols/rows`, "Grid cols and rows must be positive integers.", { cols, rows });
  }

  let boundsValid = false;
  if (source !== "semantic.grid") {
    issue(result, "GRID_BOUNDS_MISSING", "semantic.grid.bounds", "Canonical 0-based semantic grid bounds are missing.");
  } else if (!hasOwn(grid, "bounds")) {
    issue(result, "GRID_BOUNDS_MISSING", "semantic.grid.bounds", "Grid bounds must be explicitly present.");
  } else if (valid) {
    boundsValid = validateGridBounds(grid.bounds, cols, rows, result);
  }

  return { present: true, valid, source, cols, rows, boundsValid };
}

function validateGridBounds(bounds, cols, rows, result) {
  let values = null;
  if (Array.isArray(bounds) && bounds.length === 4) {
    values = { x: bounds[0], y: bounds[1], width: bounds[2], height: bounds[3] };
  } else if (isObject(bounds) && ["x", "y", "width", "height"].every((key) => hasOwn(bounds, key))) {
    values = bounds;
  } else if (isObject(bounds) && ["minX", "minY", "maxX", "maxY"].every((key) => hasOwn(bounds, key))) {
    values = {
      x: bounds.minX,
      y: bounds.minY,
      width: bounds.maxX - bounds.minX + 1,
      height: bounds.maxY - bounds.minY + 1
    };
  }

  const valid = values
    && Number.isInteger(values.x)
    && Number.isInteger(values.y)
    && positiveInteger(values.width)
    && positiveInteger(values.height)
    && values.x >= 0
    && values.y >= 0
    && values.x + values.width <= cols
    && values.y + values.height <= rows;

  if (!valid) {
    issue(result, "GRID_BOUNDS_INVALID", "semantic.grid.bounds", "Bounds must be a non-empty 0-based rectangle inside the logical grid.", bounds);
    return false;
  }
  return true;
}

function resolveSemantic(record, result) {
  if (isObject(record?.semantic)) return { semantic: record.semantic, canonical: true };

  issue(result, "SEMANTIC_MISSING", "semantic", "record.semantic is missing.");
  const legacy = {};
  let foundLegacy = false;

  if (hasOwn(record, "semanticTiles") || hasOwn(record, "tiles")) {
    legacy.tiles = record.semanticTiles ?? record.tiles;
    foundLegacy = true;
  }
  if (hasOwn(record, "units")) {
    legacy.units = record.units;
    foundLegacy = true;
  } else if (hasOwn(record, "initial")) {
    legacy.units = record.initial;
    foundLegacy = true;
  }
  if (hasOwn(record, "spawnDefinitions")) {
    legacy.spawnDefinitions = record.spawnDefinitions;
    foundLegacy = true;
  }
  if (hasOwn(record, "treasures")) {
    legacy.treasures = record.treasures;
    foundLegacy = true;
  }
  if (hasOwn(record, "events")) {
    legacy.events = record.events;
    foundLegacy = true;
  } else if (hasOwn(record, "reinforcements") || hasOwn(record, "ambushes")) {
    legacy.events = [
      ...(Array.isArray(record.reinforcements) ? record.reinforcements.map((entry) => ({ type: "reinforcement", ...entry })) : []),
      ...(Array.isArray(record.ambushes) ? record.ambushes.map((entry) => ({ type: "ambush", ...entry })) : [])
    ];
    foundLegacy = true;
  }
  if (hasOwn(record, "completeness")) {
    legacy.completeness = record.completeness;
    foundLegacy = true;
  }

  if (foundLegacy) schemaMismatch(result, "semantic", "Legacy semantic fields were found outside record.semantic.");
  return { semantic: legacy, canonical: false };
}

function coordinateFor(value, result, pathName, grid, required = true) {
  if (!isObject(value)) {
    if (required) issue(result, "COORDINATE_MISSING", pathName, "Position must be an object with 0-based x/y coordinates.");
    return { present: false, valid: false };
  }

  const hasXY = hasOwn(value, "x") || hasOwn(value, "y");
  const hasColRow = hasOwn(value, "col") || hasOwn(value, "row");
  let x;
  let y;
  let mode;

  if (hasXY) {
    x = value.x;
    y = value.y;
    mode = "xy";
  } else if (hasColRow) {
    x = Number.isInteger(value.col) ? value.col - 1 : value.col;
    y = Number.isInteger(value.row) ? value.row - 1 : value.row;
    mode = "colrow";
    schemaMismatch(result, pathName, "col/row coordinates are legacy 1-based values; use 0-based x/y.");
  } else {
    if (required) issue(result, "COORDINATE_MISSING", pathName, "Position requires x/y coordinates.");
    return { present: false, valid: false };
  }

  if (!Number.isInteger(x) || !Number.isInteger(y)) {
    issue(result, "COORDINATE_INVALID", pathName, "Coordinates must be integers.", mode === "xy" ? { x: value.x, y: value.y } : { col: value.col, row: value.row });
    return { present: true, valid: false };
  }

  if (!grid.valid) {
    issue(result, "COORDINATE_UNCHECKABLE", pathName, "Coordinate bounds cannot be checked without a valid grid.", { x, y });
    return { present: true, valid: false };
  }

  const width = value.width ?? value.w ?? (mode === "colrow" ? value.cols : undefined) ?? 1;
  const height = value.height ?? value.h ?? (mode === "colrow" ? value.rows : undefined) ?? 1;
  if (!positiveInteger(width) || !positiveInteger(height)) {
    issue(result, "FOOTPRINT_INVALID", pathName, "Coordinate footprint width and height must be positive integers.", { width, height });
    return { present: true, valid: false };
  }

  const inBounds = x >= 0 && y >= 0 && x + width <= grid.cols && y + height <= grid.rows;
  if (!inBounds) {
    issue(result, "COORDINATE_OUT_OF_BOUNDS", pathName, "Coordinate or footprint exceeds the logical grid.", {
      x, y, width, height, cols: grid.cols, rows: grid.rows
    });
  }
  return { present: true, valid: inBounds, x, y, width, height };
}

function validateTiles(semantic, result, grid) {
  const issueStart = result.issues.length;
  const status = { present: hasOwn(semantic, "tiles"), valid: false, count: 0, expected: grid.valid ? grid.cols * grid.rows : null };
  if (!status.present) {
    issue(result, "TILES_MISSING", "semantic.tiles", "Semantic tiles must be explicitly present.");
    return status;
  }
  if (!Array.isArray(semantic.tiles)) {
    issue(result, "TILES_INVALID", "semantic.tiles", "Semantic tiles must be an array.");
    return status;
  }

  const tiles = semantic.tiles;
  const twoDimensional = grid.valid
    && tiles.length === grid.rows
    && tiles.every((row) => Array.isArray(row));
  if (twoDimensional) {
    status.count = tiles.reduce((sum, row) => sum + row.length, 0);
    for (let y = 0; y < tiles.length; y += 1) {
      if (tiles[y].length !== grid.cols) {
        issue(result, "TILES_ROW_LENGTH_INVALID", `semantic.tiles[${y}]`, "Each semantic tile row must contain grid.cols entries.", {
          actual: tiles[y].length, expected: grid.cols
        });
      }
      for (let x = 0; x < tiles[y].length; x += 1) {
        if (!validTileSemantic(tiles[y][x])) issue(result, "TILE_SEMANTIC_MISSING", `semantic.tiles[${y}][${x}]`, "Tile base/overlay semantic identity is missing or invalid.");
      }
    }
  } else {
    status.count = tiles.length;
    const coordinateEntries = tiles.every((tile) => isObject(tile) && (hasOwn(tile, "x") || hasOwn(tile, "col")));
    if (coordinateEntries) {
      const seen = new Set();
      tiles.forEach((tile, index) => {
        const coordinate = coordinateFor(tile, result, `semantic.tiles[${index}]`, grid);
        if (coordinate.valid) {
          const key = `${coordinate.x},${coordinate.y}`;
          if (seen.has(key)) issue(result, "TILE_COORDINATE_DUPLICATE", `semantic.tiles[${index}]`, "Two semantic tiles use the same coordinate.", { x: coordinate.x, y: coordinate.y });
          seen.add(key);
        }
        if (!validTileSemantic(tile)) issue(result, "TILE_SEMANTIC_MISSING", `semantic.tiles[${index}]`, "Tile base/overlay semantic identity is missing or invalid.");
      });
      status.count = seen.size;
    } else {
      tiles.forEach((tile, index) => {
        if (!validTileSemantic(tile)) issue(result, "TILE_SEMANTIC_MISSING", `semantic.tiles[${index}]`, "Tile base/overlay semantic identity is missing or invalid.");
      });
    }
  }

  if (grid.valid && status.count !== status.expected) {
    issue(result, "TILES_INCOMPLETE", "semantic.tiles", "Semantic tiles must cover every logical grid cell exactly once.", {
      actual: status.count, expected: status.expected
    });
  }
  status.valid = result.issues.length === issueStart;
  return status;
}

function validTileSemantic(tile) {
  if (nonEmptyIdentity(tile)) return true;
  return isObject(tile)
    && Number.isInteger(tile.base)
    && tile.base >= 0
    && Number.isInteger(tile.overlay)
    && tile.overlay >= 0;
}

function canonicalUnits(units, result) {
  if (Array.isArray(units)) return units;
  if (!isObject(units)) return null;

  const flattened = [];
  for (const team of REQUIRED_TEAMS) {
    if (!hasOwn(units, team)) {
      issue(result, "UNIT_TEAM_FIELD_MISSING", `semantic.units.${team}`, `Team bucket ${team} must be explicitly present.`);
      continue;
    }
    if (!Array.isArray(units[team])) {
      issue(result, "UNIT_TEAM_FIELD_INVALID", `semantic.units.${team}`, `Team bucket ${team} must be an array.`);
      continue;
    }
    for (const unit of units[team]) flattened.push({ ...unit, team: unit.team ?? team });
  }
  return flattened;
}

function validateUnits(semantic, result, grid) {
  const issueStart = result.issues.length;
  const status = {
    present: hasOwn(semantic, "units"),
    valid: false,
    total: 0,
    initial: { player: 0, enemy: 0, npc: 0 },
    items: { unitFieldsComplete: false, count: 0 },
    slots: []
  };
  if (!status.present) {
    issue(result, "UNITS_MISSING", "semantic.units", "Semantic units must be explicitly present.");
    for (const team of REQUIRED_TEAMS) issue(result, "INITIAL_TEAM_FIELD_MISSING", `semantic.units.${team}`, `Initial ${team} data is missing.`);
    return status;
  }

  const units = canonicalUnits(semantic.units, result);
  if (!units) {
    issue(result, "UNITS_INVALID", "semantic.units", "Semantic units must be an array or player/enemy/npc array buckets.");
    return status;
  }

  status.total = units.length;
  let allItemFieldsPresent = true;
  const initialCoordinates = new Map();
  units.forEach((unit, index) => {
    const pathName = `semantic.units[${index}]`;
    if (!isObject(unit)) {
      issue(result, "UNIT_INVALID", pathName, "Each unit must be an object.");
      allItemFieldsPresent = false;
      return;
    }

    const team = normalizeTeam(unit.team);
    if (!team) issue(result, "UNIT_TEAM_INVALID", `${pathName}.team`, "Unit team must be player, enemy, or npc.", unit.team);
    if (typeof unit.scriptSpawn !== "boolean") issue(result, "UNIT_SCRIPT_SPAWN_INVALID", `${pathName}.scriptSpawn`, "scriptSpawn must explicitly be true or false.", unit.scriptSpawn);
    if (team === "enemy" && !nonEmptyDisplayName(unit.className)) {
      issue(result, "UNIT_CLASS_NAME_MISSING", `${pathName}.className`, "Enemy classes must include a human-readable className beside the raw class ID.");
    }

    if (!Number.isSafeInteger(unit.slot) || unit.slot < 0) {
      issue(result, "UNIT_SLOT_INVALID", `${pathName}.slot`, "Every initial unit must have a non-negative integer slot.", unit.slot);
    } else {
      if (status.slots.includes(unit.slot)) issue(result, "UNIT_SLOT_DUPLICATE", `${pathName}.slot`, "Initial unit slots must be unique.", unit.slot);
      status.slots.push(unit.slot);
    }

    let coordinate = { present: false, valid: false };
    if (team && unit.scriptSpawn === false) {
      coordinate = coordinateFor(unit.position ?? unit, result, `${pathName}.position`, grid);
      status.initial[team] += 1;
      if (coordinate.valid) {
        const key = `${coordinate.x},${coordinate.y}`;
        if (initialCoordinates.has(key)) {
          issue(result, "INITIAL_COORDINATE_DUPLICATE", `${pathName}.position`, "Two initial units occupy the same starting coordinate.", {
            coordinate: key,
            first: initialCoordinates.get(key)
          });
        } else initialCoordinates.set(key, pathName);
      }
    } else if (unit.scriptSpawn === true) {
      issue(result, "SCRIPT_UNIT_NOT_SEPARATED", pathName, "scriptSpawn=true entries belong in semantic.spawnDefinitions, not semantic.units.");
    }

    if (!hasOwn(unit, "items")) {
      allItemFieldsPresent = false;
      issue(result, "UNIT_ITEMS_MISSING", `${pathName}.items`, "Each unit must explicitly list carried items, including an empty array.");
    } else if (!Array.isArray(unit.items)) {
      allItemFieldsPresent = false;
      issue(result, "UNIT_ITEMS_INVALID", `${pathName}.items`, "Unit items must be an array.");
    } else {
      status.items.count += unit.items.length;
      unit.items.forEach((item, itemIndex) => {
        if (!nonEmptyIdentity(item)) issue(result, "ITEM_IDENTITY_MISSING", `${pathName}.items[${itemIndex}]`, "Carried item identity is missing.");
        if (!nonEmptyDisplayName(item)) issue(result, "ITEM_NAME_MISSING", `${pathName}.items[${itemIndex}].name`, "Carried items must include a human-readable name beside the raw item ID.");
      });
    }
  });

  if (status.initial.player === 0) issue(result, "INITIAL_PLAYER_MISSING", "semantic.units", "At least one initial player unit with scriptSpawn=false is required.");
  if (status.initial.enemy === 0) issue(result, "INITIAL_ENEMY_MISSING", "semantic.units", "At least one initial enemy unit with scriptSpawn=false is required.");
  status.items.unitFieldsComplete = allItemFieldsPresent;
  status.valid = result.issues.length === issueStart;
  return status;
}

function definitionIdentity(definition) {
  const slot = Number.isSafeInteger(definition?.slot) && definition.slot >= 0 ? definition.slot : null;
  const rawId = definition?.definitionId ?? definition?.id;
  const id = (typeof rawId === "string" && rawId.trim() !== "") || (Number.isSafeInteger(rawId) && rawId >= 0)
    ? String(rawId)
    : null;
  return { slot, id };
}

function validateSpawnDefinitions(semantic, result, initialUnits) {
  const issueStart = result.issues.length;
  const status = {
    present: hasOwn(semantic, "spawnDefinitions"),
    valid: false,
    count: 0,
    slots: [],
    ids: [],
    items: { fieldsComplete: false, count: 0 }
  };
  if (!status.present) {
    issue(result, "SPAWN_DEFINITIONS_MISSING", "semantic.spawnDefinitions", "Script-generated unit definitions must be explicitly present, including an empty array.");
    return status;
  }
  if (!Array.isArray(semantic.spawnDefinitions)) {
    issue(result, "SPAWN_DEFINITIONS_INVALID", "semantic.spawnDefinitions", "spawnDefinitions must be an array.");
    return status;
  }

  status.count = semantic.spawnDefinitions.length;
  let allItemFieldsPresent = true;
  const initialSlots = new Set(initialUnits.slots);
  semantic.spawnDefinitions.forEach((definition, index) => {
    const pathName = `semantic.spawnDefinitions[${index}]`;
    if (!isObject(definition)) {
      issue(result, "SPAWN_DEFINITION_INVALID", pathName, "Each spawn definition must be an object.");
      allItemFieldsPresent = false;
      return;
    }

    if (definition.scriptSpawn !== true) {
      issue(result, "SPAWN_DEFINITION_FLAG_INVALID", `${pathName}.scriptSpawn`, "Spawn definitions must explicitly use scriptSpawn=true.", definition.scriptSpawn);
    }
    const team = normalizeTeam(definition.team);
    if (!team) issue(result, "SPAWN_DEFINITION_TEAM_INVALID", `${pathName}.team`, "Spawn definition team must be player, enemy, or npc.", definition.team);
    if (!nonEmptyDisplayName(definition.className)) {
      issue(result, "SPAWN_CLASS_NAME_MISSING", `${pathName}.className`, "Spawn definitions must include a human-readable className beside the raw class ID.");
    }

    const identity = definitionIdentity(definition);
    if (identity.slot === null && identity.id === null) {
      issue(result, "SPAWN_DEFINITION_IDENTITY_MISSING", pathName, "Spawn definitions require a non-negative slot or definitionId/id.");
    }
    if (identity.slot !== null) {
      if (status.slots.includes(identity.slot)) issue(result, "SPAWN_SLOT_DUPLICATE", `${pathName}.slot`, "Spawn definition slots must be unique.", identity.slot);
      if (initialSlots.has(identity.slot)) issue(result, "SPAWN_SLOT_COLLIDES_WITH_INITIAL", `${pathName}.slot`, "A spawn definition cannot reuse an initial unit slot.", identity.slot);
      status.slots.push(identity.slot);
    }
    if (identity.id !== null) {
      if (status.ids.includes(identity.id)) issue(result, "SPAWN_DEFINITION_ID_DUPLICATE", pathName, "Spawn definition IDs must be unique.", identity.id);
      status.ids.push(identity.id);
    }

    // Coordinates in BAI script definitions are not initial positions and may
    // be placeholders. Spawn coordinates are audited on the referencing event.
    if (!hasOwn(definition, "items")) {
      allItemFieldsPresent = false;
      issue(result, "SPAWN_DEFINITION_ITEMS_MISSING", `${pathName}.items`, "Each spawn definition must explicitly list carried items, including an empty array.");
    } else if (!Array.isArray(definition.items)) {
      allItemFieldsPresent = false;
      issue(result, "SPAWN_DEFINITION_ITEMS_INVALID", `${pathName}.items`, "Spawn definition items must be an array.");
    } else {
      status.items.count += definition.items.length;
      definition.items.forEach((item, itemIndex) => {
        if (!nonEmptyIdentity(item)) issue(result, "ITEM_IDENTITY_MISSING", `${pathName}.items[${itemIndex}]`, "Carried item identity is missing.");
        if (!nonEmptyDisplayName(item)) issue(result, "ITEM_NAME_MISSING", `${pathName}.items[${itemIndex}].name`, "Carried items must include a human-readable name beside the raw item ID.");
      });
    }
  });

  status.items.fieldsComplete = allItemFieldsPresent;
  status.valid = result.issues.length === issueStart;
  return status;
}

function validateTreasures(semantic, result, grid) {
  const issueStart = result.issues.length;
  const status = { present: hasOwn(semantic, "treasures"), valid: false, count: 0 };
  if (!status.present) {
    issue(result, "TREASURES_MISSING", "semantic.treasures", "Treasures must be explicitly present, including an empty array.");
    return status;
  }
  if (!Array.isArray(semantic.treasures)) {
    issue(result, "TREASURES_INVALID", "semantic.treasures", "Treasures must be an array.");
    return status;
  }

  status.count = semantic.treasures.length;
  semantic.treasures.forEach((treasure, index) => {
    const pathName = `semantic.treasures[${index}]`;
    coordinateFor(treasure?.position ?? treasure, result, `${pathName}.position`, grid);
    const contents = treasure?.items ?? treasure?.item ?? treasure?.contents;
    const validContents = Array.isArray(contents)
      ? contents.length > 0 && contents.every(nonEmptyIdentity)
      : nonEmptyIdentity(contents);
    if (!validContents) issue(result, "TREASURE_CONTENTS_MISSING", pathName, "Treasure contents must identify at least one item or reward.");
    const namedContents = Array.isArray(contents)
      ? contents.length > 0 && contents.every(nonEmptyDisplayName)
      : nonEmptyDisplayName(contents);
    if (validContents && !namedContents) issue(result, "TREASURE_CONTENT_NAME_MISSING", pathName, "Treasure contents must include a human-readable item or reward name.");
  });
  status.valid = result.issues.length === issueStart;
  return status;
}

function meaningfulTrigger(value) {
  if (typeof value === "string") return value.trim() !== "";
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.length > 0 && value.some(meaningfulTrigger);
  if (isObject(value)) return Object.keys(value).length > 0 && Object.values(value).some((entry) => entry !== null && entry !== undefined && entry !== "");
  return false;
}

function spawnEntriesForEvent(event) {
  if (Array.isArray(event.spawns)) return event.spawns;
  if (isObject(event.spawns)) return [event.spawns];
  if (Array.isArray(event.spawn)) return event.spawn;
  if (isObject(event.spawn)) return [event.spawn];
  if (Array.isArray(event.spawnPositions)) return event.spawnPositions;
  if (Array.isArray(event.positions)) return event.positions;
  if (hasOwn(event, "x") || hasOwn(event, "y") || hasOwn(event, "col") || hasOwn(event, "row")) return [event];
  return [];
}

function addReference(target, value) {
  if (typeof value === "string" && value.trim() !== "") target.add(value);
  else if (Number.isSafeInteger(value) && value >= 0) target.add(value);
}

function spawnReferencesForEvent(event, spawnEntries) {
  const slots = new Set();
  const ids = new Set();
  const inspect = (value) => {
    if (Number.isSafeInteger(value) && value >= 0) {
      slots.add(value);
      return;
    }
    if (!isObject(value)) return;
    addReference(slots, value.spawnSlot ?? value.slot);
    addReference(ids, value.spawnDefinitionId ?? value.definitionId ?? value.definition);
  };

  inspect(event);
  spawnEntries.forEach(inspect);
  const slotValues = event.spawnSlots ?? event.slots;
  const idValues = event.spawnDefinitionIds ?? event.definitionIds;
  for (const value of Array.isArray(slotValues) ? slotValues : slotValues === undefined ? [] : [slotValues]) addReference(slots, value);
  for (const value of Array.isArray(idValues) ? idValues : idValues === undefined ? [] : [idValues]) addReference(ids, value);
  return { slots: [...slots], ids: [...ids].map(String) };
}

function validateEvents(semantic, result, grid, spawnDefinitions) {
  const issueStart = result.issues.length;
  const status = {
    present: hasOwn(semantic, "events"),
    valid: false,
    count: 0,
    reinforcement: { count: 0, coordinates: 0 },
    ambush: { count: 0, coordinates: 0 }
  };
  if (!status.present) {
    issue(result, "EVENTS_MISSING", "semantic.events", "Events must be explicitly present, including an empty array.");
    return status;
  }
  if (!Array.isArray(semantic.events)) {
    issue(result, "EVENTS_INVALID", "semantic.events", "Events must be an array.");
    return status;
  }

  status.count = semantic.events.length;
  semantic.events.forEach((event, index) => {
    const pathName = `semantic.events[${index}]`;
    if (!isObject(event) || typeof event.type !== "string" || event.type.trim() === "") {
      issue(result, "EVENT_TYPE_MISSING", `${pathName}.type`, "Every event must have a non-empty type.");
      return;
    }
    const type = event.type.toLowerCase();

    if (KNOWN_EVENT_TYPES.has(type)) {
      const spawnEntries = spawnEntriesForEvent(event);
      const references = spawnReferencesForEvent(event, spawnEntries);
      const knownSlots = new Set(spawnDefinitions.slots);
      const knownIds = new Set(spawnDefinitions.ids);
      status[type].count += 1;
      status[type].coordinates += spawnEntries.length;

      if (references.slots.length === 0 && references.ids.length === 0) {
        issue(result, "SPAWN_REFERENCE_MISSING", pathName, `${type} events must reference at least one spawn slot or definition.`);
      }
      references.slots.forEach((slot) => {
        if (!knownSlots.has(slot)) issue(result, "SPAWN_REFERENCE_UNKNOWN", pathName, `${type} event references an unknown spawn slot.`, { slot });
      });
      references.ids.forEach((id) => {
        if (!knownIds.has(id)) issue(result, "SPAWN_REFERENCE_UNKNOWN", pathName, `${type} event references an unknown spawn definition.`, { definitionId: id });
      });

      if (spawnEntries.length === 0) {
        issue(result, "SPAWN_COORDINATES_MISSING", pathName, `${type} events must include at least one event-time spawn coordinate.`);
      } else {
        spawnEntries.forEach((spawn, spawnIndex) => {
          const position = isObject(spawn) ? spawn.position ?? spawn : spawn;
          coordinateFor(position, result, `${pathName}.spawns[${spawnIndex}].position`, grid);
        });
      }

      let trigger = event.trigger ?? event.condition;
      if (!meaningfulTrigger(trigger) && hasOwn(event, "triggerCondition")) {
        trigger = event.triggerCondition;
        schemaMismatch(result, `${pathName}.triggerCondition`, "Use semantic trigger or condition data instead of legacy triggerCondition.");
      }
      if (!meaningfulTrigger(trigger)) issue(result, "EVENT_TRIGGER_MISSING", pathName, `${type} events must include a non-empty trigger or condition.`);
    }
  });
  status.valid = result.issues.length === issueStart;
  return status;
}

function completenessValue(completeness, field) {
  if (!isObject(completeness)) return undefined;
  if (typeof completeness[field] === "boolean") return completeness[field];
  if (isObject(completeness[field]) && typeof completeness[field].complete === "boolean") return completeness[field].complete;
  if (field === "items" && isObject(completeness.units) && typeof completeness.units.items === "boolean") return completeness.units.items;
  return undefined;
}

function validateCompleteness(semantic, result) {
  const status = { present: hasOwn(semantic, "completeness"), fields: {} };
  if (!status.present || !isObject(semantic.completeness)) {
    issue(result, "COMPLETENESS_MISSING", "semantic.completeness", "Completeness metadata must be explicitly present.");
    for (const field of REQUIRED_COMPLETENESS) status.fields[field] = false;
    return status;
  }

  for (const field of REQUIRED_COMPLETENESS) {
    const value = completenessValue(semantic.completeness, field);
    status.fields[field] = value === true;
    if (value !== true) {
      issue(result, "COMPLETENESS_NOT_PROVEN", `semantic.completeness.${field}`, `Completeness for ${field} must be explicitly true.`, value);
    }
  }
  return status;
}

function auditBattle(battle, record) {
  const result = {
    ...battle,
    recordPresent: Boolean(record),
    semanticPresent: Boolean(record && isObject(record.semantic)),
    schemaMismatch: false,
    grid: null,
    tiles: null,
    units: null,
    spawnDefinitions: null,
    treasures: null,
    events: null,
    completeness: null,
    issues: []
  };

  if (!record) {
    issue(result, "MAP_RECORD_MISSING", `records.${battle.id}`, "Battle has no map record.");
    result.grid = { present: false, valid: false, source: null, cols: null, rows: null, boundsValid: false };
    const emptySemantic = {};
    issue(result, "SEMANTIC_MISSING", "semantic", "record.semantic is missing because the map record is absent.");
    result.tiles = validateTiles(emptySemantic, result, result.grid);
    result.units = validateUnits(emptySemantic, result, result.grid);
    result.spawnDefinitions = validateSpawnDefinitions(emptySemantic, result, result.units);
    result.treasures = validateTreasures(emptySemantic, result, result.grid);
    result.events = validateEvents(emptySemantic, result, result.grid, result.spawnDefinitions);
    result.completeness = validateCompleteness(emptySemantic, result);
  } else {
    result.grid = resolveGrid(record, result);
    const { semantic, canonical } = resolveSemantic(record, result);
    if (canonical && semantic.version !== 1) {
      issue(result, "SEMANTIC_VERSION_INVALID", "semantic.version", "Semantic map version must be exactly 1.", semantic.version);
    }
    result.tiles = validateTiles(semantic, result, result.grid);
    result.units = validateUnits(semantic, result, result.grid);
    result.spawnDefinitions = validateSpawnDefinitions(semantic, result, result.units);
    result.treasures = validateTreasures(semantic, result, result.grid);
    result.events = validateEvents(semantic, result, result.grid, result.spawnDefinitions);
    result.completeness = validateCompleteness(semantic, result);
  }

  result.ok = result.issues.length === 0;
  return result;
}

function buildReport(data, mapData, mapDetails) {
  const battles = battleInventory(data);
  const legacyRecords = isObject(mapData?.records) ? mapData.records : {};
  const detailRecords = isObject(mapDetails?.records) ? mapDetails.records : {};
  const allRecordIds = [...new Set([...Object.keys(legacyRecords), ...Object.keys(detailRecords)])];
  const topLevelIssues = [];
  const ids = battles.map((battle) => battle.id);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);

  if (mapDetails?.schemaVersion !== 1) {
    topLevelIssues.push({
      code: "DETAILS_SCHEMA_VERSION_INVALID",
      path: "FE3H_MAP_DETAILS.schemaVersion",
      message: "Map-details container schemaVersion must be exactly 1.",
      details: mapDetails?.schemaVersion
    });
  }
  if (mapDetails?.coordinateSystem?.origin !== "top-left" || mapDetails?.coordinateSystem?.indexBase !== 0) {
    topLevelIssues.push({
      code: "COORDINATE_SYSTEM_INVALID",
      path: "FE3H_MAP_DETAILS.coordinateSystem",
      message: "Map-details coordinates must use a top-left, zero-based origin.",
      details: mapDetails?.coordinateSystem
    });
  }

  if (battles.length !== EXPECTED_BATTLE_COUNT) {
    topLevelIssues.push({
      code: "BATTLE_COUNT_MISMATCH",
      path: "battleInventory",
      message: `Expected ${EXPECTED_BATTLE_COUNT} battles, found ${battles.length}.`,
      details: { expected: EXPECTED_BATTLE_COUNT, actual: battles.length }
    });
  }
  if (duplicateIds.length > 0) {
    topLevelIssues.push({
      code: "BATTLE_ID_DUPLICATE",
      path: "battleInventory",
      message: "Battle IDs must be globally unique.",
      details: [...new Set(duplicateIds)]
    });
  }

  const battleResults = battles.flatMap((battle) => {
    const legacy = isObject(legacyRecords[battle.id]) ? legacyRecords[battle.id] : null;
    const detail = isObject(detailRecords[battle.id]) ? detailRecords[battle.id] : null;
    const routes = battle.routes.length > 0 ? battle.routes : [null];

    return routes.map((route) => {
      let record = legacy;
      if (detail) {
        const semantic = isObject(detail.variants)
          ? detail.variants[route]
          : isObject(detail.semantic)
            ? detail.semantic
            : detail;
        record = semantic
          ? { ...(legacy || {}), semantic, semanticSource: "FE3H_MAP_DETAILS" }
          : legacy;
      }

      const result = auditBattle({
        ...battle,
        route,
        variantId: route ? `${battle.id}@${route}` : battle.id
      }, record);
      if (detail && isObject(detail.variants) && !isObject(detail.variants[route])) {
        issue(result, "ROUTE_VARIANT_MISSING", `records.${battle.id}.variants.${route}`, "Required route-specific semantic map variant is missing.");
        result.ok = false;
      }
      return result;
    });
  });
  const expectedIdSet = new Set(ids);
  const extraRecordIds = allRecordIds.filter((id) => !expectedIdSet.has(id)).sort();
  if (extraRecordIds.length > 0) {
    topLevelIssues.push({
      code: "MAP_RECORD_UNEXPECTED",
      path: "mapData.records",
      message: "Map records contain IDs outside the authoritative 74-battle inventory.",
      details: extraRecordIds
    });
  }

  const allIssues = [...topLevelIssues, ...battleResults.flatMap((battle) => battle.issues)];
  const issueCounts = {};
  for (const entry of allIssues) issueCounts[entry.code] = (issueCounts[entry.code] || 0) + 1;

  const sum = (selector) => battleResults.reduce((total, battle) => total + selector(battle), 0);
  const summary = {
    expectedBattles: EXPECTED_BATTLE_COUNT,
    discoveredBattles: battles.length,
    monthlyBattles: battles.filter((battle) => battle.kind === "monthly").length,
    paralogues: battles.filter((battle) => battle.kind === "paralogue").length,
    mapRecords: allRecordIds.length,
    auditedVariants: battleResults.length,
    passingBattles: battleResults.filter((battle) => battle.ok).length,
    failingBattles: battleResults.filter((battle) => !battle.ok).length,
    grids: {
      present: battleResults.filter((battle) => battle.grid.present).length,
      missing: battleResults.filter((battle) => !battle.grid.present).length,
      canonical: battleResults.filter((battle) => battle.grid.source === "semantic.grid").length,
      valid: battleResults.filter((battle) => battle.grid.valid && battle.grid.boundsValid).length
    },
    semanticRecords: battleResults.filter((battle) => battle.semanticPresent).length,
    tiles: {
      fieldsPresent: battleResults.filter((battle) => battle.tiles.present).length,
      completeBattles: battleResults.filter((battle) => battle.tiles.valid && battle.completeness.fields.terrain).length,
      cells: sum((battle) => battle.tiles.count)
    },
    initialUnits: {
      fieldsPresent: battleResults.filter((battle) => battle.units.present).length,
      player: sum((battle) => battle.units.initial.player),
      enemy: sum((battle) => battle.units.initial.enemy),
      npc: sum((battle) => battle.units.initial.npc),
      battlesWithPlayer: battleResults.filter((battle) => battle.units.initial.player > 0).length,
      battlesWithEnemy: battleResults.filter((battle) => battle.units.initial.enemy > 0).length,
      battlesWithNpc: battleResults.filter((battle) => battle.units.initial.npc > 0).length
    },
    spawnDefinitions: {
      fieldsPresent: battleResults.filter((battle) => battle.spawnDefinitions.present).length,
      definitions: sum((battle) => battle.spawnDefinitions.count),
      completeBattles: battleResults.filter((battle) => battle.spawnDefinitions.valid && battle.completeness.fields.spawnDefinitions).length
    },
    items: {
      carriedItems: sum((battle) => battle.units.items.count + battle.spawnDefinitions.items.count),
      unitFieldsCompleteBattles: battleResults.filter((battle) => battle.units.items.unitFieldsComplete).length,
      spawnDefinitionFieldsCompleteBattles: battleResults.filter((battle) => battle.spawnDefinitions.items.fieldsComplete).length,
      completenessProvenBattles: battleResults.filter((battle) => battle.completeness.fields.items).length
    },
    treasures: {
      fieldsPresent: battleResults.filter((battle) => battle.treasures.present).length,
      entries: sum((battle) => battle.treasures.count),
      completeBattles: battleResults.filter((battle) => battle.treasures.valid && battle.completeness.fields.treasures).length
    },
    events: {
      fieldsPresent: battleResults.filter((battle) => battle.events.present).length,
      entries: sum((battle) => battle.events.count),
      completeBattles: battleResults.filter((battle) => battle.events.valid && battle.completeness.fields.events).length,
      reinforcement: {
        events: sum((battle) => battle.events.reinforcement.count),
        coordinates: sum((battle) => battle.events.reinforcement.coordinates),
        battles: battleResults.filter((battle) => battle.events.reinforcement.count > 0).length
      },
      ambush: {
        events: sum((battle) => battle.events.ambush.count),
        coordinates: sum((battle) => battle.events.ambush.coordinates),
        battles: battleResults.filter((battle) => battle.events.ambush.count > 0).length
      }
    },
    schemaMismatchBattles: battleResults.filter((battle) => battle.schemaMismatch).length,
    issueCount: allIssues.length,
    issueCounts
  };

  return {
    schemaVersion: 1,
    ok: topLevelIssues.length === 0 && battleResults.every((battle) => battle.ok),
    summary,
    topLevelIssues,
    battles: battleResults
  };
}

function humanReport(report) {
  const { summary } = report;
  const lines = [
    `FE3H map fidelity audit: ${report.ok ? "PASS" : "FAIL"}`,
    `Battles: ${summary.discoveredBattles}/${summary.expectedBattles} (${summary.monthlyBattles} monthly + ${summary.paralogues} paralogues); records: ${summary.mapRecords}; audited route variants: ${summary.auditedVariants}`,
    `Logical grids: ${summary.grids.present}/${summary.auditedVariants} present, ${summary.grids.canonical} canonical, ${summary.grids.valid} valid with bounds`,
    `Semantic records: ${summary.semanticRecords}/${summary.auditedVariants}; schema mismatches: ${summary.schemaMismatchBattles}`,
    `Tiles: ${summary.tiles.fieldsPresent} fields, ${summary.tiles.completeBattles} complete battles, ${summary.tiles.cells} audited cells`,
    `Initial units: player ${summary.initialUnits.player} across ${summary.initialUnits.battlesWithPlayer} battles; enemy ${summary.initialUnits.enemy} across ${summary.initialUnits.battlesWithEnemy}; npc ${summary.initialUnits.npc} across ${summary.initialUnits.battlesWithNpc}`,
    `Spawn definitions: ${summary.spawnDefinitions.definitions} definitions in ${summary.spawnDefinitions.fieldsPresent} battle fields; ${summary.spawnDefinitions.completeBattles} complete battles`,
    `Items: ${summary.items.carriedItems} carried; initial-unit item arrays complete in ${summary.items.unitFieldsCompleteBattles} battles; spawn-definition item arrays complete in ${summary.items.spawnDefinitionFieldsCompleteBattles}; completeness proven in ${summary.items.completenessProvenBattles}`,
    `Treasures: ${summary.treasures.entries} entries in ${summary.treasures.fieldsPresent} battle fields; ${summary.treasures.completeBattles} complete battles`,
    `Events: ${summary.events.entries} entries in ${summary.events.fieldsPresent} battle fields; reinforcement ${summary.events.reinforcement.events} events/${summary.events.reinforcement.coordinates} coordinates; ambush ${summary.events.ambush.events} events/${summary.events.ambush.coordinates} coordinates`,
    `Result: ${summary.passingBattles} passing, ${summary.failingBattles} failing, ${summary.issueCount} issues`
  ];

  if (report.topLevelIssues.length > 0) {
    lines.push("", "Inventory issues:");
    for (const entry of report.topLevelIssues) lines.push(`  - ${entry.code}: ${entry.message}`);
  }

  lines.push("", "Per-battle audit:");
  for (const battle of report.battles) {
    const grid = battle.grid.present ? `${battle.grid.cols}x${battle.grid.rows} (${battle.grid.source})` : "missing";
    const codes = [...new Set(battle.issues.map((entry) => entry.code))];
    lines.push(
      `  [${battle.ok ? "PASS" : "FAIL"}] ${battle.variantId} | grid=${grid} | semantic=${battle.semanticPresent ? "yes" : "no"} | tiles=${battle.tiles.count}/${battle.tiles.expected ?? "?"} | initial=${battle.units.initial.player}/${battle.units.initial.enemy}/${battle.units.initial.npc} | spawns=${battle.spawnDefinitions.count} | items=${battle.units.items.count + battle.spawnDefinitions.items.count} | treasures=${battle.treasures.count} | reinforcement=${battle.events.reinforcement.count} | ambush=${battle.events.ambush.count}${codes.length ? ` | ${codes.join(",")}` : ""}`
    );
  }

  if (Object.keys(summary.issueCounts).length > 0) {
    lines.push("", "Issue counts:");
    for (const [code, count] of Object.entries(summary.issueCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) {
      lines.push(`  ${code}: ${count}`);
    }
  }

  return lines.join("\n");
}

function main() {
  let options;
  try {
    options = parseArguments(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    console.error(usage());
    process.exitCode = 2;
    return;
  }

  if (options.help) {
    console.log(usage());
    return;
  }

  const { data, mapData, mapDetails } = loadData();
  const report = buildReport(data, mapData, mapDetails);
  if (options.format === "human" || options.format === "both") console.log(humanReport(report));
  if (options.format === "both") console.log("\nMachine-readable JSON:\n");
  if (options.format === "json" || options.format === "both") console.log(JSON.stringify(report, null, 2));
  if (options.strict && !report.ok) process.exitCode = 1;
}

if (require.main === module) main();

module.exports = { battleInventory, auditBattle, buildReport, humanReport, loadData };
