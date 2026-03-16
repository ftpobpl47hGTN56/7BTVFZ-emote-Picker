// picker.js — runs inside the popout window (picker.html)
// ── Favorites: Ctrl+Click any emote to toggle; stored in chrome.storage.local ──
'use strict';

const PAGE_SIZE   = 480;
const params      = new URLSearchParams(location.search);
const twitchTabId = parseInt(params.get('tabId'), 10);

// ── Emoji Categories ─────────────────────────────────────────────────────────
const EMOJI_CATEGORIES = {
  'Smileys & People': [
    '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇',
    '🥰','😍','🤩','😘','😗','☺️','😚','😙','🥲','😋','😛','😜','🤪',
    '😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒',
    '🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮',
    '🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐','😕',
    '😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥',
    '😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠',
    '🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖',
    '😺','😸','😹','😻','😼','😽','🙀','😿','😾'
  ],
  'Gestures & Body': [
    '👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙',
    '👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏',
    '🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶',
    '👂','🦻','👃','🧠','🫀','🫁','🦷','🦴','👀','👁️','👅','👄','💋'
  ],
  'Animals & Nature': [
    '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷',
    '🐽','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥',
    '🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌',
    '🐞','🐜','🪰','🪲','🪳','🦟','🦗','🕷️','🕸️','🦂','🐢','🐍','🦎',
    '🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋',
    '🦈','🐊','🐅','🐆','🦓','🦍','🦧','🦣','🐘','🦛','🦏','🐪','🐫',
    '🦒','🦘','🦬','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌',
    '🐕','🐩','🦮','🐕‍🦺','🐈','🐈‍⬛','🪶','🐓','🦃','🦤','🦚','🦜','🦢',
    '🦩','🕊️','🐇','🦝','🦨','🦡','🦫','🦦','🦥','🐁','🐀','🐿️','🦔'
  ],
  'Food & Drink': [
    '🍇','🍈','🍉','🍊','🍋','🍌','🍍','🥭','🍎','🍏','🍐','🍑','🍒',
    '🍓','🫐','🥝','🍅','🫒','🥥','🥑','🍆','🥔','🥕','🌽','🌶️','🫑',
    '🥒','🥬','🥦','🧄','🧅','🍄','🥜','🌰','🍞','🥐','🥖','🫓','🥨',
    '🥯','🥞','🧇','🧀','🍖','🍗','🥩','🥓','🍔','🍟','🍕','🌭','🥪',
    '🌮','🌯','🫔','🥙','🧆','🥚','🍳','🥘','🍲','🫕','🥣','🥗','🍿',
    '🧈','🧂','🥫','🍱','🍘','🍙','🍚','🍛','🍜','🍝','🍠','🍢','🍣',
    '🍤','🍥','🥮','🍡','🥟','🥠','🥡','🦀','🦞','🦐','🦑','🦪','🍦',
    '🍧','🍨','🍩','🍪','🎂','🍰','🧁','🥧','🍫','🍬','🍭','🍮','🍯',
    '🍼','🥛','☕','🫖','🍵','🍶','🍾','🍷','🍸','🍹','🍺','🍻','🥂',
    '🥃','🥤','🧋','🧃','🧉','🧊'
  ],
  'Activities & Sports': ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🥏',
    '🎱','🪀','🏓','🏸','🏒','🏑','🥍','🏏','🪃','🥅','⛳','🪁','🏹',
    '🎣','🤿','🥊','🥋','🎽','🛹','🛼','🛷','⛸️','🥌','🎿','⛷️','🏂',
    '🪂','🏋️','🤼','🤸','🤺','🤾','🏌️','🏇','🧘','🏄','🏊','🤽','🚣',
    '🧗','🚵','🚴','🏆','🥇','🥈','🥉','🏅','🎖️','🏵️','🎗️','🎫','🎟️',
    '🎪','🤹','🎭','🩰','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🪘','🎷',
    '🎺','🪗','🎸','🪕','🎻','🎲','♟️','🎯','🎳','🎮','🎰','🧩'
  ],
  'Travel & Places': [
    '🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻','🚚','🚛',
    '🚜','🦯','🦽','🦼','🛴','🚲','🛵','🏍️','🛺','🚨','🚔','🚍','🚘',
    '🚖','🚡','🚠','🚟','🚃','🚋','🚞','🚝','🚄','🚅','🚈','🚂','🚆',
    '🚇','🚊','🚉','✈️','🛫','🛬','🛩️','💺','🛰️','🚀','🛸','🚁','🛶',
    '⛵','🚤','🛥️','🛳️','⛴️','🚢','⚓','⛽','🚧','🚦','🚥','🚏','🗺️',
    '🗿','🗽','🗼','🏰','🏯','🏟️','🎡','🎢','🎠','⛲','⛱️','🏖️','🏝️',
    '🏜️','🌋','⛰️','🏔️','🗻','🏕️','⛺','🛖','🏠','🏡','🏘️','🏚️','🏗️',
    '🏭','🏢','🏬','🏣','🏤','🏥','🏦','🏨','🏪','🏫','🏩','💒','🏛️',
    '⛪','🕌','🕍','🛕','🕋','⛩️','🛤️','🛣️','🗾','🎑',
    '🏞️','🌅','🌄','🌠','🎇','🎆','🌇','🌆','🏙️','🌃','🌌','🌉','🌁'
  ],
  'Objects & Symbols': [
    '⌚','📱','📲','💻','⌨️','🖥️','🖨️','🖱️','🖲️','🕹️','🗜️','💽','💾',
    '💿','📀','📼','📷','📸','📹','🎥','📽️','🎞️','📞','☎️','📟','📠',
    '📺','📻','🎙️','🎚️','🎛️','🧭','⏱️','⏲️','⏰','🕰️','⌛','⏳','📡',
    '🔋','🔌','💡','🔦','🕯️','🪔','🧯','🛢️','💸','💵','💴','💶','💷',
    '🪙','💰','💳','💎','⚖️','🪜','🧰','🪛','🔧','🔨','⚒️','🛠️','⛏️',
    '🪚','🔩','⚙️','🪤','🧱','⛓️','🧲','🔫','💣','🧨','🪓','🔪','🗡️',
    '⚔️','🛡️','🚬','⚰️','🪦','⚱️','🏺','🔮','📿','🧿','💈','⚗️','🔭',
    '🔬','🕳️','🩹','🩺','💊','💉','🩸','🧬','🦠','🧫','🧪','🌡️','🧹',
    '🪠','🧺','🧻','🚽','🚰','🚿','🛁','🛀','🧼','🪥','🪒','🧽','🪣',
    '🧴',
    '🛎️','🔑','🗝️','🚪','🪑','🛋️','🛏️','🛌','🧸','🪆','🖼️','🪞','🪟',
    '🛍️','🛒','🎁','🎈','🎏','🎀','🪄','🪅','🎊','🎉','🎎','🏮','🎐',
    '🧧','✉️','📩','📨','📧','💌','📥','📤','📦','🏷️','🪧','📪','📫',
    '📬','📭','📮','📯','📜','📃','📄','📑','🧾','📊','📈','📉','🗒️',
    '🗓️','📆','📅','🗑️','📇','🗃️','🗳️','🗄️','📋','📁','📂','🗂️','🗞️',
    '📰','📓','📔','📒','📕','📗','📘','📙','📚','📖','🔖','🧷','🔗',
    '📎','🖇️','📐','📏','🧮','📌','📍','✂️','🖊️','🖋️','✒️','🖌️','🖍️',
    '📝','✏️','🔍','🔎','🔏','🔐','🔒','🔓'
  ],
  'Symbols & Flags': [
    '❤️','🧡','💛','💚','💙','💜','🖤','🤍',
    '🤎','💔','❣️','💕','💞','💓','💗','💖',
    '💘','💝','💟','☮️','✝️','☪️','🕉️','☸️',
    '✡️','🔯','🕎','☯️','☦️','🛐','⛎','♈',
    '♉','♊','♋','♌','♍','♎','♏','♐',
    '♑','♒','♓','🆔','⚛️',
    '🉑','☢️','☣️','📴','📳','🈶','🈚','🈸',
    '🈺','🈷️','✴️','🆚',
    '💮','🉐','㊙️','㊗️','🈴','🈵','🈹','🈲',
    '🅰️','🅱️','🆎','🆑','🅾️','🆘','❌','⭕',
    '🛑','⛔','📛','🚫','💯','💢','♨️','🚷',
    '🚯','🚳','🚱','🔞','📵','🚭',
    '❗','❕','❓','❔','‼️','⁉️',
    '🔅','🔆','〽️','⚠️','🚸','🔱','⚜️',
    '🔰','♻️',
    '✅','🈯','💹','❇️','✳️','❎','🌐','💠',
    'Ⓜ️','🌀','💤','🏧','🚾','♿','🅿️','🛗',
    '🈳','🈂️','🛂','🛃','🛄','🛅','🚹','🚺',
    '🚼','⚧️','🚻','🚮','🎦','📶','🈁','🔣',
    'ℹ️','🔤','🔡','🔠','🆖','🆗','🆙','🆒',
    '🆕','🆓','0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣',
    '6️⃣','7️⃣','8️⃣','9️⃣','🔟','🔢','#️⃣','*️⃣',
    '⏏️','▶️','⏸️','⏯️','⏹️','⏺️','⏭️','⏮️',
    '⏩','⏪','⏫','⏬','◀️','🔼','🔽','➡️',
    '⬅️','⬆️','⬇️','↗️','↘️','↙️','↖️','↕️',
    '↔️','↪️','↩️','⤴️','⤵️','🔀','🔁','🔂',
    '🔄','🔃','🎵','🎶','➕','➖','➗','✖️',
    '♾️','💲','💱','™️','©️','®️','〰️','➰',
    '➿','🔚','🔙','🔛','🔝','🔜','✔️','☑️',
    '🔘','🔴','🟠','🟡','🟢','🔵','🟣','⚫',
    '⚪','🟤','🔺','🔻','🔸','🔹','🔶','🔷',
    '🔳','🔲','▪️','▫️','◾','◽',
    '◼️','◻️','🟥','🟧','🟨','🟩','🟦','🟪',
    '⬛','⬜','🟫','🔈','🔇','🔉','🔊','🔔',
    '🔕','📣','📢','💬','💭','🗯️',
    '♠️','♣️','♥️','♦️','🃏','🎴','🀄',
    '🕐','🕑','🕒','🕓','🕔','🕕','🕖',
    '🕗','🕘','🕙','🕚',
    '🕛','🕜','🕝','🕞','🕟','🕠','🕡',
    '🕢','🕣','🕤','🕥','🕦','🕧',
    '🏳️','🏴','🏴‍☠️','🏁','🚩','🏳️‍🌈','🏳️‍⚧️'
  ]
};

