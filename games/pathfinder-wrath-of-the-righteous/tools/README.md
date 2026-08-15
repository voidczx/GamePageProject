# 《开拓者 - 正义之怒》数据导入器

这里有两层导入接口：

- `import-snapshot.js` 消费稳定、与来源无关的 canonical manifest，适合小型手工 fixture 或第三方 dump。
- `import-owlcat.js` 直接消费 Owlcat 安装目录的 `blueprints.zip`、`cheatdata.json`、`zhCN.json` 和 `Version.info`。

## 当前安装版导入

```powershell
node games/pathfinder-wrath-of-the-righteous/tools/import-owlcat.js `
  --install-root 'E:\Steam\steamapps\common\Pathfinder Second Adventure' `
  --json games/pathfinder-wrath-of-the-righteous/generated/wotr-2.7.0x.snapshot.json `
  --js games/pathfinder-wrath-of-the-righteous/generated/wotr-2.7.0x.snapshot.js `
  --summary
```

`owlcat-source-lock.json` 固定 Steam build 20212986、游戏版本 2.7.0x、Version.info 和三份输入数据的 SHA-256。任何一项不匹配都会在生成 snapshot 前失败，不能把其他版本误标为当前基线。

ZIP 读取由 `extract-blueprints.py` 使用 Python 标准库 `zipfile.ZipFile(..., allowZip64=True)` 完成，只提取 GUID 图闭包需要的 `.jbp`，不解包整个 25 万条归档。

Snapshot 保留：

- cheatdata GUID 索引以及无绝对路径的来源证明；
- BlueprintRoot 的职业、神话职业、种族、神祇等权威根；
- `m_AllFeatures` 嵌套 Selection 图（有 cycle guard，不拍平、不复制）；
- PrototypeLink 链和 `m_Overrides` 合并后的字段/Components；
- 前置 Components、参数化特性的 `ParameterType` / `BlueprintParameterVariants`；
- 职业 `LevelEntries`、原型 `AddFeatures` / `RemoveFeatures`、全部 BlueprintSpellList 的等级成员关系；
- zhCN 展示名与描述，缺失 key 会进入 diagnostics。

当前 lock 默认使用 `mechanics-closure`：除职业/选择/进度/原型/法术目录外，还沿 Ability、ActivatableAbility、Feature、Selection、Progression、AbilityResource、Buff、Spellbook、SpellList 白名单继续 BFS。`diagnostics.coverage` 会 fail-closed 地报告白名单剩余引用和未纳入白名单的其他 Blueprint/非 Blueprint asset。若只需要更小的目录快照，可把 `options.mechanicsClosure` 设为 `false`；两种模式都有 cycle guard，目录模式不会冒充完整规则图。

## 验证

```powershell
node games/pathfinder-wrath-of-the-righteous/tools/tests/importer.test.js
$env:WOTR_INSTALL_ROOT='E:\Steam\steamapps\common\Pathfinder Second Adventure'
node games/pathfinder-wrath-of-the-righteous/tools/tests/owlcat-real-import.test.js
```

第一条测试不依赖游戏安装；第二条使用锁定的真实数据并断言当前安装版的关键计数。
