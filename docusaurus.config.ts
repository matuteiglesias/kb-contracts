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

  onBrokenLinks: 'throw',
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
      logo: {
        alt: 'KB Manual',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Manual',
        },
        {
          to: '/docs/intro',
          label: 'Start',
          position: 'left',
        },
        {
          href: 'https://github.com/matuteiglesias/kb-manual',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Manual',
          items: [
            {label: 'Home', to: '/docs/intro'},
            {label: 'Ecosystem registry', to: '/docs/registry/ecosystem-map'},
            {label: 'Bus contracts', to: '/docs/contracts/event-bus'},
          ],
        },
        {
          title: 'Conventions',
          items: [
            {label: 'Stable IDs', to: '/docs/conventions/stable-ids'},
            {label: 'Manifests', to: '/docs/conventions/manifests'},
            {label: 'Run records', to: '/docs/conventions/run-records'},
          ],
        },
        {
          title: 'More',
          items: [
            {label: 'Repository', href: 'https://github.com/matuteiglesias/kb-manual'},
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Matias Iglesias. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
