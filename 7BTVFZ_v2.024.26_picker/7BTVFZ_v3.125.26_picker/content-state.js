// ============================================================
// content-state.js — Shared state object + applyFetchResult
// Part 3/6 of content.js split
// ============================================================

(function () {
  'use strict';
  const SEP = window._SEP;

  // ─── State ───────────────────────────────────────────────────────────────────
  SEP.state = {
    activeTab   : '7tv-ch',
    page        : 0,
    query       : '',
    emotesByTab : {
      '7tv-ch'   : [], '7tv-gl'   : [],
      'bttv-ch'  : [], 'bttv-gl'  : [],
      'ffz-ch'   : [], 'ffz-gl'   : [],
      'twitch-gl': [],
    },
    loaded: false,
  };

  SEP.applyFetchResult = function applyFetchResult({
    sevenTVChannel, sevenTVGlobal,
    bttvChannelEmotes, bttvGlobalEmotes,
    ffzChannelEmotes, ffzGlobalEmotes,
    twitchGlobalEmotes,
  }) {
    console.log('[SEP]  Applying fetch result...');
    SEP.state.emotesByTab['7tv-ch']    = sevenTVChannel;
    SEP.state.emotesByTab['7tv-gl']    = sevenTVGlobal;
    SEP.state.emotesByTab['bttv-ch']   = bttvChannelEmotes;
    SEP.state.emotesByTab['bttv-gl']   = bttvGlobalEmotes;
    SEP.state.emotesByTab['ffz-ch']    = ffzChannelEmotes;
    SEP.state.emotesByTab['ffz-gl']    = ffzGlobalEmotes;
    SEP.state.emotesByTab['twitch-gl'] = twitchGlobalEmotes || [];
    console.log('[SEP] ✓ State updated');
  };

})();
