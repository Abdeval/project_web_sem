/**
 * SPARQL Module - Unit Tests
 */

import { QueryManager } from '../src/QueryManager';
import { RDFStore } from '@kg/core';
import { CSVExporter } from '../src/exporters/CSVExporter';
import { JSONExporter } from '../src/exporters/JSONExporter';
import { XMLExporter } from '../src/exporters/XMLExporter';
import { QueryResult } from '@kg/core';

// ─── Fixtures ─────────────────────────────────────────────

const FOAF_DATA = `
@prefix : <http://example.org/> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .

:Alice foaf:name "Alice" ; foaf:age "30" ; foaf:mbox "alice@example.com" .
:Bob foaf:name "Bob"   ; foaf:age "25" ; foaf:mbox "bob@example.com" .
:Charlie foaf:name "Charlie" ; foaf:age "35" ; foaf:mbox "charlie@example.com" .
`;

let store: RDFStore;
let manager: QueryManager;

beforeEach(async () => {
    store = new RDFStore();
    await store.load(FOAF_DATA, 'turtle');
    manager = new QueryManager();
});

// ─── SELECT Tests ──────────────────────────────────────────

describe('SPARQL SELECT', () => {
    it('should execute a simple SELECT query', async () => {
        const query = `
            PREFIX foaf: <http://xmlns.com/foaf/0.1/>
            SELECT ?name ?age
            WHERE {
                ?person foaf:name ?name .
                ?person foaf:age ?age .
            }
        `;

        const result = await manager.execute(query, store);

        expect(result.type).toBe('SELECT');
        expect(result.variables).toContain('name');
        expect(result.variables).toContain('age');
        expect(result.bindings).toBeInstanceOf(Array);
        expect(result.bindings!.length).toBeGreaterThan(0);
        expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should return correct variable names', async () => {
        const query = `
            PREFIX foaf: <http://xmlns.com/foaf/0.1/>
            SELECT ?name ?mbox
            WHERE {
                ?p foaf:name ?name .
                ?p foaf:mbox ?mbox .
            }
        `;

        const result = await manager.execute(query, store);
        expect(result.variables).toEqual(['name', 'mbox']);
    });

    it('should support LIMIT', async () => {
        const query = `
            PREFIX foaf: <http://xmlns.com/foaf/0.1/>
            SELECT ?name
            WHERE { ?p foaf:name ?name . }
            LIMIT 2
        `;

        const result = await manager.execute(query, store);
        expect(result.bindings!.length).toBeLessThanOrEqual(2);
    });

    it('should support ORDER BY', async () => {
        const query = `
            PREFIX foaf: <http://xmlns.com/foaf/0.1/>
            SELECT ?name
            WHERE { ?p foaf:name ?name . }
            ORDER BY ?name
        `;

        const result = await manager.execute(query, store);
        expect(result.type).toBe('SELECT');
        expect(result.bindings!.length).toBeGreaterThan(0);
    });

    it('should return empty bindings for no match', async () => {
        const query = `
            PREFIX foaf: <http://xmlns.com/foaf/0.1/>
            SELECT ?name
            WHERE { ?p foaf:name "Nonexistent" . ?p foaf:email ?name . }
        `;

        const result = await manager.execute(query, store);
        expect(result.type).toBe('SELECT');
        expect(result.bindings).toEqual([]);
    });
});

// ─── ASK Tests ─────────────────────────────────────────────

describe('SPARQL ASK', () => {
    it('should return true when pattern exists', async () => {
        const query = `
            PREFIX foaf: <http://xmlns.com/foaf/0.1/>
            ASK {
                ?p foaf:name "Alice" .
            }
        `;

        const result = await manager.execute(query, store);
        expect(result.type).toBe('ASK');
        expect(result.boolean).toBe(true);
    });

    it('should return false when pattern does not exist', async () => {
        const query = `
            PREFIX foaf: <http://xmlns.com/foaf/0.1/>
            ASK {
                ?p foaf:name "Zara" .
            }
        `;

        const result = await manager.execute(query, store);
        expect(result.type).toBe('ASK');
        expect(result.boolean).toBe(false);
    });
});

// ─── CONSTRUCT Tests ────────────────────────────────────────

describe('SPARQL CONSTRUCT', () => {
    it('should return triples from CONSTRUCT query', async () => {
        const query = `
            PREFIX foaf: <http://xmlns.com/foaf/0.1/>
            CONSTRUCT {
                ?person foaf:name ?name .
            }
            WHERE {
                ?person foaf:name ?name .
            }
        `;

        const result = await manager.execute(query, store);
        expect(result.type).toBe('CONSTRUCT');
        expect(result.triples).toBeInstanceOf(Array);
        expect(result.triples!.length).toBeGreaterThan(0);
    });
});

// ─── Error Handling ───────────────────────────────────────

