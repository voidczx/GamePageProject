"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const MANIFEST_PATH = path.join(ROOT, "coverage-manifest.json");

function loadManifest(manifestPath = MANIFEST_PATH) {
  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}

function loadData(root = ROOT, files = loadManifest().generatedFrom) {
  const context = vm.createContext({ window: {} });
  files.forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
  });
  if (!context.window.WOTR_DATA) throw new Error("WOTR_DATA was not initialized");
  return context.window.WOTR_DATA;
}

function sha256(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function sha256File(filePath) {
  const hash = crypto.createHash("sha256");
  const buffer = Buffer.allocUnsafe(4 * 1024 * 1024);
  const handle = fs.openSync(filePath, "r");
  try {
    let bytesRead;
    do {
      bytesRead = fs.readSync(handle, buffer, 0, buffer.length, null);
      if (bytesRead) hash.update(buffer.subarray(0, bytesRead));
    } while (bytesRead);
  } finally {
    fs.closeSync(handle);
  }
  return hash.digest("hex");
}

function loadArtifactEvidence(filePath) {
  const resolvedPath = path.resolve(filePath);
  const stat = fs.statSync(resolvedPath);
  if (!stat.isFile()) throw new Error(`authoritative source is not a file: ${resolvedPath}`);
  return { path: resolvedPath, size: stat.size, sha256: sha256File(resolvedPath) };
}

function parseVersionInfo(content) {
  const source = Buffer.isBuffer(content) ? content : Buffer.from(String(content || ""), "utf8");
  const text = source.toString("utf8").trim();
  const versions = text.match(/\b\d+\.\d+\.\d+[a-z]?\b/gi) || [];
  return { raw: text, version: versions[0] || null, sha256: sha256(source) };
}

function parseSteamManifest(content) {
  const source = Buffer.isBuffer(content) ? content : Buffer.from(String(content || ""), "utf8");
  const text = source.toString("utf8");
  const value = (key) => text.match(new RegExp(`"${key}"\\s+"([^"]+)"`, "i"))?.[1] || null;
  const depots = {};
  const depotPattern = /"(\d+)"\s*\{([^{}]*)\}/g;
  for (const match of text.matchAll(depotPattern)) {
    const manifestId = match[2].match(/"manifest"\s+"([^"]+)"/i)?.[1];
    if (manifestId) depots[match[1]] = manifestId;
  }
  const appId = value("appid");
  const buildId = value("buildid");
  const semanticPayload = {
    appId,
    buildId,
    depots: Object.fromEntries(Object.entries(depots).sort(([left], [right]) => left.localeCompare(right, "en")))
  };
  return { appId, buildId, depots, sha256: sha256(source), semanticSha256: sha256(JSON.stringify(semanticPayload)) };
}

function loadVersionEvidence(options = {}) {
  const evidence = {};
  if (options.versionInfoPath) {
    evidence.versionInfoPath = path.resolve(options.versionInfoPath);
    evidence.versionInfo = parseVersionInfo(fs.readFileSync(evidence.versionInfoPath));
  }
  if (options.steamManifestPath) {
    evidence.steamManifestPath = path.resolve(options.steamManifestPath);
    evidence.steamManifest = parseSteamManifest(fs.readFileSync(evidence.steamManifestPath));
  }
  const artifactPaths = options.authoritativeSourcePaths || {};
  Object.entries(artifactPaths).forEach(([id, filePath]) => {
    if (!filePath) return;
    if (!evidence.authoritativeSources) evidence.authoritativeSources = {};
    evidence.authoritativeSources[id] = loadArtifactEvidence(filePath);
  });
  return evidence;
}

function setOf(items, key = (item) => item.id) {
  return new Set((items || []).map(key));
}

function sorted(values) {
  return [...values].sort((a, b) => String(a).localeCompare(String(b), "en"));
}

