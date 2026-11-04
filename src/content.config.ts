import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const optionalDateFromCms = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.coerce.date().optional()
);

const site = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/site' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    signup_link: z.string().optional()
  })
});

const sections = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/sections' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional()
  })
});

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    author: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
  })
});

const events = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    location: z.string().optional(),
    location_link: z.string().optional(),
    event_type: z.string(),
    tentative: z.boolean().optional(),
    registration_link: z.string().optional(),
    results_link: z.string().optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    redirect_from: z.array(z.string()).optional(),
    day: z.string().optional(),
    weekday: z.string().optional(),
    time: z.string().optional(),
    season_start: optionalDateFromCms,
    season_end: optionalDateFromCms,
    format: z.string().optional(),
    cost: z.string().optional()
  })
});

const courses = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/courses' }),
  schema: z.object({
    title: z.string(),
    weight: z.number().optional(),
    club_sponsored: z.boolean().optional(),
    location: z.string().optional(),
    holes: z.number().optional(),
    difficulty: z.string().optional(),
    udisc_link: z.string().optional(),
    image: z.string().optional(),
    description: z.string().optional(),
    date: z.coerce.date().optional()
  })
});

const socials = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/socials' }),
  schema: z.object({
    title: z.string(),
    link: z.string(),
    weight: z.number().optional(),
    icon: z.enum(['facebook', 'instagram', 'discord']).optional()
  })
});

export const collections = { site, sections, news, events, courses, socials };
