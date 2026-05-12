// ======= send_in-chat_from-sepem-popup-7tvfzpicker.js ======== //

// Определяет функцию sendToChat() для кнопки "send" в sepem-popup-7tvfzpicker
// и следит за появлением попапа через MutationObserver.
// Последнее обновление: март 2026

(function () {
    'use strict';

    const DEBUG = false;
    const log  = (...args) => DEBUG && console.log('[SendFromSepPopup]', ...args);
    const warn = (...args) => console.warn('[SendFromSepPopup]', ...args);

    // ────────────────────────────────────────────────────────────────
    // 1. Найти видимое поле ввода чата
    // ────────────────────────────────────────────────────────────────
    function getChatInput() {
        const editors = document.querySelectorAll('[data-a-target="chat-input"]');
        if (!editors.length) return null;

        if (editors.length === 1) return editors[0];

        // Если несколько — берём видимый
        return Array.from(editors).find(el => {
            const s = window.getComputedStyle(el);
            return s.display !== 'none' &&
                   s.visibility !== 'hidden' &&
                   s.opacity !== '0';
        }) || null;
    }

    // ────────────────────────────────────────────────────────────────
    // 2. Вставить текст в поле ввода
    // ────────────────────────────────────────────────────────────────
    function insertTextIntoInput(input, text) {
        input.focus();

        if (input.tagName.toLowerCase() === 'textarea') {
            const cur   = input.value || '';
            const start = input.selectionStart ?? cur.length;
            const end   = input.selectionEnd   ?? cur.length;
            input.value = cur.slice(0, start) + text + cur.slice(end);
            const pos = start + text.length;
            input.setSelectionRange(pos, pos);
            // НЕ стреляем input/keyup — они лишние

        } else if (input.contentEditable === 'true') {
            // Пишем напрямую в textContent — как в рабочем скрипте
            // БЕЗ каких-либо событий input/keyup/beforeinput
            input.textContent = (input.textContent || '') + text;

            // Курсор в конец
            const sel   = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(input);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }

    // ────────────────────────────────────────────────────────────────
    // 3. Нажать Enter, чтобы отправить сообщение
    // ────────────────────────────────────────────────────────────────
    function pressEnter(input) {
        const enterDown = new KeyboardEvent('keydown', {
            bubbles: true, cancelable: true,
            key: 'Enter', code: 'Enter',
            keyCode: 13, which: 13,
        });
        return input.dispatchEvent(enterDown);
    }

    // ────────────────────────────────────────────────────────────────
    // 4. Главная функция — вставить текст И нажать Enter
    //    Именно её ищет кнопка sendBtn в EmotePopup-7BTVFZ.js
    // ────────────────────────────────────────────────────────────────
    function sendToChat(text) {
        if (!text || !text.trim()) {
            warn('Пустой текст — отправка отменена');
            return false;
        }

        const input = getChatInput();
        if (!input) {
            warn('Поле ввода чата не найдено');
            return false;
        }

        try {
            insertTextIntoInput(input, text);
            const sent = pressEnter(input);

            if (sent) {
                log('Отправлено в чат:', text.trim());
            } else {
                warn('Enter был отменён браузером/страницей');
            }
            return sent;
        } catch (err) {
            warn('Ошибка при отправке:', err);
            return false;
        }
    }

    // Делаем функцию глобальной — её вызывает sendBtn в EmotePopup-7BTVFZ.js
    window.sendToChat = sendToChat;

    // ────────────────────────────────────────────────────────────────
    // 5. Подключение визуальной обратной связи к кнопке send
    //    (кнопка уже создана в EmotePopup, мы только добавляем feedback)
    // ────────────────────────────────────────────────────────────────
    function patchSendButton(popup) {
        const btn = popup.querySelector('#sendemt-in-chat-4nrd5e');
        if (!btn || btn.dataset.patched) return;
        btn.dataset.patched = 'true';

        // Оборачиваем текущий обработчик, чтобы добавить feedback
        btn.addEventListener('click', () => {
            // Небольшая задержка — даём оригинальному обработчику сработать первым
            setTimeout(() => {
                if (btn.textContent.trim() === '✓ sent') return; // уже обработано
                btn.style.color = 'rgba(85,255,127,0.9)';
                btn.textContent = '✓ sent';
              /*  setTimeout(() => popup.remove(), 400); */
            }, 50);
        }, { capture: false });

        log('Кнопка send в sepem-popup-7tvfzpicker подключена');
    }

    // ────────────────────────────────────────────────────────────────
    // 6. MutationObserver — следим за появлением sepem-popup-7tvfzpicker
    // ────────────────────────────────────────────────────────────────
    function watchForPopup() {
        // Проверяем сразу (вдруг попап уже есть)
        const existing = document.getElementById('sepem-popup-7tvfzpicker');
        if (existing) patchSendButton(existing);

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== 1) continue;

                    if (node.id === 'sepem-popup-7tvfzpicker') {
                        patchSendButton(node);
                        continue; // ← не проверяем querySelector если уже нашли
                    }
                    const inner = node.querySelector?.('#sepem-popup-7tvfzpicker');
                    if (inner) patchSendButton(inner);
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree:   true,
        });

        log('MutationObserver запущен — слежу за sepem-popup-7tvfzpicker');
    }

    // ────────────────────────────────────────────────────────────────
    // Запуск
    // ────────────────────────────────────────────────────────────────
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', watchForPopup);
    } else {
        watchForPopup();
    }

    console.log('[SendFromSepPopup] Loaded ✓');
})();