// background.js — service worker
// Handles opening the popout picker window.

let pickerWindowId = null; // only one popout at a time

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
 
  if (msg.type === 'OPEN_POPOUT') {
    const twitchTabId = sender.tab?.id;
    if (!twitchTabId) return;

    // If already open — focus it instead of opening a second one
    if (pickerWindowId !== null) {
      chrome.windows.get(pickerWindowId, {}, (win) => {
        if (chrome.runtime.lastError || !win) {
          pickerWindowId = null;
          openWindow(twitchTabId);
        } else {
          chrome.windows.update(pickerWindowId, { focused: true });
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
    type   : 'popup',       // frameless popout window — just like Twitch popout chat
    width  : 995,
    height : 640,
    focused: true,
  }, (win) => {
    pickerWindowId = win.id;

    // Clean up when window is closed
    chrome.windows.onRemoved.addListener(function onRemoved(windowId) {
      if (windowId === pickerWindowId) {
        pickerWindowId = null;
        chrome.windows.onRemoved.removeListener(onRemoved);
      }
    });
  });
}
