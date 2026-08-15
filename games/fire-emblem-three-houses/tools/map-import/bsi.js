"use strict";

const BSI_HEADER_BYTES = 0x38;
const BSI_EVENT_HEADER_BYTES = 0x30;

// Argument counts are u32 counts after the opcode. This table is limited to
// battle-script commands. Unknown commands are never scanned past: the
// undecoded remainder is preserved verbatim so later evidence cannot be lost.
const ACTION_ARGUMENT_COUNTS = Object.freeze({
  0: 1, 15: 5, 20: 2, 30: 1, 40: 2, 50: 2, 60: 2, 70: 2, 80: 1, 90: 1,
  130: 7, 140: 10, 150: 9, 160: 5, 170: 6, 220: 2, 240: 2, 250: 2, 270: 1,
  320: 1, 330: 4, 340: 5, 370: 7, 380: 7, 400: 7, 430: 2, 440: 2, 450: 4,
  460: 3, 470: 8, 530: 2, 540: 3, 550: 1, 560: 1, 570: 2, 580: 7, 590: 4,
  600: 4, 610: 3, 620: 5, 630: 2, 640: 1, 650: 0, 660: 3, 670: 2, 680: 2,
  690: 7, 700: 1, 710: 2, 720: 2, 730: 1, 740: 2, 750: 1, 760: 2, 770: 1,
  780: 1, 790: 2, 800: 0, 810: 3, 820: 7, 830: 2, 840: 6, 850: 3, 860: 1,
  2870: 3, 10000: 9
});

const CONDITION_ARGUMENT_COUNTS = Object.freeze({
  0: 3, 10: 4, 15: 5, 20: 3, 30: 1, 40: 4, 50: 4, 60: 3, 70: 4, 80: 3,
  90: 4, 100: 4, 110: 7, 120: 5, 130: 3, 140: 3, 170: 1, 180: 1, 190: 1,
  200: 2, 220: 5, 230: 3, 240: 5, 250: 2, 280: 5, 300: 5, 310: 4, 320: 7,
  330: 7, 340: 3, 350: 5, 360: 2, 370: 2, 380: 3, 390: 4, 400: 2, 410: 2,
  420: 7, 430: 2, 440: 1, 450: 5, 470: 5, 480: 1, 490: 4, 500: 3, 510: 2,
  520: 3, 530: 2, 540: 1, 550: 2, 560: 1, 570: 2, 580: 1, 590: 3,
  1000: 3, 1010: 3, 1020: 3, 1030: 3, 1060: 6, 1080: 3, 1110: 2, 1120: 4,
  1130: 4, 1150: 7, 1160: 2, 1170: 2, 1180: 3, 1190: 4, 1210: 3, 1220: 3,
  1230: 2, 1240: 3, 1250: 4, 1270: 3, 1280: 2, 1310: 2, 1320: 2, 1330: 3,
  1340: 3, 1350: 2, 1360: 3, 99998: 3, 99999: 3
});

const ACTION_NAMES = Object.freeze({
  130: "spawn-unit-130",
  240: "grant-item",
  600: "spawn-unit",
  620: "spawn-spooky",
  720: "grant-item-quantity",
  830: "grant-droppable-item"
});

const CONDITION_NAMES = Object.freeze({
  0: "other-script-ran",
  30: "start-map",
  80: "death-status",
  100: "unit-on-tile",
  110: "specific-unit-in-rectangle",
  140: "difficulty",
  170: "start-battle",
  180: "start-player-phase",
  190: "start-enemy-phase",
  220: "turn-number",
  310: "team-on-tile",
  320: "any-unit-in-rectangle",
  340: "route",
  400: "start-team-phase",
  410: "start-team-phase-2",
  420: "character-in-rectangle",
  99998: "and",
  99999: "or"
});

const DIFFICULTIES = ["NORMAL", "HARD", "MADDENING"];
const ROUTES = ["SS", "AM", "VW", "CF", "CS"];
const TEAMS = ["player", "enemy", "ally", "enemy-yellow", "unknown-4"];
const COMPARISONS = ["LT", "LTE", "EQ", "GTE", "GT"];

