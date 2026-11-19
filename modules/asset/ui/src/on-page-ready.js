// Runs fn when the page is ready and after every editor refresh (m1-083).
// apos.util.onReady does the same, but subscribes to `refreshed` in a timer
// that can fire before the admin bundle creates apos.bus (release builds), and
// then never subscribes. DOMContentLoaded comes after every module script has
// run, so apos.bus exists by then for signed-in users.
export default function onPageReady(fn) {
  const start = () => {
    fn();
    window.apos.bus?.$on('refreshed', fn);
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    setTimeout(start, 0);
  }
}
