# Cyberware Loadouts / 义体预设

为《赛博朋克 2077》义体界面增加 3 套随存档保存的义体预设。每套方案可以捕获当前全部已装备义体，并在通过安全检查后快速切换。

## 兼容性与依赖

- 游戏：Cyberpunk 2077 2.31（已用本机 2.31 脚本缓存编译验证）
- 必需：redscript 0.5.31 或更高版本
- 可选：RipperDeck 1.1.0。设计上会随其便携义体界面显示相同面板，因此预期可在不访问义体医生时保存和应用方案；该路径仍需游戏内冒烟测试。
- 兼容验证目标：Cyberware-EX 1.5.6、Codeware 1.20.3、TweakXL 1.11.4；这些都不是基础包依赖。0.3.1 不包含 CET 诊断代码，CET 不是依赖。

RipperDeck 是真正的可选依赖：本 Mod 不引用它的类型或字段。两者都包装游戏原生 `RipperDocGameController`，共存编译已经通过；未安装 RipperDeck 时不会产生缺失依赖。

## 安装

推荐使用 Vortex：

1. 安装并启用 redscript。
2. 在 Vortex 中选择“从文件安装 Mod”，选择 `CyberwareLoadouts-<version>.zip`。
3. 启用并部署 Mod。
4. 首次启动后检查 `r6/logs/redscript_rCURRENT.log`，确认没有 `CyberwareLoadouts` 编译错误。

也可以手动将发布 ZIP 解压到游戏根目录。最终路径应为：

```text
Cyberpunk 2077/
  r6/scripts/CyberwareLoadouts/*.reds
```

ZIP 根目录直接包含 `r6/`，没有额外包裹目录，符合 Vortex 的游戏根目录部署布局。0.3.1 只收录 6 个 `.reds` 源文件和 4 个说明文件，不会携带或覆盖 `r6/logs`、`r6/cache`。

包内 `mod-manifest.json` 是项目自身的可审计元数据，不是 Vortex 依赖协议；从文件安装时，仍需按上面的步骤先手动安装 redscript。正式上传 Nexus 时还应在站点的 Requirements 中声明该依赖。

## 使用

1. 打开义体医生界面；若安装 RipperDeck，也可在冒烟确认面板出现后使用其便携义体界面。
2. 右下角会显示“义体预设 / CYBERWARE LOADOUTS”。
3. 点击某一行的“保存 / SAVE”，用当前已装备的全部义体覆盖该方案。
4. 点击“装备 / EQUIP”应用方案。

预设数据写入当前游戏存档，每个角色/存档互不影响。方案会保存当时的精确 `ItemID` 作为优先提示，同时保存稳定的物品记录、装备区域、槽位，以及 Cyberdeck 程序记录和 attachment slot。应用时先使用仍然存在的精确实例；若游戏或其他 Mod 在装备事务中重建了 ID，只允许回退到同记录、同装备区域且尚未被本方案占用的唯一候选。存在多个候选时会安全拒绝，不会任取一个“同名义体”，Apply 本身也不会生成缺失物品。完全相同的当前方案会直接返回成功，不触发卸装事务。

带“义体升级时可选择不同词条”专长的骨骼义体有特殊生命周期：玩家库存实际持有基础义体（backing original），槽位的 `PowerUpCyberwareEffector` 会在装备时临时生成带所选词条的 side-upgrade 实例，卸下时再由原生游戏删除该派生实例。0.3.1 的“保存”只读取当前装备槽，不遍历库存、不调用词条映射 API；因此保存和普通手动装卸不会进入特殊身份逻辑。用户点击“装备”时，如果保存的临时 side 已消失，resolver 才从真实库存候选的静态 `SideUpgradeItem` 关系中寻找 backing：唯一命中时装备 backing，让游戏专长重新生成词条版本；多个命中则拒绝应用。完成比对把 backing 与其 side record 视为同一逻辑义体，并将稳定 backing 身份写回该方案。Mod 不调用 `GiveItems`，不固化或复制派生项。

0.3.1 延续 `CyberwareLoadoutsV3` ScriptableSystem 持久化身份，完全不加载、不识别、不迁移 0.1.x 或 0.2.0 的预设对象。持久层不保存任何自定义 `Preset`/`Entry` 引用：只使用平行的 `Bool`、`Int32`、`ItemID`、`TweakDBID` 和装备区域值数组；读取时才重建临时运行时对象。

## 切换安全规则

保存只是只读快照，不受下列限制；实际装备方案会在任何变更前执行完整预检。