function metricsFor(data) {
  const backgrounds = data.backgrounds || [];
  const classes = data.classes || [];
  const mythic = data.mythic || [];
  const rules = data.classFeatureRules || [];
  const sourceDefinitions = Object.values(data.owlcat?.definitions || {});
  const nativeRequirementTypes = new Set(sourceDefinitions.flatMap((definition) => definition.requirements || [])
    .map((requirement) => String(requirement.$type || "").split(",").pop().trim()).filter(Boolean));
  const modeledNativeRequirementTypes = new Set([
    "PrerequisiteStatValue", "PrerequisiteFullStatValue", "PrerequisiteFeature", "PrerequisiteNoFeature",
    "PrerequisiteFeaturesFromList", "PrerequisiteCharacterLevel", "PrerequisiteClassLevel", "PrerequisiteNoClassLevel",
    "PrerequisiteArchetypeLevel", "PrerequisiteNoArchetype", "PrerequisiteClassSpellLevel", "PrerequisiteCasterTypeSpellLevel",
    "PrerequisiteAlignment", "PrerequisiteMainCharacter", "PrerequisiteIsPet", "PrerequisitePet",
    "PrerequisiteConditionForWeaponCategory", "PrerequisiteParametrizedWeaponSubcategory",
    "PrerequisiteAnySpellsInSpellbook", "PrerequisiteCasterType", "PrerequisiteCondition", "PrerequisiteMythicLevel",
    "PrerequisiteNotProficient", "PrerequisiteParametrizedFeature", "PrerequisitePlayerHasFeature",
    "PrerequisiteProficiency", "PrerequisiteSelectionPossible", "PrerequisiteEtude"
  ]);
  const parameterizedFeatureOptions = Object.values(data.featureGroups || {}).flatMap((group) => group.options || []).filter((item) => item.parameter);
  const sourceCounts = data.owlcat?.counts || {};
  return {
    abilities: (data.abilities || []).length,
    skills: (data.skills || []).length,
    races: (data.races || []).length,
    playableRaces: (data.races || []).filter((item) => item.playable !== false).length,
    heritages: (data.heritages || []).length,
    backgrounds: backgrounds.length,
    backgroundCategories: new Set(backgrounds.map((item) => item.category || "其他")).size,
    alignments: (data.alignments || []).length,
    deities: (data.deities || []).length,
    classes: classes.length,
    baseClasses: classes.filter((item) => item.group === "base").length,
    prestigeClasses: classes.filter((item) => item.group === "prestige").length,
    archetypes: (data.archetypes || []).length,
    feats: (data.feats || []).length,
    parameterizedFeats: (data.feats || []).filter((item) => item.parameter).length,
    mythic: mythic.length,
    mythicAbilities: mythic.filter((item) => item.type === "ability").length,
    mythicFeats: mythic.filter((item) => item.type === "feat").length,
    parameterizedMythic: mythic.filter((item) => item.parameter).length,
    domains: (data.domains || []).length,
    spells: (data.spells || []).length,
    paths: (data.paths || []).length,
    pathAbilities: (data.pathAbilities || []).length,
    companions: (data.companions || []).length,
    quests: (data.quests || []).length,
    questNodes: (data.quests || []).reduce((sum, quest) => sum + (quest.nodes || []).length, 0),
    parameterTypes: Object.keys(data.choiceParameterTypes || {}).length,
    featureGroups: Object.keys(data.featureGroups || {}).length,
    classFeatureRules: rules.length,
    classesWithFeatureRules: new Set(rules.map((rule) => rule.classId)).size,
    archetypesWithSpecificRules: new Set(rules.filter((rule) => rule.archetypeId).map((rule) => `${rule.classId}:${rule.archetypeId}`)).size,
    mythicPathRules: Object.keys(data.mythicPathRules || {}).length,
    sourceVerifiedFeats: (data.feats || []).filter((item) => item.sourceVerified).length,
    sourceVerifiedMythic: (data.mythic || []).filter((item) => item.sourceVerified).length,
    sourceSelectionPools: Number(sourceCounts.selectionPools) || 0,
    sourceSelectionDefinitions: Number(sourceCounts.selectionDefinitions) || 0,
    sourceImportedDefinitions: Number(sourceCounts.importedDefinitions) || 0,
    sourceWeaponTypes: Number(sourceCounts.weaponTypes) || 0,
    sourceWeaponCategories: Number(sourceCounts.weaponCategories) || 0,
    sourceArmorTypes: Number(sourceCounts.armorTypes) || 0,
    sourceShieldTypes: Number(sourceCounts.shieldTypes) || 0,
    installedWeaponOptions: (data.installedWeaponOptions || []).length,
    sourceParametrizedFeatures: Number(sourceCounts.parametrizedFeatures) || 0,
    parameterizedFeatureDefinitions: new Set(parameterizedFeatureOptions.map((item) => item.sourceGuid).filter(Boolean)).size,
    emptyParameterizedFeaturePools: new Set(parameterizedFeatureOptions.filter((item) => !(data.choiceParameterTypes?.[item.parameter.type]?.options || []).length).map((item) => item.sourceGuid)).size,
    classFeatureDefinitions: (data.ruleCatalog?.classFeatures || []).length,
    pathFeatureDefinitions: (data.ruleCatalog?.pathFeatures || []).length,
    domainFeatureDefinitions: (data.ruleCatalog?.domainFeatures || []).length,
    activeAbilityDefinitions: (data.ruleCatalog?.abilities || []).length,
    localizedActiveAbilityDefinitions: (data.ruleCatalog?.abilities || []).filter((item) => item.officialLocalized).length,
    classSourceProgressions: Object.keys(data.owlcatClassProgressionReady || {}).length,
    archetypeSourcePatches: (data.archetypes || []).filter((item) => item.sourceGuid && Array.isArray(item.addFeatures) && Array.isArray(item.removeFeatures)).length,
    mythicSourceProgressions: Object.keys(data.owlcatPathProgressions || {}).length,
    domainsWithSourceProgressions: (data.domains || []).filter((item) => Array.isArray(item.levelFeatures)).length,
    spellsWithSourceMechanics: (data.spells || []).filter((item) => item.sourceVerified && item.nativeMechanics).length,
    nativeRequirementTypes: nativeRequirementTypes.size,
    modeledNativeRequirementTypes: [...nativeRequirementTypes].filter((type) => modeledNativeRequirementTypes.has(type)).length,
    unmodeledNativeRequirementTypes: [...nativeRequirementTypes].filter((type) => !modeledNativeRequirementTypes.has(type)).length,
    mechanicsClosureVerified: data.owlcat?.sourceCoverage?.mechanicallyClosed === true ? 1 : 0
  };
}

