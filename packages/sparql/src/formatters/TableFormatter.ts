/**
 * TableFormatter - Formats SELECT results as an ASCII table
 */

import { QueryResult } from '@kg/core';

export class TableFormatter {
    format(result: QueryResult): string {
        if (result.type !== 'SELECT' || !result.variables || !result.bindings) {
            return '[No SELECT results to display]';
        }

        const vars = result.variables;
        const rows = result.bindings;

        if (vars.length === 0 || rows.length === 0) {
            return `[Empty result — 0 bindings]`;
        }

        // Compute column widths
        const colWidths: number[] = vars.map((v) => v.length);
        for (const row of rows) {
            for (let i = 0; i < vars.length; i++) {
                const val = String(row[vars[i]] ?? '');
                colWidths[i] = Math.max(colWidths[i], val.length);
            }
        }

        // const separator = '┼' + colWidths.map((w) => '─'.repeat(w + 2)).join('┼') + '┼';
        const topBorder = '┌' + colWidths.map((w) => '─'.repeat(w + 2)).join('┬') + '┐';
        const bottomBorder = '└' + colWidths.map((w) => '─'.repeat(w + 2)).join('┴') + '┘';

        const formatRow = (cells: string[]): string =>
            '│' + cells.map((c, i) => ` ${c.padEnd(colWidths[i])} `).join('│') + '│';

        const lines: string[] = [];
        lines.push(topBorder);
        lines.push(formatRow(vars));
        lines.push('├' + colWidths.map((w) => '─'.repeat(w + 2)).join('┼') + '┤');
        for (const row of rows) {
            lines.push(formatRow(vars.map((v) => String(row[v] ?? ''))));
        }
        lines.push(bottomBorder);

        return lines.join('\n');
    }

    /**
     * Format with binding count summary
     */
    formatWithSummary(result: QueryResult): string {
        const table = this.format(result);
        const count = result.bindings?.length ?? 0;
        return `${table}\n\n   Results: ${count} binding${count !== 1 ? 's' : ''}`;
    }
}
