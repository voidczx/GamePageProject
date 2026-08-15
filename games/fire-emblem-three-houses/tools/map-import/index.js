"use strict";

const { BSI_HEADER_BYTES, parseBsi, semanticEventsFromBsi } = require("./bsi");
const CATALOGS = require("./catalogs");

const TERRAIN_COLS = 32;
const TERRAIN_ROWS = 32;
const TERRAIN_HEADER_BYTES = 8;
const TERRAIN_TILE_BYTES = 2;
const TERRAIN_BYTE_LENGTH = TERRAIN_HEADER_BYTES + TERRAIN_COLS * TERRAIN_ROWS * TERRAIN_TILE_BYTES;

const BAI_HEADER_BYTES = 0x18;
const BAI_ROUTE_COUNT = 3;
const BAI_UNIT_BYTES = 0x2c;
const BAI_UNITS_PER_ROUTE = 100;
const TERRAIN_CHEST_ID = 46;

function asBuffer(value, label) {
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) {
    return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  }
  if (value instanceof ArrayBuffer) return Buffer.from(value);
  throw new TypeError(`${label} must be a Buffer, Uint8Array, or ArrayBuffer`);
}

function assertIntegerInRange(value, min, max, label) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`${label} must be an integer from ${min} to ${max}`);
  }
}

function computeTerrainBounds(tiles) {
  let minX = TERRAIN_COLS;
  let minY = TERRAIN_ROWS;
  let maxX = -1;
  let maxY = -1;

  for (const tile of tiles) {
    if (tile.base === 0 && tile.overlay === 0) continue;
    minX = Math.min(minX, tile.x);
    minY = Math.min(minY, tile.y);
    maxX = Math.max(maxX, tile.x);
    maxY = Math.max(maxY, tile.y);
  }

  if (maxX < 0) {
    return {
      bounds: { x: 0, y: 0, width: TERRAIN_COLS, height: TERRAIN_ROWS },
      reliable: false
    };
  }

  return {
    bounds: {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1
    },
    reliable: true
  };
}

function parseTerrain(input) {
  const buffer = asBuffer(input, "terrain input");
  if (buffer.length !== TERRAIN_BYTE_LENGTH) {
    throw new RangeError(`terrain input must be exactly ${TERRAIN_BYTE_LENGTH} bytes; received ${buffer.length}`);
  }

  const tiles = [];
  let offset = TERRAIN_HEADER_BYTES;
  for (let y = 0; y < TERRAIN_ROWS; y += 1) {
    for (let x = 0; x < TERRAIN_COLS; x += 1) {
      tiles.push({ x, y, base: buffer[offset], overlay: buffer[offset + 1] });
      offset += TERRAIN_TILE_BYTES;
    }
  }

  const { bounds, reliable } = computeTerrainBounds(tiles);
  return {
    header: Array.from(buffer.subarray(0, TERRAIN_HEADER_BYTES)),
    grid: { cols: TERRAIN_COLS, rows: TERRAIN_ROWS, bounds },
    tiles,
    boundsReliable: reliable
  };
}

function isZeroFilled(buffer, start, length) {
  for (let index = start; index < start + length; index += 1) {
    if (buffer[index] !== 0) return false;
  }
  return true;
}

function decodePlusOne(value) {
  return value === 0 ? null : value - 1;
}

function catalogName(catalog, id) {
  return id === null || id === undefined ? null : CATALOGS[catalog][id] || null;
}

function decodeTeam(value, slot) {
  if (value === 0) return "player";
  if (value === 1 || value === 3) return "enemy";
  if (value === 2) return "ally";
  throw new RangeError(`BAI slot ${slot} uses unsupported team value ${value}`);
}

function decodeItems(buffer, entryOffset, itemFlags) {
  const items = [];
  for (let itemSlot = 0; itemSlot < 6; itemSlot += 1) {
    const encodedId = buffer.readUInt16LE(entryOffset + 6 + itemSlot * 2);
    if (encodedId === 0) continue;
    const slotFlags = (itemFlags >>> (itemSlot * 2)) & 0x3;
    const id = encodedId - 1;
    items.push({ id, name: catalogName("items", id), droppable: (slotFlags & 0x2) !== 0 });
  }
  return items;
}

function decodeSkills(buffer, entryOffset) {
  const skills = [];
  for (let skillSlot = 0; skillSlot < 5; skillSlot += 1) {
    const encodedId = buffer[entryOffset + 20 + skillSlot];
    if (encodedId !== 0) skills.push(encodedId - 1);
  }
  return skills;
}

function decodeSpells(buffer, entryOffset) {
  const spells = [];
  for (let spellSlot = 0; spellSlot < 2; spellSlot += 1) {
    const id = decodePlusOne(buffer[entryOffset + 36 + spellSlot]);
    if (id !== null) spells.push({ id, name: catalogName("spells", id) });
  }
  return spells;
}

