import mdx from '@astrojs/mdx';
import { defineConfig } from 'astro/config';

import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkToc from 'remark-toc';

import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeKatex from 'rehype-katex';
import rehypePrettyCode from 'rehype-pretty-code';
import { remarkReadingTime } from './src/lib/remark-reading-time.mjs';

import { defineConfig } from "astro/config";
import pagefind from "astro-pagefind";

export default defineConfig({
  site: 'https://sinoka.dev',

  markdown: {
		remarkPlugins: [
      remarkGfm,
      remarkMath,
      [remarkToc, { heading: '목차' }],
      remarkReadingTime
    ],
    rehypePlugins: [
      rehypeKatex,
      rehypeSlug,
      rehypeAutolinkHeadings,
    ],
	},
  integrations: [
    mdx({
      remarkPlugins: [
        remarkGfm,
        remarkMath,
        [remarkToc, { heading: '목차' }],
        remarkReadingTime
      ],
      rehypePlugins: [
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
      ]
    }),
    pagefind()
  ]
});