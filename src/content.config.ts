import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),

  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      heroImage: image().optional(),

      // 자동 생성 필드 (선언만 해두면 타입 안전)
      readingTime: z.string().optional(),
      wordCount: z.number().optional(),
    }),

  transform: async ({ data, body }) => {
    // 🔥 코드 블럭 제거
    const withoutCode = body.replace(/```[\s\S]*?```/g, '');

    // 🔥 HTML 태그 제거
    const clean = withoutCode.replace(/<[^>]+>/g, '');

    // 🔥 공백 제거 후 문자 수 계산
    const chars = clean.replace(/\s+/g, '').length;

    // 🔥 한국어 기준 (약 500자 = 1분)
    const minutes = Math.max(1, Math.ceil(chars / 500));

    return {
      ...data,
      wordCount: chars,
      readingTime: `${minutes} min read`,
    };
  },
});

export const collections = { blog };