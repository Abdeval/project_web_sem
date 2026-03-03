import * as path from 'path';
import { RDFManager } from '../src/RDFManager';

const SAMPLE_TTL = path.resolve(__dirname, '../samples/pizza.ttl');

const SIMPLE_TTL = `
@prefix ex:  <https://example.org/> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
ex:Alice rdf:type ex:Person .
ex:Alice ex:name "Alice" .
ex:Bob   rdf:type ex:Person .
ex:Bob   ex:knows ex:Alice .
`;

const BAD_TTL = `@prefix ex: <https://example.org/> . ex:Alice BADTOKEN ex:Foo .`;

// ── Load ──────────────────────────────────────────────────────────────────────

describe('Load', () => {
  it('loads Turtle from string', async () => {
    const m = new RDFManager();
    await m.load(SIMPLE_TTL, 'turtle');
    expect(m.getStats().totalTriples).toBe(4);
  });

  it('loads Turtle from file', async () => {
    const m = new RDFManager();
    await m.loadFromFile(SAMPLE_TTL);
    expect(m.getStats().totalTriples).toBeGreaterThan(0);
  });

  it('auto-detects .ttl extension', async () => {
    const m = new RDFManager();
    await expect(m.loadFromFile(SAMPLE_TTL)).resolves.not.toThrow();
  });

  it('throws on malformed Turtle', async () => {
    const m = new RDFManager();
    await expect(m.load(BAD_TTL, 'turtle')).rejects.toThrow(/TurtleLoader/);
  });

  it('throws on missing file', async () => {
    const m = new RDFManager();
    await expect(m.loadFromFile('/no/such/file.ttl')).rejects.toThrow(/File not found/);
  });

  it('throws on unknown extension', async () => {
    const m = new RDFManager();
    await expect(m.loadFromFile('data.xyz')).rejects.toThrow(/Unknown extension/);
  });
});

// ── Statistics ────────────────────────────────────────────────────────────────

describe('Statistics', () => {
  let m: RDFManager;

  beforeEach(async () => {
    m = new RDFManager();
    await m.load(SIMPLE_TTL, 'turtle');
  });

  it('counts total triples', () => {
    expect(m.getStats().totalTriples).toBe(4);
  });

  it('counts unique subjects', () => {
    expect(m.getStats().uniqueSubjects).toBe(2);
  });

  it('counts unique predicates', () => {
    expect(m.getStats().uniquePredicates).toBe(3);
  });

  it('counts literals vs IRIs', () => {
    expect(m.getStats().literalCount).toBe(1);
    expect(m.getStats().iriCount).toBe(3);
  });

  it('returns topPredicates sorted by frequency', () => {
    const top = m.getStats().topPredicates;
    expect(top[0].predicate).toContain('type');
    expect(top[0].count).toBe(2);
  });
});

// ── Export & Round-trip ───────────────────────────────────────────────────────

describe('Export & Round-trip', () => {
  it('Turtle round-trip preserves triple count', async () => {
    const m = new RDFManager();
    await m.load(SIMPLE_TTL, 'turtle');
    const before = m.getStats().totalTriples;

    const exported = await m.export('turtle');
    m.clear();
    await m.load(exported, 'turtle');

    expect(m.getStats().totalTriples).toBe(before);
  });

  it('N-Triples round-trip preserves triple count', async () => {
    const m = new RDFManager();
    await m.load(SIMPLE_TTL, 'turtle');
    const before = m.getStats().totalTriples;

    const exported = await m.export('ntriples');
    m.clear();
    await m.load(exported, 'ntriples');

    expect(m.getStats().totalTriples).toBe(before);
  });

  it('clear() resets the store', async () => {
    const m = new RDFManager();
    await m.load(SIMPLE_TTL, 'turtle');
    m.clear();
    expect(m.getStats().totalTriples).toBe(0);
  });

  it('getTriples() returns a defensive copy', async () => {
    const m = new RDFManager();
    await m.load(SIMPLE_TTL, 'turtle');
    const copy = m.getTriples();
    copy.push({ subject: 'x', predicate: 'y', object: 'z', isLiteral: false });
    expect(m.getTriples()).toHaveLength(4);
  });
});