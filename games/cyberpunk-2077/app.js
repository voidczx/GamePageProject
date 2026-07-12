const DATA = window.CP2077_DATA;
const STORAGE_KEY = "CP2077_GUIDE_STATE_V1";
const buildById = new Map(DATA.builds.map((build) => [build.id, build]));
const itemById = new Map(DATA.items.map((item) => [item.id, item]));
const attributeById = new Map(DATA.attributes.map((attribute) => [attribute.id, attribute]));

const elements = {
  buildTabs: document.querySelector("#build-tabs"),
  overview: document.querySelector("#build-overview"),
  mapLayerSwitch: document.querySelector("#map-layer-switch"),
  mapFilters: document.querySelector("#map-filters"),
  mapProgress: document.querySelector("#map-progress"),
  mapViewport: document.querySelector("#map-viewport"),
  mapScene: document.querySelector("#map-scene"),
  mapImage: document.querySelector("#map-image"),
  mapMarkers: document.querySelector("#map-markers"),
  mapSelection: document.querySelector("#map-selection"),
  mapZoom: document.querySelector("#map-zoom"),
  mapAttribution: document.querySelector("#map-attribution"),
  loadoutList: document.querySelector("#loadout-list"),
  loadoutCount: document.querySelector("#loadout-count"),
  levelRange: document.querySelector("#level-range"),
  levelOutput: document.querySelector("#level-output"),
  dlcToggle: document.querySelector("#dlc-toggle"),
  budgetStrip: document.querySelector("#budget-strip"),
  attributeBudget: document.querySelector("#attribute-budget"),
  attributeList: document.querySelector("#attribute-list"),
  bonusControls: document.querySelector("#bonus-controls"),
  pointRuleNote: document.querySelector("#point-rule-note"),
  perkBudget: document.querySelector("#perk-budget"),
  perkList: document.querySelector("#perk-list"),
  relicPanel: document.querySelector("#relic-panel"),
  relicBudget: document.querySelector("#relic-budget"),
  relicList: document.querySelector("#relic-list"),
  sourceLinks: document.querySelector("#source-links"),
  resetProfile: document.querySelector("#reset-profile"),
  toast: document.querySelector("#toast")
};

function defaultProfile(build) {
  return {
    dlc: true,
    level: 1,
    attributes: { ...build.opening },
    skillBonus: 0,
    shardBonus: 0,
    relicPoints: 0,
    perks: [],
    relics: []
  };
}

function loadState() {
  const fallback = {
    activeBuild: DATA.builds[0].id,
    profiles: {},
    filters: { weapon: true, cyberware: true, perkShard: true, relicTerminal: true, current: true, hideObtained: false },
    mapLayer: "city",
    obtained: {},
    selectedItem: DATA.builds[0].gear[0]
  };

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved === "object") Object.assign(fallback, saved);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }

  if (!buildById.has(fallback.activeBuild)) fallback.activeBuild = DATA.builds[0].id;
  fallback.filters = { weapon: true, cyberware: true, perkShard: true, relicTerminal: true, current: true, hideObtained: false, ...fallback.filters };
  if (!DATA.maps[fallback.mapLayer]) fallback.mapLayer = "city";
  if (!fallback.obtained || typeof fallback.obtained !== "object") fallback.obtained = {};
  fallback.profiles ||= {};

  DATA.builds.forEach((build) => {
    const defaults = defaultProfile(build);
    const saved = fallback.profiles[build.id] || {};
    fallback.profiles[build.id] = {
      ...defaults,
      ...saved,
      attributes: { ...defaults.attributes, ...(saved.attributes || {}) },
      perks: Array.isArray(saved.perks) ? saved.perks : [],
      relics: Array.isArray(saved.relics) ? saved.relics : []
    };
  });

  return fallback;
}

const state = loadState();
const mapState = { scale: 1, x: 0, y: 0, dragging: false, startX: 0, startY: 0, originX: 0, originY: 0 };
let toastTimer;

function activeBuild() {
  return buildById.get(state.activeBuild);
}

function activeProfile() {
  return state.profiles[state.activeBuild];
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => elements.toast.classList.remove("show"), 1900);
}

function typeLabel(type) {
  return { weapon: "武器", cyberware: "义体", progression: "成长点" }[type] || type;
}

