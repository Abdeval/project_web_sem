import React from 'react';
import type { NodeData } from './GraphView';
import type { Theme } from '../../theme/ThemeProvider';

interface NodeDetailsProps {
    node: NodeData;
    onClose: () => void;
    theme: Theme;
}

const Row: React.FC<{
    label: string;
    c: Theme['colors'];
    children: React.ReactNode;
}> = ({ label, c, children }) => (
    <div style={{ display: 'flex', gap: 8 }}>
        <span style={{ fontSize: '11px', color: c.textMuted, width: 60, flexShrink: 0, paddingTop: 2 }}>
            {label}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
);

export const NodeDetails: React.FC<NodeDetailsProps> = ({ node, onClose, theme }) => {
    const c = theme.colors;
    const typeColors: Record<string, string> = {
        resource: c.nodeResource,
        literal: c.nodeLiteral,
        class: c.nodeClass,
    };
    const typeColor = typeColors[node.type] || c.accent;

    return (
        <div
            style={{
                position: 'absolute',
                bottom: 48,
                right: 12,
                width: 280,
                background: c.bgCard,
                border: `1px solid ${c.border}`,
                borderRadius: '10px',
                boxShadow: theme.shadows.lg,
                zIndex: 30,
                overflow: 'hidden',
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: c.bgSecondary,
                    borderBottom: `1px solid ${c.border}`,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: typeColor, flexShrink: 0 }} />
                    <span
                        style={{
                            fontWeight: 600,
                            fontSize: '13px',
                            color: c.textPrimary,
                            maxWidth: 180,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {node.label}
                    </span>
                </div>
                <button
                    onClick={onClose}
                    style={{ background: 'none', border: 'none', color: c.textMuted, cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}
                >
                    ×
                </button>
            </div>

            {/* Body */}
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Row label="Type" c={c}>
                    <span
                        style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: typeColor,
                            background: `${typeColor}22`,
                            padding: '2px 8px',
                            borderRadius: '12px',
                            textTransform: 'capitalize',
                        }}
                    >
                        {node.type}
                    </span>
                </Row>

                <Row label="URI" c={c}>
                    <span
                        style={{
                            fontSize: '11px',
                            color: c.textSecondary,
                            wordBreak: 'break-all',
                            fontFamily: "'JetBrains Mono', monospace",
                            lineHeight: 1.5,
                        }}
                    >
                        {node.uri}
                    </span>
                </Row>

                <Row label="Degree" c={c}>
                    <span style={{ fontSize: '11px', color: c.textPrimary, fontWeight: 500 }}>
                        {node.degree}
                    </span>
                </Row>

                {node.outEdges && node.outEdges.length > 0 && (
                    <Row label="Out" c={c}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {node.outEdges.slice(0, 6).map((e, i) => (
                                <span
                                    key={i}
                                    style={{
                                        fontSize: '10px',
                                        color: c.edgeAsserted,
                                        background: `${c.edgeAsserted}18`,
                                        padding: '1px 6px',
                                        borderRadius: '8px',
                                        fontFamily: "'JetBrains Mono', monospace",
                                    }}
                                >
                                    {e}
                                </span>
                            ))}
                            {node.outEdges.length > 6 && (
                                <span style={{ fontSize: '10px', color: c.textMuted }}>
                                    +{node.outEdges.length - 6} more
                                </span>
                            )}
                        </div>
                    </Row>
                )}

                {node.inEdges && node.inEdges.length > 0 && (
                    <Row label="In" c={c}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {node.inEdges.slice(0, 6).map((e, i) => (
                                <span
                                    key={i}
                                    style={{
                                        fontSize: '10px',
                                        color: c.accent,
                                        background: `${c.accent}18`,
                                        padding: '1px 6px',
                                        borderRadius: '8px',
                                        fontFamily: "'JetBrains Mono', monospace",
                                    }}
                                >
                                    {e}
                                </span>
                            ))}
                            {node.inEdges.length > 6 && (
                                <span style={{ fontSize: '10px', color: c.textMuted }}>
                                    +{node.inEdges.length - 6} more
                                </span>
                            )}
                        </div>
                    </Row>
                )}
            </div>
        </div>
    );
};