function parseBai(input, options = {}) {
  const buffer = asBuffer(input, "BAI input");
  const route = options.route;
  assertIntegerInRange(route, 0, BAI_ROUTE_COUNT - 1, "BAI route");

  if (buffer.length < BAI_HEADER_BYTES) {
    throw new RangeError(`BAI input must contain the ${BAI_HEADER_BYTES}-byte header`);
  }

  const routeOffsets = [];
  for (let index = 0; index < BAI_ROUTE_COUNT; index += 1) {
    routeOffsets.push(BAI_HEADER_BYTES + buffer.readUInt32LE(0x0c + index * 4));
  }

  const routeOffset = routeOffsets[route];
  const routeEnd = routeOffset + BAI_UNIT_BYTES * BAI_UNITS_PER_ROUTE;
  if (routeOffset < BAI_HEADER_BYTES || routeEnd > buffer.length) {
    throw new RangeError(
      `BAI route ${route} requires bytes ${routeOffset}..${routeEnd - 1}; file length is ${buffer.length}`
    );
  }

  const units = [];
  for (let slot = 0; slot < BAI_UNITS_PER_ROUTE; slot += 1) {
    const entryOffset = routeOffset + slot * BAI_UNIT_BYTES;
    if (isZeroFilled(buffer, entryOffset, BAI_UNIT_BYTES)) continue;

    const itemFlags = buffer.readUInt16LE(entryOffset + 18);
    const characterId = decodePlusOne(buffer.readUInt16LE(entryOffset));
    const classId = decodePlusOne(buffer.readUInt16LE(entryOffset + 4));
    const skills = decodeSkills(buffer, entryOffset);
    const battalionId = decodePlusOne(buffer[entryOffset + 34]);
    const combatArtRaw = buffer[entryOffset + 38];
    const combatArtId = combatArtRaw === 0 || combatArtRaw === 255 ? null : combatArtRaw - 1;
    const rotationId = buffer[entryOffset + 27];
    const movementId = buffer[entryOffset + 31];
    const genderId = buffer[entryOffset + 39];
    const commanderStatusId = buffer[entryOffset + 33];
    units.push({
      slot,
      x: buffer[entryOffset + 25],
      y: buffer[entryOffset + 26],
      team: decodeTeam(buffer[entryOffset + 29], slot),
      characterId,
      characterName: catalogName("characters", characterId),
      classId,
      className: catalogName("classes", classId),
      level: buffer.readInt8(entryOffset + 28),
      items: decodeItems(buffer, entryOffset, itemFlags),
      skills,
      skillNames: skills.map((id) => catalogName("skills", id)),
      spells: decodeSpells(buffer, entryOffset),
      combatArt: combatArtId === null ? null : { id: combatArtId, name: catalogName("combatArts", combatArtId) },
      rotation: { id: rotationId, name: catalogName("rotations", rotationId) },
      movement: { id: movementId, name: catalogName("movement", movementId), canMove: movementId === 2 },
      gender: { id: genderId, name: catalogName("genders", genderId) },
      battalion: {
        enabled: buffer[entryOffset + 32] === 1,
        id: battalionId,
        name: catalogName("battalions", battalionId),
        level: buffer[entryOffset + 35]
      },
      scriptSpawn: buffer[entryOffset + 30] !== 0,
      scriptSpawnRaw: buffer[entryOffset + 30],
      commander: commanderStatusId === 0,
      commanderStatus: { id: commanderStatusId, name: catalogName("commanderStatuses", commanderStatusId) },
      unknown: buffer.readUInt16LE(entryOffset + 2),
      padding: buffer.readUInt32LE(entryOffset + 40)
    });
  }

  return { route, routeOffsets, units };
}

function buildSemanticMap({ terrain, bai, bsi, bsiData, route, includeRawBsi = true }) {
  const terrainData = parseTerrain(terrain);
  const baiData = parseBai(bai, { route });
  const parsedBsi = bsiData || (bsi ? parseBsi(bsi) : null);
  const units = [];
  const spawnDefinitions = [];
  for (const unit of baiData.units) {
    if (unit.scriptSpawn) spawnDefinitions.push(unit);
    else units.push(unit);
  }
  const treasures = terrainData.tiles
    .filter((tile) => tile.base === TERRAIN_CHEST_ID || tile.overlay === TERRAIN_CHEST_ID)
    .map((tile, index) => ({ x: tile.x, y: tile.y, kind: "chest", label: `宝箱 ${index + 1}`, items: [] }));

  return {
    version: 1,
    grid: terrainData.grid,
    tiles: terrainData.tiles,
    units,
    spawnDefinitions,
    treasures,
    events: semanticEventsFromBsi(parsedBsi, baiData.units, terrainData.grid),
    ...(includeRawBsi ? { rawBsi: parsedBsi } : {}),
    completeness: {
      terrain: true,
      units: true,
      spawnDefinitions: true,
      items: true,
      treasures: false,
      treasurePositions: true,
      events: false,
      eventCandidates: parsedBsi ? parsedBsi.audit.sectionsComplete : false,
      bounds: terrainData.boundsReliable
    }
  };
}

module.exports = {
  TERRAIN_COLS,
  TERRAIN_ROWS,
  TERRAIN_BYTE_LENGTH,
  BAI_HEADER_BYTES,
  BAI_ROUTE_COUNT,
  BAI_UNIT_BYTES,
  BAI_UNITS_PER_ROUTE,
  BSI_HEADER_BYTES,
  TERRAIN_CHEST_ID,
  parseTerrain,
  parseBai,
  parseBsi,
  buildSemanticMap
};
