// Unit tests for the main menu items (m1-082, D-CONTENT-27).
// Run: npm run test:unit
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  mainMenu, menuFromGlobal, menuFromTree
} from '../lib/menu.js';

const style = {
  aposDocId: 'style',
  title: 'Style',
  path: '/home/style',
  _url: '/style'
};
const apparel = {
  aposDocId: 'apparel',
  title: 'Apparels & Textiles',
  path: '/home/style/apparel',
  _url: '/style/apparels-textiles'
};
const home = {
  aposDocId: 'home',
  path: '/home',
  _url: '/',
  _children: [ {
    ...style,
    _children: [ apparel ]
  } ]
};

function pageLink(text, page, extra = {}) {
  return {
    _id: `id-${text}`,
    linkText: text,
    linkType: 'page',
    _linkPage: page ? [ page ] : [],
    ...extra
  };
}

test('menuFromTree: two levels, current page and branch', () => {
  const [ top ] = menuFromTree(home, apparel);
  assert.equal(top.text, 'Style');
  assert.equal(top.href, '/style');
  assert.equal(top.current, false);
  assert.equal(top.inBranch, true);
  assert.equal(top.children[0].current, true);
  assert.deepEqual(menuFromTree(null, apparel), []);
});

test('menuFromGlobal: page, section, external and submenu', () => {
  const global = {
    mainMenu: [
      {
        ...pageLink('Products', home, { section: 'products' }),
        submenu: [ pageLink('Apparels', apparel) ]
      },
      {
        _id: 'ext',
        linkText: 'Pure Naturals',
        linkType: 'url',
        linkUrl: 'https://example.com',
        section: 'ignored'
      }
    ]
  };
  const [ products, external ] = menuFromGlobal(global, apparel);
  assert.equal(products.href, '/#products');
  assert.equal(products.current, false);
  assert.equal(products.inBranch, false);
  assert.equal(products.children[0].current, true);
  assert.equal(external.href, 'https://example.com');
  assert.equal(external.external, true);
  assert.deepEqual(external.children, []);
});

test('menuFromGlobal: an unpublished page drops the item and its submenu', () => {
  const global = {
    mainMenu: [ {
      ...pageLink('Gone', null),
      submenu: [ pageLink('Apparels', apparel) ]
    } ]
  };
  assert.deepEqual(menuFromGlobal(global, apparel), []);
});

test('mainMenu: the list when it has a visible item, otherwise the tree', () => {
  assert.equal(mainMenu(home, { mainMenu: [ pageLink('Style', style) ] }, apparel)[0].inBranch, true);
  assert.equal(mainMenu(home, { mainMenu: [ pageLink('Gone', null) ] }, apparel)[0].text, 'Style');
  assert.equal(mainMenu(home, {}, apparel)[0].text, 'Style');
});
