// docusaurus.config.ts
import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'KB Contracts',
  tagline: 'Machine-readable contracts for knowledge artifact interoperability',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  // If you deploy on Vercel with a custom domain, keep baseUrl as "/"
  url: 'https://kb-contracts.matuteiglesias.link',
  baseUrl: '/',

  // Useful even if not using GitHub Pages
  organizationName: 'matuteiglesias',
  projectName: 'kb-contracts',

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
          editUrl: 'https://github.com/matuteiglesias/kb-contracts/tree/main/',
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
      title: 'KB Contracts',
      logo: { alt: 'KB Contracts', src: 'img/logo.svg' },
      items: [
        { type: 'doc', docId: 'home/current-release', label: 'Current release', position: 'left' },
  
        {
          label: 'Authority',
          position: 'left',
          items: [
            { label: 'Start here', to: '/docs/intro' },
            { label: 'ADR-0006 boundary', to: '/docs/registry-governance/adr-0006-knowledge-interoperability-authority-boundary' },
            { label: 'Knowledge Profile 1', to: '/docs/shared-conventions/contract-profiles-and-promotion-ladder' },
            { label: 'Artifact manifest', to: '/docs/shared-conventions/manifests-and-integrity-rules' },
            { label: 'Compatibility', to: '/docs/shared-conventions/knowledge-contract-compatibility' },
            { label: 'Producer-owned schemas (next RC)', to: '/docs/home/producer-owned-schemas' },
            { label: 'Validation', to: '/docs/contract-tests/contract-compliance-tests' },
          ],
        },
  
        { type: 'docSidebar', sidebarId: 'tutorialSidebar', position: 'left', label: 'Manual' },
        { href: 'https://github.com/matuteiglesias/kb-contracts', label: 'GitHub', position: 'right' },
      ],
    },
  
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Navigate',
          items: [
            { label: 'Current release', to: '/docs/home/current-release' },
            { label: 'Start here', to: '/docs/intro' },
            { label: 'Authority boundary', to: '/docs/registry-governance/adr-0006-knowledge-interoperability-authority-boundary' },
            { label: 'Compatibility', to: '/docs/shared-conventions/knowledge-contract-compatibility' },
            { label: 'Validation', to: '/docs/contract-tests/contract-compliance-tests' },
          ],
        },
        {
          title: 'Knowledge interoperability',
          items: [
            { label: 'Profile 1', to: '/docs/shared-conventions/contract-profiles-and-promotion-ladder' },
            { label: 'Artifact manifest', to: '/docs/shared-conventions/manifests-and-integrity-rules' },
            { label: 'Stable references', to: '/docs/shared-conventions/stable-ids-and-naming-rules' },
            { label: 'Legacy family catalog', to: '/docs/category/legacy-family-contracts-and-seams' },
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