function asBuffer(value, label) {
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  if (value instanceof ArrayBuffer) return Buffer.from(value);
  throw new TypeError(`${label} must be a Buffer, Uint8Array, or ArrayBuffer`);
}

function assertReadable(buffer, offset, length, label) {
  if (!Number.isSafeInteger(offset) || offset < 0 || offset + length > buffer.length) {
    throw new RangeError(`${label} points outside the BSI file: ${offset}..${offset + length - 1}`);
  }
}

function readUInt32Array(buffer, start, end, label) {
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start || end > buffer.length) {
    throw new RangeError(`${label} has invalid bounds: ${start}..${end}`);
  }
  if ((end - start) % 4 !== 0) throw new RangeError(`${label} must be aligned to 4-byte integers`);
  const values = [];
  for (let offset = start; offset < end; offset += 4) values.push(buffer.readUInt32LE(offset));
  return values;
}

function baiReference(raw) {
  return { raw, version: Math.floor(raw / 100), slot: raw % 100 };
}

function rectangle(args, start) {
  return { left: args[start], top: args[start + 1], right: args[start + 2], bottom: args[start + 3] };
}

function decodeAction(opcode, args, offset) {
  const action = { opcode, name: ACTION_NAMES[opcode] || `action-${opcode}`, offset, args };
  if (opcode === 600 || opcode === 130) action.bai = baiReference(args[0]);
  if (opcode === 620) {
    action.bai = baiReference(args[0]);
    action.position = { x: args[1], y: args[2] };
  }
  if (opcode === 240 || opcode === 830) {
    action.bai = baiReference(args[0]);
    action.item = { raw: args[1] };
  }
  if (opcode === 720) action.item = { raw: args[0], quantity: args[1] };
  return action;
}

function decodeCondition(opcode, args, offset) {
  const condition = { opcode, name: CONDITION_NAMES[opcode] || `condition-${opcode}`, offset, args };
  if (opcode === 140) {
    condition.difficulty = DIFFICULTIES[args[1]] || `UNKNOWN_${args[1]}`;
    condition.comparison = COMPARISONS[args[2]] || `UNKNOWN_${args[2]}`;
  }
  if (opcode === 220) condition.turn = args[1];
  if (opcode === 340) {
    condition.route = ROUTES[args[1]] || `UNKNOWN_${args[1]}`;
    condition.isRoute = args[2] === 1;
    condition.negated = args[0] === 1;
  }
  if (opcode === 30) condition.phase = "map-start";
  if (opcode === 170) condition.phase = "battle-start";
  if (opcode === 180) condition.phase = "player";
  if (opcode === 190) condition.phase = "enemy";
  if (opcode === 400 || opcode === 410) condition.phase = TEAMS[args[1]] || `team-${args[1]}`;
  if (opcode === 100) {
    condition.bai = baiReference(args[1]);
    condition.position = { x: args[2], y: args[3] };
  }
  if (opcode === 310) {
    condition.team = TEAMS[args[1]] || `team-${args[1]}`;
    condition.position = { x: args[2], y: args[3] };
  }
  if (opcode === 110) {
    condition.bai = baiReference(args[1]);
    condition.area = rectangle(args, 2);
  }
  if (opcode === 320) condition.area = rectangle(args, 2);
  if (opcode === 420) {
    condition.characterId = args[1];
    condition.area = rectangle(args, 2);
  }
  if (opcode === 99998 || opcode === 99999) {
    condition.children = args[1];
    condition.declaredLength = args[2];
  }
  return condition;
}

