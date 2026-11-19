// Main menu items for views/layout.jsx (m1-082, D-CONTENT-27). Two sources,
// one shape: `{ id, text, href, external, current, inBranch, children }`.
//
// - `menuFromGlobal()`: the "Main menu" list in Global Content. An item
//   whose page is unpublished or archived has no href for visitors and is
//   left out with its submenu.
// - `menuFromTree()`: the home page's children and grandchildren (two
//   levels, modules/@apostrophecms/page/index.js); "Hide in Navigation"
//   and, for visitors, unpublished pages are already excluded by core.
//
// `mainMenu()` uses the list when it has a visible item, otherwise the tree.
import { linkHref } from './link.js';

function marks(target, page) {
  const current = Boolean(target && page && page.aposDocId === target.aposDocId);
  const inBranch = Boolean(!current && target?.path && page?.path?.startsWith(`${target.path}/`));
  return {
    current,
    inBranch
  };
}

function treeItem(item, page) {
  return {
    id: item.aposDocId,
    text: item.title,
    href: item._url,
    external: false,
    ...marks(item, page)
  };
}

export function menuFromTree(home, page) {
  return (home?._children || []).map(item => ({
    ...treeItem(item, page),
    children: (item._children || []).map(child => treeItem(child, page))
  }));
}

function globalItem(item, page) {
  const href = linkHref(item);
  if (!item.linkText || !href) {
    return null;
  }
  const isPage = item.linkType !== 'url';
  // A link to a section never marks its page as current, so two sections of
  // the home page do not both light up there.
  const section = isPage && item.section;
  return {
    id: item._id,
    text: item.linkText,
    href: section ? `${href}#${section}` : href,
    external: !isPage,
    ...(isPage && !section
      ? marks(item._linkPage?.[0], page)
      : {
        current: false,
        inBranch: false
      })
  };
}

export function menuFromGlobal(global, page) {
  return (global?.mainMenu || [])
    .map(item => {
      const top = globalItem(item, page);
      return top && {
        ...top,
        children: (item.submenu || [])
          .map(child => globalItem(child, page))
          .filter(Boolean)
      };
    })
    .filter(Boolean);
}

export function mainMenu(home, global, page) {
  const items = menuFromGlobal(global, page);
  return items.length ? items : menuFromTree(home, page);
}
