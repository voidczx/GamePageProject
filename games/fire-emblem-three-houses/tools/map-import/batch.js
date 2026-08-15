#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const scenarios = require("../../map-scenarios");
const {
  TERRAIN_BYTE_LENGTH,
  BAI_HEADER_BYTES,
  BAI_ROUTE_COUNT,
  BAI_UNIT_BYTES,
  BAI_UNITS_PER_ROUTE,
  BSI_HEADER_BYTES,
  buildSemanticMap,
  parseBsi
} = require("./index");

const ROUTE_BLOCKS = Object.freeze({ CF: 0, SS: 0, AM: 1, VW: 2 });
const USAGE = `Usage:
  node batch.js --dump-dir <extracted-index-directory> --out <map-details.generated.js> [--extension .bin] [--compact]
  node batch.js --dump-dir <extracted-index-directory> --check [--extension .bin]

Expected files are named by archive index, for example 85.bin and 366.bin.
The command decodes verified BAI/BSI fields and preserves opaque evidence;
semantic event completeness remains false while unknown opcodes or timing remain.`;

function parseArgs(argv) {
  const options = { extension: ".bin", compact: false, check: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") return { help: true };
    if (argument === "--compact") {
      options.compact = true;
      continue;
    }
    if (argument === "--check") {
      options.check = true;
      continue;
    }
    if (!["--dump-dir", "--out", "--extension"].includes(argument)) throw new Error(`Unknown argument: ${argument}`);
    if (index + 1 >= argv.length) throw new Error(`${argument} requires a value`);
    const value = argv[index + 1];
    index += 1;
    if (argument === "--dump-dir") options.dumpDir = value;
    if (argument === "--out") options.out = value;
    if (argument === "--extension") options.extension = value.startsWith(".") ? value : `.${value}`;
  }
  if (!options.dumpDir) throw new Error("Missing required --dump-dir");
  if (!options.out && !options.check) throw new Error("Missing required --out (or use --check)");
  return options;
}

function routesForBattle(battleId) {
  if (battleId.startsWith("am-")) return ["AM"];
  if (battleId.startsWith("vw-")) return ["VW"];
  if (battleId.startsWith("cf-")) return ["CF"];
  if (battleId.startsWith("ss-")) return ["SS"];
  return ["AM", "VW", "CF", "SS"];
}

function loadIndexedFile(directory, index, extension) {
  const file = path.join(directory, `${index}${extension}`);
  if (!fs.existsSync(file)) throw new Error(`Missing extracted archive file: ${file}`);
  return fs.readFileSync(file);
}

function requiredDumpFiles(extension = ".bin") {
  const files = [];
  for (const scenario of scenarios.manifest) {
    files.push({ scenario: scenario.id, kind: "terrain", index: scenario.terrain, name: `${scenario.terrain}${extension}`, exactSize: TERRAIN_BYTE_LENGTH });
    files.push({ scenario: scenario.id, kind: "bai", index: scenario.bai, name: `${scenario.bai}${extension}`, minimumSize: BAI_HEADER_BYTES + BAI_ROUTE_COUNT * BAI_UNIT_BYTES * BAI_UNITS_PER_ROUTE });
    files.push({ scenario: scenario.id, kind: "bsi", index: scenario.bsi, name: `${scenario.bsi}${extension}`, minimumSize: BSI_HEADER_BYTES });
  }
  return files;
}

function inspectDump({ dumpDir, extension = ".bin" }) {
  const directory = path.resolve(dumpDir);
  const expected = requiredDumpFiles(extension);
  const missing = [];
  const invalid = [];
  for (const file of expected) {
    const filePath = path.join(directory, file.name);
    if (!fs.existsSync(filePath)) {
      missing.push({ ...file, file: filePath });
      continue;
    }
    const size = fs.statSync(filePath).size;
    if ((file.exactSize !== undefined && size !== file.exactSize)
      || (file.minimumSize !== undefined && size < file.minimumSize)) {
      invalid.push({ ...file, file: filePath, size });
    }
  }
  return { directory, expected: expected.length, present: expected.length - missing.length, missing, invalid, ok: missing.length === 0 && invalid.length === 0 };
}

