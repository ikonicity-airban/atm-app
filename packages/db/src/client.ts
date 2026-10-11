/**
 * Database client singleton for Ascent Transport Management (PostgreSQL / Neon)
 */

export interface DbClientConfig {
  databaseUrl?: string;
}

export class DbClient {
  private static instance: DbClient | null = null;
  public readonly connectionString: string;

  private constructor(config?: DbClientConfig) {
    this.connectionString =
      config?.databaseUrl ||
      (typeof process !== 'undefined' && process.env ? process.env.DATABASE_URL ?? '' : '');
  }

  public static getInstance(config?: DbClientConfig): DbClient {
    if (!DbClient.instance) {
      DbClient.instance = new DbClient(config);
    }
    return DbClient.instance;
  }

  public isConnected(): boolean {
    return Boolean(this.connectionString);
  }
}

export const getDb = (config?: DbClientConfig) => DbClient.getInstance(config);
