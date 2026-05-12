// ============================================================
// content-chat.js — emoteMap, chat renderer, ZW/FFZ compat
// Part 5/6 of content.js split
// ============================================================

(function () {
  'use strict';
  const SEP = window._SEP;

  // ─── Chat renderer state ──────────────────────────────────────────────────────
  SEP.emoteMap           = new Map();
  SEP.chatObserver       = null;
  SEP.emoteEventObserver = null;
  SEP.RENDERED_ATTR      = 'data-sep-rendered';
  SEP.FFZ_PROCESSED_ATTR = 'data-sep-ffz-done';

  // ─── Build emote map ─────────────────────────────────────────────────────────
  SEP.buildEmoteMap = function buildEmoteMap() {
    console.log('[SEP] 🗺️ Building emoteMap...');
    SEP.emoteMap.clear();
    const order = [
      ['7tv-gl',  '7tv'],
      ['ffz-gl',  'ffz'],
      ['ffz-ch',  'ffz'],
      ['bttv-gl', 'bttv'],
      ['bttv-ch', 'bttv'],
      ['7tv-ch',  '7tv'],
    ];
    order.forEach(([tab, source]) => {
      (SEP.state.emotesByTab[tab] || []).forEach(e => {
        SEP.emoteMap.set(e.name, {
          src: e.src, src2x: e.src4x || e.src2x || e.src,
          zeroWidth: !!e.zeroWidth, source,
        });
      });
    });
    console.log(
      `[SEP] ✓ emoteMap built: ${SEP.emoteMap.size} emotes ` +
      `(ZW: ${[...SEP.emoteMap.values()].filter(e => e.zeroWidth).length})`
    );
    window.__sepAC?.update(() => SEP.emoteMap);
  };

  // ─── Refresh emotes & re-render everything ────────────────────────────────────
  SEP.refreshEmotes = async function refreshEmotes() {
    const channel = SEP.getChannelName();
    if (!channel) return;
    console.log('[SEP] 🔄 Refreshing emotes…');
    try {
      const result = await SEP.fetchAllEmotes(channel);
      SEP.applyFetchResult(result);
      SEP.buildEmoteMap();

      const chatList = document.querySelector(
        '.chat-list--default, .chat-list, [data-test-selector="chat-scrollable-area__message-container"]'
      );
      if (!chatList) { console.warn('[SEP] chatList not found'); return; }

      // Сбрасываем RENDERED_ATTR на span'ах и восстанавливаем оригинальный текст
      chatList.querySelectorAll(`[${SEP.RENDERED_ATTR}]`).forEach(span => {
        span.removeAttribute(SEP.RENDERED_ATTR);
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

      // Сбрасываем FFZ_PROCESSED_ATTR на message-контейнерах
      chatList.querySelectorAll(`[${SEP.FFZ_PROCESSED_ATTR}]`).forEach(el => {
        el.removeAttribute(SEP.FFZ_PROCESSED_ATTR);
      });

      // Перерендериваем все видимые строки чата
      [...chatList.querySelectorAll('.chat-line__message')].forEach(SEP.renderChatLine);

      console.log('[SEP] ✅ Refresh complete');
    } catch (e) {
      console.error('[SEP] ❌ Refresh failed', e);
    }
  };

  // ─── Emote event monitor ─────────────────────────────────────────────────────
  SEP.startEmoteEventMonitor = function startEmoteEventMonitor() {
    if (SEP.emoteEventObserver) SEP.emoteEventObserver.disconnect();
    const chatList = document.querySelector(
      '.chat-list--default, .chat-list, [data-test-selector="chat-scrollable-area__message-container"]'
    );
    if (!chatList) { setTimeout(SEP.startEmoteEventMonitor, 1000); return; }

    let refreshDebounce = null;

    SEP.emoteEventObserver = new MutationObserver(mutations => {
      let needsRefresh = false;
      mutations.forEach(({ addedNodes }) => {
        addedNodes.forEach(node => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;

          const isSepEvent =
            node.classList?.contains('sep-7btvfz-emote-event-line') ||
            node.hasAttribute?.('data-sep-7btvfz-emote-event-type') ||
            node.querySelector?.('[data-sep-7btvfz-emote-event-type]');

          const isFfz =
            node.classList?.contains('ffz-notice-line') &&
            node.classList?.contains('user-notice-line');

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
        refreshDebounce = setTimeout(SEP.refreshEmotes, 400);
      }
    });

    SEP.emoteEventObserver.observe(chatList, { childList: true, subtree: true });
    console.log('[SEP] 👁️ Emote event monitor started');
  };

  // ─── makeEmoteImg ─────────────────────────────────────────────────────────────
  SEP.makeEmoteImg = function makeEmoteImg(name, e) {
    const img = document.createElement('img');
    img.src   = e.src;
    if (e.src2x) img.srcset = `${e.src} 1x, ${e.src2x} 1x`;
    img.alt       = name;
    img.title     = name;
    img.className = 'sep-chat-emote';
    img.onerror   = function () { this.replaceWith(document.createTextNode(name)); };
    return img;
  };

  // ─── renderChatLine ───────────────────────────────────────────────────────────
  SEP.renderChatLine = function renderChatLine(line) {
    const fragments = line.querySelectorAll(
      '.text-fragment[data-a-target="chat-message-text"]:not([data-sep-rendered])'
    );

    fragments.forEach(fragment => {
      // Ищем ближайший предыдущий Twitch-эмоут
      let twitchEmoteDiv = null;
      let prevElement    = fragment.previousElementSibling;

      while (prevElement) {
        if (prevElement.classList.contains('ffz--inline')) {
          const twitchImg = prevElement.querySelector('img.twitch-emote');
          if (twitchImg) { twitchEmoteDiv = prevElement; break; }
        }
        if (prevElement.querySelector?.('img.twitch-emote')) {
          twitchEmoteDiv = prevElement;
          break;
        }
        prevElement = prevElement.previousElementSibling;
      }

      const twitchImgClone = twitchEmoteDiv
        ? twitchEmoteDiv.querySelector('img.twitch-emote').cloneNode(true)
        : null;

      SEP.renderTextFragment(fragment, twitchImgClone, twitchEmoteDiv);
    });
  };

  // ─── findLastSepWrapBefore ────────────────────────────────────────────────────
  SEP.findLastSepWrapBefore = function findLastSepWrapBefore(fragment) {
    let el = fragment.previousElementSibling;
    while (el) {
      if (el.classList.contains('sep-emote-wrap')) return el;
      if (el.classList.contains('text-fragment') || el.classList.contains('ffz--inline')) {
        const wraps = el.querySelectorAll('.sep-emote-wrap');
        if (wraps.length) return wraps[wraps.length - 1];
      }
      el = el.previousElementSibling;
    }
    return null;
  };

  // ─── applyEmoteAspectRatio ────────────────────────────────────────────────────
  SEP.applyEmoteAspectRatio = function applyEmoteAspectRatio(wrap) {
    if (!wrap || wrap.hasAttribute('data-sep-aspect-checked')) return;

    const baseImg = wrap.querySelector('.sep-emote-base');
    if (!baseImg) return;

    const overlays = Array.from(wrap.querySelectorAll('.sep-emote-overlay'));

 // content-chat.js, функция applyEmoteAspectRatio
//   centerOverlays  :

const centerOverlays = () => {
  const baseNaturalW = baseImg.naturalWidth  || baseImg.width  || 128;
  const baseNaturalH = baseImg.naturalHeight || baseImg.height || 64;

  // CSS max-height для чат-эмоутов = 28px
  const DISPLAY_H    = 64;
  const baseDisplayW = Math.round(DISPLAY_H * (baseNaturalW / baseNaturalH));

  // Находим максимальную ширину среди всех оверлеев при display-масштабе
  let maxDisplayW = baseDisplayW;
  overlays.forEach(ovImg => {
    const ovNW = ovImg.naturalWidth  || ovImg.width  || 128;
    const ovNH = ovImg.naturalHeight || ovImg.height || 64;
    maxDisplayW = Math.max(maxDisplayW, Math.round(DISPLAY_H * (ovNW / ovNH)));
  });

  // Враппер = ровно столько сколько нужно для самого широкого элемента
  wrap.style.width  = maxDisplayW + 'px';
  wrap.style.height = DISPLAY_H   + 'px';

  // Оверлеи центрируются через CSS (left:50% translate(-50%,-50%)) — offset не нужен
  overlays.forEach(ovImg => {
    ovImg.style.setProperty('--sep-overlay-offset-x', '0px', 'important');
    ovImg.style.setProperty('--sep-overlay-offset-y', '0px', 'important');
    wrap.setAttribute('data-base-width',  maxDisplayW);
    wrap.setAttribute('data-base-height', DISPLAY_H);
  });
};

    if (baseImg.complete && baseImg.naturalWidth > 0) {
      centerOverlays();
    } else {
      baseImg.addEventListener('load', centerOverlays, { once: true });
    }

    overlays.forEach(ov => {
      if (ov.complete && ov.naturalWidth > 0) centerOverlays();
      else ov.addEventListener('load', centerOverlays, { once: true });
    });

    wrap.setAttribute('data-sep-aspect-checked', '1');
  };

  // ─── processFFZCompatibility ──────────────────────────────────────────────────
  SEP.processFFZCompatibility = function processFFZCompatibility(messageElement) {
    if (!messageElement) return;
    let children = Array.from(messageElement.children);

    for (let i = 0; i < children.length; i++) {
      const current = children[i];
      if (!current.classList.contains('ffz--inline')) continue;

      const ffzImg = current.querySelector('img.ffz-emote');
      if (!ffzImg) continue;

      let nextWrap         = null;
      let nextTextFragment = null;
      const nextChild      = children[i + 1];

      if (nextChild?.classList.contains('text-fragment')) {
        nextTextFragment = nextChild;
        nextWrap         = nextChild.querySelector('.sep-emote-wrap');
      } else if (nextChild?.classList.contains('sep-emote-wrap')) {
        nextWrap = nextChild;
      }

      if (!nextWrap) continue;

      // Оборачиваем FFZ в sep-emote-wrap (если ещё нет)
      let wrap = current.closest('.sep-emote-wrap');
      if (!wrap) {
        wrap = document.createElement('span');
        wrap.className = 'sep-emote-wrap';
        current.parentNode.insertBefore(wrap, current);
        wrap.appendChild(current);
      }

      ffzImg.classList.add('sep-emote-base');

      // Переносим только ZW-изображения как оверлеи
      const sevenTvImages = Array.from(nextWrap.querySelectorAll('img'));
      const zwImages      = sevenTvImages.filter(img => SEP.emoteMap.get(img.alt)?.zeroWidth);

      if (!zwImages.length) continue;

      zwImages.forEach(img => {
        img.classList.remove('sep-emote-base', 'sep-chat-emote');
        img.classList.add('sep-emote-overlay', 'chat-image');
        wrap.appendChild(img);
      });

      // Удаляем контейнер только если все img были ZW
      if (zwImages.length === sevenTvImages.length) {
        if (nextTextFragment) nextTextFragment.remove();
        else nextWrap.remove();
      }

      SEP.applyEmoteAspectRatio(wrap);
      children = Array.from(messageElement.children);
      i++; // пропускаем уже обработанный элемент
    }
  };

  // ─── renderTextFragment ───────────────────────────────────────────────────────
  SEP.renderTextFragment = function renderTextFragment(span, twitchImgClone = null, twitchEmoteDiv = null) {
    if (span.hasAttribute(SEP.RENDERED_ATTR)) return;

    const text  = span.textContent;
    const parts = text.split(/(\s+)/);

    let hasEmoteOrMod = false;
    for (const p of parts) {
      if (SEP.emoteMap.has(p) || window.EmoteModifiers?.isModifier(p)) {
        hasEmoteOrMod = true;
        break;
      }
    }

    if (!hasEmoteOrMod && !twitchImgClone) return;

    span.setAttribute(SEP.RENDERED_ATTR, '4');
    if (window.EmoteModifiers) window.EmoteModifiers.injectStyles();

    const nodes = [];

    // ── ПЕРВЫЙ ПРОХОД: разбираем текст ───────────────────────────────────────
    for (const part of parts) {
      if (part.trim() === '') {
        nodes.push({ type: 'text', value: part });
        continue;
      }

      const e      = SEP.emoteMap.get(part);
      const isMod  = window.EmoteModifiers?.isModifier(part);

      if (!e && !isMod) {
        nodes.push({ type: 'text', value: part });
        continue;
      }

      if (isMod) {
        // Z-логика: присоединяет ZW только к предыдущему эмоуту
        if (part === 'z!' || part === 'Z') {
          let currentEmoteIdx = -1;
          let targetEmoteIdx  = -1;
          for (let i = nodes.length - 1; i >= 0; i--) {
            if (nodes[i].type === 'emote' || nodes[i].type === 'zw-temp') {
              if (currentEmoteIdx === -1) currentEmoteIdx = i;
              else { targetEmoteIdx = i; break; }
            }
          }
          if (currentEmoteIdx !== -1 && targetEmoteIdx !== -1) {
            const cur    = nodes[currentEmoteIdx];
            const target = nodes[targetEmoteIdx];
            if (cur.type === 'zw-temp') {
              target.overlays.push({ name: cur.name, emote: cur.emote, modClasses: cur.modClasses, isZW: true });
            } else if (cur.type === 'emote') {
              target.overlays.push({ name: cur.name, emote: cur.emote, modClasses: cur.modClasses, isZW: false });
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

      // 7TV-эмоут
      if (e.zeroWidth) {
        nodes.push({ type: 'zw-temp', name: part, emote: e, modClasses: [] });
      } else {
        nodes.push({ type: 'emote', name: part, emote: e, overlays: [], modClasses: [] });
      }
    }

    // ── ВТОРОЙ ПРОХОД: ZW-логика (только для 7TV) ────────────────────────────
    const finalNodes = [];
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.type === 'zw-temp') {
        let found = false;
        for (let j = finalNodes.length - 1; j >= 0; j--) {
          if (finalNodes[j].type === 'text' && finalNodes[j].value.trim() !== '') break; // СТОП на не-пробельном тексте
          if (finalNodes[j].type === 'emote') {
            finalNodes[j].overlays.push({
              name: node.name, emote: node.emote,
              modClasses: node.modClasses, isZW: true,
            });
            found = true;
            break;
          }
        }
        if (!found) {
          finalNodes.push({
            type: 'emote', name: node.name, emote: node.emote,
            overlays: [], modClasses: node.modClasses, isZW: true,
          });
        }
      } else {
        finalNodes.push(node);
      }
    }

    // ── ТРЕТИЙ ПРОХОД: рендеринг ─────────────────────────────────────────────
    const frag = document.createDocumentFragment();
    let lastNonZWWrap = SEP.findLastSepWrapBefore(span);

    // Twitch-wrap создаём первым — ZW будут цепляться к нему
    if (twitchImgClone) {
      const twitchWrap = document.createElement('span');
      twitchWrap.className = 'sep-emote-wrap';
      const twitchImg = twitchImgClone.cloneNode(true);
      twitchImg.className =
        'twitch-emote sep-emote-base chat-image chat-line__message--emote ffz--pointer-events ffz-tooltip';
      twitchWrap.appendChild(twitchImg);
      frag.appendChild(twitchWrap);
      if (twitchEmoteDiv) twitchEmoteDiv.remove();
      lastNonZWWrap = twitchWrap;
    }

    for (const node of finalNodes) {
      if (node.type === 'text') {
        // Пробел между Twitch и ZW НЕ должен разрывать связь
        if (node.value.trim() !== '') lastNonZWWrap = null;
        frag.appendChild(document.createTextNode(node.value));
        continue;
      }

      // ZW-эмот без базы — цепляем к предыдущему wrap-у (в т.ч. Twitch)
      if (node.isZW && lastNonZWWrap) {
        const ovImg = SEP.makeEmoteImg(node.name, node.emote);
        ovImg.className = 'sep-emote-overlay chat-image';
        if (node.modClasses?.length) node.modClasses.forEach(cls => ovImg.classList.add(cls));
        lastNonZWWrap.appendChild(ovImg);
        SEP.applyEmoteAspectRatio(lastNonZWWrap);
        continue;
      }

      // Обычный 7TV-эмот — создаём новый wrap
      const wrap    = document.createElement('span');
      wrap.className = 'sep-emote-wrap';

      const baseImg = SEP.makeEmoteImg(node.name, node.emote);
      baseImg.classList.add('sep-emote-base');
      if (node.modClasses?.length) node.modClasses.forEach(cls => baseImg.classList.add(cls));
      wrap.appendChild(baseImg);

      node.overlays?.forEach(ov => {
        const ovImg = SEP.makeEmoteImg(ov.name, ov.emote);
        ovImg.className = 'sep-emote-overlay chat-image';
        if (ov.modClasses?.length) ov.modClasses.forEach(cls => ovImg.classList.add(cls));
        wrap.appendChild(ovImg);
      });

      SEP.applyEmoteAspectRatio(wrap);
      frag.appendChild(wrap);
      lastNonZWWrap = wrap; // обычный эмот становится якорем для следующих ZW
    }

    span.textContent = '';
    span.appendChild(frag);

    // Запускаем совместимость с FFZ (если нужно)
    const messageContainer =
      span.closest('.message') || span.closest('.chat-line__message-container');
    if (messageContainer) {
      SEP.waitForFFZThenProcess(messageContainer);
    }
  };

  // ─── waitForFFZThenProcess ────────────────────────────────────────────────────
  SEP.waitForFFZThenProcess = function waitForFFZThenProcess(messageContainer) {
    if (messageContainer.hasAttribute(SEP.FFZ_PROCESSED_ATTR)) return;

    // FFZ уже вставил ffz--inline? → сразу обрабатываем
    if (messageContainer.querySelector('.ffz--inline img.ffz-emote')) {
      messageContainer.setAttribute(SEP.FFZ_PROCESSED_ATTR, '1');
      SEP.processFFZCompatibility(messageContainer);
      return;
    }

    // FFZ ещё не отработал → наблюдаем за контейнером
    let settled      = false;
    let fallbackTimer = null;

    const obs = new MutationObserver(() => {
      if (settled) return;
      const hasFFZNow = messageContainer.querySelector('.ffz--inline img.ffz-emote');
      if (!hasFFZNow) return;

      // Даём FFZ закончить текущую пачку мутаций (один rAF достаточно)
      settled = true;
      obs.disconnect();
      clearTimeout(fallbackTimer);
      requestAnimationFrame(() => {
        messageContainer.setAttribute(SEP.FFZ_PROCESSED_ATTR, '1');
        SEP.processFFZCompatibility(messageContainer);
      });
    });

    obs.observe(messageContainer, { childList: true, subtree: true });

    // Страховочный таймер: FFZ может вообще не прийти (нет FFZ-эмотов)
    fallbackTimer = setTimeout(() => {
      if (settled) return;
      settled = true;
      obs.disconnect();
      messageContainer.setAttribute(SEP.FFZ_PROCESSED_ATTR, '1');
      SEP.processFFZCompatibility(messageContainer);
    }, 500);
  };

  // ─── startChatRenderer ────────────────────────────────────────────────────────
  SEP.startChatRenderer = function startChatRenderer() {
    if (SEP.chatObserver) SEP.chatObserver.disconnect();
    const chatList = document.querySelector(
      '.chat-list--default, .chat-list, [data-test-selector="chat-scrollable-area__message-container"]'
    );
    if (!chatList) { setTimeout(SEP.startChatRenderer, 1500); return; }

    chatList.querySelectorAll('.chat-line__message').forEach(SEP.renderChatLine);

    SEP.chatObserver = new MutationObserver(mutations => {
      mutations.forEach(({ addedNodes }) => {
        addedNodes.forEach(node => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          if (node.classList?.contains('chat-line__message')) {
            SEP.renderChatLine(node);
            return;
          }
          node.querySelectorAll?.('.chat-line__message').forEach(SEP.renderChatLine);
        });
      });
    });

    SEP.chatObserver.observe(chatList, { childList: true, subtree: true });
    console.log('[SEP] Chat renderer started');
  };

})();
