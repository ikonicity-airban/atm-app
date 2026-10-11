import { getDb } from '@atm/db';
import { env } from './env.ts';

export const db = getDb({ databaseUrl: env.DATABASE_URL });
