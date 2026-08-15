"use strict";

const assert = require("assert");
const {
  ROOT_GUIDS,
  adaptOwlcatSnapshot,
  resolveSourceGuid
} = require("../tools/lib/owlcat-site-adapter");

const guid = (value) => Number(value).toString(16).padStart(32, "0");
const localized = (name, description) => ({ name, description, shortDescription: null });
const definition = (sourceGuid, internalName, name, description, extra = {}) => ({
  guid: sourceGuid,
  internalName,
  blueprintType: "BlueprintFeature",
  blueprintPath: `Fixture/${internalName}.jbp`,
  localization: localized(name, description),
  requirements: [],
  availability: { scope: "source-default" },
  ...extra
});

function fixtureSnapshot() {
  const powerAttack = guid(1);
  const nestedSelection = guid(2);
  const nestedLeaf = guid(3);
  const duplicateA = guid(4);
  const duplicateB = guid(5);
  const mythicAbility = guid(6);
  const mythicFeat = guid(7);
  const domain = guid(8);
  const fighter = guid(9);
  const duelist = guid(10);
  const eldritchScion = guid(11);
  const archetype = guid(12);
  const spellOne = guid(13);
  const spellTwo = guid(14);
  const spellListOne = guid(15);
  const spellListTwo = guid(16);
  const classAbility = guid(19);
  const humanRace = guid(20);
  const humanRaceFeature = guid(21);
  const mythicClass = guid(22);
  const storyEtude = guid(23);
  const rootDefinitions = Object.entries(ROOT_GUIDS).map(([id, rootGuid]) => definition(rootGuid, `${id}Selection`, `${id}根`, `${id}根描述`));
  return {
    schemaVersion: 1,
    gameId: "pathfinder-wrath-of-the-righteous",
    gameVersion: "fixture",
    steamBuild: "fixture",
    hashes: { dataSha256: "fixture-data", snapshotSha256: "fixture-snapshot" },
    rootCatalog: {
      characterClasses: [fighter, duelist, eldritchScion],
      playableMythicClasses: [mythicClass],
      technicalMythicClasses: [],
      characterRaces: [humanRace],
      heritageByRace: [{ raceGuid: humanRace, raceId: "HumanRace", heritageSelectionGuid: null }],
      classArchetypes: [{ classGuid: fighter, archetypeGuid: archetype, blueprintPath: "Classes/Fighter/TestArchetype.jbp" }]
    },
    definitions: {
      feats: [
        ...rootDefinitions.filter((item) => [ROOT_GUIDS.basicFeats].includes(item.guid)),
        definition(powerAttack, "PowerAttackFeature", "猛力攻击", "以命中换伤害。", {
          requirements: [{ $type: "PrerequisiteStatValue", Stat: "Strength", Value: 13 }],
          parameter: { type: "WeaponCategory", customVariants: [], blueprintParameterVariants: [] },
          mechanics: { feature: { ranks: 1, groups: ["Feat"] } }
        }),
        definition(nestedSelection, "NestedFeatSelection", "嵌套专长选择", "选择另一个专长。"),
        definition(nestedLeaf, "NestedLeafFeature", "嵌套叶项", "嵌套选择中的叶项。"),
        definition(duplicateA, "DuplicateFeature", "重复名甲", "同 internalName 的第一项。"),
        definition(duplicateB, "DuplicateFeature", "重复名乙", "同 internalName 的第二项。")
      ],
      mythic: [
        ...rootDefinitions.filter((item) => [ROOT_GUIDS.mythicAbilities, ROOT_GUIDS.mythicFeats].includes(item.guid)),
        definition(mythicAbility, "LastStandFeature", "屹立不倒", "神话能力描述。"),
        definition(mythicFeat, "MythicPowerAttackFeature", "神话猛力攻击", "神话专长描述。")
      ],
      domains: [
        ...rootDefinitions.filter((item) => item.guid === ROOT_GUIDS.domains),
        definition(domain, "GoodDomainProgression", "善良领域", "领域描述。")
      ],
      classes: [
        definition(fighter, "FighterClass", "战士", "基础职业。"),
        definition(duelist, "DuelistClass", "决斗家", "进阶职业。"),
        definition(eldritchScion, "EldritchScionClass", "魔战士（奥法后继者）", "技术职业根。"),
        definition(archetype, "TestArchetype", "测试原型", "原型描述。")
      ],
      mythicClasses: [definition(mythicClass, "AeonMythicClass", null, null, {
        blueprintType: "BlueprintCharacterClass",
        requirements: [{ $type: "fixture, PrerequisiteEtude", m_Etude: `!bp_${storyEtude}`, NotPlaying: false }]
      })],
      spells: [
        definition(spellOne, "FixtureSpell", "测试法术", "测试法术描述。"),
        definition(spellTwo, "FixtureSpellTwo", "测试法术二", "第二法术描述。")
      ],
      abilities: [definition(classAbility, "FixtureClassAbility", "测试职业能力", "测试职业能力描述。", {
        blueprintType: "BlueprintAbility",
        mechanics: { ability: { type: "SpellLike", actionType: "Standard" } },
        components: [{ $type: "fixture, AbilityEffectRunAction", Actions: { Actions: [{ $type: "fixture, ContextActionApplyBuff" }] } }]
      })],
      etudes: [definition(storyEtude, "PlayerAcceptedAeonEyes", null, null, { blueprintType: "BlueprintEtude" })],
      races: [
        definition(humanRace, "HumanRace", "人类", "人类种族。", {
          blueprintType: "BlueprintRace",
          mechanics: { race: { raceId: "Human", size: "Medium", selectableRaceStat: true, features: [humanRaceFeature] } }
        }),
        definition(humanRaceFeature, "HumanSkilled", "技不压身", "每级增加技能点。", {
          components: [{ $type: "fixture, AddSkillPointPerCharacterLevel" }]
        })
      ]
    },
    choicePools: [
      { guid: ROOT_GUIDS.basicFeats, internalName: "BasicFeatSelection", options: [powerAttack, nestedSelection, duplicateA, duplicateB] },
      { guid: ROOT_GUIDS.mythicAbilities, internalName: "MythicAbilitySelection", options: [mythicAbility] },
      { guid: ROOT_GUIDS.mythicFeats, internalName: "MythicFeatSelection", options: [mythicFeat] },
      { guid: ROOT_GUIDS.domains, internalName: "DomainsSelection", options: [domain] },
      { guid: nestedSelection, internalName: "NestedFeatSelection", options: [nestedLeaf] }
    ],
    archetypePatches: [{ guid: archetype, classGuid: fighter, addFeatures: [{ level: 1, features: [nestedLeaf] }], removeFeatures: [], replaceSpellbook: null }],
    spellLists: [
      { guid: spellListOne, internalName: "ArcaneSpellList", levels: [{ spellLevel: 1, spells: [spellOne, spellOne, spellTwo] }] },
      { guid: spellListTwo, internalName: "DivineSpellList", levels: [{ spellLevel: 2, spells: [spellOne] }] }
    ],
    diagnostics: {
      excludedClassArchetypes: [{ classGuid: guid(17), archetypeGuid: guid(18), blueprintPath: "Units/NPC/Penta_UniqueBard.jbp" }]
    }
  };
}