// ── Twemoji Helper ──────────────────────────────────────────────────────────
// Convert emoji character to Twemoji CDN URL
function emojiToTwemojiUrl(emoji) {
  // Get codepoint(s) in hex
  const codePoints = [];
  for (const char of emoji) {
    const code = char.codePointAt(0);
    if (code) codePoints.push(code.toString(16));
  }
  let hex = codePoints.join('-');
  
  // Remove variation selector-16 (fe0f) which causes 404s on FFZ CDN
  // Many emoji have fe0f suffix that FFZ doesn't support
  hex = hex.replace(/-fe0f/g, '');
  
  // Use FrankerFaceZ CDN (same as in Twitch chat)
  // Alternative: jsDelivr - https://cdn.jsdelivr.net/gh/jdecked/twemoji@latest/assets/svg/${hex}.svg
  
  return `https://cdn2.frankerfacez.com/static/emoji/images/twemoji/${hex}.png`;
}

// Create Twemoji <img> element
function createTwemojiImg(emoji, size = 24) {
  const img = document.createElement('img');
  img.className = 'twemoji';
  img.src = emojiToTwemojiUrl(emoji);
  img.alt = emoji;
  img.title = emoji;
  img.loading = 'lazy';
  img.style.cssText = `
    width: ${size}px; height: ${size}px; 
    vertical-align: middle; display: inline-block;
  `;
  img.onerror = function() {
    // Fallback to text if image fails
    this.replaceWith(document.createTextNode(emoji));
  };
  return img;
}