| 状态 | 行为 | 原因 |
| --- | --- | --- |
| 战斗中 | 禁止 | 避免装备 GLP、属性包和战斗状态机在同一帧重建 |
| 死亡/复活、游泳、SceneTier2–5 剧情层级或终结技工作点 | 禁止 | 玩家状态机不处于稳定状态；正常开放世界 SceneTier1 和普通 Hub/义体菜单导航锁不会触发该门禁 |
| 载具中 | 禁止 | 防止手臂义体、快捷栏与载具武器槽耦合 |
| 任意非默认时间膨胀，或 Sandevistan、Berserk、Overclock、光学迷彩主动效果中 | 禁止 | 卸下效果来源可能遗留时间膨胀、无敌或可见性效果；也覆盖 Kerenzikov 等非 Sandevistan 时间膨胀 |
| 螳螂刀/大猩猩手臂等手臂义体或弹射发射系统已抽出 | 禁止 | 防止武器附件槽指向已卸载义体 |
| 预设物品已出售/分解 | 禁止且不改动装备 | Mod 不会复制或生成缺失义体 |
| 具体槽位被锁定、物品不可装备或 `cyberwareType` 冲突 | 禁止且不改动装备 | 支持洗点、物品变化或 Cyberware-EX 槽位配置变化 |
| Humanity 容量不足，或移除 Capacity Booster 会造成非法容量 | 禁止且不改动装备 | 在第一次卸载请求前完成整套容量预检 |
| 装备阶段仍被游戏拒绝 | 自动回滚 | 通过同一套非强制原生请求恢复切换前的装备、槽位与 Cyberdeck 程序 |

切换采用“完整预检 → 一个原生 `EquipmentSystem` 串行批次 → 权威完成回调 → 完整比对 → 必要时用第二个批次回滚并再次比对”的事务流程。批次内部调用游戏自己的 `OnUnequipRequest` / `OnGameplayEquipRequest`，卸载始终使用 `force = false`，不会绕过 `UnequipBlocked`；完成信号由同一个 EquipmentSystem handler 在全部操作之后发出，不依赖猜测延时或 `IsEquipPending()`。原方案中仍位于同一槽位、程序配置也相同的具体义体实例不会被重复卸载。

冷却本身不会被清零、复制或跨物品迁移，本 Mod 也不依赖未经 2.31 原生脚本证实的猜测型 cooldown 状态 ID。为避开已知高风险耦合，主动效果和所有非默认时间膨胀期间一律拒绝切换。

## 构建与验证

从此目录运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\Build.ps1
powershell -ExecutionPolicy Bypass -File .\tools\Verify.ps1 -GameDir "E:\Steam\steamapps\common\Cyberpunk 2077"
```

`Verify.ps1` 会先冻结一个只读发布输入快照并验证关键安全不变量，再执行四组编译：基础游戏、仅 RipperDeck、Cyberware-EX + Codeware + TweakXL，以及全部共存。基础 2.31 cache 与 redscript 0.5.31 编译器采用固定 SHA-256 验证；只有这些检查通过后，才从同一快照生成 ZIP、逐条目核对内容并写出 SHA-256。若只需显式跳过编译检查，可传入 `-SkipCompile`。

## 已知边界

- 当前固定提供 3 套方案，不支持重命名。
- Mod 不绕过义体容量、技能、槽位或物品所有权限制。
- 不允许保存真正的空方案，避免把误操作解释为“卸下全部义体”。
- 义体升级、重做或其他 Mod 改变物品记录或实际产生多个同记录候选后，旧方案会安全拒绝应用；请重新保存该方案。
- 若玩家持有多个都以同一 `SideUpgradeItem` 记录生成相同词条版本的骨骼义体，Mod 无法只靠稳定库存数据证明当前派生项来自哪一个 backing，因此会拒绝保存；请先保留唯一候选再保存。
- 仅发生动态 `ItemID` 漂移、但同记录候选唯一时，预设会自动重绑定；若玩家拥有多个同记录实例且原精确 ID 已失效，缺少额外稳定指纹时只能拒绝并要求重新保存，避免选择错误实例。
- 保存/装备采用固定 72 px 高命中框，不再随文字收缩，适配鼠标和手柄虚拟光标；D-pad 焦点导航仍未实现。
- 2.31 脚本证明 Cyberdeck 卸载会同步调用原生 `TransactionSystem.RemovePart`；该 native 函数本体不可见，因此“同一精确程序从 deck A 迁移到 deck B”仍应在游戏内补做一次冒烟测试。卸载后程序必须成为背包物品，或仍精确安装在目标 Cyberdeck 的原 attachment slot；两者都不满足时，Mod 会在装备目标前中止并回滚。
- 当前验证证明 2.31 编译与 ZIP 布局正确；Vortex 实际部署/禁用/卸载以及游戏内点击、存档重载仍需在目标环境完成冒烟测试。
- 删除或降级会改变义体槽数量的其他 Mod 前，建议先装备一个原版槽位可容纳的方案并手动保存游戏。
- 安装或卸载带持久化数据的脚本 Mod 前请备份重要存档。

## 许可

MIT，见 `LICENSE`。
