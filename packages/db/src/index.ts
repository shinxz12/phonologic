import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export * from './schema';
export { schema };

export type Database = PostgresJsDatabase<typeof schema>;

export function createDbClient(connectionString: string): Database {
  const queryClient = postgres(connectionString);
  return drizzle(queryClient, { schema });
}
