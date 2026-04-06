// ============ EmotePopup-7BTVFZ.js ============ //
(function () {

    // ─── Утилита: извлекает 7TV emote ID из CDN-ссылки ───────────────────────
    function get7tvId(src) {
        const match = src && src.match(/7tv\.app\/emote\/([^/]+)/);
        return match ? match[1] : null;
    }

    // ─── Определяем платформу по URL или data-provider ───────────────────────
    function detectPlatform(img) {
        const dp = img.getAttribute('data-provider') || '';
        const src = img.src || '';
        if (dp === '7tv'  || src.includes('7tv.app'))         return '7tv';
        if (dp === 'bttv' || src.includes('betterttv.net'))   return 'bttv';
        if (dp === 'ffz'  || src.includes('frankerfacez.com'))return 'ffz';
        if (dp === 'twitch'|| src.includes('jtvnw.net'))      return 'twitch';
        if (dp === 'emoji')                                    return 'emoji';
        if (img.classList.contains('sep-emote-overlay') && src.includes('7tv.app')) return '7tv';
        return 'unknown';
    }

    // ─── Собираем все смайлы из сообщения ────────────────────────────────────
    function getEmotesFromMessage(container) {
        const selector = [
            '.sep-chat-emote',
            '.sep-emote-base',
            '.sep-emote-overlay',
            '.chat-line__message--emote',
            '.ffz-emote',
            '.seventv-emote',
            '.bttv-emote',
            '.twitch-emote',
            '.ffz-emoji',
        ].join(', ');

        const emotes = [];
        const seen   = new Set();

        container.querySelectorAll(selector).forEach(img => {
            const src = img.src || '';
            if (!src || seen.has(src)) return;
            seen.add(src);

            const platform = detectPlatform(img);
            const tvId     = get7tvId(src);
            const isZW     = img.classList.contains('sep-emote-overlay');

            emotes.push({
                src,
                alt:      img.alt   || img.title || img.getAttribute('data-code') || 'Unnamed',
                platform,
                element:  img,
                tvId,
                isZW,
            });
        });

        return emotes;
    }

     // ─── Главная функция — создать попап ───────────────────────────
    function showCustomEmotePopup(emotes, clickX, clickY, callbacks = {}) {
        document.getElementById('sep-emote-popup')?.remove();

        if (!emotes.length) return;

        const popup = document.createElement('div');
        popup.id = 'sep-emote-popup';
        Object.assign(popup.style, {
            position:     'fixed',
            zIndex:       '999999',
            minWidth:     '310px',
            maxWidth:     '340px',
            maxHeight:    '480px',
            overflowY:    'auto',
            background:   'linear-gradient(205deg, #2d5259, #2a1436)',
            border:       '1px solid #12b6a7',
            borderRadius: '10px',
            boxShadow:    'rgba(75,191,191,0.28) 0px 4px 14px 3px',
            color:        '#ebebeb',
            fontFamily:   'inherit',
            fontSize:     '14px',
            padding:      '36px 10px 10px 10px',
            opacity:      '0',
            transform:    'scale(0.92)',
            transition:   'opacity 0.15s ease, transform 0.15s ease',
            userSelect:   'none',
        });

        const header = document.createElement('div');
        Object.assign(header.style, {
            position:    'absolute',
            top:         '0',
            left:        '0',
            right:       '0',
            height:      '34px',
            cursor:      'grab',
            display:     'flex',
            alignItems:  'center',
            padding:     '5px 10px',
            borderBottom:'1px solid rgba(18,182,167,0.2)',
        });

        const title = document.createElement('span');
        title.textContent = '7tv ffz btttv TTv Emotes';
        title.style.cssText = 'font-size:14px;opacity:0.7;flex:1;pointer-events:none;';

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.id = 'close-popemts-4nrd5e';
        Object.assign(closeBtn.style, {
            background:   'none',
            border:       'none',
            color:        '#aaa',
            fontSize:     '17px',
            cursor:       'pointer',
            lineHeight:   '1',
            padding:      '5px 10px',
            marginLeft:   '8px',
            flexShrink:   '0',
        });
        closeBtn.title = 'Close';
        closeBtn.addEventListener('click', () => popup.remove());

        const copyBtn = document.createElement('button');
        copyBtn.title = 'Copy all emote names';
        copyBtn.id = 'copyBtn-txtmt-4nrd5e';
        Object.assign(copyBtn.style, {
            background: 'rgba(85,221,255,0.10)',
            border:     '1px solid rgba(85,221,255,0.22)',
            borderRadius:'4px',
            color:      'rgba(85,221,255,0.85)',
            cursor:     'pointer',
            fontSize:   '14px',
            display:    'flex',
            alignItems: 'center',
            gap:        '4px',
            padding:    '5px 10px',
            flexShrink: '0',
        });
        copyBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13"
                viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg> copy`;

        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            copyEmotesToClipboard(emotes);
            copyBtn.style.color  = 'rgba(85,255,127,0.9)';
            copyBtn.textContent  = '✓ copied';
            setTimeout(() => {
                copyBtn.style.color = 'rgba(85,221,255,0.85)';
                copyBtn.innerHTML   = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13"
                        viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg> copy`;
            }, 1500);
        });

        const pasteBtn = document.createElement('button');
        pasteBtn.title = 'Paste all emote names into chat input';
        pasteBtn.id = 'pasteBtn-popemt-4nrd5e';
        Object.assign(pasteBtn.style, {
            background: 'rgba(85,221,255,0.10)',
            border:     '1px solid rgba(85,221,255,0.22)',
            borderRadius:'4px',
            color:      'rgba(85,255,127,0.75)',
            cursor:     'pointer',
            padding:    '5px 10px',
            fontSize:   '14px',
            display:    'flex',
            alignItems: 'center',
            gap:        '4px',
            flexShrink: '0',
        });
        pasteBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13"
                viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
            </svg> paste`;

        pasteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const text = buildEmoteText(emotes);
            if (text.trim()) pasteTextToInput(text);
        });

        const sendBtn = document.createElement('button');
        sendBtn.id = 'sendemt-in-chat-4nrd5e';
        sendBtn.title = 'Send in chat';
         Object.assign(sendBtn.style, {
            background:   'rgba(0,204,153,0.15)',
            border:       '1px solid rgba(0,204,153,0.35)',
            borderRadius: '4px',
            color:        'rgba(0,255,204,0.85)',
            cursor:       'pointer',
            padding:      '5px 10px',
            fontSize:     '14px',
            display:      'flex',
            alignItems:   'center',
            gap:          '4px',
            flexShrink:   '0',
        });
        sendBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13"
                viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg> send`;

        sendBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const text = buildEmoteText(emotes).trim();
            if (!text) return;
            sendToChat(text);
            sendBtn.style.color = 'rgba(85,255,127,0.9)';
            sendBtn.textContent = '✓ sent';
           /* setTimeout(() => popup.remove(), 400); */
        });

        popup.appendChild(header);
        header.appendChild(title);
        header.appendChild(copyBtn);
        header.appendChild(pasteBtn);
        header.appendChild(sendBtn); 
        header.appendChild(closeBtn);

        const list = document.createElement('div');
        list.style.cssText = 'display:flex;flex-direction:column;gap:2px;';

        emotes.forEach((emote) => {
            const row = document.createElement('div');
            Object.assign(row.style, {
                display:      'flex',
                alignItems:   'center',
                gap:          '8px',
                padding:      '7px 4px',
                borderRadius: '6px',
                borderBottom: '1px solid rgba(115,209,204,0.12)',
            });

            const preview = document.createElement('img');
            preview.src    = emote.src;
            preview.alt    = emote.alt;
            preview.title  = emote.alt;
            Object.assign(preview.style, {
                width:      '32px',
                height:     '32px',
                objectFit:  'contain',
                flexShrink: '0',
                borderRadius:'4px',
            });

            const info = document.createElement('div');
            info.style.cssText = 'flex:1;min-width:0;overflow:hidden;';

            const nameEl = document.createElement('div');
            nameEl.id = 'nameEl-sep-emote-47654jr6ug';
            nameEl.style.cssText = 'font-weight:bold;font-size:14px;overflow:hidden;text-overflow:ellipsis;';
            nameEl.textContent = emote.alt;
            if (emote.isZW) {
                const badge = document.createElement('span');
                badge.textContent = ' ZW';
                badge.style.cssText = 'font-size:10px;opacity:0.55;font-weight:normal;';
                nameEl.appendChild(badge);
            }

            const platEl = document.createElement('div');
            platEl.style.cssText = 'font-size:11px;opacity:0.5;margin-top:1px;';
            platEl.textContent = emote.platform;

            info.appendChild(nameEl);
            info.appendChild(platEl);

            if (emote.tvId) {
                const tvBtn = document.createElement('a');
                tvBtn.id = 'see-emotlink-onsvntvapp-4nrd5e';
                tvBtn.href   = `https://7tv.app/emotes/${emote.tvId}`;
                tvBtn.target = '_blank';
                tvBtn.rel    = 'noopener noreferrer';
                tvBtn.title  = 'View on 7TV';
                Object.assign(tvBtn.style, {
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    background:     'rgba(85,221,255,0.1)',
                    border:         '1px solid rgba(85,221,255,0.25)',
                    borderRadius:   '5px',
                    padding:        '3px 5px',
                    flexShrink:     '0',
                    textDecoration: 'none',
                });
                tvBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"
                         viewBox="0 0 24 24" fill="none" stroke="rgba(85,221,255,0.85)"
                         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>`;

                row.appendChild(preview);
                row.appendChild(info);
                row.appendChild(tvBtn);
             } else {
                row.appendChild(preview);
                row.appendChild(info);
             }

            list.appendChild(row);
        });

        popup.appendChild(list);
        document.body.appendChild(popup);

        positionPopup(popup, clickX, clickY);

        let suppressNextOutside = false;

        makeDraggable(popup, header, () => {
            suppressNextOutside = true;
            setTimeout(() => { suppressNextOutside = false; }, 100);
        });

        // Вызываем второй попап
        if (typeof showEmoteSelectionPopup === 'function') {
            const legacyEmotes = emotes.map(em => ({
                src:      em.src,
                alt:      em.alt,
                platform: em.platform,
                element:  em.element,
                id:       em.tvId || em.src.split('/').slice(-2, -1)[0] || '',
            }));

            showEmoteSelectionPopup(legacyEmotes, () => {});
        }

        requestAnimationFrame(() => {
            popup.style.opacity   = '1';
            popup.style.transform = 'scale(1)';
        });

        const outsideClick = (e) => {
            if (suppressNextOutside) return;
            const linkedPopup = document.getElementById('emote-selection-popup');
            if (!popup.contains(e.target) && (!linkedPopup || !linkedPopup.contains(e.target))) {
              //   popup.remove(); // 
                document.removeEventListener('click', outsideClick, true); //  true); false
            }
        };
        setTimeout(() => {
            document.addEventListener('click', outsideClick, true); //  true); false
        }, 150);
    }

    
    // ─── Позиционирование попапа рядом с кликом ───────────────────────────────
    function positionPopup(popup, clickX, clickY) {
        const W   = window.innerWidth;
        const H   = window.innerHeight;
        const pw  = 340;
        const ph  = 400;

        let left = clickX + 12;
        let top  = clickY - 30;

        if (left + pw > W - 10) left = clickX - pw - 12;
        if (top  + ph > H - 10) top  = H - ph - 10;
        if (top  < 10)          top  = 10;
        if (left < 10)          left = 10;

        popup.style.left = left + 'px';
        popup.style.top  = top  + 'px';
    }

    // ─── Drag-функциональность ────────────────────────────────────────────────
    function makeDraggable(popup, handle, onDragEnd) {
        let startX, startY, startLeft, startTop, dragging = false, didDrag = false;

        handle.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            dragging  = true;
            didDrag   = false;
            startX    = e.clientX;
            startY    = e.clientY;
            startLeft = parseInt(popup.style.left) || 0;
            startTop  = parseInt(popup.style.top)  || 0;
            handle.style.cursor = 'grabbing';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!dragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (Math.abs(dx) > 2 || Math.abs(dy) > 2) didDrag = true;

            popup.style.left = (startLeft + dx) + 'px';
            popup.style.top  = (startTop  + dy) + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (!dragging) return;
            dragging = false;
            handle.style.cursor = 'grab';

            if (didDrag) {
                document.dispatchEvent(new CustomEvent('sep-popup-drag-end'));
                if (typeof onDragEnd === 'function') {
                    onDragEnd();
                }
            }
            didDrag = false;
        });
    }

    // ─── Извлекает имена смайлов из массива emotes ────────────────────────────
    function buildEmoteText(emotes) {
        const names = emotes.map(e => e.alt).filter(Boolean);
        return names.length ? ` ${names.join(' ')} ` : '';
    }

    // ─── Копирует текст смайлов в буфер обмена ───────────────────────────────
    function copyEmotesToClipboard(emotes) {
        const text = buildEmoteText(emotes).trim();
        if (!text) return;
        navigator.clipboard?.writeText(text).catch(() => {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.cssText = 'position:fixed;opacity:0;';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            ta.remove();
        });
    }

    // ─── Вставляет текст в поле ввода чата ───────────────────────────────────
    function pasteTextToInput(text) {
        const editors = document.querySelectorAll('[data-a-target="chat-input"]');
        let inputEditor = null;

        if (editors.length > 1) {
            inputEditor = Array.from(editors).find(el => {
                const s = window.getComputedStyle(el);
                return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0';
            });
        } else if (editors.length === 1) {
            inputEditor = editors[0];
        }

        if (!inputEditor) {
            console.warn('[EmotePopup] Поле ввода чата не найдено');
            return;
        }

        inputEditor.focus();

        try {
            if (inputEditor.tagName.toLowerCase() === 'textarea') {
                const cur   = inputEditor.value || '';
                const start = inputEditor.selectionStart ?? cur.length;
                const end   = inputEditor.selectionEnd   ?? cur.length;
                inputEditor.value = cur.slice(0, start) + text + cur.slice(end);
                const pos = start + text.length;
                inputEditor.setSelectionRange(pos, pos);
                inputEditor.dispatchEvent(new Event('input',  { bubbles: true }));
                inputEditor.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));

            } else if (inputEditor.contentEditable === 'true') {
                if ('InputEvent' in window) {
                    const before = new InputEvent('beforeinput', {
                        bubbles: true, cancelable: true,
                        data: text, inputType: 'insertText'
                    });
                    if (!inputEditor.dispatchEvent(before)) return;

                    const range = document.createRange();
                    const sel   = window.getSelection();
                    range.selectNodeContents(inputEditor);
                    range.collapse(false);
                    sel.removeAllRanges();
                    sel.addRange(range);

                    const node = document.createTextNode(text);
                    range.insertNode(node);
                    range.setStartAfter(node);
                    range.setEndAfter(node);
                    sel.removeAllRanges();
                    sel.addRange(range);

                    inputEditor.dispatchEvent(new InputEvent('input', {
                        bubbles: true, cancelable: true,
                        data: text, inputType: 'insertText'
                    }));
                } else {
                    const sel   = window.getSelection();
                    const range = document.createRange();
                    range.selectNodeContents(inputEditor);
                    range.collapse(false);
                    sel.removeAllRanges();
                    sel.addRange(range);
                    if (!document.execCommand('insertText', false, text)) {
                        inputEditor.innerText += text;
                    }
                    inputEditor.dispatchEvent(new Event('input', { bubbles: true }));
                }
                inputEditor.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
            }
        } catch (err) {
            console.error('[EmotePopup] Ошибка вставки:', err);
        }
    }
 // ─── Отправляет текст в чат ( nter) ─────────────────────────────
    
   
    // ─── Обработчик кликов по смайлам в чате ─────────────────────────────────
    function handleEmoteClick(e) {
        const emoteEl = e.target.closest(
            '.sep-chat-emote, .sep-emote-base, .sep-emote-overlay, ' +
            '.chat-line__message--emote, .ffz-emote, .seventv-emote, ' +
            '.bttv-emote, .twitch-emote, .ffz-emoji'
        );
        if (!emoteEl) return;

        const msgContainer = emoteEl.closest('.chat-line__message');
        if (!msgContainer) return;

        e.stopPropagation();

        const emotes = getEmotesFromMessage(msgContainer);
        if (!emotes.length) return;

        showCustomEmotePopup(emotes, e.clientX, e.clientY, {
            onBlock: (emote) => {
                console.log('[EmotePopup] Block:', emote);
            }
        });
    }

    document.body.addEventListener('click', handleEmoteClick, { capture: true });

    window.CustomEmotePopup = { show: showCustomEmotePopup, getEmotes: getEmotesFromMessage };

    console.log('[CustomEmotePopup] Loaded ✓');
})();