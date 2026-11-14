import nav from './nav.js';
import motion from './motion.js';
import pageWidth from './page-width.js';

export default () => {
  // Project-level browser JS goes here. Widget behaviour lives with each
  // widget, e.g. modules/assurer-slideshow-widget/ui/src/index.js.
  nav();
  pageWidth();
  motion();
};
