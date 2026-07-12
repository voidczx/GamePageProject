window.CP2077_DATA = (() => {
  const attributes = [
    { id: "body", label: "肉体", english: "BODY", color: "#ef715e" },
    { id: "reflexes", label: "反应", english: "REFLEXES", color: "#f0d84c" },
    { id: "technical", label: "技术能力", english: "TECHNICAL ABILITY", color: "#68b7c4" },
    { id: "intelligence", label: "智力", english: "INTELLIGENCE", color: "#8ea8dc" },
    { id: "cool", label: "镇定", english: "COOL", color: "#79b98a" }
  ];

  const maps = {
    city: {
      id: "city", label: "夜之城总图", image: "../../assets/images/cyberpunk-2077/night-city-map.webp",
      width: 3157, height: 3010, alt: "夜之城 2077 卫星地图",
      source: "https://cyberpunk.fandom.com/wiki/Night_City", attribution: "底图：Cyberpunk Wiki / CD PROJEKT RED"
    },
    dogtown: {
      id: "dogtown", label: "狗镇详图", image: "../../assets/images/cyberpunk-2077/dogtown-map.webp",
      width: 675, height: 538, alt: "往日之影狗镇游戏内地图",
      source: "https://cyberpunk.fandom.com/wiki/Dogtown", attribution: "底图：Cyberpunk Wiki / CD PROJEKT RED"
    }
  };

  const items = [
    {
      id: "tetratronic-rippler", name: "四相传电涟漪 Mk.5", english: "Tetratronic Rippler", type: "cyberware",
      district: "沃森区", location: "任意义体医生（地图以维克多诊所为代表点）", map: "city", x: 52, y: 31,
      mission: "达到对应物品阶级后购买", acquisition: "2.0+ 版本义体医生共享常规库存；购买后升级到 5++。",
      effect: "高 RAM 与战斗/控制快速破解联动，开启超频时自动干扰近身敌人。",
      warning: "不是固定拾取物，地图标记代表采购入口。", builds: ["netrunner"],
      source: "https://cyberpunk.fandom.com/wiki/Tetratronic_Rippler"
    },
    {
      id: "militech-canto", name: "军用科技 Canto Mk.6", english: "Militech Canto Mk.6", type: "cyberware", dlc: true,
      district: "狗镇", location: "赛诺枢纽设施，3 区实验原型实验室", map: "dogtown", x: 44, y: 68,
      mission: "主线：Somewhat Damaged / 有些损坏", acquisition: "在实验室输入 714212 取得制作规范，再完成 This Corrosion 取得解码组件并制作。",
      effect: "解锁黑墙网关快速破解，是黑墙主题构筑的核心操作系统。",
      warning: "路线限定：必须在 Firestarter 分歧选择帮助 Reed，且该任务区只进入一次。", builds: ["netrunner"],
      source: "https://cyberpunk.fandom.com/wiki/Militech_Canto"
    },
    {
      id: "yinglong", name: "应龙", english: "Yinglong", type: "weapon",
      district: "海伍德", location: "威尔斯普林斯：疑似有组织犯罪活动", map: "city", x: 49, y: 58,
      mission: "NCPD：Living the Big Life", acquisition: "击败活动首领 Denzel Cryer，拾取制作规范后制作。",
      effect: "标志性智能冲锋枪；电击与 EMP 效果适合补足黑客流的持续火力。",
      warning: "掉落的是制作规范，不是成品。", builds: ["netrunner"],
      source: "https://cyberpunk.fandom.com/wiki/Yinglong"
    },
    {
      id: "monowire", name: "单分子线", english: "Monowire", type: "cyberware",
      district: "沃森区", location: "任意义体医生（地图以歌舞伎区为代表点）", map: "city", x: 53, y: 28,
      mission: "义体医生常规库存", acquisition: "购买对应伤害类型并逐阶升级；《往日之影》遗物专长可让单分子线挂载控制类快速破解。",
      effect: "智力联调的近身回 RAM 工具，适合超频期间收尾与控场。",
      warning: "不是固定拾取物，地图标记代表采购入口。", builds: ["netrunner"],
      source: "https://cyberpunk.fandom.com/wiki/Monowire"
    },
    {
      id: "byakko", name: "白虎", english: "Byakko", type: "weapon",
      district: "威斯特布鲁克", location: "完成和歌子的全部委托后，在 V 的储藏处领取", map: "city", x: 60, y: 40,
      mission: "支线：Professional Widow / 职业寡妇", acquisition: "完成和歌子在威斯特布鲁克的 8 个委托，收到结算消息后回公寓储藏处领取。",
      effect: "击杀后获得高攻速连斩，并自带跃击，是刀剑时停流的稳定清群核心。",
      warning: "奖励在储藏处，不会直接进入背包。", builds: ["blades"],
      source: "https://cyberpunk.fandom.com/wiki/Byakko"
    },
    {
      id: "errata", name: "勘误", english: "Errata", type: "weapon",
      district: "圣多明戈", location: "科罗纳多农场：电力公司工厂熔炉", map: "city", x: 66, y: 62,
      mission: "主线：Disasterpiece / 灾难片", acquisition: "穿过朱迪带你进入的电力公司工厂，在熔炉旁拾取。漏拿后可在狗镇黑市商人处补购。",
      effect: "对燃烧目标必定暴击，配合热能螳螂刀、燃烧或热能手雷可稳定触发。",
      warning: "主流程经过时最省事；DLC 黑市是漏拿保险。", builds: ["blades"],
      source: "https://cyberpunk.fandom.com/wiki/Errata"
    },
    {
      id: "militech-apogee", name: "军用科技“远地点”", english: "Militech Apogee Sandevistan", type: "cyberware",
      district: "市政中心", location: "任意义体医生（地图以市中心为代表点）", map: "city", x: 49, y: 48,
      mission: "角色等级 40 后购买", acquisition: "达到 40 级后可从任意义体医生购买，再升级到 5++。",
      effect: "主动减速 85%，击杀延长持续时间并回复耐力，适合刀剑连续处决。",
      warning: "需要 44 点义体容量；不是固定拾取物。", builds: ["blades", "stealth"],
      source: "https://cyberpunk.fandom.com/wiki/Militech_%22Apogee%22_Sandevistan"
    },
    {
      id: "axolotl", name: "蝾螈", english: "Axolotl", type: "cyberware", dlc: true,
      district: "沃森区", location: "完成瑞吉娜全部委托后，在 V 的储藏处领取", map: "city", x: 51, y: 25,
      mission: "支线：Last Call / 最后通牒", acquisition: "完成瑞吉娜在沃森区的 23 个委托后领取；狗镇义体医生和空投也可提供。",
      effect: "每次消灭敌人立刻缩短全部义体冷却，适合时停或狂暴循环。",
      warning: "33 级以上领取才是 5 阶；也可后续升级。", builds: ["blades", "solo"],
      source: "https://cyberpunk.fandom.com/wiki/Axolotl"
    },
    {
      id: "her-majesty", name: "陛下", english: "Her Majesty", type: "weapon", dlc: true,
      district: "狗镇", location: "亚历克斯的安全屋 The Moth", map: "dogtown", x: 31, y: 55,
      mission: "主线：Get It Together / 有备无患", acquisition: "与亚历克斯会面并完成任务对话后由她交给 V。",
      effect: "光学迷彩开启时提高命中与暴击，并让首轮潜行爆头更稳定。",
      warning: "主线赠送，不需要额外购买。", builds: ["stealth"],
      source: "https://cyberpunk.fandom.com/wiki/Her_Majesty"
    },
    {
      id: "agaou", name: "阿迦乌", english: "Agaou", type: "weapon", dlc: true,
      district: "狗镇", location: "Luxor High Wellness Spa：增强犯罪活动", map: "dogtown", x: 28, y: 31,
      mission: "Increased Criminal Activity：Voodoo Boys", acquisition: "击败首领 Ayo Zarin 后从尸体拾取。",
      effect: "投掷命中可释放电击冲击波，兼顾潜行单杀与暴露后的群体压制。",
      warning: "该区域敌人密度高，建议先处理摄像头和高处黑客。", builds: ["stealth"],
      source: "https://cyberpunk.fandom.com/wiki/Agaou"
    },
    {
      id: "optical-camo", name: "光学迷彩", english: "Optical Camo", type: "cyberware",
      district: "威斯特布鲁克", location: "任意义体医生（地图以日本街为代表点）", map: "city", x: 60, y: 41,
      mission: "义体医生常规库存", acquisition: "购买并升级；冷却和持续时间随阶级提升。",
      effect: "脱离视线、重置潜行节奏，并与陛下及遗物专长 Emergency Cloaking 联动。",
      warning: "不是固定拾取物，地图标记代表采购入口。", builds: ["stealth"],
      source: "https://cyberpunk.fandom.com/wiki/Optical_Camo"
    },
    {
      id: "cockatrice", name: "鸡蛇", english: "Kiroshi Cockatrice Optics", type: "cyberware", dlc: true,
      district: "狗镇", location: "狗镇义体医生", map: "dogtown", x: 34, y: 57,
      mission: "狗镇义体医生库存", acquisition: "进入狗镇后从当地义体医生购买。",
      effect: "高额暴击率让潜行手枪在失去潜行加成后仍保持稳定输出。",
      warning: "图标使用狗镇采购入口代表点。", builds: ["stealth"],
      source: "https://cyberpunk.fandom.com/wiki/Cockatrice"
    },
    {
      id: "bloody-maria", name: "血腥玛丽亚", english: "Bloody Maria", type: "weapon",
      district: "圣多明戈", location: "完成老船长全部委托后，在 V 的储藏处领取", map: "city", x: 71, y: 65,
      mission: "支线：Ride Captain Ride", acquisition: "完成 Muamar Reyes 的全部委托，收到结算消息后回储藏处领取。",
      effect: "强制击倒与高近距离压制，适合狂暴或肾上腺素突脸循环。",
      warning: "奖励在储藏处，不会直接进入背包。", builds: ["solo"],
      source: "https://cyberpunk.fandom.com/wiki/Bloody_Maria"
    },
    {
      id: "militech-berserk", name: "军用科技狂暴", english: "Militech Berserk", type: "cyberware",
      district: "海伍德", location: "任意义体医生（地图以谷地区为代表点）", map: "city", x: 50, y: 57,
      mission: "义体医生常规库存", acquisition: "达到对应物品阶级后购买并升级。",
      effect: "主动期间免疫伤害并强化近战；适合钝器、猩猩手臂和高压贴脸。",
      warning: "狂暴会占用操作系统槽，不能与网络接入仓或斯安威斯坦并装。", builds: ["solo"],
      source: "https://cyberpunk.fandom.com/wiki/Militech_Berserk"
    },
    {
      id: "order", name: "秩序", english: "Order", type: "weapon", dlc: true,
      district: "狗镇", location: "EBM 石化体育场黑市商人 Herold Lowe", map: "dogtown", x: 74, y: 19,
      mission: "进入狗镇后购买", acquisition: "在体育场军火商处购买；需要准备较高预算。",
      effect: "蓄满力的技术双管霰弹枪可把弹仓一次打空，适合近距离爆发。",
      warning: "需要技术武器蓄力节奏，未成型前用普通 Satara 过渡。", builds: ["solo"],
      source: "https://cyberpunk.fandom.com/wiki/Order"
    },
    {
      id: "perk-shard-01", name: "专长芯片 01", english: "Perk Shard / Darius Loaf", type: "progression", category: "perkShard", shortLabel: "P1",
      district: "恶土 / Rocky Ridge", location: "Edgewood Farm 西北公路第二块广告牌附近", map: "city", x: 84, y: 58,
      mission: "无标记开放世界点位", acquisition: "沿轮胎印离开公路，在坠毁车辆和无人机旁搜索 Darius Loaf 的尸体。",
      effect: "获得 1 点专长点。", warning: "无地图事件标记，但可随时返回。", coordinates: "2288.56, -1051.32, 55.48",
      builds: ["netrunner", "blades", "stealth", "solo"], source: "https://cyberpunk.fandom.com/wiki/Perk_Shard"
    },
    {
      id: "perk-shard-02", name: "专长芯片 02", english: "Perk Shard / Rocky Ridge", type: "progression", category: "perkShard", shortLabel: "P2",
      district: "恶土 / Rocky Ridge", location: "Edgewood Farm 东北山坡的 Wraith 营地", map: "city", x: 89, y: 58,
      mission: "NCPD：疑似有组织犯罪活动", acquisition: "击败 Bruce Ward，检查事件主奖励容器。",
      effect: "获得 1 点专长点。", warning: "有 NCPD 标记，不会永久错过。", coordinates: "2870.70, -1014.34, 68.36",
      builds: ["netrunner", "blades", "stealth", "solo"], source: "https://cyberpunk.fandom.com/wiki/Perk_Shard"
    },
    {
      id: "perk-shard-03", name: "专长芯片 03", english: "Perk Shard / Memorial Park", type: "progression", category: "perkShard", shortLabel: "P3",
      district: "市政中心 / 公司广场", location: "Metro: Memorial Park 入口内的圆形中心区域", map: "city", x: 51, y: 46,
      mission: "NCPD：正在进行的袭击", acquisition: "清理敌人后开启主奖励容器。",
      effect: "获得 1 点专长点。", warning: "活动完成后仍需手动搜刮主奖励。", coordinates: "-1305.97, -47.54, 2.15",
      builds: ["netrunner", "blades", "stealth", "solo"], source: "https://cyberpunk.fandom.com/wiki/Perk_Shard"
    },
    {
      id: "perk-shard-04", name: "专长芯片 04", english: "Perk Shard / Cindy Hogan", type: "progression", category: "perkShard", shortLabel: "P4",
      district: "市政中心 / 公司广场", location: "Republic Way 与 Union Street 路口西北的冷却设施顶部", map: "city", x: 50, y: 41,
      mission: "无标记开放世界点位", acquisition: "从 Metro: Sarasti & Republic 向东，在投递点对面的设施顶部搜索 Cindy Hogan 的尸体。",
      effect: "获得 1 点专长点。", warning: "无标记且位于屋顶，需要攀爬。", coordinates: "-1355.24, 444.28, 13.15",
      builds: ["netrunner", "blades", "stealth", "solo"], source: "https://cyberpunk.fandom.com/wiki/Perk_Shard"
    },
    {
      id: "perk-shard-05", name: "专长芯片 05", english: "Perk Shard / Ford Street", type: "progression", category: "perkShard", shortLabel: "P5",
      district: "海伍德 / 谷地区", location: "Ventura & Skyline 西北，Ford Street 高架桥下巷道", map: "city", x: 45, y: 58,
      mission: "NCPD：正在进行的袭击", acquisition: "清理巷道内敌人并开启活动奖励。",
      effect: "获得 1 点专长点。", warning: "入口层级较绕，标记位于高架桥下。", coordinates: "-1984.43, -1027.10, 7.63",
      builds: ["netrunner", "blades", "stealth", "solo"], source: "https://cyberpunk.fandom.com/wiki/Perk_Shard"
    },
    {
      id: "perk-shard-06", name: "专长芯片 06", english: "Perk Shard / Jimmy Kreutz", type: "progression", category: "perkShard", shortLabel: "P6",
      district: "圣多明戈 / 河谷区", location: "Red Dirt Bar 西南，Mission Street 车库", map: "city", x: 55, y: 58,
      mission: "NCPD：正在进行的袭击", acquisition: "在车库内搜索 Jimmy Kreutz 的尸体。",
      effect: "获得 1 点专长点。", warning: "不要只开启奖励箱，芯片在尸体上。", coordinates: "-874.53, -1008.73, 11.37",
      builds: ["netrunner", "blades", "stealth", "solo"], source: "https://cyberpunk.fandom.com/wiki/Perk_Shard"
    },
    {
      id: "perk-shard-07", name: "专长芯片 07", english: "Perk Shard / Welcome to Night City", type: "progression", category: "perkShard", shortLabel: "P7",
      district: "圣多明戈 / 科罗纳多农场", location: "Manzanita Street 车库缓存箱", map: "city", x: 69, y: 71,
      mission: "NCPD：Reported Crime - Welcome to Night City", acquisition: "先调查附近棚屋尸体启动后续，再前往车库开启缓存箱。",
      effect: "获得 1 点专长点。", warning: "未启动前置调查时车库不会开放。", coordinates: "641.66, -2166.40, 38.89",
      builds: ["netrunner", "blades", "stealth", "solo"], source: "https://cyberpunk.fandom.com/wiki/Perk_Shard"
    },
    {
      id: "perk-shard-08", name: "专长芯片 08", english: "Perk Shard / Industrial Street", type: "progression", category: "perkShard", shortLabel: "P8",
      district: "沃森区 / 北区", location: "Offshore Street 东侧，Biotechnica 大楼对面的开放仓库", map: "city", x: 54, y: 13,
      mission: "无标记开放世界点位", acquisition: "消灭仓库内 3 台 Militech Wyvern，在后部上层钢箱中拾取。",
      effect: "获得 1 点专长点。", warning: "无任务标记，仓库有 A/B/C 三扇门。", coordinates: "-962.90, 2776.68, 30.05",
      builds: ["netrunner", "blades", "stealth", "solo"], source: "https://cyberpunk.fandom.com/wiki/Perk_Shard"
    },
    {
      id: "perk-shard-09", name: "专长芯片 09", english: "Perk Shard / Willow Street", type: "progression", category: "perkShard", shortLabel: "P9",
      district: "威斯特布鲁克 / 日本街", location: "Dark Matter 西侧 Willow Street，Kiroshi 建筑旁", map: "city", x: 59, y: 43,
      mission: "NCPD：正在进行的袭击", acquisition: "清理现场后检查汽车后备箱内的尸体。",
      effect: "获得 1 点专长点。", warning: "当前版本此处只有 1 个，芯片不在主奖励箱。", coordinates: "-397.78, 253.49, 22.15",
      builds: ["netrunner", "blades", "stealth", "solo"], source: "https://cyberpunk.fandom.com/wiki/Perk_Shard"
    },
    {
      id: "perk-shard-10", name: "专长芯片 10", english: "Perk Shard / Arasaka Industrial Park", type: "progression", category: "perkShard", shortLabel: "P10",
      district: "圣多明戈 / 河谷区", location: "荒坂工业园中央指挥塔顶层工具箱", map: "city", x: 60, y: 63,
      mission: "主线：Gimme Danger / 危险游戏 所到区域", acquisition: "进入连接地下通道的安保建筑，前往顶层开启工具箱。",
      effect: "获得 1 点专长点。", warning: "任务前后均可进入，垂直层级容易找错。", coordinates: "-254.44, -1509.12, 12.61",
      builds: ["netrunner", "blades", "stealth", "solo"], source: "https://cyberpunk.fandom.com/wiki/Perk_Shard"
    },
    {
      id: "perk-shard-11", name: "专长芯片 D1", english: "Perk Shard / Dog Eat Dog Garage", type: "progression", category: "perkShard", shortLabel: "PD1", dlc: true,
      district: "狗镇 / EBM 体育场车库", location: "Dog Eat Dog 跑酷车库的蓝色破损 Villefort 后备箱", map: "dogtown", x: 67, y: 24,
      mission: "主线：Dog Eat Dog / 狗咬狗", acquisition: "踩带黑墙故障痕迹的 Thorton Colby 皮卡，跳到上方平台开启蓝车后备箱。",
      effect: "获得 1 点专长点。", warning: "永久易错过：离开该任务区域后无法正常返回。", coordinates: "-1366.04, -1791.23, 10.32",
      builds: ["netrunner", "blades", "stealth", "solo"], source: "https://cyberpunk.fandom.com/wiki/Perk_Shard"
    },
    {
      id: "perk-shard-12", name: "专长芯片 D2", english: "72h Extreme Sensory Deprivation", type: "progression", category: "perkShard", shortLabel: "PD2", dlc: true,
      district: "狗镇 / EBM 体育场市场", location: "Good Old Dogtown 废品与 BD 商店", map: "dogtown", x: 74, y: 17,
      mission: "商店一次性库存", acquisition: "向 Marcin Iwiński 购买“72h Extreme Sensory Deprivation”。",
      effect: "获得 1 点专长点。", warning: "不是拾取物，需要在商店列表中购买。", coordinates: "-1397.72, -2048.79, 71.87",
      builds: ["netrunner", "blades", "stealth", "solo"], source: "https://cyberpunk.fandom.com/wiki/Perk_Shard"
    },
    {
      id: "perk-shard-13", name: "专长芯片 D3", english: "Perk Shard / Longshore Stacks", type: "progression", category: "perkShard", shortLabel: "PD3", dlc: true,
      district: "狗镇 / Longshore Stacks", location: "Laura May 商店下一层的隐藏容器", map: "dogtown", x: 27, y: 58,
      mission: "无标记开放世界点位", acquisition: "下到商店下一层，打碎走廊纸箱后开启被遮住的容器。",
      effect: "获得 1 点专长点。", warning: "无标记且被纸箱完全遮住，但可随时返回。", coordinates: "-2369.40, -2652.76, 27.96",
      builds: ["netrunner", "blades", "stealth", "solo"], source: "https://cyberpunk.fandom.com/wiki/Perk_Shard"
    },
    {
      id: "relic-terminal-01", name: "限制数据终端 01", english: "EBM Petrochem Stadium", type: "progression", category: "relicTerminal", shortLabel: "R1", dlc: true,
      district: "狗镇 / EBM 体育场", location: "体育场市场北端，三座金色球员雕像后的平台", map: "dogtown", x: 72, y: 20,
      mission: "《往日之影》开放世界收集", acquisition: "从体育场快速旅行点穿过全部商铺，在 K6 标识附近上楼，蹲过脚手架缺口。",
      effect: "获得 1 点遗物点。", warning: "游戏导航可能错误指向缺电的门，应从市场最深处进入。",
      builds: ["netrunner", "blades", "stealth", "solo"], source: "https://www.powerpyx.com/cyberpunk-2077-all-restricted-data-terminal-locations-relic-points/"
    },
    {
      id: "relic-terminal-02", name: "限制数据终端 02", english: "Terra Cognita / Massdriver", type: "progression", category: "relicTerminal", shortLabel: "R2", dlc: true,
      district: "狗镇 / Terra Cognita", location: "最南端 Massdriver 航天展馆最高层", map: "dogtown", x: 63, y: 87,
      mission: "增强犯罪活动：Modified Arasaka Drone", acquisition: "进入 ESC Explorer 展馆，从左侧扶梯上到最高层，在左侧第一间旧商铺靠右墙处取得。",
      effect: "获得 1 点遗物点。", warning: "位于室内上层，不在地面道路旁。",
      builds: ["netrunner", "blades", "stealth", "solo"], source: "https://www.powerpyx.com/cyberpunk-2077-all-restricted-data-terminal-locations-relic-points/"
    },
    {
      id: "relic-terminal-03", name: "限制数据终端 03", english: "Kress Street Safehouse", type: "progression", category: "relicTerminal", shortLabel: "R3", dlc: true,
      district: "狗镇 / Kress Street", location: "安全屋电梯 Ground Floor 右侧死胡同", map: "dogtown", x: 36, y: 58,
      mission: "《往日之影》开放世界收集", acquisition: "乘安全屋电梯到地面层，出电梯后检查右侧角落；紧邻快速旅行设备。",
      effect: "获得 1 点遗物点。", warning: "终端与快速旅行点处于同一地面层。",
      builds: ["netrunner", "blades", "stealth", "solo"], source: "https://www.powerpyx.com/cyberpunk-2077-all-restricted-data-terminal-locations-relic-points/"
    },
    {
      id: "relic-terminal-04", name: "限制数据终端 04", english: "Capitan Caliente Rooftop", type: "progression", category: "relicTerminal", shortLabel: "R4", dlc: true,
      district: "狗镇 / Golden Pacific", location: "Brainporium 对面 Capitan Caliente 残破楼顶", map: "dogtown", x: 56, y: 47,
      mission: "《往日之影》开放世界收集", acquisition: "从建筑左侧经坡道、雨棚和绿色吊机爬上断裂屋顶。",
      effect: "获得 1 点遗物点。", warning: "屋顶周围有地雷；标记不在 Brainporium 本楼。",
      builds: ["netrunner", "blades", "stealth", "solo"], source: "https://www.powerpyx.com/cyberpunk-2077-all-restricted-data-terminal-locations-relic-points/"
    },
    {
      id: "relic-terminal-05", name: "限制数据终端 05", english: "Luxor High Wellness Spa", type: "progression", category: "relicTerminal", shortLabel: "R5", dlc: true,
      district: "狗镇 / Luxor Heights", location: "Old Technics / Biotechnica 建筑群的废弃泳池房间", map: "dogtown", x: 29, y: 31,
      mission: "增强犯罪活动：Ayo Zarin", acquisition: "进入 Voodoo Boys 据点，上楼穿过第一间房；终端在废弃泳池大空间远端左墙柱后。",
      effect: "获得 1 点遗物点。", warning: "敌人密集，终端藏在柱子后。",
      builds: ["netrunner", "blades", "stealth", "solo"], source: "https://www.powerpyx.com/cyberpunk-2077-all-restricted-data-terminal-locations-relic-points/"
    },
    {
      id: "relic-terminal-06", name: "限制数据终端 06", english: "Eventide Resort Underpass", type: "progression", category: "relicTerminal", shortLabel: "R6", dlc: true,
      district: "狗镇 / Luxor Heights", location: "Eventide Resort 下方主路的高架桥底", map: "dogtown", x: 23, y: 43,
      mission: "《往日之影》开放世界收集", acquisition: "从 Luxor Spa 向西南沿路，在高架桥下越过带 Voodoo Boys 涂鸦的路障。",
      effect: "获得 1 点遗物点。", warning: "终端位于下层道路，不在 Eventide 建筑内部。",
      builds: ["netrunner", "blades", "stealth", "solo"], source: "https://www.powerpyx.com/cyberpunk-2077-all-restricted-data-terminal-locations-relic-points/"
    },
    {
      id: "relic-terminal-07", name: "限制数据终端 07", english: "Brave Atlas Parking Deck", type: "progression", category: "relicTerminal", shortLabel: "R7", dlc: true,
      district: "狗镇 / Golden Pacific", location: "Brave Atlas 球形地标西侧停车楼上层", map: "dogtown", x: 52, y: 64,
      mission: "《往日之影》开放世界收集", acquisition: "沿停车楼楼梯到街面以上的平台，在碎石堆和青绿色涂鸦墙旁找到。",
      effect: "获得 1 点遗物点。", warning: "应标在停车楼西侧平台，不是球体中心。",
      builds: ["netrunner", "blades", "stealth", "solo"], source: "https://www.powerpyx.com/cyberpunk-2077-all-restricted-data-terminal-locations-relic-points/"
    },
    {
      id: "relic-terminal-08", name: "限制数据终端 08", english: "Longshore Stacks Underground", type: "progression", category: "relicTerminal", shortLabel: "R8", dlc: true,
      district: "狗镇 / Longshore Stacks", location: "Kress Street 西侧 Barghest 地下基地二层控制室", map: "dogtown", x: 26, y: 55,
      mission: "增强犯罪活动：Ross Ulmer", acquisition: "穿过长隧道到大型处理室；门锁时从下层地板舱口、通风道和梯子绕入。",
      effect: "获得 1 点遗物点。", warning: "位于地下基地内部，不在地表标记层。",
      builds: ["netrunner", "blades", "stealth", "solo"], source: "https://www.powerpyx.com/cyberpunk-2077-all-restricted-data-terminal-locations-relic-points/"
    },
    {
      id: "relic-terminal-09", name: "限制数据终端 09", english: "Heavy Hearts Elevated Walkway", type: "progression", category: "relicTerminal", shortLabel: "R9", dlc: true,
      district: "狗镇 / Golden Pacific", location: "Heavy Hearts 正门对面废弃建筑二层高架", map: "dogtown", x: 61, y: 42,
      mission: "《往日之影》开放世界收集", acquisition: "穿过绿色施工机械，从混凝土楼梯上高架步道，顶部左转绕过墙角。",
      effect: "获得 1 点遗物点。", warning: "图标只有靠近才出现，终端在二层而非街面。",
      builds: ["netrunner", "blades", "stealth", "solo"], source: "https://www.powerpyx.com/cyberpunk-2077-all-restricted-data-terminal-locations-relic-points/"
    }
  ];

  const perk = (id, name, english, attr, requires, cost, prerequisites = []) => ({
    id, name, english, attr, requires, cost, prerequisites
  });

  const relic = (id, name, english, cost, prerequisites = []) => ({ id, name, english, cost, prerequisites });

  const builds = [
    {
      id: "netrunner", label: "超频黑客", english: "OVERCLOCK NETRUNNER", accent: "#75a7ff",
      summary: "用队列与超频把生命转成 RAM，先控制再上传战斗破解；单分子线负责近身回收节奏。",
      loop: ["扫描并标记高威胁目标", "控制破解先入队列", "开启超频倾泻战斗破解", "单分子线或智能武器收尾"],
      opening: { body: 4, reflexes: 3, technical: 6, intelligence: 6, cool: 3 },
      targets: { body: 15, reflexes: 15, technical: 20, intelligence: 20, cool: 11 },
      gear: ["tetratronic-rippler", "militech-canto", "yinglong", "monowire"],
      perks: [
        perk("optimization", "优化", "Optimization", "intelligence", 4, 1),
        perk("hack-queue", "破解队列", "Hack Queue", "intelligence", 9, 2, ["optimization"]),
        perk("embedded-exploit", "嵌入式漏洞", "Embedded Exploit", "intelligence", 15, 2, ["hack-queue"]),
        perk("blood-daemon", "鲜血魔偶", "Blood Daemon", "intelligence", 15, 1, ["hack-queue"]),
        perk("overclock", "超频", "Overclock", "intelligence", 20, 1, ["embedded-exploit"]),
        perk("queue-acceleration", "队列加速", "Queue Acceleration", "intelligence", 20, 3, ["overclock"]),
        perk("sublimation", "升华", "Sublimation", "intelligence", 20, 1, ["overclock"]),
        perk("all-things-cyber", "义体全才", "All Things Cyber", "technical", 9, 2),
        perk("license-to-chrome", "铬金执照", "License to Chrome", "technical", 15, 3, ["all-things-cyber"]),
        perk("edgerunner", "边缘行者", "Edgerunner", "technical", 20, 1, ["license-to-chrome"])
      ],
      relics: [
        relic("jailbreak", "越狱", "Jailbreak", 3),
        relic("data-tunneling", "数据隧道", "Data Tunneling", 1, ["jailbreak"]),
        relic("vulnerability-analytics", "弱点分析", "Vulnerability Analytics", 3),
        relic("machine-learning", "机器学习", "Machine Learning", 1, ["vulnerability-analytics"])
      ]
    },
    {
      id: "blades", label: "刀剑时停", english: "BULLET-TIME NINJA", accent: "#f0d84c",
      summary: "斯安威斯坦打开处决窗口，冲刺和空中冲刺快速贴身；白虎负责连续击杀，勘误处理燃烧目标。",
      loop: ["空中冲刺切入后排", "开启斯安威斯坦", "弹反或跃击建立首杀", "利用白虎攻速连续处决"],
      opening: { body: 4, reflexes: 6, technical: 6, intelligence: 3, cool: 3 },
      targets: { body: 20, reflexes: 20, technical: 20, intelligence: 3, cool: 18 },
      gear: ["byakko", "errata", "militech-apogee", "axolotl"],
      perks: [
        perk("slippery", "闪避本能", "Slippery", "reflexes", 4, 1),
        perk("dash", "冲刺", "Dash", "reflexes", 9, 2, ["slippery"]),
        perk("lead-and-steel", "铅与钢", "Lead and Steel", "reflexes", 9, 2),
        perk("bullet-deflect", "子弹反弹", "Bullet Deflect", "reflexes", 9, 1, ["lead-and-steel"]),
        perk("air-dash", "空中冲刺", "Air Dash", "reflexes", 15, 3, ["dash"]),
        perk("finisher-bladerunner", "终结技：刀剑行者", "Finisher: Bladerunner", "reflexes", 15, 3, ["lead-and-steel"]),
        perk("tailwind", "顺风", "Tailwind", "reflexes", 20, 1, ["air-dash"]),
        perk("slaughterhouse", "屠宰场", "Slaughterhouse", "reflexes", 20, 1, ["finisher-bladerunner"]),
        perk("all-things-cyber", "义体全才", "All Things Cyber", "technical", 9, 2),
        perk("license-to-chrome", "铬金执照", "License to Chrome", "technical", 15, 3, ["all-things-cyber"]),
        perk("edgerunner", "边缘行者", "Edgerunner", "technical", 20, 1, ["license-to-chrome"])
      ],
      relics: [
        relic("jailbreak", "越狱", "Jailbreak", 3),
        relic("spatial-mapping", "空间映射", "Spatial Mapping", 1, ["jailbreak"]),
        relic("vulnerability-analytics", "弱点分析", "Vulnerability Analytics", 3),
        relic("machine-learning", "机器学习", "Machine Learning", 1, ["vulnerability-analytics"])
      ]
    },
    {
      id: "stealth", label: "潜行枪刃", english: "GHOST OPERATIVE", accent: "#79b98a",
      summary: "以潜行爆头和投掷武器无声清场，暴露后用光学迷彩重新断线，再借斯安威斯坦完成撤离或强杀。",
      loop: ["观察路线并标记摄像头", "消音手枪处理孤立目标", "投掷武器回收连杀", "光学迷彩重置警戒"],
      opening: { body: 3, reflexes: 6, technical: 4, intelligence: 3, cool: 6 },
      targets: { body: 18, reflexes: 20, technical: 20, intelligence: 3, cool: 20 },
      gear: ["her-majesty", "agaou", "optical-camo", "cockatrice", "militech-apogee"],
      perks: [
        perk("killer-instinct", "杀手本能", "Killer Instinct", "cool", 4, 1),
        perk("feline-footwork", "猫步", "Feline Footwork", "cool", 4, 1),
        perk("focus", "专注", "Focus", "cool", 9, 2, ["killer-instinct"]),
        perk("scorpion-sting", "蝎尾狮刺", "Scorpion Sting", "cool", 9, 2, ["killer-instinct"]),
        perk("neurotoxin", "神经毒素", "Neurotoxin", "cool", 9, 1, ["scorpion-sting"]),
        perk("deadeye", "神枪", "Deadeye", "cool", 15, 3, ["focus"]),
        perk("juggler", "杂耍专家", "Juggler", "cool", 15, 3, ["scorpion-sting"]),
        perk("head-to-head", "正面交锋", "Head to Head", "cool", 15, 1, ["deadeye"]),
        perk("nerves-of-tungsten-steel", "钨钢神经", "Nerves of Tungsten-Steel", "cool", 20, 1, ["deadeye"]),
        perk("style-over-substance", "形式高于实质", "Style Over Substance", "cool", 20, 1, ["juggler"])
      ],
      relics: [
        relic("emergency-cloaking", "紧急隐身", "Emergency Cloaking", 3),
        relic("sensory-protocol", "感官协议", "Sensory Protocol", 1, ["emergency-cloaking"]),
        relic("vulnerability-analytics", "弱点分析", "Vulnerability Analytics", 3),
        relic("machine-learning", "机器学习", "Machine Learning", 1, ["vulnerability-analytics"])
      ]
    },
    {
      id: "solo", label: "狂暴重装", english: "SAVAGE SOLO", accent: "#ef715e",
      summary: "用肾上腺素和高义体容量承受正面火力，狂暴提供不可阻挡的贴脸窗口，霰弹枪或钝器完成终结。",
      loop: ["手雷或技术霰弹枪开场", "肾上腺素吸收第一轮伤害", "开启狂暴贴近精英", "终结技延续恢复循环"],
      opening: { body: 6, reflexes: 4, technical: 6, intelligence: 3, cool: 3 },
      targets: { body: 20, reflexes: 20, technical: 20, intelligence: 3, cool: 18 },
      gear: ["bloody-maria", "militech-berserk", "axolotl", "order"],
      perks: [
        perk("painkiller", "止痛药", "Painkiller", "body", 4, 1),
        perk("dorph-head", "多巴胺头脑", "Dorph-head", "body", 4, 1, ["painkiller"]),
        perk("die-die-die", "死！死！死！", "Die! Die! Die!", "body", 9, 2),
        perk("wrecking-ball", "破坏球", "Wrecking Ball", "body", 9, 2),
        perk("adrenaline-rush", "肾上腺素爆发", "Adrenaline Rush", "body", 15, 3, ["painkiller"]),
        perk("spontaneous-obliteration", "自发湮灭", "Spontaneous Obliteration", "body", 15, 3, ["die-die-die"]),
        perk("finisher-savage-sling", "终结技：野蛮投掷", "Finisher: Savage Sling", "body", 15, 3, ["wrecking-ball"]),
        perk("rip-and-tear", "撕裂", "Rip and Tear", "body", 20, 1, ["spontaneous-obliteration"]),
        perk("all-things-cyber", "义体全才", "All Things Cyber", "technical", 9, 2),
        perk("license-to-chrome", "铬金执照", "License to Chrome", "technical", 15, 3, ["all-things-cyber"]),
        perk("edgerunner", "边缘行者", "Edgerunner", "technical", 20, 1, ["license-to-chrome"])
      ],
      relics: [
        relic("jailbreak", "越狱", "Jailbreak", 3),
        relic("limiter-removal", "移除限制", "Limiter Removal", 1, ["jailbreak"]),
        relic("vulnerability-analytics", "弱点分析", "Vulnerability Analytics", 3),
        relic("machine-learning", "机器学习", "Machine Learning", 1, ["vulnerability-analytics"])
      ]
    }
  ];

  const rules = {
    levelCap: { base: 50, dlc: 60 },
    startingAttributeTotal: 22,
    attributeMin: 3,
    attributeMax: 20,
    skillBonusMax: 10,
    shardBonusMax: { base: 10, dlc: 13 },
    relicPointMax: 15,
    perkTiers: [4, 9, 15, 20]
  };

  const sources = [
    { label: "官方 2.0 构筑规划器说明", url: "https://www.cyberpunk.net/en/news/48958/build-planner-craft-your-cyberpunk-2077-and-phantom-liberty-builds" },
    { label: "官方 Update 2.0 说明", url: "https://www.cyberpunk.net/en/news/49060/update-2-0" },
    { label: "等级、属性与技能规则", url: "https://cyberpunk.fandom.com/wiki/Cyberpunk_2077_Character_Customization" },
    { label: "专长芯片位置表", url: "https://cyberpunk.fandom.com/wiki/Perk_Shard" },
    { label: "15 点遗物点来源", url: "https://www.powerpyx.com/cyberpunk-2077-all-restricted-data-terminal-locations-relic-points/" },
    { label: "夜之城地图来源", url: "https://cyberpunk.fandom.com/wiki/Night_City" },
    { label: "狗镇地图来源", url: "https://cyberpunk.fandom.com/wiki/Dogtown" },
    { label: "CDPR 粉丝内容指南", url: "https://www.cdprojektred.com/en/fan-content" }
  ];

  return { attributes, maps, items, builds, rules, sources };
})();
