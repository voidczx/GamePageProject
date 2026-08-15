window.WOTR_DATA = (() => {
  const abilities = [
    { id: "str", name: "力量", short: "STR" },
    { id: "dex", name: "敏捷", short: "DEX" },
    { id: "con", name: "体质", short: "CON" },
    { id: "int", name: "智力", short: "INT" },
    { id: "wis", name: "感知", short: "WIS" },
    { id: "cha", name: "魅力", short: "CHA" }
  ];

  const races = [
    { id: "human", name: "人类", text: "任意属性 +2；额外获得 1 个一级专长。", bonus: "任意 +2", feat: true },
    { id: "aasimar", name: "阿西莫", text: "天界血脉，依据变体获得两项属性加值与抗性。", bonus: "变体属性 +2/+2" },
    { id: "tiefling", name: "提夫林", text: "炼狱血脉，依据变体改变属性并获得法术能力。", bonus: "变体属性 +2/+2" },
    { id: "elf", name: "精灵", text: "敏捷与智力 +2、体质 -2，免疫睡眠。", bonus: "DEX +2 / INT +2 / CON -2" },
    { id: "half-elf", name: "半精灵", text: "任意属性 +2，适应性与精灵免疫。", bonus: "任意 +2" },
    { id: "dwarf", name: "矮人", text: "体质与感知 +2、魅力 -2，稳定且坚韧。", bonus: "CON +2 / WIS +2 / CHA -2" },
    { id: "halfling", name: "半身人", text: "敏捷与魅力 +2、力量 -2，幸运而无畏。", bonus: "DEX +2 / CHA +2 / STR -2" },
    { id: "gnome", name: "侏儒", text: "体质与魅力 +2、力量 -2，幻术亲和。", bonus: "CON +2 / CHA +2 / STR -2" },
    { id: "half-orc", name: "半兽人", text: "任意属性 +2，获得兽人武器熟练与凶猛。", bonus: "任意 +2" },
    { id: "kitsune", name: "狐妖", text: "敏捷与魅力 +2、力量 -2，可在人形与狐形间切换。", bonus: "DEX +2 / CHA +2 / STR -2" },
    { id: "dhampir", name: "吸血鬼裔", text: "负能量亲和，依据血统改变属性。", bonus: "血统属性 +2/+2/-2" },
    { id: "oread", name: "土源裔", text: "大地血脉，依据变体获得天生护甲或元素能力。", bonus: "变体属性 +2/+2/-2" }
  ];

  const backgrounds = [
    { id: "leader", name: "领袖", skill: "persuasion", text: "说服成为本职技能，适合主角承担对话检定。" },
    { id: "pickpocket", name: "扒手", skill: "trickery", text: "巧手与隐匿成为本职技能，并获得先攻加值。" },
    { id: "acolyte", name: "侍僧", skill: "religion", text: "使用感知代替魅力进行说服检定。" },
    { id: "oblate", name: "流浪孤儿", skill: "mobility", text: "灵巧与运动背景，适合敏捷路线。" },
    { id: "scholar", name: "奥术学者", skill: "arcana", text: "知识（神秘）成为本职技能并提供法术卷轴知识。" },
    { id: "guard", name: "卫兵", skill: "athletics", text: "运动成为本职技能，并提供武器熟练。" }
  ];

  const skills = [
    { id: "athletics", name: "运动", ability: "str", nativeStat: "SkillAthletics" },
    { id: "mobility", name: "灵巧", ability: "dex", nativeStat: "SkillMobility" },
    { id: "trickery", name: "巧手", ability: "dex", nativeStat: "SkillThievery" },
    { id: "stealth", name: "隐匿", ability: "dex", nativeStat: "SkillStealth" },
    { id: "arcana", name: "知识（神秘）", ability: "int", nativeStat: "SkillKnowledgeArcana" },
    { id: "world", name: "知识（世界）", ability: "int", nativeStat: "SkillKnowledgeWorld" },
    { id: "nature", name: "学识（自然）", ability: "wis", nativeStat: "SkillLoreNature" },
    { id: "religion", name: "学识（宗教）", ability: "wis", nativeStat: "SkillLoreReligion" },
    { id: "perception", name: "察觉", ability: "wis", nativeStat: "SkillPerception" },
    { id: "persuasion", name: "说服", ability: "cha", nativeStat: "SkillPersuasion" },
    { id: "umd", name: "使用魔法装置", ability: "cha", nativeStat: "SkillUseMagicDevice" }
  ];

  const classes = [
    { id: "fighter", name: "战士", group: "base", bab: "full", role: "纯武", text: "最高专长密度与武器训练。" },
    { id: "paladin", name: "圣武士", group: "base", bab: "full", casting: "divine", role: "神圣前卫", text: "满 BAB、辟邪斩与团队祝福。", req: { alignmentAny: ["LG"] } },
    { id: "barbarian", name: "野蛮人", group: "base", bab: "full", role: "狂暴近战", text: "狂暴、伤害减免与高机动突击。", req: { alignmentNot: ["LG", "LN", "LE"] } },
    { id: "ranger", name: "游侠", group: "base", bab: "full", casting: "divine", role: "猎手", text: "宿敌、战斗流派与动物伙伴。" },
    { id: "slayer", name: "杀手", group: "base", bab: "full", sneak: true, role: "精准击杀", text: "研究目标、偷袭与游荡者天赋。" },
    { id: "monk", name: "武僧", group: "base", bab: "three", role: "徒手防御", text: "气力、连击与无甲防御。", req: { alignmentAny: ["LG", "LN", "LE"] } },
    { id: "cavalier", name: "骑将", group: "base", bab: "full", role: "骑乘冲锋", text: "坐骑、挑战与骑士团能力。" },
    { id: "bloodrager", name: "血怒者", group: "base", bab: "full", casting: "arcane-spontaneous", role: "魔战", text: "血脉、狂暴与四环奥术。" },
    { id: "shifter", name: "化形师", group: "base", bab: "full", role: "天生武器", text: "荒野形态与天生攻击；需要最后的萨阔力人 DLC。", dlc: true },
    { id: "rogue", name: "游荡者", group: "base", bab: "three", sneak: true, role: "技能偷袭", text: "偷袭、弱化之伤与高技能覆盖。" },
    { id: "bard", name: "吟游诗人", group: "base", bab: "three", casting: "arcane-spontaneous", role: "团队支援", text: "六环自发奥术与演唱。" },
    { id: "skald", name: "歌者", group: "base", bab: "three", casting: "arcane-spontaneous", role: "近战支援", text: "共享狂暴与六环自发奥术。" },
    { id: "magus", name: "魔战士", group: "base", bab: "three", casting: "arcane", role: "法术战斗", text: "武器与法术同轮结合。" },
    { id: "inquisitor", name: "审判者", group: "base", bab: "three", casting: "divine-spontaneous", role: "战术神术", text: "审判、祸害与团队专长。" },
    { id: "warpriest", name: "战争祭司", group: "base", bab: "three", casting: "divine", role: "武装神术", text: "神圣武器、祝福与迅捷自我强化。" },
    { id: "hunter", name: "猎人", group: "base", bab: "three", casting: "divine-spontaneous", role: "动物协同", text: "动物伙伴与团队专长共享。" },
    { id: "cleric", name: "牧师", group: "base", bab: "three", casting: "divine", fullCaster: true, role: "九环神术", text: "领域、引导能量与九环神术。" },
    { id: "oracle", name: "先知", group: "base", bab: "three", casting: "divine-spontaneous", fullCaster: true, role: "自发神术", text: "谜团、诅咒与九环自发神术。" },
    { id: "druid", name: "德鲁伊", group: "base", bab: "three", casting: "divine", fullCaster: true, role: "自然施法", text: "动物伙伴、野性变身与九环神术。", req: { alignmentDruid: true } },
    { id: "shaman", name: "萨满", group: "base", bab: "three", casting: "divine", fullCaster: true, role: "精魂巫术", text: "精魂、巫术与九环神术。" },
    { id: "alchemist", name: "炼金术士", group: "base", bab: "three", casting: "extract", role: "炸弹炼成", text: "炼成提取物、炸弹与诱变剂。" },
    { id: "kineticist", name: "操念使", group: "base", bab: "three", role: "元素轰击", text: "操念冲击、元素防御与超载。" },
    { id: "wizard", name: "法师", group: "base", bab: "half", casting: "arcane", fullCaster: true, role: "九环奥术", text: "准备施法与奥术学派。" },
    { id: "sorcerer", name: "术士", group: "base", bab: "half", casting: "arcane-spontaneous", fullCaster: true, role: "自发奥术", text: "血脉与九环自发奥术。" },
    { id: "witch", name: "巫师", group: "base", bab: "half", casting: "arcane", fullCaster: true, role: "巫术控制", text: "巫术、庇护主与九环奥术。" },
    { id: "arcanist", name: "奥能师", group: "base", bab: "half", casting: "arcane", fullCaster: true, role: "混合奥术", text: "准备法术后自发施放，并拥有奥能技艺。" },

    { id: "aldori-swordlord", name: "阿尔多瑞剑爵", group: "prestige", bab: "full", role: "决斗剑", text: "以决斗剑和威吓控制战线。", req: { level: 6, feats: ["weapon-finesse", "weapon-focus", "dazzling-display"], skills: { mobility: 3, world: 3, perception: 3, persuasion: 5 } } },
    { id: "arcane-trickster", name: "诡术师", group: "prestige", bab: "half", castingAdvance: "arcane", role: "法术偷袭", text: "让射线和范围法术触发偷袭。", req: { arcaneSpell: 2, sneakDice: 2, skills: { trickery: 4, mobility: 4, arcana: 4 } } },
    { id: "assassin", name: "刺客", group: "prestige", bab: "three", sneak: true, role: "死亡攻击", text: "邪恶阵营的潜行毒杀者。", req: { alignmentNotGood: true, skills: { stealth: 5, trickery: 5 } } },
    { id: "dragon-disciple", name: "龙脉术士", group: "prestige", bab: "three", castingAdvance: "arcane", role: "血脉魔战", text: "强化龙系血脉、力量与天生护甲。", req: { spontaneousArcaneSpell: 1, skills: { arcana: 5 } } },
    { id: "duelist", name: "决斗家", group: "prestige", bab: "full", role: "敏捷防御", text: "单手穿刺武器与智力防御。", req: { bab: 6, feats: ["weapon-finesse", "dodge"], skills: { mobility: 2 } } },
    { id: "eldritch-knight", name: "奥法骑士", group: "prestige", bab: "full", castingAdvance: "arcane", role: "奥术战士", text: "满 BAB 与九级施法进阶。", req: { arcaneSpell: 3, feats: ["martial-proficiency"] } },
    { id: "hellknight", name: "地狱骑士", group: "prestige", bab: "full", role: "秩序重甲", text: "律法阵营的重甲审判者。", req: { bab: 5, alignmentLawful: true, feats: ["heavy-armor"], skills: { arcana: 2, persuasion: 5 } } },
    { id: "hellknight-signifer", name: "地狱骑士持印者", group: "prestige", bab: "three", castingAdvance: "any", role: "重甲施法", text: "在重甲中推进奥术或神术施法。", req: { spell: 3, alignmentLawful: true, feats: ["arcane-armor-training"], skills: { arcana: 5, world: 2 } } },
    { id: "loremaster", name: "博学士", group: "prestige", bab: "half", castingAdvance: "any", role: "法术秘闻", text: "以秘闻跨表获取专长或法术。", req: { spell: 3, anyMetamagic: true, anySkillFocus: true, skills: { arcana: 5, world: 5 } } },
    { id: "mystic-theurge", name: "秘术师", group: "prestige", bab: "half", castingAdvance: "dual", role: "双系施法", text: "同时推进奥术与神术施法。", req: { arcaneSpell: 2, divineSpell: 2, skills: { arcana: 3, religion: 3 } } },
    { id: "stalwart-defender", name: "坚毅卫士", group: "prestige", bab: "full", role: "防御姿态", text: "以防御姿态和减伤固守阵地。", req: { bab: 7, feats: ["dodge", "toughness"] } },
    { id: "student-of-war", name: "战争学徒", group: "prestige", bab: "full", role: "智力战技", text: "研究敌人并以智力强化防御。", req: { bab: 5, feats: ["combat-expertise", "skill-focus-world"], skills: { world: 3, arcana: 3 } } },
    { id: "winter-witch", name: "冬巫", group: "prestige", bab: "half", castingAdvance: "winter", role: "寒冷施法", text: "推进带冬之庇护主或冰霜精魂的施法。", req: { spell: 3, winterSource: true, skills: { arcana: 5 } } }
  ];

  const feats = [
    { id: "power-attack", name: "猛力攻击", category: "战斗", text: "攻击检定承受减值，换取随 BAB 增长的近战伤害加值。", req: { abilities: { str: 13 }, bab: 1 } },
    { id: "cleave", name: "顺势斩", category: "战斗", text: "以标准动作攻击一个目标，命中后再攻击相邻目标。", req: { feats: ["power-attack"], abilities: { str: 13 } } },
    { id: "cleaving-finish", name: "终势斩", category: "战斗", text: "击倒敌人时，每轮一次对触及范围内另一目标追加攻击。", req: { feats: ["cleave", "power-attack"], bab: 1 } },
    { id: "dodge", name: "闪避", category: "防御", text: "获得 +1 闪避 AC。", req: { abilities: { dex: 13 } } },
    { id: "combat-mobility", name: "战斗灵活", category: "防御", text: "移动引发借机攻击时获得 +4 闪避 AC。", req: { feats: ["dodge"], abilities: { dex: 13 } } },
    { id: "crane-style", name: "鹤形拳", category: "武术", text: "防御式攻击减值降低，闪避 AC 提升。", req: { feats: ["dodge"], bab: 2, skills: { mobility: 3 } } },
    { id: "crane-wing", name: "鹤翼", category: "武术", text: "空出一只手时，近战防御获得额外闪避加值。", req: { feats: ["crane-style"], bab: 5 } },
    { id: "weapon-finesse", name: "武器娴熟", category: "战斗", text: "轻型武器与适用武器可用敏捷调整值进行攻击。" },
    { id: "weapon-focus", name: "武器专攻", category: "武器", text: "选择一种武器，其攻击检定 +1。", req: { bab: 1 } },
    { id: "greater-weapon-focus", name: "高等武器专攻", category: "武器", text: "所选武器攻击检定再 +1。", req: { feats: ["weapon-focus"], bab: 8, fighterLevel: 8 } },
    { id: "improved-critical", name: "精通重击", category: "武器", text: "所选武器的重击威胁范围翻倍。", req: { bab: 8 } },
    { id: "dazzling-display", name: "炫目武技", category: "威吓", text: "以专攻武器进行展示，使 30 尺内敌人陷入战栗。", req: { feats: ["weapon-focus"] } },
    { id: "shatter-defenses", name: "粉碎防御", category: "威吓", text: "攻击战栗、恐惧或惊惧敌人时将其视为措手不及。", req: { feats: ["dazzling-display", "weapon-focus"], bab: 6 } },
    { id: "cornugon-smash", name: "科尔努贡粉碎", category: "威吓", text: "猛力攻击命中后可立刻尝试威吓目标。", req: { feats: ["power-attack"], bab: 6, skills: { persuasion: 6 } } },
    { id: "combat-expertise", name: "战斗专精", category: "战技", text: "攻击承受减值以换取 AC 加值。", req: { abilities: { int: 13 } } },
    { id: "improved-trip", name: "精通绊摔", category: "战技", text: "绊摔战技检定 +2，使用时不引发借机攻击。", req: { feats: ["combat-expertise"], abilities: { int: 13 } } },
    { id: "greater-trip", name: "高等绊摔", category: "战技", text: "绊摔检定再 +2，成功绊倒会引发借机攻击。", req: { feats: ["improved-trip"], bab: 6 } },
    { id: "point-blank-shot", name: "近程射击", category: "远程", text: "30 尺内远程攻击与伤害 +1。" },
    { id: "precise-shot", name: "精准射击", category: "远程", text: "向近战中的目标射击不再承受 -4。", req: { feats: ["point-blank-shot"] } },
    { id: "deadly-aim", name: "致命瞄准", category: "远程", text: "远程攻击承受减值，换取随 BAB 增长的伤害加值。", req: { abilities: { dex: 13 }, bab: 1 } },
    { id: "rapid-shot", name: "快速射击", category: "远程", text: "全回合远程攻击时追加一次攻击，所有攻击 -2。", req: { feats: ["point-blank-shot"], abilities: { dex: 13 } } },
    { id: "manyshot", name: "多重射击", category: "远程", text: "弓箭全攻击的第一次攻击发射两支箭。", req: { feats: ["point-blank-shot", "rapid-shot"], abilities: { dex: 17 }, bab: 6 } },
    { id: "improved-precise-shot", name: "精通精准射击", category: "远程", text: "忽略除完全隐蔽外的掩蔽与隐蔽失手。", req: { feats: ["precise-shot", "point-blank-shot"], abilities: { dex: 19 }, bab: 11 } },
    { id: "two-weapon-fighting", name: "双武器战斗", category: "双持", text: "显著降低双持攻击减值。", req: { abilities: { dex: 15 } } },
    { id: "improved-two-weapon", name: "精通双武器战斗", category: "双持", text: "副手获得第二次攻击。", req: { feats: ["two-weapon-fighting"], abilities: { dex: 17 }, bab: 6 } },
    { id: "greater-two-weapon", name: "高等双武器战斗", category: "双持", text: "副手获得第三次攻击。", req: { feats: ["improved-two-weapon", "two-weapon-fighting"], abilities: { dex: 19 }, bab: 11 } },
    { id: "double-slice", name: "双斩", category: "双持", text: "副手伤害获得完整力量调整值。", req: { feats: ["two-weapon-fighting"], abilities: { dex: 15 } } },
    { id: "shield-bash", name: "盾击", category: "盾牌", text: "使用盾牌攻击时仍保留盾牌 AC。", req: { feats: ["two-weapon-fighting"], abilities: { dex: 15 } } },
    { id: "shield-master", name: "盾牌大师", category: "盾牌", text: "盾击不再承受双持减值，并把盾牌增强加到攻击与伤害。", req: { feats: ["shield-bash", "two-weapon-fighting"], bab: 11 } },
    { id: "combat-reflexes", name: "战斗反射", category: "战斗", text: "每轮可进行敏捷调整值数量的额外借机攻击。" },
    { id: "outflank", name: "抓准时机", category: "团队", text: "与拥有此专长的盟友夹击时攻击 +4，重击引发盟友借机。", req: { bab: 4 } },
    { id: "seize-the-moment", name: "把握机会", category: "团队", text: "拥有此专长的盟友重击时，你可对目标借机攻击。", req: { feats: ["combat-reflexes"], abilities: { dex: 13 } } },
    { id: "shake-it-off", name: "摆脱困境", category: "团队", text: "邻近盟友每有一名拥有此专长，豁免 +1，最多 +4。" },
    { id: "spell-focus", name: "法术专攻", category: "施法", text: "选择一个法术学派，该学派法术 DC +1。" },
    { id: "greater-spell-focus", name: "高等法术专攻", category: "施法", text: "所选学派法术 DC 再 +1。", req: { feats: ["spell-focus"] } },
    { id: "spell-penetration", name: "法术穿透", category: "施法", text: "对抗法术抗力的施法者等级检定 +2。" },
    { id: "greater-spell-penetration", name: "高等法术穿透", category: "施法", text: "对抗法术抗力的检定再 +2。", req: { feats: ["spell-penetration"] } },
    { id: "selective-spell", name: "法术甄选", category: "超魔", metamagic: true, text: "范围法术可排除盟友，法术环级 +1。", req: { spell: 1 } },
    { id: "extend-spell", name: "法术延时", category: "超魔", metamagic: true, text: "法术持续时间翻倍，法术环级 +1。", req: { spell: 1 } },
    { id: "bolster-spell", name: "法术增效", category: "超魔", metamagic: true, text: "每个伤害骰额外 +2 伤害，法术环级 +1。", req: { spell: 1 } },
    { id: "toughness", name: "坚韧", category: "防御", text: "获得等同角色等级的额外生命值。" },
    { id: "martial-proficiency", name: "军用武器擅长", category: "熟练", text: "擅长全部军用武器。" },
    { id: "heavy-armor", name: "重甲擅长", category: "熟练", text: "可正常穿着重甲。", req: { feats: ["medium-armor"] } },
    { id: "medium-armor", name: "中甲擅长", category: "熟练", text: "可正常穿着中甲。", req: { feats: ["light-armor"] } },
    { id: "light-armor", name: "轻甲擅长", category: "熟练", text: "可正常穿着轻甲。" },
    { id: "arcane-armor-training", name: "奥术盔甲训练", category: "施法", text: "迅捷动作令奥术失败率降低 10%。", req: { feats: ["light-armor"], bab: 3 } },
    { id: "skill-focus-world", name: "技能专攻：知识（世界）", category: "技能", skillFocus: true, text: "知识（世界）检定 +3，10 级后变为 +6。" },
    { id: "skill-focus-arcana", name: "技能专攻：知识（神秘）", category: "技能", skillFocus: true, text: "知识（神秘）检定 +3，10 级后变为 +6。" },
    { id: "improved-initiative", name: "精通先攻", category: "通用", text: "先攻检定 +4。" }
  ];

  const mythic = [
    { id: "abundant-casting", name: "充裕施法", type: "ability", text: "每天额外获得 4 个 1—3 环法术位。" },
    { id: "improved-abundant-casting", name: "精通充裕施法", type: "ability", text: "每天额外获得 4 个 4—6 环法术位。", req: { mythic: ["abundant-casting"] } },
    { id: "greater-abundant-casting", name: "高等充裕施法", type: "ability", text: "每天额外获得 4 个 7—9 环法术位。", req: { mythic: ["improved-abundant-casting"] } },
    { id: "ascendant-element", name: "巅峰元素", type: "ability", text: "选择一种能量；你的该类伤害忽略抗性与免疫。" },
    { id: "archmage-armor", name: "大法师护甲", type: "ability", text: "自己施放法师护甲时，额外获得等同神话阶层的护甲加值。" },
    { id: "enduring-spells", name: "持久法术", type: "ability", text: "持续时间超过 1 小时的法术延长至 24 小时。" },
    { id: "greater-enduring-spells", name: "高等持久法术", type: "ability", text: "持续时间超过 5 分钟的法术延长至 24 小时。", req: { mythic: ["enduring-spells"] } },
    { id: "last-stand", name: "屹立不倒", type: "ability", text: "生命值首次降至 0 时，短时间内不会死亡；每天一次。" },
    { id: "ever-ready", name: "时刻准备", type: "ability", text: "额外获得 2 次借机攻击，借机攻击获得随神话阶层增长的加值。" },
    { id: "leading-strike", name: "引领打击", type: "ability", text: "近战命中留下印记，盟友命中时消耗并造成神圣伤害。" },
    { id: "mythic-charge", name: "神话冲锋", type: "ability", text: "冲锋命中额外造成每神话阶层 1d6 神圣伤害。" },
    { id: "unrelenting-assault", name: "不懈猛攻", type: "ability", text: "持续进行近战攻击时，每轮累计 +2 伤害，最多 +10。" },
    { id: "cleaving-shot", name: "分裂射击", type: "ability", text: "远程重击或击杀时对邻近敌人造成武器伤害。" },
    { id: "distracting-shots", name: "扰乱射击", type: "ability", text: "远程命中使目标受到盟友攻击时被视为夹击。" },
    { id: "brutality-incarnate", name: "野蛮化身", type: "ability", text: "天生武器忽略除 DR/- 外的伤害减免。" },
    { id: "domain-zealot", name: "领域狂热", type: "ability", text: "原本为标准动作的领域能力改为迅捷动作。" },
    { id: "limitless-rage", name: "无尽狂暴", type: "ability", text: "狂暴类能力不再有每日轮数限制。" },
    { id: "abundant-smite", name: "充裕辟邪斩", type: "ability", text: "每天额外获得等同神话阶层一半的辟邪斩次数。", req: { classAny: ["paladin"] } },
    { id: "second-spirit", name: "第二精魂", type: "ability", text: "萨满获得第二种精魂及其法术与能力。", req: { classAny: ["shaman"] } },
    { id: "impossible-domain", name: "不可能领域", type: "ability", text: "获得一个神祇通常不提供的额外领域。", req: { classAny: ["cleric", "inquisitor"] } },

    { id: "mythic-power-attack", name: "猛力攻击（神话）", type: "feat", text: "猛力攻击的伤害加值由每档 +2 提高到 +3。", req: { feats: ["power-attack"] } },
    { id: "mythic-deadly-aim", name: "致命瞄准（神话）", type: "feat", text: "致命瞄准的伤害加值由每档 +2 提高到 +3。", req: { feats: ["deadly-aim"] } },
    { id: "mythic-two-weapon", name: "双武器战斗（神话）", type: "feat", text: "主手与副手的双持攻击减值各降低 2。", req: { feats: ["two-weapon-fighting"] } },
    { id: "mythic-weapon-finesse", name: "武器娴熟（神话）", type: "feat", text: "适用武器的伤害也可使用敏捷调整值。", req: { feats: ["weapon-finesse"] } },
    { id: "mythic-improved-critical", name: "精通重击（神话）", type: "feat", text: "所选武器的重击倍率提高 1。", req: { feats: ["improved-critical"] } },
    { id: "mythic-spell-penetration", name: "法术穿透（神话）", type: "feat", text: "法术穿透检定额外加上神话阶层的一半。", req: { feats: ["spell-penetration"] } },
    { id: "mythic-spell-focus", name: "法术专攻（神话）", type: "feat", text: "把最高的法术专攻加值同时应用到另一学派。", req: { feats: ["spell-focus"] } },
    { id: "mythic-dodge", name: "闪避（神话）", type: "feat", text: "闪避 AC 加值再提高 1。", req: { feats: ["dodge"] } },
    { id: "mythic-toughness", name: "坚韧（神话）", type: "feat", text: "每个生命骰额外 +1 生命值，并在低血量时获得减伤。", req: { feats: ["toughness"] } },
    { id: "extra-mythic-ability", name: "额外神话能力", type: "feat", text: "以本次神话专长机会选择一个神话能力。" },
    { id: "improved-initiative-mythic", name: "精通先攻（神话）", type: "feat", text: "先攻加值额外提高等同神话阶层。", req: { feats: ["improved-initiative"] } }
  ];

  const paths = [
    { id: "angel", name: "天使", tone: "gold", stage: "三阶主道途", align: "守序善良附近", unlock: "默认解锁；神话 3 阶可选。", entry: "序章在地底触碰天堂之剑会解锁相关对话，但不影响三阶可选性。", text: "以神圣伤害、群体免疫和合并神术书见长。", powers: ["天使之剑：为武器与法术附加圣力", "天使光环：为队伍提供防护与豁免", "可与牧师、先知等完整神术书合并"] },
    { id: "demon", name: "恶魔", tone: "red", stage: "三阶主道途", align: "混乱邪恶附近", unlock: "默认解锁；神话 3 阶可选。", entry: "在关键剧情中屈从体内怒火会推动恶魔倾向。", text: "以恶魔狂暴、魔相与强力动作经济压制敌人。", powers: ["恶魔狂暴：提升攻击、DC 与属性", "魔相：按战斗角色组合被动与主动效果", "第五章可选择臣服、自由或反叛路线"] },
    { id: "aeon", name: "御衡者", tone: "cyan", stage: "三阶主道途", align: "守序中立附近", unlock: "第一章市集广场北侧调查御衡者残迹，并在守护石选择保留其力量。", entry: "若未取得紫石匕首中的御衡者力量，第二章末不会出现该选项。", text: "以凝视、解除增益与修正现实中的异常为核心。", powers: ["御衡者凝视：同时施加团队增益与敌方减益", "克星：攻击附带解除魔法", "真御衡者路线可修正重大时间线异常"] },
    { id: "azata", name: "灵使", tone: "violet", stage: "三阶主道途", align: "混乱善良附近", unlock: "第一章完成“仰望星辰”，找齐三名德丝娜信徒并选择合唱极乐之歌。", entry: "杀死拉米恩或德丝娜信徒会阻断解锁。", text: "以超级力量、友谊魔法与幼龙艾乌为标志。", powers: ["神话 3 阶获得艾乌作为特殊同伴", "超级力量：超卓魔法、惊世威能、生命联结等", "灵使法术强调恢复、自由与团队协同"] },
    { id: "lich", name: "巫妖", tone: "green", stage: "三阶主道途", align: "中立邪恶附近", unlock: "麻风病人的微笑地下洞穴取得扎卡里乌斯魔杖；失陷教堂密室中归还魔杖。", entry: "摧毁魔杖或拒绝归还会永久阻断。", text: "以亡灵法术、合并奥术书与五名墓卫同伴为核心。", powers: ["可与法师、术士、巫师、奥能师奥术书合并", "巫妖力量强化负能量、召唤与控制", "墓卫：斯陶顿、德拉梅尔、西亚尔、克斯特格利尔、葛尔芙蕾"] },
    { id: "trickster", name: "诡术大师", tone: "pink", stage: "三阶主道途", align: "混乱中立附近", unlock: "第一章黑翼图书馆识破伪装者，并假扮高阶邪教徒挑起内斗。", entry: "需在限时事件前到达图书馆并选择诡术对话。", text: "以神话技能诡计、特殊重击专长和改写概率见长。", powers: ["神话诡计：将普通技能升级成破坏规则的能力", "知识（世界）高阶可放宽队伍专长前置", "察觉高阶解锁额外重击专长链"] },
    { id: "devil", name: "魔鬼", tone: "amber", stage: "八阶后期道途", align: "守序邪恶", unlock: "先走御衡者或灵使，并在梅菲斯特相关事件中接受地狱的契约与审判。", entry: "灵使转魔鬼会失去艾乌；御衡者需多次偏离真御衡者原则。", text: "以无限支配、地狱敕令和封印构筑控制链。", powers: ["地狱统御：随意使用支配怪物", "地狱敕令：限制行动并强化指定战术", "八阶才转入，前期沿用原道途规划"] },
    { id: "gold-dragon", name: "金龙", tone: "gold", stage: "八阶后期道途", align: "中立善良附近", unlock: "收集特伦笛利弗的鳞片与爪，交给说书人；在特伦笛利弗巢穴善待哈尔。", entry: "第五章重返德莱森后完成“龙之黎明”并接受哈尔的道路。", text: "以属性提升、龙形态、伤害骰强化与救赎主题见长。", powers: ["基础属性不足 18 的提升至 18", "获得金龙形态、吐息与免疫", "法术与武器伤害骰获得神话强化"] },
    { id: "swarm", name: "虫群行者", tone: "acid", stage: "八阶后期道途", align: "混乱邪恶", unlock: "第二章不带女王出征并保留虫后黏液；第三章用其进行虫群研究，拒绝泽肖尔。", entry: "第五章击败回归的泽肖尔后吞噬虫后；选择后所有队友离队。", text: "吞噬敌人、复制自己并以虫群规模成长的孤狼道途。", powers: ["所有普通队友永久离队", "吞噬提升虫群规模与能力", "后期可制造自身复制体填满队伍"] },
    { id: "legend", name: "凡人传奇", tone: "silver", stage: "八阶后期道途", align: "无限制", unlock: "神话 8 阶默认可尝试放弃神话力量；接受诺缇库拉亵渎之赐会提高拒绝难度。", entry: "完成阿瑞露安排的回溯旅程后转为真正的凡人传奇。", text: "失去大部分神话道途能力，将普通等级上限提高至 40。", powers: ["普通职业总等级上限 40", "BAB 上限提高并获得大量属性成长", "保留神话 1—2 阶的通用选择"] }
  ];

  const companions = [
    { id: "commander", name: "骑士指挥官", title: "主角", group: "core", level: 1, classId: "fighter", race: "human", align: "NG", attrs: [16, 14, 14, 12, 10, 12], note: "从种族、出身、职业与 25 点购点开始。" },
    { id: "seelah", name: "席拉", title: "圣武士", group: "core", level: 1, classId: "paladin", race: "human", align: "LG", attrs: [18, 13, 14, 10, 13, 15], note: "序章入队；默认从圣武士 1 级继续。" },
    { id: "camellia", name: "柯米丽雅", title: "精魂猎手", group: "core", level: 1, classId: "shaman", race: "half-elf", align: "CE", attrs: [11, 19, 14, 10, 16, 13], note: "序章入队；剧情阵营在游戏中被隐藏。" },
    { id: "lann", name: "兰恩", title: "禅宗射手", group: "core", level: 1, classId: "monk", race: "mongrel", align: "LN", attrs: [17, 17, 14, 10, 17, 9], note: "第一章地底分歧选择兰恩。" },
    { id: "wenduag", name: "雯朵格", title: "战士", group: "core", level: 1, classId: "fighter", race: "mongrel", align: "NE", attrs: [16, 20, 14, 10, 12, 5], note: "第一章地底分歧选择雯朵格。" },
    { id: "woljiF", name: "沃尔吉夫", title: "奥法暴徒", group: "core", level: 3, classId: "rogue", race: "tiefling", align: "CN", attrs: [10, 19, 12, 18, 8, 12], note: "第一章酒馆地牢释放；默认 3 级入队。" },
    { id: "ember", name: "小烬", title: "受诅巫师", group: "core", level: 3, classId: "witch", race: "elf", align: "NG", attrs: [9, 16, 12, 12, 13, 17], note: "第一章市集广场救下；默认 3 级入队。" },
    { id: "nenio", name: "聂纽", title: "卷轴专家", group: "core", level: 3, classId: "wizard", race: "kitsune", align: "N", attrs: [5, 15, 12, 20, 12, 10], note: "第一章随机遭遇；默认 3 级入队。" },
    { id: "daeran", name: "岱兰", title: "先知", group: "core", level: 3, classId: "oracle", race: "aasimar", align: "NE", attrs: [7, 16, 13, 11, 14, 20], note: "第一章阿伦岱宅邸；默认 3 级入队。" },
    { id: "sosiel", name: "索希尔", title: "牧师", group: "core", level: 6, classId: "cleric", race: "human", align: "NG", attrs: [16, 10, 14, 10, 19, 14], note: "第二章十字军营地入队；默认 6 级。" },
    { id: "regill", name: "雷吉尔", title: "武备骑士 / 地狱骑士", group: "core", level: 6, classId: "fighter", race: "gnome", align: "LE", attrs: [13, 18, 16, 10, 13, 14], note: "第二章“依照地狱法则”后入队；默认 6 级。" },
    { id: "arueshalae", name: "爱露莎蕾", title: "谍报专家", group: "core", level: 8, classId: "ranger", race: "succubus", align: "CN", attrs: [13, 22, 16, 18, 14, 21], note: "最早可在第二章德莱森地牢招募。" },
    { id: "greybor", name: "格雷博", title: "杀手", group: "core", level: 9, classId: "slayer", race: "dwarf", align: "N", attrs: [16, 17, 14, 13, 16, 10], note: "第三章“猎龙”期间雇佣；默认 9 级。" },
    { id: "trever", name: "崔弗", title: "装甲蛮徒", group: "special", level: 14, classId: "fighter", race: "human", align: "CN", attrs: [20, 14, 16, 10, 10, 12], note: "索希尔任务线限定；第四章可招募。" },
    { id: "ulbrig", name: "乌尔布里格", title: "狮鹫之心", group: "dlc", level: 4, classId: "shifter", race: "human", align: "NG", attrs: [19, 14, 16, 10, 14, 12], note: "最后的萨阔力人 DLC；第一章灰兵营前入队。" },
    { id: "aivu", name: "艾乌", title: "灵使幼龙", group: "path", path: "azata", level: 10, classId: "dragon", race: "dragon", align: "CG", attrs: [20, 16, 18, 14, 15, 18], note: "灵使道途神话 3 阶自动加入并随神话阶层成长。" },
    { id: "staunton", name: "斯陶顿·梵恩", title: "墓卫 / 战争祭司", group: "path", path: "lich", level: 10, classId: "warpriest", race: "dwarf", align: "LE", attrs: [15, 18, 0, 7, 14, 12], note: "巫妖第三章在德莱森监狱复生。" },
    { id: "delamere", name: "德拉梅尔", title: "墓卫 / 杀手", group: "path", path: "lich", level: 10, classId: "slayer", race: "human", align: "LE", attrs: [19, 18, 0, 10, 16, 12], note: "巫妖第三章善猎神殿复生。" },
    { id: "ciar", name: "西亚尔", title: "墓卫 / 骑将", group: "path", path: "lich", level: 10, classId: "cavalier", race: "human", align: "LE", attrs: [20, 14, 0, 10, 14, 16], note: "巫妖第三章完成颅骨之柱事件后诱其攻击塔庙。" },
    { id: "kestoglyr", name: "克斯特格利尔", title: "墓卫 / 战士", group: "path", path: "lich", level: 14, classId: "fighter", race: "human", align: "LE", attrs: [15, 20, 0, 7, 10, 14], note: "巫妖第四章科尔菲尔矿坑相关区域复生。" },
    { id: "galfrey", name: "葛尔芙蕾", title: "墓卫 / 圣武士", group: "path", path: "lich", level: 15, classId: "paladin", race: "human", align: "LE", attrs: [18, 14, 0, 14, 16, 20], note: "巫妖第五章伊兹让女王死亡后复生；将永久改变其命运。" }
  ];

  const quests = [
    { id: "seelah", name: "席拉", arc: "友谊与责任", nodes: [
      { act: "第一章", title: "患难见真情", trigger: "在铁卫雄心与席拉交谈；随主线进入市集广场。", force: "需在第一章结束前完成酒馆与市集相关节点。", choices: ["支持席拉相信伙伴：偏向宽容结局", "强调纪律与责任：偏向守序结局"] },
      { act: "第三章", title: "至死不渝", trigger: "德莱森王座厅收到婚礼邀请。", force: "带席拉前往酒馆并处理珠宝商与婚礼事件。", choices: ["保护并接纳伙伴：伊兰与金妮可获得较好结果", "苛责或放弃伙伴：席拉会质疑自己的判断"] },
      { act: "第五章", title: "挚友的最终考验", trigger: "完成此前任务后由席拉在德莱森发起。", force: "此前同伴的存活与是否获得帮助会改变现场。", choices: ["坚持救赎：席拉保持开放的圣武士道路", "要求绝对服从：结局更守序但代价更重"] }
    ] },
    { id: "camellia", name: "柯米丽雅", arc: "高贵之人的隐秘", nodes: [
      { act: "第三章", title: "无名废墟中的真相", trigger: "德莱森私宅地下室发现柯米丽雅。", force: "必须决定是否允许她继续仪式；当场杀死会终止全部后续。", choices: ["允许仪式：保留队友并开启后续", "拒绝并攻击：柯米丽雅永久死亡"] },
      { act: "第五章", title: "最后一滴", trigger: "完成第三章事件并保留柯米丽雅。", force: "前往肯纳布利旧宅，决定仆人与父亲的命运。", choices: ["纵容全部杀戮：进入其最黑暗结局", "限制目标：可能触发敌对并结束同行"] }
    ] },
    { id: "lann", name: "兰恩", arc: "地底人的未来", nodes: [
      { act: "第三章", title: "兰恩的烦恼", trigger: "选择兰恩为第一章同伴后，在德莱森交谈。", force: "与酋长和温蒂相关选择会累计兰恩的信心。", choices: ["让兰恩承担责任：提高其领导信心", "替他做所有决定：削弱最终任务成功率"] },
      { act: "第五章", title: "最后的日落", trigger: "前置任务完成后返回地底人聚落。", force: "若此前没有建立信任，让他独自执行计划可能死亡。", choices: ["信任成熟的兰恩独自行动：条件满足可存活并成功", "坚持共同作战：更稳妥但改变其个人结局"] }
    ] },
    { id: "wenduag", name: "雯朵格", arc: "力量与忠诚", nodes: [
      { act: "第三章", title: "地下人的背叛", trigger: "第一章选择雯朵格，德莱森收到地底人失踪消息。", force: "必须发现她与萨瓦梅勒势力接触的证据。", choices: ["公开羞辱并展现绝对力量：积累尊重", "无条件原谅：可能积累第五章背叛条件"] },
      { act: "第五章", title: "根深蒂固的恶魔", trigger: "完成第三章任务并回到地底人区域。", force: "隐藏尊重/忠诚条件不足时会背叛。", choices: ["以力量与信任收服：可保留雯朵格", "失败或示弱：她会加入萨瓦梅勒一方"] }
    ] },
    { id: "woljiF", name: "沃尔吉夫", arc: "魔裔与选择", nodes: [
      { act: "第一章", title: "失窃的月亮", trigger: "铁卫雄心地下室释放沃尔吉夫。", force: "灰兵营前未释放会错过第一阶段。", choices: ["查清提夫林藏身处的真凶：沃尔吉夫继续同行", "指错凶手：影响奖励与同伴评价"] },
      { act: "第三章", title: "新月之暗", trigger: "第二章失踪后在第三章世界地图随机遭遇找回。", force: "最终与耶费斯和外祖父力量对话。", choices: ["鼓励拒绝恶魔力量：凡人结局", "接受力量：沃尔吉夫成为更强的魔裔"] }
    ] },
    { id: "ember", name: "小烬", arc: "救赎、秩序或绝望", nodes: [
      { act: "第三章", title: "迷途羔羊", trigger: "在德莱森听闻小烬外出传教。", force: "营地对话、任务现场与第四章开场的善良/守序/邪恶选项累计隐藏倾向。", choices: ["鼓励仁慈：走向圣徒与救赎", "要求严厉：走向守序训诫", "嘲弄并打击她：走向破碎结局"] },
      { act: "第四章", title: "邪恶者", trigger: "在下城区遇见小烬的信徒。", force: "与诺缇库拉对话会展示此前路线，但不替代隐藏计数。", choices: ["继续相信所有人可被拯救：强化善良线", "以惩罚维持秩序：强化守序线"] },
      { act: "第五章", title: "受祝福者", trigger: "完成前两阶段后在德莱森触发。", force: "最高隐藏倾向决定现场与结局；平局优先善良。", choices: ["善良：出现大规模悔改", "守序：以纪律建立教团", "邪恶：小烬精神被彻底摧毁"] }
    ] },
    { id: "nenio", name: "聂纽", arc: "一切的奥秘", nodes: [
      { act: "全章", title: "比虚无更重要", trigger: "第一章无名废墟启动；各章收集谜题石板。", force: "需完成多个谜题遗迹并最终进入谜宇。", choices: ["完成全部谜题：揭示聂纽真实身份并可继续同行", "放弃最终谜题：任务停留，不影响大部分主线"] }
    ] },
    { id: "daeran", name: "岱兰", arc: "彼岸来客", nodes: [
      { act: "第二至四章", title: "暗中调查", trigger: "李奥特审判官请求调查阿伦岱宅邸屠杀。", force: "不能向岱兰泄露调查；信任通过多次私人事件累积。", choices: ["尊重边界并建立信任：为好结局准备", "公开审判或持续羞辱：降低信任"] },
      { act: "第五章", title: "一墙之隔", trigger: "李奥特通知调查完成，前往废弃地点布置陷阱。", force: "处理彼岸来客后立即决定岱兰命运。", choices: ["高信任下交给李奥特：可获受控但较好结局", "杀死李奥特：岱兰自由但更危险", "直接处决岱兰：同伴永久死亡"] }
    ] },
    { id: "sosiel", name: "索希尔", arc: "失踪的兄长", nodes: [
      { act: "第二至三章", title: "从死者之手 / 冒名者", trigger: "十字军营地入队后调查崔弗的盾牌与地狱骑士。", force: "谈及崔弗时持续选择“受害者”而非“英雄”或“叛徒”评价。", choices: ["强调崔弗是战争受害者：开启招募条件", "称其为英雄：最终可能只完成和解", "称其为叛徒：角斗场中难以挽救"] },
      { act: "第四章", title: "冒名者", trigger: "在午夜群岛竞技场找到崔弗。", force: "此前三次关键评价需指向受害者，并选择正确对话。", choices: ["“崔弗想保护你”并通过条件：崔弗入队", "条件不足：崔弗在决斗后死亡或离开"] }
    ] },
    { id: "regill", name: "雷吉尔", arc: "地狱骑士的审判", nodes: [
      { act: "第三章", title: "最后的归宿", trigger: "在德莱森收到地狱骑士前哨消息。", force: "主线与道途中的混乱、欺骗或不专业行为会累计负面评价。", choices: ["展现纪律与结果：改善最终审判", "滥用诡术或恶魔力量：增加指控"] },
      { act: "第五章", title: "地狱骑士的最后审判", trigger: "完成此前任务后收到正式传唤。", force: "隐藏评价决定是晋升、保留合作还是雷吉尔敌对。", choices: ["指控较少：雷吉尔以个人代价维护指挥官", "指控过多：地狱骑士团转为敌对"] }
    ] },
    { id: "arueshalae", name: "爱露莎蕾", arc: "梦与救赎", nodes: [
      { act: "第三章", title: "梦中之人", trigger: "招募后在德莱森与爱露莎蕾谈论梦境。", force: "不要把善行物件当作可利用的欲望证据。", choices: ["承认无私记忆的价值：推进救赎", "诱导她接受欲望：开启堕落路线"] },
      { act: "第四章", title: "何为梦", trigger: "进入阿勒什尼拉后与爱露莎蕾谈话。", force: "监牢场景决定是否继续正常救赎或腐化。", choices: ["拒绝诱惑并给予空间：可完成救赎/恋爱", "选择恶魔式欲望：爱露莎蕾堕落并暂时离队"] },
      { act: "第五章", title: "重返德丝娜之梦", trigger: "完成救赎路线后在德莱森收到消息。", force: "恶魔道途会导致冲突，但混乱选项可尝试挽留。", choices: ["完成救赎：阵营转为混乱善良", "堕落线重招：成为邪恶版本同伴"] }
    ] },
    { id: "greybor", name: "格雷博", arc: "佣兵的名声", nodes: [
      { act: "第三章", title: "猎龙", trigger: "德莱森说书人处接取并雇佣格雷博。", force: "任务后需支付约定费用才能长期招募。", choices: ["按约付款并尊重专业：增加忠诚", "压价、拖欠或鲁莽：降低忠诚"] },
      { act: "第四至五章", title: "刺客公会", trigger: "在阿勒什尼拉与刺客公会接触。", force: "此前职业信誉决定格雷博面对更高报价时是否背叛。", choices: ["高信誉：格雷博拒绝背叛并继续同行", "低信誉：他可能接受合约攻击指挥官"] }
    ] },
    { id: "ulbrig", name: "乌尔布里格", arc: "萨阔力人的最后传承", nodes: [
      { act: "第二至三章", title: "昔日萨阔力", trigger: "入队后调查萨阔力遗址与灵魂失踪。", force: "需要最后的萨阔力人 DLC；主线推进会分阶段开放区域。", choices: ["尊重旧信仰并寻找族人：强化希望路线", "否定过去：乌尔布里格更难接受新时代"] },
      { act: "第五章", title: "最后的萨阔力人", trigger: "完成前置区域后返回神圣森林。", force: "对灵魂、首领与家园的选择决定部族结局。", choices: ["连接过去与未来：萨阔力传承延续", "执着复仇：取得力量但牺牲和解"] }
    ] },
    { id: "lich-guard", name: "巫妖墓卫", arc: "五名亡者", nodes: [
      { act: "第三章", title: "塔庙与颅骨之柱", trigger: "完成塔庙并建立颅骨之柱。", force: "仅限巫妖；部分复生需邪恶神话对话并保留尸体。", choices: ["德莱森复生斯陶顿；善猎神殿复生德拉梅尔", "诱使西亚尔进攻塔庙后将其复生"] },
      { act: "第四至五章", title: "深渊与女王", trigger: "第四章矿坑找到克斯特格利尔；第五章伊兹处理女王。", force: "葛尔芙蕾必须在伊兹死亡，且指挥官保持巫妖道途。", choices: ["复生克斯特格利尔：获得双持战士", "复生葛尔芙蕾：获得最终墓卫并改变索希尔等人反应"] }
    ] }
  ];

  const sources = [
    { name: "Steam 官方页面", url: "https://store.steampowered.com/app/1184370/Pathfinder_Wrath_of_the_Righteous/", note: "版本、职业/种族规模与道途概览" },
    { name: "GameFAQs 2.2 规则指南", url: "https://gamefaqs.gamespot.com/ps4/324475-pathfinder-wrath-of-the-righteous/faqs/80843/character-building", note: "BAB 与专长前置规则基线" },
    { name: "Neoseeker 神话能力", url: "https://www.neoseeker.com/pathfinder-wrath-of-the-righteous/guides/Mythic_Feats_and_Abilities", note: "通用神话能力与专长文本" },
    { name: "Neoseeker 道途解锁", url: "https://www.neoseeker.com/pathfinder-wrath-of-the-righteous/guides/How_to_Unlock_Mythic_Paths", note: "道途进入条件" },
    { name: "Neoseeker 队友结局", url: "https://www.neoseeker.com/pathfinder-wrath-of-the-righteous/guides/Companion_Endings", note: "隐藏变量与选择后果" }
  ];

  return { abilities, races, backgrounds, skills, classes, feats, mythic, paths, companions, quests, sources };
})();
