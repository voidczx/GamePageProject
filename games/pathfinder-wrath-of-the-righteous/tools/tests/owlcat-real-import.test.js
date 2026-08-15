"use strict";

const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { importOwlcatInstall, renderOwlcatJson } = require("../lib/owlcat-importer");

async function main() {
  const installRoot = process.env.WOTR_INSTALL_ROOT;
  if (!installRoot) {
    process.stdout.write("owlcat-real-import.test.js: skipped (set WOTR_INSTALL_ROOT)\n");
    return;
  }
  const lock = path.resolve(__dirname, "../owlcat-source-lock.json");
  const first = await importOwlcatInstall(installRoot, lock);
  const second = await importOwlcatInstall(installRoot, lock);
  assert.strictEqual(renderOwlcatJson(first), renderOwlcatJson(second), "real snapshot must be byte-for-byte deterministic");
  assert.strictEqual(first.gameVersion, "2.7.0x");
  assert.strictEqual(first.steamBuild, "20212986");
  assert.strictEqual(first.counts.playableArchetypes, 196);
  assert.strictEqual(first.counts.loadedBlueprints, 15283);
  assert.strictEqual(first.counts.definitions, 15283);
  assert.strictEqual(first.counts.choicePools, 451);
  assert.strictEqual(first.counts.progressions, 578);
  assert.strictEqual(first.counts.parametrizedFeatures, 122);
  assert.strictEqual(first.counts.excludedClassArchetypes, 1);
  assert.strictEqual(first.counts.playableMythicClasses, 10);
  assert.strictEqual(first.counts.technicalMythicClasses, 4);
  assert.strictEqual(first.counts.spellLists, 102);
  assert.strictEqual(first.counts.spellMemberships, 4737);
  assert.strictEqual(first.counts.uniqueSpells, 671);
  assert.strictEqual(first.counts.spellbooks, 58);
  assert.strictEqual(first.counts.spellsTables, 41);
  assert.strictEqual(first.counts.statProgressions, 13);
  assert.strictEqual(first.counts.heritageSelections, 11);
  assert.strictEqual(first.counts.heritageOptions, 48);
  assert.strictEqual(first.counts.heritageBaselineIncludingHuman, 49);
  assert.strictEqual(first.counts.deityOptions, 33);
  assert.strictEqual(first.counts.backgroundDirectOptions, 11);
  assert.strictEqual(first.counts.backgroundLeaves, 45);
  assert.strictEqual(first.diagnostics.coverage.mode, "mechanics-closure");
  assert.strictEqual(first.diagnostics.coverage.mechanicallyClosed, true);
  assert.strictEqual(first.diagnostics.coverage.unloadedMechanicsWhitelistReferences, 0);
  assert.strictEqual(first.diagnostics.coverage.unloadedKnownBlueprintReferences, 3141);
  assert.strictEqual(first.diagnostics.coverage.unknownAssetReferences, 9408);
  assert.strictEqual(first.diagnostics.unloadedReferenceTypeCounts.BlueprintAbility, undefined);
  assert.strictEqual(first.diagnostics.unloadedReferenceTypeCounts.BlueprintFeature, undefined);
  assert.strictEqual(first.diagnostics.unloadedReferenceTypeCounts.BlueprintBuff, undefined);
  first.provenance.sources.forEach((source) => assert.strictEqual(path.win32.isAbsolute(source.path), false));

  const expectedGraphs = new Map([
    ["247a4068296e8be42890143f451b4b45", [276, 634, 64, 570]],
    ["ba0e5a900b775be4a99702f1ed08914d", [67, 227, 13, 214]],
    ["9ee0f6745f555484299b0a1563b99d81", [48, 901, 77, 824]],
    ["48525e5da45c9c243a343fc6545dbdb9", [37, 38, 1, 37]],
    ["f926dabeee7f8a54db8f2010b323383c", [11, 55, 10, 45]]
  ]);
  expectedGraphs.forEach(([direct, reachable, selections, leaves], guid) => {
    const graph = first.selectionGraphs.find((entry) => entry.rootGuid === guid);
    assert(graph, `missing selection graph ${guid}`);
    assert.deepStrictEqual([graph.directOptions, graph.reachableNodes, graph.selectionNodes, graph.leaves], [direct, reachable, selections, leaves]);
  });

  const spellSpecialization = Object.values(first.definitions).flat().find((definition) => definition.guid === "f327a765a4353d04f872482ef3e48c35");
  assert(spellSpecialization, "SpellSpecializationFirst must be imported through the basic feat graph");
  assert.strictEqual(spellSpecialization.parameter.type, "SpellSpecialization");
  assert(spellSpecialization.parameter.blueprintParameterVariants.length > 100);

  const negativeDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "wotr-lock-negative-"));
  try {
    const invalidLock = JSON.parse(fs.readFileSync(lock, "utf8"));
    invalidLock.expectedGameVersion = "2.5.0y";
    const invalidLockPath = path.join(negativeDirectory, "invalid-lock.json");
    fs.writeFileSync(invalidLockPath, JSON.stringify(invalidLock), "utf8");
    await assert.rejects(importOwlcatInstall(installRoot, invalidLockPath), /expected game 2\.5\.0y, got 2\.7\.0x/);
  } finally {
    const relative = path.relative(path.resolve(os.tmpdir()), path.resolve(negativeDirectory));
    assert(relative && !relative.startsWith("..") && !path.isAbsolute(relative));
    fs.rmSync(negativeDirectory, { recursive: true, force: true });
  }
  process.stdout.write(`owlcat-real-import.test.js: ok (${first.hashes.snapshotSha256})\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
