const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");
const classList = { add() {}, remove() {}, toggle() {} };
const element = () => ({
  innerHTML: "",
  value: "",
  textContent: "",
  classList,
  addEventListener() {},
  querySelectorAll() { return []; },
  focus() {}
});

const app = element();
const elements = {
  "#app": app,
  "#route-switch": element(),
  "#chapter-select": element(),
  "#view-nav": element(),
  "#global-search": element(),
  "#toast": element()
};
const windowObject = { scrollTo() {}, print() {} };
const context = vm.createContext({
  window: windowObject,
  document: { querySelector(selector) { return elements[selector] || element(); } },
  localStorage: { getItem() { return null; }, setItem() {} },
  console,
  setTimeout() { return 0; },
  clearTimeout() {},
  requestAnimationFrame(callback) { callback(); }
});

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

context.window.FE3H_MAP_DETAILS.records["wc-1"] = {
  version: 1,
  scenario: 1,
  variants: {
    AM: {
      version: 1,
      grid: { cols: 32, rows: 32, bounds: { x: 0, y: 0, width: 20, height: 22 } },
      tiles: [
        { x: 0, y: 0, base: 1, overlay: 0, name: "平原" },
        { x: 1, y: 0, base: 2, overlay: 0, name: "森林" }
      ],
      units: [
        { slot: 0, x: 2, y: 20, team: "player", characterName: "Byleth", className: "Commoner", items: [], scriptSpawn: false },
        { slot: 1, x: 10, y: 2, team: "enemy", characterName: "Hanneman", className: "Mage", items: [{ name: "Intermediate Seal", droppable: true }], scriptSpawn: false, commander: true }
      ],
      spawnDefinitions: [
        { slot: 3, x: 255, y: 254, team: "enemy", characterName: "Script Mage", className: "Warlock", level: 31, items: [{ name: "Dark Seal", droppable: true }], skillNames: ["Reason Prowess Lv.5"], spells: [{ name: "Meteor" }], combatArt: { name: "Hexblade" }, battalion: { enabled: true, name: "Empire Magic Corps", level: 5 }, movement: { name: "Can Move But Wont" }, rotation: { name: "Down" }, scriptSpawn: true }
      ],
      treasures: [{ x: 4, y: 5, label: "测试宝箱", items: [{ name: "Bullion" }] }],
      events: [
        { type: "reinforcement", x: 8, y: 1, trigger: { turn: 3, phase: "enemy" }, summary: "测试援军" },
        { type: "ambush", spawns: [{ slot: 3, x: 9, y: 1 }], trigger: { condition: "进入区域" }, summary: "测试伏兵" },
        { type: "reward", label: "测试条件奖励", trigger: { condition: "击败敌将" }, summary: "道具 #42" }
      ],
      completeness: { terrain: true, bounds: true, units: true, spawnDefinitions: true, items: true, treasures: true, events: true }
    }
  }
};
const appSource = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");
vm.runInContext(appSource, context, { filename: "app.js" });
assert.match(
  appSource,
  /panel\.toggleAttribute\("hidden", panel\.dataset\.mapLayerPanel !== layer\)/,
  "SVG terrain layer must remove its hidden attribute when selected"
);

for (const route of ["AM", "VW", "CF", "SS"]) {
  const result = vm.runInContext(`(() => {
    state.route = "${route}";
    state.chapter = battlesForRoute().at(-1).id;
    activeView = "command";
    render();
    return { id: currentBattle().id, title: currentBattle().title, length: battlesForRoute().length };
  })()`, context);
  assert.ok(app.innerHTML.includes(result.title), `${route} 终章未渲染`);
  assert.ok(app.innerHTML.includes(`${result.length} 个关键月`), `${route} 进度分母未渲染`);
  assert.ok(app.innerHTML.includes("grid-map-canvas"), `${route} 逐格地图未渲染`);

  vm.runInContext('activeView = "battles"; render();', context);
  assert.ok(app.innerHTML.includes(`全 ${result.length} 章`), `${route} 战役索引不完整`);
  assert.ok(app.innerHTML.includes(`data-battle="${result.id}"`), `${route} 终章索引缺失`);
}

vm.runInContext('state.route = "AM"; state.chapter = "wc-1"; activeView = "command"; render();', context);
for (const marker of ["逐格语义信息层", "data-map-semantic", "Byleth", "Intermediate Seal", "测试宝箱", "测试援军", "测试伏兵", "Script Mage", "Dark Seal", "Reason Prowess Lv.5", "Meteor", "Hexblade", "Empire Magic Corps", "Can Move But Wont", "测试条件奖励", "脚本单位与事件详情", "data-map-filter=\"enemy\""]) {
  assert.ok(app.innerHTML.includes(marker), `语义地图缺少渲染标记 ${marker}`);
}
assert.ok(!app.innerHTML.includes("NaN"), "无坐标脚本事件不得生成 NaN 地图位置");

const paralogueIds = vm.runInContext("DATA.paralogues.map((entry) => entry.id)", context);
for (const id of paralogueIds) {
  const battleId = vm.runInContext(`(() => {
    selectedParalogueId = "${id}";
    paralogueFilter = "全部";
    activeView = "paralogues";
    render();
    return DATA.paralogues.find((entry) => entry.id === "${id}").battle.id;
  })()`, context);
  assert.ok(app.innerHTML.includes(`id="battle-${battleId}"`), `${id} 详细战役未渲染`);
  assert.ok(app.innerHTML.includes("地图、目标与额外奖励"), `${id} 外传索引操作缺失`);
  assert.ok(app.innerHTML.includes("data-map-hotspot"), `${id} 交互热点未渲染`);
}

console.log(`FE3H UI smoke OK: 4 routes and ${paralogueIds.length} detailed paralogues rendered.`);
