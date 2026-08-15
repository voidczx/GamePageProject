#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { importOwlcatInstall, renderOwlcatJs, renderOwlcatJson } = require("./lib/owlcat-importer");

function usage() {
  return [
    "Usage:",
    "  node import-owlcat.js --install-root <game-directory> [--lock <source-lock.json>]",
    "       [--json <snapshot.json>] [--js <snapshot.js>] [--global <windowGlobal>]",
    "       [--summary]",
    "",
    "The checked-in source lock pins Version.info and all three source hashes."
  ].join("\n");
}

function parseArgs(argv) {
  const options = {
    installRoot: null,
    lock: path.resolve(__dirname, "owlcat-source-lock.json"),
    json: null,
    js: null,
    globalName: "WOTR_OWLCAT_SNAPSHOT",
    summary: false
  };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--install-root") options.installRoot = argv[++index];
    else if (token === "--lock") options.lock = argv[++index];
    else if (token === "--json") options.json = argv[++index];
    else if (token === "--js") options.js = argv[++index];
    else if (token === "--global") options.globalName = argv[++index];
    else if (token === "--summary") options.summary = true;
    else throw new Error(`Unknown or incomplete argument: ${token}`);
  }
  if (!options.installRoot || (!options.json && !options.js && !options.summary)) throw new Error(usage());
  return options;
}

function writeOutput(filePath, content) {
  const resolved = path.resolve(filePath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, content, "utf8");
}

async function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const snapshot = await importOwlcatInstall(options.installRoot, options.lock);
    if (options.json) writeOutput(options.json, renderOwlcatJson(snapshot));
    if (options.js) writeOutput(options.js, renderOwlcatJs(snapshot, options.globalName));
    if (options.summary) process.stdout.write(`${JSON.stringify({
      gameVersion: snapshot.gameVersion,
      steamBuild: snapshot.steamBuild,
      counts: snapshot.counts,
      selectionGraphs: snapshot.selectionGraphs,
      hashes: snapshot.hashes
    }, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = { main, parseArgs };
