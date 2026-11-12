import { entranceStyle } from '../../../lib/motion.js';

export default {
  options: {
    // The core layout opens with 2 columns; `layout-3`, `layout-4` and
    // `layout-6` are the other starters (m1-071).
    label: 'project:layout2'
  },
  styles: {
    add: {
      width: 'width',
      alignment: 'alignment',
      // Background colour, gradient or image for the whole layout (m1-071).
      background: 'background',
      // m1-072: animate the whole layout, or one column (layout-column-widget).
      entrance: entranceStyle
    }
  }
};