// ── Favorites ────────────────────────────────────────────────────────────────
let channelName = '';
const favoritesMap = new Map();

function favsKey() { return 'favs_' + (channelName || '_global'); }

function loadFavorites() {
  return new Promise(resolve => {
    if (!chrome?.storage?.local) { resolve(); return; }
    try {
      chrome.storage.local.get(favsKey(), result => {
        if (chrome.runtime.lastError) { resolve(); return; }
        const arr = result[favsKey()] || [];
        favoritesMap.clear();
        arr.forEach(e => favoritesMap.set(e.name, e));
        resolve();
      });
    } catch { resolve(); }
  });
}

function saveFavorites() {
  if (!chrome?.storage?.local) return;
  chrome.storage.local.set({ [favsKey()]: [...favoritesMap.values()] });
}

function toggleFavorite(emote) {
  if (favoritesMap.has(emote.name)) favoritesMap.delete(emote.name);
  else favoritesMap.set(emote.name, emote);
  saveFavorites();
  state.emotesByTab.favs = [...favoritesMap.values()];
  renderGrid();
}

// ── Emoji Category State ─────────────────────────────────────────────────────
const emojiCategoryState = {};
const EMOJI_STATE_KEY = 'emoji_category_state';

function loadEmojiCategoryState() {
  return new Promise(resolve => {
    if (!chrome?.storage?.local) { resolve(); return; }
    try {
      chrome.storage.local.get(EMOJI_STATE_KEY, result => {
        if (chrome.runtime.lastError) { resolve(); return; }
        const saved = result[EMOJI_STATE_KEY] || {};
        Object.keys(EMOJI_CATEGORIES).forEach(cat => {
          emojiCategoryState[cat] = saved[cat] !== undefined ? saved[cat] : true; // default open
        });
        resolve();
      });
    } catch { resolve(); }
  });
}