describe('Error Handling', () => {
    it('should throw on invalid SPARQL syntax', async () => {
        const badQuery = 'SELEKT ?x WHERE { ?x ?y ?z }';

        await expect(manager.execute(badQuery, store)).rejects.toThrow();
    });

    it('should return valid: false for invalid query in validate()', () => {
        const result = manager.validate('NOT A SPARQL QUERY!!!');
        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
    });

    it('should return valid: true for valid query', () => {
        const result = manager.validate('SELECT ?x WHERE { ?x ?y ?z }');
        expect(result.valid).toBe(true);
    });
});

// ─── Export Tests ─────────────────────────────────────────

const SELECT_RESULT: QueryResult = {
    type: 'SELECT',
    variables: ['name', 'age'],
    bindings: [
        { name: 'Alice', age: '30' },
        { name: 'Bob', age: '25' },
    ],
};

describe('Export: CSV', () => {
    const exporter = new CSVExporter();

    it('should export SELECT to CSV with header', () => {
        const csv = exporter.export(SELECT_RESULT);
        expect(csv).toContain('name,age');
        expect(csv).toContain('Alice,30');
        expect(csv).toContain('Bob,25');
    });

    it('should wrap fields with commas in quotes', () => {
        const result: QueryResult = {
            type: 'SELECT',
            variables: ['label'],
            bindings: [{ label: 'Hello, World' }],
        };
        const csv = exporter.export(result);
        expect(csv).toContain('"Hello, World"');
    });

    it('should throw for non-SELECT results', () => {
        const askResult: QueryResult = { type: 'ASK', boolean: true };
        expect(() => exporter.export(askResult)).toThrow();
    });
});

describe('Export: JSON', () => {
    const exporter = new JSONExporter();

    it('should export SELECT to SPARQL JSON format', () => {
        const json = exporter.export(SELECT_RESULT);
        const parsed = JSON.parse(json);
        expect(parsed.head.vars).toEqual(['name', 'age']);
        expect(parsed.results.bindings).toHaveLength(2);
    });

    it('should export ASK to JSON with boolean', () => {
        const result: QueryResult = { type: 'ASK', boolean: true };
        const json = exporter.export(result);
        const parsed = JSON.parse(json);
        expect(parsed.boolean).toBe(true);
    });
});

describe('Export: XML', () => {
    const exporter = new XMLExporter();

    it('should export SELECT to SPARQL XML format', () => {
        const xml = exporter.export(SELECT_RESULT);
        expect(xml).toContain('<?xml');
        expect(xml).toContain('<sparql');
        expect(xml).toContain('<variable name="name"');
        expect(xml).toContain('<variable name="age"');
        expect(xml).toContain('<result>');
    });

    it('should export ASK to XML', () => {
        const result: QueryResult = { type: 'ASK', boolean: false };
        const xml = exporter.export(result);
        expect(xml).toContain('<boolean>false</boolean>');
    });

    it('should escape XML special characters', () => {
        const result: QueryResult = {
            type: 'SELECT',
            variables: ['label'],
            bindings: [{ label: '<test> & "stuff"' }],
        };
        const xml = exporter.export(result);
        expect(xml).toContain('&lt;test&gt;');
        expect(xml).toContain('&amp;');
        expect(xml).toContain('&quot;');
    });
});

// ─── History Tests ────────────────────────────────────────

describe('Query History', () => {
    it('should save queries to history automatically', async () => {
        const query = `SELECT ?x WHERE { ?x ?y ?z }`;
        await manager.execute(query, store);

        const history = manager.getHistory();
        expect(history.length).toBe(1);
        expect(history[0].query).toBe(query.trim());
    });

    it('should accumulate history across queries', async () => {
        await manager.execute(`SELECT ?x WHERE { ?x ?y ?z }`, store);
        await manager.execute(`ASK { ?x ?y ?z }`, store);

        expect(manager.getHistory().length).toBe(2);
    });

    it('should clear history', async () => {
        await manager.execute(`SELECT ?x WHERE { ?x ?y ?z }`, store);
        manager.clearHistory();
        expect(manager.getHistory().length).toBe(0);
    });

    it('should replay query from history', async () => {
        const query = `SELECT ?x WHERE { ?x ?y ?z }`;
        await manager.execute(query, store);

        const history = manager.getHistory();
        const replayed = manager.replayFromHistory(history[0].id);
        expect(replayed).toBe(query.trim());
    });
});

// ─── Manager export delegation ────────────────────────────

describe('QueryManager.exportResult', () => {
    it('should export result as CSV', async () => {
        const csv = await manager.exportResult(SELECT_RESULT, 'csv');
        expect(csv).toContain('name,age');
    });

    it('should export result as JSON', async () => {
        const json = await manager.exportResult(SELECT_RESULT, 'json');
        const parsed = JSON.parse(json);
        expect(parsed.head.vars).toEqual(['name', 'age']);
    });

    it('should export result as XML', async () => {
        const xml = await manager.exportResult(SELECT_RESULT, 'xml');
        expect(xml).toContain('<sparql');
    });
});