function categoryLabel(item) {
  return { weapon: "武器", cyberware: "义体", perkShard: "专长芯片", relicTerminal: "限制数据终端" }[item.category || item.type] || typeLabel(item.type);
}

function isObtained(itemId) {
  return Boolean(state.obtained[itemId]);
}

function renderBuildTabs() {
  elements.buildTabs.innerHTML = DATA.builds.map((build) => `
    <button type="button" class="${build.id === state.activeBuild ? "active" : ""}" data-build="${build.id}" style="--tab-accent:${build.accent}">
      <span>${build.label}</span><small>${build.english}</small>
    </button>
  `).join("");
}

function renderOverview() {
  const build = activeBuild();
  const targetTotal = Object.values(build.targets).reduce((sum, value) => sum + value, 0);

  elements.overview.style.setProperty("--build-accent", build.accent);
  elements.overview.innerHTML = `
    <div class="overview-copy">
      <span class="section-code">${build.english}</span>
      <h2>${build.label}</h2>
      <p>${build.summary}</p>
    </div>
    <ol class="combat-loop" aria-label="实战循环">
      ${build.loop.map((step, index) => `<li><span>0${index + 1}</span>${step}</li>`).join("")}
    </ol>
    <div class="target-attributes">
      <span class="section-code">LV.60 TARGET / ${targetTotal}</span>
      <div>${DATA.attributes.map((attribute) => `
        <span style="--attribute-color:${attribute.color}"><b>${attribute.label}</b>${build.targets[attribute.id]}</span>
      `).join("")}</div>
    </div>
  `;
}

function renderMapLayerSwitch() {
  elements.mapLayerSwitch.innerHTML = Object.values(DATA.maps).map((map) => `
    <button type="button" class="${map.id === state.mapLayer ? "active" : ""}" data-map-layer="${map.id}" aria-pressed="${map.id === state.mapLayer}">${map.label}</button>
  `).join("");
}

function renderMapLayer() {
  const map = DATA.maps[state.mapLayer];
  elements.mapImage.src = map.image;
  elements.mapImage.alt = map.alt;
  elements.mapScene.style.setProperty("--map-aspect", `${map.width} / ${map.height}`);
  elements.mapAttribution.href = map.source;
  elements.mapAttribution.textContent = `${map.attribution} ↗`;
  renderMapLayerSwitch();
  const reset = () => requestAnimationFrame(resetMap);
  elements.mapImage.onload = reset;
  if (elements.mapImage.complete) reset();
}

function renderMapFilters() {
  const filters = [
    ["weapon", "武器"], ["cyberware", "义体"], ["perkShard", "专长芯片"],
    ["relicTerminal", "数据终端"], ["current", "仅当前流派"], ["hideObtained", "隐藏已获得"]
  ];

  elements.mapFilters.innerHTML = filters.map(([id, label]) => `
    <label class="filter-toggle ${state.filters[id] ? "active" : ""}">
      <input type="checkbox" data-filter="${id}" ${state.filters[id] ? "checked" : ""}>
      <span>${label}</span>
    </label>
  `).join("");
}

function isMapItemVisible(item) {
  const filterKey = item.category || item.type;
  if (item.map !== state.mapLayer || !state.filters[filterKey]) return false;
  if (item.dlc && !activeProfile().dlc) return false;
  if (state.filters.current && !item.builds.includes(state.activeBuild)) return false;
  if (state.filters.hideObtained && isObtained(item.id)) return false;
  return true;
}

function renderMapProgress() {
  const layerItems = DATA.items.filter((item) => item.map === state.mapLayer && (!item.dlc || activeProfile().dlc));
  const obtained = layerItems.filter((item) => isObtained(item.id)).length;
  elements.mapProgress.textContent = `${DATA.maps[state.mapLayer].label} · 已获得 ${obtained} / ${layerItems.length}`;
}

