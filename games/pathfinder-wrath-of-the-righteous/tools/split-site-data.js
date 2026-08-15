"use strict";

const fs = require("fs");
const path = require("path");

const [, , inputPath, coreOutputPath, definitionsOutputPath] = process.argv;
if (!inputPath || !coreOutputPath || !definitionsOutputPath) {
  throw new Error("usage: node split-site-data.js INPUT_JS CORE_JS DEFINITIONS_JS");
}

const source = fs.readFileSync(inputPath, "utf8").trim();
const assignmentMatch = source.match(/^window\.WOTR_OWLCAT_SITE_DATA\s*=\s*/);
if (!assignmentMatch || !source.endsWith(";")) {
  throw new Error("input is not a WOTR_OWLCAT_SITE_DATA assignment");
}

const assignment = "window.WOTR_OWLCAT_SITE_DATA=";
const data = JSON.parse(source.slice(assignmentMatch[0].length, -1));
const definitions = data.selectionDefinitions;
if (!definitions || typeof definitions !== "object" || Array.isArray(definitions)) {
  throw new Error("input has no selectionDefinitions object");
}

data.selectionDefinitions = {};
const core = `${assignment}${JSON.stringify(data)};\n`;
const definitionChunk = `window.WOTR_OWLCAT_SITE_DATA.selectionDefinitions=${JSON.stringify(definitions)};\n`;
const maxAssetBytes = 25 * 1024 * 1024;
if (Buffer.byteLength(core) > maxAssetBytes || Buffer.byteLength(definitionChunk) > maxAssetBytes) {
  throw new Error("split output still exceeds Cloudflare Pages' 25 MiB asset limit");
}

fs.mkdirSync(path.dirname(coreOutputPath), { recursive: true });
fs.mkdirSync(path.dirname(definitionsOutputPath), { recursive: true });
fs.writeFileSync(coreOutputPath, core);
fs.writeFileSync(definitionsOutputPath, definitionChunk);

process.stdout.write(JSON.stringify({
  coreBytes: Buffer.byteLength(core),
  definitionsBytes: Buffer.byteLength(definitionChunk),
  definitionCount: Object.keys(definitions).length
}));
