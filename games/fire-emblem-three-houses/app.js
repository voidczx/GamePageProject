const DATA = window.FE3H_DATA;
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
let toastTimer;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      route: saved?.route && DATA.routes[saved.route] ? saved.route : "AM",
      chapter: DATA.battles.some((battle) => battle.id === saved?.chapter) ? saved.chapter : "wc-1",
      completed: saved?.completed || {},
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

  chapterSelect.innerHTML = DATA.battles.map((battle) =>
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
  return DATA.battles.find((battle) => battle.id === state.chapter) || DATA.battles[0];
}

function routeBattleData(battle) {
  if (battle.id !== "wc-12") return { ...battle };
  if (state.route === "CF") {
    return { ...battle, objective: "击败 Rhea", defeat: "Byleth / Edelgard 败退或全灭", deployment: "我方 9 / 敌军 22 / NPC 4", source: "https://www.fe3h.com/chapters/part1/chapter_12a" };
  }
  const suffix = { SS: "b", AM: "c", VW: "d" }[state.route];
  return { ...battle, objective: "击败 Edelgard", defeat: "主角或路线领袖败退、全灭、敌军占领防守点", deployment: "我方 10 / 敌军 39 / NPC 10", source: `https://www.fe3h.com/chapters/part1/chapter_12${suffix}` };
}

function pageHead(code, title, description, actions = "") {
  return `<header class="page-head"><div><span class="section-code">${code}</span><h1>${title}</h1><p>${description}</p></div>${actions ? `<div class="page-actions">${actions}</div>` : ""}</header>`;
}

function mapMarkup(battle) {
  return `<div class="map-wrap">
    <p class="map-note"><span>战场结构示意 · 非逐格复刻</span><span>上方 = 敌军纵深</span></p>
    <div class="battle-map ${battle.fog ? "fog" : ""}" role="img" aria-label="${battle.title} 战场结构图">
      ${battle.zones.map((zone) => `<span class="map-zone ${zone.type}" style="left:${zone.x}%;top:${zone.y}%;width:${zone.w}%;height:${zone.h}%">${zone.label.replace("\n", "<br>")}</span>`).join("")}
    </div>
    <div class="map-legend">
      <span style="color:var(--blue)"><i class="legend-dot"></i>我方</span>
      <span style="color:var(--red)"><i class="legend-dot"></i>目标</span>
      <span style="color:var(--gold)"><i class="legend-dot"></i>触发点</span>
      <span style="color:var(--violet)"><i class="legend-dot"></i>物品</span>
      <span style="color:var(--green)"><i class="legend-dot"></i>友军 / 救援</span>
    </div>
  </div>`;
}

function sourceStrip(battle) {
  return `<div class="source-strip">
    <a class="source-link" href="${battle.source}" target="_blank" rel="noreferrer">Maddening 战役数据 ↗</a>
    <a class="source-link" href="https://houses.fedatamine.com/en-us/battles/" target="_blank" rel="noreferrer">FE Datamine 战斗原文 ↗</a>
  </div>`;
}

