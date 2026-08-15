const cards = [...document.querySelectorAll('.guide-card')];
const search = document.querySelector('#guide-search');
const count = document.querySelector('#guide-count');
const empty = document.querySelector('#empty-state');
const progress = document.querySelector('#me3-progress');
const wotrProgress = document.querySelector('#wotr-progress');

function normalize(value) {
  return value.trim().toLocaleLowerCase('zh-CN');
}

function filterGuides() {
  const query = normalize(search.value);
  let visible = 0;

  cards.forEach((card) => {
    const match = !query || normalize(card.dataset.search).includes(query);
    card.hidden = !match;
    visible += match ? 1 : 0;
  });

  count.textContent = `${visible} / ${cards.length}`;
  empty.hidden = visible !== 0;
}

function readMassEffectProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem('ME3_GUIDE_SAVE_V1'));
    const slot = saved?.slots?.[saved.activeSlot];
    if (!slot) return;

    const completed = ['task', 'dlc'].reduce((sum, key) => {
      return sum + Object.values(slot[key] || {}).filter(Boolean).length;
    }, 0);

    if (completed > 0) {
      progress.textContent = `${slot.name || '当前存档'} · 已记录 ${completed} 项`;
    }
  } catch {
    progress.textContent = '本地存档等待修复';
  }
}

function readWotrProgress() {
  if (!wotrProgress) return;

  try {
    const raw = localStorage.getItem('WOTR_BUILD_ARCHIVE_V3')
      || localStorage.getItem('WOTR_BUILD_ARCHIVE_V2')
      || localStorage.getItem('WOTR_BUILD_ARCHIVE_V1');
    const saved = JSON.parse(raw);
    const slots = Object.values(saved?.slots || {});
    if (!slots.length) return;

    const active = saved.slots?.[saved.activeSlot] || slots[0];
    const commander = active?.characters?.commander;
    const level = Math.max(1, commander?.normalSteps?.length || commander?.levels?.length || 1);
    const mythicRank = commander?.mythicSteps?.length ?? commander?.mythicRank ?? 0;
    wotrProgress.textContent = `${active?.name || '当前档案'} · LV ${level} / 神话 ${mythicRank}`;
  } catch {
    wotrProgress.textContent = '本地构筑档案等待修复';
  }
}

search.addEventListener('input', filterGuides);

document.querySelectorAll('[data-guide]').forEach((link) => {
  link.addEventListener('click', () => {
    localStorage.setItem('FIELD_MANUAL_LAST_GUIDE', link.dataset.guide);
  });
});

readMassEffectProgress();
readWotrProgress();