const snapshot = fixtureSnapshot();
const snapshotBefore = JSON.stringify(snapshot);
const adapted = adaptOwlcatSnapshot(snapshot, { aliasesByGuid: { [guid(1)]: ["legacy-power-attack"] } });

assert.equal(JSON.stringify(snapshot), snapshotBefore, "adapter must not mutate its snapshot input");
assert.deepEqual(adapted, adaptOwlcatSnapshot(snapshot, { aliasesByGuid: { [guid(1)]: ["legacy-power-attack"] } }), "adapter output must be deterministic");
assert.equal(adapted.counts.basicFeatDirectOptions, 4);
assert.equal(adapted.counts.mythicAbilityDirectOptions, 1);
assert.equal(adapted.counts.mythicFeatDirectOptions, 1);
assert.equal(adapted.counts.domainDirectOptions, 1);

const powerAttack = adapted.choiceRoots.basicFeats.options.find((item) => item.sourceGuid === guid(1));
assert.equal(powerAttack.id, guid(1), "GUID must be the authoritative item id");
assert.equal(powerAttack.name, "猛力攻击");
assert.equal(powerAttack.description, "以命中换伤害。");
assert.deepEqual(powerAttack.requirements, snapshot.definitions.feats.find((item) => item.guid === guid(1)).requirements);
assert.deepEqual(powerAttack.parameter, snapshot.definitions.feats.find((item) => item.guid === guid(1)).parameter);
assert.deepEqual(powerAttack.mechanics, snapshot.definitions.feats.find((item) => item.guid === guid(1)).mechanics);
assert.ok(powerAttack.aliases.includes("power-attack"));
assert.equal(resolveSourceGuid(adapted, "legacy-power-attack"), guid(1));
assert.equal(resolveSourceGuid(adapted, guid(1).toUpperCase()), guid(1));

