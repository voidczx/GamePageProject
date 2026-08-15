"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const deployedDataChunks = ["generated/wotr-2.7.0x.site-core.js", "generated/wotr-2.7.0x.site-definitions.js"];
deployedDataChunks.forEach((file) => {
  assert.ok(fs.statSync(path.join(root, file)).size < 25 * 1024 * 1024, `${file} must stay below Cloudflare Pages' 25 MiB asset limit`);
});
const deployedHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
deployedDataChunks.forEach((file) => assert.ok(deployedHtml.includes(file.replace("generated/", "generated/")), `${file} must be loaded by the production page`));

class FakeClassList {
  add() {}
  remove() {}
  toggle() {}
}

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
    crypto: { randomUUID: () => "test-id" },
    clearTimeout,
    setTimeout,
    scrollTo() {},
    confirm: () => true,
    requestAnimationFrame: (callback) => callback()
  };
  const context = vm.createContext({ window, document, localStorage, console, clearTimeout, setTimeout, requestAnimationFrame: window.requestAnimationFrame, Blob, URL, FileReader: class {}, structuredClone });
  ["data.js", "expanded-data.js", "choice-data.js", "mythic-data.js", "generated/wotr-2.7.0x.site-core.js", "generated/wotr-2.7.0x.site-definitions.js", "owlcat-runtime.js"].forEach((file) => vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file }));
  const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8").replace(/\}\)\(\);\s*$/, "window.__WOTR_TEST__ = { ui, store, elements, currentCharacter, currentCompanion, normalPrefix, normalCandidate, featSlotsForStep, featureSlotsForStep, resolvedLevelCursor, renderLevelStage, renderBackgroundStage, renderRaceStage, renderFaithStage, renderFeats, renderPaths, activeCatalogItems, parameterOptionsForItem, nativeRequirementResults, isEligible, classChoices, commitLevel, commitMythic, rebuildCharacter, parameterLabel, sheetWarnings, skillPointBudgetForStep, skillProfile };\n})();");
  vm.runInContext(appSource, context, { filename: "app.js" });
  return { context, window, elements, api: window.__WOTR_TEST__, data: window.WOTR_DATA, storage };
}

const runtime = makeRuntime();
const { api, data } = runtime;

