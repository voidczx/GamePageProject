# FE3H map import

Zero-dependency Node.js importer for Fire Emblem: Three Houses tactical terrain, BAI deployment and BSI event files. It emits the semantic version 1 object consumed by the map renderer. No game data is included; input files must come from the user's own legally obtained dump.

The binary layout is independently implemented from the MIT-licensed [`MapSpawnData_bai.bt`](https://github.com/three-houses-research-team/010-binary-templates/blob/1f66f0ad9031c606f0047d64f0982b07c97c83d2/MapSpawnData_bai.bt) and [`MapScriptData_bsi.bt`](https://github.com/three-houses-research-team/010-binary-templates/blob/1f66f0ad9031c606f0047d64f0982b07c97c83d2/MapScriptData_bsi.bt) templates. Human-readable character, class, item, ability, spell, combat-art and battalion labels in `catalogs.js` are generated from the same fixed revision; see `THIRD_PARTY_NOTICES.md`. The terrain reader implements the observed 8-byte header followed by a row-major 32x32 grid with two `uint8` layers per tile.

## CLI

```powershell
node games/fire-emblem-three-houses/tools/map-import/cli.js `
  --terrain C:\dump\366.bin `
  --bai C:\dump\85.bin `
  --bsi C:\dump\86.bin `
  --route 0 `
  --out C:\work\wc-1.map.json
```

Omit `--out` to write JSON to stdout. Add `--compact` for single-line JSON.

BAI contains three route blocks, selected explicitly with `--route`:

- `0`: Black Eagles block; also used by Silver Snow scenario data.
- `1`: Blue Lions block.
- `2`: Golden Deer block.

The output is deliberately a single selected route, so a consumer cannot silently combine mutually exclusive deployments.

## Module API

```js
const fs = require("node:fs");
const {
  parseTerrain,
  parseBai,
  parseBsi,
  buildSemanticMap
} = require("./games/fire-emblem-three-houses/tools/map-import");

const map = buildSemanticMap({
  terrain: fs.readFileSync("366.bin"),
  bai: fs.readFileSync("85.bin"),
  bsi: fs.readFileSync("86.bin"),
  route: 0
});
```

- `parseTerrain(buffer)` returns the 8 header bytes, `grid`, all 1,024 `tiles`, and `boundsReliable`.
- `parseBai(buffer, { route })` returns the selected route, all three route offsets, and every normalized BAI definition in `units`, including scripted spawns.
- `parseBsi(buffer)` validates event/section pointers and conservatively decodes verified fixed-width conditions and actions. An unknown opcode stops only its section and preserves the opaque remainder; it never scans for a guessed next boundary.
- `buildSemanticMap({ terrain, bai, bsi, route })` returns the renderer-facing object below. `bsi` is optional for a single-map import.

## Output contract

```js
{
  version: 1,
  grid: {
    cols: 32,
    rows: 32,
    bounds: { x, y, width, height }
  },
  tiles: [{ x, y, base, overlay }],
  // Initial render markers only: BAI scriptSpawn is false.
  units: [{
    slot,
    x,
    y,
    team: "player" | "enemy" | "ally",
    characterId,
    characterName,
    classId,
    className,
    level,
    items: [{ id, name, droppable }],
    skills: [id],
    skillNames: [name],
    spells: [{ id, name }],
    combatArt: { id, name } | null,
    rotation: { id, name },
    movement: { id, name, canMove },
    gender: { id, name },
    battalion: { enabled, id, name, level },
    scriptSpawn,
    scriptSpawnRaw,
    commander,
    commanderStatus: { id, name }
  }],
  // Scripted definitions are evidence, not initial markers. Their raw x/y may
  // be placeholders or outside the 32x32 grid and are preserved unchanged.
  spawnDefinitions: [{
    slot,
    x,
    y,
    team: "player" | "enemy" | "ally",
    characterId,
    characterName,
    classId,
    className,
    level,
    items: [{ id, name, droppable }],
    skills: [id],
    skillNames: [name],
    spells: [{ id, name }],
    combatArt: { id, name } | null,
    rotation: { id, name },
    movement: { id, name, canMove },
    gender: { id, name },
    battalion: { enabled, id, name, level },
    scriptSpawn: true,
    commander,
    commanderStatus: { id, name }
  }],
  treasures: [],
  // Auditable candidates decoded from known BSI actions. Reinforcement versus
  // initial script deployment is separated, but ambush timing is not guessed.
  events: [{
    type: "deployment" | "reinforcement" | "reward",
    label,
    summary,
    trigger: { rawType, turn, phase, difficulty, route, condition },
    spawns: [{ slot, x, y }],
    spawnSlots: [slot],
    ambushStatus: "unverified",
    source: { eventIndex, eventNum, opcode, args }
  }],
  rawBsi: { header, events, audit },
  completeness: {
    terrain: true,
    units: true,
    spawnDefinitions: true,
    items: true,
    treasures: false,
    treasurePositions: true,
    events: false,
    eventCandidates: true | false,
    bounds: true | false
  }
}
```

Coordinates and BAI `slot` are **0-based**. Character, class, item, and skill IDs are normalized from the BAI `+1` encoding; encoded zero becomes `null` or an omitted list entry. Team value 3 (yellow enemy) is normalized to `enemy`.

The 16-bit BAI item flag field is decoded as six two-bit fields. Bit 1 of a slot's pair marks that item as droppable. `scriptSpawn` is false for the automatic-spawn value 0 and true for nonzero values. Commander status 0 is exposed as `commander: true`. The complete 44-byte BAI definition also preserves fixed enemy level, facing, movement flag, battalion enable/ID/level, two extra spells, one combat art, gender, unknown word and padding. IDs remain present beside display labels so a missing or imperfect enum name never destroys the underlying evidence.

`buildSemanticMap` never places a `scriptSpawn: true` definition in the initial `units` array. It moves the complete definition into `spawnDefinitions` without clipping or validating its BAI `x` and `y`; values outside 0-31 remain available as source evidence. The BSI pass connects spawn actions to those BAI slots and emits a map coordinate only when the action contains one or the linked BAI coordinate is inside the grid. The lower-level `parseBai` API deliberately keeps all definitions together for lossless inspection.

Bounds are the smallest rectangle containing any tile whose `(base, overlay)` is not `(0, 0)`. An all-zero terrain cannot distinguish padding from a valid map, so it falls back to the full 32x32 rectangle and reports `completeness.bounds: false`.

Terrain ID 46 is emitted as an exact chest position with an empty `items` array and `completeness.treasurePositions: true`. BAI and terrain do not contain enough information to associate chest contents or event triggers.

The BSI decoder respects the file's event header and the `[conditions, middle, actions]` section pointers. Known fixed-width commands produce event candidates; unknown commands leave `audit.sectionsComplete: false` and retain their remaining raw integers. Ordinary `SpawnUnit` actions reference a BAI slot but do not carry a coordinate, while `SpawnSpooky` does carry one. `eventCandidates: true` therefore means every section boundary was decoded, not that every gameplay meaning is known. Chest contents, exact ambush/preemptive timing, unknown trigger types, and unidentified opcodes keep `completeness.events` and `completeness.treasures` false until independently verified.

## Verification

The tests synthesize both binary formats in memory and contain no extracted game bytes.

```powershell
node --test games/fire-emblem-three-houses/tools/map-import/test/map-import.test.js
```

or:

```powershell
npm test --prefix games/fire-emblem-three-houses/tools/map-import
```

To reproduce the generated name catalog from the audited upstream revision:

```powershell
node games/fire-emblem-three-houses/tools/map-import/generate-catalogs.js `
  --source-dir C:\src\010-binary-templates `
  --out games/fire-emblem-three-houses/tools/map-import/catalogs.js
```

## Batch import for the guide

After an archive extractor has produced index-named files such as `85.bin`,
`366.bin`, run:

```powershell
node games/fire-emblem-three-houses/tools/map-import/batch.js `
  --dump-dir C:\fe3h-extracted `
  --out games/fire-emblem-three-houses/map-details.js
```

Validate the complete input set without writing output first:

```powershell
node games/fire-emblem-three-houses/tools/map-import/batch.js `
  --dump-dir C:\fe3h-extracted `
  --check
```

The preflight checks all 183 required files for the 61 canonical scenarios in
one pass and reports every missing or structurally undersized input together.

The batch command uses the canonical 74 battle-record / 61 scenario manifest,
loads every required BAI, BSI and terrain file, and emits the browser script consumed
by `app.js`. Shared White Clouds and paralogue records contain route variants;
AM uses BAI block 1, VW block 2, and CF/SS block 0. Route-specific Part II
records contain only their applicable variant.

This stage deliberately leaves final `events` and `treasures` completeness false.
It does emit conservative BSI event candidates and preserves raw audit evidence;
full chest contents, unknown opcodes, and ambush timing still require independent
verification before the strict fidelity audit can pass.
