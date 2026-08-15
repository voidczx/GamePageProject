#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { importOwlcatInstall, renderOwlcatJson } = require("./lib/owlcat-importer");
const {
  adaptOwlcatSnapshot,
  renderOwlcatSiteJson,
  renderOwlcatSiteJs
} = require("./lib/owlcat-site-adapter");

function usage() {
  return [
    "Usage:",
    "  node build-owlcat-site.js --install-root <game-directory> [--lock <source-lock.json>]",
    "       [--json <compact-site.json>] [--js <compact-site.js>] [--global <windowGlobal>]",
    "       [--summary]",
    "",
    "Imports the locked Owlcat sources, adapts the snapshot without touching page runtime files,",
    "and emits deterministic compact JSON or a JavaScript window global."
  ].join("\n");
}

function parseArgs(argv) {
  const options = {
    installRoot: null,
    lock: path.resolve(__dirname, "owlcat-source-lock.json"),
    json: null,
    js: null,
    globalName: "WOTR_OWLCAT_SITE_DATA",
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
  if (!/^[A-Za-z_$][\w$]*$/.test(options.globalName)) throw new Error(`Invalid JavaScript global name: ${options.globalName}`);
  return options;
}

function writeOutput(filePath, content) {
  const resolved = path.resolve(filePath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, content, "utf8");
  return {
    path: resolved,
    bytes: Buffer.byteLength(content, "utf8"),
    sha256: `sha256:${crypto.createHash("sha256").update(content).digest("hex")}`
  };
}

async function buildOwlcatSite(options) {
  const snapshot = await importOwlcatInstall(path.resolve(options.installRoot), path.resolve(options.lock));
  const siteData = adaptOwlcatSnapshot(snapshot);
  const compactJson = renderOwlcatSiteJson(siteData);
  const compactJs = renderOwlcatSiteJs(siteData, options.globalName || "WOTR_OWLCAT_SITE_DATA");
  const outputs = {};
  if (options.json) outputs.json = writeOutput(options.json, compactJson);
  if (options.js) outputs.js = writeOutput(options.js, compactJs);
  return {
    siteData,
    summary: {
      gameVersion: snapshot.gameVersion,
      steamBuild: snapshot.steamBuild,
      sourceSnapshot: siteData.sourceSnapshot,
      counts: siteData.counts,
      bytes: {
        rawSnapshotJson: Buffer.byteLength(`${JSON.stringify(snapshot)}\n`, "utf8"),
        rawSnapshotPrettyJson: Buffer.byteLength(renderOwlcatJson(snapshot), "utf8"),
        compactSiteJson: Buffer.byteLength(compactJson, "utf8"),
        compactSiteJs: Buffer.byteLength(compactJs, "utf8")
      },
      outputs
    }
  };
}

async function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const result = await buildOwlcatSite(options);
    if (options.summary) process.stdout.write(`${JSON.stringify(result.summary, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = { buildOwlcatSite, main, parseArgs, usage, writeOutput };
