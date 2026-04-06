
// ============================================================
// content.js  — Twitch 7TV Emote Picker(DEBUG VERSION)
//  ✓ Split tabs: bttv-ch / bttv-gl / ffz-ch / ffz-gl / 7tv-ch / 7tv-gl
//  ✓ Auto-refreshes when emotes are added/removed
//  ✓ Detailed logging for debugging
// ============================================================
   

 (function () {
  'use strict';
  

  // ─── Config ──────────────────────────────────────────────────────────────────
  const PAGE_SIZE = 300;; // 1000; 950; 480; 550; 120; 320; 300; 250; 650; 850;
  const CDN_7TV   = 'https://cdn.7tv.app/emote/';
  const CDN_BTTV  = 'https://cdn.betterttv.net/emote/';
  const CDN_FFZ   = 'https://cdn.frankerfacez.com/emote/';

  const PANEL_ID  = 'sep-emote-panel';
  const BTN_ID    = 'sep-emote-btn';
  const STYLE_ID  = 'sep-emote-style';

  // ─── CSS ─────────────────────────────────────────────────────────────────────
   function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
    #${BTN_ID} {
      display: flex; 
      align-items: center; 
      justify-content: center;
      width: 95px; 
      height: 34px; 
      border: none; 
      border-radius: 4px;
      background: transparent; 
      cursor: pointer; 
      font-size: 20px;
      line-height: 1; 
      color: var(--color-text-button-secondary-default, #efeff1);
      transition: background 0.15s; flex-shrink: 0;
    }
    #${BTN_ID}:hover {
      background: var(--color-background-button-secondary-hover, rgba(255,255,255,.1));
    }
    #${PANEL_ID} {
      position: fixed; bottom: 56px; right: 340px;
      width: 340px; height: 420px; display: flex; flex-direction: column;
      background: var(--color-background-base, #18181b);
      border: 1px solid var(--color-border-base, #3a3a3d);
      border-radius: 6px; box-shadow: 0 4px 20px rgba(0,0,0,.6);
      z-index: 9000; font-family: Inter, Roobert, sans-serif;
      user-select: none; overflow: hidden;
    }
    #${PANEL_ID}.sep-hidden { display: none !important; 
  } 

    /*  добавил margin: */
    .ffz-emoji {
        vertical-align: middle !important;
        z-index: 999999 !important;
        position: relative !important;
        height: 25px !important;
        width: 25px !important;
        margin: 0 2px !important;   /* ← добавить */
    } 
  .sep-emote-overlay {
        position: absolute !important;
        pointer-events: none !important;
        top: 50% !important;
        left:  50% !important;
        transform: translate(-50%, -50%) 
        scaleX(var(--sep-scale-x, 1)) 
        scaleY(var(--sep-scale-y, 1)) 
        rotate(var(--sep-rotate, 0deg)) !important;
        z-index: 1;
        /* Убираем любые max-height/width от sep-chat-emote для оверлеев */
        max-height: none !important;
        height: auto !important;
        width: auto !important;
    }

  /* Если нужно сохранить масштабирование по чату — добавляем отдельно */
  .sep-emote-base {
        max-height: 28px;
        height: auto;
        width: auto;
        display: block;
    }

    .sep-emote-wrap .sep-emote-base {
        display: block; 
        position: relative; 
        z-index: 0;
      }
    .sep-chat-emote {
        vertical-align: middle; 
        max-height: 28px; 
        display: inline-block;
      }
    .sep-emote-wrap {
        display: inline-block;
        position: relative;
        line-height: 0;
        vertical-align: middle;
        
    }
    .sep-emote-wrap {
      display: inline-block;
      position: relative;
      line-height: 0;
      vertical-align: middle;
  } 

/* Удаляем специальные случаи data-wide-emote — они больше не нужны */    
    .emote {
       user-select: none !important;
    }
    div#nameEl-sep-emote-47654jr6ug { user-select: text !important; 
       font-size: 14px !important; overflow-wrap: break-word !important; 
    }
    #copyBtn-txtmt-4nrd5e:hover, #pasteBtn-popemt-4nrd5e:hover,
    #sendemt-in-chat-4nrd5e:hover, #close-popemts-4nrd5e:hover,
    #see-emotlink-onsvntvapp-4nrd5e:hover {
        color: rgb(217 231 157 / 90%) !important; 
        cursor: pointer !important;
        font-size: 15px !important; 
        background: rgba(19,71,49,.66) !important;
        border-width: 2px !important; 
        border: solid !important; 
        border-radius: 11px !important;
    }
      /* Базовый стиль для наложения (Zero-Width) */
  .zero-width-emote {
      position: absolute;
      margin-left: -32px; /* Подстройте под размер ваших эмотов */
      pointer-events: none;
  }

  /* BTTV Modifiers */
  .mod-s { animation: emote-shake 0.2s infinite; }
  .mod-p { animation: emote-pulse 0.5s infinite; }
  .mod-c { filter: grayscale(1) contrast(2); }
  .mod-h, .mod-ffzx { transform: scaleX(-1); }
  .mod-v, .mod-ffzy { transform: scaleY(-1); }
  .mod-l { transform: rotate(-90deg); }
  .mod-r { transform: rotate(90deg); }

  /* FFZ Modifiers */
  .mod-ffzspin { animation: emote-spin 2s linear infinite; }
  .mod-ffzrainbow { animation: emote-rainbow 3s linear infinite; }
  .mod-ffzjam { animation: emote-jam 0.8s infinite; }
  .mod-ffzcursed { filter: invert(1) contrast(200%) brightness(150%); }

  /* Анимации */
  @keyframes emote-shake {
      0% { transform: translate(1px, 1px); }
      50% { transform: translate(-1px, -1px); }
      100% { transform: translate(1px, -1px); }
  }

  @keyframes emote-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
  }

  @keyframes emote-rainbow {
      0% { filter: hue-rotate(0deg); }
      100% { filter: hue-rotate(360deg); }
  }

  @keyframes emote-jam {
      0%, 100% { transform: translateX(0); }
      50% { transform: translateX(5px) skewX(10deg); }
  }
      `;
      document.head.appendChild(s);
  }


  // ─── Utility ─────────────────────────────────────────────────────────────────
  function waitFor(selector, timeout = 15000) {
    return new Promise((resolve, reject) => {
      const el = document.querySelector(selector);
      if (el) return resolve(el);
      const obs = new MutationObserver(() => {
        const found = document.querySelector(selector);
        if (found) { obs.disconnect(); resolve(found); }
      });
      obs.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => { obs.disconnect(); reject(new Error('Timeout: ' + selector)); }, timeout);
    });
  }

  function getChannelName() {
    const path = location.pathname;
    let m = path.match(/^\/popout\/([^/]+)/);
    if (m) return m[1].toLowerCase();
    const SKIP = new Set([
      'directory','following','videos','clips','about','popout','embed',
      'moderator','u','settings','inventory','drops','subscriptions',
      'payments','prime','turbo','jobs','p','friends','messages','notifications',
    ]);
    m = path.match(/^\/([^/]+)/);
    if (m && !SKIP.has(m[1].toLowerCase())) return m[1].toLowerCase();
    return null;
  }

  // ─── API fetchers ─────────────────────────────────────────────────────────────
  async function fetchAllEmotes(channelName) {
    console.log(`[SEP] 🔍 Fetching emotes for channel: ${channelName}`);
    let twitchId = null;

    // ── Step 1: FFZ channel (даёт twitchId) ──────────────────────────────────
    let ffzChannelEmotes = [];
    try {
      const r = await fetch(`https://api.frankerfacez.com/v1/room/${channelName}`);
      if (r.ok) {
        const d = await r.json();
        twitchId = String(d.room.twitch_id);
        const set = d.sets[d.room.set];
        ffzChannelEmotes = (set?.emoticons || []).map(e => ({
          id: String(e.id), name: e.name,
          src: `${CDN_FFZ}${e.id}/2`, src4x: `${CDN_FFZ}${e.id}/4`,
          zeroWidth: false,
        }));
      }
    } catch (e) { console.warn('[SEP] FFZ channel fetch failed', e); }

    // ── Step 2: FFZ global ───────────────────────────────────────────────────
    let ffzGlobalEmotes = [];
    try {
      const r = await fetch('https://api.frankerfacez.com/v1/set/global');
      if (r.ok) {
        const d = await r.json();
        ffzGlobalEmotes = Object.values(d.sets || {}).flatMap(s =>
          (s.emoticons || []).map(e => ({
            id: String(e.id), name: e.name,
            src: `${CDN_FFZ}${e.id}/2`, src4x: `${CDN_FFZ}${e.id}/4`,
            zeroWidth: false,
          }))
        );
      }
    } catch (e) { console.warn('[SEP] FFZ global fetch failed', e); }

    // ── Step 3: 7TV helpers ──────────────────────────────────────────────────
    function parse7TV(emoteSet) {
      return (emoteSet?.emotes || []).map(e => ({
        id: e.id, name: e.name,
        src: `${CDN_7TV}${e.id}/2x.webp`, src4x: `${CDN_7TV}${e.id}/4x.webp`,
        zeroWidth: !!(e.flags & 1) || !!(e.data?.flags & 1),
      }));
    }
  // ── fetch 7TV By TwitchId ──────────────────────────────────────────────── 
    async function fetch7TVByTwitchId(id) {
      const r = await fetch(`https://7tv.io/v3/users/twitch/${id}`);
      if (!r.ok) throw new Error(`7TV /users/twitch/${id} → ${r.status}`);
      const d = await r.json();
      if (d.emote_set?.emotes?.length) return parse7TV(d.emote_set);
      if (d.emote_set?.id) {
        const r2 = await fetch(`https://7tv.io/v3/emote-sets/${d.emote_set.id}`);
        if (r2.ok) return parse7TV(await r2.json());
      }
      return [];
    }

    async function fetch7TVByName(name) {
      const r = await fetch('https://7tv.io/v3/gql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query($q:String!){users(query:$q){id username connections{platform emote_set_id}}}`,
          variables: { q: name },
        }),
      });
      if (!r.ok) throw new Error(`7TV GQL → ${r.status}`);
      const d = await r.json();
      const users = d.data?.users || [];
      const user  = users.find(u => u.username?.toLowerCase() === name.toLowerCase()) || users[0];
      if (!user) return [];
      const conn  = (user.connections || []).find(c => c.platform === 'TWITCH');
      if (!conn?.emote_set_id) return [];
      const r2 = await fetch(`https://7tv.io/v3/emote-sets/${conn.emote_set_id}`);
      if (!r2.ok) return [];
      return parse7TV(await r2.json());
    }
  
    // ───────────────────────────────────────────────────────────────
    //  Twitch Global Emotes — ВСЕ 225 эмутов с правильными именами ===
    //  фетч  модуль 7BTVFZ_Emote_picker\chat\fetchTwitchGlobalEmotes.js

    // ───────────────────────────────────────────────────────────────
    // Полный список всех эмутов с настоящими именами
    //  фетч  модуль 7BTVFZ_Emote_picker\chat\fetchTwitchGlobalEmotes.js
    
    // ── Step 3a: 7TV channel ─────────────────────────────────────────────────
    let sevenTVChannel = [];
    try {
      if (twitchId) sevenTVChannel = await fetch7TVByTwitchId(twitchId);
      if (!sevenTVChannel.length) sevenTVChannel = await fetch7TVByName(channelName);
    } catch (e) {
      console.warn('[SEP] 7TV channel A failed:', e);
      try { sevenTVChannel = await fetch7TVByName(channelName); }
      catch (e2) { console.warn('[SEP] 7TV channel B failed:', e2); }
    }

    // Если twitchId всё ещё нет — пробуем decapi
    if (!twitchId) {
      try {
        const r = await fetch(`https://decapi.me/twitch/id/${channelName}`);
        if (r.ok) {
          const t = await r.text();
          if (/^\d+$/.test(t.trim())) twitchId = t.trim();
        }
      } catch (e) { console.warn('[SEP] decapi twitchId failed', e); }
    }

    // ── Step 3: 7TV global ──────────────────────────────────────────────────
    let sevenTVGlobal = [];
    try {
      const r = await fetch('https://7tv.io/v3/emote-sets/global');
      if (r.ok) sevenTVGlobal = parse7TV(await r.json());
    } catch (e) { console.warn('[SEP] 7TV global fetch failed', e); }

    // ── Step 4: BTTV global ──────────────────────────────────────────────────
    let bttvGlobalEmotes = [];
    try {
      const r = await fetch('https://api.betterttv.net/3/cached/emotes/global');
      if (r.ok) {
        bttvGlobalEmotes = (await r.json()).map(e => ({
          id: e.id, name: e.code,
          src: `${CDN_BTTV}${e.id}/2x`, src4x: `${CDN_BTTV}${e.id}/4x`,
          zeroWidth: false,
        }));
      }
    } catch (e) { console.warn('[SEP] BTTV global fetch failed', e); }

    // ── Step 4 : BTTV channel ────────────────────────────────────────────────
    let bttvChannelEmotes = [];
    if (twitchId) {
      try {
        const r = await fetch(`https://api.betterttv.net/3/cached/users/twitch/${twitchId}`);
        if (r.ok) {
          const d = await r.json();
          bttvChannelEmotes = [
            ...(d.channelEmotes || []),
            ...(d.sharedEmotes  || []),
          ].map(e => ({
            id: e.id, name: e.code,
            src: `${CDN_BTTV}${e.id}/2x`, src4x: `${CDN_BTTV}${e.id}/4x`,
            zeroWidth: false,
          }));
        }
      } catch (e) { console.warn('[SEP] BTTV channel fetch failed', e); }
    }

    // ── Step 5: Twitch Global Emotes (без Client-ID) ───────────────────────
    let twitchGlobalEmotes = [];
    try {
      twitchGlobalEmotes = await fetchTwitchGlobalEmotes();
    } catch (e) {
      console.warn('[SEP] Twitch Global fetch полностью упал', e);
    }

    console.log(`[SEP]  Итог загрузки — twitch-gl:${twitchGlobalEmotes.length}`);
    
    return {
        sevenTVChannel, 
        sevenTVGlobal,
        bttvChannelEmotes, 
        bttvGlobalEmotes,
        ffzChannelEmotes, 
        ffzGlobalEmotes,
        twitchGlobalEmotes   // ← добавили
      };
  }

  // ─── State ───────────────────────────────────────────────────────────────────
  const state = {
    activeTab   : '7tv-ch',
    page        : 0,
    query       : '',
    emotesByTab : {
      '7tv-ch'  : [], '7tv-gl'  : [],
      'bttv-ch' : [], 'bttv-gl' : [],
      'ffz-ch'  : [], 'ffz-gl'  : [],
    },
    loaded: false,
  };

    function applyFetchResult({ 
      sevenTVChannel, sevenTVGlobal, 
      bttvChannelEmotes, bttvGlobalEmotes, 
      ffzChannelEmotes, ffzGlobalEmotes,
      twitchGlobalEmotes  
    }) {
      console.log('[SEP]  Applying fetch result...');
      state.emotesByTab['7tv-ch']   = sevenTVChannel;
      state.emotesByTab['7tv-gl']   = sevenTVGlobal;
      state.emotesByTab['bttv-ch']  = bttvChannelEmotes;
      state.emotesByTab['bttv-gl']  = bttvGlobalEmotes;
      state.emotesByTab['ffz-ch']   = ffzChannelEmotes;
         state.emotesByTab['ffz-gl']   = ffzGlobalEmotes;
    state.emotesByTab['twitch-gl'] = twitchGlobalEmotes || [];   // ← НОВОЕ
      console.log('[SEP] ✓ State updated');
    }

  // ─── Panel (mini inline picker) ──────────────────────────────────────────────
  function buildPanel() {
    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.classList.add('sep-hidden');
    panel.innerHTML = `
      <div class="sep-search-wrap">
        <input class="sep-search" placeholder="Search emotes…" autocomplete="off" spellcheck="false"/>
      </div>
      <div class="sep-tabs">
        <div class="sep-tab sep-active" data-tab="7tv-ch">7TV</div>
        <div class="sep-tab" data-tab="7tv-gl">7TV GL</div>
        <div class="sep-tab" data-tab="bttv-ch">BTTV</div>
        <div class="sep-tab" data-tab="bttv-gl">BTTV GL</div>
        <div class="sep-tab" data-tab="ffz-ch">FFZ</div>
        <div class="sep-tab" data-tab="ffz-gl">FFZ GL</div>
      </div>
      <div class="sep-grid-wrap">
        <div class="sep-grid"><div class="sep-state">Loading…</div></div>
      </div>
      <div class="sep-pagination">
        <button class="sep-page-btn" id="sep-prev" disabled>&#9664;</button>
        <span class="sep-page-label" id="sep-page-label">— / —</span>
        <button class="sep-page-btn" id="sep-next" disabled>&#9654;</button>
      </div>`;
    document.body.appendChild(panel);
    return panel;
  }

  function filteredEmotes() {
    const list = state.emotesByTab[state.activeTab] || [];
    if (!state.query) return list;
    const q = state.query.toLowerCase();
    return list.filter(e => e.name.toLowerCase().includes(q));
  }
 // ─── UI render Panel picker (mini inline ) ──────────────────────────────────────────────
  function renderGrid(panel) {
    const grid      = panel.querySelector('.sep-grid');
    const prevBtn   = panel.querySelector('#sep-prev');
    const nextBtn   = panel.querySelector('#sep-next');
    const pageLabel = panel.querySelector('#sep-page-label');

    if (!state.loaded) {
      grid.innerHTML = '<div class="sep-state">Loading…</div>';
      prevBtn.disabled = nextBtn.disabled = true;
      pageLabel.textContent = '— / —';
      return;
    }

    const all   = filteredEmotes();
    const total = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
    state.page  = Math.max(0, Math.min(state.page, total - 1));
    const slice = all.slice(state.page * PAGE_SIZE, (state.page + 1) * PAGE_SIZE);

    if (!slice.length) {
      grid.innerHTML = '<div class="sep-state">No emotes found</div>';
      prevBtn.disabled = nextBtn.disabled = true;
      pageLabel.textContent = '0 / 0';
      return;
    }

    const frag = document.createDocumentFragment();
    slice.forEach(emote => {
      const btn = document.createElement('div');
      btn.className = 'sep-emote' + (emote.zeroWidth ? ' sep-emote--zw' : '');
      btn.setAttribute('data-name', emote.name);
      btn.title = emote.name + (emote.zeroWidth ? ' (zero-width)' : '');
      const img = document.createElement('img');
      img.src = emote.src;
      const hires = emote.src4x || emote.src2x;
      if (hires) img.srcset = `${emote.src} 1x, ${hires} 2x`;
      img.alt = emote.name; img.loading = 'lazy';
      img.onerror = function () { this.style.display = 'none'; };
      btn.appendChild(img);
      if (emote.zeroWidth) {
        const badge = document.createElement('span');
        badge.className = 'sep-zw-badge'; badge.textContent = 'ZW';
        btn.appendChild(badge);
      }
      btn.addEventListener('click', () => insertEmote(emote.name));
      frag.appendChild(btn);
    });

    grid.innerHTML = '';
    grid.appendChild(frag);
    grid.scrollTop = 0;
    pageLabel.textContent = `${state.page + 1} / ${total}`;
    prevBtn.disabled = state.page === 0;
    nextBtn.disabled = state.page >= total - 1;
  }

  // ─── Insert emote ─────────────────────────────────────────────────────────────
  function insertEmote(name) {
    const input = document.querySelector(
      '[data-a-target="chat-input"], .chat-input__textarea textarea, div[contenteditable="true"]'
    );
    if (!input) return;
    input.focus();
    if (input.isContentEditable) {
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(input);
      range.collapse(false);
      sel.removeAllRanges(); sel.addRange(range);
      document.execCommand('insertText', false, name + ' ');
    } else {
      const start = input.selectionStart, end = input.selectionEnd;
      const val   = input.value, insert = name + ' ';
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
      if (setter) setter.call(input, val.slice(0, start) + insert + val.slice(end));
      else input.value = val.slice(0, start) + insert + val.slice(end);
      input.selectionStart = input.selectionEnd = start + insert.length;
      input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    }
  }

  // ─── Wire panel ───────────────────────────────────────────────────────────────
  function wirePanel(panel) {
    panel.querySelectorAll('.sep-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        panel.querySelectorAll('.sep-tab').forEach(t => t.classList.remove('sep-active'));
        tab.classList.add('sep-active');
        state.activeTab = tab.dataset.tab;
        state.page = 0; state.query = '';
        panel.querySelector('.sep-search').value = '';
        renderGrid(panel);
      });
    });
    panel.querySelector('#sep-prev').addEventListener('click', () => { state.page--; renderGrid(panel); });
    panel.querySelector('#sep-next').addEventListener('click', () => { state.page++; renderGrid(panel); });
    let searchTimer;
    panel.querySelector('.sep-search').addEventListener('input', e => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => { state.query = e.target.value.trim(); state.page = 0; renderGrid(panel); }, 220);
    });
    document.addEventListener('click', e => {
      if (!panel.classList.contains('sep-hidden') && !panel.contains(e.target) && e.target !== document.getElementById(BTN_ID))
        panel.classList.add('sep-hidden');
    });
    panel.addEventListener('click', e => e.stopPropagation());
  }

  // ─── Inject button ────────────────────────────────────────────────────────────
  function injectButton() {
    
    if (document.getElementById(BTN_ID)) return;
    const btn = document.createElement('button');
    btn.id = BTN_ID; btn.title = '7BTVFZ Emote Picker'; btn.type = 'button';
    const img = document.createElement('img');
    img.src = chrome.runtime.getURL('assets/bttn-ndrnhrdhrdh-e4ndt8789674g.png');
    img.alt = '7BTVFZ Emote Picker'; img.width = 90; img.height = 34;
    img.style.cssText = 'display:block;pointer-events:none;';
    btn.appendChild(img);
    btn.addEventListener('click', e => { e.stopPropagation(); chrome.runtime.sendMessage({ type: 'OPEN_POPOUT' }); });
    const container = document.querySelector('.chat-input__buttons-container, [data-test-selector="chat-input-buttons-container"]');
    if (!container) return;
    container.insertBefore(btn, container.firstChild);
  }

  // ─── Chat emote renderer ──────────────────────────────────────────────────────
  let emoteMap = new Map();
  let chatObserver      = null;
  let emoteEventObserver = null;
  const RENDERED_ATTR   = 'data-sep-rendered';

  function buildEmoteMap() {
    console.log('[SEP] 🗺️ Building emoteMap...');
    emoteMap.clear();
    const order = [
      ['7tv-gl',  '7tv'],
      ['ffz-gl',  'ffz'],
      ['ffz-ch',  'ffz'],
      ['bttv-gl', 'bttv'],
      ['bttv-ch', 'bttv'],
      ['7tv-ch',  '7tv'],
    ];
    order.forEach(([tab, source]) => {
      (state.emotesByTab[tab] || []).forEach(e => {
        emoteMap.set(e.name, {
          src: e.src, src2x: e.src4x || e.src2x || e.src,
          zeroWidth: !!e.zeroWidth, source,
        });
      });
    });
    console.log(`[SEP] ✓ emoteMap built: ${emoteMap.size} emotes (ZW: ${[...emoteMap.values()].filter(e => e.zeroWidth).length})`);
    window.__sepAC?.update(() => emoteMap);
  }

  // ─── ✨ Refresh emotes & re-render everything ────────────────────────────────
  async function refreshEmotes() {
    const channel = getChannelName();
    if (!channel) return;
    console.log('[SEP] 🔄 Refreshing emotes…');
    try {
      const result = await fetchAllEmotes(channel);
      applyFetchResult(result);
      buildEmoteMap();

      const chatList = document.querySelector(
        '.chat-list--default, .chat-list, [data-test-selector="chat-scrollable-area__message-container"]'
      );
      if (!chatList) { console.warn('[SEP] chatList not found'); return; }

      // ── Восстанавливаем ТОЛЬКО спаны с реально отрендеренными эмоутами ───────
      // Спаны без эмоутов никогда не получают RENDERED_ATTR (после фикса выше),
   // Сбрасываем RENDERED_ATTR (на span'ах с текстом)
      chatList.querySelectorAll(`[${RENDERED_ATTR}]`).forEach(span => {
          span.removeAttribute(RENDERED_ATTR);

          // Восстанавливаем оригинальный текст из структуры DOM
          const parts = [];
          span.childNodes.forEach(child => {
              if (child.nodeType === Node.TEXT_NODE) {
                  parts.push(child.textContent);
              } else if (child.classList?.contains('sep-chat-emote')) {
                  parts.push(child.alt);
              } else if (child.classList?.contains('sep-emote-wrap')) {
                  const base = child.querySelector('.sep-emote-base');
                  if (base) parts.push(base.alt);
                  child.querySelectorAll('.sep-emote-overlay').forEach(ov => parts.push(ov.alt));
              }
          });

          const restored = parts.join('');
          if (restored.trim()) span.textContent = restored;
      });

      // Отдельно сбрасываем FFZ_PROCESSED_ATTR (на message-контейнерах)
      chatList.querySelectorAll(`[${FFZ_PROCESSED_ATTR}]`).forEach(el => {
          el.removeAttribute(FFZ_PROCESSED_ATTR);
      });

      // ── Перерендериваем все видимые строки чата ───────────────────────────────
      [...chatList.querySelectorAll('.chat-line__message')].forEach(renderChatLine);

      console.log('[SEP] ✅ Refresh complete');
    } catch (e) {
      console.error('[SEP] ❌ Refresh failed', e);
    }
  }

  // ─── ✨ Emote event monitor ──────────────────────────────────────────────────
  function startEmoteEventMonitor() {
    if (emoteEventObserver) emoteEventObserver.disconnect();
    const chatList = document.querySelector(
      '.chat-list--default, .chat-list, [data-test-selector="chat-scrollable-area__message-container"]'
    );
    if (!chatList) { setTimeout(startEmoteEventMonitor, 1000); return; }

    let refreshDebounce = null;

    emoteEventObserver = new MutationObserver(mutations => {
      let needsRefresh = false;

      mutations.forEach(({ addedNodes }) => {
        addedNodes.forEach(node => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;

          // ── Ваш собственный emote-event скрипт ───────────────────────────────
          const isSepEvent =
            node.classList?.contains('sep-7btvfz-emote-event-line') ||
            node.hasAttribute?.('data-sep-7btvfz-emote-event-type') ||
            node.querySelector?.('[data-sep-7btvfz-emote-event-type]');

          // ── FFZ native notice ─────────────────────────────────────────────────
          const isFfz =
            node.classList?.contains('ffz-notice-line') &&
            node.classList?.contains('user-notice-line');

          // ── 7TV native event ──────────────────────────────────────────────────
          const is7tv =
            node.querySelector?.('[data-a-target="7tv-emote-event"]') ||
            node.getAttribute?.('data-a-target') === '7tv-emote-event';

          if (isSepEvent || isFfz || is7tv) {
            const text = node.textContent || '';
            if (/added emote|removed emote|added the emote|removed the emote|updated the active emote set/i.test(text)) {
              console.log('[SEP] 🔔 Emote event detected:', text.slice(0, 80));
              needsRefresh = true;
            }
          }
        });
      });

      if (needsRefresh) {
        clearTimeout(refreshDebounce);
        refreshDebounce = setTimeout(refreshEmotes, 400);
      }
    });

    emoteEventObserver.observe(chatList, { childList: true, subtree: true });
    console.log('[SEP] 👁️ Emote event monitor started');
  }

  // ─── Chat rendering ───────────────────────────────────────────────────────────
  function makeEmoteImg(name, e) {
    const img = document.createElement('img');
    img.src = e.src;
    if (e.src2x) img.srcset = `${e.src} 1x, ${e.src2x} 1x`;
    img.alt = name; img.title = name; img.className = 'sep-chat-emote';
    img.onerror = function () { this.replaceWith(document.createTextNode(name)); };
    return img;
  }

  // ─── Chat rendering ───────────────────────────────────────────────────────────
  function renderChatLine(line) {
      // 1️⃣ Находим все .text-fragment'ы (они содержат 7TV эмоты и ZW модификаторы)
      const fragments = line.querySelectorAll('.text-fragment[data-a-target="chat-message-text"]:not([data-sep-rendered])');
      
      fragments.forEach(fragment => {
          // 2️⃣ Находим ближайший ПРЕДЫДУЩИЙ Twitch эмоут (если он есть)
          let twitchEmoteDiv = null;
          let prevElement = fragment.previousElementSibling;
          
          while (prevElement) {
              // Проверяем ffz--inline с twitch-emote
              if (prevElement.classList.contains('ffz--inline')) {
                  const twitchImg = prevElement.querySelector('img.twitch-emote');
                  if (twitchImg) {
                      twitchEmoteDiv = prevElement;
                      break;
                  }
              }
              // Также проверяем прямой twitch-emote (на всякий случай)
              if (prevElement.querySelector && prevElement.querySelector('img.twitch-emote')) {
                  twitchEmoteDiv = prevElement;
                  break;
              }
              prevElement = prevElement.previousElementSibling;
          }
          
          // 3️⃣ Обрабатываем текстовый фрагмент
          const twitchImgClone = twitchEmoteDiv ? 
              twitchEmoteDiv.querySelector('img.twitch-emote').cloneNode(true) : 
              null;
          
          renderTextFragment(fragment, twitchImgClone, twitchEmoteDiv);
      });
  }

  // ─── Определение размера эмота и добавление дата-атрибутов ────────────────
    // ─── Определение размера и точное центрирование оверлеев ────────────────
  function applyEmoteAspectRatio(wrap) {
      if (!wrap || wrap.hasAttribute('data-sep-aspect-checked')) return;

      const baseImg = wrap.querySelector('.sep-emote-base');
      if (!baseImg) return;

      const overlays = Array.from(wrap.querySelectorAll('.sep-emote-overlay'));

      const centerOverlays = () => {
          // Натуральные размеры базового эмоута (учитываем реальное изображение)
          const baseNaturalW = baseImg.naturalWidth || baseImg.width || 28;
          const baseNaturalH = baseImg.naturalHeight || baseImg.height || 28;

          // Для каждого оверлея вычисляем его собственный размер
          overlays.forEach(ovImg => {
              const ovNaturalW = ovImg.naturalWidth || ovImg.width || 28;
              const ovNaturalH = ovImg.naturalHeight || ovImg.height || 28;

              // Смещение, чтобы центрировать оверлей относительно базового
              // (учитываем разницу в размерах)
              const offsetX = (baseNaturalW - ovNaturalW) / 2;
              const offsetY = (baseNaturalH - ovNaturalH) / 2;

              // Применяем точное смещение поверх translate(-50%, -50%)
              ovImg.style.setProperty('--sep-overlay-offset-x', `${offsetX}px`, 'important');
              ovImg.style.setProperty('--sep-overlay-offset-y', `${offsetY}px`, 'important');

              // Дополнительно можно добавить data-атрибуты для отладки
              wrap.setAttribute('data-base-width', baseNaturalW);
              wrap.setAttribute('data-base-height', baseNaturalH);
          });
      };

      // Если изображения уже загружены
      if (baseImg.complete && baseImg.naturalWidth > 0) {
          centerOverlays();
      } else {
          baseImg.addEventListener('load', centerOverlays, { once: true });
      }

      // Ждём загрузки оверлеев (на случай, если они грузятся позже)
      overlays.forEach(ov => {
          if (ov.complete && ov.naturalWidth > 0) {
              centerOverlays();
          } else {
              ov.addEventListener('load', centerOverlays, { once: true });
          }
      });

      wrap.setAttribute('data-sep-aspect-checked', '1');
  }



    // ─── POST-PROCESSING ДЛЯ FFZ + 7TV ZW ─────────────────────────────────────
  // ─── УЛУЧШЕННЫЙ POST-PROCESSING ДЛЯ FFZ + 7TV (ZW и обычные) ───────────────
  function processFFZCompatibility(messageElement) {
      if (!messageElement) return;

      let children = Array.from(messageElement.children);

      for (let i = 0; i < children.length; i++) {
          const current = children[i];

          // 1. Нашли FFZ-элемент
          if (!current.classList.contains('ffz--inline')) continue;

          const ffzImg = current.querySelector('img.ffz-emote');
          if (!ffzImg) continue;

          // 2. Ищем следующий 7TV (может быть внутри text-fragment)
          let nextWrap = null;
          let nextTextFragment = null;

          const nextChild = children[i + 1];

          if (nextChild?.classList.contains('text-fragment')) {
              nextTextFragment = nextChild;
              nextWrap = nextChild.querySelector('.sep-emote-wrap');
          } else if (nextChild?.classList.contains('sep-emote-wrap')) {
              nextWrap = nextChild;
          }

          if (!nextWrap) continue;

          // 3. Оборачиваем FFZ в sep-emote-wrap (если ещё нет)
          let wrap = current.closest('.sep-emote-wrap');
          if (!wrap) {
              wrap = document.createElement('span');
              wrap.className = 'sep-emote-wrap';
              current.parentNode.insertBefore(wrap, current);
              wrap.appendChild(current);
          }

          // 4. Делаем FFZ базовым
          ffzImg.classList.add('sep-emote-base');

          // 5. Все картинки из 7TV-wrap превращаем в оверлеи
          const sevenTvImages = Array.from(nextWrap.querySelectorAll('img'));
          sevenTvImages.forEach(img => {
              img.classList.remove('sep-emote-base', 'sep-chat-emote');
              img.classList.add('sep-emote-overlay', 'chat-image');
              wrap.appendChild(img);
          });

          // 6. Удаляем старый 7TV-контейнер
          if (nextTextFragment) {
              nextTextFragment.remove();
          } else {
              nextWrap.remove();
          }
                      // После всех манипуляций с wrap
          applyEmoteAspectRatio(wrap);
          // Обновляем список детей (чтобы правильно обработать следующий FFZ)
          children = Array.from(messageElement.children);
          i++; // пропускаем уже обработанный элемент
      }
  }

  // ─── МОДИФИЦИРОВАННАЯ renderTextFragment ───────────────────────────────────
  function renderTextFragment(span, twitchImgClone = null, twitchEmoteDiv = null) {
      if (span.hasAttribute(RENDERED_ATTR)) return;

      const text = span.textContent;
      const parts = text.split(/(\s+)/);

      let hasEmoteOrMod = false;
      for (const p of parts) {
          if (emoteMap.has(p) || window.EmoteModifiers?.isModifier(p)) {
              hasEmoteOrMod = true;
              break;
          }
      }

      if (!hasEmoteOrMod && !twitchImgClone) return;

      span.setAttribute(RENDERED_ATTR, '4');
      if (window.EmoteModifiers) window.EmoteModifiers.injectStyles();

      const nodes = [];

      // 1 ПЕРВЫЙ ПРОХОД: разбираем текст
      for (const part of parts) {
          if (part.trim() === '') {
              nodes.push({ type: 'text', value: part });
              continue;
          }
          const e = emoteMap.get(part);
          const isMod = window.EmoteModifiers?.isModifier(part);

          if (!e && !isMod) {
              nodes.push({ type: 'text', value: part });
              continue;
          }

          if (isMod) {
              if (part === 'z!' || part === 'Z') {
                  // Z-логика (присоединяет ZW только к предыдущему эмоуту)
                  let currentEmoteIdx = -1;
                  let targetEmoteIdx = -1;
                  for (let i = nodes.length - 1; i >= 0; i--) {
                      if (nodes[i].type === 'emote' || nodes[i].type === 'zw-temp') {
                          if (currentEmoteIdx === -1) currentEmoteIdx = i;
                          else { targetEmoteIdx = i; break; }
                      }
                  }
                  if (currentEmoteIdx !== -1 && targetEmoteIdx !== -1) {
                      const current = nodes[currentEmoteIdx];
                      const target = nodes[targetEmoteIdx];
                      if (current.type === 'zw-temp') {
                          target.overlays.push({ name: current.name, emote: current.emote, modClasses: current.modClasses, isZW: true });
                      } else if (current.type === 'emote') {
                          target.overlays.push({ name: current.name, emote: current.emote, modClasses: current.modClasses, isZW: false });
                      }
                      nodes.splice(currentEmoteIdx, 1);
                  }
                  continue;
              }

              const modClass = window.EmoteModifiers.getModifierClass(part);
              for (let i = nodes.length - 1; i >= 0; i--) {
                  if (nodes[i].type === 'emote' || nodes[i].type === 'zw-temp') {
                      nodes[i].modClasses.push(modClass);
                      break;
                  }
              }
              continue;
          }

          // 7TV-эмот
          if (e.zeroWidth) {
              nodes.push({ type: 'zw-temp', name: part, emote: e, modClasses: [] });
          } else {
              nodes.push({ type: 'emote', name: part, emote: e, overlays: [], modClasses: [] });
          }
      }

      // 2 ВТОРОЙ ПРОХОД: ZW-логика (только для 7TV)
      const finalNodes = [];
      for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          if (node.type === 'zw-temp') {
              let found = false;
              for (let j = finalNodes.length - 1; j >= 0; j--) {
                  if (finalNodes[j].type === 'emote') {
                      finalNodes[j].overlays.push({
                          name: node.name,
                          emote: node.emote,
                          modClasses: node.modClasses,
                          isZW: true
                      });
                      found = true;
                      break;
                  }
              }
              if (!found) {
                  finalNodes.push({
                      type: 'emote',
                      name: node.name,
                      emote: node.emote,
                      overlays: [],
                      modClasses: node.modClasses,
                      isZW: true
                  });
              }
          } else {
              finalNodes.push(node);
          }
      }

      // ТРЕТИЙ ПРОХОД: рендеринг
      const frag = document.createDocumentFragment();

      // Twitch-wrap создаём первым — ZW будут цепляться к нему
      let lastNonZWWrap = null;

      if (twitchImgClone) {
          const twitchWrap = document.createElement('span');
          twitchWrap.className = 'sep-emote-wrap';

          const twitchImg = twitchImgClone.cloneNode(true);
          twitchImg.className = 'twitch-emote sep-emote-base chat-image chat-line__message--emote ffz--pointer-events ffz-tooltip';
          twitchWrap.appendChild(twitchImg);
          frag.appendChild(twitchWrap);

          // Удаляем оригинальный Twitch-эмоут от FFZ
          if (twitchEmoteDiv) twitchEmoteDiv.remove();

          // Twitch становится якорем для ZW
          lastNonZWWrap = twitchWrap;
      }

      for (const node of finalNodes) {
          if (node.type === 'text') {
              // Пробел между Twitch и ZW НЕ должен разрывать связь
              if (node.value.trim() !== '') lastNonZWWrap = null;
              frag.appendChild(document.createTextNode(node.value));
              continue;
          }

          // ZW-эмот без базы — цепляем к предыдущему wrap'у (в т.ч. Twitch)
          if (node.isZW && lastNonZWWrap) {
              const ovImg = makeEmoteImg(node.name, node.emote);
              ovImg.className = 'sep-emote-overlay chat-image';
              if (node.modClasses?.length) node.modClasses.forEach(cls => ovImg.classList.add(cls));
              lastNonZWWrap.appendChild(ovImg);
              applyEmoteAspectRatio(lastNonZWWrap);
              continue;
          }

          // Обычный 7TV-эмот — создаём новый wrap
          const wrap = document.createElement('span');
          wrap.className = 'sep-emote-wrap';

          const baseImg = makeEmoteImg(node.name, node.emote);
          baseImg.classList.add('sep-emote-base');
          if (node.modClasses?.length) node.modClasses.forEach(cls => baseImg.classList.add(cls));
          wrap.appendChild(baseImg);

          node.overlays?.forEach(ov => {
              const ovImg = makeEmoteImg(ov.name, ov.emote);
              ovImg.className = 'sep-emote-overlay chat-image';
              if (ov.modClasses?.length) ov.modClasses.forEach(cls => ovImg.classList.add(cls));
              wrap.appendChild(ovImg);
          });

          applyEmoteAspectRatio(wrap);
          frag.appendChild(wrap);

          // Обычный эмот становится новым якорем для следующих ZW
          lastNonZWWrap = wrap;
      }

      span.textContent = '';
      span.appendChild(frag);

      // Запускаем совместимость с FFZ (если нужно)
      const messageContainer = span.closest('.message') || span.closest('.chat-line__message-container');
      if (messageContainer) {
          waitForFFZThenProcess(messageContainer);
      }
  }

    // ─── Ждём пока FFZ обработает контейнер, потом совмещаем ─────────────────────
  const FFZ_PROCESSED_ATTR = 'data-sep-ffz-done';

  function waitForFFZThenProcess(messageContainer) {
      // Уже обработан — пропускаем
      if (messageContainer.hasAttribute(FFZ_PROCESSED_ATTR)) return;

      // FFZ уже вставил ffz--inline? → сразу обрабатываем
      if (messageContainer.querySelector('.ffz--inline img.ffz-emote')) {
          messageContainer.setAttribute(FFZ_PROCESSED_ATTR, '1');
          processFFZCompatibility(messageContainer);
          return;
      }

      // FFZ ещё не отработал → наблюдаем за контейнером
      let settled = false;
      let fallbackTimer = null;

      const obs = new MutationObserver((mutations) => {
          if (settled) return;

          // Проверяем: FFZ добавил хотя бы один ffz--inline?
          const hasFFZNow = messageContainer.querySelector('.ffz--inline img.ffz-emote');
          if (!hasFFZNow) return;

          // Даём FFZ закончить текущую пачку мутаций (один rAF достаточно)
          settled = true;
          obs.disconnect();
          clearTimeout(fallbackTimer);

          requestAnimationFrame(() => {
              messageContainer.setAttribute(FFZ_PROCESSED_ATTR, '1');
              processFFZCompatibility(messageContainer);
          });
      });

      obs.observe(messageContainer, { childList: true, subtree: true });

      // Страховочный таймер: FFZ может вообще не придти (нет FFZ-эмотов)
      fallbackTimer = setTimeout(() => {
          if (settled) return;
          settled = true;
          obs.disconnect();
          messageContainer.setAttribute(FFZ_PROCESSED_ATTR, '1');
          processFFZCompatibility(messageContainer);
      },  500);
  }

  
  function startChatRenderer() {
    if (chatObserver) chatObserver.disconnect();
    const chatList = document.querySelector(
      '.chat-list--default, .chat-list, [data-test-selector="chat-scrollable-area__message-container"]'
    );
    if (!chatList) { setTimeout(startChatRenderer, 1500); return; }
    chatList.querySelectorAll('.chat-line__message').forEach(renderChatLine);
    chatObserver = new MutationObserver(mutations => {
      mutations.forEach(({ addedNodes }) => {
        addedNodes.forEach(node => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          if (node.classList?.contains('chat-line__message')) { renderChatLine(node); return; }
          node.querySelectorAll?.('.chat-line__message').forEach(renderChatLine);
        });
      });
    });
    chatObserver.observe(chatList, { childList: true, subtree: true });
    console.log('[SEP] Chat renderer started');
  }

  // ─── Main ────────────────────────────────────────────────────────────────────
  async function main() {
    console.log('[SEP] ════ INITIALIZATION STARTED ════');
    injectStyle();
    const channel = getChannelName();
    if (!channel || ['directory','following','videos','clips','about'].includes(channel)) {
      console.log('[SEP] Not a valid channel page, exiting');
      return;
    }
    console.log(`[SEP] Channel: ${channel}`);

    const panel = buildPanel();
    wirePanel(panel);

    try {
      await waitFor('.chat-input__buttons-container, [data-test-selector="chat-input-buttons-container"]');
    } catch { console.warn('[SEP] Chat container not found'); return; }

    injectButton();
     // После injectButton()
 await new Promise(r => setTimeout(r, 355)); // даём Twitch время заполнить localStorage
    const reInjectObs = new MutationObserver(() => { if (!document.getElementById(BTN_ID)) injectButton(); });
    reInjectObs.observe(document.body, { childList: true, subtree: true });

    try {
      const result = await fetchAllEmotes(channel);
      applyFetchResult(result);
      state.loaded = true;
      renderGrid(panel);
      buildEmoteMap();
      startChatRenderer();
      startEmoteEventMonitor(); // ✨ Start monitoring
      window.__sepAC?.init(() => emoteMap);
      console.log('[SEP] ✅ ════ INITIALIZATION COMPLETE ════');
    } catch (e) { console.error('[SEP] Failed to load emotes', e); }

    // SPA navigation
    let lastChannel = channel;
    setInterval(() => {
      const ch = getChannelName();
      if (!ch || ch === lastChannel) return;
      console.log(`[SEP] 🚀 Channel change detected: ${lastChannel} → ${ch}`);
      lastChannel = ch;
      state.loaded = false;
      state.page   = 0;
      state.emotesByTab = { '7tv-ch': [], '7tv-gl': [], 'bttv-ch': [], 'bttv-gl': [], 'ffz-ch': [], 'ffz-gl': [] };
      renderGrid(panel);
      fetchAllEmotes(ch).then(result => {
        applyFetchResult(result);
        state.loaded = true;
        renderGrid(panel);
        buildEmoteMap();
        startChatRenderer();
        startEmoteEventMonitor(); // ✨ Restart monitor
        window.__sepAC?.update(() => emoteMap);
        console.log('[SEP] ✓ Channel navigation complete');
      }).catch(e => console.error('[SEP] Emote reload failed', e));
    }, 2000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
  else main();

  // ─── Message bridge ───────────────────────────────────────────────────────────
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === 'GET_EMOTES') {
      sendResponse({ loaded: state.loaded, emotesByTab: state.emotesByTab, channel: getChannelName() });
      return true;
    }
    if (msg.type === 'INSERT_EMOTE') { insertEmote(msg.name); sendResponse({ ok: true }); return true; }
    if (msg.type === 'SEND_CHAT') {
      document.querySelector('[data-a-target="chat-send-button"]')?.click();
      sendResponse({ ok: true });
    }
  });

})();