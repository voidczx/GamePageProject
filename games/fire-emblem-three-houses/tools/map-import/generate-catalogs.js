#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function parseInteger(value, label) {
  if (!/^(?:0x[0-9a-f]+|\d+)$/i.test(value)) throw new Error(`Unsupported ${label} value: ${value}`);
  return Number.parseInt(value, value.toLowerCase().startsWith("0x") ? 16 : 10);
}

function parseEnums(source) {
  const clean = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  const enums = {};
  const pattern = /enum\s*<[^>]+>\s*([^\s{]+)\s*\{([\s\S]*?)\}\s*;/g;
  for (const match of clean.matchAll(pattern)) {
    const entries = [];
    let nextValue = 0;
    for (const rawEntry of match[2].split(",")) {
      const entry = rawEntry.trim();
      if (!entry) continue;
      const parts = /^([^\s=]+)(?:\s*=\s*([^\s]+))?$/.exec(entry);
      if (!parts) throw new Error(`Unsupported ${match[1]} entry: ${entry}`);
      const value = parts[2] ? parseInteger(parts[2], `${match[1]}.${parts[1]}`) : nextValue;
      entries.push({ name: parts[1], value });
      nextValue = value + 1;
    }
    enums[match[1]] = entries;
  }
  return enums;
}

function displayName(name) {
  return name
    .replaceAll("_", " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\bLv(\d+)\b/g, "Lv.$1")
    .replace(/\bPlus\b/g, "+")
    .replace(/\s+/g, " ")
    .trim();
}

function catalog(entries, options = {}) {
  if (!entries) throw new Error(`Missing enum ${options.enumName}`);
  const omit = new Set(options.omit || []);
  const result = {};
  for (const entry of entries) {
    if (omit.has(entry.name)) continue;
    if (options.shift && entry.value === 0) continue;
    const id = options.shift ? entry.value - 1 : entry.value;
    result[id] = displayName(entry.name);
  }
  return result;
}

function main() {
  const sourceDir = option("--source-dir");
  const outPath = option("--out");
  if (!sourceDir || !outPath) {
    throw new Error("Usage: node generate-catalogs.js --source-dir <010-binary-templates> --out <catalogs.js>");
  }
  const enums = {
    ...parseEnums(fs.readFileSync(path.join(sourceDir, "3H_BaiEnums.bt"), "utf8")),
    ...parseEnums(fs.readFileSync(path.join(sourceDir, "3H_BaiArtsEnums.bt"), "utf8"))
  };
  const definitions = {
    characters: catalog(enums.CharID, { enumName: "CharID", shift: true, omit: ["None"] }),
    classes: catalog(enums.Class, { enumName: "Class", shift: true, omit: ["NoClass"] }),
    items: catalog(enums.ItemsBai, { enumName: "ItemsBai", shift: true, omit: ["None_Item"] }),
    skills: catalog(enums.AbilityID, { enumName: "AbilityID", shift: true, omit: ["NoAbility"] }),
    battalions: catalog(enums.BattalionID, { enumName: "BattalionID", shift: true, omit: ["No_Battalion"] }),
    spells: catalog(enums.SpellIDBai, { enumName: "SpellIDBai", shift: true, omit: ["NoSpell"] }),
    combatArts: catalog(enums.ArtID, { enumName: "ArtID", shift: true, omit: ["None_Art", "No_Art"] }),
    rotations: catalog(enums.Rotation, { enumName: "Rotation" }),
    genders: catalog(enums.Gender, { enumName: "Gender" }),
    movement: catalog(enums.MovementFlags, { enumName: "MovementFlags" }),
    commanderStatuses: catalog(enums.CommanderStatus, { enumName: "CommanderStatus" })
  };
  const lines = [
    '"use strict";',
    "",
    "// Generated from Three Houses Research Group's MIT-licensed 010 binary templates.",
    "// See THIRD_PARTY_NOTICES.md. Do not edit this generated file by hand.",
    `const definitions = ${JSON.stringify(definitions, null, 2)};`,
    "",
    "module.exports = Object.freeze(Object.fromEntries(",
    "  Object.entries(definitions).map(([key, value]) => [key, Object.freeze(value)])",
    "));",
    ""
  ];
  fs.writeFileSync(outPath, lines.join("\n"));
}

main();
