import React from 'react';
import type { EmbeddingPoint2D } from '@kg/core';

interface EmbeddingScatterProps {
  isDark: boolean;
  title: string;
  points: EmbeddingPoint2D[];
  highlightColor: string;
}

function normalize(
  points: EmbeddingPoint2D[]
): Array<EmbeddingPoint2D & { nx: number; ny: number }> {
  if (points.length === 0) {
    return [];
  }

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const dx = maxX - minX || 1;
  const dy = maxY - minY || 1;

  return points.map((p) => ({
    ...p,
    nx: (p.x - minX) / dx,
    ny: (p.y - minY) / dy,
  }));
}

export const EmbeddingScatter: React.FC<EmbeddingScatterProps> = ({
  isDark,
  title,
  points,
  highlightColor,
}) => {
  const normalized = normalize(points);
  const border = isDark ? 'rgba(255,255,255,0.14)' : '#cbd5e1';
  const panelBg = isDark ? '#111827' : '#ffffff';
  const headBg = isDark ? '#0f172a' : '#f8fafc';
  const headBorder = isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0';
  const titleColor = isDark ? '#e2e8f0' : '#0f172a';
  const metaColor = isDark ? '#94a3b8' : '#64748b';
  const chartBg = isDark ? '#0b1220' : '#f8fafc';
  const entityColor = isDark ? '#cbd5e1' : '#1e293b';

  return (
    <div
      style={{
        border: `1px solid ${border}`,
        borderRadius: 12,
        background: panelBg,
        overflow: 'hidden',
        minHeight: 300,
      }}
    >
      <div
        style={{
          height: 38,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          borderBottom: `1px solid ${headBorder}`,
          background: headBg,
          fontSize: 12,
        }}
      >
        <strong style={{ color: titleColor }}>{title}</strong>
        <span style={{ color: metaColor }}>{points.length} points</span>
      </div>

      <div style={{ padding: 10 }}>
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: 260, display: 'block' }}>
          <rect x={0} y={0} width={100} height={100} fill={chartBg} rx={4} />
          {normalized.map((p) => {
            const x = 8 + p.nx * 84;
            const y = 92 - p.ny * 84;
            const isRelation = p.kind === 'relation';
            return (
              <circle
                key={`${p.kind}-${p.id}`}
                cx={x}
                cy={y}
                r={isRelation ? 1.4 : 1.1}
                fill={isRelation ? highlightColor : entityColor}
                opacity={0.85}
              >
                <title>{`${p.kind}: ${p.id}`}</title>
              </circle>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
