import { columnArea } from '../../../lib/area.js';
import { entranceStyle } from '../../../lib/motion.js';

export default {
  // Background colour, gradient or image per column (m1-071); entrance
  // animation per column (m1-072).
  styles: {
    add: {
      background: 'background',
      entrance: entranceStyle
    }
  },
  fields: {
    add: {
      content: {
        type: 'area',
        options: columnArea
      }
    }
  }
};
