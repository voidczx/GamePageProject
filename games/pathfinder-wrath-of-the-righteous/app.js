(() => {
  "use strict";

  const DATA = window.WOTR_DATA;
  const STORAGE_KEY = "WOTR_BUILD_ARCHIVE_V4";
  const LEGACY_STORAGE_KEYS = ["WOTR_BUILD_ARCHIVE_V3", "WOTR_BUILD_ARCHIVE_V2", "WOTR_BUILD_ARCHIVE_V1"];
  const pointCosts = { 7: -4, 8: -2, 9: -1, 10: 0, 11: 1, 12: 2, 13: 3, 14: 5, 15: 7, 16: 10, 17: 13, 18: 17 };
  const classById = new Map(DATA.classes.map((item) => [item.id, item]));
  const featById = new Map(DATA.feats.map((item) => [item.id, item]));
  const mythicById = new Map(DATA.mythic.map((item) => [item.id, item]));
  const pathById = new Map(DATA.paths.map((item) => [item.id, item]));
  const companionById = new Map(DATA.companions.map((item) => [item.id, item]));
  const skillById = new Map(DATA.skills.map((item) => [item.id, item]));
  const abilityById = new Map(DATA.abilities.map((item) => [item.id, item]));
  const domainById = new Map((DATA.domains || []).map((item) => [item.id, item]));
  const spellById = new Map((DATA.spells || []).map((item) => [item.id, item]));
  const spellBySourceGuid = new Map((DATA.spells || []).filter((item) => item.sourceGuid).map((item) => [nativeGuid(item.sourceGuid), item]));
  const pathAbilityById = new Map((DATA.pathAbilities || []).map((item) => [item.id, item]));
  const alignmentById = new Map((DATA.alignments || []).map((item) => [item.id, item]));
  const deityById = new Map((DATA.deities || []).map((item) => [item.id, item]));
  const heritageById = new Map((DATA.heritages || []).map((item) => [item.id, item]));
  const archetypeKey = (classId, archetypeId) => `${classId}:${archetypeId || "base"}`;
  const archetypeByKey = new Map((DATA.archetypes || []).map((item) => [archetypeKey(item.baseClass, item.id), item]));
  const installedWeaponNameByNative = new Map((DATA.installedWeaponOptions || []).map((item) => [item.nativeValue, item.name]));
  const nativeWeaponNameFallbacks = { HandCrossbow: "手弩", Shuriken: "手里剑", Siangham: "铁笔", Sling: "投石索" };
  const nativeWeaponName = (value) => installedWeaponNameByNative.get(value) || nativeWeaponNameFallbacks[value] || value;
  const nativeArmorNames = { Light: "轻甲", Medium: "中甲", Heavy: "重甲", Buckler: "小圆盾", LightShield: "轻盾", HeavyShield: "重盾", TowerShield: "塔盾" };
  const nativeAlignmentNames = {
    LawfulGood: "守序善良", NeutralGood: "中立善良", ChaoticGood: "混乱善良",
    LawfulNeutral: "守序中立", TrueNeutral: "绝对中立", Neutral: "绝对中立", ChaoticNeutral: "混乱中立",
    LawfulEvil: "守序邪恶", NeutralEvil: "中立邪恶", ChaoticEvil: "混乱邪恶",
    Lawful: "守序", Chaotic: "混乱", Good: "善良", Evil: "邪恶", Any: "任意"
  };
  const nativeAlignmentName = (value) => alignmentById.get(value)?.name || nativeAlignmentNames[value] || value;
  const nativeAlignmentLabel = (raw) => String(raw || "").split(/[|,]/).map((value) => value.trim()).filter(Boolean).map(nativeAlignmentName).join("、");
  const companionArchetypes = {
    camellia: "spirit-hunter", lann: "zen-archer", woljiF: "eldritch-scoundrel", ember: "stigmatized-witch",
    nenio: "scroll-savant", regill: "armiger", arueshalae: "espionage-expert", ulbrig: "griffonheart-shifter"
  };

  const elements = {
    nav: document.querySelector("#primary-nav"),
    saveSelect: document.querySelector("#save-select"),
    saveStatus: document.querySelector("#save-status"),
    rosterCount: document.querySelector("#roster-count"),
    rosterFilter: document.querySelector("#roster-filter"),
    rosterList: document.querySelector("#roster-list"),
    characterBanner: document.querySelector("#character-banner"),
    modeStrip: document.querySelector("#mode-strip"),
    creationSteps: document.querySelector("#creation-steps"),
    workspace: document.querySelector("#choice-workspace"),
    liveSheet: document.querySelector("#live-sheet"),
    sheetValidity: document.querySelector("#sheet-validity"),
    featSearch: document.querySelector("#feat-search"),
    featKind: document.querySelector("#feat-kind"),
    eligibleOnly: document.querySelector("#eligible-only"),
    featCategories: document.querySelector("#feat-categories"),
    featList: document.querySelector("#feat-list"),
    featDetail: document.querySelector("#feat-detail"),
    pathList: document.querySelector("#path-list"),
    pathDetail: document.querySelector("#path-detail"),
    questSearch: document.querySelector("#quest-search"),
    questRail: document.querySelector("#quest-rail"),
    questContent: document.querySelector("#quest-content"),
    sourceGrid: document.querySelector("#source-grid"),
    modal: document.querySelector("#name-modal"),
    nameForm: document.querySelector("#name-form"),
    nameTitle: document.querySelector("#name-modal-title"),
    nameInput: document.querySelector("#save-name-input"),
    importInput: document.querySelector("#import-save"),
    toast: document.querySelector("#toast")
  };

  const ui = {
    view: "builder",
    stage: "race",
    roster: "all",
    featKind: "feat",
    featCategory: "全部",
    selectedRule: DATA.feats[0]?.id || null,
    selectedPath: "angel",
    selectedQuest: "seelah",
    nextClass: null,
    nextArchetype: null,
    nextFeat: null,
    nextFeats: [],
    nextFeatChoices: {},
    nextFeatureChoices: {},
    nextDomainChoices: {},
    nextSkillRanks: {},
    nextAbilityIncrease: null,
    nextMythic: null,
    nextMythicParams: {},
    nextDomains: [],
    nextKnownSpells: [],
    nextPath: null,
    nextPathPicks: [],
    nextPathChoices: {},
    levelCursor: null,
    mythicCursor: null,
    levelDraftKey: null,
    mythicDraftKey: null,
    backgroundCategory: null,
    modalMode: "new"
  };

  let toastTimer = 0;
  let store = loadStore();
  const effectProfileCache = new WeakMap();

  function uid(prefix = "save") {
    if (window.crypto?.randomUUID) return `${prefix}-${window.crypto.randomUUID()}`;
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  }

  function longChoiceCard({ selected = false, disabled = false, dataAttributes = "", code = "", title = "", text = "", footer = "" }) {
    return `<article class="choice-card-wrap ${selected ? "selected" : ""}"><button type="button" class="choice-card ${selected ? "selected" : ""}" ${dataAttributes} ${disabled ? "disabled" : ""}><span class="choice-code">${escapeHtml(code)}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p>${footer}</button>${text ? `<button type="button" class="card-expand" data-card-expand aria-expanded="false">展开说明</button>` : ""}</article>`;
  }

  function stableParams(params = {}) {
    return Object.fromEntries(Object.entries(params || {}).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => [key, value && typeof value === "object" && !Array.isArray(value) ? stableParams(value) : value]));
  }

  function normalizeChoice(raw, idKey = "id") {
    if (typeof raw === "string") return { id: raw, params: {} };
    if (!raw || typeof raw !== "object") return null;
    const id = raw[idKey] || raw.id || raw.featId || raw.optionId;
    return id ? { id, params: stableParams(raw.params || {}) } : null;
  }

  function choiceKey(choice) {
    return choice ? `${choice.id}|${JSON.stringify(stableParams(choice.params || {}))}` : "";
  }

  function parameterValue(item, params = {}) {
    return item?.parameter ? params[item.parameter.type] : null;
  }

  function parameterOptionsForItem(item) {
    const options = DATA.choiceParameterTypes?.[item?.parameter?.type]?.options || [];
    if (item?.parameter?.type !== "weapon" || !item.parameter.nativeFilter || item.parameter.nativeFilter === "None") return options;
    const filter = item.parameter.nativeFilter;
    return options.filter((option) => {
      if (filter === "Ranged") return option.attackType === "Ranged";
      if (filter === "Melee") return option.attackType === "Melee";
      if (filter === "OneHandedPiercing") return !option.isTwoHanded && option.physicalForms?.includes("Piercing");
      if (filter === "OneHandedSlashing") return !option.isTwoHanded && option.physicalForms?.includes("Slashing");
      return true;
    });
  }

  function parameterComplete(item, params = {}) {
    if (!item?.parameter?.required) return true;
    const value = parameterValue(item, params);
    if (!value) return false;
    const options = parameterOptionsForItem(item);
    if (!options.some((raw) => (typeof raw === "string" ? raw : raw.id) === value)) return false;
    if (item.parameter.nested) {
      const nested = mythicById.get(value);
      return Boolean(nested) && parameterComplete(nested, params.nestedParams || {});
    }
    return true;
  }

  function parameterLabel(item, params = {}) {
    const value = parameterValue(item, params);
    const definition = DATA.choiceParameterTypes?.[item?.parameter?.type];
    const option = definition?.options?.find((entry) => (typeof entry === "string" ? entry : entry.id) === value);
    const label = typeof option === "string" ? option : option?.name || value;
    if (!value) return item?.name || "";
    if (item.parameter.nested) {
      const nested = mythicById.get(value);
      return `${item.name}：${nested ? parameterLabel(nested, params.nestedParams || {}) : label}`;
    }
    return `${item.name}：${label}`;
  }

  function expandedMythicChoiceRecords(records = []) {
    const expand = (choice) => {
      const item = mythicById.get(choice?.id);
      if (!item?.parameter?.nested) return choice ? [choice] : [];
      const nestedId = parameterValue(item, choice.params || {});
      const nested = mythicById.get(nestedId);
      if (!nested) return [choice];
      const nestedChoice = {
        slotId: `${choice.slotId || choice.id}:nested`,
        source: `${choice.source || "mythic"}:nested`,
        id: nested.id,
        params: stableParams(choice.params?.nestedParams || {})
      };
      return [choice, ...expand(nestedChoice)];
    };
    return records.flatMap(expand);
  }

  function featureChoiceLabel(choice) {
    const group = DATA.featureGroups?.[choice.groupId];
    const option = group?.options?.find((item) => item.id === choice.optionId);
    const labels = [option?.parameter ? parameterLabel(option, choice.params || {}) : option?.name || choice.optionId];
    const nestedIds = choice.params?.nestedOptionIds || (choice.params?.nestedOptionId ? [choice.params.nestedOptionId] : []);
    const nestedParams = choice.params?.nestedParamsByDepth || [];
    let current = option;
    nestedIds.forEach((id, depth) => {
      const nestedGroup = DATA.featureGroups?.[`owlcat:${current?.nestedSelectionGuid}`];
      const nested = nestedGroup?.options?.find((item) => item.id === id);
      if (!nested) return;
      labels.push(nested.parameter ? parameterLabel(nested, nestedParams[depth] || {}) : nested.name);
      current = nested;
    });
    return labels.join("：");
  }

  function featureChoiceComplete(slot, choice, character = currentCharacter()) {
    if (!choice) return false;
    let option = DATA.featureGroups?.[slot.groupId]?.options?.find((entry) => entry.id === choice.optionId);
    if (!option || !itemRequirementsMet(option, character, choice.params || {}) || !parameterComplete(option, choice.params || {})) return false;
    const nestedIds = choice.params?.nestedOptionIds || (choice.params?.nestedOptionId ? [choice.params.nestedOptionId] : []);
    const nestedParams = choice.params?.nestedParamsByDepth || [];
    let depth = 0;
    const seen = new Set();
    const existingChoices = character.normalSteps.at(-1)?.featureChoices || [];
    while (option.nestedSelectionGuid) {
      if (seen.has(option.nestedSelectionGuid)) return false;
      seen.add(option.nestedSelectionGuid);
      const nestedGroup = DATA.featureGroups?.[`owlcat:${option.nestedSelectionGuid}`];
      const nested = nestedGroup?.options?.find((entry) => entry.id === nestedIds[depth]);
      const beforeNested = withCurrentFeatureChoices(character, [...existingChoices, {
        slotId: slot.id,
        source: slot.source,
        groupId: slot.groupId,
        optionId: choice.optionId,
        params: { ...choice.params, nestedOptionId: nestedIds[0] || null, nestedOptionIds: nestedIds.slice(0, depth) }
      }]);
      if (!nested || !itemRequirementsMet(nested, beforeNested, nestedParams[depth] || {}) || !parameterComplete(nested, nestedParams[depth] || {})) return false;
      option = nested;
      depth += 1;
    }
    return depth === nestedIds.length;
  }

  function defaultSkills(companion) {
    const values = Object.fromEntries(DATA.skills.map((skill) => [skill.id, 0]));
    const classDefaults = {
      fighter: ["athletics"], paladin: ["athletics", "persuasion"], monk: ["mobility", "perception"],
      rogue: ["trickery", "stealth", "mobility"], witch: ["arcana", "persuasion"], wizard: ["arcana", "world"],
      oracle: ["religion", "persuasion"], cleric: ["religion", "persuasion"], ranger: ["nature", "perception"],
      slayer: ["stealth", "perception"], shaman: ["nature", "religion"], warpriest: ["religion", "athletics"],
      cavalier: ["athletics", "persuasion"], shifter: ["athletics", "nature"]
    };
    (classDefaults[companion.classId] || []).forEach((id) => { values[id] = Math.min(companion.level, 5); });
    return values;
  }

  function emptySkillRanks() {
    return Object.fromEntries(DATA.skills.map((skill) => [skill.id, 0]));
  }

  function sanitizeSkillRanks(raw) {
    const result = emptySkillRanks();
    DATA.skills.forEach(({ id }) => {
      const value = Number(raw?.[id]);
      if (Number.isFinite(value)) result[id] = Math.max(0, Math.min(40, Math.floor(value)));
    });
    return result;
  }

  function defaultFeats(companion) {
    const presets = {
      commander: ["power-attack"], seelah: ["dodge", "shield-bash"], camellia: ["weapon-finesse"],
      lann: ["point-blank-shot", "precise-shot"], wenduag: ["point-blank-shot", "precise-shot"],
      woljiF: ["weapon-finesse", "two-weapon-fighting"], ember: ["point-blank-shot", "precise-shot"],
      nenio: ["spell-focus", "spell-penetration"], daeran: ["selective-spell"], sosiel: ["toughness"],
      regill: ["weapon-finesse", "two-weapon-fighting", "heavy-armor"], arueshalae: ["point-blank-shot", "precise-shot", "rapid-shot"],
      greybor: ["two-weapon-fighting", "improved-two-weapon"], ulbrig: ["power-attack"],
      kestoglyr: ["two-weapon-fighting", "double-slice", "weapon-focus", "power-attack"]
    };
    return [...(presets[companion.id] || [])];
  }

  function makePresetSteps(companion) {
    const archetypeId = companionArchetypes[companion.id] || null;
    const steps = Array.from({ length: companion.level }, (_, index) => ({
      level: index + 1,
      classId: companion.classId,
      archetypeId,
      featIds: [],
      featChoices: [],
      featureChoices: [],
      skillRanks: {},
      domainChoices: [],
      domainIds: [],
      knownSpellIds: [],
      source: companion.id === "commander" ? "user" : "companion-preset",
      locked: companion.id !== "commander"
    }));
    const featSlots = [0, 0, 2, 4, 6, 8, 10, 12, 14].filter((index) => index < steps.length);
    defaultFeats(companion).forEach((id, index) => { if (steps.length) steps[featSlots[index] ?? 0].featIds.push(id); });
    if (companion.id === "sosiel" && steps.length) steps[0].domainIds = ["good", "luck"];
    steps.forEach((step) => { step.featChoices = step.featIds.map((id, index) => ({ slotId: `preset:${step.level}:${index}`, source: "companion-preset", id, params: {} })); });
    return steps;
  }

  function activePathFromSteps(character) {
    return [...(character.mythicSteps || [])].reverse().find((step) => step.pathId)?.pathId || null;
  }

  function rebuildCharacter(character) {
    const legacyUnplacedPathChoices = [...(character.legacyUnplacedPathChoices || [])];
    const runningNormalClassLevels = {};
    character.normalSteps = (character.normalSteps || []).map((step, index) => {
      const classLevel = (runningNormalClassLevels[step.classId] || 0) + 1;
      runningNormalClassLevels[step.classId] = classLevel;
      const migratedChoices = Array.isArray(step.featChoices)
        ? step.featChoices.map((choice, choiceIndex) => {
          const normalized = normalizeChoice(choice);
          return normalized && featById.has(normalized.id) ? { slotId: choice.slotId || `legacy:${index + 1}:${choiceIndex}`, source: choice.source || "legacy", ...normalized } : null;
        }).filter(Boolean)
        : (step.featIds || []).filter((id) => featById.has(id)).map((id, choiceIndex) => ({ slotId: `legacy:${index + 1}:${choiceIndex}`, source: "legacy", id, params: {} }));
      const seen = new Set();
      const featChoices = migratedChoices.filter((choice) => {
        const key = choiceKey(choice);
        if (seen.has(key)) return false;
        seen.add(key); return true;
      });
      const featureChoices = (step.featureChoices || []).map((choice, choiceIndex) => ({
        slotId: choice.slotId || `legacy-feature:${index + 1}:${choiceIndex}`,
        source: choice.source || "legacy",
        groupId: choice.groupId || "legacy",
        optionId: choice.optionId || choice.id,
        params: stableParams(choice.params || {})
      })).filter((choice) => Boolean(choice.optionId));
      const domainSlots = domainSlotsForClassLevel(index + 1, step.classId, classLevel, step.archetypeId || null);
      const domainChoices = (step.domainChoices?.length ? step.domainChoices : (step.domainIds || []).map((domainId, choiceIndex) => ({
        slotId: domainSlots[choiceIndex]?.id || `legacy-domain:${index + 1}:${choiceIndex + 1}`,
        source: domainSlots[choiceIndex]?.source || "legacy",
        sourceGuid: domainSlots[choiceIndex]?.sourceGuid || null,
        domainId
      }))).map((choice, choiceIndex) => ({
        slotId: choice.slotId || domainSlots[choiceIndex]?.id || `legacy-domain:${index + 1}:${choiceIndex + 1}`,
        source: choice.source || domainSlots[choiceIndex]?.source || "legacy",
        sourceGuid: choice.sourceGuid || domainSlots[choiceIndex]?.sourceGuid || null,
        domainId: choice.domainId || choice.id
      })).filter((choice) => domainById.has(choice.domainId));
      return {
        level: index + 1,
        classId: step.classId,
        archetypeId: step.archetypeId || null,
        abilityIncrease: (index + 1) % 4 === 0 && abilityById.has(step.abilityIncrease) ? step.abilityIncrease : null,
        featChoices,
        featureChoices,
        skillRanks: sanitizeSkillRanks(step.skillRanks),
        featIds: [...new Set(featChoices.map((choice) => choice.id))],
        domainChoices,
        domainIds: [...new Set(domainChoices.map((choice) => choice.domainId))],
        knownSpellIds: [...new Set((step.knownSpellIds || []).filter((id) => spellById.has(id)))],
        source: step.source || "user",
        locked: Boolean(step.locked)
      };
    });
    let replayPath = null;
    character.mythicSteps = (character.mythicSteps || []).slice(0, 10).map((step, index) => {
      if (pathById.has(step.pathId)) replayPath = step.pathId;
      const rank = index + 1;
      const currentSlots = pathPickSlots(replayPath, rank);
      const usedSlots = new Set();
      const pathChoices = (step.pathChoices?.length ? step.pathChoices : step.pathPicks || []).map((raw, choiceIndex) => {
        const choice = normalizeChoice(raw, "optionId");
        if (choice && (pathAbilityById.has(choice.id) || choice.id.startsWith("dragon-feat:"))) {
          const slotId = raw.slotId || `legacy-path:${rank}:${choiceIndex}`;
          usedSlots.add(slotId);
          return { slotId, source: raw.source || "mythic:path:legacy", optionId: choice.id, params: choice.params };
        }
        const legacy = DATA.legacyPathAbilities?.find((item) => item.id === choice?.id && item.path === replayPath);
        const candidates = legacy ? DATA.pathAbilities.filter((item) => item.path === replayPath && item.name === legacy.name && currentSlots.some((slot) => slot.groupId === item.group)) : [];
        if (candidates.length === 1) {
          const slot = currentSlots.find((item) => item.groupId === candidates[0].group && !usedSlots.has(item.id));
          if (slot) {
            usedSlots.add(slot.id);
            return { slotId: slot.id, source: slot.source, optionId: candidates[0].id, params: choice.params };
          }
        }
        if (choice) legacyUnplacedPathChoices.push({ rank, pathId: replayPath, slotId: raw.slotId || null, optionId: choice.id, params: stableParams(choice.params || {}) });
        return null;
      }).filter(Boolean);
      return {
        rank,
        commonChoice: (() => {
          const choice = normalizeChoice(step.commonChoice || step.commonChoiceId);
          return choice && mythicById.has(choice.id) ? { slotId: step.commonChoice?.slotId || `mythic:${index + 1}:common`, source: step.commonChoice?.source || "mythic:common", ...choice } : null;
        })(),
        commonChoiceId: mythicById.has(step.commonChoice?.id || step.commonChoiceId) ? (step.commonChoice?.id || step.commonChoiceId) : null,
        pathId: pathById.has(step.pathId) ? step.pathId : null,
        pathChoices,
        pathPicks: [...new Set(pathChoices.map((choice) => choice.optionId))],
        source: step.source || "user"
      };
    });
    character.legacyUnplacedPathChoices = [...new Map(legacyUnplacedPathChoices.map((choice) => [`${choice.rank}:${choice.pathId}:${choice.optionId}:${JSON.stringify(stableParams(choice.params || {}))}`, choice])).values()];
    character.legacyManual ||= { feats: [], mythic: [] };
    character.legacyManual.feats = [...new Set((character.legacyManual.feats || []).filter((id) => featById.has(id)))];
    character.legacyManual.mythic = [...new Set((character.legacyManual.mythic || []).filter((id) => mythicById.has(id)))];
    character.levels = character.normalSteps.map((step) => step.classId);
    character.featChoices = character.normalSteps.flatMap((step) => step.featChoices);
    character.featureChoices = character.normalSteps.flatMap((step) => step.featureChoices);
    character.legacySkillRanks = sanitizeSkillRanks(character.legacySkillRanks);
    character.skills = sanitizeSkillRanks(character.legacySkillRanks);
    character.normalSteps.forEach((step) => DATA.skills.forEach(({ id }) => { character.skills[id] += step.skillRanks[id] || 0; }));
    character.domainChoices = character.normalSteps.flatMap((step) => step.domainChoices || []);
    character.feats = [...new Set([...character.legacyManual.feats, ...character.normalSteps.flatMap((step) => step.featIds)])];
    character.mythicRank = character.mythicSteps.length;
    character.mythicPath = activePathFromSteps(character);
    const legend = character.mythicPath === "legend";
    character.mythicChoiceRecords = character.mythicSteps.filter((step) => !legend || step.rank <= 2).map((step) => step.commonChoice).filter(Boolean);
    character.effectiveMythicChoiceRecords = expandedMythicChoiceRecords(character.mythicChoiceRecords);
    character.mythicChoices = [...new Set([...character.legacyManual.mythic, ...character.effectiveMythicChoiceRecords.map((choice) => choice.id)])];
    return character;
  }

  function makeCharacter(companion) {
    const attributes = Object.fromEntries(DATA.abilities.map((ability, index) => [ability.id, companion.attrs[index] ?? 10]));
    const character = {
      id: companion.id,
      race: DATA.races.some((race) => race.id === companion.race) ? companion.race : "human",
      heritage: DATA.heritages?.find((item) => item.raceId === companion.race)?.id || DATA.heritages?.find((item) => item.raceId === "human")?.id || null,
      background: "leader",
      backgroundParams: {},
      raceAbility: null,
      attributesMode: companion.id === "commander" ? "base" : "final",
      alignment: companion.align || "N",
      deity: null,
      attributes,
      skills: emptySkillRanks(),
      legacySkillRanks: companion.id === "commander" ? emptySkillRanks() : defaultSkills(companion),
      normalSteps: makePresetSteps(companion),
      mythicSteps: [],
      legacyManual: { feats: [], mythic: [] },
      plannedPath: null,
      plannedLatePath: null,
      fullRespec: false
    };
    return rebuildCharacter(character);
  }

  function makeSave(name = "第一次圣战") {
    const characters = Object.fromEntries(DATA.companions.map((companion) => [companion.id, makeCharacter(companion)]));
    return { name, updatedAt: Date.now(), activeCharacter: "commander", characters, questChoices: {}, storyStates: {} };
  }

  function defaultStore() {
    const id = uid();
    return { version: 4, activeSlot: id, slots: { [id]: makeSave() } };
  }

  function normalizeCharacter(saved, companion) {
    const base = makeCharacter(companion);
    if (!saved || typeof saved !== "object") return base;
    const race = DATA.races.some((item) => item.id === saved.race) ? saved.race : base.race;
    const background = DATA.backgrounds.some((item) => item.id === saved.background) ? saved.background : base.background;
    const backgroundItem = DATA.backgrounds.find((item) => item.id === background);
    const savedBackgroundParams = stableParams(saved.backgroundParams || {});
    const backgroundParams = backgroundItem?.parameter && parameterComplete(backgroundItem, savedBackgroundParams) ? savedBackgroundParams : {};
    const alignment = alignmentById.has(saved.alignment) ? saved.alignment : base.alignment;
    const savedDeity = deityById.get(saved.deity);
    const deity = savedDeity?.alignments.includes(alignment) ? savedDeity.id : null;
    const attributesMode = saved.attributesMode === "base" || saved.attributesMode === "final"
      ? saved.attributesMode : (companion.id === "commander" || saved.fullRespec ? "base" : "final");
    const attributes = { ...base.attributes };
    DATA.abilities.forEach(({ id }) => {
      const value = Number(saved.attributes?.[id]);
      if (Number.isFinite(value)) attributes[id] = Math.max(id === "con" && companion.group === "path" && companion.path === "lich" ? 0 : 1, Math.min(30, value));
    });
    const hasStepSkillRanks = Array.isArray(saved.normalSteps) && saved.normalSteps.some((step) => step?.skillRanks && typeof step.skillRanks === "object");
    const legacySkillRanks = sanitizeSkillRanks(saved.legacySkillRanks || (!hasStepSkillRanks ? saved.skills : null) || base.legacySkillRanks);
    let normalSteps;
    let legacyManual = { feats: [], mythic: [] };
    if (Array.isArray(saved.normalSteps)) {
      normalSteps = saved.normalSteps.filter((step) => classById.has(step?.classId) || step?.classId === "dragon").slice(0, 40);
      legacyManual = saved.legacyManual && typeof saved.legacyManual === "object" ? saved.legacyManual : legacyManual;
    } else {
      const levels = Array.isArray(saved.levels) ? saved.levels.filter((id) => classById.has(id) || id === "dragon").slice(0, 40) : base.levels;
      normalSteps = levels.map((classId, index) => ({ level: index + 1, classId, archetypeId: null, featIds: [], featChoices: [], featureChoices: [], skillRanks: {}, domainChoices: [], domainIds: [], knownSpellIds: [], source: "legacy", locked: false }));
      legacyManual.feats = Array.isArray(saved.feats) ? saved.feats : [];
    }
    let mythicSteps;
    if (Array.isArray(saved.mythicSteps)) mythicSteps = saved.mythicSteps;
    else {
      const rank = Math.max(0, Math.min(10, Number(saved.mythicRank) || 0));
      const choices = Array.isArray(saved.mythicChoices) ? saved.mythicChoices.filter((id) => mythicById.has(id)) : [];
      mythicSteps = Array.from({ length: rank }, (_, index) => ({ rank: index + 1, commonChoice: choices[index] ? { id: choices[index], params: {} } : null, commonChoiceId: choices[index] || null, pathId: null, pathChoices: [], pathPicks: [], source: "legacy" }));
      const oldPath = pathById.has(saved.mythicPath) ? saved.mythicPath : null;
      const entryRank = DATA.mythicPathRules?.[oldPath]?.entryRank || 3;
      if (oldPath && mythicSteps[entryRank - 1]) mythicSteps[entryRank - 1].pathId = oldPath;
      legacyManual.mythic = choices.slice(rank);
    }
    const character = {
      ...base,
      ...saved,
      id: companion.id,
      attributes,
      skills: emptySkillRanks(),
      legacySkillRanks,
      normalSteps,
      mythicSteps,
      legacyManual,
      race,
      background,
      backgroundParams,
      raceAbility: DATA.races.find((item) => item.id === race)?.sourceMechanics?.selectableRaceStat
        && attributesMode === "base"
        && abilityById.has(saved.raceAbility) ? saved.raceAbility : null,
      attributesMode,
      plannedPath: pathById.has(saved.plannedPath) ? saved.plannedPath : null,
      plannedLatePath: pathById.has(saved.plannedLatePath) ? saved.plannedLatePath : null,
      alignment,
      deity,
      heritage: heritageById.get(saved.heritage)?.raceId === race ? saved.heritage : (DATA.heritages?.find((item) => item.raceId === race)?.id || null),
      fullRespec: Boolean(saved.fullRespec)
    };
    return rebuildCharacter(character);
  }

  function normalizeSave(saved, fallbackName) {
    const characters = {};
    DATA.companions.forEach((companion) => { characters[companion.id] = normalizeCharacter(saved?.characters?.[companion.id], companion); });
    return {
      name: typeof saved?.name === "string" ? saved.name.slice(0, 32) : fallbackName,
      updatedAt: Number(saved?.updatedAt) || Date.now(),
      activeCharacter: companionById.has(saved?.activeCharacter) ? saved.activeCharacter : "commander",
      characters,
      questChoices: saved?.questChoices && typeof saved.questChoices === "object" ? saved.questChoices : {},
      storyStates: Object.fromEntries(Object.entries(saved?.storyStates || {}).filter(([guid, status]) => /^[0-9a-f]{32}$/i.test(guid) && ["not-started", "playing", "completion-in-progress", "completed"].includes(status)).map(([guid, status]) => [guid.toLowerCase(), status]))
    };
  }

  function loadStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || LEGACY_STORAGE_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
      const parsed = JSON.parse(raw);
      if (!parsed?.slots || typeof parsed.slots !== "object") return defaultStore();
      const slots = {};
      Object.entries(parsed.slots).slice(0, 24).forEach(([id, saved], index) => { slots[id] = normalizeSave(saved, `本地存档 ${index + 1}`); });
      const ids = Object.keys(slots);
      if (!ids.length) return defaultStore();
      return { version: 4, activeSlot: slots[parsed.activeSlot] ? parsed.activeSlot : ids[0], slots };
    } catch {
      return defaultStore();
    }
  }

  function saveStore(message = "已保存在此设备") {
    currentSave().updatedAt = Date.now();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      elements.saveStatus.textContent = message;
    } catch {
      elements.saveStatus.textContent = "本地空间不足，未能保存";
      showToast("本地空间不足，当前变更未保存。", true);
    }
  }

  function currentSave() { return store.slots[store.activeSlot]; }
  function currentCharacter() { return currentSave().characters[currentSave().activeCharacter]; }
  function currentCompanion() { return companionById.get(currentSave().activeCharacter); }
  function characterLevel(character = currentCharacter()) { return character.levels.length; }

  function normalPrefix(character, count) {
    return rebuildCharacter({
      ...character,
      normalSteps: character.normalSteps.slice(0, count).map((step) => ({ ...step, featChoices: step.featChoices.map((choice) => ({ ...choice, params: stableParams(choice.params) })), featureChoices: step.featureChoices.map((choice) => ({ ...choice, params: stableParams(choice.params) })), skillRanks: sanitizeSkillRanks(step.skillRanks), domainChoices: (step.domainChoices || []).map((choice) => ({ ...choice })) })),
      mythicSteps: character.mythicSteps.map((step) => ({ ...step, pathPicks: [...step.pathPicks] })),
      legacyManual: { feats: [...character.legacyManual.feats], mythic: [...character.legacyManual.mythic] },
      legacySkillRanks: sanitizeSkillRanks(character.legacySkillRanks)
    });
  }

  function normalCandidate(prefix, classId, archetypeId = null, abilityIncrease = null) {
    return rebuildCharacter({
      ...prefix,
      normalSteps: [...prefix.normalSteps, { level: prefix.normalSteps.length + 1, classId, archetypeId, abilityIncrease: abilityById.has(abilityIncrease) ? abilityIncrease : null, featIds: [], featChoices: [], featureChoices: [], skillRanks: {}, domainChoices: [], domainIds: [], knownSpellIds: [], source: "user", locked: false }],
      mythicSteps: prefix.mythicSteps.map((step) => ({ ...step, pathPicks: [...step.pathPicks] })),
      legacyManual: { feats: [...prefix.legacyManual.feats], mythic: [...prefix.legacyManual.mythic] },
      legacySkillRanks: sanitizeSkillRanks(prefix.legacySkillRanks)
    });
  }

  function selectedArchetype(character, classId) {
    return character.normalSteps.find((step) => step.classId === classId)?.archetypeId || null;
  }

  function archetypesFor(classId) {
    return (DATA.archetypes || []).filter((item) => item.baseClass === classId);
  }

  function pathGrantsThrough(pathId, rank) {
    const rule = DATA.mythicPathRules?.[pathId];
    if (!rule) return [];
    if (!rule.rankGrants) return rank >= rule.entryRank ? rule.grants || [] : [];
    return Object.entries(rule.rankGrants).filter(([unlockRank]) => Number(unlockRank) <= rank).flatMap(([, grants]) => grants);
  }

  function mythicProjection(character = currentCharacter()) {
    const activeCommon = [];
    const activePathChoiceRecords = [];
    const lostPathChoiceRecords = [];
    const pathHistory = [];
    let activePath = null;
    character.mythicSteps.forEach((step) => {
      if (step.pathId && step.pathId !== activePath) {
        const rule = DATA.mythicPathRules?.[step.pathId];
        if (activePath && rule?.kind === "late") {
          pathHistory.push(activePath);
          if (step.pathId !== "devil") lostPathChoiceRecords.push(...activePathChoiceRecords.splice(0));
          if (step.pathId === "legend") activeCommon.splice(2);
        }
        activePath = step.pathId;
      }
      if ((step.commonChoice?.id || step.commonChoiceId) && !(activePath === "legend" && step.rank > 2)) activeCommon.push(step.commonChoice?.id || step.commonChoiceId);
      const pathChoices = step.pathChoices?.length ? step.pathChoices : (step.pathPicks || []).map((optionId) => ({ optionId, params: {} }));
      pathChoices.forEach((choice) => {
        const ability = pathAbilityById.get(choice.optionId);
        const matchesPath = choice.optionId.startsWith("dragon-feat:") ? activePath === "gold-dragon" : ability?.path === activePath;
        if (matchesPath) activePathChoiceRecords.push(choice);
        else lostPathChoiceRecords.push(choice);
      });
    });
    if (activePath && !pathHistory.includes(activePath)) pathHistory.push(activePath);
    const rule = DATA.mythicPathRules?.[activePath];
    const retainedGrants = activePath === "devil" && pathHistory.length > 1 ? pathGrantsThrough(pathHistory[0], 7) : [];
    return {
      activePath,
      activeCommon: [...new Set(activeCommon)],
      activePathChoiceRecords,
      lostPathChoiceRecords,
      activePathPicks: [...new Set(activePathChoiceRecords.map((choice) => choice.optionId))],
      lostPathPicks: [...new Set(lostPathChoiceRecords.map((choice) => choice.optionId))],
      pathHistory,
      grants: [...retainedGrants, ...pathGrantsThrough(activePath, character.mythicSteps.length)]
    };
  }

  function allDomains(character = currentCharacter()) {
    return [...new Set(character.normalSteps.flatMap((step) => (step.domainChoices || []).map((choice) => choice.domainId)))];
  }

  function allKnownSpells(character = currentCharacter()) {
    const selected = character.normalSteps.flatMap((step) => step.knownSpellIds);
    const automatic = characterEffectProfile(character).effects.filter((effect) => effect.category === "known-spell" && effect.spellGuid).map((effect) => spellBySourceGuid.get(effect.spellGuid)?.id).filter(Boolean);
    return [...new Set([...selected, ...automatic])];
  }

  function showToast(message, danger = false) {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.style.borderColor = danger ? "var(--red)" : "var(--line-strong)";
    elements.toast.classList.add("show");
    toastTimer = window.setTimeout(() => elements.toast.classList.remove("show"), 2300);
  }

  function classCounts(character = currentCharacter()) {
    return character.levels.reduce((counts, id) => {
      counts[id] = (counts[id] || 0) + 1;
      return counts;
    }, {});
  }

  function babForClass(id, level) {
    const native = DATA.owlcatClassStatBonus?.(id, "bab", level);
    if (native !== null && native !== undefined) return native;
    const entry = classById.get(id);
    if (!entry || entry.bab === "full") return level;
    if (entry.bab === "three") return Math.floor(level * .75);
    return Math.floor(level * .5);
  }

  function baseAttack(character = currentCharacter()) {
    return Object.entries(classCounts(character)).reduce((sum, [id, level]) => sum + babForClass(id, level), 0);
  }

  function classSpellLevel(id, level, archetypeId = null) {
    const native = DATA.owlcatMaxSpellLevelForClass?.(id, level, archetypeId);
    if (native !== null && native !== undefined) return native;
    const entry = classById.get(id);
    if (!entry?.casting) return 0;
    if (entry.fullCaster) {
      const delay = entry.casting.includes("spontaneous") ? 1 : 0;
      return Math.max(0, Math.min(9, Math.floor((level + 1 - delay) / 2)));
    }
    if (["bard", "skald", "inquisitor", "hunter", "magus", "alchemist"].includes(id)) return Math.max(0, Math.min(6, Math.floor((level + 1) / 3)));
    if (["paladin", "ranger", "bloodrager"].includes(id)) return level < 4 ? 0 : Math.min(4, Math.floor(level / 4));
    return 0;
  }

  function classSpellLevelForCharacter(character, classId) {
    const archetypeId = character.normalSteps.find((step) => step.classId === classId)?.archetypeId || null;
    const spellbook = DATA.owlcatSpellbookForClass?.(classId, archetypeId);
    const projected = spellbook && DATA.owlcatCharacterSpellbooks?.(character)
      .find((entry) => entry.spellbookGuid === (spellbook.sourceGuid || spellbook.guid));
    return projected?.maxSpellLevel ?? classSpellLevel(classId, classCounts(character)[classId] || 0, archetypeId);
  }

  function classCastingRule(classId, archetypeId = null) {
    const base = classById.get(classId) || {};
    const archetype = archetypeByKey.get(archetypeKey(classId, archetypeId)) || {};
    const spellbook = DATA.owlcatSpellbookForClass?.(classId, archetypeId);
    if (spellbook) return { spontaneous: Boolean(spellbook.spontaneous), spellList: spellbook.spellList, spellbookId: spellbook.sourceGuid || spellbook.guid, knownOffset: 0 };
    return { spontaneous: Boolean(archetype.spontaneous ?? base.spontaneous), spellList: archetype.spellList || base.spellList || (base.casting?.startsWith("divine") ? "divine" : "arcane"), knownOffset: Number(archetype.knownOffset) || 0 };
  }

  function featSlotsForStep(prefix, classId, archetypeId = null) {
    const characterLevel = prefix.normalSteps.length + 1;
    const classLevel = (classCounts(prefix)[classId] || 0) + 1;
    const slots = [];
    const add = (source, label, pool = "all", ignorePrerequisites = false) => slots.push({ id: `feat:${characterLevel}:${source}:${slots.length + 1}`, kind: "feat", source, label, pool, ignorePrerequisites });
    if (characterLevel % 2 === 1) add("general", "角色等级专长");
    if (characterLevel === 1 && prefix.race === "human") add("race:human", "人类额外专长");
    if (characterLevel === 1 && prefix.race === "half-elf" && prefix.heritage === "half-elf-base") add("race:half-elf", "半精灵适应性", "skill-focus");
    const sourceSlots = DATA.owlcatSlotsForClass?.(classId, classLevel, archetypeId) || [];
    if (DATA.owlcatClassProgressionReady?.[classId]) sourceSlots.filter((slot) => slot.kind === "feat").forEach((slot) => add(`class:${classId}`, slot.label, slot.pool, Boolean(slot.ignorePrerequisites)));
    else {
      if (classId === "fighter" && (classLevel === 1 || classLevel % 2 === 0)) add("class:fighter", "战士奖励战斗专长", "combat");
      if (classId === "cavalier" && !["gendarme", "ghost-rider"].includes(archetypeId) && [1, 9, 17].includes(classLevel)) add("class:cavalier:tactician", "战术家团队专长", "teamwork");
      if (classId === "cavalier" && [6, 12, 18].includes(classLevel)) add("class:cavalier", "骑将奖励战斗专长", "combat");
      if (classId === "cavalier" && archetypeId === "gendarme" && [1, 3, 6, 9, 12, 15, 18, 20].includes(classLevel)) add("archetype:gendarme", "宪骑兵奖励战斗专长", "combat");
      if (classId === "monk" && [1, 2, 6, 10, 14, 18].includes(classLevel)) add("class:monk", "武僧奖励专长", "monk", true);
      if (classId === "wizard" && [1, 5, 10, 15, 20].includes(classLevel)) add("class:wizard", "法师奖励魔法专长", "magic");
      if (classId === "warpriest" && [3, 6, 9, 12, 15, 18].includes(classLevel)) add("class:warpriest", "战争祭司奖励战斗专长", "combat");
      if (classId === "skald" && classLevel === 1) add("class:skald", "歌者奖励魔法专长", "magic");
    }
    return slots;
  }

  function featureSlotsForStep(prefix, classId, archetypeId = null) {
    const classLevel = (classCounts(prefix)[classId] || 0) + 1;
    if (DATA.owlcatClassProgressionReady?.[classId]) return (DATA.owlcatSlotsForClass?.(classId, classLevel, archetypeId) || []).filter((slot) => slot.kind === "feature");
    const rules = (DATA.classFeatureRules || []).filter((rule) => rule.classId === classId && rule.levels.includes(classLevel));
    const slots = rules.map((rule, index) => ({ id: `feature:${classId}:${classLevel}:${rule.groupId}:${index + 1}`, kind: "feature", groupId: rule.groupId, label: rule.label, source: `class:${classId}` }));
    if (classId === "cavalier" && archetypeId === "cavalier-of-the-paw") return slots.filter((slot) => slot.groupId !== "cavalierOrder");
    if (classId === "sorcerer" && archetypeId === "crossblooded" && classLevel === 1) slots.push({ id: `feature:${classId}:${classLevel}:bloodline:2`, kind: "feature", groupId: "bloodline", label: "选择第二血脉", source: "archetype:crossblooded" });
    return slots;
  }

  function featureSlotIsActive(prefix, classId, archetypeId, slot, choicesBySlot = {}) {
    if (!(slot.nativeRequirements || []).length) return true;
    const candidate = normalCandidate(prefix, classId, archetypeId);
    const otherChoices = Object.entries(choicesBySlot).filter(([slotId]) => slotId !== slot.id).map(([slotId, choice]) => {
      const owner = featureSlotsForStep(prefix, classId, archetypeId).find((entry) => entry.id === slotId);
      return owner && choice ? { slotId, source: owner.source, groupId: owner.groupId, ...choice } : null;
    }).filter(Boolean);
    const beforeSlot = withCurrentFeatureChoices(candidate, otherChoices);
    return nativeResultsMet(nativeRequirementResults({ nativeRequirements: slot.nativeRequirements }, beforeSlot, ownedSourceGuids(beforeSlot)));
  }

  function activeFeatureSlotsForStep(prefix, classId, archetypeId = null, choicesBySlot = {}) {
    return featureSlotsForStep(prefix, classId, archetypeId).filter((slot) => featureSlotIsActive(prefix, classId, archetypeId, slot, choicesBySlot));
  }

  function sanitizeFeatureDraft(prefix, classId, archetypeId, choicesBySlot) {
    let active = activeFeatureSlotsForStep(prefix, classId, archetypeId, choicesBySlot);
    Object.keys(choicesBySlot).filter((slotId) => !active.some((slot) => slot.id === slotId)).forEach((slotId) => delete choicesBySlot[slotId]);
    active = activeFeatureSlotsForStep(prefix, classId, archetypeId, choicesBySlot);
    return active;
  }

  function featPoolForSlot(slot) {
    if (slot.pool?.startsWith("owlcat:")) {
      const group = DATA.featureGroups?.[slot.pool];
      const sourceGuids = new Set((group?.options || []).map((option) => option.sourceGuid));
      return DATA.feats.filter((feat) => sourceGuids.has(feat.sourceGuid));
    }
    const combatCategories = new Set(["战斗", "战技", "武器", "重击", "远程", "双持", "盾牌", "骑乘", "威吓", "武术", "防御", "熟练"]);
    const verified = DATA.feats.filter((feat) => feat.sourceVerified);
    if (slot.pool === "teamwork") return verified.filter((feat) => feat.category === "团队");
    if (slot.pool === "skill-focus") return verified.filter((feat) => feat.skillFocus || feat.sourceInternalName === "SkillFocusSelection");
    if (slot.pool === "magic") return verified.filter((feat) => feat.metamagic || ["施法", "超魔"].includes(feat.category));
    if (slot.pool === "monk") return verified.filter((feat) => ["武术", "战斗", "防御", "骑乘"].includes(feat.category));
    if (slot.pool === "combat") return verified.filter((feat) => combatCategories.has(feat.category));
    return verified;
  }

  function choiceHasMatchingParameter(character, sourceId, item, params) {
    if (!item?.parameter?.matchFrom) return true;
    const value = parameterValue(item, params);
    const pool = sourceId === "mythic" ? [...character.featChoices, ...(character.effectiveMythicChoiceRecords || character.mythicChoiceRecords || [])] : character.featChoices;
    return pool.some((choice) => choice.id === item.parameter.matchFrom && choice.params?.[item.parameter.type] === value);
  }

  function isParameterizedChoiceEligible(item, params, character, ignorePrerequisites = false, sourceId = "feat") {
    if (!parameterComplete(item, params) || !choiceHasMatchingParameter(character, sourceId, item, params) || (!ignorePrerequisites && !isEligible(item, character, params))) return false;
    if (item.nativeParameter?.type === "SpellSpecialization") {
      const value = parameterValue(item, params);
      const spell = spellById.get(value) || DATA.spells.find((entry) => entry.sourceGuid === value);
      if (!spell) return false;
      const known = new Set(allKnownSpells(character));
      const canUse = [...new Set(character.normalSteps.map((step) => `${step.classId}:${step.archetypeId || ""}`))].some((key) => {
        const [classId, archetypeId] = key.split(":");
        if (DATA.owlcatSpellLevelForClass?.(spell, classId, archetypeId || null) === null) return false;
        const casting = classCastingRule(classId, archetypeId || null);
        return !casting.spontaneous || known.has(spell.id);
      });
      if (!canUse) return false;
    }
    if (!item.parameter?.nested) return true;
    const nested = mythicById.get(parameterValue(item, params));
    if (!nested) return false;
    const nestedParams = params.nestedParams || {};
    const nestedChoice = { id: nested.id, params: nestedParams };
    const effectiveRecords = character.effectiveMythicChoiceRecords || character.mythicChoiceRecords || [];
    const alreadyOwned = nested.parameter
      ? effectiveRecords.some((choice) => choiceKey(choice) === choiceKey(nestedChoice))
      : character.mythicChoices.includes(nested.id);
    return !alreadyOwned && isParameterizedChoiceEligible(nested, nestedParams, character, ignorePrerequisites, "mythic");
  }

  function parameterControl(item, params, slotId, scope = "feat", locked = false) {
    if (!item?.parameter) return "";
    const definition = DATA.choiceParameterTypes?.[item.parameter.type];
    const value = parameterValue(item, params);
    const primary = `<label class="select-field parameter-field"><span>${escapeHtml(definition?.name || "细分选项")} · 必选</span><select data-${scope}-param-slot="${escapeHtml(slotId)}" ${locked ? "disabled" : ""}><option value="">请选择</option>${parameterOptionsForItem(item).map((raw) => { const option = typeof raw === "string" ? { id: raw, name: raw } : raw; return `<option value="${escapeHtml(option.id)}" ${value === option.id ? "selected" : ""}>${escapeHtml(option.name)}</option>`; }).join("")}</select></label>`;
    if (!item.parameter.nested || !value) return primary;
    const nested = mythicById.get(value);
    if (!nested?.parameter) return primary;
    const nestedDefinition = DATA.choiceParameterTypes?.[nested.parameter.type];
    const nestedValue = parameterValue(nested, params.nestedParams || {});
    return `${primary}<label class="select-field parameter-field"><span>${escapeHtml(nestedDefinition?.name || "嵌套细分选项")} · 必选</span><select data-mythic-nested-param="${escapeHtml(slotId)}"><option value="">请选择</option>${(nestedDefinition?.options || []).map((raw) => { const option = typeof raw === "string" ? { id: raw, name: raw } : raw; return `<option value="${escapeHtml(option.id)}" ${nestedValue === option.id ? "selected" : ""}>${escapeHtml(option.name)}</option>`; }).join("")}</select></label>`;
  }

  function featureNestedControl(slot, choice, locked = false, character = currentCharacter()) {
    let option = DATA.featureGroups?.[slot.groupId]?.options?.find((entry) => entry.id === choice?.optionId);
    if (!option?.nestedSelectionGuid) return "";
    const nestedIds = choice?.params?.nestedOptionIds || (choice?.params?.nestedOptionId ? [choice.params.nestedOptionId] : []);
    const nestedParams = choice?.params?.nestedParamsByDepth || [];
    const controls = [];
    const seen = new Set();
    const existingChoices = character.normalSteps.at(-1)?.featureChoices || [];
    let depth = 0;
    while (option?.nestedSelectionGuid && !seen.has(option.nestedSelectionGuid)) {
      seen.add(option.nestedSelectionGuid);
      const nestedGroup = DATA.featureGroups?.[`owlcat:${option.nestedSelectionGuid}`];
      const selectedId = nestedIds[depth] || "";
      const beforeNested = withCurrentFeatureChoices(character, [...existingChoices, {
        slotId: slot.id,
        source: slot.source,
        groupId: slot.groupId,
        optionId: choice.optionId,
        params: { ...choice.params, nestedOptionId: nestedIds[0] || null, nestedOptionIds: nestedIds.slice(0, depth) }
      }]);
      controls.push(`<label class="select-field parameter-field"><span>${escapeHtml(nestedGroup?.name || "细分选项")} · 必选</span><select data-feature-nested-slot="${escapeHtml(slot.id)}" data-feature-nested-depth="${depth}" ${locked ? "disabled" : ""}><option value="">请选择</option>${(nestedGroup?.options || []).map((nested) => `<option value="${escapeHtml(nested.id)}" ${selectedId === nested.id ? "selected" : ""} ${selectedId !== nested.id && !itemRequirementsMet(nested, beforeNested) ? "disabled" : ""}>${escapeHtml(nested.name)}</option>`).join("")}</select></label>`);
      option = nestedGroup?.options?.find((nested) => nested.id === selectedId);
      if (option?.parameter) controls.push(parameterControl(option, nestedParams[depth] || {}, `${slot.id}|${depth}`, "feature-nested", locked));
      depth += 1;
    }
    return controls.join("");
  }

  function withCurrentFeatureChoices(candidate, choices) {
    const lastIndex = candidate.normalSteps.length - 1;
    return rebuildCharacter({
      ...candidate,
      normalSteps: candidate.normalSteps.map((step, index) => index === lastIndex ? { ...step, featureChoices: choices } : step),
      mythicSteps: candidate.mythicSteps.map((step) => ({ ...step, pathChoices: (step.pathChoices || []).map((choice) => ({ ...choice, params: stableParams(choice.params || {}) })), pathPicks: [...step.pathPicks] })),
      legacyManual: { feats: [...candidate.legacyManual.feats], mythic: [...candidate.legacyManual.mythic] }
    });
  }

  function featureAutoGrants(character = currentCharacter()) {
    const counts = classCounts(character);
    const selectedOptionGrants = character.featureChoices.flatMap((choice) => {
      const option = DATA.featureGroups?.[choice.groupId]?.options?.find((item) => item.id === choice.optionId);
      const ownerClass = choice.slotId.split(":")[1];
      return (option?.grants || []).filter(([level]) => (counts[ownerClass] || 0) >= level).map(([, name]) => `${option.name}：${name}`);
    });
    const runningClassLevels = {};
    const sourceAutoGrants = character.normalSteps.flatMap((step) => {
      const classLevel = (runningClassLevels[step.classId] || 0) + 1;
      runningClassLevels[step.classId] = classLevel;
      return (DATA.owlcatAutoFeaturesForClass?.(step.classId, classLevel, step.archetypeId) || [])
        .map((feature) => `LV${step.level} · ${feature.name}`);
    });
    return [...new Set([...selectedOptionGrants, ...sourceAutoGrants])];
  }

  function featPickCount(prefix, classId) {
    const level = prefix.normalSteps.length + 1;
    const classLevel = (classCounts(prefix)[classId] || 0) + 1;
    let count = level % 2 === 1 ? 1 : 0;
    if (level === 1 && prefix.race === "human") count += 1;
    if (classId === "fighter" && (classLevel === 1 || classLevel % 2 === 0)) count += 1;
    return count;
  }

  function domainSlotsForClassLevel(characterLevel, classId, classLevel, archetypeId) {
    if (DATA.owlcatClassProgressionReady?.[classId]) return DATA.owlcatDomainSlotsForClass?.(classId, classLevel, archetypeId) || [];
    const base = classById.get(classId) || {};
    const archetype = archetypeByKey.get(archetypeKey(classId, archetypeId)) || {};
    const pickLevel = Number(archetype.domainPickLevel ?? base.domainPickLevel) || 1;
    if (classLevel !== pickLevel) return [];
    const count = Number(archetype.domainPicks ?? base.domainPicks) || 0;
    return Array.from({ length: count }, (_, index) => ({
      id: `domain:${classId}:${classLevel}:legacy:${index + 1}`,
      kind: "domain",
      label: `${base.name || classId}领域 ${index + 1}`,
      source: `class:${classId}`,
      sourceGuid: null,
      allowedDomainSourceGuids: []
    }));
  }

  function domainSlotsForStep(prefix, classId, archetypeId) {
    return domainSlotsForClassLevel(prefix.normalSteps.length + 1, classId, (classCounts(prefix)[classId] || 0) + 1, archetypeId);
  }

  function domainPickCount(prefix, classId, archetypeId) {
    return domainSlotsForStep(prefix, classId, archetypeId).length;
  }

  function domainsForSlot(prefix, classId, archetypeId, slot) {
    const allowedIds = new Set(slot?.allowedDomainIds || []);
    const allowed = new Set(slot?.allowedDomainSourceGuids || []);
    return availableDomains(prefix, classId, archetypeId).filter((domain) => !allowed.size || allowed.has(domain.sourceGuid) || allowedIds.has(domain.id));
  }

  function knownSpellPickSpec(prefix, classId, archetypeId) {
    const previous = classCounts(prefix)[classId] || 0;
    const next = previous + 1;
    const native = DATA.owlcatKnownSpellPickSpec?.(classId, next, archetypeId);
    if (native !== null && native !== undefined) return native;
    const casting = classCastingRule(classId, archetypeId);
    if (!casting.spontaneous) return {};
    const tableId = classId === "bloodrager" ? "bloodrager4" : ["sorcerer", "oracle"].includes(classId) || (classId === "witch" && archetypeId === "stigmatized-witch") ? "sorc9" : "bard6";
    const table = DATA.spellKnownTables?.[tableId] || {};
    const adjusted = (value) => Math.max(0, value + casting.knownOffset);
    return Object.fromEntries(Object.entries(table).map(([level, totals]) => [Number(level), Math.max(0, adjusted(totals[next - 1] || 0) - (previous ? adjusted(totals[previous - 1] || 0) : 0))]).filter(([, count]) => count > 0));
  }

  function spellLevelForClass(spell, classId, archetypeId) {
    const native = DATA.owlcatSpellLevelForClass?.(spell, classId, archetypeId);
    if (native !== null && native !== undefined) return native;
    return Number(spell?.level);
  }

  function spellPoolForClass(classId, archetypeId, spellLevel) {
    const native = DATA.owlcatSpellOptionsForClass?.(classId, archetypeId, Number(spellLevel));
    if (native) return native;
    const casting = classCastingRule(classId, archetypeId);
    const legacyList = casting.spellList === "witch" ? "arcane" : casting.spellList;
    return DATA.spells.filter((spell) => Number(spell.level) === Number(spellLevel) && spell.lists.includes(legacyList));
  }

  function spellProfile(character = currentCharacter()) {
    const projected = DATA.owlcatCharacterSpellbooks?.(character) || [];
    if (projected.length) {
      const maximum = (items) => items.reduce((value, entry) => Math.max(value, Number(entry.maxSpellLevel) || 0), 0);
      const arcane = maximum(projected.filter((entry) => entry.isArcane));
      const divine = maximum(projected.filter((entry) => !entry.isArcane));
      return {
        arcane,
        spontaneousArcane: maximum(projected.filter((entry) => entry.isArcane && entry.spontaneous)),
        divine,
        any: Math.max(arcane, divine)
      };
    }
    let arcane = 0;
    let spontaneousArcane = 0;
    let divine = 0;
    const counts = classCounts(character);
    Object.entries(counts).forEach(([id, level]) => {
      const entry = classById.get(id);
      const archetypeId = character.normalSteps.find((step) => step.classId === id)?.archetypeId || null;
      const spellLevel = classSpellLevel(id, level, archetypeId);
      if (entry?.casting?.startsWith("arcane")) arcane = Math.max(arcane, spellLevel);
      if (entry?.casting === "arcane-spontaneous") spontaneousArcane = Math.max(spontaneousArcane, spellLevel);
      if (entry?.casting?.startsWith("divine")) divine = Math.max(divine, spellLevel);
    });
    return { arcane, spontaneousArcane, divine, any: Math.max(arcane, divine) };
  }

  function componentNumericValue(value) {
    if (Number.isFinite(Number(value))) return Number(value);
    if (value && Number.isFinite(Number(value.Value))) return Number(value.Value);
    return 0;
  }

  // Verified against ModifierDescriptorHelper.IsStackable in the installed 2.7.0x
  // Assembly-CSharp.dll. Non-stackable descriptors keep the strongest positive
  // and strongest negative modifier; stackable descriptors add every modifier.
  const nativeStackableDescriptors = new Set([
    "None", "Racial", "Dodge", "NaturalArmor", "NegativeEnergyPenalty", "UntypedStackable",
    "Feat", "Focus", "ShieldFocus", "Penalty", "ArmorFocus", "DLC3_Stackable"
  ]);
  const nativeStatNames = {
    Strength: "力量", Dexterity: "敏捷", Constitution: "体质", Intelligence: "智力", Wisdom: "感知", Charisma: "魅力",
    SaveFortitude: "强韧", SaveReflex: "反射", SaveWill: "意志", AC: "护甲等级", Initiative: "先攻",
    HitPoints: "生命值", SkillAthletics: "运动", SkillMobility: "灵巧", SkillThievery: "巧手", SkillStealth: "隐匿",
    SkillKnowledgeArcana: "知识（奥秘）", SkillKnowledgeWorld: "知识（世界）", SkillLoreNature: "学识（自然）",
    SkillLoreReligion: "学识（宗教）", SkillPerception: "察觉", SkillPersuasion: "沟通", SkillUseMagicDevice: "使用魔法装置",
    AdditionalAttackBonus: "额外攻击加值", AdditionalDamage: "额外伤害", BaseAttackBonus: "基础攻击加值",
    CombatManeuverBonus: "战技加值", CombatManeuverDefense: "战技防御", SneakAttack: "偷袭"
  };
  const nativeEnergyNames = {
    Fire: "火焰", Cold: "寒冷", Sonic: "音波", Electricity: "电击", Acid: "酸液", NegativeEnergy: "负能量",
    PositiveEnergy: "正能量", Holy: "神圣", Unholy: "邪恶", Divine: "神力", Magic: "魔法"
  };
  const nativeSchoolNames = {
    Abjuration: "防护", Conjuration: "咒法", Divination: "预言", Enchantment: "附魔",
    Evocation: "塑能", Illusion: "幻术", Necromancy: "死灵", Transmutation: "变化", Universalist: "通用"
  };
  const nativeDescriptorNames = {
    None: "无类型", Racial: "种族", Dodge: "闪避", Competence: "表现", Armor: "盔甲", Shield: "盾牌",
    Alchemical: "炼金", Circumstance: "环境", Deflection: "偏斜", Enhancement: "增强", ArmorEnhancement: "盔甲增强",
    ShieldEnhancement: "盾牌增强", Inherent: "内在", Insight: "洞察", Luck: "幸运", Morale: "士气",
    NaturalArmor: "天生防御", NaturalArmorEnhancement: "天生防御增强", Profane: "亵渎", Sacred: "崇圣",
    Size: "体型", Trait: "特性", Resistance: "抗力", UntypedStackable: "无类型（可叠加）", Feat: "专长",
    Focus: "专攻", ShieldFocus: "盾牌专攻", Penalty: "减值", Mythic: "神话", Rage: "狂暴", Haste: "加速"
  };
  const spellDescriptorBits = [
    [1, "火焰"], [2, "酸液"], [4, "寒冷"], [8, "电击"], [16, "影响心智"], [32, "恐惧"], [64, "胁迫"],
    [128, "情绪"], [256, "毒素"], [512, "召唤"], [1024, "善良"], [2048, "邪恶"], [4096, "混乱"],
    [8192, "守序"], [16384, "疾病"], [32768, "魅惑"], [65536, "眩晕"], [131072, "恶心"],
    [262144, "战栗"], [524288, "疲劳"], [1048576, "恍惚"], [2097152, "反胃"], [4194304, "惊恐"],
    [8388608, "力竭"], [16777216, "震慑"], [33554432, "麻痹"], [67108864, "困惑"], [134217728, "目盲"],
    [268435456, "诅咒"], [536870912, "死亡"], [1073741824, "音波"], [2147483648, "治疗"], [4294967296, "睡眠"]
  ];

  function nativeDefinition(guid) {
    return DATA.owlcat?.definitions?.[nativeGuid(guid)] || null;
  }

  function nativeFeatureName(guid) {
    const normalized = nativeGuid(guid);
    const definition = nativeDefinition(normalized);
    return definition?.name || definition?.internalName || (normalized ? `蓝图 ${normalized.slice(0, 8)}` : "未知蓝图");
  }

  function spellDescriptorLabel(value) {
    const numeric = Number(value?.m_IntValue ?? value ?? 0);
    if (!Number.isFinite(numeric) || numeric === 0) return numeric === 0 ? "无" : String(value);
    const labels = spellDescriptorBits.filter(([bit]) => Math.floor(numeric / bit) % 2 >= 1).map(([, label]) => label);
    return labels.length ? labels.join(" / ") : `描述符 ${numeric}`;
  }

  function contextValueExpression(value) {
    if (Number.isFinite(Number(value))) return { value: Number(value), text: String(Number(value)), dynamic: false };
    if (!value || typeof value !== "object") return { value: null, text: "动态值", dynamic: true };
    const base = Number.isFinite(Number(value.Value)) ? Number(value.Value) : null;
    if (!value.ValueType || value.ValueType === "Simple") return { value: base, text: base === null ? "动态值" : String(base), dynamic: base === null };
    const parts = [value.ValueType, value.ValueRank && value.ValueRank !== "Default" ? value.ValueRank : null, value.ValueShared && value.ValueShared !== "Damage" ? value.ValueShared : null].filter(Boolean);
    return { value: null, text: `${parts.join(" · ")}${base === null ? "" : `（蓝图值 ${base}）`}`, dynamic: true };
  }

  function contextRankBase(config, character) {
    const type = config?.m_BaseValueType || config?.BaseValueType;
    if (type === "MythicLevel") return Number(character.mythicRank) || character.mythicSteps?.length || 0;
    if (type === "CharacterLevel") return characterLevel(character);
    if (type === "BaseAttack" || type === "BaseAttackBonus") return baseAttack(character);
    if (["ClassLevel", "SummClassLevelWithArchetype", "OwnerSummClassLevelWithArchetype"].includes(type)) {
      const classGuids = new Set();
      addGuidValues(config.m_Class || config.m_Classes || [], classGuids);
      const archetypeGuids = new Set();
      addGuidValues(config.Archetype || config.m_Archetype || config.m_AdditionalArchetypes || [], archetypeGuids);
      return (character.normalSteps || []).filter((step) => {
        if (classGuids.size && !classGuids.has(nativeGuid(classById.get(step.classId)?.sourceGuid))) return false;
        if (!archetypeGuids.size) return true;
        return archetypeGuids.has(nativeGuid(archetypeByKey.get(archetypeKey(step.classId, step.archetypeId))?.sourceGuid));
      }).length;
    }
    return null;
  }

  function contextRankProgression(config, base) {
    if (!Number.isFinite(base)) return null;
    const progression = config?.m_Progression || config?.Progression || "AsIs";
    const step = Number(config?.m_StepLevel ?? config?.StepLevel) || 1;
    const start = Number(config?.m_StartLevel ?? config?.StartLevel) || 0;
    let value = null;
    if (progression === "AsIs") value = base;
    else if (progression === "Div2") value = Math.floor(base / 2);
    else if (progression === "DivStep") value = Math.floor(base / step);
    else if (progression === "Div2PlusStep") value = Math.floor(base / 2) + step;
    else if (progression === "MultiplyByModifier") value = base * step;
    else if (progression === "StartPlusDivStep") value = base < start ? 0 : 1 + Math.floor((base - start) / step);
    else if (progression === "Custom") {
      const rows = (config.m_CustomProgression || []).map((row) => ({ base: Number(row.BaseValue), value: Number(row.ProgressionValue) })).filter((row) => Number.isFinite(row.base) && Number.isFinite(row.value)).sort((a, b) => a.base - b.base);
      value = rows.filter((row) => row.base <= base).at(-1)?.value ?? rows[0]?.value ?? null;
    }
    if (!Number.isFinite(value)) return null;
    if (config.m_UseMin || config.UseMin) value = Math.max(Number(config.m_Min ?? config.Min) || 0, value);
    if (config.m_UseMax || config.UseMax) value = Math.min(Number(config.m_Max ?? config.Max) || 0, value);
    return value;
  }

  function resolvedContextValue(value, occurrence, character) {
    const fallback = contextValueExpression(value);
    if (!value || typeof value !== "object" || value.ValueType !== "Rank") return fallback;
    const rankType = value.ValueRank || "Default";
    const config = (occurrence.components || []).find((component) => componentType(component) === "ContextRankConfig" && (component.m_Type || "Default") === rankType);
    if (!config) return fallback;
    const rank = contextRankProgression(config, contextRankBase(config, character));
    return Number.isFinite(rank) ? { value: rank, text: String(rank), dynamic: false } : fallback;
  }

  function selectedFeatureChoiceItems(choice) {
    const result = [];
    let item = DATA.featureGroups?.[choice?.groupId]?.options?.find((entry) => entry.id === choice?.optionId);
    if (item) result.push({ item, params: choice.params || {} });
    const nestedIds = choice?.params?.nestedOptionIds || (choice?.params?.nestedOptionId ? [choice.params.nestedOptionId] : []);
    const nestedParams = choice?.params?.nestedParamsByDepth || [];
    nestedIds.forEach((id, depth) => {
      item = DATA.featureGroups?.[`owlcat:${item?.nestedSelectionGuid}`]?.options?.find((entry) => entry.id === id);
      if (item) result.push({ item, params: nestedParams[depth] || {} });
    });
    return result;
  }

  function characterSourceRoots(character = currentCharacter()) {
    const roots = [];
    let sequence = 0;
    const add = (sourceGuid, components, originKind, originLabel, count = 1, detail = null) => {
      const guid = nativeGuid(sourceGuid);
      if (!guid && !(components || []).length) return;
      for (let index = 0; index < Math.max(1, Number(count) || 1); index += 1) {
        roots.push({
          id: `root:${sequence += 1}`,
          sourceGuid: guid,
          components: (components || []).length ? components : nativeDefinition(guid)?.components || [],
          originKind,
          originLabel: originLabel || nativeFeatureName(guid),
          detail
        });
      }
    };
    const creationEntries = [
      [DATA.races.find((entry) => entry.id === character.race), "race", "种族"],
      [heritageById.get(character.heritage), "heritage", "子种族"],
      [DATA.backgrounds.find((entry) => entry.id === character.background), "background", "出身"],
      [deityById.get(character.deity), "deity", "信仰"]
    ];
    creationEntries.filter(([entry]) => entry).forEach(([entry, kind, prefix]) => add(entry.sourceGuid, entry.nativeComponents, kind, `${prefix}：${entry.name}`));
    activeRaceFeatureGuids(character).forEach((guid) => add(guid, null, "race-feature", `种族能力：${nativeFeatureName(guid)}`));
    const backgroundParams = new Set();
    addGuidValues(character.backgroundParams || {}, backgroundParams);
    backgroundParams.forEach((guid) => add(guid, null, "background-parameter", `出身细分：${nativeFeatureName(guid)}`));
    (character.normalSteps || []).flatMap((step) => step.domainChoices || []).forEach((choice) => {
      const domain = domainById.get(choice.domainId);
      add(domain?.sourceGuid, domain?.nativeComponents, "domain", `领域：${domain?.name || choice.domainId}`);
    });
    (character.featChoices || []).forEach((choice) => {
      const item = featById.get(choice.id);
      add(item?.sourceGuid, item?.nativeComponents, "feat", `专长：${parameterLabel(item, choice.params || {})}`, 1, { params: choice.params || {} });
    });
    (character.effectiveMythicChoiceRecords || character.mythicChoiceRecords || []).forEach((choice) => {
      const item = mythicById.get(choice.id);
      add(item?.sourceGuid, item?.nativeComponents, "mythic", `通用神话：${parameterLabel(item, choice.params || {})}`, 1, { params: choice.params || {} });
    });
    (character.normalSteps || []).forEach((step) => (step.featureChoices || []).forEach((choice) => {
      selectedFeatureChoiceItems(choice).forEach(({ item, params }) => add(item.sourceGuid, item.nativeComponents, "class-choice", `职业选择：${item.parameter ? parameterLabel(item, params) : item.name}`, 1, { level: step.level, params }));
    }));
    const runningClassLevels = {};
    (character.normalSteps || []).forEach((step) => {
      const classLevel = (runningClassLevels[step.classId] || 0) + 1;
      runningClassLevels[step.classId] = classLevel;
      (DATA.owlcatAutoFeaturesForClass?.(step.classId, classLevel, step.archetypeId) || []).forEach((feature) => {
        add(feature.sourceGuid, feature.components, "class-auto", `${classLabel(step.classId)} ${classLevel}：${feature.name || nativeFeatureName(feature.sourceGuid)}`, feature.count, { characterLevel: step.level, classLevel });
      });
    });
    const projection = mythicProjection(character);
    (projection.activePathChoiceRecords || []).forEach((choice) => {
      const feat = choice.optionId?.startsWith("dragon-feat:") ? featById.get(choice.optionId.slice(12)) : null;
      const item = feat || pathAbilityById.get(choice.optionId);
      add(item?.sourceGuid, item?.nativeComponents, "path-choice", `道途选择：${item ? parameterLabel(item, choice.params || {}) : choice.optionId}`, 1, { rank: choice.rank, params: choice.params || {} });
    });
    const addPathAuto = (pathId, throughRank, retained = false) => {
      const progression = DATA.owlcatPathProgressions?.[pathId];
      (progression?.levels || []).filter((level) => level.rank <= throughRank).forEach((level) => {
        (level.auto || []).forEach((feature) => add(feature.sourceGuid, feature.components, "path-auto", `${retained ? "保留道途" : "道途"} ${pathById.get(pathId)?.name || pathId} MR${level.rank}：${feature.name || nativeFeatureName(feature.sourceGuid)}`, feature.count, { rank: level.rank, pathId }));
      });
    };
    addPathAuto(projection.activePath, character.mythicSteps.length);
    if (projection.activePath === "devil" && projection.pathHistory.length > 1) addPathAuto(projection.pathHistory[0], 7, true);
    return roots;
  }

  function componentClassLevelMet(component, character) {
    const classGuids = new Set();
    addGuidValues(component.m_Class, classGuids);
    addGuidValues(component.m_AdditionalClasses || [], classGuids);
    if (!classGuids.size) return true;
    const archetypeGuids = new Set();
    addGuidValues(component.m_Archetypes || [], archetypeGuids);
    const level = (character.normalSteps || []).filter((step) => {
      const classEntry = classById.get(step.classId);
      if (!classGuids.has(nativeGuid(classEntry?.sourceGuid))) return false;
      if (!archetypeGuids.size) return true;
      return archetypeGuids.has(nativeGuid(archetypeByKey.get(archetypeKey(step.classId, step.archetypeId))?.sourceGuid));
    }).length;
    const target = Number(component.Level) || 0;
    return component.BeforeThisLevel ? level < target : level >= target;
  }

  function nativeAlignmentTokens(alignmentId) {
    const byId = {
      "lawful-good": ["LawfulGood", "Lawful", "Good"], "neutral-good": ["NeutralGood", "Neutral", "Good"],
      "chaotic-good": ["ChaoticGood", "Chaotic", "Good"], "lawful-neutral": ["LawfulNeutral", "Lawful", "Neutral"],
      "true-neutral": ["TrueNeutral", "Neutral"], "chaotic-neutral": ["ChaoticNeutral", "Chaotic", "Neutral"],
      "lawful-evil": ["LawfulEvil", "Lawful", "Evil"], "neutral-evil": ["NeutralEvil", "Neutral", "Evil"],
      "chaotic-evil": ["ChaoticEvil", "Chaotic", "Evil"]
    };
    const aliases = { LG: "lawful-good", NG: "neutral-good", CG: "chaotic-good", LN: "lawful-neutral", N: "true-neutral", CN: "chaotic-neutral", LE: "lawful-evil", NE: "neutral-evil", CE: "chaotic-evil" };
    return byId[aliases[alignmentId] || alignmentId] || [];
  }

  function nativeAlignmentMatches(raw, alignmentId) {
    const tokens = nativeAlignmentTokens(alignmentId);
    const allowed = String(raw || "").split(/[|,]/).map((value) => value.trim()).filter(Boolean);
    return allowed.includes("Any") || allowed.some((alignment) => tokens.includes(alignment));
  }

  function componentGrantEnabled(component, character, assumedOwned) {
    const type = componentType(component);
    if (type === "AddFeatureOnClassLevel") return componentClassLevelMet(component, character);
    if (type === "AddFeatureOnSkill") {
      const abilityIds = { Strength: "str", Dexterity: "dex", Constitution: "con", Intelligence: "int", Wisdom: "wis", Charisma: "cha" };
      const abilityId = abilityIds[component.StatType];
      if (!abilityId) return false;
      let score = Number(character.attributes?.[abilityId]) || 0;
      if (character.attributesMode !== "final") {
        const previewEffects = effectsForOwnedSourceSet(assumedOwned, character) || [];
        score += staticStatValue({ effects: previewEffects }, component.StatType);
        const race = DATA.races.find((entry) => entry.id === character.race);
        if (race?.sourceMechanics?.selectableRaceStat && character.raceAbility === abilityId) score += 2;
      }
      (character.normalSteps || []).forEach((step) => { if (step.abilityIncrease === abilityId) score += 1; });
      return score >= (Number(component.MinimalStat) || 0);
    }
    if (type === "AddFeatureIfHasFact") {
      const checked = nativeGuid(component.m_CheckedFact);
      const has = checked ? assumedOwned.has(checked) : false;
      return component.Not ? !has : has;
    }
    if (type === "AddFeatureOnAlignment") {
      return nativeAlignmentMatches(component.Alignment, character.alignment);
    }
    if (type === "AddFactIfArchetype") {
      const classGuid = nativeGuid(component.m_CharacterClass);
      const archetypeGuid = nativeGuid(component.m_Archetype);
      return (character.normalSteps || []).some((step) => nativeGuid(classById.get(step.classId)?.sourceGuid) === classGuid
        && nativeGuid(archetypeByKey.get(archetypeKey(step.classId, step.archetypeId))?.sourceGuid) === archetypeGuid);
    }
    return true;
  }

  function grantedComponentGuids(component) {
    const type = componentType(component);
    if (!["AddFacts", "AddFeatureOnApply", "AddFeatureOnClassLevel", "AddFeatureIfHasFact", "AddFeatureOnSkill", "AddFeatureOnAlignment", "AddFactIfArchetype", "AddParametrizedFeatures"].includes(type)) return [];
    const result = new Set();
    addGuidValues(component.m_Facts || component.m_Features || component.m_Feature || component.Feature, result);
    return [...result];
  }

  function projectSourceRoots(character, roots, seedOwned = new Set()) {
    let assumedOwned = new Set([...seedOwned, ...roots.map((root) => root.sourceGuid).filter(Boolean)]);
    let activeOccurrences = roots;
    let removed = new Set();
    for (let pass = 0; pass < 12; pass += 1) {
      const occurrences = [];
      const removedInPass = new Set();
      const visit = (entry, lineage = []) => {
        const guid = nativeGuid(entry.sourceGuid);
        if (guid && lineage.includes(guid)) return;
        const nextLineage = guid ? [...lineage, guid] : lineage;
        const occurrence = { ...entry, sourceGuid: guid, lineage: nextLineage };
        occurrences.push(occurrence);
        (entry.components || []).forEach((component, componentIndex) => {
          if (componentType(component) === "RemoveFeatureOnApply") addGuidValues(component.m_Feature || component.Feature, removedInPass);
          if (!componentGrantEnabled(component, character, assumedOwned)) return;
          grantedComponentGuids(component).forEach((grantedGuid, grantedIndex) => {
            const definition = nativeDefinition(grantedGuid);
            visit({
              id: `${entry.id}:grant:${componentIndex}:${grantedIndex}:${grantedGuid}`,
              sourceGuid: grantedGuid,
              components: definition?.components || [],
              originKind: entry.originKind,
              originLabel: entry.originLabel,
              detail: entry.detail,
              grantedBy: guid,
              grantedByType: componentType(component)
            }, nextLineage);
          });
        });
      };
      roots.forEach((root) => visit(root));
      const active = occurrences.filter((occurrence) => !occurrence.lineage.some((guid) => removedInPass.has(guid)));
      const nextOwned = new Set([...seedOwned, ...active.map((occurrence) => occurrence.sourceGuid).filter(Boolean)]);
      removedInPass.forEach((guid) => nextOwned.delete(guid));
      activeOccurrences = active;
      removed = removedInPass;
      if (nextOwned.size === assumedOwned.size && [...nextOwned].every((guid) => assumedOwned.has(guid))) {
        assumedOwned = nextOwned;
        break;
      }
      assumedOwned = nextOwned;
    }
    return { roots, occurrences: activeOccurrences, owned: assumedOwned, removed };
  }

  function projectCharacterSources(character = currentCharacter()) {
    return projectSourceRoots(character, characterSourceRoots(character));
  }

  function conditionalFactsMet(component, owned) {
    const checked = new Set();
    addGuidValues(component.m_CheckedFacts || component.m_CheckedFact, checked);
    if (!checked.size) return true;
    const has = component.RequireAllFacts ? [...checked].every((guid) => owned.has(guid)) : [...checked].some((guid) => owned.has(guid));
    return component.InvertCondition ? !has : has;
  }

  function normalizeComponentEffects(occurrence, owned, character = currentCharacter()) {
    const definition = nativeDefinition(occurrence.sourceGuid);
    const base = {
      sourceGuid: occurrence.sourceGuid,
      sourceName: definition?.name || definition?.internalName || occurrence.originLabel,
      sourceDescription: definition?.description || "",
      originKind: occurrence.originKind,
      originLabel: occurrence.originLabel,
      occurrenceId: occurrence.id
    };
    const effects = [];
    const push = (effect) => effects.push({ ...base, modeled: true, ...effect });
    const isExecutableAbility = /Blueprint(?:Ability|ActivatableAbility)/.test(definition?.blueprintType || "");
    if (occurrence.grantedBy && isExecutableAbility) {
      push({ category: "granted-ability", type: "GrantedAbility", label: `获得能力：${base.sourceName}` });
    }
    if (isExecutableAbility) {
      const componentCount = occurrence.componentCount ?? definition?.componentCount ?? occurrence.components?.length ?? 0;
      if (componentCount) {
        push({ category: "runtime-rule", type: "NativeAbilityExecution", componentCount, label: `由游戏原生能力动作链执行（${componentCount} 个组件）` });
      }
      return effects;
    }
    (occurrence.components || []).forEach((component) => {
      const type = componentType(component);
      if (["AddFacts", "AddFeatureOnApply", "AddFeatureOnClassLevel", "AddFeatureIfHasFact", "AddFeatureOnSkill", "AddFeatureOnAlignment", "AddFactIfArchetype", "AddParametrizedFeatures", "RemoveFeatureOnApply"].includes(type)) return;
      if (type === "AddStatBonus" || type === "AddStatBonusIfHasFact") {
        if (type === "AddStatBonusIfHasFact" && !conditionalFactsMet(component, owned)) return;
        const value = componentNumericValue(component.Value);
        const descriptor = component.Descriptor || "None";
        push({ category: "stat", type, stat: component.Stat, value, descriptor, stackable: nativeStackableDescriptors.has(descriptor), label: `${nativeStatNames[component.Stat] || component.Stat} ${value >= 0 ? "+" : ""}${value}（${nativeDescriptorNames[descriptor] || descriptor}）` });
        return;
      }
      if (type === "AddContextStatBonus") {
        const value = resolvedContextValue(component.Value, occurrence, character);
        if (Number.isFinite(value.value) && Number.isFinite(Number(component.Multiplier))) value.value *= Number(component.Multiplier);
        const descriptor = component.Descriptor || "None";
        push({ category: value.dynamic ? "stat-dynamic" : "stat", type, stat: component.Stat, value: value.value, descriptor, stackable: nativeStackableDescriptors.has(descriptor), dynamic: value.dynamic, label: `${nativeStatNames[component.Stat] || component.Stat} ${value.value === null ? value.text : `${value.value >= 0 ? "+" : ""}${value.value}`}（${nativeDescriptorNames[descriptor] || descriptor}）` });
        return;
      }
      if (type === "AccomplishedSneakAttacker") {
        push({ category: "sneak", type, stat: "SneakAttack", value: Number(component.Value) || 1, label: "偷袭额外 +1d6（受人物等级上限限制）" });
        return;
      }
      if (type === "ToughnessLogic") {
        const value = component.CheckMythicLevel ? Number(character.mythicRank) || character.mythicSteps?.length || 0 : Math.max(3, characterLevel(character));
        push({ category: "stat", type, stat: "HitPoints", value, descriptor: "Feat", stackable: true, label: `生命值 +${value}（${component.CheckMythicLevel ? "等于神话阶" : "健壮生命骰公式"}）` });
        return;
      }
      if (type === "DamageReductionBelowZero") {
        push({ category: "damage-reduction", type, value: Number(component.Reduction) || 0, conditional: "below-zero", label: `生命值低于 0 时伤害减免 ${Number(component.Reduction) || 0}/${component.EpicBypass ? "传奇" : "—"}` });
        return;
      }
      if (["AddClassSkill", "AddBackgroundClassSkill"].includes(type)) {
        push({ category: "class-skill", type, stat: component.Skill, label: `${nativeStatNames[component.Skill] || component.Skill}成为本职技能` });
        return;
      }
      if (type === "AddSkillPointPerCharacterLevel") {
        push({ category: "skill-points", type, value: 1, label: "每个人物等级额外获得 1 技能点" });
        return;
      }
      if (type === "AddGoldenDragonSkillBonus") {
        push({ category: "skill-rule", type, stat: component.Stat, label: `${nativeStatNames[component.Stat] || component.Stat}应用金龙“修心守意”的原生技能补足规则` });
        return;
      }
      if (type === "AddProficiencies") {
        const raceRestriction = nativeGuid(component.m_RaceRestriction);
        if (raceRestriction && !owned.has(raceRestriction)) return;
        (component.WeaponProficiencies || []).forEach((value) => push({ category: "weapon-proficiency", type, value, label: `擅长武器：${value}` }));
        (component.ArmorProficiencies || []).forEach((value) => push({ category: "armor-proficiency", type, value, label: `擅长防具：${value}` }));
        return;
      }
      if (type === "AddBackgroundWeaponProficiency") {
        push({ category: "weapon-proficiency", type, value: component.Proficiency, label: `擅长武器：${component.Proficiency}` });
        return;
      }
      if (type === "AddBackgroundArmorProficiency") {
        push({ category: "armor-proficiency", type, value: component.Proficiency, label: `擅长防具：${component.Proficiency}` });
        return;
      }
      if (type === "ReplaceStatBaseAttribute") {
        push({ category: "stat-base", type, stat: component.TargetStat, ability: component.BaseAttributeReplacement, ifHigher: Boolean(component.ReplaceIfHigher), label: `${nativeStatNames[component.TargetStat] || component.TargetStat}改用${nativeStatNames[component.BaseAttributeReplacement] || component.BaseAttributeReplacement}${component.ReplaceIfHigher ? "（仅更高时）" : ""}` });
        return;
      }
      if (type === "ReplaceStatForPrerequisites") {
        const classGuid = nativeGuid(component.m_CharacterClass);
        push({ category: "prerequisite-equivalence", type, oldStat: component.OldStat, newStat: component.NewStat, policy: component.Policy, classGuid, label: `${nativeStatNames[component.OldStat] || component.OldStat}前置按${component.Policy === "ClassLevel" ? `${nativeFeatureName(classGuid)}职业等级` : nativeStatNames[component.NewStat] || component.NewStat || component.Policy}换算` });
        return;
      }
      if (type === "AddDamageResistanceEnergy") {
        const value = contextValueExpression(component.Value);
        push({ category: "energy-resistance", type, energy: component.Type, value: value.value, dynamic: value.dynamic, label: `${nativeEnergyNames[component.Type] || component.Type}抗性 ${value.text}` });
        return;
      }
      if (type === "ResistEnergyContext") {
        const value = resolvedContextValue(component.Value, occurrence, character);
        push({ category: "energy-resistance", type, energy: component.Type, value: value.value, dynamic: value.dynamic, label: `${nativeEnergyNames[component.Type] || component.Type}抗性 ${value.value === null ? value.text : value.value}${component.UsePool ? `（承受池 ${contextValueExpression(component.Pool).text}）` : ""}` });
        return;
      }
      if (type === "AddDamageResistancePhysical") {
        const value = contextValueExpression(component.Value);
        const bypass = [component.BypassedByMagic ? "魔法" : null, component.BypassedByEpic ? "史诗" : null, component.BypassedByAlignment ? "阵营" : null, component.BypassedByMaterial ? component.Material : null].filter(Boolean);
        push({ category: "damage-reduction", type, value: value.value, dynamic: value.dynamic, label: `伤害减免 ${value.text}${bypass.length ? ` / ${bypass.join("、")}` : ""}` });
        return;
      }
      if (type === "AddEnergyImmunity" || type === "AddEnergyDamageImmunity") {
        const energy = component.Type || component.EnergyType;
        push({ category: "energy-immunity", type, energy, label: `免疫${nativeEnergyNames[energy] || energy}伤害` });
        return;
      }
      if (type === "AddConditionImmunity") {
        push({ category: "condition-immunity", type, condition: component.Condition, label: `免疫状态：${component.Condition}` });
        return;
      }
      if (type === "BuffDescriptorImmunity" || type === "SpellImmunityToSpellDescriptor") {
        if (component.CheckFact && !owned.has(nativeGuid(component.m_FactToCheck))) return;
        const descriptor = spellDescriptorLabel(component.Descriptor);
        push({ category: type === "BuffDescriptorImmunity" ? "buff-immunity" : "spell-immunity", type, descriptor, label: `${type === "BuffDescriptorImmunity" ? "免疫状态描述符" : "免疫法术描述符"}：${descriptor}` });
        return;
      }
      if (type === "SavingThrowBonusAgainstDescriptor") {
        const value = contextValueExpression(component.Bonus || component.Value);
        const descriptor = spellDescriptorLabel(component.SpellDescriptor);
        push({ category: "conditional-save", type, value: value.value, dynamic: value.dynamic, descriptor, label: `对抗${descriptor}的豁免 ${value.value === null ? value.text : `${value.value >= 0 ? "+" : ""}${value.value}`}` });
        return;
      }
      if (type === "SavingThrowBonusAgainstSchool") {
        const value = componentNumericValue(component.Value);
        push({ category: "conditional-save", type, value, school: component.School, label: `对抗${nativeSchoolNames[component.School] || component.School}学派的豁免 ${value >= 0 ? "+" : ""}${value}` });
        return;
      }
      if (type === "Hardy") {
        const steelSoulGuid = nativeGuid(component.m_SteelSoul);
        const value = steelSoulGuid && owned.has(steelSoulGuid) ? 4 : 2;
        push({ category: "conditional-save", type, value, descriptor: "Racial", label: `对抗毒素、法术与类法术能力的豁免 +${value}（种族${value === 4 ? "；坚如钢铁强化" : ""}）` });
        return;
      }
      if (["AttackBonusAgainstFactOwner", "ACBonusAgainstFactOwner", "SavingThrowBonusAgainstFact"].includes(type)) {
        const value = componentNumericValue(component.AttackBonus ?? component.Bonus ?? component.Value);
        const targetGuid = nativeGuid(component.m_CheckedFact);
        const subject = type === "AttackBonusAgainstFactOwner" ? "对目标攻击" : type === "ACBonusAgainstFactOwner" ? "对目标 AC" : "对目标效果豁免";
        push({ category: "target-conditional", type, value, targetGuid, descriptor: component.Descriptor || "None", label: `${subject} ${value >= 0 ? "+" : ""}${value}（目标需拥有：${nativeFeatureName(targetGuid)}）` });
        return;
      }
      if (type === "ACContextBonusAgainstFactOwner") {
        const value = resolvedContextValue(component.Bonus, occurrence, character);
        const targetGuid = nativeGuid(component.m_CheckedFact);
        push({ category: "target-conditional", type, value: value.value, targetGuid, descriptor: component.Descriptor || "None", label: `对${component.NoFact ? "不拥有" : "拥有"}${nativeFeatureName(targetGuid)}的目标，AC ${value.value === null ? value.text : `${value.value >= 0 ? "+" : ""}${value.value}`}（${nativeDescriptorNames[component.Descriptor] || component.Descriptor || "无类型"}）` });
        return;
      }
      if (type === "AttackBonusConditional") {
        const value = contextValueExpression(component.Bonus);
        const required = new Set();
        addGuidValues(component.Conditions || {}, required);
        push({ category: "target-conditional", type, value: value.value, descriptor: component.Descriptor || "None", targetGuids: [...required], label: `条件攻击加值 ${value.value === null ? value.text : `${value.value >= 0 ? "+" : ""}${value.value}`}（${required.size ? [...required].map(nativeFeatureName).join("、") : "原生条件"}）` });
        return;
      }
      if (type === "BackToBack") {
        push({ category: "conditional-ac", type, value: 2, descriptor: "Circumstance", label: `与同样拥有此专长的盟友邻接且被夹击时，对夹击者 AC +2（环境；范围 ${component.Radius || 5} 英尺）` });
        return;
      }
      if (type === "ShakeItOff") {
        push({ category: "conditional-save", type, value: 1, max: 4, descriptor: "UntypedStackable", label: `每有 1 名邻接且拥有此专长的盟友，全部豁免 +1（最高 +4；范围 ${component.Radius || 5} 英尺）` });
        return;
      }
      if (type === "AttackBonusAgainstSize" || type === "ACBonusAgainstSize") {
        const value = contextValueExpression(component.Value);
        const subject = type === "AttackBonusAgainstSize" ? "攻击" : "AC";
        const size = component.CheckedSizeType === "FromState" && component.m_Type === "Delta"
          ? `与目标体型差 ${component.SizeDelta}`
          : `${component.SizeMoreThan ? "大于" : "达到/匹配"}${component.Size || "指定体型"}`;
        push({ category: type === "AttackBonusAgainstSize" ? "target-conditional" : "conditional-ac", type, value: value.value, descriptor: component.Descriptor || "None", label: `对${size}目标的${subject} ${value.value === null ? value.text : `${value.value >= 0 ? "+" : ""}${value.value}`}${component.OnlyForRanged ? "（仅远程）" : component.OnlyForMelee ? "（仅近战）" : ""}` });
        return;
      }
      if (type === "ManeuverDefenceBonus" || type === "CMDBonusAgainstManeuvers") {
        const value = contextValueExpression(component.Bonus ?? component.Value);
        const maneuvers = component.Maneuvers || (component.Type ? [component.Type] : []);
        push({ category: "conditional-cmd", type, value: value.value, maneuvers, label: `对抗${maneuvers.join(" / ") || "指定"}战技的 CMD ${value.value === null ? value.text : `${value.value >= 0 ? "+" : ""}${value.value}`}` });
        return;
      }
      if (type === "ReplaceCombatManeuverStat") {
        push({ category: "maneuver", type, stat: component.StatType, label: `战技加值的基础属性改用${nativeStatNames[component.StatType] || component.StatType}` });
        return;
      }
      if (type === "ManeuverBonusFromStat") {
        push({ category: "maneuver", type, maneuver: component.Type, stat: component.Stat, descriptor: component.Descriptor || "None", label: `${component.Type || "指定战技"}检定额外加入${nativeStatNames[component.Stat] || component.Stat}调整值` });
        return;
      }
      if (type === "ManeuverIncreaseDuration") {
        push({ category: "maneuver", type, maneuver: component.Type, label: `${component.Type || "指定战技"}成功后的减益持续时间按高等战技规则延长` });
        return;
      }
      if (type === "CoordinatedManeuvers") {
        push({ category: "maneuver", type, value: 2, descriptor: "Competence", label: `与同样拥有此专长的盟友邻接时，战技检定 +2；挣脱擒抱时 +4（范围 ${component.Radius || 5} 英尺）` });
        return;
      }
      if (type === "GreaterCombatMeneuver") {
        push({ category: "maneuver", type, maneuver: component.Maneuver, label: `${component.Maneuver || "高等战技"}成功造成的移动可触发盟友借机攻击` });
        return;
      }
      if (type === "ACBonusAgainstAttackOfOpportunity") {
        const value = contextValueExpression(component.Bonus);
        push({ category: "conditional-ac", type, value: value.value, label: `对抗借机攻击的 AC ${value.value === null ? value.text : `${value.value >= 0 ? "+" : ""}${value.value}`}` });
        return;
      }
      if (type === "ACTouchBonus") {
        const value = resolvedContextValue(component.m_Bonus, occurrence, character);
        push({ category: "equipment-conditional", type, value: value.value, descriptor: component.m_Descriptor || "None", label: `接触 AC 加入盾牌与盾牌增强加值${value.value === null ? "（按当前装备动态计算）" : `：${value.value >= 0 ? "+" : ""}${value.value}`}` });
        return;
      }
      if (type === "BuffAllSavesBonus") {
        const value = componentNumericValue(component.Value);
        push({ category: "all-saves", type, value, descriptor: component.Descriptor || "None", label: `全部豁免 ${value >= 0 ? "+" : ""}${value}（${nativeDescriptorNames[component.Descriptor] || component.Descriptor || "无类型"}）` });
        return;
      }
      if (type === "BuffAllSkillsBonus") {
        const multiplier = contextValueExpression(component.Multiplier);
        const value = (Number(component.Value) || 0) * (Number.isFinite(multiplier.value) ? multiplier.value : 1);
        push({ category: "all-skills", type, value, descriptor: component.Descriptor || "None", label: `全部技能检定 ${value >= 0 ? "+" : ""}${value}（${nativeDescriptorNames[component.Descriptor] || component.Descriptor || "无类型"}）` });
        return;
      }
      if (type === "AbilityScoreCheckBonus") {
        const value = resolvedContextValue(component.Bonus, occurrence, character);
        push({ category: "skill-rule", type, stat: component.Stat, value: value.value, descriptor: component.Descriptor || "None", label: `${nativeStatNames[component.Stat] || component.Stat}检定 ${value.value === null ? value.text : `${value.value >= 0 ? "+" : ""}${value.value}`}（${nativeDescriptorNames[component.Descriptor] || component.Descriptor || "无类型"}）` });
        return;
      }
      if (type === "WeaponGroupDamageBonus") {
        const value = Number(component.DamageBonus) || contextValueExpression(component.AdditionalValue).value;
        push({ category: "weapon-group-damage", type, value, weaponGroup: component.WeaponGroup, descriptor: component.Descriptor || "None", label: `${component.WeaponGroup}武器组伤害 ${value === null ? contextValueExpression(component.AdditionalValue).text : `${value >= 0 ? "+" : ""}${value}`}` });
        return;
      }
      if (type === "WeaponTypeDamageStatReplacement") {
        push({ category: "weapon-rule", type, weaponCategory: component.Category, stat: component.Stat, label: `${nativeWeaponName(component.Category)}伤害改用${nativeStatNames[component.Stat] || component.Stat}${component.OnlyOneHanded ? "（仅单手）" : ""}${component.TwoHandedBonus ? "，保留双手属性倍率" : ""}` });
        return;
      }
      if (type === "WeaponParametersAttackBonus" || type === "WeaponParametersDamageBonus") {
        const value = type === "WeaponParametersAttackBonus" ? Number(component.AttackBonus) || 0 : Number(component.DamageBonus) || 0;
        const restrictions = [component.OnlyTwoHanded || component.m_checkGripStyle ? "双手持用" : null, component.Ranged ? "远程" : null, component.OnlyFinessable ? "可灵巧武器" : null, component.OnlyForFullAttack ? "整轮攻击" : null].filter(Boolean);
        push({ category: "weapon-rule", type, value, descriptor: component.Descriptor || "None", label: `${restrictions.join("、") || "符合蓝图条件的武器"}${type === "WeaponParametersAttackBonus" ? "攻击" : "伤害"} ${value >= 0 ? "+" : ""}${value}` });
        return;
      }
      if (type === "AdditionalStatBonusOnAttackDamage") {
        push({ category: "weapon-rule", type, value: Number(component.Bonus) || 0, label: `${component.CheckTwoHanded ? "双手武器" : component.Category || "符合条件的武器"}伤害额外加入 ${Number(component.Bonus) || 0} 倍属性调整值${component.FullAttack === "Only" ? "（仅整轮攻击）" : ""}` });
        return;
      }
      if (type === "CriticalConfirmationBonus") {
        const value = contextValueExpression(component.Value || component.Bonus);
        push({ category: "critical-confirmation", type, value: value.value, label: `重击确认检定 ${value.value === null ? value.text : `${value.value >= 0 ? "+" : ""}${value.value}`}` });
        return;
      }
      if (type === "SpellPenetrationBonus") {
        const value = contextValueExpression(component.Value);
        push({ category: "spell-penetration", type, value: value.value, descriptor: component.Descriptor || "None", label: `法术穿透检定 ${value.value === null ? value.text : `${value.value >= 0 ? "+" : ""}${value.value}`}` });
        return;
      }
      if (type === "AddImmunityToAbilityScoreDamage") {
        const stats = component.StatTypes || [];
        push({ category: "ability-damage-immunity", type, stats, drain: Boolean(component.Drain), label: `免疫${component.Drain ? "属性吸取" : "属性伤害"}${stats.length ? `：${stats.map((stat) => nativeStatNames[stat] || stat).join(" / ")}` : ""}` });
        return;
      }
      if (type === "IncreaseSpellSchoolDC") {
        const value = componentNumericValue(component.BonusDC);
        push({ category: "spell-dc", type, value, school: component.School, label: `${nativeSchoolNames[component.School] || component.School}学派 DC ${value >= 0 ? "+" : ""}${value}` });
        return;
      }
      if (type === "IncreaseSpellDescriptorDC") {
        const value = componentNumericValue(component.BonusDC);
        const descriptor = spellDescriptorLabel(component.Descriptor);
        push({ category: "spell-dc", type, value, descriptor, label: `${descriptor}描述符法术 DC ${value >= 0 ? "+" : ""}${value}` });
        return;
      }
      if (type === "SpellFocusParametrized") {
        const value = Number(component.BonusDC) || 1;
        push({ category: "spell-dc", type, value, parameterized: true, label: `所选学派${component.SpellsOnly ? "法术" : "效果"} DC +${value}` });
        return;
      }
      if (type === "SchoolMasteryParametrized") {
        push({ category: "spellbook-rule", type, value: 1, parameterized: true, label: "所选学派法术的施法者等级 +1" });
        return;
      }
      if (type === "WeaponFocusParametrized") {
        push({ category: "weapon-rule", type, value: 1, descriptor: component.Descriptor || "UntypedStackable", parameterized: true, label: "所选武器攻击检定 +1" });
        return;
      }
      if (type === "WeaponSpecializationParametrized") {
        push({ category: "weapon-rule", type, parameterized: true, label: component.Mythic ? "所选武器按神话武器专精规则提高伤害" : `所选武器伤害 +${definition?.internalName === "WeaponSpecializationGreater" ? 2 : 2}` });
        return;
      }
      if (["ImprovedCriticalParametrized", "ImprovedCriticalEdgeParametrized", "ImprovedCriticalMythicParametrized", "PointBlankMasterParametrized", "WeaponMasteryParametrized"].includes(type)) {
        const labels = {
          ImprovedCriticalParametrized: "所选武器的重击威胁范围加倍",
          ImprovedCriticalEdgeParametrized: "所选武器的重击威胁范围再扩大 1 点",
          ImprovedCriticalMythicParametrized: "所选武器的重击倍率提高 1",
          PointBlankMasterParametrized: "所选远程武器在威胁区域内攻击不触发借机攻击",
          WeaponMasteryParametrized: "所选武器自动确认重击、重击倍率 +1，且不会被缴械"
        };
        push({ category: type === "PointBlankMasterParametrized" ? "weapon-rule" : "critical-rule", type, parameterized: true, label: labels[type] });
        return;
      }
      if (type === "AddMechanicsFeature") {
        push({ category: "mechanics", type, value: component.m_Feature, label: `规则特性：${component.m_Feature}` });
        return;
      }
      if (type === "AddAbilityResources") {
        const resourceGuid = nativeGuid(component.m_Resource);
        push({ category: "resource", type, resourceGuid, label: `获得能力资源：${nativeFeatureName(resourceGuid)}` });
        return;
      }
      if (type === "IncreaseResourceAmount" || type === "IncreaseResourceAmountBySharedValue") {
        const resourceGuid = nativeGuid(component.m_Resource);
        const value = type === "IncreaseResourceAmount" ? contextValueExpression(component.Value) : contextValueExpression(component.Value || component.SharedValue);
        push({ category: "resource", type, resourceGuid, value: value.value, dynamic: value.dynamic, label: `${nativeFeatureName(resourceGuid)}资源上限 ${value.value === null ? value.text : `${value.value >= 0 ? "+" : ""}${value.value}`}` });
        return;
      }
      if (type === "IncreaseActivatableAbilityGroupSize") {
        push({ category: "resource", type, group: component.Group, value: 1, label: `${component.Group}可同时启用数量 +1` });
        return;
      }
      if (type === "ReplaceAbilitiesStat" || type === "ReplaceAbilityDC") {
        const abilities = new Set();
        addGuidValues(component.m_Ability || component.m_Abilities || [], abilities);
        push({ category: "ability-stat", type, stat: component.Stat, abilityGuids: [...abilities], label: `${abilities.size ? [...abilities].map(nativeFeatureName).join("、") : "指定能力"}改用${nativeStatNames[component.Stat] || component.Stat}` });
        return;
      }
      if (type === "ContextSetAbilityParams" || type === "ContextCalculateAbilityParams") {
        push({ category: "ability-stat", type, stat: component.StatType, label: `${base.sourceName}的施法者等级、法术等级与 DC 按原生上下文公式计算${component.StatType ? `（主属性：${nativeStatNames[component.StatType] || component.StatType}）` : ""}` });
        return;
      }
      if (type === "ChangeActivatableAbilitiesCommandType") {
        const abilities = new Set();
        addGuidValues(component.m_ActivatableAbilities || [], abilities);
        push({ category: "runtime-rule", type, abilityGuids: [...abilities], commandType: component.m_NewCommandType, label: `${[...abilities].map(nativeFeatureName).join("、") || "指定可激活能力"}改为${component.m_NewCommandType || "蓝图指定"}动作` });
        return;
      }
      if (type === "SavingThrowsReplace") {
        push({ category: "save-rule", type, save: component.m_SavingThrow, stat: component.m_ReplaceToStat, label: `${component.m_SavingThrow || "指定"}豁免改用${nativeStatNames[component.m_ReplaceToStat] || component.m_ReplaceToStat}` });
        return;
      }
      if (type === "AttackStatReplacement") {
        const weapons = new Set();
        addGuidValues(component.m_WeaponTypes || [], weapons);
        push({ category: "attack-stat", type, stat: component.ReplacementStat, weaponGuids: [...weapons], label: `${component.SubCategory || "指定武器"}攻击检定改用${nativeStatNames[component.ReplacementStat] || component.ReplacementStat}` });
        return;
      }
      if (type === "BindAbilitiesToClass") {
        const abilities = new Set();
        addGuidValues(component.m_Abilites || component.m_Abilities || [], abilities);
        push({ category: "ability-stat", type, stat: component.Stat, abilityGuids: [...abilities], label: `${abilities.size} 项能力绑定至${nativeStatNames[component.Stat] || component.Stat}与指定职业等级` });
        return;
      }
      if (type === "LearnSpellList" || type === "AddSpecialSpellList" || type === "AddSpecialSpellListForArchetype") {
        const listGuid = nativeGuid(component.m_SpellList);
        push({ category: "spellbook-rule", type, spellListGuid: listGuid, label: `${type === "LearnSpellList" ? "学习" : "加入"}法表：${nativeFeatureName(listGuid)}` });
        return;
      }
      if (type === "LearnSpellParametrized") {
        const selected = new Set();
        addGuidValues(occurrence.detail?.params || {}, selected);
        const spellGuid = [...selected].find((guid) => spellBySourceGuid.has(guid));
        push({ category: spellGuid ? "known-spell" : "spellbook-rule", type, spellGuid, spellLevel: Number(component.SpellLevel), label: spellGuid ? `学习 ${nativeFeatureName(spellGuid)}（${Number(component.SpellLevel)} 环）` : `从 ${Number(component.SpellLevel)} 环法表选择并学习 1 个法术` });
        return;
      }
      if (type === "LearnSpells") {
        const spells = new Set();
        addGuidValues(component.m_Spells || [], spells);
        spells.forEach((spellGuid) => push({ category: "known-spell", type, spellGuid, label: `自动学会 ${nativeFeatureName(spellGuid)}` }));
        return;
      }
      if (type === "AddSpellbookLevel") {
        const spellbookGuid = nativeGuid(component.m_Spellbook);
        push({ category: "spellbook-rule", type, spellbookGuid, label: `${nativeFeatureName(spellbookGuid)}施法等级 +1` });
        return;
      }
      if (type === "SpontaneousSpellConversion") {
        const spells = new Set();
        addGuidValues(component.m_SpellsByLevel || [], spells);
        push({ category: "spellbook-rule", type, spellGuids: [...spells], label: `可自发转化为 ${spells.size} 个逐环法术` });
        return;
      }
      if (type === "AddKnownSpell") {
        const spellGuid = nativeGuid(component.m_Spell);
        push({ category: "known-spell", type, spellGuid, spellLevel: Number(component.SpellLevel), label: `自动学会 ${nativeFeatureName(spellGuid)}（${Number(component.SpellLevel)} 环）` });
        return;
      }
      if (type === "ManeuverBonus") {
        const value = component.Mythic ? Number(character.mythicRank) || character.mythicSteps?.length || 0 : componentNumericValue(component.Bonus);
        push({ category: "maneuver", type, maneuver: component.Type, value, label: `${component.Type || "战技"}检定 ${value >= 0 ? "+" : ""}${value}${component.Mythic ? "（神话阶）" : ""}` });
        return;
      }
      if (type === "CMDBonus") {
        const value = resolvedContextValue(component.Value, occurrence, character);
        push({ category: "conditional-cmd", type, value: value.value, descriptor: component.Descriptor || "None", label: `战技防御 CMD ${value.value === null ? value.text : `${value.value >= 0 ? "+" : ""}${value.value}`}${component.CheckFact ? `（需要：${nativeFeatureName(nativeGuid(component.m_CheckedFact))}）` : ""}` });
        return;
      }
      if (type === "Blindsense") {
        const range = Number(component.Range?.m_Value ?? component.Range) || 0;
        push({ category: "sense", type, range, label: `${component.Blindsight ? "盲视" : "盲感"} ${range} 英尺` });
        return;
      }
      if (type === "FavoredEnemy") {
        const facts = new Set();
        addGuidValues(component.m_CheckedFacts || [], facts);
        push({ category: "favored-enemy", type, targetGuids: [...facts], label: `宿敌：${[...facts].map(nativeFeatureName).join("、") || "蓝图指定类别"}` });
        return;
      }
      if (type === "FavoredTerrain") {
        push({ category: "favored-terrain", type, terrain: component.Setting, label: `偏好地形：${component.Setting}` });
        return;
      }
      if (type === "FavoredTerrainExpertise") {
        push({ category: "favored-terrain", type, terrain: component.Setting, label: `${component.Setting || "指定"}地形专擅：应用条目说明中的安装版技能加值` });
        return;
      }
      if (type === "StonyStepTerrainBonus") {
        push({ category: "favored-terrain", type, terrain: component.Setting, label: `${component.Setting || "地底"}：灵巧检定 +2（种族），并忽略困难地形` });
        return;
      }
      if (type === "EchoesOfStoneTerrainBonus") {
        push({ category: "favored-terrain", type, terrain: component.Setting, label: `${component.Setting || "地底"}：察觉 +4（种族），先攻 +2` });
        return;
      }
      if (type === "WeaponTraining") {
        push({ category: "weapon-training", type, label: "获得战士武器训练层数与高级武器训练资格" });
        return;
      }
      if (type === "WeaponGroupAttackBonus") {
        const value = Number(component.AttackBonus) || 0;
        push({ category: "weapon-group-attack", type, value, weaponGroup: component.WeaponGroup, descriptor: component.Descriptor || "None", label: `${component.WeaponGroup}武器组攻击 ${value >= 0 ? "+" : ""}${value}` });
        return;
      }
      if (type === "DamageBonusAgainstFactOwner") {
        const value = contextValueExpression(component.Bonus || component.DamageBonus);
        const targetGuid = nativeGuid(component.m_CheckedFact);
        push({ category: "target-conditional", type, value: value.value, targetGuid, label: `对拥有${nativeFeatureName(targetGuid)}的目标伤害 ${value.value === null ? value.text : `${value.value >= 0 ? "+" : ""}${value.value}`}` });
        return;
      }
      if (type === "ConcentrationBonus") {
        const value = contextValueExpression(component.Value);
        push({ category: "concentration", type, value: value.value, label: `专注检定 ${value.value === null ? value.text : `${value.value >= 0 ? "+" : ""}${value.value}`}` });
        return;
      }
      if (type === "EnhancePotion") {
        const classes = new Set();
        addGuidValues(component.m_Classes || [], classes);
        push({ category: "spellbook-rule", type, classGuids: [...classes], label: `饮用药水时，其施法者等级改用${[...classes].map(nativeFeatureName).join(" / ") || "指定职业"}等级` });
        return;
      }
      if (type === "DerivativeStatBonus") {
        push({ category: "derived-stat", type, baseStat: component.BaseStat, stat: component.DerivativeStat, label: `${nativeStatNames[component.DerivativeStat] || component.DerivativeStat}加入${nativeStatNames[component.BaseStat] || component.BaseStat}调整值` });
        return;
      }
      if (type === "SpecificBuffImmunity") {
        const buffGuid = nativeGuid(component.m_Buff);
        push({ category: "buff-immunity", type, buffGuid, label: `免疫效果：${nativeFeatureName(buffGuid)}` });
        return;
      }
      if (type === "AddImmunityToPrecisionDamage" || type === "AddImmunityToCriticalHits") {
        push({ category: "combat-immunity", type, label: type === "AddImmunityToPrecisionDamage" ? "免疫精准伤害" : "免疫重击" });
        return;
      }
      if (type === "AddSpellResistance") {
        const value = resolvedContextValue(component.Value, occurrence, character);
        push({ category: "spell-resistance", type, value: value.value, dynamic: value.dynamic, label: `法术抗力 ${value.value === null ? value.text : value.value}` });
        return;
      }
      if (type === "AddCondition") {
        push({ category: "condition", type, condition: component.Condition, label: `常驻规则状态：${component.Condition}` });
        return;
      }
      if (type === "ClassLevelsForPrerequisites") {
        const actualClassGuid = nativeGuid(component.m_ActualClass);
        const fakeClassGuid = nativeGuid(component.m_FakeClass);
        push({ category: "prerequisite-equivalence", type, actualClassGuid, fakeClassGuid, modifier: Number(component.Modifier) || 1, summand: Number(component.Summand) || 0, label: `${nativeFeatureName(actualClassGuid)}等级按${nativeFeatureName(fakeClassGuid)}等级计入前置` });
        return;
      }
      if (type === "AscendantElement") {
        push({ category: "element-rule", type, energy: component.Element, label: `${nativeEnergyNames[component.Element] || component.Element}伤害无视抗性与免疫` });
        return;
      }
      if (type === "MaxDexBonusIncrease") {
        const value = Number(component.Bonus) || Number(component.BonesPerRank) || 0;
        push({ category: "armor-rule", type, armorCategory: component.Category, value, label: `${component.Category || "指定"}护甲最大敏捷加值每层 +${value}` });
        return;
      }
      if (type === "ArmorFocus" || type === "ShieldFocus") {
        const armor = type === "ShieldFocus" ? "盾牌" : `${nativeArmorNames[component.ArmorCategory] || component.ArmorCategory || "指定"}盔甲`;
        push({ category: "equipment-conditional", type, value: 1, descriptor: type === "ShieldFocus" ? "ShieldFocus" : "ArmorFocus", label: `装备${armor}时，其 AC 加值 +1` });
        return;
      }
      if (type === "ArcaneArmorProficiency") {
        const categories = (component.Armor || []).map((value) => nativeArmorNames[value] || value);
        push({ category: "armor-rule", type, armorCategories: component.Armor || [], label: `奥术施法护甲适配：${categories.join("、") || "指定护甲"}` });
        return;
      }
      if (type === "SpeedBonusInArmorCategory") {
        const categories = (component.Category || []).map((value) => nativeArmorNames[value] || value);
        push({ category: "equipment-conditional", type, value: Number(component.Bonus) || 0, descriptor: component.Descriptor || "None", label: `${categories.join("、") || (component.NoArmor ? "未着甲" : "指定护甲")}时移动速度 ${Number(component.Bonus) >= 0 ? "+" : ""}${Number(component.Bonus) || 0} 英尺` });
        return;
      }
      if (type === "CannyDefensePermanent") {
        push({ category: "equipment-conditional", type, stat: "AC", classGuid: nativeGuid(component.m_CharacterClass), label: `随机应变：满足原生装备条件时，AC 加入智力调整值（上限按${nativeFeatureName(nativeGuid(component.m_CharacterClass))}等级）` });
        return;
      }
      if (type === "ChangeHitDie") {
        push({ category: "health-rule", type, hitDie: component.m_HitDie, label: `人物生命骰改为 ${component.m_HitDie || "蓝图指定值"}` });
        return;
      }
      if (type === "UndeadHealth") {
        push({ category: "health-rule", type, label: "不死生命规则：生命值与强韧等相关计算按不死生物规则使用魅力，且不再使用体质" });
        return;
      }
      if (type === "ManeuverImmunity") {
        push({ category: "combat-immunity", type, maneuver: component.Type, label: `免疫战技：${component.Type}` });
        return;
      }
      if (type === "Evasion") {
        push({ category: "save-rule", type, save: component.SavingThrow, label: `${component.SavingThrow || "反射"}豁免成功时按闪避/精通闪避规则减免` });
        return;
      }
      if (type === "IncreaseSpellDC") {
        const value = component.UseContextBonus ? resolvedContextValue(component.Value, occurrence, character) : contextValueExpression(component.BonusDC);
        const spellGuid = nativeGuid(component.m_Spell);
        push({ category: "spell-dc", type, value: value.value, spellGuid, label: `${nativeFeatureName(spellGuid)} DC ${value.value === null ? value.text : `${value.value >= 0 ? "+" : ""}${value.value}`}` });
        return;
      }
      if (type === "BuffMovementSpeed") {
        const value = Number(component.Value) || resolvedContextValue(component.ContextBonus, occurrence, character).value;
        push({ category: "speed", type, value, label: `移动速度 ${Number.isFinite(value) ? `${value >= 0 ? "+" : ""}${value} 英尺` : "按原生上下文调整"}` });
        return;
      }
      if (type === "ResistEnergy") {
        const value = resolvedContextValue(component.Value, occurrence, character);
        push({ category: "energy-resistance", type, energy: component.Type, value: value.value, dynamic: value.dynamic, label: `${nativeEnergyNames[component.Type] || component.Type}抗性 ${value.value === null ? value.text : value.value}` });
        return;
      }
      if (type === "FlatFootedIgnore") {
        push({ category: "defense-rule", type, label: `${component.Type || "直觉闪避"}：按原生规则避免措手不及/夹击失去敏捷` });
        return;
      }
      if (type === "AddFeatureToPet") {
        const featureGuid = nativeGuid(component.m_Feature);
        push({ category: "pet-effect", type, featureGuid, petType: component.m_PetType, label: `向${component.m_PetType || "伙伴"}授予：${nativeFeatureName(featureGuid)}` });
        return;
      }
      if (type === "AddFeatureToNPC") {
        const featureGuid = nativeGuid(component.m_Feature);
        push({ category: "summon-effect", type, featureGuid, label: `向符合条件的 NPC${component.CheckSummoned ? "（召唤物）" : ""}${component.CheckParty ? "（队伍）" : ""}授予：${nativeFeatureName(featureGuid)}` });
        return;
      }
      if (type === "WatchYourBack") {
        push({ category: "pet-effect", type, petType: component.m_PetType, label: `每轮一次，主人/伙伴被命中时可用${nativeStatNames[component.m_StatCheckOwner] || component.m_StatCheckOwner}等指定技能检定免除命中（冷却 ${component.m_CooldownRounds || 1} 轮）` });
        return;
      }
      if (type === "AddFactsToPet" || type === "AddFactsToMount") {
        const facts = new Set();
        addGuidValues(component.m_Facts || [], facts);
        push({ category: "pet-effect", type, featureGuids: [...facts], petType: type === "AddFactsToMount" ? "坐骑" : component.m_PetType, label: `向${type === "AddFactsToMount" ? "当前坐骑" : component.m_PetType || "伙伴"}授予：${[...facts].map(nativeFeatureName).join("、") || "蓝图指定能力"}` });
        return;
      }
      if (type === "ShareFeaturesWithPet") {
        const facts = new Set();
        addGuidValues(component.m_Features || [], facts);
        push({ category: "pet-effect", type, featureGuids: [...facts], petType: component.Type, label: `与${component.Type || "伙伴"}共享 ${facts.size} 项蓝图能力` });
        return;
      }
      if (type === "AddFeatureParametrized") {
        push({ category: "class-rule", type, parameterized: true, label: "将当前选择的参数化职业能力授予角色" });
        return;
      }
      if (type === "OnSpawnBuff") {
        const buffGuid = nativeGuid(component.m_buff);
        push({ category: "summon-effect", type, buffGuid, label: `召唤/生成单位获得：${nativeFeatureName(buffGuid)}` });
        return;
      }
      if (type === "AddAdditionalLimb") {
        const weaponGuid = nativeGuid(component.m_Weapon);
        push({ category: "natural-attack", type, weaponGuid, label: `获得额外天生攻击：${nativeFeatureName(weaponGuid)}` });
        return;
      }
      if (type === "AddUnitScale") {
        push({ category: "class-rule", type, value: Number(component.ScaleIncreaseCoefficient) || 0, label: `单位模型与相关体型表现缩放 ${Number(component.ScaleIncreaseCoefficient) >= 0 ? "+" : ""}${Number(component.ScaleIncreaseCoefficient) || 0}` });
        return;
      }
      if (type === "LockEquipmentSlot") {
        push({ category: "armor-rule", type, slot: component.m_SlotType, label: `${component.m_Deactivate ? "停用" : "锁定"}装备栏位：${component.m_SlotType || "蓝图指定栏位"}` });
        return;
      }
      if (type === "EmptyHandWeaponOverride") {
        const weaponGuid = nativeGuid(component.m_Weapon);
        push({ category: "natural-attack", type, weaponGuid, label: `空手攻击替换为：${nativeFeatureName(weaponGuid)}` });
        return;
      }
      if (type === "AdditionalDiceForWeapon") {
        const categories = component.m_WeaponCategories || [];
        const formula = component.m_AdditionalDamageFormula;
        push({ category: "weapon-extra-damage", type, weaponCategories: categories, label: `${categories.join(" / ") || "指定武器"}额外伤害：${formula?.m_Rolls || 1}${formula?.m_Dice && formula.m_Dice !== "One" ? `d${formula.m_Dice}` : ""}` });
        return;
      }
      if (type === "AddStartingEquipment") {
        const itemGuids = new Set();
        addGuidValues(component.m_BasicItems || component.CategoryItems || [], itemGuids);
        push({ category: "starting-equipment", type, itemGuids: [...itemGuids], label: `初始装备：${itemGuids.size ? [...itemGuids].map(nativeFeatureName).join("、") : "按类别/职业生成"}` });
        return;
      }
      if (type === "ForbidSpellbookOnAlignmentDeviation") {
        const alignments = String(component.Alignment || "").split(/,\s*/).filter(Boolean);
        push({ category: "spellbook-rule", type, alignments, label: `阵营偏离时限制施法书（允许阵营：${nativeAlignmentLabel(component.Alignment) || "蓝图指定"}）` });
        return;
      }
      if (type === "AddSpecialSpellListForArchetype") {
        const listGuid = nativeGuid(component.m_SpellList);
        push({ category: "spellbook-rule", type, spellListGuid: listGuid, label: `加入特殊法表：${nativeFeatureName(listGuid)}` });
        return;
      }
      if (type === "DlcCondition") {
        const dlcGuid = nativeGuid(component.m_DlcReward);
        push({ category: "source-gate", type, dlcGuid, label: `需要已安装内容：${nativeFeatureName(dlcGuid)}` });
        return;
      }
      if (type === "PowerAttackWatcher") {
        push({ category: "runtime-rule", type, label: "启用猛力攻击的武器与双手伤害换算监听" });
        return;
      }
      if (type === "AddRestTrigger") {
        push({ category: "rest-rule", type, label: "休息时执行该能力的原生恢复/重置效果" });
        return;
      }
      if (type === "RestRoleBonus") {
        const value = resolvedContextValue(component.m_Value, occurrence, character);
        push({ category: "rest-rule", type, role: component.m_RoleType, value: value.value, descriptor: component.m_Descriptor || "None", label: `${component.m_RoleType || "指定休息职能"}检定 ${value.value === null ? value.text : `${value.value >= 0 ? "+" : ""}${value.value}`}（${nativeDescriptorNames[component.m_Descriptor] || component.m_Descriptor || "无类型"}）` });
        return;
      }
      if (type === "AuraFeatureComponent") {
        const buffGuid = nativeGuid(component.m_Buff);
        push({ category: "runtime-rule", type, buffGuid, label: `持续散发灵光：${nativeFeatureName(buffGuid)}` });
        return;
      }
      if (type === "PropertyCalculatorComponent") {
        push({ category: "runtime-rule", type, propertyName: component.Name, label: `为能力动作链计算上下文属性 ${component.Name || "蓝图指定值"}` });
        return;
      }
      if (type === "AddEffectFastHealing" || type === "AddEffectContextFastHealing") {
        const value = resolvedContextValue(component.Bonus, occurrence, character);
        push({ category: "health-rule", type, value: value.value, dynamic: value.dynamic, label: `快速回复 ${value.value === null ? value.text : value.value}` });
        return;
      }
      if (type === "AddEquipmentEntity") return;
      if (["BuffSubstitutionOnApply", "ContextCalculateSharedValue", "AbilityResourceLogic"].includes(type)) {
        push({ category: "runtime-rule", type, label: `${base.sourceName} 的原生运行时规则：${type}` });
        return;
      }
      if (type === "AddPet") {
        const petGuid = nativeGuid(component.m_Pet);
        push({ category: "pet", type, petGuid, petType: component.Type || component.ProgressionType || "Pet", label: `获得${component.Type || component.ProgressionType || "伙伴"}：${nativeFeatureName(petGuid)}` });
        return;
      }
      if (/^(Prerequisite|Recommendation|FeatureTagsComponent|ContextRankConfig|RecalculateOn|AddFeatureToPet)/.test(type) || [
        "HideFeatureInInspect", "SpellComponent", "SpellDescriptorComponent", "SpellListComponent", "CraftInfoComponent",
        "AddSpellsToDescription", "AddFeaturesFromSelectionToDescription", "RecommendedClass", "PureRecommendation",
        "NoSelectionIfAlreadyHasFeature", "TacticalCombatVisibleFeature", "LevelUpRecommendation", "HideClassIfPrerequisitesRequiredComponent",
        "DisableClassAdditionalVisualSettings", "FeatureSurvivesRespec", "MythicClassArtComponent", "EtudeBracketAllowMythicPortrait", "EtudeBracketEnsureAudio",
        "ReplaceSourceBone", "ReplaceCastSource"
      ].includes(type)) return;
      const genericRule = [
        { category: "runtime-rule", label: "原生战斗触发规则", pattern: /(?:Trigger|Watcher|ContextActions|BuffExtraEffects|BuffActions|CombatAgainstMe|ManeuverProvokeAttack|ModifyD20|DeathActions|FactSinglify|SiezeTheMoment|Opportunist|BashingFinish|TellingBlow|BurstBarrier|TricksterParry|ActivateTrigger|SavingSlash)/ },
        { category: "spellbook-rule", label: "原生法术与施法规则", pattern: /(?:Spell|Caster|Metamagic|OppositionSchool|Arcane|Magic|Dispel|Cantrip|Scroll|Enduring|SurpriseSpells|IntenseSpells)/ },
        { category: "pet-effect", label: "原生伙伴与坐骑规则", pattern: /(?:Pet|Mount|Companion)/ },
        { category: "save-rule", label: "原生豁免与防御规则", pattern: /(?:Saving|Saves|Evasion|Fortification|Concealment|ACBonus|CMDBonus|ShieldWall|CoordinatedDefense|BlindnessAC|DefensiveCombatTraining|HalveIncoming)/ },
        { category: "weapon-rule", label: "原生武器、攻击与伤害规则", pattern: /(?:Weapon|Attack|Damage|Critical|Armor|Shield|Precise|Penetrating|DeflectArrows|RangedCleave|Finesse|Kensai)/ },
        { category: "resource", label: "原生能力资源规则", pattern: /Resource/ },
        { category: "skill-rule", label: "原生技能与检定规则", pattern: /(?:Skill|Knowledge|Identify|Take10)/ },
        { category: "class-rule", label: "原生职业与道途规则", pattern: /(?:Class|Archetype|Kineticist|Magus|Monk|Cavalier|Bloodline|Shifter|Swarm|Locust|Trickster|Azata|Mythic|HigherMythics|SacredWeapon|Wizard|Duelist|MadDog|Flamewarden)/ },
        { category: "runtime-rule", label: "原生状态与即时效果规则", pattern: /(?:Buff|Condition|Immunity|Regeneration|Movement|Speed|Size|Stealth|Incoming|Outgoing|Suppress|TimeOfDay|AreaEffect|FreeAction)/ }
      ].find((entry) => entry.pattern.test(type));
      if (genericRule) {
        push({ category: genericRule.category, type, conditional: true, label: `${genericRule.label}（${type}）` });
        return;
      }
      effects.push({ ...base, category: "native-unmodeled", type, modeled: false, label: `原生规则组件：${type}` });
    });
    return effects;
  }

  function characterEffectProfile(character = currentCharacter()) {
    const signature = JSON.stringify([
      character.race, character.heritage, character.raceAbility, character.background, character.backgroundParams,
      character.alignment, character.deity, character.attributesMode, character.attributes,
      character.normalSteps, character.featChoices, character.mythicSteps, character.effectiveMythicChoiceRecords
    ]);
    const cached = effectProfileCache.get(character);
    if (cached?.signature === signature) return cached.profile;
    const sources = projectCharacterSources(character);
    const effects = sources.occurrences.flatMap((occurrence) => normalizeComponentEffects(occurrence, sources.owned, character));
    const unknownTypes = new Map();
    effects.filter((effect) => !effect.modeled).forEach((effect) => unknownTypes.set(effect.type, (unknownTypes.get(effect.type) || 0) + 1));
    const profile = { ...sources, effects, unknownTypes };
    effectProfileCache.set(character, { signature, profile });
    return profile;
  }

  function catalogItemEffectProfile(item, character = currentCharacter()) {
    if (!item?.sourceGuid && !item?.nativeComponents?.length) return { roots: [], occurrences: [], owned: new Set(), removed: new Set(), effects: [], unknownTypes: new Map() };
    const root = {
      id: `catalog:${item.sourceGuid || item.id}`,
      sourceGuid: nativeGuid(item.sourceGuid),
      components: item.nativeComponents?.length ? item.nativeComponents : nativeDefinition(item.sourceGuid)?.components || [],
      originKind: "catalog-preview",
      originLabel: item.name || nativeFeatureName(item.sourceGuid),
      detail: null
    };
    const seedOwned = new Set(characterEffectProfile(character).owned);
    if (root.sourceGuid) seedOwned.add(root.sourceGuid);
    addGuidValues(item.parameter ? { [item.parameter.type]: parameterValue(item, {}) } : {}, seedOwned);
    const sources = projectSourceRoots(character, [root], seedOwned);
    const effects = sources.occurrences.flatMap((occurrence) => normalizeComponentEffects(occurrence, sources.owned, character));
    const unknownTypes = new Map();
    effects.filter((effect) => !effect.modeled).forEach((effect) => unknownTypes.set(effect.type, (unknownTypes.get(effect.type) || 0) + 1));
    return { ...sources, effects, unknownTypes };
  }

  function staticStatValue(profile, stat) {
    const modifiers = profile.effects.filter((effect) => Number.isFinite(effect.value) && ((effect.category === "stat" && effect.stat === stat) || (effect.category === "all-saves" && ["SaveFortitude", "SaveReflex", "SaveWill"].includes(stat))));
    const groups = new Map();
    modifiers.forEach((effect) => {
      const descriptor = effect.descriptor || "None";
      if (!groups.has(descriptor)) groups.set(descriptor, []);
      groups.get(descriptor).push(effect.value);
    });
    return [...groups.entries()].reduce((total, [descriptor, values]) => {
      if (nativeStackableDescriptors.has(descriptor)) return total + values.reduce((sum, value) => sum + value, 0);
      return total + Math.max(0, ...values) + Math.min(0, ...values);
    }, 0);
  }

  function removedCreationFeatureGuids(character) {
    const result = new Set();
    const heritage = heritageById.get(character.heritage);
    (heritage?.nativeComponents || []).forEach((component) => {
      if (componentType(component) !== "RemoveFeatureOnApply") return;
      const guid = nativeGuid(component.m_Feature || component.Feature);
      if (guid) result.add(guid);
    });
    return result;
  }

  function activeRaceFeatureGuids(character) {
    const race = DATA.races.find((entry) => entry.id === character.race);
    const removed = removedCreationFeatureGuids(character);
    return new Set((race?.sourceFeatureGuids || []).map(nativeGuid).filter((guid) => guid && !removed.has(guid)));
  }

  function sourceFullStatValue(character, stat, profile = null) {
    const effects = profile || characterEffectProfile(character);
    const direct = staticStatValue(effects, stat);
    if (stat !== "SneakAttack") return direct;
    const accomplishedSneak = effects.effects.filter((effect) => effect.category === "sneak").reduce((sum, effect) => sum + (Number(effect.value) || 0), 0);
    const accomplishedCap = Math.max(0, Math.ceil(characterLevel(character) / 2) - direct);
    return direct + Math.min(accomplishedSneak, accomplishedCap);
  }

  function sneakDice(character = currentCharacter()) {
    return sourceFullStatValue(character, "SneakAttack");
  }

  function effectiveAttributes(character = currentCharacter(), sourceProfile = null) {
    const result = Object.fromEntries(DATA.abilities.map(({ id }) => [id, Number(character.attributes?.[id]) || 0]));
    if (character.attributesMode !== "final") {
      const nativeStats = { str: "Strength", dex: "Dexterity", con: "Constitution", int: "Intelligence", wis: "Wisdom", cha: "Charisma" };
      const profile = sourceProfile || characterEffectProfile(character);
      Object.entries(nativeStats).forEach(([id, stat]) => { result[id] += sourceFullStatValue(character, stat, profile); });
      const race = DATA.races.find((entry) => entry.id === character.race);
      if (race?.sourceMechanics?.selectableRaceStat && abilityById.has(character.raceAbility)) result[character.raceAbility] += 2;
    }
    (character.normalSteps || []).forEach((step) => {
      if (abilityById.has(step.abilityIncrease)) result[step.abilityIncrease] += 1;
    });
    if (companionById.get(character.id)?.path === "lich") result.con = 0;
    return result;
  }

  function featAllowance(character = currentCharacter()) {
    const level = characterLevel(character);
    const counts = classCounts(character);
    const raceBonus = character.race === "human" ? 1 : 0;
    const fighterBonus = Math.ceil((counts.fighter || 0) / 2);
    return Math.ceil(level / 2) + raceBonus + fighterBonus;
  }

  function maxSkillRank(character = currentCharacter()) { return characterLevel(character); }

  function allocatedSkillPoints(ranks) {
    return DATA.skills.reduce((sum, skill) => sum + (Number(ranks?.[skill.id]) || 0), 0);
  }

  function perLevelSkillPointBonus(character) {
    const seen = new Set();
    return characterEffectProfile(character).effects.filter((effect) => effect.category === "skill-points").reduce((sum, effect) => {
      const key = `${effect.sourceGuid || effect.occurrenceId}:${effect.type}`;
      if (seen.has(key)) return sum;
      seen.add(key);
      return sum + (Number(effect.value) || 0);
    }, 0);
  }

  function rawSkillPointBudgetForStep(prefix, candidate) {
    const level = characterLevel(candidate);
    const classEntry = classById.get(candidate.normalSteps.at(-1)?.classId);
    const classBase = Math.max(0, Number(classEntry?.skillPoints) || 0);
    const intelligence = effectiveAttributes(candidate).int || 0;
    const intelligenceModifier = intelligence === 0 ? 0 : Math.floor((intelligence - 10) / 2);
    const priorRate = perLevelSkillPointBonus(prefix);
    const currentRate = perLevelSkillPointBonus(candidate);
    const sourceBonus = Math.max(0, currentRate * level - priorRate * Math.max(0, level - 1));
    return {
      rawTotal: Math.max(1, classBase + intelligenceModifier) + sourceBonus,
      classBase,
      intelligence,
      intelligenceModifier,
      sourceBonus
    };
  }

  function skillPointEntitlementThrough(character) {
    let total = 0;
    character.normalSteps.forEach((step, index) => {
      const before = normalPrefix(character, index);
      const after = normalPrefix(character, index + 1);
      total += rawSkillPointBudgetForStep(before, after).rawTotal;
    });
    return total;
  }

  function skillPointBudgetForStep(prefix, candidate) {
    const raw = rawSkillPointBudgetForStep(prefix, candidate);
    const unplaced = allocatedSkillPoints(candidate.legacySkillRanks);
    if (!unplaced) return { ...raw, total: raw.rawTotal, legacyCredit: 0 };
    const legacyCredit = Math.min(raw.rawTotal, Math.max(0, unplaced - skillPointEntitlementThrough(prefix)));
    return { ...raw, total: raw.rawTotal - legacyCredit, legacyCredit };
  }

  function skillRankIssues(prefix, candidate, ranks) {
    const budget = skillPointBudgetForStep(prefix, candidate);
    const spent = allocatedSkillPoints(ranks);
    const level = characterLevel(candidate);
    const issues = [];
    if (spent !== budget.total) issues.push(`技能点应分配 ${budget.total} 点，当前为 ${spent} 点`);
    DATA.skills.forEach((skill) => {
      const current = Number(ranks?.[skill.id]) || 0;
      if (current < 0 || !Number.isInteger(current)) issues.push(`${skill.name}的本级投入不是合法整数`);
      if ((prefix.skills?.[skill.id] || 0) + current > level) issues.push(`${skill.name}技能级数超过人物等级 ${level}`);
    });
    return issues;
  }

  function classSkillIds(character, profile = null) {
    const result = new Set();
    const byNative = new Map(DATA.skills.map((skill) => [skill.nativeStat, skill.id]));
    character.normalSteps.forEach((step) => (classById.get(step.classId)?.classSkills || []).forEach((nativeStat) => {
      if (byNative.has(nativeStat)) result.add(byNative.get(nativeStat));
    }));
    (profile || characterEffectProfile(character)).effects.filter((effect) => effect.category === "class-skill").forEach((effect) => {
      if (byNative.has(effect.stat)) result.add(byNative.get(effect.stat));
    });
    return result;
  }

  function skillProfile(character = currentCharacter()) {
    const effectProfile = characterEffectProfile(character);
    const attributes = effectiveAttributes(character, effectProfile);
    const classSkills = classSkillIds(character, effectProfile);
    const abilityIds = { Strength: "str", Dexterity: "dex", Constitution: "con", Intelligence: "int", Wisdom: "wis", Charisma: "cha" };
    return DATA.skills.map((skill) => {
      let abilityId = skill.ability;
      effectProfile.effects.filter((effect) => effect.category === "stat-base" && effect.stat === skill.nativeStat && abilityIds[effect.ability]).forEach((effect) => {
        const replacement = abilityIds[effect.ability];
        const currentMod = Math.floor(((attributes[abilityId] || 0) - 10) / 2);
        const replacementMod = Math.floor(((attributes[replacement] || 0) - 10) / 2);
        if (!effect.ifHigher || replacementMod > currentMod) abilityId = replacement;
      });
      const abilityModifier = attributes[abilityId] === 0 ? 0 : Math.floor((attributes[abilityId] - 10) / 2);
      const ranks = Number(character.skills?.[skill.id]) || 0;
      const classSkillBonus = classSkills.has(skill.id) && ranks > 0 ? 3 : 0;
      const permanentBonus = sourceFullStatValue(character, skill.nativeStat, effectProfile);
      return { ...skill, ranks, abilityId, abilityModifier, classSkill: classSkills.has(skill.id), classSkillBonus, permanentBonus, total: ranks + abilityModifier + classSkillBonus + permanentBonus };
    });
  }

  function nativeGuid(value) {
    const match = String(value || "").match(/(?:!bp_)?([0-9a-f]{32})/i);
    return match ? match[1].toLowerCase() : null;
  }

  function componentType(component) {
    return String(component?.$type || "").split(",").pop().trim();
  }

  function addGuidValues(value, result) {
    if (typeof value === "string") {
      const guid = nativeGuid(value);
      if (guid) result.add(guid);
      return;
    }
    if (Array.isArray(value)) value.forEach((entry) => addGuidValues(entry, result));
    else if (value && typeof value === "object") Object.values(value).forEach((entry) => addGuidValues(entry, result));
  }

  function addGrantedSourceFacts(components, result) {
    (components || []).forEach((component) => {
      if (!["AddFacts", "AddFeatureOnApply", "AddFeatureOnClassLevel"].includes(componentType(component))) return;
      addGuidValues(component.m_Facts || component.m_Feature || component.Feature, result);
    });
  }

  function closeSourceFacts(result) {
    const definitions = DATA.owlcat?.definitions || {};
    const pathItems = new Map((DATA.pathAbilities || []).filter((item) => item.sourceGuid).map((item) => [item.sourceGuid, item]));
    let previousSize = -1;
    while (previousSize !== result.size) {
      previousSize = result.size;
      [...result].forEach((guid) => {
        addGrantedSourceFacts(definitions[guid]?.components, result);
        addGrantedSourceFacts(pathItems.get(guid)?.nativeComponents, result);
      });
    }
    return result;
  }

  function addPathChoiceSourceFacts(choice, result) {
    const item = pathAbilityById.get(choice?.optionId);
    if (item?.sourceGuid) result.add(item.sourceGuid);
    addGuidValues(choice?.params || {}, result);
  }

  function addPathAutoSourceFacts(pathId, throughRank, result) {
    const progression = DATA.owlcatPathProgressions?.[pathId];
    (progression?.levels || []).filter((level) => level.rank <= throughRank).forEach((level) => {
      (level.auto || []).forEach((feature) => {
        if (feature.sourceGuid) result.add(feature.sourceGuid);
        addGrantedSourceFacts(feature.components, result);
      });
    });
  }

  function ownedSourceGuids(character = currentCharacter()) {
    return characterEffectProfile(character).owned;
  }

  function sourceChoiceRecords(character = currentCharacter()) {
    const records = [];
    (character.featChoices || []).forEach((choice) => {
      const item = featById.get(choice.id);
      if (item?.sourceGuid) records.push({ sourceGuid: item.sourceGuid, params: choice.params || {}, item });
    });
    (character.effectiveMythicChoiceRecords || character.mythicChoiceRecords || []).forEach((choice) => {
      const item = mythicById.get(choice.id);
      if (item?.sourceGuid) records.push({ sourceGuid: item.sourceGuid, params: choice.params || {}, item });
    });
    (character.normalSteps || []).flatMap((step) => step.featureChoices || []).forEach((choice) => selectedFeatureChoiceItems(choice).forEach(({ item, params }) => {
      if (item?.sourceGuid) records.push({ sourceGuid: item.sourceGuid, params, item });
    }));
    mythicProjection(character).activePathChoiceRecords.forEach((choice) => {
      const item = choice.optionId?.startsWith("dragon-feat:") ? featById.get(choice.optionId.slice(12)) : pathAbilityById.get(choice.optionId);
      if (item?.sourceGuid) records.push({ sourceGuid: item.sourceGuid, params: choice.params || {}, item });
    });
    return records;
  }

  function effectsForOwnedSourceSet(owned, character = currentCharacter()) {
    if (!owned || typeof owned.has !== "function" || typeof owned.forEach !== "function") return null;
    return [...owned].flatMap((guid, index) => normalizeComponentEffects({
      id: `owned:${index}:${guid}`,
      sourceGuid: guid,
      components: nativeDefinition(guid)?.components || [],
      originKind: "owned-preview",
      originLabel: nativeFeatureName(guid),
      lineage: [guid]
    }, owned, character));
  }

  function proficiencyProfile(character = currentCharacter(), owned = null) {
    const weapon = new Set();
    const armor = new Set();
    (effectsForOwnedSourceSet(owned, character) || characterEffectProfile(character).effects).forEach((effect) => {
      if (effect.category === "weapon-proficiency" && effect.value) weapon.add(effect.value);
      if (effect.category === "armor-proficiency" && effect.value) armor.add(effect.value);
    });
    return { weapon, armor };
  }

  function backgroundEffectProfile(character = currentCharacter()) {
    const classSkills = new Set();
    const weapon = new Set();
    const armor = new Set();
    const replacements = new Map();
    const bonuses = [];
    const skillIds = {
      SkillAthletics: "athletics", SkillMobility: "mobility", SkillThievery: "trickery", SkillStealth: "stealth",
      SkillKnowledgeArcana: "arcana", SkillKnowledgeWorld: "world", SkillLoreNature: "nature", SkillLoreReligion: "religion",
      SkillPerception: "perception", SkillPersuasion: "persuasion", SkillUseMagicDevice: "umd"
    };
    const abilityIds = { Strength: "str", Dexterity: "dex", Constitution: "con", Intelligence: "int", Wisdom: "wis", Charisma: "cha" };
    const effects = characterEffectProfile(character).effects.filter((effect) => ["background", "background-parameter"].includes(effect.originKind));
    effects.forEach((effect) => {
      if (effect.category === "class-skill" && skillIds[effect.stat]) classSkills.add(skillIds[effect.stat]);
      if (effect.category === "weapon-proficiency" && effect.value) weapon.add(effect.value);
      if (effect.category === "armor-proficiency" && effect.value) armor.add(effect.value);
      if (effect.category === "stat-base" && skillIds[effect.stat] && abilityIds[effect.ability]) {
        replacements.set(skillIds[effect.stat], { abilityId: abilityIds[effect.ability], ifHigher: effect.ifHigher });
      }
      if (effect.category === "stat") bonuses.push({ stat: effect.stat, value: effect.value, descriptor: effect.descriptor || null });
    });
    return { classSkills, weapon, armor, replacements, bonuses };
  }

  function normalizedNativeValue(value) {
    return String(value || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
  }

  function storyStatus(guid) {
    return currentSave().storyStates?.[nativeGuid(guid)] || "not-started";
  }

  function petProfile(character = currentCharacter(), owned = null) {
    const types = new Set();
    const sources = [];
    (effectsForOwnedSourceSet(owned, character) || characterEffectProfile(character).effects).filter((effect) => effect.category === "pet").forEach((effect) => {
      types.add(effect.petType);
      sources.push({ sourceGuid: effect.sourceGuid, type: effect.petType, petGuid: effect.petGuid });
    });
    return { types, sources };
  }

  function etudeLabel(guid) {
    const normalized = nativeGuid(guid);
    const owners = (DATA.paths || []).filter((path) => positiveStoryEtudes(path).includes(normalized)).map((path) => path.name);
    if (owners.length) return `${[...new Set(owners)].join(" / ")}剧情解锁`;
    const definition = DATA.owlcat?.definitions?.[normalized];
    return definition?.name || definition?.internalName || `剧情标记 ${String(normalized || "unknown").slice(0, 8)}`;
  }

  function parametrizedRequirementMet(requirement, character) {
    const sourceGuid = nativeGuid(requirement.m_Feature);
    const wanted = requirement.ParameterType === "WeaponCategory" ? requirement.WeaponCategory
      : requirement.ParameterType === "SpellSchool" ? requirement.SpellSchool
        : nativeGuid(requirement.m_Spell);
    return sourceChoiceRecords(character).some((record) => {
      if (record.sourceGuid !== sourceGuid) return false;
      const value = parameterValue(record.item, record.params) || record.params.weapon || record.params.spellSchool || record.params.spell;
      return normalizedNativeValue(value) === normalizedNativeValue(wanted);
    });
  }

  function nativeRequirementResults(item, character = currentCharacter(), sourceGuids = null, params = {}) {
    const requirements = item?.nativeRequirements || [];
    if (!requirements.length) return [];
    const owned = sourceGuids || ownedSourceGuids(character);
    const counts = classCounts(character);
    const spells = spellProfile(character);
    const classIdByGuid = new Map(DATA.classes.filter((entry) => entry.sourceGuid).map((entry) => [entry.sourceGuid, entry.id]));
    const pathIdByClassGuid = new Map(DATA.paths.filter((entry) => entry.sourceGuid).map((entry) => [entry.sourceGuid, entry.id]));
    const archetypeByGuid = new Map((DATA.archetypes || []).filter((entry) => entry.sourceGuid).map((entry) => [entry.sourceGuid, entry]));
    const definitions = DATA.owlcat?.definitions || {};
    const featureName = (guid) => definitions[guid]?.name || featById.get(guid)?.name || mythicById.get(guid)?.name || guid;
    const classRequirementName = (guid, classId) => classById.get(classId)?.name || definitions[guid]?.name || `技术/宠物职业 ${String(guid || "unknown").slice(0, 8)}`;
    const proficiencies = proficiencyProfile(character, owned);
    const choiceRecords = sourceChoiceRecords(character);
    const selectedParameter = parameterValue(item, params);
    const selectedWeapon = selectedParameter ? (DATA.installedWeaponOptions || []).find((option) => option.id === selectedParameter || option.nativeValue === selectedParameter) : null;
    const prerequisiteComponents = [...owned].flatMap((guid) => definitions[guid]?.components || []);
    const fakeClassLevels = new Map();
    prerequisiteComponents.filter((component) => componentType(component) === "ClassLevelsForPrerequisites").forEach((component) => {
      const actualId = classIdByGuid.get(nativeGuid(component.m_ActualClass));
      const fakeGuid = nativeGuid(component.m_FakeClass);
      if (!actualId || !fakeGuid) return;
      const value = Math.max(0, Math.floor((counts[actualId] || 0) * Number(component.Modifier ?? 1) + Number(component.Summand || 0)));
      fakeClassLevels.set(fakeGuid, Math.max(fakeClassLevels.get(fakeGuid) || 0, value));
    });
    const replacementComponents = prerequisiteComponents.filter((component) => componentType(component) === "ReplaceStatForPrerequisites");
    const effectiveBaseAttack = replacementComponents.filter((component) => component.OldStat === "BaseAttackBonus").reduce((best, component) => {
      const classId = classIdByGuid.get(nativeGuid(component.m_CharacterClass));
      if (!classId) return best;
      const classLevel = counts[classId] || 0;
      const classBab = DATA.owlcatClassStatBonus?.(classId, "bab", classLevel) || 0;
      const replacement = component.Policy === "ClassLevel" ? classLevel : component.Policy === "SpecificNumber" ? Number(component.SpecificNumber) || 0 : classLevel;
      return Math.max(best, baseAttack(character) - classBab + replacement);
    }, baseAttack(character));
    const statMap = {
      Strength: ["str", "力量"], Dexterity: ["dex", "敏捷"], Constitution: ["con", "体质"],
      Intelligence: ["int", "智力"], Wisdom: ["wis", "感知"], Charisma: ["cha", "魅力"],
      SkillAthletics: ["athletics", "运动"], SkillMobility: ["mobility", "灵巧"], SkillThievery: ["trickery", "巧手"],
      SkillStealth: ["stealth", "隐匿"], SkillKnowledgeArcana: ["arcana", "知识（神秘）"],
      SkillKnowledgeWorld: ["world", "知识（世界）"], SkillLoreReligion: ["religion", "学识（宗教）"],
      SkillPerception: ["perception", "察觉"], SkillPersuasion: ["persuasion", "说服"]
    };
    const alignmentMatches = (raw) => nativeAlignmentMatches(raw, character.alignment);
    const conditionResult = (condition, depth = 0) => {
      if (!condition || depth > 20) return { met: false, modeled: false, text: "缺少条件数据" };
      const type = componentType(condition);
      const inverted = Boolean(condition.Not);
      const finish = (met, text, modeled = true) => ({ met: inverted ? !met : Boolean(met), modeled, text });
      if (type === "OrAndLogic") {
        const children = condition.ConditionsChecker?.Conditions || [];
        const evaluated = children.map((child) => conditionResult(child, depth + 1));
        const isOr = condition.ConditionsChecker?.Operation === "Or";
        const met = isOr ? evaluated.some((entry) => entry.met) : evaluated.every((entry) => entry.met);
        return finish(met, evaluated.map((entry) => entry.text).filter(Boolean).join(isOr ? " 或 " : " 且 "), evaluated.every((entry) => entry.modeled));
      }
      if (["ContextConditionHasFact", "HasFact"].includes(type)) {
        const guid = nativeGuid(condition.m_Fact || condition.Fact);
        return finish(owned.has(guid), `拥有 ${featureName(guid)}`);
      }
      if (type === "EtudeStatus") {
        const guid = nativeGuid(condition.m_Etude || condition.Etude);
        const status = storyStatus(guid);
        const checks = [];
        if (condition.Playing) checks.push(status === "playing");
        if (condition.Completed) checks.push(status === "completed");
        if (condition.CompletionInProgress) checks.push(status === "completion-in-progress");
        if (condition.NotStarted) checks.push(status === "not-started");
        if (condition.Started) checks.push(status !== "not-started");
        return finish(checks.length ? checks.some(Boolean) : false, `${etudeLabel(guid)}：${status}`);
      }
      if (type === "ContextConditionCharacterClass") {
        const classId = classIdByGuid.get(nativeGuid(condition.m_Class));
        if (!classId) return finish(false, `职业条件 ${nativeGuid(condition.m_Class)}`, false);
        return finish((counts[classId] || 0) >= (Number(condition.MinLevel) || 1), `${classById.get(classId)?.name || classId} ${Number(condition.MinLevel) || 1} 级`);
      }
      if (type === "UnitClass") {
        const classGuid = nativeGuid(condition.m_Class);
        const classId = classIdByGuid.get(classGuid);
        const pathId = pathIdByClassGuid.get(classGuid);
        const projection = mythicProjection(character);
        const level = classId ? (counts[classId] || 0) : pathId && projection.activePath === pathId
          ? Math.max(0, character.mythicRank - (DATA.mythicPathRules?.[pathId]?.entryRank || 3) + 1) : 0;
        const minimum = Number(condition.MinLevel?.Value ?? condition.MinLevel) || 0;
        const maximum = Number(condition.MaxLevel?.Value ?? condition.MaxLevel);
        const met = (!condition.LimitMinLevel || level >= minimum) && (!condition.LimitMaxLevel || level <= (Number.isFinite(maximum) ? maximum : Infinity));
        return finish(met, `${classId ? classById.get(classId)?.name : pathId ? pathById.get(pathId)?.name : `技术/宠物职业 ${String(classGuid || "unknown").slice(0, 8)}`} ${level} 级`);
      }
      if (type === "ContextConditionIsMainCharacter") return finish(currentCompanion().id === "commander", "当前单位是骑士指挥官");
      if (type === "ContextConditionIsWeaponEquipped") {
        if (!selectedWeapon) return finish(false, `所选武器为 ${condition.Category || "指定类别"}`, false);
        return finish(normalizedNativeValue(selectedWeapon.nativeValue) === normalizedNativeValue(condition.Category), `所选武器为 ${condition.Category}`);
      }
      if (type === "ContextConditionBuffRank") {
        const guid = nativeGuid(condition.Fact || condition.Buff);
        const rank = choiceRecords.filter((record) => record.sourceGuid === guid).length || (owned.has(guid) ? 1 : 0);
        const target = Number(condition.RankValue?.Value) || 0;
        return finish(rank === target, `${featureName(guid)}层数为 ${target}`);
      }
      if (type === "IsUnitMythicLevel") {
        const minimum = Number(condition.MinLevel?.Value) || 0;
        const maximum = Number(condition.MaxLevel?.Value) || Infinity;
        const met = (!condition.CheckMinLevel || character.mythicRank >= minimum) && (!condition.CheckMaxLevel || character.mythicRank <= maximum);
        return finish(met, `神话等级 ${condition.CheckMinLevel ? `至少 ${minimum}` : ""}${condition.CheckMaxLevel ? `至多 ${maximum}` : ""}`);
      }
      return finish(false, `未建模条件 ${type || "Unknown"}`, false);
    };
    const results = requirements.map((requirement) => {
      const type = String(requirement.$type || "").split(",").pop().trim();
      const group = requirement.Group === "Any" ? "any" : "all";
      const result = (text, met, modeled = true) => ({ text, met: Boolean(met), group, native: true, modeled });
      if (type === "PrerequisiteStatValue" || type === "PrerequisiteFullStatValue") {
        if (requirement.Stat === "BaseAttackBonus") return result(`用于前置的基础攻击加值 +${requirement.Value}`, effectiveBaseAttack >= Number(requirement.Value));
        if (requirement.Stat === "SneakAttack") return result(`偷袭 ${requirement.Value}d6`, sourceFullStatValue(character, "SneakAttack") >= Number(requirement.Value));
        const stat = statMap[requirement.Stat];
        if (stat && stat[0] in character.attributes) {
          const attributes = effectiveAttributes(character);
          const replacement = replacementComponents.find((component) => component.OldStat === requirement.Stat && component.Policy === "NewStat");
          const replacementStat = replacement ? statMap[replacement.NewStat] : null;
          const value = replacementStat ? attributes[replacementStat[0]] || 0 : attributes[stat[0]] || 0;
          return result(`${replacementStat?.[1] || stat[1]} ${requirement.Value}`, value >= Number(requirement.Value));
        }
        if (stat) return result(`${stat[1]} ${requirement.Value}`, (character.skills[stat[0]] || 0) >= Number(requirement.Value));
      }
      if (type === "PrerequisiteEtude") {
        const guid = nativeGuid(requirement.Etude || requirement.m_Etude);
        const playing = storyStatus(guid) === "playing";
        return result(`剧情状态：${etudeLabel(guid)}${requirement.NotPlaying ? "未激活" : "已激活"}`, requirement.NotPlaying ? !playing : playing);
      }
      if (type === "PrerequisiteFeature" || type === "PrerequisiteNoFeature") {
        const guid = nativeGuid(requirement.m_Feature);
        const has = owned.has(guid);
        return result(`${type === "PrerequisiteNoFeature" ? "不能拥有" : "需要"}：${featureName(guid)}`, type === "PrerequisiteNoFeature" ? !has : has);
      }
      if (type === "PrerequisiteFeaturesFromList") {
        const guids = (requirement.m_Features || []).map(nativeGuid).filter(Boolean);
        const amount = Number(requirement.Amount) || 1;
        return result(`下列能力至少 ${amount} 项：${guids.map(featureName).join("、")}`, guids.filter((guid) => owned.has(guid)).length >= amount);
      }
      if (type === "PrerequisiteCharacterLevel") return result(`角色等级 ${requirement.Level}`, characterLevel(character) >= Number(requirement.Level));
      if (type === "PrerequisiteMythicLevel") return result(`神话等级 ${requirement.Level}`, character.mythicRank >= Number(requirement.Level));
      if (["PrerequisiteClassLevel", "PrerequisiteNoClassLevel"].includes(type)) {
        const classGuid = nativeGuid(requirement.m_CharacterClass);
        const classId = classIdByGuid.get(classGuid);
        const level = Math.max(counts[classId] || 0, fakeClassLevels.get(classGuid) || 0);
        const needed = Number(requirement.Level) || 1;
        const positive = type === "PrerequisiteClassLevel" && !requirement.Not;
        return result(`${positive ? "需要" : "不能拥有"}：${classRequirementName(classGuid, classId)} ${needed} 级`, positive ? level >= needed : level < needed);
      }
      if (["PrerequisiteArchetypeLevel", "PrerequisiteNoArchetype"].includes(type)) {
        const archetype = archetypeByGuid.get(nativeGuid(requirement.m_Archetype));
        const levels = character.normalSteps.filter((step) => step.archetypeId === archetype?.id).length;
        const needed = Number(requirement.Level) || 1;
        const positive = type === "PrerequisiteArchetypeLevel" && !requirement.Not;
        return result(`${positive ? "需要" : "不能拥有"}：${archetype?.name || nativeGuid(requirement.m_Archetype)} ${needed} 级`, positive ? levels >= needed : levels < needed);
      }
      if (type === "PrerequisiteClassSpellLevel") {
        const classId = classIdByGuid.get(nativeGuid(requirement.m_CharacterClass));
        return result(`${classById.get(classId)?.name || classId}可施放 ${requirement.RequiredSpellLevel} 环法术`, classSpellLevelForCharacter(character, classId) >= Number(requirement.RequiredSpellLevel));
      }
      if (type === "PrerequisiteCasterTypeSpellLevel") return result(`可施放 ${requirement.RequiredSpellLevel || requirement.SpellLevel || 1} 环法术`, spells.any >= Number(requirement.RequiredSpellLevel || requirement.SpellLevel || 1));
      if (type === "PrerequisiteCasterType") return result(requirement.IsArcane ? "必须是奥术施法者" : "必须是神术施法者", requirement.IsArcane ? spells.arcane > 0 : spells.divine > 0);
      if (type === "PrerequisiteAnySpellsInSpellbook") return result("法术书中必须至少有一个法术", spells.any > 0);
      if (type === "PrerequisiteAlignment") return result(`阵营：${nativeAlignmentLabel(requirement.Alignment) || "蓝图指定"}`, alignmentMatches(requirement.Alignment));
      if (type === "PrerequisiteMainCharacter") return result("仅限主角", currentCompanion().id === "commander");
      if (type === "PrerequisiteIsPet") return result(requirement.Not ? "不能是动物伙伴" : "必须是动物伙伴", Boolean(requirement.Not));
      if (type === "PrerequisitePet") {
        const profile = petProfile(character, owned);
        const requestedType = requirement.Type || "AnimalCompanion";
        const hasPet = profile.types.has(requestedType);
        return result(requirement.NoCompanion ? "当前不能已有动物伙伴" : "当前必须已有动物伙伴", requirement.NoCompanion ? !hasPet : hasPet);
      }
      if (type === "PrerequisiteProficiency" || type === "PrerequisiteNotProficient") {
        const weapon = requirement.WeaponProficiencies || [];
        const armor = requirement.ArmorProficiencies || [];
        const hasAny = !weapon.length && !armor.length ? true : weapon.some((value) => proficiencies.weapon.has(value)) || armor.some((value) => proficiencies.armor.has(value));
        const hasMissing = weapon.some((value) => !proficiencies.weapon.has(value)) || armor.some((value) => !proficiencies.armor.has(value));
        const labels = [
          ...weapon.map(nativeWeaponName),
          ...armor.map((value) => nativeArmorNames[value] || value),
        ].join("、") || "指定装备";
        return result(`${type === "PrerequisiteProficiency" ? "需要擅长" : "尚未完全擅长"}：${labels}`, type === "PrerequisiteProficiency" ? hasAny : hasMissing);
      }
      if (type === "PrerequisiteParametrizedFeature") return result(`需要匹配细分的 ${featureName(nativeGuid(requirement.m_Feature))}`, parametrizedRequirementMet(requirement, character));
      if (type === "PrerequisiteParametrizedWeaponSubcategory") {
        const sourceGuid = nativeGuid(requirement.m_Feature);
        const met = choiceRecords.filter((record) => record.sourceGuid === sourceGuid).some((record) => {
          const value = parameterValue(record.item, record.params);
          const weapon = (DATA.installedWeaponOptions || []).find((option) => option.id === value || option.nativeValue === value);
          if (requirement.SubCategory === "Ranged") return weapon?.attackType === "Ranged";
          if (requirement.SubCategory === "Melee") return weapon?.attackType === "Melee";
          if (requirement.SubCategory === "OneHandedPiercing") return weapon?.attackType === "Melee" && !weapon?.isTwoHanded && weapon?.physicalForms?.includes("Piercing");
          if (requirement.SubCategory === "OneHandedSlashing") return weapon?.attackType === "Melee" && !weapon?.isTwoHanded && weapon?.physicalForms?.includes("Slashing");
          return false;
        });
        return result(`需要${requirement.SubCategory || "指定"}武器的 ${featureName(sourceGuid)}`, met);
      }
      if (type === "PrerequisitePlayerHasFeature") {
        const guid = nativeGuid(requirement.m_Feature);
        const commander = currentSave().characters.commander;
        return result(`指挥官需要：${featureName(guid)}`, ownedSourceGuids(commander).has(guid));
      }
      if (type === "PrerequisiteCondition") {
        const evaluated = conditionResult(requirement.Condition);
        return result(evaluated.text || "游戏原生条件", evaluated.met, evaluated.modeled);
      }
      if (type === "PrerequisiteConditionForWeaponCategory") {
        if (!selectedWeapon) return result("选择武器后校验该类别的附加条件", true);
        const applies = (requirement.m_WeaponCategories || []).some((value) => normalizedNativeValue(value) === normalizedNativeValue(selectedWeapon.nativeValue));
        if (!applies) return result(`该附加条件不适用于 ${selectedWeapon.name}`, true);
        const evaluated = conditionResult(requirement.m_Condition);
        return result(`${selectedWeapon.name}：${evaluated.text}`, evaluated.met, evaluated.modeled);
      }
      if (type === "PrerequisiteSelectionPossible") {
        const selectionGuid = nativeGuid(requirement.m_ThisFeature);
        const groupDefinition = DATA.featureGroups?.[`owlcat:${selectionGuid}`];
        const possible = (groupDefinition?.options || []).some((option) => {
          const filtered = { ...option, nativeRequirements: (option.nativeRequirements || []).filter((entry) => componentType(entry) !== "PrerequisiteSelectionPossible") };
          return nativeResultsMet(nativeRequirementResults(filtered, character, owned)) && (!option.parameter || parameterOptionsForItem(option).length > 0);
        });
        return result(`至少有一个可选的 ${groupDefinition?.name || featureName(selectionGuid)}`, possible);
      }
      if (requirement.HideInUI) return result(`游戏内部隐藏条件：${type}`, true);
      return result(`尚未接线的游戏原生条件：${type || "Unknown"}`, false, false);
    });
    if (item?.nativeParameter?.type === "WeaponCategory" && item.nativeParameter.requireProficiency && selectedWeapon) {
      results.push({
        text: `擅长所选武器：${selectedWeapon.name}`,
        met: proficiencies.weapon.has(selectedWeapon.nativeValue) || selectedWeapon.isNatural || selectedWeapon.isUnarmed,
        group: "all",
        native: true,
        modeled: true
      });
    }
    return results;
  }

  function requirementResults(req = {}, character = currentCharacter()) {
    const results = [];
    const level = characterLevel(character);
    const bab = baseAttack(character);
    const spells = spellProfile(character);
    const counts = classCounts(character);
    const add = (text, met) => results.push({ text, met: Boolean(met) });

    const attributes = effectiveAttributes(character);
    Object.entries(req.abilities || {}).forEach(([id, needed]) => add(`${abilityById.get(id)?.name || id} ${needed}`, (attributes[id] || 0) >= needed));
    if (req.bab) add(`基础攻击加值 +${req.bab}`, bab >= req.bab);
    if (req.level) add(`角色等级 ${req.level}`, level >= req.level);
    (req.feats || []).forEach((id) => add(featById.get(id)?.name || id, character.feats.includes(id)));
    (req.mythic || []).forEach((id) => add(mythicById.get(id)?.name || id, character.mythicChoices.includes(id)));
    Object.entries(req.skills || {}).forEach(([id, needed]) => add(`${skillById.get(id)?.name || id} ${needed}`, (character.skills[id] || 0) >= needed));
    if (req.fighterLevel) add(`战士等级 ${req.fighterLevel}`, (counts.fighter || 0) >= req.fighterLevel);
    if (req.monkLevel) add(`武僧等级 ${req.monkLevel}`, (counts.monk || 0) >= req.monkLevel);
    if (req.arcaneSpell) add(`可施放 ${req.arcaneSpell} 环奥术`, spells.arcane >= req.arcaneSpell);
    if (req.spontaneousArcaneSpell) add(`可自发施放 ${req.spontaneousArcaneSpell} 环奥术`, spells.spontaneousArcane >= req.spontaneousArcaneSpell);
    if (req.divineSpell) add(`可施放 ${req.divineSpell} 环神术`, spells.divine >= req.divineSpell);
    if (req.spell) add(`可施放 ${req.spell} 环法术`, spells.any >= req.spell);
    if (req.sneakDice) add(`偷袭 ${req.sneakDice}d6`, sneakDice(character) >= req.sneakDice);
    if (req.anyMetamagic) add("任意超魔专长", character.feats.some((id) => featById.get(id)?.metamagic));
    if (req.anySkillFocus) add("任意技能专攻", character.feats.some((id) => featById.get(id)?.skillFocus));
    if (req.winterSource) add("冬之庇护主或冰霜精魂", (counts.witch || 0) > 0 || (counts.shaman || 0) > 0 || (counts.druid || 0) > 0);
    if (req.alignmentAny) add(`阵营：${req.alignmentAny.map(nativeAlignmentName).join(" / ")}`, req.alignmentAny.includes(character.alignment));
    if (req.alignmentNot) add(`阵营不可为 ${req.alignmentNot.map(nativeAlignmentName).join(" / ")}`, !req.alignmentNot.includes(character.alignment));
    if (req.alignmentLawful) add("守序阵营", character.alignment.startsWith("L"));
    if (req.alignmentNotGood) add("非善良阵营", !character.alignment.endsWith("G"));
    if (req.alignmentDruid) add("德鲁伊兼容阵营", ["NG", "LN", "N", "CN", "NE"].includes(character.alignment));
    if (req.faithRequired) add("必须选择一位神祇", Boolean(character.deity && character.deity !== "atheism"));
    if (req.deityAny) add(`信仰：${req.deityAny.map((id) => deityById.get(id)?.name || id).join(" / ")}`, req.deityAny.includes(character.deity));
    if (req.classAny) add(`职业：${req.classAny.map((id) => classById.get(id)?.name || id).join(" / ")}`, req.classAny.some((id) => (counts[id] || 0) > 0));
    if (req.raceAny) add(`种族：${req.raceAny.map((id) => DATA.races.find((race) => race.id === id)?.name || id).join(" / ")}`, req.raceAny.includes(character.race));
    if (req.heritageAny) add(`子种族：${req.heritageAny.map((id) => heritageById.get(id)?.name || id).join(" / ")}`, req.heritageAny.includes(character.heritage));
    if (req.anyCriticalFeats) add(`至少 ${req.anyCriticalFeats} 个重击专长`, character.feats.filter((id) => featById.get(id)?.category === "重击" && id !== "critical-focus").length >= req.anyCriticalFeats);
    if (req.oneOf) {
      const alternatives = req.oneOf.map((option) => requirementResults(option, character));
      add(`满足其一：${alternatives.map((checks) => checks.map((check) => check.text).join("+")).join(" / ")}`, alternatives.some((checks) => checks.every((check) => check.met)));
    }
    return results;
  }

  function itemRequirementResults(item, character = currentCharacter(), params = {}) {
    const native = nativeRequirementResults(item, character, null, params);
    const sourceCatalogChoice = featById.get(item?.id) === item || mythicById.get(item?.id) === item;
    const legacy = sourceCatalogChoice && item?.sourceVerified && (item.nativeRequirements || []).length ? [] : requirementResults(item?.req || {}, character);
    return [...legacy, ...native];
  }

  function itemRequirementsMet(item, character = currentCharacter(), params = {}) {
    const results = itemRequirementResults(item, character, params);
    const all = results.filter((result) => result.group !== "any");
    const any = results.filter((result) => result.group === "any");
    return all.every((result) => result.met) && (!any.length || any.some((result) => result.met));
  }

  function isEligible(item, character = currentCharacter(), params = {}) {
    const deity = deityById.get(character.deity);
    const faithCompatible = !deity || deity.alignments.includes(character.alignment);
    return faithCompatible && itemRequirementsMet(item, character, params);
  }

  function requirementText(item, character = currentCharacter(), params = {}) {
    const results = itemRequirementResults(item, character, params);
    if (!results.length) return "无前置条件";
    const missing = results.filter((result) => !result.met);
    return missing.length ? `缺少：${missing.map((item) => item.text).join("、")}` : "全部前置已满足";
  }

  function choiceStatus(item, owned = false) {
    if (owned) return { label: "已掌握", className: "owned" };
    if (isEligible(item)) return { label: "当前可选", className: "" };
    return { label: "条件不足", className: "locked" };
  }

  function classLabel(id) { return classById.get(id)?.name || (id === "dragon" ? "灵使幼龙" : id); }

  function renderSaveSelect() {
    elements.saveSelect.replaceChildren();
    Object.entries(store.slots).forEach(([id, save]) => {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = save.name;
      option.selected = id === store.activeSlot;
      elements.saveSelect.append(option);
    });
  }

  function renderNav() {
    elements.nav.querySelectorAll("[data-view]").forEach((button) => button.classList.toggle("active", button.dataset.view === ui.view));
    document.querySelectorAll("[data-page]").forEach((page) => {
      const active = page.dataset.page === ui.view;
      page.hidden = !active;
      page.classList.toggle("active", active);
    });
  }

  function rosterGroupLabel(companion) {
    if (companion.group === "path") return "道途限定";
    if (companion.group === "dlc") return "DLC 同伴";
    if (companion.group === "special") return "特殊招募";
    return "常规同伴";
  }

  function pathAvailable(companion) {
    if (!companion.path) return true;
    return currentSave().characters.commander.mythicPath === companion.path;
  }

  function renderRoster() {
    elements.rosterFilter.querySelectorAll("button").forEach((button) => button.classList.toggle("active", button.dataset.roster === ui.roster));
    const visible = DATA.companions.filter((companion) => {
      if (ui.roster === "all") return true;
      if (ui.roster === "path") return companion.group === "path";
      return companion.group !== "path";
    });
    elements.rosterCount.textContent = `${visible.length} / ${DATA.companions.length}`;
    let lastGroup = "";
    elements.rosterList.innerHTML = visible.map((companion) => {
      const group = rosterGroupLabel(companion);
      const heading = group !== lastGroup ? `<div class="roster-group">${escapeHtml(group)}</div>` : "";
      lastGroup = group;
      const character = currentSave().characters[companion.id];
      const active = currentSave().activeCharacter === companion.id;
      const locked = !pathAvailable(companion);
      return `${heading}<button type="button" class="roster-card ${active ? "active" : ""} ${locked ? "path-locked" : ""}" data-character="${companion.id}">
        <span class="portrait-token" aria-hidden="true">${escapeHtml(companion.name.slice(0, 1))}</span>
        <span class="roster-name"><strong>${escapeHtml(companion.name)}</strong><small>${escapeHtml(locked ? `${pathById.get(companion.path)?.name}限定 · 可预构筑` : companion.title)}</small></span>
        <span class="roster-level">LV ${characterLevel(character)}</span>
      </button>`;
    }).join("");
  }

  function renderCharacterBanner() {
    const companion = currentCompanion();
    const character = currentCharacter();
    const counts = classCounts(character);
    const summary = Object.entries(counts).map(([id, count]) => `${classLabel(id)} ${count}`).join(" / ") || "等待选择一级职业";
    elements.characterBanner.innerHTML = `<div><span class="overline">${companion.id === "commander" ? "KNIGHT COMMANDER" : escapeHtml(companion.title)}</span><h1>${escapeHtml(companion.name)}</h1><p>${escapeHtml(summary)} · ${escapeHtml(companion.note)}</p></div><div class="character-level"><span>角色等级</span><strong>${characterLevel(character)}</strong></div>`;
  }

  function renderModeStrip() {
    const companion = currentCompanion();
    const character = currentCharacter();
    if (companion.id === "commander") {
      elements.modeStrip.innerHTML = `<span class="mode-copy"><strong>主角车卡</strong> · 种族、出身、购点、职业与神话道途均可编辑</span><span class="roster-meta">25 POINT BUY / FULL CONTROL</span>`;
      return;
    }
    elements.modeStrip.innerHTML = `<span class="mode-copy"><strong>${character.fullRespec ? "完全洗点模式" : "原版入队起点"}</strong> · ${character.fullRespec ? "模拟完全洗点 Mod：从一级重新构筑" : `保留 ${companion.name} 入队时的 ${companion.level} 级职业快照`}</span>
      <label class="respec-toggle"><input type="checkbox" id="respec-toggle" ${character.fullRespec ? "checked" : ""}><span class="toggle-track" aria-hidden="true"></span><span>一键完全洗点</span></label>`;
  }

  function renderCreationSteps() {
    elements.creationSteps.querySelectorAll("[data-stage]").forEach((button) => button.classList.toggle("active", button.dataset.stage === ui.stage));
  }

  function workspaceHead(code, title, copy) {
    return `<div class="workspace-head"><div><span class="choice-code">${code}</span><h2>${title}</h2></div><p>${copy}</p></div>`;
  }

  function raceAbilityRequired(character = currentCharacter()) {
    return character.attributesMode !== "final"
      && Boolean(DATA.races.find((entry) => entry.id === character.race)?.sourceMechanics?.selectableRaceStat);
  }

  function renderRaceStage() {
    const character = currentCharacter();
    const locked = currentCompanion().id !== "commander" && !character.fullRespec;
    const heritages = (DATA.heritages || []).filter((item) => item.raceId === character.race);
    const needsRaceAbility = raceAbilityRequired(character);
    elements.workspace.innerHTML = `${workspaceHead("ANCESTRY / HERITAGE", "选择种族与子种族", locked ? "原版入队模式保留队友种族；开启完全洗点后可按 Mod 逻辑重设。" : "先选基础种族，再选其血统或子种族；一级种族槽会随选择立即重算。")}
      <div class="choice-grid">${DATA.races.filter((race) => race.playable !== false).map((race) => longChoiceCard({ selected: character.race === race.id, disabled: locked, dataAttributes: `data-race="${race.id}"`, code: race.bonus, title: race.name, text: race.text, footer: race.feat ? "<small>额外一级专长</small>" : "" })).join("")}</div>
      <section class="nested-choice-section"><h3>${escapeHtml(DATA.races.find((race) => race.id === character.race)?.name || "种族")} · 子种族 / 血统</h3><div class="choice-grid compact-grid">${heritages.map((item) => longChoiceCard({ selected: character.heritage === item.id, disabled: locked, dataAttributes: `data-heritage="${item.id}"`, code: item.bonus, title: item.name, text: item.text })).join("") || `<p class="choice-note">此特殊种族没有可编辑的子种族。</p>`}</div></section>
      ${needsRaceAbility ? `<section class="nested-choice-section"><h3>种族属性加值 · 必选 +2</h3><div class="alignment-grid">${DATA.abilities.filter((ability) => !(currentCompanion().path === "lich" && ability.id === "con")).map((ability) => `<button type="button" class="choice-card ${character.raceAbility === ability.id ? "selected" : ""}" data-race-ability="${ability.id}" ${locked ? "disabled" : ""}><span class="choice-code">${ability.short} +2</span><h3>${escapeHtml(ability.name)}</h3></button>`).join("")}</div><p class="choice-note">该选择独立存档，并参与一级职业、专长与后续所有属性前置校验。</p></section>` : ""}`;
  }

  function renderBackgroundStage() {
    const character = currentCharacter();
    const locked = currentCompanion().id !== "commander" && !character.fullRespec;
    const selected = DATA.backgrounds.find((item) => item.id === character.background);
    const categories = DATA.backgroundCategories?.length ? DATA.backgroundCategories : [...new Set(DATA.backgrounds.map((item) => item.category || "其他"))].map((name) => ({ id: name, name }));
    if (!ui.backgroundCategory || !categories.some((item) => item.id === ui.backgroundCategory)) ui.backgroundCategory = selected?.categoryId || categories[0]?.id;
    const visible = DATA.backgrounds.filter((item) => (item.categoryId || item.category || "其他") === ui.backgroundCategory);
    const profile = backgroundEffectProfile(character);
    const weaponName = (value) => (DATA.installedWeaponOptions || []).find((option) => option.nativeValue === value)?.name || value;
    const armorNames = { Light: "轻甲", Medium: "中甲", Heavy: "重甲", Buckler: "小圆盾", Shield: "盾牌", TowerShield: "塔盾" };
    const statNames = { SaveFortitude: "强韧豁免", SaveReflex: "反射豁免", SaveWill: "意志豁免", Initiative: "先攻", Speed: "速度" };
    const profileLabels = [
      ...[...profile.classSkills].map((id) => `${skillById.get(id)?.name || id}成为本职技能`),
      ...[...profile.weapon].map((value) => `擅长武器：${weaponName(value)}`),
      ...[...profile.armor].map((value) => `擅长护甲：${armorNames[value] || value}`),
      ...[...profile.replacements].map(([skillId, replacement]) => `${skillById.get(skillId)?.name || skillId}改用${abilityById.get(replacement.abilityId)?.name || replacement.abilityId}${replacement.ifHigher ? "（较高时）" : ""}`),
      ...profile.bonuses.filter((bonus) => bonus.value).map((bonus) => `${statNames[bonus.stat] || bonus.stat} ${bonus.value >= 0 ? "+" : ""}${bonus.value}`)
    ];
    elements.workspace.innerHTML = `${workspaceHead("ORIGIN / PROFESSION", "选择出身", "出身按大类与具体职业两层呈现；选择结果仍以稳定的小出身 ID 存档。")}
      <div class="category-tabs">${categories.map((category) => `<button type="button" class="${ui.backgroundCategory === category.id ? "active" : ""}" data-background-category="${escapeHtml(category.id)}">${escapeHtml(category.name)}<small>${DATA.backgrounds.filter((item) => (item.categoryId || item.category || "其他") === category.id).length}</small></button>`).join("")}</div>
      <div class="choice-grid">${visible.map((background) => longChoiceCard({ selected: character.background === background.id, disabled: locked, dataAttributes: `data-background="${background.id}"`, code: `${background.category || "出身"} · ${(background.skills || []).map((id) => skillById.get(id)?.name || id).join(" / ") || "无额外本职技能"}`, title: background.name, text: background.text })).join("")}</div>
      ${selected ? `<section class="nested-choice-section"><h3>${escapeHtml(selected.name)} · 实机结构化效果</h3><div class="class-stack">${profileLabels.map((label) => `<span class="feat-chip">${escapeHtml(label)}</span>`).join("") || `<span class="feat-chip">无无条件数值、技能或装备擅长修正</span>`}</div><p class="choice-note">仅把无条件永久效果计入裸装数值；针对特定武器、目标或战斗状态的组件保留在百科说明中，不伪装成常驻加值。</p></section>` : ""}
      ${selected?.parameter ? `<section class="nested-choice-section"><h3>${escapeHtml(selected.name)} · 细分选项</h3>${parameterControl(selected, character.backgroundParams || {}, selected.id, "background", locked)}<p class="choice-note">该选择与出身一起存档，切换出身时会重新校验。</p></section>` : ""}`;
  }

  function renderFaithStage() {
    const character = currentCharacter();
    const locked = currentCompanion().id !== "commander" && !character.fullRespec;
    const deity = deityById.get(character.deity);
    const faithWarning = deity && !deity.alignments.includes(character.alignment) ? "当前阵营与所选信仰不兼容。" : !character.deity ? "尚未选择信仰；牧师、审判官、战争祭司与圣武士会因此不可选。" : "阵营与信仰兼容。";
    elements.workspace.innerHTML = `${workspaceHead("ALIGNMENT / FAITH", "阵营与信仰", "阵营会参与职业前置；任意角色均可选择神祇或无神论，神职职业还会据此过滤领域。")}
      <section class="nested-choice-section"><h3>选择阵营</h3><div class="alignment-grid">${DATA.alignments.map((item) => `<button type="button" class="choice-card ${character.alignment === item.id ? "selected" : ""}" data-alignment="${item.id}" ${locked ? "disabled" : ""}><span class="choice-code">${item.id}</span><h3>${escapeHtml(item.name)}</h3></button>`).join("")}</div></section>
      <section class="nested-choice-section"><h3>选择信仰</h3><p class="choice-note">${escapeHtml(faithWarning)}</p><div class="choice-grid compact-grid">${DATA.deities.map((item) => { const compatible = item.alignments.includes(character.alignment); return longChoiceCard({ selected: character.deity === item.id, disabled: locked || !compatible, dataAttributes: `data-deity="${item.id}"`, code: `${item.weapon} · ${item.alignments.map(nativeAlignmentName).join("/")}`, title: item.name, text: item.text || `偏好武器：${item.weapon}；领域：${item.domains.map((id) => domainById.get(id)?.name || id).join("、") || "无"}` }); }).join("")}</div></section>`;
  }

  function pointSpent(character = currentCharacter()) {
    return DATA.abilities.reduce((sum, ability) => {
      if (currentCompanion().path === "lich" && ability.id === "con") return sum;
      const score = Math.max(7, Math.min(18, character.attributes[ability.id] || 10));
      return sum + (pointCosts[score] ?? 0);
    }, 0);
  }

  function renderAttributeStage() {
    const character = currentCharacter();
    const companion = currentCompanion();
    const editable = companion.id === "commander" || character.fullRespec;
    const remaining = 25 - pointSpent(character);
    const finalAttributes = effectiveAttributes(character);
    const skills = skillProfile(character);
    elements.workspace.innerHTML = `${workspaceHead("ABILITY SCORES / SKILLS", "属性与技能", editable ? "25 点购点按游戏基准计算；技能点在每一级升级记录中分配。" : "原版入队属性已锁定；后续技能点在对应升级等级中分配。")}
      <div class="attribute-console"><div><div class="attribute-list">${DATA.abilities.map((ability) => {
        const value = character.attributes[ability.id];
        const undeadCon = companion.path === "lich" && ability.id === "con";
        const min = undeadCon ? 0 : 7;
        const finalValue = finalAttributes[ability.id];
        const mod = Math.floor((finalValue - 10) / 2);
        return `<div class="attribute-row"><strong>${ability.name}<small>${ability.short}</small></strong><span></span><button type="button" data-ability="${ability.id}" data-delta="-1" ${!editable || undeadCon || value <= min ? "disabled" : ""}>−</button><output title="购点基础值">${undeadCon ? "—" : value}</output><button type="button" data-ability="${ability.id}" data-delta="1" ${!editable || undeadCon || value >= 18 ? "disabled" : ""}>＋</button><span class="ability-mod" title="含种族、血统与等级成长">${undeadCon ? "亡灵" : `最终 ${finalValue} · ${mod >= 0 ? "+" : ""}${mod}`}</span></div>`;
      }).join("")}</div>
      <div class="skill-editor"><h3>技能总览 · 技能级数上限 ${maxSkillRank(character)}</h3><div class="skill-summary-grid">${skills.map((skill) => `<div class="skill-summary-row"><span><strong>${escapeHtml(skill.name)}</strong><small>${escapeHtml(abilityById.get(skill.abilityId)?.short || skill.abilityId)}${skill.classSkill ? " · 本职" : ""}</small></span><span title="已投入技能级数">${skill.ranks} 级</span><span title="属性调整值 / 本职技能 / 永久加值">${signed(skill.abilityModifier)}${skill.classSkillBonus ? ` +${skill.classSkillBonus}` : ""}${skill.permanentBonus ? ` ${signed(skill.permanentBonus)}` : ""}</span><output>${signed(skill.total)}</output></div>`).join("")}</div><p class="choice-note">最终检定值 = 已投入级数 + 当前关联属性调整值 + 本职技能奖励（投入至少 1 级时 +3）+ 已建模永久加值；条件性与临时加值不混入。</p></div></div>
      <aside class="point-budget"><span>剩余购点</span><strong class="${remaining < 0 ? "over" : ""}">${remaining}</strong><p>中间数字是购点基础值；右侧“最终”值由当前种族、血统、种族可选 +2 与每 4 级成长按历史重放。亡灵队友体质固定为“—”。</p></aside></div>`;
  }

  function classChoices(character) {
    return DATA.classes.map((entry) => ({ entry, checks: requirementResults(entry.req, character), eligible: isEligible(entry, character) }));
  }

  function availableDomains(character, classId, archetypeId) {
    if (classId === "druid") return DATA.domains.filter((domain) => ["air", "animal", "earth", "fire", "ice", "plant", "water", "weather"].includes(domain.id));
    const deity = deityById.get(character.deity);
    if (["cleric", "inquisitor", "warpriest"].includes(classId) || (classId === "hunter" && archetypeId === "divine-hunter")) {
      return DATA.domains.filter((domain) => deity?.domains.includes(domain.id));
    }
    return DATA.domains;
  }

  function normalStepChoiceIssues(character, index) {
    const step = character.normalSteps[index];
    if (!step || step.locked) return [];
    const issues = [];
    const prefix = normalPrefix(character, index);
    const classEntry = classById.get(step.classId);
    const archetypeEntry = step.archetypeId ? archetypeByKey.get(archetypeKey(step.classId, step.archetypeId)) : null;
    if (!classEntry || !isEligible(classEntry, prefix)) issues.push(`${classEntry?.name || step.classId}的职业前置不满足`);
    if (step.archetypeId && (!archetypeEntry || !isEligible(archetypeEntry, prefix))) issues.push(`${archetypeEntry?.name || step.archetypeId}的原型前置不满足`);
    const fixedArchetype = selectedArchetype(prefix, step.classId);
    if (fixedArchetype !== null && fixedArchetype !== step.archetypeId) issues.push(`${classEntry?.name || step.classId}原型与此前等级不一致`);
    if ((index + 1) % 4 === 0 && !abilityById.has(step.abilityIncrease)) issues.push("本级属性成长尚未选择");
    const skillCandidate = rebuildCharacter({
      ...prefix,
      normalSteps: [...prefix.normalSteps, { ...step, skillRanks: sanitizeSkillRanks(step.skillRanks) }],
      mythicSteps: prefix.mythicSteps.map((mythicStep) => ({ ...mythicStep, pathPicks: [...mythicStep.pathPicks] })),
      legacyManual: { feats: [...prefix.legacyManual.feats], mythic: [...prefix.legacyManual.mythic] },
      legacySkillRanks: sanitizeSkillRanks(prefix.legacySkillRanks)
    });
    skillRankIssues(prefix, skillCandidate, step.skillRanks).forEach((issue) => issues.push(issue));

    const featSlots = featSlotsForStep(prefix, step.classId, step.archetypeId);
    const featChoices = step.featChoices || [];
    if (featChoices.length !== featSlots.length) issues.push("专长槽不完整或来源已失效");
    const seenChoices = new Set(prefix.featChoices.map(choiceKey));
    const runningChoices = [];
    featSlots.forEach((slot, slotIndex) => {
      const choice = featChoices[slotIndex];
      if (!choice) return;
      const item = featById.get(choice.id);
      const key = choiceKey(choice);
      const sourceValid = choice.slotId === slot.id && choice.source === slot.source;
      if (!sourceValid) issues.push(`${item?.name || choice.id}的专长槽来源已失效`);
      if (seenChoices.has(key)) issues.push(`${parameterLabel(item, choice.params)}重复取得`);
      const before = rebuildCharacter({
        ...prefix,
        normalSteps: [...prefix.normalSteps, { ...step, featChoices: runningChoices, featIds: runningChoices.map((entry) => entry.id) }],
        mythicSteps: prefix.mythicSteps.map((mythicStep) => ({ ...mythicStep, pathPicks: [...mythicStep.pathPicks] })),
        legacyManual: { feats: [...prefix.legacyManual.feats], mythic: [...prefix.legacyManual.mythic] }
      });
      const valid = Boolean(item && featPoolForSlot(slot).some((feat) => feat.id === item.id) && isParameterizedChoiceEligible(item, choice.params, before, slot.ignorePrerequisites));
      if (!valid) issues.push(`${parameterLabel(item, choice.params) || choice.id}前置或细分选项不完整`);
      if (sourceValid && valid && !seenChoices.has(key)) {
        runningChoices.push(choice);
        seenChoices.add(key);
      }
    });

    const featureChoices = step.featureChoices || [];
    const featureChoicesBySlot = Object.fromEntries(featureChoices.map((choice) => [choice.slotId, { optionId: choice.optionId, params: choice.params || {} }]));
    const featureSlots = activeFeatureSlotsForStep(prefix, step.classId, step.archetypeId, featureChoicesBySlot);
    if (featureChoices.length !== featureSlots.length) issues.push("职业特性选择槽不完整或来源已失效");
    const seenFeatures = new Set();
    const runningFeatures = [];
    const featureCandidate = normalCandidate(prefix, step.classId, step.archetypeId);
    featureSlots.forEach((slot, slotIndex) => {
      const choice = featureChoices[slotIndex];
      if (!choice) return;
      const key = `${slot.groupId}:${choice.optionId}`;
      const before = withCurrentFeatureChoices(featureCandidate, runningFeatures);
      const valid = choice.slotId === slot.id && choice.source === slot.source && choice.groupId === slot.groupId
        && featureChoiceComplete(slot, choice, before)
        && !seenFeatures.has(key);
      if (!valid) issues.push(`${featureChoiceLabel(choice) || choice.optionId}的职业特性槽或选项已失效`);
      else {
        seenFeatures.add(key);
        runningFeatures.push(choice);
      }
    });

    const domainSlots = domainSlotsForStep(prefix, step.classId, step.archetypeId);
    const domainChoices = step.domainChoices || [];
    const seenDomains = new Set();
    if (domainChoices.length !== domainSlots.length) issues.push("领域选择槽不完整或来源已失效");
    domainSlots.forEach((slot, slotIndex) => {
      const choice = domainChoices[slotIndex];
      const valid = choice && choice.slotId === slot.id && choice.source === slot.source
        && choice.sourceGuid === (slot.sourceGuid || null)
        && domainsForSlot(prefix, step.classId, step.archetypeId, slot).some((domain) => domain.id === choice.domainId)
        && !seenDomains.has(choice.domainId);
      if (!valid) issues.push(`${domainById.get(choice?.domainId)?.name || choice?.domainId || slot.label}的领域槽或信仰条件已失效`);
      else seenDomains.add(choice.domainId);
    });

    const spellSpec = knownSpellPickSpec(prefix, step.classId, step.archetypeId);
    const spellCount = Object.values(spellSpec).reduce((sum, count) => sum + count, 0);
    const spellsValid = step.knownSpellIds.length === spellCount
      && Object.entries(spellSpec).every(([level, count]) => step.knownSpellIds.filter((id) => spellLevelForClass(spellById.get(id), step.classId, step.archetypeId) === Number(level)).length === count)
      && step.knownSpellIds.every((id) => spellPoolForClass(step.classId, step.archetypeId, spellLevelForClass(spellById.get(id), step.classId, step.archetypeId)).some((spell) => spell.id === id));
    if (!spellsValid) issues.push("已知法术选择不完整或不在职业法表中");
    return issues;
  }

  function currentStepComplete(character, index) {
    const step = character.normalSteps[index];
    if (!step || step.locked) return true;
    return normalStepChoiceIssues(character, index).length === 0;
  }

  function resolvedLevelCursor(character) {
    if (ui.levelCursor !== null) return Math.max(0, Math.min(ui.levelCursor, character.normalSteps.length));
    if (currentCompanion().id === "commander" || character.fullRespec) {
      const incomplete = character.normalSteps.findIndex((step, index) => !step.locked && !currentStepComplete(character, index));
      if (incomplete >= 0) return incomplete;
    }
    return character.normalSteps.length;
  }

  function ensureLevelDraft(character, cursor) {
    const key = `${store.activeSlot}:${character.id}:${cursor}:${character.normalSteps.length}`;
    if (ui.levelDraftKey === key) return;
    const step = character.normalSteps[cursor];
    const prefix = normalPrefix(character, cursor);
    ui.nextClass = step?.classId || classChoices(prefix).find((item) => item.eligible)?.entry.id || "fighter";
    ui.nextArchetype = step?.archetypeId ?? selectedArchetype(prefix, ui.nextClass);
    const slots = featSlotsForStep(prefix, ui.nextClass, ui.nextArchetype);
    const oldFeatChoices = [...(step?.featChoices || [])];
    ui.nextFeatChoices = Object.fromEntries(slots.map((slot, index) => {
      const choice = oldFeatChoices.find((item) => item.slotId === slot.id) || oldFeatChoices[index];
      return [slot.id, choice ? { id: choice.id, params: stableParams(choice.params) } : null];
    }).filter(([, choice]) => choice));
    const featureSlots = featureSlotsForStep(prefix, ui.nextClass, ui.nextArchetype);
    const oldFeatureChoices = [...(step?.featureChoices || [])];
    ui.nextFeatureChoices = Object.fromEntries(featureSlots.map((slot, index) => {
      const choice = oldFeatureChoices.find((item) => item.slotId === slot.id) || oldFeatureChoices[index];
      return [slot.id, choice ? { optionId: choice.optionId, params: stableParams(choice.params) } : null];
    }).filter(([, choice]) => choice));
    ui.nextFeats = Object.values(ui.nextFeatChoices).map((choice) => choice.id);
    const domainSlots = domainSlotsForStep(prefix, ui.nextClass, ui.nextArchetype);
    const oldDomainChoices = [...(step?.domainChoices || [])];
    ui.nextDomainChoices = Object.fromEntries(domainSlots.map((slot, index) => {
      const choice = oldDomainChoices.find((item) => item.slotId === slot.id) || oldDomainChoices[index];
      return [slot.id, choice?.domainId || null];
    }).filter(([, domainId]) => domainId));
    ui.nextDomains = Object.values(ui.nextDomainChoices);
    ui.nextKnownSpells = [...(step?.knownSpellIds || [])];
    ui.nextSkillRanks = sanitizeSkillRanks(step?.skillRanks);
    ui.nextAbilityIncrease = abilityById.has(step?.abilityIncrease) ? step.abilityIncrease : null;
    ui.levelDraftKey = key;
  }

  function renderLevelStage() {
    const character = currentCharacter();
    const cursor = resolvedLevelCursor(character);
    ensureLevelDraft(character, cursor);
    const existing = character.normalSteps[cursor];
    const prefix = normalPrefix(character, cursor);
    const nextLevel = cursor + 1;
    const selectedClass = classById.get(ui.nextClass);
    const classEligible = Boolean(selectedClass && isEligible(selectedClass, prefix));
    const lockedArchetype = selectedArchetype(prefix, ui.nextClass);
    if (lockedArchetype !== null) ui.nextArchetype = lockedArchetype;
    const archetypes = archetypesFor(ui.nextClass);
    const selectedArchetypeEntry = ui.nextArchetype ? archetypeByKey.get(archetypeKey(ui.nextClass, ui.nextArchetype)) : null;
    const archetypeEligible = !selectedArchetypeEntry || isEligible(selectedArchetypeEntry, prefix);
    const candidate = selectedClass ? normalCandidate(prefix, selectedClass.id, ui.nextArchetype, ui.nextAbilityIncrease) : prefix;
    const featSlots = selectedClass ? featSlotsForStep(prefix, selectedClass.id, ui.nextArchetype) : [];
    const featureSlots = selectedClass ? sanitizeFeatureDraft(prefix, selectedClass.id, ui.nextArchetype, ui.nextFeatureChoices) : [];
    const domainSlots = selectedClass ? domainSlotsForStep(prefix, selectedClass.id, ui.nextArchetype) : [];
    const spellSpec = selectedClass ? knownSpellPickSpec(prefix, selectedClass.id, ui.nextArchetype) : {};
    const spellSlotTotal = Object.values(spellSpec).reduce((sum, count) => sum + count, 0);
    const abilityIncreaseRequired = nextLevel % 4 === 0;
    const abilityIncreaseValid = abilityIncreaseRequired ? abilityById.has(ui.nextAbilityIncrease) : !ui.nextAbilityIncrease;
    const ancestryValid = !raceAbilityRequired(character) || abilityById.has(character.raceAbility);
    const selectedFeatChoices = featSlots.map((slot) => ui.nextFeatChoices[slot.id] ? ({ slotId: slot.id, ...ui.nextFeatChoices[slot.id] }) : null).filter(Boolean);
    const selectedDomainSet = new Set(Object.values(ui.nextDomainChoices));
    const selectedSpellSet = new Set(ui.nextKnownSpells);
    const selectedFeatureChoices = featureSlots.map((slot) => ui.nextFeatureChoices[slot.id] ? ({ slotId: slot.id, groupId: slot.groupId, ...ui.nextFeatureChoices[slot.id] }) : null).filter(Boolean);
    const selectedDomainChoices = domainSlots.map((slot) => ui.nextDomainChoices[slot.id] ? ({ slotId: slot.id, source: slot.source, sourceGuid: slot.sourceGuid || null, domainId: ui.nextDomainChoices[slot.id] }) : null).filter(Boolean);
    ui.nextDomains = selectedDomainChoices.map((choice) => choice.domainId);
    const withChoices = (choices) => rebuildCharacter({ ...candidate, normalSteps: candidate.normalSteps.map((step, index) => index === candidate.normalSteps.length - 1 ? { ...step, featChoices: choices, featureChoices: selectedFeatureChoices, skillRanks: sanitizeSkillRanks(ui.nextSkillRanks), domainChoices: selectedDomainChoices, domainIds: [...ui.nextDomains], knownSpellIds: [...ui.nextKnownSpells] } : step), mythicSteps: candidate.mythicSteps.map((step) => ({ ...step, pathPicks: [...step.pathPicks] })), legacyManual: { feats: [...candidate.legacyManual.feats], mythic: [...candidate.legacyManual.mythic] }, legacySkillRanks: sanitizeSkillRanks(candidate.legacySkillRanks) });
    let runningChoices = [];
    const seenChoiceKeys = new Set(prefix.featChoices.map(choiceKey));
    const featValid = featSlots.every((slot) => {
      const choice = ui.nextFeatChoices[slot.id];
      const item = featById.get(choice?.id);
      if (!choice || !item || seenChoiceKeys.has(choiceKey(choice))) return false;
      const beforeChoice = withChoices(runningChoices);
      const valid = featPoolForSlot(slot).some((feat) => feat.id === item.id) && isParameterizedChoiceEligible(item, choice.params, beforeChoice, slot.ignorePrerequisites);
      if (valid) { runningChoices.push({ slotId: slot.id, ...choice }); seenChoiceKeys.add(choiceKey(choice)); }
      return valid;
    });
    const seenFeatures = new Set();
    const runningFeatures = [];
    const featureValid = featureSlots.every((slot) => {
      const choice = ui.nextFeatureChoices[slot.id];
      const key = `${slot.groupId}:${choice?.optionId || ""}`;
      const beforeChoice = withCurrentFeatureChoices(candidate, runningFeatures);
      const valid = Boolean(featureChoiceComplete(slot, choice, beforeChoice) && !seenFeatures.has(key));
      if (valid) {
        seenFeatures.add(key);
        runningFeatures.push({ slotId: slot.id, source: slot.source, groupId: slot.groupId, ...choice });
      }
      return valid;
    });
    const candidateWithFeats = withChoices(selectedFeatChoices);
    const skillBudget = selectedClass ? skillPointBudgetForStep(prefix, candidateWithFeats) : { total: 0, rawTotal: 0, classBase: 0, intelligence: 0, intelligenceModifier: 0, sourceBonus: 0, legacyCredit: 0 };
    const skillSpent = allocatedSkillPoints(ui.nextSkillRanks);
    const skillValid = Boolean(selectedClass && skillRankIssues(prefix, candidateWithFeats, ui.nextSkillRanks).length === 0);
    const candidateSkillProfile = selectedClass ? skillProfile(candidateWithFeats) : [];
    const domainValid = selectedDomainChoices.length === domainSlots.length
      && new Set(selectedDomainChoices.map((choice) => choice.domainId)).size === selectedDomainChoices.length
      && domainSlots.every((slot) => domainsForSlot(prefix, selectedClass?.id, ui.nextArchetype, slot).some((domain) => domain.id === ui.nextDomainChoices[slot.id]));
    const spellValid = ui.nextKnownSpells.length === spellSlotTotal
      && Object.entries(spellSpec).every(([level, count]) => ui.nextKnownSpells.filter((id) => spellLevelForClass(spellById.get(id), selectedClass.id, ui.nextArchetype) === Number(level)).length === count)
      && ui.nextKnownSpells.every((id) => spellPoolForClass(selectedClass.id, ui.nextArchetype, spellLevelForClass(spellById.get(id), selectedClass.id, ui.nextArchetype)).some((spell) => spell.id === id));
    const maxLevel = mythicProjection(character).activePath === "legend" ? 40 : 20;
    const locked = Boolean(existing?.locked && !character.fullRespec);
    const classesHtml = classChoices(prefix).map(({ entry, eligible }) => `<button type="button" class="compact-choice ${ui.nextClass === entry.id ? "selected" : ""}" data-next-class="${entry.id}" ${eligible && !locked ? "" : "disabled"}><span><strong>${escapeHtml(entry.name)}</strong><small>${escapeHtml(entry.role)} · ${escapeHtml(entry.text)}</small></span><span class="choice-state ${eligible ? "valid" : "locked"}">${eligible ? (entry.group === "prestige" ? "进阶可选" : entry.bab === "full" ? "满 BAB" : "可选") : escapeHtml(requirementText(entry, prefix))}</span></button>`).join("");
    const archetypeHtml = selectedClass && selectedClass.group === "base" ? `<section class="level-choice-block"><h3>职业原型 · ${escapeHtml(selectedClass.name)}</h3><label class="select-field"><span>原型一经选择，后续该基类等级沿用同一原型</span><select id="archetype-select" ${locked || lockedArchetype !== null ? "disabled" : ""}><option value="">基础职业（无原型）</option>${archetypes.map((item) => { const eligible = isEligible(item, prefix); return `<option value="${item.id}" ${ui.nextArchetype === item.id ? "selected" : ""} ${!eligible && ui.nextArchetype !== item.id ? "disabled" : ""}>${escapeHtml(item.name)}${eligible ? "" : ` · ${escapeHtml(requirementText(item, prefix))}`}</option>`; }).join("")}</select></label>${ui.nextArchetype ? `<p class="choice-note">${escapeHtml(archetypeByKey.get(archetypeKey(selectedClass.id, ui.nextArchetype))?.text || "该原型替换基类的部分职业能力。")}</p>` : ""}</section>` : "";
    const abilityIncreaseHtml = abilityIncreaseRequired ? `<section class="level-choice-block"><h3>本级属性成长 · 必选 +1</h3><label class="select-field"><span>角色等级 ${nextLevel} 的永久属性提升</span><select data-ability-increase ${locked ? "disabled" : ""}><option value="">请选择</option>${DATA.abilities.filter((ability) => !(currentCompanion().path === "lich" && ability.id === "con")).map((ability) => `<option value="${ability.id}" ${ui.nextAbilityIncrease === ability.id ? "selected" : ""}>${escapeHtml(ability.name)}（${ability.short}）</option>`).join("")}</select></label><p class="choice-note">该提升先于本级专长前置校验生效，并随本级记录一起回退。</p></section>` : "";
    const skillsHtml = selectedClass ? `<section class="level-choice-block skill-level-block"><h3>本级技能点 · ${skillSpent}/${skillBudget.total}</h3><p class="choice-note">${escapeHtml(selectedClass.name)}基础 ${skillBudget.classBase} + 智力 ${skillBudget.intelligence}（${signed(skillBudget.intelligenceModifier)}）${skillBudget.sourceBonus ? ` + 特性补发 ${skillBudget.sourceBonus}` : ""}${skillBudget.legacyCredit ? ` − 旧存档已分配 ${skillBudget.legacyCredit}` : ""}；基础与智力合计最低为 1。技能级数不能超过人物等级。</p><div class="skill-grid">${candidateSkillProfile.map((skill) => { const current = ui.nextSkillRanks[skill.id] || 0; const prior = prefix.skills?.[skill.id] || 0; const atRankCap = prior + current >= nextLevel; return `<div class="skill-row level-skill-row"><span><strong>${escapeHtml(skill.name)}</strong><small>${escapeHtml(abilityById.get(skill.abilityId)?.short || skill.abilityId)}${skill.classSkill ? " · 本职" : ""} · 总值 ${signed(skill.total)}</small></span><button type="button" data-next-skill="${skill.id}" data-delta="-1" ${locked || current <= 0 ? "disabled" : ""}>−</button><output title="本级投入 / 当前总级数">${current}<small>${prior + current} 级</small></output><button type="button" data-next-skill="${skill.id}" data-delta="1" ${locked || skillSpent >= skillBudget.total || atRankCap ? "disabled" : ""}>＋</button></div>`; }).join("")}</div></section>` : "";
    const featsHtml = featSlots.length ? featSlots.map((slot, slotIndex) => {
      const choice = ui.nextFeatChoices[slot.id];
      const item = featById.get(choice?.id);
      const priorDraft = withChoices(featSlots.slice(0, slotIndex).map((priorSlot) => ui.nextFeatChoices[priorSlot.id] ? ({ slotId: priorSlot.id, ...ui.nextFeatChoices[priorSlot.id] }) : null).filter(Boolean));
      const options = featPoolForSlot(slot);
      return `<div class="slot-card"><div class="slot-source"><span>${escapeHtml(slot.label)}</span><small>${escapeHtml(slot.source)}</small></div><label class="select-field"><span>选择专长</span><select data-feat-slot="${slot.id}" ${locked ? "disabled" : ""}><option value="">请选择</option>${options.map((feat) => { const ownedExact = priorDraft.featChoices.some((owned) => owned.id === feat.id && (!feat.parameter || choiceKey(owned) === choiceKey({ id: feat.id, params: choice?.params || {} }))); const eligible = slot.ignorePrerequisites || isEligible(feat, priorDraft); return `<option value="${feat.id}" ${choice?.id === feat.id ? "selected" : ""} ${ownedExact || (!eligible && choice?.id !== feat.id) ? "disabled" : ""}>${escapeHtml(feat.name)} · ${escapeHtml(feat.category)}</option>`; }).join("")}</select></label>${item ? `${parameterControl(item, choice.params, slot.id)}<p class="choice-note">${escapeHtml(item.text)} · ${escapeHtml(isParameterizedChoiceEligible(item, choice.params, priorDraft, slot.ignorePrerequisites) ? "前置满足" : requirementText(item, priorDraft))}</p>` : ""}</div>`;
    }).join("") : `<div class="compact-choice" aria-disabled="true"><span><strong>本级没有专长选择槽</strong><small>槽位由角色等级、种族、职业与原型共同生成。</small></span><span class="choice-state">LV ${nextLevel}</span></div>`;
    const featuresHtml = featureSlots.length ? `<section class="level-choice-block"><h3>职业特性选择 · ${selectedFeatureChoices.length}/${featureSlots.length}</h3><div class="slot-list">${featureSlots.map((slot, slotIndex) => { const choice = ui.nextFeatureChoices[slot.id]; const options = DATA.featureGroups?.[slot.groupId]?.options || []; const selectedOption = options.find((option) => option.id === choice?.optionId); const priorChoices = featureSlots.slice(0, slotIndex).map((priorSlot) => ui.nextFeatureChoices[priorSlot.id] ? ({ slotId: priorSlot.id, source: priorSlot.source, groupId: priorSlot.groupId, ...ui.nextFeatureChoices[priorSlot.id] }) : null).filter(Boolean); const priorDraft = withCurrentFeatureChoices(candidate, priorChoices); return `<div class="slot-card"><div class="slot-source"><span>${escapeHtml(slot.label)}</span><small>${escapeHtml(slot.source)}</small></div><label class="select-field"><span>${escapeHtml(DATA.featureGroups?.[slot.groupId]?.name || "职业选项")}</span><select data-feature-slot="${slot.id}" ${locked ? "disabled" : ""}><option value="">请选择</option>${options.map((option) => `<option value="${escapeHtml(option.id)}" ${choice?.optionId === option.id ? "selected" : ""} ${!itemRequirementsMet(option, priorDraft) && choice?.optionId !== option.id ? "disabled" : ""}>${escapeHtml(option.name)}</option>`).join("")}</select></label>${selectedOption?.parameter ? parameterControl(selectedOption, choice.params || {}, slot.id, "feature-option", locked) : ""}${featureNestedControl(slot, choice, locked, priorDraft)}${choice ? `<p class="choice-note">${escapeHtml(selectedOption?.text || "")}</p>` : ""}</div>`; }).join("")}</div></section>` : "";
    const domainsHtml = domainSlots.length ? `<section class="level-choice-block"><h3>领域选择 · ${selectedDomainChoices.length}/${domainSlots.length}</h3>${character.deity ? "" : `<p class="choice-note">请先在“阵营 / 信仰”步骤选择神祇。</p>`}<div class="slot-list">${domainSlots.map((slot) => { const selectedId = ui.nextDomainChoices[slot.id]; const selected = domainById.get(selectedId); const options = domainsForSlot(prefix, selectedClass.id, ui.nextArchetype, slot); return `<div class="slot-card"><div class="slot-source"><span>${escapeHtml(slot.label)}</span><small>${escapeHtml(slot.source)} · ${escapeHtml(slot.sourceGuid || "legacy")}</small></div><label class="select-field"><span>选择领域</span><select data-domain-slot="${slot.id}" ${locked ? "disabled" : ""}><option value="">请选择</option>${options.map((domain) => `<option value="${domain.id}" ${selectedId === domain.id ? "selected" : ""} ${selectedDomainSet.has(domain.id) && selectedId !== domain.id ? "disabled" : ""}>${escapeHtml(domain.name)}</option>`).join("")}</select></label>${selected ? `<p class="choice-note">${escapeHtml(selected.levelFeatures?.map((feature) => `${feature.level}级 ${feature.name}`).join(" · ") || selected.basic)} · ${escapeHtml(selected.domainSpells?.map((spell) => `${spell.level}环 ${spell.name}`).join("、") || `${selected.greaterLevel}级：${selected.greater}`)}</p>` : ""}</div>`; }).join("")}</div></section>` : "";
    const casting = selectedClass ? classCastingRule(selectedClass.id, ui.nextArchetype) : {};
    const spellsHtml = spellSlotTotal ? `<section class="level-choice-block"><h3>自发施法 · 本级新增 ${spellSlotTotal} 个已知法术</h3>${Object.entries(spellSpec).map(([level, count]) => `<div class="spell-level-group"><h4>${level} 环 · ${ui.nextKnownSpells.filter((id) => spellLevelForClass(spellById.get(id), selectedClass.id, ui.nextArchetype) === Number(level)).length}/${count}</h4><div class="option-tile-grid">${spellPoolForClass(selectedClass.id, ui.nextArchetype, Number(level)).map((spell) => { const picked = selectedSpellSet.has(spell.id); const ringFull = ui.nextKnownSpells.filter((id) => spellLevelForClass(spellById.get(id), selectedClass.id, ui.nextArchetype) === Number(level)).length >= count; return `<button type="button" class="option-tile ${picked ? "selected" : ""}" data-next-spell="${spell.id}" ${(!picked && ringFull) || locked ? "disabled" : ""}><strong>${escapeHtml(spell.name)}</strong><small>${escapeHtml(spell.text)}</small></button>`; }).join("")}</div></div>`).join("")}</section>` : selectedClass && casting.spontaneous ? `<section class="level-choice-block"><h3>自发施法</h3><p class="choice-note">本级已知法术总量没有增加；自动授予的血脉、秘示域与诅咒法术不消耗自由选择槽。</p></section>` : "";
    const timeline = `<div class="build-timeline" aria-label="普通等级时间线">${character.normalSteps.map((step, index) => `<button type="button" class="timeline-step ${cursor === index ? "active" : ""} ${step.locked ? "preset" : ""}" data-level-cursor="${index}"><span>LV ${index + 1}</span><strong>${escapeHtml(classLabel(step.classId))}</strong><small>${escapeHtml(step.archetypeId ? archetypeByKey.get(archetypeKey(step.classId, step.archetypeId))?.name || step.archetypeId : "基础职业")}</small></button>`).join("")}<button type="button" class="timeline-step add ${cursor === character.normalSteps.length ? "active" : ""}" data-level-cursor="next" ${character.normalSteps.length >= maxLevel ? "disabled" : ""}><span>＋</span><strong>下一等级</strong><small>LV ${character.normalSteps.length + 1}</small></button></div>`;
    elements.workspace.innerHTML = `${workspaceHead("CHARACTER LEVEL / EDITABLE HISTORY", `${existing ? "检查 / 编辑" : "规划"} ${nextLevel} 级`, "每一级保存职业、原型、属性成长、专长、领域与已知法术。点击时间线可切换任意级，修改后会重新校验后续等级。")}${timeline}
      <div class="level-console"><div class="level-column"><section class="level-choice-block"><h3>选择职业</h3><div class="compact-choice-list">${classesHtml}</div></section>${archetypeHtml}${abilityIncreaseHtml}${featuresHtml}<section class="level-choice-block"><h3>本级专长 · ${selectedFeatChoices.length}/${featSlots.length}</h3><div class="slot-list">${featsHtml}</div></section>${skillsHtml}${domainsHtml}${spellsHtml}</div>
      <aside class="level-review"><span class="choice-code">LEVEL ${nextLevel} REVIEW</span><h3>${escapeHtml(selectedClass?.name || "尚未选择职业")}${ui.nextArchetype ? ` · ${escapeHtml(archetypeByKey.get(archetypeKey(ui.nextClass, ui.nextArchetype))?.name || ui.nextArchetype)}` : ""}</h3><dl><div><dt>级前快照</dt><dd>LV ${characterLevel(prefix)} · BAB +${baseAttack(prefix)}</dd></div><div><dt>本级完成后</dt><dd>LV ${nextLevel} · BAB +${baseAttack(candidate)}</dd></div><div><dt>属性成长</dt><dd>${ui.nextAbilityIncrease ? `${abilityById.get(ui.nextAbilityIncrease)?.name} +1` : abilityIncreaseRequired ? "尚未选择" : "无"}</dd></div><div><dt>技能点</dt><dd>${skillSpent}/${skillBudget.total}</dd></div><div><dt>专长槽</dt><dd>${selectedFeatChoices.map((choice) => parameterLabel(featById.get(choice.id), choice.params)).filter(Boolean).join("、") || "无"}</dd></div><div><dt>职业选择</dt><dd>${selectedFeatureChoices.map(featureChoiceLabel).join("、") || "无"}</dd></div><div><dt>领域</dt><dd>${selectedDomainChoices.map((choice) => domainById.get(choice.domainId)?.name).join("、") || "无"}</dd></div><div><dt>已知法术</dt><dd>${ui.nextKnownSpells.map((id) => spellById.get(id)?.name).join("、") || "无新增"}</dd></div><div><dt>职业条件</dt><dd>${escapeHtml(selectedClass ? requirementText(selectedClass, prefix) : "请选择职业")}</dd></div></dl>
      ${locked ? `<p class="choice-note">这是原版入队前缀。开启“完全洗点”后才可改写。</p>` : `<button class="commit-level" type="button" data-commit-level ${ancestryValid && classEligible && archetypeEligible && abilityIncreaseValid && skillValid && featValid && featureValid && domainValid && spellValid && nextLevel <= maxLevel ? "" : "disabled"}>${existing ? `保存第 ${nextLevel} 级修改` : `确认升至 ${nextLevel} 级`}</button>`}
      <button class="rollback-level" type="button" data-truncate-level="${nextLevel}" ${cursor >= character.normalSteps.length - 1 || locked ? "disabled" : ""}>回退到此级（移除后续）</button>
      <button class="rollback-level" type="button" data-rollback-level ${character.normalSteps.length <= (currentCompanion().id === "commander" || character.fullRespec ? 1 : currentCompanion().level) ? "disabled" : ""}>撤销最后一级</button></aside></div>`;
  }

  function mythicPrefix(character, count) {
    return rebuildCharacter({ ...character, normalSteps: character.normalSteps.map((step) => ({ ...step, featChoices: step.featChoices.map((choice) => ({ ...choice, params: stableParams(choice.params) })), featureChoices: step.featureChoices.map((choice) => ({ ...choice, params: stableParams(choice.params) })), domainChoices: (step.domainChoices || []).map((choice) => ({ ...choice })), featIds: [...step.featIds], domainIds: [...step.domainIds], knownSpellIds: [...step.knownSpellIds] })), mythicSteps: character.mythicSteps.slice(0, count).map((step) => ({ ...step, commonChoice: step.commonChoice ? { ...step.commonChoice, params: stableParams(step.commonChoice.params) } : null, pathPicks: [...step.pathPicks] })), legacyManual: { feats: [...character.legacyManual.feats], mythic: [...character.legacyManual.mythic] } });
  }

  function ensureMythicDraft(character, cursor) {
    const key = `${store.activeSlot}:${character.id}:${cursor}:${character.mythicSteps.length}`;
    if (ui.mythicDraftKey === key) return;
    const step = character.mythicSteps[cursor];
    const prefix = mythicPrefix(character, cursor);
    const currentPath = mythicProjection(prefix).activePath;
    ui.nextMythic = step?.commonChoice?.id || step?.commonChoiceId || null;
    ui.nextMythicParams = stableParams(step?.commonChoice?.params || {});
    ui.nextPath = step?.pathId || currentPath || (cursor + 1 === 3 ? character.plannedPath : cursor + 1 === 8 ? character.plannedLatePath : null);
    const pendingChoices = (step?.pathChoices || []).map((choice) => ({ ...choice, params: stableParams(choice.params || {}) }));
    const usedChoices = new Set();
    ui.nextPathChoices = Object.fromEntries(pathPickSlots(ui.nextPath, cursor + 1).map((slot) => {
      const exactIndex = pendingChoices.findIndex((choice, index) => !usedChoices.has(index) && choice.slotId === slot.id);
      const compatibleIndex = exactIndex >= 0 ? exactIndex : pendingChoices.findIndex((choice, index) => {
        if (usedChoices.has(index)) return false;
        const groupId = choice.optionId.startsWith("dragon-feat:") ? "dragon-feat" : pathAbilityById.get(choice.optionId)?.group;
        return groupId === slot.groupId;
      });
      if (compatibleIndex < 0) return null;
      usedChoices.add(compatibleIndex);
      const choice = pendingChoices[compatibleIndex];
      return [slot.id, { optionId: choice.optionId, params: stableParams(choice.params || {}) }];
    }).filter(Boolean));
    ui.nextPathPicks = Object.values(ui.nextPathChoices).map((choice) => choice.optionId);
    ui.mythicDraftKey = key;
  }

  function pathChoicesAtRank(rank, currentPath) {
    if (rank === 3) return DATA.paths.filter((path) => DATA.mythicPathRules?.[path.id]?.kind === "early");
    if (rank !== 8 || !currentPath) return [];
    return [pathById.get(currentPath), ...DATA.paths.filter((path) => {
      const rule = DATA.mythicPathRules?.[path.id];
      return rule?.kind === "late" && rule.transition?.from?.includes(currentPath);
    })].filter(Boolean);
  }

  function pathStoryRequirementResults(path, character = currentCharacter()) {
    const nativeRequirements = (path?.nativeRequirements || []).filter((requirement) => componentType(requirement) === "PrerequisiteEtude"
      || (componentType(requirement) === "PrerequisiteCondition" && !requirement.HideInUI && requirement.Group !== "ForcedTrue"));
    return nativeRequirementResults({ nativeRequirements }, character);
  }

  function pathStoryEligible(path, character = currentCharacter()) {
    return nativeResultsMet(pathStoryRequirementResults(path, character));
  }

  function positiveStoryEtudes(path) {
    const result = new Set();
    (path?.nativeRequirements || []).filter((requirement) => componentType(requirement) === "PrerequisiteEtude" && !requirement.NotPlaying).forEach((requirement) => {
      const guid = nativeGuid(requirement.Etude || requirement.m_Etude);
      if (guid) result.add(guid);
    });
    if (result.size || path?.id !== "legend") return [...result];
    const visit = (value) => {
      if (!value || typeof value !== "object") return;
      const type = componentType(value);
      if (type === "EtudeStatus" && value.Playing && !value.Not) {
        const guid = nativeGuid(value.m_Etude || value.Etude);
        if (guid) result.add(guid);
      }
      if (Array.isArray(value)) value.forEach(visit);
      else Object.values(value).forEach(visit);
    };
    (path?.nativeRequirements || []).filter((requirement) => componentType(requirement) === "PrerequisiteCondition" && requirement.Group !== "ForcedTrue").forEach(visit);
    return [...result];
  }

  function pathPickSlots(pathId, rank) {
    return (DATA.mythicPathRules?.[pathId]?.steps?.[rank] || []).flatMap((raw, groupIndex) => {
      const definition = Array.isArray(raw) ? { groupId: raw[0], count: raw[1] } : { ...raw, groupId: raw.groupId || raw.group };
      return Array.from({ length: definition.count || 1 }, (_, slotIndex) => ({
        id: definition.id ? `${definition.id}:${slotIndex + 1}` : `path:${rank}:${definition.groupId}:${slotIndex + 1}`,
        kind: definition.kind || (definition.groupId === "dragon-feat" ? "feat" : "pathAbility"),
        groupId: definition.groupId,
        label: definition.label || definition.groupId.replaceAll("-", " ").toUpperCase(),
        source: definition.source || `mythic:path:${pathId}`,
        sourceGuid: definition.sourceGuid || null,
        nativeRequirements: definition.nativeRequirements || [],
        ignorePrerequisites: Boolean(definition.ignorePrerequisites),
        order: groupIndex * 100 + slotIndex
      }));
    });
  }

  function proposedPathSourceGuids(prefix, pathId, rank, choicesBySlot = {}, excludedSlotId = null) {
    const result = new Set(ownedSourceGuids(prefix));
    addPathAutoSourceFacts(pathId, rank, result);
    Object.entries(choicesBySlot || {}).forEach(([slotId, choice]) => {
      if (slotId !== excludedSlotId) addPathChoiceSourceFacts(choice, result);
    });
    return closeSourceFacts(result);
  }

  function nativeResultsMet(results) {
    const all = results.filter((result) => result.group !== "any");
    const any = results.filter((result) => result.group === "any");
    return all.every((result) => result.met) && (!any.length || any.some((result) => result.met));
  }

  function pathSlotIsActive(prefix, pathId, rank, slot, choicesBySlot = {}) {
    if (!slot.nativeRequirements.length) return true;
    const owned = proposedPathSourceGuids(prefix, pathId, rank, choicesBySlot, slot.id);
    return nativeResultsMet(nativeRequirementResults({ nativeRequirements: slot.nativeRequirements }, prefix, owned));
  }

  function activePathPickSlots(prefix, pathId, rank, choicesBySlot = {}) {
    return pathPickSlots(pathId, rank).filter((slot) => pathSlotIsActive(prefix, pathId, rank, slot, choicesBySlot));
  }

  function pathOptionIsEligible(prefix, pathId, rank, slot, option, choicesBySlot = {}) {
    if (slot.ignorePrerequisites) return true;
    if (option.requiresSpellbookGuid && !(DATA.owlcatCharacterSpellbooks?.(prefix) || []).some((entry) => entry.spellbookGuid === option.requiresSpellbookGuid)) return false;
    const owned = proposedPathSourceGuids(prefix, pathId, rank, choicesBySlot, slot.id);
    return nativeResultsMet(nativeRequirementResults(option, prefix, owned));
  }

  function sanitizePathDraft(prefix, pathId, rank, choicesBySlot) {
    let active = activePathPickSlots(prefix, pathId, rank, choicesBySlot);
    Object.keys(choicesBySlot).filter((slotId) => !active.some((slot) => slot.id === slotId)).forEach((slotId) => delete choicesBySlot[slotId]);
    active = activePathPickSlots(prefix, pathId, rank, choicesBySlot);
    return active;
  }

  function pathChoiceItem(slot, choice) {
    if (!slot || !choice) return null;
    return slot.kind === "feat" ? featById.get(String(choice.optionId || "").replace(/^dragon-feat:/, "")) : pathAbilityById.get(choice.optionId);
  }

  function pathOptionsForSlot(pathId, rank, slot) {
    if (slot.kind === "feat") return DATA.feats.filter((feat) => feat.sourceVerified).map((feat) => ({ ...feat, optionId: `dragon-feat:${feat.id}` }));
    return DATA.pathAbilities.filter((item) => item.path === pathId && item.group === slot.groupId && (!item.minRank || rank >= item.minRank)).map((item) => ({ ...item, optionId: item.id }));
  }

  function pathChoiceIssues(prefix, pathId, rank, choicesBySlot) {
    const rawSlots = pathPickSlots(pathId, rank);
    const slots = activePathPickSlots(prefix, pathId, rank, choicesBySlot);
    const issues = [];
    const ownedIds = new Set(mythicProjection(prefix).activePathPicks);
    const ownedKeys = new Set((mythicProjection(prefix).activePathChoiceRecords || []).map((choice) => choiceKey({ id: choice.optionId, params: choice.params })));
    const ownedSourceIds = ownedSourceGuids(prefix);
    const selectedIds = new Set();
    const selectedKeys = new Set();
    const selectedSourceIds = new Set();
    slots.forEach((slot) => {
      const choice = choicesBySlot[slot.id];
      if (!choice) { issues.push(`${slot.label}尚未选择`); return; }
      const options = pathOptionsForSlot(pathId, rank, slot);
      const option = options.find((item) => item.optionId === choice.optionId);
      const item = pathChoiceItem(slot, choice);
      if (!option || !item) { issues.push(`${slot.label}包含无效选项`); return; }
      const key = choiceKey({ id: choice.optionId, params: choice.params || {} });
      const choiceSourceIds = new Set();
      if (item.sourceGuid) choiceSourceIds.add(item.sourceGuid);
      addGuidValues(choice.params || {}, choiceSourceIds);
      if ([...choiceSourceIds].some((guid) => ownedSourceIds.has(guid) || selectedSourceIds.has(guid))) issues.push(`${item.name}：该来源选项已经取得`);
      if (ownedKeys.has(key) || selectedKeys.has(key) || (!item.parameter && (ownedIds.has(choice.optionId) || selectedIds.has(choice.optionId)))) issues.push(`${item.name}已经取得`);
      if (!parameterComplete(item, choice.params || {})) issues.push(`${item.name}缺少有效细分选项`);
      if (slot.kind !== "feat" && !(item.requires || []).every((id) => ownedIds.has(id) || selectedIds.has(id))) issues.push(`${item.name}的前置道途能力未满足`);
      if (!pathOptionIsEligible(prefix, pathId, rank, slot, item, choicesBySlot)) issues.push(`${item.name}：游戏原生前置条件未满足`);
      selectedIds.add(choice.optionId);
      selectedKeys.add(key);
      choiceSourceIds.forEach((guid) => selectedSourceIds.add(guid));
    });
    Object.keys(choicesBySlot).filter((slotId) => !slots.some((slot) => slot.id === slotId)).forEach((slotId) => issues.push(`存在失效的道途选择槽 ${slotId}`));
    return issues;
  }

  function renderMythicStage() {
    const character = currentCharacter();
    const cursor = ui.mythicCursor === null ? character.mythicSteps.length : Math.max(0, Math.min(ui.mythicCursor, character.mythicSteps.length));
    ensureMythicDraft(character, cursor);
    const existing = character.mythicSteps[cursor];
    const prefix = mythicPrefix(character, cursor);
    const prefixProjection = mythicProjection(prefix);
    const rank = cursor + 1;
    const commander = currentCompanion().id === "commander";
    const isAbilityRank = rank % 2 === 1;
    const pool = DATA.mythic.filter((item) => item.sourceVerified && item.type === (isAbilityRank ? "ability" : "feat"));
    const pathOptions = commander ? pathChoicesAtRank(rank, prefixProjection.activePath) : [];
    const positiveStoryRequirements = [...new Map(pathOptions.flatMap((path) => positiveStoryEtudes(path).map((guid) => [guid, { guid }]))).values()];
    if (rank !== 3 && rank !== 8) ui.nextPath = prefixProjection.activePath;
    if (rank === 8 && !ui.nextPath) ui.nextPath = prefixProjection.activePath;
    const selectedPathRule = DATA.mythicPathRules?.[ui.nextPath];
    const isLegendTransition = rank === 8 && ui.nextPath === "legend" && ui.nextPath !== prefixProjection.activePath;
    const commonRequired = !isLegendTransition;
    const selected = mythicById.get(ui.nextMythic);
    const selectedRecord = selected ? { id: selected.id, params: ui.nextMythicParams } : null;
    const ownedSelected = selected && (selected.parameter ? prefix.effectiveMythicChoiceRecords.some((choice) => choiceKey(choice) === choiceKey(selectedRecord)) : prefix.mythicChoices.includes(selected.id));
    const commonEligible = !commonRequired || Boolean(selected && !ownedSelected && isParameterizedChoiceEligible(selected, ui.nextMythicParams, prefix, false, "mythic"));
    const slots = commander && ui.nextPath ? sanitizePathDraft(prefix, ui.nextPath, rank, ui.nextPathChoices) : [];
    const pathIssues = commander && ui.nextPath ? pathChoiceIssues(prefix, ui.nextPath, rank, ui.nextPathChoices) : [];
    const slotsValid = pathIssues.length === 0;
    const selectedPath = pathById.get(ui.nextPath);
    const selectedStoryValid = !selectedPath || (rank === 8 && ui.nextPath === prefixProjection.activePath) || pathStoryEligible(selectedPath, prefix);
    const pathValid = !commander || rank < 3 || ((rank === 3 ? selectedPathRule?.kind === "early" : rank === 8 ? Boolean(ui.nextPath) : Boolean(prefixProjection.activePath)) && selectedStoryValid);
    const canCommit = rank <= 10 && commonEligible && slotsValid && pathValid;
    const pathTimelineName = (step, index) => {
      const before = mythicPrefix(character, index + 1);
      return pathById.get(mythicProjection(before).activePath)?.name || "通用";
    };
    const timeline = `<div class="build-timeline mythic-timeline" aria-label="神话阶时间线">${character.mythicSteps.map((step, index) => { const choice = step.commonChoice || (step.commonChoiceId ? { id: step.commonChoiceId, params: {} } : null); return `<button type="button" class="timeline-step ${cursor === index ? "active" : ""}" data-mythic-cursor="${index}"><span>MR ${index + 1}</span><strong>${escapeHtml(choice ? parameterLabel(mythicById.get(choice.id), choice.params) : ((index + 1) % 2 ? "神话能力" : "神话专长"))}</strong><small>${escapeHtml(pathTimelineName(step, index))}</small></button>`; }).join("")}<button type="button" class="timeline-step add ${cursor === character.mythicSteps.length ? "active" : ""}" data-mythic-cursor="next" ${character.mythicSteps.length >= 10 || prefixProjection.activePath === "legend" ? "disabled" : ""}><span>＋</span><strong>下一神话阶</strong><small>MR ${character.mythicSteps.length + 1}</small></button></div>`;
    const storyStateHtml = positiveStoryRequirements.length ? `<section class="mythic-path-chooser story-state-chooser"><h3>剧情解锁状态 · 当前存档</h3><p class="choice-note">这些开关对应 2.7.0x PrerequisiteEtude / EtudeStatus；只记录本构筑假定已在游戏中激活的剧情标记。</p><div class="path-choice-grid">${positiveStoryRequirements.map(({ guid }) => `<button type="button" class="path-choice ${storyStatus(guid) === "playing" ? "selected" : ""}" data-story-etude="${guid}"><strong>${escapeHtml(etudeLabel(guid))}</strong><small>${storyStatus(guid) === "playing" ? "已激活" : "未激活"}</small><p>${escapeHtml(pathOptions.filter((path) => positiveStoryEtudes(path).includes(guid)).map((path) => path.name).join("、"))}解锁条件</p></button>`).join("")}</div></section>` : "";
    const pathChooser = pathOptions.length ? `${storyStateHtml}<section class="mythic-path-chooser"><h3>${rank === 3 ? "选择前期主道途" : "保留原道途或转入八阶后期道途"}</h3><div class="path-choice-grid">${pathOptions.map((path) => { const rule = DATA.mythicPathRules[path.id]; const storyEligible = (rank === 8 && path.id === prefixProjection.activePath) || pathStoryEligible(path, prefix); const storyText = pathStoryRequirementResults(path, prefix).filter((result) => !result.met).map((result) => result.text).join("；"); return `<button type="button" class="path-choice ${ui.nextPath === path.id ? "selected" : ""}" data-next-path="${path.id}" ${storyEligible ? "" : "disabled"}><strong>${escapeHtml(path.name)}</strong><small>${escapeHtml(storyEligible ? path.stage : "剧情条件不足")}</small><p>${escapeHtml(storyText || (rule.transition ? `${rule.transition.retain} ${rule.transition.lose}` : path.text))}</p></button>`; }).join("")}</div></section>` : "";
    const genericHtml = commonRequired ? `<section><h3>神话 ${rank} 阶 · 选择${isAbilityRank ? "神话能力" : "神话专长"}</h3><div class="mythic-pick-grid">${pool.map((item) => { const owned = !item.parameter && prefix.mythicChoices.includes(item.id); const eligible = !owned && isEligible(item, prefix); return `<button type="button" class="mythic-pick ${ui.nextMythic === item.id ? "selected" : ""}" data-next-mythic="${item.id}" ${eligible ? "" : "disabled"}><strong>${escapeHtml(item.name)}</strong><p>${escapeHtml(owned ? "此前已掌握" : eligible ? item.text : requirementText(item, prefix))}</p></button>`; }).join("")}</div>${selected ? `<div class="slot-card mythic-parameter">${parameterControl(selected, ui.nextMythicParams, `mythic:${rank}`, "mythic")}<p class="choice-note">${escapeHtml(parameterLabel(selected, ui.nextMythicParams))}</p></div>` : ""}</section>` : `<section class="transition-notice"><h3>凡人传奇净化</h3><p>本阶不锁定新的通用神话选择；完成转化后只保留神话 1—2 阶通用选择。</p></section>`;
    const priorPathIds = new Set(prefixProjection.activePathPicks);
    const pathPicksHtml = slots.map((slot, slotIndex) => {
      const choice = ui.nextPathChoices[slot.id];
      const selectedBefore = new Set(slots.slice(0, slotIndex).map((priorSlot) => ui.nextPathChoices[priorSlot.id]?.optionId).filter(Boolean));
      const options = pathOptionsForSlot(ui.nextPath, rank, slot).filter((option) => choice?.optionId === option.optionId || pathOptionIsEligible(prefix, ui.nextPath, rank, slot, option, ui.nextPathChoices));
      const item = pathChoiceItem(slot, choice);
      return `<section class="path-pick-section"><h3>${escapeHtml(slot.label)} · 槽位 ${slotIndex + 1}/${slots.length}</h3><div class="slot-card"><div class="slot-source"><span>${escapeHtml(slot.label)}</span><small>${escapeHtml(slot.source)}</small></div><label class="select-field"><span>选择道途能力</span><select data-path-slot="${escapeHtml(slot.id)}"><option value="">请选择</option>${options.map((option) => { const selectedOption = choice?.optionId === option.optionId; const duplicate = !option.parameter && (priorPathIds.has(option.optionId) || selectedBefore.has(option.optionId)); const reqMet = slot.kind === "feat" || (option.requires || []).every((id) => priorPathIds.has(id) || selectedBefore.has(id)); return `<option value="${escapeHtml(option.optionId)}" ${selectedOption ? "selected" : ""} ${!selectedOption && (duplicate || !reqMet) ? "disabled" : ""}>${escapeHtml(option.name)}</option>`; }).join("")}</select></label>${item ? `${parameterControl(item, choice.params || {}, slot.id, "path")}<p class="choice-note">${escapeHtml(item.text || (slot.kind === "feat" ? "金龙专长：忽略普通前置条件。" : ""))}</p>` : ""}</div></section>`;
    }).join("");
    const transition = rank === 8 && ui.nextPath && ui.nextPath !== prefixProjection.activePath ? selectedPathRule?.transition : null;
    elements.workspace.innerHTML = `${workspaceHead("MYTHIC ASCENSION / EDITABLE HISTORY", `神话 ${rank} 阶${existing ? " · 检查 / 编辑" : ""}`, commander ? "三阶选择主道途；八阶可保留原道途或转入满足条件的后期道途。所有保留与失去均由时间线重放。" : "队友只选择通用神话能力与专长。")}${timeline}${pathChooser}
      ${transition ? `<div class="transition-notice"><strong>${escapeHtml(pathById.get(prefixProjection.activePath)?.name)} → ${escapeHtml(pathById.get(ui.nextPath)?.name)}</strong><p><b>保留：</b>${escapeHtml(transition.retain)}</p><p><b>失去：</b>${escapeHtml(transition.lose)}</p></div>` : ""}
      <div class="mythic-console"><aside class="mythic-rank-card"><span class="choice-code">MYTHIC RANK</span><strong>${rank}</strong><div class="rank-dots">${Array.from({ length: 10 }, (_, index) => `<span class="${index < rank ? "filled" : ""}"></span>`).join("")}</div><p>${ui.nextPath ? `本阶道途：${escapeHtml(pathById.get(ui.nextPath)?.name)}` : commander ? "尚未选择神话道途" : "神话同伴通用进度"}</p>${selectedPathRule ? `<div class="path-grants"><small>截至本阶自动获得</small>${pathGrantsThrough(ui.nextPath, rank).map((grant) => `<span>${escapeHtml(grant)}</span>`).join("")}</div>` : ""}<button class="detail-action" type="button" data-open-paths>查看道途百科</button></aside>
      <div class="mythic-selection">${genericHtml}${pathPicksHtml}${pathIssues.length ? `<ul class="validation-list">${pathIssues.map((issue) => `<li class="warn">${escapeHtml(issue)}</li>`).join("")}</ul>` : ""}<button class="mythic-commit" type="button" data-commit-mythic ${canCommit ? "" : "disabled"}>${existing ? `保存神话 ${rank} 阶修改` : `确认神话 ${rank} 阶`}</button><button class="rollback-level" type="button" data-truncate-mythic="${rank}" ${cursor >= character.mythicSteps.length - 1 ? "disabled" : ""}>回退到此阶（移除后续）</button></div></div>`;
  }

  function renderWorkspace() {
    renderCreationSteps();
    if (ui.stage === "race") renderRaceStage();
    else if (ui.stage === "background") renderBackgroundStage();
    else if (ui.stage === "faith") renderFaithStage();
    else if (ui.stage === "attributes") renderAttributeStage();
    else if (ui.stage === "level") renderLevelStage();
    else renderMythicStage();
  }

  function abilityMod(character, id) {
    const score = Number(effectiveAttributes(character)[id]) || 0;
    return score === 0 ? 0 : Math.floor((score - 10) / 2);
  }

  function signed(value) { return `${value >= 0 ? "+" : ""}${value}`; }

  function saveBase(character, save) {
    return Object.entries(classCounts(character)).reduce((sum, [id, level]) => {
      const native = DATA.owlcatClassStatBonus?.(id, save, level);
      if (native !== null && native !== undefined) return sum + native;
      const good = classById.get(id)?.goodSaves?.includes(save);
      return sum + (good ? 2 + Math.floor(level / 2) : Math.floor(level / 3));
    }, 0);
  }

  function overallStats(character) {
    const level = characterLevel(character);
    const sourceProfile = characterEffectProfile(character);
    const attributes = effectiveAttributes(character, sourceProfile);
    const mod = (id) => attributes[id] === 0 ? 0 : Math.floor((attributes[id] - 10) / 2);
    const str = mod("str");
    const dex = mod("dex");
    const con = companionById.get(character.id)?.path === "lich" ? mod("cha") : mod("con");
    const bab = baseAttack(character);
    const hpDice = character.normalSteps.reduce((sum, step, index) => {
      const die = classById.get(step.classId)?.hitDie || 8;
      return sum + (index === 0 ? die : Math.ceil((die + 1) / 2));
    }, 0);
    const fort = saveBase(character, "fort") + con + sourceFullStatValue(character, "SaveFortitude", sourceProfile);
    const ref = saveBase(character, "ref") + dex + sourceFullStatValue(character, "SaveReflex", sourceProfile);
    const will = saveBase(character, "will") + mod("wis") + sourceFullStatValue(character, "SaveWill", sourceProfile);
    const initiative = dex + sourceFullStatValue(character, "Initiative", sourceProfile) + (character.mythicChoices.includes("improved-initiative-mythic") ? character.mythicRank : 0);
    const ac = 10 + dex + sourceFullStatValue(character, "AC", sourceProfile);
    const sourceCasters = DATA.owlcatCharacterSpellbooks?.(character) || [];
    const primaryCaster = sourceCasters[0] || Object.entries(classCounts(character)).map(([id, count]) => {
      const archetypeId = character.normalSteps.find((step) => step.classId === id)?.archetypeId || null;
      return { entry: classById.get(id), count, maxSpellLevel: classSpellLevel(id, count, archetypeId) };
    }).sort((a, b) => b.maxSpellLevel - a.maxSpellLevel)[0];
    const castingAbility = { Strength: "str", Dexterity: "dex", Constitution: "con", Intelligence: "int", Wisdom: "wis", Charisma: "cha" }[primaryCaster?.castingAttribute];
    const dcAbility = castingAbility || primaryCaster?.entry?.primaryAbility || "int";
    const maxSpellLevel = primaryCaster?.maxSpellLevel || 0;
    return {
      hp: hpDice + con * level + sourceFullStatValue(character, "HitPoints", sourceProfile),
      ac,
      initiative,
      fort,
      ref,
      will,
      melee: bab + str,
      ranged: bab + dex,
      cmb: bab + str,
      cmd: 10 + bab + str + dex,
      spellDc: maxSpellLevel ? 10 + maxSpellLevel + mod(dcAbility) : null,
      attacks: Array.from({ length: Math.max(1, Math.ceil(Math.max(1, bab) / 5)) }, (_, index) => bab - index * 5).filter((value) => value > 0).map(signed).join(" / ") || "—"
    };
  }

  function classStackDetails(character) {
    const grouped = new Map();
    character.normalSteps.forEach((step) => {
      const key = archetypeKey(step.classId, step.archetypeId);
      grouped.set(key, { classId: step.classId, archetypeId: step.archetypeId, count: (grouped.get(key)?.count || 0) + 1 });
    });
    return [...grouped.values()];
  }

  function domainPowerLabels(character) {
    const counts = classCounts(character);
    return allDomains(character).flatMap((id) => {
      const domain = domainById.get(id);
      const domainLevel = Math.max(counts.cleric || 0, counts.inquisitor || 0);
      if (!domain) return [];
      if (domain.levelFeatures?.length) return domain.levelFeatures.filter((feature) => feature.level <= domainLevel).map((feature) => `${domain.name} · LV${feature.level}：${feature.name}`);
      return [`${domain.name}：${domain.basic}`, ...(domainLevel >= domain.greaterLevel ? [`${domain.name}：${domain.greater}`] : [])];
    });
  }

  function effectOverviewGroups(profile) {
    const categoryNames = {
      stat: "常驻数值", "stat-dynamic": "动态数值", "class-skill": "本职技能", "skill-points": "技能点",
      "weapon-proficiency": "武器擅长", "armor-proficiency": "防具擅长", "stat-base": "属性替换",
      "energy-resistance": "能量抗性", "damage-reduction": "伤害减免", "energy-immunity": "能量免疫",
      "condition-immunity": "状态免疫", "buff-immunity": "状态描述符免疫", "spell-immunity": "法术免疫",
      "ability-damage-immunity": "属性伤害免疫", "conditional-save": "条件豁免", "target-conditional": "目标条件",
      "conditional-cmd": "条件战技防御", "conditional-ac": "条件护甲", "all-saves": "全部豁免",
      "spell-dc": "法术 DC", "spell-penetration": "法术穿透", "weapon-group-damage": "武器训练",
      "critical-confirmation": "重击确认", mechanics: "规则特性", resource: "能力资源", pet: "伙伴",
      "known-spell": "自动法术", "granted-ability": "授予能力", sneak: "偷袭", "starting-equipment": "初始装备",
      "spellbook-rule": "施法书规则", "source-gate": "内容解锁", "runtime-rule": "运行时规则", "rest-rule": "休息规则"
      , "ability-stat": "能力属性", "attack-stat": "攻击属性", maneuver: "战技", sense: "感知能力",
      "favored-enemy": "宿敌", "favored-terrain": "偏好地形", "weapon-training": "武器训练",
      "weapon-group-attack": "武器训练", concentration: "专注", "derived-stat": "派生数值",
      "combat-immunity": "战斗免疫", "spell-resistance": "法术抗力", condition: "常驻状态",
      "prerequisite-equivalence": "前置等级换算", "element-rule": "元素规则", "armor-rule": "护甲规则",
      "save-rule": "豁免规则", speed: "移动速度", "defense-rule": "防御规则", "pet-effect": "伙伴效果",
      "summon-effect": "召唤效果", "natural-attack": "天生攻击", "weapon-extra-damage": "武器额外伤害",
      "all-skills": "全部技能", "skill-rule": "技能规则", "weapon-rule": "武器规则", "critical-rule": "重击规则",
      "equipment-conditional": "装备条件", "health-rule": "生命规则", "class-rule": "职业规则"
    };
    const grouped = new Map();
    const proficiencyBundles = new Map();
    const setLikeCategories = new Set(["class-skill", "energy-immunity", "condition-immunity", "buff-immunity", "spell-immunity", "ability-damage-immunity", "granted-ability", "pet", "known-spell"]);
    const prepared = [];
    profile.effects.filter((effect) => effect.modeled && effect.label).forEach((effect) => {
      if (["weapon-proficiency", "armor-proficiency"].includes(effect.category)) {
        const key = `${effect.category}|${effect.originLabel}`;
        if (!proficiencyBundles.has(key)) proficiencyBundles.set(key, { ...effect, values: new Set(), sourceNames: new Set() });
        if (effect.value) proficiencyBundles.get(key).values.add(effect.value);
        if (effect.sourceName) proficiencyBundles.get(key).sourceNames.add(effect.sourceName);
        return;
      }
      prepared.push(effect);
    });
    proficiencyBundles.forEach((bundle) => {
      const names = [...bundle.values].map((value) => bundle.category === "weapon-proficiency" ? nativeWeaponName(value) : nativeArmorNames[value] || value);
      prepared.push({
        ...bundle,
        label: `${bundle.category === "weapon-proficiency" ? "擅长武器" : "擅长防具"}（${names.length}）：${names.join("、")}`,
        sourceName: [...bundle.sourceNames].join(" / "),
        itemCount: names.length
      });
    });
    prepared.forEach((effect) => {
      const category = categoryNames[effect.category] || "其他结构化效果";
      if (!grouped.has(category)) grouped.set(category, new Map());
      const key = setLikeCategories.has(effect.category)
        ? `${effect.category}|${effect.value || effect.energy || effect.condition || effect.sourceGuid || effect.label}`
        : `${effect.label}|${effect.originLabel}|${effect.sourceGuid || ""}`;
      const existing = grouped.get(category).get(key);
      if (existing && !setLikeCategories.has(effect.category)) existing.count += 1;
      else grouped.get(category).set(key, { ...effect, count: 1 });
    });
    return [...grouped.entries()].map(([name, entries]) => ({ name, entries: [...entries.values()] }));
  }

  function sheetWarnings(character) {
    const warnings = [];
    if (currentCompanion().id === "commander" && 25 - pointSpent(character) < 0) warnings.push("属性购点超出 25 点预算");
    if (currentCompanion().id === "commander" && !character.deity) warnings.push("尚未选择信仰（可选择无神论）");
    if (raceAbilityRequired(character) && !abilityById.has(character.raceAbility)) warnings.push(`${DATA.races.find((entry) => entry.id === character.race)?.name || "当前种族"}尚未选择必需的种族属性 +2`);
    const background = DATA.backgrounds.find((item) => item.id === character.background);
    if (background?.parameter && !parameterComplete(background, character.backgroundParams || {})) warnings.push(`${background.name}尚未选择必需的细分选项`);
    const deity = deityById.get(character.deity);
    if (deity && !deity.alignments.includes(character.alignment)) warnings.push("角色阵营与所选信仰不兼容");
    character.normalSteps.forEach((step, index) => {
      if (step.locked) return;
      normalStepChoiceIssues(character, index).forEach((issue) => warnings.push(`LV ${index + 1}：${issue}`));
    });
    character.mythicSteps.forEach((step, index) => {
      const prefix = mythicPrefix(character, index);
      const priorPath = mythicProjection(prefix).activePath;
      const activePath = step.pathId || priorPath;
      const rule = DATA.mythicPathRules?.[activePath];
      if (step.pathId && step.rank === 8 && rule?.kind === "late" && !rule.transition?.from?.includes(priorPath)) warnings.push(`MR ${step.rank}：不能从${pathById.get(priorPath)?.name || "当前道途"}转入${pathById.get(step.pathId)?.name}`);
      if (step.pathId && !pathStoryEligible(pathById.get(step.pathId), prefix)) warnings.push(`MR ${step.rank}：${pathById.get(step.pathId)?.name || step.pathId}的剧情解锁条件未满足`);
      const choicesBySlot = Object.fromEntries((step.pathChoices || []).map((choice) => [choice.slotId, { optionId: choice.optionId, params: choice.params || {} }]));
      if (activePath) pathChoiceIssues(prefix, activePath, step.rank, choicesBySlot).forEach((issue) => warnings.push(`MR ${step.rank}：${issue}`));
    });
    if (character.legacyManual.feats.length || character.legacyManual.mythic.length) warnings.push("存在旧存档/百科手动记录，取得等级未知");
    if ((currentCompanion().id === "commander" || character.fullRespec) && allocatedSkillPoints(character.legacySkillRanks)) warnings.push("存在旧存档技能级数，取得等级未知；后续等级仍会按新预算校验");
    if (character.legacyUnplacedPathChoices?.length) warnings.push(`存在 ${character.legacyUnplacedPathChoices.length} 项旧版道途选择无法唯一映射，原记录已保留，请在对应神话阶重新选择`);
    character.mythicSteps.forEach((step) => { const choice = step.commonChoice; const item = mythicById.get(choice?.id); if (item && !parameterComplete(item, choice.params)) warnings.push(`MR ${step.rank}：${item.name}缺少细分选项`); });
    if (character.mythicRank >= 3 && currentCompanion().id === "commander" && !character.mythicPath) warnings.push("神话 3 阶后尚未选择主道途");
    return warnings;
  }

  function renderLiveSheet() {
    const character = currentCharacter();
    const companion = currentCompanion();
    const counts = classCounts(character);
    const warnings = sheetWarnings(character);
    const spells = spellProfile(character);
    const stats = overallStats(character);
    const sourceEffects = characterEffectProfile(character);
    const effectGroups = effectOverviewGroups(sourceEffects);
    const mythic = mythicProjection(character);
    const classDetails = classStackDetails(character);
    const pathChoiceLabel = (choice) => choice.optionId.startsWith("dragon-feat:")
      ? `金龙专长：${parameterLabel(featById.get(choice.optionId.slice(12)), choice.params || {})}`
      : parameterLabel(pathAbilityById.get(choice.optionId), choice.params || {}) || choice.optionId;
    const pathPicks = mythic.activePathChoiceRecords.map(pathChoiceLabel);
    const lostPathPicks = mythic.lostPathChoiceRecords.map(pathChoiceLabel);
    const domainPowers = domainPowerLabels(character);
    const heritage = heritageById.get(character.heritage);
    const background = DATA.backgrounds.find((item) => item.id === character.background);
    const alignment = alignmentById.get(character.alignment)?.name || character.alignment;
    const deity = deityById.get(character.deity)?.name || "未选择信仰";
    const featLabels = character.featChoices.map((choice) => parameterLabel(featById.get(choice.id), choice.params));
    const featureLabels = character.featureChoices.map((choice) => featureChoiceLabel(choice));
    const autoFeatureGrants = featureAutoGrants(character);
    const finalAttributes = effectiveAttributes(character);
    const skills = skillProfile(character);
    elements.sheetValidity.textContent = warnings.length ? `${warnings.length} 项待校准` : "规则通过";
    elements.sheetValidity.className = warnings.length ? "warn" : "valid";
    elements.liveSheet.innerHTML = `<div class="sheet-summary"><h3>${escapeHtml(companion.name)}</h3><p>${escapeHtml(DATA.races.find((race) => race.id === character.race)?.name || companion.race)}${heritage ? ` · ${escapeHtml(heritage.name)}` : ""}${background ? ` · ${escapeHtml(parameterLabel(background, character.backgroundParams || {}))}` : ""} · ${escapeHtml(alignment)} · ${escapeHtml(deity)} · ${escapeHtml(mythic.activePath ? pathById.get(mythic.activePath)?.name : "未选道途")}</p><div class="sheet-metrics"><div><span>LEVEL</span><strong>${characterLevel(character)}</strong></div><div><span>BAB</span><strong>+${baseAttack(character)}</strong></div><div><span>MYTHIC</span><strong>${character.mythicRank}</strong></div></div></div>
      <section class="sheet-section total-panel"><h3>OVERALL · 裸装基线</h3><div class="total-stat-grid"><div><span>基础生命 ≈</span><strong>${stats.hp}</strong></div><div><span>裸装 AC</span><strong>${stats.ac}</strong></div><div><span>先攻</span><strong>${signed(stats.initiative)}</strong></div><div><span>近战命中</span><strong>${signed(stats.melee)}</strong></div><div><span>远程命中</span><strong>${signed(stats.ranged)}</strong></div><div><span>迭代 BAB</span><strong>${stats.attacks}</strong></div><div><span>强韧</span><strong>${signed(stats.fort)}</strong></div><div><span>反射</span><strong>${signed(stats.ref)}</strong></div><div><span>意志</span><strong>${signed(stats.will)}</strong></div><div><span>CMB / CMD</span><strong>${signed(stats.cmb)} / ${stats.cmd}</strong></div><div><span>最高法术 DC</span><strong>${stats.spellDc ?? "—"}</strong></div><div><span>已知法术</span><strong>${allKnownSpells(character).length}</strong></div></div><p class="sheet-caveat">不含装备、姿态、临时 Buff 与目标条件；生命值按一级满骰、后续平均骰估算。</p></section>
      <section class="sheet-section"><h3>ABILITY SCORES</h3><div class="ability-mini-grid">${DATA.abilities.map((ability) => `<div class="ability-mini"><span>${ability.name}</span><strong>${finalAttributes[ability.id] === 0 ? "—" : finalAttributes[ability.id]}</strong>${character.attributesMode !== "final" && finalAttributes[ability.id] !== character.attributes[ability.id] ? `<small>基础 ${character.attributes[ability.id]}</small>` : ""}</div>`).join("")}</div></section>
      <section class="sheet-section"><h3>SKILLS · 级数 / 总检定</h3><div class="sheet-skill-grid">${skills.map((skill) => `<div><span>${escapeHtml(skill.name)}${skill.classSkill ? " · 本职" : ""}</span><strong>${skill.ranks} / ${signed(skill.total)}</strong></div>`).join("")}</div><p class="sheet-caveat">总检定含关联属性、本职 +3 与已建模永久加值，不含临时或条件效果。</p></section>
      <section class="sheet-section effect-overview"><h3>PERMANENT EFFECTS · 当前安装版规则投影</h3><p class="sheet-caveat">按等级历史、细分选项与授予链回放；条件效果单独列出，不并入无条件总值。</p>${effectGroups.map((group) => `<div class="effect-group"><h4>${escapeHtml(group.name)} · ${group.entries.reduce((sum, entry) => sum + (entry.itemCount || entry.count), 0)}</h4><div class="class-stack">${group.entries.map((effect) => `<span class="feat-chip effect" title="${escapeHtml(`${effect.originLabel}｜${effect.sourceName}`)}">${escapeHtml(effect.label)}${effect.count > 1 ? ` ×${effect.count}` : ""}</span>`).join("")}</div></div>`).join("") || "<p class=\"sheet-caveat\">当前等级尚无可投影的永久效果。</p>"}${sourceEffects.unknownTypes.size ? `<details class="native-gap"><summary>尚未折算为数值的原生执行组件 · ${[...sourceEffects.unknownTypes.values()].reduce((sum, count) => sum + count, 0)}</summary><p>${escapeHtml([...sourceEffects.unknownTypes.entries()].map(([type, count]) => `${type} ×${count}`).join("、"))}</p></details>` : ""}</section>
      <section class="sheet-section build-overview"><h3>SELECTED BUILD OVERVIEW</h3><h4>职业与原型</h4><div class="class-stack">${classDetails.map(({ classId, archetypeId, count }) => `<span class="class-chip">${escapeHtml(classLabel(classId))}${archetypeId ? ` · ${escapeHtml(archetypeByKey.get(archetypeKey(classId, archetypeId))?.name || archetypeId)}` : ""} ${count}</span>`).join("") || "<span class=\"feat-chip\">等待选择</span>"}</div><h4>职业特性选择 · ${featureLabels.length}</h4><div class="class-stack">${[...featureLabels, ...autoFeatureGrants].map((name) => `<span class="feat-chip path">${escapeHtml(name)}</span>`).join("") || "<span class=\"feat-chip\">未记录职业特性选择</span>"}</div><h4>普通专长 · ${featLabels.length || character.feats.length}</h4><div class="class-stack">${(featLabels.length ? featLabels : character.feats.map((id) => featById.get(id)?.name || id)).map((name) => `<span class="feat-chip">${escapeHtml(name)}</span>`).join("") || "<span class=\"feat-chip\">未记录专长</span>"}</div><h4>通用神话能力 / 专长 · ${mythic.activeCommon.length}</h4><div class="class-stack">${character.mythicChoiceRecords.map((choice) => `<span class="feat-chip mythic">${escapeHtml(parameterLabel(mythicById.get(choice.id), choice.params))}</span>`).join("") || "<span class=\"feat-chip\">未记录</span>"}</div><h4>${escapeHtml(mythic.activePath ? pathById.get(mythic.activePath)?.name : "道途")}能力</h4><div class="class-stack">${[...mythic.grants, ...pathPicks].map((name) => `<span class="feat-chip path">${escapeHtml(name)}</span>`).join("") || "<span class=\"feat-chip\">未选择道途能力</span>"}</div>${lostPathPicks.length ? `<h4>转道后失去</h4><div class="class-stack lost">${lostPathPicks.map((name) => `<span class="feat-chip">${escapeHtml(name)}</span>`).join("")}</div>` : ""}</section>
      <section class="sheet-section"><h3>DOMAINS / SPELLS</h3><div class="class-stack">${domainPowers.map((name) => `<span class="feat-chip domain">${escapeHtml(name)}</span>`).join("") || "<span class=\"feat-chip\">无领域能力</span>"}</div><div class="class-stack"><span class="feat-chip">奥术 ${spells.arcane} 环</span><span class="feat-chip">神术 ${spells.divine} 环</span><span class="feat-chip">偷袭 ${sneakDice(character)}d6</span>${allKnownSpells(character).map((id) => `<span class="feat-chip">${escapeHtml(spellById.get(id)?.name || id)}</span>`).join("")}</div></section>
      <section class="sheet-section"><h3>VALIDATION</h3><ul class="validation-list">${warnings.length ? warnings.slice(0, 6).map((warning) => `<li class="warn">${escapeHtml(warning)}</li>`).join("") : "<li>当前记录未发现硬性冲突</li><li>职业前置由同一规则引擎校验</li>"}</ul></section>`;
  }

  function renderBuilder() {
    renderRoster();
    renderCharacterBanner();
    renderModeStrip();
    renderWorkspace();
    renderLiveSheet();
  }

  function activeCatalogItems() {
    if (ui.featKind === "feat") return DATA.feats.filter((item) => item.sourceVerified);
    if (ui.featKind === "ability" || ui.featKind === "mythic-feat") return DATA.mythic.filter((item) => item.sourceVerified && item.type === (ui.featKind === "ability" ? "ability" : "feat"));
    if (ui.featKind === "class-feature") return DATA.ruleCatalog?.classFeatures || [];
    if (ui.featKind === "path-feature") return DATA.ruleCatalog?.pathFeatures || [];
    if (ui.featKind === "domain-feature") return DATA.ruleCatalog?.domainFeatures || [];
    if (ui.featKind === "spell") return DATA.spells || [];
    if (ui.featKind === "special-ability") return (DATA.ruleCatalog?.abilities || []).filter((item) => item.abilityKind !== "Spell");
    return [];
  }

  function selectableCatalogKind() {
    return ["feat", "ability", "mythic-feat"].includes(ui.featKind);
  }

  function catalogKindLabel(item) {
    const labels = {
      feat: item?.category || "普通专长",
      ability: "神话能力",
      "mythic-feat": "神话专长",
      "class-feature": "职业 / 原型能力",
      "path-feature": "神话道途能力",
      "domain-feature": "领域能力",
      spell: "法术",
      "special-ability": item?.abilityKindName || "类法术 / 特殊能力"
    };
    return labels[ui.featKind] || "规则条目";
  }

  function catalogCategories(item) {
    if (ui.featKind === "feat") return [item.category || "其他"];
    if (ui.featKind === "ability") return ["神话能力"];
    if (ui.featKind === "mythic-feat") return ["神话专长"];
    if (["class-feature", "path-feature", "domain-feature"].includes(ui.featKind)) return item.owners?.length ? item.owners : [catalogKindLabel(item)];
    if (ui.featKind === "spell") return item.castingKinds?.length ? item.castingKinds : [item.school || "特殊法表"];
    if (ui.featKind === "special-ability") return [item.abilityKindName || "特殊"];
    return ["其他"];
  }

  function renderFeatCategories(items) {
    const categories = ["全部", ...new Set(items.flatMap(catalogCategories))];
    if (!categories.includes(ui.featCategory)) ui.featCategory = "全部";
    elements.featCategories.innerHTML = categories.map((category) => `<button type="button" class="${ui.featCategory === category ? "active" : ""}" data-feat-category="${escapeHtml(category)}">${escapeHtml(category)}<span>${category === "全部" ? items.length : items.filter((item) => catalogCategories(item).includes(category)).length}</span></button>`).join("");
  }

  function selectedCatalogItem() {
    return activeCatalogItems().find((item) => item.id === ui.selectedRule) || activeCatalogItems()[0];
  }

  function renderFeatDetail(item) {
    if (!item) { elements.featDetail.innerHTML = ""; return; }
    const character = currentCharacter();
    const selectable = selectableCatalogKind();
    const isNormal = ui.featKind === "feat";
    const owned = selectable && (isNormal ? character.feats.includes(item.id) : character.mythicChoices.includes(item.id));
    const results = itemRequirementResults(item, character);
    const eligible = selectable && isEligible(item, character);
    const ability = item.catalogKind === "ability" ? item.nativeMechanics?.ability : item.nativeMechanics?.ability || (ui.featKind === "spell" ? item.nativeMechanics : null);
    const duration = ability?.localizedDuration?.text;
    const savingThrow = ability?.localizedSavingThrow?.text || ability?.savingThrowTypes?.join("、");
    const mechanics = [
      ["能力类型", item.abilityKindName || ability?.type],
      ["动作", ability?.actionType ? `${ability.actionType}${ability.isFullRoundAction ? "（整轮）" : ""}` : null],
      ["距离", ability?.range],
      ["学派", item.school || ability?.school],
      ["持续时间", duration],
      ["豁免", savingThrow],
      ["法术抗力", ability?.spellResistance === null || ability?.spellResistance === undefined ? null : ability.spellResistance ? "允许" : "不允许"],
      ["蓝图类型", item.sourceBlueprintType],
      ["蓝图路径", item.sourceBlueprintPath],
      ["组件数量", item.nativeComponentCount ?? item.nativeComponents?.length]
    ].filter(([, value]) => value !== null && value !== undefined && value !== "");
    const occurrences = item.occurrences || [];
    const sourceRows = occurrences.map((occurrence) => `${occurrence.ownerName}${occurrence.levels?.length ? ` · ${occurrence.levels.map((level) => `${level} 级`).join("/")}` : ""}${occurrence.role === "option" ? ` · ${occurrence.selectionName || "选择项"}` : " · 自动/固定授予"}`);
    const spellSources = (item.sourceSpellbooks || []).map((source) => `${source.kind} · ${source.owner}`);
    const sourceHtml = [...new Set([...sourceRows, ...spellSources])];
    const effectProfile = catalogItemEffectProfile(item, character);
    const effectGroups = effectOverviewGroups(effectProfile);
    const effectHtml = effectGroups.length || effectProfile.unknownTypes.size
      ? `<section class="detail-effects"><h3>结构化规则效果</h3>${effectGroups.map((group) => `<div><strong>${escapeHtml(group.name)}</strong><ul>${group.entries.map((effect) => `<li>${escapeHtml(effect.label)}${effect.count > 1 ? ` ×${effect.count}` : ""}${effect.sourceName && effect.sourceName !== item.name ? ` <small>← ${escapeHtml(effect.sourceName)}</small>` : ""}</li>`).join("")}</ul></div>`).join("")}${effectProfile.unknownTypes.size ? `<details class="native-gap"><summary>原生执行组件</summary><p>${escapeHtml([...effectProfile.unknownTypes.entries()].map(([type, count]) => `${type} ×${count}`).join("、"))}</p></details>` : ""}</section>`
      : "";
    const status = selectable ? (owned ? "已掌握" : eligible ? "当前可选" : "条件不足") : item.officialLocalized === false ? "官方未提供中文文本" : "2.7.0x 蓝图条目";
    elements.featDetail.innerHTML = `<article><div class="detail-kicker"><span>${escapeHtml(catalogKindLabel(item))}</span><span>${escapeHtml(status)}</span></div><h2>${escapeHtml(item.name)}</h2><p class="detail-text">${escapeHtml(item.text || "该内部蓝图没有面向玩家的官方描述。")}</p>${item.officialLocalized === false ? "<p class=\"localization-note\">此条目保留官方内部标识，未用机器翻译伪造中文名称或说明。</p>" : ""}<div class="requirement-box"><span class="requirement-label">PREREQUISITES</span><ul>${results.length ? results.map((result) => `<li class="${result.met ? "met" : "missing"}">${escapeHtml(result.text)} · ${result.modeled === false ? "尚未接线" : result.met ? "已满足" : "未满足"}</li>`).join("") : "<li class=\"met\">无前置条件</li>"}</ul></div>${mechanics.length ? `<dl class="detail-meta">${mechanics.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl>` : ""}${effectHtml}${sourceHtml.length ? `<section class="detail-sources"><h3>获得来源 / 法表</h3><ul>${sourceHtml.slice(0, 80).map((source) => `<li>${escapeHtml(source)}</li>`).join("")}</ul></section>` : ""}${selectable ? `<button class="detail-action" type="button" data-toggle-rule="${item.id}" ${!owned && !eligible ? "disabled" : ""}>${owned ? "从当前角色移除" : `记录到 ${escapeHtml(currentCompanion().name)}`}</button>` : ""}</article>`;
  }

  function renderFeats() {
    document.querySelector("#feat-total").textContent = DATA.feats.filter((item) => item.sourceVerified).length + DATA.mythic.filter((item) => item.sourceVerified).length;
    document.querySelector("#mythic-total").textContent = new Set([
      ...(DATA.ruleCatalog?.classFeatures || []), ...(DATA.ruleCatalog?.pathFeatures || []), ...(DATA.ruleCatalog?.domainFeatures || []),
      ...(DATA.ruleCatalog?.abilities || []), ...(DATA.spells || [])
    ].map((item) => item.sourceGuid || item.id)).size;
    elements.featKind.querySelectorAll("button").forEach((button) => button.classList.toggle("active", button.dataset.kind === ui.featKind));
    const all = activeCatalogItems();
    elements.eligibleOnly.disabled = !selectableCatalogKind();
    renderFeatCategories(all);
    const query = elements.featSearch.value.trim().toLocaleLowerCase("zh-CN");
    const filtered = all.filter((item) => {
      const categoryMatch = ui.featCategory === "全部" || catalogCategories(item).includes(ui.featCategory);
      const ability = item.nativeMechanics?.ability || (ui.featKind === "spell" ? item.nativeMechanics : {});
      const text = `${item.name} ${item.text} ${item.sourceInternalName || ""} ${(item.owners || []).join(" ")} ${(item.castingKinds || []).join(" ")} ${ability?.type || ""} ${ability?.school || ""} ${itemRequirementResults(item).map((result) => result.text).join(" ")}`.toLocaleLowerCase("zh-CN");
      const eligibleMatch = !selectableCatalogKind() || !elements.eligibleOnly.checked || isEligible(item);
      return categoryMatch && eligibleMatch && (!query || text.includes(query));
    });
    if (!filtered.some((item) => item.id === ui.selectedRule)) ui.selectedRule = filtered[0]?.id || all[0]?.id;
    elements.featList.innerHTML = filtered.length ? filtered.map((item) => {
      const selectable = selectableCatalogKind();
      const owned = selectable && (ui.featKind === "feat" ? currentCharacter().feats.includes(item.id) : currentCharacter().mythicChoices.includes(item.id));
      const eligible = selectable && isEligible(item);
      const status = selectable ? choiceStatus(item, owned) : { label: item.officialLocalized === false ? "内部条目" : "官方数据", className: item.hidden ? "locked" : "" };
      return `<button type="button" class="catalog-item ${ui.selectedRule === item.id ? "active" : ""} ${selectable && !owned && !eligible ? "ineligible" : ""}" data-rule="${item.id}"><span class="catalog-status ${status.className}">${status.label}</span><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(selectable && !owned && !eligible ? requirementText(item) : item.text || catalogCategories(item).join(" · "))}</p></button>`;
    }).join("") : `<p class="catalog-empty">没有匹配的规则条目。</p>`;
    renderFeatDetail(selectedCatalogItem());
  }

  function renderPathDetail(path) {
    if (!path) return;
    const character = currentSave().characters.commander;
    const rule = DATA.mythicPathRules?.[path.id];
    const selected = character.mythicPath === path.id || character.plannedPath === path.id || character.plannedLatePath === path.id;
    const groups = [...new Set(DATA.pathAbilities.filter((item) => item.path === path.id).map((item) => item.group))];
    const progressionRanks = [...new Set([...Object.keys(rule?.steps || {}), ...Object.keys(rule?.rankGrants || {})])].sort((a, b) => Number(a) - Number(b));
    const progression = progressionRanks.map((rank) => {
      const slots = rule?.steps?.[rank] || [];
      const grants = rule?.rankGrants?.[rank] || [];
      const slotLabels = slots.map((slot) => Array.isArray(slot) ? `${slot[0]} ×${slot[1]}` : `${slot.label || slot.groupId || "道途选择"}${Number(slot.count) > 1 ? ` ×${slot.count}` : ""}`);
      return `<div><strong>MR ${rank}</strong><span>${[...slotLabels, ...grants].map(escapeHtml).join(" · ") || "自动授予"}</span></div>`;
    }).join("");
    const sourceLevels = DATA.owlcatPathProgressions?.[path.id]?.levels || [];
    const autoGrantDetails = sourceLevels.flatMap((level) => (level.auto || []).filter((item) => item.public).map((item) => ({ ...item, rank: level.rank })));
    const autoGrantHtml = autoGrantDetails.length
      ? autoGrantDetails.map((item) => `<li><strong>MR ${item.rank} · ${escapeHtml(item.name)}${Number(item.count) > 1 ? ` ×${item.count}` : ""}</strong>${item.text ? `<p>${escapeHtml(item.text)}</p>` : ""}</li>`).join("")
      : (rule?.grants || path.powers).map((power) => `<li>${escapeHtml(power)}</li>`).join("");
    const groupLabel = (group) => progressionRanks.flatMap((rank) => rule?.steps?.[rank] || []).find((slot) => !Array.isArray(slot) && slot.groupId === group)?.label || group.replaceAll("-", " ").toUpperCase();
    elements.pathDetail.innerHTML = `<div class="path-detail-inner" style="--path-color:${path.tone === "red" ? "#d16b5e" : path.tone === "green" ? "#76a276" : path.tone === "cyan" ? "#71afb6" : path.tone === "violet" ? "#a58ac5" : "var(--gold)"}"><div class="path-seal" aria-hidden="true">${escapeHtml(path.name.slice(0, 1))}</div><h2>${escapeHtml(path.name)}</h2><span class="path-align">${escapeHtml(path.stage)} · ${escapeHtml(path.align)}</span><p class="path-summary">${escapeHtml(path.text)}</p><section class="path-entry"><h3>UNLOCK CONDITIONS</h3><p>${escapeHtml(path.unlock)}</p><p>${escapeHtml(path.entry)}</p></section>${rule?.transition ? `<section class="path-transition-detail"><h3>RANK 8 TRANSITION</h3><p><strong>可从：</strong>${rule.transition.from.map((id) => pathById.get(id)?.name).filter(Boolean).join("、")}</p><p><strong>保留：</strong>${escapeHtml(rule.transition.retain)}</p><p><strong>失去：</strong>${escapeHtml(rule.transition.lose)}</p>${rule.note ? `<p><strong>版本校准：</strong>${escapeHtml(rule.note)}</p>` : ""}</section>` : ""}<section class="path-powers"><h3>AUTO GRANTS</h3><ul>${autoGrantHtml}</ul></section>${progression ? `<section class="path-progression"><h3>MYTHIC RANK TIMELINE</h3>${progression}</section>` : ""}${groups.map((group) => `<section class="path-ability-wiki"><h3>${escapeHtml(groupLabel(group))}</h3>${DATA.pathAbilities.filter((item) => item.path === path.id && item.group === group).map((item) => `<article><strong>${escapeHtml(item.name)}</strong><p>${escapeHtml(item.text)}</p>${item.nativeRequirements?.length ? `<small>${escapeHtml(nativeRequirementResults(item, character).map((result) => result.text).join("、"))}</small>` : ""}</article>`).join("")}</section>`).join("")}<button class="select-path-action" type="button" data-select-path="${path.id}">${selected ? "已带入当前指挥官规划" : `将 ${escapeHtml(path.name)} 带入神话 ${rule?.entryRank || 3} 阶`}</button></div>`;
  }

  function renderPaths() {
    elements.pathList.innerHTML = DATA.paths.map((path) => `<button type="button" class="path-card ${ui.selectedPath === path.id ? "active" : ""}" data-path="${path.id}" data-tone="${path.tone}"><span class="path-stage">${escapeHtml(path.stage)}</span><h2>${escapeHtml(path.name)}</h2><p>${escapeHtml(path.text)}</p><small>${escapeHtml(path.align)}</small></button>`).join("");
    renderPathDetail(pathById.get(ui.selectedPath) || DATA.paths[0]);
  }

  function filteredQuests() {
    const query = elements.questSearch.value.trim().toLocaleLowerCase("zh-CN");
    return DATA.quests.filter((quest) => !query || `${quest.name} ${quest.arc} ${quest.nodes.map((node) => `${node.act} ${node.title} ${node.trigger} ${node.force} ${node.choices.join(" ")}`).join(" ")}`.toLocaleLowerCase("zh-CN").includes(query));
  }

  function renderQuestContent(quest) {
    if (!quest) { elements.questContent.innerHTML = `<p class="catalog-empty">没有匹配的队友任务。</p>`; return; }
    elements.questContent.innerHTML = `<div class="quest-title-row"><div><span class="overline">COMPANION ARC</span><h2>${escapeHtml(quest.name)}</h2></div><span>${escapeHtml(quest.arc)} · ${quest.nodes.length} 个关键节点</span></div><div class="quest-timeline">${quest.nodes.map((node, nodeIndex) => {
      const key = `${quest.id}:${nodeIndex}`;
      const selected = currentSave().questChoices[key];
      return `<article class="quest-node ${Number.isInteger(selected) ? "recorded" : ""}"><div class="quest-node-head"><div><span class="overline">${escapeHtml(node.act)}</span><h3>${escapeHtml(node.title)}</h3></div><span class="act-badge">${Number.isInteger(selected) ? "已记录" : "待决策"}</span></div><dl><div><dt>触发节点</dt><dd>${escapeHtml(node.trigger)}</dd></div><div><dt>强制条件 / 失败线</dt><dd>${escapeHtml(node.force)}</dd></div></dl><div class="quest-choices">${node.choices.map((choice, choiceIndex) => `<button type="button" class="quest-choice ${selected === choiceIndex ? "selected" : ""}" data-quest-choice="${quest.id}" data-node="${nodeIndex}" data-choice="${choiceIndex}">${escapeHtml(choice)}</button>`).join("")}</div></article>`;
    }).join("")}</div>`;
  }

  function renderQuests() {
    const quests = filteredQuests();
    if (!quests.some((quest) => quest.id === ui.selectedQuest)) ui.selectedQuest = quests[0]?.id || null;
    elements.questRail.innerHTML = quests.map((quest) => `<button type="button" class="${ui.selectedQuest === quest.id ? "active" : ""}" data-quest="${quest.id}"><strong>${escapeHtml(quest.name)}</strong><small>${escapeHtml(quest.arc)} · ${quest.nodes.length} 节点</small></button>`).join("");
    renderQuestContent(quests.find((quest) => quest.id === ui.selectedQuest));
  }

  function renderSources() {
    elements.sourceGrid.innerHTML = DATA.sources.map((source) => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer"><strong>${escapeHtml(source.name)} ↗</strong><span>${escapeHtml(source.note)}</span></a>`).join("");
  }

  function renderAll() {
    renderSaveSelect();
    renderNav();
    if (ui.view === "builder") renderBuilder();
    else if (ui.view === "feats") renderFeats();
    else if (ui.view === "paths") renderPaths();
    else if (ui.view === "quests") renderQuests();
  }

  function setCharacter(id) {
    if (!companionById.has(id)) return;
    currentSave().activeCharacter = id;
    ui.nextClass = null;
    ui.nextFeat = null;
    ui.nextMythic = null;
    ui.nextMythicParams = {};
    ui.nextFeatChoices = {};
    ui.nextFeatureChoices = {};
    ui.nextDomainChoices = {};
    ui.nextSkillRanks = {};
    ui.nextAbilityIncrease = null;
    ui.levelCursor = null;
    ui.mythicCursor = null;
    ui.levelDraftKey = null;
    ui.mythicDraftKey = null;
    saveStore();
    renderBuilder();
  }

  function resetCompanionMode(fullRespec) {
    const companion = currentCompanion();
    if (companion.id === "commander") return;
    if (fullRespec) {
      const base = makeCharacter(companion);
      const character = currentCharacter();
      currentSave().characters[companion.id] = {
        ...base,
        fullRespec: true,
        attributesMode: "base",
        raceAbility: null,
        attributes: { str: 16, dex: 16, con: companion.path === "lich" ? 0 : 14, int: 10, wis: 10, cha: 10 },
        skills: emptySkillRanks(),
        legacySkillRanks: emptySkillRanks(),
        normalSteps: [],
        mythicSteps: character.mythicSteps.map((step) => ({ ...step, pathId: null, pathChoices: [], pathPicks: [] })),
        legacyManual: { feats: [], mythic: [...character.legacyManual.mythic] },
        plannedPath: null,
        plannedLatePath: null
      };
      rebuildCharacter(currentSave().characters[companion.id]);
      ui.stage = "race";
      showToast(`${companion.name} 已切换为完全洗点，从 1 级重新构筑。`);
    } else {
      const mythicRank = currentCharacter().mythicRank;
      const mythicChoices = [...currentCharacter().mythicChoices];
      const restored = makeCharacter(companion);
      restored.mythicSteps = Array.from({ length: mythicRank }, (_, index) => ({ rank: index + 1, commonChoice: mythicChoices[index] ? { id: mythicChoices[index], params: {} } : null, commonChoiceId: mythicChoices[index] || null, pathId: null, pathChoices: [], pathPicks: [], source: "user" }));
      currentSave().characters[companion.id] = rebuildCharacter(restored);
      showToast(`${companion.name} 已恢复原版入队起点。`);
    }
    ui.nextClass = null;
    ui.nextAbilityIncrease = null;
    ui.nextSkillRanks = {};
    ui.levelCursor = null;
    ui.levelDraftKey = null;
    saveStore();
    renderBuilder();
  }

  function commitLevel() {
    const character = currentCharacter();
    if (raceAbilityRequired(character) && !abilityById.has(character.raceAbility)) return;
    const cursor = resolvedLevelCursor(character);
    if (character.normalSteps[cursor]?.locked && !character.fullRespec) return;
    const prefix = normalPrefix(character, cursor);
    const selectedClass = classById.get(ui.nextClass);
    if (!selectedClass || !isEligible(selectedClass, prefix)) return;
    const selectedArchetypeEntry = ui.nextArchetype ? archetypeByKey.get(archetypeKey(selectedClass.id, ui.nextArchetype)) : null;
    if (selectedArchetypeEntry && !isEligible(selectedArchetypeEntry, prefix)) return;
    const maxLevel = mythicProjection(character).activePath === "legend" ? 40 : 20;
    if (cursor + 1 > maxLevel) return;
    const abilityIncreaseRequired = (cursor + 1) % 4 === 0;
    if (abilityIncreaseRequired ? !abilityById.has(ui.nextAbilityIncrease) : Boolean(ui.nextAbilityIncrease)) return;
    const featSlots = featSlotsForStep(prefix, selectedClass.id, ui.nextArchetype);
    const featureSlots = sanitizeFeatureDraft(prefix, selectedClass.id, ui.nextArchetype, ui.nextFeatureChoices);
    const domainSlots = domainSlotsForStep(prefix, selectedClass.id, ui.nextArchetype);
    const featChoices = featSlots.map((slot) => ui.nextFeatChoices[slot.id] ? ({ slotId: slot.id, source: slot.source, ...ui.nextFeatChoices[slot.id] }) : null).filter(Boolean);
    const featureChoices = featureSlots.map((slot) => ui.nextFeatureChoices[slot.id] ? ({ slotId: slot.id, source: slot.source, groupId: slot.groupId, ...ui.nextFeatureChoices[slot.id] }) : null).filter(Boolean);
    const domainChoices = domainSlots.map((slot) => ui.nextDomainChoices[slot.id] ? ({ slotId: slot.id, source: slot.source, sourceGuid: slot.sourceGuid || null, domainId: ui.nextDomainChoices[slot.id] }) : null).filter(Boolean);
    if (featChoices.length !== featSlots.length || featureChoices.length !== featureSlots.length || domainChoices.length !== domainSlots.length) return;
    if (featChoices.some((choice, index) => {
      const item = featById.get(choice.id);
      const before = rebuildCharacter({ ...prefix, normalSteps: [...prefix.normalSteps, { level: cursor + 1, classId: selectedClass.id, archetypeId: ui.nextArchetype || null, abilityIncrease: ui.nextAbilityIncrease, featChoices: featChoices.slice(0, index), featureChoices, skillRanks: sanitizeSkillRanks(ui.nextSkillRanks), domainChoices, domainIds: domainChoices.map((choice) => choice.domainId), knownSpellIds: [...ui.nextKnownSpells], source: "user", locked: false }], mythicSteps: prefix.mythicSteps.map((mythicStep) => ({ ...mythicStep, pathPicks: [...mythicStep.pathPicks] })), legacyManual: { feats: [...prefix.legacyManual.feats], mythic: [...prefix.legacyManual.mythic] }, legacySkillRanks: sanitizeSkillRanks(prefix.legacySkillRanks) });
      return !item || !featPoolForSlot(featSlots[index]).some((feat) => feat.id === item.id) || !isParameterizedChoiceEligible(item, choice.params, before, featSlots[index].ignorePrerequisites);
    })) return;
    const featureKeys = new Set();
    const runningFeatures = [];
    const featureCandidate = normalCandidate(prefix, selectedClass.id, ui.nextArchetype, ui.nextAbilityIncrease);
    if (featureChoices.some((choice, index) => {
      const key = `${choice.groupId}:${choice.optionId}`;
      const before = withCurrentFeatureChoices(featureCandidate, runningFeatures);
      const invalid = featureKeys.has(key) || !featureChoiceComplete(featureSlots[index], choice, before);
      if (!invalid) { featureKeys.add(key); runningFeatures.push(choice); }
      return invalid;
    })) return;
    if (new Set(domainChoices.map((choice) => choice.domainId)).size !== domainChoices.length
      || domainChoices.some((choice, index) => !domainsForSlot(prefix, selectedClass.id, ui.nextArchetype, domainSlots[index]).some((domain) => domain.id === choice.domainId))) return;
    const skillCandidate = rebuildCharacter({
      ...prefix,
      normalSteps: [...prefix.normalSteps, { level: cursor + 1, classId: selectedClass.id, archetypeId: ui.nextArchetype || null, abilityIncrease: ui.nextAbilityIncrease, featChoices, featureChoices, skillRanks: sanitizeSkillRanks(ui.nextSkillRanks), domainChoices, domainIds: domainChoices.map((choice) => choice.domainId), knownSpellIds: [...ui.nextKnownSpells], source: "user", locked: false }],
      mythicSteps: prefix.mythicSteps.map((mythicStep) => ({ ...mythicStep, pathPicks: [...mythicStep.pathPicks] })),
      legacyManual: { feats: [...prefix.legacyManual.feats], mythic: [...prefix.legacyManual.mythic] },
      legacySkillRanks: sanitizeSkillRanks(prefix.legacySkillRanks)
    });
    if (skillRankIssues(prefix, skillCandidate, ui.nextSkillRanks).length) return;
    const spellSpec = knownSpellPickSpec(prefix, selectedClass.id, ui.nextArchetype);
    const spellSlotTotal = Object.values(spellSpec).reduce((sum, count) => sum + count, 0);
    if (ui.nextKnownSpells.length !== spellSlotTotal
      || !Object.entries(spellSpec).every(([level, count]) => ui.nextKnownSpells.filter((id) => spellLevelForClass(spellById.get(id), selectedClass.id, ui.nextArchetype) === Number(level)).length === count)
      || ui.nextKnownSpells.some((id) => !spellPoolForClass(selectedClass.id, ui.nextArchetype, spellLevelForClass(spellById.get(id), selectedClass.id, ui.nextArchetype)).some((spell) => spell.id === id))) return;
    const step = { level: cursor + 1, classId: selectedClass.id, archetypeId: ui.nextArchetype || null, abilityIncrease: ui.nextAbilityIncrease, featChoices, featureChoices, skillRanks: sanitizeSkillRanks(ui.nextSkillRanks), featIds: featChoices.map((choice) => choice.id), domainChoices, domainIds: domainChoices.map((choice) => choice.domainId), knownSpellIds: [...ui.nextKnownSpells], source: "user", locked: false };
    if (cursor < character.normalSteps.length) character.normalSteps[cursor] = step;
    else character.normalSteps.push(step);
    character.normalSteps = character.normalSteps.map((item, index) => index > cursor && item.classId === step.classId ? { ...item, archetypeId: step.archetypeId } : item);
    rebuildCharacter(character);
    showToast(`${currentCompanion().name} 的第 ${cursor + 1} 级选择已保存；后续等级已重新校验。`);
    ui.nextClass = null;
    ui.nextFeat = null;
    ui.nextFeats = [];
    ui.nextFeatChoices = {};
    ui.nextFeatureChoices = {};
    ui.nextDomainChoices = {};
    ui.nextSkillRanks = {};
    ui.nextAbilityIncrease = null;
    ui.levelCursor = cursor;
    ui.levelDraftKey = null;
    saveStore();
    renderBuilder();
  }

  function rollbackLevel() {
    const character = currentCharacter();
    const floor = currentCompanion().id === "commander" || character.fullRespec ? 1 : currentCompanion().level;
    if (character.normalSteps.length <= floor) return;
    character.normalSteps.pop();
    rebuildCharacter(character);
    ui.levelCursor = null;
    ui.levelDraftKey = null;
    saveStore();
    showToast("已撤销最后一级；该级取得的专长、领域与已知法术也已同步移除。", true);
    renderBuilder();
  }

  function truncateLevel(level) {
    const character = currentCharacter();
    const floor = currentCompanion().id === "commander" || character.fullRespec ? 1 : currentCompanion().level;
    if (level < floor || level >= character.normalSteps.length) return;
    if (!window.confirm(`回退到 ${level} 级并移除其后的 ${character.normalSteps.length - level} 个等级记录？`)) return;
    character.normalSteps = character.normalSteps.slice(0, level);
    rebuildCharacter(character);
    ui.levelCursor = Math.max(0, level - 1);
    ui.levelDraftKey = null;
    saveStore(); renderBuilder(); showToast(`已回退到 ${level} 级。`, true);
  }

  function commitMythic() {
    const character = currentCharacter();
    const cursor = ui.mythicCursor === null ? character.mythicSteps.length : Math.max(0, Math.min(ui.mythicCursor, character.mythicSteps.length));
    const prefix = mythicPrefix(character, cursor);
    const rank = cursor + 1;
    if (rank > 10 || mythicProjection(prefix).activePath === "legend") return;
    const item = mythicById.get(ui.nextMythic);
    const legend = rank === 8 && ui.nextPath === "legend";
    const incoming = item ? { id: item.id, params: ui.nextMythicParams } : null;
    const alreadyOwned = item && (item.parameter ? prefix.effectiveMythicChoiceRecords.some((choice) => choiceKey(choice) === choiceKey(incoming)) : prefix.mythicChoices.includes(item.id));
    const expectedType = rank % 2 === 1 ? "ability" : "feat";
    if (!legend && (!item || item.type !== expectedType || alreadyOwned || !isParameterizedChoiceEligible(item, ui.nextMythicParams, prefix, false, "mythic"))) return;
    const priorPath = mythicProjection(prefix).activePath;
    const effectivePath = ui.nextPath || priorPath;
    if (currentCompanion().id === "commander") {
      const effectiveRule = DATA.mythicPathRules?.[effectivePath];
      if (rank === 3 && effectiveRule?.kind !== "early") return;
      if (rank > 3 && !effectivePath) return;
      if (rank === 8 && effectivePath !== priorPath && !(effectiveRule?.kind === "late" && effectiveRule.transition?.from?.includes(priorPath))) return;
      if ((rank === 3 || (rank === 8 && effectivePath !== priorPath)) && !pathStoryEligible(pathById.get(effectivePath), prefix)) return;
    }
    if (currentCompanion().id === "commander" && effectivePath && pathChoiceIssues(prefix, effectivePath, rank, ui.nextPathChoices).length) return;
    const pathId = currentCompanion().id !== "commander" ? null : rank === 3 ? ui.nextPath : rank === 8 && ui.nextPath !== priorPath ? ui.nextPath : null;
    const commonChoice = legend ? null : { slotId: `mythic:${rank}:common`, source: "mythic:common", id: item.id, params: stableParams(ui.nextMythicParams) };
    const pathChoices = activePathPickSlots(prefix, effectivePath, rank, ui.nextPathChoices).map((slot) => ({
      slotId: slot.id,
      source: slot.source,
      optionId: ui.nextPathChoices[slot.id].optionId,
      params: stableParams(ui.nextPathChoices[slot.id].params || {})
    }));
    const step = { rank, commonChoice, commonChoiceId: commonChoice?.id || null, pathId, pathChoices, pathPicks: pathChoices.map((choice) => choice.optionId), source: "user" };
    if (cursor < character.mythicSteps.length) character.mythicSteps[cursor] = step;
    else character.mythicSteps.push(step);
    rebuildCharacter(character);
    ui.nextMythic = null;
    ui.nextMythicParams = {};
    ui.nextPathPicks = [];
    ui.nextPathChoices = {};
    ui.mythicCursor = cursor;
    ui.mythicDraftKey = null;
    saveStore();
    showToast(`${currentCompanion().name} 的神话 ${rank} 阶选择已保存。`);
    renderBuilder();
  }

  function truncateMythic(rank) {
    const character = currentCharacter();
    if (rank >= character.mythicSteps.length) return;
    if (!window.confirm(`回退到神话 ${rank} 阶并移除其后的神话记录？`)) return;
    character.mythicSteps = character.mythicSteps.slice(0, rank);
    rebuildCharacter(character);
    ui.mythicCursor = Math.max(0, rank - 1);
    ui.mythicDraftKey = null;
    saveStore(); renderBuilder(); showToast(`已回退到神话 ${rank} 阶。`, true);
  }

  function toggleRule(id) {
    const character = currentCharacter();
    const feat = featById.get(id);
    const mythicItem = mythicById.get(id);
    const list = feat ? character.legacyManual.feats : character.legacyManual.mythic;
    const item = feat || mythicItem;
    if (!item) return;
    const index = list.indexOf(id);
    const ownedInTimeline = index < 0 && (feat ? character.normalSteps.some((step) => step.featIds.includes(id)) : character.mythicSteps.some((step) => (step.commonChoice?.id || step.commonChoiceId) === id));
    if (ownedInTimeline) {
      showToast(`${item.name}来自升级时间线；请切换到取得它的等级或神话阶编辑。`);
      return;
    }
    if (index >= 0) {
      list.splice(index, 1);
      let removedDependents = 0;
      let changed = true;
      while (changed) {
        changed = false;
        character.legacyManual.feats.slice().forEach((featId) => {
          const dependent = featById.get(featId);
          if (dependent && !isEligible(dependent, character)) {
            character.legacyManual.feats.splice(character.legacyManual.feats.indexOf(featId), 1);
            removedDependents += 1;
            changed = true;
          }
        });
        character.legacyManual.mythic.slice().forEach((mythicId) => {
          const dependent = mythicById.get(mythicId);
          if (dependent && !isEligible(dependent, character)) {
            character.legacyManual.mythic.splice(character.legacyManual.mythic.indexOf(mythicId), 1);
            removedDependents += 1;
            changed = true;
          }
        });
      }
      showToast(`已移除${item.name}${removedDependents ? `，并级联撤销 ${removedDependents} 个后继能力` : ""}。`);
    } else if (item.parameter?.required) {
      showToast(`${item.name}需要填写“${DATA.choiceParameterTypes?.[item.parameter.type]?.name || "细分选项"}”；请从对应升级槽取得。`, true);
      return;
    } else if (isEligible(item, character)) {
      list.push(id);
      showToast(`已把${item.name}记录到${currentCompanion().name}。`);
    }
    rebuildCharacter(character);
    saveStore();
    renderFeats();
  }

  function setCommanderPath(id) {
    if (!pathById.has(id)) return;
    const commander = currentSave().characters.commander;
    const rule = DATA.mythicPathRules?.[id];
    if (rule?.kind === "late") commander.plannedLatePath = id;
    else commander.plannedPath = id;
    saveStore();
    renderPaths();
    showToast(`${pathById.get(id).name}已带入神话 ${rule?.entryRank || 3} 阶规划；不会跳过前置阶层。`);
  }

  function openNameModal(mode) {
    ui.modalMode = mode;
    elements.nameTitle.textContent = mode === "new" ? "新建构筑存档" : "重命名存档";
    elements.nameInput.value = mode === "new" ? `圣战方案 ${Object.keys(store.slots).length + 1}` : currentSave().name;
    elements.modal.hidden = false;
    requestAnimationFrame(() => { elements.nameInput.focus(); elements.nameInput.select(); });
  }

  function closeNameModal() { elements.modal.hidden = true; }

  function exportSave() {
    const payload = { app: "Field Manuals WotR", version: 4, save: currentSave() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${currentSave().name.replace(/[^\w\u4e00-\u9fa5-]+/g, "-") || "wotr-build"}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("当前构筑存档已导出。 ");
  }

  function importSave(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const raw = parsed?.save || parsed;
        if (!raw?.characters || typeof raw.characters !== "object") throw new Error("invalid");
        const id = uid();
        store.slots[id] = normalizeSave(raw, "导入存档");
        store.slots[id].name = `${store.slots[id].name.slice(0, 27)} · 导入`;
        store.activeSlot = id;
        saveStore("导入完成");
        renderAll();
        showToast("存档导入完成，原存档未被覆盖。 ");
      } catch {
        showToast("无法导入：文件不是有效的《开拓者 - 正义之怒》构筑存档。", true);
      } finally {
        elements.importInput.value = "";
      }
    };
    reader.readAsText(file);
  }

  function validateData() {
    const groups = [DATA.races, DATA.heritages, DATA.backgrounds, DATA.deities, DATA.classes, DATA.feats, DATA.mythic, DATA.paths, DATA.companions, DATA.quests, DATA.domains, DATA.spells, DATA.pathAbilities];
    groups.forEach((group) => {
      const ids = new Set();
      group.forEach((item) => {
        if (!item.id || ids.has(item.id)) console.warn("WotR data: duplicate or missing id", item);
        ids.add(item.id);
      });
    });
    [...DATA.feats, ...DATA.mythic, ...DATA.classes].forEach((item) => {
      (item.req?.feats || []).forEach((id) => { if (!featById.has(id)) console.warn(`WotR data: ${item.id} references unknown feat ${id}`); });
      (item.req?.mythic || []).forEach((id) => { if (!mythicById.has(id)) console.warn(`WotR data: ${item.id} references unknown mythic ${id}`); });
    });
    const archetypeIds = new Set();
    (DATA.archetypes || []).forEach((item) => {
      const key = archetypeKey(item.baseClass, item.id);
      if (archetypeIds.has(key)) console.warn("WotR data: duplicate archetype", key);
      if (!item.name || item.name === item.nameEn) console.warn("WotR data: missing Chinese archetype label", key);
      archetypeIds.add(key);
    });
    [...DATA.feats, ...DATA.mythic].forEach((item) => {
      if (item.parameter && !DATA.choiceParameterTypes?.[item.parameter.type]) console.warn("WotR data: unknown parameter type", item.id, item.parameter.type);
    });
    (DATA.classFeatureRules || []).forEach((rule) => {
      if (!classById.has(rule.classId) || !DATA.featureGroups?.[rule.groupId]) console.warn("WotR data: invalid feature slot rule", rule);
    });
  }

  document.addEventListener("click", (event) => {
    const target = event.target.closest("button, [data-close-modal]");
    if (!target) return;
    if (target.hasAttribute("data-card-expand")) {
      const wrapper = target.closest(".choice-card-wrap");
      const expanded = !wrapper?.classList.contains("expanded");
      wrapper?.classList.toggle("expanded", expanded);
      target.setAttribute("aria-expanded", String(expanded));
      target.textContent = expanded ? "收起说明" : "展开说明";
    }
    else if (target.dataset.view) { ui.view = target.dataset.view; renderAll(); window.scrollTo({ top: 0, behavior: "smooth" }); }
    else if (target.dataset.character) setCharacter(target.dataset.character);
    else if (target.dataset.roster) { ui.roster = target.dataset.roster; renderRoster(); }
    else if (target.dataset.stage) { ui.stage = target.dataset.stage; renderWorkspace(); }
    else if (target.dataset.race) {
      const character = currentCharacter();
      const race = DATA.races.find((item) => item.id === target.dataset.race && item.playable !== false);
      if (!race) return;
      character.race = race.id;
      character.heritage = DATA.heritages.find((item) => item.raceId === character.race)?.id || null;
      character.raceAbility = null;
      ui.levelDraftKey = null;
      saveStore(); renderBuilder();
    }
    else if (target.dataset.heritage) { const character = currentCharacter(); if (heritageById.get(target.dataset.heritage)?.raceId === character.race) { character.heritage = target.dataset.heritage; ui.levelDraftKey = null; saveStore(); renderBuilder(); } }
    else if (target.dataset.raceAbility) { const character = currentCharacter(); if (raceAbilityRequired(character) && abilityById.has(target.dataset.raceAbility)) { character.raceAbility = target.dataset.raceAbility; ui.levelDraftKey = null; saveStore(); renderBuilder(); } }
    else if (target.dataset.alignment) { const character = currentCharacter(); if (!alignmentById.has(target.dataset.alignment)) return; character.alignment = target.dataset.alignment; const deity = deityById.get(character.deity); if (deity && !deity.alignments.includes(character.alignment)) character.deity = null; ui.levelDraftKey = null; saveStore(); renderBuilder(); }
    else if (target.dataset.deity) { const character = currentCharacter(); const deity = deityById.get(target.dataset.deity); if (deity?.alignments.includes(character.alignment)) { character.deity = deity.id; ui.levelDraftKey = null; saveStore(); renderBuilder(); } }
    else if (target.dataset.backgroundCategory) { ui.backgroundCategory = target.dataset.backgroundCategory; renderWorkspace(); }
    else if (target.dataset.background) { const background = DATA.backgrounds.find((item) => item.id === target.dataset.background); if (background) { currentCharacter().background = background.id; currentCharacter().backgroundParams = {}; saveStore(); renderBuilder(); } }
    else if (target.dataset.ability) {
      const character = currentCharacter();
      const delta = Number(target.dataset.delta);
      const min = currentCompanion().path === "lich" && target.dataset.ability === "con" ? 0 : 7;
      character.attributes[target.dataset.ability] = Math.max(min, Math.min(18, character.attributes[target.dataset.ability] + delta));
      saveStore(); renderWorkspace(); renderLiveSheet();
    }
    else if (target.dataset.nextSkill) {
      const id = target.dataset.nextSkill;
      if (!skillById.has(id)) return;
      ui.nextSkillRanks[id] = Math.max(0, (Number(ui.nextSkillRanks[id]) || 0) + Number(target.dataset.delta));
      renderWorkspace();
    }
    else if (target.dataset.levelCursor) { ui.levelCursor = target.dataset.levelCursor === "next" ? null : Number(target.dataset.levelCursor); ui.levelDraftKey = null; renderWorkspace(); }
    else if (target.dataset.nextClass) { ui.nextClass = target.dataset.nextClass; ui.nextArchetype = selectedArchetype(normalPrefix(currentCharacter(), resolvedLevelCursor(currentCharacter())), ui.nextClass); ui.nextFeats = []; ui.nextFeatChoices = {}; ui.nextFeatureChoices = {}; ui.nextDomainChoices = {}; ui.nextDomains = []; ui.nextKnownSpells = []; renderWorkspace(); }
    else if (target.dataset.nextFeat) { const id = target.dataset.nextFeat; ui.nextFeats = ui.nextFeats.includes(id) ? ui.nextFeats.filter((item) => item !== id) : [...ui.nextFeats, id]; renderWorkspace(); }
    else if (target.dataset.nextDomain) { const id = target.dataset.nextDomain; ui.nextDomains = ui.nextDomains.includes(id) ? ui.nextDomains.filter((item) => item !== id) : [...ui.nextDomains, id]; renderWorkspace(); }
    else if (target.dataset.nextSpell) { const id = target.dataset.nextSpell; ui.nextKnownSpells = ui.nextKnownSpells.includes(id) ? ui.nextKnownSpells.filter((item) => item !== id) : [...ui.nextKnownSpells, id]; renderWorkspace(); }
    else if (target.hasAttribute("data-commit-level")) commitLevel();
    else if (target.hasAttribute("data-rollback-level")) rollbackLevel();
    else if (target.dataset.truncateLevel) truncateLevel(Number(target.dataset.truncateLevel));
    else if (target.dataset.mythicCursor) { ui.mythicCursor = target.dataset.mythicCursor === "next" ? null : Number(target.dataset.mythicCursor); ui.mythicDraftKey = null; renderWorkspace(); }
    else if (target.dataset.nextMythic) { ui.nextMythic = target.dataset.nextMythic; ui.nextMythicParams = {}; renderWorkspace(); }
    else if (target.dataset.nextPath) { ui.nextPath = target.dataset.nextPath; ui.nextPathPicks = []; ui.nextPathChoices = {}; renderWorkspace(); }
    else if (target.dataset.storyEtude) {
      const guid = nativeGuid(target.dataset.storyEtude);
      if (!guid) return;
      currentSave().storyStates ||= {};
      if (storyStatus(guid) === "playing") delete currentSave().storyStates[guid];
      else currentSave().storyStates[guid] = "playing";
      saveStore(); renderBuilder();
    }
    else if (target.hasAttribute("data-commit-mythic")) commitMythic();
    else if (target.dataset.truncateMythic) truncateMythic(Number(target.dataset.truncateMythic));
    else if (target.hasAttribute("data-open-paths")) { ui.view = "paths"; renderAll(); window.scrollTo({ top: 0, behavior: "smooth" }); }
    else if (target.dataset.kind) { ui.featKind = target.dataset.kind; ui.featCategory = "全部"; ui.selectedRule = activeCatalogItems()[0]?.id; renderFeats(); }
    else if (target.dataset.featCategory) { ui.featCategory = target.dataset.featCategory; renderFeats(); }
    else if (target.dataset.rule) { ui.selectedRule = target.dataset.rule; renderFeats(); }
    else if (target.dataset.toggleRule) toggleRule(target.dataset.toggleRule);
    else if (target.dataset.path) { ui.selectedPath = target.dataset.path; renderPaths(); }
    else if (target.dataset.selectPath) setCommanderPath(target.dataset.selectPath);
    else if (target.dataset.quest) { ui.selectedQuest = target.dataset.quest; renderQuests(); }
    else if (target.dataset.questChoice) {
      const key = `${target.dataset.questChoice}:${target.dataset.node}`;
      const choice = Number(target.dataset.choice);
      currentSave().questChoices[key] = currentSave().questChoices[key] === choice ? null : choice;
      saveStore(); renderQuests();
    }
    else if (target.hasAttribute("data-close-modal")) closeNameModal();
  });

  elements.nav.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    const buttons = [...elements.nav.querySelectorAll("button")];
    const index = buttons.indexOf(document.activeElement);
    const next = (index + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next].focus(); buttons[next].click();
  });

  document.querySelector("#new-save").addEventListener("click", () => openNameModal("new"));
  document.querySelector("#rename-save").addEventListener("click", () => openNameModal("rename"));
  document.querySelector("#duplicate-save").addEventListener("click", () => {
    const id = uid();
    store.slots[id] = normalizeSave(JSON.parse(JSON.stringify(currentSave())), `${currentSave().name} · 副本`);
    store.slots[id].name = `${currentSave().name.slice(0, 27)} · 副本`;
    store.activeSlot = id;
    saveStore(); renderAll(); showToast("已复制当前存档。 ");
  });
  document.querySelector("#delete-save").addEventListener("click", () => {
    if (Object.keys(store.slots).length <= 1) { showToast("至少需要保留一个本地存档。", true); return; }
    if (!window.confirm(`删除“${currentSave().name}”？该操作无法撤销。`)) return;
    delete store.slots[store.activeSlot];
    store.activeSlot = Object.keys(store.slots)[0];
    saveStore(); renderAll(); showToast("存档已删除。", true);
  });
  elements.saveSelect.addEventListener("change", () => { if (store.slots[elements.saveSelect.value]) { store.activeSlot = elements.saveSelect.value; saveStore(); renderAll(); } });
  elements.nameForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = elements.nameInput.value.trim().slice(0, 32);
    if (!name) return;
    if (ui.modalMode === "new") {
      const id = uid(); store.slots[id] = makeSave(name); store.activeSlot = id;
    } else currentSave().name = name;
    closeNameModal(); saveStore(); renderAll(); showToast(ui.modalMode === "new" ? "新存档已建立。" : "存档已重命名。");
  });
  elements.modal.addEventListener("click", (event) => { if (event.target === elements.modal) closeNameModal(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !elements.modal.hidden) closeNameModal(); });
  elements.modeStrip.addEventListener("change", (event) => { if (event.target.id === "respec-toggle") resetCompanionMode(event.target.checked); });
  elements.workspace.addEventListener("change", (event) => {
    if (event.target.id === "archetype-select") {
      ui.nextArchetype = event.target.value || null;
      ui.nextFeatChoices = {};
      ui.nextFeatureChoices = {};
      ui.nextDomainChoices = {};
      ui.nextDomains = [];
      ui.nextKnownSpells = [];
      renderWorkspace();
    } else if (event.target.hasAttribute("data-ability-increase")) {
      ui.nextAbilityIncrease = abilityById.has(event.target.value) ? event.target.value : null;
      renderWorkspace();
    } else if (event.target.dataset.featSlot) {
      const slotId = event.target.dataset.featSlot;
      const id = event.target.value;
      if (id) ui.nextFeatChoices[slotId] = { id, params: {} };
      else delete ui.nextFeatChoices[slotId];
      ui.nextFeats = Object.values(ui.nextFeatChoices).map((choice) => choice.id);
      renderWorkspace();
    } else if (event.target.dataset.featParamSlot) {
      const slotId = event.target.dataset.featParamSlot;
      const choice = ui.nextFeatChoices[slotId];
      const item = featById.get(choice?.id);
      if (choice && item?.parameter) choice.params[item.parameter.type] = event.target.value;
      renderWorkspace();
    } else if (event.target.dataset.featureSlot) {
      const slotId = event.target.dataset.featureSlot;
      const cursor = resolvedLevelCursor(currentCharacter());
      const prefix = normalPrefix(currentCharacter(), cursor);
      const slot = featureSlotsForStep(prefix, ui.nextClass, ui.nextArchetype).find((item) => item.id === slotId);
      if (event.target.value && slot) ui.nextFeatureChoices[slotId] = { optionId: event.target.value, params: {} };
      else delete ui.nextFeatureChoices[slotId];
      renderWorkspace();
    } else if (event.target.dataset.featureOptionParamSlot) {
      const choice = ui.nextFeatureChoices[event.target.dataset.featureOptionParamSlot];
      const option = Object.values(DATA.featureGroups || {}).flatMap((group) => group.options || []).find((item) => item.id === choice?.optionId);
      if (choice && option?.parameter) choice.params = { ...choice.params, [option.parameter.type]: event.target.value };
      renderWorkspace();
    } else if (event.target.dataset.featureNestedSlot) {
      const choice = ui.nextFeatureChoices[event.target.dataset.featureNestedSlot];
      if (choice) {
        const depth = Number(event.target.dataset.featureNestedDepth) || 0;
        const nestedOptionIds = [...(choice.params?.nestedOptionIds || (choice.params?.nestedOptionId ? [choice.params.nestedOptionId] : []))].slice(0, depth);
        if (event.target.value) nestedOptionIds.push(event.target.value);
        choice.params = { ...choice.params, nestedOptionId: nestedOptionIds[0] || null, nestedOptionIds, nestedParamsByDepth: (choice.params?.nestedParamsByDepth || []).slice(0, depth) };
      }
      renderWorkspace();
    } else if (event.target.dataset.featureNestedParamSlot) {
      const encoded = event.target.dataset.featureNestedParamSlot;
      const divider = encoded.lastIndexOf("|");
      const slotId = divider >= 0 ? encoded.slice(0, divider) : encoded;
      const depth = divider >= 0 ? Number(encoded.slice(divider + 1)) || 0 : 0;
      const choice = ui.nextFeatureChoices[slotId];
      let option = Object.values(DATA.featureGroups || {}).flatMap((group) => group.options || []).find((item) => item.id === choice?.optionId);
      const nestedIds = choice?.params?.nestedOptionIds || (choice?.params?.nestedOptionId ? [choice.params.nestedOptionId] : []);
      for (let index = 0; option && index <= depth; index += 1) {
        const group = DATA.featureGroups?.[`owlcat:${option.nestedSelectionGuid}`];
        option = group?.options?.find((item) => item.id === nestedIds[index]);
      }
      if (choice && option?.parameter) {
        const nestedParamsByDepth = [...(choice.params?.nestedParamsByDepth || [])];
        nestedParamsByDepth[depth] = { ...(nestedParamsByDepth[depth] || {}), [option.parameter.type]: event.target.value };
        choice.params = { ...choice.params, nestedParamsByDepth };
      }
      renderWorkspace();
    } else if (event.target.dataset.domainSlot) {
      const slotId = event.target.dataset.domainSlot;
      if (event.target.value) ui.nextDomainChoices[slotId] = event.target.value;
      else delete ui.nextDomainChoices[slotId];
      ui.nextDomains = Object.values(ui.nextDomainChoices);
      renderWorkspace();
    } else if (event.target.dataset.backgroundParamSlot) {
      const character = currentCharacter();
      const background = DATA.backgrounds.find((item) => item.id === character.background && item.id === event.target.dataset.backgroundParamSlot);
      if (background?.parameter) {
        character.backgroundParams = event.target.value ? { [background.parameter.type]: event.target.value } : {};
        saveStore();
      }
      renderBuilder();
    } else if (event.target.dataset.pathSlot) {
      const slotId = event.target.dataset.pathSlot;
      if (event.target.value) ui.nextPathChoices[slotId] = { optionId: event.target.value, params: {} };
      else delete ui.nextPathChoices[slotId];
      ui.nextPathPicks = Object.values(ui.nextPathChoices).map((choice) => choice.optionId);
      renderWorkspace();
    } else if (event.target.dataset.pathParamSlot) {
      const choice = ui.nextPathChoices[event.target.dataset.pathParamSlot];
      const slot = pathPickSlots(ui.nextPath, (ui.mythicCursor === null ? currentCharacter().mythicSteps.length : ui.mythicCursor) + 1).find((item) => item.id === event.target.dataset.pathParamSlot);
      const item = pathChoiceItem(slot, choice);
      if (choice && item?.parameter) choice.params[item.parameter.type] = event.target.value;
      ui.nextPathPicks = Object.values(ui.nextPathChoices).map((entry) => entry.optionId);
      renderWorkspace();
    } else if (event.target.dataset.mythicParamSlot) {
      const item = mythicById.get(ui.nextMythic);
      if (item?.parameter) { ui.nextMythicParams[item.parameter.type] = event.target.value; ui.nextMythicParams.nestedParams = {}; }
      renderWorkspace();
    } else if (event.target.dataset.mythicNestedParam) {
      const item = mythicById.get(ui.nextMythic);
      const nested = mythicById.get(parameterValue(item, ui.nextMythicParams));
      if (nested?.parameter) { ui.nextMythicParams.nestedParams ||= {}; ui.nextMythicParams.nestedParams[nested.parameter.type] = event.target.value; }
      renderWorkspace();
    }
  });
  elements.featSearch.addEventListener("input", renderFeats);
  elements.eligibleOnly.addEventListener("change", renderFeats);
  elements.questSearch.addEventListener("input", renderQuests);
  document.querySelector("#export-save").addEventListener("click", exportSave);
  elements.importInput.addEventListener("change", () => importSave(elements.importInput.files[0]));

  validateData();
  renderSources();
  renderAll();
})();
