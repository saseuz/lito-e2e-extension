import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import assert from 'node:assert/strict';

function setup() {
  const windows = [];
  let installed, clicked, menu;
  const chrome = {
    runtime: { onInstalled: { addListener(fn) { installed = fn; } }, getURL: path => `chrome-extension://lito/${path}` },
    contextMenus: {
      removeAll(fn) { fn(); }, create(value) { menu = value; },
      onClicked: { addListener(fn) { clicked = fn; } },
    },
    windows: { create(value) { windows.push(value); } },
  };
  runInNewContext(readFileSync(new URL('../public/background.js', import.meta.url), 'utf8'), { chrome, URLSearchParams });
  return { installed, clicked, windows, menu: () => menu };
}

test('registers a selection-only menu and passes the selected word safely', () => {
  const app = setup();
  app.installed();
  assert.equal(app.menu().contexts.join(','), 'selection');
  app.clicked({ menuItemId: 'lito-lookup-selection', selectionText: '  cat & dog?#  ', pageUrl: 'https://private.example' });
  const window = app.windows[0];
  assert.equal(window.type, 'popup');
  const url = new URL(window.url);
  assert.equal(url.pathname, '/index.html');
  assert.equal(new URLSearchParams(url.hash.slice(1)).get('word'), 'cat & dog?#');
  assert.ok(!window.url.includes('private.example'));
});

test('ignores unrelated or empty selections and routes oversized text to a local error', () => {
  const app = setup();
  app.clicked({ menuItemId: 'other', selectionText: 'cat' });
  app.clicked({ menuItemId: 'lito-lookup-selection', selectionText: ' ' });
  assert.equal(app.windows.length, 0);
  app.clicked({ menuItemId: 'lito-lookup-selection', selectionText: 'x'.repeat(256) });
  assert.ok(app.windows[0].url.endsWith('#selectionError=too-long'));
});
