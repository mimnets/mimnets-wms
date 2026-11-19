// Organizations (m1-015, CA-2): all published group organizations, or
// hand-picked ones, as cards or a compact list. Logos sit next to the name,
// so they use empty alt text (ADR-0003 §7).
import {
  anchorField, introField, limitField, loadListed, modeField
} from '../../lib/listing.js';
import { bandStyle } from '../../lib/band.js';
import { entranceStyle } from '../../lib/motion.js';

export default {
  extend: '@apostrophecms/widget-type',
  options: {
    label: 'project:organizationsWidget',
    description: 'project:organizationsWidgetDescription',
    icon: 'domain-icon'
  },
  icons: {
    'domain-icon': 'Domain'
  },
  styles: {
    add: {
      // Colour, gradient or photo with overlay behind the section, and the
      // inner space that keeps content off its edges (m1-080, D-CONTENT-25).
      // Core presets, as on the layout widget.
      background: 'background',
      padding: 'padding',
      // m1-081: background edge to edge, content at page width.
      band: bandStyle,
      entrance: entranceStyle
    }
  },
  fields: {
    add: {
      anchor: anchorField,
      intro: introField,
      mode: modeField([
        [ 'all', 'project:modeAll' ],
        [ 'pick', 'project:modePick' ]
      ]),
      _organizations: {
        type: 'relationship',
        label: 'project:organizations',
        help: 'project:pickHelp',
        withType: 'wms-organization',
        max: 24,
        withRelationships: [ '_logo' ],
        if: { mode: 'pick' }
      },
      limit: limitField({ mode: 'all' }),
      layout: {
        type: 'select',
        label: 'project:layout',
        def: 'cards',
        choices: [
          {
            label: 'project:layoutCards',
            value: 'cards'
          },
          {
            label: 'project:layoutList',
            value: 'list'
          }
        ]
      }
    }
  },
  extendMethods(self) {
    return {
      async load(_super, req, widgets) {
        await _super(req, widgets);
        await loadListed(widgets, {
          pickField: '_organizations',
          query: () => self.apos.modules['wms-organization'].find(req)
            .areas(false)
            .relationships([ '_logo' ])
        });
      }
    };
  }
};
