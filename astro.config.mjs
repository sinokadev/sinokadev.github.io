import mdx from '@astrojs/mdx';
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import pagefind from 'astro-pagefind';

import remarkGfm from 'remark-gfm';
import remarkInlineAnchor from 'remark-inline-anchor';
import remarkMath from 'remark-math';
import remarkToc from 'remark-toc';

import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeKatex from 'rehype-katex';
import rehypePrettyCode from 'rehype-pretty-code';
import { remarkReadingTime } from './src/lib/remark-reading-time.mjs';
import { remarkPostLink } from './src/lib/remark-post-link.mjs';
import { rehypePostLink } from './src/lib/rehype-post-link.mjs';

import svelte from '@astrojs/svelte';

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

function musicPreviewsIntegration() {
  return {
    name: 'music-previews',
    hooks: {
      'astro:build:start': () => {
        try {
          execFileSync(process.execPath, [fileURLToPath(new URL('./scripts/generate-music-previews.mjs', import.meta.url))], {
            stdio: 'inherit',
          });
        } catch (e) {
          console.warn('[music-previews] Preview generation notice:', e.message);
        }
      },
    },
  };
}

export default defineConfig({

  site: 'https://sinoka.dev',

  markdown: {
    smartypants: false,
    processor: unified({
      remarkPlugins: [
        remarkGfm,
        remarkInlineAnchor,
        remarkMath,
        [remarkToc, { heading: '목차' }],
        remarkReadingTime,
        remarkPostLink,
      ],
      rehypePlugins: [
        rehypePostLink,
        rehypeKatex,
        rehypeSlug,
        rehypeAutolinkHeadings,
        [
          rehypePrettyCode,
          {
            theme: 'github-dark',
            keepBackground: false
          }
        ]
      ],
    }),
  },
  integrations: [mdx(), pagefind(), svelte(), musicPreviewsIntegration()],
  build: {
    inlineStylesheets: 'always',
  },
});
