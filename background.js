// background.js — service worker

// Map<twitchTabId, pickerWindowId>
const pickerWindows = new Map();

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  if (msg.type === 'OPEN_POPOUT') {
    const twitchTabId = sender.tab?.id;
    if (!twitchTabId) return;

    const existingWindowId = pickerWindows.get(twitchTabId);

    if (existingWindowId !== undefined) {
      chrome.windows.get(existingWindowId, {}, (win) => {
        if (chrome.runtime.lastError || !win) {
          pickerWindows.delete(twitchTabId);
          openWindow(twitchTabId);
        } else {
          // Уже открыт пикер для ЭТОГО таба — просто фокусируем
          chrome.windows.update(existingWindowId, { focused: true });
        }
      });
    } else {
      openWindow(twitchTabId);
    }

    sendResponse({ ok: true });
    return true;
  }

});

function openWindow(twitchTabId) {
  const url = chrome.runtime.getURL(`picker.html?tabId=${twitchTabId}`);

  chrome.windows.create({
    url    : url,
    type   : 'popup',
    width  : 995,
    height : 640,
    focused: true,
  }, (win) => {
    pickerWindows.set(twitchTabId, win.id);

    chrome.windows.onRemoved.addListener(function onRemoved(windowId) {
      if (windowId === win.id) {
        pickerWindows.delete(twitchTabId);
        chrome.windows.onRemoved.removeListener(onRemoved);
      }
    });
  });
}