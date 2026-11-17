// Entrance animation (m1-072). Widgets whose editors chose an "Entrance
// animation" style carry `wms-enter-fade` or `wms-enter-rise` on their
// styles wrapper (lib/motion.js). Content is hidden only once this script has
// added `wms-motion` to <html>, so without JavaScript, when printing,
// under reduced motion and in edit mode nothing is hidden and nothing moves.
//
// States per widget: shown at once (in view at page load: `is-visible` and
// `is-instant`), or waiting below the fold until it scrolls into view, then
// animated in (`is-visible`), once. `data-wms-enter-state` (waiting,
// shown) says which, for tests and agents.

const SELECTOR = '.wms-enter-fade, .wms-enter-rise';

let observer = null;

function show(el, ...classes) {
  el.classList.add('is-visible', ...classes);
  el.dataset.wmsEnterState = 'shown';
}

function reveal(el) {
  show(el);
  observer?.unobserve(el);
}

function setup() {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const editing = !!window.apos?.adminBar?.editMode;
  observer?.disconnect();
  observer = null;
  if (reduceMotion || editing || !('IntersectionObserver' in window)) {
    root.classList.remove('wms-motion');
    return;
  }
  const waiting = [ ...document.querySelectorAll(SELECTOR) ]
    .filter(el => !el.classList.contains('is-visible'));
  // Anything already in view shows at once, before content is hidden, so
  // nothing on screen blinks out and back in.
  const inView = el => el.getBoundingClientRect().top < window.innerHeight;
  waiting.filter(inView).forEach(el => show(el, 'is-instant'));
  observer = new IntersectionObserver(entries => {
    entries.filter(entry => entry.isIntersecting).forEach(entry => reveal(entry.target));
  }, { rootMargin: '0px 0px -10% 0px' });
  waiting.filter(el => !el.classList.contains('is-visible'))
    .forEach(el => {
      el.dataset.wmsEnterState = 'waiting';
      observer.observe(el);
    });
  root.classList.add('wms-motion');
}

export default () => {
  // On page load and after every refresh (editing, edit/preview switch).
  apos.util.onReady(setup);
};
