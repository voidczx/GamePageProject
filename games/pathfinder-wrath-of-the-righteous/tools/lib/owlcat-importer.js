"use strict";

const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const { sha256, stableClone, stableStringify } = require("./stable-json");

const IMPORTER_NAME = "wotr-owlcat-blueprint-importer";
const IMPORTER_VERSION = "1.5.0";
const SNAPSHOT_SCHEMA_VERSION = 1;
const GUID_PATTERN = /^[0-9a-f]{32}$/i;
const BP_REFERENCE_PATTERN = /!bp_([0-9a-f]{32})/gi;

function invariant(condition, message) {
  if (!condition) throw new Error(`WotR Owlcat importer: ${message}`);
}

function compareText(left, right) {
  return String(left).localeCompare(String(right), "en");
}

function compareBy(...selectors) {
  return (left, right) => {
    for (const selector of selectors) {
      const compared = compareText(selector(left) ?? "", selector(right) ?? "");
      if (compared) return compared;
    }
    return 0;
  };
}

function normalizeGuid(value) {
  if (typeof value !== "string") return null;
  const match = value.match(/(?:!bp_)?([0-9a-f]{32})/i);
  return match && GUID_PATTERN.test(match[1]) ? match[1].toLowerCase() : null;
}

function blueprintPathToArchivePath(value) {
  return String(value || "")
    .replace(/^Blueprints[\\/]/i, "")
    .replace(/\\/g, "/");
}

function fileSha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const input = fs.createReadStream(filePath);
    input.on("error", reject);
    input.on("data", (chunk) => hash.update(chunk));
    input.on("end", () => resolve(`sha256:${hash.digest("hex")}`));
  });
}

function parseVersionInfo(text) {
  const raw = String(text).trim();
  const match = raw.match(/^(.*?)\s+([0-9a-f]{40})\s+(\S+)\s+(\S+)$/i);
  invariant(match, "Version.info has an unsupported format");
  return {
    raw,
    builtAt: match[1],
    commit: match[2].toLowerCase(),
    gameVersion: match[3],
    productVersion: match[4]
  };
}

function loadJson(filePath, label) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`WotR Owlcat importer: cannot parse ${label} (${filePath}): ${error.message}`);
  }
}

function validateLock(lock) {
  invariant(lock && lock.schemaVersion === 1, "source lock schemaVersion must be 1");
  for (const key of ["gameId", "steamBuild", "expectedGameVersion"]) {
    invariant(typeof lock[key] === "string" && lock[key], `source lock is missing ${key}`);
  }
  invariant(lock.paths && typeof lock.paths === "object", "source lock is missing paths");
  for (const key of ["blueprints", "cheatdata", "localization", "versionInfo"]) {
    invariant(typeof lock.paths[key] === "string" && lock.paths[key], `source lock is missing paths.${key}`);
  }
  invariant(lock.hashes && typeof lock.hashes === "object", "source lock is missing hashes");
  for (const key of ["blueprints", "cheatdata", "localization", "versionInfo"]) {
    invariant(/^sha256:[0-9a-f]{64}$/i.test(lock.hashes[key] || ""), `source lock has invalid hashes.${key}`);
  }
  invariant(Array.isArray(lock.roots) && lock.roots.length, "source lock must declare roots");
  lock.roots.forEach((root) => invariant(normalizeGuid(root.guid), `source lock has invalid root guid ${root.guid}`));
}

function buildGuidIndex(cheatdata) {
  invariant(cheatdata && Array.isArray(cheatdata.Entries), "cheatdata must contain Entries[]");
  const index = new Map();
  cheatdata.Entries.forEach((entry) => {
    const guid = normalizeGuid(entry.Guid);
    if (!guid || !entry.Path) return;
    const normalized = {
      guid,
      internalName: String(entry.Name || ""),
      blueprintType: String(entry.TypeFullName || ""),
      blueprintPath: blueprintPathToArchivePath(entry.Path)
    };
    const previous = index.get(guid);
    invariant(!previous || previous.blueprintPath === normalized.blueprintPath, `duplicate GUID ${guid} has conflicting paths`);
    index.set(guid, normalized);
  });
  return index;
}

function runPythonExtractor(python, scriptPath, archivePath, requestPath, outputPath) {
  const result = spawnSync(python, [scriptPath, "--archive", archivePath, "--request", requestPath, "--output", outputPath], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    windowsHide: true
  });
  if (result.error) throw result.error;
  invariant(result.status === 0, `Zip64 extractor failed: ${(result.stderr || result.stdout || "unknown error").trim()}`);
}

function safeRemoveTemporaryDirectory(directory) {
  const tempRoot = path.resolve(os.tmpdir());
  const resolved = path.resolve(directory);
  const relative = path.relative(tempRoot, resolved);
  invariant(relative && !relative.startsWith("..") && !path.isAbsolute(relative), `refusing to remove non-temporary path ${resolved}`);
  fs.rmSync(resolved, { recursive: true, force: true });
}

function extractBlueprintBatch(archivePath, archiveEntries, options = {}) {
  const uniqueEntries = [...new Set(archiveEntries)].sort(compareText);
  if (!uniqueEntries.length) return new Map();

  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "wotr-blueprints-"));
  const requestPath = path.join(temporaryDirectory, "request.json");
  const outputPath = path.join(temporaryDirectory, "extracted");
  fs.mkdirSync(outputPath);
  fs.writeFileSync(requestPath, stableStringify(uniqueEntries), "utf8");
  try {
    runPythonExtractor(
      options.python || "python",
      options.extractorScript || path.resolve(__dirname, "../extract-blueprints.py"),
      archivePath,
      requestPath,
      outputPath
    );
    const blueprints = new Map();
    uniqueEntries.forEach((entry) => {
      const filePath = path.join(outputPath, ...entry.split("/"));
      invariant(fs.existsSync(filePath), `archive entry was not extracted: ${entry}`);
      blueprints.set(entry, loadJson(filePath, entry));
    });
    return blueprints;
  } finally {
    safeRemoveTemporaryDirectory(temporaryDirectory);
  }
}

