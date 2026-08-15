window.FE3H_PARALOGUE_DETAILS = (() => {
  const ALL_ROUTES = ["AM", "VW", "CF", "SS"];
  const source = (id) => `https://www.fe3h.com/paralogues/${id}`;
  const make = (key, data) => {
    const { sourceId = key, availability, parts, routeLimited, ...battle } = data;
    return {
      availability,
      parts,
      routeLimited,
      battle: {
        id: `pl-${key}`,
        arc: "PARALOGUE",
        month: "外传",
        chapter: "外传",
        fog: false,
        source: source(sourceId),
        ...battle
      }
    };
  };

  return {
    war_weak: make("war_weak", {
      sourceId: "war_for_the_weak",
      name: "弱者之战",
      title: "弱者之战 / War for the Weak",
      eyebrow: "第 6–11 章 · 青狮限定外传",
      mission: "在王国军主力抵达前，协助杜笃平定达斯卡人据点。",
      objective: "击败敌军指挥官",
      defeat: "Byleth、Dimitri 或 Dedue 败退；绿军击败敌将；或经过 15 回合",
      deployment: "我方 8 / 敌军 32–34 / 友军 7",
      availability: [{ routes: ["AM"], from: 6, to: 11 }],
      parts: [1],
      routeLimited: true,
      facts: [
        "这是一场与绿军竞速的战斗；敌将不会移动，也没有远程攻击手段。",
        "由我方击败的敌人数决定结算金块档位，敌将不计入击败数。",
        "必须完成此外传，Dedue 才能在 Azure Moon 第 16 章回归。"
      ],
      prep: ["准备 Stride、飞兵或 Warp 抢在绿军前收割敌军", "优先截断绿军通往敌将的路线", "在第 15 回合前完成斩首"],
      loot: [
        "基础奖励：Duscur Heavy Soldiers；敌军掉落 Steel Sword、Talisman Shield",
        "额外奖励（我方击败少于 10 / 10–19 / 至少 20 名敌军）：Bullion / Large Bullion / Extra Large Bullion"
      ],
      zones: [
        { label: "我方起点", type: "start", x: 37, y: 80, w: 25, h: 11 },
        { label: "绿军主力", type: "ally", x: 7, y: 62, w: 23, h: 14 },
        { label: "竞速战线", type: "trigger", x: 33, y: 42, w: 34, h: 12 },
        { label: "高价值敌群", type: "loot", x: 70, y: 28, w: 22, h: 14 },
        { label: "敌军指挥官", type: "boss", x: 38, y: 7, w: 24, h: 13 }
      ]
    }),

    true_chivalry: make("true_chivalry", {
      name: "真正的骑士道",
      title: "真正的骑士道 / True Chivalry",
      eyebrow: "第 8–11 章 · 外传",
      mission: "协助 Rodrigue 清剿盗贼，并掩护散布各处的村民撤离。",
      objective: "击败敌军指挥官",
      defeat: "Byleth、路线领袖、Felix 或 Rodrigue 败退，或我军全灭",
      deployment: "我方 11 / 敌军 33+持续增援 / 友军 11",
      availability: [{ routes: ALL_ROUTES, from: 8, to: 11 }],
      parts: [1],
      routeLimited: false,
      facts: [
        "村民存活数直接决定 Aegis Shield、金块和 Wo Dao 的奖励档位。",
        "右下与下方据点会持续出增援；击败据点上的 Armored Knight 可停止对应增援。",
        "Rodrigue 在我方接近前不会移动，Maddening 下很容易被集火击倒。"
      ],
      prep: ["配置飞兵、Stride 或 Warp 分头救援", "优先关闭右下和下方增援据点", "确保全部村民撤离后再斩首"],
      loot: [
        "基础奖励：Fraldarius Soldiers；敌军掉落 Door Key、Steel Sword",
        "额外奖励（3–4 名村民存活）：Wo Dao + Large Bullion",
        "额外奖励（全部村民存活）：Aegis Shield + Extra Large Bullion"
      ],
      zones: [
        { label: "我方起点", type: "start", x: 39, y: 82, w: 23, h: 10 },
        { label: "村民撤离线", type: "ally", x: 7, y: 30, w: 26, h: 30 },
        { label: "下方增援据点", type: "danger", x: 39, y: 66, w: 25, h: 12 },
        { label: "右下增援据点", type: "danger", x: 72, y: 70, w: 20, h: 12 },
        { label: "敌军指挥官", type: "boss", x: 40, y: 7, w: 22, h: 13 }
      ]
    }),

    forgotten: make("forgotten", {
      sourceId: "the_forgotten",
      name: "被遗忘的英雄",
      title: "被遗忘的英雄 / The Forgotten",
      eyebrow: "第 7–11 章 · 外传",
      mission: "包围 Gautier 领内的盗贼团，截回他们分散携带的赃物。",
      objective: "全灭敌军",
      defeat: "Byleth、路线领袖或 Sylvain 败退，或我军全灭",
      deployment: "我方 11 / 敌军 36",
      availability: [{ routes: ALL_ROUTES, from: 7, to: 11 }],
      parts: [1],
      routeLimited: false,
      facts: [
        "中央六名盗贼在第 4 回合或我方进入中央触发区后开始逃往出口。",
        "四名 Thief Leader 各守一个出口；击败守将即可封闭对应出口。",
        "从触发区外攻击不会启动逃跑 AI，可以先削弱或控制关键盗贼。"
      ],
      prep: ["四路布置机动单位封出口", "用远程攻击从触发区外先削弱中央盗贼", "确认所有携带奖励的盗贼均被截下再清场"],
      loot: [
        "基础奖励：Longbow、Gautier Knights；若此前未取得则获得 Lance of Ruin",
        "额外奖励（击败全部盗贼）：Extra Large Bullion + Talisman",
        "额外奖励（逐个击败携物盗贼）：Energy Drop、Magic Staff、Short Spear、Goddess Ring、Speedwings、Advanced Seal"
      ],
      zones: [
        { label: "我方包围起点", type: "start", x: 34, y: 78, w: 32, h: 12 },
        { label: "中央盗贼群\nT4 / 进入触发", type: "trigger", x: 35, y: 37, w: 30, h: 20 },
        { label: "西侧出口", type: "danger", x: 5, y: 35, w: 20, h: 13 },
        { label: "东侧出口", type: "danger", x: 75, y: 35, w: 20, h: 13 },
        { label: "北侧出口群", type: "boss", x: 35, y: 6, w: 30, h: 13 }
      ]
    }),

    land_golden_deer: make("land_golden_deer", {
      sourceId: "land_of_the_golden_deer",
      name: "金鹿之地",
      title: "金鹿之地 / Land of the Golden Deer",
      eyebrow: "第 7–11 章 · 外传",
      mission: "守住 Gloucester 领的防卫点，并击溃 Acheron 的军势。",
      objective: "击败敌军指挥官，或坚持 12 回合",
      defeat: "Byleth、路线领袖或 Lorenz 败退；我军全灭；或敌军进入防卫点",
      deployment: "我方 10 / 敌军 42",
      availability: [{ routes: ALL_ROUTES, from: 7, to: 11 }],
      parts: [1],
      routeLimited: false,
      facts: [
        "敌方飞兵会绕过前线直取防卫点，不能只沿正面推进。",
        "两名携物盗贼第 3 回合开始向南撤离；左侧盗贼会经过我方起点。",
        "Acheron 第 7 回合前不会移动，可用 Stride、飞兵或 Warp 快速斩首。"
      ],
      prep: ["在防卫点留下反飞兵单位", "第 3 回合前拦截两名携物盗贼", "若速通，准备高机动斩首组合"],
      loot: [
        "基础奖励：Gloucester Knights + Thyrsus",
        "额外奖励（击败左右两名逃跑盗贼）：Advanced Seal + Devil Sword"
      ],
      zones: [
        { label: "我方起点 / 防卫点", type: "start", x: 38, y: 80, w: 25, h: 12 },
        { label: "左侧盗贼", type: "loot", x: 9, y: 55, w: 20, h: 12 },
        { label: "右侧盗贼", type: "loot", x: 72, y: 48, w: 19, h: 12 },
        { label: "飞兵绕后线", type: "danger", x: 68, y: 22, w: 25, h: 14 },
        { label: "Acheron", type: "boss", x: 38, y: 7, w: 24, h: 13 }
      ]
    }),

    rumored_nuptials: make("rumored_nuptials", {
      name: "传闻中的婚约",
      title: "传闻中的婚约 / Rumored Nuptials",
      eyebrow: "第 7–11 章 · 外传",
      mission: "护送 Ingrid 穿过火山地带抵达撤离点，或肃清伏兵。",
      objective: "全灭敌军，或让 Ingrid 抵达目标地点",
      defeat: "Byleth、路线领袖、Dorothea 或 Ingrid 败退，或我军全灭",
      deployment: "我方 9 / 敌军 26+20+持续增援",
      availability: [{ routes: ALL_ROUTES, from: 7, to: 11 }],
      parts: [1],
      routeLimited: false,
      facts: [
        "准备界面不会显示大多数初始敌军，推进会在治疗地形、宝箱和撤离点附近触发伏兵。",
        "Merchant 存活时会周期性生成 Thief；击败他可停止该组无限增援。",
        "火山坑地形每回合造成 20% HP 伤害，但不会把单位降到 1 HP 以下。"
      ],
      prep: ["给 Ingrid 配置机动力与抗打击手段", "先击败 Merchant 停止无限增援", "准备两把 Chest Key 并预留后卫处理起点伏兵"],
      loot: [
        "基础奖励：Ingrid 已招募时获得 Galatea Pegasus Co. + Luín；Dorothea 已招募时获得 Goddess Ring",
        "额外奖励（开启左右宝箱及击败携物敌人）：Killer Axe、Healing Staff、Prayer Ring、Devil Axe、Antitoxin x2"
      ],
      zones: [
        { label: "我方起点", type: "start", x: 8, y: 78, w: 22, h: 12 },
        { label: "Merchant\n无限增援源", type: "boss", x: 42, y: 40, w: 22, h: 15 },
        { label: "左宝箱 / 治疗地形伏兵", type: "loot", x: 8, y: 25, w: 24, h: 15 },
        { label: "右宝箱 / 起点伏兵触发", type: "trigger", x: 68, y: 24, w: 24, h: 15 },
        { label: "Ingrid 撤离点\n六人伏兵", type: "danger", x: 72, y: 75, w: 20, h: 13 }
      ]
    }),

    death_toll: make("death_toll", {
      name: "死亡丧钟",
      title: "死亡丧钟 / Death Toll",
      eyebrow: "第 8–11 章 · 外传",
      mission: "穿过桥梁与魔兽封锁，救援商队并击败敌军首领。",
      objective: "击败敌军指挥官",
      defeat: "Byleth、路线领袖、Raphael 或 Ignatz 败退，或我军全灭",
      deployment: "我方 11 / 敌军 32 / 友军 5",
      availability: [{ routes: ALL_ROUTES, from: 8, to: 11 }],
      parts: [1],
      routeLimited: false,
      facts: [
        "商人存活数决定金块、Short Axe、Short Spear 与 Killer Bow 奖励。",
        "右下 Giant Wolf 在整备画面中不可见，开战后才出现。",
        "地图有可操作吊桥；提前分配能迅速接近商队的机动单位。"
      ],
      prep: ["用飞兵或远程火力尽快支援五名商人", "携带范围计策处理 Giant Wolf", "操作吊桥缩短主队与友军的距离"],
      loot: [
        "基础奖励：Raphael 已招募时 Leicester Mercenaries；Ignatz 已招募时 Victor Private Military",
        "额外奖励（至少一名商人存活）：Bullion + Short Axe",
        "额外奖励（全部商人存活）：Extra Large Bullion + Short Spear + Killer Bow"
      ],
      zones: [
        { label: "我方起点", type: "start", x: 38, y: 81, w: 24, h: 11 },
        { label: "商队", type: "ally", x: 8, y: 19, w: 24, h: 18 },
        { label: "吊桥", type: "trigger", x: 38, y: 46, w: 24, h: 12 },
        { label: "隐藏 Giant Wolf", type: "danger", x: 72, y: 71, w: 20, h: 13 },
        { label: "敌军指挥官", type: "boss", x: 69, y: 8, w: 23, h: 13 }
      ]
    }),

    falling_heaven: make("falling_heaven", {
      sourceId: "falling_short_of_heaven",
      name: "未能抵达的天境",
      title: "未能抵达的天境 / Falling Short of Heaven",
      eyebrow: "第 9–11 章 · 外传",
      mission: "保护 Rhea，在十回合内击溃西方教会伏兵。",
      objective: "全灭敌军，或坚持 10 回合",
      defeat: "Byleth、路线领袖、Ashe、Catherine 或 Rhea 败退，或我军全灭",
      deployment: "我方 11 / 敌军 26+15 / 友军 1",
      availability: [{ routes: ALL_ROUTES, from: 9, to: 11 }],
      parts: [1],
      routeLimited: false,
      facts: [
        "右侧 Pegasus Knight 在第 3、6、9 回合出现，击败右下 Bishop 可停止。",
        "左侧 Assassin 在第 5、8 回合出现，击败左上 Bishop 可停止。",
        "Rhea 不会移动；只要她从未进入战斗，结算时可获得 Shoes of the Wind。"
      ],
      prep: ["让 Rhea 留在安全区且不进入任何战斗", "左右分兵尽早击败两个增援源 Bishop", "准备反飞兵与高命中单位处理增援"],
      loot: [
        "基础奖励：Critical Ring + Umbral Steel x1；Ashe 已招募时获得 Gaspard Knights",
        "额外奖励（Rhea 从未进入战斗）：Shoes of the Wind",
        "额外奖励（击败携物敌军）：Torch、Secret Book、Steel Shield"
      ],
      zones: [
        { label: "我方起点", type: "start", x: 37, y: 81, w: 26, h: 11 },
        { label: "Rhea 防守点", type: "ally", x: 39, y: 58, w: 22, h: 13 },
        { label: "左侧 Assassin 增援", type: "danger", x: 5, y: 25, w: 25, h: 15 },
        { label: "右侧飞兵增援", type: "danger", x: 70, y: 27, w: 25, h: 15 },
        { label: "两侧 Bishop 增援源", type: "boss", x: 31, y: 7, w: 38, h: 13 }
      ]
    }),

    tales_red_canyon: make("tales_red_canyon", {
      sourceId: "tales_of_the_red_canyon",
      name: "赤红谷传说",
      title: "赤红谷传说 / Tales of the Red Canyon",
      eyebrow: "第 8–10 章 · 外传",
      mission: "重返 Zanado，突破魔兽群并调查 Sothis 的记忆。",
      objective: "击败敌军指挥官",
      defeat: "Byleth 或路线领袖败退，或我军全灭",
      deployment: "我方 10 / 敌军 7+3–6",
      availability: [{ routes: ALL_ROUTES, from: 8, to: 10 }],
      parts: [1],
      routeLimited: false,
      facts: [
        "全图敌军均为魔兽；不同触发顺序会从左侧或右上生成 Giant Bird / Giant Wolf。",
        "Giant Wolf 完整破盾会掉落用于勇者武器的 Wootz Steel。",
        "首领不会移动且缺少三格反击手段，可用三射程安全削血。"
      ],
      prep: ["带足范围计策争取完整破盾", "准备三射程武器或法术安全处理首领", "让高防单位承受增援魔兽的第一轮"],
      loot: [
        "基础奖励：Divine Pulse 使用次数 +3 + Umbral Steel x1",
        "额外奖励（开启宝箱）：Knowledge Gem",
        "额外奖励（完整击破 Giant Wolf 护盾）：Wootz Steel"
      ],
      zones: [
        { label: "我方起点", type: "start", x: 38, y: 81, w: 24, h: 11 },
        { label: "Knowledge Gem 宝箱", type: "loot", x: 8, y: 56, w: 22, h: 12 },
        { label: "Giant Wolf 群", type: "danger", x: 12, y: 24, w: 25, h: 17 },
        { label: "右上 Giant Bird 增援", type: "trigger", x: 69, y: 9, w: 24, h: 15 },
        { label: "Wild Demonic Beast", type: "boss", x: 40, y: 37, w: 22, h: 17 }
      ]
    }),

    cursed_relic: make("cursed_relic", {
      sourceId: "a_cursed_relic",
      name: "被诅咒的遗产",
      title: "被诅咒的遗产 / A Cursed Relic",
      eyebrow: "第 8–11 章 · DLC 外传",
      mission: "保护 Duke Gerth，阻止 Agarthan 部队夺走英雄遗产。",
      objective: "全灭敌军",
      defeat: "Byleth、路线领袖、Yuri、Constance 或 Duke Gerth 败退，或我军全灭",
      deployment: "我方 10 / 敌军 25+17 / 友军 1",
      availability: [{ routes: ALL_ROUTES, from: 8, to: 11 }],
      parts: [1],
      routeLimited: false,
      facts: [
        "盗贼与 Duke Gerth 交战后会变成 Demonic Beast；先由我方击败可阻止变身。",
        "我方停在 Gerth 两格内或击败 Myson 会在全图触发大批增援。",
        "Myson 与其周围部队会在增援出现后或被惊动后开始推进。"
      ],
      prep: ["准备 Warp、Rescue、飞兵或远程治疗尽快支援 Gerth", "先清除接近 Gerth 的盗贼再触发增援", "保留范围计策处理变身魔兽与密集增援"],
      loot: [
        "基础奖励：Fetters of Dromi",
        "额外奖励（Constance 已招募）：Nuvelle Fliers Corps",
        "额外奖励（Yuri 已招募）：Mockingbird's Thieves"
      ],
      zones: [
        { label: "我方起点", type: "start", x: 38, y: 82, w: 24, h: 10 },
        { label: "Duke Gerth", type: "ally", x: 40, y: 47, w: 21, h: 13 },
        { label: "变身盗贼推进线", type: "danger", x: 16, y: 31, w: 25, h: 16 },
        { label: "Gerth 两格 / Myson\n增援触发", type: "trigger", x: 60, y: 35, w: 31, h: 17 },
        { label: "Myson", type: "boss", x: 71, y: 8, w: 20, h: 13 }
      ]
    }),

    black_market: make("black_market", {
      sourceId: "black_market_scheme",
      name: "黑市商人的计划",
      title: "黑市商人的计划 / Black Market Scheme",
      eyebrow: "第 7–11 章 · DLC 外传",
      mission: "让分散在 Enbarr 黑市各区的小队会合，并歼灭 Baron Ochs 的部队。",
      objective: "全灭敌军",
      defeat: "Byleth、路线领袖、Balthus 或 Hapi 败退，或我军全灭",
      deployment: "我方 10 / 敌军 26+26",
      availability: [{ routes: ALL_ROUTES, from: 7, to: 11 }],
      parts: [1],
      routeLimited: false,
      facts: [
        "我军分散在多个孤立区域；第 5 回合或小队离开起始区时，各处同时出现大批增援。",
        "Baron Ochs 被击败后会变成 Forlorn Beast，战斗不会立即结束。",
        "Ochs 与附近两名 Warlock 会在其中任何一人被惊动后同时推进。"
      ],
      prep: ["弱单位配置防御副官或回避装备", "逐区建立能独立撑过一轮增援的小组", "保留计策和爆发处理 Ochs 的魔兽阶段"],
      loot: [
        "基础奖励：Vajra-Mushti",
        "额外奖励（Balthus 已招募）：Leicester Dicers Corps",
        "额外奖励（Hapi 已招募）：Timotheos Magi Corps"
      ],
      zones: [
        { label: "分散起点 A", type: "start", x: 7, y: 70, w: 21, h: 14 },
        { label: "分散起点 B", type: "start", x: 70, y: 72, w: 22, h: 14 },
        { label: "T5 / 离区\n全图增援", type: "trigger", x: 36, y: 41, w: 28, h: 16 },
        { label: "歌剧院 / 教会增援", type: "danger", x: 13, y: 14, w: 28, h: 16 },
        { label: "Baron Ochs\n→ Forlorn Beast", type: "boss", x: 67, y: 10, w: 27, h: 17 }
      ]
    }),

    dividing_world: make("dividing_world", {
      sourceId: "dividing_the_world",
      name: "分隔世界",
      title: "分隔世界 / Dividing the World",
      eyebrow: "第 10–18 章 · 跨时跳外传",
      mission: "支援 Fódlan's Locket 的守军，阻止 Almyran 部队突破防线。",
      objective: "全灭敌军",
      defeat: "Byleth、路线领袖、Hilda 或 Cyril 败退；友军全灭；或防卫点被占领",
      deployment: "我方 11 / 敌军 28 / 友军 4",
      availability: [
        { routes: ["AM", "VW"], from: 10, to: 18 },
        { routes: ["SS"], from: 12, to: 18 }
      ],
      parts: [1, 2],
      routeLimited: true,
      facts: [
        "这是唯一横跨时跳前后的外传；敌军配置不会随第一部或第二部改变。",
        "第一部只要求 Hilda 已招募；第二部还必须招募并保住 Cyril。",
        "友军存活数决定 Large Bullion 与 Hexlock Shield 奖励。"
      ],
      prep: ["给四名守军安排远程治疗或飞兵救援", "保留单位守住防卫点", "在时跳前完成可降低角色招募要求"],
      loot: [
        "基础奖励：Goneril Valkyries + Freikugel",
        "额外奖励（至少两名守军存活）：Large Bullion",
        "额外奖励（全部守军存活）：Hexlock Shield；Cyril 已招募时另得 Almyra Mercenaries"
      ],
      zones: [
        { label: "我方起点 / 防卫点", type: "start", x: 38, y: 81, w: 25, h: 11 },
        { label: "Goneril 守军", type: "ally", x: 8, y: 35, w: 24, h: 22 },
        { label: "东侧压境部队", type: "danger", x: 69, y: 43, w: 24, h: 16 },
        { label: "中央关隘", type: "trigger", x: 37, y: 40, w: 27, h: 14 },
        { label: "Almyran 指挥群", type: "boss", x: 37, y: 7, w: 27, h: 14 }
      ]
    }),

    face_beneath: make("face_beneath", {
      sourceId: "the_face_beneath",
      name: "面具之下",
      title: "面具之下 / The Face Beneath",
      eyebrow: "第 15–19 章 · 非红花外传",
      mission: "救援被隔离的 Mercedes 与 Caspar，并清除 Death Knight 之外的敌军。",
      objective: "全灭 Death Knight 以外的敌军",
      defeat: "Byleth、路线领袖、Mercedes 或 Caspar 败退，或我军全灭",
      deployment: "我方 11 / 敌军 30+9",
      availability: [
        { routes: ["SS"], from: 15, to: 16 },
        { routes: ["VW"], from: 15, to: 17 },
        { routes: ["AM"], from: 15, to: 19 }
      ],
      parts: [2],
      routeLimited: true,
      facts: [
        "第 10 回合，或其他我方停在 Mercedes / Caspar 三格内，会触发左、右上与 Death Knight 上方的九名增援。",
        "胜利不要求击败 Death Knight，但由 Caspar 亲手击败才能获得 Scythe of Sariel。",
        "保持主力在两人四格外，可延后增援并争取整备时间。"
      ],
      prep: ["给 Caspar 准备高威力斧和 Helm Splitter 等爆发", "用 Warp、Stride 或飞兵隔绝接近两人的敌军", "准备 Chest Key 获取左下宝箱"],
      loot: [
        "基础奖励：Church Soldiers、Bergliez War Group、Rafail Gem",
        "额外奖励（Caspar 击败 Death Knight）：Scythe of Sariel；Death Knight 另掉 Dark Seal，可偷 Accuracy Ring 与 Elixir",
        "额外奖励（左下宝箱）：Umbral Steel x1"
      ],
      zones: [
        { label: "主队起点", type: "start", x: 38, y: 81, w: 25, h: 11 },
        { label: "Mercedes / Caspar", type: "ally", x: 39, y: 47, w: 24, h: 14 },
        { label: "左下宝箱", type: "loot", x: 8, y: 71, w: 20, h: 12 },
        { label: "T10 / 接近三格\n三向增援", type: "trigger", x: 8, y: 20, w: 84, h: 15 },
        { label: "Death Knight", type: "boss", x: 39, y: 8, w: 23, h: 13 }
      ]
    }),

    legend_lake: make("legend_lake", {
      sourceId: "legend_of_the_lake",
      name: "湖水的传说",
      title: "湖水的传说 / Legend of the Lake",
      eyebrow: "第 15–22 章 · 雾战外传",
      mission: "在迷雾笼罩的湖区击败 The Immovable，并搜取三处宝箱。",
      objective: "击败 The Immovable",
      defeat: "Byleth、路线领袖、Linhardt 或 Leonie 败退，或我军全灭",
      deployment: "我方 11 / 敌军 25+持续增援",
      fog: true,
      availability: [
        { routes: ["CF"], from: 15, to: 17 },
        { routes: ["SS", "AM"], from: 15, to: 21 },
        { routes: ["VW"], from: 15, to: 22 }
      ],
      parts: [2],
      routeLimited: false,
      facts: [
        "本关有战争迷雾；The Immovable 不会移动，并造成魔法伤害。",
        "第 2、3、4 回合分别从左上、右上宝箱附近、右下生成增援，此后三回合循环无限重复。",
        "Crimson Flower 第 15 章后必须让 Seteth 与 Flayn 撤退而非死亡，否则此外传消失。"
      ],
      prep: ["携带 Torch，并让高魔防单位探路", "安排机动单位同步开启中央与右上三宝箱", "准备范围计策完整击破首领护盾"],
      loot: [
        "基础奖励：The Inexhaustible、Hevring Prayer Troops、Sauin Militia",
        "额外奖励（开启三处宝箱）：Short Axe、Extra Large Bullion、Umbral Steel x1",
        "额外奖励（击败携物 Warlock）：Spirit Dust"
      ],
      zones: [
        { label: "我方起点", type: "start", x: 38, y: 81, w: 24, h: 11 },
        { label: "中央宝箱", type: "loot", x: 39, y: 52, w: 22, h: 12 },
        { label: "右上双宝箱 / T3 增援", type: "loot", x: 68, y: 16, w: 25, h: 16 },
        { label: "三向循环增援", type: "danger", x: 7, y: 18, w: 24, h: 17 },
        { label: "The Immovable", type: "boss", x: 39, y: 7, w: 23, h: 14 }
      ]
    }),

    retribution: make("retribution", {
      name: "因果报应",
      title: "因果报应 / Retribution",
      eyebrow: "第 17–21 章 · 非红花外传",
      mission: "平定 Hrym 领暴动，抢在暴徒洗劫前救下四个村庄。",
      objective: "全灭敌军",
      defeat: "Byleth、路线领袖、Ferdinand 或 Lysithea 败退，或我军全灭",
      deployment: "我方 11 / 敌军 57+持续增援",
      availability: [
        { routes: ["SS"], from: 17, to: 20 },
        { routes: ["AM", "VW"], from: 17, to: 21 }
      ],
      parts: [2],
      routeLimited: true,
      facts: [
        "奇数回合生成 Assassin、偶数回合生成 Wyvern Rider；击败 Grappler 与 Swordmaster 两名指挥官可停止。",
        "击败 Grappler 可保住左侧两村，击败 Swordmaster 可保住右侧两村。",
        "两名指挥官均不会移动；击败他们后地图下半部敌军会撤离。"
      ],
      prep: ["开局分两路直取左右指挥官", "准备反飞兵和高命中单位守住增援线", "派盗贼或携带 Chest Key 的机动单位开启四角宝箱"],
      loot: [
        "基础奖励：Aegir Astral Knights + Ordelia Sorcery Co.",
        "额外奖励（保住全部村庄）：Lance of Zoltan + Ochain Shield；保住一/两个村庄分别得 Horseslayer / Silver Lance",
        "额外奖励（四角宝箱）：Evasion Ring、Secret Book、Silver Bow、Talisman"
      ],
      zones: [
        { label: "我方起点", type: "start", x: 38, y: 82, w: 24, h: 10 },
        { label: "左两村 / Grappler", type: "boss", x: 7, y: 31, w: 26, h: 18 },
        { label: "右两村 / Swordmaster", type: "boss", x: 68, y: 31, w: 25, h: 18 },
        { label: "四角宝箱", type: "loot", x: 7, y: 7, w: 86, h: 13 },
        { label: "顶部无限增援", type: "danger", x: 38, y: 8, w: 24, h: 13 }
      ]
    }),

    forgotten_hero: make("forgotten_hero", {
      name: "被遗忘的英雄",
      title: "被遗忘的英雄 / Forgotten Hero",
      eyebrow: "第 15–22 章 · 雾战外传",
      mission: "在 Edmund 领的迷雾森林中保护 Marianne，并击败 The Wandering Beast。",
      objective: "击败 The Wandering Beast",
      defeat: "Byleth、路线领袖或 Marianne 败退，或我军全灭",
      deployment: "我方 10 / 敌军 19+3",
      fog: true,
      availability: [
        { routes: ["CF"], from: 15, to: 17 },
        { routes: ["SS", "AM"], from: 15, to: 21 },
        { routes: ["VW"], from: 15, to: 22 }
      ],
      parts: [2],
      routeLimited: false,
      facts: [
        "本关有战争迷雾；Marianne 初始与主队分离，首领在被激怒前不会攻击她。",
        "第 10 回合、非 Marianne 我方进入中央空地，或进入左上空地，都会从左侧生成三只 Giant Wolf。",
        "首领被激怒后，大量 Phantom Soldier 会开始移动。"
      ],
      prep: ["携带 Torch 并让高防单位逐步探路", "不要过早让主力进入中央空地", "准备范围计策集中破除首领护盾"],
      loot: [
        "基础奖励：Edmund Troops + Blutgang",
        "额外奖励（击败携物敌军）：Giant Shell、Hexlock Shield、Antitoxin x2",
        "额外奖励（完整破除魔兽护盾）：对应锻造材料"
      ],
      zones: [
        { label: "主队起点", type: "start", x: 38, y: 81, w: 24, h: 11 },
        { label: "Marianne", type: "ally", x: 41, y: 45, w: 19, h: 13 },
        { label: "中央空地\n首领激怒线", type: "trigger", x: 32, y: 32, w: 37, h: 25 },
        { label: "左侧 Giant Wolf 增援", type: "danger", x: 6, y: 26, w: 25, h: 18 },
        { label: "The Wandering Beast", type: "boss", x: 40, y: 9, w: 23, h: 15 }
      ]
    }),

    foreign_land: make("foreign_land", {
      sourceId: "foreign_land_and_sky",
      name: "异乡的天空与大地",
      title: "异乡的天空与大地 / Foreign Land and Sky",
      eyebrow: "第 15–18 章 · 外传",
      mission: "护送 Petra 穿过 Brigid 森林，并在伏军出现后守住目标地点。",
      objective: "全灭敌军（初始显示为全灭或 Petra 抵达目标，但随后必定改为全灭）",
      defeat: "Byleth、路线领袖、Petra 或 Bernadetta 败退；我军全灭；后半段敌将抵达目标地点",
      deployment: "我方 11 / 敌军 28+19 / 后续友军 3",
      availability: [
        { routes: ["CF", "SS"], from: 15, to: 17 },
        { routes: ["AM", "VW"], from: 15, to: 18 }
      ],
      parts: [2],
      routeLimited: false,
      facts: [
        "第 10 回合或 Petra 接近右下会改变胜败条件，并在两翼出现主力增援。",
        "CF 由 Catherine 率 Holy Knight 增援；其余路线由 Hubert 率 Assassin 增援。",
        "Bernadetta 在右侧据点附近结束回合会生成 Fortress Knight；占领左据点两回合后出现三名友军。"
      ],
      prep: ["不要把所有单位压到右下，预留守卫目标地点的小队", "准备反骑兵、反飞兵和高命中手段", "在触发第二阶段前先清理地图中央"],
      loot: [
        "基础奖励：Varley Archers + Brigid Hunters + Brigid Mercenaries",
        "额外奖励：无条件结算物品；路线专属增援不携带限定奖励"
      ],
      zones: [
        { label: "我方起点", type: "start", x: 8, y: 78, w: 23, h: 12 },
        { label: "左侧据点 / 友军", type: "ally", x: 10, y: 30, w: 23, h: 15 },
        { label: "右侧据点\nBernadetta 触发", type: "trigger", x: 69, y: 32, w: 24, h: 16 },
        { label: "T10 / Petra 接近\n两翼增援", type: "danger", x: 34, y: 16, w: 32, h: 17 },
        { label: "目标地点", type: "boss", x: 72, y: 74, w: 20, h: 13 }
      ]
    }),

    weathervanes: make("weathervanes", {
      sourceId: "weathervanes_of_fodlan",
      name: "芙朵拉的风向标",
      title: "芙朵拉的风向标 / Weathervanes of Fódlan",
      eyebrow: "第 14–18 章 · 青月限定外传",
      mission: "突破 Dominic 领的包围，击败 Baron Dominic 并取回 Crusher。",
      objective: "击败 Baron Dominic",
      defeat: "Dimitri、Byleth、Annette 或 Gilbert 败退，或我军全灭",
      deployment: "我方 11 / 敌军 40+4 或 40+10",
      availability: [{ routes: ["AM"], from: 14, to: 18 }],
      parts: [2],
      routeLimited: true,
      facts: [
        "Annette 与 Gilbert 被 Fortress Knight 包围；不主动攻击时，对方不会惊动。",
        "清空右下 Fortress Knight 会生成十名强力步兵；第 10 回合或进入左上则改为右下四名增援，两组互斥。",
        "所有增援只会攻击 Annette，Baron Dominic 不会移动。"
      ],
      prep: ["开局让 Annette 与 Gilbert 保持防守，不主动惊动包围", "选择较容易处理的第 10 回合四人增援路线", "准备飞兵或 Warp 让主队快速会合"],
      loot: [
        "基础奖励：School of Sorcery Soldiers + Crusher",
        "额外奖励（击败携物敌军）：Spear + Black Pearl"
      ],
      zones: [
        { label: "主队起点", type: "start", x: 39, y: 81, w: 23, h: 11 },
        { label: "Annette / Gilbert\n包围圈", type: "ally", x: 70, y: 61, w: 23, h: 18 },
        { label: "右下清空\n十人增援", type: "trigger", x: 68, y: 34, w: 25, h: 16 },
        { label: "T10 / 左上进入\n四人增援", type: "danger", x: 7, y: 20, w: 26, h: 17 },
        { label: "Baron Dominic", type: "boss", x: 39, y: 7, w: 23, h: 13 }
      ]
    }),

    silver_maiden: make("silver_maiden", {
      sourceId: "the_silver_maiden",
      name: "银之少女",
      title: "银之少女 / The Silver Maiden",
      eyebrow: "第 19–21 章 · 青月限定外传",
      mission: "攻入 Arianrhod 要塞，穿过炮台与持续增援击败 Hubert。",
      objective: "击败 Hubert",
      defeat: "Dimitri 或 Byleth 败退，或我军全灭",
      deployment: "我方 11 / 敌军 40+持续增援",
      availability: [{ routes: ["AM"], from: 19, to: 21 }],
      parts: [2],
      routeLimited: true,
      facts: [
        "接近下方中央会在左下生成四名 Fortress Knight，并在 Hubert 附近生成两名 Paladin。",
        "右侧每三回合生成一名 Paladin；击败 Manuela 或其替代 Assassin 可停止。",
        "Hubert 不会移动；若 Hanneman / Manuela 已招募，其泛用替代者身上没有可偷 Elixir。"
      ],
      prep: ["准备魔法或破甲手段处理 Fortress Knight", "派盗贼偷取多项属性道具与 Elixir", "用飞兵或 Warp 绕开炮台快速斩首"],
      loot: [
        "基础奖励：Blue Lion Knights；Manuela 或替代者掉落 Advanced Seal",
        "额外奖励（左上宝箱）：Umbral Steel x1",
        "额外奖励（偷取指定敌军）：Goddess Icon、Energy Drop、Seraph Robe、Elixir x3"
      ],
      zones: [
        { label: "我方起点", type: "start", x: 39, y: 82, w: 23, h: 10 },
        { label: "左上宝箱", type: "loot", x: 7, y: 12, w: 21, h: 12 },
        { label: "下中触发线", type: "trigger", x: 35, y: 55, w: 30, h: 12 },
        { label: "左下 / 右侧增援", type: "danger", x: 6, y: 67, w: 87, h: 14 },
        { label: "Hubert", type: "boss", x: 40, y: 7, w: 21, h: 13 }
      ]
    }),

    sleeping_sand: make("sleeping_sand", {
      sourceId: "the_sleeping_sand_legend",
      name: "沉睡沙地的传说",
      title: "沉睡沙地的传说 / The Sleeping Sand Legend",
      eyebrow: "第 17–21 章 · 翠风限定外传",
      mission: "横越 Sreng 沙地，击败 The Wind Caller 并争夺第三军携带的宝物。",
      objective: "击败 The Wind Caller",
      defeat: "Claude 或 Byleth 败退，或我军全灭",
      deployment: "我方 11 / 敌军 24+4 / 第三军 5",
      availability: [{ routes: ["VW"], from: 17, to: 21 }],
      parts: [2],
      routeLimited: true,
      facts: [
        "首领不会移动；攻击首领后，下个敌军阶段从上方与左侧出现四名 Wyvern Lord。",
        "黄色第三军盗贼也会攻击首领，并携带多件可掉落或偷取的稀有物品。",
        "Giant Crawler 完整破盾会掉 Agarthium。"
      ],
      prep: ["配置飞兵或法师减轻沙地移速惩罚", "派高速度盗贼偷取三项属性道具和 Elixir", "首领开战前清理黄色盗贼并预留反飞兵火力"],
      loot: [
        "基础奖励：Sword of Begalta",
        "额外奖励（击败携物敌军）：Steel Axe、Tomahawk、Rapier、Rusted Lance（Brave）、Killer Bow、Pure Water、Elixir",
        "额外奖励（偷取指定敌军）：Elixir x4、Goddess Icon、Energy Drop、Seraph Robe"
      ],
      zones: [
        { label: "我方起点", type: "start", x: 39, y: 82, w: 23, h: 10 },
        { label: "黄色盗贼群", type: "loot", x: 70, y: 46, w: 23, h: 17 },
        { label: "沙地 / Giant Crawler", type: "danger", x: 11, y: 35, w: 28, h: 22 },
        { label: "攻击首领后\n飞龙增援", type: "trigger", x: 7, y: 8, w: 28, h: 15 },
        { label: "The Wind Caller", type: "boss", x: 40, y: 8, w: 23, h: 15 }
      ]
    }),

    insurmountable: make("insurmountable", {
      name: "无法逾越的障壁",
      title: "无法逾越的障壁 / Insurmountable",
      eyebrow: "第 15–17 章 · 红花限定外传",
      mission: "守住 Fódlan's Locket 的防卫点并击败 Nader。",
      objective: "击败 Nader",
      defeat: "Edelgard 或 Byleth 败退；我军全灭；或防卫点被占领",
      deployment: "我方 12 / 敌军 32+持续增援 / 友军 4",
      availability: [{ routes: ["CF"], from: 15, to: 17 }],
      parts: [2],
      routeLimited: true,
      facts: [
        "右侧边界每回合生成四名 Wyvern Rider，形成无限增援。",
        "四名绿军会在第 1 回合开始时离场，不能依赖其长期守点。",
        "Nader 不会移动，可放弃偷取奖励，用 Warp / Stride 快速结束。"
      ],
      prep: ["在防卫点配置反飞兵单位", "带盗贼或高速度单位偷取四项稀有装备", "若资源紧张，直接规划一回合斩首"],
      loot: [
        "基础奖励：Holst's Chosen；敌 Sniper 掉落 Silver Shield",
        "额外奖励（偷取指定敌军）：Goddess Icon、Energy Drop、Seraph Robe、Aurora Shield"
      ],
      zones: [
        { label: "我方起点 / 防卫点", type: "start", x: 38, y: 81, w: 25, h: 11 },
        { label: "撤离友军", type: "ally", x: 18, y: 61, w: 22, h: 13 },
        { label: "右侧无限飞龙增援", type: "danger", x: 73, y: 22, w: 21, h: 52 },
        { label: "可偷属性道具敌群", type: "loot", x: 35, y: 34, w: 31, h: 16 },
        { label: "Nader", type: "boss", x: 39, y: 7, w: 23, h: 13 }
      ]
    }),

    darkness_beneath: make("darkness_beneath", {
      sourceId: "darkness_beneath_the_earth",
      name: "地底的黑暗",
      title: "地底的黑暗 / Darkness Beneath the Earth",
      eyebrow: "第 15–17 章 · 红花限定外传",
      mission: "在地下遗迹保护神秘魔法师，并歼灭六只 Demonic Beast。",
      objective: "全灭敌军",
      defeat: "Edelgard、Byleth 或 Hubert 败退，或我军全灭",
      deployment: "我方 10 / 敌军 6 / 友军 5",
      availability: [{ routes: ["CF"], from: 15, to: 17 }],
      parts: [2],
      routeLimited: true,
      facts: [
        "五名友军 Dark Bishop 会主动使用计策并激进攻击魔兽，很容易自灭。",
        "只需至少三名友军存活即可取得 Arrow of Indra。",
        "地图岩石是被毁的 Golem 残骸，中央与两翼魔兽会分散友军火力。"
      ],
      prep: ["开局决定优先救援的三名友军", "准备 Rescue、Warp、远程治疗和范围计策", "让主力完整破盾后集中击杀，避免友军无谓反击"],
      loot: [
        "基础奖励：左下宝箱 Seraph Robe",
        "额外奖励（至少三名友军存活）：Arrow of Indra",
        "额外奖励（完整破除六只魔兽护盾）：锻造材料"
      ],
      zones: [
        { label: "我方起点", type: "start", x: 38, y: 81, w: 24, h: 11 },
        { label: "五名友军", type: "ally", x: 34, y: 49, w: 32, h: 16 },
        { label: "左下 Seraph Robe", type: "loot", x: 7, y: 72, w: 22, h: 12 },
        { label: "两翼魔兽", type: "danger", x: 6, y: 23, w: 88, h: 22 },
        { label: "中央魔兽群", type: "boss", x: 36, y: 8, w: 29, h: 17 }
      ]
    }),

    ocean_view: make("ocean_view", {
      sourceId: "an_ocean_view",
      name: "海之彼端",
      title: "海之彼端 / An Ocean View",
      eyebrow: "第 9–11 章 · 外传",
      mission: "穿越 Rhodos Coast 沙地，阻止三名 Bishop 携宝撤离并全灭敌军。",
      objective: "全灭敌军",
      defeat: "Byleth、路线领袖、Flayn 或 Seteth 败退，或我军全灭",
      deployment: "我方 10 / 敌军 28",
      availability: [{ routes: ALL_ROUTES, from: 9, to: 11 }],
      parts: [1],
      routeLimited: false,
      facts: [
        "沙地大幅降低非飞行、非魔法单位移动力，且没有隐藏沙地道具。",
        "左上 Bishop 不会移动；其被击败后，右上与右下 Bishop 会优先向南撤离。",
        "三名 Bishop 分别携带 Advanced Seal、Black Pearl 与 Levin Sword。"
      ],
      prep: ["优先部署飞兵和法师", "先封住南侧逃离路线再击败左上 Bishop", "分三路同时接近携物 Bishop"],
      loot: [
        "基础奖励：Cichol Wyvern Co.、Cethleann Monks、Spear of Assal、Caduceus Staff",
        "额外奖励（击败三名携物 Bishop）：Advanced Seal、Black Pearl、Levin Sword"
      ],
      zones: [
        { label: "我方起点", type: "start", x: 38, y: 81, w: 24, h: 11 },
        { label: "左上 Bishop\n逃跑触发源", type: "boss", x: 7, y: 8, w: 24, h: 14 },
        { label: "右上 Bishop", type: "loot", x: 69, y: 8, w: 24, h: 14 },
        { label: "右下 Bishop", type: "loot", x: 71, y: 66, w: 22, h: 14 },
        { label: "南侧逃离线", type: "trigger", x: 32, y: 68, w: 35, h: 13 }
      ]
    }),

    oil_water: make("oil_water", {
      sourceId: "oil_and_water",
      name: "水火不容",
      title: "水火不容 / Oil and Water",
      eyebrow: "第 8–11 章 · 外传",
      mission: "救援孤立在右侧高地的 Manuela，并击败敌军首领。",
      objective: "击败敌军指挥官",
      defeat: "Byleth、路线领袖、Hanneman 或 Manuela 败退，或我军全灭",
      deployment: "我方 7 / 敌军 30",
      availability: [{ routes: ALL_ROUTES, from: 8, to: 11 }],
      parts: [1],
      routeLimited: false,
      facts: [
        "Manuela 单独位于右侧悬崖，短时间能自保但无法长期承压。",
        "携带 Experience Gem 与 Rapier 的 Archer / Sniper 第 9 回合开始向右上撤离。",
        "敌军指挥官不会移动，可在完成救援和截宝后再斩首。"
      ],
      prep: ["配置飞兵或 Rescue 尽快接走 Manuela", "在第 9 回合前截住两名携物弓手", "主队稳步推进，不让七人小队被分割"],
      loot: [
        "基础奖励：Manuela 已招募时 Macuil Evil Repelling Co.；Hanneman 已招募时 Indech Sword Fighters",
        "额外奖励（击败携物 Archer）：Experience Gem",
        "额外奖励（击败携物 Sniper）：Rapier"
      ],
      zones: [
        { label: "主队起点", type: "start", x: 10, y: 78, w: 23, h: 12 },
        { label: "Manuela 孤立高地", type: "ally", x: 72, y: 61, w: 21, h: 15 },
        { label: "T9 携物弓手\n右上撤离", type: "loot", x: 58, y: 33, w: 32, h: 17 },
        { label: "会合通道", type: "trigger", x: 36, y: 47, w: 29, h: 13 },
        { label: "敌军指挥官", type: "boss", x: 38, y: 7, w: 24, h: 13 }
      ]
    }),

    sword_shield: make("sword_shield", {
      sourceId: "sword_and_shield_of_seiros",
      name: "赛罗司的剑与盾",
      title: "赛罗司的剑与盾 / Sword and Shield of Seiros",
      eyebrow: "第 7–11 章 · 外传",
      mission: "守住港口城镇，阻止海盗持续登陆并击败敌军首领。",
      objective: "击败敌军指挥官",
      defeat: "Byleth、路线领袖、Alois 或 Shamir 败退，或我军全灭",
      deployment: "我方 10 / 敌军 31+持续增援",
      availability: [{ routes: ALL_ROUTES, from: 7, to: 11 }],
      parts: [1],
      routeLimited: false,
      facts: [
        "北侧船只会按三回合生成、停一回合的节奏持续派出两名 Thief。",
        "Maddening 每奇数回合在敌将右侧生成 Assassin；每三回合另有 Wyvern Rider。",
        "敌军进入城内累计少于四回合，才可取得 Seraph Robe 与较高金块奖励。"
      ],
      prep: ["让 Shamir 或其他弓手守住飞龙入城线", "优先堵住北船登陆点", "不要急杀右上治疗地形 Brigand，以免提前惊动敌将"],
      loot: [
        "基础奖励：Alois 已招募时 Holy Knights of Seiros；Shamir 已招募时 Seiros Archers",
        "额外奖励（敌军在城内累计少于 4 回合）：Large Bullion + Seraph Robe；否则仅 Bullion",
        "额外奖励（偷取 Pirate Commander）：Concoction"
      ],
      zones: [
        { label: "我方起点 / 港口防区", type: "start", x: 38, y: 81, w: 26, h: 11 },
        { label: "北侧登陆船\nThief 增援", type: "danger", x: 7, y: 8, w: 26, h: 16 },
        { label: "城内防卫区", type: "trigger", x: 32, y: 42, w: 36, h: 20 },
        { label: "右侧飞龙 / Assassin 增援", type: "danger", x: 70, y: 35, w: 24, h: 21 },
        { label: "敌军指挥官", type: "boss", x: 70, y: 8, w: 23, h: 14 }
      ]
    }),

    secret_merchant: make("secret_merchant", {
      sourceId: "the_secret_merchant",
      name: "秘密商人",
      title: "秘密商人 / The Secret Merchant",
      eyebrow: "第 9–17 章 · DLC 路线外传",
      mission: "在十回合的包围战中保护 Anna，并尽可能收走敌军携带的商品。",
      objective: "全灭敌军，或坚持 10 回合",
      defeat: "Byleth、路线领袖、Anna 或出场的 Jeritza 败退，或我军全灭",
      deployment: "我方 10（CF 为 11）/ 敌军 23+21",
      availability: [
        { routes: ["AM", "VW"], from: 9, to: 11 },
        { routes: ["CF"], from: 13, to: 17 }
      ],
      parts: [1, 2],
      routeLimited: true,
      facts: [
        "第 2、4、6、8 回合从地图周边分批出现 Bow Knight、Grappler、法师与骑兵。",
        "Blue Lions / Golden Deer 在第一部开放；CF 在第二部开放；SS 完全不可用。",
        "可将强制出场者转为飞行职业停在敌军无法抵达的位置坚持十回合，但会放弃大量掉落。"
      ],
      prep: ["将队伍围成互相支援的防守阵", "为 Anna 准备高回避或飞行职业", "若追求掉落，按回合预判四周增援并主动截击"],
      loot: [
        "基础奖励：Secret Transport Force",
        "额外奖励（击败各携物敌军）：Bullion x7、Large Bullion x4、Concoction x3、Elixir x3、Pure Water",
        "额外奖励（击败特定 Warrior / Paladin）：Hammer、Horseslayer、Venin Axe、Venin Lance"
      ],
      zones: [
        { label: "中央防守起点", type: "start", x: 35, y: 42, w: 31, h: 18 },
        { label: "T2 周边增援", type: "danger", x: 5, y: 8, w: 90, h: 14 },
        { label: "T4 / T6 两翼增援", type: "danger", x: 5, y: 34, w: 90, h: 17 },
        { label: "T8 后方增援", type: "trigger", x: 32, y: 76, w: 37, h: 13 },
        { label: "携物敌军群", type: "loot", x: 69, y: 60, w: 24, h: 14 }
      ]
    }),

    eternal_guardian: make("eternal_guardian", {
      name: "永恒守护者",
      title: "永恒守护者 / Eternal Guardian",
      eyebrow: "第 16–21 章 · 非红花外传",
      mission: "依照 Rhea 留下的信进入圣墓，击败四名守护指挥官。",
      objective: "击败全部四名敌军指挥官",
      defeat: "Byleth 或当前路线领袖败退，或我军全灭",
      deployment: "我方 12 / 敌军 42",
      availability: [
        { routes: ["SS"], from: 16, to: 18 },
        { routes: ["VW"], from: 16, to: 19 },
        { routes: ["AM"], from: 16, to: 21 }
      ],
      parts: [2],
      routeLimited: true,
      facts: [
        "开放条件为 Byleth 与 Rhea 至少达到 C 支援，Crimson Flower 不可进入。",
        "四名敌军指挥官分布在圣墓四区，必须全部击败。",
        "Altered Golem 采用面向巡逻警戒；完整破盾会掉落 Mythril，本关没有增援。"
      ],
      prep: ["在时跳前完成 Rhea C 支援", "分两到三队同步清理四区指挥官", "携带范围计策完整破除 Altered Golem 护盾"],
      loot: [
        "基础奖励：Seiros Shield",
        "额外奖励（击败携物 Fortress Knight）：Spirit Dust",
        "额外奖励（完整破除 Altered Golem 护盾）：Mythril"
      ],
      zones: [
        { label: "我方起点", type: "start", x: 38, y: 82, w: 24, h: 10 },
        { label: "西侧指挥官", type: "boss", x: 7, y: 35, w: 22, h: 14 },
        { label: "东侧指挥官", type: "boss", x: 71, y: 35, w: 22, h: 14 },
        { label: "Altered Golem 巡逻区", type: "danger", x: 31, y: 31, w: 38, h: 24 },
        { label: "北侧双指挥官 / Spirit Dust", type: "loot", x: 30, y: 7, w: 40, h: 15 }
      ]
    })
  };
})();
