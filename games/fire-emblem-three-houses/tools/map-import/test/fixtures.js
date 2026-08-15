"use strict";

const {
  TERRAIN_BYTE_LENGTH,
  BAI_UNIT_BYTES,
  BAI_UNITS_PER_ROUTE
} = require("..");

const BAI_HEADER_BYTES = 0x18;
const ROUTE_BYTES = BAI_UNIT_BYTES * BAI_UNITS_PER_ROUTE;

function setTerrainTile(buffer, x, y, base, overlay = 0) {
  const offset = 8 + (y * 32 + x) * 2;
  buffer[offset] = base;
  buffer[offset + 1] = overlay;
}

function createTerrainFixture() {
  const buffer = Buffer.alloc(TERRAIN_BYTE_LENGTH);
  for (let index = 0; index < 8; index += 1) buffer[index] = index + 1;
  setTerrainTile(buffer, 3, 2, 46, 17);
  setTerrainTile(buffer, 5, 4, 1, 0);
  return buffer;
}

function writeUnit(buffer, route, slot, unit) {
  const entryOffset = BAI_HEADER_BYTES + route * ROUTE_BYTES + slot * BAI_UNIT_BYTES;
  if (unit.characterId !== null && unit.characterId !== undefined) {
    buffer.writeUInt16LE(unit.characterId + 1, entryOffset);
  }
  if (unit.classId !== null && unit.classId !== undefined) {
    buffer.writeUInt16LE(unit.classId + 1, entryOffset + 4);
  }

  let itemFlags = 0;
  for (const [itemSlot, item] of (unit.items || []).entries()) {
    if (!item) continue;
    buffer.writeUInt16LE(item.id + 1, entryOffset + 6 + itemSlot * 2);
    if (item.droppable) itemFlags |= 0x2 << (itemSlot * 2);
  }
  buffer.writeUInt16LE(itemFlags, entryOffset + 18);

  for (const [skillSlot, skillId] of (unit.skills || []).entries()) {
    buffer[entryOffset + 20 + skillSlot] = skillId + 1;
  }
  buffer[entryOffset + 25] = unit.x;
  buffer[entryOffset + 26] = unit.y;
  buffer[entryOffset + 27] = unit.rotation ?? 0;
  buffer.writeInt8(unit.level ?? 0, entryOffset + 28);
  buffer[entryOffset + 29] = unit.team;
  buffer[entryOffset + 30] = unit.scriptSpawn ? 1 : 0;
  buffer[entryOffset + 31] = unit.movement ?? 0;
  buffer[entryOffset + 32] = unit.battalion?.enabled ? 1 : 0;
  buffer[entryOffset + 33] = unit.commander ? 0 : (unit.commanderStatus ?? 3);
  if (unit.battalion?.id !== null && unit.battalion?.id !== undefined) buffer[entryOffset + 34] = unit.battalion.id + 1;
  buffer[entryOffset + 35] = unit.battalion?.level ?? 0;
  for (const [spellSlot, spellId] of (unit.spells || []).entries()) buffer[entryOffset + 36 + spellSlot] = spellId + 1;
  if (unit.combatArtId !== null && unit.combatArtId !== undefined) buffer[entryOffset + 38] = unit.combatArtId + 1;
  buffer[entryOffset + 39] = unit.gender ?? 0;
}

function createBaiFixture() {
  const buffer = Buffer.alloc(BAI_HEADER_BYTES + ROUTE_BYTES * 3);
  for (let route = 0; route < 3; route += 1) {
    buffer.writeUInt32LE(route * ROUTE_BYTES, 0x0c + route * 4);
  }

  writeUnit(buffer, 0, 0, {
    characterId: 10,
    classId: 4,
    items: [
      { id: 17, droppable: true },
      null,
      { id: 601, droppable: true }
    ],
    skills: [1, 5],
    x: 255,
    y: 254,
    team: 1,
    rotation: 6,
    level: 31,
    movement: 3,
    battalion: { enabled: true, id: 10, level: 3 },
    spells: [0, 4],
    combatArtId: 1,
    gender: 2,
    scriptSpawn: true,
    commander: true
  });
  writeUnit(buffer, 0, 5, {
    characterId: null,
    classId: null,
    items: [],
    skills: [],
    x: 1,
    y: 2,
    team: 0,
    scriptSpawn: false,
    commander: false,
    commanderStatus: 1
  });
  writeUnit(buffer, 1, 2, {
    characterId: 20,
    classId: 8,
    items: [{ id: 2, droppable: false }],
    skills: [3],
    x: 12,
    y: 13,
    team: 3,
    scriptSpawn: false,
    commander: false
  });
  return buffer;
}

function createBsiFixture() {
  const buffer = Buffer.alloc(0x10c);
  buffer.writeUInt32LE(0x42534900, 0x00);
  buffer.writeUInt32LE(1, 0x08);
  buffer.writeUInt32LE(0x38, 0x20);
  for (const offset of [0x24, 0x28, 0x2c, 0x30, 0x34]) buffer.writeUInt32LE(buffer.length, offset);
  buffer.writeUInt32LE(0x40, 0x38);

  buffer.writeUInt32LE(7, 0x40);
  buffer.writeUInt32LE(2000, 0x48);
  buffer.writeUInt32LE(0x70, 0x58);
  buffer.writeUInt32LE(0xb8, 0x5c);
  buffer.writeUInt32LE(4, 0x60);
  buffer.writeUInt32LE(0xc8, 0x64);
  buffer.writeUInt32LE(buffer.length, 0x6c);

  const conditionWords = [
    140, 0, 2, 2,
    220, 0, 3, 0, 0, 0,
    320, 0, 0, 1, 2, 4, 5, 0
  ];
  conditionWords.forEach((value, index) => buffer.writeUInt32LE(value, 0x70 + index * 4));
  [15000, 0, 0, 0].forEach((value, index) => buffer.writeUInt32LE(value, 0xb8 + index * 4));

  const actionWords = [
    600, 0, 19, 0, 0,
    620, 0, 8, 9, 0, 0,
    830, 0, 42,
    720, 1001, 2
  ];
  actionWords.forEach((value, index) => buffer.writeUInt32LE(value, 0xc8 + index * 4));
  return buffer;
}

module.exports = { createTerrainFixture, createBaiFixture, createBsiFixture };
