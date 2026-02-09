// docusaurus.config.ts
import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'KB Manual',
  tagline: 'Decision registry and contract catalog for a multi repo pipeline ecosystem',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  // If you deploy on Vercel with a custom domain, keep baseUrl as "/"
  url: 'https://kb-contracts.matuteiglesias.link',
  baseUrl: '/',

  // Useful even if not using GitHub Pages
  organizationName: 'matuteiglesias',
  projectName: 'kb-manual',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: 'docs',
          // Change to your repo once created
          editUrl: 'https://github.com/matuteiglesias/kb-manual/tree/main/',
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
        },
        // If you do not want a blog at all, set blog: false
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },


    navbar: {
      title: 'KB Manual',
      logo: { alt: 'KB Manual', src: 'img/logo.svg' },
      items: [
        { type: 'docSidebar', sidebarId: 'tutorialSidebar', position: 'left', label: 'Manual' },
        { type: 'doc', docId: 'intro', label: 'Start', position: 'left' },
        { href: 'https://github.com/matuteiglesias/kb-manual', label: 'GitHub', position: 'right' },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Navigate',
          items: [
            { label: 'Home', to: '/docs/00_home/home' },
            { label: 'Ecosystem registry', to: '/docs/01_registry-governance/ecosystem-map-and-registry' },
            { label: 'Integration seams', to: '/docs/02_bus-contracts/integration-seams-and-allowed-io' },
            { label: 'Glossary', to: '/docs/01_registry-governance/glossary' },
          ],
        },
        {
          title: 'Contracts',
          items: [
            { label: 'Event Bus', to: '/docs/02_bus-contracts/event-bus-contract' },
            { label: 'Sessions Bus', to: '/docs/02_bus-contracts/sessions-bus-contract' },
            { label: 'Summary Bus', to: '/docs/02_bus-contracts/summary-bus-contract' },
            { label: 'Manifests', to: '/docs/03_shared-conventions/manifests-and-integrity-rules' },
            { label: 'Run records', to: '/docs/03_shared-conventions/run-record-contract' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Matias Iglesias.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
