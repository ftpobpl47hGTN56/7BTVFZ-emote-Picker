// ============================================================
//  7TV Emote Events Tracker — emote-events.js
//  Отслеживает добавление/удаление эмотов через WebSocket API
//  и выводит уведомления в чат Twitch
// ============================================================

(function () {
  'use strict'; 
   
    
  // ─── Config ─────────────────────────────────────────────────────────────────
  const WEBSOCKET_URL = 'wss://events.7tv.io/v3';
  const RECONNECT_DELAY = 5000; // 5 секунд
  const HEARTBEAT_INTERVAL = 30000; // 30 секунд

  // ─── State ──────────────────────────────────────────────────────────────────
  let ws = null;
  let heartbeatTimer = null;
  let reconnectTimer = null;
  let currentChannel = null;
  let currentEmoteSetId = null;
  let isConnected = false;

  // ─── Utility ─────────────────────────────────────────────────────────────────
  function getChannelName() {
    const path = location.pathname;

    // Check for popout window
    let m = path.match(/^\/popout\/([^/]+)/);
    if (m) return m[1].toLowerCase();

    const SKIP = new Set([
      'directory', 'following', 'videos', 'clips', 'about',
      'popout', 'embed', 'moderator', 'u', 'settings', 'inventory',
      'drops', 'subscriptions', 'payments', 'prime', 'turbo',
      'jobs', 'p', 'friends', 'messages', 'notifications',
    ]);
    m = path.match(/^\/([^/]+)/);
    if (m && !SKIP.has(m[1].toLowerCase())) return m[1].toLowerCase();
    return null;
  }

  // ─── Fetch 7TV Emote Set ID ─────────────────────────────────────────────────
  async function fetch7TVEmoteSetId(channelName) {
    try {
      // Step 1: Try to get Twitch ID from FFZ API
      let twitchId = null;
      try {
        const ffzResp = await fetch(`https://api.frankerfacez.com/v1/room/${channelName}`);
        if (ffzResp.ok) {
          const ffzData = await ffzResp.json();
          twitchId = String(ffzData.room.twitch_id);
        }
      } catch (e) {
        console.warn('[7TV Events] FFZ fetch failed:', e);
      }

      // Step 2: If we have Twitch ID, use direct 7TV API
      if (twitchId) {
        try {
          const userResp = await fetch(`https://7tv.io/v3/users/twitch/${twitchId}`);
          if (userResp.ok) {
            const userData = await userResp.json();
            const emoteSetId = userData.emote_set?.id;
            if (emoteSetId) return emoteSetId;
          }
        } catch (e) {
          console.warn('[7TV Events] 7TV user fetch failed:', e);
        }
      }

      // Step 3: Fallback to GraphQL by channel name
      const gql = {
        query: `query($query:String!){users(query:$query){id username connections{id platform emote_set_id}}}`,
        variables: { query: channelName }
      };
      
      const r = await fetch('https://7tv.io/v3/gql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gql),
      });

      if (!r.ok) throw new Error(`7TV GQL → ${r.status}`);
      
      const d = await r.json();
      const users = d.data?.users || [];
      const user = users.find(u => u.username?.toLowerCase() === channelName.toLowerCase()) || users[0];
      
      if (!user) return null;
      
      const twitchConn = (user.connections || []).find(c => c.platform === 'TWITCH');
      return twitchConn?.emote_set_id || null;
    } catch (e) {
      console.warn('[7TV Events] Failed to fetch emote set ID:', e);
      return null;
    }
  }

  // ─── Insert notification message into chat ──────────────────────────────────
   function insertChatNotification(message, type = 'info') {
    const chatContainer = document.querySelector('.chat-scrollable-area__message-container, [data-test-selector="chat-scrollable-area__message-container"]');
    if (!chatContainer) return;

    const wrapper = document.createElement('div');
    const inner = document.createElement('div');
    const statusLine = document.createElement('div');

    // ТУТ ИСПРАВЛЕНО: имя атрибута теперь совпадает с CSS ниже
    statusLine.className = 'Layout-sc-1xcs6mc-0 chat-line__status sep-7btvfz-emote-event-line';
    statusLine.setAttribute('data-sep-7btvfz-emote-event-type', type); 

    const textSpan = document.createElement('span');
    textSpan.className = 'CoreText-sc-1txzju1-0 cWFBTs';
    
    // ТУТ ИСПРАВЛЕНО: убрали лишнюю раскраску из JS, теперь всё берётся из CSS
    textSpan.classList.add(`sep-7btvfz-emote-event-${type}`);
    textSpan.textContent = message;
    
    statusLine.appendChild(textSpan);
    inner.appendChild(statusLine);
    wrapper.appendChild(inner);
    chatContainer.appendChild(wrapper);
    
    // Автопрокрутка
    const scrollableParent = chatContainer.parentElement;
    if (scrollableParent) {
        scrollableParent.scrollTop = scrollableParent.scrollHeight;
    }
  }

  // Стили (теперь они точно увидят атрибуты из кода выше)
  const style = document.createElement('style');
  style.textContent = `
    .sep-7btvfz-emote-event-line {
        border-left: solid 4px !important;
        border-right: solid 4px !important;
        margin: 6px 0 !important;
        padding: 5px 8px !important;
        background: rgba(30, 30, 50, 0.65) !important;
        border-radius: 4px !important;
    }

    /* Цвета бордеров по типу */
    .sep-7btvfz-emote-event-line[data-sep-7btvfz-emote-event-type="add"] { border-color: #4dea89 !important; }
    .sep-7btvfz-emote-event-line[data-sep-7btvfz-emote-event-type="remove"] { border-color: #ea4d4d !important; }
    .sep-7btvfz-emote-event-line[data-sep-7btvfz-emote-event-type="info"] { border-color: #9147ff !important; }

    /* Цвета текста */
    .sep-7btvfz-emote-event-add { color: #4dea89 !important; font-weight: 600; }
    .sep-7btvfz-emote-event-remove { color: #ea4d4d !important; font-weight: 600; }
    .sep-7btvfz-emote-event-info { color: #9147ff !important; font-weight: 500; }
  `;
  document.head.appendChild(style);


  // ─── WebSocket handlers ──────────────────────────────────────────────────────
  function sendHeartbeat() {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ op: 2 })); // HEARTBEAT opcode
    }
  }

  function startHeartbeat() {
    stopHeartbeat();
    heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
  }

  function stopHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }

  function subscribe(emoteSetId) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const subscribeMsg = {
      op: 35, // SUBSCRIBE opcode
      d: {
        type: 'emote_set.update',
        condition: {
          object_id: emoteSetId
        }
      }
    };

    ws.send(JSON.stringify(subscribeMsg));
    console.log('[7TV Events] Subscribed to emote_set:', emoteSetId);
  }

  function handleMessage(event) {
    try {
      const msg = JSON.parse(event.data);

      // Opcode 1 = HELLO (connection established)
      if (msg.op === 1) {
        console.log('[7TV Events] Connected to WebSocket');
        isConnected = true;
        startHeartbeat();
        
        if (currentEmoteSetId) {
          subscribe(currentEmoteSetId);
        }
        return;
      }

      // Opcode 2 = HEARTBEAT ACK
      if (msg.op === 2) {
        // Just acknowledgment, no action needed
        return;
      }

      // Opcode 0 = DISPATCH (событие)
      if (msg.op === 0 && msg.d && msg.d.type === 'emote_set.update') {
        handleEmoteSetUpdate(msg.d);
        return;
      }

      // Opcode 4 = RECONNECT (server requests reconnect)
      if (msg.op === 4) {
        console.log('[7TV Events] Server requested reconnect');
        connect();
        return;
      }

      // Opcode 7 = ACK (subscription acknowledged)
      if (msg.op === 7) {
        console.log('[7TV Events] Subscription acknowledged');
        return;
      }

    } catch (e) {
      console.error('[7TV Events] Failed to parse message:', e);
    }
  }

  function handleEmoteSetUpdate(data) {
    const body = data.body;
    if (!body) return;

    const actor = body.actor?.display_name || body.actor?.username || 'Moderator';
    const pushed = body.pushed || [];
    const pulled = body.pulled || [];
    const updated = body.updated || [];

    // Обработка добавленных эмотов
    pushed.forEach(item => {
      const emoteName = item.value?.name || 'Unknown';
      const emoteId = item.value?.id;
      const message = `🎨 ${actor} added emote: ${emoteName}`;
      insertChatNotification(message, 'add');
      console.log('[7TV Events] Emote added:', emoteName, 'by', actor);

      // Notify content.js to update emoteMap
      if (emoteId && emoteName) {
        dispatchEmoteEvent('emote-added', {
          id: emoteId,
          name: emoteName,
          actor: actor
        });
      }
    });

    // Обработка удаленных эмотов
    pulled.forEach(item => {
      const emoteName = item.old_value?.name || 'Unknown';
      const emoteId = item.old_value?.id;
      const message = `🗑️ ${actor} removed emote: ${emoteName}`;
      insertChatNotification(message, 'remove');
      console.log('[7TV Events] Emote removed:', emoteName, 'by', actor);

      // Notify content.js to update emoteMap
      if (emoteName) {
        dispatchEmoteEvent('emote-removed', {
          id: emoteId,
          name: emoteName,
          actor: actor
        });
      }
    });

    // Обработка измененных эмотов (переименование)
    updated.forEach(item => {
      const oldName = item.old_value?.name;
      const newName = item.value?.name;
      const emoteId = item.value?.id;
      if (oldName && newName && oldName !== newName) {
        const message = `✏️ ${actor} renamed emote: ${oldName} → ${newName}`;
        insertChatNotification(message, 'info');
        console.log('[7TV Events] Emote renamed:', oldName, '→', newName, 'by', actor);

        // Notify content.js to update emoteMap
        dispatchEmoteEvent('emote-renamed', {
          id: emoteId,
          oldName: oldName,
          newName: newName,
          actor: actor
        });
      }
    });
  }

  // ─── Dispatch custom event to notify content.js ────────────────────────────
  function dispatchEmoteEvent(eventType, details) {
    const event = new CustomEvent('7tv-emote-change', {
      detail: {
        type: eventType,
        ...details,
        timestamp: Date.now()
      }
    });
    document.dispatchEvent(event);
    console.log('[7TV Events] Dispatched event:', eventType, details);
  }

  function connect() {
    if (ws) {
      ws.close();
      ws = null;
    }

    stopHeartbeat();
    isConnected = false;

    try {
      ws = new WebSocket(WEBSOCKET_URL);

      ws.onopen = () => {
        console.log('[7TV Events] WebSocket opened');
      };

      ws.onmessage = handleMessage;

      ws.onerror = (error) => {
        console.error('[7TV Events] WebSocket error:', error);
      };

      ws.onclose = (event) => {
        console.log('[7TV Events] WebSocket closed:', event.code, event.reason);
        isConnected = false;
        stopHeartbeat();
        
        // Auto-reconnect
        if (currentChannel) {
          console.log('[7TV Events] Reconnecting in', RECONNECT_DELAY / 1000, 'seconds...');
          reconnectTimer = setTimeout(() => {
            connect();
          }, RECONNECT_DELAY);
        }
      };

    } catch (e) {
      console.error('[7TV Events] Failed to create WebSocket:', e);
    }
  }

  // ─── Initialize for channel ──────────────────────────────────────────────────
  async function initForChannel(channelName) {
    if (!channelName) return;

    currentChannel = channelName;
    console.log('[7TV Events] Initializing for channel:', channelName);

    const emoteSetId = await fetch7TVEmoteSetId(channelName);
    
    if (!emoteSetId) {
      console.warn('[7TV Events] No emote set ID found for channel:', channelName);
      return;
    }

    currentEmoteSetId = emoteSetId;
    console.log('[7TV Events] Emote set ID:', emoteSetId);

    connect();
  }

  // ─── Cleanup ─────────────────────────────────────────────────────────────────
  function cleanup() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    
    stopHeartbeat();
    
    if (ws) {
      ws.close();
      ws = null;
    }
    
    currentChannel = null;
    currentEmoteSetId = null;
    isConnected = false;
  }

    
      
  // ─── Main ────────────────────────────────────────────────────────────────────
  async function main() {
    const channel = getChannelName();
    
    if (!channel || ['directory', 'following', 'videos', 'clips', 'about'].includes(channel)) {
      console.log('[7TV Events] Not on a channel page, skipping');
      return;
    }

    await initForChannel(channel);

    // Отслеживаем изменение канала (SPA navigation)
    let lastChannel = channel;
    setInterval(() => {
      const ch = getChannelName();
      if (ch && ch !== lastChannel) {
        console.log('[7TV Events] Channel changed:', lastChannel, '→', ch);
        lastChannel = ch;
        cleanup();
        initForChannel(ch);
      }
    }, 2000);
  }

  // ─── Cleanup on page unload ──────────────────────────────────────────────────
  window.addEventListener('beforeunload', cleanup);

  // ─── Start ───────────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }

})();