const nested = adapted.choiceRoots.basicFeats.options.find((item) => item.sourceGuid === guid(2));
assert.equal(nested.nestedSelectionGuid, guid(2), "direct roots must preserve a nested Selection GUID");
assert.deepEqual(nested.nestedOptionSourceGuids, [guid(3)]);

assert.deepEqual(adapted.aliasIndex["duplicate"], [guid(4), guid(5)], "duplicate internalName aliases must preserve every GUID without collision");
assert.throws(() => resolveSourceGuid(adapted, "duplicate"), /ambiguous alias/);

assert.deepEqual(adapted.classes.base.map((item) => item.internalName), ["FighterClass"]);
assert.deepEqual(adapted.classes.prestige.map((item) => item.internalName), ["DuelistClass"]);
assert.deepEqual(adapted.classes.technical.map((item) => item.internalName), ["EldritchScionClass"]);
assert.equal(adapted.classes.technical[0].technicalReason, "owlcat-technical-eldritch-scion-class");
assert.equal(adapted.archetypes.length, 1);
assert.equal(adapted.archetypes[0].classGuid, guid(9));
assert.equal(adapted.diagnostics.excludedArchetypes[0].reason, "companion-or-npc-penta-archetype");

assert.equal(adapted.spells.length, 2, "spell-list rows must merge into unique spell GUIDs");
assert.equal(adapted.counts.spellMemberships, 4, "source membership multiplicity must be preserved");
assert.equal(adapted.spells.find((item) => item.sourceGuid === guid(13)).spellLists.length, 3);
assert.equal(adapted.spells.find((item) => item.sourceGuid === guid(13)).spellLists[1].occurrence, 2);
assert.equal(adapted.counts.classFeatureDefinitions, 1, "archetype-added choices must enter the class feature catalog");
assert.equal(adapted.catalogs.classFeatures[0].sourceGuid, guid(3));
assert.equal(adapted.catalogs.classFeatures[0].occurrences[0].ownerType, "archetype");
assert.deepEqual(adapted.catalogs.abilities, [guid(19)], "every imported ability blueprint must be indexed");
assert.equal(adapted.selectionDefinitions[guid(19)].mechanics.ability.type, "SpellLike");
assert.equal(adapted.selectionDefinitions[guid(19)].componentCount, 1, "ability execution component counts must be preserved");
assert.deepEqual(adapted.selectionDefinitions[guid(19)].components, [], "deep executable action graphs must not be duplicated into the browser artifact");
assert.deepEqual(adapted.characterCreation.races[0].mechanics.race.features, [guid(21)]);
assert.equal(adapted.selectionDefinitions[guid(21)].internalName, "HumanSkilled", "race m_Features must enter the compact creation mechanics closure");
assert.equal(adapted.selectionDefinitions[guid(23)].internalName, "PlayerAcceptedAeonEyes", "mythic entry Etudes must survive in the compact site artifact");

const outputItems = [
  ...Object.values(adapted.choiceRoots).flatMap((root) => root.options),
  ...adapted.classes.base, ...adapted.classes.prestige, ...adapted.classes.technical,
  ...adapted.archetypes, ...adapted.spells
];
assert.ok(outputItems.every((item) => /^[0-9a-f]{32}$/.test(item.sourceGuid) && item.id === item.sourceGuid));

console.log("owlcat-site-adapter.test.js: pure fixture contract passed");
