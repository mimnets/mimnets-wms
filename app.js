import 'dotenv/config';
import apostrophe from 'apostrophe';
import { defaultBaseUrl } from './modules/wms-seo/lib/config.js';
import { readDemoSite } from './lib/demo-site.js';

// Stop at startup on an invalid APOS_DEMO_SITE (m1-029); views/layout.jsx
// reads the same value.
readDemoSite(process.env);

apostrophe({
  root: import.meta,
  // Used as the default database name and for session cookie naming.
  // The actual database is selected by APOS_DB_URI (see .env.example).
  shortName: 'mimnets-wms',
  // Public site address for absolute URLs (canonicals, sitemap, JSON-LD).
  // Core replaces it with APOS_BASE_URL when that is set (m1-018; see
  // modules/wms-seo/lib/config.js).
  baseUrl: defaultBaseUrl(process.env),
  modules: {
    // Apostrophe module configuration
    // *******************************
    //
    // NOTE: most configuration occurs in the respective modules' directories.
    // See modules/@apostrophecms/page/index.js for an example.
    //
    // Any modules that are not present by default in Apostrophe must at least
    // have a minimal configuration here to turn them on: `moduleName: {}`
    // ***********************************************************************
    // `className` options set custom CSS classes for Apostrophe core widgets.
    // NOTE: Changing this className will break global style selectors
    // configured in modules/@apostrophecms/styles/index.js
    '@apostrophecms/rich-text-widget': {
      options: {
        className: 'bp-rich-text'
      }
    },
    '@apostrophecms/image-widget': {
      options: {
        className: 'bp-image-widget'
      }
    },
    '@apostrophecms/video-widget': {
      options: {
        className: 'bp-video-widget'
      }
    },
    // `asset` supports the project's build for client-side assets.
    asset: {},
    // use vite for asset bundling and hot module reloading
    '@apostrophecms/vite': {},
    'default-page': {},
    'nested-layout-widget': {},
    // Layout starters with 3, 4 and 6 equal columns (m1-071).
    'layout-3-widget': {},
    'layout-4-widget': {},
    'layout-6-widget': {},
    'nested-column-widget': {},

    // HTTP security headers (official module, MIT) and project security
    // controls: X-Powered-By removal and contact-form rate limiting (m1-011).
    '@apostrophecms/security-headers': {},
    'wms-security': {},

    // Contact forms: @apostrophecms/form (MIT, Community Edition).
    // `@apostrophecms/form` must be registered before its widgets.
    // The file-upload field is deliberately NOT enabled (anonymous uploads).
    '@apostrophecms/form': {},
    '@apostrophecms/form-widget': {},
    '@apostrophecms/form-text-field-widget': {},
    '@apostrophecms/form-textarea-field-widget': {},
    '@apostrophecms/form-select-field-widget': {},
    '@apostrophecms/form-boolean-field-widget': {},
    // Form operations (m1-012): notification email, administrator review
    // and CSV export, retention task. Registered after @apostrophecms/form so
    // its submission handler runs after the submission is stored.
    'wms-forms': {},

    // Project modules. All project-specific modules use the `wms-` prefix
    // (`assurer-` until m1-076) so they are distinguishable from core and
    // starter modules at a glance.
    'wms-hero-widget': {},
    'wms-slideshow-widget': {},
    'wms-product-grid-widget': {},
    'wms-product-card-widget': {},
    // Corporate content model (ADR-0003, m1-014): reusable records and the
    // division and product category page types.
    'wms-product': {},
    'wms-organization': {},
    'wms-person': {},
    'wms-location': {},
    'wms-division-page': {},
    'wms-product-category-page': {},
    // Section and listing widgets (m1-015, CA-2).
    'wms-feature-grid-widget': {},
    'wms-stats-widget': {},
    'wms-product-list-widget': {},
    'wms-organizations-widget': {},
    'wms-people-widget': {},
    'wms-locations-widget': {},
    'wms-downloads-widget': {},
    'wms-gallery-widget': {},
    // SEO (m1-018, CA-3; D-CONTENT-10): official SEO fields and JSON-LD,
    // /sitemap.xml, editor-managed redirects, and the project's robots.txt,
    // noindex and trailing-slash rules (wms-seo).
    '@apostrophecms/seo': {},
    '@apostrophecms/sitemap': {},
    '@apostrophecms/redirect': {},
    'wms-seo': {},
    'wms-demo': {},
    // WordPress import into drafts (m1-067, D-CONTENT-17).
    'wms-wp-import': {},
    // Section patterns as draft pages for editors (m1-079, D-CONTENT-24).
    'wms-patterns': {},
    // Custom themes for admins, offered in Global Styles → Theme (m1-087,
    // D-CONTENT-32).
    'wms-theme': {},
    // AI-assisted design (m1-088, ADR-0005): admin-only, off without a key.
    'wms-design-suggestion': {},
    // Database dashboard, layer 1 (m1-070, D-DB-24): export and import of
    // content (official module, MIT), for site administrators only, and the
    // admin-only dashboard.
    '@apostrophecms/import-export': {},
    'wms-data-dashboard': {},
    // Test-only tasks (CI admin bootstrap); refuse to run outside a
    // temporary SQLite database.
    'wms-test': {}
  }
});
