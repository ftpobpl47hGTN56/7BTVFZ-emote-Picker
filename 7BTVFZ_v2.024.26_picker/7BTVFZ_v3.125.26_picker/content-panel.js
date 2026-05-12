// ============================================================
// content-panel.js — Panel UI, grid rendering, emote insert, button injection
// Part 4/6 of content.js split
// ============================================================

(function () {
  'use strict';
  const SEP = window._SEP;

  // ─── Panel (mini inline picker) ──────────────────────────────────────────────
  SEP.buildPanel = function buildPanel() {
    const panel = document.createElement('div');
    panel.id = SEP.PANEL_ID;
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
  };

  SEP.filteredEmotes = function filteredEmotes() {
    const list = SEP.state.emotesByTab[SEP.state.activeTab] || [];
    if (!SEP.state.query) return list;
    const q = SEP.state.query.toLowerCase();
    return list.filter(e => e.name.toLowerCase().includes(q));
  };

  // ─── UI render Panel picker (mini inline) ────────────────────────────────────
  SEP.renderGrid = function renderGrid(panel) {
    const grid      = panel.querySelector('.sep-grid');
    const prevBtn   = panel.querySelector('#sep-prev');
    const nextBtn   = panel.querySelector('#sep-next');
    const pageLabel = panel.querySelector('#sep-page-label');

    if (!SEP.state.loaded) {
      grid.innerHTML = '<div class="sep-state">Loading…</div>';
      prevBtn.disabled = nextBtn.disabled = true;
      pageLabel.textContent = '— / —';
      return;
    }

    const all   = SEP.filteredEmotes();
    const total = Math.max(1, Math.ceil(all.length / SEP.PAGE_SIZE));
    SEP.state.page = Math.max(0, Math.min(SEP.state.page, total - 1));
    const slice = all.slice(SEP.state.page * SEP.PAGE_SIZE, (SEP.state.page + 1) * SEP.PAGE_SIZE);

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
      img.alt = emote.name;
      img.loading = 'lazy';
      img.onerror = function () { this.style.display = 'none'; };
      btn.appendChild(img);
      if (emote.zeroWidth) {
        const badge = document.createElement('span');
        badge.className = 'sep-zw-badge';
        badge.textContent = 'ZW';
        btn.appendChild(badge);
      }
      btn.addEventListener('click', () => SEP.insertEmote(emote.name));
      frag.appendChild(btn);
    });

    grid.innerHTML = '';
    grid.appendChild(frag);
    grid.scrollTop = 0;
    pageLabel.textContent = `${SEP.state.page + 1} / ${total}`;
    prevBtn.disabled = SEP.state.page === 0;
    nextBtn.disabled = SEP.state.page >= total - 1;
  };

  // ─── Insert emote ─────────────────────────────────────────────────────────────
  SEP.insertEmote = function insertEmote(name) {
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
      sel.removeAllRanges();
      sel.addRange(range);
      document.execCommand('insertText', false, name + ' ');
    } else {
      const start  = input.selectionStart;
      const end    = input.selectionEnd;
      const val    = input.value;
      const insert = name + ' ';
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
      if (setter) setter.call(input, val.slice(0, start) + insert + val.slice(end));
      else input.value = val.slice(0, start) + insert + val.slice(end);
      input.selectionStart = input.selectionEnd = start + insert.length;
      input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    }
  };

  // ─── Wire panel ───────────────────────────────────────────────────────────────
  SEP.wirePanel = function wirePanel(panel) {
    panel.querySelectorAll('.sep-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        panel.querySelectorAll('.sep-tab').forEach(t => t.classList.remove('sep-active'));
        tab.classList.add('sep-active');
        SEP.state.activeTab = tab.dataset.tab;
        SEP.state.page  = 0;
        SEP.state.query = '';
        panel.querySelector('.sep-search').value = '';
        SEP.renderGrid(panel);
      });
    });

    panel.querySelector('#sep-prev').addEventListener('click', () => { SEP.state.page--; SEP.renderGrid(panel); });
    panel.querySelector('#sep-next').addEventListener('click', () => { SEP.state.page++; SEP.renderGrid(panel); });

    let searchTimer;
    panel.querySelector('.sep-search').addEventListener('input', e => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        SEP.state.query = e.target.value.trim();
        SEP.state.page  = 0;
        SEP.renderGrid(panel);
      }, 220);
    });

    document.addEventListener('click', e => {
      if (
        !panel.classList.contains('sep-hidden') &&
        !panel.contains(e.target) &&
        e.target !== document.getElementById(SEP.BTN_ID)
      ) {
        panel.classList.add('sep-hidden');
      }
    });

    panel.addEventListener('click', e => e.stopPropagation());
  };

  // ─── Inject button ────────────────────────────────────────────────────────────
  SEP.injectButton = function injectButton() {
    if (document.getElementById(SEP.BTN_ID)) return;
    const btn = document.createElement('button');
    btn.id    = SEP.BTN_ID;
    btn.title = '7BTVFZ Emote Picker';
    btn.type  = 'button';
    const img = document.createElement('img');
    img.src   = chrome.runtime.getURL('assets/bttn-ndrnhrdhrdh-e4ndt8789674g.png');
    img.alt   = '7BTVFZ Emote Picker';
    img.width  = 90;
    img.height = 34;
    img.style.cssText = 'display:block;pointer-events:none;';
    btn.appendChild(img);
    btn.addEventListener('click', e => {
      e.stopPropagation();
      chrome.runtime.sendMessage({ type: 'OPEN_POPOUT' });
    });
    const container = document.querySelector(
      '.chat-input__buttons-container, [data-test-selector="chat-input-buttons-container"]'
    );
    if (!container) return;
    container.insertBefore(btn, container.firstChild);
  };

})();
