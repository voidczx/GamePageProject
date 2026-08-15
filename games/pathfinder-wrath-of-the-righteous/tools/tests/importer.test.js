"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { importManifest, renderJsonSnapshot } = require("../lib/importer");
const {
  analyzeSelectionGraph,
  definitionMechanics,
  directReferenceOccurrences,
  extractReferences,
  mergePrototypeData,
  parseVersionInfo,
  structuralReferences
} = require("../lib/owlcat-importer");

const fixtureRoot = path.resolve(__dirname, "../fixtures");

function testCanonicalDeterminism() {
  const manifest = path.join(fixtureRoot, "deterministic/manifest.json");
  const first = renderJsonSnapshot(importManifest(manifest));
  const second = renderJsonSnapshot(importManifest(manifest));
  assert.strictEqual(first, second, "canonical snapshot bytes must be deterministic");
  const parsed = JSON.parse(first);
  assert.strictEqual(parsed.definitions.feats[0].display.name, "猛力攻击");
  assert.strictEqual(parsed.hashes.snapshotSha256, "sha256:ccedd7333ee50e12e7e0659ca9a8a0e9cc5d33e01ccfc1db3c43a6ea8a643ded");
}

function testPrototypeOverrides() {
  const fixture = JSON.parse(fs.readFileSync(path.join(fixtureRoot, "owlcat/prototype-blueprints.json"), "utf8"));
  const merged = mergePrototypeData(fixture.parent.Data, fixture.child.Data);
  assert.strictEqual(merged.m_DisplayName.m_Key, "parent.name", "unoverridden nested fields inherit from PrototypeLink");
  assert.strictEqual(merged.ParameterType, "SpellSpecialization", "native parameter type inherits from prototype");
  assert.deepStrictEqual(merged.Groups, [], "m_Overrides replaces the field value");
  assert.deepStrictEqual(merged.BlueprintParameterVariants, ["!bp_33333333333333333333333333333333"]);
  assert.deepStrictEqual(merged.Components.map((component) => component.name), [
    "$PrerequisiteFeature$add",
    "$PrerequisiteStatValue$keep"
  ]);
}

function testReferenceGraphCycleGuard() {
  assert.deepStrictEqual([...extractReferences({ a: "!bp_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", b: ["bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"] })].sort(), [
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
  ]);
  const pools = new Map([
    ["a", { options: ["b", "leaf-a"] }],
    ["b", { options: ["a", "leaf-b"] }]
  ]);
  const graph = analyzeSelectionGraph("a", pools);
  assert.strictEqual(graph.reachableNodes, 4);
  assert.strictEqual(graph.selectionNodes, 2);
  assert.strictEqual(graph.leaves, 2);
  assert.deepStrictEqual(graph.cycleEdges, ["a"]);
}

function testEtudePrerequisiteReference() {
  const classGuid = "11111111111111111111111111111111";
  const etudeGuid = "22222222222222222222222222222222";
  const unrelatedGuid = "33333333333333333333333333333333";
  const guidIndex = new Map([
    [classGuid, { guid: classGuid, blueprintType: "BlueprintCharacterClass" }],
    [etudeGuid, { guid: etudeGuid, blueprintType: "BlueprintEtude" }],
    [unrelatedGuid, { guid: unrelatedGuid, blueprintType: "BlueprintFeature" }]
  ]);
  const references = structuralReferences(classGuid, { Data: {
    Components: [{
      $type: "fixture, PrerequisiteEtude",
      m_Etude: `!bp_${etudeGuid}`,
      m_UnrelatedFeature: `!bp_${unrelatedGuid}`
    }]
  } }, guidIndex.get(classGuid), guidIndex, "ffffffffffffffffffffffffffffffff", {});
  assert.deepStrictEqual(references, [etudeGuid], "PrerequisiteEtude must target-load only its BlueprintEtude story flag");
}

function testDirectReferenceMultiplicity() {
  const repeated = "!bp_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  assert.deepStrictEqual(directReferenceOccurrences([repeated, repeated, "!bp_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"]), [
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
  ]);
}

function testVersionParsing() {
  const version = parseVersionInfo("2025-Apr-02 15:44 eb82d8f2ec1cd0696dae5b17c53dd9a357f28674 2.7.0x 2.7.0");
  assert.strictEqual(version.gameVersion, "2.7.0x");
  assert.strictEqual(version.commit, "eb82d8f2ec1cd0696dae5b17c53dd9a357f28674");
  assert.throws(() => parseVersionInfo("not-a-version"), /unsupported format/);
}

