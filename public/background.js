const MENU_ID = 'lito-lookup-selection';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: 'Look up “%s” in Lito E2E',
      contexts: ['selection'],
    });
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== MENU_ID) return;
  const word = (info.selectionText || '').normalize('NFC').trim();
  if (!word) return;
  // Pass only the selected text, never the page URL or surrounding content.
  const fragment = new URLSearchParams(word.length > 255
    ? { selectionError: 'too-long' }
    : { word });
  chrome.windows.create({
    url: `${chrome.runtime.getURL('index.html')}#${fragment}`,
    type: 'popup', width: 540, height: 760, focused: true,
  });
});
