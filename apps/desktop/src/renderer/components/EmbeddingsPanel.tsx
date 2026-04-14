import React from 'react';
import type {
  EmbeddingAlgorithm,
  EmbeddingComparisonResult,
  EmbeddingTrainingConfig,
} from '@kg/core';

interface EmbeddingsPanelProps {
  isDark: boolean;
  configA: EmbeddingTrainingConfig;
  configB: EmbeddingTrainingConfig;
  onConfigAChange: (next: EmbeddingTrainingConfig) => void;
  onConfigBChange: (next: EmbeddingTrainingConfig) => void;
  onCompare: () => Promise<void>;
  isRunning: boolean;
  result: EmbeddingComparisonResult | null;
}

const ALGORITHMS: EmbeddingAlgorithm[] = ['TransE', 'TransH', 'TransR', 'DistMult', 'ComplEx'];

function NumberField(props: {
  isDark: boolean;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  step?: number;
}): JSX.Element {
  const { isDark, label, value, onChange, min = 1, step = 1 } = props;
  const border = isDark ? 'rgba(255,255,255,0.14)' : '#cbd5e1';
  const bg = isDark ? '#1a2236' : '#ffffff';
  const text = isDark ? '#e2e8f0' : '#0f172a';
  const labelText = isDark ? '#94a3b8' : '#64748b';

  return (
    <label style={{ display: 'grid', gap: 4, fontSize: 11 }}>
      <span style={{ color: labelText, fontWeight: 600 }}>{label}</span>
      <input
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          height: 30,
          borderRadius: 8,
          border: `1px solid ${border}`,
          background: bg,
          padding: '0 8px',
          fontSize: 12,
          color: text,
        }}
      />
    </label>
  );
}

function AlgorithmCard(props: {
  isDark: boolean;
  title: string;
  config: EmbeddingTrainingConfig;
  onChange: (config: EmbeddingTrainingConfig) => void;
}): JSX.Element {
  const { isDark, title, config, onChange } = props;
  const border = isDark ? 'rgba(255,255,255,0.12)' : '#cbd5e1';
  const bg = isDark ? '#111827' : '#ffffff';
  const text = isDark ? '#e2e8f0' : '#0f172a';
  const muted = isDark ? '#94a3b8' : '#64748b';
  const inputBg = isDark ? '#1a2236' : '#ffffff';

  return (
    <div
      style={{
        border: `1px solid ${border}`,
        borderRadius: 10,
        padding: 10,
        display: 'grid',
        gap: 8,
        background: bg,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: text }}>{title}</div>

      <label style={{ display: 'grid', gap: 4, fontSize: 11 }}>
        <span style={{ color: muted, fontWeight: 600 }}>Algorithm</span>
        <select
          value={config.algorithm}
          onChange={(e) => onChange({ ...config, algorithm: e.target.value as EmbeddingAlgorithm })}
          style={{
            height: 30,
            borderRadius: 8,
            border: `1px solid ${border}`,
            background: inputBg,
            padding: '0 8px',
            fontSize: 12,
            color: text,
          }}
        >
          {ALGORITHMS.map((algo) => (
            <option key={algo} value={algo}>
              {algo}
            </option>
          ))}
        </select>
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <NumberField
          isDark={isDark}
          label="Dimensions"
          value={config.dimensions}
          min={2}
          onChange={(v) => onChange({ ...config, dimensions: Math.max(2, Math.floor(v)) })}
        />
        <NumberField
          isDark={isDark}
          label="Epochs"
          value={config.epochs}
          min={1}
          onChange={(v) => onChange({ ...config, epochs: Math.max(1, Math.floor(v)) })}
        />
        <NumberField
          isDark={isDark}
          label="Learning Rate"
          value={config.learningRate}
          min={0.001}
          step={0.001}
          onChange={(v) => onChange({ ...config, learningRate: Math.max(0.001, v) })}
        />
        <NumberField
          isDark={isDark}
          label="Seed"
          value={config.seed ?? 42}
          min={1}
          onChange={(v) => onChange({ ...config, seed: Math.max(1, Math.floor(v)) })}
        />
      </div>
    </div>
  );
}

export const EmbeddingsPanel: React.FC<EmbeddingsPanelProps> = ({
  isDark,
  configA,
  configB,
  onConfigAChange,
  onConfigBChange,
  onCompare,
  isRunning,
  result,
}) => {
  const metricsA = result?.runA.metrics;
  const metricsB = result?.runB.metrics;
  const cardBorder = isDark ? 'rgba(96,165,250,0.45)' : '#bfdbfe';
  const cardBg = isDark ? 'rgba(37,99,235,0.14)' : '#eff6ff';
  const cardTitle = isDark ? '#93c5fd' : '#1d4ed8';
  const cardText = isDark ? '#cbd5e1' : '#334155';

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 12, display: 'grid', gap: 10 }}>
      <AlgorithmCard isDark={isDark} title="Run A" config={configA} onChange={onConfigAChange} />
      <AlgorithmCard isDark={isDark} title="Run B" config={configB} onChange={onConfigBChange} />

      <button className="btn-primary" onClick={() => void onCompare()} disabled={isRunning}>
        {isRunning ? 'Running comparison...' : 'Run Embedding Compare'}
      </button>

      {result && (
        <div
          style={{
            border: `1px solid ${cardBorder}`,
            borderRadius: 10,
            padding: 10,
            display: 'grid',
            gap: 8,
            background: cardBg,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: cardTitle }}>
            Recommended: {result.recommended}
          </div>
          <div style={{ fontSize: 11, color: cardText }}>
            A gap: {metricsA?.scoreGap.toFixed(4)} | time: {metricsA?.executionTime} ms
          </div>
          <div style={{ fontSize: 11, color: cardText }}>
            B gap: {metricsB?.scoreGap.toFixed(4)} | time: {metricsB?.executionTime} ms
          </div>
        </div>
      )}
    </div>
  );
};