function extractReferences(value, result = new Set()) {
  if (typeof value === "string") {
    let match;
    BP_REFERENCE_PATTERN.lastIndex = 0;
    while ((match = BP_REFERENCE_PATTERN.exec(value))) result.add(match[1].toLowerCase());
    if (GUID_PATTERN.test(value)) result.add(value.toLowerCase());
    return result;
  }
  if (Array.isArray(value)) {
    value.forEach((child) => extractReferences(child, result));
    return result;
  }
  if (value && typeof value === "object") {
    Object.values(value).forEach((child) => extractReferences(child, result));
  }
  return result;
}

function componentName(component) {
  return component && typeof component.name === "string" ? component.name.replace(/\(Clone\)$/, "") : "";
}

function mergePrototypeComponents(parentComponents, childComponents, overrideTokens) {
  const byName = new Map((parentComponents || []).map((component) => [componentName(component), stableClone(component)]));
  overrideTokens.forEach((token) => {
    byName.delete(token);
    const replacement = (childComponents || []).find((component) => componentName(component) === token);
    if (replacement) byName.set(token, stableClone(replacement));
  });
  (childComponents || []).forEach((component) => {
    const name = componentName(component);
    if (!name || byName.has(name) || !overrideTokens.has(name)) return;
    byName.set(name, stableClone(component));
  });
  return [...byName.values()].sort(compareBy(componentName));
}

function mergePrototypeData(parentData, childData) {
  const overrides = new Set(Array.isArray(childData.m_Overrides) ? childData.m_Overrides : []);
  const componentOverrides = new Set([...overrides].filter((key) => key.startsWith("$")));
  const result = stableClone(parentData);

  Object.entries(childData).forEach(([key, value]) => {
    if (["$type", "PrototypeLink", "m_Overrides", "Comment"].includes(key) || !(key in result) || overrides.has(key)) {
      result[key] = stableClone(value);
    }
  });
  result.Components = mergePrototypeComponents(parentData.Components, childData.Components, componentOverrides);
  result.PrototypeLink = childData.PrototypeLink || "";
  result.m_Overrides = stableClone(childData.m_Overrides || []);
  return stableClone(result);
}

function resolvePrototypeData(guid, rawBlueprints, cache = new Map(), resolving = new Set()) {
  if (cache.has(guid)) return cache.get(guid);
  invariant(!resolving.has(guid), `PrototypeLink cycle detected at ${guid}`);
  const raw = rawBlueprints.get(guid);
  invariant(raw && raw.Data, `cannot resolve missing blueprint ${guid}`);
  resolving.add(guid);
  const prototypeGuid = normalizeGuid(raw.Data.PrototypeLink);
  let resolved = stableClone(raw.Data);
  let prototypeChain = [];
  if (prototypeGuid) {
    invariant(rawBlueprints.has(prototypeGuid), `prototype ${prototypeGuid} for ${guid} was not loaded`);
    const parent = resolvePrototypeData(prototypeGuid, rawBlueprints, cache, resolving);
    resolved = mergePrototypeData(parent.data, raw.Data);
    prototypeChain = [prototypeGuid, ...parent.prototypeChain];
  }
  resolving.delete(guid);
  const value = { data: resolved, prototypeGuid, prototypeChain };
  cache.set(guid, value);
  return value;
}

function localizationKey(value) {
  if (!value || typeof value !== "object") return null;
  return value.m_Key || (value.Shared && value.Shared.stringkey) || null;
}

function displayKeys(data) {
  const nameValue = data.m_DisplayName || data.LocalizedName || data.m_TypeNameText || data.m_DefaultNameText;
  const descriptionValue = data.m_Description || data.LocalizedDescription || data.m_DescriptionText;
  const shortValue = data.m_DescriptionShort || data.LocalizedDescriptionShort;
  return {
    nameKey: localizationKey(nameValue),
    descriptionKey: localizationKey(descriptionValue),
    shortDescriptionKey: localizationKey(shortValue)
  };
}

function localize(keys, strings) {
  const result = {};
  if (keys.nameKey) result.name = strings[keys.nameKey] ?? null;
  if (keys.descriptionKey) result.description = strings[keys.descriptionKey] ?? null;
  if (keys.shortDescriptionKey) result.shortDescription = strings[keys.shortDescriptionKey] ?? null;
  return result;
}

function localizedValue(value, strings) {
  const key = localizationKey(value);
  return {
    key,
    text: key ? (strings[key] ?? null) : null
  };
}

function componentType(component) {
  return String(component?.$type || component?.name || "").split(",").pop().trim();
}

function uniqueNonEmpty(values) {
  return [...new Set(values.filter((value) => value !== null && value !== undefined && value !== ""))].sort(compareText);
}