function battleSheetMarkup(rawBattle) {
  const battle = routeBattleData(rawBattle);
  const prepState = state.prep[battle.id] || {};
  const isDone = !!state.completed[battle.id];
  return `<article class="battle-sheet" id="battle-${battle.id}">
    <header class="battle-titlebar">
      <div><span class="eyebrow">${battle.month} · WHITE CLOUDS CHAPTER ${battle.chapter}</span><h2>${battle.title}</h2><p>${battle.mission}</p></div>
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
    const range = entry.window.match(/Chapter (\d+)[–-](\d+)/);
    return range && chapter >= Number(range[1]) && chapter <= Number(range[2]);
  });
}

function renderCommand() {
  const battle = currentBattle();
  const doneCount = DATA.battles.filter((item) => state.completed[item.id]).length;
  const available = availableParalogues(battle.chapter).slice(0, 4);
  app.innerHTML = pageHead(
    `COMMAND / ${state.route}`,
    `${battle.month}作战简报`,
    `${DATA.routes[state.route].name} · 当前显示 White Clouds 共通月度任务。`,
    `<button class="action" data-step="previous">← 上一月</button><button class="action" data-step="next">下一月 →</button><button class="action ${state.completed[battle.id] ? "done" : "primary"}" data-complete="${battle.id}">${state.completed[battle.id] ? "已完成" : "标记完成"}</button>`
  ) + `<div class="command-layout">
    ${battleSheetMarkup(battle)}
    <aside class="intel-column">
      <section class="intel-panel"><h2>学院阶段进度</h2><div class="chapter-progress"><span style="width:${Math.round(doneCount / DATA.battles.length * 100)}%"></span></div><p>${doneCount} / ${DATA.battles.length} 个关键月已完成</p></section>
      <section class="intel-panel"><h2>${ROUTE_LABELS[state.route]}路线提醒</h2><p>${DATA.routes[state.route].warning}</p></section>
      <section class="intel-panel"><h2>本月可处理外传</h2><div class="next-links">${available.length ? available.map((entry) => `<button class="chip relation" data-jump="paralogue:${entry.id}">${entry.name}</button>`).join("") : `<p>当前章节没有纳入本表的高优先外传。</p>`}</div></section>
      <section class="intel-panel"><h2>雾战入口</h2><div class="next-links"><button class="chip" data-battle="wc-3">Chapter 3 · Magdred</button><button class="chip" data-jump="paralogue:forgotten_hero">Marianne 外传</button></div></section>
    </aside>
  </div>`;
}

function renderBattles() {
  const battle = currentBattle();
  app.innerHTML = pageHead("MAPS / WHITE CLOUDS", "月度战役地图", "结构图聚焦出生点、首领、触发线、增援与关键物品；精确敌军数据可从每关来源链接继续核对。", `<button class="action" onclick="window.print()">打印当前地图</button>`) +
    battleSheetMarkup(battle) +
    `<section class="sheet-section" style="margin-top:16px"><h3>White Clouds 月度索引</h3><div class="battle-index">${DATA.battles.map((item) => `<article class="battle-index-item ${item.id === battle.id ? "current" : ""}"><span class="month-stamp">${item.month}<br>CH.${item.chapter}</span><div><h2>${item.title}${item.fog ? ` <span class="danger-badge">FOG</span>` : ""}</h2><p>${item.mission} · ${item.objective}</p></div><button class="action" data-battle="${item.id}">查看地图</button></article>`).join("")}</div></section>`;
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
  return `<article class="paralogue-card searchable ${entry.fog ? "fog-card" : ""}" id="paralogue-${entry.id}" data-search="${[entry.name, entry.window, entry.route, entry.reward, entry.note].join(" ").toLowerCase()}">
    <h2>${entry.name}</h2>
    <div class="paralogue-meta"><span class="tag">${entry.window}</span><span class="tag">${entry.route}</span>${entry.fog ? `<span class="tag fog">FOG OF WAR</span>` : ""}</div>
    <p><span>奖励：</span>${entry.reward}</p><p><span>注意：</span>${entry.note}</p>
    <div class="relation-row">${entry.units.map((id) => { const unit = DATA.units.find((item) => item.id === id); return unit ? `<button class="chip relation" data-jump="unit:${id}">${unit.name}</button>` : ""; }).join("")}<a class="chip" href="${entry.source}" target="_blank" rel="noreferrer">条件与地图 ↗</a></div>
  </article>`;
}

function renderParalogues() {
  const filters = ["全部", "第一部", "第二部", "路线限定", "雾战"];
  const entries = DATA.paralogues.filter((entry) => {
    if (paralogueFilter === "全部") return true;
    if (paralogueFilter === "第一部") return /Chapter [6-9]|第一部/.test(entry.window);
    if (paralogueFilter === "第二部") return /第二部|Chapter 1[5-9]/.test(entry.window);
    if (paralogueFilter === "雾战") return entry.fog;
    return /仅|Azure|Verdant|Crimson|路线/.test(entry.route);
  });
  app.innerHTML = pageHead("RELATIONS / PARALOGUES", "外传关系", "角色、开放窗口、路线限制与主要奖励可互相跳转；奖励附加条件保留在注意项中。") +
    `<div class="toolbar">${filters.map((filter) => `<button class="filter-chip ${paralogueFilter === filter ? "active" : ""}" data-paralogue-filter="${filter}">${filter}</button>`).join("")}<span class="results-meta">${entries.length} 项</span></div>
    <div class="paralogue-grid">${entries.map(paralogueCard).join("")}</div>`;
}

function renderRoutes() {
  app.innerHTML = pageHead("ROUTES / PART II", "路线节点", "第一部共通，第二部按路线分歧。这里保留章节顺序与最容易造成死档的准备提醒。") +
    `<div class="route-grid">${Object.entries(DATA.routes).map(([id, route]) => `<article class="route-card" id="route-${id}"><span class="eyebrow">${id} · ${route.leader}</span><h2>${route.name}</h2><p class="unit-sub">${route.warning}</p><ol class="route-chapters">${route.chapters.map((chapter) => `<li>${chapter}</li>`).join("")}</ol></article>`).join("")}</div>`;
}

function renderMechanics() {
  app.innerHTML = pageHead("REFERENCE / RULES", "机制速查", "只保留会改变 Maddening 决策的机制，并把可验证数据入口放在页面底部。") +
    `<div class="mechanic-grid">${DATA.mechanics.map((item) => `<article class="mechanic-card searchable" data-search="${(item.title + " " + item.body).toLowerCase()}"><h2>${item.title}</h2><p>${item.body}</p></article>`).join("")}</div>
    <div class="source-strip"><a class="source-link" href="https://www.fe3h.com/recruitment" target="_blank" rel="noreferrer">挖角门槛 ↗</a><a class="source-link" href="https://www.fe3h.com/abilities" target="_blank" rel="noreferrer">技能来源 ↗</a><a class="source-link" href="https://www.fe3h.com/combat_arts" target="_blank" rel="noreferrer">战技来源 ↗</a><a class="source-link" href="https://www.fe3h.com/paralogues" target="_blank" rel="noreferrer">全部外传 ↗</a></div>`;
}

function renderSearch(query) {
  const q = query.trim().toLowerCase();
  const battles = DATA.battles.filter((item) => JSON.stringify(item).toLowerCase().includes(q));
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
  setView(view);
  requestAnimationFrame(() => document.querySelector(`#${kind}-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
}

routeSwitch.addEventListener("click", (event) => {
  const route = event.target.closest("[data-route]")?.dataset.route;
  if (!route) return;
  state.route = route;
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
    saveState(state.completed[complete] ? "已记录本月完成" : "已取消完成标记");
    render();
    return;
  }

  const step = event.target.closest("[data-step]")?.dataset.step;
  if (step) {
    const index = DATA.battles.findIndex((battle) => battle.id === state.chapter);
    const next = step === "next" ? Math.min(index + 1, DATA.battles.length - 1) : Math.max(index - 1, 0);
    state.chapter = DATA.battles[next].id;
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