function saveEmojiCategoryState() {
  if (!chrome?.storage?.local) return;
  chrome.storage.local.set({ [EMOJI_STATE_KEY]: emojiCategoryState });
}

function toggleEmojiCategory(categoryName) {
  emojiCategoryState[categoryName] = !emojiCategoryState[categoryName];
  saveEmojiCategoryState();
  renderEmojiCategories();
}

// ── State ────────────────────────────────────────────────────────────────────
const state = {
  activeTab   : 'favs',
  page        : 0,
  query       : '',
  emotesByTab : {
    favs      : [],
    '7tv-ch'  : [], '7tv-gl'  : [],
    'bttv-ch' : [], 'bttv-gl' : [],
    'ffz-ch'  : [], 'ffz-gl'  : [],
    emoji     : [], // not used, but keeps structure consistent
  },
  loaded: false,
};

// ── DOM refs ──────────────────────────────────────────────────────────────────
const grid      = document.getElementById('grid');
const prevBtn   = document.getElementById('prev');
const nextBtn   = document.getElementById('next');
const pageLabel = document.getElementById('page-label');
const searchEl  = document.getElementById('search');
const tabsEl    = document.getElementById('tabs');
const headerCh  = document.getElementById('header-channel');

// ── Messaging ─────────────────────────────────────────────────────────────────
function sendToContent(msg) {
  return new Promise(resolve => {
    chrome.tabs.sendMessage(twitchTabId, msg, resp => {
      if (chrome.runtime.lastError) resolve(null);
      else resolve(resp);
    });
  });
}

// ── Filter ───────────────────────────────────────────────────────────────────
function filteredEmotes() {
  const list = state.emotesByTab[state.activeTab] || [];
  if (!state.query) return list;
  const q = state.query.toLowerCase();
  return list.filter(e => e.name.toLowerCase().includes(q));
}

