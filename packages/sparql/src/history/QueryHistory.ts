/**
 * QueryHistory - In-memory query history management
 */

import { QueryHistoryEntry, QueryResult } from '@kg/core';

export class QueryHistory {
    private entries: QueryHistoryEntry[] = [];
    private maxSize: number;

    constructor(maxSize = 100) {
        this.maxSize = maxSize;
    }

    /**
     * Save a query and its result to history.
     */
    save(query: string, result: QueryResult, error?: string): QueryHistoryEntry {
        const entry: QueryHistoryEntry = {
            id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            query: query.trim(),
            timestamp: new Date(),
            result,
            error,
        };

        this.entries.unshift(entry); // most recent first

        // Cap size
        if (this.entries.length > this.maxSize) {
            this.entries = this.entries.slice(0, this.maxSize);
        }

        return entry;
    }

    /**
     * Get all history entries (most recent first).
     */
    getAll(): QueryHistoryEntry[] {
        return [...this.entries];
    }

    /**
     * Get a specific entry by ID.
     */
    getById(id: string): QueryHistoryEntry | undefined {
        return this.entries.find((e) => e.id === id);
    }

    /**
     * Get the query string of an entry (to replay it).
     */
    replay(id: string): string | undefined {
        const entry = this.getById(id);
        return entry?.query;
    }

    /**
     * Get the last N entries.
     */
    getLast(n: number): QueryHistoryEntry[] {
        return this.entries.slice(0, n);
    }

    /**
     * Clear all history.
     */
    clear(): void {
        this.entries = [];
    }

    /**
     * Get total number of entries.
     */
    get size(): number {
        return this.entries.length;
    }
}