function validateReferences(data, manifest) {
  const errors = [];
  const warnings = [];
  const pushError = (where, message) => errors.push({ where, message });
  const pushWarning = (where, message) => warnings.push({ where, message });

  const catalogs = {
    abilities: data.abilities,
    skills: data.skills,
    races: data.races,
    heritages: data.heritages,
    backgrounds: data.backgrounds,
    alignments: data.alignments,
    deities: data.deities,
    classes: data.classes,
    archetypes: data.archetypes,
    feats: data.feats,
    mythic: data.mythic,
    paths: data.paths,
    companions: data.companions,
    quests: data.quests,
    domains: data.domains,
    spells: data.spells,
    pathAbilities: data.pathAbilities
  };

  Object.entries(catalogs).forEach(([name, items]) => {
    if (!Array.isArray(items)) {
      pushError(name, "catalog is missing or not an array");
      return;
    }
    const seen = new Set();
    items.forEach((item, index) => {
      const key = name === "archetypes" ? `${item.baseClass}:${item.id}` : item?.id;
      if (!key) pushError(`${name}[${index}]`, "missing id");
      else if (seen.has(key)) pushError(`${name}.${key}`, "duplicate id");
      seen.add(key);
    });
  });

  const sourceDefinitions = data.owlcat?.definitions || {};
  Object.entries({
    classFeatures: data.ruleCatalog?.classFeatures,
    pathFeatures: data.ruleCatalog?.pathFeatures,
    domainFeatures: data.ruleCatalog?.domainFeatures,
    activeAbilities: data.ruleCatalog?.abilities
  }).forEach(([name, items]) => {
    if (!Array.isArray(items)) {
      pushError(`ruleCatalog.${name}`, "catalog is missing or not an array");
      return;
    }
    const seen = new Set();
    items.forEach((item, index) => {
      const guid = item?.sourceGuid;
      if (!guid || !sourceDefinitions[guid]) pushError(`ruleCatalog.${name}[${index}]`, `unknown source definition ${guid || "(missing)"}`);
      else if (seen.has(guid)) pushError(`ruleCatalog.${name}.${guid}`, "duplicate source definition");
      seen.add(guid);
      (item.occurrences || []).forEach((occurrence, occurrenceIndex) => {
        if (!occurrence.ownerGuid || !occurrence.ownerName) pushError(`ruleCatalog.${name}.${guid}.occurrences[${occurrenceIndex}]`, "missing source owner");
        if (!Array.isArray(occurrence.levels) || occurrence.levels.some((level) => !Number.isInteger(level) || level < 1 || level > 20)) {
          pushError(`ruleCatalog.${name}.${guid}.occurrences[${occurrenceIndex}].levels`, "invalid source levels");
        }
      });
    });
  });
  (data.ruleCatalog?.abilities || []).forEach((item) => {
    if (!/Blueprint(?:Ability|ActivatableAbility)$/.test(item.sourceBlueprintType || "")) pushError(`ruleCatalog.activeAbilities.${item.sourceGuid}`, `unexpected blueprint type ${item.sourceBlueprintType}`);
  });
  if (data.owlcat?.sourceCoverage && data.owlcat.sourceCoverage.mechanicallyClosed !== true) {
    pushError("owlcat.sourceCoverage.mechanicallyClosed", "configured mechanics whitelist is not reference-closed");
  }

  const abilityIds = setOf(data.abilities);
  const skillIds = setOf(data.skills);
  const raceIds = setOf(data.races);
  const alignmentIds = setOf(data.alignments);
  const classIds = setOf(data.classes);
  const featIds = setOf(data.feats);
  const mythicIds = setOf(data.mythic);
  const pathIds = setOf(data.paths);
  const domainIds = setOf(data.domains);
  const spellIds = setOf(data.spells);
  const pathAbilityIds = setOf(data.pathAbilities);
  const archetypeIds = setOf(data.archetypes, (item) => `${item.baseClass}:${item.id}`);
  const allowedCompanionClasses = new Set(manifest.allowedExternalReferences?.companionClassIds || []);
  const allowedMythicGroups = new Set(manifest.allowedExternalReferences?.mythicStepGroups || []);

  (data.heritages || []).forEach((item) => {
    if (!raceIds.has(item.raceId)) pushError(`heritages.${item.id}.raceId`, `unknown race ${item.raceId}`);
  });
  (data.backgrounds || []).forEach((item) => {
    (item.skills || []).forEach((id) => { if (!skillIds.has(id)) pushError(`backgrounds.${item.id}.skills`, `unknown skill ${id}`); });
  });
  (data.deities || []).forEach((item) => {
    (item.alignments || []).forEach((id) => { if (!alignmentIds.has(id)) pushError(`deities.${item.id}.alignments`, `unknown alignment ${id}`); });
    (item.domains || []).forEach((id) => { if (!domainIds.has(id)) pushError(`deities.${item.id}.domains`, `unknown domain ${id}`); });
  });
  (data.archetypes || []).forEach((item) => {
    if (!classIds.has(item.baseClass)) pushError(`archetypes.${item.baseClass}:${item.id}`, `unknown base class ${item.baseClass}`);
    if (!item.name || !item.nameEn) pushWarning(`archetypes.${item.baseClass}:${item.id}`, "missing Chinese or English display name");
  });
  (data.companions || []).forEach((item) => {
    if (!classIds.has(item.classId) && !allowedCompanionClasses.has(item.classId)) pushError(`companions.${item.id}.classId`, `unknown class ${item.classId}`);
    if (!raceIds.has(item.race)) pushError(`companions.${item.id}.race`, `unknown race ${item.race}`);
    if (item.path && !pathIds.has(item.path)) pushError(`companions.${item.id}.path`, `unknown path ${item.path}`);
  });

  function validateRequirement(req, where) {
    if (!req || typeof req !== "object") return;
    Object.keys(req.abilities || {}).forEach((id) => { if (!abilityIds.has(id)) pushError(`${where}.abilities`, `unknown ability ${id}`); });
    Object.keys(req.skills || {}).forEach((id) => { if (!skillIds.has(id)) pushError(`${where}.skills`, `unknown skill ${id}`); });
    (req.feats || []).forEach((id) => { if (!featIds.has(id)) pushError(`${where}.feats`, `unknown feat ${id}`); });
    (req.mythic || []).forEach((id) => { if (!mythicIds.has(id)) pushError(`${where}.mythic`, `unknown mythic item ${id}`); });
    (req.classAny || []).forEach((id) => { if (!classIds.has(id)) pushError(`${where}.classAny`, `unknown class ${id}`); });
    (req.raceAny || []).forEach((id) => { if (!raceIds.has(id)) pushError(`${where}.raceAny`, `unknown race ${id}`); });
    (req.oneOf || []).forEach((alternative, index) => validateRequirement(alternative, `${where}.oneOf[${index}]`));
  }
  [...(data.classes || []), ...(data.archetypes || []), ...(data.feats || []), ...(data.mythic || [])]
    .forEach((item) => validateRequirement(item.req, `${item.baseClass ? "archetypes" : "rules"}.${item.id}.req`));

  const parameterTypes = data.choiceParameterTypes || {};
  Object.entries(parameterTypes).forEach(([type, definition]) => {
    if (!Array.isArray(definition.options) || !definition.options.length) pushError(`choiceParameterTypes.${type}`, "option pool is empty");
    const seen = new Set();
    (definition.options || []).forEach((option, index) => {
      if (!option?.id) pushError(`choiceParameterTypes.${type}[${index}]`, "missing option id");
      else if (seen.has(option.id)) pushError(`choiceParameterTypes.${type}.${option.id}`, "duplicate option id");
      seen.add(option?.id);
    });
  });
  const installedWeaponOptions = data.installedWeaponOptions || [];
  if (installedWeaponOptions.length !== Number(data.owlcat?.counts?.weaponCategories || 0)) {
    pushError("installedWeaponOptions.sourceCoverage", "installed weapon parameter pool does not cover every source WeaponCategory");
  }
  const nativeWeaponCategories = new Set();
  installedWeaponOptions.forEach((option, index) => {
    const where = `installedWeaponOptions[${index}]`;
    if (!option.nativeValue) pushError(where, "missing native WeaponCategory value");
    else if (nativeWeaponCategories.has(option.nativeValue)) pushError(where, `duplicate native WeaponCategory ${option.nativeValue}`);
    nativeWeaponCategories.add(option.nativeValue);
    if (!option.name) pushError(where, "missing official localized weapon name");
    if (!option.sourceGuid || !sourceDefinitions[option.sourceGuid]) pushError(where, `unknown source weapon definition ${option.sourceGuid || "(missing)"}`);
  });
  (parameterTypes.weapon?.options || []).forEach((option) => {
    if (!nativeWeaponCategories.has(option.nativeValue)) pushError(`choiceParameterTypes.weapon.${option.id}`, `unknown native WeaponCategory ${option.nativeValue || "(missing)"}`);
  });
  [...(data.feats || []), ...(data.mythic || [])].forEach((item) => {
    if (!item.parameter) return;
    if (!parameterTypes[item.parameter.type]) pushError(`parameters.${item.id}`, `unknown parameter type ${item.parameter.type}`);
    if (item.parameter.matchFrom && !featIds.has(item.parameter.matchFrom) && !mythicIds.has(item.parameter.matchFrom)) {
      pushError(`parameters.${item.id}.matchFrom`, `unknown source ${item.parameter.matchFrom}`);
    }
  });
  (parameterTypes.domain?.options || []).forEach((option) => { if (!domainIds.has(option.id)) pushError(`choiceParameterTypes.domain.${option.id}`, "unknown domain option"); });
  (parameterTypes.spell?.options || []).forEach((option) => { if (!spellIds.has(option.id)) pushError(`choiceParameterTypes.spell.${option.id}`, "unknown spell option"); });
  (parameterTypes.mythicAbility?.options || []).forEach((option) => {
    const entry = (data.mythic || []).find((item) => item.id === option.id);
    if (!entry || entry.type !== "ability") pushError(`choiceParameterTypes.mythicAbility.${option.id}`, "not a mythic ability");
  });

  Object.entries(data.featureGroups || {}).forEach(([groupId, group]) => {
    if (!Array.isArray(group.options) || !group.options.length) pushError(`featureGroups.${groupId}`, "option pool is empty");
    const seen = new Set();
    (group.options || []).forEach((option, index) => {
      if (!option?.id) pushError(`featureGroups.${groupId}[${index}]`, "missing option id");
      else if (seen.has(option.id)) pushError(`featureGroups.${groupId}.${option.id}`, "duplicate option id");
      seen.add(option?.id);
    });
  });
  const sourceFeatureGroups = Object.values(data.featureGroups || {}).filter((group) => group.sourceGuid);
  if (new Set(sourceFeatureGroups.map((group) => group.sourceGuid)).size !== Number(data.owlcat?.counts?.selectionPools || 0)) {
    pushError("featureGroups.sourceCoverage", "not every imported selection pool is represented exactly once");
  }
  const sourceParametrized = new Set(Object.values(sourceDefinitions).filter((definition) => definition.parameter).map((definition) => definition.sourceGuid));
  const parameterizedFeatureOptions = Object.values(data.featureGroups || {}).flatMap((group) => group.options || []).filter((item) => item.parameter);
  const representedParametrized = new Set(parameterizedFeatureOptions.map((item) => item.sourceGuid));
  sourceParametrized.forEach((guid) => {
    if (!representedParametrized.has(guid)) pushError(`featureGroups.parametrized.${guid}`, "parametrized source feature is not represented in a choice pool");
  });
  (data.classFeatureRules || []).forEach((rule, index) => {
    const where = `classFeatureRules[${index}]`;
    if (!classIds.has(rule.classId)) pushError(`${where}.classId`, `unknown class ${rule.classId}`);
    if (rule.archetypeId && !archetypeIds.has(`${rule.classId}:${rule.archetypeId}`)) pushError(`${where}.archetypeId`, `unknown archetype ${rule.classId}:${rule.archetypeId}`);
    if (!data.featureGroups?.[rule.groupId]) pushError(`${where}.groupId`, `unknown feature group ${rule.groupId}`);
    if (!Array.isArray(rule.levels) || !rule.levels.length || rule.levels.some((level) => !Number.isInteger(level) || level < 1 || level > 20)) {
      pushError(`${where}.levels`, "levels must be integers from 1 through 20");
    }
  });

  (data.spells || []).forEach((spell) => {
    if (!Number.isInteger(spell.level) || spell.level < 0 || spell.level > 10) pushError(`spells.${spell.id}.level`, `invalid spell level ${spell.level}`);
    if (!Array.isArray(spell.lists) || !spell.lists.length) pushError(`spells.${spell.id}.lists`, "spell has no spell list");
  });
  Object.entries(data.spellKnownTables || {}).forEach(([tableId, table]) => {
    Object.entries(table).forEach(([spellLevel, progression]) => {
      if (!Array.isArray(progression) || progression.length !== 20) pushError(`spellKnownTables.${tableId}.${spellLevel}`, "progression must contain 20 class levels");
      else if (progression.some((value) => !Number.isInteger(value) || value < 0)) pushError(`spellKnownTables.${tableId}.${spellLevel}`, "progression contains invalid count");
    });
  });

  (data.pathAbilities || []).forEach((ability) => {
    if (!pathIds.has(ability.path)) pushError(`pathAbilities.${ability.id}.path`, `unknown path ${ability.path}`);
    if (ability.minRank && (!Number.isInteger(ability.minRank) || ability.minRank < 3 || ability.minRank > 10)) pushError(`pathAbilities.${ability.id}.minRank`, `invalid rank ${ability.minRank}`);
    (ability.requires || []).forEach((id) => { if (!pathAbilityIds.has(id)) pushError(`pathAbilities.${ability.id}.requires`, `unknown path ability ${id}`); });
  });
  const pathRules = data.mythicPathRules || {};
  pathIds.forEach((id) => { if (!pathRules[id]) pushError(`mythicPathRules.${id}`, "missing rule for path"); });
  Object.entries(pathRules).forEach(([pathId, rule]) => {
    if (!pathIds.has(pathId)) pushError(`mythicPathRules.${pathId}`, "rule references unknown path");
    if (![3, 8].includes(rule.entryRank)) pushError(`mythicPathRules.${pathId}.entryRank`, `unexpected entry rank ${rule.entryRank}`);
    (rule.transition?.from || []).forEach((id) => { if (!pathIds.has(id)) pushError(`mythicPathRules.${pathId}.transition.from`, `unknown path ${id}`); });
    Object.entries(rule.steps || {}).forEach(([rankText, slots]) => {
      const rank = Number(rankText);
      if (!Number.isInteger(rank) || rank < rule.entryRank || rank > 10) pushError(`mythicPathRules.${pathId}.steps.${rankText}`, "invalid step rank");
      (slots || []).forEach((rawSlot, index) => {
        const slot = Array.isArray(rawSlot) ? { groupId: rawSlot[0], count: rawSlot[1] } : { ...rawSlot, groupId: rawSlot.groupId || rawSlot.group };
        const groupId = slot.groupId;
        const count = slot.count === undefined ? 1 : Number(slot.count);
        const groupExists = (data.pathAbilities || []).some((ability) => ability.path === pathId && ability.group === groupId);
        if (!groupExists && !allowedMythicGroups.has(groupId)) pushError(`mythicPathRules.${pathId}.steps.${rankText}[${index}]`, `unknown ability group ${groupId}`);
        if (!Number.isInteger(count) || count < 1) pushError(`mythicPathRules.${pathId}.steps.${rankText}[${index}]`, `invalid choice count ${count}`);
      });
    });
  });

  const expectedFeatParameters = new Set(manifest.knownParameterized?.feats || []);
  const actualFeatParameters = setOf((data.feats || []).filter((item) => item.parameter));
  sorted(expectedFeatParameters).forEach((id) => { if (!actualFeatParameters.has(id)) pushError(`knownParameterized.feats.${id}`, "expected parameter annotation is missing"); });
  sorted(actualFeatParameters).forEach((id) => {
    const item = (data.feats || []).find((entry) => entry.id === id);
    if (!expectedFeatParameters.has(id) && !item?.sourceVerified) pushWarning(`knownParameterized.feats.${id}`, "legacy parameterized item is not recorded in manifest");
  });
  const expectedMythicParameters = new Set(manifest.knownParameterized?.mythic || []);
  const actualMythicParameters = setOf((data.mythic || []).filter((item) => item.parameter));
  sorted(expectedMythicParameters).forEach((id) => { if (!actualMythicParameters.has(id)) pushError(`knownParameterized.mythic.${id}`, "expected parameter annotation is missing"); });
  sorted(actualMythicParameters).forEach((id) => {
    const item = (data.mythic || []).find((entry) => entry.id === id);
    if (!expectedMythicParameters.has(id) && !item?.sourceVerified) pushWarning(`knownParameterized.mythic.${id}`, "legacy parameterized item is not recorded in manifest");
  });

  return { errors, warnings };
}

