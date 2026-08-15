"use strict";

const { stableClone } = require("./stable-json");

const ADAPTER_NAME = "wotr-owlcat-site-adapter";
const ADAPTER_VERSION = "1.6.0";
const GUID_PATTERN = /^[0-9a-f]{32}$/i;

const ROOT_GUIDS = Object.freeze({
  basicFeats: "247a4068296e8be42890143f451b4b45",
  mythicAbilities: "ba0e5a900b775be4a99702f1ed08914d",
  mythicFeats: "9ee0f6745f555484299b0a1563b99d81",
  domains: "48525e5da45c9c243a343fc6545dbdb9"
});

const BASE_CLASS_INTERNAL_NAMES = new Set([
  "AlchemistClass", "ArcanistClass", "BarbarianClass", "BardClass", "BloodragerClass", "CavalierClass",
  "ClericClass", "DruidClass", "FighterClass", "HunterClass", "InquisitorClass", "KineticistClass",
  "MagusClass", "MonkClass", "OracleClass", "PaladinClass", "RangerClass", "RogueClass", "ShamanClass",
  "ShifterClass", "SkaldClass", "SlayerClass", "SorcererClass", "WarpriestClass", "WitchClass", "WizardClass"
]);

const PRESTIGE_CLASS_INTERNAL_NAMES = new Set([
  "ArcaneTricksterClass", "AssassinClass", "DragonDiscipleClass", "DuelistClass", "EldritchKnightClass",
  "HellknightClass", "HellknightSigniferClass", "LoremasterClass", "MysticTheurgeClass", "StalwartDefenderClass",
  "StudentOfWarClass", "SwordlordClass", "WinterWitchClass"
]);

const TECHNICAL_CLASS_INTERNAL_NAMES = new Set(["EldritchScionClass"]);

function invariant(condition, message) {
  if (!condition) throw new Error(`WotR Owlcat site adapter: ${message}`);
}

function normalizeGuid(value) {
  return typeof value === "string" && GUID_PATTERN.test(value) ? value.toLowerCase() : null;
}

function compareText(left, right) {
  return String(left ?? "").localeCompare(String(right ?? ""), "en");
}

function compareBy(...selectors) {
  return (left, right) => {
    for (const selector of selectors) {
      const compared = compareText(selector(left), selector(right));
      if (compared) return compared;
    }
    return 0;
  };
}

