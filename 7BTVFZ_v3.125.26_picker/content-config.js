// ============================================================
// content-config.js — Constants, CSS injection, Utility helpers
// Part 1/6 of content.js split
// ============================================================

(function () {
  'use strict';

  window._SEP = window._SEP || {};
  const SEP = window._SEP;

  // ─── Config ──────────────────────────────────────────────────────────────────
  SEP.PAGE_SIZE = 300; // 1000; 950; 480; 550; 120; 320; 300; 250; 650; 850;
  SEP.CDN_7TV   = 'https://cdn.7tv.app/emote/';
  SEP.CDN_BTTV  = 'https://cdn.betterttv.net/emote/';
  SEP.CDN_FFZ   = 'https://cdn.frankerfacez.com/emote/';

  SEP.PANEL_ID = 'sep-emote-panel';
  SEP.BTN_ID   = 'sep-emote-btn';
  SEP.STYLE_ID = 'sep-emote-style';

  // ─── CSS ─────────────────────────────────────────────────────────────────────
  SEP.injectStyle = function injectStyle() {
    if (document.getElementById(SEP.STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = SEP.STYLE_ID;
    s.textContent = `
    #${SEP.BTN_ID} {
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
    #${SEP.BTN_ID}:hover {
      background: var(--color-background-button-secondary-hover, rgba(255,255,255,.1));
    }
    #${SEP.PANEL_ID} {
      position: fixed; bottom: 56px; right: 340px;
      width: 340px; height: 420px; display: flex; flex-direction: column;
      background: var(--color-background-base, #18181b);
      border: 1px solid var(--color-border-base, #3a3a3d);
      border-radius: 6px; box-shadow: 0 4px 20px rgba(0,0,0,.6);
      z-index: 9000; font-family: Inter, Roobert, sans-serif;
      user-select: none; overflow: hidden;
    }
    #${SEP.PANEL_ID}.sep-hidden { display: none !important; }

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
    #sendemt-in-chat-4nrd5e:hover, #close-empopup-7tvfzpicker-exjkl35htd38:hover,
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
  };

  // ─── Utility ─────────────────────────────────────────────────────────────────
  SEP.waitFor = function waitFor(selector, timeout = 15000) {
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
  };

  SEP.getChannelName = function getChannelName() {
    const path = location.pathname;
    let m = path.match(/^\/popout\/([^/]+)/);
    if (m) return m[1].toLowerCase();
    const SKIP = new Set([
      'directory', 'following', 'videos', 'clips', 'about', 'popout', 'embed',
      'moderator', 'u', 'settings', 'inventory', 'drops', 'subscriptions',
      'payments', 'prime', 'turbo', 'jobs', 'p', 'friends', 'messages', 'notifications',
    ]);
    m = path.match(/^\/([^/]+)/);
    if (m && !SKIP.has(m[1].toLowerCase())) return m[1].toLowerCase();
    return null;
  };

})();