function renderMapMarkers() {
  const visibleItems = DATA.items.filter(isMapItemVisible);
  const selectedVisible = visibleItems.some((item) => item.id === state.selectedItem);
  if (!selectedVisible) state.selectedItem = visibleItems[0]?.id || null;

  elements.mapMarkers.innerHTML = visibleItems.map((item) => {
    const obtained = isObtained(item.id);
    const markerLabel = obtained ? "✓" : item.shortLabel || (item.type === "weapon" ? "W" : item.type === "cyberware" ? "C" : "P");
    return `
      <button type="button" class="map-marker ${item.type} ${item.category || ""} ${obtained ? "obtained" : ""} ${item.id === state.selectedItem ? "selected" : ""}"
        style="left:${item.x}%;top:${item.y}%" data-map-item="${item.id}" aria-label="${item.name}，${obtained ? "已获得" : "未获得"}，${item.location}" title="${item.name} · ${obtained ? "已获得" : "未获得"}">
        <span aria-hidden="true">${markerLabel}</span>
      </button>
    `;
  }).join("");

  renderMapProgress();
  renderMapSelection();
}

function renderMapSelection() {
  const item = itemById.get(state.selectedItem);
  if (!item) {
    elements.mapSelection.innerHTML = `<p class="empty-copy">当前筛选下没有标记。</p>`;
    return;
  }

  const obtained = isObtained(item.id);

  elements.mapSelection.innerHTML = `
    <div class="selection-meta"><span class="type-badge ${item.type}">${categoryLabel(item)}</span><span>${item.district}</span><span class="status-badge ${obtained ? "obtained" : ""}">${obtained ? "已获得" : "未获得"}</span></div>
    <h3>${item.name}</h3>
    <p class="item-english">${item.english}</p>
    <dl>
      <div><dt>位置</dt><dd>${item.location}</dd></div>
      <div><dt>任务</dt><dd>${item.mission}</dd></div>
      <div><dt>获取</dt><dd>${item.acquisition}</dd></div>
      ${item.coordinates ? `<div><dt>世界坐标</dt><dd>${item.coordinates}</dd></div>` : ""}
    </dl>
    <p class="selection-warning">${item.warning}</p>
    <div class="selection-actions">
      <button class="status-action ${obtained ? "obtained" : ""}" type="button" data-toggle-obtained="${item.id}">${obtained ? "标记为未获得" : "标记为已获得"}</button>
      ${activeBuild().gear.includes(item.id)
        ? `<button class="primary-action" type="button" data-jump-item="${item.id}">查看完整详情</button>`
        : `<a class="source-action" href="${item.source}" target="_blank" rel="noreferrer">查看资料页 ↗</a>`}
    </div>
  `;
}

function renderLoadout() {
  const build = activeBuild();
  const gear = build.gear.map((id) => itemById.get(id)).filter((item) => item && (!item.dlc || activeProfile().dlc));
  elements.loadoutCount.textContent = `${gear.length} 个关键条目`;
  elements.loadoutList.innerHTML = gear.map((item, index) => {
    const obtained = isObtained(item.id);
    return `
    <article class="loadout-item ${obtained ? "obtained" : ""}" id="item-${item.id}">
      <div class="loadout-index">${String(index + 1).padStart(2, "0")}</div>
      <div class="loadout-main">
        <div class="selection-meta"><span class="type-badge ${item.type}">${typeLabel(item.type)}</span><span>${item.district}</span>${item.dlc ? "<span>DLC</span>" : ""}<span class="status-badge ${obtained ? "obtained" : ""}">${obtained ? "已获得" : "未获得"}</span></div>
        <h3>${item.name}</h3>
        <p class="item-english">${item.english}</p>
        <p class="item-effect">${item.effect}</p>
      </div>
      <dl class="acquisition-details">
        <div><dt>获得位置</dt><dd>${item.location}</dd></div>
        <div><dt>相关任务</dt><dd>${item.mission}</dd></div>
        <div><dt>获取方式</dt><dd>${item.acquisition}</dd></div>
        <div class="warning-row"><dt>注意</dt><dd>${item.warning}</dd></div>
      </dl>
      <div class="item-actions">
        <button type="button" class="text-action" data-locate-item="${item.id}">地图定位</button>
        <button type="button" class="status-action ${obtained ? "obtained" : ""}" data-toggle-obtained="${item.id}">${obtained ? "标记为未获得" : "标记为已获得"}</button>
        <a href="${item.source}" target="_blank" rel="noreferrer">资料页 ↗</a>
      </div>
    </article>
  `;
  }).join("");
}

function levelCap(profile) {
  return profile.dlc ? DATA.rules.levelCap.dlc : DATA.rules.levelCap.base;
}

function attributeBudget(profile) {
  return DATA.rules.startingAttributeTotal + profile.level - 1;
}

