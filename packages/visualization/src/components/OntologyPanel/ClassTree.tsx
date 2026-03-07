import React, { useState } from 'react';
import { useTheme } from '../../theme/ThemeProvider';

export interface OntologyClass {
    uri: string;
    label: string;
    comment?: string;
    children?: OntologyClass[];
    instanceCount?: number;
}

interface ClassNodeProps {
    cls: OntologyClass;
    depth: number;
    onSelect?: (cls: OntologyClass) => void;
}

const ClassNode: React.FC<ClassNodeProps> = ({ cls, depth, onSelect }) => {
    const { theme } = useTheme();
    const c = theme.colors;
    const [expanded, setExpanded] = useState(depth < 2);
    const hasChildren = cls.children && cls.children.length > 0;

    return (
        <div>
            <div
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: `4px ${8 + depth * 16}px 4px 8px`, cursor: 'pointer', borderRadius: '6px' }}
                onClick={() => { onSelect?.(cls); if (hasChildren) setExpanded(!expanded); }}
                onMouseEnter={e => e.currentTarget.style.background = c.bgHover}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
                <span style={{ width: 16, fontSize: '10px', color: c.textMuted, userSelect: 'none' }}>
                    {hasChildren ? (expanded ? '▾' : '▸') : ''}
                </span>
                <span style={{ fontSize: '12px' }}>⬡</span>
                <span style={{ fontSize: '12px', color: c.textPrimary, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cls.label}
                </span>
                {(cls.instanceCount ?? 0) > 0 && (
                    <span style={{ fontSize: '10px', color: c.nodeClass, background: `${c.nodeClass}18`, padding: '1px 5px', borderRadius: '8px', fontFamily: 'monospace' }}>
                        {cls.instanceCount}
                    </span>
                )}
            </div>
            {hasChildren && expanded && cls.children!.map(child => (
                <ClassNode key={child.uri} cls={child} depth={depth + 1} onSelect={onSelect} />
            ))}
        </div>
    );
};

export const ClassTree: React.FC<{ classes: OntologyClass[]; onSelect?: (cls: OntologyClass) => void }> = ({ classes, onSelect }) => {
    const { theme } = useTheme();
    const c = theme.colors;

    if (classes.length === 0) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100px', color: c.textMuted, gap: 8 }}>
                <span style={{ fontSize: '24px', opacity: 0.4 }}>⬡</span>
                <span style={{ fontSize: '12px' }}>No classes loaded</span>
            </div>
        );
    }

    return (
        <div>
            {classes.map(cls => <ClassNode key={cls.uri} cls={cls} depth={0} onSelect={onSelect} />)}
        </div>
    );
};