/**
 * BooleanFormatter - Formats ASK query results
 */

import { QueryResult } from '@kg/core';

export class BooleanFormatter {
    format(result: QueryResult): string {
        if (result.type !== 'ASK') {
            return '[Not an ASK result]';
        }
        return result.boolean ? 'true' : 'false';
    }

    formatWithLabel(result: QueryResult): string {
        const val = result.boolean ? 'true ✓' : 'false ✗';
        return `ASK result: ${val}`;
    }
}
