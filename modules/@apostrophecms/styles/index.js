// modules/@apostrophecms/styles/index.js

import { createHash } from 'node:crypto';
import {
  overrides, themeCss, themes
} from '../../../lib/themes.js';

export default {
  // Global Styles are site-wide: admins only (D-M0-11, m1-022). Core
  // permission options, enforced server side by apos.permission.can(), so an
  // editor's API write is refused and the palette icon is hidden.
  options: {
    editRole: 'admin',
    publishRole: 'admin'
  },
  styles: {
    add: {
      // ============================================
      // THEME PRESET (m1-074, D-CONTENT-23)
      // ============================================

      // Core `class: true`: the value becomes a class on <body> (stored on
      // the global doc as `stylesClasses`, so visitors get the published
      // choice). The presets and their values are data in lib/themes.js
      // (m1-084, D-CONTENT-29); the stylesheet route below serves them.
      // Classic is the empty value: no class. An unknown value has no rules
      // and renders as Classic.
      theme: {
        type: 'select',
        label: 'Theme',
        help: 'The overall look of the site. The settings in the other tabs apply on top of every theme.',
        class: true,
        def: '',
        choices: themes.map(theme => ({
          label: theme.label,
          value: theme.className
        }))
      },

      // ============================================
      // HEADER AND FOOTER STYLE (m1-085, D-CONTENT-30)
      // ============================================

      // The theme sets the default; a choice here wins over it, also after
      // the theme changes. Classes on <body> like Theme; the rules are in the
      // theme stylesheet (`overrides` in lib/themes.js).
      headerStyle: {
        type: 'select',
        label: 'Header Style',
        help: 'Where the logo sits. "Theme default" uses the theme\'s choice; any other choice wins over the theme.',
        class: true,
        def: '',
        choices: [
          {
            label: 'Theme default',
            value: ''
          },
          ...overrides.headerStyle.map(choice => ({
            label: choice.label,
            value: choice.className
          }))
        ]
      },
      footerStyle: {
        type: 'select',
        label: 'Footer Style',
        help: 'A plain footer, or a full-width coloured band in the theme\'s colours. "Theme default" uses the theme\'s choice; any other choice wins over the theme.',
        class: true,
        def: '',
        choices: [
          {
            label: 'Theme default',
            value: ''
          },
          ...overrides.footerStyle.map(choice => ({
            label: choice.label,
            value: choice.className
          }))
        ]
      },

      // ============================================
      // TYPOGRAPHY CONTROLS
      // ============================================

      // No body font control (m1-021): the brand font is fixed by the
      // --wms-font-body token, so editors cannot change it (D-M0-11).
      lineHeight: {
        type: 'range',
        label: 'Line Height',
        selector: 'body',
        property: 'line-height',
        min: 1,
        max: 2.5,
        step: 0.1,
        def: 1.5
      },
      letterSpacing: {
        type: 'range',
        label: 'Letter Spacing',
        selector: 'body',
        property: 'letter-spacing',
        min: -0.05,
        max: 0.2,
        step: 0.01,
        def: 0,
        unit: 'em'
      },

      // ============================================
      // RESPONSIVE TYPOGRAPHY
      // Demonstrates media query usage for device-specific styling
      // ============================================

      bodyFontSizeMobile: {
        type: 'range',
        label: 'Body Font Size (Mobile)',
        selector: 'body',
        property: 'font-size',
        min: 14,
        max: 18,
        step: 1,
        def: 16,
        unit: 'px',
        mediaQuery: '(max-width: 767px)'  // Mobile breakpoint
      },
      bodyFontSizeTablet: {
        type: 'range',
        label: 'Body Font Size (Tablet)',
        selector: 'body',
        property: 'font-size',
        min: 14,
        max: 20,
        step: 1,
        def: 16,
        unit: 'px',
        mediaQuery: '(min-width: 768px) and (max-width: 1023px)'  // Tablet breakpoint
      },
      bodyFontSizeDesktop: {
        type: 'range',
        label: 'Body Font Size (Desktop)',
        selector: 'body',
        property: 'font-size',
        min: 14,
        max: 22,
        step: 1,
        def: 18,
        unit: 'px',
        mediaQuery: '(min-width: 1024px)'  // Desktop breakpoint
      },

      // ============================================
      // MAIN LAYOUT CONTROLS
      // Using CSS custom property for flexible control
      // ============================================

      contentMaxWidth: {
        type: 'range',
        label: 'Content Max Width',
        help: 'The width of the header, the page content and the footer. Full-width bands keep their content inside this width.',
        selector: ':root',
        property: '--content-max-width',
        min: 800,
        max: 1600,
        step: 50,
        def: 1200,
        unit: 'px'
      },

      // ============================================
      // RESPONSIVE SPACING
      // Shows how spacing can adapt to screen size
      // ============================================

      mainPaddingMobile: {
        type: 'range',
        label: 'Main Padding (Mobile)',
        selector: 'main',
        property: [ 'padding-left', 'padding-right' ],
        min: 0,
        max: 32,
        step: 4,
        def: 16,
        unit: 'px',
        mediaQuery: '(max-width: 767px)'
      },
      mainPaddingDesktop: {
        type: 'range',
        label: 'Main Padding (Desktop)',
        selector: 'main',
        property: [ 'padding-left', 'padding-right' ],
        min: 0,
        max: 64,
        step: 8,
        def: 32,
        unit: 'px',
        mediaQuery: '(min-width: 768px)'
      },

      // ============================================
      // IMAGE WIDGET GLOBAL DEFAULTS
      //
      // NOTE: These selectors depend on the className options
      // configured in app.js for each widget. If you change those
      // className values, you must update these selectors accordingly.
      //
      // Current widget classNames (from app.js):
      //   - @apostrophecms/image-widget: 'bp-image-widget'
      //   - @apostrophecms/video-widget: 'bp-video-widget'
      //   - @apostrophecms/rich-text-widget: 'bp-rich-text'
      // ============================================

      // ============================================
      // IMAGE WIDGET GLOBAL DEFAULTS
      // ============================================

      imageDefaultWidth: {
        type: 'range',
        label: 'Default Width',
        selector: '.bp-image-widget',
        property: 'width',
        min: 0,
        max: 100,
        step: 10,
        def: 100,
        unit: '%'
      },
      imageDefaultAlignment: {
        type: 'select',
        label: 'Default Alignment',
        selector: '.bp-image-widget',
        class: true,
        choices: [
          {
            label: 'Left',
            value: 'apos-left'
          },
          {
            label: 'Center',
            value: 'apos-center'
          },
          {
            label: 'Right',
            value: 'apos-right'
          }
        ]
      },

      // Responsive image sizing example
      imageMaxWidthMobile: {
        type: 'range',
        label: 'Max Width (Mobile)',
        selector: '.bp-image-widget',
        property: 'max-width',
        min: 200,
        max: 600,
        step: 50,
        def: 400,
        unit: 'px',
        mediaQuery: '(max-width: 767px)'
      },

      // ============================================
      // VIDEO WIDGET GLOBAL DEFAULTS
      // ============================================

      videoDefaultWidth: {
        type: 'range',
        label: 'Default Width',
        selector: '.bp-video-widget',
        property: 'width',
        min: 0,
        max: 100,
        step: 10,
        def: 100,
        unit: '%'
      },
      videoDefaultAlignment: {
        type: 'select',
        label: 'Default Alignment',
        selector: '.bp-video-widget',
        class: true,
        choices: [
          {
            label: 'Left',
            value: 'apos-left'
          },
          {
            label: 'Center',
            value: 'apos-center'
          },
          {
            label: 'Right',
            value: 'apos-right'
          }
        ]
      },

      // ============================================
      // RICH TEXT WIDGET GLOBAL DEFAULTS
      // ============================================

      richTextDefaultWidth: {
        type: 'range',
        label: 'Default Width',
        selector: '.bp-rich-text',
        property: 'width',
        min: 0,
        max: 100,
        step: 10,
        def: 100,
        unit: '%'
      },
      richTextDefaultMargin: {
        preset: 'margin',
        label: 'Default Margin',
        selector: '.bp-rich-text'
      },
      richTextDefaultPadding: {
        preset: 'padding',
        label: 'Default Padding',
        selector: '.bp-rich-text'
      },

      // ============================================
      // LAYOUT WIDGET GLOBAL DEFAULTS
      // ============================================

      layoutDefaultWidth: {
        type: 'range',
        label: 'Default Width',
        selector: '.layout-widget',
        property: 'width',
        min: 0,
        max: 100,
        step: 10,
        def: 100,
        unit: '%'
      },

      // Responsive layout spacing
      layoutGapMobile: {
        type: 'range',
        label: 'Column Gap (Mobile)',
        selector: '.layout-widget',
        property: 'gap',
        min: 0,
        max: 32,
        step: 4,
        def: 16,
        unit: 'px',
        mediaQuery: '(max-width: 767px)'
      },
      layoutGapDesktop: {
        type: 'range',
        label: 'Column Gap (Desktop)',
        selector: '.layout-widget',
        property: 'gap',
        min: 0,
        max: 64,
        step: 8,
        def: 32,
        unit: 'px',
        mediaQuery: '(min-width: 768px)'
      }
    },

    // ============================================
    // INTERFACE ORGANIZATION
    // ============================================

    group: {
      // Tab 0: Theme (m1-074)
      themeTab: {
        label: 'Theme',
        group: {
          preset: {
            label: 'Theme',
            fields: [ 'theme' ]
          }
        }
      },

      // Tab 1: Typography
      typography: {
        label: 'Typography',
        group: {
          // Section: Base typography
          base: {
            label: 'Base Typography',
            fields: [ 'lineHeight', 'letterSpacing' ]
          },
          // Section: Responsive typography
          responsive: {
            label: 'Responsive Font Sizes',
            fields: [
              'bodyFontSizeMobile',
              'bodyFontSizeTablet',
              'bodyFontSizeDesktop'
            ]
          }
        }
      },

      // Tab 2: Layout
      layout: {
        label: 'Layout',
        group: {
          // Section: Container
          container: {
            label: 'Container',
            fields: [ 'contentMaxWidth' ]
          },
          headerFooter: {
            label: 'Header and Footer',
            fields: [ 'headerStyle', 'footerStyle' ]
          },
          // Section: Responsive spacing
          spacing: {
            label: 'Responsive Spacing',
            fields: [
              'mainPaddingMobile',
              'mainPaddingDesktop'
            ]
          }
        }
      },

      // Tab 3: Widget Defaults
      widgetDefaults: {
        label: 'Widget Defaults',
        group: {
          imageDefaults: {
            label: 'Image Widgets',
            fields: [
              'imageDefaultWidth',
              'imageDefaultAlignment',
              'imageMaxWidthMobile'
            ]
          },
          videoDefaults: {
            label: 'Video Widgets',
            fields: [
              'videoDefaultWidth',
              'videoDefaultAlignment'
            ]
          },
          richTextDefaults: {
            label: 'Rich Text Widgets',
            fields: [
              'richTextDefaultWidth',
              'richTextDefaultMargin',
              'richTextDefaultPadding'
            ]
          },
          layoutDefaults: {
            label: 'Layout Widgets',
            fields: [
              'layoutDefaultWidth',
              'layoutGapMobile',
              'layoutGapDesktop'
            ]
          }
        }
      }
    }
  },
  init(self) {
    // The theme stylesheet (m1-084): every preset, built once at start, linked
    // from <head> on every page. The URL carries a hash of the CSS, so it can
    // be cached for a year and a release with changed themes gets a new URL.
    self.wmsThemeCss = themeCss(themes);
    self.wmsThemeVersion = createHash('sha256').update(self.wmsThemeCss).digest('hex').slice(0, 12);
    self.apos.template.prepend('head', '@apostrophecms/styles:wmsThemeStylesheet');
  },
  apiRoutes(self) {
    return {
      get: {
        // GET /api/v1/@apostrophecms/styles/wms-themes, public: the same
        // stylesheet for everyone, no user or document data.
        wmsThemes(req) {
          req.res.setHeader('Content-Type', 'text/css');
          req.res.setHeader('Cache-Control', 'public, max-age=31557600, immutable');
          return self.wmsThemeCss;
        }
      }
    };
  },
  components(self) {
    return {
      wmsThemeStylesheet(req) {
        return {
          href: `${self.apos.prefix || ''}${self.action}/wms-themes?version=${self.wmsThemeVersion}`
        };
      }
    };
  },
  handlers(self) {
    return {
      // Rule: every global doc carries the visitor stylesheet and body classes
      // (`stylesStylesheet`, `stylesClasses`), so visitors see the same Global
      // Styles and preset as editors (m1-080, D-CONTENT-25).
      //
      // Core 4.34.0 writes them only in the styles doc's afterSave. On a new
      // database the styles singleton is inserted before the global doc
      // (module order in apostrophe/defaults.js), so that write finds nothing
      // and visitors get browser defaults until an admin saves Global Styles.
      // This runs after core's insertRequired (same event, earlier module),
      // at every dev start and at `migration:migrate`. Where the stylesheet
      // is missing it saves the styles doc once with the official update, so
      // core itself writes it; afterwards it does nothing. Remove when core
      // inserts the global doc first.
      '@apostrophecms/migration:requirements': {
        async ensureVisitorStylesheet() {
          for (const locale of Object.keys(self.apos.i18n.locales)) {
            for (const mode of [ 'draft', 'published' ]) {
              const req = self.apos.task.getReq({
                locale,
                mode
              });
              const global = await self.apos.global.findGlobal(req);
              if (!global || global.stylesStylesheet) {
                continue;
              }
              const styles = await self.find(req, {}).toObject();
              if (styles) {
                await self.update(req, styles);
              }
            }
          }
        }
      }
    };
  }
};
