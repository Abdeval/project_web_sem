import React, { useState } from 'react';
import { useTheme } from '../../theme/ThemeProvider';
import { ClassTree } from './ClassTree';
import type { OntologyClass } from './ClassTree';

export type { OntologyClass };

export interface OntologyProperty {
    uri: string;
    label: string;
    type: 'object' | 'datatype' | 'annotation';
    domain?: string;
    range?: string;
}

interface OntologyPanelProps {
    classes?: OntologyClass[];
    properties?: OntologyProperty[];
    onClassSelect?: (cls: OntologyClass) => void;
    onPropertySelect?: (prop: OntologyProperty) => void;
}

const PROP_COLORS = { object: '#4facfe', datatype: '#43e97b', annotation: '#a8b5c8' };
const PROP_ICONS = { object: '→', datatype: 'T', annotation: '@' };

export const OntologyPanel: React.FC<OntologyPanelProps> = ({
    classes = [], properties = [], onClassSelect, onPropertySelect,
}) => {
    const { theme } = useTheme();
    const c = theme.colors;
    const [activeTab, setActiveTab] = useState<'classes' | 'properties'>('classes');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${c.border}`, background: c.bgSecondary, padding: '0 12px' }}>
                {([
                    { id: 'classes' as const, label: 'Classes', count: classes.length },
                    { id: 'properties' as const, label: 'Properties', count: properties.length },
                ]).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === tab.id ? `2px solid ${c.accent}` : '2px solid transparent',
                            color: activeTab === tab.id ? c.textPrimary : c.textSecondary,
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: activeTab === tab.id ? 600 : 400,
                            padding: '10px 12px 8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        {tab.label}
                        <span style={{ fontSize: '10px', background: activeTab === tab.id ? `${c.accent}22` : c.bgTertiary, color: activeTab === tab.id ? c.accent : c.textMuted, padding: '1px 5px', borderRadius: '8px', fontFamily: 'monospace' }}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                {activeTab === 'classes' && (
                    <ClassTree classes={classes} onSelect={cls => onClassSelect?.(cls)} />
                )}
                {activeTab === 'properties' && (
                    properties.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100px', color: c.textMuted, gap: 8 }}>
                            <span style={{ fontSize: '24px', opacity: 0.4 }}>→</span>
                            <span style={{ fontSize: '12px' }}>No properties loaded</span>
                        </div>
                    ) : (
                        properties.map(prop => (
                            <div
                                key={prop.uri}
                                onClick={() => onPropertySelect?.(prop)}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}
                                onMouseEnter={e => e.currentTarget.style.background = c.bgHover}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <span style={{ fontSize: '10px', fontWeight: 700, color: PROP_COLORS[prop.type], background: `${PROP_COLORS[prop.type]}18`, width: 18, height: 18, borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    {PROP_ICONS[prop.type]}
                                </span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '12px', color: c.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prop.label}</div>
                                    {prop.domain && prop.range && (
                                        <div style={{ fontSize: '10px', color: c.textMuted, fontFamily: 'monospace' }}>{prop.domain} → {prop.range}</div>
                                    )}
                                </div>
                            </div>
                        ))
                    )
                )}
            </div>
        </div>
    );
};