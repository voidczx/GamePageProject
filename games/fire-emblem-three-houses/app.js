const DATA = window.FE3H_DATA;
const MAP_RECORDS = window.FE3H_MAP_DATA?.records || {};
const MAP_DETAILS = window.FE3H_MAP_DETAILS?.records || {};
const STORAGE_KEY = "FE3H_COMMAND_V2";
const ROUTE_LABELS = { AM: "青狮", VW: "金鹿", CF: "红花", SS: "教会" };
const HOUSE_FILTERS = ["全部", "主角", "黑鹫", "青狮", "金鹿", "灰狼", "教会", "其他"];
const PORTRAIT_ROOT = "https://www.fe3h.com/assets/images/characters/small";

const app = document.querySelector("#app");
const routeSwitch = document.querySelector("#route-switch");
const chapterSelect = document.querySelector("#chapter-select");
const viewNav = document.querySelector("#view-nav");
const globalSearch = document.querySelector("#global-search");
const toast = document.querySelector("#toast");

let state = loadState();
let activeView = "command";
let rosterFilter = "全部";
let paralogueFilter = "全部";
let selectedParalogueId = DATA.paralogues[0]?.id || "";
let toastTimer;

function battlesForRoute(route = state?.route || "AM") {
  const common = route === "CF" ? DATA.battles.filter((battle) => battle.chapter < 12) : DATA.battles;
  return [...common, ...(DATA.routeBattles?.[route] || [])].sort((a, b) => a.chapter - b.chapter);
}

function battleIdForChapter(route, chapter) {
  const path = battlesForRoute(route);
  return (path.find((battle) => battle.chapter === chapter)
    || [...path].reverse().find((battle) => battle.chapter <= chapter)
    || path[0]).id;
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const route = saved?.route && DATA.routes[saved.route] ? saved.route : "AM";
    const path = battlesForRoute(route);
    const legacyChapter = route === "CF" && saved?.chapter === "wc-12" ? "cf-12" : saved?.chapter;
    const completed = { ...(saved?.completed || {}) };
    if (route === "CF" && completed["wc-12"] && completed["cf-12"] === undefined) completed["cf-12"] = true;
    return {
      route,
      chapter: path.some((battle) => battle.id === legacyChapter) ? legacyChapter : "wc-1",
      completed,
      prep: saved?.prep || {}
    };
  } catch {
    return { route: "AM", chapter: "wc-1", completed: {}, prep: {} };
  }
}

function saveState(message) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (message) showToast(message);
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1700);
}

function setupControls() {
  routeSwitch.innerHTML = Object.entries(ROUTE_LABELS).map(([id, label]) =>
    `<button class="${state.route === id ? "active" : ""}" data-route="${id}" aria-pressed="${state.route === id}">${label}</button>`
  ).join("");

  chapterSelect.innerHTML = battlesForRoute().map((battle) =>
    `<option value="${battle.id}" ${battle.id === state.chapter ? "selected" : ""}>${battle.month} · Ch.${battle.chapter} ${battle.title}</option>`
  ).join("");
}