function parseOpcodeSection(buffer, start, end, options) {
  const { kind, expectedCount } = options;
  const counts = kind === "action" ? ACTION_ARGUMENT_COUNTS : CONDITION_ARGUMENT_COUNTS;
  const decode = kind === "action" ? decodeAction : decodeCondition;
  const commands = [];
  let offset = start;
  let opaqueRemainder = null;

  while (offset < end && (expectedCount === undefined || commands.length < expectedCount)) {
    assertReadable(buffer, offset, 4, `BSI ${kind} opcode`);
    const commandOffset = offset;
    const opcode = buffer.readUInt32LE(offset);
    offset += 4;
    const argumentCount = counts[opcode];
    if (argumentCount === undefined) {
      opaqueRemainder = {
        offset: commandOffset,
        opcode,
        raw: readUInt32Array(buffer, commandOffset, end, `BSI ${kind} opaque remainder`)
      };
      offset = end;
      break;
    }
    const argumentBytes = argumentCount * 4;
    assertReadable(buffer, offset, argumentBytes, `BSI ${kind} ${opcode} arguments`);
    if (offset + argumentBytes > end) {
      throw new RangeError(`BSI ${kind} ${opcode} extends past its section boundary`);
    }
    const args = readUInt32Array(buffer, offset, offset + argumentBytes, `BSI ${kind} ${opcode} arguments`);
    commands.push(decode(opcode, args, commandOffset));
    offset += argumentBytes;
  }

  if (offset < end && opaqueRemainder === null) {
    opaqueRemainder = { offset, opcode: null, raw: readUInt32Array(buffer, offset, end, `BSI ${kind} trailing data`) };
  }
  const countMatches = expectedCount === undefined || commands.length === expectedCount;
  return {
    commands,
    complete: opaqueRemainder === null && offset === end && countMatches,
    countMatches,
    expectedCount: expectedCount ?? null,
    opaqueRemainder
  };
}

function parseBsi(input) {
  const buffer = asBuffer(input, "BSI input");
  if (buffer.length < BSI_HEADER_BYTES) {
    throw new RangeError(`BSI input must contain the ${BSI_HEADER_BYTES}-byte header`);
  }

  const eventCount = buffer.readUInt32LE(0x08);
  const startOfEvents = buffer.readUInt32LE(0x20);
  if (eventCount > 10000) throw new RangeError(`BSI event count is implausibly large: ${eventCount}`);
  assertReadable(buffer, BSI_HEADER_BYTES, eventCount * 4, "BSI event pointer table");

  const events = [];
  for (let index = 0; index < eventCount; index += 1) {
    const offset = buffer.readUInt32LE(BSI_HEADER_BYTES + index * 4);
    assertReadable(buffer, offset, BSI_EVENT_HEADER_BYTES, `BSI event ${index} header`);
    const conditionsStart = buffer.readUInt32LE(offset + 0x18);
    const middleStart = buffer.readUInt32LE(offset + 0x1c);
    const actionCount = buffer.readUInt32LE(offset + 0x20);
    const actionsStart = buffer.readUInt32LE(offset + 0x24);
    const end = buffer.readUInt32LE(offset + 0x2c);
    if (!(offset + BSI_EVENT_HEADER_BYTES <= conditionsStart
      && conditionsStart <= middleStart
      && middleStart <= actionsStart
      && actionsStart <= end
      && end <= buffer.length)) {
      throw new RangeError(`BSI event ${index} section pointers are not ordered inside the file`);
    }
    const conditions = parseOpcodeSection(buffer, conditionsStart, middleStart, { kind: "condition" });
    const middleRaw = readUInt32Array(buffer, middleStart, actionsStart, `BSI event ${index} middle block`);
    const actions = parseOpcodeSection(buffer, actionsStart, end, { kind: "action", expectedCount: actionCount });

    events.push({
      index,
      offset,
      eventNum: buffer.readUInt32LE(offset),
      trigger: {
        type: buffer.readUInt32LE(offset + 0x08),
        param1: buffer.readUInt32LE(offset + 0x0c),
        param2: buffer.readUInt32LE(offset + 0x10),
        param3: buffer.readUInt32LE(offset + 0x14)
      },
      pointers: { conditions: conditionsStart, middle: middleStart, actions: actionsStart, end },
      actionCount,
      conditions,
      middle: { raw: middleRaw, expectedByteLength: 16, lengthMatches: actionsStart - middleStart === 16 },
      actions
    });
  }

  const sectionsComplete = events.every((event) => event.conditions.complete
    && event.actions.complete
    && event.middle.lengthMatches);
  return {
    header: {
      magic: buffer.readUInt32LE(0),
      eventCount,
      startOfEvents,
      declaredLengths: [0x24, 0x28, 0x2c, 0x30, 0x34].map((offset) => buffer.readUInt32LE(offset))
    },
    events,
    audit: {
      structural: true,
      sectionsComplete,
      semantic: false,
      unknownConditionSections: events.filter((event) => !event.conditions.complete).length,
      unknownActionSections: events.filter((event) => !event.actions.complete).length,
      warning: "Known battle opcodes are decoded conservatively. Unknown opcodes stop their section and preserve the opaque remainder."
    }
  };
}

