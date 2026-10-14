const MENU_ID = 'lito-lookup-selection';
// Firefox/Safari expose promise-based browser APIs; Chromium also supports chrome.
const extension = globalThis.browser || globalThis.chrome;

extension.runtime.onInstalled.addListener(async () => {
  const createMenu = () => {
    extension.contextMenus.create({
      id: MENU_ID,
      title: 'Look up “%s” in Lito Dictionary',
      contexts: ['selection'],
    });
  };
  if (globalThis.browser) {
    await extension.contextMenus.removeAll();
    createMenu();
  } else {
    extension.contextMenus.removeAll(createMenu);
  }
});

extension.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== MENU_ID) return;
  const word = (info.selectionText || '').normalize('NFC').trim();
  if (!word) return;
  // Pass only the selected text, never the page URL or surrounding content.
  const fragment = new URLSearchParams(word.length > 255
    ? { selectionError: 'too-long' }
    : { word });
  extension.windows.create({
    url: `${extension.runtime.getURL('index.html')}#${fragment}`,
    type: 'popup', width: 540, height: 760, focused: true,
  });
});
