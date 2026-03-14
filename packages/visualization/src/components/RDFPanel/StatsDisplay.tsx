import React from 'react';
import { useTheme } from '../../theme/ThemeProvider';

export interface RDFStats {
  tripleCount: number;
  subjectCount: number;
  predicateCount: number;
  objectCount: number;
  formatDetected?: string;
}

const StatCard: React.FC<{ label: string; value: number; color: string }> = ({
  label,
  value,
  color,
}) => (
  <div style={{ background: `${color}12`, borderRadius: '8px', padding: '10px 14px' }}>
    <div
      style={{
        fontSize: '20px',
        fontWeight: 700,
        color,
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: '-0.03em',
      }}
    >
      {value.toLocaleString()}
    </div>
    <div style={{ fontSize: '11px', color, opacity: 0.75, fontWeight: 500, marginTop: 2 }}>
      {label}
    </div>
  </div>
);

const BarRow: React.FC<{
  label: string;
  value: number;
  max: number;
  color: string;
  c: ReturnType<typeof import('../../theme/ThemeProvider').useTheme>['theme']['colors'];
}> = ({ label, value, max, color, c }) => {
  const pct = max > 0 ? Math.max(3, (value / max) * 100) : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: '11px', color: c.textSecondary, fontWeight: 500 }}>{label}</span>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {value.toLocaleString()}
        </span>
      </div>
      <div style={{ height: 4, background: `${color}20`, borderRadius: 99, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: color,
            borderRadius: 99,
            transition: 'width 0.5s ease',
          }}
        />
      </div>
    </div>
  );
};

export const StatsDisplay: React.FC<{ stats: RDFStats }> = ({ stats }) => {
  const { theme } = useTheme();
  const c = theme.colors;
  const max = stats.tripleCount;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <StatCard label="Triples" value={stats.tripleCount} color={c.accent} />
        <StatCard label="Subjects" value={stats.subjectCount} color={c.nodeResource} />
        <StatCard label="Predicates" value={stats.predicateCount} color={c.nodeClass} />
        <StatCard label="Objects" value={stats.objectCount} color={c.nodeLiteral} />
      </div>

      {/* Proportion bars */}
      <div
        style={{
          padding: '10px 12px',
          background: c.bgTertiary,
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div
          style={{
            fontSize: '10px',
            fontWeight: 700,
            color: c.textMuted,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 2,
          }}
        >
          Proportions
        </div>
        <BarRow
          label="Subjects"
          value={stats.subjectCount}
          max={max}
          color={c.nodeResource}
          c={c}
        />
        <BarRow
          label="Predicates"
          value={stats.predicateCount}
          max={max}
          color={c.nodeClass}
          c={c}
        />
        <BarRow label="Objects" value={stats.objectCount} max={max} color={c.nodeLiteral} c={c} />
      </div>

      {stats.formatDetected && (
        <div
          style={{
            padding: '6px 12px',
            background: c.bgTertiary,
            borderRadius: '6px',
            fontSize: '11px',
            color: c.textSecondary,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Format</span>
          <span
            style={{ fontWeight: 600, color: c.success, fontFamily: "'JetBrains Mono', monospace" }}
          >
            {stats.formatDetected}
          </span>
        </div>
      )}
    </div>
  );
};