function attributeSpent(profile) {
  return DATA.attributes.reduce((sum, attribute) => sum + profile.attributes[attribute.id], 0);
}

function perkBudget(profile) {
  const shardMax = profile.dlc ? DATA.rules.shardBonusMax.dlc : DATA.rules.shardBonusMax.base;
  return profile.level - 1 + profile.skillBonus + Math.min(profile.shardBonus, shardMax);
}

function perkSpent(profile, build) {
  return build.perks
    .filter((entry) => profile.perks.includes(entry.id))
    .reduce((sum, entry) => sum + entry.cost, 0);
}

function relicSpent(profile, build) {
  return build.relics
    .filter((entry) => profile.relics.includes(entry.id))
    .reduce((sum, entry) => sum + entry.cost, 0);
}

function renderBudgetStrip(profile, build) {
  const attributeAvailable = attributeBudget(profile) - attributeSpent(profile);
  const perkAvailable = perkBudget(profile) - perkSpent(profile, build);
  const relicAvailable = profile.relicPoints - relicSpent(profile, build);
  const metrics = [
    ["属性总预算", attributeBudget(profile), attributeAvailable],
    ["专长总预算", perkBudget(profile), perkAvailable],
    ["等级自然专长", profile.level - 1, null],
    ["遗物点", profile.dlc ? profile.relicPoints : 0, profile.dlc ? relicAvailable : null]
  ];

  elements.budgetStrip.innerHTML = metrics.map(([label, total, available]) => `
    <div class="budget-metric ${available < 0 ? "over" : ""}">
      <span>${label}</span><strong>${total}</strong>
      ${available === null ? "" : `<small>${available >= 0 ? `剩余 ${available}` : `超出 ${Math.abs(available)}`}</small>`}
    </div>
  `).join("");
}

function renderAttributes(profile, build) {
  const available = attributeBudget(profile) - attributeSpent(profile);
  elements.attributeBudget.textContent = `${available >= 0 ? "剩余" : "超出"} ${Math.abs(available)} 点`;
  elements.attributeBudget.classList.toggle("over", available < 0);

  elements.attributeList.innerHTML = DATA.attributes.map((attribute) => {
    const value = profile.attributes[attribute.id];
    const target = build.targets[attribute.id];
    const tier = DATA.rules.perkTiers.filter((threshold) => value >= threshold).at(-1) || 3;
    return `
      <div class="attribute-row" style="--attribute-color:${attribute.color}">
        <div class="attribute-name"><span>${attribute.english}</span><strong>${attribute.label}</strong></div>
        <div class="attribute-control">
          <button type="button" data-attribute="${attribute.id}" data-attribute-step="-1" aria-label="降低${attribute.label}" ${value <= DATA.rules.attributeMin ? "disabled" : ""}>−</button>
          <output>${value}</output>
          <button type="button" data-attribute="${attribute.id}" data-attribute-step="1" aria-label="提升${attribute.label}" ${value >= DATA.rules.attributeMax || available <= 0 ? "disabled" : ""}>+</button>
        </div>
        <div class="attribute-progress"><span style="width:${value / DATA.rules.attributeMax * 100}%"></span><i style="left:${target / DATA.rules.attributeMax * 100}%"></i></div>
        <div class="attribute-meta"><span>当前阶 ${tier}</span><span>目标 ${target}</span></div>
      </div>
    `;
  }).join("");
}

function renderBonusControls(profile) {
  const shardMax = profile.dlc ? DATA.rules.shardBonusMax.dlc : DATA.rules.shardBonusMax.base;
  const obtainedShards = DATA.items.filter((item) => item.category === "perkShard" && (!item.dlc || profile.dlc) && isObtained(item.id)).length;
  const obtainedTerminals = DATA.items.filter((item) => item.category === "relicTerminal" && isObtained(item.id)).length;
  const controls = [
    { id: "skillBonus", label: "技能成长奖励", max: DATA.rules.skillBonusMax, value: profile.skillBonus, note: "5 类技能在 15 / 35 级各 1 点" },
    { id: "shardBonus", label: "已拾取专长芯片", max: shardMax, value: Math.min(profile.shardBonus, shardMax), note: `地图已标记 ${obtainedShards} / ${shardMax}` },
    { id: "relicPoints", label: "已获得遗物点", max: profile.dlc ? DATA.rules.relicPointMax : 0, value: profile.dlc ? profile.relicPoints : 0, note: `终端已标记 ${obtainedTerminals} / 9；剧情另有 6 点` }
  ];

  elements.bonusControls.innerHTML = controls.map((control) => `
    <label class="bonus-row">
      <span><strong>${control.label}</strong><small>${control.note}</small></span>
      <input type="number" inputmode="numeric" min="0" max="${control.max}" value="${control.value}" data-bonus="${control.id}" ${control.max === 0 ? "disabled" : ""}>
    </label>
  `).join("");

  const naturalMax = levelCap(profile) - 1;
  const totalMax = naturalMax + DATA.rules.skillBonusMax + shardMax;
  elements.pointRuleNote.textContent = `每次升级获得 1 属性点和 1 专长点。当前模式自然专长上限 ${naturalMax}；计入技能奖励与全部芯片后，模拟器上限 ${totalMax}。`;
}