function validateSourceVersion(manifest, evidence = {}) {
  const target = manifest.targetGameBuild || {};
  const errors = [];
  const gaps = [];
  const observed = {
    version: evidence.versionInfo?.version || null,
    steamAppId: evidence.steamManifest?.appId || null,
    steamBuildId: evidence.steamManifest?.buildId || null,
    steamDepotManifestId: target.steamDepotId ? evidence.steamManifest?.depots?.[target.steamDepotId] || null : null,
    versionInfoSha256: evidence.versionInfo?.sha256 || null,
    steamManifestSemanticSha256: evidence.steamManifest?.semanticSha256 || null,
    authoritativeSources: {}
  };
  const targetHashes = target.sourceHashes || {};
  const targetSources = target.authoritativeSources || {};

  if (!target.version || !target.steamAppId || !target.steamBuildId || !target.steamDepotId || !target.steamDepotManifestId || !targetHashes.versionInfoSha256 || !targetHashes.steamManifestSemanticSha256) {
    errors.push({ where: "targetGameBuild", message: "manifest must pin version, Steam app/build/depot/manifest ids, and both provenance SHA-256 hashes" });
  }
  if (!["blueprints", "cheatdata", "zhCN"].every((id) => targetSources[id]?.sha256 && Number.isInteger(targetSources[id]?.size))) {
    errors.push({ where: "targetGameBuild.authoritativeSources", message: "manifest must pin SHA-256 and byte size for blueprints, cheatdata, and zhCN" });
  }
  if (!evidence.versionInfo) gaps.push({ id: "sourceVersion.versionInfo", reason: "Version.info was not supplied; game-version provenance is unverified" });
  else if (!observed.version) errors.push({ where: "sourceVersion.versionInfo", message: "could not parse a game version" });
  else if (observed.version !== target.version) errors.push({ where: "sourceVersion.version", message: `expected ${target.version}, observed ${observed.version}` });
  if (evidence.versionInfo && targetHashes.versionInfoSha256 && observed.versionInfoSha256 !== targetHashes.versionInfoSha256.toLowerCase()) {
    errors.push({ where: "sourceVersion.versionInfoSha256", message: `expected ${targetHashes.versionInfoSha256}, observed ${observed.versionInfoSha256}` });
  }

  if (!evidence.steamManifest) gaps.push({ id: "sourceVersion.steamManifest", reason: "Steam app manifest was not supplied; build provenance is unverified" });
  else {
    if (!observed.steamAppId || !observed.steamBuildId) errors.push({ where: "sourceVersion.steamManifest", message: "could not parse appid/buildid" });
    if (observed.steamAppId && observed.steamAppId !== target.steamAppId) errors.push({ where: "sourceVersion.steamAppId", message: `expected ${target.steamAppId}, observed ${observed.steamAppId}` });
    if (observed.steamBuildId && observed.steamBuildId !== target.steamBuildId) errors.push({ where: "sourceVersion.steamBuildId", message: `expected ${target.steamBuildId}, observed ${observed.steamBuildId}` });
    if (!observed.steamDepotManifestId) errors.push({ where: "sourceVersion.steamDepotManifestId", message: `could not find installed depot ${target.steamDepotId}` });
    else if (observed.steamDepotManifestId !== target.steamDepotManifestId) errors.push({ where: "sourceVersion.steamDepotManifestId", message: `expected ${target.steamDepotManifestId}, observed ${observed.steamDepotManifestId}` });
    if (targetHashes.steamManifestSemanticSha256 && observed.steamManifestSemanticSha256 !== targetHashes.steamManifestSemanticSha256.toLowerCase()) {
      errors.push({ where: "sourceVersion.steamManifestSemanticSha256", message: `expected ${targetHashes.steamManifestSemanticSha256}, observed ${observed.steamManifestSemanticSha256}` });
    }
  }

  Object.entries(targetSources).forEach(([id, expected]) => {
    const actual = evidence.authoritativeSources?.[id];
    observed.authoritativeSources[id] = actual
      ? { path: actual.path || null, size: actual.size, sha256: actual.sha256 }
      : null;
    if (!actual) {
      gaps.push({ id: `sourceVersion.authoritativeSources.${id}`, reason: `${expected.relativePath || id} was not supplied; authoritative-source provenance is unverified` });
      return;
    }
    if (actual.size !== expected.size) {
      errors.push({ where: `sourceVersion.authoritativeSources.${id}.size`, message: `expected ${expected.size}, observed ${actual.size}` });
    }
    if (actual.sha256 !== String(expected.sha256).toLowerCase()) {
      errors.push({ where: `sourceVersion.authoritativeSources.${id}.sha256`, message: `expected ${expected.sha256}, observed ${actual.sha256}` });
    }
  });

  return {
    status: errors.length ? "mismatch" : gaps.length ? "unverified" : "verified",
    target,
    observed,
    sources: {
      versionInfoPath: evidence.versionInfoPath || null,
      steamManifestPath: evidence.steamManifestPath || null
    },
    errors,
    gaps
  };
}