function definitionMechanics(entry, data, components, localizationStrings) {
  const blueprintType = shortBlueprintType(entry, data);
  const result = {};

  if (/Blueprint(?:Ability|ActivatableAbility)$/i.test(blueprintType)) {
    const spellComponent = components.find((component) => /(?:^|\s)SpellComponent$/i.test(componentType(component)));
    const descriptorComponents = components.filter((component) => /SpellDescriptorComponent$/i.test(componentType(component)));
    const savingThrowTypes = uniqueNonEmpty(components
      .map((component) => component.SavingThrowType)
      .filter((value) => value && value !== "Unknown" && value !== "None"));
    result.ability = {
      type: data.Type ?? null,
      range: data.Range ?? null,
      customRange: data.CustomRange?.m_Value ?? null,
      actionType: data.ActionType ?? null,
      isFullRoundAction: Boolean(data.m_IsFullRoundAction),
      spellResistance: data.SpellResistance ?? null,
      canTargetEnemies: data.CanTargetEnemies ?? null,
      canTargetFriends: data.CanTargetFriends ?? null,
      canTargetSelf: data.CanTargetSelf ?? null,
      canTargetPoint: data.CanTargetPoint ?? null,
      effectOnAlly: data.EffectOnAlly ?? null,
      effectOnEnemy: data.EffectOnEnemy ?? null,
      availableMetamagic: stableClone(data.AvailableMetamagic ?? null),
      school: spellComponent?.School ?? null,
      descriptorValues: uniqueNonEmpty(descriptorComponents.map((component) => component.Descriptor?.m_IntValue ?? component.Descriptor)),
      savingThrowTypes,
      localizedDuration: localizedValue(data.LocalizedDuration, localizationStrings),
      localizedSavingThrow: localizedValue(data.LocalizedSavingThrow, localizationStrings),
      materialComponent: data.MaterialComponent ? {
        item: normalizeGuid(data.MaterialComponent.m_Item),
        count: Number(data.MaterialComponent.Count) || 0
      } : null,
      isDomainAbility: Boolean(data.IsDomainAbility),
      hidden: Boolean(data.Hidden || data.HideInUI)
    };
  }

  if (/BlueprintCharacterClass$/i.test(blueprintType)) {
    const skipSpellProgressionLevels = uniqueNonEmpty(components
      .filter((component) => /SkipLevelsForSpellProgression$/i.test(componentType(component)))
      .flatMap((component) => component.Levels || [])
      .map((level) => Number(level))
      .filter(Number.isFinite));
    result.characterClass = {
      skillPoints: Number(data.SkillPoints) || 0,
      hitDie: data.HitDie ?? null,
      prestige: Boolean(data.PrestigeClass),
      isMythic: Boolean(data.IsMythic),
      isHigherMythic: Boolean(data.IsHigherMythic),
      baseAttackBonus: normalizeGuid(data.m_BaseAttackBonus),
      fortitudeSave: normalizeGuid(data.m_FortitudeSave),
      reflexSave: normalizeGuid(data.m_ReflexSave),
      willSave: normalizeGuid(data.m_WillSave),
      progression: normalizeGuid(data.m_Progression),
      spellbook: normalizeGuid(data.m_Spellbook),
      dontAddCasterLevels: Boolean(data.DontAddCasterLevels),
      skipSpellProgressionLevels,
      classSkills: stableClone(data.ClassSkills || []),
      isDivineCaster: Boolean(data.IsDivineCaster),
      isArcaneCaster: Boolean(data.IsArcaneCaster),
      recommendedAttributes: stableClone(data.m_RecommendedAttributes || data.RecommendedAttributes || []),
      notRecommendedAttributes: stableClone(data.m_NotRecommendedAttributes || data.NotRecommendedAttributes || [])
    };
  }

  if (/BlueprintRace$/i.test(blueprintType)) {
    result.race = {
      raceId: data.RaceId ?? null,
      size: data.Size ?? null,
      selectableRaceStat: Boolean(data.SelectableRaceStat),
      features: directReferenceOccurrences(data.m_Features || [])
    };
  }

  if (/Blueprint(?:Feature|FeatureSelection|FeatureReplaceSpellbook|FeatureSelectMythicSpellbook|ParametrizedFeature|Progression)$/i.test(blueprintType)) {
    result.feature = {
      ranks: Number(data.Ranks) || 1,
      groups: stableClone(data.Groups || []),
      isClassFeature: Boolean(data.IsClassFeature),
      reapplyOnLevelUp: Boolean(data.ReapplyOnLevelUp),
      hideInUI: Boolean(data.HideInUI),
      hideInCharacterSheet: Boolean(data.HideInCharacterSheetAndLevelUp)
    };
  }

  if (/BlueprintFeatureReplaceSpellbook$/i.test(blueprintType)) {
    result.spellbookAdvance = {
      kind: "replace-class-spellbook",
      targetSpellbook: normalizeGuid(data.m_Spellbook)
    };
  }

  if (/BlueprintFeatureSelectMythicSpellbook$/i.test(blueprintType)) {
    result.spellbookAdvance = {
      kind: "merge-mythic-spellbook",
      allowedSpellbooks: uniqueNonEmpty((data.m_AllowedSpellbooks || []).map(normalizeGuid)),
      mythicSpellList: normalizeGuid(data.m_MythicSpellList),
      spontaneousKnownTable: normalizeGuid(data.m_SpellKnownForSpontaneous)
    };
  }

  if (/BlueprintAbilityResource$/i.test(blueprintType)) {
    result.abilityResource = {
      maxAmount: stableClone(data.m_MaxAmount || data.MaxAmount || null),
      useMax: Boolean(data.UseMax)
    };
  }

  if (/BlueprintWeaponType$/i.test(blueprintType)) {
    result.weaponType = {
      category: data.Category ?? null,
      attackType: data.m_AttackType ?? null,
      attackRange: data.m_AttackRange?.m_Value ?? null,
      baseDamage: stableClone(data.m_BaseDamage || null),
      damageType: stableClone(data.m_DamageType || null),
      criticalRollEdge: Number(data.m_CriticalRollEdge) || null,
      criticalModifier: data.m_CriticalModifier ?? null,
      fighterGroups: data.m_FighterGroupFlags ?? null,
      isTwoHanded: Boolean(data.m_IsTwoHanded),
      isLight: Boolean(data.m_IsLight),
      isMonk: Boolean(data.m_IsMonk),
      isNatural: Boolean(data.m_IsNatural),
      isUnarmed: Boolean(data.m_IsUnarmed)
    };
  }

  if (/Blueprint(?:Armor|Shield)Type$/i.test(blueprintType)) {
    result.armorType = {
      proficiencyGroup: data.ProficiencyGroup ?? data.m_ProficiencyGroup ?? null,
      armorType: data.ArmorType ?? data.m_ArmorType ?? null,
      armorBonus: Number(data.ArmorBonus) || 0,
      maxDexterityBonus: Number(data.MaxDexterityBonus) || 0,
      armorCheckPenalty: Number(data.ArmorCheckPenalty) || 0,
      arcaneSpellFailureChance: Number(data.ArcaneSpellFailureChance) || 0
    };
  }

  if (/BlueprintStatProgression$/i.test(blueprintType)) {
    result.statProgression = {
      bonuses: (data.Bonuses || []).map((value) => Number(value) || 0)
    };
  }

  return stableClone(result);
}

function shortBlueprintType(indexEntry, data) {
  const full = indexEntry.blueprintType || data.$type || "";
  return String(full).split(/[.,]/).pop().trim();
}

function isSelection(entry) {
  return /Blueprint(?:Feature)?Selection$/i.test(entry.blueprintType) || /BlueprintFeatureSelection/i.test(entry.blueprintType);
}

function isParametrized(entry) {
  return /BlueprintParametrizedFeature$/i.test(entry.blueprintType);
}

function isProgression(entry) {
  return /BlueprintProgression$/i.test(entry.blueprintType);
}