function perkStatus(entry, profile, build, spent) {
  const selected = profile.perks.includes(entry.id);
  const attributeReady = profile.attributes[entry.attr] >= entry.requires;
  const prerequisitesReady = entry.prerequisites.every((id) => profile.perks.includes(id));
  const pointsReady = perkBudget(profile) - spent >= entry.cost;
  return { selected, attributeReady, prerequisitesReady, pointsReady, eligible: !selected && attributeReady && prerequisitesReady && pointsReady };
}

function renderPerks(profile, build) {
  const spent = perkSpent(profile, build);
  const budget = perkBudget(profile);
  const available = budget - spent;
  elements.perkBudget.textContent = `已用 ${spent} / ${budget}`;
  elements.perkBudget.classList.toggle("over", available < 0);

  const statuses = build.perks.map((entry) => [entry, perkStatus(entry, profile, build, spent)]);
  const nextId = statuses.find(([, status]) => status.eligible)?.[0].id;

  elements.perkList.innerHTML = statuses.map(([entry, status]) => {
    const attribute = attributeById.get(entry.attr);
    let stateLabel = "可点";
    if (status.selected) stateLabel = "已选择";
    else if (!status.attributeReady) stateLabel = `需要 ${attribute.label} ${entry.requires}`;
    else if (!status.prerequisitesReady) stateLabel = "前置未满足";
    else if (!status.pointsReady) stateLabel = `还差 ${entry.cost - Math.max(available, 0)} 点`;

    const classes = ["perk-card", status.selected ? "selected" : "", status.eligible ? "eligible" : "", nextId === entry.id ? "next" : ""].filter(Boolean).join(" ");
    return `
      <button type="button" class="${classes}" data-perk="${entry.id}" ${!status.selected && !status.eligible ? "disabled" : ""} style="--attribute-color:${attribute.color}">
        <span class="perk-tier">${attribute.label} ${entry.requires}</span>
        <strong>${entry.name}</strong>
        <small>${entry.english}</small>
        <span class="perk-state"><b>${entry.cost} 点</b>${stateLabel}</span>
      </button>
    `;
  }).join("");
}

function relicStatus(entry, profile, build, spent) {
  const selected = profile.relics.includes(entry.id);
  const prerequisitesReady = entry.prerequisites.every((id) => profile.relics.includes(id));
  const pointsReady = profile.relicPoints - spent >= entry.cost;
  return { selected, eligible: !selected && prerequisitesReady && pointsReady, prerequisitesReady, pointsReady };
}

function renderRelics(profile, build) {
  elements.relicPanel.hidden = !profile.dlc;
  if (!profile.dlc) return;

  const spent = relicSpent(profile, build);
  elements.relicBudget.textContent = `已用 ${spent} / ${profile.relicPoints}`;
  const statuses = build.relics.map((entry) => [entry, relicStatus(entry, profile, build, spent)]);
  const nextId = statuses.find(([, status]) => status.eligible)?.[0].id;

  elements.relicList.innerHTML = statuses.map(([entry, status]) => {
    let stateLabel = "可点";
    if (status.selected) stateLabel = "已选择";
    else if (!status.prerequisitesReady) stateLabel = "前置未满足";
    else if (!status.pointsReady) stateLabel = "遗物点不足";
    return `
      <button type="button" class="relic-card ${status.selected ? "selected" : ""} ${status.eligible ? "eligible" : ""} ${nextId === entry.id ? "next" : ""}"
        data-relic="${entry.id}" ${!status.selected && !status.eligible ? "disabled" : ""}>
        <span>RELIC</span><strong>${entry.name}</strong><small>${entry.english}</small><b>${entry.cost} 点 · ${stateLabel}</b>
      </button>
    `;
  }).join("");
}

