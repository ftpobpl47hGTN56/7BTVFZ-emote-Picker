
/**
 * ============================================================
 *  EMOTE TOOLTIP — IIFE
 *  Показывает тултип при наведении на эмоут в чате Twitch.
 *  Отображает: картинку, название, платформу и автора эмоута.
 *
 *  Поддерживаемые платформы:
 *    • 7TV    — cdn.7tv.app          → API: 7tv.io/v3/emotes/{id}
 *    • BetterTTV — cdn.betterttv.net  → API: api.betterttv.net/3/emotes/{id}
 *    • FFZ   — cdn.frankerfacez.com  → API: api.frankerfacez.com/v1/emote/{id}
 *    • Twitch — static-cdn.jtvnw.net → (нет публичного API без токена)
 * ============================================================
 */
(function () {
  'use strict';

  // ─── Конфигурация ────────────────────────────────────────────
  const CFG = {
    // CSS-классы, которые могут быть у эмоут-изображений
    emoteSelectors: [
      'img.sep-chat-emote',
      'img.chat-image',
      'img[data-a-target="emote-name"]',
      'img.ffz-emoji',
      'img.bttv-emote',
    ].join(', '),

    showDelay: 120,   // мс — задержка перед показом (предотвращает мигание)
    hideDelay: 150,   // мс — задержка перед скрытием
    tooltipId: '__emote_tooltip_iife__',
  };

  // ─── Цвета платформ ──────────────────────────────────────────
  const PLATFORM_COLORS = {
    '7TV':       '#00b3ff',
    'BetterTTV': '#ff4545',
    'FFZ':       '#ff9900',
    'Twitch':    '#9147ff',
    'Unknown':   '#888888',
  };

  // ─── Кэш: ключ → { name, platform, author, previewSrc } ────
  const cache = new Map();

  // ─── Вспомогательные утилиты ─────────────────────────────────

  /**
   * Определяет платформу по URL изображения.
   * @param {string} src
   * @returns {'7TV'|'BetterTTV'|'FFZ'|'Twitch'|'Unknown'}
   */
  function detectPlatform(src) {
    if (src.includes('cdn.7tv.app'))              return '7TV';
    if (src.includes('cdn.betterttv.net'))        return 'BetterTTV';
    if (src.includes('cdn.frankerfacez.com'))     return 'FFZ';
    if (src.includes('static-cdn.jtvnw.net'))     return 'Twitch';
    return 'Unknown';
  }

  /**
   * Извлекает ID эмоута из URL.
   * @param {string} src
   * @param {string} platform
   * @returns {string|null}
   */
  function extractId(src, platform) {
    try {
      const url = new URL(src);
      const parts = url.pathname.split('/').filter(Boolean);
      if (platform === '7TV') {
        // /emote/<ID>/2x.webp
        const idx = parts.indexOf('emote');
        return idx !== -1 ? parts[idx + 1] : null;
      }
      if (platform === 'BetterTTV') {
        // /emote/<ID>/2x
        const idx = parts.indexOf('emote');
        return idx !== -1 ? parts[idx + 1] : null;
      }
      if (platform === 'FFZ') {
        // /emote/<ID>/2
        const idx = parts.indexOf('emote');
        return idx !== -1 ? parts[idx + 1] : null;
      }
      if (platform === 'Twitch') {
        // /emoticons/v2/<ID>/default/...
        const idx = parts.indexOf('v2');
        return idx !== -1 ? parts[idx + 1] : null;
      }
    } catch (_) {}
    return null;
  }

  /**
   * Получает URL превью в максимальном доступном размере из srcset.
   * Берёт последнюю (самую большую) запись, либо fallback на img.src.
   * @param {HTMLImageElement} img
   * @returns {string}
   */
  function getBestPreviewSrc(img) {
    if (img.srcset) {
      const entries = img.srcset
        .split(',')
        .map(e => e.trim().split(/\s+/)[0])
        .filter(Boolean);
      if (entries.length > 0) return entries[entries.length - 1];
    }
    return img.src;
  }

  // ─── Запросы к API ───────────────────────────────────────────

  /**
   * Загружает данные эмоута через соответствующий публичный API.
   * Возвращает объект { name, platform, author, previewSrc }.
   * @param {HTMLImageElement} img
   * @returns {Promise<Object>}
   */
  async function fetchEmoteData(img) {
    const src = img.src;
    const platform = detectPlatform(src);
    const id = extractId(src, platform);
    const cacheKey = `${platform}::${id ?? src}`;

    if (cache.has(cacheKey)) return cache.get(cacheKey);

    // Базовый объект — заполняется данными из img-атрибутов
    const result = {
      name:   img.alt || img.title || 'Unknown',
      platform,
      author: '—',
    };

    try {
      if (platform === '7TV' && id) {
        const res = await fetch(`https://7tv.io/v3/emotes/${id}`);
        if (res.ok) {
          const data = await res.json();
          result.name   = data.name        ?? result.name;
          result.author = data.owner?.display_name ?? '—';
        }

      } else if (platform === 'BetterTTV' && id) {
        const res = await fetch(`https://api.betterttv.net/3/emotes/${id}`);
        if (res.ok) {
          const data = await res.json();
          result.name   = data.code                  ?? result.name;
          result.author = data.user?.displayName     ?? '—';
        }

      } else if (platform === 'FFZ' && id) {
        const res = await fetch(`https://api.frankerfacez.com/v1/emote/${id}`);
        if (res.ok) {
          const data = await res.json();
          const emote = data.emote;
          result.name   = emote?.name                 ?? result.name;
          result.author = emote?.owner?.display_name  ?? '—';
        }

      }
      // Twitch: публичный API без токена не отдаёт автора.
      // Показываем только название (из alt/title) и платформу.

    } catch (err) {
      // Сеть недоступна или CORS — молча игнорируем
      console.debug('[emote-tooltip] API error:', err);
    }

    cache.set(cacheKey, result);
    return result;
  }

  // ─── Создание тултипа ────────────────────────────────────────

  // Удаляем старый тултип, если скрипт перезапускался
  const existing = document.getElementById(CFG.tooltipId);
  if (existing) existing.remove();

  const tooltip = document.createElement('div');
  tooltip.id = CFG.tooltipId;
  Object.assign(tooltip.style, {
    position:        'fixed',
    zIndex:          '9999999',
    display:         'none',
    pointerEvents:   'none',
    maxWidth:        '220px',
    background:      'linear-gradient(205deg, rgb(64, 111, 118), rgb(59, 29, 71)) !important',
    border:          '1px solid rgb(103, 169, 169)',
    borderRadius:    '10px',
    padding:         '12px 14px',
    color:           '#efeff1',
    fontFamily:      "'Inter', 'Roobert', 'Helvetica Neue', sans-serif",
    fontSize:        '14px',
    lineHeight:      '1.5',
    boxShadow:       '0 6px 24px rgba(0,0,0,0.65)',
    transition:      'opacity 0.1s ease',
    opacity:         '0',
    width:           '235px', 
    wordBreak:       'break-all'
  });
  document.body.appendChild(tooltip);

  /**
   * Заполняет и показывает тултип с переданными данными.
   * @param {Object} data
   */
  /**
 * Заполняет тултип: клонирует оригинальную картинку + показывает данные
 */
function renderTooltip(img, data) {
  const platformColor = PLATFORM_COLORS[data.platform] || PLATFORM_COLORS.Unknown;

  // Клонируем оригинальную картинку из чата
  const clone = img.cloneNode(true);
  Object.assign(clone.style, {
    maxWidth:  '112px',
    maxHeight: '112px',
    display:   'inline-block',
    imageRendering: 'auto',
    verticalAlign:  'middle'
  });

  tooltip.innerHTML = `
    <div style="
      text-align: center;
      margin-bottom: 10px;
      background:rgb(39, 52, 51);
      border-radius: 6px;
      padding: 8px;
    ">
    </div>

    <div style="font-weight: 700; font-size: 14px; margin-bottom: 6px; word-break: break-all;">
      ${data.name}
    </div>

    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
      <span style="color: #adadb8; min-width: 58px;">platform</span>
      <span style="
        background: ${platformColor}22;
        color: ${platformColor};
        font-weight: 600;
        border-radius: 4px;
        padding: 1px 7px;
        font-size: 12px;
      ">${data.platform}</span>
    </div>

    <div style="display: flex; align-items: center; gap: 6px;">
      <span style="color: #adadb8; min-width: 58px;">author</span>
      <span style="color: #efeff1; font-weight: 500;">${data.author}</span>
    </div>
  `;

  // Вставляем клонированную картинку в первый div
  tooltip.querySelector('div').appendChild(clone);
}

  /**
   * Показывает «Загрузка...» пока данные ещё не пришли.
   * @param {HTMLImageElement} img — для показа превью
   */
  /**
 * Показывает «Загрузка…» с клонированной оригинальной картинкой
 */
function renderLoading(img) {
  const clone = img.cloneNode(true);
  Object.assign(clone.style, {
    maxWidth:  '64px',
    maxHeight: '64px',
    display:   'block',
    margin:    '0 auto 6px',
  });

  tooltip.innerHTML = `
    <div style="text-align:center; padding:8px 4px; color:#adadb8; font-size:12px;">
    </div>
  `;
  const container = tooltip.firstElementChild;
  container.appendChild(clone);
  container.append('Загрузка…');
}

  // ─── Позиционирование ────────────────────────────────────────

  /**
   * Позиционирует тултип рядом с курсором, не выходя за края окна.
   * @param {number} cx — clientX курсора
   * @param {number} cy — clientY курсора
   */
  function positionTooltip(cx, cy) {
    const offsetX = 16;
    const offsetY = 10;
    const margin  = 8;

    const tw = tooltip.offsetWidth  || 220;
    const th = tooltip.offsetHeight || 100;
    const ww = window.innerWidth;
    const wh = window.innerHeight;

    let left = cx + offsetX;
    let top  = cy - offsetY;

    // Не выходим вправо
    if (left + tw + margin > ww) left = cx - tw - offsetX;
    // Не выходим за верх/низ
    if (top < margin)            top  = margin;
    if (top + th + margin > wh)  top  = wh - th - margin;

    tooltip.style.left = `${left}px`;
    tooltip.style.top  = `${top}px`;
  }

  // ─── Логика показа / скрытия ─────────────────────────────────

  let activeImg    = null;  // Текущий img под курсором
  let showTimer    = null;  // setTimeout для задержанного показа
  let hideTimer    = null;  // setTimeout для задержанного скрытия

  /** Прячет тултип */
  function hideTooltip() {
    tooltip.style.opacity = '0';
    setTimeout(() => {
      if (tooltip.style.opacity === '0') tooltip.style.display = 'none';
    }, 120);
    activeImg = null;
  }

  /** Показывает тултип (fade-in) */
  function showTooltip() {
    tooltip.style.display = 'block';
    // Принудительный reflow для корректной работы transition
    tooltip.getBoundingClientRect();
    tooltip.style.opacity = '1';
  }

  // Следим за движением мыши для обновления позиции тултипа
  document.addEventListener('mousemove', (e) => {
    if (activeImg && tooltip.style.display === 'block') {
      positionTooltip(e.clientX, e.clientY);
    }
  }, { passive: true });

  // ─── Проверяет, является ли элемент эмоутом ──────────────────
  /**
   * @param {Element} el
   * @returns {HTMLImageElement|null}
   */
  function getEmoteImg(el) {
    if (!(el instanceof HTMLImageElement)) return null;
    // Проверяем по CSS-классу
    if (el.matches(CFG.emoteSelectors)) return el;
    // Дополнительный фолбэк: эмоут в чате, определяемый по src CDN
    const src = el.src || '';
    if (
      src.includes('cdn.7tv.app')          ||
      src.includes('cdn.betterttv.net')    ||
      src.includes('cdn.frankerfacez.com') ||
      (src.includes('static-cdn.jtvnw.net') && src.includes('emoticons'))
    ) {
      return el;
    }
    return null;
  }

  // ─── Делегированные обработчики событий ─────────────────────

  document.addEventListener('mouseover', async (e) => {
    const img = getEmoteImg(e.target);
    if (!img) return;

    clearTimeout(hideTimer);
    clearTimeout(showTimer);

      showTimer = setTimeout(async () => {
      activeImg = img;

      renderLoading(img);                    // ← передаём img
      showTooltip();
      positionTooltip(e.clientX, e.clientY);

      const data = await fetchEmoteData(img);

      if (activeImg !== img) return;

      renderTooltip(img, data);              // ← теперь передаём img + data
      positionTooltip(e.clientX, e.clientY);
    }, CFG.showDelay);

  }, { passive: true });

  document.addEventListener('mouseout', (e) => {
    const img = getEmoteImg(e.target);
    if (!img) return;

    clearTimeout(showTimer);
    hideTimer = setTimeout(hideTooltip, CFG.hideDelay);
  }, { passive: true });

  console.log('[emote-tooltip] ✅ Скрипт загружен. Наводите на эмоуты!');

})();
