const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const context = vm.createContext({ window: {}, console });

for (const file of [
  "map-scenarios.js",
  "map-data.js",
  "map-details.js",
  "route-battles-am-vw.js",
  "route-battles-cf-ss.js",
  "paralogue-battles.js",
  "data.js"
]) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename: file });
}

const data = context.window.FE3H_DATA;
const mapData = context.window.FE3H_MAP_DATA;
const mapDetails = context.window.FE3H_MAP_DETAILS;
assert.equal(mapDetails.schemaVersion, 1, "逐格语义地图 schema 版本错误");
assert.equal(mapDetails.coordinateSystem.indexBase, 0, "逐格语义地图必须使用 0-based 坐标");
const expectedRouteLengths = { AM: 22, VW: 22, CF: 18, SS: 21 };
const requiredBattleFields = [
  "id", "title", "mission", "objective", "defeat", "deployment", "fog",
  "facts", "prep", "loot", "zones", "source"
];
const zoneTypes = new Set(["start", "boss", "trigger", "loot", "ally", "danger"]);

function battlesForRoute(route) {
  const common = route === "CF" ? data.battles.filter((battle) => battle.chapter < 12) : data.battles;
  return [...common, ...data.routeBattles[route]].sort((a, b) => a.chapter - b.chapter);
}

function validateBattle(battle, label) {
  for (const field of requiredBattleFields) {
    assert.notEqual(battle[field], undefined, `${label} 缺少 ${field}`);
  }
  for (const field of ["facts", "prep", "loot", "zones"]) {
    assert.ok(Array.isArray(battle[field]) && battle[field].length > 0, `${label}.${field} 不能为空`);
  }
  assert.match(battle.source, /^https:\/\//, `${label}.source 必须是 HTTPS`);
  for (const zone of battle.zones) {
    assert.ok(zoneTypes.has(zone.type), `${label} 含未知 zone type: ${zone.type}`);
    for (const field of ["x", "y", "w", "h"]) {
      assert.ok(Number.isFinite(zone[field]) && zone[field] >= 0 && zone[field] <= 100, `${label}.${field} 越界`);
    }
  }
}

for (const [route, length] of Object.entries(expectedRouteLengths)) {
  const pathBattles = battlesForRoute(route);
  assert.equal(pathBattles.length, length, `${route} 章节数错误`);
  assert.deepEqual(Array.from(pathBattles, (battle) => battle.chapter), Array.from({ length }, (_, index) => index + 1), `${route} 章节不连续`);
  for (const battle of pathBattles) validateBattle(battle, `${route}/${battle.id}`);
}

const allMonthlyBattles = [...data.battles, ...Object.values(data.routeBattles).flat()];
assert.equal(new Set(allMonthlyBattles.map((battle) => battle.id)).size, allMonthlyBattles.length, "月度战役 ID 必须全局唯一");

assert.equal(data.paralogues.length, 26, "外传必须完整覆盖 26 个唯一战役");
assert.ok(data.paralogues.some((entry) => entry.id === "eternal_guardian"), "缺少 Eternal Guardian");
assert.equal(new Set(data.paralogues.map((entry) => entry.id)).size, 26, "外传 ID 必须唯一");

for (const entry of data.paralogues) {
  assert.ok(Array.isArray(entry.availability) && entry.availability.length > 0, `${entry.id} 缺少结构化开放窗口`);
  assert.ok(Array.isArray(entry.parts) && entry.parts.length > 0, `${entry.id} 缺少 parts`);
  assert.equal(typeof entry.routeLimited, "boolean", `${entry.id} 缺少 routeLimited`);
  assert.ok(entry.battle, `${entry.id} 缺少详细战役`);
  assert.ok(entry.battle.id.startsWith("pl-"), `${entry.id} 战役 ID 必须使用 pl- 前缀`);
  validateBattle(entry.battle, `paralogue/${entry.id}`);
  for (const unitId of entry.units) {
    assert.ok(data.units.some((unit) => unit.id === unitId), `${entry.id} 引用了不存在的角色 ${unitId}`);
  }
}

const battleRecords = [...allMonthlyBattles, ...data.paralogues.map((entry) => entry.battle)];
assert.equal(Object.keys(mapData.records).length, battleRecords.length, "逐格地图记录必须与全部战役一一对应");
for (const battle of battleRecords) {
  const record = mapData.records[battle.id];
  assert.ok(record, `${battle.id} 缺少逐格地图记录`);
  assert.ok(record.terrain, `${battle.id} 缺少真实逐格地形源`);
  assert.match(record.source, /^https:\/\//, `${battle.id} 地图来源必须是 HTTPS`);
  if (record.terrain) {
    const { canvas, crop, cols, rows, source } = record.terrain;
    assert.ok(cols > 0 && rows > 0, `${battle.id} 网格尺寸无效`);
    assert.equal(crop.length, 4, `${battle.id} crop 必须为四元组`);
    assert.ok(crop[0] >= 0 && crop[1] >= 0 && crop[0] + crop[2] <= canvas[0] && crop[1] + crop[3] <= canvas[1], `${battle.id} crop 越界`);
    assert.match(source, /^https:\/\/assets\.fedatamine\.com\/3h\/minimaps\//, `${battle.id} 地形资源错误`);
  }
}

const fogParalogues = Array.from(data.paralogues.filter((entry) => entry.battle.fog), (entry) => entry.id).sort();
assert.deepEqual(fogParalogues, ["forgotten_hero", "legend_lake"], "外传雾战标记不正确");

const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const scriptOrder = ["map-scenarios.js", "map-data.js", "map-details.js", "route-battles-am-vw.js", "route-battles-cf-ss.js", "paralogue-battles.js", "data.js", "app.js"];
for (let index = 1; index < scriptOrder.length; index += 1) {
  assert.ok(html.indexOf(`src="${scriptOrder[index - 1]}`) < html.indexOf(`src="${scriptOrder[index]}`), `${scriptOrder[index - 1]} 必须先于 ${scriptOrder[index]} 加载`);
}
assert.match(html, /data-view="paralogues">外传战役</, "导航必须提供外传战役入口");

const appSource = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");
for (const marker of ["battlesForRoute", "data-paralogue-battle", "PARALOGUES / COMPLETE", "battleSheetMarkup(selected.battle)"]) {
  assert.ok(appSource.includes(marker), `app.js 缺少集成标记 ${marker}`);
}

console.log(`FE3H coverage OK: ${allMonthlyBattles.length} monthly battles, ${data.paralogues.length} paralogues, ${battleRecords.length} interactive map records.`);