assert.equal(data.spells.length, 671, "runtime spell catalog must use every installed 2.7.0x spell-list member");
assert.equal(data.legacySpells.length, 0, "all legacy spell ids must map without losing existing saves");
const fireball = data.spells.find((item) => item.sourceInternalName === "Fireball");
assert.equal(fireball.name, "火球术");
assert.equal(fireball.school, "塑能");
assert.equal(data.owlcatSpellLevelForClass(fireball, "wizard"), 3);
assert.equal(data.owlcatMaxSpellLevelForClass("wizard", 1), 1);
assert.equal(data.owlcatMaxSpellLevelForClass("wizard", 3), 2);
assert.equal(data.owlcatMaxSpellLevelForClass("wizard", 17), 9);
assert.equal(data.owlcatMaxSpellLevelForClass("paladin", 3), 0);
assert.equal(data.owlcatMaxSpellLevelForClass("paladin", 4), 1);
const arcaneTricksterWizard = {
  normalSteps: [
    ...Array.from({ length: 3 }, (_, index) => ({ level: index + 1, classId: "wizard", archetypeId: null, featureChoices: [] })),
    { level: 4, classId: "arcane-trickster", archetypeId: null, featureChoices: [{ optionId: "164cc8afe6cd56e489a913cf680e5fa1" }] },
    { level: 5, classId: "arcane-trickster", archetypeId: null, featureChoices: [] }
  ]
};
assert.deepEqual(Array.from(data.owlcatCharacterSpellbooks(arcaneTricksterWizard), (entry) => [entry.internalName, entry.effectiveClassLevel, entry.maxSpellLevel]), [["WizardSpellbook", 5, 3]], "prestige spellbook selections must advance the selected native spellbook on every eligible class level");
const dragonDiscipleSorcerer = {
  normalSteps: [
    ...Array.from({ length: 4 }, (_, index) => ({ level: index + 1, classId: "sorcerer", archetypeId: null, featureChoices: [] })),
    ...Array.from({ length: 10 }, (_, index) => ({
      level: index + 5,
      classId: "dragon-disciple",
      archetypeId: null,
      featureChoices: index === 1 ? [{ optionId: "fa2a2469c9ba6d54b8fc2356f4fc0e9e" }] : []
    }))
  ]
};
assert.deepEqual(Array.from(data.owlcatCharacterSpellbooks(dragonDiscipleSorcerer), (entry) => [entry.internalName, entry.effectiveClassLevel]), [["SorcererSpellbook", 11]], "Dragon Disciple must advance 7 of 10 levels after native skips at 5 and 9");
assert.equal(JSON.stringify(data.owlcatKnownSpellPickSpec("sorcerer", 1)), JSON.stringify({ 1: 2 }));
assert.equal(JSON.stringify(data.owlcatKnownSpellPickSpec("sorcerer", 4)), JSON.stringify({ 2: 1 }));
assert.equal(data.owlcatClassStatBonus("fighter", "bab", 20), 20);
assert.equal(data.owlcatClassStatBonus("wizard", "bab", 20), 10);
assert.equal(data.owlcatClassStatBonus("wizard", "will", 20), 12);
assert.ok(data.owlcatAutoFeaturesForClass("fighter", 1).some((item) => item.name === "战士擅长"));
const fireDomain = data.domains.find((item) => item.id === "fire");
assert.deepEqual(Array.from(fireDomain.levelFeatures, (item) => [item.level, item.name]), [[1, "火焰领域"], [6, "火焰抗性"], [12, "火焰抗性"], [20, "火焰免疫"]]);
assert.deepEqual(Array.from(fireDomain.domainSpells, (item) => item.level), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
assert.ok(data.deities.find((item) => item.id === "achaekek").domains.includes("murder"));
assert.equal(data.deities.find((item) => item.id === "achaekek").weapon, "锯齿刀");
assert.deepEqual(Array.from(data.owlcatSlotsForClass("cleric", 1), (slot) => slot.label), ["引导能量"], "domain selections must use the dedicated deity-filtered domain slots once");
const clericDomainSlots = data.owlcatDomainSlotsForClass("cleric", 1);
assert.equal(clericDomainSlots.length, 2, "Cleric level 1 must preserve both distinct source domain selection occurrences");
assert.notEqual(clericDomainSlots[0].sourceGuid, clericDomainSlots[1].sourceGuid);
assert.equal(clericDomainSlots[0].allowedDomainIds.length, 37);
assert.equal(clericDomainSlots[1].allowedDomainIds.length, 36, "secondary domain wrappers must map back to canonical domain ids");
assert.equal(data.owlcatDomainSlotsForClass("inquisitor", 1).length, 1);

assert.equal(data.archetypes.length, 196);
assert.equal(data.archetypes.filter((item) => item.name === item.nameEn).length, 0, "所有原型应有中文显示名");
assert.equal(data.backgrounds.length, 39);
assert.equal(data.legacyBackgrounds.length, 0, "旧版 39 个出身 ID 应全部映射到本机蓝图");
assert.equal(data.technicalBackgrounds.length, 2, "同伴专用背景不得混入主角可选池");
assert.ok(data.heritages.length >= 40);
assert.ok(data.deities.length >= 27);
assert.equal(new Set(data.feats.filter((item) => item.sourceGuid).map((item) => item.sourceGuid)).size, 276);
assert.equal(new Set(data.mythic.filter((item) => item.sourceGuid).map((item) => item.sourceGuid)).size, 115);
assert.ok(data.feats.filter((item) => item.parameter).length >= 16);
assert.ok(data.mythic.filter((item) => item.parameter).length >= 6);
assert.equal(new Set(data.pathAbilities.map((item) => item.id)).size, data.pathAbilities.length, "path option ids must remain unique when one source option appears in multiple rank pools");
assert.equal(data.ruleCatalog.classFeatures.length, 3029, "all installed class/archetype progression choices must be indexed");
assert.equal(data.ruleCatalog.pathFeatures.length, 923, "all installed path progression choices must be indexed");
assert.equal(data.ruleCatalog.domainFeatures.length, 276, "all installed domain progression choices must be indexed");
assert.equal(data.ruleCatalog.abilities.length, 3755, "all imported active and activatable abilities must be indexed");
assert.equal(data.ruleCatalog.abilities.filter((item) => item.officialLocalized).length, 3605);
assert.equal(data.ruleCatalog.abilities.filter((item) => item.abilityKind === "Spell").length, 1132);
assert.equal(data.installedWeaponOptions.length, 78, "weapon parameters must use every unique installed WeaponCategory, not the old 19-item sample");
assert.ok(data.installedWeaponOptions.every((item) => item.name && item.nativeValue));
const pointBlankMaster = data.feats.find((item) => item.sourceInternalName === "PointBlankMaster");
assert.ok(api.parameterOptionsForItem(pointBlankMaster).every((item) => item.attackType === "Ranged"), "native Ranged weapon filters must narrow parameter choices");
const parameterizedFeatureOptions = Object.values(data.featureGroups).flatMap((group) => group.options || []).filter((item) => item.parameter);
assert.equal(new Set(parameterizedFeatureOptions.map((item) => item.sourceGuid)).size, 122, "every source parametrized feature must retain a detail selector");
assert.ok(parameterizedFeatureOptions.every((item) => data.choiceParameterTypes[item.parameter.type]?.options?.length), "every parametrized feature must resolve to a non-empty installed-data option pool");
const goldDragonSteps = data.mythicPathRules["gold-dragon"].steps;
assert.deepEqual([goldDragonSteps[8].length, goldDragonSteps[9].length, goldDragonSteps[10].length], [1, 4, 2], "2.7.0x Golden Dragon must preserve repeated source selection occurrences: breath 1/1/2 and three rank-9 dragon feats");
assert.equal(goldDragonSteps[9].filter((slot) => slot.label === "龙族专长" && slot.ignorePrerequisites).length, 3);
assert.equal(goldDragonSteps[8][0].ignorePrerequisites, false, "only Golden Dragon feat slots, not breath upgrades, ignore prerequisites");
assert.ok(data.mythicPathRules.azata.steps[4].some((slot) => slot.nativeRequirements.length), "Azata Life-Bonding Friendship extra slot must retain its source progression requirements");
const tricksterRankThree = data.owlcatPathProgressions.trickster.levels.find((level) => level.rank === 3);
assert.equal(new Set(tricksterRankThree.auto.map((item) => item.sourceGuid)).size, tricksterRankThree.auto.length, "same-rank automatic grants must be aggregated by source GUID");
assert.equal(tricksterRankThree.auto.find((item) => item.name === "偷袭").count, 2, "repeated rank grants must preserve their stack count instead of being discarded");
assert.ok(data.mythicPathRules.trickster.rankGrants[3].includes("偷袭 ×2"));
const angelSpellbookSlots = data.mythicPathRules.angel.steps[3].filter((slot) => /spellbook/.test(slot.id));
const angelSpellbookOptions = data.pathAbilities.filter((item) => item.path === "angel" && item.group === angelSpellbookSlots[0]?.groupId);
assert.equal(angelSpellbookSlots.length, 1, "Angel rank 3 spellbook prompt must be a persisted path choice, not an automatic text grant");
assert.equal(angelSpellbookOptions.length, 8, "Angel spellbook choice must contain standalone plus all seven installed allowed spellbooks");
assert.equal(data.pathAbilities.filter((item) => item.path === "lich" && item.nativeMechanics?.spellbookAdvance?.kind === "merge-mythic-spellbook").length, 21);
const clericSpellbookGuid = data.owlcatSpellbookForClass("cleric").sourceGuid;
const angelMerge = angelSpellbookOptions.find((item) => item.requiresSpellbookGuid === clericSpellbookGuid);
const angelStandalone = angelSpellbookOptions.find((item) => !item.requiresSpellbookGuid);
const clericTen = Array.from({ length: 10 }, (_, index) => ({ level: index + 1, classId: "cleric", archetypeId: null, featureChoices: [] }));
const mythicWith = (optionId) => [
  { rank: 1, pathId: null, pathChoices: [] },
  { rank: 2, pathId: null, pathChoices: [] },
  { rank: 3, pathId: "angel", pathChoices: [{ optionId }] }
];
const mergedAngelBook = data.owlcatCharacterSpellbooks({ normalSteps: clericTen, mythicSteps: mythicWith(angelMerge.id) })[0];
assert.deepEqual([mergedAngelBook.internalName, mergedAngelBook.effectiveClassLevel, mergedAngelBook.maxSpellLevel, mergedAngelBook.mergedPath], ["ClericSpellbook", 13, 7, "angel"]);
const standaloneAngelBook = data.owlcatCharacterSpellbooks({ normalSteps: clericTen, mythicSteps: mythicWith(angelStandalone.id) }).find((entry) => entry.internalName === "AngelSpellbook");
assert.deepEqual([standaloneAngelBook.effectiveClassLevel, standaloneAngelBook.maxSpellLevel], [6, 3], "standalone mythic spellbook must use the installed double-mythic-rank progression");

api.ui.featKind = "spell";
api.ui.featCategory = "全部";
api.ui.selectedRule = fireball.id;
api.renderFeats();
assert.match(api.elements.featList.innerHTML, /火球术/);
assert.match(api.elements.featDetail.innerHTML, /法表/);
api.ui.featKind = "class-feature";
api.ui.featCategory = "全部";
api.ui.selectedRule = data.ruleCatalog.classFeatures.find((item) => item.occurrences.some((occurrence) => occurrence.ownerName === "战士"))?.id;
api.renderFeats();
assert.match(api.elements.featDetail.innerHTML, /获得来源/);
api.renderPaths();
assert.match(api.elements.pathDetail.innerHTML, /AUTO GRANTS/);

const commander = api.currentCharacter();
commander.raceAbility = "str";
api.rebuildCharacter(commander);
const shieldBash = data.feats.find((item) => item.sourceInternalName === "ShieldBashFeature");
assert.ok(api.nativeRequirementResults(shieldBash, commander).filter((item) => /擅长/.test(item.text)).every((item) => item.met), "fighter auto-granted shield proficiencies must satisfy native prerequisites");
assert.equal(api.resolvedLevelCursor(commander), 0, "不完整的一级应自动打开一级，而不是跳到二级");
api.renderLevelStage();
assert.match(api.elements.workspace.innerHTML, /角色等级专长/);
assert.match(api.elements.workspace.innerHTML, /人类额外专长/);
assert.match(api.elements.workspace.innerHTML, /额外战斗专长/);

const prefix = api.normalPrefix(commander, 0);
const fighterSlots = api.featSlotsForStep(prefix, "fighter", null);
assert.deepEqual(fighterSlots.map((slot) => slot.source), ["general", "race:human", "class:fighter"]);
api.ui.nextFeatChoices = {
  [fighterSlots[0].id]: { id: "power-attack", params: {} },
  [fighterSlots[1].id]: { id: "dodge", params: {} },
  [fighterSlots[2].id]: { id: "weapon-focus", params: { weapon: "longsword" } }
};
api.ui.nextFeats = ["power-attack", "dodge", "weapon-focus"];
const skillCandidate = api.normalCandidate(prefix, "fighter", null, null);
skillCandidate.normalSteps[0].featChoices = fighterSlots.map((slot) => ({ slotId: slot.id, source: slot.source, ...api.ui.nextFeatChoices[slot.id] }));
api.rebuildCharacter(skillCandidate);
assert.deepEqual(api.skillPointBudgetForStep(prefix, skillCandidate), { rawTotal: 4, total: 4, classBase: 2, intelligence: 12, intelligenceModifier: 1, sourceBonus: 1, legacyCredit: 0 }, "人类战士一级应按安装版职业 2 + 智力调整 1 + 人类熟练 1 获得 4 点");
api.ui.nextSkillRanks = { athletics: 1, mobility: 1, world: 1, persuasion: 1 };
api.commitLevel();
assert.equal(commander.normalSteps[0].featChoices.length, 3);
assert.equal(commander.normalSteps[0].featChoices[2].params.weapon, "longsword");
assert.equal(commander.normalSteps[0].featChoices[1].source, "race:human");

const cavalierSlots = api.featureSlotsForStep(api.normalPrefix(commander, 0), "cavalier", null);
assert.ok(cavalierSlots.some((slot) => data.featureGroups[slot.groupId]?.name === "骑士团"), "骑将一级应由本机职业进度生成骑士团选择");

api.renderBackgroundStage();
assert.match(api.elements.workspace.innerHTML, /category-tabs/);
assert.match(api.elements.workspace.innerHTML, /贵族/);
const natureScholar = data.backgrounds.find((item) => item.id === "nature-scholar");
assert.ok(natureScholar?.parameter, "自然学者应保留蓝图中的嵌套祷言选择");
assert.equal(data.choiceParameterTypes[natureScholar.parameter.type].options.length, 5);
commander.background = "nature-scholar";
commander.backgroundParams = {};
api.renderBackgroundStage();
assert.match(api.elements.workspace.innerHTML, /data-background-param-slot="nature-scholar"/);
assert.match(api.elements.workspace.innerHTML, /神导术/);
api.renderRaceStage();
assert.match(api.elements.workspace.innerHTML, /子种族 \/ 血统/);
assert.match(api.elements.workspace.innerHTML, /data-heritage="human-base"/);
assert.match(api.elements.workspace.innerHTML, /data-race-ability="str"/);
assert.match(api.elements.workspace.innerHTML, /data-card-expand/, "long creation cards must expose a separate mobile description toggle");
const responsiveCss = fs.readFileSync(path.join(root, "style.css"), "utf8");
assert.match(responsiveCss, /@media \(max-width: 800px\)[\s\S]*-webkit-line-clamp: 4/);
assert.match(responsiveCss, /choice-card-wrap\.expanded[\s\S]*-webkit-line-clamp: unset/);
api.renderFaithStage();
assert.match(api.elements.workspace.innerHTML, /阵营与信仰/);
assert.match(api.elements.workspace.innerHTML, /无神论/);
assert.equal(api.classChoices(api.normalPrefix(commander, 0)).find((item) => item.entry.id === "cleric").eligible, false, "未选择神祇时神职职业不可选");
commander.alignment = "LG";
commander.deity = "iomedae";
assert.equal(api.classChoices(api.normalPrefix(commander, 0)).find((item) => item.entry.id === "cleric").eligible, true, "选择兼容神祇后神职职业可选");

api.ui.nextMythic = "ascendant-element";
api.ui.nextMythicParams = { energy: "fire" };
api.commitMythic();
assert.equal(commander.mythicSteps[0].commonChoice.id, "ascendant-element");
assert.equal(commander.mythicSteps[0].commonChoice.params.energy, "fire");
assert.equal(commander.mythicSteps[0].commonChoice.source, "mythic:common");
assert.match(api.parameterLabel(data.mythic.find((item) => item.id === "ascendant-element"), { energy: "fire" }), /火焰/);
api.ui.mythicCursor = null;
api.ui.mythicDraftKey = "test-preserve-draft";
api.ui.nextMythic = "extra-mythic-ability";
api.ui.nextMythicParams = { mythicAbility: "ascendant-element", nestedParams: { energy: "cold" } };
api.commitMythic();
assert.equal(commander.mythicSteps[1].commonChoice.params.nestedParams.energy, "cold");
assert.match(api.parameterLabel(data.mythic.find((item) => item.id === "extra-mythic-ability"), commander.mythicSteps[1].commonChoice.params), /寒冷/);

const stored = JSON.parse(runtime.storage.get("WOTR_BUILD_ARCHIVE_V4"));
assert.equal(stored.version, 4);
assert.equal(stored.slots[stored.activeSlot].characters.commander.normalSteps[0].featChoices[2].params.weapon, "longsword");
assert.equal(stored.slots[stored.activeSlot].characters.commander.normalSteps[0].skillRanks.athletics, 1);

const legacy = makeRuntime({
  WOTR_BUILD_ARCHIVE_V2: JSON.stringify({
    version: 2,
    activeSlot: "legacy",
    slots: { legacy: { name: "旧存档", activeCharacter: "commander", characters: { commander: { race: "human", background: "leader", alignment: "LG", levels: ["fighter"], feats: ["power-attack"], mythicRank: 1, mythicChoices: ["last-stand"] } } } }
  })
});
assert.equal(legacy.api.store.version, 4);
assert.ok(Array.isArray(legacy.api.currentCharacter().normalSteps[0].featChoices));
assert.equal(legacy.api.currentCharacter().legacyManual.feats[0], "power-attack", "无法证明取得等级的 V1/V2 聚合专长应无损保留");

const skillLegacy = makeRuntime({
  WOTR_BUILD_ARCHIVE_V3: JSON.stringify({
    version: 3,
    activeSlot: "skill-legacy",
    slots: { "skill-legacy": { name: "技能旧存档", activeCharacter: "commander", characters: { commander: { race: "human", heritage: "human-base", background: "leader", alignment: "N", attributes: { str: 16, dex: 14, con: 14, int: 12, wis: 10, cha: 10 }, skills: { athletics: 1 }, normalSteps: [{ level: 1, classId: "fighter", featChoices: [], featureChoices: [], domainIds: [], knownSpellIds: [] }] } } } }
  })
});
const migratedSkillCharacter = skillLegacy.api.currentCharacter();
assert.equal(migratedSkillCharacter.legacySkillRanks.athletics, 1, "V3 flat skill ranks must be preserved without inventing an acquisition level");
assert.equal(skillLegacy.api.skillPointBudgetForStep(skillLegacy.api.normalPrefix(migratedSkillCharacter, 0), skillLegacy.api.normalPrefix(migratedSkillCharacter, 1)).legacyCredit, 1, "legacy ranks must consume the earliest unplaced budget instead of creating extra ranks");

console.log("structure.test.js: all assertions passed");