function triggerSummary(event) {
  const result = { rawType: event.trigger.type };
  const descriptions = [];
  for (const condition of event.conditions.commands) {
    if (condition.difficulty) result.difficulty = condition.difficulty;
    if (condition.turn !== undefined) result.turn = condition.turn;
    if (condition.route) result.route = condition.route;
    if (condition.phase) result.phase = condition.phase;
    if (condition.area) descriptions.push(`${condition.name} (${condition.area.left},${condition.area.top})-(${condition.area.right},${condition.area.bottom})`);
    else if (condition.position) descriptions.push(`${condition.name} (${condition.position.x},${condition.position.y})`);
    else descriptions.push(condition.name);
  }
  if (descriptions.length > 0) result.condition = descriptions.join(" + ");
  if (!event.conditions.complete) result.decode = "partial";
  return result;
}

function isDynamicSpawn(event) {
  const neutral = new Set(["difficulty", "route", "and", "or", "start-map", "start-battle"]);
  return event.conditions.commands.some((condition) => !neutral.has(condition.name));
}

function validGridPosition(position, grid) {
  return position
    && Number.isInteger(position.x)
    && Number.isInteger(position.y)
    && position.x >= 0
    && position.y >= 0
    && position.x < grid.cols
    && position.y < grid.rows;
}

function semanticEventsFromBsi(bsi, baiUnits, grid) {
  if (!bsi) return [];
  const definitions = new Map(baiUnits.map((unit) => [unit.slot, unit]));
  const semanticEvents = [];

  for (const event of bsi.events) {
    const trigger = triggerSummary(event);
    for (const action of event.actions.commands) {
      if ([130, 600, 620].includes(action.opcode)) {
        const definition = definitions.get(action.bai.slot);
        const candidatePosition = action.position || (definition ? { x: definition.x, y: definition.y } : null);
        const position = validGridPosition(candidatePosition, grid) ? candidatePosition : null;
        const dynamic = isDynamicSpawn(event);
        const unitName = definition?.characterName || definition?.className || `slot ${action.bai.slot}`;
        const carriedItems = (definition?.items || []).map((item) => `${item.name || `item #${item.id}`}${item.droppable ? " (drop)" : ""}`).join(", ");
        semanticEvents.push({
          type: dynamic ? "reinforcement" : "deployment",
          label: dynamic ? `Reinforcement: ${unitName}` : `Scripted deployment: ${unitName}`,
          summary: `BAI ${action.bai.raw} · ${definition?.team || "unknown team"} · ${definition?.className || (definition?.classId == null ? "unknown class" : `class #${definition.classId}`)}${carriedItems ? ` · carries ${carriedItems}` : ""} · ambush timing unverified`,
          trigger,
          spawns: position ? [{ slot: action.bai.slot, ...position }] : [],
          spawnSlots: [action.bai.slot],
          ambushStatus: "unverified",
          source: { eventIndex: event.index, eventNum: event.eventNum, opcode: action.opcode, args: action.args }
        });
      }
      if ([240, 720, 830].includes(action.opcode)) {
        semanticEvents.push({
          type: "reward",
          label: action.opcode === 830 ? "Droppable item granted" : "Item granted",
          summary: `${action.bai ? `BAI ${action.bai.raw} · ` : ""}item #${action.item.raw}${action.item.quantity ? ` × ${action.item.quantity}` : ""}`,
          trigger,
          source: { eventIndex: event.index, eventNum: event.eventNum, opcode: action.opcode, args: action.args }
        });
      }
    }
  }
  return semanticEvents;
}

module.exports = {
  BSI_HEADER_BYTES,
  BSI_EVENT_HEADER_BYTES,
  ACTION_ARGUMENT_COUNTS,
  CONDITION_ARGUMENT_COUNTS,
  baiReference,
  parseBsi,
  semanticEventsFromBsi
};
