import React from 'react';
import { LayoutType, LayoutManager } from '../../graph/LayoutManager';
import type { Theme } from '../../theme/ThemeProvider';

interface GraphControlsProps {
    currentLayout: LayoutType;
    onLayoutChange: (l: LayoutType) => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onFit: () => void;
    onReset: () => void;
    nodeCount: number;
    edgeCount: number;
    theme: Theme;
}

const IconBtn: React.FC<{
    onClick: () => void;
    title: string;
    children: React.ReactNode;
    c: Theme['colors'];
}> = ({ onClick, title, children, c }) => (
    <button
        onClick={onClick}
        title={title}
        style={{
            background: 'transparent',
            border: `1px solid ${c.border}`,
            borderRadius: '6px',
            color: c.textSecondary,
            cursor: 'pointer',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => {
            e.currentTarget.style.background = c.bgHover;
            e.currentTarget.style.color = c.textPrimary;
            e.currentTarget.style.borderColor = c.accent;
        }}
        onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = c.textSecondary;
            e.currentTarget.style.borderColor = c.border;
        }}
    >
        {children}
    </button>
);

export const GraphControls: React.FC<GraphControlsProps> = ({
    currentLayout, onLayoutChange,
    onZoomIn, onZoomOut, onFit, onReset,
    nodeCount, edgeCount, theme,
}) => {
    const c = theme.colors;

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                background: c.bgSecondary,
                borderBottom: `1px solid ${c.border}`,
                flexWrap: 'wrap',
                flexShrink: 0,
            }}
        >
            <span style={{ fontSize: '11px', color: c.textMuted, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Layout
            </span>

            <select
                value={currentLayout}
                onChange={e => onLayoutChange(e.target.value as LayoutType)}
                style={{
                    background: c.bgCard,
                    border: `1px solid ${c.border}`,
                    borderRadius: '6px',
                    color: c.textPrimary,
                    fontSize: '12px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    outline: 'none',
                }}
            >
                {LayoutManager.getAllLayouts().map(l => (
                    <option key={l} value={l}>{LayoutManager.getLayoutLabel(l)}</option>
                ))}
            </select>

            <div style={{ width: 1, height: 20, background: c.border }} />

            <div style={{ display: 'flex', gap: 4 }}>
                <IconBtn onClick={onZoomIn} title="Zoom In" c={c}>＋</IconBtn>
                <IconBtn onClick={onZoomOut} title="Zoom Out" c={c}>－</IconBtn>
                <IconBtn onClick={onFit} title="Fit to Screen" c={c}>⊡</IconBtn>
                <IconBtn onClick={onReset} title="Re-run Layout" c={c}>↺</IconBtn>
            </div>

            <div style={{ flex: 1 }} />

            <div style={{ display: 'flex', gap: 12, fontSize: '12px', color: c.textSecondary }}>
                <span>
                    <span style={{ color: c.nodeResource, fontWeight: 600 }}>{nodeCount}</span> nodes
                </span>
                <span>
                    <span style={{ color: c.edgeAsserted, fontWeight: 600 }}>{edgeCount}</span> edges
                </span>
            </div>
        </div>
    );
};