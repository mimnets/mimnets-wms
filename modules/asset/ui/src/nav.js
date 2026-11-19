// Main menu behaviour (m1-014), a disclosure pattern rather than an ARIA
// menu: links stay ordinary links in the Tab order.
//
// - Below 1024 px a "Menu" button opens and closes the whole menu.
// - Each parent has its own link and a separate button that opens its
//   submenu (click, tap, Enter or Space). Only one submenu is open at a time.
// - On desktops with a mouse, hovering a parent also shows its submenu (CSS).
// - Escape closes the open submenu (or the mobile menu) and returns focus to
//   the button that opened it; clicking outside closes everything.
// Without JavaScript the buttons stay hidden and every link is visible.
//
// An editor refresh replaces the header, so each new nav is enhanced again
// (m1-083). Page-wide listeners are added once and act on the navs present.

import onPageReady from './on-page-ready.js';

const DESKTOP = '(min-width: 1024px)';
const READY = '[data-wms-nav-ready]';

function setExpanded(button, open) {
  button.setAttribute('aria-expanded', open ? 'true' : 'false');
  button.closest('li')?.classList.toggle('is-open', open);
}

function setMenu(nav, open) {
  nav.querySelector('[data-wms-nav-toggle]').setAttribute('aria-expanded', open ? 'true' : 'false');
  nav.classList.toggle('is-open', open);
}

function closeSubmenus(nav, except) {
  nav.querySelectorAll('[data-wms-submenu-toggle]').forEach(button => {
    if (button !== except) {
      setExpanded(button, false);
    }
  });
}

function enhance(nav) {
  if (nav.dataset.wmsNavReady) {
    return;
  }
  nav.dataset.wmsNavReady = 'true';
  nav.classList.add('wms-nav--enhanced');

  const toggle = nav.querySelector('[data-wms-nav-toggle]');
  const expanders = [ ...nav.querySelectorAll('[data-wms-submenu-toggle]') ];
  toggle.hidden = false;
  expanders.forEach(button => {
    button.hidden = false;
  });

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    setMenu(nav, open);
    if (!open) {
      closeSubmenus(nav);
    }
  });

  expanders.forEach(button => {
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      closeSubmenus(nav, button);
      setExpanded(button, open);
    });
  });

  nav.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') {
      return;
    }
    const openButton = expanders.find(b => b.getAttribute('aria-expanded') === 'true');
    if (openButton) {
      setExpanded(openButton, false);
      openButton.focus();
    } else if (toggle.getAttribute('aria-expanded') === 'true') {
      setMenu(nav, false);
      toggle.focus();
    }
  });

  // Keyboard users tabbing out of an open desktop submenu close it.
  nav.addEventListener('focusout', (event) => {
    if (!window.matchMedia(DESKTOP).matches) {
      return;
    }
    const item = event.target.closest('.wms-nav__item--parent');
    if (item && !item.contains(event.relatedTarget)) {
      const button = item.querySelector('[data-wms-submenu-toggle]');
      if (button) {
        setExpanded(button, false);
      }
    }
  });
}

export default () => {
  document.addEventListener('click', (event) => {
    document.querySelectorAll(READY).forEach(nav => {
      if (!nav.contains(event.target)) {
        closeSubmenus(nav);
        if (!window.matchMedia(DESKTOP).matches) {
          setMenu(nav, false);
        }
      }
    });
  });

  // Switching between the mobile and desktop layouts starts closed.
  window.matchMedia(DESKTOP).addEventListener('change', () => {
    document.querySelectorAll(READY).forEach(nav => {
      setMenu(nav, false);
      closeSubmenus(nav);
    });
  });

  onPageReady(() => {
    document.querySelectorAll('[data-wms-nav]').forEach(enhance);
  });
};