function renderSimulator() {
  const profile = activeProfile();
  const build = activeBuild();
  const cap = levelCap(profile);
  profile.level = Math.min(Math.max(1, profile.level), cap);
  profile.skillBonus = Math.min(Math.max(0, profile.skillBonus), DATA.rules.skillBonusMax);
  profile.shardBonus = Math.min(Math.max(0, profile.shardBonus), DATA.rules.shardBonusMax.dlc);
  profile.relicPoints = Math.min(Math.max(0, profile.relicPoints), DATA.rules.relicPointMax);

  elements.levelRange.max = cap;
  elements.levelRange.value = profile.level;
  elements.levelOutput.textContent = profile.level;
  elements.dlcToggle.checked = profile.dlc;

  renderBudgetStrip(profile, build);
  renderAttributes(profile, build);
  renderBonusControls(profile);
  renderPerks(profile, build);
  renderRelics(profile, build);
}

function renderSources() {
  elements.sourceLinks.innerHTML = DATA.sources.map((source) => `<a href="${source.url}" target="_blank" rel="noreferrer">${source.label} ↗</a>`).join("");
}

function renderAll() {
  renderBuildTabs();
  renderOverview();
  renderMapFilters();
  renderMapLayer();
  renderMapMarkers();
  renderLoadout();
  renderSimulator();
  renderSources();
  saveState();
}

function applyMapTransform() {
  elements.mapScene.style.transform = `translate(${mapState.x}px, ${mapState.y}px) scale(${mapState.scale})`;
  elements.mapZoom.textContent = `${Math.round(mapState.scale * 100)}%`;
}

function setMapZoom(nextScale, originX, originY) {
  const scale = Math.min(4.5, Math.max(0.8, nextScale));
  const rect = elements.mapViewport.getBoundingClientRect();
  const x = originX ?? rect.width / 2;
  const y = originY ?? rect.height / 2;
  const worldX = (x - mapState.x) / mapState.scale;
  const worldY = (y - mapState.y) / mapState.scale;
  mapState.x = x - worldX * scale;
  mapState.y = y - worldY * scale;
  mapState.scale = scale;
  applyMapTransform();
}

function resetMap() {
  const viewportRect = elements.mapViewport.getBoundingClientRect();
  const sceneWidth = elements.mapScene.offsetWidth;
  const sceneHeight = elements.mapScene.offsetHeight;
  Object.assign(mapState, {
    scale: 1,
    x: (viewportRect.width - sceneWidth) / 2,
    y: (viewportRect.height - sceneHeight) / 2
  });
  applyMapTransform();
}

