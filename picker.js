// picker.js — runs inside the popout window (picker.html)
// ── Favorites: Ctrl+Click any emote to toggle; stored in chrome.storage.local ──
'use strict';

const PAGE_SIZE   = 480;
const params      = new URLSearchParams(location.search);
const twitchTabId = parseInt(params.get('tabId'), 10);

// ── Favorites ────────────────────────────────────────────────────────────────
let channelName = '';
const favoritesMap = new Map();

function favsKey() { return 'favs_' + (channelName || '_global'); }

function loadFavorites() {
  return new Promise(resolve => {
    if (!chrome?.storage?.local) { resolve(); return; }
    try {
      chrome.storage.local.get(favsKey(), result => {
        if (chrome.runtime.lastError) { resolve(); return; }
        const arr = result[favsKey()] || [];
        favoritesMap.clear();
        arr.forEach(e => favoritesMap.set(e.name, e));
        resolve();
      });
    } catch { resolve(); }
  });
}

function saveFavorites() {
  if (!chrome?.storage?.local) return;
  chrome.storage.local.set({ [favsKey()]: [...favoritesMap.values()] });
}

function toggleFavorite(emote) {
  if (favoritesMap.has(emote.name)) favoritesMap.delete(emote.name);
  else favoritesMap.set(emote.name, emote);
  saveFavorites();
  state.emotesByTab.favs = [...favoritesMap.values()];
  renderGrid();
}

// ── State ────────────────────────────────────────────────────────────────────
const state = {
  activeTab   : 'favs',
  page        : 0,
  query       : '',
  emotesByTab : {
    favs      : [],
    '7tv-ch'  : [], '7tv-gl'  : [],
    'bttv-ch' : [], 'bttv-gl' : [],
    'ffz-ch'  : [], 'ffz-gl'  : [],
  },
  loaded: false,
};

// ── DOM refs ──────────────────────────────────────────────────────────────────
const grid      = document.getElementById('grid');
const prevBtn   = document.getElementById('prev');
const nextBtn   = document.getElementById('next');
const pageLabel = document.getElementById('page-label');
const searchEl  = document.getElementById('search');
const tabsEl    = document.getElementById('tabs');
const headerCh  = document.getElementById('header-channel');

// ── Messaging ─────────────────────────────────────────────────────────────────
function sendToContent(msg) {
  return new Promise(resolve => {
    chrome.tabs.sendMessage(twitchTabId, msg, resp => {
      if (chrome.runtime.lastError) resolve(null);
      else resolve(resp);
    });
  });
}

// ── Filter ───────────────────────────────────────────────────────────────────
function filteredEmotes() {
  const list = state.emotesByTab[state.activeTab] || [];
  if (!state.query) return list;
  const q = state.query.toLowerCase();
  return list.filter(e => e.name.toLowerCase().includes(q));
}

// ── Render ───────────────────────────────────────────────────────────────────
function renderGrid() {
  grid.innerHTML = '';
  const isFavs = state.activeTab === 'favs';

  if (!state.loaded && !isFavs) {
    grid.innerHTML = `<div class="state-msg"><div class="icon">⏳</div>Loading emotes…</div>`;
    prevBtn.disabled = nextBtn.disabled = true;
    pageLabel.textContent = '— / —';
    return;
  }

  const all   = filteredEmotes();
  const total = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  state.page  = Math.max(0, Math.min(state.page, total - 1));
  const slice = all.slice(state.page * PAGE_SIZE, (state.page + 1) * PAGE_SIZE);

  if (!slice.length) {
    grid.innerHTML = isFavs
      ? `<div class="state-msg"><div class="icon">⭐</div>No favourites yet.<span class="state-hint">Ctrl+Click any emote to save it here.</span></div>`
      : `<div class="state-msg"><div class="icon">🔍</div>No emotes found</div>`;
    prevBtn.disabled = nextBtn.disabled = true;
    pageLabel.textContent = '0 / 0';
    return;
  }

  const frag = document.createDocumentFragment();
  slice.forEach(emote => {
    const cell = document.createElement('div');
    cell.className = 'emote' + (emote.zeroWidth ? ' emote--zw' : '');
    cell.setAttribute('data-name', emote.name);
    cell.title = emote.name + (emote.zeroWidth ? ' (zero-width overlay)' : '');
    if (favoritesMap.has(emote.name)) cell.classList.add('is-fav');

    const img = document.createElement('img');
    img.src = emote.src;
    const hires = emote.src2x || emote.src4x;
    if (hires) img.srcset = `${emote.src} 1x, ${hires} 2x`;
    img.alt = emote.name; img.loading = 'lazy';
    img.onerror = function () { this.style.display = 'none'; };

    const starBadge = document.createElement('span');
    starBadge.className = 'fav-badge';
    starBadge.textContent = '⭐';
    starBadge.setAttribute('aria-hidden', 'true');

    cell.appendChild(img);
    cell.appendChild(starBadge);

    if (emote.zeroWidth) {
      const badge = document.createElement('span');
      badge.className = 'zw-badge'; badge.textContent = 'ZW';
      cell.appendChild(badge);
    }

    cell.addEventListener('click', async e => {
      if (e.ctrlKey || e.metaKey) { e.preventDefault(); toggleFavorite(emote); return; }
      await sendToContent({ type: 'INSERT_EMOTE', name: emote.name });
      chrome.tabs.update(twitchTabId, { active: true });
    });

    frag.appendChild(cell);
  });

  grid.appendChild(frag);
  grid.scrollTop = 0;
  pageLabel.textContent = `${state.page + 1} / ${total}`;
  prevBtn.disabled = state.page === 0;
  nextBtn.disabled = state.page >= total - 1;
}