function evaluateCoverage(data, manifest = loadManifest(), versionEvidence = {}) {
  const metrics = metricsFor(data);
  const references = validateReferences(data, manifest);
  const sourceVersion = validateSourceVersion(manifest, versionEvidence);
  const gaps = [...sourceVersion.gaps];
  const drift = [];

  Object.entries(manifest.baseline || {}).forEach(([key, expected]) => {
    const actual = metrics[key];
    if (actual === undefined) gaps.push({ id: `baseline.${key}`, reason: "manifest metric is not implemented by checker" });
    else if (actual < expected) gaps.push({ id: `baseline.${key}`, reason: `regressed from ${expected} to ${actual}` });
    else if (actual > expected) drift.push({ id: `baseline.${key}`, message: `grew from ${expected} to ${actual}; review and update the manifest baseline` });
  });
  Object.entries(manifest.claims || {}).forEach(([id, claim]) => {
    if (claim.status !== "complete") gaps.push({ id, reason: claim.reason || `coverage status is ${claim.status || "unset"}` });
  });

  return {
    goal: manifest.goal,
    complete: references.errors.length === 0 && sourceVersion.errors.length === 0 && gaps.length === 0,
    sourceVersion,
    metrics,
    structuralErrors: [...sourceVersion.errors, ...references.errors],
    warnings: references.warnings,
    drift,
    gaps
  };
}