function preflightMessage(report) {
  const lines = [`FE3H dump preflight: ${report.ok ? "OK" : "FAIL"} · ${report.present}/${report.expected} files present`];
  if (report.missing.length) lines.push(`Missing (${report.missing.length}): ${report.missing.slice(0, 12).map((entry) => entry.name).join(", ")}${report.missing.length > 12 ? ", …" : ""}`);
  if (report.invalid.length) lines.push(`Invalid size (${report.invalid.length}): ${report.invalid.slice(0, 12).map((entry) => `${entry.name}=${entry.size}B`).join(", ")}${report.invalid.length > 12 ? ", …" : ""}`);
  return lines.join("\n");
}

function buildAllMapDetails({ dumpDir, extension = ".bin" }) {
  const directory = path.resolve(dumpDir);
  const preflight = inspectDump({ dumpDir: directory, extension });
  if (!preflight.ok) throw new Error(preflightMessage(preflight));
  const semanticByScenarioAndBlock = new Map();
  const bsiAuditByScenario = {};
  const records = {};

  for (const scenario of scenarios.manifest) {
    const terrain = loadIndexedFile(directory, scenario.terrain, extension);
    const bai = loadIndexedFile(directory, scenario.bai, extension);
    const bsi = loadIndexedFile(directory, scenario.bsi, extension);
    const bsiData = parseBsi(bsi);
    bsiAuditByScenario[scenario.id] = bsiData;
    for (const routeBlock of new Set(Object.values(ROUTE_BLOCKS))) {
      const semantic = buildSemanticMap({
        terrain,
        bai,
        bsiData,
        route: routeBlock,
        includeRawBsi: false
      });
      semantic.source = {
        scenario: scenario.id,
        terrainIndex: scenario.terrain,
        baiIndex: scenario.bai,
        bsiIndex: scenario.bsi,
        routeBlock
      };
      semanticByScenarioAndBlock.set(`${scenario.id}:${routeBlock}`, semantic);
    }
  }

  for (const [battleId, scenarioId] of Object.entries(scenarios.battleToScenario)) {
    const variants = {};
    for (const route of routesForBattle(battleId)) {
      variants[route] = semanticByScenarioAndBlock.get(`${scenarioId}:${ROUTE_BLOCKS[route]}`);
    }
    records[battleId] = { version: 1, scenario: scenarioId, variants };
  }

  return {
    schemaVersion: 1,
    coordinateSystem: { origin: "top-left", indexBase: 0, xAxis: "right", yAxis: "down" },
    bsiAuditByScenario,
    records
  };
}

function toBrowserScript(details, compact = false) {
  const json = JSON.stringify(details, null, compact ? 0 : 2);
  return `// Generated locally from user-provided FE3H data. Do not commit raw game files.\nwindow.FE3H_MAP_DETAILS = ${json};\n`;
}

function run(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    process.stdout.write(`${USAGE}\n`);
    return;
  }
  const preflight = inspectDump(options);
  if (options.check) {
    process.stdout.write(`${preflightMessage(preflight)}\n`);
    if (!preflight.ok) process.exitCode = 1;
    return;
  }
  const details = buildAllMapDetails(options);
  const outputPath = path.resolve(options.out);
  fs.writeFileSync(outputPath, toBrowserScript(details, options.compact), "utf8");
  process.stdout.write(`Generated ${Object.keys(details.records).length} battle records from ${scenarios.manifest.length} scenarios: ${outputPath}\n`);
}

if (require.main === module) {
  try {
    run();
  } catch (error) {
    process.stderr.write(`map-import batch: ${error.message}\n\n${USAGE}\n`);
    process.exitCode = 1;
  }
}

module.exports = { ROUTE_BLOCKS, parseArgs, routesForBattle, requiredDumpFiles, inspectDump, preflightMessage, buildAllMapDetails, toBrowserScript, run, USAGE };
