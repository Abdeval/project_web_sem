/**
 * QueryManager - Main entry point for the SPARQL module
 * Implements IQueryEngine from @kg/core
 */

import { IQueryEngine, IRDFStore, QueryResult, QueryHistoryEntry } from '@kg/core';
import { SPARQLEngine } from './engine/SPARQLEngine';
import { QueryHistory } from './history/QueryHistory';
import { SPARQLCompleter, CompletionItem } from './autocomplete/SPARQLCompleter';
import { CSVExporter } from './exporters/CSVExporter';
import { JSONExporter } from './exporters/JSONExporter';
import { XMLExporter } from './exporters/XMLExporter';
import { TableFormatter } from './formatters/TableFormatter';
import { GraphFormatter } from './formatters/GraphFormatter';
import { BooleanFormatter } from './formatters/BooleanFormatter';

export class QueryManager implements IQueryEngine {
    private engine: SPARQLEngine;
    private history: QueryHistory;
    private completer: SPARQLCompleter;
    private csvExporter: CSVExporter;
    private jsonExporter: JSONExporter;
    private xmlExporter: XMLExporter;
    private tableFormatter: TableFormatter;
    private graphFormatter: GraphFormatter;
    private booleanFormatter: BooleanFormatter;

    constructor() {
        this.engine = new SPARQLEngine();
        this.history = new QueryHistory();
        this.completer = new SPARQLCompleter();
        this.csvExporter = new CSVExporter();
        this.jsonExporter = new JSONExporter();
        this.xmlExporter = new XMLExporter();
        this.tableFormatter = new TableFormatter();
        this.graphFormatter = new GraphFormatter();
        this.booleanFormatter = new BooleanFormatter();
    }

    // ──────────────────────────────────────────────────────
    // IQueryEngine implementation
    // ──────────────────────────────────────────────────────

    /**
     * Execute a SPARQL query (SELECT, CONSTRUCT, ASK) against the given store.
     * Automatically saves to query history.
     */
    async execute(query: string, store: IRDFStore): Promise<QueryResult> {
        const startTime = Date.now();
        let result: QueryResult;

        try {
            result = await this.engine.execute(query, store);
            result.executionTime = Date.now() - startTime;
            this.history.save(query, result);
            return result;
        } catch (error: any) {
            const errorResult: QueryResult = {
                type: 'SELECT',
                variables: [],
                bindings: [],
                executionTime: Date.now() - startTime,
            };
            this.history.save(query, errorResult, error.message);
            throw error;
        }
    }

    /**
     * Validate SPARQL query syntax without executing.
     */
    validate(query: string): { valid: boolean; error?: string } {
        return this.engine.validate(query);
    }

    /**
     * Get all history entries.
     */
    getHistory(): QueryHistoryEntry[] {
        return this.history.getAll();
    }

    /**
     * Clear query history.
     */
    clearHistory(): void {
        this.history.clear();
    }

    /**
     * Export a query result to the specified format.
     * - 'csv' : SELECT → RFC 4180 CSV
     * - 'json': All types → SPARQL JSON Results Format
     * - 'xml' : SELECT/ASK → SPARQL XML Results Format
     */
    async exportResult(result: QueryResult, format: 'csv' | 'json' | 'xml'): Promise<string> {
        switch (format) {
            case 'csv':
                return this.csvExporter.export(result);
            case 'json':
                return this.jsonExporter.export(result);
            case 'xml':
                return this.xmlExporter.export(result);
            default:
                throw new Error(`Unknown export format: ${format}`);
        }
    }

    // ──────────────────────────────────────────────────────
    // Extended API
    // ──────────────────────────────────────────────────────

    /**
     * Format a result as human-readable text (for CLI/demo output).
     */
    formatResult(result: QueryResult): string {
        switch (result.type) {
            case 'SELECT':
                return this.tableFormatter.formatWithSummary(result);
            case 'CONSTRUCT':
            case 'DESCRIBE':
                return this.graphFormatter.format(result);
            case 'ASK':
                return this.booleanFormatter.formatWithLabel(result);
            default:
                return JSON.stringify(result, null, 2);
        }
    }

    /**
     * Replay a query from history by ID.
     * Returns the query string (caller must re-execute).
     */
    replayFromHistory(id: string): string | undefined {
        return this.history.replay(id);
    }

    /**
     * Get auto-completion suggestions for the current query text.
     */
    getCompletions(text: string, cursorPos: number, store?: IRDFStore): CompletionItem[] {
        return this.completer.getCompletions(text, cursorPos, store);
    }

    /**
     * Detect the type of a SPARQL query without executing it.
     */
    detectQueryType(query: string): 'SELECT' | 'CONSTRUCT' | 'ASK' | 'DESCRIBE' | 'UNKNOWN' {
        return this.engine.detectType(query);
    }

    /**
     * Get history entry count.
     */
    get historySize(): number {
        return this.history.size;
    }
}
