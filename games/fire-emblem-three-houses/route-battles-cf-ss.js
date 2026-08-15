window.FE3H_ROUTE_BATTLES_CF_SS = {
  CF: [
    {
      id: "cf-12", route: "Crimson Flower / 红花线", routeCode: "CF", month: "3月", moon: "孤月节", chapter: 12,
      title: "Outset of a Power Struggle", mission: "The Battle of Garreg Mach / 加尔古·玛库进攻战",
      objective: "击败 Rhea", defeat: "Byleth 或 Edelgard 败退，或我军全灭", deployment: "我方 9 / 敌军 22 / NPC 4（Maddening 初始）", fog: false,
      facts: [
        "越过第一道城墙后，墙边出现 2 Brigands、1 Armored Knight、1 Mage 与 1 Archer。",
        "击败 Flayn 后，Death Knight 与 1 名 Armored Knight 作为友军在右侧要塞登场。",
        "Gilbert、Flayn、Seteth 全部被击败后，Rhea 与包括 Cyril、Catherine 在内的 16 名敌军在北侧出现。",
        "若到第 10 回合仍未击败 Gilbert、Flayn、Seteth，Rhea 大队照常出现，南侧另增援 8 Pegasus Knights。",
        "本关结束即进入五年后；全员物品栏内的武器会自动修满耐久。Ladislava 与 Randolph 是否存活没有额外奖励。"
      ],
      prep: [
        "在第 10 回合前击败 Gilbert、Flayn、Seteth，避免南侧 8 名飞马增援",
        "准备远程反制或飞行单位处理敌方 Fire Orb 与 Ballista",
        "Flayn 被击败后利用右侧友军 Death Knight 牵制，但不要为 Ladislava / Randolph 冒险",
        "把下一章要用的装备、技能和骑士团分配给主力；战后仅武器耐久会自动恢复"
      ],
      loot: ["墙边增援 Archer：Blessed Bow", "战后：全员物品栏内武器耐久自动恢复", "Ladislava / Randolph 生还：无额外奖励"],
      zones: [
        {label:"我方起点 / 帝国友军",type:"start",x:37,y:79,w:27,h:13}, {label:"第一道城墙\n越过触发增援",type:"trigger",x:31,y:57,w:38,h:12},
        {label:"左侧 Ballista",type:"danger",x:7,y:40,w:23,h:14}, {label:"右侧 Fire Orb\nFlayn 败退后友军",type:"danger",x:70,y:40,w:23,h:14},
        {label:"Gilbert / Flayn / Seteth",type:"boss",x:31,y:29,w:38,h:18}, {label:"T10 南侧飞马增援",type:"danger",x:37,y:67,w:27,h:10},
        {label:"Rhea + 16 人\n北侧最终阶段",type:"boss",x:36,y:7,w:29,h:17}
      ],
      source: "https://www.fe3h.com/chapters/part1/chapter_12a"
    },
    {
      id: "cf-13", route: "Crimson Flower / 红花线", routeCode: "CF", month: "12月", moon: "星辰节", chapter: 13,
      title: "Beyond Escape", mission: "The Great Bridge Coup / 密尔丁大桥之战",
      objective: "击败 Judith（并阻止其逃脱）", defeat: "Byleth 或 Edelgard 败退、我军全灭，或 Judith 逃脱", deployment: "我方 11 / 敌军 31（Maddening 初始）", fog: false,
      facts: [
        "本关没有敌军增援；难点来自会撤离的敌军与两侧宝箱，而不是守点。",
        "Leonie（若已招募则为通用 Paladin）被击败后，Judith 会开始向右上角撤退；Acheron 及其部队同时离场。",
        "攻击右侧 Fortress Knight 会令 Ignatz（若已招募则为通用 Sniper）开始移动。",
        "上下两只宝箱分别是 Goddess Icon 与 Bow of Zoltan；击败 Judith 前要先规划开箱路线。"
      ],
      prep: [
        "携带两把 Chest Key，或部署有 Locktouch 的单位分取上下宝箱",
        "不要过早击败 Leonie；先清理桥面并让机动单位靠近 Judith 的撤退路线",
        "准备 Stride、Warp 或高机动飞行单位，在 Judith 开始撤退时完成截杀"
      ],
      loot: ["Ignatz：Brave Bow", "Judith：Hexlock Shield", "上方宝箱：Goddess Icon", "下方宝箱：Bow of Zoltan", "Ignatz / Leonie 可偷：Vulnerary ×2"],
      zones: [
        {label:"我方起点",type:"start",x:7,y:73,w:22,h:14}, {label:"下方宝箱\nBow of Zoltan",type:"loot",x:30,y:76,w:22,h:12},
        {label:"Leonie / 骑兵队\n击破触发撤退",type:"trigger",x:8,y:35,w:24,h:17}, {label:"桥面主战区",type:"danger",x:34,y:37,w:30,h:20},
        {label:"上方宝箱\nGoddess Icon",type:"loot",x:68,y:14,w:22,h:12}, {label:"Judith\n右上撤离口",type:"boss",x:69,y:40,w:23,h:16},
        {label:"Acheron\n随 Leonie 败退离场",type:"danger",x:68,y:70,w:23,h:13}
      ],
      source: "https://www.fe3h.com/chapters/crimson_flower/chapter_13"
    },
    {
      id: "cf-14", route: "Crimson Flower / 红花线", routeCode: "CF", month: "1月", moon: "守护节", chapter: 14,
      title: "The Master Tactician", mission: "Capturing Derdriu / 迪亚朵拉攻防战",
      objective: "击败 Claude", defeat: "Byleth 或 Edelgard 败退，或我军全灭", deployment: "我方 11 / 敌军 24（Maddening 初始；开战前另有舰队抵达）", fog: false,
      facts: [
        "第一次敌军阶段前，右侧四艘船靠岸，Nader 与 6 Bow Knights、5 Wyvern Lords 登场；第 2～6 回合上方船只还会出现可立即行动的 Wyvern Lord。",
        "Maddening 从第 4 回合起，左上、右上与下方城门隔回合增援；击败对应的三名门卫可分别停止增援。",
        "在战斗结束前击败全部三名门卫会额外获得 Talisman。",
        "Lysithea 被任何我方单位击败后可选择劝降并在战后加入；Claude 固守不动。"
      ],
      prep: [
        "给舰队方向配置弓箭手、飞行特效武器或强力魔法单位，第一轮就建立对空阵地",
        "让三支机动小队分别压制左上、右上和下方门卫，避免增援滚雪球",
        "若要招募 Lysithea，预留能稳定击败她且不会被周围 Warrior 反扑的单位",
        "携带高命中计策处理 Nader；其 Brave Axe 不适合用脆皮在敌方回合硬接"
      ],
      loot: ["敌 Paladin：Lampos Shield", "Nader：Aurora Shield", "三名门卫全击破：Talisman", "Hilda 可偷：Accuracy Ring", "Lysithea 可偷：Master Seal", "Claude 可偷：Hexlock Shield"],
      zones: [
        {label:"我方起点",type:"start",x:7,y:71,w:23,h:14}, {label:"下方门卫\nWarrior 增援",type:"trigger",x:36,y:78,w:26,h:12},
        {label:"左上门卫\nPaladin 增援",type:"trigger",x:7,y:10,w:23,h:13}, {label:"右上门卫\nSniper 增援",type:"trigger",x:69,y:10,w:23,h:13},
        {label:"Hilda / Lysithea",type:"danger",x:34,y:35,w:31,h:19}, {label:"靠岸舰队\nNader + 飞行军",type:"danger",x:69,y:38,w:24,h:24},
        {label:"Claude",type:"boss",x:38,y:8,w:24,h:14}
      ],
      source: "https://www.fe3h.com/chapters/crimson_flower/chapter_14"
    },
    {
      id: "cf-15", route: "Crimson Flower / 红花线", routeCode: "CF", month: "2月", moon: "天马节", chapter: 15,
      title: "Tempest of Swords and Shields", mission: "Protecting Garreg Mach / 加尔古·玛库防卫战",
      objective: "击败全部敌军指挥官", defeat: "Byleth 或 Edelgard 败退、我军全灭，或敌军占领防守点", deployment: "我方 11 / 敌军 20（Maddening 初始）", fog: false,
      facts: [
        "进入地图中部左侧范围会在中央建筑上方触发重甲、Hero、Warrior、Sniper、Warlock 与 Pegasus Knight 增援。",
        "进入中部右侧范围会令 Flayn 与其大队在中央及右侧森林出现；若 Seteth 已被击败，该批增援改在其起点附近出现。",
        "右侧 Warrior 小队计划火攻：不先击败他们，森林会在第 12 回合燃烧。",
        "在另一人尚存活时，由 Byleth 先击败 Seteth 或 Flayn，可让二人一同隐居而非死亡。"
      ],
      prep: [
        "至少留一名单位守住南侧防守点，尤其防范飞行敌军绕行",
        "分清左右触发区，不要两侧增援同时开启；先集中歼灭一波",
        "计划救下 Seteth 与 Flayn 时，让 Byleth 负责二人中的首次击破",
        "派高机动单位尽快处理右侧火攻 Warrior 小队"
      ],
      loot: ["Alois（若未招募）：Axe of Zoltan", "Flayn 可偷：Elixir", "特殊结果：Byleth 先击败 Seteth / Flayn 可使二人幸存"],
      zones: [
        {label:"我方起点 / 防守点",type:"start",x:38,y:79,w:25,h:12}, {label:"Alois / Onager",type:"boss",x:7,y:31,w:22,h:15},
        {label:"左侧触发区\n中央增援",type:"trigger",x:28,y:42,w:18,h:27}, {label:"右侧触发区\nFlayn 增援",type:"trigger",x:54,y:42,w:18,h:27},
        {label:"右侧火攻队\nT12 前击破",type:"danger",x:72,y:54,w:20,h:16}, {label:"Seteth / Shamir",type:"boss",x:38,y:8,w:25,h:15}
      ],
      source: "https://www.fe3h.com/chapters/crimson_flower/chapter_15"
    },
    {
      id: "cf-16", route: "Crimson Flower / 红花线", routeCode: "CF", month: "3月", moon: "孤月节", chapter: 16,
      title: "Lady of Deceit", mission: "The Siege of Arianrhod / 阿里安罗德攻城战",
      objective: "击败全部敌军指挥官", defeat: "Byleth 或 Edelgard 败退，或我军全灭", deployment: "我方 11 / 敌军 42（Maddening 初始）", fog: false,
      facts: [
        "本关没有敌军增援，压力来自密集守军、弩炮覆盖和大面积陷阱地板。",
        "地图有两处拉杆；分别操作后可把对应的陷阱地板转为普通地板。",
        "Cornelia 固守不动；Felix 与 Ingrid 若已招募，会由通用 Swordmaster 与 Falcon Knight 替代。",
        "Ingrid 持有 Lúin 且速度极高，可用长距离魔法先行引出，避免在陷阱区正面接战。"
      ],
      prep: [
        "部署至少一名高魔防诱饵或长射程魔法单位引出 Ingrid",
        "两翼各安排高机动单位操作拉杆，优先关闭陷阱再推进中央",
        "准备 Retribution、远程魔法或飞行单位处理弩炮与城内远程火力",
        "带一把 Chest Key 取得 Speedwing"
      ],
      loot: ["Gwendal：Brave Axe", "宝箱：Speedwing", "Ingrid / Felix / Rodrigue 可偷：Elixir ×3"],
      zones: [
        {label:"我方起点",type:"start",x:38,y:79,w:25,h:12}, {label:"左侧拉杆\n解除陷阱",type:"trigger",x:8,y:58,w:21,h:13},
        {label:"右侧拉杆\n解除陷阱",type:"trigger",x:71,y:58,w:21,h:13}, {label:"中央陷阱 / 弩炮区",type:"danger",x:31,y:33,w:38,h:29},
        {label:"宝箱\nSpeedwing",type:"loot",x:8,y:12,w:20,h:12}, {label:"Gwendal / Rodrigue",type:"boss",x:70,y:20,w:23,h:16},
        {label:"Cornelia",type:"boss",x:38,y:7,w:25,h:15}
      ],
      source: "https://www.fe3h.com/chapters/crimson_flower/chapter_16"
    },
    {
      id: "cf-17", route: "Crimson Flower / 红花线", routeCode: "CF", month: "4月", moon: "大树节", chapter: 17,
      title: "Field of Revenge", mission: "Combat at Tailtean Plains / 塔尔丁平原之战",
      objective: "击败全部敌军指挥官", defeat: "Byleth 或 Edelgard 败退，或我军全灭", deployment: "我方 10 / 敌军 22（Maddening 初始）", fog: false,
      facts: [
        "抵达桥区会触发首只 Demonic Beast，并令 Mercedes 与 4 名 Fortress Knights 在左上平台出现；之后她附近会隔回合产生飞马增援，击败 Mercedes 可停止。",
        "接下来的数回合，多名 Swordmaster / Paladin 会分批变为 Demonic Beast。",
        "接近 Dedue，或首次变身后经过 15 回合，Dedue 会变为 Demonic Beast，并在 Dimitri 附近出现 2 Paladins 与 2 Bow Knights。",
        "接近 Dimitri 的要塞，或击败全部 Demonic Beasts 后，Rhea 会率大队从我方起点方向包抄；击败 Rhea 后其增援会撤退。"
      ],
      prep: [
        "携带充足的大范围计策，按顺序破坏多只魔兽的障壁",
        "留一支后卫处理从我方起点出现的 Rhea 增援，避免全军压到北端",
        "尽快击败 Mercedes 停止左上飞行增援",
        "需要两个 Chest Key，分别获取上下宝箱的 Brave Bow 与 Brave Axe"
      ],
      loot: ["敌 Fortress Knight：Kadmos Shield", "Rhea 队 Gremory：Giant Shell", "上方宝箱：Brave Bow", "下方宝箱：Brave Axe", "Dedue / Mercedes / Sylvain / Dimitri 可偷：Vulnerary ×4"],
      zones: [
        {label:"我方起点\n后期 Rhea 增援",type:"start",x:37,y:79,w:27,h:13}, {label:"桥区\n首次魔兽化触发",type:"trigger",x:39,y:51,w:23,h:13},
        {label:"Mercedes\n飞马增援源",type:"danger",x:7,y:10,w:25,h:16}, {label:"上方宝箱\nBrave Bow",type:"loot",x:36,y:8,w:25,h:12},
        {label:"Dedue\n延时魔兽化",type:"danger",x:67,y:28,w:25,h:17}, {label:"Dimitri 要塞",type:"boss",x:68,y:7,w:24,h:15},
        {label:"下方宝箱\nBrave Axe",type:"loot",x:7,y:66,w:22,h:12}
      ],
      source: "https://www.fe3h.com/chapters/crimson_flower/chapter_17"
    },
    {
      id: "cf-18", route: "Crimson Flower / 红花线", routeCode: "CF", month: "4月（连续决战）", moon: "大树节", chapter: 18,
      title: "To the End of a Dream", mission: "The Fight for Fhirdiad / 菲尔迪亚决战",
      objective: "击败 The Immaculate One", defeat: "Byleth 或 Edelgard 败退，或我军全灭", deployment: "我方 12 / 敌军 49（Maddening 初始）", fog: false,
      facts: [
        "大面积城区已燃烧，火焰地形严重限制非飞行单位；左右两路通常比中央正面更安全。",
        "击败 Ashe 后左侧出现 3 Falcon Knights；击败 Gilbert 后右侧出现 3 Falcon Knights。",
        "抵达通向 The Immaculate One 的阶梯时，底部出现 4 Falcon Knights 与 2 Holy Knights。",
        "The Immaculate One 固守不动，并每 3 回合永久为全部 Golems 提升全能力 +3；拖延会让场面持续恶化。"
      ],
      prep: [
        "这是第 17 章后的连续决战：前一关结束前修理主力武器、补充回复品并整备骑士团",
        "优先部署飞行单位、可用 Physic 的治疗者与能连续破盾的计策",
        "两翼击败 Ashe / Gilbert 后立即处理各自的 Falcon Knight 增援",
        "为 Catherine 与最终魔兽准备高命中武器；不要让 Golems 获得过多轮永久强化"
      ],
      loot: ["Catherine：Thunderbrand", "下方宝箱：Speedwing", "上方宝箱：Prayer Ring", "Ashe 可偷：Vulnerary"],
      zones: [
        {label:"我方起点\n阶梯触发后方增援",type:"start",x:38,y:80,w:25,h:12}, {label:"左路 Ashe\n击破出飞马",type:"danger",x:7,y:48,w:24,h:17},
        {label:"右路 Gilbert\n击破出飞马",type:"danger",x:69,y:48,w:24,h:17}, {label:"燃烧中央城区",type:"danger",x:34,y:37,w:32,h:29},
        {label:"下方宝箱\nSpeedwing",type:"loot",x:9,y:70,w:21,h:11}, {label:"上方宝箱\nPrayer Ring",type:"loot",x:70,y:20,w:21,h:11},
        {label:"The Immaculate One\nGolem 强化源",type:"boss",x:37,y:7,w:27,h:17}
      ],
      source: "https://www.fe3h.com/chapters/crimson_flower/chapter_18"
    }
  ],

  SS: [
    {
      id: "ss-13", route: "Silver Snow / 银雪线", routeCode: "SS", month: "12月", moon: "星辰节", chapter: 13,
      title: "Reunion at Dawn", mission: "Hunting by Daybreak / 黎明追讨战",
      objective: "击败真正的 Pallardó", defeat: "Byleth 或 Seteth 败退，或我军全灭", deployment: "我方 2 / 敌军 39（Maddening 初始；友军分批归队）", fog: false,
      facts: [
        "本关没有出击准备画面；开战时仅 Byleth 与 Seteth，全部携带武器会自动恢复至满耐久。",
        "第 3 回合我方 Dorothea、Caspar 在左上，Petra 在左下登场；第 3 回合后推进到第 9 列，Ferdinand、Bernadetta、Linhardt 在右上登场。",
        "击败诱饵 Pallardó 后，真身会在原位置上方或下方出现；位置在章节开始时决定。",
        "这是软锁高风险关：只能使用学院篇原黑鹫学级的固定成员，战前应在第 12 章提前配置装备、技能与骑士团。"
      ],
      prep: [
        "第 12 章结束前给 Byleth、Seteth 与黑鹫原班成员配置自疗物品、轻武器和实用技能",
        "前几回合 Byleth 与 Seteth 靠拢，不要一次惊动中央大群盗贼",
        "等左侧三人登场后建立安全区，再向右推进触发其余三人",
        "准备收集四只宝箱；钥匙可由地图敌军掉落"
      ],
      loot: ["宝箱 A：Armorslayer", "宝箱 B：Silver Lance", "宝箱 C：Cursed Ashiya Sword", "宝箱 D：Axe of Ukonvasara", "Pallardó：Speed Ring", "敌军另掉落多把钥匙、Bullion、Blessed Bow 等补给"],
      zones: [
        {label:"Byleth + Seteth",type:"start",x:8,y:70,w:22,h:14}, {label:"T3：Dorothea / Caspar",type:"ally",x:7,y:9,w:25,h:14},
        {label:"T3：Petra",type:"ally",x:7,y:46,w:21,h:14}, {label:"越过第 9 列\n其余三人归队",type:"trigger",x:35,y:27,w:14,h:48},
        {label:"Ferdinand / Bernadetta / Linhardt",type:"ally",x:69,y:9,w:24,h:15}, {label:"中央盗贼密集区",type:"danger",x:34,y:35,w:32,h:27},
        {label:"Pallardó 诱饵 → 真身",type:"boss",x:69,y:59,w:23,h:17}, {label:"四处宝箱",type:"loot",x:37,y:8,w:25,h:13}
      ],
      source: "https://www.fe3h.com/chapters/silver_snow/chapter_13"
    },
    {
      id: "ss-14", route: "Silver Snow / 银雪线", routeCode: "SS", month: "1月", moon: "守护节", chapter: 14,
      title: "A King Without a Kingdom", mission: "Protecting Garreg Mach / 加尔古·玛库防卫战",
      objective: "初始为全灭敌军；火攻成功后改为击败 Randolph", defeat: "Byleth 败退、我军全灭，或敌军占领防守点", deployment: "我方 9 / 敌军 36（Maddening 初始）", fog: false,
      facts: [
        "第 1 回合右侧要塞出现友军 Swordmaster，并优先前往右侧 Onager 格；抵达后发动火攻。",
        "火攻会烧毁大片地形，使命中的敌军陷入一回合 Rattled，并停止下方飞行 / 骑兵增援。",
        "火攻前每个奇数回合从下方出现 2 Falcon Knights 与 1 Paladin。",
        "火攻后左侧大部分敌军开始推进；Randolph 通常固守，敌军少于 5 人时才主动移动。"
      ],
      prep: [
        "保护并用 Stride / Rescue 加速友军 Swordmaster，让火攻尽早成功",
        "守点单位携带对飞行特效武器，撑过火攻前的奇数回合增援",
        "火攻后用大范围计策收割中央聚集且 Rattled 的敌群",
        "给非飞行单位规划绕开燃烧地形的路线"
      ],
      loot: ["敌 Fortress Knight：Goddess Ring（Hard）", "敌 Sniper：Magic Bow", "敌 Paladin：Brave Lance", "额外战术收益：火攻命中敌军并停止奇数回合增援"],
      zones: [
        {label:"我方起点 / 防守点",type:"start",x:38,y:79,w:25,h:12}, {label:"下方奇数回合增援",type:"danger",x:38,y:66,w:25,h:12},
        {label:"友军 Swordmaster",type:"ally",x:73,y:57,w:19,h:13}, {label:"右 Onager\n火攻目标",type:"trigger",x:71,y:30,w:21,h:14},
        {label:"火攻燃烧区",type:"danger",x:31,y:31,w:38,h:30}, {label:"Randolph",type:"boss",x:7,y:8,w:24,h:15}
      ],
      source: "https://www.fe3h.com/chapters/silver_snow/chapter_14"
    },
    {
      id: "ss-15", route: "Silver Snow / 银雪线", routeCode: "SS", month: "2月", moon: "天马节", chapter: 15,
      title: "Valley of Torment", mission: "Ambush at Ailell / 阿利尔奇袭战",
      objective: "击败 Gwendal", defeat: "Byleth 败退，或我军全灭", deployment: "我方 9 / 敌军 31（Maddening 初始）", fog: false,
      facts: [
        "第 6 回合 Judith 作为友军在右上出现；Maddening 同时在北侧出现 1 Great Knight 与 2 Paladins。",
        "进入地图左侧后，Hard / Maddening 每隔一回合在 Gwendal 附近出现 2 Paladins、1 Fortress Knight、1 Sniper。",
        "与 Gwendal 相邻的部队被惊动，或北侧两名 Armored Knights 均被击败后，Gwendal 会主动移动。",
        "若学院篇曾招募 Ashe，击败他后可选择劝降，使其重新加入。"
      ],
      prep: [
        "地形火山口会持续损伤和限制移动，优先部署飞行单位与远程治疗者",
        "在第 6 回合前让 Byleth 靠近右上区域，及时与 Judith 对话取得 Energy Drop",
        "进入左侧触发区后直取 Gwendal，避免其附近增援持续堆积",
        "若要回收 Ashe，确保由可安全完成击破的单位处理并选择劝降"
      ],
      loot: ["Ashe：Killer Bow；可偷 Master Seal", "右宝箱：Bolt Axe", "左宝箱：Silver Shield", "Byleth 与 Judith 对话：Energy Drop", "Gwendal 可偷：Lampos Shield"],
      zones: [
        {label:"我方起点",type:"start",x:38,y:80,w:25,h:12}, {label:"熔岩 / 火山口",type:"danger",x:33,y:31,w:34,h:35},
        {label:"T6 Judith\n对话获 Energy Drop",type:"ally",x:69,y:8,w:24,h:16}, {label:"右宝箱\nBolt Axe",type:"loot",x:72,y:51,w:20,h:12},
        {label:"左宝箱\nSilver Shield",type:"loot",x:8,y:52,w:22,h:12}, {label:"左侧触发区\n循环增援",type:"trigger",x:7,y:26,w:27,h:23},
        {label:"Gwendal",type:"boss",x:7,y:8,w:24,h:15}
      ],
      source: "https://www.fe3h.com/chapters/silver_snow/chapter_15"
    },
    {
      id: "ss-16", route: "Silver Snow / 银雪线", routeCode: "SS", month: "3月", moon: "孤月节", chapter: 16,
      title: "The Rose-Colored River", mission: "The Great Bridge Coup / 密尔丁大桥之战",
      objective: "击败全部敌军指挥官", defeat: "Byleth 败退，或我军全灭", deployment: "我方 9 / 敌军 27（Maddening 初始）", fog: false,
      facts: [
        "靠近右下要塞会出现 Archer，并在之后每回合产生 Cavalier；击败要塞周围初始 4 名敌军可停止。",
        "Hard / Maddening 靠近右下要塞后，左侧会持续出现 Paladin；越过附近 L 形墙还会令 Ballista 格出现 Archer。",
        "越过第 17 列或靠近右下要塞，会在我方起点附近出现 Acheron 与护卫，但该批不能立即行动。",
        "惊动 Ferdinand 后，Lorenz 与法师小队在左上出现；学院篇招募过 Lorenz 时可击败后劝降。"
      ],
      prep: [
        "留一名强力单位看守起点，防止 Acheron 增援从后方夹击",
        "用飞行单位或 Stride 快速清理右下要塞的 4 名初始守军，停止 Cavalier 增援",
        "准备 Retribution 或远程火力处理 Ballista",
        "携带两把 Chest Key，回收 Critical Ring 与 Talisman"
      ],
      loot: ["上方宝箱：Critical Ring", "下方宝箱：Talisman", "敌 Paladin / Ferdinand 可偷：Master Seal", "Ladislava 可偷：Aurora Shield", "Acheron 可偷：Evasion Ring", "Lorenz 可偷：Master Seal；满足条件可劝降"],
      zones: [
        {label:"我方起点\nAcheron 后援",type:"start",x:7,y:72,w:23,h:14}, {label:"右下要塞\n循环骑兵增援",type:"trigger",x:70,y:67,w:23,h:17},
        {label:"L 形墙 / Ballista",type:"danger",x:57,y:49,w:22,h:14}, {label:"桥面主战区",type:"danger",x:33,y:36,w:34,h:20},
        {label:"Lorenz 增援",type:"danger",x:7,y:9,w:23,h:14}, {label:"上宝箱\nCritical Ring",type:"loot",x:38,y:8,w:22,h:12},
        {label:"下宝箱\nTalisman",type:"loot",x:38,y:76,w:22,h:11}, {label:"Ferdinand / Ladislava",type:"boss",x:70,y:12,w:23,h:17}
      ],
      source: "https://www.fe3h.com/chapters/silver_snow/chapter_16"
    },
    {
      id: "ss-17", route: "Silver Snow / 银雪线", routeCode: "SS", month: "5月（4月战局跳过）", moon: "竖琴节", chapter: 17,
      title: "The Impregnable Fortress", mission: "Taking Fort Merceus / 梅利赛乌斯攻防战",
      objective: "击败 Death Knight；若其逃脱则改为全灭敌军", defeat: "Byleth 败退，或我军全灭", deployment: "我方 9 / 敌军 37（Maddening 初始）", fog: false,
      facts: [
        "每回合会从四个生成点随机出现 Paladin、Armored Knight、Dark Mage 或 Fortress Knight；让友军在生成格停留一回合可封锁该点。",
        "敌军控制两座 Ballista 与一座 Fire Orb。",
        "Death Knight 在第 7 回合前不移动；第 7 回合目标变为阻止其到达左上撤离点，他会优先逃跑而非攻击。",
        "若 Death Knight 成功逃脱，胜利条件改为全灭剩余敌军。"
      ],
      prep: [
        "准备 Stride、Warp、Dance 等机动手段，在第 7 回合前建立截击路线",
        "安排耐久单位或飞行单位依次占住四个增援生成格",
        "用 Retribution、飞行突击或长射程魔法清理两座 Ballista 与 Fire Orb",
        "携带两把 Chest Key 取得 Aurora Shield 与 Speedwing"
      ],
      loot: ["敌 Swordmaster：Evasion Ring", "敌 Warrior：Brave Axe", "Death Knight：Dark Seal", "上方宝箱：Aurora Shield", "下方宝箱：Speedwing", "敌 Warrior 可偷：Elixir"],
      zones: [
        {label:"我方起点",type:"start",x:38,y:79,w:25,h:12}, {label:"四处增援生成格\n驻足可封锁",type:"trigger",x:8,y:39,w:22,h:28},
        {label:"Ballista ×2 / Fire Orb",type:"danger",x:34,y:31,w:33,h:25}, {label:"下方宝箱\nSpeedwing",type:"loot",x:71,y:69,w:21,h:12},
        {label:"上方宝箱\nAurora Shield",type:"loot",x:70,y:12,w:22,h:12}, {label:"T7 Death Knight\n向左上逃离",type:"boss",x:38,y:8,w:25,h:16},
        {label:"撤离点",type:"trigger",x:7,y:8,w:21,h:13}
      ],
      source: "https://www.fe3h.com/chapters/silver_snow/chapter_17"
    },
    {
      id: "ss-18", route: "Silver Snow / 银雪线", routeCode: "SS", month: "6月", moon: "花冠节", chapter: 18,
      title: "The Chaos of War", mission: "The Enbarr Infiltration / 安巴尔潜入战",
      objective: "击败全部敌军指挥官（Hubert 与 Death Knight）", defeat: "Byleth 败退，或我军全灭", deployment: "我方 10 / 敌军 43（Maddening 初始）", fog: false,
      facts: [
        "我军分成左右两队开场，敌军同时控制 Ballista 与 Onager。",
        "第 3 回合左上门出现 1 Demonic Beast；Hard 另有 3 Falcon Knights。第 6 回合或 Death Knight 被击败后，河流下方再出现 1 Demonic Beast 与 2 Falcon Knights。",
        "进入左下区域后，Hubert 附近出现 2 Warlocks；Hubert 固守不动，Death Knight 会主动移动。",
        "Seteth / Flayn 接近教会、Dorothea / Manuela 接近歌剧院，可在战后分别获得特殊骑士团。"
      ],
      prep: [
        "左右两组都配置独立治疗与开门能力，不要把所有支援集中在一侧",
        "携带反魔兽计策应对第 3 / 6 回合增援，并留意河边飞行敌军",
        "务必在本关出击准备中修理武器、补药并补充骑士团；下一章会立即连续开战",
        "需要特殊骑士团时，让对应角色靠近教会或歌剧院触发场景"
      ],
      loot: ["敌 Swordmaster：Wo Dao", "Death Knight：Dark Seal", "Hubert：Goddess Icon；可偷 Elixir", "上方宝箱：Brave Sword", "下方宝箱：Axe of Zoltan", "教会事件：Macuil Evil Repelling Co.", "歌剧院事件：Opera Co. Volunteers"],
      zones: [
        {label:"左侧出击队",type:"start",x:7,y:69,w:24,h:14}, {label:"右侧出击队",type:"start",x:69,y:69,w:24,h:14},
        {label:"T3 左上魔兽增援",type:"danger",x:7,y:8,w:23,h:14}, {label:"T6 河边增援",type:"danger",x:37,y:65,w:26,h:13},
        {label:"教会\nSeteth / Flayn",type:"trigger",x:68,y:28,w:24,h:14}, {label:"歌剧院\nDorothea / Manuela",type:"trigger",x:8,y:29,w:24,h:14},
        {label:"Death Knight",type:"boss",x:37,y:35,w:25,h:16}, {label:"Hubert / 左下 Warlock",type:"boss",x:8,y:49,w:24,h:16}
      ],
      source: "https://www.fe3h.com/chapters/silver_snow/chapter_18"
    },
    {
      id: "ss-19", route: "Silver Snow / 银雪线", routeCode: "SS", month: "6月（连续作战）", moon: "花冠节", chapter: 19,
      title: "Conclusion of the Crossing Roads", mission: "Confrontation at the Palace / 安巴尔宫城战",
      objective: "击败 Edelgard", defeat: "Byleth 败退，或我军全灭", deployment: "我方 10 / 敌军 46（Maddening 初始）", fog: false,
      facts: [
        "本关紧接第 18 章，无法返回修道院；会直接使用上一战选择的 10 名单位。",
        "第 3 回合 Dedue 作为友军从王座房右上入口登场；同回合敌军阶段右上房出现 1 Hero。",
        "进入王座房后，每隔两回合从左右上方楼梯各出现 1 Warrior 与 1 Warlock；让友军占住楼梯可封锁增援。",
        "Petra 第 2 回合开始移动；Edelgard 固守不动。敌军控制 Ballista 与 Fire Orb。"
      ],
      prep: [
        "在第 18 章出击准备时就按连续两战整备：修理主力武器、补齐回复品、恢复骑士团",
        "前一关的 10 名出击单位会继续参战，必须提前同时覆盖开门、治疗与远程反制",
        "携带或就地取得 Door Key，逐间清理并避开 Ballista / Fire Orb 交叉火力",
        "进入王座房后立刻占住两处楼梯，停止循环增援"
      ],
      loot: ["敌 Grappler / Dorothea / Petra：Door Key ×3", "敌 Gremory：Talisman", "右下宝箱：Giant Shell", "左下宝箱：Kadmos Shield", "上方宝箱：Silver Gauntlets", "Dorothea / Petra / Edelgard 可偷：Vulnerary ×3"],
      zones: [
        {label:"我方中央起点",type:"start",x:37,y:76,w:26,h:13}, {label:"左下宝箱\nKadmos Shield",type:"loot",x:8,y:69,w:23,h:12},
        {label:"右下宝箱\nGiant Shell",type:"loot",x:69,y:69,w:23,h:12}, {label:"Ballista / Fire Orb",type:"danger",x:34,y:42,w:32,h:19},
        {label:"T3 Dedue / Hero",type:"ally",x:68,y:10,w:24,h:15}, {label:"左右楼梯\n驻守封增援",type:"trigger",x:35,y:22,w:30,h:13},
        {label:"上方宝箱\nSilver Gauntlets",type:"loot",x:8,y:12,w:23,h:12}, {label:"Edelgard",type:"boss",x:38,y:7,w:24,h:15}
      ],
      source: "https://www.fe3h.com/chapters/silver_snow/chapter_19"
    },
    {
      id: "ss-20", route: "Silver Snow / 银雪线", routeCode: "SS", month: "7月", moon: "青海节", chapter: 20,
      title: "The City Without Light", mission: "Stand Strong at Shambhala / 香巴拉攻防战",
      objective: "击败 Thales", defeat: "Byleth 败退，或我军全灭", deployment: "我方 11 / 敌军 50（Maddening 初始）", fog: false,
      facts: [
        "任一我方单位越过第一层墙后，两座 Viskam 启动；击败右下隐藏房间的 Pittacus 可关闭。",
        "Viskam 启动后每隔一回合在南侧破墙附近生成 Titanus；击败左上隐藏房间的 Bias 可停止。",
        "第 10 回合中央建筑左右各出现 1 Assassin；他们会优先抢宝箱，再从左上逃离。",
        "打开中央房间才会显露 Thales；他可使用 Quake 攻击全体我军，最好同回合破门并击败。"
      ],
      prep: [
        "左右分队优先击败 Bias 与 Pittacus，分别停止 Titanus 增援和 Viskam",
        "准备多把 Door Key（敌军可掉落 4 把）与高机动开门单位",
        "在第 10 回合前开完或守住两只宝箱，阻止 Assassin 抢夺",
        "保留 Stride、Dance、Warp 等行动资源，中央门打开后同回合击败 Thales"
      ],
      loot: ["敌军掉落：Door Key ×4", "上方宝箱：Sword of Zoltan", "下方宝箱：Bow of Zoltan", "机关收益：击败 Bias 停止 Titanus；击败 Pittacus 关闭 Viskam"],
      zones: [
        {label:"我方起点",type:"start",x:38,y:80,w:25,h:12}, {label:"第一层墙\n越过启动 Viskam",type:"trigger",x:30,y:62,w:40,h:11},
        {label:"Viskam ×2",type:"danger",x:35,y:40,w:30,h:16}, {label:"左上隐藏房 Bias\n停止 Titanus",type:"boss",x:7,y:8,w:24,h:16},
        {label:"右下隐藏房 Pittacus\n关闭 Viskam",type:"boss",x:69,y:66,w:24,h:17}, {label:"T10 Assassin / 宝箱",type:"loot",x:70,y:12,w:22,h:12},
        {label:"Thales / Quake\n开门即斩首",type:"boss",x:38,y:7,w:25,h:17}
      ],
      source: "https://www.fe3h.com/chapters/silver_snow/chapter_20"
    },
    {
      id: "ss-21", route: "Silver Snow / 银雪线", routeCode: "SS", month: "8月", moon: "翠雨节", chapter: 21,
      title: "Following a Dream", mission: "The Final Battle / 最后的战斗",
      objective: "击败 The Immaculate One", defeat: "Byleth 败退，或我军全灭", deployment: "我方 12 / 敌军 42（Maddening 初始）", fog: false,
      facts: [
        "从第 2 回合起每隔 3 回合，底部 Heal Tile 生成 1 White Beast；让我方单位抵达该格可停止增援。",
        "停止 White Beast 增援后 The Immaculate One 会变身；对其攻击两次也会触发变身，Seteth 会在第一次攻击后警告。",
        "The Immaculate One 固守不动、弱剑；进入第二条生命时会恢复全部障壁。",
        "第二条生命中，她只会在敌方阶段使用 Staggering Blow；必须预留计策重新破盾并控制反击风险。"
      ],
      prep: [
        "第一目标是用飞行、Stride 或 Warp 抢占底部 Heal Tile，停止 White Beast 循环增援",
        "为每名主力配置骑士团，预留足量计策应对首领第二条生命的障壁重置",
        "携带高命中剑与破甲后的集中爆发手段；不要零散攻击提前触发变身",
        "准备至少两名远程治疗者与状态恢复手段，维持分队推进"
      ],
      loot: ["多名敌 Bishop 可偷：Silver Shield ×3", "多名敌军可偷：Hexlock Shield ×10", "额外机制奖励：占领底部 Heal Tile 后永久停止 White Beast 增援"],
      zones: [
        {label:"我方起点",type:"start",x:38,y:80,w:25,h:12}, {label:"底部 Heal Tile\n占领停止增援",type:"trigger",x:8,y:70,w:23,h:14},
        {label:"White Beast 推进区",type:"danger",x:22,y:48,w:28,h:20}, {label:"Seiros Crest 敌军群",type:"danger",x:51,y:42,w:39,h:24},
        {label:"The Immaculate One\n二血重置障壁",type:"boss",x:37,y:7,w:27,h:18}
      ],
      source: "https://www.fe3h.com/chapters/silver_snow/chapter_21"
    }
  ]
};