function slugify(value) {
  return String(value || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function slugAliases(internalName) {
  const full = slugify(internalName);
  if (!full) return [];
  const withoutTechnicalSuffix = full.replace(/-(feature|feat|class|race|selection|progression|archetype)$/, "");
  return [...new Set([full, withoutTechnicalSuffix].filter(Boolean))].sort(compareText);
}

function definitionIndex(snapshot) {
  const definitions = Object.values(snapshot.definitions || {}).flat();
  const result = new Map();
  definitions.forEach((definition) => {
    const guid = normalizeGuid(definition?.guid);
    invariant(guid, "definition has an invalid GUID");
    invariant(!result.has(guid), `duplicate definition GUID ${guid}`);
    result.set(guid, definition);
  });
  return result;
}

function aliasesFor(definition, aliasesByGuid = {}) {
  const configured = aliasesByGuid[definition?.guid] || aliasesByGuid[normalizeGuid(definition?.guid)] || [];
  const explicit = Array.isArray(configured) ? configured : [configured];
  return [...new Set([...slugAliases(definition?.internalName), ...explicit.map(slugify).filter(Boolean)])].sort(compareText);
}

function compactNativeValue(value) {
  if (Array.isArray(value)) return value.map(compactNativeValue);
  if (!value || typeof value !== "object") return value;
  const result = {};
  Object.entries(value).forEach(([key, child]) => {
    if (key === "name" && /^\$/.test(String(child || ""))) return;
    if (key === "m_Flags" && (child === 0 || child === null)) return;
    if (key === "m_Overrides" && Array.isArray(child) && child.length === 0) return;
    if (key === "PrototypeLink" && child && !child.guid && !child.name) return;
    result[key] = compactNativeValue(child);
  });
  return result;
}

function compactComponents(components) {
  return (components || [])
    .filter((component) => {
      const type = String(component?.$type || "").split(",").pop().trim();
      return !/^(?:Prerequisite|Recommendation|FeatureTagsComponent|RecalculateOn)/.test(type);
    })
    .map(compactNativeValue);
}

function compactAvailability(availability) {
  if (!availability) return null;
  const defaultOnly = availability.scope === "source-default"
    && !availability.hideInUI
    && !availability.hideNotAvailableInUI
    && !Number(availability.prerequisiteComponentCount)
    && !(availability.reasons || []).length;
  return defaultOnly ? null : availability;
}

function adaptDefinition(definition, sourceGuid, aliasesByGuid = {}) {
  const guid = normalizeGuid(sourceGuid || definition?.guid);
  invariant(guid, `invalid source GUID ${sourceGuid || definition?.guid}`);
  const localization = definition?.localization || {};
  const blueprintType = definition?.blueprintType || null;
  const sourceComponents = definition?.components || [];
  const executableAbility = /Blueprint(?:Ability|ActivatableAbility)$/i.test(blueprintType || "");
  return stableClone({
    id: guid,
    sourceGuid: guid,
    aliases: aliasesFor(definition || { guid }, aliasesByGuid),
    internalName: definition?.internalName || null,
    blueprintType,
    blueprintPath: definition?.blueprintPath || null,
    name: localization.name ?? null,
    description: localization.description ?? localization.shortDescription ?? null,
    shortDescription: localization.shortDescription ?? null,
    requirements: stableClone(definition?.requirements || []),
    componentCount: sourceComponents.length,
    components: executableAbility ? [] : stableClone(compactComponents(sourceComponents)),
    mechanics: stableClone(definition?.mechanics || {}),
    references: (definition?.references || []).map(normalizeGuid).filter(Boolean),
    parameter: definition?.parameter ? stableClone(definition.parameter) : null,
    availability: stableClone(compactAvailability(definition?.availability)),
    unresolved: !definition
  });
}

function componentReferenceGuids(definition) {
  const matches = JSON.stringify(definition?.components || []).match(/[0-9a-f]{32}/ig) || [];
  return [...new Set(matches.map((value) => value.toLowerCase()))].sort(compareText);
}

function classGroup(internalName) {
  if (BASE_CLASS_INTERNAL_NAMES.has(internalName)) return "base";
  if (PRESTIGE_CLASS_INTERNAL_NAMES.has(internalName)) return "prestige";
  return "technical";
}

function isPentaReference(reference, definition) {
  return /^Penta_/i.test(definition?.internalName || "") || /(?:^|[\\/])Penta_/i.test(reference?.blueprintPath || definition?.blueprintPath || "");
}

function adaptOwlcatSnapshot(snapshot, options = {}) {
  invariant(snapshot && snapshot.schemaVersion === 1, "snapshot schemaVersion must be 1");
  invariant(snapshot.gameId === "pathfinder-wrath-of-the-righteous", "snapshot gameId is not Wrath of the Righteous");
  invariant(snapshot.rootCatalog && Array.isArray(snapshot.choicePools), "snapshot is missing rootCatalog/choicePools");
  const aliasesByGuid = options.aliasesByGuid || {};
  const definitions = definitionIndex(snapshot);
  const poolByGuid = new Map(snapshot.choicePools.map((pool) => [normalizeGuid(pool.guid), pool]));
  const adaptedByGuid = new Map();
  const entity = (guidValue) => {
    const guid = normalizeGuid(guidValue);
    invariant(guid, `invalid referenced GUID ${guidValue}`);
    if (!adaptedByGuid.has(guid)) adaptedByGuid.set(guid, adaptDefinition(definitions.get(guid), guid, aliasesByGuid));
    return stableClone(adaptedByGuid.get(guid));
  };

  const choiceRoots = Object.fromEntries(Object.entries(ROOT_GUIDS).map(([id, rootGuid]) => {
    const pool = poolByGuid.get(rootGuid);
    invariant(pool, `snapshot is missing ${id} root ${rootGuid}`);
    const options = pool.options.map((optionGuid) => {
      const item = entity(optionGuid);
      const nestedPool = poolByGuid.get(item.sourceGuid);
      return stableClone({
        ...item,
        nestedSelectionGuid: nestedPool ? item.sourceGuid : null,
        nestedOptionSourceGuids: nestedPool ? [...nestedPool.options] : []
      });
    });
    return [id, stableClone({
      id: rootGuid,
      sourceGuid: rootGuid,
      internalName: pool.internalName,
      name: definitions.get(rootGuid)?.localization?.name ?? null,
      options
    })];
  }));

  // Keep the selection graph intact in the browser artifact. A root option can
  // itself be a selection (Skill Focus, bloodlines, orders, rage powers, and so
  // on); flattening only the four public roots loses the second-level choice
  // that the level-up UI must persist. Definitions are de-duplicated by GUID so
  // the graph remains substantially smaller than the mechanics snapshot.
  const selectionPools = snapshot.choicePools.map((pool) => {
    const sourceGuid = normalizeGuid(pool.guid);
    entity(sourceGuid);
    pool.options.forEach(entity);
    return stableClone({
      id: sourceGuid,
      sourceGuid,
      internalName: pool.internalName || null,
      name: pool.name ?? definitions.get(sourceGuid)?.localization?.name ?? null,
      optionSourceGuids: [...pool.options].map(normalizeGuid).filter(Boolean)
    });
  }).sort(compareBy((item) => item.sourceGuid));

  const classRoots = snapshot.rootCatalog.characterClasses.map((guid) => {
    const item = entity(guid);
    const references = definitions.get(normalizeGuid(guid))?.references || [];
    return stableClone({ ...item, references: references.map(normalizeGuid).filter(Boolean), group: classGroup(item.internalName), technicalReason: TECHNICAL_CLASS_INTERNAL_NAMES.has(item.internalName) ? "owlcat-technical-eldritch-scion-class" : null });
  });
  const classes = {
    base: classRoots.filter((item) => item.group === "base").sort(compareBy((item) => item.sourceGuid)),
    prestige: classRoots.filter((item) => item.group === "prestige").sort(compareBy((item) => item.sourceGuid)),
    technical: classRoots.filter((item) => item.group === "technical").sort(compareBy((item) => item.sourceGuid))
  };
  const mythicClasses = {
    playable: (snapshot.rootCatalog.playableMythicClasses || []).map(entity).sort(compareBy((item) => item.sourceGuid)),
    technical: (snapshot.rootCatalog.technicalMythicClasses || []).map(entity).sort(compareBy((item) => item.sourceGuid))
  };
  const characterCreation = stableClone({
    races: (snapshot.rootCatalog.characterRaces || []).map(entity).sort(compareBy((item) => item.sourceGuid)),
    heritageByRace: snapshot.rootCatalog.heritageByRace || [],
    backgroundSelectionGuid: normalizeGuid(snapshot.rootCatalog.backgroundSelection),
    deitySelectionGuid: normalizeGuid(snapshot.rootCatalog.deitySelection),
    deities: (poolByGuid.get(normalizeGuid(snapshot.rootCatalog.deitySelection))?.options || []).map((guid) => {
      const item = entity(guid);
      return { ...item, references: (definitions.get(normalizeGuid(guid))?.references || []).map(normalizeGuid).filter(Boolean) };
    }).sort(compareBy((item) => item.sourceGuid))
  });

  const excludedArchetypes = snapshot.diagnostics?.excludedClassArchetypes || [];
  const excludedArchetypeGuids = new Set(excludedArchetypes.map((item) => normalizeGuid(item.archetypeGuid)).filter(Boolean));
  const patchByGuid = new Map((snapshot.archetypePatches || []).map((patch) => [normalizeGuid(patch.guid), patch]));
  const archetypes = (snapshot.rootCatalog.classArchetypes || [])
    .filter((reference) => !excludedArchetypeGuids.has(normalizeGuid(reference.archetypeGuid)))
    .filter((reference) => !isPentaReference(reference, definitions.get(normalizeGuid(reference.archetypeGuid))))
    .map((reference) => {
      const item = entity(reference.archetypeGuid);
      const patch = patchByGuid.get(item.sourceGuid);
      return stableClone({
        ...item,
        classGuid: normalizeGuid(reference.classGuid),
        classGroup: classGroup(definitions.get(normalizeGuid(reference.classGuid))?.internalName),
        addFeatures: stableClone(patch?.addFeatures || []),
        removeFeatures: stableClone(patch?.removeFeatures || []),
        replaceSpellbook: patch?.replaceSpellbook ?? null
      });
    })
    .sort(compareBy((item) => item.classGuid, (item) => item.sourceGuid));

  const membershipsBySpell = new Map();
  let spellMemberships = 0;
  (snapshot.spellLists || []).forEach((spellList) => {
    (spellList.levels || []).forEach((level) => {
      const occurrences = new Map();
      (level.spells || []).forEach((spellGuidValue) => {
        const spellGuid = normalizeGuid(spellGuidValue);
        if (!spellGuid) return;
        const occurrenceKey = `${spellList.guid}:${level.spellLevel}:${spellGuid}`;
        const occurrence = (occurrences.get(occurrenceKey) || 0) + 1;
        occurrences.set(occurrenceKey, occurrence);
        if (!membershipsBySpell.has(spellGuid)) membershipsBySpell.set(spellGuid, []);
        membershipsBySpell.get(spellGuid).push(stableClone({
          sourceGuid: normalizeGuid(spellList.guid),
          internalName: spellList.internalName,
          spellLevel: Number(level.spellLevel),
          occurrence
        }));
        spellMemberships += 1;
      });
    });
  });
  const spells = [...membershipsBySpell.entries()].map(([guid, memberships]) => stableClone({
    ...entity(guid),
    spellLists: memberships.sort(compareBy((item) => item.sourceGuid, (item) => item.spellLevel, (item) => item.occurrence))
  })).sort(compareBy((item) => item.sourceGuid));
  const spellbooks = (snapshot.spellbooks || []).map((spellbook) => stableClone({
    ...entity(spellbook.guid),
    ...spellbook,
    guid: normalizeGuid(spellbook.guid),
    sourceGuid: normalizeGuid(spellbook.guid)
  })).sort(compareBy((item) => item.internalName, (item) => item.sourceGuid));
  const spellsTables = stableClone(snapshot.spellsTables || []).sort(compareBy((item) => item.internalName, (item) => item.guid));
  const statProgressions = stableClone(snapshot.statProgressions || []).sort(compareBy((item) => item.internalName, (item) => item.guid));
  const equipment = {
    weaponTypes: [...definitions.values()].filter((definition) => definition.blueprintType === "BlueprintWeaponType").map((definition) => entity(definition.guid)).sort(compareBy((item) => item.sourceGuid)),
    armorTypes: [...definitions.values()].filter((definition) => definition.blueprintType === "BlueprintArmorType").map((definition) => entity(definition.guid)).sort(compareBy((item) => item.sourceGuid)),
    shieldTypes: [...definitions.values()].filter((definition) => definition.blueprintType === "BlueprintShieldType").map((definition) => entity(definition.guid)).sort(compareBy((item) => item.sourceGuid))
  };

  // Build a presentation index from the same source progressions that drive
  // level-up.  Store GUIDs plus occurrences here and keep the full definitions
  // de-duplicated in selectionDefinitions below.  This makes every class,
  // archetype, mythic-path and domain choice discoverable without maintaining a
  // second hand-authored catalog.
  const progressionByGuid = new Map((snapshot.progressions || []).map((progression) => [normalizeGuid(progression.guid), progression]));
  const catalogBuckets = {
    classFeatures: new Map(),
    pathFeatures: new Map(),
    domainFeatures: new Map()
  };
  const occurrenceKey = (occurrence) => [
    occurrence.ownerType,
    occurrence.ownerGuid,
    occurrence.role,
    occurrence.selectionGuid || ""
  ].join(":");
  const addCatalogOccurrence = (bucket, guidValue, occurrence, poolStack = new Set()) => {
    const guid = normalizeGuid(guidValue);
    if (!guid || !definitions.has(guid)) return;
    entity(guid);
    if (!bucket.has(guid)) bucket.set(guid, new Map());
    const key = occurrenceKey(occurrence);
    const existing = bucket.get(guid).get(key);
    const levels = [...new Set([...(existing?.levels || []), Number(occurrence.level)].filter(Number.isFinite))].sort((left, right) => left - right);
    const normalizedOccurrence = { ...occurrence, levels };
    delete normalizedOccurrence.level;
    bucket.get(guid).set(key, stableClone(normalizedOccurrence));
    const pool = poolByGuid.get(guid);
    if (!pool || poolStack.has(guid)) return;
    const nextStack = new Set(poolStack).add(guid);
    pool.options.forEach((optionGuid) => addCatalogOccurrence(bucket, optionGuid, {
      ...occurrence,
      role: "option",
      selectionGuid: guid,
      selectionName: definitions.get(guid)?.localization?.name || pool.internalName || guid
    }, nextStack));
  };
  const addProgression = (bucket, ownerType, owner, progression, role = "grant", excludedGuids = new Set()) => {
    if (!progression) return;
    (progression.levels || []).forEach((level) => (level.features || [])
      .filter((featureGuid) => !excludedGuids.has(normalizeGuid(featureGuid)))
      .forEach((featureGuid) => addCatalogOccurrence(bucket, featureGuid, {
      ownerType,
      ownerGuid: owner.sourceGuid,
      ownerName: owner.name || owner.internalName || owner.sourceGuid,
      level: Number(level.level),
      role,
      selectionGuid: null,
      selectionName: null
    })));
  };
  [...classes.base, ...classes.prestige].forEach((owner) => addProgression(
    catalogBuckets.classFeatures,
    "class",
    owner,
    progressionByGuid.get(normalizeGuid(owner.mechanics?.characterClass?.progression))
  ));
  archetypes.forEach((owner) => (owner.addFeatures || []).forEach((level) => (level.features || []).forEach((featureGuid) => addCatalogOccurrence(
    catalogBuckets.classFeatures,
    featureGuid,
    {
      ownerType: "archetype",
      ownerGuid: owner.sourceGuid,
      ownerName: owner.name || owner.internalName || owner.sourceGuid,
      level: Number(level.level),
      role: "grant",
      selectionGuid: null,
      selectionName: null
    }
  ))));
  mythicClasses.playable.forEach((owner) => addProgression(
    catalogBuckets.pathFeatures,
    "mythic-path",
    owner,
    progressionByGuid.get(normalizeGuid(owner.mechanics?.characterClass?.progression)),
    "grant",
    new Set([ROOT_GUIDS.mythicAbilities, ROOT_GUIDS.mythicFeats])
  ));
  choiceRoots.domains.options.forEach((owner) => addProgression(
    catalogBuckets.domainFeatures,
    "domain",
    owner,
    progressionByGuid.get(owner.sourceGuid)
  ));

  const renderCatalogBucket = (bucket) => [...bucket.entries()]
    .map(([sourceGuid, occurrences]) => ({
      sourceGuid,
      occurrences: [...occurrences.values()].sort(compareBy(
        (item) => item.ownerType,
        (item) => item.ownerName,
        (item) => String(item.levels?.[0] ?? 0).padStart(3, "0"),
        (item) => item.role,
        (item) => item.selectionGuid || ""
      ))
    }))
    .sort(compareBy((item) => item.sourceGuid));

  // Ability blueprints include spells, spell-like, supernatural,
  // extraordinary and activatable abilities.  Keep every imported definition;
  // hidden/technical status stays on the definition so the UI can label rather
  // than silently discard it.
  const abilitySourceGuids = [...definitions.values()]
    .filter((definition) => /Blueprint(?:Ability|ActivatableAbility)$/i.test(definition.blueprintType || ""))
    .map((definition) => normalizeGuid(definition.guid))
    .filter(Boolean)
    .sort(compareText);
  abilitySourceGuids.forEach(entity);
  const catalogs = {
    classFeatures: renderCatalogBucket(catalogBuckets.classFeatures),
    pathFeatures: renderCatalogBucket(catalogBuckets.pathFeatures),
    domainFeatures: renderCatalogBucket(catalogBuckets.domainFeatures),
    abilities: abilitySourceGuids
  };

  // Automatic progression grants are not choice-pool members, but the level
  // timeline and Wiki still need their localized definitions and mechanics.
  (snapshot.progressions || []).forEach((progression) => (progression.levels || [])
    .forEach((level) => (level.features || []).forEach(entity)));
  (snapshot.archetypePatches || []).forEach((patch) => [...(patch.addFeatures || []), ...(patch.removeFeatures || [])]
    .forEach((level) => (level.features || []).forEach(entity)));

  // Race roots store their always-on traits in BlueprintRace.m_Features rather
  // than a class progression. Background and heritage leaves can likewise
  // grant helper features through components. Keep this focused creation-time
  // mechanics closure in the compact site artifact so passive effects can be
  // replayed without shipping the full 65 MB importer snapshot.
  const creationRoots = new Set(characterCreation.races.flatMap((race) => race.mechanics?.race?.features || []).map(normalizeGuid).filter(Boolean));
  (characterCreation.heritageByRace || []).forEach((relation) => {
    const pool = poolByGuid.get(normalizeGuid(relation.heritageSelectionGuid));
    (pool?.options || []).map(normalizeGuid).filter(Boolean).forEach((guid) => creationRoots.add(guid));
  });
  const addSelectionLeaves = (selectionGuid, stack = new Set()) => {
    const guid = normalizeGuid(selectionGuid);
    if (!guid || stack.has(guid)) return;
    const pool = poolByGuid.get(guid);
    if (!pool) {
      creationRoots.add(guid);
      return;
    }
    const nextStack = new Set(stack).add(guid);
    (pool.options || []).forEach((optionGuid) => addSelectionLeaves(optionGuid, nextStack));
  };
  addSelectionLeaves(characterCreation.backgroundSelectionGuid);
  const creationMechanicsTypes = /Blueprint(?:Feature|FeatureSelection|ParametrizedFeature|Progression)$/i;
  const includedCreationMechanics = new Set();
  const includeCreationMechanics = (guidValue, stack = new Set()) => {
    const guid = normalizeGuid(guidValue);
    if (!guid || stack.has(guid) || includedCreationMechanics.has(guid) || !definitions.has(guid)) return;
    includedCreationMechanics.add(guid);
    entity(guid);
    const nextStack = new Set(stack).add(guid);
    componentReferenceGuids(definitions.get(guid)).forEach((reference) => {
      const referenced = definitions.get(reference);
      if (referenced && creationMechanicsTypes.test(referenced.blueprintType || "")) includeCreationMechanics(reference, nextStack);
    });
  };
  creationRoots.forEach((guid) => includeCreationMechanics(guid));

  // Mythic path entry rules reference BlueprintEtude story flags. Keep those
  // exact definitions (normally internal-name only) so the builder can persist
  // explicit campaign-state assumptions instead of treating the prerequisite
  // as an opaque or automatically satisfied condition.
  [...classes.base, ...classes.prestige, ...classes.technical, ...mythicClasses.playable, ...mythicClasses.technical]
    .flatMap((entry) => componentReferenceGuids({ components: entry.requirements || [] }))
    .filter((guid) => /BlueprintEtude$/i.test(definitions.get(guid)?.blueprintType || ""))
    .forEach(entity);

  const excluded = excludedArchetypes.map((reference) => stableClone({
    sourceGuid: normalizeGuid(reference.archetypeGuid),
    classGuid: normalizeGuid(reference.classGuid),
    blueprintPath: reference.blueprintPath || null,
    reason: "companion-or-npc-penta-archetype"
  })).sort(compareBy((item) => item.classGuid, (item) => item.sourceGuid));

  const selectionDefinitions = Object.fromEntries([...adaptedByGuid.entries()]
    .sort(([left], [right]) => compareText(left, right))
    .map(([guid, definition]) => {
      const { aliases, references, shortDescription, unresolved, ...runtimeDefinition } = definition;
      return [guid, stableClone(runtimeDefinition)];
    }));

  const aliasSets = new Map();
  adaptedByGuid.forEach((item, guid) => item.aliases.forEach((alias) => {
    if (!aliasSets.has(alias)) aliasSets.set(alias, new Set());
    aliasSets.get(alias).add(guid);
  }));
  const aliasIndex = Object.fromEntries([...aliasSets.entries()].sort(([left], [right]) => compareText(left, right))
    .map(([alias, guids]) => [alias, [...guids].sort(compareText)]));
  const sourceGuids = [...adaptedByGuid.keys()].sort(compareText);
  const allOutputItems = [
    ...Object.values(choiceRoots).flatMap((root) => root.options),
    ...classes.base, ...classes.prestige, ...classes.technical,
    ...mythicClasses.playable, ...mythicClasses.technical,
    ...archetypes,
    ...spells,
    ...equipment.weaponTypes, ...equipment.armorTypes, ...equipment.shieldTypes
  ];
  const missingOfficialLocalization = allOutputItems
    .filter((item) => item.name === null || item.description === null)
    .map((item) => ({ sourceGuid: item.sourceGuid, missingName: item.name === null, missingDescription: item.description === null }))
    .sort(compareBy((item) => item.sourceGuid));

  return stableClone({
    schemaVersion: 1,
    adapter: { name: ADAPTER_NAME, version: ADAPTER_VERSION },
    sourceSnapshot: {
      gameVersion: snapshot.gameVersion,
      steamBuild: snapshot.steamBuild,
      snapshotSha256: snapshot.hashes?.snapshotSha256 || null,
      dataSha256: snapshot.hashes?.dataSha256 || null,
      importer: stableClone(snapshot.provenance?.importer || null),
      sources: stableClone(snapshot.provenance?.sources || [])
    },
    sourceCoverage: stableClone(snapshot.diagnostics?.coverage || null),
    choiceRoots,
    characterCreation,
    classes,
    mythicClasses,
    archetypes,
    spells,
    spellbooks,
    spellsTables,
    statProgressions,
    equipment,
    catalogs,
    aliasIndex,
    sourceGuids,
    selectionPools,
    selectionDefinitions,
    progressions: stableClone(snapshot.progressions || []),
    parametrizedFeatures: stableClone(snapshot.parametrizedFeatures || []),
    counts: {
      basicFeatDirectOptions: choiceRoots.basicFeats.options.length,
      mythicAbilityDirectOptions: choiceRoots.mythicAbilities.options.length,
      mythicFeatDirectOptions: choiceRoots.mythicFeats.options.length,
      domainDirectOptions: choiceRoots.domains.options.length,
      classRootRefs: classRoots.length,
      baseClasses: classes.base.length,
      prestigeClasses: classes.prestige.length,
      technicalClasses: classes.technical.length,
      playableMythicClasses: mythicClasses.playable.length,
      technicalMythicClasses: mythicClasses.technical.length,
      races: characterCreation.races.length,
      heritageOptions: characterCreation.heritageByRace.reduce((total, item) => total + (poolByGuid.get(normalizeGuid(item.heritageSelectionGuid))?.options.length || (item.heritageSelectionGuid ? 0 : 1)), 0),
      backgroundDirectOptions: poolByGuid.get(characterCreation.backgroundSelectionGuid)?.options.length || 0,
      deityOptions: poolByGuid.get(characterCreation.deitySelectionGuid)?.options.length || 0,
      classArchetypeRefs: (snapshot.rootCatalog.classArchetypes || []).length + excluded.length,
      archetypes: archetypes.length,
      excludedArchetypes: excluded.length,
      spellLists: (snapshot.spellLists || []).length,
      spellMemberships,
      spells: spells.length,
      spellbooks: spellbooks.length,
      spellsTables: spellsTables.length,
      statProgressions: statProgressions.length,
      weaponTypes: equipment.weaponTypes.length,
      armorTypes: equipment.armorTypes.length,
      shieldTypes: equipment.shieldTypes.length,
      weaponCategories: new Set(equipment.weaponTypes.map((item) => item.mechanics?.weaponType?.category).filter(Boolean)).size,
      selectionPools: selectionPools.length,
      selectionDefinitions: Object.keys(selectionDefinitions).length,
      importedDefinitions: Number(snapshot.counts?.definitions) || definitions.size,
      progressions: (snapshot.progressions || []).length,
      parametrizedFeatures: (snapshot.parametrizedFeatures || []).length,
      classFeatureDefinitions: catalogs.classFeatures.length,
      classFeatureOccurrences: catalogs.classFeatures.reduce((total, item) => total + item.occurrences.length, 0),
      pathFeatureDefinitions: catalogs.pathFeatures.length,
      pathFeatureOccurrences: catalogs.pathFeatures.reduce((total, item) => total + item.occurrences.length, 0),
      domainFeatureDefinitions: catalogs.domainFeatures.length,
      domainFeatureOccurrences: catalogs.domainFeatures.reduce((total, item) => total + item.occurrences.length, 0),
      abilities: catalogs.abilities.length,
      localizedAbilities: catalogs.abilities.filter((guid) => {
        const item = adaptedByGuid.get(guid);
        return Boolean(item?.name && item?.description);
      }).length
    },
    diagnostics: {
      excludedArchetypes: excluded,
      missingOfficialLocalization,
      ambiguousAliases: Object.entries(aliasIndex).filter(([, guids]) => guids.length > 1).map(([alias, sourceGuids]) => ({ alias, sourceGuids }))
    }
  });
}

function resolveSourceGuid(adapted, idOrAlias) {
  const guid = normalizeGuid(idOrAlias);
  if (guid) return adapted.sourceGuids.includes(guid) ? guid : null;
  const candidates = adapted.aliasIndex?.[slugify(idOrAlias)] || [];
  if (candidates.length > 1) throw new Error(`WotR Owlcat site adapter: ambiguous alias ${idOrAlias}`);
  return candidates[0] || null;
}

function renderOwlcatSiteJson(adapted) {
  return `${JSON.stringify(stableClone(adapted))}\n`;
}

function renderOwlcatSiteJs(adapted, globalName = "WOTR_OWLCAT_SITE_DATA") {
  invariant(/^[A-Za-z_$][\w$]*$/.test(globalName), `invalid JavaScript global name ${globalName}`);
  return `window.${globalName} = ${JSON.stringify(stableClone(adapted))};\n`;
}

module.exports = {
  ADAPTER_NAME,
  ADAPTER_VERSION,
  ROOT_GUIDS,
  BASE_CLASS_INTERNAL_NAMES,
  PRESTIGE_CLASS_INTERNAL_NAMES,
  TECHNICAL_CLASS_INTERNAL_NAMES,
  adaptOwlcatSnapshot,
  adaptDefinition,
  resolveSourceGuid,
  renderOwlcatSiteJson,
  renderOwlcatSiteJs,
  slugAliases,
  slugify
};