// ── Tabs ─────────────────────────────────────────────────────────────────────
tabsEl.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    tabsEl.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    state.activeTab = tab.dataset.tab;
    state.page = 0; state.query = '';
    searchEl.value = '';
    renderGrid();
  });
});

// ── Pagination ────────────────────────────────────────────────────────────────
prevBtn.addEventListener('click', () => { state.page--; renderGrid(); });
nextBtn.addEventListener('click', () => { state.page++; renderGrid(); });

// ── Send ─────────────────────────────────────────────────────────────────────
document.getElementById('send-chat').addEventListener('click', async () => {
  await sendToContent({ type: 'SEND_CHAT' });
  chrome.tabs.update(twitchTabId, { active: true });
});

// ── Search ────────────────────────────────────────────────────────────────────
let searchTimer;
searchEl.addEventListener('input', e => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { state.query = e.target.value.trim(); state.page = 0; renderGrid(); }, 200);
});

// ── Apply fetch result ────────────────────────────────────────────────────────
function applyResponse(r) {
  state.emotesByTab['7tv-ch']  = r.emotesByTab['7tv-ch']  || [];
  state.emotesByTab['7tv-gl']  = r.emotesByTab['7tv-gl']  || [];
  state.emotesByTab['bttv-ch'] = r.emotesByTab['bttv-ch'] || [];
  state.emotesByTab['bttv-gl'] = r.emotesByTab['bttv-gl'] || [];
  state.emotesByTab['ffz-ch']  = r.emotesByTab['ffz-ch']  || [];
  state.emotesByTab['ffz-gl']  = r.emotesByTab['ffz-gl']  || [];
  state.loaded = r.loaded;
}

// ── Init ─────────────────────────────────────────────────────────────────────
async function init() {
  if (!twitchTabId) {
    grid.innerHTML = `<div class="state-msg"><div class="icon">⚠️</div>No Twitch tab found.<br>Open from the chat button.</div>`;
    return;
  }

  await new Promise(resolve => {
    chrome.tabs.get(twitchTabId, tab => {
      if (!chrome.runtime.lastError && tab) {
        const m = tab.url?.match(/twitch\.tv\/popout\/([^/?#]+)/) || tab.url?.match(/twitch\.tv\/([^/?#]+)/);
        if (m) {
          channelName = m[1].toLowerCase();
          headerCh.textContent = m[1];
          document.title = `7BTVFZ — ${m[1]}`;
        }
      }
      resolve();
    });
  });

  await loadFavorites();
  state.emotesByTab.favs = [...favoritesMap.values()];
  renderGrid();

  const resp = await sendToContent({ type: 'GET_EMOTES' });
  if (!resp) {
    if (state.activeTab !== 'favs')
      grid.innerHTML = `<div class="state-msg"><div class="icon">⚠️</div>Could not reach Twitch page.<br>Reload and try again.</div>`;
    return;
  }

  applyResponse(resp);
  renderGrid();

  if (!state.loaded) {
    const poll = setInterval(async () => {
      const r = await sendToContent({ type: 'GET_EMOTES' });
      if (r?.loaded) { clearInterval(poll); applyResponse(r); renderGrid(); }
    }, 500);
  }
}

init();