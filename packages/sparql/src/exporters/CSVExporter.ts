/**
 * CSVExporter - Exports SELECT results to CSV (RFC 4180)
 */

import { QueryResult } from '@kg/core';

export class CSVExporter {
    export(result: QueryResult): string {
        if (result.type !== 'SELECT') {
            throw new Error('CSV export is only supported for SELECT queries');
        }

        const variables = result.variables ?? [];
        const bindings = result.bindings ?? [];

        const lines: string[] = [];

        // Header row
        lines.push(variables.map((v) => this.escapeCSV(v)).join(','));

        // Data rows
        for (const row of bindings) {
            const cells = variables.map((v) => this.escapeCSV(String(row[v] ?? '')));
            lines.push(cells.join(','));
        }

        return lines.join('\r\n');
    }

    /**
     * Escape a value for CSV according to RFC 4180:
     * - Wrap in quotes if it contains comma, quote, or newline
     * - Double any existing quotes
     */
    private escapeCSV(value: string): string {
        if (value.includes('"') || value.includes(',') || value.includes('\n') || value.includes('\r')) {
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
    }
}
