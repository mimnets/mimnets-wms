// Widget player for the Assurer slideshow. Apostrophe runs players on page
// load and again whenever an editor re-renders the widget or switches
// between edit and preview mode.
//
// Autoplay state (m1-072): the slideshow plays while autoplay is on and
// nothing holds it. Holds:
//   user      - the visitor pressed Pause; only Play releases it. Set at
//               start under reduced motion and in edit mode.
//   pointer   - the pointer is over the slideshow
//   focus     - keyboard focus is inside the slideshow
//   offscreen - the slideshow is scrolled out of view
//   hidden    - the browser tab is hidden
// Pressing Play also releases pointer and focus, since the visitor is
// pointing at, and focused on, the Play button itself.

const SWIPE_MIN = 40;

export default () => {
  apos.util.widgetPlayers['assurer-slideshow'] = {
    selector: '[data-assurer-slideshow]',
    player(el) {
      const slides = [ ...el.querySelectorAll('[data-slide]') ];
      const dots = [ ...el.querySelectorAll('[data-dot]') ];
      const track = el.querySelector('[data-track]');
      const pauseButton = el.querySelector('[data-pause]');
      if (slides.length < 2) {
        return;
      }
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const editing = !!window.apos?.adminBar?.editMode;
      const autoplay = el.dataset.autoplay === 'true';
      const interval = Math.max(3000, parseInt(el.dataset.interval, 10) || 6000);
      const sliding = el.classList.contains('assurer-slideshow--transition-slide');
      const zooming = el.classList.contains('assurer-slideshow--effect-zoom');
      let current = 0;
      let timer = null;
      const holds = new Set(reduceMotion || editing ? [ 'user' ] : []);

      el.style.setProperty('--assurer-slide-ms', `${interval}ms`);

      const playing = () => autoplay && !holds.size;

      // Reflect the state: timer, pause button, announcements.
      const sync = () => {
        clearInterval(timer);
        timer = null;
        if (playing()) {
          timer = setInterval(
            // Editing re-renders the widget and detaches this element; stop
            // the old timer rather than leaking it.
            () => (el.isConnected ? show(current + 1, 1) : clearInterval(timer)),
            interval
          );
        }
        el.classList.toggle('is-paused', autoplay && !playing());
        // One readable state for tests and agents: static (no autoplay),
        // playing or paused.
        el.dataset.assurerSlideshowState = !autoplay ? 'static' : (playing() ? 'playing' : 'paused');
        // Announce slide changes only when the visitor makes them.
        track.setAttribute('aria-live', playing() ? 'off' : 'polite');
        if (pauseButton) {
          const paused = holds.has('user');
          pauseButton.classList.toggle('is-play', paused);
          pauseButton.setAttribute(
            'aria-label',
            paused ? pauseButton.dataset.labelPlay : pauseButton.dataset.labelPause
          );
        }
      };

      // Place a slide off to one side without animating, so it can slide in.
      const place = (slide, from) => {
        slide.classList.add('is-placing');
        slide.style.setProperty('--assurer-slide-from', from);
        // Read layout so the jump happens before the transition returns.
        slide.getBoundingClientRect();
        slide.classList.remove('is-placing');
      };

      // `direction`: 1 forward, -1 back.
      const show = (index, direction) => {
        const next = (index + slides.length) % slides.length;
        if (sliding && next !== current) {
          place(slides[next], direction > 0 ? '100%' : '-100%');
          slides[current].style.setProperty('--assurer-slide-from', direction > 0 ? '-100%' : '100%');
        }
        const previous = current;
        current = next;
        slides.forEach((slide, i) => {
          const active = i === current;
          // The slide that just left keeps its zoomed image while it fades.
          slide.classList.toggle('is-leaving', i === previous && !active);
          slide.classList.toggle('is-active', active);
          // Inert: Tab and screen readers skip the links of hidden slides.
          slide.inert = !active;
          slide.setAttribute('aria-hidden', active ? 'false' : 'true');
        });
        if (zooming) {
          // Restart the zoom on the shown image, even when it was leaving.
          const image = slides[current].querySelector('img');
          image.style.animation = 'none';
          image.getBoundingClientRect();
          image.style.animation = '';
        }
        dots.forEach((dot, i) => {
          dot.classList.toggle('is-active', i === current);
          dot.setAttribute('aria-current', i === current ? 'true' : 'false');
        });
        // Load the following image now, so a lazy image never flashes in.
        const following = slides[(current + 1) % slides.length].querySelector('img');
        if (following) {
          following.loading = 'eager';
        }
      };

      // A visitor's own move restarts the full interval.
      const go = (index, direction) => {
        show(index, direction);
        sync();
      };
      const hold = (reason) => {
        holds.add(reason);
        sync();
      };
      const release = (...reasons) => {
        reasons.forEach(reason => holds.delete(reason));
        sync();
      };

      el.querySelector('[data-prev]')?.addEventListener('click', () => go(current - 1, -1));
      el.querySelector('[data-next]')?.addEventListener('click', () => go(current + 1, 1));
      dots.forEach(dot => {
        dot.addEventListener('click', () => {
          const index = parseInt(dot.dataset.dot, 10);
          go(index, index < current ? -1 : 1);
        });
      });
      pauseButton?.addEventListener('click', () => {
        if (holds.has('user')) {
          release('user', 'pointer', 'focus');
        } else {
          hold('user');
        }
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
          go(current - 1, -1);
        } else if (e.key === 'ArrowRight') {
          go(current + 1, 1);
        }
      });

      // Swipe on touch screens; vertical page scrolling is left alone
      // (`touch-action: pan-y` in _slideshow.scss).
      let swipeStart = null;
      track.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'mouse') {
          swipeStart = {
            x: e.clientX,
            y: e.clientY
          };
        }
      });
      track.addEventListener('pointerup', (e) => {
        if (!swipeStart) {
          return;
        }
        const dx = e.clientX - swipeStart.x;
        const dy = e.clientY - swipeStart.y;
        swipeStart = null;
        if (Math.abs(dx) >= SWIPE_MIN && Math.abs(dx) > Math.abs(dy)) {
          go(current + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
        }
      });
      track.addEventListener('pointercancel', () => {
        swipeStart = null;
      });

      el.addEventListener('mouseenter', () => hold('pointer'));
      el.addEventListener('mouseleave', () => release('pointer'));
      el.addEventListener('focusin', () => hold('focus'));
      el.addEventListener('focusout', (e) => {
        // Moving focus between the slideshow's own controls keeps it held.
        if (!el.contains(e.relatedTarget)) {
          release('focus');
        }
      });

      if (autoplay) {
        // Nothing moves where nobody looks.
        const observer = new IntersectionObserver(([ entry ]) => {
          if (!el.isConnected) {
            observer.disconnect();
          } else if (entry.isIntersecting) {
            release('offscreen');
          } else {
            hold('offscreen');
          }
        });
        observer.observe(el);
        const onVisibility = () => {
          if (!el.isConnected) {
            document.removeEventListener('visibilitychange', onVisibility);
          } else if (document.hidden) {
            hold('hidden');
          } else {
            release('hidden');
          }
        };
        document.addEventListener('visibilitychange', onVisibility);
      }

      show(0, 1);
      // Turn transitions on after the first frame with the start state (see
      // _slideshow.scss), so nothing fades in at page load (m1-024).
      requestAnimationFrame(() => el.classList.add('is-ready'));
      sync();
    }
  };
};
