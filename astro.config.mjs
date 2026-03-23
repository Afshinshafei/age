// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages project site: https://<user>.github.io/age/
// Replace YOUR_GITHUB_USERNAME in site, or set SITE_URL when building in CI.
const site =
  process.env.SITE_URL ?? 'https://YOUR_GITHUB_USERNAME.github.io';

// https://astro.build/config
export default defineConfig({
  site,
  base: '/age',
  output: 'static',
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()]
  }
});