// ── Render Emoji Categories ──────────────────────────────────────────────────
function renderEmojiCategories() {
  grid.innerHTML = '';
  grid.style.cssText = 'display: block; overflow-y: auto; padding: 12px;';
  
  const query = state.query.toLowerCase();
  
  Object.entries(EMOJI_CATEGORIES).forEach(([categoryName, emojis]) => {
    const filteredEmojis = query 
      ? emojis.filter(e => categoryName.toLowerCase().includes(query))
      : emojis;
    
    if (!filteredEmojis.length && query) return; // skip empty categories when searching
    
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'emoji-category';
    categoryDiv.style.cssText = 'margin-bottom: 16px;';
    
    const header = document.createElement('div');
    header.className = 'emoji-category-header';
    header.style.cssText = `
      display: flex; align-items: center; gap: 8px; padding: 8px 4px;
      cursor: pointer; user-select: none; font-size: 13px;
      font-weight: 600; color: var(--color-text-base, #efeff1);
      border-bottom: 1px solid var(--color-border-base, #3a3a3d);
      margin-bottom: 8px;
    `;
    
    const isOpen = emojiCategoryState[categoryName];
    const chevron = document.createElement('span');
    chevron.textContent = isOpen ? '▼' : '▶';
    chevron.style.cssText = 'font-size: 10px; transition: transform 0.2s;';
    
    const title = document.createElement('span');
    title.textContent = categoryName;
    
    header.appendChild(chevron);
    header.appendChild(title);
    header.addEventListener('click', () => toggleEmojiCategory(categoryName));
    
    categoryDiv.appendChild(header);
    
    if (isOpen) {
      const emojiGrid = document.createElement('div');
      emojiGrid.className = 'emoji-grid';
      emojiGrid.style.cssText = `
        display: grid; grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
        gap: 4px; padding: 4px;
      `;
      
      filteredEmojis.forEach(emoji => {
        const emojiBtn = document.createElement('button');
        emojiBtn.className = 'emoji-btn';
        emojiBtn.style.cssText = `
          width: 36px; height: 36px; border: none; background: transparent;
          cursor: pointer; border-radius: 4px; transition: background 0.15s;
          display: flex; align-items: center; justify-content: center;
          padding: 0;
        `;
        emojiBtn.title = emoji;
        
        // Use Twemoji image instead of text
        const emojiImg = createTwemojiImg(emoji, 28);
        emojiBtn.appendChild(emojiImg);
        
        emojiBtn.addEventListener('mouseenter', () => {
          emojiBtn.style.background = 'var(--color-background-button-secondary-hover, rgba(255,255,255,.15))';
        });
        emojiBtn.addEventListener('mouseleave', () => {
          emojiBtn.style.background = 'transparent';
        });
        emojiBtn.addEventListener('click', async () => {
          await sendToContent({ type: 'INSERT_EMOTE', name: emoji });
          chrome.tabs.update(twitchTabId, { active: true });
        });
        emojiGrid.appendChild(emojiBtn);
      });
      
      categoryDiv.appendChild(emojiGrid);
    }
    
    grid.appendChild(categoryDiv);
  });
  
  // Hide pagination for emoji tab
  prevBtn.disabled = nextBtn.disabled = true;
  pageLabel.textContent = '';
}