function locateOnMap(item) {
  const layerChanged = item.map !== state.mapLayer;
  if (layerChanged) {
    state.mapLayer = item.map;
    renderMapLayer();
  }
  state.selectedItem = item.id;

  const focusItem = () => {
    const rect = elements.mapViewport.getBoundingClientRect();
    const sceneWidth = elements.mapScene.offsetWidth;
    const sceneHeight = elements.mapScene.offsetHeight;
    mapState.scale = Math.max(mapState.scale, 1.8);
    mapState.x = rect.width / 2 - sceneWidth * (item.x / 100) * mapState.scale;
    mapState.y = rect.height / 2 - sceneHeight * (item.y / 100) * mapState.scale;
    applyMapTransform();
    renderMapMarkers();
    saveState();
    document.querySelector("#map-section").scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (layerChanged && !elements.mapImage.complete) elements.mapImage.addEventListener("load", () => requestAnimationFrame(focusItem), { once: true });
  else requestAnimationFrame(focusItem);
}

function toggleObtained(itemId) {
  const item = itemById.get(itemId);
  if (!item) return;
  if (isObtained(itemId)) delete state.obtained[itemId];
  else state.obtained[itemId] = true;
  renderMapMarkers();
  renderLoadout();
  renderBonusControls(activeProfile());
  saveState();
  showToast(`${item.name}已标记为${isObtained(itemId) ? "已获得" : "未获得"}`);
}

function jumpToItem(itemId) {
  const target = document.querySelector(`#item-${itemId}`);
  if (!target) {
    showToast("该条目不在当前流派清单中");
    return;
  }
  history.replaceState(null, "", `#item-${itemId}`);
  target.scrollIntoView({ behavior: "smooth", block: "center" });
  target.classList.remove("flash");
  requestAnimationFrame(() => target.classList.add("flash"));
}

function removePerkWithDependents(build, profile, perkId) {
  const pending = [perkId];
  const removed = new Set();
  while (pending.length) {
    const current = pending.pop();
    removed.add(current);
    build.perks
      .filter((entry) => entry.prerequisites.includes(current))
      .forEach((entry) => pending.push(entry.id));
  }
  profile.perks = profile.perks.filter((id) => !removed.has(id));
}

function removeRelicWithDependents(build, profile, relicId) {
  const pending = [relicId];
  const removed = new Set();
  while (pending.length) {
    const current = pending.pop();
    removed.add(current);
    build.relics
      .filter((entry) => entry.prerequisites.includes(current))
      .forEach((entry) => pending.push(entry.id));
  }
  profile.relics = profile.relics.filter((id) => !removed.has(id));
}

elements.buildTabs.addEventListener("click", (event) => {
  const buildId = event.target.closest("[data-build]")?.dataset.build;
  if (!buildId || buildId === state.activeBuild) return;
  state.activeBuild = buildId;
  state.selectedItem = activeBuild().gear[0];
  renderAll();
});

elements.mapFilters.addEventListener("change", (event) => {
  const filter = event.target.dataset.filter;
  if (!filter) return;
  state.filters[filter] = event.target.checked;
  renderMapFilters();
  renderMapMarkers();
  saveState();
});

elements.mapLayerSwitch.addEventListener("click", (event) => {
  const layer = event.target.closest("[data-map-layer]")?.dataset.mapLayer;
  if (!layer || layer === state.mapLayer || !DATA.maps[layer]) return;
  state.mapLayer = layer;
  state.selectedItem = DATA.items.find((item) => isMapItemVisible(item))?.id || null;
  renderMapLayer();
  renderMapMarkers();
  saveState();
});

document.querySelector(".map-toolbar").addEventListener("click", (event) => {
  const action = event.target.closest("[data-map-action]")?.dataset.mapAction;
  if (action === "zoom-in") setMapZoom(mapState.scale + 0.25);
  if (action === "zoom-out") setMapZoom(mapState.scale - 0.25);
  if (action === "reset") resetMap();
});

elements.mapViewport.addEventListener("wheel", (event) => {
  event.preventDefault();
  const rect = elements.mapViewport.getBoundingClientRect();
  setMapZoom(mapState.scale + (event.deltaY < 0 ? 0.2 : -0.2), event.clientX - rect.left, event.clientY - rect.top);
}, { passive: false });

elements.mapViewport.addEventListener("pointerdown", (event) => {
  if (event.target.closest("button")) return;
  mapState.dragging = true;
  mapState.startX = event.clientX;
  mapState.startY = event.clientY;
  mapState.originX = mapState.x;
  mapState.originY = mapState.y;
  elements.mapViewport.setPointerCapture(event.pointerId);
  elements.mapViewport.classList.add("dragging");
});

elements.mapViewport.addEventListener("pointermove", (event) => {
  if (!mapState.dragging) return;
  mapState.x = mapState.originX + event.clientX - mapState.startX;
  mapState.y = mapState.originY + event.clientY - mapState.startY;
  applyMapTransform();
});

function endMapDrag(event) {
  if (!mapState.dragging) return;
  mapState.dragging = false;
  elements.mapViewport.classList.remove("dragging");
  if (elements.mapViewport.hasPointerCapture(event.pointerId)) elements.mapViewport.releasePointerCapture(event.pointerId);
}

elements.mapViewport.addEventListener("pointerup", endMapDrag);
elements.mapViewport.addEventListener("pointercancel", endMapDrag);

elements.mapViewport.addEventListener("keydown", (event) => {
  const amount = event.shiftKey ? 80 : 35;
  const actions = {
    ArrowLeft: () => { mapState.x += amount; },
    ArrowRight: () => { mapState.x -= amount; },
    ArrowUp: () => { mapState.y += amount; },
    ArrowDown: () => { mapState.y -= amount; },
    "+": () => setMapZoom(mapState.scale + 0.25),
    "=": () => setMapZoom(mapState.scale + 0.25),
    "-": () => setMapZoom(mapState.scale - 0.25),
    "0": resetMap
  };
  if (!actions[event.key]) return;
  event.preventDefault();
  actions[event.key]();
  applyMapTransform();
});

elements.mapMarkers.addEventListener("click", (event) => {
  const itemId = event.target.closest("[data-map-item]")?.dataset.mapItem;
  if (!itemId) return;
  state.selectedItem = itemId;
  renderMapMarkers();
  saveState();
  if (activeBuild().gear.includes(itemId)) jumpToItem(itemId);
});

elements.mapSelection.addEventListener("click", (event) => {
  const obtainedItemId = event.target.closest("[data-toggle-obtained]")?.dataset.toggleObtained;
  if (obtainedItemId) {
    toggleObtained(obtainedItemId);
    return;
  }
  const itemId = event.target.closest("[data-jump-item]")?.dataset.jumpItem;
  if (itemId) jumpToItem(itemId);
});

elements.loadoutList.addEventListener("click", (event) => {
  const obtainedItemId = event.target.closest("[data-toggle-obtained]")?.dataset.toggleObtained;
  if (obtainedItemId) {
    toggleObtained(obtainedItemId);
    return;
  }
  const itemId = event.target.closest("[data-locate-item]")?.dataset.locateItem;
  const item = itemById.get(itemId);
  if (item) locateOnMap(item);
});

document.querySelector(".level-console").addEventListener("click", (event) => {
  const step = Number(event.target.closest("[data-level-step]")?.dataset.levelStep);
  if (!step) return;
  const profile = activeProfile();
  profile.level = Math.min(levelCap(profile), Math.max(1, profile.level + step));
  renderSimulator();
  saveState();
});

elements.levelRange.addEventListener("input", () => {
  activeProfile().level = Number(elements.levelRange.value);
  renderSimulator();
  saveState();
});

elements.dlcToggle.addEventListener("change", () => {
  const profile = activeProfile();
  profile.dlc = elements.dlcToggle.checked;
  profile.level = Math.min(profile.level, levelCap(profile));
  renderMapMarkers();
  renderLoadout();
  renderSimulator();
  saveState();
});

elements.attributeList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-attribute]");
  if (!button) return;
  const profile = activeProfile();
  const id = button.dataset.attribute;
  const step = Number(button.dataset.attributeStep);
  const current = profile.attributes[id];
  const available = attributeBudget(profile) - attributeSpent(profile);
  if (step > 0 && available <= 0) return;
  profile.attributes[id] = Math.min(DATA.rules.attributeMax, Math.max(DATA.rules.attributeMin, current + step));
  renderSimulator();
  saveState();
});

