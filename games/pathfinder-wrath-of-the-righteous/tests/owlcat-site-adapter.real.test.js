"use strict";

const assert = require("assert");
const path = require("path");
const { importOwlcatInstall } = require("../tools/lib/owlcat-importer");
const { ROOT_GUIDS, adaptOwlcatSnapshot } = require("../tools/lib/owlcat-site-adapter");

async function main() {
  const installRoot = process.argv[2] || process.env.WOTR_INSTALL_ROOT;
  if (!installRoot) {
    console.log("owlcat-site-adapter.real.test.js: skipped (pass the game install root or set WOTR_INSTALL_ROOT)");
    return;
  }
  const lockPath = path.resolve(__dirname, "../tools/owlcat-source-lock.json");
  const snapshot = await importOwlcatInstall(path.resolve(installRoot), lockPath);
  const adapted = adaptOwlcatSnapshot(snapshot);
  assert.deepEqual(adapted.counts, {
    abilities: 3755,
    archetypes: 196,
    armorTypes: 21,
    backgroundDirectOptions: 11,
    baseClasses: 26,
    basicFeatDirectOptions: 276,
    classArchetypeRefs: 197,
    classFeatureDefinitions: 3029,
    classFeatureOccurrences: 10793,
    classRootRefs: 40,
    deityOptions: 33,
    domainDirectOptions: 37,
    domainFeatureDefinitions: 276,
    domainFeatureOccurrences: 301,
    excludedArchetypes: 1,
    heritageOptions: 49,
    importedDefinitions: 15283,
    localizedAbilities: 3605,
    mythicAbilityDirectOptions: 67,
    mythicFeatDirectOptions: 48,
    parametrizedFeatures: 122,
    pathFeatureDefinitions: 923,
    pathFeatureOccurrences: 1491,
    playableMythicClasses: 10,
    prestigeClasses: 13,
    progressions: 578,
    races: 12,
    selectionDefinitions: 9658,
    selectionPools: 451,
    shieldTypes: 4,
    spellLists: 102,
    spellMemberships: 4737,
    spells: 671,
    spellbooks: 58,
    spellsTables: 41,
    statProgressions: 13,
    technicalClasses: 1,
    technicalMythicClasses: 4,
    weaponCategories: 78,
    weaponTypes: 145
  });
  assert.equal(adapted.classes.technical[0].internalName, "EldritchScionClass");
  assert.equal(adapted.classes.technical[0].technicalReason, "owlcat-technical-eldritch-scion-class");
  assert.equal(adapted.diagnostics.excludedArchetypes[0].sourceGuid, "074a9dd227cb43669d5b160c5282e146");
  assert.ok(/Penta_/i.test(adapted.diagnostics.excludedArchetypes[0].blueprintPath));
  assert.ok(adapted.choiceRoots.basicFeats.options.some((item) => item.nestedSelectionGuid), "BasicFeat direct options must preserve nested selections");
  assert.ok(adapted.choiceRoots.mythicFeats.options.some((item) => item.nestedSelectionGuid), "MythicFeat direct options must preserve nested selections");
  const entryEtudeGuids = adapted.mythicClasses.playable.flatMap((entry) => entry.requirements || [])
    .filter((requirement) => String(requirement.$type || "").includes("PrerequisiteEtude"))
    .map((requirement) => String(requirement.Etude || requirement.m_Etude || "").match(/[0-9a-f]{32}/i)?.[0]?.toLowerCase())
    .filter(Boolean);
  assert.ok(entryEtudeGuids.length > 0 && entryEtudeGuids.every((guid) => adapted.selectionDefinitions[guid]?.blueprintType === "BlueprintEtude"), "every direct mythic entry Etude must survive in the compact site artifact");
  assert.equal(new Set(adapted.spells.map((item) => item.sourceGuid)).size, 671);
  assert.equal(adapted.spells.reduce((sum, spell) => sum + spell.spellLists.length, 0), 4737);

  const definitions = new Map(Object.values(snapshot.definitions).flat().map((definition) => [definition.guid, definition]));
  const outputItems = [
    ...Object.values(adapted.choiceRoots).flatMap((root) => root.options),
    ...adapted.classes.base, ...adapted.classes.prestige, ...adapted.classes.technical,
    ...adapted.mythicClasses.playable, ...adapted.mythicClasses.technical,
    ...adapted.archetypes, ...adapted.spells
  ];
  outputItems.forEach((item) => {
    const native = definitions.get(item.sourceGuid);
    assert.ok(native, `missing native definition ${item.sourceGuid}`);
    assert.equal(item.id, item.sourceGuid, "GUID must remain authoritative");
    assert.equal(item.name, native.localization.name ?? null, "name must come from official zhCN localization");
    assert.equal(item.description, native.localization.description ?? native.localization.shortDescription ?? null, "description must come from official zhCN localization");
    assert.deepEqual(item.requirements, native.requirements || [], "native requirements must be preserved");
    assert.deepEqual(item.parameter, native.parameter || null, "native parameter schema must be preserved");
    assert.deepEqual(item.mechanics, native.mechanics || {}, "native mechanics summary must be preserved");
  });
  Object.entries(ROOT_GUIDS).forEach(([id, rootGuid]) => assert.equal(adapted.choiceRoots[id].sourceGuid, rootGuid));
  console.log(`owlcat-site-adapter.real.test.js: ${snapshot.gameVersion}/${snapshot.steamBuild}; ${adapted.counts.spells} spells; ${adapted.counts.baseClasses}+${adapted.counts.prestigeClasses}+${adapted.counts.technicalClasses} classes; ${adapted.counts.archetypes} archetypes`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
