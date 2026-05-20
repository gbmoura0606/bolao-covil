export const ALLOWED_USERS = [
  'Du',
  'Manetta',
  'Sunset',
  'Jhow',
  'Nathan',
  'Lorenzo',
  'Rubens',
  'Peter',
  'Vini',
] as const;

export type AllowedUser = (typeof ALLOWED_USERS)[number];

export const DEFAULT_PASSWORD = '123';
