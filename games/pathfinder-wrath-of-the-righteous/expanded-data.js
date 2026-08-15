(() => {
  "use strict";

  const DATA = window.WOTR_DATA;
  if (!DATA) return;

  const background = (id, name, category, skills, effect, proficiencies = "") => ({ id, name, category, skills, effect, proficiencies, text: [skills.length ? `本职技能：${skills.join("、")}` : "", proficiencies ? `熟练：${proficiencies}` : "", effect].filter(Boolean).join("；") });
  DATA.backgrounds = [
    background("none", "无出身", "无", [], "不获得额外本职技能、熟练或出身能力"),
    background("farmhand", "农夫", "工匠", ["athletics", "nature"], "强韧豁免 +1", "镰刀"),
    background("lumberjack", "伐木工", "工匠", ["athletics"], "已熟练武器获得 +1 增强加值", "手斧、战斧、巨斧"),
    background("miner", "矿工", "工匠", ["athletics"], "已熟练武器获得 +1 增强加值", "轻型镐、重型镐"),
    background("smith", "铁匠", "工匠", ["athletics"], "已熟练武器获得 +1 增强加值", "轻锤、战锤"),
    background("courtier", "廷臣", "贵族", ["persuasion", "trickery"], "已熟练武器或盾牌获得 +1 增强加值", "细剑、小圆盾"),
    background("emissary", "使者", "贵族", ["persuasion", "world"], "已熟练武器或盾牌获得 +1 增强加值", "细剑、小圆盾"),
    background("leader", "领袖", "贵族", ["persuasion"], "已熟练武器或盾牌获得 +1 增强加值", "长剑、细剑、巨剑、小圆盾"),
    background("acolyte", "侍僧", "修行者", ["persuasion", "religion"], "说服检定改用感知调整值"),
    background("healer", "医者", "修行者", ["nature", "religion"], "学识（自然/宗教）改用智力调整值"),
    background("martial-disciple", "武学门徒", "修行者", ["mobility", "religion"], "获得精通徒手攻击专长"),
    background("aldori-swordsman", "阿尔多瑞剑士", "地域", ["persuasion"], "已熟练武器或盾牌获得 +1 增强加值", "决斗剑、小圆盾"),
    background("alkenstar-alchemist", "阿肯斯塔炼金师", "地域", ["arcana"], "炼金炸弹与炼金物品伤害 +1"),
    background("andoren-diplomat", "安多兰外交官", "地域", ["persuasion"], "交涉类说服检定 +2"),
    background("chelaxian-diabolist", "切利亚克斯魔鬼学者", "地域", ["arcana"], "对魔鬼的闪避 AC +4"),
    background("gebbite-necromancer", "格布死灵法师", "地域", ["religion"], "召唤亡灵额外获得 3 点生命"),
    background("mendevian-orphan", "门德夫孤儿", "地域", ["religion"], "对抗恶魔的豁免 +1"),
    background("mwangi-hunter", "姆万吉猎人", "地域", ["nature", "stealth"], "投掷武器伤害 +1", "飞镖、投掷斧、标枪"),
    background("nexian-scholar", "耐克斯学者", "地域", ["arcana"], "知识（神秘）检定 +2"),
    background("osirian-historian", "奥西里昂历史学家", "地域", ["world"], "知识（世界）检定 +2"),
    background("qadiran-wanderer", "卡迪拉旅人", "地域", ["perception", "nature"], "对抗疲乏与力竭的豁免 +2"),
    background("river-kingdoms-daredevil", "河川诸国冒险家", "地域", ["mobility"], "对借机攻击的 AC +2", "短剑、匕首"),
    background("shackles-corsair", "枷锁群岛海盗", "地域", ["athletics", "mobility"], "对抗绊摔的 CMD +2", "弯刀"),
    background("ustalavic-peasant", "乌斯塔拉夫农民", "地域", ["athletics"], "处于恐惧效果时 AC 与伤害 +1", "镰刀"),
    background("varisian-explorer", "瓦瑞西亚探险家", "地域", ["trickery", "world"], "反射豁免 +1"),
    background("linnorm-warrior", "林诺姆诸王勇士", "地域", ["mobility"], "寒冷抗性 5", "手斧、战斧、巨斧"),
    background("arcane-scholar", "奥术学者", "学者", ["arcana", "umd"], "获得抄录卷轴"),
    background("divine-scholar", "神术学者", "学者", ["religion", "umd"], "获得酿造药水"),
    background("nature-scholar", "自然学者", "学者", [], "选择一个德鲁伊 0 环法术随意施放"),
    background("acrobat", "杂技演员", "街头流浪儿", ["trickery", "mobility"], "已熟练武器获得 +1 增强加值", "投掷斧"),
    background("mugger", "劫匪", "街头流浪儿", ["trickery", "persuasion"], "已熟练武器获得 +1 增强加值", "匕首、拳匕、飞镖"),
    background("pickpocket", "扒手", "街头流浪儿", ["trickery", "stealth"], "先攻 +2"),
    background("hermit", "隐士", "流浪者", ["nature"], "已熟练武器获得 +1 增强加值", "木棍、短棍、巨棍、飞镖"),
    background("hunter", "猎人", "流浪者", ["nature", "perception"], "已熟练武器获得 +1 增强加值", "短弓、长弓"),
    background("nomad", "游牧民", "流浪者", ["nature"], "动物伙伴生命 +3", "弯刀"),
    background("bounty-hunter", "赏金猎人", "战士", ["stealth"], "已熟练装备获得 +1 增强加值", "轻甲、短棍、轻硬头锤、重硬头锤"),
    background("gladiator", "角斗士", "战士", ["persuasion"], "已熟练装备获得 +1 增强加值", "三叉戟、短剑、轻甲、小圆盾"),
    background("guard", "卫兵", "战士", ["perception"], "已熟练装备获得 +1 增强加值", "短剑、轻弩、轻甲"),
    background("mercenary", "雇佣兵", "战士", ["world"], "已熟练装备获得 +1 增强加值", "轻甲、矛、长矛、标枪")
  ];

  const archetypeGroups = {
    alchemist: ["Chirurgeon", "Grenadier", "Incense Synthesizer", "Metamorph", "Preservationist", "Reanimator", "Vivisectionist"],
    arcanist: ["Brown-Fur Transmuter", "Eldritch Font", "Magic Deceiver", "Nature Mage", "Phantasmal Mage", "Unlettered Arcanist", "White Mage"],
    barbarian: ["Armored Hulk", "Beastskin Berserker", "Flesheater", "Instinctual Warrior", "Invulnerable Rager", "Mad Dog", "Pack Rager"],
    bard: ["Archaeologist", "Beast Tamer", "Chelaxian Diva", "Dirge Bard", "Flame Dancer", "Thundercaller", "Tranquil Whisperer"],
    bloodrager: ["Bloodrider", "Greenrager", "Hag-Riven", "Mixed-Blood Rager", "Primalist", "Reformed Fiend", "Spelleater", "Steelblood"],
    cavalier: ["Beast Rider", "Cavalier of the Paw", "Disciple of the Pike", "Fearsome Leader", "Gendarme", "Ghost Rider", "Knight of the Wall", "Standard Bearer"],
    cleric: ["Angelfire Apostle", "Crusader", "Demonbane Priest", "Ecclesitheurge", "Herald Caller", "Priest of Balance", "Separatist"],
    druid: ["Blight Druid", "Defender of the True World", "Drovier", "Elemental Rampager", "Feyspeaker", "Primal Druid", "Winter Child"],
    fighter: ["Aldori Defender", "Armiger", "Defender of the Hearth", "Dragonheir Scion", "Mutation Warrior", "Titan Fighter", "Tower Shield Specialist", "Two-Handed Fighter"],
    hunter: ["Colluding Scoundrel", "Divine Hound", "Divine Hunter", "Forester", "Tandem Executioner", "Urban Hunter", "Wandering Marksman"],
    inquisitor: ["Faith Hunter", "Judge", "Living Grimoire", "Monster Tactician", "Sacred Huntsmaster", "Sanctified Slayer", "Tactical Leader"],
    kineticist: ["Blood Kineticist", "Dark Elementalist", "Elemental Engine", "Kinetic Knight", "Kinetic Sharpshooter", "Overwhelming Soul", "Psychokineticist"],
    magus: ["Arcane Rider", "Armored Battlemage", "Bladebound", "Eldritch Archer", "Eldritch Scion", "Hexcrafter", "Spell Dancer", "Sword Saint"],
    monk: ["Drunken Master", "Quarterstaff Master", "Scaled Fist", "Sensei", "Sohei", "Student of Stone", "Traditional Monk", "Zen Archer"],
    oracle: ["Divine Herbalist", "Dual-Cursed Oracle", "Enlightened Philosopher", "Lone Strider", "Possessed Oracle", "Purifier", "Seeker", "Wind Whisperer"],
    paladin: ["Divine Guardian", "Divine Hunter", "Divine Scion", "Hospitaler", "Martyr", "Stonelord", "Tortured Crusader", "Warrior of the Holy Light"],
    ranger: ["Demonslayer", "Espionage Expert", "Flamewarden", "Freebooter", "Nomad", "Sable Company Marine", "Stormwalker"],
    rogue: ["Dark Lurker", "Eldritch Scoundrel", "Knife Master", "Master of All", "Rowdy", "Sylvan Trickster", "Thug", "Underground Chemist"],
    shaman: ["Possessed Shaman", "Prophet of Pestilence", "Shadow Shaman", "Spirit Hunter", "Spirit Warden", "Unsworn Shaman", "Wildland Shaman", "Witch Doctor"],
    shifter: ["Child of the Manticore", "Dragonblood Shifter", "Feyform Shifter", "Fiendflesh Shifter", "Rageshaper", "Weretouched", "Wild Effigy", "Griffonheart Shifter"],
    skald: ["Battle Scion", "Battle Singer", "Court Poet", "Demon Dancer", "Herald of the Horn", "Hunt Caller", "Inciter"],
    slayer: ["Arcane Enforcer", "Bloodseeker", "Deliverer", "Executioner", "Imitator", "Spawn Slayer", "Stygian Slayer", "Vanguard"],
    sorcerer: ["Crossblooded", "Empyreal Sorcerer", "Geomancer", "Nine Tailed Heir", "Overwhelming Mage", "Sage Sorcerer", "Seeker", "Sylvan Sorcerer"],
    warpriest: ["Champion of the Faith", "Cult Leader", "Disenchanter", "Feral Champion", "Mantis Zealot", "Proclaimer", "Shieldbearer"],
    witch: ["Elemental Witch", "Hag of Gyronna", "Hagbound", "Hex Channeler", "Keen-Eyed Adventurer", "Ley Line Guardian", "Stigmatized Witch", "Witch of the Veil"],
    wizard: ["Arcane Bomber", "Cruoromancer", "Elemental Specialist", "Exploiter Wizard", "Scroll Savant", "Shadowcaster", "Spell Master", "Thassilonian Specialist"]
  };

  const specialArchetype = {
    "cleric:crusader": { domainPicks: 1, text: "以一个领域和减少法术位换取战斗奖励专长。" },
    "cleric:demonbane-priest": { domainPicks: 1, text: "重甲与抗魔专长路线，只选择一个领域。" },
    "cleric:herald-caller": { domainPicks: 1, text: "牺牲一个领域换取召唤强化。" },
    "cleric:priest-of-balance": { domainPicks: 1, text: "同时引导正负能量，只选择一个领域。" },
    "cleric:separatist": { domainPicks: 2, text: "第二领域可越出神祇列表，但按较低等级计算。" },
    "hunter:divine-hunter": { domainPicks: 1, domainPickLevel: 3, text: "3 级选择一个领域，并按猎人进度获得对应领域能力。" },
    "magus:eldritch-scion": { spontaneous: true, spellList: "arcane", text: "以魅力自发施放魔战士法术，并获得血脉。" },
    "sorcerer:crossblooded": { knownOffset: -1, text: "双血脉换取更多血脉能力；每个法术环的自由已知法术少 1。" },
    "witch:ley-line-guardian": { spontaneous: true, spellList: "witch", text: "以智力自发施放巫师法术，并用魔网增幅替代部分巫术。" },
    "witch:stigmatized-witch": { spontaneous: true, spellList: "witch", text: "以魅力自发施法，以诅咒替代庇护主。" }
  };

  const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  DATA.archetypes = Object.entries(archetypeGroups).flatMap(([baseClass, names]) => names.map((name) => {
    const id = slug(name);
    const special = specialArchetype[`${baseClass}:${id}`] || {};
    return { id, baseClass, name, text: special.text || `${DATA.classes.find((item) => item.id === baseClass)?.name || baseClass}原型；保留基类的 BAB 与生命骰框架，替换部分职业能力。`, ...special };
  }));

  const classRules = {
    alchemist: [8, ["ref"], "int"], arcanist: [6, ["will"], "int"], barbarian: [12, ["fort"], "str"], bard: [8, ["ref", "will"], "cha"],
    bloodrager: [10, ["fort"], "cha"], cavalier: [10, ["fort"], "str"], cleric: [8, ["fort", "will"], "wis"], druid: [8, ["fort", "will"], "wis"],
    fighter: [10, ["fort"], "str"], hunter: [8, ["fort", "ref"], "wis"], inquisitor: [8, ["fort", "will"], "wis"], kineticist: [8, ["fort"], "con"],
    magus: [8, ["fort", "will"], "int"], monk: [8, ["fort", "ref", "will"], "wis"], oracle: [8, ["will"], "cha"], paladin: [10, ["fort", "will"], "cha"],
    ranger: [10, ["fort", "ref"], "wis"], rogue: [8, ["ref"], "dex"], shaman: [8, ["will"], "wis"], shifter: [10, ["fort", "ref"], "wis"],
    skald: [8, ["fort", "will"], "cha"], slayer: [10, ["fort", "ref"], "dex"], sorcerer: [6, ["will"], "cha"], warpriest: [8, ["fort", "will"], "wis"],
    witch: [6, ["will"], "int"], wizard: [6, ["will"], "int"], "aldori-swordlord": [10, ["ref"], "dex"], "arcane-trickster": [6, ["ref", "will"], "int"],
    assassin: [8, ["ref"], "dex"], "dragon-disciple": [12, ["fort", "will"], "str"], duelist: [10, ["ref"], "dex"], "eldritch-knight": [10, ["fort"], "str"],
    hellknight: [10, ["fort", "will"], "cha"], "hellknight-signifer": [8, ["will"], "int"], loremaster: [6, ["will"], "int"], "mystic-theurge": [6, ["will"], "int"],
    "stalwart-defender": [12, ["fort", "will"], "con"], "student-of-war": [10, ["fort"], "int"], "winter-witch": [6, ["will"], "int"]
  };
  const spontaneousClasses = { bard: "arcane", bloodrager: "arcane", hunter: "divine", inquisitor: "divine", oracle: "divine", skald: "arcane", sorcerer: "arcane" };
  DATA.classes.forEach((entry) => {
    const rule = classRules[entry.id] || [8, [], "str"];
    entry.hitDie = rule[0];
    entry.goodSaves = rule[1];
    entry.primaryAbility = rule[2];
    if (entry.id === "cleric") entry.domainPicks = 2;
    if (entry.id === "inquisitor") entry.domainPicks = 1;
    if (spontaneousClasses[entry.id]) { entry.spontaneous = true; entry.spellList = spontaneousClasses[entry.id]; }
  });

  const domain = (id, name, basic, greater, greaterLevel = 8) => ({ id, name, basic, greater, greaterLevel, text: `${basic}；${greaterLevel} 级能力：${greater}` });
  DATA.domains = [
    domain("air", "气元素领域", "闪电弧：远程接触电击", "电击抗性"), domain("animal", "动物领域", "动物伙伴按牧师等级 -3 成长", "动物形态强化", 4),
    domain("artifice", "巧艺领域", "巧匠之触：伤害或修复构装体", "舞动武器"), domain("chaos", "混乱领域", "混乱之触：目标下次 d20 取较差结果", "混乱之刃"),
    domain("charm", "魅惑领域", "晕眩之触", "魅惑微笑"), domain("community", "社群领域", "安抚之触：移除疲乏等状态", "守护炉火：范围内攻击与豁免获得感知加值"),
    domain("darkness", "黑暗领域", "黑暗之触：赋予隐蔽", "黑暗之眼"), domain("death", "死亡领域", "流血之触", "死亡拥抱"),
    domain("destruction", "毁灭领域", "毁灭打击：伤害获得半等级加值", "毁灭灵光"), domain("earth", "土元素领域", "强酸飞镖", "强酸抗性", 6),
    domain("evil", "邪恶领域", "邪恶之触：豁免与 AC 承受减值", "邪恶镰刀"), domain("fire", "火元素领域", "火焰箭", "火焰抗性", 6),
    domain("glory", "荣耀领域", "荣耀之触：魅力检定获得等级加值", "英雄灵光"), domain("good", "善良领域", "善良之触：攻击、技能与豁免获得加值", "神圣长矛"),
    domain("healing", "医疗领域", "斥退死亡：治疗濒死目标更有效", "治疗祝福", 6), domain("knowledge", "知识领域", "博学：全部知识成为本职", "遥视"),
    domain("law", "秩序领域", "秩序之触：下次 d20 视为 11", "秩序之杖"), domain("liberation", "解放领域", "解放：暂时忽略行动妨碍", "自由呼唤"),
    domain("luck", "幸运领域", "一点好运：目标 d20 掷两次取高", "神圣幸运", 6), domain("madness", "疯狂领域", "疯狂视界：三类检定一增两减", "疯狂灵光"),
    domain("magic", "魔法领域", "侍僧之手：投射武器攻击", "解除之触"), domain("nobility", "高贵领域", "振奋话语", "领袖灵光", 6),
    domain("plant", "植物领域", "木拳：徒手获得伤害加值", "荆棘护甲", 6), domain("protection", "保护领域", "抗性之触：豁免获得抗力加值", "保护灵光"),
    domain("repose", "安眠领域", "温柔休憩：使目标恍惚并压制亡灵", "死亡结界"), domain("rune", "符文领域", "爆裂符文", "守护符文"),
    domain("strength", "力量领域", "力量激增：力量检定与攻击获得加值", "众神之力"), domain("sun", "太阳领域", "太阳祝福：引导能量对亡灵更强", "光耀灵光"),
    domain("travel", "旅行领域", "轻快步伐：短时忽略困难地形", "次元跳跃"), domain("trickery", "诡计领域", "复制体：获得镜像分身", "大师幻术"),
    domain("war", "战争领域", "战斗狂怒：近战伤害获得半等级加值", "武器大师"), domain("water", "水元素领域", "冰锥", "寒冷抗性", 6),
    domain("weather", "天气领域", "风暴爆发：非致命电击并施加减值", "雷霆领主")
  ];

  const spell = (id, name, level, lists, school) => ({ id, name, level, lists, school, text: `${school} · ${level} 环` });
  DATA.spells = [
    spell("magic-missile", "魔法飞弹", 1, ["arcane"], "塑能"), spell("mage-armor", "法师护甲", 1, ["arcane"], "防护"), spell("shield", "护盾术", 1, ["arcane"], "防护"),
    spell("grease", "油腻术", 1, ["arcane"], "咒法"), spell("color-spray", "七彩喷射", 1, ["arcane"], "幻术"), spell("enlarge-person", "变巨术", 1, ["arcane"], "变化"),
    spell("bless", "祝福术", 1, ["divine"], "附魔"), spell("cure-light", "治疗轻伤", 1, ["divine"], "咒法"), spell("divine-favor", "神恩", 1, ["divine"], "塑能"),
    spell("command", "命令术", 1, ["divine"], "附魔"), spell("remove-fear", "移除恐惧", 1, ["divine"], "防护"), spell("protection-from-evil", "防护邪恶", 1, ["arcane", "divine"], "防护"),
    spell("mirror-image", "镜影术", 2, ["arcane"], "幻术"), spell("blur", "朦胧术", 2, ["arcane"], "幻术"), spell("scorching-ray", "灼热射线", 2, ["arcane"], "塑能"),
    spell("web", "蛛网术", 2, ["arcane"], "咒法"), spell("bull-strength", "牛之力量", 2, ["arcane", "divine"], "变化"), spell("resist-energy", "抵抗能量", 2, ["arcane", "divine"], "防护"),
    spell("restoration-lesser", "次级复原术", 2, ["divine"], "咒法"), spell("barkskin", "树肤术", 2, ["divine"], "变化"), spell("hold-person", "人类定身术", 2, ["arcane", "divine"], "附魔"),
    spell("haste", "加速术", 3, ["arcane"], "变化"), spell("fireball", "火球术", 3, ["arcane"], "塑能"), spell("dispel-magic", "解除魔法", 3, ["arcane", "divine"], "防护"),
    spell("stinking-cloud", "臭云术", 3, ["arcane"], "咒法"), spell("heroism", "英雄气概", 3, ["arcane"], "附魔"), spell("prayer", "祈祷术", 3, ["divine"], "附魔"),
    spell("animate-dead", "操纵死尸", 3, ["divine"], "死灵"), spell("protection-energy", "防护能量", 3, ["arcane", "divine"], "防护"), spell("cure-serious", "治疗重伤", 3, ["divine"], "咒法"),
    spell("dimension-door", "任意门", 4, ["arcane"], "咒法"), spell("greater-invisibility", "高等隐形术", 4, ["arcane"], "幻术"), spell("controlled-fireball", "可控火球术", 4, ["arcane"], "塑能"),
    spell("death-ward", "防死结界", 4, ["divine"], "防护"), spell("freedom-movement", "行动自如", 4, ["divine"], "防护"), spell("divine-power", "神能", 4, ["divine"], "塑能"),
    spell("stoneskin", "石肤术", 4, ["arcane", "divine"], "防护"), spell("phantasmal-killer", "魅影杀手", 4, ["arcane"], "幻术"), spell("cure-critical", "治疗致命伤", 4, ["divine"], "咒法"),
    spell("cloudkill", "死云术", 5, ["arcane"], "咒法"), spell("feeblemind", "弱智术", 5, ["arcane"], "附魔"), spell("baleful-polymorph", "恶意变形术", 5, ["arcane"], "变化"),
    spell("flame-strike", "焰击术", 5, ["divine"], "塑能"), spell("true-seeing", "真知术", 5, ["arcane", "divine"], "预言"), spell("breath-life", "生命之息", 5, ["divine"], "咒法"),
    spell("chain-lightning", "连环闪电", 6, ["arcane"], "塑能"), spell("disintegrate", "解离术", 6, ["arcane"], "变化"), spell("sirocco", "热风术", 6, ["arcane"], "塑能"),
    spell("heal", "医疗术", 6, ["divine"], "咒法"), spell("blade-barrier", "剑刃障壁", 6, ["divine"], "塑能"), spell("greater-dispel", "高等解除魔法", 6, ["arcane", "divine"], "防护"),
    spell("legendary-proportions", "传奇体型", 7, ["arcane"], "变化"), spell("finger-death", "死亡一指", 7, ["arcane", "divine"], "死灵"), spell("greater-restoration", "高等复原术", 7, ["divine"], "咒法"),
    spell("frightful-aspect", "恐怖外表", 8, ["arcane", "divine"], "变化"), spell("stormbolts", "风暴之矢", 8, ["arcane", "divine"], "塑能"), spell("seamantle", "海洋披风", 8, ["arcane", "divine"], "咒法"),
    spell("weird", "怪影杀手", 9, ["arcane"], "幻术"), spell("mass-heal", "群体医疗术", 9, ["divine"], "咒法"), spell("energy-drain", "能量吸取", 9, ["arcane", "divine"], "死灵")
  ];

  const extraFeats = [
    ["improved-unarmed-strike", "精通徒手攻击", "武术", "徒手攻击不引发借机，并视为武装。"], ["crane-riposte", "鹤击", "武术", "鹤翼成功防御后可反击。", { feats: ["crane-wing"], bab: 8 }],
    ["pummeling-style", "锤击流派", "武术", "徒手全攻击合并计算伤害减免。", { bab: 6 }], ["pummeling-bully", "锤击凌虐", "武术", "锤击流派命中时尝试绊摔。", { feats: ["pummeling-style", "improved-trip"], bab: 9 }],
    ["dragon-style", "龙形拳", "武术", "徒手第一击获得更高力量伤害。", { abilities: { str: 15 }, feats: ["improved-unarmed-strike"] }], ["dragon-ferocity", "龙之凶猛", "武术", "进一步提高徒手力量伤害。", { feats: ["dragon-style"], abilities: { str: 15 } }],
    ["vital-strike", "要害打击", "战斗", "标准动作攻击造成双倍武器骰。", { bab: 6 }], ["improved-vital-strike", "精通要害打击", "战斗", "要害打击造成三倍武器骰。", { feats: ["vital-strike"], bab: 11 }],
    ["greater-vital-strike", "高等要害打击", "战斗", "要害打击造成四倍武器骰。", { feats: ["improved-vital-strike"], bab: 16 }], ["lunge", "突刺", "战斗", "回合内近战触及 +5 尺，AC -2。", { bab: 6 }],
    ["blind-fight", "盲斗", "战斗", "对隐蔽失手重掷，并防止被隐形近战措手不及。"], ["improved-blind-fight", "精通盲斗", "战斗", "忽略非完全隐蔽失手。", { feats: ["blind-fight"], skills: { perception: 10 } }],
    ["critical-focus", "重击专攻", "重击", "确认重击检定 +4。", { bab: 9 }], ["sickening-critical", "恶心重击", "重击", "重击使目标恶心。", { feats: ["critical-focus"], bab: 11 }],
    ["staggering-critical", "蹒跚重击", "重击", "重击使目标蹒跚。", { feats: ["critical-focus"], bab: 13 }], ["blinding-critical", "致盲重击", "重击", "重击使目标目盲。", { feats: ["critical-focus"], bab: 15 }],
    ["weapon-specialization", "武器专精", "武器", "所选武器伤害 +2。", { feats: ["weapon-focus"], fighterLevel: 4 }], ["greater-weapon-specialization", "高等武器专精", "武器", "所选武器伤害再 +2。", { feats: ["greater-weapon-focus", "weapon-specialization"], fighterLevel: 12 }],
    ["armor-focus", "盔甲专攻", "防御", "所选甲类的 AC +1。", { bab: 1 }], ["shield-focus", "盾牌专攻", "盾牌", "盾牌 AC +1。", { feats: ["shield-bash"] }],
    ["greater-shield-focus", "高等盾牌专攻", "盾牌", "盾牌 AC 再 +1。", { feats: ["shield-focus"], fighterLevel: 8 }], ["tower-shield", "塔盾擅长", "熟练", "可正常使用塔盾。", { feats: ["shield-focus"] }],
    ["combat-casting", "战斗施法", "施法", "防御式施法检定 +4。"], ["elemental-focus", "元素专攻", "施法", "所选能量法术 DC +1。"],
    ["greater-elemental-focus", "高等元素专攻", "施法", "所选能量法术 DC 再 +1。", { feats: ["elemental-focus"] }], ["spell-specialization", "法术专精", "施法", "所选法术的施法者等级 +2。", { feats: ["spell-focus"] }],
    ["empower-spell", "法术强效", "超魔", "法术可变量提高 50%，环级 +2。", { spell: 1 }], ["maximize-spell", "法术极效", "超魔", "法术可变量取最大值，环级 +3。", { spell: 1 }],
    ["quicken-spell", "法术瞬发", "超魔", "法术改为迅捷动作，环级 +4。", { spell: 1 }], ["heighten-spell", "法术升阶", "超魔", "提高法术环级与 DC。", { spell: 1 }],
    ["persistent-spell", "法术顽强", "超魔", "目标豁免两次取较差，环级 +2。", { spell: 1 }], ["reach-spell", "法术增程", "超魔", "提升法术射程，环级 +1。", { spell: 1 }],
    ["clustered-shots", "集束射击", "远程", "同轮远程伤害合并计算减伤。", { feats: ["precise-shot"], bab: 6 }], ["snap-shot", "近身射击", "远程", "持远程武器可威胁近身区域。", { feats: ["rapid-shot", "weapon-focus"], bab: 6 }],
    ["improved-snap-shot", "精通近身射击", "远程", "近身射击威胁范围提高。", { feats: ["snap-shot"], bab: 9 }], ["point-blank-master", "近程射击大师", "远程", "指定远程武器攻击不引发借机。", { feats: ["weapon-focus"], fighterLevel: 4 }],
    ["back-to-back", "背靠背", "团队", "被夹击时对夹击者 AC +2。"], ["precise-strike", "精准打击", "团队", "与同样拥有此专长的盟友夹击时额外 1d6 精准伤害。", { abilities: { dex: 13 }, bab: 1 }],
    ["coordinated-maneuvers", "协同战技", "团队", "邻近盟友共享战技加值。"], ["allied-spellcaster", "结盟施法者", "团队", "邻近盟友提高法术穿透与专注检定。"],
    ["shielded-caster", "盾护施法者", "团队", "邻近持盾盟友提高专注与 AC。"], ["tandem-trip", "协同绊摔", "团队", "与盟友共同威胁目标时绊摔掷两次取高。"],
    ["mounted-combat", "骑乘战斗", "骑乘", "骑术检定可替坐骑抵消一次命中。", { skills: { mobility: 1 } }], ["spirited-charge", "奋力冲锋", "骑乘", "骑乘冲锋伤害翻倍。", { feats: ["mounted-combat"] }],
    ["indomitable-mount", "不屈坐骑", "骑乘", "骑术检定替代坐骑一次豁免。", { feats: ["mounted-combat"] }], ["mounted-shield", "骑乘盾牌", "骑乘", "坐骑获得你的盾牌加值。", { feats: ["mounted-combat", "shield-focus"] }],
    ["great-fortitude", "强韧加强", "通用", "强韧豁免 +2。"], ["iron-will", "钢铁意志", "通用", "意志豁免 +2。"], ["lightning-reflexes", "闪电反射", "通用", "反射豁免 +2。"],
    ["alertness", "警觉", "技能", "察觉检定 +2。"], ["persuasive", "善辩", "技能", "说服检定 +2。"], ["deceitful", "诡诈", "技能", "巧手检定 +2。"],
    ["improved-bull-rush", "精通冲撞", "战技", "冲撞检定 +2 且不引发借机。", { feats: ["power-attack"], abilities: { str: 13 } }], ["greater-bull-rush", "高等冲撞", "战技", "冲撞检定再 +2 并引发盟友借机。", { feats: ["improved-bull-rush"], bab: 6 }],
    ["improved-sunder", "精通破武", "战技", "破武检定 +2 且不引发借机。", { feats: ["power-attack"], abilities: { str: 13 } }], ["greater-sunder", "高等破武", "战技", "破武检定再 +2。", { feats: ["improved-sunder"], bab: 6 }],
    ["improved-disarm", "精通卸武", "战技", "卸武检定 +2 且不引发借机。", { feats: ["combat-expertise"], abilities: { int: 13 } }], ["greater-disarm", "高等卸武", "战技", "卸武检定再 +2。", { feats: ["improved-disarm"], bab: 6 }]
  ].map(([id, name, category, text, req]) => ({ id, name, category, text, req }));
  const knownFeatIds = new Set(DATA.feats.map((item) => item.id));
  DATA.feats.push(...extraFeats.filter((item) => !knownFeatIds.has(item.id)));
  const moreFeats = [
    ["great-cleave", "强力顺势斩", "战斗", "顺势斩可继续攻击更多相邻敌人。", { feats: ["cleave"], bab: 4 }],
    ["improved-cleaving-finish", "精通终势斩", "战斗", "终势斩不再限每轮一次。", { feats: ["great-cleave", "cleaving-finish"], bab: 6 }],
    ["dreadful-carnage", "恐怖屠戮", "威吓", "击杀敌人后对附近敌人进行群体威吓。", { feats: ["power-attack", "dazzling-display"], abilities: { str: 15 }, bab: 11 }],
    ["piranha-strike", "食人鱼打击", "战斗", "敏捷武器以攻击减值换取伤害。", { feats: ["weapon-finesse"], abilities: { dex: 13 } }],
    ["fencing-grace", "击剑优雅", "武器", "指定单手穿刺武器以敏捷计算伤害。", { feats: ["weapon-finesse", "weapon-focus"], abilities: { dex: 13 } }],
    ["slashing-grace", "挥砍优雅", "武器", "指定单手挥砍武器以敏捷计算伤害。", { feats: ["weapon-finesse", "weapon-focus"], abilities: { dex: 13 } }],
    ["aldori-dueling-mastery", "阿尔多瑞决斗精通", "武器", "以决斗剑作战时强化 AC、先攻与伤害。", { feats: ["weapon-finesse", "weapon-focus"], abilities: { dex: 13 }, bab: 3 }],
    ["greater-snap-shot", "高等近身射击", "远程", "进一步扩大远程武器威胁范围。", { feats: ["improved-snap-shot"], abilities: { dex: 17 }, bab: 12 }],
    ["throw-anything", "投掷万物", "远程", "投掷泼溅武器不承受非擅长减值。"],
    ["greater-blind-fight", "高等盲斗", "战斗", "完全隐蔽失手率降至 20%。", { feats: ["improved-blind-fight"], skills: { perception: 15 } }],
    ["tiring-critical", "疲劳重击", "重击", "重击使目标疲劳。", { feats: ["critical-focus"], bab: 13 }],
    ["exhausting-critical", "力竭重击", "重击", "重击使目标力竭。", { feats: ["critical-focus", "tiring-critical"], bab: 15 }],
    ["critical-mastery", "重击大师", "重击", "一次重击可应用两种重击专长。", { feats: ["critical-focus"], fighterLevel: 14, anyCriticalFeats: 2 }],
    ["shield-proficiency", "盾牌擅长", "熟练", "擅长小圆盾、轻盾和重盾。"],
    ["missile-shield", "飞弹盾", "盾牌", "每轮偏斜一次远程武器攻击。", { feats: ["shield-focus"], abilities: { dex: 13 } }],
    ["ray-shield", "射线盾", "盾牌", "盾牌基础加值计入接触 AC。", { feats: ["missile-shield"], abilities: { dex: 15 } }],
    ["bashing-finish", "终结盾击", "盾牌", "近战重击后免费追加盾击。", { feats: ["shield-master"] }],
    ["deflect-arrows", "拨挡箭矢", "武术", "每轮拨挡一次远程攻击。", { feats: ["improved-unarmed-strike"], abilities: { dex: 13 } }],
    ["stunning-fist", "震慑拳", "武术", "徒手攻击可震慑目标。", { feats: ["improved-unarmed-strike"] }],
    ["elemental-fist", "元素拳", "武术", "徒手攻击附加元素伤害。", { feats: ["improved-unarmed-strike"], abilities: { con: 13, wis: 13 }, bab: 8 }],
    ["perfect-strike", "完美打击", "武术", "攻击掷两次取高。", { feats: ["improved-unarmed-strike"], abilities: { dex: 13, wis: 13 }, bab: 8 }],
    ["crushing-blow", "粉碎打击", "武术", "震慑拳可降低目标 AC。", { feats: ["stunning-fist"] }],
    ["dragon-roar", "龙吼", "武术", "消耗震慑拳形成锥形冲击。", { feats: ["dragon-style", "stunning-fist"], skills: { mobility: 8 } }],
    ["pummeling-charge", "锤击冲锋", "武术", "冲锋后进行徒手全攻击。", { feats: ["pummeling-style"], oneOf: [{ bab: 12 }, { monkLevel: 8 }] }],
    ["shaitan-style", "沙伊坦流派", "武术", "强化元素拳的酸蚀伤害。", { feats: ["improved-unarmed-strike", "elemental-fist"], abilities: { con: 13, wis: 13 }, oneOf: [{ bab: 9 }, { monkLevel: 5 }] }],
    ["shaitan-skin", "沙伊坦之肤", "武术", "获得酸蚀抗性并使敌人蹒跚。", { feats: ["shaitan-style"], abilities: { con: 15, wis: 15 }, oneOf: [{ bab: 11 }, { monkLevel: 9 }] }],
    ["shaitan-earthblast", "沙伊坦地爆", "武术", "消耗元素拳制造范围酸蚀爆发。", { feats: ["shaitan-skin"], abilities: { con: 15, wis: 17 }, oneOf: [{ bab: 13 }, { monkLevel: 13 }] }],
    ["intensified-spell", "法术增幅", "超魔", "伤害骰上限提高 5 级，环级 +1。", { spell: 1 }],
    ["piercing-spell", "法术穿阻", "超魔", "目标法术抗力视为降低 5，环级 +1。", { spell: 1 }],
    ["augment-summoning", "强化召唤", "施法", "召唤物力量和体质 +4。", { feats: ["spell-focus"] }],
    ["superior-summoning", "高等召唤", "施法", "多体召唤额外增加一个生物。", { feats: ["augment-summoning"] }],
    ["coordinated-defense", "协同防御", "团队", "邻近同专长盟友时 CMD +2。"],
    ["shield-wall", "盾墙", "团队", "与持盾同伴相邻时提高盾牌 AC。", { feats: ["shield-proficiency"] }],
    ["spell-chain", "法术链", "团队", "盟友成功穿透后你的穿透检定掷两次取高。"],
    ["deft-hands", "灵巧双手", "技能", "巧手与使用魔法装置 +2，技能等级达到 10 后 +4。"],
    ["intimidating-prowess", "威吓武勇", "威吓", "威吓检定额外加入力量调整值。"],
    ["stealthy", "隐秘", "技能", "灵巧与隐匿 +2，技能等级达到 10 后 +4。"]
  ].map(([id, name, category, text, req]) => ({ id, name, category, text, req, metamagic: category === "超魔" }));
  const idsAfterFirstPass = new Set(DATA.feats.map((item) => item.id));
  DATA.feats.push(...moreFeats.filter((item) => !idsAfterFirstPass.has(item.id)));
  DATA.skills.forEach((skill) => {
    const id = `skill-focus-${skill.id}`;
    if (!DATA.feats.some((feat) => feat.id === id)) DATA.feats.push({ id, name: `技能专攻：${skill.name}`, category: "技能", skillFocus: true, text: `${skill.name}检定 +3，技能等级达到 10 后 +6。` });
  });
  DATA.feats.forEach((feat) => { if (feat.category === "超魔") feat.metamagic = true; });
  const featPatch = {
    "shield-focus": { req: {} },
    "shield-bash": { req: {} },
    "tower-shield": { req: { feats: ["shield-proficiency"] } },
    "snap-shot": { req: { feats: ["point-blank-shot", "precise-shot"], bab: 6 } },
    "tandem-trip": { req: { feats: ["improved-trip"] } },
    "back-to-back": { req: { skills: { perception: 3 } } }
  };
  DATA.feats.forEach((feat) => { if (featPatch[feat.id]) Object.assign(feat, featPatch[feat.id]); });
  const moreFeats2 = [
    ["hammer-gap", "连续猛击", "战斗", "同一轮每次连续命中都会递增伤害。", { bab: 6 }],
    ["flaying-critical", "剥皮重击", "重击", "重击可叠加降低目标天生护甲。", { feats: ["critical-focus"], bab: 11 }],
    ["feint", "佯攻", "战斗", "以说服检定使目标对下一次近战攻击失去敏捷 AC。", { abilities: { int: 13 } }],
    ["final-feint", "终结佯攻", "战斗", "佯攻成功后延长目标的措手不及状态。", { feats: ["feint"], bab: 6 }],
    ["slayers-feint", "杀手佯攻", "战斗", "使用灵巧代替说服进行佯攻。", { feats: ["feint", "weapon-finesse"] }],
    ["two-weapon-feint", "双武器佯攻", "双持", "双持全攻击中放弃一次攻击进行佯攻。", { feats: ["feint", "two-weapon-fighting"], abilities: { dex: 15 }, bab: 6 }],
    ["ranged-feint", "远程佯攻", "远程", "以远程武器对近程目标进行佯攻。", { feats: ["feint", "point-blank-shot"] }],
    ["defensive-combat-training", "防御战斗训练", "战技", "计算 CMD 时以角色等级代替 BAB。"],
    ["dirty-trick", "卑鄙伎俩", "战技", "以战技让目标目盲、纠缠或恶心。", { feats: ["combat-expertise"], abilities: { int: 13 } }],
    ["greater-dirty-trick", "高等卑鄙伎俩", "战技", "卑鄙伎俩检定再 +2 且持续更久。", { feats: ["dirty-trick"], bab: 6 }],
    ["disarming-strike", "卸武打击", "战技", "近战重击确认可同时尝试卸武。", { feats: ["improved-disarm"], bab: 9 }],
    ["furys-fall", "狂怒坠落", "战技", "绊摔 CMB 额外加入敏捷调整值。", { feats: ["improved-trip"] }],
    ["agile-maneuvers", "灵巧战技", "战技", "适用战技可用敏捷代替力量计算 CMB。", { oneOf: [{ feats: ["improved-bull-rush"] }, { feats: ["dirty-trick"] }, { feats: ["improved-sunder"] }, { feats: ["improved-trip"] }] }],
    ["improved-great-fortitude", "精通强韧加强", "通用", "每天一次重掷强韧豁免。", { feats: ["great-fortitude"] }],
    ["improved-iron-will", "精通钢铁意志", "通用", "每天一次重掷意志豁免。", { feats: ["iron-will"] }],
    ["improved-lightning-reflexes", "精通闪电反射", "通用", "每天一次重掷反射豁免。", { feats: ["lightning-reflexes"] }],
    ["accomplished-sneak-attacker", "熟练偷袭者", "职业", "偷袭伤害提高 1d6，但不超过角色等级的一半。", { sneakDice: 1 }],
    ["boon-companion", "伙伴恩赐", "职业", "动物伙伴有效等级提高最多 4 级，不超过角色等级。", { classAny: ["ranger", "druid", "hunter", "paladin", "cavalier"] }],
    ["selective-channel", "选择引导", "职业", "引导能量时排除若干目标。", { abilities: { cha: 13 }, classAny: ["cleric", "oracle", "paladin", "warpriest"] }],
    ["natural-spell", "自然施法", "职业", "变形状态下仍可施放法术。", { abilities: { wis: 13 }, classAny: ["druid", "shifter"] }],
    ["lingering-performance", "余音绕梁", "职业", "演唱停止后效果再持续 2 轮。", { classAny: ["bard", "skald"] }],
    ["raging-brutality", "狂暴残虐", "职业", "狂暴且使用猛力攻击时可把体质加到伤害。", { feats: ["power-attack"], abilities: { str: 13 }, bab: 12, classAny: ["barbarian", "bloodrager"] }],
    ["wings", "羽翼", "种族", "获得羽翼：对近战攻击 +3 闪避 AC，并免疫地面效果。", { raceAny: ["aasimar"], level: 10 }],
    ["steel-soul", "钢铁灵魂", "种族", "矮人对法术与毒素的种族豁免进一步提高。", { raceAny: ["dwarf"] }],
    ["ironhide", "铁皮", "种族", "获得 +1 天生护甲。", { raceAny: ["dwarf", "half-orc"] }],
    ["razortusk", "利齿", "种族", "获得 1d4 啮咬次要攻击。", { raceAny: ["half-orc"] }],
    ["fast-learner", "快速学习", "种族", "升级时额外获得技能点或生命。", { raceAny: ["human"] }],
    ["magical-tail", "魔法尾巴", "种族", "每次选择依序获得新的每日两次类法术能力，最多八次。", { raceAny: ["kitsune"] }],
    ["vulpine-pounce", "狐跃突袭", "种族", "冲锋后可进行全攻击。", { raceAny: ["kitsune"], bab: 10 }],
    ["discerning-eye", "慧眼", "种族", "对幻术豁免与使用魔法装置获得种族加值。", { raceAny: ["elf", "half-elf"] }],
    ["improved-elven-immunities", "精通精灵免疫", "种族", "提高对附魔的豁免与附魔法术 DC。", { raceAny: ["elf", "half-elf"] }],
    ["elven-spirit", "精灵之魂", "种族", "获得精灵魔法式的法术穿透与神秘知识加值。", { raceAny: ["half-elf"] }],
    ["ironguts", "铁胃", "种族", "对毒素、恶心与反胃效果的豁免 +2。", { raceAny: ["half-orc"] }],
    ["echoes-stone", "岩石回声", "种族", "在地下提高察觉与先攻。", { raceAny: ["oread"] }],
    ["murmurs-earth", "大地低语", "种族", "感知接触地面的附近生物。", { feats: ["echoes-stone"], level: 9, raceAny: ["oread"] }],
    ["stony-step", "岩行", "种族", "提高灵巧并忽略地下困难地形。", { raceAny: ["oread"] }],
    ["blood-drinker", "饮血者", "种族", "饮血获得临时生命与强韧加值。", { raceAny: ["dhampir"] }],
    ["blood-feaster", "血宴", "种族", "饮血后额外提高伤害与运动。", { feats: ["blood-drinker"], raceAny: ["dhampir"] }],
    ["life-dominant-soul", "生命支配之魂", "种族", "正负能量都可治疗你，但治疗量减半。", { raceAny: ["dhampir"] }],
    ["natural-charmer", "天生魅惑者", "种族", "每天一次让下一次说服检定视为取 20。", { raceAny: ["dhampir"], abilities: { cha: 17 } }]
  ].map(([id, name, category, text, req]) => ({ id, name, category, text, req }));
  const idsAfterSecondPass = new Set(DATA.feats.map((item) => item.id));
  DATA.feats.push(...moreFeats2.filter((item) => !idsAfterSecondPass.has(item.id)));

  DATA.domains.push(
    domain("ice", "冰霜次领域", "冰锥：远程接触寒冷攻击", "寒冰身躯", 6),
    domain("scalykind", "鳞族次领域", "毒牙：赋予啮咬与毒素", "鳞族伙伴", 4),
    domain("undead", "亡灵次领域", "死亡之触：赋予亡灵特性", "亡者号令"),
    domain(
      "murder",
      "谋杀子域",
      "流血之触：以近战接触攻击使活物每轮受到 1d6 点伤害，持续轮数等于赋予此领域的职业等级的一半（最低 1 轮）；每日可用次数为感知调整值 +3。",
      "杀戮猛击：8 级起以自由动作为武器注入死亡之力，确认重击时造成流血伤害；伤害与持续轮数等于赋予此领域的职业等级的一半。8 级每日 1 次，此后每 4 级增加 1 次。"
    )
  );

  DATA.spellKnownTables = {
    sorc9: {
      1: [2,2,3,3,4,4,5,5,5,5,5,5,5,5,5,5,5,5,5,5],
      2: [0,0,0,1,2,2,3,3,4,4,5,5,5,5,5,5,5,5,5,5],
      3: [0,0,0,0,0,1,2,2,3,3,4,4,4,4,4,4,4,4,4,4],
      4: [0,0,0,0,0,0,0,1,2,2,3,3,4,4,4,4,4,4,4,4],
      5: [0,0,0,0,0,0,0,0,0,1,2,2,3,3,4,4,4,4,4,4],
      6: [0,0,0,0,0,0,0,0,0,0,0,1,2,2,3,3,3,3,3,3],
      7: [0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,2,3,3,3,3],
      8: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,2,3,3],
      9: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,2,3]
    },
    bard6: {
      1: [2,3,4,4,4,4,5,5,5,5,6,6,6,6,6,6,6,6,6,6],
      2: [0,0,0,2,3,4,4,4,4,5,5,5,5,6,6,6,6,6,6,6],
      3: [0,0,0,0,0,0,2,3,4,4,4,4,5,5,5,5,6,6,6,6],
      4: [0,0,0,0,0,0,0,0,0,2,3,4,4,4,4,5,5,5,5,6],
      5: [0,0,0,0,0,0,0,0,0,0,0,0,2,3,4,4,4,4,5,5],
      6: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,4,4,5]
    },
    bloodrager4: {
      1: [0,0,0,2,3,4,4,4,5,5,5,6,6,6,6,6,6,6,6,6],
      2: [0,0,0,0,0,0,2,3,4,4,4,5,5,5,6,6,6,6,6,6],
      3: [0,0,0,0,0,0,0,0,0,2,3,4,4,4,5,5,5,6,6,6],
      4: [0,0,0,0,0,0,0,0,0,0,0,0,2,3,4,4,4,5,5,5]
    }
  };
  DATA.sources = [
    { name: "GameFAQs 2026 角色创建", url: "https://gamefaqs.gamespot.com/ps4/324475-pathfinder-wrath-of-the-righteous/faqs/80843/character-creation", note: "完整出身、职业与原型总表" },
    { name: "GameFAQs 专长", url: "https://gamefaqs.gamespot.com/ps4/324475-pathfinder-wrath-of-the-righteous/faqs/80843/feats", note: "普通专长文本与前置" },
    { name: "GameFAQs 神话道途", url: "https://gamefaqs.gamespot.com/ps4/324475-pathfinder-wrath-of-the-righteous/faqs/80843/mythic-paths", note: "神话阶、合并法术书与道途索引" },
    { name: "GameFAQs 牧师领域", url: "https://gamefaqs.gamespot.com/ps4/324475-pathfinder-wrath-of-the-righteous/faqs/80843/cleric", note: "领域选择数与能力解锁等级" },
    { name: "WotR 补丁归档", url: "https://pathfinderkingmaker.fandom.com/wiki/Patch_Notes_(WotR)", note: "金龙重做与版本差异交叉校验" }
  ];
})();
