(() => {
  "use strict";

  const DATA = window.WOTR_DATA;
  const abilities = [];
  const add = (path, group, id, name, text, extra = {}) => abilities.push({ path, group, id, name, text, ...extra });

  [
    ["abolish-disease", "根除疾病", "天使之剑命中可根除疾病并对患病敌人造成额外神圣伤害。"],
    ["abolish-guile", "根除诡诈", "天使之剑对受心智效果影响的敌人造成额外神圣伤害，并协助移除魅惑与强迫。"],
    ["abolish-poison", "根除毒素", "天使之剑根除毒素并对中毒敌人追加神圣伤害。"],
    ["abolish-undeath", "根除不死", "天使之剑对亡灵造成额外神圣伤害并强化驱散。"],
    ["bestow-divine", "赐予神圣", "可把天使之剑的部分增益赐予盟友；是天军降临的前置。"],
    ["everlasting-flame", "不灭圣火", "延长天使之剑持续时间。"],
    ["grand-blessing", "宏大祝福", "强化天使之剑的武器加值与伤害骰。"],
    ["guide-faithful", "引导信徒", "天使之剑协助盟友命中被标记的敌人。"]
  ].forEach(([id, name, text]) => add("angel", "angel-sword", id, name, text));
  [
    ["blinding-light", "致盲圣光", "光环中的敌人可能被圣光致盲。"], ["burning-bright", "炽烈光辉", "光环周期性灼烧附近邪恶敌人。"],
    ["flame-life", "生命之焰", "光环保护盟友免受负能量与死亡效果。"], ["piercing-rays", "穿透光线", "降低光环内敌人的法术抗力与豁免。"],
    ["solar-winds", "太阳风", "光环对远程攻击和元素伤害提供防护。"], ["unfailing-beacon", "不灭信标", "盟友法术波及天使时不伤害天使并反向强化施法者。"]
  ].forEach(([id, name, text]) => add("angel", "angel-halo", id, name, text));
  add("angel", "angel-greater-sword", "heavenly-host", "天军降临", "把天使之剑赐予全队。", { requires: ["bestow-divine"] });
  add("angel", "angel-greater-sword", "overwhelming-flames", "压倒圣焰", "天使之剑使攻击穿透更多抗性与减伤。");
  add("angel", "angel-greater-sword", "speed-light", "光之迅捷", "天使之剑提供加速与额外施法行动效率。");

  [
    ["deadly-magic", "致命魔法", "暂时让法术忽略法术抗力与法术免疫，并阻断目标施法。"], ["death-elements", "元素之死", "把元素法术伤害转为负能量。"],
    ["death-rush", "死亡突袭", "冲锋、战技或重击造成额外负能量伤害。"], ["decaying-touch", "腐朽之触", "天生与接触攻击附加腐朽伤害。"],
    ["eclipse-chill", "蚀骨寒意", "法术可附加寒冷与易伤标记。"], ["fear-control", "恐惧支配", "强化对恐惧目标的攻击并获得恐惧免疫。"],
    ["indestructible-bones", "不坏之骨", "获得可成长的伤害减免。"], ["magic-devourer", "魔法吞噬者", "获得法术抗力，抵抗法术后加速下一次施法。"],
    ["negative-mastery", "负能量精通", "提高负能量与亡灵相关能力的伤害。"], ["tainted-sneak", "污秽偷袭", "获得偷袭并让偷袭降低目标属性。"],
    ["undead-mount", "亡灵坐骑", "把坐骑转化为亡灵并强化其防御。"], ["weapon-death", "死亡武器", "武器附加负能量与属性伤害。"],
    ["withering-life", "凋零生命", "伤害法术同时削减对应精神或肉体属性。"]
  ].forEach(([id, name, text]) => add("lich", "lich-power", id, name, text));
  [["marksman", "神射骷髅"], ["assassin", "刺客骷髅"], ["vanguard", "先锋骷髅"], ["executioner", "处刑骷髅"]]
    .forEach(([id, name]) => add("lich", "lich-skeleton", `skeleton-${id}`, name, "决定骷髅勇士的基础战斗模板。"));
  [["barbarian", "野蛮人升级"], ["bard", "吟游诗人升级"], ["cleric", "牧师升级"], ["fighter", "战士升级"], ["inquisitor", "审判者升级"], ["magus", "魔战士升级"]]
    .forEach(([id, name]) => add("lich", "lich-skeleton-upgrade", `skeleton-upgrade-${id}`, name, "为骷髅勇士叠加该职业模板；同一升级不可重复。"));

  [["babau", "巴布魔相"], ["brimorak", "火刑魔相"], ["incubus", "淫梦魔相"], ["kalavakus", "卡拉瓦库斯魔相"], ["nabasu", "纳巴苏魔相"], ["schir", "席尔魔相"], ["succubus", "魅魔魔相"], ["vrock", "弗洛魔相"]]
    .forEach(([id, name]) => add("demon", "demon-minor", id, name, "恶魔狂暴期间提供对应恶魔的小魔相被动与主动修正。"));
  [["balor", "巴洛炎魔魔相"], ["coloxus", "科洛克斯魔相"], ["omox", "奥摩克斯魔相"], ["shadow-demon", "影魔魔相"], ["vavakia", "瓦瓦基亚魔相"], ["vrolikai", "弗洛里凯魔相"]]
    .forEach(([id, name]) => add("demon", "demon-major", id, name, "恶魔狂暴时可激活的高等魔相，提供强力属性与战斗规则改写。"));
  [["areshkagal", "阿瑞什卡高魔相"], ["deskari", "德斯卡瑞魔相"], ["kabriri", "卡布利里魔相"], ["nocticula", "诺缇库拉魔相"], ["pazuzu", "帕祖祖魔相"], ["socothbenoth", "索科斯贝诺斯魔相"]]
    .forEach(([id, name]) => add("demon", "demon-lord", id, name, "恶魔领主魔相；神话 9—10 阶的终局选择。"));

  [
    ["all-skilled", "全才", "所有技能视为本职技能，并可使用更多武器与装备。"], ["favorable-magic", "超卓魔法", "敌人对你的法术豁免掷两次取低，你的穿透检定掷两次取高。"],
    ["incredible-might", "惊世威能", "攻击与战技获得神话阶加值，重击可施加控制。"], ["life-bonding", "生命联结友谊", "与队友共享团队专长，并在伙伴仍战斗时延缓死亡。"],
    ["marvelous-endurance", "奇迹耐力", "大幅提高恢复、减伤与生存能力。"], ["supersonic-speed", "超音速", "获得永久加速、闪避与远程失手防护。"],
    ["zippy-magic", "灵动魔法", "单体法术会复制到第二目标并追加伤害。"]
  ].forEach(([id, name, text]) => add("azata", "azata-superpower", id, name, text));

  const tricks = [["athletics", "运动"], ["mobility", "灵巧"], ["trickery", "巧手"], ["stealth", "隐匿"], ["arcana", "知识（神秘）"], ["world", "知识（世界）"], ["nature", "学识（自然）"], ["religion", "学识（宗教）"], ["perception", "察觉"], ["persuasion", "说服"], ["umd", "使用魔法装置"]];
  tricks.forEach(([skill, name]) => {
    add("trickster", "trick-rank-1", `trick-${skill}-1`, `${name}神话诡计 I`, `以神话规则强化${name}技能。`);
    add("trickster", "trick-rank-2", `trick-${skill}-2`, `${name}神话诡计 II`, `把${name}诡计提升至第二阶。`, { requires: [`trick-${skill}-1`] });
    add("trickster", "trick-rank-3", `trick-${skill}-3`, `${name}神话诡计 III`, `把${name}诡计提升至第三阶。`, { requires: [`trick-${skill}-2`] });
  });

  [
    ["attack", "攻击凝视", 3], ["aao", "借机攻击凝视", 3], ["caster-level", "施法者等级凝视", 3], ["maneuvers", "战技凝视", 3],
    ["damage", "伤害凝视", 3], ["dr", "伤害减免凝视", 3], ["energy-shield", "能量护盾凝视", 3], ["save-dc", "豁免 DC 凝视", 3],
    ["area", "范围效果凝视", 5], ["concentration", "专注凝视", 5], ["hit-points", "生命值凝视", 5], ["normalize-size", "体型归一凝视", 5],
    ["power-law", "律法之力凝视", 5], ["primordial", "原初魔法凝视", 5], ["relativity", "空间相对凝视", 5], ["summoner", "召唤者凝视", 5], ["temporal-jump", "时间跳跃凝视", 8]
  ].forEach(([id, name, minRank]) => add("aeon", "aeon-gaze", id, name, "御衡者凝视同时强化盟友并削弱敌人的对应数值。", { minRank }));

  [["disrupting", "扰乱吐息"], ["empowered", "强效吐息"], ["mind-clearing", "净心吐息"], ["overwhelming", "压倒吐息"], ["scorching", "灼烧吐息"], ["spellbane", "破法吐息"]]
    .forEach(([id, name]) => add("gold-dragon", "dragon-breath", id, name, "强化金龙吐息；同一强化不可重复。"));
  [["enlightening", "启迪吐息"], ["rejuvenating", "复苏吐息"], ["annihilating", "湮灭吐息"], ["decaying", "腐化吐息"]]
    .forEach(([id, name]) => add("gold-dragon", "dragon-breath", id, name, "神话 9 阶路线限定的金龙吐息强化。", { minRank: 9 }));

  DATA.pathAbilities = abilities;
  DATA.mythicPathRules = {
    angel: { entryRank: 3, kind: "early", grants: ["天使之剑", "天使光环", "天使法术书（可与完整神术书合并）"], steps: { 4: [["angel-sword", 1]], 5: [["angel-halo", 1]], 6: [["angel-sword", 1]], 7: [["angel-halo", 1]], 8: [["angel-greater-sword", 1]], 9: [["angel-halo", 1]], 10: [["angel-greater-sword", 1]] } },
    lich: { entryRank: 3, kind: "early", grants: ["巫妖法术书（可与完整奥术书合并）", "负能量亲和", "骷髅勇士"], steps: { 3: [["lich-power", 1], ["lich-skeleton", 1]], 4: [["lich-skeleton-upgrade", 1]], 6: [["lich-power", 1]], 8: [["lich-skeleton-upgrade", 1]], 9: [["lich-power", 1]], 10: [["lich-skeleton-upgrade", 1]] } },
    demon: { entryRank: 3, kind: "early", grants: ["恶魔狂暴", "基础恶魔魔相", "恶魔法术书"], steps: { 4: [["demon-minor", 1]], 5: [["demon-minor", 1], ["demon-major", 2]], 6: [["demon-minor", 1]], 7: [["demon-minor", 1], ["demon-major", 1]], 8: [["demon-minor", 1]], 9: [["demon-minor", 1], ["demon-lord", 1]], 10: [["demon-minor", 1], ["demon-lord", 1]] } },
    azata: { entryRank: 3, kind: "early", grants: ["艾乌加入", "灵使法术书", "振奋之歌"], steps: { 4: [["azata-superpower", 1]], 6: [["azata-superpower", 1]], 8: [["azata-superpower", 1]], 10: [["azata-superpower", 1]] } },
    trickster: { entryRank: 3, kind: "early", grants: ["神话诡计系统", "诡术师法术书"], steps: { 3: [["trick-rank-1", 1]], 4: [["trick-rank-1", 1], ["trick-rank-2", 1]], 5: [["trick-rank-1", 1]], 6: [["trick-rank-1", 1], ["trick-rank-2", 1]], 7: [["trick-rank-1", 1], ["trick-rank-3", 1]], 8: [["trick-rank-1", 1], ["trick-rank-2", 1]], 9: [["trick-rank-1", 1], ["trick-rank-2", 1]], 10: [["trick-rank-1", 1], ["trick-rank-3", 1]] } },
    aeon: { entryRank: 3, kind: "early", grants: ["御衡者克星", "御衡者法术书", "现实修正"], steps: Object.fromEntries(Array.from({ length: 8 }, (_, index) => [index + 3, [["aeon-gaze", 1]]])) },
    "gold-dragon": { entryRank: 8, kind: "late", note: "2.5 重做后的最新版规则表记为 MR8×1、MR9×1、MR10×3（总计 5 次吐息强化）；旧版资料的 MR10×2 已不采用。", transition: { from: ["angel", "demon", "aeon", "azata", "lich", "trickster"], retain: "保留神话 1—7 阶通用神话能力与专长。", lose: "失去原主道途专属能力、法术书与后续成长。" }, grants: ["金龙形态", "属性下限提升", "金龙法术与免疫"], steps: { 8: [["dragon-breath", 1]], 9: [["dragon-breath", 1], ["dragon-feat", 3]], 10: [["dragon-breath", 3]] } },
    devil: { entryRank: 8, kind: "late", transition: { from: ["aeon", "azata"], retain: "保留神话 3—7 阶已获得的御衡者或灵使道途能力。", lose: "不再推进原道途 8—10 阶；灵使会失去艾乌。" }, grants: ["地狱敕令整池", "地狱统御", "地狱封印整池", "地狱权威"], rankGrants: { 8: ["地狱敕令整池", "地狱统御"], 9: ["地狱封印整池"], 10: ["地狱权威"] }, steps: {} },
    swarm: { entryRank: 8, kind: "late", transition: { from: ["angel", "demon", "aeon", "azata", "lich", "trickster"], retain: "保留通用神话能力与神话专长。", lose: "失去原主道途全部专属能力与法术书；所有普通队友离队。" }, grants: ["虫群分身、吞噬、宿主、虫群形态、盛宴、感染", "虫群之眼", "虫群本身"], rankGrants: { 8: ["虫群分身、吞噬、宿主、虫群形态、盛宴、感染"], 9: ["虫群之眼"], 10: ["虫群本身"] }, steps: {} },
    legend: { entryRank: 8, kind: "late", transition: { from: ["angel", "demon", "aeon", "azata", "lich", "trickster"], retain: "仅保留神话 1—2 阶的通用选择。", lose: "失去神话 3 阶之后的通用选择、全部道途能力与道途法术书。" }, grants: ["普通等级上限提高至 40", "完成净化后全属性 +4"], steps: {}, terminalRank: 8 }
  };
})();