elements.bonusControls.addEventListener("change", (event) => {
  const id = event.target.dataset.bonus;
  if (!id) return;
  const min = Number(event.target.min);
  const max = Number(event.target.max);
  activeProfile()[id] = Math.min(max, Math.max(min, Number(event.target.value) || 0));
  renderSimulator();
  saveState();
});

elements.perkList.addEventListener("click", (event) => {
  const id = event.target.closest("[data-perk]")?.dataset.perk;
  if (!id) return;
  const build = activeBuild();
  const profile = activeProfile();
  if (profile.perks.includes(id)) removePerkWithDependents(build, profile, id);
  else profile.perks.push(id);
  renderSimulator();
  saveState();
});

elements.relicList.addEventListener("click", (event) => {
  const id = event.target.closest("[data-relic]")?.dataset.relic;
  if (!id) return;
  const build = activeBuild();
  const profile = activeProfile();
  if (profile.relics.includes(id)) removeRelicWithDependents(build, profile, id);
  else profile.relics.push(id);
  renderSimulator();
  saveState();
});

elements.resetProfile.addEventListener("click", () => {
  state.profiles[state.activeBuild] = defaultProfile(activeBuild());
  renderAll();
  showToast("当前流派模拟已重置");
});

renderAll();
resetMap();

if (location.hash.startsWith("#item-")) {
  const itemId = location.hash.slice(6);
  if (itemById.has(itemId)) requestAnimationFrame(() => jumpToItem(itemId));
}
