window.FE3H_ROUTE_BATTLES_AM_VW = {
  AM: [
    {
      id: "am-13", route: "AM", month: "12月", moon: "星辰节", chapter: 13,
      title: "Reunion at Dawn", mission: "Hunting by Daybreak / 黎明追讨战",
      objective: "击败 Pallardó", defeat: "Byleth 或 Dimitri 败退，或我军全灭", deployment: "我方 2 / 敌军 39（Maddening；友军分批加入）", fog: false,
      facts: [
        "本章没有出击准备界面；Byleth 与 Dimitri 固定从东南角开场，仓库中的武器耐久会在战前全部修复。",
        "第 3 回合 Gilbert、Ashe 从西北加入，Mercedes、Annette 从西南加入；第 3 回合后越过第 9 列，Sylvain、Felix、Ingrid 从东北加入。",
        "击败诱饵 Pallardó 后，本体会在原位置上方或下方出现；出生方向在进入章节时已决定。"
      ],
      prep: ["在 Chapter 12 结束前整理青狮原班成员的武器、饰品和骑士团", "给 Byleth / Dimitri 准备高耐久武器与回复物品，避免早期分队冒进", "预留宝箱钥匙，等各方向同伴会合后再收四个宝箱"],
      loot: ["四个宝箱：Armorslayer、Silver Lance、Cursed Ashiya Sword、Axe of Ukonvasara", "Pallardó：Speed Ring；敌军另掉落 Blessed Bow、Hexlock Shield 等", "Dimitri 自动获得 King of Lions Corps；若 Pallardó 本体刷在北侧，对应增援另掉 Evasion Ring + Bullion"],
      zones: [
        {label:"Byleth / Dimitri",type:"start",x:70,y:72,w:23,h:16}, {label:"西北增援",type:"ally",x:6,y:9,w:21,h:13},
        {label:"西南增援",type:"ally",x:7,y:70,w:21,h:14}, {label:"东北增援",type:"ally",x:70,y:8,w:23,h:14},
        {label:"四处宝箱",type:"loot",x:34,y:34,w:30,h:22}, {label:"Pallardó 分身 / 本体",type:"boss",x:38,y:8,w:25,h:15}
      ], source: "https://www.fe3h.com/chapters/azure_moon/chapter_13"
    },
    {
      id: "am-14", route: "AM", month: "1月", moon: "守护节", chapter: 14,
      title: "The Delusional Prince", mission: "Protecting Garreg Mach / 加尔古·玛库防卫战",
      objective: "初始为全灭敌军；火攻成功后改为击败 Randolph", defeat: "Byleth 或 Dimitri 败退、我军全灭，或敌军占领防守点", deployment: "我方 10 / 敌军 36 / NPC 1（第 1 回合）", fog: false,
      facts: [
        "第 1 回合右侧据点出现 Swordmaster 友军并直奔右侧投石车格；抵达后发动火攻，大片区域燃烧且命中的敌军动摇 1 回合。",
        "奇数回合从南侧出现 2 Falcon Knight + 1 Paladin；火攻成功后停止。",
        "火攻后左侧大部队开始推进；Randolph 通常在敌军少于 5 人时移动。燃烧地形会限制非飞行单位。"
      ],
      prep: ["用飞兵、Stride 或 Warp 保护右侧 Swordmaster 的火攻路线", "在中央准备范围计策，利用火攻后的敌军聚集与动摇", "防守点留可靠单位，避免追击时被南侧增援偷占"],
      loot: ["敌 Sniper：Magic Bow", "敌 Paladin：Brave Lance", "Hard 难度的 Fortress Knight：Goddess Ring"],
      zones: [
        {label:"我方起点 / 防守点",type:"start",x:37,y:77,w:27,h:13}, {label:"南侧循环增援",type:"danger",x:38,y:62,w:25,h:12},
        {label:"Swordmaster 火攻路线",type:"ally",x:73,y:34,w:21,h:25}, {label:"右侧投石车格",type:"trigger",x:74,y:14,w:20,h:12},
        {label:"燃烧区域",type:"danger",x:18,y:28,w:47,h:27}, {label:"Randolph",type:"boss",x:7,y:8,w:23,h:14}
      ], source: "https://www.fe3h.com/chapters/azure_moon/chapter_14"
    },
    {
      id: "am-15", route: "AM", month: "2月", moon: "天马节", chapter: 15,
      title: "Valley of Torment", mission: "Ambush at Ailell / 阿利尔奇袭战",
      objective: "击败 Gwendal", defeat: "Byleth 或 Dimitri 败退，或我军全灭", deployment: "我方 10 / 敌军 31 / NPC 1（第 6 回合）", fog: false,
      facts: [
        "第 6 回合 Rodrigue 从东北出现；同回合 Maddening 还会在北部出现 1 Great Knight + 2 Paladin。",
        "进入地图西侧后，Hard/Maddening 每隔 2 回合在 Gwendal 附近出现 2 Paladin、1 Fortress Knight、1 Sniper。",
        "Gwendal 周边单位被惊动，或北部两名 Armored Knight 都被击败后，他会开始移动。"
      ],
      prep: ["飞行单位无视火焰地形，优先负责跨区救援与宝箱", "让 Byleth 靠近第 6 回合出现的 Rodrigue，交谈领取 Sword of Moralta", "准备 Steal 单位从 Gwendal 取得 Lampos Shield"],
      loot: ["右宝箱：Bolt Axe；左宝箱：Silver Shield", "Byleth 与 Rodrigue 交谈：Sword of Moralta；Gwendal 可偷 Lampos Shield", "战后自动获得 Areadbhar；敌 Archer 可偷 Master Seal"],
      zones: [
        {label:"我方起点",type:"start",x:65,y:73,w:27,h:14}, {label:"Rodrigue / 北部增援",type:"ally",x:70,y:7,w:23,h:15},
        {label:"熔岩分区",type:"danger",x:33,y:27,w:32,h:39}, {label:"左右宝箱",type:"loot",x:45,y:67,w:20,h:13},
        {label:"循环增援",type:"danger",x:6,y:34,w:21,h:14}, {label:"Gwendal",type:"boss",x:6,y:9,w:21,h:14}
      ], source: "https://www.fe3h.com/chapters/azure_moon/chapter_15"
    },
    {
      id: "am-16", route: "AM", month: "3月", moon: "孤月节", chapter: 16,
      title: "The Rose-Colored River", mission: "The Great Bridge Coup / 密尔丁大桥之战",
      objective: "击败所有敌军将领", defeat: "Byleth 或 Dimitri 败退，或我军全灭", deployment: "我方 10 / 敌军 27", fog: false,
      facts: [
        "接近东南要塞后，堡内先出现 Archer，之后每回合出现 Cavalier；消灭要塞附近最初的 4 名敌军可停止该组增援。",
        "越过东南 L 形墙或进入触发列后，Acheron 与 5 名部下在我方起点附近出现；Maddening 另有左侧 Paladin 持续增援。",
        "第 2 回合，若学院阶段完成 Dedue 外传，他会自动重新加入；惊动 Ferdinand 后，Lorenz 与 3 名部下从西北出现。"
      ],
      prep: ["留后卫处理 Acheron 的回头增援，主队不要全部压向大桥", "学院阶段已完成 Dedue 外传时，给他预留编成与装备空间", "准备 Steal：Ladislava 的 Aurora Shield、Acheron 的 Evasion Ring、Lorenz 的 Master Seal"],
      loot: ["上宝箱：Critical Ring；下宝箱：Talisman", "可偷：Aurora Shield、Evasion Ring、Master Seal", "学院阶段招募过 Lorenz 时，击败后选择劝降可让其重新加入"],
      zones: [
        {label:"我方起点 / Acheron 增援",type:"start",x:8,y:70,w:25,h:16}, {label:"西北 Lorenz 增援",type:"danger",x:7,y:7,w:23,h:14},
        {label:"大桥主线",type:"trigger",x:33,y:34,w:36,h:18}, {label:"上下宝箱",type:"loot",x:49,y:12,w:18,h:63},
        {label:"东南循环增援",type:"danger",x:72,y:66,w:22,h:17}, {label:"Ferdinand / Ladislava",type:"boss",x:69,y:8,w:25,h:16}
      ], source: "https://www.fe3h.com/chapters/azure_moon/chapter_16"
    },
    {
      id: "am-17", route: "AM", month: "4月", moon: "大树节", chapter: 17,
      title: "Blood of the Eagle and Lion", mission: "To War at Gronder / 古隆达兹会战",
      objective: "击败所有敌军将领", defeat: "Byleth 或 Dimitri 败退，或我军全灭", deployment: "我方 10 / 帝国军 22 / 联盟军 10", fog: false,
      facts: [
        "攻击任一联盟军、进入中央高台、接近东南、击败 Hubert/Petra 或惊动 Edelgard，会触发右侧 Leonie + 2 Sniper；除主动攻击联盟军外的触发还会令北侧出现 Hilda + 2 Pegasus Knight。",
        "击败 Petra（若已招募则为替代单位）会发动火攻，中央高台变为燃烧地形。",
        "被招募的敌对学生会由同职业泛用单位替代；Bernadetta 固守炮台，不会移动。"
      ],
      prep: ["不要让帝国与联盟互相消耗失控；进入中央前先排好两侧增援应对", "准备远程或飞兵处理中央高台的 Bernadetta", "携带 Steal：Edelgard、Claude 的 Master Seal，未招募 Lysithea 时可偷 Speed Ring"],
      loot: ["宝箱：Umbral Steel；Bernadetta：Brave Bow", "敌 Paladin：Lampos Shield", "可偷 Edelgard / Claude 的 Master Seal；未招募 Lysithea 时可偷 Speed Ring"],
      zones: [
        {label:"我方起点",type:"start",x:38,y:78,w:25,h:13}, {label:"中央高台 / 火攻",type:"trigger",x:39,y:39,w:23,h:18},
        {label:"帝国军",type:"danger",x:6,y:8,w:32,h:21}, {label:"联盟军",type:"danger",x:64,y:8,w:30,h:21},
        {label:"Leonie 增援",type:"danger",x:74,y:50,w:20,h:15}, {label:"Hilda 增援",type:"danger",x:43,y:5,w:18,h:12}
      ], source: "https://www.fe3h.com/chapters/azure_moon/chapter_17"
    },
    {
      id: "am-18", route: "AM", month: "5月", moon: "竖琴节", chapter: 18,
      title: "The King's Triumphant Return", mission: "Reclaiming the Capital / 王都夺还战",
      objective: "击败 Cornelia", defeat: "Byleth 或 Dimitri 败退，或我军全灭", deployment: "我方 12 / 敌军 40", fog: false,
      facts: [
        "我方进入地图中部后，两台 Viskam 启动并进行远程攻击。",
        "拉下东北角拉杆会关闭 Viskam，并削弱中央 Titanus。",
        "最左侧 Titanus 被击败且特定敌 Warlock 接近西北 Grappler 后，会出现携带 Tathlum Bow 的黄色 Sniper；他会优先逃往我方起点附近。"
      ],
      prep: ["用高机动单位先奔东北拉杆，其他人避开 Viskam 射线", "准备范围计策完整破坏 Titanus 护盾", "若要 Tathlum Bow，提前封住黄色 Sniper 向南逃跑的路线"],
      loot: ["黄色 Sniper：Tathlum Bow（需触发并在其逃走前击败）", "敌 Bishop：Elixir；Swordmaster：Wo Dao、Brave Sword", "关闭东北拉杆可停用 Viskam 并削弱中央 Titanus"],
      zones: [
        {label:"我方起点 / 逃脱点",type:"start",x:38,y:80,w:25,h:11}, {label:"Viskam 射线",type:"danger",x:28,y:43,w:45,h:18},
        {label:"中央 Titanus",type:"danger",x:40,y:35,w:22,h:19}, {label:"东北拉杆",type:"trigger",x:75,y:7,w:18,h:13},
        {label:"黄色 Sniper",type:"loot",x:7,y:27,w:21,h:15}, {label:"Cornelia",type:"boss",x:39,y:6,w:24,h:14}
      ], source: "https://www.fe3h.com/chapters/azure_moon/chapter_18"
    },
    {
      id: "am-19", route: "AM", month: "6月", moon: "花冠节", chapter: 19,
      title: "The Golden Deer's Plea", mission: "Saving Derdriu / 迪亚朵拉救援战",
      objective: "击败 Lord Arundel", defeat: "Byleth 或 Dimitri 败退、我军全灭，或 Claude 败退", deployment: "我方 11 / 敌军 35 / NPC 6", fog: false,
      facts: [
        "从第 1 回合起每 3 回合，北中门、左上门各出 1 Hero，左门出 1 Paladin；占领对应门可分别停止。Maddening 的东南另有 2 Paladin 同周期增援。",
        "Maddening 增援可立即行动；Claude 无法移动，Judith 会向 Claude 推进并沿途交战。",
        "若已招募 Hilda，她会由泛用女性 War Master 替代；只要 Judith 存活仍可取得生存奖励。"
      ],
      prep: ["用三支机动小队尽早压住各城门，阻止无限增援", "为 Claude 配置远程治疗或 Rescue，优先清掉能攻击他的敌军", "保护 Judith；Maddening 不要站在增援出生点攻击范围内"],
      loot: ["Hilda 与 Judith 均存活（已招募 Hilda 时仅需 Judith）：Giant Shell + Goddess Icon", "战后自动获得 Failnaught", "敌军掉落 Aurora Shield、Axe of Zoltan、Magic Bow、Silver Shield"],
      zones: [
        {label:"我方起点",type:"start",x:67,y:72,w:26,h:14}, {label:"Claude 固守",type:"ally",x:50,y:30,w:20,h:15},
        {label:"Judith 推进线",type:"ally",x:8,y:58,w:27,h:20}, {label:"三处循环增援门",type:"danger",x:8,y:7,w:52,h:16},
        {label:"东南 Maddening 增援",type:"danger",x:72,y:65,w:21,h:13}, {label:"Lord Arundel",type:"boss",x:72,y:8,w:21,h:14}
      ], source: "https://www.fe3h.com/chapters/azure_moon/chapter_19"
    },
    {
      id: "am-20", route: "AM", month: "7月", moon: "青海节", chapter: 20,
      title: "The Impregnable Fortress", mission: "Taking Fort Merceus / 梅利赛乌斯攻防战",
      objective: "击败 Death Knight", defeat: "Byleth 或 Dimitri 败退，或我军全灭", deployment: "我方 10 / 敌军 48", fog: false,
      facts: [
        "从第 3 回合起的奇数回合，东南出现 1 Paladin、西南出现 1 Dark Bishop；击败各自对应的初始敌人可停止该路增援。",
        "Death Knight 周边任一敌人被惊动后，他会开始移动。",
        "Caspar 与 Linhardt 若已招募，会被同职业泛用敌人替代；惊动 Linhardt 会令 Caspar 开始移动。"
      ],
      prep: ["第 3 回合前分兵清除南侧两名增援源敌人", "准备骑马特效与高命中计策控制 Death Knight", "携带 Chest Key 收取西侧两个宝箱"],
      loot: ["左上宝箱：Extra Large Bullion；左下宝箱：Black Pearl", "Caspar：Brave Axe", "Caspar / Linhardt 可偷 Elixir，Linhardt 另可偷 Vulnerary"],
      zones: [
        {label:"我方起点",type:"start",x:38,y:79,w:25,h:12}, {label:"西南 Dark Bishop 增援",type:"danger",x:8,y:71,w:23,h:14},
        {label:"东南 Paladin 增援",type:"danger",x:70,y:71,w:23,h:14}, {label:"西侧宝箱",type:"loot",x:7,y:15,w:22,h:37},
        {label:"中央炮台",type:"danger",x:39,y:35,w:24,h:17}, {label:"Death Knight",type:"boss",x:72,y:8,w:21,h:14}
      ], source: "https://www.fe3h.com/chapters/azure_moon/chapter_20"
    },
    {
      id: "am-21", route: "AM", month: "8月", moon: "翠雨节", chapter: 21,
      title: "Our Chosen Paths", mission: "Assault on Enbarr / 安巴尔总力战",
      objective: "击败 Hubert", defeat: "Byleth 或 Dimitri 败退，或我军全灭", deployment: "我方 12 / 敌军 53", fog: false,
      facts: [
        "第 3 回合起每 3 回合，歌剧院附近出现 Warlock；击败 Dorothea 后停止，但会立即出现两名 Assassin，3 回合后北侧再出现 2 Mortal Savant + 1 War Master（Hard/Maddening）。",
        "第 9 回合出现 3 只 Demonic Beast（普通难度较少）；进入西南区域还会启动持续 Warlock 增援，Maddening 并在 Hubert 附近追加 4 名强敌。",
        "Maddening 全部增援可立即行动；Petra 在我方进入南部后移动，Dorothea 操作 Fire Orb，Hubert 固守。"
      ],
      prep: ["让 Seteth/Flayn 访问教会、Dorothea/Manuela 访问歌剧院，以取得两组额外奖励", "在第 9 回合前准备范围计策应对三只魔兽", "谨慎触发西南区域，先清理远程炮台与增援落点"],
      loot: ["教会访问奖励：Macuil Evil Repelling Co. + Spirit Dust", "歌剧院访问奖励：Opera Co. Volunteers + Speedwing", "宝箱：Tomahawk、Bow of Zoltan；Petra：Sword of Zoltan"],
      zones: [
        {label:"我方起点",type:"start",x:38,y:80,w:25,h:11}, {label:"教会访问点",type:"loot",x:8,y:18,w:22,h:15},
        {label:"歌剧院访问点",type:"loot",x:70,y:18,w:23,h:15}, {label:"T9 魔兽增援",type:"danger",x:32,y:39,w:37,h:18},
        {label:"西南循环增援",type:"danger",x:7,y:67,w:24,h:17}, {label:"Hubert",type:"boss",x:39,y:7,w:23,h:14}
      ], source: "https://www.fe3h.com/chapters/azure_moon/chapter_21"
    },
    {
      id: "am-22", route: "AM", month: "8月", moon: "翠雨节", chapter: 22,
      title: "Oath of the Dagger", mission: "Clash at the Imperial Capital / 帝都决战",
      objective: "击败 Edelgard", defeat: "Byleth 或 Dimitri 败退，或我军全灭", deployment: "我方 12 / 敌军 54", fog: false,
      facts: [
        "Hegemon Edelgard 固守王座，拥有 30 格远程两次攻击且不会连续攻击同一单位；若 Dimitri 在范围内，其中一次会锁定他。Maddening 射程增至 32。",
        "进入王座室后中央楼梯出现 War Master，左右楼梯按 3 回合连续、2 回合停歇的周期持续出现 Dark Knight 与 War Master；清空王座室中央区域（Edelgard 与孤立 Bishop 除外）才停止。",
        "击败东侧 Myson 会令所有 Mysterious Soldier Warlock 撤退；Maddening 进入王座室当回合末另出现 2 Warlock + 2 Gremory。"
      ],
      prep: ["用高魔防、Retribution 或 Sacred Shield 管理 Edelgard 的超远程攻击", "优先突破东侧击败 Myson，减少术师压力", "开王座室前全员补满、清理两翼并准备堵住左右楼梯"],
      loot: ["左下宝箱：Elixir；右下宝箱：Talisman；上方宝箱：Energy Drop", "Myson 可偷 Hexlock Shield", "Maddening 的敌 Fortress Knight 可偷 Silver Shield"],
      zones: [
        {label:"我方起点",type:"start",x:38,y:82,w:25,h:10}, {label:"西侧推进线",type:"danger",x:7,y:39,w:27,h:28},
        {label:"东侧 Myson",type:"trigger",x:68,y:39,w:25,h:27}, {label:"王座室循环增援",type:"danger",x:29,y:8,w:43,h:22},
        {label:"三处宝箱",type:"loot",x:37,y:49,w:27,h:24}, {label:"Hegemon Edelgard",type:"boss",x:40,y:5,w:22,h:14}
      ], source: "https://www.fe3h.com/chapters/azure_moon/chapter_22"
    }
  ],

  VW: [
    {
      id: "vw-13", route: "VW", month: "12月", moon: "星辰节", chapter: 13,
      title: "Reunion at Dawn", mission: "Hunting by Daybreak / 黎明追讨战",
      objective: "击败 Pallardó", defeat: "Byleth 或 Claude 败退，或我军全灭", deployment: "我方 2 / 敌军 39（Maddening；友军分批加入）", fog: false,
      facts: [
        "本章没有出击准备界面；Byleth 与 Claude 固定从东南角开场，仓库中的武器耐久会在战前全部修复。",
        "第 3 回合 Lorenz、Ignatz 从西北加入，Hilda、Leonie 从西南加入；第 3 回合后越过第 9 列，Lysithea、Marianne、Raphael 从东北加入。",
        "击败诱饵 Pallardó 后，本体会在原位置上方或下方出现；出生方向在进入章节时已决定。"
      ],
      prep: ["在 Chapter 12 结束前整理金鹿原班成员的武器、饰品和骑士团", "给 Byleth / Claude 准备高耐久武器与回复物品，避免早期分队冒进", "预留宝箱钥匙，等各方向同伴会合后再收四个宝箱"],
      loot: ["四个宝箱：Armorslayer、Silver Lance、Cursed Ashiya Sword、Axe of Ukonvasara", "Pallardó：Speed Ring；敌军另掉落 Blessed Bow、Hexlock Shield 等", "Claude 自动携带 Failnaught 并获得 Immortal Corps；若 Pallardó 本体刷在北侧，对应增援另掉 Evasion Ring + Bullion"],
      zones: [
        {label:"Byleth / Claude",type:"start",x:70,y:72,w:23,h:16}, {label:"西北增援",type:"ally",x:6,y:9,w:21,h:13},
        {label:"西南增援",type:"ally",x:7,y:70,w:21,h:14}, {label:"东北增援",type:"ally",x:70,y:8,w:23,h:14},
        {label:"四处宝箱",type:"loot",x:34,y:34,w:30,h:22}, {label:"Pallardó 分身 / 本体",type:"boss",x:38,y:8,w:25,h:15}
      ], source: "https://www.fe3h.com/chapters/verdant_wind/chapter_13"
    },
    {
      id: "vw-14", route: "VW", month: "1月", moon: "守护节", chapter: 14,
      title: "The Alliance Leader's Ambitions", mission: "Protecting Garreg Mach / 加尔古·玛库防卫战",
      objective: "初始为全灭敌军；火攻成功后改为击败 Randolph", defeat: "Byleth 或 Claude 败退、我军全灭，或敌军占领防守点", deployment: "我方 10 / 敌军 36 / NPC 1（第 1 回合）", fog: false,
      facts: [
        "第 1 回合右侧据点出现 Swordmaster 友军并直奔右侧投石车格；抵达后发动火攻，大片区域燃烧且命中的敌军动摇 1 回合。",
        "奇数回合从南侧出现 2 Falcon Knight + 1 Paladin；火攻成功后停止。",
        "火攻后左侧大部队开始推进；Randolph 通常在敌军少于 5 人时移动。燃烧地形会限制非飞行单位。"
      ],
      prep: ["用飞兵、Stride 或 Warp 保护右侧 Swordmaster 的火攻路线", "在中央准备范围计策，利用火攻后的敌军聚集与动摇", "防守点留可靠单位，避免追击时被南侧增援偷占"],
      loot: ["敌 Sniper：Magic Bow", "敌 Paladin：Brave Lance", "Hard 难度的 Fortress Knight：Goddess Ring"],
      zones: [
        {label:"我方起点 / 防守点",type:"start",x:37,y:77,w:27,h:13}, {label:"南侧循环增援",type:"danger",x:38,y:62,w:25,h:12},
        {label:"Swordmaster 火攻路线",type:"ally",x:73,y:34,w:21,h:25}, {label:"右侧投石车格",type:"trigger",x:74,y:14,w:20,h:12},
        {label:"燃烧区域",type:"danger",x:18,y:28,w:47,h:27}, {label:"Randolph",type:"boss",x:7,y:8,w:23,h:14}
      ], source: "https://www.fe3h.com/chapters/verdant_wind/chapter_14"
    },
    {
      id: "vw-15", route: "VW", month: "2月", moon: "天马节", chapter: 15,
      title: "Valley of Torment", mission: "Ambush at Ailell / 阿利尔奇袭战",
      objective: "击败 Gwendal", defeat: "Byleth 或 Claude 败退，或我军全灭", deployment: "我方 10 / 敌军 31 / NPC 1（第 6 回合）", fog: false,
      facts: [
        "第 6 回合 Judith 从东北出现；同回合 Maddening 还会在北部出现 1 Great Knight + 2 Paladin。",
        "进入地图西侧后，Hard/Maddening 每隔 2 回合在 Gwendal 附近出现 2 Paladin、1 Fortress Knight、1 Sniper。",
        "Gwendal 周边单位被惊动，或北部两名 Armored Knight 都被击败后，他会开始移动；学院阶段招募过 Ashe 时，击败后可选择劝降。"
      ],
      prep: ["飞行单位无视火焰地形，优先负责跨区救援与宝箱", "让 Claude 靠近第 6 回合出现的 Judith，交谈领取 Energy Drop", "准备 Steal 单位从 Ashe 取得 Master Seal、从 Gwendal 取得 Lampos Shield"],
      loot: ["右宝箱：Bolt Axe；左宝箱：Silver Shield", "Claude 与 Judith 交谈：Energy Drop", "Ashe 可偷 Master Seal；Gwendal 可偷 Lampos Shield"],
      zones: [
        {label:"我方起点",type:"start",x:65,y:73,w:27,h:14}, {label:"Judith / 北部增援",type:"ally",x:70,y:7,w:23,h:15},
        {label:"熔岩分区",type:"danger",x:33,y:27,w:32,h:39}, {label:"左右宝箱",type:"loot",x:45,y:67,w:20,h:13},
        {label:"循环增援",type:"danger",x:6,y:34,w:21,h:14}, {label:"Gwendal",type:"boss",x:6,y:9,w:21,h:14}
      ], source: "https://www.fe3h.com/chapters/verdant_wind/chapter_15"
    },
    {
      id: "vw-16", route: "VW", month: "3月", moon: "孤月节", chapter: 16,
      title: "The Rose-Colored River", mission: "The Great Bridge Coup / 密尔丁大桥之战",
      objective: "击败所有敌军将领", defeat: "Byleth 或 Claude 败退，或我军全灭", deployment: "我方 10 / 敌军 27", fog: false,
      facts: [
        "接近东南要塞后，堡内先出现 Archer，之后每回合出现 Cavalier；消灭要塞附近最初的 4 名敌军可停止该组增援。",
        "越过东南 L 形墙或进入触发列后，Acheron 与 5 名部下在我方起点附近出现；Maddening 另有左侧 Paladin 持续增援。",
        "惊动 Ferdinand 后，西北出现 1 Paladin、2 Mage、1 Priest；Ferdinand 若已招募会由泛用 Paladin 替代。"
      ],
      prep: ["留后卫处理 Acheron 的回头增援，主队不要全部压向大桥", "优先关闭东南要塞的循环增援", "准备 Steal：Ladislava 的 Aurora Shield、Acheron 的 Evasion Ring、两枚 Master Seal"],
      loot: ["上宝箱：Critical Ring；下宝箱：Talisman", "可偷：Aurora Shield、Evasion Ring、Master Seal ×2", "敌将全部击破才胜利，不要漏掉回到起点的 Acheron"],
      zones: [
        {label:"我方起点 / Acheron 增援",type:"start",x:8,y:70,w:25,h:16}, {label:"西北敌军增援",type:"danger",x:7,y:7,w:23,h:14},
        {label:"大桥主线",type:"trigger",x:33,y:34,w:36,h:18}, {label:"上下宝箱",type:"loot",x:49,y:12,w:18,h:63},
        {label:"东南循环增援",type:"danger",x:72,y:66,w:22,h:17}, {label:"Ferdinand / Ladislava",type:"boss",x:69,y:8,w:25,h:16}
      ], source: "https://www.fe3h.com/chapters/verdant_wind/chapter_16"
    },
    {
      id: "vw-17", route: "VW", month: "4月", moon: "大树节", chapter: 17,
      title: "Blood of the Eagle and Lion", mission: "To War at Gronder / 古隆达兹会战",
      objective: "击败所有敌军将领", defeat: "Byleth 或 Claude 败退，或我军全灭", deployment: "我方 10 / 帝国军 22 / 王国军 10", fog: false,
      facts: [
        "攻击任一王国军、进入中央高台或接近东南，会触发北侧 Sylvain + 2 Paladin，以及右侧 Ingrid + 2 Fortress Knight。",
        "击败 Petra（若已招募则为替代单位）会发动火攻，中央高台变为燃烧地形。",
        "被招募的敌对学生会由同职业泛用单位替代；Bernadetta 固守炮台，不会移动。"
      ],
      prep: ["不要让帝国与王国互相消耗失控；进入中央前先排好两侧增援应对", "准备远程或飞兵处理中央高台的 Bernadetta", "携带 Steal：Dimitri、Edelgard 的 Master Seal，Dedue 的 Speed Ring"],
      loot: ["宝箱：Umbral Steel；Bernadetta：Brave Bow", "敌 Paladin：Lampos Shield", "可偷 Dimitri / Edelgard 的 Master Seal、Dedue 的 Speed Ring"],
      zones: [
        {label:"我方起点",type:"start",x:38,y:78,w:25,h:13}, {label:"中央高台 / 火攻",type:"trigger",x:39,y:39,w:23,h:18},
        {label:"帝国军",type:"danger",x:6,y:8,w:32,h:21}, {label:"王国军",type:"danger",x:64,y:8,w:30,h:21},
        {label:"Ingrid 增援",type:"danger",x:74,y:50,w:20,h:15}, {label:"Sylvain 增援",type:"danger",x:43,y:5,w:18,h:12}
      ], source: "https://www.fe3h.com/chapters/verdant_wind/chapter_17"
    },
    {
      id: "vw-18", route: "VW", month: "5月", moon: "竖琴节", chapter: 18,
      title: "The Golden Scheme", mission: "Taking Fort Merceus / 梅利赛乌斯攻防战",
      objective: "击败 Death Knight；第 7 回合起还须阻止其抵达西北逃脱点", defeat: "Byleth 或 Claude 败退，或我军全灭", deployment: "我方 10 / 敌军 48 / NPC 5（第 1 回合）", fog: false,
      facts: [
        "第 1 回合 Nader、2 Wyvern Rider、2 Cavalier 在 Claude 附近出现。",
        "每回合会从西北、北中、西南、南中随机出现 Paladin、Armored Knight、Dark Mage、Fortress Knight；友军在出生格停留 1 回合可封锁对应增援。",
        "Death Knight 第 7 回合开始移动，目标改为阻止其到达西北逃脱点；此后他优先逃跑而非攻击。"
      ],
      prep: ["用四名机动单位尽早占住增援出生格并保持 1 回合", "在第 7 回合前打通到 Death Knight 的路线，准备骑马特效与控制计策", "利用 Nader 小队吸引东北压力，但不要让其替你触发不利敌群"],
      loot: ["上宝箱：Aurora Shield；下宝箱：Speedwing", "Death Knight：Dark Seal；Caspar：Brave Axe", "敌 Swordmaster：Evasion Ring；Caspar 可偷 Elixir"],
      zones: [
        {label:"我方 / Nader 起点",type:"start",x:68,y:70,w:25,h:15}, {label:"西北逃脱点",type:"trigger",x:7,y:7,w:22,h:14},
        {label:"四处循环增援",type:"danger",x:25,y:47,w:51,h:27}, {label:"上下宝箱",type:"loot",x:55,y:12,w:18,h:58},
        {label:"炮台区",type:"danger",x:35,y:28,w:31,h:18}, {label:"Death Knight",type:"boss",x:70,y:8,w:23,h:15}
      ], source: "https://www.fe3h.com/chapters/verdant_wind/chapter_18"
    },
    {
      id: "vw-19", route: "VW", month: "6月", moon: "花冠节", chapter: 19,
      title: "The Chaos of War", mission: "The Enbarr Infiltration / 安巴尔潜入战",
      objective: "击败所有敌军将领", defeat: "Byleth 或 Claude 败退，或我军全灭", deployment: "我方 11 / 敌军 43", fog: false,
      facts: [
        "第 3 回合西北门出现 1 Demonic Beast，Hard/Maddening 另有 3 Falcon Knight。",
        "第 6 回合或击败 Death Knight 后，南侧河边出现 1 Demonic Beast + 2 Falcon Knight；进入西南区域还会在 Hubert 附近出现 2 Warlock。",
        "Hubert 固守不动；Death Knight 会主动移动。地图上有敌方 Ballista 与 Onager。"
      ],
      prep: ["让 Seteth/Flayn 访问教会、Dorothea/Manuela 访问歌剧院，以取得两支额外骑士团", "第 3 回合前安排反飞行单位守住西北", "进入西南 Hubert 区前先清理炮台并预留沉默/高魔防单位"],
      loot: ["教会访问奖励：Macuil Evil Repelling Co.", "歌剧院访问奖励：Opera Co. Volunteers", "上宝箱：Brave Sword；下宝箱：Axe of Zoltan；Death Knight：Dark Seal；Hubert：Goddess Icon"],
      zones: [
        {label:"我方起点",type:"start",x:38,y:80,w:25,h:11}, {label:"西北 T3 增援",type:"danger",x:7,y:8,w:24,h:16},
        {label:"教会访问点",type:"loot",x:70,y:16,w:22,h:14}, {label:"歌剧院访问点",type:"loot",x:69,y:57,w:23,h:15},
        {label:"南河 T6 增援",type:"danger",x:35,y:62,w:31,h:15}, {label:"Hubert / Death Knight",type:"boss",x:8,y:30,w:23,h:25}
      ], source: "https://www.fe3h.com/chapters/verdant_wind/chapter_19"
    },
    {
      id: "vw-20", route: "VW", month: "6月", moon: "花冠节", chapter: 20,
      title: "Conclusion of the Crossing Roads", mission: "Confrontation at the Palace / 皇宫决战",
      objective: "击败 Edelgard", defeat: "Byleth 或 Claude 败退，或我军全灭", deployment: "我方 11 / 敌军 46 / NPC 1（第 3 回合）", fog: false,
      facts: [
        "第 3 回合 Dedue 从王座室东北入口出现；同回合敌军阶段，东北房间出现 1 Hero。",
        "进入王座室后每 2 回合，左右楼梯各出现 1 Warrior / 1 Warlock；用我方单位占住楼梯格可封锁。",
        "Petra 第 2 回合开始移动；Edelgard 固守。地图有敌方 Ballista 与 Fire Orb。"
      ],
      prep: ["尽快开路让 Dedue 接近王座室，但不要依赖他单独承伤", "进入王座室前分配两名单位堵住左右楼梯", "准备 Door Key，并用高机动单位收取三处宝箱"],
      loot: ["右下宝箱：Giant Shell；左下宝箱：Kadmos Shield；上宝箱：Silver Gauntlets", "Dorothea、Petra 与 Grappler 掉落 Door Key", "Dorothea、Petra、Edelgard 均可偷 Vulnerary"],
      zones: [
        {label:"我方起点",type:"start",x:38,y:82,w:25,h:10}, {label:"西侧推进线",type:"danger",x:7,y:40,w:26,h:27},
        {label:"Dedue / 东北 Hero",type:"ally",x:69,y:16,w:23,h:19}, {label:"王座室楼梯增援",type:"danger",x:28,y:8,w:45,h:20},
        {label:"三处宝箱",type:"loot",x:37,y:49,w:27,h:24}, {label:"Edelgard",type:"boss",x:40,y:5,w:22,h:14}
      ], source: "https://www.fe3h.com/chapters/verdant_wind/chapter_20"
    },
    {
      id: "vw-21", route: "VW", month: "7月", moon: "青海节", chapter: 21,
      title: "The City Without Light", mission: "Stand Strong at Shambhala / 香巴拉强袭战",
      objective: "击败 Thales", defeat: "Byleth 或 Claude 败退，或我军全灭", deployment: "我方 12 / 敌军 50", fog: false,
      facts: [
        "任一我方越过第一层墙后，两台 Viskam 启动；击败东南隐藏房间的 Pittacus 可关闭。",
        "Viskam 启动后每隔 1 回合在南部破墙处出现 Titanus；击败西北隐藏房间的 Bias 可停止。第 10 回合中央两侧另出现 2 Assassin，优先抢宝箱后逃往西北。",
        "打开中央房间才显露 Thales；他可用 Quake 伤害全军，最好同一回合开门并击杀。"
      ],
      prep: ["准备 Door Key，并分两路先击败西北 Bias 与东南 Pittacus", "保留范围计策处理 Titanus，避免其持续堆积", "中央门开启前布置 Stride、Warp 与舞者，争取一回合击败 Thales"],
      loot: ["上宝箱：Sword of Zoltan；下宝箱：Bow of Zoltan", "多名敌军掉落 Door Key ×4", "击败 Bias 停止 Titanus 增援；击败 Pittacus 停用 Viskam"],
      zones: [
        {label:"我方起点",type:"start",x:38,y:80,w:25,h:11}, {label:"西北 Bias",type:"trigger",x:7,y:8,w:22,h:16},
        {label:"东南 Pittacus",type:"trigger",x:70,y:68,w:23,h:16}, {label:"南部 Titanus 增援",type:"danger",x:37,y:65,w:27,h:15},
        {label:"Viskam / 中央房",type:"danger",x:30,y:28,w:40,h:32}, {label:"Thales",type:"boss",x:40,y:7,w:22,h:14}
      ], source: "https://www.fe3h.com/chapters/verdant_wind/chapter_21"
    },
    {
      id: "vw-22", route: "VW", month: "8月", moon: "翠雨节", chapter: 22,
      title: "Fódlan's New Dawn", mission: "For the Freedom of Fódlan / 芙朵拉解放战",
      objective: "击败 Nemesis", defeat: "Byleth 或 Claude 败退，或我军全灭", deployment: "我方 12 / 敌军 53", fog: false,
      facts: [
        "十杰每存活 1 人，Nemesis 的全能力均提高 3；先逐个击败十杰可大幅削弱终章首领。",
        "击败北侧 Lamine 会把全图沼泽变为荒地；除 Lamine 外的十杰在所属敌群被惊动后会移动，Nemesis 受到攻击前不会移动。",
        "接近 Odesse 后每 3 回合在其左侧出现 1 Demonic Beast；击败 Odesse 会停止增援并令 Agarthan 士兵撤退。"
      ],
      prep: ["优先击败 Lamine 排干沼泽，再按区域清除十杰削弱 Nemesis", "用飞兵穿越沼泽，地面单位避免承受每回合减血与防御惩罚", "保留主力计策、Windsweep 等安全输出手段给 Nemesis"],
      loot: ["上宝箱：Arrow of Indra；右上宝箱：Secret Book；右下宝箱：Giant Shell", "击败 Lamine：沼泽全部变为荒地", "击败 Odesse：停止魔兽增援并清退 Agarthan 士兵"],
      zones: [
        {label:"我方起点",type:"start",x:38,y:80,w:25,h:11}, {label:"沼泽地带",type:"danger",x:15,y:43,w:70,h:29},
        {label:"Lamine / 排水",type:"trigger",x:39,y:7,w:22,h:15}, {label:"Odesse / 魔兽增援",type:"danger",x:7,y:35,w:24,h:18},
        {label:"十杰防线",type:"boss",x:15,y:18,w:70,h:24}, {label:"Nemesis",type:"boss",x:69,y:7,w:24,h:15}
      ], source: "https://www.fe3h.com/chapters/verdant_wind/chapter_22"
    }
  ]
};