function isCharacterClass(entry) {
  return /BlueprintCharacterClass$/i.test(entry.blueprintType);
}

function isArchetype(entry) {
  return /BlueprintArchetype$/i.test(entry.blueprintType);
}

function isSpellList(entry) {
  return /BlueprintSpellList$/i.test(entry.blueprintType);
}

function isSpellbook(entry) {
  return /BlueprintSpellbook$/i.test(entry.blueprintType);
}

function isSpellsTable(entry) {
  return /BlueprintSpellsTable$/i.test(entry.blueprintType);
}

function isStatProgression(entry) {
  return /BlueprintStatProgression$/i.test(entry.blueprintType);
}

function isEquipmentType(entry) {
  return /Blueprint(?:Weapon|Armor|Shield)Type$/i.test(entry.blueprintType);
}

function isEtude(entry) {
  return /BlueprintEtude$/i.test(entry?.blueprintType || "");
}

function mechanicsClosureType(entry) {
  if (!entry) return false;
  return /Blueprint(?:Ability|ActivatableAbility|Feature|FeatureSelection|ParametrizedFeature|Progression|StatProgression|AbilityResource|Buff|Spellbook|SpellList|SpellsTable)$/i
    .test(entry.blueprintType);
}

function refs(value) {
  return [...extractReferences(value)].sort(compareText);
}

function selectionOptions(data) {
  return refs(data.m_AllFeatures || data.m_Features || []);
}

function directReferenceOccurrences(value) {
  return (Array.isArray(value) ? value : []).flatMap((item) => [...extractReferences(item)].sort(compareText));
}

function progressionLevels(data) {
  return (data.LevelEntries || []).map((entry) => ({
    level: entry.Level,
    features: directReferenceOccurrences(entry.m_Features || []),
    raw: stableClone(entry)
  })).sort((left, right) => Number(left.level) - Number(right.level));
}

function archetypeLevels(value) {
  return (value || []).map((entry) => ({
    level: entry.Level,
    features: directReferenceOccurrences(entry.m_Features || []),
    raw: stableClone(entry)
  })).sort((left, right) => Number(left.level) - Number(right.level));
}

function spellListLevels(data) {
  return (data.SpellsByLevel || data.m_SpellsByLevel || []).map((entry) => ({
    spellLevel: entry.SpellLevel,
    // Membership is ordered source data, not a set. Preserve duplicates here;
    // references elsewhere remain de-duplicated for graph traversal.
    spells: (entry.m_Spells || []).map(normalizeGuid).filter(Boolean),
    raw: stableClone(entry)
  })).sort((left, right) => Number(left.spellLevel) - Number(right.spellLevel));
}

function spellsTableLevels(data) {
  return (data.Levels || []).map((entry, classLevel) => ({
    classLevel,
    count: (entry.Count || []).map((value) => Number(value) || 0)
  }));
}

function spellbookData(definition, data) {
  return stableClone({
    guid: definition.guid,
    internalName: definition.internalName,
    isMythic: Boolean(data.IsMythic),
    spellsPerDayTable: normalizeGuid(data.m_SpellsPerDay),
    spellsKnownTable: normalizeGuid(data.m_SpellsKnown),
    spellSlotsTable: normalizeGuid(data.m_SpellSlots),
    spellList: normalizeGuid(data.m_SpellList),
    mythicSpellList: normalizeGuid(data.m_MythicSpellList),
    characterClass: normalizeGuid(data.m_CharacterClass),
    castingAttribute: data.CastingAttribute ?? null,
    spontaneous: Boolean(data.Spontaneous),
    spellsPerLevel: Number(data.SpellsPerLevel) || 0,
    allSpellsKnown: Boolean(data.AllSpellsKnown),
    cantripsType: data.CantripsType ?? null,
    casterLevelModifier: Number(data.CasterLevelModifier) || 0,
    canCopyScrolls: Boolean(data.CanCopyScrolls),
    isArcane: Boolean(data.IsArcane),
    isArcanist: Boolean(data.IsArcanist),
    hasSpecialSpellList: Boolean(data.HasSpecialSpellList),
    ignoreAddSpellKnownTemporary: Boolean(data.IsIgnoreAddSpellKnownTemporary),
    spellsCannotBeRestored: Boolean(data.SpellsCannotBeRestored)
  });
}

