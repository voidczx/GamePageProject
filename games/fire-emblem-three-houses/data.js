window.FE3H_DATA = (() => {
  const chapterSource = (chapter, suffix = "") => `https://www.fe3h.com/chapters/part1/chapter_${chapter}${suffix}`;
  const characterSource = (id) => `https://www.fe3h.com/characters/${id}`;
  const paralogueSource = (id) => `https://www.fe3h.com/paralogues/${id}`;

  const battles = [
    {
      id: "wc-1", month: "4月", moon: "大树节", chapter: 1,
      title: "Three Houses", mission: "Rivalry of the Houses / 学级对抗战",
      objective: "全灭敌军", defeat: "Byleth 或学级长败退", deployment: "我方 5 / 敌军 10", fog: false,
      facts: ["模拟战中败退不会造成永久死亡。", "最近的三名敌军会先行压上；进入东北区域会令其余敌军开始行动。", "击败左上教授后，右上学生组会主动推进。"],
      prep: ["选择 4 名主力，不平均分配经验", "利用草丛承受第一轮攻击", "先处理近处小队，再触发后排"],
      loot: ["Manuela：Vulnerary", "Hanneman：Intermediate Seal"],
      zones: [
        {label:"我方起点",type:"start",x:8,y:72,w:22,h:16}, {label:"首轮压上",type:"danger",x:31,y:58,w:18,h:14},
        {label:"草丛伏击",type:"trigger",x:50,y:46,w:18,h:16}, {label:"教授 A",type:"boss",x:14,y:10,w:18,h:13},
        {label:"教授 B / 后排",type:"boss",x:70,y:9,w:22,h:14}
      ], source: chapterSource(1)
    },
    {
      id: "wc-2", month: "5月", moon: "竖琴节", chapter: 2,
      title: "Familiar Scenery", mission: "Red Canyon Dominance / 赤红谷讨伐战",
      objective: "击败 Kostas", defeat: "Byleth 或学级长败退", deployment: "我方 9 / 敌军 21", fog: false,
      facts: ["敌军会以可控波次向起点推进，不能长期缩在出生区。", "Maddening 的 Kostas 会在进入警戒范围后移动。", "地图无增援；宝箱内为 Large Bullion。"],
      prep: ["至少准备两把训练武器控制攻速", "弓手优先削弱带 Poison Strike 的敌弓", "携带宝箱钥匙或击杀宝箱附近盗贼"],
      loot: ["宝箱：Large Bullion", "宝箱附近盗贼：Chest Key"],
      zones: [
        {label:"我方起点",type:"start",x:37,y:80,w:24,h:12}, {label:"第一波",type:"danger",x:39,y:59,w:22,h:12},
        {label:"宝箱 / 盗贼",type:"loot",x:9,y:34,w:20,h:13}, {label:"持续推进线",type:"trigger",x:34,y:31,w:32,h:12},
        {label:"Kostas",type:"boss",x:38,y:6,w:24,h:13}
      ], source: chapterSource(2)
    },
    {
      id: "wc-3", month: "6月", moon: "花冠节", chapter: 3,
      title: "Mutiny in the Mist", mission: "The Magdred Ambush / 马格德雷德奇袭战",
      objective: "击败 Lonato", defeat: "Byleth 或学级长败退", deployment: "我方 10 / 敌军 23 / NPC 3", fog: true,
      facts: ["本关是战场迷雾：基础视野很短，Torch 可扩大视野。", "击败中央 3×3 树林中的 Gaspard Commander 后解除迷雾。", "击败该指挥官会在 Lonato 附近生成 5 名增援；增援默认不主动移动。", "Catherine 与两名教会兵会自行推进；全员存活奖励 Secret Book，至少两人存活奖励 Goddess Icon。"],
      prep: ["购买并携带 2–3 个 Torch", "全队结组推进，不让脆皮处于队形外侧", "优先定位并击败中央迷雾源", "解除迷雾后再接近 Lonato 增援区"],
      loot: ["NPC 全存活：Secret Book", "至少 2 名 NPC 存活：Goddess Icon"],
      zones: [
        {label:"Lonato",type:"boss",x:9,y:7,w:18,h:13}, {label:"增援 5",type:"danger",x:28,y:9,w:18,h:12},
        {label:"迷雾源\nGaspard Commander",type:"trigger",x:37,y:38,w:26,h:17},
        {label:"Catherine 小队",type:"ally",x:72,y:26,w:20,h:14}, {label:"我方起点",type:"start",x:68,y:76,w:23,h:13},
        {label:"潜伏敌组",type:"danger",x:50,y:63,w:18,h:12}
      ], source: chapterSource(3)
    },
    {
      id: "wc-4", month: "7月", moon: "青海节", chapter: 4,
      title: "The Goddess's Rite of Rebirth", mission: "Assault at the Rite of Rebirth / 圣墓防卫战",
      objective: "击败 Mysterious Mage", defeat: "主角败退、全灭或超过 25 回合", deployment: "我方 10 / 敌军 26", fog: false,
      facts: ["25 回合限制。", "第 7 回合前南侧出现 1 Dark Mage + 2 Mage；未完成 Know Your Enemy 时提前至第 5 回合。", "Maddening 的 Death Knight 会在进入警戒范围或惊动其周围敌军后移动。", "可沿两侧通路绕开 Death Knight。"],
      prep: ["决定是否挑战 Death Knight，不临场摇摆", "保留计策处理 Death Knight 或中央密集区", "两侧各准备一把 Chest Key"],
      loot: ["左宝箱：Spirit Dust", "右宝箱：Intermediate Seal", "Death Knight：Dark Seal"],
      zones: [
        {label:"我方起点",type:"start",x:38,y:82,w:24,h:10}, {label:"南侧增援",type:"danger",x:39,y:69,w:22,h:10},
        {label:"左宝箱",type:"loot",x:8,y:22,w:17,h:12}, {label:"Death Knight",type:"danger",x:40,y:42,w:20,h:14},
        {label:"右宝箱",type:"loot",x:75,y:22,w:17,h:12}, {label:"Mysterious Mage",type:"boss",x:39,y:7,w:23,h:12}
      ], source: chapterSource(4)
    },
    {
      id: "wc-5", month: "8月", moon: "翠雨节", chapter: 5,
      title: "Tower of Black Winds", mission: "The Gautier Inheritance / 戈迪耶家继承战",
      objective: "击败 Miklan 与 Black Beast", defeat: "Byleth 或学级长败退", deployment: "我方 10 / 敌军 25 / NPC 1", fog: false,
      facts: ["Maddening 在第 2 敌军回合从起点左侧增援 2 Mage + 2 Thief，第 6 回合再来一组。", "越过顶部断柱会触发右上可立即行动的盗贼增援。", "Miklan 被击败后转为三血条 Black Beast；全员被移至中央入口，HP 与法术次数不恢复，但 Divine Pulse 回满。"],
      prep: ["起点留队伍处理第 2 回合法师增援", "保留范围计策用于拥挤走廊", "进入 Miklan 区域前补满 HP 并保留魔兽破盾计策"],
      loot: ["右下宝箱：Armorslayer", "左上 Fortress Knight：Accuracy Ring", "Sylvain 在队且战后拒绝归还：Lance of Ruin"],
      zones: [
        {label:"我方起点",type:"start",x:9,y:75,w:19,h:12}, {label:"T2 / T6 增援",type:"danger",x:3,y:56,w:21,h:12},
        {label:"Armorslayer",type:"loot",x:72,y:77,w:20,h:11}, {label:"断柱触发线",type:"trigger",x:37,y:22,w:25,h:11},
        {label:"右上即动增援",type:"danger",x:74,y:8,w:20,h:12}, {label:"Miklan → Beast",type:"boss",x:40,y:38,w:22,h:15}
      ], source: chapterSource(5)
    },
    {
      id: "wc-6", month: "9月", moon: "弓马节", chapter: 6,
      title: "Rumors of a Reaper", mission: "The Underground Chamber / 地下密室战",
      objective: "击败 Death Knight 或全灭其他敌军", defeat: "Byleth 败退、全灭或超过 25 回合", deployment: "我方 10 / 敌军 32", fog: false,
      facts: ["25 回合限制。", "进入大量传送格的房间会增援 2 Cavalier + 1 Archer。", "右侧拉杆会启动除左上外的全部传送格；传送后可用剩余移动，但不能原路传回。", "无需使用起点附近传送格也能到达全部房间。"],
      prep: ["预留 Stride 给最后冲击 Death Knight", "至少一名开门单位或准备 Door Key", "优先取得 March Ring，不盲踩未启动传送格"],
      loot: ["下方宝箱：Levin Sword", "上方宝箱：March Ring", "Death Knight：Dark Seal"],
      zones: [
        {label:"我方起点",type:"start",x:40,y:82,w:21,h:10}, {label:"下宝箱\nLevin Sword",type:"loot",x:8,y:67,w:21,h:12},
        {label:"传送房 / 增援",type:"danger",x:34,y:49,w:32,h:14}, {label:"右侧拉杆",type:"trigger",x:77,y:43,w:16,h:12},
        {label:"上宝箱\nMarch Ring",type:"loot",x:8,y:10,w:22,h:12}, {label:"Death Knight",type:"boss",x:40,y:8,w:21,h:12}
      ], source: chapterSource(6)
    },
    {
      id: "wc-7", month: "10月", moon: "飞龙节", chapter: 7,
      title: "Field of the Eagle and Lion", mission: "Battle of the Eagle and Lion / 鹫狮战",
      objective: "全灭敌军", defeat: "Byleth 或学级长败退", deployment: "我方 10 / 两军 31", fog: false,
      facts: ["模拟战败退不会永久死亡。", "中央高台有 Ballista；可用 Stride 在第一回合争夺。", "对方每击败一定数量单位会获得全属性士气加成；Maddening 阈值为 3、5、8 人。", "击败数高于另外两家，战后获得 Blessed Lance。"],
      prep: ["第一回合决定是否用 Stride 抢中央高台", "避免让两家互相滚出士气加成", "准备 Steal 获取学级长身上的戒指"],
      loot: ["宝箱：Killer Lance", "Dimitri / Claude：Evasion Ring", "Edelgard：Accuracy Ring"],
      zones: [
        {label:"我方起点",type:"start",x:39,y:80,w:22,h:11}, {label:"中央高台\nBallista",type:"trigger",x:39,y:42,w:22,h:14},
        {label:"敌对学级 A",type:"danger",x:6,y:14,w:28,h:15}, {label:"敌对学级 B",type:"danger",x:66,y:14,w:28,h:15},
        {label:"宝箱",type:"loot",x:43,y:9,w:14,h:10}
      ], source: chapterSource(7)
    },
    {
      id: "wc-8", month: "11月", moon: "赤狼节", chapter: 8,
      title: "The Flame in the Darkness", mission: "The Remire Calamity / Remire 村救援战",
      objective: "击败 Solon", defeat: "主角败退、全灭或 Jeralt 败退", deployment: "我方 10 / 敌军 20 / NPC 11", fog: false,
      facts: ["击败每名村民附近最近的 Rampaging Villager 即可救出该村民。", "进入指定北侧行线后，Solon 在南侧出现；Death Knight 等敌军在左下出现。", "若触发 Solon 时尚未救出任何村民，全部村民会死亡；至少先救出 1 人可避免该事件。", "救出 3 人以上获得 Advanced Seal；全救获得 Extra Large Bullion。"],
      prep: ["先救至少 1 名村民，再越过触发线", "分两组快速处理左右村民", "触发 Solon 前让后排避开左下 Death Knight 区"],
      loot: ["上宝箱：Giant Shell", "下宝箱：Horseslayer", "Death Knight：Dark Seal"],
      zones: [
        {label:"我方起点",type:"start",x:39,y:82,w:22,h:10}, {label:"左村民组",type:"ally",x:8,y:31,w:23,h:16},
        {label:"右村民组",type:"ally",x:69,y:31,w:23,h:16}, {label:"越线触发",type:"trigger",x:35,y:21,w:30,h:10},
        {label:"Solon 出现",type:"boss",x:39,y:67,w:21,h:11}, {label:"Death Knight",type:"danger",x:8,y:70,w:22,h:12}
      ], source: chapterSource(8)
    },
    {
      id: "wc-9", month: "12月", moon: "星辰节", chapter: 9,
      title: "The Cause of Sorrow", mission: "Salvation at the Chapel / 礼拜堂救援战",
      objective: "全灭 7 只 Demonic Beast", defeat: "主角败退、全灭或 Jeralt 败退", deployment: "我方 10 / 魔兽 7 / NPC 4", fog: false,
      facts: ["地图无增援。", "击败离学生最近的魔兽后，该学生会撤离。", "7 只魔兽分别弱于剑、枪或斧。", "全员救出获得 Energy Drop；至少救出 1 人获得 Umbral Steel。"],
      prep: ["部署足够计策以连续破盾", "按学生风险而非宝箱距离决定击杀顺序", "利用克制武器完成最后一段血条"],
      loot: ["右下宝箱：Healing Staff", "全救：Energy Drop", "至少救 1 人：Umbral Steel"],
      zones: [
        {label:"我方起点",type:"start",x:40,y:80,w:21,h:11}, {label:"学生 A / 魔兽",type:"ally",x:10,y:20,w:23,h:16},
        {label:"学生 B / 魔兽",type:"ally",x:67,y:18,w:23,h:16}, {label:"中央魔兽群",type:"danger",x:36,y:40,w:29,h:21},
        {label:"Healing Staff",type:"loot",x:72,y:72,w:21,h:11}
      ], source: chapterSource(9)
    },
    {
      id: "wc-10", month: "1月", moon: "守护节", chapter: 10,
      title: "Where the Goddess Dwells", mission: "The Sealed Forest Snare / 封印森林陷阱",
      objective: "击败 Solon", defeat: "Byleth 或学级长败退", deployment: "我方 10 / 敌军 17", fog: false,
      facts: ["击败 Kronya 后，Solon 与增援在北侧出现。", "阶段转换时全员被移动到 Solon 南侧；HP 与法术次数不恢复，Divine Pulse 回满。", "Kronya 阶段结束时 Sword of the Creator 会升级并修满耐久。"],
      prep: ["击杀 Kronya 前补满 HP 并保留法术次数", "第一阶段可积极使用 Sword of the Creator", "保留至少两次范围计策给第二阶段魔兽"],
      loot: ["左下宝箱：Speed Ring", "Dark Mage：Magic Staff", "第二阶段 Armored Knight：Steel Axe"],
      zones: [
        {label:"我方起点",type:"start",x:39,y:80,w:22,h:11}, {label:"Speed Ring",type:"loot",x:7,y:72,w:20,h:11},
        {label:"Kronya",type:"boss",x:40,y:43,w:20,h:13}, {label:"阶段转换",type:"trigger",x:35,y:31,w:30,h:10},
        {label:"Solon + 增援",type:"boss",x:38,y:7,w:24,h:14}
      ], source: chapterSource(10)
    },
    {
      id: "wc-11", month: "2月", moon: "天马节", chapter: 11,
      title: "Throne of Knowledge", mission: "Conflict in the Holy Tomb / 圣墓冲突",
      objective: "击败 Flame Emperor", defeat: "Byleth 或路线学级长败退", deployment: "我方 9 / 敌军 40", fog: false,
      facts: ["Edelgard 与 Hubert 在黑鹫学级时不会参战。", "敌盗贼会优先偷取 Crest Stone。", "保护全部 Crest Stone 获得 Knowledge Gem；保护至少一半获得 Advanced Seal。", "可通过 Rescue + Warp 快速接近敌将，但会放弃石头奖励。"],
      prep: ["确定是保护 Crest Stone 还是快速斩首", "分左右两队截击盗贼", "为低命中单位配置高命中计策"],
      loot: ["保护全部：Knowledge Gem + Rusted Bow (Silver)", "保护至少一半：Advanced Seal"],
      zones: [
        {label:"我方起点",type:"start",x:39,y:82,w:22,h:10}, {label:"左侧 Crest Stones",type:"loot",x:8,y:37,w:23,h:20},
        {label:"右侧 Crest Stones",type:"loot",x:69,y:37,w:23,h:20}, {label:"盗贼推进线",type:"danger",x:35,y:31,w:30,h:10},
        {label:"Flame Emperor",type:"boss",x:38,y:7,w:24,h:14}
      ], source: chapterSource(11)
    },
    {
      id: "wc-12", month: "3月", moon: "孤月节", chapter: 12,
      title: "To War / Outset of a Power Struggle", mission: "The Battle of Garreg Mach / Garreg Mach 攻防战",
      objective: "随路线变化", defeat: "主角或路线领袖败退", deployment: "路线相关", fog: false,
      facts: ["非 Crimson Flower：击败 Edelgard，同时不能让敌军占领防守点。", "非 Crimson Flower 的 Maddening 会在越过北侧行线后持续生成 Pegasus Knight，并在 Edelgard 两侧出现 Demonic Beast。", "Crimson Flower：目标为击败 Rhea；Rhea 与大批单位会在阶段条件满足后于北侧出现。", "本关结束后进入五年后；全员携带武器会自动修满耐久。"],
      prep: ["给第 13 章强制出场的本学级成员准备装备", "修正骑士团与副官，不把关键装备留在编外角色身上", "非 CF 路线优先处理 Death Knight 与 Hubert 触发友军增援"],
      loot: ["非 CF：Death Knight 掉落 Dark Seal", "非 CF Maddening：Hubert 可偷 Prayer Ring", "CF：增援 Archer 掉落 Blessed Bow"],
      zones: [
        {label:"我方起点 / 防守点",type:"start",x:38,y:81,w:25,h:11}, {label:"左炮台",type:"danger",x:8,y:43,w:20,h:12},
        {label:"右炮台",type:"danger",x:72,y:43,w:20,h:12}, {label:"持续增援触发线",type:"trigger",x:34,y:29,w:32,h:10},
        {label:"路线最终目标",type:"boss",x:38,y:6,w:25,h:14}
      ], source: chapterSource(12, "c")
    }
  ];

  const units = [
    {id:"byleth",name:"贝雷特 / 贝雷丝",english:"Byleth",house:"主角",recruit:"自动加入",role:"高力量全能核心",build:"Archer 命中+20 → Brigand 鬼神一击 → 飞行或格斗终盘",unlocks:["Sword C+：Bane of Monsters","Sword A：Windsweep"],paralogues:["tales_red_canyon"],source:characterSource("byleth")},
    {id:"edelgard",name:"艾黛尔贾特",english:"Edelgard",house:"黑鹫",recruit:"路线锁定",role:"高爆发斧系核心",build:"Brigand → Wyvern Rider → Wyvern Lord；CF 终盘可用 Aymr",unlocks:["Authority C：Battalion Vantage","Aymr：Raging Storm"],paralogues:["insurmountable"],source:characterSource("edelgard")},
    {id:"hubert",name:"修伯特",english:"Hubert",house:"黑鹫",recruit:"路线锁定",role:"暗魔法削弱 / 魔法骑",build:"Mage → Dark Bishop → Dark Knight",unlocks:["Lance budding：Frozen Lance","Reason：Mire Β / Banshee Θ"],paralogues:["darkness_beneath"],source:characterSource("hubert")},
    {id:"ferdinand",name:"菲尔迪南特",english:"Ferdinand",house:"黑鹫",recruit:"Dex 10 + Heavy Armor C",role:"连击枪 / 高回避骑兵",build:"Brigand → Paladin；有资源可转 Wyvern Lord",unlocks:["Lance A：Swift Strikes","Heavy Armor budding：Seal Speed"],paralogues:["retribution"],source:characterSource("ferdinand")},
    {id:"linhardt",name:"林哈尔特",english:"Linhardt",house:"黑鹫",recruit:"Mag 10 + Reason C",role:"Warp / Physic 支援",build:"Priest → Bishop；不必强行走 Master Class",unlocks:["Faith C：Physic","Faith A：Warp"],paralogues:["legend_lake"],source:characterSource("linhardt")},
    {id:"caspar",name:"卡斯帕尔",english:"Caspar",house:"黑鹫",recruit:"Str 10 + Brawl C",role:"格斗连段 / 破甲",build:"Brigand → Grappler → War Master",unlocks:["Brawl C+：Bombard","Brawl A：Mighty Blow"],paralogues:["face_beneath"],source:characterSource("caspar")},
    {id:"bernadetta",name:"贝尔娜提塔",english:"Bernadetta",house:"黑鹫",recruit:"Str 20 + Bow C",role:"Vengeance 单点爆发 / 控制",build:"Archer → Paladin 或 Bow Knight；围绕低血 Vengeance",unlocks:["Lance C+：Vengeance","Bow A：Encloser"],paralogues:["foreign_land"],source:characterSource("bernadetta")},
    {id:"dorothea",name:"多洛缇雅",english:"Dorothea",house:"黑鹫",recruit:"Cha 25 + Authority B",role:"舞者 / Meteor 连携",build:"Mage 精通后优先 Dancer，也可 Warlock",unlocks:["Faith C：Physic","Reason A：Meteor","Sword C+：Hexblade"],paralogues:["rumored_nuptials"],source:characterSource("dorothea")},
    {id:"petra",name:"佩托拉",english:"Petra",house:"黑鹫",recruit:"Dex 10 + Riding C",role:"飞行闪避 / 物理收割",build:"Brigand + Pegasus Knight → Wyvern Lord",unlocks:["Authority C：Battalion Wrath","Bow C+：Waning Shot"],paralogues:["foreign_land"],source:characterSource("petra")},

    {id:"dimitri",name:"帝弥托利",english:"Dimitri",house:"青狮",recruit:"路线锁定",role:"Battalion Wrath + Vantage 敌方回合核心",build:"Archer 命中+20 → Paladin / 独有职业；Authority 优先到 A",unlocks:["Authority C：Battalion Wrath","Authority A：Battalion Vantage"],paralogues:["silver_maiden"],source:characterSource("dimitri")},
    {id:"dedue",name:"杜笃",english:"Dedue",house:"青狮",recruit:"路线锁定",role:"前期物理盾 / Vengeance",build:"Brigand → Grappler / War Master；保留 Vengeance 方案",unlocks:["Lance C+：Vengeance","Brawl A：Mighty Blow"],paralogues:["war_weak"],source:characterSource("dedue")},
    {id:"felix",name:"菲利克斯",english:"Felix",house:"青狮",recruit:"Spd 15 + Sword B+",role:"高输出 Sniper / Grappler",build:"Archer → Sniper 或 Brigand → Grappler",unlocks:["Sword C+：Sunder","Sword A：Windsweep"],paralogues:["true_chivalry"],source:characterSource("felix")},
    {id:"ashe",name:"亚修",english:"Ashe",house:"青狮",recruit:"Cha 15 + Lance C",role:"狙击手 / 开锁工具",build:"Brigand + Archer → Sniper",unlocks:["Lance C+：Shatter Slash","Bow C+：Deadeye"],paralogues:["falling_heaven"],source:characterSource("ashe")},
    {id:"sylvain",name:"希尔凡",english:"Sylvain",house:"青狮",recruit:"Cha 25 + Reason C；女 Byleth 可直接招募",role:"Swift Strikes 骑兵",build:"Brigand → Paladin；飞龙路线成本更高",unlocks:["Lance A：Swift Strikes","Reason budding：Black Magic Avo +20"],paralogues:["forgotten"],source:characterSource("sylvain")},
    {id:"mercedes",name:"梅尔赛德司",english:"Mercedes",house:"青狮",recruit:"Mag 15 + Bow C",role:"远程治疗 / 全队恢复",build:"Priest → Bishop；Gremory 仅在需要更多法术时考虑",unlocks:["Faith C：Physic","Faith B：Restore","Faith A：Fortify"],paralogues:["face_beneath"],source:characterSource("mercedes")},
    {id:"annette",name:"雅妮特",english:"Annette",house:"青狮",recruit:"Mag 10 + Faith B",role:"Rally 支援 / 魔法斧",build:"Mage → Warlock；DLC 可考虑 Dark Flier",unlocks:["Authority D：Rally Resistance","Authority C+：Rally Speed"],paralogues:["weathervanes"],source:characterSource("annette")},
    {id:"ingrid",name:"英谷莉特",english:"Ingrid",house:"青狮",recruit:"Dex 15 + Flying D",role:"Falcon Knight / 魔防诱饵",build:"Brigand + Pegasus Knight → Falcon Knight",unlocks:["Lance A：Frozen Lance","Sword A：Hexblade"],paralogues:["rumored_nuptials"],source:characterSource("ingrid")},

    {id:"claude",name:"库罗德",english:"Claude",house:"金鹿",recruit:"路线锁定",role:"飞行弓 / 机动指挥",build:"Archer + Brigand → 独有飞行职业",unlocks:["Bow A：Encloser","Authority A：Battalion Wrath"],paralogues:["sleeping_sand"],source:characterSource("claude")},
    {id:"lorenz",name:"洛廉兹",english:"Lorenz",house:"金鹿",recruit:"Cha 20 + Reason C",role:"混合伤害骑兵 / 外传关键",build:"Mage → Paladin / Dark Knight，按队伍缺口选择",unlocks:["Lance C+：Frozen Lance","Reason B：Ragnarok"],paralogues:["land_golden_deer"],source:characterSource("lorenz")},
    {id:"raphael",name:"拉斐尔",english:"Raphael",house:"金鹿",recruit:"Str 20 + Heavy Armor C",role:"格斗坦 / Grappler",build:"Brigand → Grappler → War Master",unlocks:["Authority D：Rally Strength","Authority C：Battalion Wrath"],paralogues:["death_toll"],source:characterSource("raphael")},
    {id:"ignatz",name:"伊古纳兹",english:"Ignatz",house:"金鹿",recruit:"Dex 10 + Authority B",role:"高命中 Sniper / Rally",build:"Brigand + Archer → Sniper",unlocks:["Authority D：Rally Speed","Bow C+：Break Shot","Bow A：Ward Arrow"],paralogues:["death_toll"],source:characterSource("ignatz")},
    {id:"lysithea",name:"莉丝缇亚",english:"Lysithea",house:"金鹿",recruit:"Mag 15 + Faith B",role:"Warp / 魔法斩首",build:"Mage → Bishop / Gremory；DLC Valkyrie 提供射程",unlocks:["Reason B：Dark Spikes Τ","Faith B：Warp","Sword budding：Soulblade"],paralogues:["retribution"],source:characterSource("lysithea")},
    {id:"marianne",name:"玛莉安奴",english:"Marianne",house:"金鹿",recruit:"Mag 10 + Riding C",role:"Physic / Silence / 魔法战技",build:"Priest → Bishop；也可 Dancer",unlocks:["Faith C：Physic","Faith B：Silence","Lance budding：Frozen Lance"],paralogues:["forgotten_hero"],source:characterSource("marianne")},
    {id:"hilda",name:"希尔妲",english:"Hilda",house:"金鹿",recruit:"Cha 30 + Axe C；黑鹫阶段受路线限制",role:"飞龙物理核心",build:"Brigand + Pegasus Knight → Wyvern Lord",unlocks:["Authority C：Battalion Wrath","Heavy Armor budding：Seal Speed"],paralogues:["dividing_world"],source:characterSource("hilda")},
    {id:"leonie",name:"雷欧妮",english:"Leonie",house:"金鹿",recruit:"Str 15 + Lance C",role:"Point-Blank Volley / 高机动",build:"Brigand + Archer → Bow Knight 或 Falcon Knight",unlocks:["Lance C+：Monster Piercer","Bow A：Point-Blank Volley"],paralogues:["legend_lake"],source:characterSource("leonie")},

    {id:"yuri",name:"尤里",english:"Yuri",house:"灰狼",recruit:"通关煤暗之章 Chapter 6",role:"Foul Play 机动支援 / Dancer",build:"Thief → Trickster；也可 Dancer",unlocks:["Bow budding：Deadeye","Trickster：Foul Play"],paralogues:["cursed_relic"],source:characterSource("yuri")},
    {id:"balthus",name:"巴尔塔札尔",english:"Balthus",house:"灰狼",recruit:"通关煤暗之章 Chapter 5",role:"低血格斗爆发",build:"Brigand → Grappler / War Monk → War Master",unlocks:["Authority D：Rally Strength","Brawl A：Mighty Blow"],paralogues:["black_market"],source:characterSource("balthus")},
    {id:"constance",name:"康斯坦洁",english:"Constance",house:"灰狼",recruit:"通关煤暗之章 Chapter 3",role:"Bolting 远程连携 / Rescue",build:"Mage → Dark Flier / Gremory",unlocks:["Reason A：Bolting","Faith B：Rescue","Sword A：Hexblade"],paralogues:["cursed_relic"],source:characterSource("constance")},
    {id:"hapi",name:"哈琵",english:"Hapi",house:"灰狼",recruit:"通关煤暗之章 Chapter 4",role:"Banshee 控场 / Warp",build:"Mage → Valkyrie / Gremory",unlocks:["Reason C：Banshee Θ","Faith A：Warp","Authority C：Battalion Wrath"],paralogues:["black_market"],source:characterSource("hapi")},

    {id:"seteth",name:"西提司",english:"Seteth",house:"教会",recruit:"Chapter 12 结束后自动加入；CF 不可用",role:"即战力飞龙 / Swift Strikes",build:"保留 Wyvern Rider，补 Brigand 后升 Wyvern Lord",unlocks:["Authority C：Battalion Wrath","Lance A：Swift Strikes"],paralogues:["ocean_view"],source:characterSource("seteth")},
    {id:"flayn",name:"芙莲",english:"Flayn",house:"教会",recruit:"Chapter 6 结束后自动加入；CF 分歧时离队",role:"Rescue / Fortify 支援",build:"Priest → Bishop；DLC 可选 Dark Flier",unlocks:["Faith B：Rescue","Faith A：Fortify"],paralogues:["ocean_view"],source:characterSource("flayn")},
    {id:"hanneman",name:"汉尼曼",english:"Hanneman",house:"教会",recruit:"Chapter 8 起，Byleth Lv.15 后对话招募",role:"长射程魔法 / Ward Arrow",build:"Mage → Warlock；终盘可转 Dark Knight",unlocks:["Reason A+：Meteor","Bow A：Ward Arrow"],paralogues:["oil_water"],source:characterSource("hanneman")},
    {id:"manuela",name:"玛努艾拉",english:"Manuela",house:"教会",recruit:"Chapter 8 起，Byleth Lv.15 后对话招募",role:"Warp / Silence 功能型法师",build:"Priest → Bishop；按资源补 Mage 精通",unlocks:["Faith B：Silence","Faith A：Warp"],paralogues:["oil_water"],source:characterSource("manuela")},
    {id:"gilbert",name:"吉尔伯特",english:"Gilbert",house:"教会",recruit:"仅 AM，Chapter 13 自动加入",role:"物理承伤 / Rally Defense",build:"Fortress Knight 即用；需要机动时转 Wyvern Rider",unlocks:["Authority C：Battalion Wrath","Lance A：Glowing Ember"],paralogues:["weathervanes"],source:characterSource("gilbert")},
    {id:"alois",name:"阿罗伊斯",english:"Alois",house:"教会",recruit:"Chapter 11 起，Byleth Lv.15 后对话招募",role:"低投入格斗 / Rally Strength",build:"补 Brigand 后转 Grappler 或 War Master",unlocks:["Authority C：Battalion Wrath","Brawl C+：One-Two Punch"],paralogues:["sword_shield"],source:characterSource("alois")},
    {id:"catherine",name:"卡多莉奴",english:"Catherine",house:"教会",recruit:"Chapter 4 起，Byleth Lv.15；黑鹫仅 SS 自动加入",role:"前期 Swordmaster 即战力",build:"尽早招募直接使用；后期按阵容转 Falcon Knight",unlocks:["Authority C：Battalion Vantage","Sword A：Finesse Blade"],paralogues:["falling_heaven"],source:characterSource("catherine")},
    {id:"shamir",name:"萨米亚",english:"Shamir",house:"教会",recruit:"Chapter 6 起，Byleth Lv.15；黑鹫 SS 可自动加入",role:"低投入 Sniper / Hunter's Volley",build:"保留 Sniper 并尽快精通；补 Brigand 视资源决定",unlocks:["Bow C+：Heavy Draw","Bow A：Monster Blast"],paralogues:["sword_shield"],source:characterSource("shamir")},
    {id:"cyril",name:"西里尔",english:"Cyril",house:"教会",recruit:"Chapter 5 起，Byleth Lv.10；黑鹫仅 SS 自动加入",role:"早期 Vengeance / Point-Blank Volley",build:"Brigand + Archer → Wyvern Rider 或 Bow Knight",unlocks:["Lance C+：Vengeance","Bow C+：Point-Blank Volley"],paralogues:["dividing_world"],source:characterSource("cyril")},
    {id:"anna",name:"安娜",english:"Anna",house:"其他",recruit:"DLC；Chapter 3 起任意学级直接对话招募",role:"Rescue / Meteor 工具位",build:"按队伍缺口走 Assassin 或 Trickster，避免重投入",unlocks:["Faith B：Rescue","Reason A：Meteor"],paralogues:["secret_merchant"],source:characterSource("anna")},
    {id:"jeritza",name:"耶利扎",english:"Jeritza",house:"其他",recruit:"仅 CF，第二部首章前自动加入",role:"高基础值骑兵 / 敌方回合核心",build:"保留 Death Knight；利用 Mastermind 快速补职业精通",unlocks:["Authority C：Battalion Wrath","Sword A：Windsweep"],paralogues:["secret_merchant"],source:characterSource("jeritza")}
  ];

  const paralogues = [
    {id:"war_weak",name:"War for the Weak",units:["dedue"],window:"Chapter 6–11",route:"仅青狮",reward:"Duscur Heavy Soldiers；完成结果影响 Dedue 后续",note:"15 回合且不能让绿军击败敌将；抢击杀越多报酬越好。",source:paralogueSource("war_for_the_weak")},
    {id:"true_chivalry",name:"True Chivalry",units:["felix"],window:"Chapter 7–11",route:"第一部",reward:"Fraldarius Soldiers；满足救援条件可得 Aegis Shield",note:"保护 NPC 的结果会影响主要奖励。",source:paralogueSource("true_chivalry")},
    {id:"forgotten",name:"The Forgotten",units:["sylvain"],window:"Chapter 7–11",route:"第一部",reward:"Gautier Knights；Sylvain 在队可得 Lance of Ruin",note:"分散宝物很多，先决定是速通还是全收集。",source:paralogueSource("the_forgotten")},
    {id:"land_golden_deer",name:"Land of the Golden Deer",units:["lorenz"],window:"Chapter 7–11",route:"第一部",reward:"Thyrsus；Gloucester Knights",note:"击败敌将或坚持 12 回合；飞兵与 Warp 可快速结束。",source:paralogueSource("land_of_the_golden_deer")},
    {id:"rumored_nuptials",name:"Rumored Nuptials",units:["ingrid","dorothea"],window:"Chapter 7–11",route:"第一部",reward:"Ingrid 已招募时可得 Luín；Galatea Pegasus Co.",note:"遗产奖励与相关角色是否正式加入有关。",source:paralogueSource("rumored_nuptials")},
    {id:"death_toll",name:"Death Toll",units:["raphael","ignatz"],window:"Chapter 7–11",route:"第一部",reward:"Leicester Mercenaries；Victor Private Military",note:"分兵救援与商队存活是主要压力。",source:paralogueSource("death_toll")},
    {id:"falling_heaven",name:"Falling Short of Heaven",units:["ashe","catherine"],window:"Chapter 8–11",route:"需 Ashe 或 Catherine 条件",reward:"Shoes of the Wind；Gaspard Knights",note:"地图包含 Torch，适合为雾战资源做补充。",source:paralogueSource("falling_short_of_heaven")},
    {id:"tales_red_canyon",name:"Tales of the Red Canyon",units:["byleth"],window:"Chapter 7–11",route:"第一部",reward:"Knowledge Gem；Divine Pulse +3",note:"魔兽关，优先准备范围计策与修复遗产所需 Umbral Steel。",source:paralogueSource("tales_of_the_red_canyon")},
    {id:"cursed_relic",name:"A Cursed Relic",units:["yuri","constance"],window:"Chapter 8–11",route:"DLC",reward:"Fetters of Dromi；对应两支骑士团",note:"靠近 Duke Gerth 或击败 Myson 会触发大量增援；建议有 Warp/Rescue 后再打。",source:paralogueSource("a_cursed_relic")},
    {id:"black_market",name:"Black Market Scheme",units:["balthus","hapi"],window:"Chapter 8–11",route:"DLC",reward:"Vajra-Mushti；两支 DLC 骑士团",note:"高收益但敌军密集，建议中级职业与命中技能成型后处理。",source:paralogueSource("black_market_scheme")},
    {id:"dividing_world",name:"Dividing the World",units:["hilda","cyril"],window:"第一部或第二部特定窗口",route:"Hilda / Cyril 条件",reward:"Freikugel；Goneril Valkyries",note:"奖励与相关角色是否加入有关，黑鹫路线限制较多。",source:paralogueSource("dividing_the_world")},
    {id:"face_beneath",name:"The Face Beneath",units:["mercedes","caspar"],window:"第二部",route:"非 Crimson Flower",reward:"Rafail Gem；Caspar 击败 Death Knight 可得 Scythe of Sariel",note:"必须让 Caspar 完成指定击杀才能拿到额外武器。",source:paralogueSource("the_face_beneath")},
    {id:"legend_lake",name:"Legend of the Lake",units:["linhardt","leonie"],window:"第二部",route:"需两人",reward:"The Inexhaustible",note:"魔兽多，优先用计策完整破盾获取 Umbral Steel。",source:paralogueSource("legend_of_the_lake")},
    {id:"retribution",name:"Retribution",units:["ferdinand","lysithea"],window:"第二部",route:"非 Crimson Flower",reward:"Ochain Shield；Aegir / Ordelia 骑士团",note:"后期敌军压力高，进入前确认两人都已招募且存活。",source:paralogueSource("retribution")},
    {id:"forgotten_hero",name:"Forgotten Hero",units:["marianne"],window:"Chapter 15–17 CF / 21 SS, AM / 22 VW",route:"Marianne 与 Byleth C 支援",reward:"Blutgang；Edmund Troops",note:"战场迷雾；其他我方进入中央空地会惊动首领并可能触发狼增援。",fog:true,source:paralogueSource("forgotten_hero")},
    {id:"foreign_land",name:"Foreign Land and Sky",units:["petra","bernadetta"],window:"第二部",route:"需两人",reward:"Brigid Hunters 等骑士团",note:"胜利条件会发生变化，预留机动单位处理后续目标。",source:paralogueSource("foreign_land_and_sky")},
    {id:"weathervanes",name:"Weathervanes of Fódlan",units:["annette","gilbert"],window:"第二部",route:"Azure Moon；需 Gilbert",reward:"Crusher；School of Sorcery Soldiers",note:"路线限定，青狮档不要遗漏。",source:paralogueSource("weathervanes_of_fodlan")},
    {id:"silver_maiden",name:"The Silver Maiden",units:["dimitri"],window:"第二部",route:"Azure Moon",reward:"Blue Lion Knights 与多项属性道具",note:"路线限定的高价值领主外传。",source:paralogueSource("the_silver_maiden")},
    {id:"sleeping_sand",name:"The Sleeping Sand Legend",units:["claude"],window:"第二部",route:"Verdant Wind",reward:"Sword of Begalta",note:"路线限定领主外传，魔兽与沙地会压低地面部队机动。",source:paralogueSource("the_sleeping_sand_legend")},
    {id:"insurmountable",name:"Insurmountable",units:["edelgard"],window:"第二部",route:"Crimson Flower",reward:"Holst's Chosen 与多项属性道具",note:"路线限定领主外传。",source:paralogueSource("insurmountable")},
    {id:"darkness_beneath",name:"Darkness Beneath the Earth",units:["hubert"],window:"第二部",route:"Crimson Flower",reward:"Arrow of Indra；Seraph Robe",note:"路线限定，魔法骑与传送单位能显著降低分兵压力。",source:paralogueSource("darkness_beneath_the_earth")},
    {id:"ocean_view",name:"An Ocean View",units:["seteth","flayn"],window:"Chapter 9–11",route:"第一部；需 Flayn",reward:"Spear of Assal；Caduceus Staff；两支骑士团",note:"两件 Sacred 装备价值很高；进入前准备飞行或远程手段处理分散目标。",source:paralogueSource("an_ocean_view")},
    {id:"oil_water",name:"Oil and Water",units:["hanneman","manuela"],window:"Chapter 8–11",route:"第一部；需 Hanneman 或 Manuela",reward:"Experience Gem；Rapier；两支骑士团",note:"两名教师分处地图两侧，先明确保护与会合路线。",source:paralogueSource("oil_and_water")},
    {id:"sword_shield",name:"Sword and Shield of Seiros",units:["alois","shamir"],window:"Chapter 7–11",route:"第一部；需 Alois 或 Shamir",reward:"Seraph Robe；Large Bullion；两支骑士团",note:"保护港口与友军，移动力和远程火力能减少漏怪。",source:paralogueSource("sword_and_shield_of_seiros")},
    {id:"secret_merchant",name:"The Secret Merchant",units:["anna","jeritza"],window:"Chapter 9–11；CF 13–17",route:"DLC；SS 不可用",reward:"Secret Transport Force",note:"其他路线由 Anna 开启；CF 第二部还要求 Jeritza 存活。",source:paralogueSource("the_secret_merchant")}
  ];

  const routes = {
    AM: {name:"Azure Moon / 青狮",leader:"Dimitri",chapters:["13 Hunting by Daybreak","14 Protecting Garreg Mach","15 Ambush at Ailell","16 The Great Bridge Coup","17 To War at Gronder","18 Reclaiming the Capital","19 Saving Derdriu","20 Taking Fort Merceus","21 Assault on Enbarr","22 Clash at the Imperial Capital"],warning:"Chapter 13 强制使用原青狮成员；第一部结束前必须给自动出场角色留装备与等级。"},
    VW: {name:"Verdant Wind / 金鹿",leader:"Claude",chapters:["13 Hunting by Daybreak","14 Protecting Garreg Mach","15 Ambush at Ailell","16 The Great Bridge Coup","17 To War at Gronder","18 Taking Fort Merceus","19 The Enbarr Infiltration","20 Confrontation at the Palace","21 Stand Strong at Shambhala","22 For the Freedom of Fódlan"],warning:"Chapter 13 强制使用原金鹿成员；终盘魔兽多，保留高耐久骑士团与修理材料。"},
    CF: {name:"Crimson Flower / 红花",leader:"Edelgard",chapters:["12 The Battle of Garreg Mach (attack)","13 The Great Bridge Coup","14 Capturing Derdriu","15 Protecting Garreg Mach","16 The Siege of Arianrhod","17 Combat at Tailtean Plains","18 The Fight for Fhirdiad"],warning:"Chapter 11 前必须完成 Edelgard 的关键事件并在分歧处选择同行；Flayn 会离队。"},
    SS: {name:"Silver Snow / 教会",leader:"Seteth",chapters:["13 Hunting by Daybreak","14 Protecting Garreg Mach","15 Ambush at Ailell","16 The Great Bridge Coup","17 Taking Fort Merceus","18 The Enbarr Infiltration","19 Confrontation at the Palace","20 Stand Strong at Shambhala","21 The Final Battle"],warning:"Edelgard 与 Hubert 离队；Chapter 13 强制使用原黑鹫成员与 Seteth，提前配置装备。"}
  };

  const mechanics = [
    {title:"命中优先",body:"Maddening 敌军回避高。物理单位常以 Archer 精通 Hit +20 为第一优先；个人技、Linked Attack、高命中骑士团和 Curved Shot 都应纳入命中预算。"},
    {title:"事实与建议分离",body:"角色卡中“关键解锁”是技能等级事实；“建议路线”是以无继承 Maddening 为目标的低投入方案，并非唯一正确培养。"},
    {title:"计策与魔兽护盾",body:"计策不会被常规反击，并可限制敌军移动。对魔兽命中全部护盾格会造成完整破盾、眩晕并掉落锻造材料。"},
    {title:"Battalion Wrath / Vantage",body:"两者在骑士团耐久不高于 1/3 时生效。不要在战前补充该骑士团；敌方计策与高必杀回避仍是风险。"},
    {title:"第 13 章准备",body:"AM/VW/SS 的 Hunting by Daybreak 没有常规整备阶段，并强制原学级成员登场。第一部最后一战前给他们配置武器、药品、骑士团与可用职业。"},
    {title:"挖角门槛",body:"角色卡显示无支援时的基础门槛。C/C+/B/B+ 支援会逐级降低属性和技能要求；达到 A 支援后学生无视属性与技能要求，教师仍受章节/等级条件限制。"},
    {title:"雾战",body:"White Clouds Chapter 3 与 Marianne 外传是最需要地图情报的雾战。携带 Torch、保持结组、用高防单位探边，不要让法师和弓手成为最外侧单位。"},
    {title:"外传奖励条件",body:"第一部双人外传通常只需其中一人即可开启，但遗产或骑士团奖励可能要求对应角色已正式招募；第二部双人外传通常要求两人都在队且存活。"}
  ];

  return { battles, units, paralogues, routes, mechanics };
})();