// ── Render Grid (for emotes) ─────────────────────────────────────────────────
function renderGrid() {
  // Reset grid styles
  grid.style.cssText = '';
  
  // Special handling for emoji tab
  if (state.activeTab === 'emoji') {
    renderEmojiCategories();
    return;
  }
  
  grid.innerHTML = '';
  const isFavs = state.activeTab === 'favs';

  if (!state.loaded && !isFavs) {
    grid.innerHTML = `<div class="state-msg">
      <div class="icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" opacity="0.25"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round">
            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
          </path>
        </svg>
      </div>
      Loading emotes…
    </div>`;
    prevBtn.disabled = nextBtn.disabled = true;
    pageLabel.textContent = '— / —';
    return;
  }

  const all   = filteredEmotes();
  const total = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  state.page  = Math.max(0, Math.min(state.page, total - 1));
  const slice = all.slice(state.page * PAGE_SIZE, (state.page + 1) * PAGE_SIZE);

  if (!slice.length) {
    if (isFavs) {
      grid.innerHTML = `<div class="state-msg">
        <div class="icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>
        No favourites yet.
        <span class="state-hint">Ctrl+Click any emote to save it here.</span>
      </div>`;
    } else {
      grid.innerHTML = `<div class="state-msg">
        <div class="icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
        No emotes found
      </div>`;
    }
    prevBtn.disabled = nextBtn.disabled = true;
    pageLabel.textContent = '0 / 0';
    return;
  }

  const frag = document.createDocumentFragment();
  slice.forEach(emote => {
    const cell = document.createElement('div');
    cell.className = 'emote' + (emote.zeroWidth ? ' emote--zw' : '');
    cell.setAttribute('data-name', emote.name);
    cell.title = emote.name + (emote.zeroWidth ? ' (zero-width overlay)' : '');
    if (favoritesMap.has(emote.name)) cell.classList.add('is-fav');

    const img = document.createElement('img');
    img.src = emote.src;
    const hires = emote.src2x || emote.src4x;
    if (hires) img.srcset = `${emote.src} 1x, ${hires} 2x`;
    img.alt = emote.name; img.loading = 'lazy';
    img.onerror = function () { this.style.display = 'none'; };

    const starBadge = document.createElement('span');
    starBadge.className = 'fav-badge';
    starBadge.innerHTML = `
     <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 14 14">
  <title>Interface-favorite-star-reward-rating-rate-social-star-media-favorite-like-stars SVG Icon</title>
  <path fill="none" stroke="#ffe97a" stroke-linecap="round" stroke-linejoin="round" d="M7.49 1.09L9.08 4.3a.51.51 0 0 0 .41.3l3.51.52a.54.54 0 0 1 .3.93l-2.53 2.51a.53.53 0 0 0-.16.48l.61 3.53a.55.55 0 0 1-.8.58l-3.16-1.67a.59.59 0 0 0-.52 0l-3.16 1.67a.55.55 0 0 1-.8-.58L3.39 9a.53.53 0 0 0-.16-.48L.67 6.05A.54.54 0 0 1 1 5.12l3.51-.52a.51.51 0 0 0 .41-.3l1.59-3.21a.54.54 0 0 1 .98 0Z"/>
</svg>`;
    starBadge.setAttribute('aria-hidden', 'true');

    cell.appendChild(img);
    cell.appendChild(starBadge);

    if (emote.zeroWidth) {
      const badge = document.createElement('span');
      badge.className = 'zw-badge'; badge.textContent = 'ZW';
      cell.appendChild(badge);
    }

    cell.addEventListener('click', async e => {
      if (e.ctrlKey || e.metaKey) { e.preventDefault(); toggleFavorite(emote); return; }
      await sendToContent({ type: 'INSERT_EMOTE', name: emote.name });
      chrome.tabs.update(twitchTabId, { active: true });
    });

    frag.appendChild(cell);
  });

  grid.appendChild(frag);
  grid.scrollTop = 0;
  pageLabel.textContent = `${state.page + 1} / ${total}`;
  prevBtn.disabled = state.page === 0;
  nextBtn.disabled = state.page >= total - 1;
}

// ── Tabs ─────────────────────────────────────────────────────────────────────
tabsEl.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    tabsEl.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    state.activeTab = tab.dataset.tab;
    state.page = 0; state.query = '';
    searchEl.value = '';
    renderGrid();
  });
});

// ── Pagination ────────────────────────────────────────────────────────────────
prevBtn.addEventListener('click', () => { state.page--; renderGrid(); });
nextBtn.addEventListener('click', () => { state.page++; renderGrid(); });

// ── Send ─────────────────────────────────────────────────────────────────────
document.getElementById('send-chat').addEventListener('click', async () => {
  await sendToContent({ type: 'SEND_CHAT' });
  chrome.tabs.update(twitchTabId, { active: true });
});

