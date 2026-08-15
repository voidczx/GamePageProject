"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");

class FakeClassList { add() {} remove() {} toggle() {} }
class FakeElement {
  constructor() {
    this.innerHTML = "";
    this.textContent = "";
    this.value = "";
    this.checked = false;
    this.hidden = false;
    this.files = [];
    this.dataset = {};
    this.style = {};
    this.classList = new FakeClassList();
  }
  addEventListener() {}
  querySelectorAll() { return []; }
  replaceChildren() { this.children = []; }
  append(node) { (this.children ||= []).push(node); }
  focus() {}
  select() {}
  closest() { return this; }
  hasAttribute() { return false; }
}

function makeRuntime(seed = {}) {
  const elements = new Map();
  const document = {
    activeElement: null,
    querySelector(selector) {
      if (!elements.has(selector)) elements.set(selector, new FakeElement());
      return elements.get(selector);
    },
    querySelectorAll() { return []; },
    createElement() { return new FakeElement(); },
    addEventListener() {}
  };
  const storage = new Map(Object.entries(seed));
  const localStorage = {
    getItem(key) { return storage.has(key) ? storage.get(key) : null; },
    setItem(key, value) { storage.set(key, String(value)); },
    removeItem(key) { storage.delete(key); }
  };
  const window = {
    document,
    localStorage,
    crypto: { randomUUID: () => "choice-test-id" },
    clearTimeout,
    setTimeout,
    scrollTo() {},
    confirm: () => true,
    requestAnimationFrame: (callback) => callback()
  };
  const context = vm.createContext({ window, document, localStorage, console, clearTimeout, setTimeout, requestAnimationFrame: window.requestAnimationFrame, Blob, URL, FileReader: class {}, structuredClone });
  ["data.js", "expanded-data.js", "choice-data.js", "mythic-data.js", "generated/wotr-2.7.0x.site.js", "owlcat-runtime.js"].forEach((file) => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
  const exports = [
    "ui", "store", "elements", "currentSave", "currentCharacter", "currentCompanion", "normalPrefix", "mythicPrefix",
    "featSlotsForStep", "featureSlotsForStep", "activeFeatureSlotsForStep", "resolvedLevelCursor", "currentStepComplete", "commitLevel",
    "rollbackLevel", "truncateLevel", "commitMythic", "truncateMythic", "rebuildCharacter", "parameterComplete",
    "isParameterizedChoiceEligible", "sheetWarnings", "renderBackgroundStage", "renderRaceStage", "renderFaithStage",
    "pathPickSlots", "activePathPickSlots", "pathChoiceIssues", "mythicProjection", "featureChoiceComplete", "featureNestedControl", "withCurrentFeatureChoices",
    "nativeRequirementResults", "itemRequirementResults", "parameterOptionsForItem", "sneakDice", "effectiveAttributes",
    "raceAbilityRequired", "activeRaceFeatureGuids", "backgroundEffectProfile", "proficiencyProfile", "storyStatus", "petProfile",
    "pathStoryEligible", "pathStoryRequirementResults", "projectCharacterSources", "characterEffectProfile", "catalogItemEffectProfile", "normalizeComponentEffects", "sourceFullStatValue", "staticStatValue", "overallStats"
  ];
  const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8").replace(/\}\)\(\);\s*$/, `window.__WOTR_CHOICE_TEST__ = { ${exports.join(", ")} };\n})();`);
  vm.runInContext(appSource, context, { filename: "app.js" });
  return { api: window.__WOTR_CHOICE_TEST__, data: window.WOTR_DATA, storage };
}

function setLevelDraft(api, classId, selections, featureSelections = []) {
  const character = api.currentCharacter();
  if (api.raceAbilityRequired(character) && !character.raceAbility) {
    character.raceAbility = "str";
    api.rebuildCharacter(character);
  }
  const cursor = api.resolvedLevelCursor(character);
  const prefix = api.normalPrefix(character, cursor);
  const featSlots = api.featSlotsForStep(prefix, classId, null);
  const featureSlots = api.featureSlotsForStep(prefix, classId, null);
  assert.equal(featSlots.length, selections.length, `unexpected ${classId} feat slot count at level ${cursor + 1}`);
  assert.equal(featureSlots.length, featureSelections.length, `unexpected ${classId} feature slot count at level ${cursor + 1}`);
  api.ui.nextClass = classId;
  api.ui.nextArchetype = null;
  api.ui.nextFeatChoices = Object.fromEntries(featSlots.map((slot, index) => [slot.id, selections[index]]));
  api.ui.nextFeatureChoices = Object.fromEntries(featureSlots.map((slot, index) => [slot.id, { optionId: featureSelections[index], params: {} }]));
  api.ui.nextDomains = [];
  api.ui.nextKnownSpells = [];
  api.commitLevel();
  return featSlots;
}

function appendRawFighterStep(api, selections) {
  const character = api.currentCharacter();
  const prefix = api.normalPrefix(character, character.normalSteps.length);
  const slots = api.featSlotsForStep(prefix, "fighter", null);
  assert.equal(slots.length, selections.length);
  character.normalSteps.push({
    level: character.normalSteps.length + 1,
    classId: "fighter",
    archetypeId: null,
    featChoices: slots.map((slot, index) => ({ slotId: slot.id, source: slot.source, id: selections[index].id, params: selections[index].params || {} })),
    featureChoices: [],
    domainIds: [],
    knownSpellIds: [],
    source: "user",
    locked: false
  });
  api.rebuildCharacter(character);
}

const runtime = makeRuntime();
const { api, data } = runtime;
const commander = api.currentCharacter();
const ascendant = data.mythic.find((item) => item.id === "ascendant-element");
const extraAbility = data.mythic.find((item) => item.id === "extra-mythic-ability");

["weapon-specialization", "point-blank-master", "fencing-grace", "slashing-grace"].forEach((id) => {
  assert.equal(data.feats.find((item) => item.id === id).parameter.matchFrom, "weapon-focus", `${id} must match the weapon chosen for Weapon Focus`);
});

assert.equal(api.parameterComplete(ascendant, { energy: "fire" }), true);
assert.equal(api.parameterComplete(ascendant, { energy: "not-an-energy" }), false, "parameter values must belong to their declared pool");
assert.equal(api.parameterComplete(extraAbility, { mythicAbility: "missing-ability" }), false, "unknown nested mythic abilities must not count as complete");
assert.equal(api.parameterComplete(extraAbility, { mythicAbility: "ascendant-element", nestedParams: { energy: "cold" } }), true);

const parameterizedFeature = Object.values(data.featureGroups).flatMap((group) => group.options || [])
  .find((option) => option.parameter && !(option.nativeRequirements || []).length && api.parameterOptionsForItem(option).length);
assert.ok(parameterizedFeature, "the installed-data feature pools must expose at least one parameterized class feature");
const parameterizedFeatureGroup = "__parameterizedFeatureTest";
data.featureGroups[parameterizedFeatureGroup] = { options: [parameterizedFeature] };
const parameterizedFeatureSlot = { id: "test:parameterized-feature", source: "test", groupId: parameterizedFeatureGroup };
const parameterizedFeatureValue = api.parameterOptionsForItem(parameterizedFeature)[0].id;
assert.equal(api.featureChoiceComplete(parameterizedFeatureSlot, { optionId: parameterizedFeature.id, params: {} }, commander), false, "a class-feature parameter slot must not accept an empty value");
assert.equal(api.featureChoiceComplete(parameterizedFeatureSlot, {
  optionId: parameterizedFeature.id,
  params: { [parameterizedFeature.parameter.type]: parameterizedFeatureValue }
}, commander), true, "a valid installed-data class-feature parameter must complete its slot");

const weaponFocus = data.feats.find((item) => item.id === "weapon-focus");
const parametrizedRequirement = {
  nativeRequirements: [{
    $type: "fixture, PrerequisiteParametrizedFeature",
    Group: "All",
    m_Feature: `!bp_${weaponFocus.sourceGuid}`,
    ParameterType: "WeaponCategory",
    WeaponCategory: "DuelingSword"
  }]
};
const parameterCharacter = api.currentCharacter();
parameterCharacter.normalSteps = [{
  level: 1,
  classId: "fighter",
  archetypeId: null,
  featChoices: [{ slotId: "test:weapon-focus", source: "test", id: "weapon-focus", params: { weapon: "dueling-sword" } }],
  featureChoices: [],
  domainIds: [],
  knownSpellIds: [],
  source: "test",
  locked: false
}];
api.rebuildCharacter(parameterCharacter);
assert.equal(api.nativeRequirementResults(parametrizedRequirement, parameterCharacter)[0].met, true, "a parametrized prerequisite must match the selected native WeaponCategory");
parameterCharacter.normalSteps[0].featChoices[0].params.weapon = "longsword";
api.rebuildCharacter(parameterCharacter);
assert.equal(api.nativeRequirementResults(parametrizedRequirement, parameterCharacter)[0].met, false, "a different Weapon Focus category must not satisfy the parametrized prerequisite");

const oneHandedPiercing = data.installedWeaponOptions.find((weapon) => weapon.attackType === "Melee" && !weapon.isTwoHanded && weapon.physicalForms.includes("Piercing"));
const twoHandedPiercing = data.installedWeaponOptions.find((weapon) => weapon.attackType === "Melee" && weapon.isTwoHanded && weapon.physicalForms.includes("Piercing"));
assert.ok(oneHandedPiercing && twoHandedPiercing, "the installed weapon catalog must expose both one- and two-handed piercing fixtures");
const fencingGraceRequirement = {
  nativeRequirements: [{
    $type: "fixture, PrerequisiteParametrizedWeaponSubcategory",
    Group: "All",
    m_Feature: `!bp_${weaponFocus.sourceGuid}`,
    SubCategory: "OneHandedPiercing"
  }]
};
parameterCharacter.normalSteps[0].featChoices[0].params.weapon = oneHandedPiercing.id;
api.rebuildCharacter(parameterCharacter);
assert.equal(api.nativeRequirementResults(fencingGraceRequirement, parameterCharacter)[0].met, true, "one-handed piercing specialization must accept the matching installed Weapon Focus form");
parameterCharacter.normalSteps[0].featChoices[0].params.weapon = twoHandedPiercing.id;
api.rebuildCharacter(parameterCharacter);
assert.equal(api.nativeRequirementResults(fencingGraceRequirement, parameterCharacter)[0].met, false, "one-handed piercing specialization must reject a two-handed Weapon Focus with the same damage form");

const animalPetDefinition = Object.values(data.owlcat.definitions).find((definition) => (definition.components || []).some((component) => String(component.$type || "").includes("AddPet") && component.Type === "AnimalCompanion"));
assert.ok(animalPetDefinition, "the installed mechanics closure must include an AddPet(AnimalCompanion) source");
const ownedAnimalPet = new Set([animalPetDefinition.sourceGuid]);
assert.ok(api.petProfile(parameterCharacter, ownedAnimalPet).types.has("AnimalCompanion"));
const petRequirement = { nativeRequirements: [{ $type: "fixture, PrerequisitePet", Group: "All", Type: "AnimalCompanion", NoCompanion: false }] };
assert.equal(api.nativeRequirementResults(petRequirement, parameterCharacter, ownedAnimalPet)[0].met, true, "PrerequisitePet must use the installed AddPet component instead of translated labels");
assert.equal(api.nativeRequirementResults(petRequirement, parameterCharacter, new Set())[0].met, false, "PrerequisitePet must fail when no matching AddPet source is active");

const sourcePowerAttack = data.feats.find((item) => item.id === "power-attack");
const sourcePowerAttackRequirements = api.itemRequirementResults(sourcePowerAttack, parameterCharacter);
assert.equal(sourcePowerAttackRequirements.length, sourcePowerAttack.nativeRequirements.length, "source-verified rules must not duplicate legacy and native prerequisites");
const technicalClassRequirement = api.nativeRequirementResults({
  nativeRequirements: [{ $type: "fixture, PrerequisiteClassLevel", Group: "All", m_CharacterClass: "!bp_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", Level: 1 }]
}, parameterCharacter)[0];
assert.doesNotMatch(technicalClassRequirement.text, /undefined/, "unlisted pet or technical class prerequisites must retain a traceable label");

const sneakRuntime = makeRuntime();
const sneakApi = sneakRuntime.api;
const sneakCharacter = sneakApi.currentCharacter();
sneakCharacter.normalSteps = Array.from({ length: 3 }, (_, index) => ({
  level: index + 1,
  classId: "rogue",
  archetypeId: null,
  featChoices: [],
  featureChoices: [],
  domainChoices: [],
  domainIds: [],
  knownSpellIds: [],
  source: "test",
  locked: false
}));
sneakCharacter.mythicSteps = [];
sneakApi.rebuildCharacter(sneakCharacter);
assert.equal(sneakApi.sneakDice(sneakCharacter), 2, "Sneak Attack dice must replay repeated installed progression features instead of estimating from class names");
const mythicSneakAttack = sneakRuntime.data.mythic.find((item) => item.sourceGuid === "d0a53bf03b978634890e5ebab4a90ecb");
assert.equal(sneakApi.nativeRequirementResults(mythicSneakAttack, sneakCharacter)[0].met, true, "PrerequisiteFullStatValue(SneakAttack) must accept a source-replayed Rogue");
sneakCharacter.normalSteps = [{
  level: 1,
  classId: "fighter",
  archetypeId: null,
  featChoices: [],
  featureChoices: [],
  domainChoices: [],
  domainIds: [],
  knownSpellIds: [],
  source: "test",
  locked: false
}];
sneakApi.rebuildCharacter(sneakCharacter);
assert.equal(sneakApi.nativeRequirementResults(mythicSneakAttack, sneakCharacter)[0].met, false, "a build without Sneak Attack must remain ineligible");
sneakCharacter.mythicSteps = [1, 2, 3].map((rank) => ({
  rank,
  commonChoice: null,
  commonChoiceId: null,
  pathId: rank === 3 ? "trickster" : null,
  pathChoices: [],
  pathPicks: [],
  source: "test"
}));
sneakApi.rebuildCharacter(sneakCharacter);
assert.equal(sneakApi.sneakDice(sneakCharacter), 2, "repeated Trickster rank grants must contribute their installed count to FullStatValue");

const warpriestRuntime = makeRuntime();
const warpriestApi = warpriestRuntime.api;
const warpriest = warpriestApi.currentCharacter();
warpriest.normalSteps = Array.from({ length: 4 }, (_, index) => ({
  level: index + 1,
  classId: "warpriest",
  archetypeId: null,
  featChoices: [],
  featureChoices: [],
  domainIds: [],
  knownSpellIds: [],
  source: "test",
  locked: false
}));
warpriestApi.rebuildCharacter(warpriest);
const fighterGuid = warpriestRuntime.data.classes.find((item) => item.id === "fighter").sourceGuid;
const warpriestQualification = {
  nativeRequirements: [
    { $type: "fixture, PrerequisiteClassLevel", Group: "All", m_CharacterClass: `!bp_${fighterGuid}`, Level: 4 },
    { $type: "fixture, PrerequisiteStatValue", Group: "All", Stat: "BaseAttackBonus", Value: 4 }
  ]
};
assert.deepEqual(
  Array.from(warpriestApi.nativeRequirementResults(warpriestQualification, warpriest), (entry) => entry.met),
  [true, true],
  "Warpriest fighter-level and full-BAB prerequisite substitutions must come from owned source components"
);

commander.mythicSteps = [{ rank: 1, commonChoice: { id: "ascendant-element", params: { energy: "fire" } }, commonChoiceId: "ascendant-element", pathId: null, pathChoices: [], pathPicks: [], source: "user" }];
api.rebuildCharacter(commander);
assert.equal(api.isParameterizedChoiceEligible(extraAbility, { mythicAbility: "ascendant-element", nestedParams: { energy: "fire" } }, commander, false, "mythic"), false, "extra mythic ability must not duplicate an owned parameterized ability");
assert.equal(api.isParameterizedChoiceEligible(extraAbility, { mythicAbility: "ascendant-element", nestedParams: { energy: "cold" } }, commander, false, "mythic"), true, "a distinct nested parameter must remain selectable");

commander.mythicSteps = [{ rank: 1, commonChoice: { id: "extra-mythic-ability", params: { mythicAbility: "ascendant-element", nestedParams: { energy: "cold" } } }, commonChoiceId: "extra-mythic-ability", pathId: null, pathChoices: [], pathPicks: [], source: "user" }];
api.rebuildCharacter(commander);
assert.ok(commander.mythicChoices.includes("ascendant-element"), "a nested extra ability must participate in effective ownership and prerequisites");
assert.ok(commander.effectiveMythicChoiceRecords.some((choice) => choice.id === "ascendant-element" && choice.params.energy === "cold"));
assert.equal(api.isParameterizedChoiceEligible(extraAbility, { mythicAbility: "ascendant-element", nestedParams: { energy: "cold" } }, commander, false, "mythic"), false, "nested ownership must prevent choosing the same effective ability twice");

commander.mythicSteps = [];
commander.normalSteps = [];
api.rebuildCharacter(commander);
const levelOneSources = api.featSlotsForStep(api.normalPrefix(commander, 0), "fighter", null).map((slot) => slot.source);
assert.deepEqual(levelOneSources, ["general", "race:human", "class:fighter"]);

setLevelDraft(api, "fighter", [
  { id: "power-attack", params: {} },
  { id: "dodge", params: {} },
  { id: "weapon-focus", params: { weapon: "longsword" } }
]);
assert.deepEqual(commander.normalSteps[0].featChoices.map((choice) => choice.source), levelOneSources, "slot source must persist with each choice");

api.ui.levelCursor = null;
setLevelDraft(api, "fighter", [{ id: "weapon-focus", params: { weapon: "rapier" } }]);
assert.equal(commander.normalSteps.length, 2);

api.ui.levelCursor = 0;
setLevelDraft(api, "fighter", [
  { id: "power-attack", params: {} },
  { id: "dodge", params: {} },
  { id: "weapon-focus", params: { weapon: "scimitar" } }
]);
assert.equal(commander.normalSteps.length, 2, "editing level one must preserve later step records");
assert.equal(commander.normalSteps[0].featChoices[2].params.weapon, "scimitar");
assert.equal(commander.normalSteps[1].featChoices[0].params.weapon, "rapier");
assert.ok(!commander.featChoices.some((choice) => choice.params.weapon === "longsword"), "derived state must be rebuilt after an early edit");

api.rollbackLevel();
assert.equal(commander.normalSteps.length, 1);
assert.ok(!commander.featChoices.some((choice) => choice.params.weapon === "rapier"), "rollback must remove the last step from derived state");

const cavalierRuntime = makeRuntime();
const cavalierApi = cavalierRuntime.api;
const cavalier = cavalierApi.currentCharacter();
cavalier.normalSteps = [];
cavalierApi.rebuildCharacter(cavalier);
const cavalierPrefix = cavalierApi.normalPrefix(cavalier, 0);
const cavalierFeatureSlots = cavalierApi.featureSlotsForStep(cavalierPrefix, "cavalier", null);
const cavalierFeatureSelections = cavalierFeatureSlots.map((slot) => {
  const options = cavalierRuntime.data.featureGroups[slot.groupId].options;
  return options.find((option) => option.name === "雄狮骑士团")?.id
    || options.find((option) => option.name === "动物伙伴（马）")?.id
    || options[0].id;
});
setLevelDraft(cavalierApi, "cavalier", [
  { id: "power-attack", params: {} },
  { id: "dodge", params: {} },
  { id: "shake-it-off", params: {} }
], cavalierFeatureSelections);
const orderChoice = cavalier.normalSteps[0].featureChoices.find((choice) => cavalierRuntime.data.featureGroups[choice.groupId].name === "骑士团");
assert.ok(orderChoice, "the installed-data Cavalier progression must expose its Order selection");
assert.equal(cavalierRuntime.data.featureGroups[orderChoice.groupId].options.find((option) => option.id === orderChoice.optionId).name, "雄狮骑士团");
assert.equal(orderChoice.source, "class:cavalier:owlcat");

const sameLevelGuid = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
cavalierRuntime.data.featureGroups["test:parent"] = { name: "前置选择", options: [{ id: "parent-option", name: "父选项", sourceGuid: sameLevelGuid, nativeRequirements: [] }] };
cavalierRuntime.data.featureGroups["test:dependent"] = { name: "后续选择", options: [{ id: "dependent-option", name: "依赖选项", nativeRequirements: [{ $type: "fixture, PrerequisiteFeature", Group: "All", HideInUI: false, m_Feature: `!bp_${sameLevelGuid}` }] }] };
const parentSlot = { id: "test-parent-slot", source: "test", groupId: "test:parent" };
const dependentSlot = { id: "test-dependent-slot", source: "test", groupId: "test:dependent" };
const parentChoice = { slotId: parentSlot.id, source: parentSlot.source, groupId: parentSlot.groupId, optionId: "parent-option", params: {} };
const dependentChoice = { slotId: dependentSlot.id, source: dependentSlot.source, groupId: dependentSlot.groupId, optionId: "dependent-option", params: {} };
assert.equal(cavalierRuntime.api.featureChoiceComplete(dependentSlot, dependentChoice, cavalier), false, "a dependent feature must be locked before its same-level parent selection");
const withParentChoice = cavalierRuntime.api.withCurrentFeatureChoices(cavalier, [parentChoice]);
assert.equal(cavalierRuntime.api.featureChoiceComplete(dependentSlot, dependentChoice, withParentChoice), true, "earlier same-level feature choices must unlock later slots during replay");

const conditionalClassRuntime = makeRuntime();
const conditionalApi = conditionalClassRuntime.api;
const conditionalCharacter = conditionalApi.currentCharacter();
conditionalCharacter.normalSteps = [{ level: 1, classId: "ranger", archetypeId: null, featChoices: [], featureChoices: [], featIds: [], domainIds: [], knownSpellIds: [], source: "test", locked: false }];
conditionalApi.rebuildCharacter(conditionalCharacter);
let rangerPrefix = conditionalApi.normalPrefix(conditionalCharacter, 1);
const rangerTwoSlot = conditionalApi.featureSlotsForStep(rangerPrefix, "ranger", null).find((slot) => (slot.nativeRequirements || []).some((requirement) => String(requirement.$type).includes("PrerequisiteNoFeature")));
assert.ok(rangerTwoSlot, "installed-data Ranger level 2 must expose its native conditional combat-style slot");
assert.equal(conditionalApi.activeFeatureSlotsForStep(rangerPrefix, "ranger", null, {}).some((slot) => slot.id === rangerTwoSlot.id), true);
const blockedFeatureGuid = String(rangerTwoSlot.nativeRequirements.find((requirement) => String(requirement.$type).includes("PrerequisiteNoFeature")).m_Feature).match(/[0-9a-f]{32}/i)[0].toLowerCase();
conditionalClassRuntime.data.featureGroups.__conditionalTest = { options: [{ id: "conditional-blocker", sourceGuid: blockedFeatureGuid }] };
conditionalCharacter.normalSteps[0].featureChoices = [{ slotId: "test:blocker", source: "test", groupId: "__conditionalTest", optionId: "conditional-blocker", params: {} }];
conditionalApi.rebuildCharacter(conditionalCharacter);
rangerPrefix = conditionalApi.normalPrefix(conditionalCharacter, 1);
assert.equal(conditionalApi.activeFeatureSlotsForStep(rangerPrefix, "ranger", null, {}).some((slot) => slot.id === rangerTwoSlot.id), false, "native class-slot requirements must react to replayed source facts instead of remaining hardcoded");

const slayerTalentGroup = Object.entries(data.featureGroups).find(([, group]) => group.name === "杀手绝技" && group.options.some((option) => option.name === "战斗特技"));
const combatTrick = slayerTalentGroup[1].options.find((option) => option.name === "战斗特技");
const combatTrickGroup = data.featureGroups[`owlcat:${combatTrick.nestedSelectionGuid}`];
const advancedTraining = combatTrickGroup.options.find((option) => option.name === "进阶武器训练");
const nestedHtml = api.featureNestedControl({ id: "nested-test", source: "test", groupId: slayerTalentGroup[0] }, { optionId: combatTrick.id, params: { nestedOptionIds: [advancedTraining.id] } }, false, commander);
assert.match(nestedHtml, /data-feature-nested-depth="0"/);
assert.match(nestedHtml, /data-feature-nested-depth="1"/, "nested class selections must render recursively instead of stopping after one child");

const rankTypeRuntime = makeRuntime();
rankTypeRuntime.api.ui.nextMythic = "extra-mythic-ability";
rankTypeRuntime.api.ui.nextMythicParams = { mythicAbility: "last-stand", nestedParams: {} };
rankTypeRuntime.api.commitMythic();
assert.equal(rankTypeRuntime.api.currentCharacter().mythicSteps.length, 0, "mythic feat choices must not be committed into an ability rank");

const pathRuntime = makeRuntime();
const pathApi = pathRuntime.api;
const aeonPath = pathRuntime.data.paths.find((path) => path.id === "aeon");
const aeonEtude = (aeonPath.nativeRequirements || []).find((requirement) => String(requirement.$type).includes("PrerequisiteEtude") && !requirement.NotPlaying);
const aeonEtudeGuid = String(aeonEtude.Etude || aeonEtude.m_Etude).match(/[0-9a-f]{32}/i)[0].toLowerCase();
assert.equal(pathApi.nativeRequirementResults({ nativeRequirements: [aeonEtude] }, pathApi.currentCharacter())[0].met, false, "a story-gated mythic path must stay locked when its installed Etude is not playing");
pathApi.currentSave().storyStates[aeonEtudeGuid] = "playing";
assert.equal(pathApi.storyStatus(aeonEtudeGuid), "playing");
assert.equal(pathApi.nativeRequirementResults({ nativeRequirements: [aeonEtude] }, pathApi.currentCharacter())[0].met, true, "an explicitly playing Etude must satisfy PrerequisiteEtude");
const notPlayingRequirement = { nativeRequirements: [{ ...aeonEtude, NotPlaying: true, Group: "All" }] };
assert.equal(pathApi.nativeRequirementResults(notPlayingRequirement, pathApi.currentCharacter())[0].met, false, "PrerequisiteEtude.NotPlaying must invert the game's IsPlaying check");
const etudeCondition = { nativeRequirements: [{ $type: "fixture, PrerequisiteCondition", Group: "All", Condition: { $type: "fixture, EtudeStatus", m_Etude: `!bp_${aeonEtudeGuid}`, Playing: true, Not: false } }] };
assert.equal(pathApi.nativeRequirementResults(etudeCondition, pathApi.currentCharacter())[0].met, true, "EtudeStatus conditions must read the same explicit campaign state");
for (const [id, params] of [["last-stand", {}], ["mythic-power-attack", {}]]) {
  pathApi.ui.mythicCursor = null;
  pathApi.ui.mythicDraftKey = null;
  pathApi.ui.nextMythic = id;
  pathApi.ui.nextMythicParams = params;
  pathApi.commitMythic();
}
assert.equal(pathApi.pathStoryEligible(aeonPath, pathApi.currentCharacter()), true, "the complete installed Aeon entry condition must pass at mythic rank 2 with its Etude playing");
const tricksterSlots = pathApi.pathPickSlots("trickster", 3);
const tricksterPath = pathRuntime.data.paths.find((path) => path.id === "trickster");
const tricksterEtude = (tricksterPath.nativeRequirements || []).find((requirement) => String(requirement.$type).includes("PrerequisiteEtude") && !requirement.NotPlaying);
pathApi.currentSave().storyStates[String(tricksterEtude.Etude || tricksterEtude.m_Etude).match(/[0-9a-f]{32}/i)[0].toLowerCase()] = "playing";
assert.equal(tricksterSlots.length, 1);
const tricksterOption = pathRuntime.data.pathAbilities.find((item) => item.path === "trickster" && item.group === tricksterSlots[0].groupId && !(item.nativeRequirements || []).length);
assert.ok(tricksterOption, "installed-data Trickster rank 3 pool must expose a selectable option");
pathApi.ui.mythicCursor = null;
pathApi.ui.mythicDraftKey = null;
pathApi.ui.nextMythic = "ever-ready";
pathApi.ui.nextMythicParams = {};
pathApi.ui.nextPath = "trickster";
pathApi.ui.nextPathChoices = { [tricksterSlots[0].id]: { optionId: tricksterOption.id, params: {} } };
pathApi.commitMythic();
const mythicThree = pathApi.currentCharacter().mythicSteps[2];
assert.equal(mythicThree.pathId, "trickster");
assert.equal(mythicThree.pathChoices[0].slotId, tricksterSlots[0].id, "path choices must be stored by stable mythic slot");
assert.equal(mythicThree.pathChoices[0].optionId, tricksterOption.id);
assert.equal(pathApi.mythicProjection(pathApi.currentCharacter()).activePathChoiceRecords[0].optionId, tricksterOption.id);

const legacyPathRuntime = makeRuntime();
const legacyPathCharacter = legacyPathRuntime.api.currentCharacter();
legacyPathCharacter.mythicSteps = [
  { rank: 1, commonChoice: null, pathId: null, pathChoices: [] },
  { rank: 2, commonChoice: null, pathId: null, pathChoices: [] },
  { rank: 3, commonChoice: null, pathId: "trickster", pathChoices: [{ slotId: "legacy:trick", source: "legacy", optionId: "trick-athletics-1", params: {} }] }
];
legacyPathRuntime.api.rebuildCharacter(legacyPathCharacter);
assert.equal(legacyPathCharacter.mythicSteps[2].pathChoices.length, 0, "obsolete hand-authored path ids must not masquerade as current installed-data choices");
assert.equal(legacyPathCharacter.legacyUnplacedPathChoices[0].optionId, "trick-athletics-1", "unmappable old path choices must be retained losslessly for manual reassignment");
assert.ok(legacyPathRuntime.api.sheetWarnings(legacyPathCharacter).some((warning) => /旧版道途选择无法唯一映射/.test(warning)));

const azataRuntime = makeRuntime();
const azataApi = azataRuntime.api;
const azataCharacter = azataApi.currentCharacter();
azataCharacter.mythicSteps = [
  { rank: 1, commonChoice: { id: "last-stand", params: {} }, commonChoiceId: "last-stand", pathId: null, pathChoices: [], pathPicks: [] },
  { rank: 2, commonChoice: { id: "mythic-power-attack", params: {} }, commonChoiceId: "mythic-power-attack", pathId: null, pathChoices: [], pathPicks: [] },
  { rank: 3, commonChoice: { id: "ever-ready", params: {} }, commonChoiceId: "ever-ready", pathId: "azata", pathChoices: [], pathPicks: [] }
];
azataApi.rebuildCharacter(azataCharacter);
const azataPrefix = azataApi.mythicPrefix(azataCharacter, 3);
const azataRawSlots = azataApi.pathPickSlots("azata", 4);
const superpowerSlot = azataRawSlots.find((slot) => !slot.nativeRequirements.length);
const friendshipSlot = azataRawSlots.find((slot) => slot.nativeRequirements.length);
assert.ok(superpowerSlot && friendshipSlot, "Azata rank 4 must retain source superpower and conditional friendship slots");
assert.deepEqual(Array.from(azataApi.activePathPickSlots(azataPrefix, "azata", 4, {}), (slot) => slot.id), [superpowerSlot.id], "conditional friendship slot must stay hidden before selecting Life-Bonding Friendship");
const friendship = azataRuntime.data.pathAbilities.find((item) => item.path === "azata" && item.group === superpowerSlot.groupId && item.sourceGuid === "cfad18f581584ac4ba066df067956477");
assert.ok(friendship?.parameter, "Life-Bonding Friendship must carry its nested teamwork-feat selection");
const teamworkFeat = azataRuntime.data.choiceParameterTypes[friendship.parameter.type].options[0].id;
const azataDraft = { [superpowerSlot.id]: { optionId: friendship.id, params: { [friendship.parameter.type]: teamworkFeat } } };
assert.equal(azataApi.activePathPickSlots(azataPrefix, "azata", 4, azataDraft).some((slot) => slot.id === friendshipSlot.id), true, "selecting Life-Bonding Friendship must reveal its source-conditional extra slot in the same replay state");
const friendshipExtra = azataRuntime.data.pathAbilities.find((item) => item.path === "azata" && item.group === friendshipSlot.groupId && item.sourceGuid === teamworkFeat);
azataDraft[friendshipSlot.id] = { optionId: friendshipExtra.id, params: {} };
assert.equal(azataApi.activePathPickSlots(azataPrefix, "azata", 4, azataDraft).some((slot) => slot.id === friendshipSlot.id), true, "a filled conditional slot must remain active while validating its own pre-effect state");
assert.ok(azataApi.pathChoiceIssues(azataPrefix, "azata", 4, azataDraft).some((issue) => /已经取得/.test(issue)), "nested teamwork-feat parameters must participate in source-guid duplicate checks");
const differentFriendshipExtra = azataRuntime.data.pathAbilities.find((item) => item.path === "azata" && item.group === friendshipSlot.groupId && item.sourceGuid !== teamworkFeat);
azataDraft[friendshipSlot.id] = { optionId: differentFriendshipExtra.id, params: {} };
assert.equal(azataApi.pathChoiceIssues(azataPrefix, "azata", 4, azataDraft).some((issue) => /已经取得/.test(issue)), false);

const auditRuntime = makeRuntime();
const auditApi = auditRuntime.api;
const audited = auditApi.currentCharacter();
audited.normalSteps = [];
auditApi.rebuildCharacter(audited);
appendRawFighterStep(auditApi, [{ id: "power-attack" }, { id: "dodge" }, { id: "weapon-focus", params: { weapon: "scimitar" } }]);
appendRawFighterStep(auditApi, [{ id: "cleave" }]);
appendRawFighterStep(auditApi, [{ id: "improved-initiative" }]);
appendRawFighterStep(auditApi, [{ id: "weapon-specialization", params: { weapon: "scimitar" } }]);
appendRawFighterStep(auditApi, [{ id: "toughness" }]);
appendRawFighterStep(auditApi, [{ id: "great-cleave" }]);
appendRawFighterStep(auditApi, [{ id: "iron-will" }]);
appendRawFighterStep(auditApi, [{ id: "greater-weapon-focus", params: { weapon: "longsword" } }]);
assert.equal(auditApi.currentStepComplete(audited, 7), false, "a later step whose parameter no longer matches an earlier feat must be incomplete");
assert.ok(auditApi.sheetWarnings(audited).some((warning) => /LV 8.*高等武器专攻/.test(warning)), "timeline audit must surface the mismatched downstream parameter");

audited.normalSteps[0].featChoices[1].source = "general";
auditApi.rebuildCharacter(audited);
assert.equal(auditApi.currentStepComplete(audited, 0), false, "a choice stored under the wrong source slot must be incomplete");

const invalidRelations = makeRuntime({
  WOTR_BUILD_ARCHIVE_V3: JSON.stringify({
    version: 3,
    activeSlot: "bad-relations",
    slots: {
      "bad-relations": {
        name: "bad relations",
        activeCharacter: "commander",
        characters: {
          commander: {
            race: "missing-race",
            heritage: "elf-base",
            background: "missing-background",
            alignment: "CE",
            deity: "iomedae",
            normalSteps: [{ level: 1, classId: "fighter", featChoices: [], featureChoices: [], domainIds: [], knownSpellIds: [] }]
          }
        }
      }
    }
  })
});
const normalized = invalidRelations.api.currentCharacter();
assert.equal(normalized.race, "human", "unknown races must fall back to the companion baseline");
assert.equal(normalized.heritage, "human-base", "heritage must belong to the normalized race");
assert.equal(normalized.background, "leader", "unknown background children must not survive normalization");
assert.equal(normalized.alignment, "CE");
assert.equal(normalized.deity, null, "a deity incompatible with the normalized alignment must be cleared");
assert.equal(normalized.raceAbility, null, "legacy saves without a selectable racial ability must remain incomplete instead of guessing an attribute");
assert.ok(invalidRelations.api.sheetWarnings(normalized).some((warning) => /种族属性 \+2/.test(warning)));

const ancestryRuntime = makeRuntime();
const ancestryApi = ancestryRuntime.api;
const ancestry = ancestryApi.currentCharacter();
ancestry.normalSteps = [];
ancestry.attributes = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
ancestry.attributesMode = "base";
ancestry.race = "human";
ancestry.heritage = "human-base";
ancestry.raceAbility = null;
ancestryApi.rebuildCharacter(ancestry);
assert.equal(ancestryApi.raceAbilityRequired(ancestry), true);
assert.equal(ancestryApi.effectiveAttributes(ancestry).str, 10, "an unfilled human +2 slot must not be guessed");
ancestry.raceAbility = "str";
ancestryApi.rebuildCharacter(ancestry);
assert.equal(ancestryApi.effectiveAttributes(ancestry).str, 12, "the human selectable +2 must affect final attributes");
assert.equal(ancestry.attributes.str, 10, "racial modifiers must not mutate the point-buy base score");
const strengthTwelve = { nativeRequirements: [{ $type: "fixture, PrerequisiteStatValue", Group: "All", Stat: "Strength", Value: 12 }] };
assert.equal(ancestryApi.nativeRequirementResults(strengthTwelve, ancestry)[0].met, true, "native stat prerequisites must use effective rather than point-buy attributes");

ancestry.race = "elf";
ancestry.heritage = "elf-base";
ancestry.raceAbility = null;
ancestryApi.rebuildCharacter(ancestry);
assert.deepEqual(
  Array.from(Object.entries(ancestryApi.effectiveAttributes(ancestry))),
  [["str", 10], ["dex", 12], ["con", 8], ["int", 12], ["wis", 10], ["cha", 10]],
  "fixed installed racial modifiers must replay from native components"
);
const elvenMagicGuid = "55edf82380a1c8540af6c6037d34f322";
assert.equal(ancestryApi.activeRaceFeatureGuids(ancestry).has(elvenMagicGuid), true);
ancestry.heritage = "elf-blightborn";
ancestryApi.rebuildCharacter(ancestry);
assert.equal(ancestryApi.activeRaceFeatureGuids(ancestry).has(elvenMagicGuid), false, "alternate heritage removals must run before active race features are closed");

ancestry.race = "human";
ancestry.heritage = "human-base";
ancestry.raceAbility = "str";
ancestry.normalSteps = Array.from({ length: 4 }, (_, index) => ({
  level: index + 1,
  classId: "fighter",
  archetypeId: null,
  abilityIncrease: index === 3 ? "str" : null,
  featChoices: [],
  featureChoices: [],
  domainChoices: [],
  domainIds: [],
  knownSpellIds: [],
  source: "test",
  locked: false
}));
ancestryApi.rebuildCharacter(ancestry);
assert.equal(ancestryApi.effectiveAttributes(ancestry).str, 13, "level 4 ability growth must replay from that exact level step");
ancestryApi.rollbackLevel();
assert.equal(ancestryApi.effectiveAttributes(ancestry).str, 12, "rolling back level 4 must remove its ability growth");

for (const raceId of ["human", "half-elf", "half-orc"]) {
  ancestry.race = raceId;
  ancestry.heritage = ancestryRuntime.data.heritages.find((item) => item.raceId === raceId)?.id || null;
  ancestry.raceAbility = null;
  assert.equal(ancestryApi.raceAbilityRequired(ancestry), true, `${raceId} must expose the installed selectable racial stat`);
}
ancestry.race = "elf";
ancestry.heritage = "elf-base";
assert.equal(ancestryApi.raceAbilityRequired(ancestry), false, "fixed-stat races must not receive a fabricated selectable +2 slot");

const backgroundRuntime = makeRuntime();
const backgroundApi = backgroundRuntime.api;
const farmhandCharacter = backgroundApi.currentCharacter();
farmhandCharacter.background = "farmhand";
farmhandCharacter.backgroundParams = {};
backgroundApi.rebuildCharacter(farmhandCharacter);
const farmhandProfile = backgroundApi.backgroundEffectProfile(farmhandCharacter);
assert.deepEqual([...farmhandProfile.classSkills].sort(), ["athletics", "nature"]);
assert.ok(farmhandProfile.weapon.has("Scythe"));
assert.ok(farmhandProfile.bonuses.some((bonus) => bonus.stat === "SaveFortitude" && bonus.value === 1));
assert.ok(backgroundApi.proficiencyProfile(farmhandCharacter).weapon.has("Scythe"), "background proficiency components must satisfy native proficiency prerequisites");

const pyromaniacCharacter = backgroundApi.currentCharacter();
pyromaniacCharacter.race = "gnome";
pyromaniacCharacter.heritage = "gnome-pyromaniac";
pyromaniacCharacter.background = "none";
pyromaniacCharacter.backgroundParams = {};
backgroundApi.rebuildCharacter(pyromaniacCharacter);
const pyromaniacEffects = backgroundApi.characterEffectProfile(pyromaniacCharacter);
assert.ok(pyromaniacEffects.effects.some((effect) => effect.category === "energy-resistance" && effect.energy === "Fire" && effect.value === 5), "heritage energy resistance must replay as a structured installed-data effect");

pyromaniacCharacter.background = "chelaxian-diabolist";
backgroundApi.rebuildCharacter(pyromaniacCharacter);
const conditionalBackground = backgroundApi.characterEffectProfile(pyromaniacCharacter);
assert.ok(conditionalBackground.effects.some((effect) => effect.type === "ACBonusAgainstFactOwner" && effect.category === "target-conditional"), "target-dependent background AC must remain conditional");
assert.equal(backgroundApi.sourceFullStatValue(pyromaniacCharacter, "AC", conditionalBackground), 0, "target-dependent AC must not leak into the unconditional sheet total");

assert.equal(backgroundApi.staticStatValue({ effects: [
  { category: "stat", stat: "AC", descriptor: "Competence", value: 2 },
  { category: "stat", stat: "AC", descriptor: "Competence", value: 3 },
  { category: "stat", stat: "AC", descriptor: "Competence", value: -2 },
  { category: "stat", stat: "AC", descriptor: "Racial", value: 1 },
  { category: "stat", stat: "AC", descriptor: "Racial", value: 2 }
] }, "AC"), 4, "installed descriptor rules must keep strongest competence bonus/penalty and stack racial modifiers");

const toughnessFeat = data.feats.find((item) => item.id === "toughness");
const toughnessPreview = backgroundApi.catalogItemEffectProfile(toughnessFeat, pyromaniacCharacter);
assert.ok(toughnessPreview.effects.some((effect) => effect.type === "ToughnessLogic" && effect.stat === "HitPoints" && effect.value === 3), "level-one Toughness must use the installed minimum +3 HP formula");
const mythicResolve = data.mythic.find((item) => item.sourceInternalName === "MythicResolveMythicFeat");
pyromaniacCharacter.mythicRank = 2;
const resolvePreview = backgroundApi.catalogItemEffectProfile(mythicResolve, pyromaniacCharacter);
assert.ok(resolvePreview.effects.some((effect) => effect.type === "ToughnessLogic" && effect.stat === "HitPoints" && effect.value === 2), "Mythic Resolve must project HP from the current mythic rank");
const mythicInitiative = data.mythic.find((item) => item.sourceInternalName === "ImprovedInitiativeMythicFeat");
const initiativePreview = backgroundApi.catalogItemEffectProfile(mythicInitiative, pyromaniacCharacter);
assert.ok(initiativePreview.effects.some((effect) => effect.type === "AddContextStatBonus" && effect.stat === "Initiative" && effect.value === 2 && effect.category === "stat"), "rank-based native stat bonuses must resolve from the current mythic rank");

const kitsuneHeritage = data.heritages.find((item) => item.raceId === "kitsune" && item.sourceGuid === "cd6cd774fb7cc844b8417193ee3a5ebe");
assert.ok(kitsuneHeritage, "the installed classic kitsune heritage must be present");
pyromaniacCharacter.race = "kitsune";
pyromaniacCharacter.heritage = kitsuneHeritage.id;
pyromaniacCharacter.background = "none";
pyromaniacCharacter.attributesMode = "base";
pyromaniacCharacter.attributes.cha = 8;
backgroundApi.rebuildCharacter(pyromaniacCharacter);
assert.equal(backgroundApi.projectCharacterSources(pyromaniacCharacter).owned.has("a212fff222f57a841aa88bc49a5962d9"), false, "AddFeatureOnSkill must not grant its fact below the installed effective-stat threshold");
pyromaniacCharacter.attributes.cha = 9;
backgroundApi.rebuildCharacter(pyromaniacCharacter);
assert.equal(backgroundApi.projectCharacterSources(pyromaniacCharacter).owned.has("a212fff222f57a841aa88bc49a5962d9"), true, "AddFeatureOnSkill must include racial modifiers when evaluating its installed threshold");

const raceIds = new Set(data.races.map((item) => item.id));
const alignmentIds = new Set(data.alignments.map((item) => item.id));
assert.ok(data.heritages.every((item) => raceIds.has(item.raceId)), "every heritage must belong to an existing race");
assert.ok(data.backgrounds.every((item) => typeof item.category === "string" && item.category && item.id), "every background child must have a category and stable id");
assert.ok(data.deities.every((item) => item.alignments.every((id) => alignmentIds.has(id))), "every deity alignment must exist");
const spellbookOwners = new Set(data.spells.flatMap((item) => item.sourceSpellbooks || []).map((entry) => entry.owner));
const leakedSpellbookOwners = [...spellbookOwners].filter((owner) => /(?:Spellbook|MythicClass)$/.test(owner));
assert.deepEqual(leakedSpellbookOwners, [], `installed spellbook sources must not leak internal English owner ids: ${leakedSpellbookOwners.join(", ")}`);
assert.ok(spellbookOwners.has("金龙") && spellbookOwners.has("巫妖骷髅魔战士") && spellbookOwners.has("魔法欺诈师"), "special current-install spellbooks must have explicit Chinese owner names");

const alignmentCharacter = api.currentCharacter();
alignmentCharacter.alignment = "lawful-good";
const localizedAlignmentRequirement = api.nativeRequirementResults({ nativeRequirements: [{ $type: "fixture, PrerequisiteAlignment", Group: "All", Alignment: "LawfulGood, LawfulNeutral, LawfulEvil" }] }, alignmentCharacter)[0];
assert.equal(localizedAlignmentRequirement.met, true, "hyphenated site alignment ids must satisfy native alignment-axis prerequisites");
assert.ok(localizedAlignmentRequirement.text.includes("守序善良") && !localizedAlignmentRequirement.text.includes("LawfulGood"), "native alignment prerequisites must use Chinese labels");
alignmentCharacter.alignment = "LG";
assert.equal(api.nativeRequirementResults({ nativeRequirements: [{ $type: "fixture, PrerequisiteAlignment", Group: "All", Alignment: "Lawful" }] }, alignmentCharacter)[0].met, true, "canonical saved alignment ids must satisfy native alignment-axis prerequisites");
alignmentCharacter.alignment = "N";
assert.equal(api.nativeRequirementResults({ nativeRequirements: [{ $type: "fixture, PrerequisiteAlignment", Group: "All", Alignment: "NeutralGood, TrueNeutral, NeutralEvil, Chaotic" }] }, alignmentCharacter)[0].met, true, "true-neutral saved characters must satisfy current-install neutral class restrictions");
alignmentCharacter.alignment = "chaotic-good";
assert.equal(api.nativeRequirementResults({ nativeRequirements: [{ $type: "fixture, PrerequisiteAlignment", Group: "All", Alignment: "Lawful" }] }, alignmentCharacter)[0].met, false, "opposite alignment axes must remain incompatible");
const localizedProficiency = api.nativeRequirementResults({ nativeRequirements: [{
  $type: "fixture, PrerequisiteProficiency",
  Group: "All",
  WeaponProficiencies: ["Dagger", "Sling"],
  ArmorProficiencies: ["Buckler"]
}] }, alignmentCharacter)[0];
assert.ok(!localizedProficiency.text.includes("Dagger") && !localizedProficiency.text.includes("Sling") && !localizedProficiency.text.includes("Buckler"), "native proficiency prerequisites must not leak internal English enum names");
assert.ok(localizedProficiency.text.includes("匕首") && localizedProficiency.text.includes("投石索") && localizedProficiency.text.includes("小圆盾"), "native proficiency prerequisites must use installed Chinese weapon and armor names");
const localizedAlignmentEffect = api.normalizeComponentEffects({
  id: "fixture-alignment-spellbook",
  sourceGuid: null,
  originKind: "fixture",
  originLabel: "fixture",
  components: [{ $type: "fixture, ForbidSpellbookOnAlignmentDeviation", Alignment: "LawfulGood, NeutralGood, LawfulNeutral" }]
}, new Set(), alignmentCharacter)[0];
assert.ok(localizedAlignmentEffect.label.includes("守序善良") && localizedAlignmentEffect.label.includes("中立善良") && localizedAlignmentEffect.label.includes("守序中立"), "native spellbook alignment restrictions must use Chinese alignment names");
assert.ok(!localizedAlignmentEffect.label.includes("LawfulGood") && !localizedAlignmentEffect.label.includes("NeutralGood") && !localizedAlignmentEffect.label.includes("LawfulNeutral"), "native spellbook alignment restrictions must not leak enum ids");

const creationEffectUnknowns = new Map();
[...data.races, ...data.heritages, ...data.backgrounds].forEach((item) => {
  const profile = api.catalogItemEffectProfile(item, alignmentCharacter);
  profile.unknownTypes.forEach((count, type) => creationEffectUnknowns.set(type, (creationEffectUnknowns.get(type) || 0) + count));
});
assert.deepEqual([...creationEffectUnknowns.entries()], [], `all installed race, heritage, and background permanent components must be classified: ${JSON.stringify([...creationEffectUnknowns.entries()])}`);

const natureScholar = data.backgrounds.find((item) => item.id === "nature-scholar");
const natureOption = data.choiceParameterTypes[natureScholar.parameter.type].options[0].id;
const backgroundCharacter = api.currentCharacter();
backgroundCharacter.background = natureScholar.id;
backgroundCharacter.backgroundParams = {};
assert.ok(api.sheetWarnings(backgroundCharacter).some((warning) => warning.includes("自然学者") && warning.includes("细分选项")), "nested background choices must be required");
backgroundCharacter.backgroundParams = { [natureScholar.parameter.type]: natureOption };
assert.ok(api.parameterComplete(natureScholar, backgroundCharacter.backgroundParams), "a current-install background subchoice must validate through the shared parameter engine");
assert.ok(!api.sheetWarnings(backgroundCharacter).some((warning) => warning.includes("自然学者") && warning.includes("细分选项")), "a valid nested background choice must clear the warning");

const catalogItems = [
  ...data.feats,
  ...data.mythic,
  ...(data.ruleCatalog?.classFeatures || []),
  ...(data.ruleCatalog?.pathFeatures || []),
  ...(data.ruleCatalog?.domainFeatures || [])
];
const auditedEffectRoots = new Set();
const catalogEffectUnknowns = new Map();
catalogItems.forEach((item) => {
  if (!item.sourceGuid || auditedEffectRoots.has(item.sourceGuid)) return;
  auditedEffectRoots.add(item.sourceGuid);
  const definition = data.owlcat.definitions[item.sourceGuid];
  const occurrence = {
    id: `audit:${item.sourceGuid}`,
    sourceGuid: item.sourceGuid,
    components: definition?.components || item.nativeComponents || [],
    originKind: item.catalogKind || item.type || "catalog",
    originLabel: item.name
  };
  api.normalizeComponentEffects(occurrence, new Set([item.sourceGuid]), alignmentCharacter)
    .filter((effect) => !effect.modeled)
    .forEach((effect) => catalogEffectUnknowns.set(effect.type, (catalogEffectUnknowns.get(effect.type) || 0) + 1));
});
assert.deepEqual([...catalogEffectUnknowns.entries()], [], `every direct permanent component in ${auditedEffectRoots.size} installed catalog roots must be classified: ${JSON.stringify([...catalogEffectUnknowns.entries()])}`);
const definitionEffectUnknowns = new Map();
Object.entries(data.owlcat.definitions).forEach(([sourceGuid, definition]) => {
  api.normalizeComponentEffects({
    id: `definition-audit:${sourceGuid}`,
    sourceGuid,
    components: definition.components || [],
    originKind: "installed-definition",
    originLabel: definition.name || definition.internalName || sourceGuid
  }, new Set([sourceGuid]), alignmentCharacter)
    .filter((effect) => !effect.modeled)
    .forEach((effect) => definitionEffectUnknowns.set(effect.type, (definitionEffectUnknowns.get(effect.type) || 0) + 1));
});
assert.deepEqual([...definitionEffectUnknowns.entries()], [], `every component in ${Object.keys(data.owlcat.definitions).length} installed mechanics definitions must be classified: ${JSON.stringify([...definitionEffectUnknowns.entries()])}`);
if (process.env.WOTR_EFFECT_AUDIT === "1") console.log(`effect-audit: ${auditedEffectRoots.size} catalog roots / ${Object.keys(data.owlcat.definitions).length} mechanics definitions; 0 unmodeled occurrences / 0 component types`);

console.log("choice-regression.test.js: parameter, source-slot, feature, timeline, rollback, and relation assertions passed");