function printHuman(report) {
  console.log(`WotR coverage: ${report.complete ? "COMPLETE" : "INCOMPLETE"}`);
  console.log(`Goal: ${report.goal}`);
  const version = report.sourceVersion;
  console.log(`Source version: ${version.status.toUpperCase()} (target ${version.target.version}, Steam build ${version.target.steamBuildId})`);
  if (version.observed.version || version.observed.steamBuildId) {
    console.log(`Observed source: ${version.observed.version || "unknown version"}, Steam build ${version.observed.steamBuildId || "unknown"}`);
  }
  if (version.target.steamDepotId) {
    console.log(`Windows depot: ${version.target.steamDepotId} / ${version.observed.steamDepotManifestId || "unverified manifest"}`);
  }
  const artifactValues = Object.values(version.observed.authoritativeSources || {});
  if (artifactValues.length) console.log(`Authoritative sources: ${artifactValues.filter(Boolean).length}/${artifactValues.length} supplied`);
  console.log("\nCurrent metrics:");
  Object.entries(report.metrics).forEach(([key, value]) => console.log(`  ${key}: ${value}`));
  if (report.structuralErrors.length) {
    console.log(`\nStructural errors (${report.structuralErrors.length}):`);
    report.structuralErrors.forEach((item) => console.log(`  [ERROR] ${item.where}: ${item.message}`));
  }
  if (report.gaps.length) {
    console.log(`\nCoverage gaps (${report.gaps.length}):`);
    report.gaps.forEach((item) => console.log(`  [GAP] ${item.id}: ${item.reason}`));
  }
  if (report.drift.length) {
    console.log(`\nManifest drift (${report.drift.length}):`);
    report.drift.forEach((item) => console.log(`  [DRIFT] ${item.id}: ${item.message}`));
  }
  if (report.warnings.length) {
    console.log(`\nWarnings (${report.warnings.length}):`);
    report.warnings.forEach((item) => console.log(`  [WARN] ${item.where}: ${item.message}`));
  }
}

