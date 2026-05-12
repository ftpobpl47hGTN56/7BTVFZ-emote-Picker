// ==UserScript==
// @name         FFZ Modifiers Fix
// @namespace    7btvfz-ffzmod
// @version      1.3
// @description  Fix FFZ modifiers for FFZ+7TV/BTTV emotes in Twitch chat
// @match        https://www.twitch.tv/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const css = `
        /* ── Главный фикс ───────────────────────────────────────────────────
         * FFZ создаёт .modified-emote с правильным style="width:128px; height:64px"
         * но потом его собственный CSS скрывает эти элементы.
         * Форсируем показ.
         * ─────────────────────────────────────────────────────────────────── */
        .ffz--inline.modified-emote {
            display: inline-block !important;
            vertical-align: middle !important;
        }

        .ffz--inline.modified-emote img {
            display: inline-block !important;
            vertical-align: middle !important;
            /* object-fit: fill нужен чтобы картинка заполняла расширенный бокс */
            object-fit: fill !important;
        }

 /* ── 7TV/BTTV эмоут + ffzW ──────────────────────────────────────────
    * sep рендерит .sep-emote-wrap + отдельный .ffz--inline[alt=ffzW].
    * Применяем реальную ширину через JS (см. applyWide ниже).
    * ─────────────────────────────────────────────────────────────────── */
    .sep-mod-ffzW {
        object-fit: fill !important;
        display: inline-block !important;
        vertical-align: middle !important;
        margin-left: -60px !important;
    }

    /* Скрываем ТОЛЬКО отдельно стоящий токен-модификатор (не modified-emote) */
    .ffz--inline:not(.modified-emote)[data-ffz-applied="1"],
    .ffz--inline:not(.modified-emote)[data-ffz-applied="no-target"] {
            display: none !important;
            width: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
    }
    /* Оверлей наследует ширину от wrap-а при ffzW */
    .sep-emote-wrap:has(.sep-mod-ffzW) .sep-emote-overlay {
        width: var(--sep-wide-w, auto) !important;
        object-fit: fill !important;
    }
    `;

    const styleEl = document.createElement('style');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    // ── Модификаторы (для 7TV/BTTV эмоутов) ──────────────────────────────────

    const MODIFIER_NAMES = new Set([
        'ffzW','ffzCursed','ffzY','ffzX','ffzSpin','ffzArrive','ffzLeave',
        'ffzSlide','ffzJam','ffzBounce','ffzRainbow','ffzHyper',
        'w!','s!','c!','h!','v!','l!','r!','p!','R!','z!','Z'
    ]);

    function applyWide(img) {
        img.classList.add('sep-mod-ffzW');

        function trySet(attempt) {
            if (attempt > 30) return;
            const h = img.offsetHeight;
            if (h > 0) {
                const w = (h * 2.2) + 'px';
                img.style.width = w;
                // Передаём ширину оверлеям в том же wrap-е
                const wrap = img.closest('.sep-emote-wrap');
                if (wrap) {
                    wrap.style.setProperty('--sep-wide-w', w);
                    wrap.querySelectorAll('.sep-emote-overlay').forEach(ov => {
                        ov.style.width = w;
                        ov.style.objectFit = 'fill';
                    });
                }
                return;
            }
            requestAnimationFrame(() => trySet(attempt + 1));
        }

        trySet(0);
    }

    const MODIFIERS = {
        'ffzW':     applyWide,
        'w!':       applyWide,

        // ffzCursed / c! — чёрно-белый + искажённый фильтр
        'ffzCursed': (img) => img.classList.add('sep-mod-cursed'),
        'c!':        (img) => img.classList.add('sep-mod-cursed'),

        // Остальные из emote_modifiers.js — подключаем сразу все
        'ffzY':     (img) => img.classList.add('sep-mod-flip-y'),
        'ffzX':     (img) => img.classList.add('sep-mod-flip-x'),
        'ffzSpin':  (img) => img.classList.add('sep-mod-spin'),
        'ffzBounce':(img) => img.classList.add('sep-mod-bounce'),
        'ffzJam':   (img) => img.classList.add('sep-mod-jam'),
        'ffzRainbow':(img) => img.classList.add('sep-mod-rainbow'),
        'ffzHyper': (img) => img.classList.add('sep-mod-hyper'),
        'ffzSlide': (img) => img.classList.add('sep-mod-slide'),
        'ffzArrive':(img) => img.classList.add('sep-mod-arrive'),
        'ffzLeave': (img) => img.classList.add('sep-mod-leave'),
        'h!':       (img) => img.classList.add('sep-mod-flip-x'),
        'v!':       (img) => img.classList.add('sep-mod-flip-y'),
        'l!':       (img) => img.classList.add('sep-mod-tilt-l'),
        'r!':       (img) => img.classList.add('sep-mod-tilt-r'),
        's!':       (img) => img.classList.add('sep-mod-hyper'),
        'p!':       (img) => img.classList.add('sep-mod-party'),
        'R!':       (img) => img.classList.add('sep-mod-rainbow'),
    };

    // ── Обработка 7TV/BTTV + отдельный ffzW токен ────────────────────────────
    // (FFZ эмоуты FFZ сам обрабатывает через .modified-emote — нам не нужно)

    function processMessage(msgEl) {
        // ── Случай 1: обёрнутый в .ffz--inline (стандартный) ─────────────────
        const ffzEls = msgEl.querySelectorAll(
            '.ffz--inline:not(.modified-emote):not([data-ffz-applied])'
        );

        ffzEls.forEach((ffzEl) => {
            const modImg = ffzEl.querySelector('img[alt]');
            if (!modImg) { ffzEl.setAttribute('data-ffz-applied', 'skip'); return; }

            const modName = modImg.getAttribute('alt')?.trim();
            const applyFn = MODIFIERS[modName];
            if (!applyFn) { ffzEl.setAttribute('data-ffz-applied', 'skip'); return; }

            const target = findPrevEmoteWrap(msgEl, ffzEl);
            if (target) {
                const img = target.querySelector('img.sep-emote-base') || target.querySelector('img');
                if (img) { applyFn(img); ffzEl.setAttribute('data-ffz-applied', '1'); }
                else { ffzEl.setAttribute('data-ffz-applied', 'no-target'); }
            } else {
                ffzEl.setAttribute('data-ffz-applied', 'no-target');
            }
        });

        // ── Случай 2: голый img-модификатор без .ffz--inline (reply и др.) ───
        const bareImgs = msgEl.querySelectorAll(
            'img.ffz-emote:not([data-ffz-applied])'
        );

        bareImgs.forEach((modImg) => {
            // Пропускаем если img уже внутри .ffz--inline — там уже обработан выше
            if (modImg.closest('.ffz--inline')) return;

            const modName = modImg.getAttribute('alt')?.trim();
            const applyFn = MODIFIERS[modName];
            if (!applyFn) { modImg.setAttribute('data-ffz-applied', 'skip'); return; }

            const target = findPrevEmoteWrap(msgEl, modImg);
            if (target) {
                const img = target.querySelector('img.sep-emote-base') || target.querySelector('img');
                if (img) {
                    applyFn(img);
                    // Скрываем голый img-модификатор
                    modImg.style.cssText = 'display:none!important;width:0!important;margin:0!important;';
                    modImg.setAttribute('data-ffz-applied', '1');
                } else {
                    modImg.setAttribute('data-ffz-applied', 'no-target');
                }
            } else {
                modImg.setAttribute('data-ffz-applied', 'no-target');
            }
        });
    }

    // ── Вынести общую логику поиска цели в отдельную функцию ─────────────────────
    function findPrevEmoteWrap(msgEl, referenceEl) {
        const wraps = msgEl.querySelectorAll('.sep-emote-wrap');
        let target = null;
        for (const wrap of wraps) {
            const pos = wrap.compareDocumentPosition(referenceEl);
            if (pos & Node.DOCUMENT_POSITION_FOLLOWING) {
                target = wrap;
            } else {
                break;
            }
        }
        return target;
    }

    function processAll() {
        document.querySelectorAll('.chat-line__message .message')
            .forEach(processMessage);
    }

    let debounceTimer = null;
    const observer = new MutationObserver(() => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(processAll, 50);
    });

    function init() {
        const chatArea = document.querySelector(
            '[data-test-selector="chat-scrollable-area__message-container"]'
        );
        if (chatArea) {
            observer.observe(chatArea, { childList: true, subtree: true });
            processAll();
            console.log('[FFZ-Mod-Fix] ✓ v1.3');
        } else {
            setTimeout(init, 1000);
        }
    }

    init();

})();