// ── Search ────────────────────────────────────────────────────────────────────
let searchTimer;
searchEl.addEventListener('input', e => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { state.query = e.target.value.trim(); state.page = 0; renderGrid(); }, 200);
});

// ── Apply fetch result ────────────────────────────────────────────────────────
function applyResponse(r) {
  state.emotesByTab['7tv-ch']  = r.emotesByTab['7tv-ch']  || [];
  state.emotesByTab['7tv-gl']  = r.emotesByTab['7tv-gl']  || [];
  state.emotesByTab['bttv-ch'] = r.emotesByTab['bttv-ch'] || [];
  state.emotesByTab['bttv-gl'] = r.emotesByTab['bttv-gl'] || [];
  state.emotesByTab['ffz-ch']  = r.emotesByTab['ffz-ch']  || [];
  state.emotesByTab['ffz-gl']  = r.emotesByTab['ffz-gl']  || [];
  state.loaded = r.loaded;
}

// ── Init ─────────────────────────────────────────────────────────────────────
async function init() {
  if (!twitchTabId) {
    grid.innerHTML = `<div class="state-msg">
      <div class="icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      No Twitch tab found.<br>Open from the chat button.
    </div>`;
    return;
  }

  await new Promise(resolve => {
    chrome.tabs.get(twitchTabId, tab => {
      if (!chrome.runtime.lastError && tab) {
        const m = tab.url?.match(/twitch\.tv\/popout\/([^/?#]+)/) || tab.url?.match(/twitch\.tv\/([^/?#]+)/);
        if (m) {
          channelName = m[1].toLowerCase();
          headerCh.textContent = m[1];
          document.title = `7BTVFZ — ${m[1]}`;
        }
      }
      resolve();
    });
  });

  await loadFavorites();
  await loadEmojiCategoryState();
  state.emotesByTab.favs = [...favoritesMap.values()];
  renderGrid();

  const resp = await sendToContent({ type: 'GET_EMOTES' });
  if (!resp) {
    if (state.activeTab !== 'favs' && state.activeTab !== 'emoji')
      grid.innerHTML = `<div class="state-msg">
        <div class="icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        Could not reach Twitch page.<br>Reload and try again.
      </div>`;
    return;
  }

  applyResponse(resp);
  renderGrid();

  if (!state.loaded) {
    const poll = setInterval(async () => {
      const r = await sendToContent({ type: 'GET_EMOTES' });
      if (r?.loaded) { clearInterval(poll); applyResponse(r); renderGrid(); }
    }, 500);
  }
}

init();



// ══════════════════════════════════════════════════════════════
//  Privacy Policy Modal
// ══════════════════════════════════════════════════════════════
(function initPrivacyModal() {
  const privacyBtn = document.getElementById('privacy-btn');
  const privacyModal = document.getElementById('privacy-modal');
  const closePrivacy = document.getElementById('close-privacy');
  const privacyTitle = document.getElementById('privacy-title');
  const langButtons = document.querySelectorAll('.lang-btn');
  const contentRu = document.querySelector('.content-ru');
  const contentEn = document.querySelector('.content-en');

  if (!privacyBtn || !privacyModal) return;

  // Открыть модальное окно
  privacyBtn.addEventListener('click', () => {
    privacyModal.showModal();
  });

  // Закрыть по кнопке
  closePrivacy.addEventListener('click', () => {
    privacyModal.close();
  });

  // Закрыть по клику на backdrop
  privacyModal.addEventListener('click', (e) => {
    if (e.target === privacyModal) {
      privacyModal.close();
    }
  });

  // Переключение языка
  langButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      
      // Обновить активную кнопку
      langButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Переключить контент
      if (lang === 'ru') {
        privacyTitle.textContent = 'Политика конфиденциальности';
        contentRu.classList.add('active');
        contentEn.classList.remove('active');
      } else {
        privacyTitle.textContent = 'Privacy Policy';
        contentEn.classList.add('active');
        contentRu.classList.remove('active');
      }
    });
  });

  // Закрытие по ESC уже работает автоматически для <dialog>
})();