function strictExitCode(report) {
  return report.complete ? 0 : 1;
}

function optionValue(argv, flag) {
  const inline = argv.find((item) => item.startsWith(`${flag}=`));
  if (inline) return inline.slice(flag.length + 1);
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : null;
}

function main(argv = process.argv.slice(2)) {
  const manifest = loadManifest();
  const versionEvidence = loadVersionEvidence({
    versionInfoPath: optionValue(argv, "--version-info"),
    steamManifestPath: optionValue(argv, "--steam-manifest"),
    authoritativeSourcePaths: {
      blueprints: optionValue(argv, "--blueprints"),
      cheatdata: optionValue(argv, "--cheatdata"),
      zhCN: optionValue(argv, "--zhcn")
    }
  });
  const report = evaluateCoverage(loadData(ROOT, manifest.generatedFrom), manifest, versionEvidence);
  if (argv.includes("--json")) console.log(JSON.stringify(report, null, 2));
  else printHuman(report);
  if (!argv.includes("--report")) process.exitCode = strictExitCode(report);
  return report;
}

if (require.main === module) main();

module.exports = {
  ROOT,
  MANIFEST_PATH,
  loadManifest,
  loadData,
  parseVersionInfo,
  parseSteamManifest,
  sha256,
  sha256File,
  loadArtifactEvidence,
  loadVersionEvidence,
  metricsFor,
  validateReferences,
  validateSourceVersion,
  evaluateCoverage,
  strictExitCode,
  main
};
