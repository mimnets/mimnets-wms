// Slideshow (m1-072). Each slide is an image from the media library plus,
// optionally, banner text: eyebrow, heading, text and up to two buttons over
// an overlay. A slide without text is an image slide with an optional
// caption. Slides are reordered by dragging them in the widget editor.
// Client behaviour lives in ui/src/index.js.
import { requireAltText } from '../../lib/alt-text.js';
import { bannerButtons } from '../../lib/banner.js';
import { entranceStyle } from '../../lib/motion.js';

const choices = (...pairs) => pairs.map(([ value, label ]) => ({
  label,
  value
}));

export default {
  extend: '@apostrophecms/widget-type',
  options: {
    label: 'Assurer Slideshow',
    description: 'Rotating images, or full banners with headline, text and buttons.',
    icon: 'view-carousel-icon'
  },
  icons: {
    'view-carousel-icon': 'ViewCarousel'
  },
  fields: {
    add: {
      slides: {
        type: 'array',
        label: 'Slides',
        titleField: 'heading',
        min: 1,
        max: 12,
        required: true,
        fields: {
          add: {
            _image: {
              type: 'relationship',
              label: 'Image',
              withType: '@apostrophecms/image',
              max: 1,
              required: true
            },
            eyebrow: {
              type: 'string',
              label: 'Eyebrow text',
              help: 'Optional short label above the heading.'
            },
            heading: {
              type: 'string',
              label: 'Heading',
              help: 'Optional. Leave empty, with no text, for an image-only slide.'
            },
            headingLevel: {
              type: 'select',
              label: 'Heading level',
              help: 'A page has one H1. Use H1 only when this slideshow is the page title.',
              def: 'h2',
              choices: choices(
                [ 'h1', 'H1' ],
                [ 'h2', 'H2' ],
                [ 'h3', 'H3' ],
                [ 'p', 'Not a heading (bold text)' ]
              )
            },
            text: {
              type: 'string',
              label: 'Text',
              textarea: true,
              max: 300
            },
            buttons: bannerButtons(),
            textAcross: {
              type: 'select',
              label: 'Text position across',
              def: 'left',
              choices: choices(
                [ 'left', 'Left' ],
                [ 'center', 'Centre' ],
                [ 'right', 'Right' ]
              )
            },
            textDown: {
              type: 'select',
              label: 'Text position down',
              def: 'middle',
              choices: choices(
                [ 'top', 'Top' ],
                [ 'middle', 'Middle' ],
                [ 'bottom', 'Bottom' ]
              )
            },
            overlay: {
              type: 'select',
              label: 'Text contrast overlay',
              help: 'Used only when the slide has text.',
              def: 'dark',
              choices: choices(
                [ 'dark', 'Dark' ],
                [ 'light', 'Light' ]
              )
            },
            caption: {
              type: 'string',
              label: 'Caption',
              help: 'Optional line at the bottom of the image, e.g. a photo credit.'
            }
          }
        }
      },
      autoplay: {
        type: 'boolean',
        label: 'Advance automatically',
        help: 'Visitors can always pause. It starts paused for visitors who prefer reduced motion, and while you edit the page.',
        def: true
      },
      interval: {
        type: 'integer',
        label: 'Seconds per slide',
        def: 6,
        min: 3,
        max: 30,
        if: {
          autoplay: true
        }
      },
      height: {
        type: 'select',
        label: 'Height',
        help: 'The smallest height. A slide grows when its text needs more room. "Tall" applies on full-width pages, not in a layout column.',
        def: 'short',
        choices: choices(
          [ 'short', 'Short (16:7)' ],
          [ 'medium', 'Medium (16:9)' ],
          [ 'tall', 'Tall (75% of the screen height)' ]
        )
      },
      width: {
        type: 'select',
        label: 'Width',
        help: '"Full width" applies on full-width pages, not in a layout column.',
        def: 'content',
        choices: choices(
          [ 'content', 'Content width' ],
          [ 'full', 'Full width (edge to edge)' ]
        )
      },
      transition: {
        type: 'select',
        label: 'Transition',
        def: 'fade',
        choices: choices(
          [ 'fade', 'Fade' ],
          [ 'slide', 'Slide' ]
        )
      },
      imageEffect: {
        type: 'select',
        label: 'Image effect',
        help: 'Off for visitors who prefer reduced motion, and when the slideshow is paused.',
        def: 'none',
        choices: choices(
          [ 'none', 'None' ],
          [ 'zoom', 'Slow zoom' ]
        )
      },
      textEntrance: {
        type: 'select',
        label: 'Text entrance',
        help: 'How slide text appears when its slide is shown. It moves once, then stays still.',
        def: 'rise',
        choices: choices(
          [ 'none', 'None' ],
          [ 'fade', 'Fade in' ],
          [ 'rise', 'Rise' ]
        )
      },
      controls: {
        type: 'select',
        label: 'Controls',
        def: 'both',
        choices: choices(
          [ 'both', 'Arrows and dots' ],
          [ 'dots', 'Dots only' ],
          [ 'arrows', 'Arrows only' ]
        )
      }
    },
    group: {
      slides: {
        label: 'Slides',
        fields: [ 'slides' ]
      },
      settings: {
        label: 'Slideshow settings',
        fields: [
          'autoplay', 'interval', 'height', 'width', 'transition',
          'imageEffect', 'textEntrance', 'controls'
        ]
      }
    }
  },
  styles: {
    add: {
      entrance: entranceStyle
    }
  },
  extendMethods(self) {
    // Slide images are informative: each needs alt text (m1-015).
    const checkAltText = requireAltText(self, 'slides', widget =>
      (widget.slides || []).flatMap(slide => slide._image || []));
    return {
      async sanitize(_super, req, input, options, convertOptions = {}) {
        const output = await checkAltText(_super, req, input, options, convertOptions);
        // One H1 per page; within one slideshow that can be checked here.
        const h1 = (output.slides || [])
          .filter(slide => slide.heading && slide.headingLevel === 'h1');
        if (h1.length > 1) {
          const error = self.apos.error('invalid', req.t('project:slideshowOneH1'));
          error.path = 'slides';
          throw [ error ];
        }
        return output;
      }
    };
  }
};
