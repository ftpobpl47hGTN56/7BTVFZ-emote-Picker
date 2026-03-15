# 7BTVFZ-emote-Picker
browser extension popout panel emote-picker for chat.



# 7BTVFZ Emote Picker for Twitch
**Convenient, fast and beautiful emote picker for 7TV + BTTV + FFZ right in the Twitch chat**

A modern alternative to the default Twitch picker and the FrankerFaceZ extension. 

## Key Features
- Full **7TV** support (including zero-width, layers, latest 2025–2026 updates)
- Support for **BTTV** and **FFZ** (both channel-specific and global emotes)
- Extremely fast **virtualized list** — smooth scrolling even with 15,000+ emotes
- Autocompletion when typing `:name` (like in the best code editors)
- Beautiful slide-out popup (similar to native Twitch popout chat)
- Favorites (Ctrl+click an emote → add to favorites)
- Real-time chat notifications about 7TV emote add/remove/rename events (via WebSocket)
- Large tooltip on hover for any emote in chat (author, platform, preview)
- “Send to chat” button directly from the emote popup
- Responsive dark design with pleasant animations

## Why it's better than the built-in FFZ picker?

| Feature                                | FFZ (2025–2026)     | 7BTVFZ Picker     |
|----------------------------------------|----------------------|-------------------|
| List virtualization (fast scrolling)   | No / weak           | Full              |
| 7TV zero-width layers                  | Partial             | Full support      |
| Notifications about emote changes      | No                  | Yes (in chat)     |
| Autocompletion from all sources        | No / basic          | Yes, fast         |
| Per-channel favorites                  | No                  | Yes               |
| Hover tooltip with author & preview    | No                  | Yes               |
| Separate beautiful popout window       | No                  | Yes               |
| Good handling of Twitch SPA navigation | Average             | Excellent         |

## Installation (currently for developers only)
1. Download the repository as ZIP
2. Go to Chrome → `chrome://extensions/`
3. Enable “Developer mode”
4. Click “Load unpacked” → select the folder containing `manifest.json`

## License
MIT
 
