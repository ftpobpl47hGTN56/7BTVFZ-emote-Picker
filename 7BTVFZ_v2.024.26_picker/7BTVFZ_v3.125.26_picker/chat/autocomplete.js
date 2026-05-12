// ============================================================
//  7BTVFZ Emote Autocomplete — autocomplete.js  (Tray Injection v4)
//  Никогда не удаляет React-узлы — только скрывает и добавляет рядом.
// ============================================================
(function () {
  'use strict';

  const MAX_ITEMS      = 30;
  const MIN_QUERY      = 1;
  const DEBOUNCE_MS    = 80;
  const INJECTED_ATTR  = 'data-sep-injected';
  const HIDDEN_ATTR    = 'data-sep-hidden';
  const CONTAINER_ID   = 'sep-ac-results';

  const CLS_BASE   = 'ScInteractableBase-sc-ofisyf-0 ScInteractableDefault-sc-ofisyf-1 gFJWcf tw-interactable';
  const CLS_ACTIVE = 'fWmmDT';
  const CLS_NORMAL = 'gHDhCk';

  let getEmotesFn       = null;
  let currentInput      = null;
  let debounceTimer     = null;
  let trayObserver      = null;
  let inputObserver     = null;
  let selectedIdx       = 0;
  let lastInjectedQuery = null;
  let isInjecting       = false;

  const INPUT_SEL      = '[data-a-target="chat-input"], textarea[data-test-selector="chat-input"]';
  const TRAY_LIST_SEL  = '[class*="autocomplete-match-list"]';
  const TRAY_INNER_SEL = `${TRAY_LIST_SEL} .scrollable-area > .Layout-sc-1xcs6mc-0`;

  // ─── Query extraction ────────────────────────────────────────────────────────
  function getColonWord(input) {
    const val = input.isContentEditable ? input.textContent : input.value;
    const pos = input.isContentEditable
      ? (window.getSelection()?.getRangeAt(0)?.startOffset ?? val.length)
      : (input.selectionStart ?? val.length);
    let start = pos;
    while (start > 0 && !/[\s\n]/.test(val[start - 1])) start--;
    const word = val.slice(start, pos);
    if (!word.startsWith(':') || word.length < MIN_QUERY + 1) return null;
    return { word, start, end: pos, query: word.slice(1) };
  }

  // ─── Emote search ────────────────────────────────────────────────────────────
  function searchEmotes(query) {
    if (!getEmotesFn) return [];
    const map = getEmotesFn();
    if (!map?.size) return [];
    const q = query.toLowerCase();
    const prefix = [], middle = [];
    for (const [name, e] of map) {
      const l = name.toLowerCase();
      if (l === q)               prefix.unshift({ name, ...e });
      else if (l.startsWith(q)) prefix.push({ name, ...e });
      else if (l.includes(q))   middle.push({ name, ...e });
    }
    return [...prefix, ...middle].slice(0, MAX_ITEMS);
  }

  // ─── Source badge ────────────────────────────────────────────────────────────
  function sourceLabel(e) {
    if (e.source) return e.source.toUpperCase();
    const u = e.src || '';
    if (u.includes('7tv.app'))   return '7TV';
    if (u.includes('betterttv')) return 'BTTV';
    if (u.includes('frankerfacez') || u.includes('cdn.ffz')) return 'FFZ';
    return '';
  }

  // ─── Tray DOM helpers ────────────────────────────────────────────────────────
  // Скрыть нативный контент Твича — НЕ УДАЛЯТЬ, только display:none
  function hideTwitchContent(inner) {
    [...inner.children].forEach(child => {
      if (child.id === CONTAINER_ID) return; // наш — не трогаем
      child.setAttribute(HIDDEN_ATTR, child.style.display || '');
      child.style.display = 'none';
    });
  }

  // Восстановить нативный контент
  function showTwitchContent(inner) {
    [...inner.children].forEach(child => {
      if (!child.hasAttribute(HIDDEN_ATTR)) return;
      child.style.display = child.getAttribute(HIDDEN_ATTR) || '';
      child.removeAttribute(HIDDEN_ATTR);
    });
  }

  // Удалить только наш контейнер и восстановить Твич
  function cleanupTray() {
    const container = document.getElementById(CONTAINER_ID);
    if (container) {
      const inner = container.parentElement;
      container.remove(); // только наш узел — безопасно
      if (inner) showTwitchContent(inner);
    }
    lastInjectedQuery = null;
  }

  // ─── Navigation ──────────────────────────────────────────────────────────────
  function getOurButtons() {
    const c = document.getElementById(CONTAINER_ID);
    if (!c) return [];
    return [...c.querySelectorAll(`button[${INJECTED_ATTR}]`)];
  }

  function isOurTrayActive() {
    return !!document.getElementById(CONTAINER_ID);
  }

  function updateSelection(buttons, idx) {
    buttons.forEach((btn, i) => {
      btn.classList.toggle(CLS_ACTIVE, i === idx);
      btn.classList.toggle(CLS_NORMAL, i !== idx);
    });
    selectedIdx = idx;
    buttons[idx]?.scrollIntoView({ block: 'nearest' });
  }

  // ─── Insert emote ────────────────────────────────────────────────────────────
  function insertEmote(name) {
    const input = currentInput;
    if (!input) return;

    if (input.isContentEditable) {
      const sel = window.getSelection();
      if (!sel?.rangeCount) return;
      const range = sel.getRangeAt(0);
      const node  = range.startContainer;
      if (node.nodeType !== Node.TEXT_NODE) return;
      const pos = range.startOffset;
      let start = pos;
      while (start > 0 && !/[\s\n]/.test(node.textContent[start - 1])) start--;
      range.setStart(node, start);
      range.deleteContents();
      const t = document.createTextNode(name + ' ');
      range.insertNode(t);
      range.setStartAfter(t);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    } else {
      const val  = input.value;
      const pos  = input.selectionStart ?? val.length;
      let start  = pos;
      while (start > 0 && !/[\s\n]/.test(val[start - 1])) start--;
      const insert = name + ' ';
      const setter = Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype, 'value'
      )?.set;
      const next = val.slice(0, start) + insert + val.slice(pos);
      if (setter) setter.call(input, next);
      else input.value = next;
      input.selectionStart = input.selectionEnd = start + insert.length;
      input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: insert }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Сначала чистим трей, потом фокус — порядок важен
    cleanupTray();
    input.focus();
  }

  // ─── Window keydown guard ────────────────────────────────────────────────────
  window.addEventListener('keydown', e => {
    if (!isOurTrayActive()) return;
    const buttons = getOurButtons();
    if (!buttons.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.stopImmediatePropagation(); e.preventDefault();
        updateSelection(buttons, (selectedIdx + 1) % buttons.length);
        break;
      case 'ArrowUp':
        e.stopImmediatePropagation(); e.preventDefault();
        updateSelection(buttons, (selectedIdx - 1 + buttons.length) % buttons.length);
        break;
      case 'Tab':
        if (e.shiftKey) return;
        /* fall-through */
      case 'Enter':
        e.stopImmediatePropagation(); e.preventDefault();
        { const btn = buttons[selectedIdx];
          if (btn) insertEmote(btn.getAttribute('data-sep-name')); }
        break;
      case 'Escape':
        cleanupTray();
        break;
    }
  }, { capture: true });

  // ─── Build button ────────────────────────────────────────────────────────────
  function buildButton(emote, idx) {
    const btn = document.createElement('button');
    btn.className = `${CLS_BASE} ${idx === 0 ? CLS_ACTIVE : CLS_NORMAL}`;
    btn.setAttribute('data-a-target',    emote.name);
    btn.setAttribute(INJECTED_ATTR,      '1');
    btn.setAttribute('data-sep-name',    emote.name);
    btn.setAttribute('data-click-index', String(idx));
    btn.type = 'button';

    const srcset = emote.src2x ? `${emote.src} 1x, ${emote.src2x} 2x` : emote.src;
    const label  = sourceLabel(emote);
    const badge  = label
      ? `<span style="font-size:9px;font-weight:700;padding:1px 4px;border-radius:3px;
             background:rgba(255,255,255,.08);color:#adadb8;margin-left:4px;
             text-transform:uppercase;flex-shrink:0;">${label}</span>`
      : '';
    const zw = emote.zeroWidth
      ? `<span style="font-size:9px;padding:1px 4px;border-radius:3px;
             background:rgba(255,255,255,.06);color:#adadb8;margin-left:2px;
             flex-shrink:0;">ZW</span>`
      : '';

    btn.innerHTML = `
      <div class="Layout-sc-1xcs6mc-0 jvESPo">
        <div class="tw-relative tw-flex-shrink-0 tw-pd-05" title="${emote.name}">
          <img class="emote-autocomplete-provider__image"
               src="${emote.src}" srcset="${srcset}"
               alt="${emote.name}" loading="lazy"
               style="width:28px;height:28px;object-fit:contain;">
        </div>
        <div class="tw-ellipsis" style="display:flex;align-items:center;">
          ${emote.name}${badge}${zw}
        </div>
      </div>`;

    btn.addEventListener('mousedown', e => e.preventDefault());
    btn.addEventListener('click', () => insertEmote(emote.name));
    return btn;
  }

  // ─── Inject into tray ────────────────────────────────────────────────────────
  function injectIntoTray(query) {
    if (isInjecting) return;
    if (lastInjectedQuery === query) return;

    const results = searchEmotes(query);
    if (!results.length) {
      // Нет результатов — убираем наш контейнер если был, показываем Твич "No matches"
      cleanupTray();
      return;
    }

    const inner = document.querySelector(TRAY_INNER_SEL);
    if (!inner) return;

    isInjecting = true;
    if (trayObserver) trayObserver.disconnect();

    lastInjectedQuery = query;
    selectedIdx = 0;

    // Убираем старый контейнер если есть
    document.getElementById(CONTAINER_ID)?.remove();

    // Скрываем нативный контент Твича (не удаляем!)
    hideTwitchContent(inner);

    // Создаём наш контейнер и добавляем в конец
    const container = document.createElement('div');
    container.id = CONTAINER_ID;

    results.forEach((emote, i) => {
      const wrap = document.createElement('div');
      wrap.className = 'Layout-sc-1xcs6mc-0';
      wrap.appendChild(buildButton(emote, i));
      container.appendChild(wrap);
    });

    inner.appendChild(container); // appendChild — не трогает существующие узлы

    setTimeout(() => {
      isInjecting = false;
      startTrayObserver();
    }, 150);
  }

  // ─── Input handler ────────────────────────────────────────────────────────────
  function onInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (!currentInput) return;
      const info = getColonWord(currentInput);
      if (!info) {
        cleanupTray();
        return;
      }
      if (info.query !== lastInjectedQuery) lastInjectedQuery = null;
      setTimeout(() => injectIntoTray(info.query), 60);
    }, DEBOUNCE_MS);
  }

  function attachInput(input) {
    if (currentInput === input) return;
    currentInput?.removeEventListener('input', onInput);
    currentInput = input;
    input.addEventListener('input', onInput);
  }

  function tryAttach() {
    const input = document.querySelector(INPUT_SEL);
    if (input) attachInput(input);
  }

  // ─── Tray observer ────────────────────────────────────────────────────────────
  function startTrayObserver() {
    if (trayObserver) trayObserver.disconnect();
    const tray = document.querySelector(TRAY_LIST_SEL);
    if (!tray) { setTimeout(startTrayObserver, 800); return; }

    trayObserver = new MutationObserver(() => {
      if (isInjecting) return;
      if (!currentInput) return;
      const info = getColonWord(currentInput);
      if (!info) { cleanupTray(); return; }

      // Наш контейнер на месте — ничего не делаем
      if (document.getElementById(CONTAINER_ID)) return;

      if (info.query !== lastInjectedQuery) lastInjectedQuery = null;
      const inner = document.querySelector(TRAY_INNER_SEL);
      if (!inner) return;
      const hasNoMatch = inner.textContent?.includes('No matches');
      const hasItems   = inner.querySelector('button');
      if (hasNoMatch || !hasItems) injectIntoTray(info.query);
    });

    trayObserver.observe(tray, { childList: true, subtree: true });
  }

  // ─── SPA observer ────────────────────────────────────────────────────────────
  function startInputObserver() {
    if (inputObserver) inputObserver.disconnect();
    inputObserver = new MutationObserver(() => {
      if (!currentInput || !document.body.contains(currentInput)) {
        cleanupTray();
        tryAttach();
        startTrayObserver();
      }
    });
    inputObserver.observe(document.body, { childList: true, subtree: true });
  }

  // ─── Public API ───────────────────────────────────────────────────────────────
  window.__sepAC = {
    init(fn) {
      if (typeof fn !== 'function') return;
      getEmotesFn = fn;
      tryAttach();
      startInputObserver();
      startTrayObserver();
      console.log('[SEP-AC] ✅ ready (v4 — safe tray injection)');
    },
    update(fn) {
      if (typeof fn === 'function') getEmotesFn = fn;
    },
  };

})();