function testDefinitionMechanics() {
  const strings = { duration: "duration text", saving: "saving throw text" };
  const ability = definitionMechanics({ blueprintType: "BlueprintAbility" }, {
    Type: "Spell",
    Range: "Long",
    ActionType: "Standard",
    AvailableMetamagic: ["Heighten", "Quicken"],
    LocalizedDuration: { m_Key: "duration" },
    LocalizedSavingThrow: { m_Key: "saving" }
  }, [
    { $type: "hash, SpellComponent", School: "Evocation" },
    { $type: "hash, AbilityEffectRunAction", SavingThrowType: "Reflex" },
    { $type: "hash, SpellDescriptorComponent", Descriptor: { m_IntValue: 1 } }
  ], strings);
  assert.equal(ability.ability.school, "Evocation");
  assert.deepStrictEqual(ability.ability.savingThrowTypes, ["Reflex"]);
  assert.equal(ability.ability.localizedDuration.text, strings.duration);

  const characterClass = definitionMechanics({ blueprintType: "BlueprintCharacterClass" }, {
    SkillPoints: 2,
    HitDie: "D10",
    m_BaseAttackBonus: "!bp_11111111111111111111111111111111",
    m_Progression: "!bp_22222222222222222222222222222222",
    m_Spellbook: "!bp_33333333333333333333333333333333",
    ClassSkills: ["Athletics"],
    IsArcaneCaster: true
  }, [{ $type: "hash, SkipLevelsForSpellProgression", Levels: [9, 5, 9] }], {});
  assert.deepStrictEqual(characterClass.characterClass, {
    skillPoints: 2,
    hitDie: "D10",
    prestige: false,
    isMythic: false,
    isHigherMythic: false,
    baseAttackBonus: "11111111111111111111111111111111",
    fortitudeSave: null,
    reflexSave: null,
    willSave: null,
    progression: "22222222222222222222222222222222",
    spellbook: "33333333333333333333333333333333",
    dontAddCasterLevels: false,
    skipSpellProgressionLevels: [5, 9],
    classSkills: ["Athletics"],
    isDivineCaster: false,
    isArcaneCaster: true,
    recommendedAttributes: [],
    notRecommendedAttributes: []
  });

  const race = definitionMechanics({ blueprintType: "BlueprintRace" }, {
    RaceId: "Human",
    Size: "Medium",
    SelectableRaceStat: true,
    m_Features: [
      "!bp_99999999999999999999999999999999",
      "!bp_99999999999999999999999999999999",
      "!bp_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    ]
  }, [], {});
  assert.deepStrictEqual(race.race, {
    raceId: "Human",
    size: "Medium",
    selectableRaceStat: true,
    features: [
      "99999999999999999999999999999999",
      "99999999999999999999999999999999",
      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    ]
  });

  const prestigeSpellbook = definitionMechanics({ blueprintType: "BlueprintFeatureReplaceSpellbook" }, {
    Ranks: 1,
    IsClassFeature: true,
    m_Spellbook: "!bp_44444444444444444444444444444444"
  }, [], {});
  assert.strictEqual(prestigeSpellbook.feature.isClassFeature, true);
  assert.deepStrictEqual(prestigeSpellbook.spellbookAdvance, {
    kind: "replace-class-spellbook",
    targetSpellbook: "44444444444444444444444444444444"
  });

  const mythicSpellbook = definitionMechanics({ blueprintType: "BlueprintFeatureSelectMythicSpellbook" }, {
    m_AllowedSpellbooks: [
      "!bp_66666666666666666666666666666666",
      "!bp_55555555555555555555555555555555",
      "!bp_66666666666666666666666666666666"
    ],
    m_MythicSpellList: "!bp_77777777777777777777777777777777",
    m_SpellKnownForSpontaneous: "!bp_88888888888888888888888888888888"
  }, [], {});
  assert.deepStrictEqual(mythicSpellbook.spellbookAdvance, {
    kind: "merge-mythic-spellbook",
    allowedSpellbooks: [
      "55555555555555555555555555555555",
      "66666666666666666666666666666666"
    ],
    mythicSpellList: "77777777777777777777777777777777",
    spontaneousKnownTable: "88888888888888888888888888888888"
  });
}

testCanonicalDeterminism();
testPrototypeOverrides();
testReferenceGraphCycleGuard();
testEtudePrerequisiteReference();
testDirectReferenceMultiplicity();
testVersionParsing();
testDefinitionMechanics();
process.stdout.write("importer.test.js: ok\n");
