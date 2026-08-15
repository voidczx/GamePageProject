(() => {
  "use strict";

  const DATA = window.WOTR_DATA;
  if (!DATA) return;

  DATA.choiceSchema = {
    version: 3,
    status: "structure-ready-data-partial",
    stepChoice: { required: ["slotId", "source", "optionId"], optional: ["params", "subSelections"] },
    scopes: ["permanent", "restLoadout", "runtimeToggle", "derived"],
    pendingData: ["完整职业/原型槽补丁", "完整骑士团与职业能力表", "诡术师与灵使等道途能力细表", "完整武器/法术参数池"]
  };

  DATA.races.push(
    { id: "mongrel", name: "混种人", playable: false, bonus: "特殊同伴种族", text: "兰恩与雯朵格的特殊种族。" },
    { id: "succubus", name: "魅魔", playable: false, bonus: "特殊同伴种族", text: "爱露莎蕾的特殊种族。" },
    { id: "dragon", name: "龙", playable: false, bonus: "特殊同伴种族", text: "艾乌的特殊种族。" }
  );

  DATA.alignments = [
    ["LG", "守序善良"], ["NG", "中立善良"], ["CG", "混乱善良"],
    ["LN", "守序中立"], ["N", "绝对中立"], ["CN", "混乱中立"],
    ["LE", "守序邪恶"], ["NE", "中立邪恶"], ["CE", "混乱邪恶"]
  ].map(([id, name]) => ({ id, name }));

  const deity = (id, name, alignments, weapon, domains, text = "") => ({ id, name, alignments, weapon, domains, text });
  DATA.deities = [
    deity("atheism", "无神论", DATA.alignments.map((item) => item.id), "—", [], "不侍奉神祇；仍会影响部分剧情对话。"),
    deity("abadar", "阿巴达", ["LG", "LN", "N", "LE"], "轻弩", ["earth", "law", "nobility", "protection", "travel"]),
    deity("achaekek", "阿契克克", ["LN", "LE", "NE"], "锯齿剑", ["death", "evil", "law", "murder", "trickery", "war"]),
    deity("apsu", "阿普苏", ["LG", "NG", "LN"], "木棍", ["artifice", "good", "law", "scalykind", "travel"]),
    deity("asmodeus", "阿斯莫蒂斯", ["LN", "LE", "NE"], "硬头锤", ["evil", "fire", "law", "magic", "trickery"]),
    deity("calistria", "卡莉丝翠", ["CG", "N", "CN", "CE"], "细剑", ["chaos", "charm", "knowledge", "luck", "trickery"]),
    deity("cayden-cailean", "凯登·凯连", ["NG", "CG", "CN"], "细剑", ["chaos", "charm", "good", "strength", "travel"]),
    deity("dahak", "达哈克", ["CN", "NE", "CE"], "重型连枷", ["chaos", "destruction", "evil", "scalykind", "trickery"]),
    deity("desna", "黛丝娜", ["NG", "CG", "CN"], "星刃", ["chaos", "good", "liberation", "luck", "travel"]),
    deity("erastil", "埃拉斯蒂尔", ["LG", "NG", "LN"], "长弓", ["animal", "community", "good", "law", "plant"]),
    deity("godclaw", "神爪", ["LG", "LN", "LE"], "连枷", ["law", "protection", "strength", "war"]),
    deity("gorum", "格鲁姆", ["CG", "N", "CN", "CE"], "巨剑", ["chaos", "destruction", "glory", "strength", "war"]),
    deity("gozreh", "格兹莱", ["NG", "LN", "N", "CN", "NE"], "三叉戟", ["air", "animal", "plant", "water", "weather"]),
    deity("green-faith", "绿信仰", ["NG", "LN", "N", "CN", "NE"], "镰刀", ["animal", "earth", "fire", "plant", "water"]),
    deity("gyronna", "吉伦娜", ["CN", "NE", "CE"], "匕首", ["chaos", "destruction", "evil", "madness"]),
    deity("iomedae", "艾奥梅黛", ["LG", "NG", "LN"], "长剑", ["glory", "good", "law", "sun", "war"]),
    deity("irori", "伊罗里", ["LG", "LN", "N", "LE"], "徒手攻击", ["healing", "knowledge", "law", "rune", "strength"]),
    deity("lamashtu", "拉玛什图", ["CN", "NE", "CE"], "弯刃大刀、反曲刀", ["chaos", "evil", "madness", "strength", "trickery"]),
    deity("nethys", "奈瑟斯", ["NG", "LN", "N", "CN", "NE"], "木棍", ["destruction", "knowledge", "magic", "protection", "rune"]),
    deity("norgorber", "诺格柏", ["N", "LE", "NE", "CE"], "短剑", ["charm", "death", "evil", "knowledge", "trickery"]),
    deity("pharasma", "法拉斯玛", ["NG", "LN", "N", "CN", "NE"], "匕首", ["death", "healing", "ice", "knowledge", "repose", "water"]),
    deity("rovagug", "罗瓦古格", ["CN", "NE", "CE"], "巨斧", ["chaos", "destruction", "evil", "war", "weather"]),
    deity("sarenrae", "莎伦莱", ["LG", "NG", "CG", "N"], "弯刀", ["fire", "glory", "good", "healing", "sun"]),
    deity("shelyn", "谢琳", ["LG", "NG", "CG", "N"], "长柄刀", ["air", "charm", "good", "luck", "protection"]),
    deity("torag", "托拉格", ["LG", "NG", "LN"], "战锤", ["artifice", "earth", "good", "law", "protection"]),
    deity("urgathoa", "厄加图娅", ["N", "LE", "NE", "CE"], "大镰刀", ["death", "evil", "magic", "strength", "undead", "war"]),
    deity("zon-kuthon", "宗-库松", ["LN", "LE", "NE"], "连枷", ["darkness", "death", "destruction", "evil", "law"])
  ];

  const heritage = (id, raceId, name, bonus, text) => ({ id, raceId, name, bonus, text });
  DATA.heritages = [
    heritage("human-base", "human", "标准人类", "任意 +2", "一级获得额外专长，并在每级获得额外技能点。"),
    heritage("elf-base", "elf", "标准精灵", "敏捷 +2 / 智力 +2 / 体质 -2", "精灵魔法、免疫与武器熟练。"),
    heritage("elf-blightborn", "elf", "枯萎精灵", "敏捷 +2 / 智力 +2 / 体质 -2", "强化对死灵、诅咒和恶魔的抵抗。"),
    heritage("elf-loremaster", "elf", "博学精灵", "敏捷 +2 / 智力 +2 / 体质 -2", "知识（神秘）与使用魔法装置 +2。"),
    heritage("dwarf-base", "dwarf", "标准矮人", "体质 +2 / 感知 +2 / 魅力 -2", "坚韧、稳定与矮人武器熟练。"),
    heritage("dwarf-barrow", "dwarf", "古冢矮人", "体质 +2 / 感知 +2 / 魅力 -2", "对亡灵的攻击与防御提高。"),
    heritage("dwarf-unstoppable", "dwarf", "不可阻挡矮人", "体质 +2 / 感知 +2 / 魅力 -2", "获得耐力与强韧豁免加值。"),
    heritage("gnome-base", "gnome", "标准侏儒", "体质 +2 / 魅力 +2 / 力量 -2", "强化幻术与知识（世界）。"),
    heritage("gnome-pyromaniac", "gnome", "纵火狂", "体质 +2 / 魅力 +2 / 力量 -2", "火焰抗性 5，火焰法术 DC +1。"),
    heritage("gnome-traveler", "gnome", "旅行侏儒", "体质 +2 / 魅力 +2 / 力量 -2", "基础速度 30 尺，自然学识 +2。"),
    heritage("halfling-base", "halfling", "标准半身人", "敏捷 +2 / 魅力 +2 / 力量 -2", "幸运、无畏与脚步稳健。"),
    heritage("halfling-hasty", "halfling", "急性半身人", "敏捷 +2 / 魅力 +2 / 力量 -2", "以部分防御换取更高基础速度。"),
    heritage("half-elf-base", "half-elf", "标准半精灵", "任意 +2", "一级额外选择一个技能专攻。"),
    heritage("half-elf-dual", "half-elf", "双重血统", "任意 +2", "以适应性换取精灵魔法与意志加值。"),
    heritage("half-elf-kindred", "half-elf", "亲族养育", "任意 +2 / 魅力额外 +2", "获得额外魅力加值。"),
    heritage("half-orc-base", "half-orc", "标准半兽人", "任意 +2", "兽人武器熟练、凶猛与威吓加值。"),
    heritage("aasimar-base", "aasimar", "标准阿斯莫", "感知 +2 / 魅力 +2", "天界抗性与灼热射线。"),
    heritage("aasimar-angelkin", "aasimar", "天使裔", "力量 +2 / 魅力 +2", "宗教与使用魔法装置 +2。"),
    heritage("aasimar-emberkin", "aasimar", "火裔", "智力 +2 / 魅力 +2", "宗教与神秘知识 +2。"),
    heritage("aasimar-idyllkin", "aasimar", "祥和裔", "体质 +2 / 魅力 +2", "自然与察觉 +2。"),
    heritage("aasimar-lawbringer", "aasimar", "执法裔", "体质 +2 / 感知 +2", "说服与察觉 +2。"),
    heritage("aasimar-musetouched", "aasimar", "缪斯裔", "敏捷 +2 / 魅力 +2", "说服与灵巧 +2。"),
    heritage("aasimar-plumekith", "aasimar", "羽裔", "敏捷 +2 / 感知 +2", "运动与灵巧 +2。"),
    heritage("tiefling-base", "tiefling", "标准提夫林", "敏捷 +2 / 智力 +2 / 魅力 -2", "炼狱抗性与能量抵抗。"),
    ...[
      ["beastbrood", "兽裔", "敏捷 +2 / 魅力 +2 / 感知 -2"], ["faultspawn", "罪裔", "敏捷 +2 / 感知 +2 / 智力 -2"],
      ["foulspawn", "秽裔", "体质 +2 / 感知 +2 / 智力 -2"], ["grimspawn", "灾裔", "敏捷 +2 / 智力 +2 / 感知 -2"],
      ["hellspawn", "狱裔", "体质 +2 / 感知 +2 / 魅力 -2"], ["hungerseed", "饥渴裔", "力量 +2 / 感知 +2 / 魅力 -2"],
      ["motherless", "无母裔", "力量 +2 / 感知 +2 / 智力 -2"], ["pitborn", "深渊裔", "力量 +2 / 魅力 +2 / 智力 -2"],
      ["shackleborn", "缚裔", "体质 +2 / 魅力 +2 / 感知 -2"], ["spitespawn", "怨裔", "敏捷 +2 / 魅力 +2 / 智力 -2"]
    ].map(([id, name, bonus]) => heritage(`tiefling-${id}`, "tiefling", name, bonus, "提夫林血统变体；改变属性、技能与每日类法术能力。")),
    heritage("oread-base", "oread", "标准土源裔", "力量 +2 / 感知 +2 / 魅力 -2", "强酸抗性与石拳。"),
    heritage("oread-gemsoul", "oread", "宝石魂", "力量 +2 / 感知 +2 / 魅力 -2", "获得七彩喷射。"),
    heritage("oread-ironsoul", "oread", "铁魂", "力量 +2 / 感知 +2 / 魅力 -2", "获得铅刃术。"),
    heritage("dhampir-base", "dhampir", "标准吸血鬼裔", "敏捷 +2 / 魅力 +2 / 体质 -2", "负能量亲和与吸血鬼抗性。"),
    ...[
      ["ru-shi", "如实裔", "力量 +2 / 智力 +2 / 敏捷 -2"], ["svetocher", "斯维托切裔", "力量 +2 / 魅力 +2 / 体质 -2"],
      ["ancient-born", "古裔", "力量 +2 / 感知 +2 / 体质 -2"], ["sacred-ancestry", "圣裔", "力量 +2 / 智力 +2 / 敏捷 -2"],
      ["ajibachana", "阿吉巴查纳裔", "敏捷 +2 / 智力 +2 / 感知 -2"]
    ].map(([id, name, bonus]) => heritage(`dhampir-${id}`, "dhampir", name, bonus, "吸血鬼血统变体；改变属性与种族技能。")),
    heritage("kitsune-base", "kitsune", "标准狐妖", "敏捷 +2 / 魅力 +2 / 力量 -2", "狐妖魔法与变形。"),
    heritage("kitsune-keen", "kitsune", "机敏狐妖", "敏捷 +2 / 智力 +2 / 力量 -2", "以智力替代魅力的狐妖血统。")
  ];

  DATA.choiceParameterTypes = {
    weapon: { name: "武器", options: [["unarmed", "徒手攻击"], ["dagger", "匕首"], ["shortsword", "短剑"], ["longsword", "长剑"], ["rapier", "细剑"], ["dueling-sword", "决斗剑"], ["scimitar", "弯刀"], ["falchion", "反曲刀"], ["greatsword", "巨剑"], ["glaive", "长柄刀"], ["longspear", "长矛"], ["warhammer", "战锤"], ["greataxe", "巨斧"], ["handaxe", "手斧"], ["light-crossbow", "轻弩"], ["heavy-crossbow", "重弩"], ["shortbow", "短弓"], ["longbow", "长弓"], ["starknife", "星刃"]].map(([id, name]) => ({ id, name })) },
    spellSchool: { name: "法术学派", options: [["abjuration", "防护"], ["conjuration", "咒法"], ["divination", "预言"], ["enchantment", "附魔"], ["evocation", "塑能"], ["illusion", "幻术"], ["necromancy", "死灵"], ["transmutation", "变化"]].map(([id, name]) => ({ id, name })) },
    energy: { name: "能量类型", options: [["acid", "强酸"], ["cold", "寒冷"], ["electricity", "电击"], ["fire", "火焰"], ["sonic", "音波"]].map(([id, name]) => ({ id, name })) },
    armor: { name: "护甲类别", options: [["light", "轻甲"], ["medium", "中甲"], ["heavy", "重甲"]].map(([id, name]) => ({ id, name })) },
    savingThrow: { name: "豁免", options: [["fort", "强韧"], ["ref", "反射"], ["will", "意志"]].map(([id, name]) => ({ id, name })) },
    element: { name: "元素", options: [["air", "气"], ["earth", "土"], ["fire", "火"], ["water", "水"]].map(([id, name]) => ({ id, name })) },
    animalCompanion: { name: "动物伙伴", options: [["horse", "马"], ["dog", "狗"], ["wolf", "狼"], ["leopard", "豹"], ["monitor-lizard", "蜥蜴"], ["triceratops", "三角龙"], ["velociraptor", "迅猛龙"], ["boar", "野猪"], ["mastodon", "乳齿象"]].map(([id, name]) => ({ id, name })) },
    domain: { name: "领域", options: DATA.domains.map((item) => ({ id: item.id, name: item.name })) },
    spirit: { name: "精魂", options: ["战斗", "骨", "火焰", "寒霜", "生命", "自然", "石", "波涛", "风"].map((name) => ({ id: name, name })) },
    spell: { name: "法术", options: DATA.spells.map((item) => ({ id: item.id, name: `${item.name}（${item.level} 环）` })) },
    mythicAbility: { name: "嵌套神话能力", options: DATA.mythic.filter((item) => item.type === "ability" && item.id !== "extra-mythic-ability").map((item) => ({ id: item.id, name: item.name })) }
  };
  DATA.choiceParameterTypes.rank = { name: "取得次数", options: Array.from({ length: 8 }, (_, index) => ({ id: String(index + 1), name: `第 ${index + 1} 次` })) };

  const annotate = (collection, ids, parameterType, matchFrom = null) => ids.forEach((id) => {
    const item = collection.find((entry) => entry.id === id);
    if (item) item.parameter = { type: parameterType, required: true, matchFrom };
  });
  annotate(DATA.feats, ["weapon-focus", "improved-critical"], "weapon");
  annotate(DATA.feats, ["weapon-specialization", "point-blank-master", "fencing-grace", "slashing-grace"], "weapon", "weapon-focus");
  annotate(DATA.feats, ["greater-weapon-focus"], "weapon", "weapon-focus");
  annotate(DATA.feats, ["greater-weapon-specialization"], "weapon", "weapon-specialization");
  annotate(DATA.feats, ["spell-focus"], "spellSchool");
  annotate(DATA.feats, ["greater-spell-focus"], "spellSchool", "spell-focus");
  annotate(DATA.feats, ["elemental-focus"], "energy");
  annotate(DATA.feats, ["greater-elemental-focus"], "energy", "elemental-focus");
  annotate(DATA.feats, ["elemental-fist"], "energy");
  annotate(DATA.feats, ["armor-focus"], "armor");
  annotate(DATA.feats, ["spell-specialization"], "spell");
  annotate(DATA.feats, ["magical-tail"], "rank");
  annotate(DATA.mythic, ["ascendant-element"], "energy");
  annotate(DATA.mythic, ["second-spirit"], "spirit");
  annotate(DATA.mythic, ["impossible-domain"], "domain");
  annotate(DATA.mythic, ["mythic-improved-critical"], "weapon", "improved-critical");
  annotate(DATA.mythic, ["mythic-spell-focus"], "spellSchool", "spell-focus");
  const extraMythicAbility = DATA.mythic.find((item) => item.id === "extra-mythic-ability");
  if (extraMythicAbility) extraMythicAbility.parameter = { type: "mythicAbility", required: true, nested: true };

  DATA.featureGroups = {
    cavalierOrder: {
      name: "骑士团",
      options: [
        { id: "cockatrice", name: "鸡蛇骑士团", text: "以夸耀和恐惧削弱敌人。", grants: [[2, "夸耀者 / 炫目武技"], [8, "窃取荣耀"], [15, "胜利时刻"]] },
        { id: "lion", name: "雄狮骑士团", text: "以领主与同袍为核心的团队支援。", grants: [[2, "雄狮之召"], [8, "为了国王"], [15, "领主之盾"]] },
        { id: "shroud", name: "裹尸布骑士团", text: "专精对抗亡灵。", grants: [[2, "灵性护盾"], [8, "亡灵毁灭者"], [15, "对抗黑暗"]] },
        { id: "star", name: "星辰骑士团", text: "以信仰强化挑战和盟友。", grants: [[2, "召唤"], [8, "为了信仰"], [15, "报偿"]] },
        { id: "sword", name: "宝剑骑士团", text: "专注骑乘冲锋与骑士荣誉。", grants: [[2, "以我之荣誉"], [8, "骑乘精通"], [15, "骑士挑战"]] }
      ]
    },
    bloodline: { name: "血脉", options: ["天界", "深渊", "奥术", "龙族", "元素", "妖精", "炼狱", "亡灵"].map((name) => ({ id: name, name, text: `${name}血脉；后续按职业等级自动解锁血脉能力。` })) },
    mystery: { name: "谜团", options: ["先祖", "战斗", "烈焰", "生命", "自然", "石", "波涛", "风"].map((name) => ({ id: name, name, text: `${name}谜团；解锁对应启示和奖励法术。` })) },
    curse: { name: "先知诅咒", options: ["跛足", "纠缠", "狼疤脸", "无力", "被迫沉默"].map((name) => ({ id: name, name, text: `${name}诅咒；同时提供代价与分级收益。` })) },
    spirit: { name: "精魂", options: ["战斗", "骨", "火焰", "寒霜", "生命", "自然", "石", "波涛", "风"].map((name) => ({ id: name, name, text: `${name}精魂；提供精魂能力、巫术和法术。` })) },
    patron: { name: "庇护主", options: ["欺诈", "元素", "治愈", "诅咒", "力量", "敏捷", "冬"].map((name) => ({ id: name, name, text: `${name}庇护主；按等级授予额外法术。` })) },
    wizardSchool: { name: "奥术学派", options: ["通才", "防护", "咒法", "预言", "附魔", "塑能", "幻术", "死灵", "变化"].map((name) => ({ id: name, name, text: `${name}学派专精。` })) },
    ragePower: { name: "狂暴特技", options: ["野兽之怒", "致命姿态", "防御姿态", "鲁莽姿态", "迷信", "迅捷步伐", "低等野兽图腾", "野兽图腾", "高等野兽图腾"].map((name) => ({ id: name, name, text: `${name}；狂暴期间生效。` })) },
    classTalent: { name: "职业天赋", options: ["战斗诡计", "弱化之创", "机会主义者", "迅捷隐匿", "技能专精", "熟练偷袭者"].map((name) => ({ id: name, name, text: `${name}；由游荡者或杀手天赋槽取得。` })) },
    arcanistExploit: { name: "奥法技艺", options: ["强能魔法", "次元滑步", "熟悉法术", "魔法吞噬", "奥术屏障", "法术抵抗"].map((name) => ({ id: name, name, text: `${name}奥法技艺。` })) },
    magusArcana: { name: "魔战士奥秘", options: ["奥法精准", "持久刀锋", "次元斩", "法术克敌", "虔诚刀锋", "幽灵刀锋"].map((name) => ({ id: name, name, text: `${name}魔战士奥秘。` })) },
    hex: { name: "巫术", options: ["邪眼", "祈福", "灾厄", "沉睡", "保护幸运", "冰霜植物", "空气屏障", "治疗"].map((name) => ({ id: name, name, text: `${name}巫术。` })) }
  };

  DATA.classFeatureRules = [
    { classId: "cavalier", levels: [1], groupId: "cavalierOrder", label: "选择骑士团" },
    { classId: "bloodrager", levels: [1], groupId: "bloodline", label: "选择血怒者血脉" },
    { classId: "sorcerer", levels: [1], groupId: "bloodline", label: "选择术士血脉" },
    { classId: "oracle", levels: [1], groupId: "mystery", label: "选择先知谜团" },
    { classId: "oracle", levels: [1], groupId: "curse", label: "选择先知诅咒" },
    { classId: "shaman", levels: [1], groupId: "spirit", label: "选择萨满精魂" },
    { classId: "witch", levels: [1], groupId: "patron", label: "选择巫师庇护主" },
    { classId: "wizard", levels: [1], groupId: "wizardSchool", label: "选择奥术学派" },
    { classId: "barbarian", levels: [2,4,6,8,10,12,14,16,18,20], groupId: "ragePower", label: "选择狂暴特技" },
    { classId: "skald", levels: [3,6,9,12,15,18], groupId: "ragePower", label: "选择歌者狂暴特技" },
    { classId: "rogue", levels: [2,4,6,8,10,12,14,16,18,20], groupId: "classTalent", label: "选择游荡者天赋" },
    { classId: "slayer", levels: [2,4,6,8,10,12,14,16,18,20], groupId: "classTalent", label: "选择杀手天赋" },
    { classId: "arcanist", levels: [1,3,5,7,9,11,13,15,17,19], groupId: "arcanistExploit", label: "选择奥法技艺" },
    { classId: "magus", levels: [3,6,9,12,15,18], groupId: "magusArcana", label: "选择魔战士奥秘" },
    { classId: "witch", levels: [1,2,4,6,8,10,12,14,16,18,20], groupId: "hex", label: "选择巫术" },
    { classId: "shaman", levels: [2,4,6,8,10,12,14,16,18,20], groupId: "hex", label: "选择萨满巫术" }
  ];

  ["cleric", "inquisitor", "warpriest", "paladin"].forEach((id) => {
    const entry = DATA.classes.find((item) => item.id === id);
    if (entry) entry.req = { ...(entry.req || {}), faithRequired: true };
  });
  const shifter = DATA.classes.find((item) => item.id === "shifter");
  if (shifter) shifter.req = { ...(shifter.req || {}), alignmentDruid: true };
  const reformedFiend = DATA.archetypes?.find((item) => item.baseClass === "bloodrager" && item.id === "reformed-fiend");
  if (reformedFiend) reformedFiend.req = { raceAny: ["tiefling"] };

  const archetypeNames = {
    "Chirurgeon":"外科医师", "Grenadier":"掷弹兵", "Incense Synthesizer":"熏香合成师", "Metamorph":"变形师", "Preservationist":"保存专家", "Reanimator":"复苏师", "Vivisectionist":"活体解剖师",
    "Brown-Fur Transmuter":"棕毛变化师", "Eldritch Font":"异能源泉", "Magic Deceiver":"魔法欺诈师", "Nature Mage":"自然法师", "Phantasmal Mage":"幻灵法师", "Unlettered Arcanist":"无文奥能师", "White Mage":"白法师",
    "Armored Hulk":"重甲巨汉", "Beastskin Berserker":"兽皮狂战士", "Flesheater":"食肉者", "Instinctual Warrior":"本能战士", "Invulnerable Rager":"无敌狂暴者", "Mad Dog":"疯狗", "Pack Rager":"兽群狂暴者",
    "Archaeologist":"考古学家", "Beast Tamer":"驯兽师", "Chelaxian Diva":"切利亚克斯歌姬", "Dirge Bard":"挽歌诗人", "Flame Dancer":"火焰舞者", "Thundercaller":"雷霆召唤者", "Tranquil Whisperer":"宁静低语者",
    "Bloodrider":"血骑士", "Greenrager":"绿怒者", "Hag-Riven":"鬼婆撕裂者", "Mixed-Blood Rager":"混血狂怒者", "Primalist":"原始血怒者", "Reformed Fiend":"改邪恶魔", "Spelleater":"噬法者", "Steelblood":"钢血者",
    "Beast Rider":"驭兽骑士", "Cavalier of the Paw":"兽爪骑士", "Disciple of the Pike":"长枪门徒", "Fearsome Leader":"恐怖领袖", "Gendarme":"宪骑兵", "Ghost Rider":"幽灵骑士", "Knight of the Wall":"壁垒骑士", "Standard Bearer":"掌旗官",
    "Angelfire Apostle":"天使之火使徒", "Crusader":"十字军", "Demonbane Priest":"灭魔祭司", "Ecclesitheurge":"教会学者", "Herald Caller":"使徒召唤师", "Priest of Balance":"平衡祭司", "Separatist":"分离主义者",
    "Blight Druid":"枯萎德鲁伊", "Defender of the True World":"真世界守卫", "Drovier":"兽群德鲁伊", "Elemental Rampager":"元素暴徒", "Feyspeaker":"妖精语者", "Primal Druid":"原始德鲁伊", "Winter Child":"寒冬之子",
    "Aldori Defender":"阿尔多瑞防卫者", "Armiger":"扈从骑士", "Defender of the Hearth":"炉膛守卫", "Dragonheir Scion":"龙裔传人", "Mutation Warrior":"突变战士", "Titan Fighter":"泰坦战士", "Tower Shield Specialist":"塔盾专家", "Two-Handed Fighter":"双手武器战士",
    "Colluding Scoundrel":"共谋恶棍", "Divine Hound":"神圣猎犬", "Divine Hunter":"神圣猎人", "Forester":"护林人", "Tandem Executioner":"协同处刑者", "Urban Hunter":"都市猎人", "Wandering Marksman":"流浪神射手",
    "Faith Hunter":"信仰猎手", "Judge":"裁决者", "Living Grimoire":"活圣典", "Monster Tactician":"怪物战术家", "Sacred Huntsmaster":"神圣猎手大师", "Sanctified Slayer":"圣化杀手", "Tactical Leader":"战术领袖",
    "Blood Kineticist":"血念师", "Dark Elementalist":"黑暗元素使", "Elemental Engine":"元素引擎", "Kinetic Knight":"念力骑士", "Kinetic Sharpshooter":"念力神射手", "Overwhelming Soul":"压倒灵魂", "Psychokineticist":"心念使",
    "Arcane Rider":"奥法骑手", "Armored Battlemage":"重甲战法师", "Bladebound":"缚刃者", "Eldritch Archer":"异能射手", "Eldritch Scion":"异能后裔", "Hexcrafter":"咒法剑士", "Spell Dancer":"法术舞者", "Sword Saint":"剑圣",
    "Drunken Master":"醉拳大师", "Quarterstaff Master":"棍法大师", "Scaled Fist":"鳞甲之拳", "Sensei":"师范", "Sohei":"僧兵", "Student of Stone":"磐石门徒", "Traditional Monk":"传统武僧", "Zen Archer":"禅宗射手",
    "Divine Herbalist":"神圣草药师", "Dual-Cursed Oracle":"双重诅咒先知", "Enlightened Philosopher":"启蒙哲人", "Lone Strider":"独行者", "Possessed Oracle":"附身先知", "Purifier":"净化者", "Seeker":"探求者", "Wind Whisperer":"风语者",
    "Divine Guardian":"神圣守卫", "Divine Scion":"神圣后裔", "Hospitaler":"救护骑士", "Martyr":"殉道者", "Stonelord":"磐石领主", "Tortured Crusader":"苦痛十字军", "Warrior of the Holy Light":"圣光战士",
    "Demonslayer":"灭魔游侠", "Espionage Expert":"谍报专家", "Flamewarden":"火焰守望者", "Freebooter":"自由掠夺者", "Nomad":"游牧民", "Sable Company Marine":"黑貂连陆战队员", "Stormwalker":"风暴行者",
    "Dark Lurker":"暗影潜伏者", "Eldritch Scoundrel":"异能恶棍", "Knife Master":"刀锋大师", "Master of All":"万事通", "Rowdy":"暴徒", "Sylvan Trickster":"林地诡术师", "Thug":"恶霸", "Underground Chemist":"地下化学家",
    "Possessed Shaman":"附身萨满", "Prophet of Pestilence":"瘟疫先知", "Shadow Shaman":"暗影萨满", "Spirit Hunter":"精魂猎手", "Spirit Warden":"精魂守卫", "Unsworn Shaman":"无誓萨满", "Wildland Shaman":"荒野萨满", "Witch Doctor":"巫医",
    "Child of the Manticore":"蝎尾狮之子", "Dragonblood Shifter":"龙血化形师", "Feyform Shifter":"妖精形态师", "Fiendflesh Shifter":"魔裔化形师", "Rageshaper":"狂怒化形师", "Weretouched":"兽化裔", "Wild Effigy":"荒野塑像", "Griffonheart Shifter":"狮鹫之心化形师",
    "Battle Scion":"战斗传人", "Battle Singer":"战歌者", "Court Poet":"宫廷诗人", "Demon Dancer":"恶魔舞者", "Herald of the Horn":"号角使者", "Hunt Caller":"狩猎召唤者", "Inciter":"煽动者",
    "Arcane Enforcer":"奥法执行者", "Bloodseeker":"寻血者", "Deliverer":"送葬者", "Executioner":"处刑者", "Imitator":"模仿者", "Spawn Slayer":"异怪杀手", "Stygian Slayer":"冥河杀手", "Vanguard":"先锋",
    "Crossblooded":"混血术士", "Empyreal Sorcerer":"天界术士", "Geomancer":"地脉术士", "Nine Tailed Heir":"九尾传人", "Overwhelming Mage":"压倒性法师", "Sage Sorcerer":"贤者术士", "Sylvan Sorcerer":"林地术士",
    "Champion of the Faith":"信仰勇士", "Cult Leader":"教派领袖", "Disenchanter":"破魔祭司", "Feral Champion":"野性勇士", "Mantis Zealot":"螳螂狂信徒", "Proclaimer":"宣告者", "Shieldbearer":"持盾者",
    "Elemental Witch":"元素巫师", "Hag of Gyronna":"吉伦娜鬼婆", "Hagbound":"鬼婆缚身者", "Hex Channeler":"巫术引导者", "Keen-Eyed Adventurer":"锐眼冒险家", "Ley Line Guardian":"魔网守卫", "Stigmatized Witch":"受创巫师", "Witch of the Veil":"帷幕巫师",
    "Arcane Bomber":"奥法炸弹客", "Cruoromancer":"血法师", "Elemental Specialist":"元素专家", "Exploiter Wizard":"技艺法师", "Scroll Savant":"卷轴专家", "Shadowcaster":"影法师", "Spell Master":"法术大师", "Thassilonian Specialist":"塔西隆专家"
  };
  DATA.archetypes.forEach((entry) => {
    entry.nameEn = entry.name;
    entry.name = archetypeNames[entry.name] || `${DATA.classes.find((item) => item.id === entry.baseClass)?.name || "职业"}原型`;
  });
})();