function classifyDefinition(entry, data) {
  const blueprintPath = entry.blueprintPath.replace(/\\/g, "/");
  if (/^Mythic\//i.test(blueprintPath)) return "mythic";
  if (/\/Domains?\//i.test(blueprintPath)) return "domains";
  if (/^Spells\//i.test(blueprintPath) || data.Type === "Spell") return "spells";
  if (/^Feats\//i.test(blueprintPath) || /^Classes\/Basic\//i.test(blueprintPath) || (data.Groups || []).includes("Feat")) return "feats";
  if (/BlueprintAbility$/i.test(entry.blueprintType)) return "abilities";
  if (isEquipmentType(entry)) return "equipment";
  return "classes";
}

const STORY_RESTRICTED_INTERNAL_NAMES = new Set([
  "Areshkagal",
  "Baphomet",
  "Deskari",
  "Kabriri",
  "LichDeity",
  "Pulura",
  "TieflingHeritageBaphomet"
]);

const COMPANION_OR_NPC_INTERNAL_NAMES = new Set([
  "BackgroundRekarthDLC2",
  "Penta_Numerian_Background"
]);

function availability(entry, data, requirements) {
  let scope = "source-default";
  const reasons = [];
  if (/^Units\/NPC\//i.test(entry.blueprintPath) || /^Penta_/i.test(entry.internalName) || COMPANION_OR_NPC_INTERNAL_NAMES.has(entry.internalName)) {
    scope = "companion-or-npc";
    reasons.push("source-path-or-known-character-specific-entry");
  } else if (STORY_RESTRICTED_INTERNAL_NAMES.has(entry.internalName)) {
    scope = "story-or-mythic-restricted";
    reasons.push("known-story-or-mythic-source-entry");
  }
  if (/DLC\d|DLCs?\//i.test(entry.blueprintPath) || /DLC\d/i.test(entry.internalName)) reasons.push("dlc-source");
  if (requirements.length) reasons.push("prerequisite-components");
  return {
    scope,
    reasons: [...new Set(reasons)].sort(compareText),
    hideInUI: data.HideInUI ?? null,
    hideNotAvailableInUI: data.HideNotAvailibleInUI ?? null,
    prerequisiteComponentCount: requirements.length
  };
}

function normalizeDefinition(guid, rawBlueprints, guidIndex, localizationStrings, prototypeCache) {
  const indexEntry = guidIndex.get(guid);
  const resolved = resolvePrototypeData(guid, rawBlueprints, prototypeCache);
  const data = resolved.data;
  const keys = displayKeys(data);
  const components = stableClone(data.Components || []);
  const requirements = components.filter((component) => componentType(component).startsWith("Prerequisite"));
  const definition = {
    guid,
    internalName: indexEntry.internalName,
    blueprintType: shortBlueprintType(indexEntry, data),
    blueprintTypeFullName: indexEntry.blueprintType,
    blueprintPath: indexEntry.blueprintPath,
    category: classifyDefinition(indexEntry, data),
    prototype: {
      guid: resolved.prototypeGuid,
      chain: resolved.prototypeChain,
      overrides: stableClone(rawBlueprints.get(guid).Data.m_Overrides || [])
    },
    localizationKeys: keys,
    localization: localize(keys, localizationStrings),
    components,
    mechanics: definitionMechanics(indexEntry, data, components, localizationStrings),
    requirements,
    availability: availability(indexEntry, data, requirements),
    references: refs(data)
  };
  if (isParametrized(indexEntry)) {
    definition.parameter = {
      type: data.ParameterType ?? null,
      weaponSubCategory: data.WeaponSubCategory ?? null,
      selectionFeatureGroup: data.SelectionFeatureGroup ?? null,
      requireProficiency: data.RequireProficiency ?? null,
      spellList: normalizeGuid(data.m_SpellList),
      spellcasterClass: normalizeGuid(data.m_SpellcasterClass),
      specificSpellLevel: data.SpecificSpellLevel ?? null,
      spellLevel: data.SpellLevel ?? null,
      customVariants: stableClone(data.CustomParameterVariants || []),
      blueprintParameterVariants: refs(data.BlueprintParameterVariants || [])
    };
  }
  return stableClone(definition);
}

function rootCatalogFromData(rootData) {
  const progression = rootData.Progression || {};
  return stableClone({
    blueprintRootGuid: null,
    basicFeatSelection: normalizeGuid(progression.m_BasicFeatSelection),
    featsProgression: normalizeGuid(progression.m_FeatsProgression),
    characterClasses: refs(progression.m_CharacterClasses || []),
    characterMythics: refs(progression.m_CharacterMythics || []),
    characterRaces: refs(progression.m_CharacterRaces || []),
    deitySelection: normalizeGuid(progression.m_DeitySelection),
    rawProgression: progression
  });
}

function addGuid(targets, guid, reason) {
  if (!guid) return false;
  if (!targets.has(guid)) targets.set(guid, new Set());
  const before = targets.get(guid).size;
  targets.get(guid).add(reason);
  return targets.get(guid).size !== before;
}

function addRefs(targets, values, reason) {
  refs(values).forEach((guid) => addGuid(targets, guid, reason));
}

function structuralReferences(guid, raw, entry, guidIndex, rootGuid, options) {
  const data = raw.Data || {};
  const result = new Set();
  const add = (value) => refs(value).forEach((reference) => result.add(reference));
  const prototypeGuid = normalizeGuid(data.PrototypeLink);
  if (prototypeGuid) result.add(prototypeGuid);

  if (guid === rootGuid) {
    const root = rootCatalogFromData(data);
    add(root.basicFeatSelection);
    add(root.characterRaces);
    add(root.deitySelection);
    if (options.includeClassCatalog !== false) add(root.characterClasses);
    if (options.includeMythicClasses !== false) add(root.characterMythics);
  }
  if (isSelection(entry)) add(data.m_AllFeatures || data.m_Features || []);
  if (isCharacterClass(entry)) {
    add(data.m_Progression);
    add(data.m_Spellbook);
    if (options.includeClassCatalog !== false) {
      refs(data.m_Archetypes || []).forEach((archetypeGuid) => {
        const archetype = guidIndex.get(archetypeGuid);
        if (archetype && /^Classes\//i.test(archetype.blueprintPath)) result.add(archetypeGuid);
      });
    }
  }
  if (isProgression(entry) && options.includeProgressionFeatures !== false) add(data.LevelEntries || []);
  if (isArchetype(entry) && options.includeArchetypeFeatures !== false) {
    add(data.AddFeatures || data.m_AddFeatures || []);
    add(data.RemoveFeatures || data.m_RemoveFeatures || []);
  }
  if (isSpellList(entry)) add(data.SpellsByLevel || data.m_SpellsByLevel || []);
  const hasEtudePrerequisite = (data.Components || []).some((component) => componentType(component) === "PrerequisiteEtude");

  // A leaf can grant another Selection (Extra Feat / Extra Mythic Ability). Follow
  // only Selection references here; arbitrary effect references stay indexed but
  // do not explode the import into every gameplay blueprint.
  refs(data).forEach((reference) => {
    const referencedEntry = guidIndex.get(reference);
    if (referencedEntry && isSelection(referencedEntry)) result.add(reference);
    if (hasEtudePrerequisite && isEtude(referencedEntry)) result.add(reference);
    if (options.mechanicsClosure === true && mechanicsClosureType(referencedEntry)) result.add(reference);
  });
  result.delete(guid);
  return [...result].sort(compareText);
}

function buildChoicePool(definition, data) {
  const options = selectionOptions(data);
  return stableClone({
    id: definition.guid,
    guid: definition.guid,
    internalName: definition.internalName,
    name: definition.localization.name ?? definition.internalName,
    options,
    m_Features: stableClone(data.m_Features || []),
    m_AllFeatures: stableClone(data.m_AllFeatures || [])
  });
}

function analyzeSelectionGraph(rootGuid, poolByGuid) {
  const visited = new Set();
  const selections = new Set();
  const leaves = new Set();
  const cycleEdges = [];
  const active = new Set();
  function walk(guid) {
    if (active.has(guid)) {
      cycleEdges.push(guid);
      return;
    }
    if (visited.has(guid)) return;
    visited.add(guid);
    const pool = poolByGuid.get(guid);
    if (!pool) {
      leaves.add(guid);
      return;
    }
    selections.add(guid);
    active.add(guid);
    pool.options.forEach(walk);
    active.delete(guid);
  }
  walk(rootGuid);
  const root = poolByGuid.get(rootGuid);
  return {
    rootGuid,
    directOptions: root ? root.options.length : 0,
    reachableNodes: visited.size,
    selectionNodes: selections.size,
    leaves: leaves.size,
    cycleEdges: [...new Set(cycleEdges)].sort(compareText)
  };
}

function sourceDescriptor(kind, relativePath, hash, filePath) {
  return {
    kind,
    path: String(relativePath).replace(/\\/g, "/"),
    bytes: fs.statSync(filePath).size,
    sha256: hash
  };
}

async function importOwlcatInstall(installRoot, lockPath, runtimeOptions = {}) {
  const resolvedInstallRoot = path.resolve(installRoot);
  const resolvedLock = path.resolve(lockPath);
  const lock = loadJson(resolvedLock, "source lock");
  validateLock(lock);
  const sourcePaths = Object.fromEntries(Object.entries(lock.paths).map(([key, relative]) => [key, path.resolve(resolvedInstallRoot, relative)]));
  Object.entries(sourcePaths).forEach(([key, filePath]) => invariant(fs.existsSync(filePath), `missing ${key} source ${filePath}`));

  const [blueprintsHash, cheatdataHash, localizationHash, versionInfoHash] = await Promise.all([
    fileSha256(sourcePaths.blueprints),
    fileSha256(sourcePaths.cheatdata),
    fileSha256(sourcePaths.localization),
    fileSha256(sourcePaths.versionInfo)
  ]);
  const actualHashes = { blueprints: blueprintsHash, cheatdata: cheatdataHash, localization: localizationHash, versionInfo: versionInfoHash };
  Object.entries(lock.hashes).forEach(([key, expected]) => invariant(actualHashes[key] === expected.toLowerCase(), `${key} hash mismatch: expected ${expected}, got ${actualHashes[key]}`));

  const versionInfo = parseVersionInfo(fs.readFileSync(sourcePaths.versionInfo, "utf8"));
  invariant(versionInfo.gameVersion === lock.expectedGameVersion, `expected game ${lock.expectedGameVersion}, got ${versionInfo.gameVersion}`);
  const cheatdata = loadJson(sourcePaths.cheatdata, "cheatdata");
  const localizationDump = loadJson(sourcePaths.localization, "localization");
  invariant(localizationDump && localizationDump.strings && typeof localizationDump.strings === "object", "zhCN localization must contain strings");
  const localizationStrings = localizationDump.strings;
  const guidIndex = buildGuidIndex(cheatdata);

  const targets = new Map();
  lock.roots.forEach((root) => addGuid(targets, normalizeGuid(root.guid), `root:${root.id || root.guid}`));
  if (lock.options?.includeAllSpellLists !== false) {
    [...guidIndex.values()].filter(isSpellList).forEach((entry) => addGuid(targets, entry.guid, "all-spell-lists"));
  }
  if (lock.options?.includeEquipmentCatalog !== false) {
    [...guidIndex.values()].filter(isEquipmentType).forEach((entry) => addGuid(targets, entry.guid, "equipment-catalog"));
  }
  const rootEntry = [...guidIndex.values()].find((entry) => /BlueprintRoot$/i.test(entry.blueprintType) && /Root\/BlueprintRoot\.jbp$/i.test(entry.blueprintPath));
  invariant(rootEntry, "cheatdata does not contain Root/BlueprintRoot.jbp");
  addGuid(targets, rootEntry.guid, "authoritative-blueprint-root");

  const rawBlueprints = new Map();
  for (;;) {
    const missing = [...targets.keys()].filter((guid) => !rawBlueprints.has(guid));
    if (!missing.length) break;
    const missingEntries = missing.map((guid) => {
      const entry = guidIndex.get(guid);
      invariant(entry, `GUID ${guid} is absent from cheatdata`);
      return entry;
    });
    const extracted = extractBlueprintBatch(sourcePaths.blueprints, missingEntries.map((entry) => entry.blueprintPath), {
      python: runtimeOptions.python,
      extractorScript: runtimeOptions.extractorScript
    });
    missingEntries.forEach((entry) => {
      const raw = extracted.get(entry.blueprintPath);
      invariant(normalizeGuid(raw.AssetId) === entry.guid, `archive ${entry.blueprintPath} AssetId does not match cheatdata`);
      rawBlueprints.set(entry.guid, raw);
    });
    missingEntries.forEach((entry) => {
      structuralReferences(entry.guid, rawBlueprints.get(entry.guid), entry, guidIndex, rootEntry.guid, lock.options || {})
        .forEach((reference) => addGuid(targets, reference, `structural:${entry.guid}`));
    });
  }

  const prototypeCache = new Map();
  const definitions = [...rawBlueprints.keys()].map((guid) => normalizeDefinition(guid, rawBlueprints, guidIndex, localizationStrings, prototypeCache))
    .sort(compareBy((entry) => entry.category, (entry) => entry.internalName, (entry) => entry.guid));
  const definitionByGuid = new Map(definitions.map((definition) => [definition.guid, definition]));
  const choicePools = [];
  const progressions = [];
  const archetypePatches = [];
  const spellLists = [];
  const spellbooks = [];
  const spellsTables = [];
  const statProgressions = [];
  const parametrizedFeatures = [];

  definitions.forEach((definition) => {
    const entry = guidIndex.get(definition.guid);
    const data = prototypeCache.get(definition.guid).data;
    if (isSelection(entry)) choicePools.push(buildChoicePool(definition, data));
    if (isProgression(entry)) progressions.push(stableClone({
      guid: definition.guid,
      internalName: definition.internalName,
      levels: progressionLevels(data),
      LevelEntries: stableClone(data.LevelEntries || [])
    }));
    if (isArchetype(entry)) archetypePatches.push(stableClone({
      guid: definition.guid,
      internalName: definition.internalName,
      classGuid: normalizeGuid(data.m_ParentClass || data.m_CharacterClass),
      addFeatures: archetypeLevels(data.AddFeatures || data.m_AddFeatures),
      removeFeatures: archetypeLevels(data.RemoveFeatures || data.m_RemoveFeatures),
      AddFeatures: stableClone(data.AddFeatures || data.m_AddFeatures || []),
      RemoveFeatures: stableClone(data.RemoveFeatures || data.m_RemoveFeatures || []),
      replaceSpellbook: normalizeGuid(data.m_ReplaceSpellbook ?? data.ReplaceSpellbook)
    }));
    if (isSpellList(entry)) spellLists.push(stableClone({
      guid: definition.guid,
      internalName: definition.internalName,
      isMythic: data.IsMythic ?? null,
      levels: spellListLevels(data),
      SpellsByLevel: stableClone(data.SpellsByLevel || data.m_SpellsByLevel || [])
    }));
    if (isSpellbook(entry)) spellbooks.push(spellbookData(definition, data));
    if (isSpellsTable(entry)) spellsTables.push(stableClone({
      guid: definition.guid,
      internalName: definition.internalName,
      levels: spellsTableLevels(data)
    }));
    if (isStatProgression(entry)) statProgressions.push(stableClone({
      guid: definition.guid,
      internalName: definition.internalName,
      bonuses: (data.Bonuses || []).map((value) => Number(value) || 0)
    }));
    if (isParametrized(entry)) parametrizedFeatures.push(stableClone({
      guid: definition.guid,
      internalName: definition.internalName,
      ...definition.parameter
    }));
  });
  choicePools.sort(compareBy((entry) => entry.internalName, (entry) => entry.guid));
  progressions.sort(compareBy((entry) => entry.internalName, (entry) => entry.guid));
  archetypePatches.sort(compareBy((entry) => entry.internalName, (entry) => entry.guid));
  spellLists.sort(compareBy((entry) => entry.internalName, (entry) => entry.guid));
  spellbooks.sort(compareBy((entry) => entry.internalName, (entry) => entry.guid));
  spellsTables.sort(compareBy((entry) => entry.internalName, (entry) => entry.guid));
  statProgressions.sort(compareBy((entry) => entry.internalName, (entry) => entry.guid));
  parametrizedFeatures.sort(compareBy((entry) => entry.internalName, (entry) => entry.guid));

  const resolvedRoot = prototypeCache.get(rootEntry.guid).data;
  const rootCatalog = rootCatalogFromData(resolvedRoot);
  rootCatalog.blueprintRootGuid = rootEntry.guid;
  const classArchetypes = [];
  const excludedArchetypes = [];
  [...rootCatalog.characterClasses, ...rootCatalog.characterMythics].forEach((classGuid) => {
    const classData = prototypeCache.get(classGuid)?.data;
    if (!classData) return;
    refs(classData.m_Archetypes || []).forEach((archetypeGuid) => {
      const archetype = guidIndex.get(archetypeGuid);
      const item = { classGuid, archetypeGuid, blueprintPath: archetype?.blueprintPath || null };
      if (archetype && /^Classes\//i.test(archetype.blueprintPath)) classArchetypes.push(item);
      else excludedArchetypes.push(item);
    });
  });
  rootCatalog.classArchetypes = classArchetypes.sort(compareBy((item) => item.classGuid, (item) => item.archetypeGuid));

  const playableMythicNames = new Set([
    "AeonMythicClass",
    "AngelMythicClass",
    "AzataMythicClass",
    "DemonMythicClass",
    "DevilMythicClass",
    "GoldenDragonClass",
    "LegendClass",
    "LichMythicClass",
    "SwarmThatWalksClass",
    "TricksterMythicClass"
  ]);
  rootCatalog.playableMythicClasses = rootCatalog.characterMythics.filter((guid) => playableMythicNames.has(guidIndex.get(guid)?.internalName));
  rootCatalog.technicalMythicClasses = rootCatalog.characterMythics.filter((guid) => !playableMythicNames.has(guidIndex.get(guid)?.internalName));
  rootCatalog.backgroundSelection = [...guidIndex.values()].find((entry) => entry.internalName === "BackgroundsBaseSelection")?.guid || null;
  rootCatalog.heritageSelections = definitions
    .filter((definition) => /HeritageSelection$/i.test(definition.internalName) && isSelection(guidIndex.get(definition.guid)))
    .map((definition) => definition.guid)
    .sort(compareText);

  const poolByGuid = new Map(choicePools.map((pool) => [pool.guid, pool]));
  const heritageSelectionSet = new Set(rootCatalog.heritageSelections);
  rootCatalog.heritageByRace = rootCatalog.characterRaces.map((raceGuid) => {
    const raceData = prototypeCache.get(raceGuid)?.data;
    const selectionGuid = refs(raceData || {}).find((guid) => heritageSelectionSet.has(guid)) || null;
    return {
      raceGuid,
      raceId: guidIndex.get(raceGuid)?.internalName || raceGuid,
      heritageSelectionGuid: selectionGuid
    };
  }).sort(compareBy((item) => item.raceId, (item) => item.raceGuid));
  const graphRoots = new Set(lock.roots.map((root) => normalizeGuid(root.guid)));
  if (rootCatalog.deitySelection) graphRoots.add(rootCatalog.deitySelection);
  if (rootCatalog.backgroundSelection) graphRoots.add(rootCatalog.backgroundSelection);
  rootCatalog.heritageSelections.forEach((guid) => graphRoots.add(guid));
  const selectionGraphs = [...graphRoots]
    .filter((guid) => poolByGuid.has(guid))
    .map((guid) => analyzeSelectionGraph(guid, poolByGuid))
    .sort(compareBy((item) => item.rootGuid));

  const spellMemberships = spellLists.reduce((total, list) => total + list.levels.reduce((sum, level) => sum + level.spells.length, 0), 0);
  const spellGuids = new Set(spellLists.flatMap((list) => list.levels.flatMap((level) => level.spells)));
  const missingLocalization = definitions.flatMap((definition) => Object.entries(definition.localizationKeys)
    .filter(([, key]) => key && localizationStrings[key] === undefined)
    .map(([field, key]) => ({ guid: definition.guid, field, key })))
    .sort(compareBy((item) => item.guid, (item) => item.field));

  const groupedDefinitions = Object.fromEntries(["abilities", "classes", "domains", "equipment", "feats", "mythic", "spells"].map((category) => [
    category,
    definitions.filter((definition) => definition.category === category)
  ]));
  const indexScope = lock.options?.guidIndexScope === "full" ? [...guidIndex.values()] : [...rawBlueprints.keys()].map((guid) => guidIndex.get(guid));
  const normalizedIndex = indexScope.map(stableClone).sort(compareBy((entry) => entry.guid));
  const heritageOptions = rootCatalog.heritageSelections.reduce((total, guid) => total + (poolByGuid.get(guid)?.options.length || 0), 0);
  const backgroundGraph = selectionGraphs.find((graph) => graph.rootGuid === rootCatalog.backgroundSelection);
  const deityGraph = selectionGraphs.find((graph) => graph.rootGuid === rootCatalog.deitySelection);

  const unloadedReferences = [...new Set(definitions.flatMap((definition) => definition.references).filter((guid) => !definitionByGuid.has(guid)))]
    .sort(compareText);
  const unloadedReferenceTypeCounts = {};
  let unloadedKnownBlueprintReferences = 0;
  let unloadedMechanicsWhitelistReferences = 0;
  unloadedReferences.forEach((guid) => {
    const entry = guidIndex.get(guid);
    const type = entry ? shortBlueprintType(entry, {}) : "UNKNOWN_ASSET";
    if (entry) unloadedKnownBlueprintReferences += 1;
    if (mechanicsClosureType(entry)) unloadedMechanicsWhitelistReferences += 1;
    unloadedReferenceTypeCounts[type] = (unloadedReferenceTypeCounts[type] || 0) + 1;
  });

  const data = stableClone({
    rootCatalog,
    guidIndex: normalizedIndex,
    definitions: groupedDefinitions,
    choicePools,
    selectionGraphs,
    progressions,
    archetypePatches,
    spellLists,
    spellbooks,
    spellsTables,
    statProgressions,
    parametrizedFeatures
  });
  const dataSha256 = sha256(stableStringify(data, 0));
  const snapshotWithoutHash = stableClone({
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    gameId: lock.gameId,
    gameVersion: versionInfo.gameVersion,
    steamBuild: lock.steamBuild,
    provenance: {
      importer: { name: IMPORTER_NAME, version: IMPORTER_VERSION },
      versionInfo,
      sources: [
        sourceDescriptor("blueprints", lock.paths.blueprints, blueprintsHash, sourcePaths.blueprints),
        sourceDescriptor("cheatdata", lock.paths.cheatdata, cheatdataHash, sourcePaths.cheatdata),
        sourceDescriptor("localization", lock.paths.localization, localizationHash, sourcePaths.localization),
        sourceDescriptor("versionInfo", lock.paths.versionInfo, versionInfoHash, sourcePaths.versionInfo)
      ]
    },
    counts: {
      cheatdataEntries: guidIndex.size,
      loadedBlueprints: rawBlueprints.size,
      definitions: definitions.length,
      choicePools: choicePools.length,
      progressions: progressions.length,
      playableArchetypes: classArchetypes.length,
      excludedClassArchetypes: excludedArchetypes.length,
      playableMythicClasses: rootCatalog.playableMythicClasses.length,
      technicalMythicClasses: rootCatalog.technicalMythicClasses.length,
      characterClasses: rootCatalog.characterClasses.length,
      characterRaces: rootCatalog.characterRaces.length,
      heritageSelections: rootCatalog.heritageSelections.length,
      heritageOptions,
      heritageBaselineIncludingHuman: heritageOptions + rootCatalog.heritageByRace.filter((item) => !item.heritageSelectionGuid).length,
      backgroundDirectOptions: backgroundGraph?.directOptions ?? null,
      backgroundLeaves: backgroundGraph?.leaves ?? null,
      deityOptions: deityGraph?.directOptions ?? null,
      spellLists: spellLists.length,
      spellbooks: spellbooks.length,
      spellsTables: spellsTables.length,
      statProgressions: statProgressions.length,
      spellMemberships,
      uniqueSpells: spellGuids.size,
      parametrizedFeatures: parametrizedFeatures.length
    },
    diagnostics: {
      missingLocalization,
      excludedClassArchetypes: excludedArchetypes,
      coverage: {
        mode: lock.options?.mechanicsClosure === true ? "mechanics-closure" : "structural-catalog",
        structurallyClosed: true,
        mechanicallyClosed: lock.options?.mechanicsClosure === true && unloadedMechanicsWhitelistReferences === 0,
        unloadedKnownBlueprintReferences,
        unloadedMechanicsWhitelistReferences,
        unknownAssetReferences: unloadedReferences.length - unloadedKnownBlueprintReferences,
        note: lock.options?.mechanicsClosure === true
          ? "Known mechanics references use the configured whitelist; UNKNOWN_ASSET values are non-cheatdata asset ids."
          : "Feature/ability component references are indexed but not loaded in structural-catalog mode; enable options.mechanicsClosure for the whitelist BFS."
      },
      unloadedReferenceTypeCounts: stableClone(unloadedReferenceTypeCounts),
      unloadedReferences
    },
    hashes: { dataSha256 },
    ...data
  });
  const snapshotSha256 = sha256(stableStringify(snapshotWithoutHash, 0));
  return stableClone({ ...snapshotWithoutHash, hashes: { ...snapshotWithoutHash.hashes, snapshotSha256 } });
}

function renderOwlcatJson(snapshot) {
  return stableStringify(snapshot, 2);
}

function renderOwlcatJs(snapshot, globalName = "WOTR_OWLCAT_SNAPSHOT") {
  invariant(/^[A-Za-z_$][\w$]*$/.test(globalName), `invalid JavaScript global name ${globalName}`);
  return `window.${globalName} = ${JSON.stringify(stableClone(snapshot))};\n`;
}

module.exports = {
  IMPORTER_NAME,
  IMPORTER_VERSION,
  SNAPSHOT_SCHEMA_VERSION,
  analyzeSelectionGraph,
  blueprintPathToArchivePath,
  buildGuidIndex,
  definitionMechanics,
  directReferenceOccurrences,
  extractReferences,
  importOwlcatInstall,
  mergePrototypeData,
  normalizeDefinition,
  parseVersionInfo,
  renderOwlcatJs,
  renderOwlcatJson,
  resolvePrototypeData,
  structuralReferences
};
