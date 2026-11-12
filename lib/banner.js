// Shared banner fields (m1-072): the call-to-action buttons used by the hero
// and by banner slides in the slideshow. Render them with
// lib/views/BannerButtons.jsx.
import { linkFields } from './link.js';

// The buttons array: up to two links, each with a style.
export function bannerButtons() {
  return {
    type: 'array',
    label: 'Buttons',
    titleField: 'linkText',
    max: 2,
    fields: {
      add: {
        ...linkFields(),
        style: {
          type: 'select',
          label: 'Style',
          def: 'primary',
          choices: [
            {
              label: 'Primary',
              value: 'primary'
            },
            {
              label: 'Outline',
              value: 'outline'
            }
          ]
        }
      }
    }
  };
}