function setView(view) {
  activeView = view;
  globalSearch.value = "";
  viewNav.querySelectorAll("button").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  render();
  app.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function currentBattle() {
  const path = battlesForRoute();
  return path.find((battle) => battle.id === state.chapter) || path[0];
}

function pageHead(code, title, description, actions = "") {
  return `<header class="page-head"><div><span class="section-code">${code}</span><h1>${title}</h1><p>${description}</p></div>${actions ? `<div class="page-actions">${actions}</div>` : ""}</header>`;
}

const MAP_ZONE_LABELS = { start: "我方", boss: "敌将", trigger: "触发", loot: "宝箱 / 道具", ally: "友军", danger: "增援 / 危险" };
const MAP_ZONE_SYMBOLS = { start: "我", boss: "将", trigger: "!", loot: "箱", ally: "友", danger: "援" };
const MAP_TEAM_LABELS = { player: "我方", enemy: "敌军", ally: "友军", npc: "友军", 0: "我方", 1: "敌军", 2: "友军" };
const MAP_TEAM_SYMBOLS = { player: "我", enemy: "敌", ally: "友", npc: "友", 0: "我", 1: "敌", 2: "友" };

function escapeMarkup(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function semanticBounds(semantic, terrain) {
  const bounds = semantic?.grid?.bounds;
  if (bounds && [bounds.x, bounds.y, bounds.width, bounds.height].every(Number.isFinite)) return bounds;
  return { x: 0, y: 0, width: terrain?.cols || semantic?.grid?.cols || 1, height: terrain?.rows || semantic?.grid?.rows || 1 };
}

function semanticForBattle(battleId, map) {
  const record = MAP_DETAILS[battleId] || map.semantic || null;
  if (!record?.variants) return record;
  return record.variants[state.route] || record.variants.default || null;
}

function semanticPosition(entity, bounds) {
  const x = Number.isFinite(entity.x) ? entity.x : entity.col;
  const y = Number.isFinite(entity.y) ? entity.y : entity.row;
  const width = entity.width || entity.cols || 1;
  const height = entity.height || entity.rows || 1;
  return `left:${(x - bounds.x) / bounds.width * 100}%;top:${(y - bounds.y) / bounds.height * 100}%;width:${width / bounds.width * 100}%;height:${height / bounds.height * 100}%`;
}

function semanticPositionSource(entity) {
  const candidates = [entity?.area, entity?.position, entity, ...(entity?.spawns || [])];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const x = Number.isFinite(candidate.x) ? candidate.x : candidate.col;
    const y = Number.isFinite(candidate.y) ? candidate.y : candidate.row;
    if (Number.isFinite(x) && Number.isFinite(y)) return candidate;
    if ([candidate.left, candidate.top, candidate.right, candidate.bottom].every(Number.isFinite)) {
      return {
        x: candidate.left,
        y: candidate.top,
        width: candidate.right - candidate.left + 1,
        height: candidate.bottom - candidate.top + 1
      };
    }
  }
  return null;
}

function semanticTriggerText(trigger = {}) {
  const labels = { turn: "回合", phase: "阶段", difficulty: "难度", route: "路线", condition: "条件" };
  return Object.entries(trigger).filter(([, value]) => value !== undefined && value !== null && typeof value !== "object").map(([key, value]) => `${labels[key] || key}：${value}`).join("；");
}

function semanticUnitDetailText(unit, includeSlot = false) {
  const team = unit.team ?? "enemy";
  const items = (unit.items || []).filter((item) => item && (item.id !== undefined || item.name)).map((item) => `${item.name || `道具 #${item.id}`}${item.droppable ? "（掉落）" : ""}`).join("、");
  const skillNames = (unit.skillNames || (unit.skills || []).map((skill) => skill?.name || (skill?.id !== undefined ? `技能 #${skill.id}` : `技能 #${skill}`))).filter(Boolean).join("、");
  const spells = (unit.spells || []).map((spell) => spell.name || `法术 #${spell.id ?? spell}`).join("、");
  const battalion = unit.battalion?.enabled ? `${unit.battalion.name || `骑士团 #${unit.battalion.id ?? "?"}`} Lv.${unit.battalion.level ?? "?"}` : "";
  const combatArt = unit.combatArt ? unit.combatArt.name || `战技 #${unit.combatArt.id}` : "";
  return [
    includeSlot ? `BAI slot ${unit.slot ?? "?"}` : "",
    MAP_TEAM_LABELS[team] || team,
    unit.className || (unit.classId !== undefined && unit.classId !== null ? `职业 #${unit.classId}` : "职业未命名"),
    Number.isFinite(unit.level) ? `Lv.${unit.level}` : "",
    items ? `携带：${items}` : "无携带物记录",
    skillNames && `技能：${skillNames}`,
    spells && `法术：${spells}`,
    combatArt && `战技：${combatArt}`,
    battalion && `骑士团：${battalion}`,
    unit.movement?.name && `AI：${unit.movement.name}`,
    unit.rotation?.name && `朝向：${unit.rotation.name}`,
    unit.scriptSpawn ? "脚本生成单位" : "初始部署",
    unit.commander ? "敌将 / 指挥官" : ""
  ].filter(Boolean).join(" · ");
}

function semanticUnitMarkup(unit, bounds, index) {
  const team = unit.team ?? "enemy";
  const group = team === 0 ? "player" : team === 1 ? "enemy" : team === 2 ? "ally" : team;
  const title = unit.name || unit.characterName || (unit.characterId !== undefined ? `角色 #${unit.characterId}` : `单位 ${index + 1}`);
  const detail = semanticUnitDetailText(unit);
  return `<button class="map-semantic-marker unit ${group} ${unit.commander ? "commander" : ""}" data-map-semantic data-semantic-group="${group}" style="${semanticPosition(unit, bounds)}" aria-label="${escapeMarkup(title)}：${escapeMarkup(detail)}"><span class="map-semantic-symbol">${MAP_TEAM_SYMBOLS[team] || MAP_TEAM_SYMBOLS[group] || "兵"}</span><span class="map-semantic-title">${escapeMarkup(title)}</span><span class="map-semantic-detail">${escapeMarkup(detail)}</span></button>`;
}

function semanticTreasureMarkup(treasure, bounds, index) {
  const title = treasure.label || treasure.name || `宝箱 ${index + 1}`;
  const items = (treasure.items || []).map((item) => item.name || `道具 #${item.id ?? item}`).join("、");
  const detail = [treasure.kind || "宝箱", items ? `内容：${items}` : "内容未解析", semanticTriggerText(treasure.condition)].filter(Boolean).join(" · ");
  return `<button class="map-semantic-marker treasure" data-map-semantic data-semantic-group="treasure" style="${semanticPosition(treasure, bounds)}" aria-label="${escapeMarkup(title)}：${escapeMarkup(detail)}"><span class="map-semantic-symbol">箱</span><span class="map-semantic-title">${escapeMarkup(title)}</span><span class="map-semantic-detail">${escapeMarkup(detail)}</span></button>`;
}

function semanticEventMarkup(event, bounds, index) {
  const typeLabels = { deployment: "脚本部署", reinforcement: "援军", ambush: "伏兵", trigger: "区域触发", reward: "条件奖励", objective: "目标变化" };
  const title = event.label || typeLabels[event.type] || `事件 ${index + 1}`;
  const trigger = semanticTriggerText(event.trigger || event.condition);
  const detail = [typeLabels[event.type] || event.type, trigger, event.summary].filter(Boolean).join(" · ") || "事件详情未命名";
  const position = semanticPositionSource(event);
  if (!position) return "";
  return `<button class="map-semantic-marker event ${escapeMarkup(event.type || "trigger")}" data-map-semantic data-semantic-group="event" style="${semanticPosition(position, bounds)}" aria-label="${escapeMarkup(title)}：${escapeMarkup(detail)}"><span class="map-semantic-symbol">${event.type === "ambush" ? "伏" : event.type === "reinforcement" ? "援" : "!"}</span><span class="map-semantic-title">${escapeMarkup(title)}</span><span class="map-semantic-detail">${escapeMarkup(detail)}</span></button>`;
}

function semanticDefinitionDetail(definition, index) {
  const title = definition.name || definition.characterName || (definition.characterId !== undefined && definition.characterId !== null ? `角色 #${definition.characterId}` : `生成定义 ${index + 1}`);
  const detail = semanticUnitDetailText(definition, true);
  return `<li><strong>${escapeMarkup(title)}</strong><span>${escapeMarkup(detail)}</span></li>`;
}

function semanticEventDetail(event, index) {
  const typeLabels = { deployment: "脚本部署", reinforcement: "援军", ambush: "伏兵", trigger: "区域触发", reward: "条件奖励", objective: "目标变化" };
  const title = event.label || typeLabels[event.type] || `事件 ${index + 1}`;
  const trigger = semanticTriggerText(event.trigger || event.condition);
  const spawns = (event.spawns || []).map((spawn) => `slot ${spawn.slot ?? "?"} @ (${spawn.x}, ${spawn.y})`).join("、");
  const source = event.source ? `事件 ${event.source.eventNum ?? event.source.eventIndex ?? "?"} / opcode ${event.source.opcode ?? "?"}` : "";
  const detail = [typeLabels[event.type] || event.type, trigger, spawns && `生成：${spawns}`, event.summary, source].filter(Boolean).join(" · ") || "事件详情未命名";
  return `<li><strong>${escapeMarkup(title)}</strong><span>${escapeMarkup(detail)}</span></li>`;
}

function semanticScriptDetailsMarkup(spawnDefinitions, events) {
  if (!spawnDefinitions.length && !events.length) return "";
  return `<details class="map-script-details">
    <summary>脚本单位与事件详情 · ${spawnDefinitions.length} 个生成定义 / ${events.length} 个事件</summary>
    ${spawnDefinitions.length ? `<section><h4>生成单位定义</h4><ul>${spawnDefinitions.map(semanticDefinitionDetail).join("")}</ul></section>` : ""}
    ${events.length ? `<section><h4>事件候选</h4><ul>${events.map(semanticEventDetail).join("")}</ul></section>` : ""}
  </details>`;
}

function semanticTileLayerMarkup(semantic, bounds) {
  if (!Array.isArray(semantic?.tiles) || !semantic.tiles.length) return "";
  const tiles = new Map(semantic.tiles.map((tile) => [`${tile.x},${tile.y}`, tile]));
  const cells = [];
  for (let y = bounds.y; y < bounds.y + bounds.height; y += 1) {
    for (let x = bounds.x; x < bounds.x + bounds.width; x += 1) {
      const tile = tiles.get(`${x},${y}`);
      if (!tile) {
        cells.push("<span class=\"map-semantic-tile empty\"></span>");
        continue;
      }
      const title = tile.name || `地形格 ${x}, ${y}`;
      const detail = [tile.name, `基础层 #${tile.base}`, `覆盖层 #${tile.overlay}`].filter((item) => item !== undefined && item !== "").join(" · ");
      cells.push(`<button class="map-semantic-tile" tabindex="-1" data-map-semantic data-semantic-group="terrain-detail" aria-label="${escapeMarkup(title)}：${escapeMarkup(detail)}"><span class="map-semantic-title">${escapeMarkup(title)}</span><span class="map-semantic-detail">${escapeMarkup(detail)}</span></button>`);
    }
  }
  return `<div class="map-semantic-tile-layer" data-semantic-group="terrain-detail" style="grid-template-columns:repeat(${bounds.width},1fr);grid-template-rows:repeat(${bounds.height},1fr)">${cells.join("")}</div>`;
}

function zonePosition(zone, terrain) {
  if (terrain && Number.isFinite(zone.col) && Number.isFinite(zone.row)) {
    return `left:${(zone.col - 1) / terrain.cols * 100}%;top:${(zone.row - 1) / terrain.rows * 100}%;width:${(zone.cols || 1) / terrain.cols * 100}%;height:${(zone.rows || 1) / terrain.rows * 100}%`;
  }
  return `left:${zone.x}%;top:${zone.y}%;width:${zone.w}%;height:${zone.h}%`;
}

function legacyMapMarkup(battle) {
  return `<div class="battle-map ${battle.fog ? "fog" : ""}" role="img" aria-label="${battle.title} 战场结构图">
    ${battle.zones.map((zone) => `<span class="map-zone ${zone.type}" style="left:${zone.x}%;top:${zone.y}%;width:${zone.w}%;height:${zone.h}%">${zone.label.replaceAll("\n", "<br>")}</span>`).join("")}
  </div>`;
}

function mapMarkup(battle) {
  const map = MAP_RECORDS[battle.id];
  if (!map) {
    return `<div class="map-wrap"><p class="map-note"><span>战场结构示意</span><span>上方 = 敌军纵深</span></p>${legacyMapMarkup(battle)}</div>`;
  }

  const terrain = map.terrain;
  const semantic = semanticForBattle(battle.id, map);
  const bounds = semanticBounds(semantic, terrain);
  const units = semantic?.units || [];
  const spawnDefinitions = semantic?.spawnDefinitions || [];
  const treasures = semantic?.treasures || [];
  const events = semantic?.events || [];
  const defaultLayer = map.referenceImage ? "reference" : "terrain";
  const aspect = terrain ? terrain.cols / terrain.rows : bounds.width / bounds.height;
  const terrainLayer = terrain ? `<svg class="grid-map-layer terrain-layer" data-map-layer-panel="terrain" ${defaultLayer !== "terrain" ? "hidden" : ""} viewBox="${terrain.crop.join(" ")}" role="img" aria-label="${battle.title} ${terrain.cols} 列 × ${terrain.rows} 行逐格地形图" preserveAspectRatio="xMidYMid meet">
    <image href="${terrain.source}" width="${terrain.canvas[0]}" height="${terrain.canvas[1]}"></image>
  </svg>` : "";
  const referenceLayer = map.referenceImage ? `<img class="grid-map-layer reference-layer" data-map-layer-panel="reference" ${defaultLayer !== "reference" ? "hidden" : ""} src="${map.referenceImage}" alt="${battle.title} 初始阵型参考图" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : "";
  const layerControls = terrain && map.referenceImage ? `<div class="map-layer-switch" role="group" aria-label="地图图层">
    <button class="${defaultLayer === "reference" ? "active" : ""}" data-map-layer="reference" aria-pressed="${defaultLayer === "reference"}">初始阵型</button>
    <button class="${defaultLayer === "terrain" ? "active" : ""}" data-map-layer="terrain" aria-pressed="${defaultLayer === "terrain"}">纯地形</button>
  </div>` : "";
  const gridSize = terrain ? `${terrain.cols} × ${terrain.rows} 格` : "逐格阵型参考";
  const semanticControls = semantic ? `<div class="map-semantic-switch" role="group" aria-label="语义图层筛选">
    <button class="active" data-map-filter="player" aria-pressed="true">我方</button>
    <button class="active" data-map-filter="enemy" aria-pressed="true">敌军</button>
    <button class="active" data-map-filter="ally" aria-pressed="true">友军</button>
    <button class="active" data-map-filter="treasure" aria-pressed="true">宝箱</button>
    <button class="active" data-map-filter="event" aria-pressed="true">事件</button>
  </div>` : "";
  const semanticLayer = semantic ? `${semanticTileLayerMarkup(semantic, bounds)}<div class="map-semantic-entity-layer" aria-label="逐格单位、宝箱与事件">
    ${units.map((unit, index) => semanticUnitMarkup(unit, bounds, index)).join("")}
    ${treasures.map((treasure, index) => semanticTreasureMarkup(treasure, bounds, index)).join("")}
    ${events.map((event, index) => semanticEventMarkup(event, bounds, index)).join("")}
  </div>` : "";
  const semanticStatus = semantic
    ? `<span class="map-data-status complete">${state.route} 语义层已载入 · ${units.length} 初始单位 / ${spawnDefinitions.length} 生成定义 / ${treasures.length} 宝箱 / ${events.length} 事件</span>`
    : `<span class="map-data-status pending">语义层待导入 · 当前显示逐格底图与已核对摘要</span>`;

  return `<div class="map-wrap">
    <div class="map-toolbar">
      <p class="map-note"><span>游戏数据逐格底图 · ${gridSize}</span>${semanticStatus}<span>上方 = 敌军纵深</span></p>
      <div class="map-tools">${layerControls}${semanticControls}<button data-map-labels aria-pressed="false">显示全部标注</button></div>
    </div>
    <div class="grid-map-viewport">
      <div class="grid-map-canvas ${battle.fog ? "fog" : ""}" data-map-grid data-map-cols="${bounds.width}" data-map-rows="${bounds.height}" data-map-origin-x="${bounds.x}" data-map-origin-y="${bounds.y}" data-map-battle-id="${battle.id}" style="--map-aspect:${aspect}">
        ${terrainLayer}${referenceLayer}
        ${semanticLayer || `<div class="map-hotspot-layer" aria-label="可交互战术摘要">
          ${battle.zones.map((zone) => `<button class="map-hotspot ${zone.type}" data-map-hotspot data-map-kind="${MAP_ZONE_LABELS[zone.type]}" style="${zonePosition(zone, terrain)}" aria-label="${MAP_ZONE_LABELS[zone.type]}：${zone.label}"><span class="map-hotspot-symbol">${MAP_ZONE_SYMBOLS[zone.type]}</span><span class="map-hotspot-copy">${zone.label.replaceAll("\n", " / ")}</span></button>`).join("")}
        </div>`}
      </div>
    </div>
    <div class="map-inspector" data-map-inspector aria-live="polite"><strong>${semantic ? "逐格语义信息层" : "战术摘要信息层"}</strong><span>${semantic ? "点击任意地形格、单位、宝箱或事件标记查看完整信息。" : "点击地图标记查看已核对摘要；完整单位与事件数据等待本地导入。"}</span></div>
    ${semanticScriptDetailsMarkup(spawnDefinitions, events)}
    <div class="map-legend">
      <span style="color:var(--blue)"><i class="legend-dot"></i>我方</span>
      <span style="color:var(--red)"><i class="legend-dot"></i>敌将</span>
      <span style="color:var(--gold)"><i class="legend-dot"></i>触发 / 增援</span>
      <span style="color:var(--violet)"><i class="legend-dot"></i>宝箱 / 道具</span>
      <span style="color:var(--green)"><i class="legend-dot"></i>友军</span>
    </div>
    <p class="map-attribution"><a href="${map.source}" target="_blank" rel="noreferrer">地形与战役数据：FE Datamine</a>${map.referenceImage ? ` · <a href="${battle.source}" target="_blank" rel="noreferrer">初始阵型校对：Triangle Attack</a>` : ""}</p>
  </div>`;
}

function sourceStrip(battle) {
  return `<div class="source-strip">
    <a class="source-link" href="${battle.source}" target="_blank" rel="noreferrer">战役资料与奖励条件 ↗</a>
    <a class="source-link" href="https://houses.fedatamine.com/en-us/battles/" target="_blank" rel="noreferrer">FE Datamine 战斗原文 ↗</a>
  </div>`;
}

function battleSheetMarkup(rawBattle) {
  const battle = rawBattle;
  const prepState = state.prep[battle.id] || {};
  const isDone = !!state.completed[battle.id];
  const eyebrow = battle.eyebrow || `${battle.month} · ${battle.arc || "WHITE CLOUDS"} CHAPTER ${battle.chapter}`;
  return `<article class="battle-sheet" id="battle-${battle.id}">
    <header class="battle-titlebar">
      <div><span class="eyebrow">${eyebrow}</span><h2>${battle.title}</h2><p>${battle.mission}</p></div>
      ${battle.fog ? `<span class="danger-badge">FOG OF WAR</span>` : ""}
    </header>
    <div class="battle-metrics">
      <div class="metric"><span class="metric-label">VICTORY</span><strong>${battle.objective}</strong></div>
      <div class="metric"><span class="metric-label">DEFEAT</span><strong>${battle.defeat}</strong></div>
      <div class="metric"><span class="metric-label">DEPLOYMENT</span><strong>${battle.deployment}</strong></div>
      <div class="metric"><span class="metric-label">STATUS</span><strong>${isDone ? "已完成" : "未完成"}</strong></div>
    </div>
    ${mapMarkup(battle)}
    <section class="sheet-section"><h3>已核对的战场事实</h3><ul class="fact-list">${battle.facts.map((fact) => `<li>${fact}</li>`).join("")}</ul></section>
    <section class="sheet-section"><h3>出击前检查</h3><div class="prep-list">${battle.prep.map((item, index) => `<label><input type="checkbox" data-prep="${battle.id}:${index}" ${prepState[index] ? "checked" : ""}><span>${item}</span></label>`).join("")}</div></section>
    <section class="sheet-section"><h3>关键物品</h3><ul class="loot-list">${battle.loot.map((item) => `<li>${item}</li>`).join("")}</ul>${sourceStrip(battle)}</section>
  </article>`;
}

function availableParalogues(chapter) {
  return DATA.paralogues.filter((entry) => {
    if (Array.isArray(entry.availability)) {
      return entry.availability.some((range) => range.routes.includes(state.route) && chapter >= range.from && chapter <= range.to);
    }
    const range = entry.window.match(/Chapter (\d+)[–-](\d+)/);
    return range && chapter >= Number(range[1]) && chapter <= Number(range[2]);
  });
}

function renderCommand() {
  const battle = currentBattle();
  const path = battlesForRoute();
  const doneCount = path.filter((item) => state.completed[item.id]).length;
  const available = availableParalogues(battle.chapter).slice(0, 4);
  app.innerHTML = pageHead(
    `COMMAND / ${state.route}`,
    `${battle.month}作战简报`,
    `${DATA.routes[state.route].name} · 当前显示该路线从学院篇到战争篇的完整月度任务。`,
    `<button class="action" data-step="previous">← 上一月</button><button class="action" data-step="next">下一月 →</button><button class="action ${state.completed[battle.id] ? "done" : "primary"}" data-complete="${battle.id}">${state.completed[battle.id] ? "已完成" : "标记完成"}</button>`
  ) + `<div class="command-layout">
    ${battleSheetMarkup(battle)}
    <aside class="intel-column">
      <section class="intel-panel"><h2>当前路线进度</h2><div class="chapter-progress"><span style="width:${Math.round(doneCount / path.length * 100)}%"></span></div><p>${doneCount} / ${path.length} 个关键月已完成</p></section>
      <section class="intel-panel"><h2>${ROUTE_LABELS[state.route]}路线提醒</h2><p>${DATA.routes[state.route].warning}</p></section>
      <section class="intel-panel"><h2>本月可处理外传</h2><div class="next-links">${available.length ? available.map((entry) => `<button class="chip relation" data-jump="paralogue:${entry.id}">${entry.name}</button>`).join("") : `<p>当前章节没有纳入本表的高优先外传。</p>`}</div></section>
      <section class="intel-panel"><h2>雾战入口</h2><div class="next-links"><button class="chip" data-battle="wc-3">Chapter 3 · Magdred</button><button class="chip" data-jump="paralogue:forgotten_hero">Marianne 外传</button></div></section>
    </aside>
  </div>`;
}

function renderBattles() {
  const battle = currentBattle();
  const path = battlesForRoute();
  app.innerHTML = pageHead(`MAPS / ${state.route}`, "完整月度战役地图", "按游戏逻辑行列显示逐格地形，并用可点击信息层标记出生点、首领、触发线、增援与关键物品。", `<button class="action" onclick="window.print()">打印当前地图</button>`) +
    battleSheetMarkup(battle) +
    `<section class="sheet-section battle-route-index" style="margin-top:16px"><h3>${DATA.routes[state.route].name} · 全 ${path.length} 章</h3><div class="battle-index">${path.map((item) => `<article class="battle-index-item ${item.id === battle.id ? "current" : ""}"><span class="month-stamp">${item.month}<br>CH.${item.chapter}</span><div><h2>${item.title}${item.fog ? ` <span class="danger-badge">FOG</span>` : ""}</h2><p>${item.mission} · ${item.objective}</p></div><button class="action" data-battle="${item.id}">查看地图</button></article>`).join("")}</div></section>`;
}

function unitCard(unit) {
  return `<article class="unit-card searchable" id="unit-${unit.id}" data-search="${[unit.name, unit.english, unit.house, unit.recruit, unit.role, unit.build, ...unit.unlocks].join(" ").toLowerCase()}">
    <header class="unit-identity">
      <div class="unit-portrait" aria-hidden="true"><span>${unit.english.slice(0, 1)}</span><img src="${PORTRAIT_ROOT}/${unit.id}.webp" alt="" loading="lazy" decoding="async" onerror="this.hidden=true"></div>
      <div><h2>${unit.name}</h2><p class="unit-sub">${unit.english} · ${unit.house}</p></div>
    </header>
    <dl class="unit-facts">
      <dt>基础招募</dt><dd><span class="fact-mark">FACT</span>${unit.recruit}</dd>
      <dt>关键解锁</dt><dd><span class="fact-mark">FACT</span>${unit.unlocks.join("；")}</dd>
      <dt>实战定位</dt><dd><span class="advice-mark">PLAN</span>${unit.role}</dd>
      <dt>建议路线</dt><dd><span class="advice-mark">PLAN</span>${unit.build}</dd>
    </dl>
    <div class="relation-row">${unit.paralogues.map((id) => { const entry = DATA.paralogues.find((item) => item.id === id); return entry ? `<button class="chip relation" data-jump="paralogue:${id}">${entry.name}</button>` : ""; }).join("")}<a class="chip" href="${unit.source}" target="_blank" rel="noreferrer">完整数据 ↗</a></div>
  </article>`;
}

function renderRoster() {
  const units = DATA.units.filter((unit) => rosterFilter === "全部" || unit.house === rosterFilter);
  app.innerHTML = pageHead("ROSTER / VERIFIED", "角色编成", "基础招募与关键技能为游戏数据；职业路线明确标为无继承 Maddening 的低投入建议。头像取自关联数据页。") +
    `<div class="toolbar">${HOUSE_FILTERS.map((filter) => `<button class="filter-chip ${rosterFilter === filter ? "active" : ""}" data-roster-filter="${filter}">${filter}</button>`).join("")}<span class="results-meta">${units.length} 名角色</span></div>
    <div class="unit-grid">${units.map(unitCard).join("")}</div>`;
}

function paralogueCard(entry) {
  const battle = entry.battle;
  return `<article class="paralogue-card searchable ${battle?.fog ? "fog-card" : ""} ${entry.id === selectedParalogueId ? "current" : ""}" id="paralogue-${entry.id}" data-search="${[entry.name, entry.window, entry.route, entry.reward, entry.note, JSON.stringify(battle || {})].join(" ").toLowerCase()}">
    <h2>${entry.name}</h2>
    <div class="paralogue-meta"><span class="tag">${entry.window}</span><span class="tag">${entry.route}</span>${battle?.fog ? `<span class="tag fog">FOG OF WAR</span>` : ""}</div>
    <p><span>目标：</span>${battle?.objective || "查看详细战役"}</p><p><span>主要奖励：</span>${entry.reward}</p><p><span>注意：</span>${entry.note}</p>
    <div class="relation-row">${entry.units.map((id) => { const unit = DATA.units.find((item) => item.id === id); return unit ? `<button class="chip relation" data-jump="unit:${id}">${unit.name}</button>` : ""; }).join("")}<button class="chip relation" data-paralogue-battle="${entry.id}">地图、目标与额外奖励</button><a class="chip" href="${entry.source}" target="_blank" rel="noreferrer">资料来源 ↗</a></div>
  </article>`;
}

function renderParalogues() {
  const filters = ["全部", "第一部", "第二部", "路线限定", "雾战"];
  const entries = DATA.paralogues.filter((entry) => {
    if (paralogueFilter === "全部") return true;
    if (paralogueFilter === "第一部") return entry.parts?.includes(1);
    if (paralogueFilter === "第二部") return entry.parts?.includes(2);
    if (paralogueFilter === "雾战") return entry.battle?.fog;
    return entry.routeLimited;
  });
  if (!entries.some((entry) => entry.id === selectedParalogueId)) selectedParalogueId = entries[0]?.id || DATA.paralogues[0].id;
  const selected = DATA.paralogues.find((entry) => entry.id === selectedParalogueId) || DATA.paralogues[0];
  const selectedDone = !!state.completed[selected.battle.id];
  app.innerHTML = pageHead("PARALOGUES / COMPLETE", "外传战役", "完整收录 26 个外传的战役地图、胜败条件、触发机制、基础奖励与条件额外奖励。", `<button class="action ${selectedDone ? "done" : "primary"}" data-complete="${selected.battle.id}">${selectedDone ? "已完成" : "标记此外传完成"}</button>`) +
    `<section class="paralogue-detail" id="paralogue-detail">${battleSheetMarkup(selected.battle)}</section>` +
    `<div class="toolbar">${filters.map((filter) => `<button class="filter-chip ${paralogueFilter === filter ? "active" : ""}" data-paralogue-filter="${filter}">${filter}</button>`).join("")}<span class="results-meta">${entries.length} 项</span></div>
    <div class="paralogue-grid">${entries.map(paralogueCard).join("")}</div>`;
}

function renderRoutes() {
  app.innerHTML = pageHead("ROUTES / PART II", "路线节点", "第一部共通，第二部按路线分歧。这里保留章节顺序与最容易造成死档的准备提醒。") +
    `<div class="route-grid">${Object.entries(DATA.routes).map(([id, route]) => { const chapters = battlesForRoute(id).filter((battle) => battle.route === id); return `<article class="route-card" id="route-${id}"><span class="eyebrow">${id} · ${route.leader}</span><h2>${route.name}</h2><p class="unit-sub">${route.warning}</p><ol class="route-chapters">${chapters.map((battle) => `<li><button data-route-battle="${id}:${battle.id}">Ch.${battle.chapter} · ${battle.title}</button></li>`).join("")}</ol></article>`; }).join("")}</div>`;
}

function renderMechanics() {
  app.innerHTML = pageHead("REFERENCE / RULES", "机制速查", "只保留会改变 Maddening 决策的机制，并把可验证数据入口放在页面底部。") +
    `<div class="mechanic-grid">${DATA.mechanics.map((item) => `<article class="mechanic-card searchable" data-search="${(item.title + " " + item.body).toLowerCase()}"><h2>${item.title}</h2><p>${item.body}</p></article>`).join("")}</div>
    <div class="source-strip"><a class="source-link" href="https://www.fe3h.com/recruitment" target="_blank" rel="noreferrer">挖角门槛 ↗</a><a class="source-link" href="https://www.fe3h.com/abilities" target="_blank" rel="noreferrer">技能来源 ↗</a><a class="source-link" href="https://www.fe3h.com/combat_arts" target="_blank" rel="noreferrer">战技来源 ↗</a><a class="source-link" href="https://www.fe3h.com/paralogues" target="_blank" rel="noreferrer">全部外传 ↗</a></div>`;
}

function renderSearch(query) {
  const q = query.trim().toLowerCase();
  const battles = battlesForRoute().filter((item) => JSON.stringify(item).toLowerCase().includes(q));
  const units = DATA.units.filter((item) => JSON.stringify(item).toLowerCase().includes(q));
  const paralogues = DATA.paralogues.filter((item) => JSON.stringify(item).toLowerCase().includes(q));
  const total = battles.length + units.length + paralogues.length;
  app.innerHTML = pageHead("SEARCH / GLOBAL", `搜索结果：${query}`, `${total} 条匹配，点击条目可进入对应视图。`) +
    (total ? `<div class="battle-index">${battles.map((item) => `<article class="battle-index-item"><span class="month-stamp">${item.month}<br>CH.${item.chapter}</span><div><h2>${item.title}</h2><p>${item.mission}</p></div><button class="action" data-battle="${item.id}">查看战役</button></article>`).join("")}</div><div class="unit-grid" style="margin-top:10px">${units.map(unitCard).join("")}</div><div class="paralogue-grid" style="margin-top:10px">${paralogues.map(paralogueCard).join("")}</div>` : `<p class="search-empty">没有匹配条目。</p>`);
}

function render() {
  setupControls();
  if (globalSearch.value.trim()) return renderSearch(globalSearch.value);
  ({ command: renderCommand, battles: renderBattles, roster: renderRoster, paralogues: renderParalogues, routes: renderRoutes, mechanics: renderMechanics }[activeView] || renderCommand)();
}

function jumpTo(kind, id) {
  const view = kind === "unit" ? "roster" : "paralogues";
  rosterFilter = "全部";
  paralogueFilter = "全部";
  if (kind === "paralogue") selectedParalogueId = id;
  setView(view);
  requestAnimationFrame(() => document.querySelector(kind === "paralogue" ? "#paralogue-detail" : `#${kind}-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
}

routeSwitch.addEventListener("click", (event) => {
  const route = event.target.closest("[data-route]")?.dataset.route;
  if (!route) return;
  const chapter = currentBattle().chapter;
  state.route = route;
  state.chapter = battleIdForChapter(route, chapter);
  saveState(`已切换到${ROUTE_LABELS[route]}路线`);
  render();
});

chapterSelect.addEventListener("change", () => {
  state.chapter = chapterSelect.value;
  saveState();
  render();
});

viewNav.addEventListener("click", (event) => {
  const view = event.target.closest("[data-view]")?.dataset.view;
  if (view) setView(view);
});

globalSearch.addEventListener("input", () => render());

app.addEventListener("click", (event) => {
  const mapLayer = event.target.closest("[data-map-layer]");
  if (mapLayer) {
    const wrap = mapLayer.closest(".map-wrap");
    const layer = mapLayer.dataset.mapLayer;
    wrap.querySelectorAll("[data-map-layer]").forEach((button) => {
      const active = button.dataset.mapLayer === layer;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    wrap.querySelectorAll("[data-map-layer-panel]").forEach((panel) => {
      panel.toggleAttribute("hidden", panel.dataset.mapLayerPanel !== layer);
    });
    return;
  }

  const mapFilter = event.target.closest("[data-map-filter]");
  if (mapFilter) {
    const group = mapFilter.dataset.mapFilter;
    const visible = mapFilter.getAttribute("aria-pressed") !== "true";
    mapFilter.setAttribute("aria-pressed", String(visible));
    mapFilter.classList.toggle("active", visible);
    mapFilter.closest(".map-wrap").querySelectorAll(`[data-semantic-group="${group}"]`).forEach((item) => {
      item.hidden = !visible;
    });
    return;
  }

  const mapLabels = event.target.closest("[data-map-labels]");
  if (mapLabels) {
    const canvas = mapLabels.closest(".map-wrap").querySelector(".grid-map-canvas");
    const expanded = canvas.classList.toggle("show-labels");
    mapLabels.setAttribute("aria-pressed", String(expanded));
    mapLabels.textContent = expanded ? "隐藏详细标注" : "显示全部标注";
    return;
  }

  const semanticTarget = event.target.closest("[data-map-semantic]");
  if (semanticTarget) {
    const inspector = semanticTarget.closest(".map-wrap").querySelector("[data-map-inspector]");
    inspector.querySelector("strong").textContent = semanticTarget.querySelector(".map-semantic-title").textContent;
    inspector.querySelector("span").textContent = semanticTarget.querySelector(".map-semantic-detail").textContent;
    semanticTarget.closest(".grid-map-canvas").querySelectorAll("[data-map-semantic].selected").forEach((item) => item.classList.remove("selected"));
    semanticTarget.classList.add("selected");
    return;
  }

  const mapHotspot = event.target.closest("[data-map-hotspot]");
  if (mapHotspot) {
    const inspector = mapHotspot.closest(".map-wrap").querySelector("[data-map-inspector]");
    inspector.querySelector("strong").textContent = mapHotspot.dataset.mapKind;
    inspector.querySelector("span").textContent = mapHotspot.querySelector(".map-hotspot-copy").textContent;
    mapHotspot.closest(".map-hotspot-layer").querySelectorAll(".selected").forEach((item) => item.classList.remove("selected"));
    mapHotspot.classList.add("selected");
    return;
  }

  const mapGrid = event.target.closest("[data-map-grid]");
  if (mapGrid && mapGrid.dataset.mapCols && mapGrid.dataset.mapRows) {
    const bounds = mapGrid.getBoundingClientRect();
    const originX = Number(mapGrid.dataset.mapOriginX || 0);
    const originY = Number(mapGrid.dataset.mapOriginY || 0);
    const cols = Number(mapGrid.dataset.mapCols);
    const rows = Number(mapGrid.dataset.mapRows);
    const x = Math.min(originX + cols - 1, Math.max(originX, Math.floor((event.clientX - bounds.left) / bounds.width * cols) + originX));
    const y = Math.min(originY + rows - 1, Math.max(originY, Math.floor((event.clientY - bounds.top) / bounds.height * rows) + originY));
    const inspector = mapGrid.closest(".map-wrap").querySelector("[data-map-inspector]");
    inspector.querySelector("strong").textContent = `格位 (${x}, ${y})`;
    inspector.querySelector("span").textContent = `游戏原始 0-based 坐标；画面第 ${x - originX + 1} 列 / 第 ${y - originY + 1} 行。`;
    return;
  }

  const routeBattle = event.target.closest("[data-route-battle]")?.dataset.routeBattle;
  if (routeBattle) {
    const [route, battleId] = routeBattle.split(":");
    state.route = route;
    state.chapter = battleId;
    saveState(`已切换到${ROUTE_LABELS[route]}路线`);
    setView("battles");
    return;
  }

  const battleId = event.target.closest("[data-battle]")?.dataset.battle;
  if (battleId) {
    state.chapter = battleId;
    saveState();
    setView("battles");
    return;
  }

  const jump = event.target.closest("[data-jump]")?.dataset.jump;
  if (jump) {
    const [kind, id] = jump.split(":");
    jumpTo(kind, id);
    return;
  }

  const complete = event.target.closest("[data-complete]")?.dataset.complete;
  if (complete) {
    state.completed[complete] = !state.completed[complete];
    saveState(state.completed[complete] ? "已记录完成" : "已取消完成标记");
    render();
    return;
  }

  const step = event.target.closest("[data-step]")?.dataset.step;
  if (step) {
    const path = battlesForRoute();
    const index = Math.max(0, path.findIndex((battle) => battle.id === state.chapter));
    const next = step === "next" ? Math.min(index + 1, path.length - 1) : Math.max(index - 1, 0);
    state.chapter = path[next].id;
    saveState();
    render();
    return;
  }

  const roster = event.target.closest("[data-roster-filter]")?.dataset.rosterFilter;
  if (roster) {
    rosterFilter = roster;
    renderRoster();
    return;
  }

  const paralogue = event.target.closest("[data-paralogue-filter]")?.dataset.paralogueFilter;
  if (paralogue) {
    paralogueFilter = paralogue;
    renderParalogues();
    return;
  }

  const paralogueBattle = event.target.closest("[data-paralogue-battle]")?.dataset.paralogueBattle;
  if (paralogueBattle) {
    selectedParalogueId = paralogueBattle;
    renderParalogues();
    requestAnimationFrame(() => document.querySelector("#paralogue-detail")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }
});

app.addEventListener("change", (event) => {
  const prep = event.target.dataset.prep;
  if (!prep) return;
  const [battleId, index] = prep.split(":");
  state.prep[battleId] ||= {};
  state.prep[battleId][index] = event.target.checked;
  saveState();
});

render();
