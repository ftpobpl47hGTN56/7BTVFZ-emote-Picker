// ============================================================
// content-api.js — API fetchers (FFZ, 7TV, BTTV, Twitch Global)
// Part 2/6 of content.js split
// ============================================================

(function () {
  'use strict';
  const SEP = window._SEP;

  SEP.fetchAllEmotes = async function fetchAllEmotes(channelName) {
    console.log(`[SEP] 🔍 Fetching emotes for channel: ${channelName}`);
    let twitchId = null;

    // ── Step 1: FFZ channel (даёт twitchId) ──────────────────────────────────
    let ffzChannelEmotes = [];
    try {
      const r = await fetch(`https://api.frankerfacez.com/v1/room/${channelName}`);
      if (r.ok) {
        const d = await r.json();
        twitchId = String(d.room.twitch_id);
        const set = d.sets[d.room.set];
        ffzChannelEmotes = (set?.emoticons || []).map(e => ({
          id: String(e.id), name: e.name,
          src: `${SEP.CDN_FFZ}${e.id}/2`, src4x: `${SEP.CDN_FFZ}${e.id}/4`,
          zeroWidth: false,
        }));
      }
    } catch (e) { console.warn('[SEP] FFZ channel fetch failed', e); }

    // ── Step 2: FFZ global ───────────────────────────────────────────────────
    let ffzGlobalEmotes = [];
    try {
      const r = await fetch('https://api.frankerfacez.com/v1/set/global');
      if (r.ok) {
        const d = await r.json();
        ffzGlobalEmotes = Object.values(d.sets || {}).flatMap(s =>
          (s.emoticons || []).map(e => ({
            id: String(e.id), name: e.name,
            src: `${SEP.CDN_FFZ}${e.id}/2`, src4x: `${SEP.CDN_FFZ}${e.id}/4`,
            zeroWidth: false,
          }))
        );
      }
    } catch (e) { console.warn('[SEP] FFZ global fetch failed', e); }

    // ── Step 3: 7TV helpers ──────────────────────────────────────────────────
    function parse7TV(emoteSet) {
      return (emoteSet?.emotes || []).map(e => ({
        id: e.id, name: e.name,
        src: `${SEP.CDN_7TV}${e.id}/2x.webp`, src4x: `${SEP.CDN_7TV}${e.id}/4x.webp`,
        zeroWidth: !!(e.flags & 1) || !!(e.data?.flags & 1),
      }));
    }

    async function fetch7TVByTwitchId(id) {
      const r = await fetch(`https://7tv.io/v3/users/twitch/${id}`);
      if (!r.ok) throw new Error(`7TV /users/twitch/${id} → ${r.status}`);
      const d = await r.json();
      if (d.emote_set?.emotes?.length) return parse7TV(d.emote_set);
      if (d.emote_set?.id) {
        const r2 = await fetch(`https://7tv.io/v3/emote-sets/${d.emote_set.id}`);
        if (r2.ok) return parse7TV(await r2.json());
      }
      return [];
    }

    async function fetch7TVByName(name) {
      const r = await fetch('https://7tv.io/v3/gql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query($q:String!){users(query:$q){id username connections{platform emote_set_id}}}`,
          variables: { q: name },
        }),
      });
      if (!r.ok) throw new Error(`7TV GQL → ${r.status}`);
      const d = await r.json();
      const users = d.data?.users || [];
      const user  = users.find(u => u.username?.toLowerCase() === name.toLowerCase()) || users[0];
      if (!user) return [];
      const conn  = (user.connections || []).find(c => c.platform === 'TWITCH');
      if (!conn?.emote_set_id) return [];
      const r2 = await fetch(`https://7tv.io/v3/emote-sets/${conn.emote_set_id}`);
      if (!r2.ok) return [];
      return parse7TV(await r2.json());
    }

    // ── Step 3a: 7TV channel ─────────────────────────────────────────────────
    let sevenTVChannel = [];
    try {
      if (twitchId) sevenTVChannel = await fetch7TVByTwitchId(twitchId);
      if (!sevenTVChannel.length) sevenTVChannel = await fetch7TVByName(channelName);
    } catch (e) {
      console.warn('[SEP] 7TV channel A failed:', e);
      try { sevenTVChannel = await fetch7TVByName(channelName); }
      catch (e2) { console.warn('[SEP] 7TV channel B failed:', e2); }
    }

    // Если twitchId всё ещё нет — пробуем decapi
    if (!twitchId) {
      try {
        const r = await fetch(`https://decapi.me/twitch/id/${channelName}`);
        if (r.ok) {
          const t = await r.text();
          if (/^\d+$/.test(t.trim())) twitchId = t.trim();
        }
      } catch (e) { console.warn('[SEP] decapi twitchId failed', e); }
    }

    // ── Step 3b: 7TV global ──────────────────────────────────────────────────
    let sevenTVGlobal = [];
    try {
      const r = await fetch('https://7tv.io/v3/emote-sets/global');
      if (r.ok) sevenTVGlobal = parse7TV(await r.json());
    } catch (e) { console.warn('[SEP] 7TV global fetch failed', e); }

    // ── Step 4a: BTTV global ──────────────────────────────────────────────────
    let bttvGlobalEmotes = [];
    try {
      const r = await fetch('https://api.betterttv.net/3/cached/emotes/global');
      if (r.ok) {
        bttvGlobalEmotes = (await r.json()).map(e => ({
          id: e.id, name: e.code,
          src: `${SEP.CDN_BTTV}${e.id}/2x`, src4x: `${SEP.CDN_BTTV}${e.id}/4x`,
          zeroWidth: false,
        }));
      }
    } catch (e) { console.warn('[SEP] BTTV global fetch failed', e); }

    // ── Step 4b: BTTV channel ────────────────────────────────────────────────
    let bttvChannelEmotes = [];
    if (twitchId) {
      try {
        const r = await fetch(`https://api.betterttv.net/3/cached/users/twitch/${twitchId}`);
        if (r.ok) {
          const d = await r.json();
          bttvChannelEmotes = [
            ...(d.channelEmotes || []),
            ...(d.sharedEmotes  || []),
          ].map(e => ({
            id: e.id, name: e.code,
            src: `${SEP.CDN_BTTV}${e.id}/2x`, src4x: `${SEP.CDN_BTTV}${e.id}/4x`,
            zeroWidth: false,
          }));
        }
      } catch (e) { console.warn('[SEP] BTTV channel fetch failed', e); }
    }

    // ── Step 5: Twitch Global Emotes ─────────────────────────────────────────
    // Фетч-модуль: chat/fetchTwitchGlobalEmotes.js
    let twitchGlobalEmotes = [];
    try {
      twitchGlobalEmotes = await fetchTwitchGlobalEmotes();
    } catch (e) {
      console.warn('[SEP] Twitch Global fetch полностью упал', e);
    }

    console.log(`[SEP]  Итог загрузки — twitch-gl:${twitchGlobalEmotes.length}`);

    return {
      sevenTVChannel,
      sevenTVGlobal,
      bttvChannelEmotes,
      bttvGlobalEmotes,
      ffzChannelEmotes,
      ffzGlobalEmotes,
      twitchGlobalEmotes,
    };
  };

})();
