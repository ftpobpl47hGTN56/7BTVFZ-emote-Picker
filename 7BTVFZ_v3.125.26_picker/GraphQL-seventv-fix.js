// ==UserScript==
// @name         7TV – Auto-Reload on Emote Set Change
// @namespace    7tv-fix
// @version      1.0.0
// @description  Автоматически перезагружает страницу после add/remove эмоута, чтобы избежать "conflicting name" ошибки
// @match        https://7tv.app/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

 
    'use strict';

    // ─── Настройки ────────────────────────────────────────────────────────────

    // Задержка перед reload в мс. 
    // 1500 мс достаточно, чтобы 7TV успел показать уведомление об успехе.
    const RELOAD_DELAY_MS = 100;

    // RegExp для GQL-эндпоинта 7TV (работает и для v3, и для возможных будущих версий)
    const GQL_URL_RE = /7tv\.(app|io)\/v\d+\/gql/;

    // Имена GraphQL-операций, которые изменяют эмоут-сет.
    // Если скрипт не срабатывает — открой DevTools → Network → Filter: gql
    // и посмотри поле "operationName" в теле запроса при добавлении эмоута.
    const WATCHED_OPERATIONS = new Set([
        'ChangeEmoteInSet',      // основная мутация add/remove
        'AddEmoteToSet',         // на случай если 7TV переименует
        'RemoveEmoteFromSet',    // —
        'UpdateEmoteInSet',      // —
    ]);

    // ─── Перехват fetch ───────────────────────────────────────────────────────

    const _originalFetch = window.fetch.bind(window);

    window.fetch = async function (...args) {
        // Сначала выполняем оригинальный запрос, чтобы не блокировать UI
        const response = await _originalFetch(...args);

        try {
            // Определяем URL запроса (args[0] может быть строкой или объектом Request)
            const url = args[0] instanceof Request ? args[0].url : String(args[0]);

            // Игнорируем всё, что не является GQL-эндпоинтом 7TV
            if (!GQL_URL_RE.test(url)) return response;

            // Читаем тело запроса — оно должно быть строкой (JSON.stringify)
            const requestBody = args[1]?.body;
            if (typeof requestBody !== 'string') return response;

            // Парсим тело запроса, чтобы получить operationName
            const gqlPayload = JSON.parse(requestBody);
            const operationName = gqlPayload?.operationName ?? '';

            // Проверяем, это одна из интересующих нас мутаций
            if (!WATCHED_OPERATIONS.has(operationName)) return response;

            // Клонируем ответ, чтобы прочитать его не нарушая оригинальный stream,
            // который будет потреблён самим 7TV-приложением
            const clonedResponse = response.clone();
            const responseData = await clonedResponse.json();

            if (responseData.errors) {
                // Мутация вернула ошибку — не перезагружаем,
                // пусть 7TV покажет свой error UI
                console.warn('[7TV-fix] Mutation error, skipping reload:', responseData.errors);
                return response;
            }

            // Мутация прошла успешно — запускаем перезагрузку
            console.log(
                `[7TV-fix] "${operationName}" успешна. ` +
                `Перезагрузка через ${RELOAD_DELAY_MS}мс для синхронизации стора...`
            );

            setTimeout(() => {
                // Используем location.reload() — самый надёжный способ сбросить
                // SvelteKit-стор до актуального серверного состояния
                location.reload();
            }, RELOAD_DELAY_MS);

        } catch (err) {
            // Любые ошибки парсинга молча игнорируем —
            // не хотим ломать нормальную работу сайта
        }

        return response;
    };

    console.log('[7TV-fix] ✅ Emote conflict auto-reload активен');
 