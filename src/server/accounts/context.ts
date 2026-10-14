import "server-only";
import { AccountRepository } from "./repository.ts";
import { createEncryption } from "../encryption/payloads.ts";
import { getDatabaseClient } from "../database/connection.ts";
import { getIntegrationEnvironment } from "../config/environment.ts";
import { ServiceError } from "../http/errors.ts";

export async function withAccounts<T>(action: (accounts: AccountRepository) => Promise<T>): Promise<T> {
  const environment = getIntegrationEnvironment();
  const client = await getDatabaseClient();
  // libmongocrypt key cache lives for this request, never a cross-request plaintext cache.
  try {
    const encryption = createEncryption(client, environment);
    return await action(new AccountRepository(client.db(environment.MONGODB_DB), encryption, environment));
  } catch (error) { if (error instanceof ServiceError) throw error; throw new ServiceError("UNAVAILABLE", 503); }
}
