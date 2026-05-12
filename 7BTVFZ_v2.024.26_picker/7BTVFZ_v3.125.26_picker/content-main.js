// ============================================================
// content-main.js — main(), SPA navigation, chrome message bridge
// Part 6/6 of content.js split
// ============================================================

(function () {
  'use strict';
  const SEP = window._SEP;

  // ─── Main ────────────────────────────────────────────────────────────────────
  async function main() {
    console.log('[SEP] ════ INITIALIZATION STARTED ════');
    SEP.injectStyle();

    const channel = SEP.getChannelName();
    if (!channel || ['directory', 'following', 'videos', 'clips', 'about'].includes(channel)) {
      console.log('[SEP] Not a valid channel page, exiting');
      return;
    }
    console.log(`[SEP] Channel: ${channel}`);

    const panel = SEP.buildPanel();
    SEP.wirePanel(panel);

    try {
      await SEP.waitFor(
        '.chat-input__buttons-container, [data-test-selector="chat-input-buttons-container"]'
      );
    } catch {
      console.warn('[SEP] Chat container not found');
      return;
    }

    SEP.injectButton();

    // Даём Twitch время заполнить localStorage после injectButton
    await new Promise(r => setTimeout(r, 355));

    const reInjectObs = new MutationObserver(() => {
      if (!document.getElementById(SEP.BTN_ID)) SEP.injectButton();
    });
    reInjectObs.observe(document.body, { childList: true, subtree: true });

    try {
      const result = await SEP.fetchAllEmotes(channel);
      SEP.applyFetchResult(result);
      SEP.state.loaded = true;
      SEP.renderGrid(panel);
      SEP.buildEmoteMap();
      SEP.startChatRenderer();
      SEP.startEmoteEventMonitor();
      window.__sepAC?.init(() => SEP.emoteMap);
      console.log('[SEP] ✅ ════ INITIALIZATION COMPLETE ════');
    } catch (e) {
      console.error('[SEP] Failed to load emotes', e);
    }

    // ─── SPA navigation ──────────────────────────────────────────────────────
    let lastChannel = channel;
    setInterval(() => {
      const ch = SEP.getChannelName();
      if (!ch || ch === lastChannel) return;
      console.log(`[SEP] 🚀 Channel change detected: ${lastChannel} → ${ch}`);
      lastChannel = ch;

      SEP.state.loaded = false;
      SEP.state.page   = 0;
      SEP.state.emotesByTab = {
        '7tv-ch'   : [], '7tv-gl'   : [],
        'bttv-ch'  : [], 'bttv-gl'  : [],
        'ffz-ch'   : [], 'ffz-gl'   : [],
        'twitch-gl': [],
      };
      SEP.renderGrid(panel);

      SEP.fetchAllEmotes(ch)
        .then(result => {
          SEP.applyFetchResult(result);
          SEP.state.loaded = true;
          SEP.renderGrid(panel);
          SEP.buildEmoteMap();
          SEP.startChatRenderer();
          SEP.startEmoteEventMonitor();
          window.__sepAC?.update(() => SEP.emoteMap);
          console.log('[SEP] ✓ Channel navigation complete');
        })
        .catch(e => console.error('[SEP] Emote reload failed', e));
    }, 2000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', main);
  else main();

  // ─── Message bridge ───────────────────────────────────────────────────────────
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === 'GET_EMOTES') {
      sendResponse({
        loaded      : SEP.state.loaded,
        emotesByTab : SEP.state.emotesByTab,
        channel     : SEP.getChannelName(),
      });
      return true;
    }
    if (msg.type === 'INSERT_EMOTE') {
      SEP.insertEmote(msg.name);
      sendResponse({ ok: true });
      return true;
    }
    if (msg.type === 'SEND_CHAT') {
      document.querySelector('[data-a-target="chat-send-button"]')?.click();
      sendResponse({ ok: true });
    }
  });

})();
