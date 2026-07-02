/**
 * MongoDB client wrapper.
 *
 * `DatabaseClient` owns the MongoClient lifecycle: construct, connect (with a
 * ping to verify), and disconnect. Fields are private (`#client`, `#dbName`)
 * so callers can only go through the `connect`/`disconnect` methods and the
 * `db` getter -- no one can swap the client or close it directly.
 *
 * This module exports the class only; nothing is instantiated here. The
 * composition root (server.ts) creates the single instance, connects it once,
 * and passes its `db` handle down to the App. No module-level singleton, no
 * top-level await, no global state.
 */

import { type Db, MongoClient, ServerApiVersion } from "mongodb";

class DatabaseClient {
    #client: MongoClient;
    #dbName: string;

    constructor(uri = process.env.MONGODB_URI || "", dbName = "interactive-comments-section") {
        this.#client = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
        });
        this.#dbName = dbName;
    }

    async connect(): Promise<DatabaseClient> {
        await this.#client.connect();
        await this.#client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
        return this;
    }

    async disconnect(): Promise<void> {
        await this.#client.close();
    }

    get db(): Db {
        return this.#client.db(this.#dbName);
    }
}

export { DatabaseClient };
