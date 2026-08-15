#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { importManifest, renderJsSnapshot, renderJsonSnapshot } = require("./lib/importer");

function usage() {
  return [
    "Usage:",
    "  node import-snapshot.js <manifest.json> [--json <snapshot.json>] [--js <snapshot.js>]",
    "       [--global <windowGlobal>] [--stdout]",
    "",
    "At least one of --json, --js, or --stdout is required."
  ].join("\n");
}

function parseArgs(argv) {
  const options = { manifest: null, json: null, js: null, globalName: "WOTR_IMPORTED_SNAPSHOT", stdout: false };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!options.manifest && !token.startsWith("--")) options.manifest = token;
    else if (token === "--json") options.json = argv[++index];
    else if (token === "--js") options.js = argv[++index];
    else if (token === "--global") options.globalName = argv[++index];
    else if (token === "--stdout") options.stdout = true;
    else throw new Error(`Unknown or incomplete argument: ${token}`);
  }
  if (!options.manifest || (!options.json && !options.js && !options.stdout)) throw new Error(usage());
  return options;
}

function writeOutput(filePath, content) {
  const resolved = path.resolve(filePath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, content, "utf8");
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const snapshot = importManifest(options.manifest);
    const json = renderJsonSnapshot(snapshot);
    if (options.json) writeOutput(options.json, json);
    if (options.js) writeOutput(options.js, renderJsSnapshot(snapshot, options.globalName));
    if (options.stdout) process.stdout.write(json);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = { main, parseArgs };
