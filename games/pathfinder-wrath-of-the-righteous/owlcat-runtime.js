(() => {
  "use strict";

  const DATA = window.WOTR_DATA;
  const SOURCE = window.WOTR_OWLCAT_SITE_DATA;
  const EXPECTED_VERSION = "2.7.0x";
  const EXPECTED_BUILD = "20212986";
  if (!DATA || !SOURCE) throw new Error("WotR: Owlcat runtime data was not loaded before the application");
  if (SOURCE.sourceSnapshot?.gameVersion !== EXPECTED_VERSION || String(SOURCE.sourceSnapshot?.steamBuild) !== EXPECTED_BUILD) {
    throw new Error(`WotR: expected installed-data snapshot ${EXPECTED_VERSION}/${EXPECTED_BUILD}`);
  }

  const guidPattern = /^[0-9a-f]{32}$/i;
  const normalizeGuid = (value) => {
    if (typeof value !== "string") return null;
    const match = value.match(/(?:!bp_)?([0-9a-f]{32})/i);
    return match && guidPattern.test(match[1]) ? match[1].toLowerCase() : null;
  };
  const stripMarkup = (value) => String(value || "")
    .replace(/\{g\|[^}]+\}/g, "")
    .replace(/\{\/g\}/g, "")
    .replace(/\{[^}]+\}/g, "")
    .replace(/\r/g, "")
    .trim();
  const slugNative = (value) => String(value || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  const sourceDefinitions = SOURCE.selectionDefinitions || {};
  const poolByGuid = new Map((SOURCE.selectionPools || []).map((pool) => [pool.sourceGuid, pool]));
  const domainSelectionGuids = new Set([
    normalizeGuid(SOURCE.choiceRoots?.domains?.sourceGuid),
    ...(SOURCE.selectionPools || []).filter((pool) => pool.internalName === "SecondDomainsSelection").map((pool) => normalizeGuid(pool.sourceGuid))
  ].filter(Boolean));
  const progressionByGuid = new Map((SOURCE.progressions || []).map((progression) => [progression.guid, progression]));
  const spellbookByGuid = new Map((SOURCE.spellbooks || []).map((spellbook) => [normalizeGuid(spellbook.sourceGuid || spellbook.guid), spellbook]));
  const spellsTableByGuid = new Map((SOURCE.spellsTables || []).map((table) => [normalizeGuid(table.guid), table]));
  const statProgressionByGuid = new Map((SOURCE.statProgressions || []).map((progression) => [normalizeGuid(progression.guid), progression]));
  const allSourceClasses = [...SOURCE.classes.base, ...SOURCE.classes.prestige, ...SOURCE.classes.technical];
  const sourceClassByGuid = new Map(allSourceClasses.map((entry) => [entry.sourceGuid, entry]));
  const sourceClassNameByGuid = new Map(allSourceClasses.map((entry) => [entry.sourceGuid, entry.name || entry.internalName || entry.sourceGuid]));
  const specialSpellbookOwnerNames = {
    CorruptedGoldDragonSpellbook: "腐化金龙",
    GoldDragonSpellbook: "金龙",
    LichSkeletalBardMinorSpellbook: "巫妖骷髅吟游诗人",
    LichSkeletalInquisitorMinorSpellbook: "巫妖骷髅审判官",
    LichSkeletalMagusSpellbookMinor: "巫妖骷髅魔战士",
    MagicDeceiverSpellbook: "魔法欺诈师",
    MonsterMythicSpellbook: "怪物神话"
  };
  const sourceOwnerName = (ownerGuid, spellbook) => sourceClassNameByGuid.get(ownerGuid)
    || sourceDefinitions[ownerGuid]?.name
    || specialSpellbookOwnerNames[spellbook?.internalName]
    || spellbook?.internalName
    || spellbook?.sourceGuid;
  const weaponTypeScore = (entry) => Number(Boolean(entry.name)) * 8
    + Number(/^Weapons[\\/]Types[\\/]/i.test(entry.blueprintPath || "")) * 4
    + Number(!/DLC|Units[\\/]NPC/i.test(entry.blueprintPath || "")) * 2
    + Number(!entry.mechanics?.weaponType?.isNatural);
  const weaponByCategory = new Map();
  (SOURCE.equipment?.weaponTypes || []).forEach((entry) => {
    const category = entry.mechanics?.weaponType?.category;
    if (!category) return;
    const existing = weaponByCategory.get(category);
    if (!existing || weaponTypeScore(entry) > weaponTypeScore(existing)) weaponByCategory.set(category, entry);
  });
  const weaponIdOverrides = { UnarmedStrike: "unarmed" };
  const installedWeaponOptions = [...weaponByCategory.entries()].map(([nativeValue, entry]) => {
    const mechanics = entry.mechanics?.weaponType || {};
    const physicalForm = mechanics.damageType?.Physical?.Form || null;
    return {
      id: weaponIdOverrides[nativeValue] || slugNative(nativeValue),
      nativeValue,
      sourceGuid: entry.sourceGuid,
      name: entry.name || entry.internalName || nativeValue,
      attackType: mechanics.attackType,
      isTwoHanded: Boolean(mechanics.isTwoHanded),
      isLight: Boolean(mechanics.isLight),
      isNatural: Boolean(mechanics.isNatural),
      isUnarmed: Boolean(mechanics.isUnarmed),
      physicalForms: String(physicalForm || "").split(/[,|]/).map((value) => value.trim()).filter(Boolean),
      fighterGroups: String(mechanics.fighterGroups || "").split(/[,|]/).map((value) => value.trim()).filter(Boolean)
    };
  }).sort((left, right) => left.name.localeCompare(right.name, "zh-CN"));
  const archetypeInternalOverrides = {
    "barbarian:beastskin-berserker": "BeastkinBerserkerArchetype",
    "barbarian:flesheater": "FleshEaterBarbarianArchetype",
    "bard:chelaxian-diva": "ChelishDivaArchetype",
    "cavalier:cavalier-of-the-paw": "OrderOfThePawCavalierArchetype",
    "cleric:demonbane-priest": "DevilbanePriestArchetype",
    "fighter:aldori-defender": "SwordlordArchetype",
    "oracle:purifier": "PurifierAasimarArchetype",
    "oracle:wind-whisperer": "WIndWhispererArchetype",
    "ranger:sable-company-marine": "SableMarineArchetype",
    "shifter:child-of-the-manticore": "ChildOfManticoreShifterArchetype",
    "shifter:feyform-shifter": "FeyformShifterShifterArchetype",
    "shifter:fiendflesh-shifter": "FiendfleshShifterShifterArchetype",
    "shifter:rageshaper": "RageshaperShifterArchetype",
    "shifter:weretouched": "WereTouchedShifter",
    "skald:inciter": "ProvocateurArchetype",
    "sorcerer:overwhelming-mage": "OverwhelimgMageArchetype",
    "witch:hag-of-gyronna": "DarkSisterArchetype",
    "witch:hagbound": "HagboundWitchArchetype",
    "witch:hex-channeler": "HexChannelerWitchArchetype",
    "witch:ley-line-guardian": "LeyLineGuardianWitchArchetype",
    "witch:stigmatized-witch": "AccursedWitchArchetype",
    "wizard:elemental-specialist": "ElementalistArchetype",
    "wizard:shadowcaster": "ShadowCasterArchetype"
  };

  function uniqueAliasGuid(id) {
    const candidates = SOURCE.aliasIndex?.[id] || [];
    return candidates.length === 1 ? candidates[0] : null;
  }

  function matchSource(existing, sourceItems, used = new Set(), context = {}) {
    const explicit = existing.sourceGuid && sourceItems.find((item) => item.sourceGuid === existing.sourceGuid && !used.has(item.sourceGuid)
      && (!context.classGuid || item.classGuid === context.classGuid));
    if (explicit) return explicit;
    const aliasCandidates = SOURCE.aliasIndex?.[existing.id] || [];
    const byAlias = sourceItems.filter((item) => aliasCandidates.includes(item.sourceGuid) && !used.has(item.sourceGuid)
      && (!context.classGuid || item.classGuid === context.classGuid));
    if (byAlias.length === 1) return byAlias[0];
    const byName = sourceItems.filter((item) => item.name && item.name === existing.name && !used.has(item.sourceGuid)
      && (!context.classGuid || item.classGuid === context.classGuid));
    return byName.length === 1 ? byName[0] : null;
  }

  function parameterOptions(guids) {
    return [...new Set(guids || [])].map((guid) => sourceDefinitions[normalizeGuid(guid)])
      .filter(Boolean)
      .map((entry) => ({ id: entry.sourceGuid, name: entry.name || entry.internalName || entry.sourceGuid }));
  }

  function sourceParameter(entry) {
    const explicitNestedGuid = normalizeGuid(entry.nestedSelectionGuid);
    const nestedGuid = explicitNestedGuid && poolByGuid.has(explicitNestedGuid)
      ? explicitNestedGuid
      : (poolByGuid.has(normalizeGuid(entry.sourceGuid)) ? normalizeGuid(entry.sourceGuid) : null);
    if (nestedGuid) {
      const type = `owlcat-selection:${nestedGuid}`;
      DATA.choiceParameterTypes[type] ||= {
        name: entry.name || "细分选项",
        options: parameterOptions(poolByGuid.get(nestedGuid).optionSourceGuids)
      };
      return { type, required: true, source: "owlcat-selection" };
    }
    const native = entry.parameter;
    if (!native?.type) return null;
    if (native.type === "SpellSchool") return { type: "spellSchool", required: true, source: "owlcat-parameter" };
    if (native.type === "WeaponCategory") return { type: "weapon", required: true, source: "owlcat-parameter", nativeFilter: native.weaponSubCategory || "None" };
    if (["LearnSpell", "SpellSpecialization", "FeatureSelection"].includes(native.type)) {
      const type = `owlcat-parameter:${entry.sourceGuid}`;
      const explicitGuids = [...(native.blueprintParameterVariants || []), ...(native.customVariants || [])];
      const nativeSpellList = normalizeGuid(native.spellList);
      const spellOptions = native.type === "LearnSpell" && nativeSpellList ? (SOURCE.spells || []).filter((spell) => (spell.spellLists || []).some((membership) => {
        if (normalizeGuid(membership.sourceGuid) !== nativeSpellList) return false;
        return !native.specificSpellLevel || Number(membership.spellLevel) === Number(native.spellLevel);
      })).map((spell) => {
        const levels = [...new Set((spell.spellLists || []).filter((membership) => normalizeGuid(membership.sourceGuid) === nativeSpellList).map((membership) => Number(membership.spellLevel)))];
        return { id: spell.sourceGuid, name: `${spell.name || spell.internalName || spell.sourceGuid}${levels.length ? `（${levels.join("/")} 环）` : ""}` };
      }) : [];
      DATA.choiceParameterTypes[type] ||= {
        name: native.type === "FeatureSelection" ? "细分能力" : "法术",
        options: spellOptions.length ? spellOptions : parameterOptions(explicitGuids)
      };
      return { type, required: true, source: "owlcat-parameter" };
    }
    return { type: `owlcat-unsupported:${native.type}`, required: true, source: "owlcat-parameter", unsupported: true };
  }

  function enrich(existing, source, extra = {}) {
    if (!source) return { ...existing, sourceVerified: false };
    const verifiedParameter = sourceParameter(source);
    return {
      ...existing,
      ...extra,
      name: source.name || existing.name,
      text: stripMarkup(source.description) || existing.text || "",
      sourceGuid: source.sourceGuid,
      sourceVerified: true,
      sourceInternalName: source.internalName,
      sourceBlueprintType: source.blueprintType,
      sourceBlueprintPath: source.blueprintPath,
      nativeRequirements: source.requirements || [],
      nativeAvailability: source.availability || null,
      nativeComponents: source.components || [],
      nativeComponentCount: source.componentCount ?? (source.components || []).length,
      nativeMechanics: source.mechanics || {},
      nativeParameter: source.parameter || null,
      parameter: existing.parameter ? { ...verifiedParameter, ...existing.parameter, nativeFilter: verifiedParameter?.nativeFilter || existing.parameter.nativeFilter, source: "owlcat-verified" } : verifiedParameter
    };
  }

  function mergeCatalog(existingItems, sourceItems, extraForSource) {
    const used = new Set();
    const merged = existingItems.map((existing) => {
      const source = matchSource(existing, sourceItems, used);
      if (source) used.add(source.sourceGuid);
      return enrich(existing, source, source ? extraForSource(source, existing) : {});
    });
    sourceItems.forEach((source) => {
      if (used.has(source.sourceGuid)) return;
      merged.push(enrich({
        id: source.sourceGuid,
        name: source.name || source.internalName || source.sourceGuid,
        text: stripMarkup(source.description),
        req: {},
        sourceOnly: true
      }, source, extraForSource(source, null)));
    });
    return merged;
  }

  DATA.choiceParameterTypes ||= {};
  DATA.choiceParameterTypes.weapon = { name: "武器类别", options: installedWeaponOptions };
  DATA.installedWeaponOptions = installedWeaponOptions;

  const sourceRaces = SOURCE.characterCreation?.races || [];
  const usedRaceGuids = new Set();
  DATA.races = (DATA.races || []).map((entry) => {
    if (entry.playable === false) return entry;
    const source = matchSource(entry, sourceRaces, usedRaceGuids);
    if (!source) return { ...entry, sourceVerified: false };
    usedRaceGuids.add(source.sourceGuid);
    return enrich(entry, source, {
      sourceMechanics: source.mechanics?.race || {},
      sourceFeatureGuids: source.mechanics?.race?.features || [],
      sourceComponents: source.components || []
    });
  });
  const raceIdBySourceGuid = new Map(DATA.races.filter((entry) => entry.sourceGuid).map((entry) => [entry.sourceGuid, entry.id]));

  const sourceHeritages = [];
  (SOURCE.characterCreation?.heritageByRace || []).forEach((relation) => {
    const raceGuid = normalizeGuid(relation.raceGuid);
    const raceId = raceIdBySourceGuid.get(raceGuid);
    if (!raceId) return;
    const pool = poolByGuid.get(normalizeGuid(relation.heritageSelectionGuid));
    if (!pool) {
      const raceSource = sourceDefinitions[raceGuid] || sourceRaces.find((entry) => entry.sourceGuid === raceGuid);
      sourceHeritages.push({ ...(raceSource || {}), sourceGuid: raceGuid, raceId, baseRace: true });
      return;
    }
    pool.optionSourceGuids.forEach((guid) => sourceHeritages.push({ ...(sourceDefinitions[guid] || { sourceGuid: guid }), sourceGuid: guid, raceId }));
  });
  const heritageInternalOverrides = {
    "elf-base": "BaseRaceFeature", "elf-blightborn": "BlightbornElf", "elf-loremaster": "LoremasterElf",
    "dwarf-base": "BaseRaceFeature", "dwarf-barrow": "BarrowDwarf", "dwarf-unstoppable": "UnstoppableDwarf",
    "gnome-base": "BaseRaceFeature", "gnome-pyromaniac": "PyromaniacGnome", "gnome-traveler": "TravellerGnome",
    "halfling-base": "BaseRaceFeature", "halfling-hasty": "HastyHalfling",
    "half-elf-base": "BaseRaseHalfElfSelection", "half-elf-dual": "DualMindedHalfElf", "half-elf-kindred": "KindredRaisedHalfElf",
    "half-orc-base": "BaseRaceFeature",
    "aasimar-base": "ClassicHeritage", "aasimar-angelkin": "AngelHeritage", "aasimar-emberkin": "PeriHeritage",
    "aasimar-idyllkin": "AgathionHeritage", "aasimar-lawbringer": "ArchonHeritage", "aasimar-musetouched": "AzataHeritage", "aasimar-plumekith": "GarudaHeritage",
    "tiefling-base": "TieflingHeritageClassic", "tiefling-beastbrood": "TieflingHeritageRakshasa", "tiefling-faultspawn": "TieflingHeritageAsura",
    "tiefling-foulspawn": "TieflingHeritageDemodand", "tiefling-grimspawn": "TieflingHeritageDaemon", "tiefling-hellspawn": "TieflingHeritageDevil",
    "tiefling-hungerseed": "TieflingHeritageOni", "tiefling-motherless": "TieflingHeritageQlippoth", "tiefling-pitborn": "TieflingHeritageDemon",
    "tiefling-shackleborn": "TieflingHeritageKyton", "tiefling-spitespawn": "TieflingHeritageDiv",
    "oread-base": "OreadHeritageClassic", "oread-gemsoul": "OreadHeritageGemsoul", "oread-ironsoul": "OreadHeritageIronsoul",
    "dhampir-base": "DhampirHeritageClassic", "dhampir-ru-shi": "DhampirHeritageJiangShi", "dhampir-svetocher": "DhampirHeritageMoroiSvetocher",
    "dhampir-ancient-born": "DhampirHeritageNosferatu", "dhampir-sacred-ancestry": "DhampirHeritageSacredAncestry", "dhampir-ajibachana": "DhampirHeritageVetala",
    "kitsune-base": "KitsuneHeritageClassic", "kitsune-keen": "KitsuneHeritageKeen"
  };
  const usedHeritageKeys = new Set();
  const heritageKey = (source) => `${source.raceId}:${source.sourceGuid}`;
  const mergedHeritages = (DATA.heritages || []).map((entry) => {
    const candidates = sourceHeritages.filter((source) => source.raceId === entry.raceId);
    const internalOverride = heritageInternalOverrides[entry.id];
    let source = candidates.find((candidate) => candidate.internalName === internalOverride && !usedHeritageKeys.has(heritageKey(candidate)))
      || candidates.find((candidate) => candidate.name === entry.name && !usedHeritageKeys.has(heritageKey(candidate)));
    if (!source && entry.id === "human-base") {
      const humanGuid = DATA.races.find((race) => race.id === "human")?.sourceGuid;
      const humanSource = sourceHeritages.find((candidate) => candidate.sourceGuid === humanGuid);
      if (humanSource) {
        usedHeritageKeys.add(heritageKey(humanSource));
        return enrich(entry, humanSource);
      }
    }
    if (!source) return { ...entry, sourceVerified: false };
    usedHeritageKeys.add(heritageKey(source));
    return enrich(entry, source);
  });
  sourceHeritages.forEach((source) => {
    if (usedHeritageKeys.has(heritageKey(source))) return;
    mergedHeritages.push(enrich({ id: source.sourceGuid, raceId: source.raceId, name: source.name || source.internalName || source.sourceGuid, bonus: "见游戏内种族能力", text: "" }, source));
  });
  DATA.legacyHeritages = mergedHeritages.filter((entry) => !entry.sourceVerified);
  DATA.heritages = mergedHeritages.filter((entry) => entry.sourceVerified);

  function backgroundOptions(rootGuid) {
    const root = poolByGuid.get(rootGuid);
    const playable = [];
    const technical = [];
    if (!root) return { playable, technical };
    root.optionSourceGuids.forEach((guid) => {
      const definition = sourceDefinitions[guid] || { sourceGuid: guid };
      const categoryPool = poolByGuid.get(guid);
      if (categoryPool) {
        categoryPool.optionSourceGuids.forEach((optionGuid) => {
          const option = sourceDefinitions[optionGuid] || { sourceGuid: optionGuid };
          playable.push({
            ...option,
            sourceGuid: optionGuid,
            category: definition.name || categoryPool.name || "其他",
            categoryId: guid,
            nestedSelectionGuid: poolByGuid.has(optionGuid) ? optionGuid : null
          });
        });
        return;
      }
      const entry = { ...definition, sourceGuid: guid, category: "其他", categoryId: "background:other" };
      if (definition.availability?.scope === "companion-or-npc") technical.push(entry);
      else playable.push(entry);
    });
    return { playable, technical };
  }
  const backgroundCatalog = backgroundOptions(normalizeGuid(SOURCE.characterCreation?.backgroundSelectionGuid));
  const sourceBackgrounds = backgroundCatalog.playable;
  DATA.technicalBackgrounds = backgroundCatalog.technical.map((source) => enrich({ id: source.sourceGuid, name: source.name || source.internalName || source.sourceGuid, category: source.category, categoryId: source.categoryId, text: "" }, source));
  const backgroundInternalOverrides = {
    none: "BackgroundNone",
    farmhand: "BackgroundFarmhand", lumberjack: "BackgroundLumberjack", miner: "BackgroundMiner", smith: "BackgroundSmith",
    courtier: "BackgroundCourtIntriguer", emissary: "BackgroundEmissary", leader: "BackgroundLeader",
    acolyte: "BackgroundAcolyte", healer: "BackgroundHealer", "martial-disciple": "BackgroundMartialDisciple",
    "aldori-swordsman": "BackgroundAldoriSwordsman", "alkenstar-alchemist": "BackgroundAlkenstarAlchemist",
    "andoren-diplomat": "BackgroundAndoranDiplomat", "chelaxian-diabolist": "BackgroundCheliaxianDiabolist",
    "gebbite-necromancer": "BackgroundGebianNecromancer", "mendevian-orphan": "BackgroundMendevianOrphan",
    "mwangi-hunter": "BackgroundMwangianHunter", "nexian-scholar": "BackgroundNexianScholar",
    "osirian-historian": "BackgroundOsirionHistorian", "qadiran-wanderer": "BackgroundQadiranWanderer",
    "river-kingdoms-daredevil": "BackgroundRiverKingdomsDaredevil", "shackles-corsair": "BackgroundShacklesCorsair",
    "ustalavic-peasant": "BackgroundUstalavPeasant", "varisian-explorer": "BackgroundVarisianExplorer",
    "linnorm-warrior": "BackgroundWarriorOfTheLinnormKings",
    "arcane-scholar": "BackgroundScholarArcane", "divine-scholar": "BackgroundScholarDivine",
    "nature-scholar": "BackgroundsDruidSpellLikeSelection",
    acrobat: "BackgroundAcrobat", mugger: "BackgroundMugger", pickpocket: "BackgroundPickpocket",
    hermit: "BackgroundHermit", hunter: "BackgroundHunter", nomad: "BackgroundNomad",
    "bounty-hunter": "BackgroundBountyHunter", gladiator: "BackgroundGladiator", guard: "BackgroundGuard", mercenary: "BackgroundMercenary"
  };
  if (sourceBackgrounds.length) {
    const usedBackgroundGuids = new Set();
    const mergedBackgrounds = (DATA.backgrounds || []).map((entry) => {
      const internalOverride = backgroundInternalOverrides[entry.id];
      const source = sourceBackgrounds.find((candidate) => candidate.internalName === internalOverride && !usedBackgroundGuids.has(candidate.sourceGuid))
        || matchSource(entry, sourceBackgrounds, usedBackgroundGuids);
      if (!source) return { ...entry, sourceVerified: false };
      usedBackgroundGuids.add(source.sourceGuid);
      return enrich(entry, source, { category: source.category, categoryId: source.categoryId });
    });
    sourceBackgrounds.forEach((source) => {
      if (usedBackgroundGuids.has(source.sourceGuid)) return;
      mergedBackgrounds.push(enrich({ id: source.sourceGuid, name: source.name || source.internalName || source.sourceGuid, category: source.category, categoryId: source.categoryId, skills: [], effect: "见游戏内出身能力", proficiencies: "", text: "" }, source));
    });
    DATA.legacyBackgrounds = mergedBackgrounds.filter((entry) => !entry.sourceVerified);
    DATA.backgrounds = mergedBackgrounds.filter((entry) => entry.sourceVerified);
    DATA.backgroundCategories = [...new Map(DATA.backgrounds.map((entry) => [entry.categoryId, { id: entry.categoryId, name: entry.category }])).values()];
  }

  const usedDomainGuids = new Set();
  DATA.domains = (DATA.domains || []).map((entry) => {
    const source = SOURCE.choiceRoots.domains.options.find((candidate) => !usedDomainGuids.has(candidate.sourceGuid)
      && (SOURCE.aliasIndex?.[entry.id] || []).includes(candidate.sourceGuid))
      || SOURCE.choiceRoots.domains.options.find((candidate) => !usedDomainGuids.has(candidate.sourceGuid)
        && String(candidate.internalName || "").toLowerCase().startsWith(entry.id.replaceAll("-", "").toLowerCase()));
    if (!source) return { ...entry, sourceVerified: false };
    usedDomainGuids.add(source.sourceGuid);
    return enrich(entry, source);
  });

  const alignmentIds = ["LG", "NG", "CG", "LN", "N", "CN", "LE", "NE", "CE"];
  function alignmentsFromNative(requirements) {
    const raw = requirements?.find((requirement) => String(requirement.$type || "").endsWith(", PrerequisiteAlignment"))?.Alignment;
    if (!raw) return [...alignmentIds];
    const terms = String(raw).split(/[,|]/).map((term) => term.trim()).filter(Boolean);
    const exact = { LawfulGood: "LG", NeutralGood: "NG", ChaoticGood: "CG", LawfulNeutral: "LN", TrueNeutral: "N", ChaoticNeutral: "CN", LawfulEvil: "LE", NeutralEvil: "NE", ChaoticEvil: "CE" };
    const result = new Set();
    terms.forEach((term) => {
      if (exact[term]) result.add(exact[term]);
      else if (term === "Lawful") alignmentIds.filter((id) => id.startsWith("L")).forEach((id) => result.add(id));
      else if (term === "Chaotic") alignmentIds.filter((id) => id.startsWith("C")).forEach((id) => result.add(id));
      else if (term === "Good") alignmentIds.filter((id) => id.endsWith("G")).forEach((id) => result.add(id));
      else if (term === "Evil") alignmentIds.filter((id) => id.endsWith("E")).forEach((id) => result.add(id));
      else if (term === "Neutral") ["NG", "LN", "N", "CN", "NE"].forEach((id) => result.add(id));
    });
    return result.size ? [...result] : [...alignmentIds];
  }
  const domainByOfficialName = new Map(DATA.domains.filter((entry) => entry.sourceGuid).map((entry) => {
    const source = sourceDefinitions[entry.sourceGuid] || SOURCE.choiceRoots.domains.options.find((candidate) => candidate.sourceGuid === entry.sourceGuid);
    return [String(source?.name || "").replace(/(?:领域|子域|次领域)$/u, ""), entry.id];
  }));
  function deityDomains(source) {
    const line = String(source.description || "").match(/领域：([^\n]+)/u)?.[1] || "";
    return line.split(/[、,，]/u)
      .map((name) => name.trim().replace(/[。.]+$/u, "").replace(/(?:领域|子域|次领域)$/u, ""))
      .map((name) => domainByOfficialName.get(name)).filter(Boolean);
  }
  function deityWeapon(source) {
    return String(source.description || "").match(/偏[爱好]武器：([^\n]+)/u)?.[1]?.trim() || "—";
  }
  const sourceDeities = SOURCE.characterCreation?.deities || [];
  if (sourceDeities.length) {
    const usedDeityGuids = new Set();
    const mergedDeities = (DATA.deities || []).map((entry) => {
      const source = matchSource(entry, sourceDeities, usedDeityGuids);
      if (!source) return { ...entry, sourceVerified: false };
      usedDeityGuids.add(source.sourceGuid);
      return enrich(entry, source, { alignments: alignmentsFromNative(source.requirements), domains: deityDomains(source), weapon: deityWeapon(source) });
    });
    sourceDeities.forEach((source) => {
      if (usedDeityGuids.has(source.sourceGuid)) return;
      mergedDeities.push(enrich({ id: source.sourceGuid, name: source.name || source.internalName || source.sourceGuid, alignments: alignmentsFromNative(source.requirements), domains: deityDomains(source), weapon: deityWeapon(source), text: "" }, source));
    });
    DATA.legacyDeities = mergedDeities.filter((entry) => !entry.sourceVerified);
    DATA.deities = mergedDeities.filter((entry) => entry.sourceVerified);
  }

  if (DATA.choiceParameterTypes.domain) DATA.choiceParameterTypes.domain.options = DATA.domains.filter((entry) => entry.sourceVerified).map((entry) => ({ id: entry.id, name: entry.name }));

  DATA.feats = mergeCatalog(DATA.feats || [], SOURCE.choiceRoots.basicFeats.options, () => ({ category: "游戏内专长" }));
  DATA.mythic = [
    ...mergeCatalog((DATA.mythic || []).filter((item) => item.type === "ability"), SOURCE.choiceRoots.mythicAbilities.options, () => ({ type: "ability" })),
    ...mergeCatalog((DATA.mythic || []).filter((item) => item.type === "feat"), SOURCE.choiceRoots.mythicFeats.options, () => ({ type: "feat" }))
  ];

  const spellSchoolNames = {
    Abjuration: "防护", Conjuration: "咒法", Divination: "预言", Enchantment: "附魔",
    Evocation: "塑能", Illusion: "幻术", Necromancy: "死灵", Transmutation: "变化",
    Universalist: "通用"
  };
  const legacySpellInternalOverrides = {
    "bull-strength": "BullsStrength",
    "cure-critical": "CureCriticalWoundsCast",
    "finger-death": "FingerOfDeath"
  };
  const sourceSpellGuidByInternalName = new Map((SOURCE.spells || []).map((source) => [source.internalName, source.sourceGuid]));
  const legacySpellsWithSource = (DATA.spells || []).map((spell) => {
    const internalName = legacySpellInternalOverrides[spell.id];
    return internalName ? { ...spell, sourceGuid: sourceSpellGuidByInternalName.get(internalName) || null } : spell;
  });
  const mergedSpells = mergeCatalog(legacySpellsWithSource, SOURCE.spells || [], (source) => {
    const memberships = source.spellLists || [];
    const nativeSchool = source.mechanics?.ability?.school || null;
    const levels = [...new Set(memberships.map((item) => Number(item.spellLevel)).filter(Number.isFinite))].sort((a, b) => a - b);
    const sourceSpellbooks = (SOURCE.spellbooks || []).filter((spellbook) => memberships.some((membership) => [spellbook.spellList, spellbook.mythicSpellList]
      .map(normalizeGuid).filter(Boolean).includes(normalizeGuid(membership.sourceGuid))))
      .map((spellbook) => {
        const ownerGuid = normalizeGuid(spellbook.characterClass);
        const owner = sourceOwnerName(ownerGuid, spellbook);
        const ownerClass = sourceClassByGuid.get(ownerGuid);
        const kind = spellbook.isMythic ? "神话" : (spellbook.isArcane || ownerClass?.mechanics?.characterClass?.isArcaneCaster) ? "奥术" : ownerClass?.mechanics?.characterClass?.isDivineCaster ? "神术" : "特殊法表";
        return { sourceGuid: spellbook.sourceGuid, ownerGuid, owner, kind };
      });
    const castingKinds = [...new Set([
      ...sourceSpellbooks.map((entry) => entry.kind),
      ...memberships.filter((membership) => /Domain/i.test(membership.internalName || "")).map(() => "领域")
    ])];
    return {
      level: levels[0] ?? 0,
      levels,
      lists: [...new Set(memberships.map((item) => normalizeGuid(item.sourceGuid)).filter(Boolean))],
      spellLists: memberships,
      school: spellSchoolNames[nativeSchool] || nativeSchool || "未标注",
      nativeSchool,
      nativeMechanics: source.mechanics?.ability || {},
      nativeComponents: source.components || [],
      nativeComponentCount: source.componentCount ?? (source.components || []).length,
      sourceSpellbooks,
      castingKinds: castingKinds.length ? castingKinds : ["特殊法表"]
    };
  });
  DATA.legacySpells = mergedSpells.filter((entry) => !entry.sourceVerified);
  DATA.spells = mergedSpells.filter((entry) => entry.sourceVerified);
  DATA.domains = (DATA.domains || []).map((domain) => {
    const source = sourceDefinitions[normalizeGuid(domain.sourceGuid)] || SOURCE.choiceRoots.domains.options.find((item) => item.sourceGuid === domain.sourceGuid);
    const progression = progressionByGuid.get(normalizeGuid(domain.sourceGuid));
    const levelFeatures = (progression?.levels || []).flatMap((level) => level.features.map((guid) => {
      const feature = sourceDefinitions[normalizeGuid(guid)] || {};
      return {
        level: Number(level.level),
        id: guid,
        name: feature.name || feature.internalName || guid,
        text: stripMarkup(feature.description),
        mechanics: feature.mechanics || {},
        components: feature.components || []
      };
    }));
    const spellListGuids = [...new Set((source?.components || [])
      .filter((component) => String(component.$type || "").endsWith(", LearnSpellList"))
      .map((component) => normalizeGuid(component.m_SpellList)).filter(Boolean))];
    const domainSpells = DATA.spells.filter((spell) => (spell.spellLists || []).some((membership) => spellListGuids.includes(normalizeGuid(membership.sourceGuid))))
      .map((spell) => ({
        id: spell.id,
        name: spell.name,
        level: Math.min(...spell.spellLists.filter((membership) => spellListGuids.includes(normalizeGuid(membership.sourceGuid))).map((membership) => Number(membership.spellLevel)))
      }))
      .sort((left, right) => left.level - right.level || left.name.localeCompare(right.name, "zh-CN"));
    return { ...domain, levelFeatures, spellListGuids, domainSpells };
  });
  if (DATA.choiceParameterTypes?.spell) {
    DATA.choiceParameterTypes.spell.options = DATA.spells.map((item) => ({
      id: item.id,
      name: `${item.name}（${(item.levels || [item.level]).join("/")} 环）`
    }));
  }

  const usedClassGuids = new Set();
  DATA.classes = (DATA.classes || []).map((entry) => {
    const source = matchSource(entry, allSourceClasses, usedClassGuids);
    if (!source) return { ...entry, sourceVerified: false };
    usedClassGuids.add(source.sourceGuid);
    const mechanics = source.mechanics?.characterClass || {};
    return enrich(entry, source, {
      sourceGroup: source.group,
      sourceMechanics: mechanics,
      sourceComponents: source.components || [],
      hitDie: Number(String(mechanics.hitDie || "").replace(/^D/i, "")) || entry.hitDie,
      skillPoints: mechanics.skillPoints ?? entry.skillPoints,
      classSkills: mechanics.classSkills || entry.classSkills
    });
  });
  const classGuidByLegacyId = Object.fromEntries(DATA.classes.filter((entry) => entry.sourceGuid).map((entry) => [entry.id, entry.sourceGuid]));

  const usedArchetypeGuids = new Set();
  DATA.archetypes = (DATA.archetypes || []).map((entry) => {
    const classGuid = classGuidByLegacyId[entry.baseClass];
    const internalOverride = archetypeInternalOverrides[`${entry.baseClass}:${entry.id}`];
    const source = SOURCE.archetypes.find((candidate) => candidate.classGuid === classGuid && candidate.internalName === internalOverride && !usedArchetypeGuids.has(candidate.sourceGuid))
      || matchSource(entry, SOURCE.archetypes, usedArchetypeGuids, { classGuid });
    if (!source) return { ...entry, sourceVerified: false };
    usedArchetypeGuids.add(source.sourceGuid);
    return enrich(entry, source, {
      sourceClassGuid: source.classGuid,
      addFeatures: source.addFeatures || [],
      removeFeatures: source.removeFeatures || [],
      replaceSpellbook: source.replaceSpellbook || null
    });
  });

  function selectionOption(guid) {
    const entry = sourceDefinitions[guid] || { sourceGuid: guid, id: guid };
    const nested = poolByGuid.get(guid);
    return {
      id: guid,
      name: entry.name || entry.internalName || guid,
      text: stripMarkup(entry.description),
      sourceGuid: guid,
      nativeRequirements: entry.requirements || [],
      nativeComponents: entry.components || [],
      nativeMechanics: entry.mechanics || {},
      nativeParameter: entry.parameter || null,
      parameter: nested ? null : sourceParameter(entry),
      nestedSelectionGuid: nested ? guid : null,
      nestedOptions: nested ? parameterOptions(nested.optionSourceGuids) : []
    };
  }

  DATA.featureGroups ||= {};
  (SOURCE.selectionPools || []).forEach((pool) => {
    const groupId = `owlcat:${pool.sourceGuid}`;
    DATA.featureGroups[groupId] = {
      name: pool.name || sourceDefinitions[pool.sourceGuid]?.name || pool.internalName || "职业选项",
      sourceGuid: pool.sourceGuid,
      options: pool.optionSourceGuids.map(selectionOption)
    };
  });

  const mythicPathInternalNames = {
    angel: "AngelMythicClass", demon: "DemonMythicClass", aeon: "AeonMythicClass", azata: "AzataMythicClass",
    lich: "LichMythicClass", trickster: "TricksterMythicClass", "gold-dragon": "GoldenDragonClass",
    devil: "DevilMythicClass", swarm: "SwarmThatWalksClass", legend: "LegendClass"
  };
  const sourceMythicClasses = SOURCE.mythicClasses?.playable || [];
  const genericMythicSelectionGuids = new Set([
    normalizeGuid(SOURCE.choiceRoots?.mythicAbilities?.sourceGuid),
    normalizeGuid(SOURCE.choiceRoots?.mythicFeats?.sourceGuid)
  ].filter(Boolean));
  const sourcePathAbilities = [];
  DATA.owlcatPathProgressions = {};
  DATA.paths = (DATA.paths || []).map((path) => {
    const sourceClass = sourceMythicClasses.find((entry) => entry.internalName === mythicPathInternalNames[path.id]);
    if (!sourceClass) return path;
    const rule = DATA.mythicPathRules?.[path.id] || {};
    const progression = progressionByGuid.get(normalizeGuid(sourceClass.mechanics?.characterClass?.progression));
    const entryRank = Number(rule.entryRank) || (rule.kind === "late" ? 8 : 3);
    const sourceLevels = (progression?.levels || []).map((level) => {
      const rank = entryRank + Number(level.level) - 1;
      const picks = [];
      const auto = [];
      const occurrences = new Map();
      const autoOccurrences = new Map();
      (level.features || []).forEach((guidValue) => {
        const guid = normalizeGuid(guidValue);
        if (!guid || genericMythicSelectionGuids.has(guid)) return;
        const pool = poolByGuid.get(guid);
        const definition = sourceDefinitions[guid] || {};
        const spellbookAdvance = definition.mechanics?.spellbookAdvance;
        if (!pool && spellbookAdvance?.kind === "merge-mythic-spellbook") {
          const groupId = `owlcat-path:${path.id}:spellbook:${guid}`;
          picks.push({
            id: `owlcat-path:${path.id}:${rank}:${guid}:spellbook`,
            groupId,
            count: 1,
            label: definition.name || "神话法术书",
            source: `mythic:path:${path.id}:owlcat`,
            sourceGuid: guid,
            nativeRequirements: definition.requirements || [],
            ignorePrerequisites: false
          });
          const spellbookOptions = [null, ...(spellbookAdvance.allowedSpellbooks || [])];
          spellbookOptions.forEach((targetSpellbook) => {
            const targetGuid = normalizeGuid(targetSpellbook);
            const spellbook = targetGuid ? spellbookByGuid.get(targetGuid) : null;
            const owner = spellbook ? sourceClassNameByGuid.get(normalizeGuid(spellbook.characterClass)) : null;
            sourcePathAbilities.push({
              id: `owlcat-path:${path.id}:${guid}:${targetGuid || "standalone"}`,
              path: path.id,
              group: groupId,
              name: targetGuid ? `合并：${owner || spellbook?.internalName || targetGuid}` : "独立神话法术书",
              text: targetGuid ? `将${definition.name || "神话法术书"}合并到${owner || spellbook?.internalName || "所选职业法术书"}。` : `使用独立的${path.name}神话法术书。`,
              sourceGuid: guid,
              sourceVerified: true,
              requiresSpellbookGuid: targetGuid,
              nativeRequirements: [],
              nativeComponents: [],
              nativeMechanics: {
                ...definition.mechanics,
                spellbookAdvance: { ...spellbookAdvance, targetSpellbook: targetGuid }
              },
              nativeParameter: null,
              parameter: null
            });
          });
          return;
        }
        if (!pool) {
          const existingAuto = autoOccurrences.get(guid);
          if (existingAuto) {
            existingAuto.count += 1;
            return;
          }
          const autoGrant = {
            sourceGuid: guid,
            name: definition.name || definition.internalName || guid,
            text: stripMarkup(definition.description),
            mechanics: definition.mechanics || {},
            components: definition.components || [],
            count: 1,
            public: Boolean(definition.name && !definition.mechanics?.feature?.hideInUI)
          };
          auto.push(autoGrant);
          autoOccurrences.set(guid, autoGrant);
          return;
        }
        const occurrence = (occurrences.get(guid) || 0) + 1;
        occurrences.set(guid, occurrence);
        const groupId = `owlcat-path:${path.id}:${guid}`;
        const label = pool.name || definition.name || pool.internalName || "道途选择";
        picks.push({
          id: `owlcat-path:${path.id}:${rank}:${guid}:${occurrence}`,
          groupId,
          count: 1,
          label,
          source: `mythic:path:${path.id}:owlcat`,
          sourceGuid: guid,
          nativeRequirements: definition.requirements || [],
          ignorePrerequisites: path.id === "gold-dragon" && (/FeatSelection$/i.test(definition.internalName || "") || /龙族专长/.test(label))
        });
        pool.optionSourceGuids.forEach((optionGuid) => {
          if (sourcePathAbilities.some((item) => item.path === path.id && item.group === groupId && item.sourceGuid === optionGuid)) return;
          const option = sourceDefinitions[normalizeGuid(optionGuid)] || { sourceGuid: optionGuid };
          sourcePathAbilities.push({
            id: `owlcat-path:${path.id}:${guid}:${optionGuid}`,
            path: path.id,
            group: groupId,
            name: option.name || option.internalName || optionGuid,
            text: stripMarkup(option.description),
            sourceGuid: optionGuid,
            sourceVerified: true,
            nativeRequirements: option.requirements || [],
            nativeComponents: option.components || [],
            nativeMechanics: option.mechanics || {},
            nativeParameter: option.parameter || null,
            parameter: sourceParameter(option)
          });
        });
      });
      return { rank, classLevel: Number(level.level), picks, auto };
    });
    DATA.owlcatPathProgressions[path.id] = { pathId: path.id, sourceClassGuid: sourceClass.sourceGuid, entryRank, levels: sourceLevels };
    if (DATA.mythicPathRules?.[path.id]) {
      DATA.mythicPathRules[path.id].steps = Object.fromEntries(sourceLevels.map((level) => [level.rank, level.picks]));
      const grantLabel = (item) => `${item.name}${Number(item.count) > 1 ? ` ×${item.count}` : ""}`;
      DATA.mythicPathRules[path.id].rankGrants = Object.fromEntries(sourceLevels.map((level) => [level.rank, level.auto.filter((item) => item.public).map(grantLabel)]));
      DATA.mythicPathRules[path.id].grants = sourceLevels.flatMap((level) => level.auto.filter((item) => item.public).map(grantLabel));
    }
    return enrich(path, sourceClass, {
      sourceProgressionGuid: progression?.guid || null,
      sourceEntryRank: entryRank,
      sourceMechanics: sourceClass.mechanics?.characterClass || {}
    });
  });
  DATA.legacyPathAbilities = DATA.pathAbilities || [];
  DATA.pathAbilities = sourcePathAbilities;

  const featBySourceGuid = new Map(DATA.feats.filter((item) => item.sourceGuid).map((item) => [item.sourceGuid, item]));
  function poolKind(pool) {
    if (!pool?.optionSourceGuids?.length) return "feature";
    const featOptions = pool.optionSourceGuids.filter((guid) => featBySourceGuid.has(guid)).length;
    return featOptions === pool.optionSourceGuids.length ? "feat" : "feature";
  }

  function classProgression(sourceClass) {
    const direct = progressionByGuid.get(normalizeGuid(sourceClass.mechanics?.characterClass?.progression));
    if (direct) return direct;
    const exactName = String(sourceClass.internalName || "").replace(/Class$/, "Progression");
    const candidates = (sourceClass.references || []).map((guid) => progressionByGuid.get(guid)).filter(Boolean);
    return candidates.find((entry) => entry.internalName === exactName)
      || candidates.find((entry) => entry.internalName?.startsWith(String(sourceClass.internalName || "").replace(/Class$/, "")))
      || (candidates.length === 1 ? candidates[0] : null);
  }

  const classProgressionByLegacyId = new Map();
  DATA.classes.forEach((entry) => {
    if (!entry.sourceGuid) return;
    const progression = classProgression(sourceClassByGuid.get(entry.sourceGuid));
    if (progression) classProgressionByLegacyId.set(entry.id, progression);
  });

  DATA.owlcatClassProgressionReady = Object.fromEntries([...classProgressionByLegacyId.keys()].map((id) => [id, true]));

  function sourceSpellbookForClass(classId, archetypeId = null) {
    const entry = DATA.classes.find((candidate) => candidate.id === classId);
    if (!entry?.sourceGuid) return null;
    const archetype = (DATA.archetypes || []).find((candidate) => candidate.baseClass === classId && candidate.id === archetypeId);
    const replacement = normalizeGuid(archetype?.replaceSpellbook);
    return spellbookByGuid.get(replacement || normalizeGuid(entry.sourceMechanics?.spellbook)) || null;
  }

  function maxSpellLevelForClass(classId, classLevel, archetypeId = null) {
    const spellbook = sourceSpellbookForClass(classId, archetypeId);
    return spellbook ? maxSpellLevelForSpellbook(spellbook.sourceGuid || spellbook.guid, classLevel) : null;
  }

  function maxSpellLevelForSpellbook(spellbookGuid, effectiveClassLevel) {
    const spellbook = spellbookByGuid.get(normalizeGuid(spellbookGuid));
    const table = spellbook ? spellsTableByGuid.get(normalizeGuid(spellbook.spellsPerDayTable)) : null;
    if (!table) return null;
    const requestedLevel = Math.max(0, (Number(effectiveClassLevel) || 0) + (Number(spellbook.casterLevelModifier) || 0));
    const row = [...(table.levels || [])]
      .filter((entry) => Number(entry.classLevel) <= requestedLevel)
      .sort((left, right) => Number(right.classLevel) - Number(left.classLevel))[0];
    if (!row) return 0;
    // A zero base slot at the last index still unlocks that spell level when
    // the casting ability grants a bonus slot (notably Paladin/Ranger).
    return Math.max(0, (row.count || []).length - 1);
  }

  function skippedSpellProgressionLevels(classEntry) {
    const modeled = classEntry?.sourceMechanics?.skipSpellProgressionLevels;
    if (Array.isArray(modeled)) return modeled.map(Number).filter(Number.isFinite);
    return (classEntry?.sourceComponents || [])
      .filter((component) => String(component.$type || "").endsWith(", SkipLevelsForSpellProgression"))
      .flatMap((component) => component.Levels || [])
      .map(Number).filter(Number.isFinite);
  }

  function characterSpellbookProjection(character) {
    const books = new Map();
    const classLevels = new Map();
    const prestigeTargets = new Map();
    const addLevel = (spellbookGuid, sourceClassId, source) => {
      const guid = normalizeGuid(spellbookGuid);
      const spellbook = spellbookByGuid.get(guid);
      if (!spellbook) return;
      if (!books.has(guid)) books.set(guid, {
        spellbookGuid: guid,
        internalName: spellbook.internalName,
        sourceClassId,
        isArcane: Boolean(spellbook.isArcane),
        spontaneous: Boolean(spellbook.spontaneous),
        castingAttribute: spellbook.castingAttribute || null,
        effectiveClassLevel: 0,
        sources: []
      });
      const projected = books.get(guid);
      projected.effectiveClassLevel += 1;
      projected.sources.push(source);
    };

    (character?.normalSteps || []).forEach((step) => {
      const classId = step.classId;
      const classEntry = DATA.classes.find((entry) => entry.id === classId);
      const classLevel = (classLevels.get(classId) || 0) + 1;
      classLevels.set(classId, classLevel);
      const directSpellbook = sourceSpellbookForClass(classId, step.archetypeId || null);
      if (directSpellbook) addLevel(directSpellbook.sourceGuid || directSpellbook.guid, classId, { characterLevel: Number(step.level), classId, classLevel, kind: "class" });

      const targets = prestigeTargets.get(classId) || new Set();
      (step.featureChoices || []).forEach((choice) => {
        const option = sourceDefinitions[normalizeGuid(choice.optionId || choice.sourceGuid)];
        const advance = option?.mechanics?.spellbookAdvance;
        if (advance?.kind === "replace-class-spellbook" && advance.targetSpellbook) targets.add(normalizeGuid(advance.targetSpellbook));
      });
      prestigeTargets.set(classId, targets);

      if (!classEntry?.sourceMechanics?.prestige || classEntry.sourceMechanics.dontAddCasterLevels) return;
      if (skippedSpellProgressionLevels(classEntry).includes(classLevel)) return;
      targets.forEach((spellbookGuid) => addLevel(spellbookGuid, classId, { characterLevel: Number(step.level), classId, classLevel, kind: "prestige" }));
    });

    const mythicRank = (character?.mythicSteps || []).length;
    const activePath = [...(character?.mythicSteps || [])].reverse().find((step) => step.pathId)?.pathId || null;
    const mythicSpellbookChoice = (character?.mythicSteps || []).flatMap((step) => step.pathChoices || [])
      .map((choice) => DATA.pathAbilities?.find((item) => item.id === choice.optionId))
      .find((item) => item?.path === activePath && item.nativeMechanics?.spellbookAdvance?.kind === "merge-mythic-spellbook");
    if (mythicSpellbookChoice && mythicRank) {
      const advance = mythicSpellbookChoice.nativeMechanics.spellbookAdvance;
      const targetGuid = normalizeGuid(advance.targetSpellbook);
      if (targetGuid && books.has(targetGuid)) {
        for (let rank = 1; rank <= mythicRank; rank += 1) addLevel(targetGuid, activePath, { mythicRank: rank, pathId: activePath, kind: "mythic-merge" });
        const merged = books.get(targetGuid);
        merged.mergedPath = activePath;
        merged.mythicSpellList = normalizeGuid(advance.mythicSpellList);
      } else if (!targetGuid) {
        const path = DATA.paths?.find((entry) => entry.id === activePath);
        const standaloneGuid = normalizeGuid(path?.sourceMechanics?.spellbook);
        for (let level = 1; standaloneGuid && level <= mythicRank * 2; level += 1) addLevel(standaloneGuid, activePath, { mythicRank, pathId: activePath, kind: "mythic-standalone" });
      }
    }

    return [...books.values()].map((entry) => ({
      ...entry,
      maxSpellLevel: maxSpellLevelForSpellbook(entry.spellbookGuid, entry.effectiveClassLevel) || 0
    })).sort((left, right) => right.maxSpellLevel - left.maxSpellLevel || left.spellbookGuid.localeCompare(right.spellbookGuid));
  }

  function spellLevelForClass(spell, classId, archetypeId = null) {
    const spellbook = sourceSpellbookForClass(classId, archetypeId);
    if (!spellbook) return null;
    const listGuids = new Set([normalizeGuid(spellbook.spellList), normalizeGuid(spellbook.mythicSpellList)].filter(Boolean));
    const levels = (spell?.spellLists || []).filter((membership) => listGuids.has(normalizeGuid(membership.sourceGuid)))
      .map((membership) => Number(membership.spellLevel)).filter(Number.isFinite);
    return levels.length ? Math.min(...levels) : null;
  }

  DATA.owlcatSpellbookForClass = sourceSpellbookForClass;
  DATA.owlcatMaxSpellLevelForClass = maxSpellLevelForClass;
  DATA.owlcatMaxSpellLevelForSpellbook = maxSpellLevelForSpellbook;
  DATA.owlcatCharacterSpellbooks = characterSpellbookProjection;
  DATA.owlcatSpellLevelForClass = (spellOrId, classId, archetypeId = null) => {
    const spell = typeof spellOrId === "string" ? DATA.spells.find((entry) => entry.id === spellOrId) : spellOrId;
    return spellLevelForClass(spell, classId, archetypeId);
  };
  DATA.owlcatSpellOptionsForClass = (classId, archetypeId = null, spellLevel = null) => DATA.spells.filter((spell) => {
    const level = spellLevelForClass(spell, classId, archetypeId);
    return level !== null && (spellLevel === null || level === Number(spellLevel));
  });
  DATA.owlcatKnownSpellPickSpec = (classId, classLevel, archetypeId = null) => {
    const spellbook = sourceSpellbookForClass(classId, archetypeId);
    if (!spellbook) return null;
    if (!spellbook.spontaneous || !spellbook.spellsKnownTable) return {};
    const table = spellsTableByGuid.get(normalizeGuid(spellbook.spellsKnownTable));
    if (!table) return null;
    const current = table.levels.find((entry) => Number(entry.classLevel) === Number(classLevel))?.count || [];
    const previous = table.levels.find((entry) => Number(entry.classLevel) === Number(classLevel) - 1)?.count || [];
    return Object.fromEntries(current.map((total, spellLevel) => [spellLevel, Math.max(0, Number(total || 0) - Number(previous[spellLevel] || 0))])
      .filter(([spellLevel, count]) => spellLevel > 0 && count > 0));
  };
  DATA.owlcatClassStatBonus = (classId, statistic, classLevel) => {
    const entry = DATA.classes.find((candidate) => candidate.id === classId);
    const field = { bab: "baseAttackBonus", fort: "fortitudeSave", ref: "reflexSave", will: "willSave" }[statistic];
    const progression = field ? statProgressionByGuid.get(normalizeGuid(entry?.sourceMechanics?.[field])) : null;
    const value = progression?.bonuses?.[Number(classLevel)];
    return Number.isFinite(Number(value)) ? Number(value) : null;
  };

  function classFeatureGuidsAtLevel(classId, classLevel, archetypeId = null) {
    const progression = classProgressionByLegacyId.get(classId);
    if (!progression) return [];
    let featureGuids = progression.levels.find((entry) => entry.level === classLevel)?.features || [];
    const archetype = (DATA.archetypes || []).find((entry) => entry.baseClass === classId && entry.id === archetypeId && entry.sourceGuid);
    if (archetype) {
      const removed = new Set((archetype.removeFeatures || []).filter((entry) => entry.level === classLevel).flatMap((entry) => entry.features));
      featureGuids = featureGuids.filter((guid) => !removed.has(guid));
      featureGuids = [...featureGuids, ...(archetype.addFeatures || []).filter((entry) => entry.level === classLevel).flatMap((entry) => entry.features)];
    }
    return featureGuids;
  }

  DATA.owlcatSlotsForClass = (classId, classLevel, archetypeId = null) => {
    const featureGuids = classFeatureGuidsAtLevel(classId, classLevel, archetypeId).filter((guid) => !domainSelectionGuids.has(normalizeGuid(guid)));
    return featureGuids.filter((guid) => poolByGuid.has(guid)).map((guid, index) => {
      const pool = poolByGuid.get(guid);
      const definition = sourceDefinitions[guid] || {};
      return {
        id: `owlcat:${classId}:${classLevel}:${guid}:${index + 1}`,
        kind: poolKind(pool),
        groupId: `owlcat:${guid}`,
        pool: `owlcat:${guid}`,
        label: pool.name || sourceDefinitions[guid]?.name || pool.internalName || "职业选项",
        source: `class:${classId}:owlcat`,
        sourceGuid: guid,
        nativeRequirements: definition.requirements || []
      };
    });
  };
  DATA.owlcatDomainSlotsForClass = (classId, classLevel, archetypeId = null) => {
    const featureGuids = classFeatureGuidsAtLevel(classId, classLevel, archetypeId).filter((guid) => domainSelectionGuids.has(normalizeGuid(guid)));
    return featureGuids.map((guid, index) => {
      const pool = poolByGuid.get(guid);
      const definition = sourceDefinitions[guid] || {};
      const allowedDomainSourceGuids = [...(pool?.optionSourceGuids || [])];
      const allowedDomainNames = new Set(allowedDomainSourceGuids.map((optionGuid) => sourceDefinitions[normalizeGuid(optionGuid)]?.name).filter(Boolean));
      return {
        id: `domain:${classId}:${classLevel}:${guid}:${index + 1}`,
        kind: "domain",
        label: pool?.name || definition.name || pool?.internalName || "领域",
        source: `class:${classId}:owlcat`,
        sourceGuid: guid,
        allowedDomainSourceGuids,
        allowedDomainIds: DATA.domains.filter((domain) => allowedDomainSourceGuids.includes(domain.sourceGuid) || allowedDomainNames.has(domain.name)).map((domain) => domain.id)
      };
    });
  };
  DATA.owlcatAutoFeaturesForClass = (classId, classLevel, archetypeId = null) => classFeatureGuidsAtLevel(classId, classLevel, archetypeId)
    .filter((guid) => !poolByGuid.has(guid))
    .map((guid) => sourceDefinitions[normalizeGuid(guid)] || { sourceGuid: guid, id: guid, name: guid, description: "" })
    .map((feature) => ({
      id: feature.sourceGuid || feature.id,
      sourceGuid: feature.sourceGuid || feature.id,
      name: feature.name || feature.internalName || feature.sourceGuid || feature.id,
      text: stripMarkup(feature.description),
      mechanics: feature.mechanics || {},
      components: feature.components || []
    }));

  const catalogOwnerLabels = (occurrences) => [...new Set((occurrences || []).map((occurrence) => occurrence.ownerName).filter(Boolean))];
  const adaptCatalogEntries = (entries, catalogKind) => (entries || []).map((entry) => {
    const definition = sourceDefinitions[normalizeGuid(entry.sourceGuid)] || {};
    const owners = catalogOwnerLabels(entry.occurrences);
    return {
      id: entry.sourceGuid,
      sourceGuid: entry.sourceGuid,
      catalogKind,
      name: definition.name || definition.internalName || entry.sourceGuid,
      text: stripMarkup(definition.description),
      officialLocalized: Boolean(definition.name && definition.description),
      sourceInternalName: definition.internalName || null,
      sourceBlueprintType: definition.blueprintType || null,
      sourceBlueprintPath: definition.blueprintPath || null,
      nativeRequirements: definition.requirements || [],
      nativeAvailability: definition.availability || null,
      nativeMechanics: definition.mechanics || {},
      nativeComponents: definition.components || [],
      nativeComponentCount: definition.componentCount ?? (definition.components || []).length,
      occurrences: entry.occurrences || [],
      owners,
      sourceVerified: true,
      readOnly: true
    };
  });
  const abilityKindNames = {
    Spell: "法术",
    SpellLike: "类法术",
    Supernatural: "超自然",
    Extraordinary: "特异",
    Special: "特殊",
    Physical: "物理",
    CombatManeuver: "战技"
  };
  const abilityCatalog = (SOURCE.catalogs?.abilities || []).map((guid) => {
    const definition = sourceDefinitions[normalizeGuid(guid)] || {};
    const nativeType = definition.mechanics?.ability?.type || (definition.blueprintType === "BlueprintActivatableAbility" ? "Activatable" : "Special");
    return {
      id: guid,
      sourceGuid: guid,
      catalogKind: "ability",
      abilityKind: nativeType,
      abilityKindName: abilityKindNames[nativeType] || (nativeType === "Activatable" ? "可激活" : nativeType),
      sourceCategory: definition.blueprintPath?.split(/[\\/]/)[0] || "其他",
      name: definition.name || definition.internalName || guid,
      text: stripMarkup(definition.description),
      officialLocalized: Boolean(definition.name && definition.description),
      sourceInternalName: definition.internalName || null,
      sourceBlueprintType: definition.blueprintType || null,
      sourceBlueprintPath: definition.blueprintPath || null,
      nativeRequirements: definition.requirements || [],
      nativeAvailability: definition.availability || null,
      nativeMechanics: definition.mechanics || {},
      nativeComponents: definition.components || [],
      nativeComponentCount: definition.componentCount ?? (definition.components || []).length,
      hidden: Boolean(definition.mechanics?.ability?.hidden),
      sourceVerified: true,
      readOnly: true
    };
  });
  DATA.ruleCatalog = {
    classFeatures: adaptCatalogEntries(SOURCE.catalogs?.classFeatures, "class-feature"),
    pathFeatures: adaptCatalogEntries(SOURCE.catalogs?.pathFeatures, "path-feature"),
    domainFeatures: adaptCatalogEntries(SOURCE.catalogs?.domainFeatures, "domain-feature"),
    abilities: abilityCatalog
  };

  DATA.owlcat = {
    version: SOURCE.sourceSnapshot.gameVersion,
    steamBuild: String(SOURCE.sourceSnapshot.steamBuild),
    dataSha256: SOURCE.sourceSnapshot.dataSha256,
    snapshotSha256: SOURCE.sourceSnapshot.snapshotSha256,
    sources: SOURCE.sourceSnapshot.sources,
    sourceCoverage: SOURCE.sourceCoverage || null,
    counts: SOURCE.counts,
    poolByGuid,
    definitions: sourceDefinitions,
    spellbooks: SOURCE.spellbooks || [],
    spellsTables: SOURCE.spellsTables || [],
    statProgressions: SOURCE.statProgressions || [],
    stripMarkup,
    uniqueAliasGuid
  };
  DATA.sources = [
    {
      name: `本机游戏蓝图 ${DATA.owlcat.version}`,
      url: "https://store.steampowered.com/app/1184370/Pathfinder_Wrath_of_the_Righteous/",
      note: `Steam build ${DATA.owlcat.steamBuild}；专长、职业、原型、选择池与法术均由锁定的本机文件生成。`
    },
    ...(DATA.sources || [])
  ];
})();
