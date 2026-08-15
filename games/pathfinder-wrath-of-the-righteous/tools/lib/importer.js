"use strict";

const fs = require("fs");
const path = require("path");
const { sha256, stableClone, stableStringify } = require("./stable-json");

const IMPORTER_NAME = "wotr-blueprint-snapshot-importer";
const IMPORTER_VERSION = "1.0.0";
const SNAPSHOT_SCHEMA_VERSION = 1;
const DEFINITION_CATEGORIES = ["abilities", "classes", "domains", "feats", "mythic", "spells"];
const SOURCE_KINDS = new Set(["blueprints", "localization"]);
const PATCH_OPERATIONS = new Set([
  "add-grant",
  "add-slot",
  "override-progression",
  "remove-slot",
  "replace-slot",
  "restrict-pool"
]);

function invariant(condition, message) {
  if (!condition) throw new Error(`WotR importer: ${message}`);
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
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

function uniqueStrings(values, label) {
  const result = [...new Set((values || []).map((value) => String(value)))].sort(compareText);
  invariant(result.length === (values || []).length, `${label} contains duplicate values`);
  return result;
}

function canonicalRequirement(value) {
  if (Array.isArray(value)) return value.map(canonicalRequirement);
  if (!isObject(value)) return value;

  const normalized = Object.fromEntries(Object.entries(value).map(([key, child]) => [key, canonicalRequirement(child)]));
  for (const operator of ["all", "any", "none"]) {
    if (Array.isArray(normalized[operator])) {
      normalized[operator] = normalized[operator]
        .map(stableClone)
        .sort((left, right) => compareText(JSON.stringify(left), JSON.stringify(right)));
    }
  }
  return stableClone(normalized);
}

function normalizeDefinition(entry, sourceId) {
  invariant(isObject(entry), `definition in ${sourceId} must be an object`);
  invariant(typeof entry.guid === "string" && entry.guid, `definition in ${sourceId} is missing guid`);
  invariant(DEFINITION_CATEGORIES.includes(entry.category), `definition ${entry.guid} has unsupported category ${entry.category}`);
  invariant(typeof entry.id === "string" && entry.id, `definition ${entry.guid} is missing stable id`);

  const normalized = {
    id: entry.id,
    guid: entry.guid,
    category: entry.category,
    sourceId
  };
  for (const field of ["blueprintType", "internalName", "definitionType", "nameKey", "descriptionKey"]) {
    if (entry[field] !== undefined) normalized[field] = entry[field];
  }
  if (entry.aliases) normalized.aliases = uniqueStrings(entry.aliases, `definition ${entry.guid} aliases`);
  if (entry.tags) normalized.tags = uniqueStrings(entry.tags, `definition ${entry.guid} tags`);
  if (entry.requirements) normalized.requirements = canonicalRequirement(entry.requirements);
  if (entry.data) normalized.data = stableClone(entry.data);
  return normalized;
}

function normalizePool(entry, sourceId) {
  invariant(isObject(entry) && typeof entry.id === "string" && entry.id, `choice pool in ${sourceId} is missing id`);
  invariant(Array.isArray(entry.categories) && entry.categories.length, `choice pool ${entry.id} must declare categories`);
  entry.categories.forEach((category) => invariant(DEFINITION_CATEGORIES.includes(category), `choice pool ${entry.id} has unsupported category ${category}`));
  invariant(Array.isArray(entry.options) || isObject(entry.query), `choice pool ${entry.id} needs options or query`);

  const options = (entry.options || []).map((option) => {
    const normalized = typeof option === "string" ? { definitionGuid: option } : stableClone(option);
    invariant(typeof normalized.definitionGuid === "string" && normalized.definitionGuid, `choice pool ${entry.id} has an option without definitionGuid`);
    if (normalized.requirements) normalized.requirements = canonicalRequirement(normalized.requirements);
    return normalized;
  }).sort(compareBy((item) => item.definitionGuid, (item) => JSON.stringify(item)));

  const normalized = {
    id: entry.id,
    categories: uniqueStrings(entry.categories, `choice pool ${entry.id} categories`),
    options,
    sourceId
  };
  if (entry.labelKey) normalized.labelKey = entry.labelKey;
  if (entry.query) normalized.query = stableClone(entry.query);
  if (entry.requirements) normalized.requirements = canonicalRequirement(entry.requirements);
  if (entry.data) normalized.data = stableClone(entry.data);
  return normalized;
}

function normalizeSlot(slot, progressionId) {
  invariant(isObject(slot) && typeof slot.id === "string" && slot.id, `progression ${progressionId} has a slot without id`);
  invariant(Number.isInteger(slot.order), `progression slot ${slot.id} must declare integer order`);
  invariant(typeof slot.poolId === "string" && slot.poolId, `progression slot ${slot.id} is missing poolId`);
  const normalized = {
    id: slot.id,
    order: slot.order,
    poolId: slot.poolId,
    count: Number.isInteger(slot.count) ? slot.count : 1,
    required: slot.required !== false
  };
  invariant(normalized.count > 0, `progression slot ${slot.id} count must be positive`);
  for (const field of ["scope", "owner", "labelKey"]) {
    if (slot[field] !== undefined) normalized[field] = slot[field];
  }
  if (slot.requirements) normalized.requirements = canonicalRequirement(slot.requirements);
  if (slot.effects) normalized.effects = stableClone(slot.effects);
  if (slot.data) normalized.data = stableClone(slot.data);
  return normalized;
}

function normalizeProgression(entry, sourceId) {
  invariant(isObject(entry) && typeof entry.id === "string" && entry.id, `progression in ${sourceId} is missing id`);
  invariant(typeof entry.ownerGuid === "string" && entry.ownerGuid, `progression ${entry.id} is missing ownerGuid`);
  invariant(Array.isArray(entry.levels), `progression ${entry.id} levels must be an array`);

  const levels = entry.levels.map((levelEntry) => {
    invariant(Number.isInteger(levelEntry.level) && levelEntry.level >= 0, `progression ${entry.id} has an invalid level`);
    invariant(Array.isArray(levelEntry.slots), `progression ${entry.id} level ${levelEntry.level} slots must be an array`);
    const slots = levelEntry.slots.map((slot) => normalizeSlot(slot, entry.id))
      .sort((left, right) => left.order - right.order || compareText(left.id, right.id));
    invariant(new Set(slots.map((slot) => slot.id)).size === slots.length, `progression ${entry.id} level ${levelEntry.level} has duplicate slot ids`);
    const normalized = { level: levelEntry.level, slots };
    if (levelEntry.grants) normalized.grants = uniqueStrings(levelEntry.grants, `progression ${entry.id} level ${levelEntry.level} grants`);
    if (levelEntry.data) normalized.data = stableClone(levelEntry.data);
    return normalized;
  }).sort((left, right) => left.level - right.level);
  invariant(new Set(levels.map((item) => item.level)).size === levels.length, `progression ${entry.id} has duplicate levels`);

  const normalized = {
    id: entry.id,
    ownerGuid: entry.ownerGuid,
    axis: entry.axis || "classLevel",
    levels,
    sourceId
  };
  if (Number.isInteger(entry.maxLevel)) normalized.maxLevel = entry.maxLevel;
  if (entry.data) normalized.data = stableClone(entry.data);
  return normalized;
}

function normalizePatchOperation(operation, patchId) {
  invariant(isObject(operation), `archetype patch ${patchId} operation must be an object`);
  invariant(Number.isInteger(operation.order), `archetype patch ${patchId} operation must declare integer order`);
  invariant(PATCH_OPERATIONS.has(operation.op), `archetype patch ${patchId} has unsupported operation ${operation.op}`);
  invariant(typeof operation.target === "string" && operation.target, `archetype patch ${patchId} operation is missing target`);
  const normalized = { order: operation.order, op: operation.op, target: operation.target };
  for (const field of ["poolId", "replacementPoolId", "level"]) {
    if (operation[field] !== undefined) normalized[field] = operation[field];
  }
  if (operation.slot) normalized.slot = normalizeSlot(operation.slot, `patch ${patchId}`);
  if (operation.definitionGuids) normalized.definitionGuids = uniqueStrings(operation.definitionGuids, `archetype patch ${patchId} definitionGuids`);
  if (operation.value !== undefined) normalized.value = stableClone(operation.value);
  if (operation.requirements) normalized.requirements = canonicalRequirement(operation.requirements);
  return normalized;
}

function normalizePatch(entry, sourceId) {
  invariant(isObject(entry) && typeof entry.id === "string" && entry.id, `archetype patch in ${sourceId} is missing id`);
  invariant(typeof entry.archetypeGuid === "string" && entry.archetypeGuid, `archetype patch ${entry.id} is missing archetypeGuid`);
  invariant(typeof entry.targetProgressionId === "string" && entry.targetProgressionId, `archetype patch ${entry.id} is missing targetProgressionId`);
  invariant(Array.isArray(entry.operations) && entry.operations.length, `archetype patch ${entry.id} needs operations`);
  const operations = entry.operations.map((operation) => normalizePatchOperation(operation, entry.id))
    .sort((left, right) => left.order - right.order || compareText(left.op, right.op) || compareText(left.target, right.target));
  invariant(new Set(operations.map((operation) => operation.order)).size === operations.length, `archetype patch ${entry.id} has duplicate operation order values`);
  return {
    id: entry.id,
    archetypeGuid: entry.archetypeGuid,
    targetProgressionId: entry.targetProgressionId,
    operations,
    sourceId
  };
}

function normalizeBlueprintDump(data, sourceId) {
  invariant(isObject(data), `blueprint source ${sourceId} must contain an object`);
  invariant(data.dumpSchemaVersion === 1, `blueprint source ${sourceId} has unsupported dumpSchemaVersion`);
  return {
    dumpSchemaVersion: 1,
    definitions: (data.definitions || []).map((entry) => normalizeDefinition(entry, sourceId))
      .sort(compareBy((entry) => entry.category, (entry) => entry.id, (entry) => entry.guid)),
    choicePools: (data.choicePools || []).map((entry) => normalizePool(entry, sourceId)).sort(compareBy((entry) => entry.id)),
    progressions: (data.progressions || []).map((entry) => normalizeProgression(entry, sourceId)).sort(compareBy((entry) => entry.id)),
    archetypePatches: (data.archetypePatches || []).map((entry) => normalizePatch(entry, sourceId)).sort(compareBy((entry) => entry.id))
  };
}

function normalizeLocalizationDump(data, sourceId) {
  invariant(isObject(data), `localization source ${sourceId} must contain an object`);
  invariant(data.dumpSchemaVersion === 1, `localization source ${sourceId} has unsupported dumpSchemaVersion`);
  invariant(isObject(data.locales), `localization source ${sourceId} must contain locales`);
  const locales = {};
  Object.keys(data.locales).sort(compareText).forEach((locale) => {
    invariant(isObject(data.locales[locale]), `localization locale ${locale} in ${sourceId} must be an object`);
    locales[locale] = Object.fromEntries(Object.entries(data.locales[locale])
      .map(([key, value]) => {
        invariant(typeof value === "string", `localization ${sourceId}:${locale}:${key} must be text`);
        return [key, value];
      })
      .sort(([left], [right]) => compareText(left, right)));
  });
  return { dumpSchemaVersion: 1, locales };
}

function countSourceRecords(kind, normalized) {
  if (kind === "localization") {
    return Object.values(normalized.locales).reduce((total, entries) => total + Object.keys(entries).length, 0);
  }
  return normalized.definitions.length + normalized.choicePools.length + normalized.progressions.length + normalized.archetypePatches.length;
}

function mergeUnique(collection, incoming, keySelector, label) {
  const known = new Set(collection.map(keySelector));
  incoming.forEach((item) => {
    const key = keySelector(item);
    invariant(!known.has(key), `duplicate ${label} ${key}`);
    known.add(key);
    collection.push(item);
  });
}

function localizedText(locales, key, requestedLocales) {
  if (!key) return {};
  const result = {};
  requestedLocales.forEach((locale) => {
    if (locales[locale] && Object.prototype.hasOwnProperty.call(locales[locale], key)) result[locale] = locales[locale][key];
  });
  return result;
}

function attachLocalization(definition, locales, localizationConfig, missing) {
  const requestedLocales = [...new Set([
    localizationConfig.primaryLocale,
    ...(localizationConfig.fallbackLocales || [])
  ])].sort(compareText);
  const name = localizedText(locales, definition.nameKey, requestedLocales);
  const description = localizedText(locales, definition.descriptionKey, requestedLocales);

  const chooseDisplay = (values, key, field) => {
    for (const locale of [localizationConfig.primaryLocale, ...(localizationConfig.fallbackLocales || [])]) {
      if (values[locale] !== undefined) return { text: values[locale], locale };
    }
    if (key) missing.push({ definitionGuid: definition.guid, field, key });
    return key ? { text: key, locale: null } : undefined;
  };

  const normalized = { ...definition };
  if (Object.keys(name).length || Object.keys(description).length) normalized.localization = stableClone({ name, description });
  const displayName = chooseDisplay(name, definition.nameKey, "name");
  const displayDescription = chooseDisplay(description, definition.descriptionKey, "description");
  if (displayName || displayDescription) normalized.display = stableClone({
    ...(displayName ? { name: displayName.text, nameLocale: displayName.locale } : {}),
    ...(displayDescription ? { description: displayDescription.text, descriptionLocale: displayDescription.locale } : {})
  });
  return normalized;
}

function validateReferences(snapshotData) {
  const definitions = DEFINITION_CATEGORIES.flatMap((category) => snapshotData.definitions[category]);
  const definitionGuids = new Set(definitions.map((definition) => definition.guid));
  const definitionIds = new Set();
  definitions.forEach((definition) => {
    const key = `${definition.category}:${definition.id}`;
    invariant(!definitionIds.has(key), `duplicate definition id ${key}`);
    definitionIds.add(key);
  });

  const poolIds = new Set(snapshotData.choicePools.map((pool) => pool.id));
  invariant(poolIds.size === snapshotData.choicePools.length, "duplicate choice pool ids");
  snapshotData.choicePools.forEach((pool) => pool.options.forEach((option) => {
    invariant(definitionGuids.has(option.definitionGuid), `choice pool ${pool.id} references unknown definition ${option.definitionGuid}`);
  }));

  const progressionIds = new Set(snapshotData.progressions.map((progression) => progression.id));
  invariant(progressionIds.size === snapshotData.progressions.length, "duplicate progression ids");
  snapshotData.progressions.forEach((progression) => {
    invariant(definitionGuids.has(progression.ownerGuid), `progression ${progression.id} references unknown owner ${progression.ownerGuid}`);
    progression.levels.forEach((level) => {
      (level.grants || []).forEach((guid) => invariant(definitionGuids.has(guid), `progression ${progression.id} grants unknown definition ${guid}`));
      level.slots.forEach((slot) => invariant(poolIds.has(slot.poolId), `progression slot ${slot.id} references unknown pool ${slot.poolId}`));
    });
  });

  snapshotData.archetypePatches.forEach((patch) => {
    invariant(definitionGuids.has(patch.archetypeGuid), `archetype patch ${patch.id} references unknown archetype ${patch.archetypeGuid}`);
    invariant(progressionIds.has(patch.targetProgressionId), `archetype patch ${patch.id} references unknown progression ${patch.targetProgressionId}`);
    patch.operations.forEach((operation) => {
      for (const poolId of [operation.poolId, operation.replacementPoolId, operation.slot?.poolId].filter(Boolean)) {
        invariant(poolIds.has(poolId), `archetype patch ${patch.id} references unknown pool ${poolId}`);
      }
      (operation.definitionGuids || []).forEach((guid) => invariant(definitionGuids.has(guid), `archetype patch ${patch.id} references unknown definition ${guid}`));
    });
  });
}

function validateManifest(manifest) {
  invariant(isObject(manifest), "manifest must contain an object");
  invariant(manifest.schemaVersion === 1, "manifest schemaVersion must be 1");
  for (const field of ["snapshotId", "gameId", "gameVersion", "contentVersion"]) {
    invariant(typeof manifest[field] === "string" && manifest[field], `manifest is missing ${field}`);
  }
  invariant(Array.isArray(manifest.sources) && manifest.sources.length, "manifest must declare sources");
  const sourceIds = new Set();
  manifest.sources.forEach((source) => {
    invariant(isObject(source), "manifest source must be an object");
    invariant(typeof source.id === "string" && source.id, "manifest source is missing id");
    invariant(!sourceIds.has(source.id), `manifest has duplicate source id ${source.id}`);
    sourceIds.add(source.id);
    invariant(SOURCE_KINDS.has(source.kind), `source ${source.id} has unsupported kind ${source.kind}`);
    invariant(typeof source.path === "string" && source.path, `source ${source.id} is missing path`);
    invariant(typeof source.version === "string" && source.version, `source ${source.id} is missing version`);
    if (source.priority !== undefined) invariant(Number.isInteger(source.priority), `source ${source.id} priority must be an integer`);
  });
  invariant(isObject(manifest.localization), "manifest must declare localization settings");
  invariant(typeof manifest.localization.primaryLocale === "string" && manifest.localization.primaryLocale, "manifest localization needs primaryLocale");
  invariant(Array.isArray(manifest.localization.fallbackLocales), "manifest localization needs fallbackLocales array");
}

function buildSnapshot(manifest, loadedSources) {
  validateManifest(manifest);
  const sortedSources = [...loadedSources].sort((left, right) =>
    (left.spec.priority || 0) - (right.spec.priority || 0) || compareText(left.spec.id, right.spec.id));
  invariant(sortedSources.length === manifest.sources.length, "loaded source count does not match manifest");

  const definitions = [];
  const choicePools = [];
  const progressions = [];
  const archetypePatches = [];
  const locales = {};
  const provenanceSources = [];

  sortedSources.forEach(({ spec, data, raw }) => {
    const normalized = spec.kind === "blueprints"
      ? normalizeBlueprintDump(data, spec.id)
      : normalizeLocalizationDump(data, spec.id);
    provenanceSources.push({
      id: spec.id,
      kind: spec.kind,
      version: spec.version,
      priority: spec.priority || 0,
      byteSha256: sha256(raw),
      semanticSha256: sha256(stableStringify(normalized, 0)),
      records: countSourceRecords(spec.kind, normalized)
    });
    if (spec.kind === "blueprints") {
      mergeUnique(definitions, normalized.definitions, (item) => item.guid, "definition guid");
      mergeUnique(choicePools, normalized.choicePools, (item) => item.id, "choice pool");
      mergeUnique(progressions, normalized.progressions, (item) => item.id, "progression");
      mergeUnique(archetypePatches, normalized.archetypePatches, (item) => item.id, "archetype patch");
    } else {
      Object.entries(normalized.locales).forEach(([locale, entries]) => {
        locales[locale] = { ...(locales[locale] || {}), ...entries };
      });
    }
  });

  const missingLocalization = [];
  const localizedDefinitions = definitions.map((definition) =>
    attachLocalization(definition, locales, manifest.localization, missingLocalization));
  const groupedDefinitions = Object.fromEntries(DEFINITION_CATEGORIES.map((category) => [
    category,
    localizedDefinitions.filter((definition) => definition.category === category)
      .sort(compareBy((definition) => definition.id, (definition) => definition.guid))
  ]));
  missingLocalization.sort(compareBy((item) => item.definitionGuid, (item) => item.field, (item) => item.key));

  const data = {
    definitions: groupedDefinitions,
    choicePools: choicePools.sort(compareBy((pool) => pool.id)),
    progressions: progressions.sort(compareBy((progression) => progression.id)),
    archetypePatches: archetypePatches.sort(compareBy((patch) => patch.id))
  };
  validateReferences(data);
  const dataSha256 = sha256(stableStringify(data, 0));

  const snapshotWithoutHash = {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    snapshotId: manifest.snapshotId,
    gameId: manifest.gameId,
    gameVersion: manifest.gameVersion,
    contentVersion: manifest.contentVersion,
    ...(manifest.createdAt ? { createdAt: manifest.createdAt } : {}),
    provenance: {
      importer: { name: IMPORTER_NAME, version: IMPORTER_VERSION },
      sources: provenanceSources
    },
    hashes: { dataSha256 },
    diagnostics: { missingLocalization },
    ...data
  };
  const snapshotSha256 = sha256(stableStringify(snapshotWithoutHash, 0));
  return stableClone({ ...snapshotWithoutHash, hashes: { ...snapshotWithoutHash.hashes, snapshotSha256 } });
}

function loadManifest(manifestPath) {
  const resolvedManifest = path.resolve(manifestPath);
  const manifestRaw = fs.readFileSync(resolvedManifest, "utf8");
  const manifest = JSON.parse(manifestRaw);
  validateManifest(manifest);
  const manifestDirectory = path.dirname(resolvedManifest);
  const loadedSources = manifest.sources.map((spec) => {
    const sourcePath = path.resolve(manifestDirectory, spec.path);
    const raw = fs.readFileSync(sourcePath, "utf8");
    return { spec, sourcePath, raw, data: JSON.parse(raw) };
  });
  return { manifest, manifestPath: resolvedManifest, loadedSources };
}

function importManifest(manifestPath) {
  const { manifest, loadedSources } = loadManifest(manifestPath);
  return buildSnapshot(manifest, loadedSources);
}

function renderJsonSnapshot(snapshot) {
  return stableStringify(snapshot, 2);
}

function renderJsSnapshot(snapshot, globalName = "WOTR_IMPORTED_SNAPSHOT") {
  invariant(/^[A-Za-z_$][\w$]*$/.test(globalName), `invalid JavaScript global name ${globalName}`);
  return `window.${globalName} = ${JSON.stringify(stableClone(snapshot), null, 2)};\n`;
}

module.exports = {
  DEFINITION_CATEGORIES,
  IMPORTER_NAME,
  IMPORTER_VERSION,
  SNAPSHOT_SCHEMA_VERSION,
  buildSnapshot,
  importManifest,
  loadManifest,
  renderJsSnapshot,
  renderJsonSnapshot
};
