#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { buildSemanticMap } = require("./index");

const USAGE = `Usage:
  node cli.js --terrain <terrain.bin> --bai <battle.bai> [--bsi <battle.bsi>] --route <0|1|2> [--out <map.json>] [--compact]

Routes:
  0 = Black Eagles route block
  1 = Blue Lions route block
  2 = Golden Deer route block

Output separates initial units from BAI spawnDefinitions, resolves audited
display names, and links verified BSI spawn actions without guessing timing.
Without --out, JSON is written to stdout.`;

function parseArgs(argv) {
  const options = { compact: false };
  const valueFlags = new Set(["--terrain", "--bai", "--bsi", "--route", "--out"]);

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") return { help: true };
    if (argument === "--compact") {
      options.compact = true;
      continue;
    }
    if (!valueFlags.has(argument)) throw new Error(`Unknown argument: ${argument}`);
    if (index + 1 >= argv.length) throw new Error(`${argument} requires a value`);
    const value = argv[index + 1];
    index += 1;
    if (argument === "--terrain") options.terrain = value;
    if (argument === "--bai") options.bai = value;
    if (argument === "--bsi") options.bsi = value;
    if (argument === "--route") options.route = Number(value);
    if (argument === "--out") options.out = value;
  }

  for (const required of ["terrain", "bai", "route"]) {
    if (options[required] === undefined) throw new Error(`Missing required --${required}`);
  }
  return options;
}

function run(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    process.stdout.write(`${USAGE}\n`);
    return;
  }

  const semanticMap = buildSemanticMap({
    terrain: fs.readFileSync(options.terrain),
    bai: fs.readFileSync(options.bai),
    bsi: options.bsi ? fs.readFileSync(options.bsi) : null,
    route: options.route
  });
  const json = `${JSON.stringify(semanticMap, null, options.compact ? 0 : 2)}\n`;

  if (options.out) {
    const outputPath = path.resolve(options.out);
    fs.writeFileSync(outputPath, json, "utf8");
    return;
  }
  process.stdout.write(json);
}

if (require.main === module) {
  try {
    run();
  } catch (error) {
    process.stderr.write(`map-import: ${error.message}\n\n${USAGE}\n`);
    process.exitCode = 1;
  }
}

module.exports = { parseArgs, run, USAGE };
