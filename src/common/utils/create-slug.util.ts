import slugify from 'slugify';

const MAX_SLUG_LENGTH = 255;

export function createSlug(value: string): string {
  const slug = slugify(value, {
    lower: true,
    strict: true,
    trim: true,
    replacement: '-',
  });

  return slug.slice(0, MAX_SLUG_LENGTH);
}