import React from 'react';
import { LayoutType, LayoutManager } from '../../graph/LayoutManager';
import { shortenUri } from '../../graph/GraphMapper';
import type { Theme } from '../../theme/ThemeProvider';

interface GraphControlsProps {
  currentLayout: LayoutType;
  onLayoutChange: (l: LayoutType) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onReset: () => void;
  onExportPng: () => void;
  onFullscreen: () => void;
  isFullscreen: boolean;
  nodeCount: number;
  edgeCount: number;
  totalTriples: number;
  searchText: string;
  onSearchChange: (v: string) => void;
  selectedPredicate: string;
  predicates: string[];
  onPredicateChange: (v: string) => void;
  theme: Theme;
}

const IconBtn: React.FC<{
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  c: Theme['colors'];
  active?: boolean;
}> = ({ onClick, title, children, c, active }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      background: active ? `${c.accent}20` : 'transparent',
      border: `1px solid ${active ? c.accent : c.border}`,
      borderRadius: '6px',
      color: active ? c.accent : c.textSecondary,
      cursor: 'pointer',
      width: 30,
      height: 30,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      flexShrink: 0,
      transition: 'all 0.15s ease',
    }}
    onMouseEnter={(e) => {
      if (!active) {
        e.currentTarget.style.background = c.bgHover;
        e.currentTarget.style.color = c.textPrimary;
        e.currentTarget.style.borderColor = c.accent;
      }
    }}
    onMouseLeave={(e) => {
      if (!active) {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = c.textSecondary;
        e.currentTarget.style.borderColor = c.border;
      }
    }}
  >
    {children}
  </button>
);

export const GraphControls: React.FC<GraphControlsProps> = ({
  currentLayout,
  onLayoutChange,
  onZoomIn,
  onZoomOut,
  onFit,
  onReset,
  onExportPng,
  onFullscreen,
  isFullscreen,
  nodeCount,
  edgeCount,
  totalTriples,
  searchText,
  onSearchChange,
  selectedPredicate,
  predicates,
  onPredicateChange,
  theme,
}) => {
  const c = theme.colors;
  const isFiltered = (searchText || selectedPredicate) && nodeCount < totalTriples;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      {/* ── Row 1: Layout + Zoom controls ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '7px 12px',
          background: c.bgSecondary,
          borderBottom: `1px solid ${c.border}`,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontSize: '10px',
            color: c.textMuted,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            flexShrink: 0,
          }}
        >
          Layout
        </span>
        <select
          value={currentLayout}
          onChange={(e) => onLayoutChange(e.target.value as LayoutType)}
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
          {LayoutManager.getAllLayouts().map((l) => (
            <option key={l} value={l}>
              {LayoutManager.getLayoutLabel(l)}
            </option>
          ))}
        </select>

        <div style={{ width: 1, height: 18, background: c.border, flexShrink: 0 }} />

        <div style={{ display: 'flex', gap: 3 }}>
          <IconBtn onClick={onZoomIn} title="Zoom In" c={c}>
            +
          </IconBtn>
          <IconBtn onClick={onZoomOut} title="Zoom Out" c={c}>
            −
          </IconBtn>
          <IconBtn onClick={onFit} title="Fit to Screen" c={c}>
            ⊡
          </IconBtn>
          <IconBtn onClick={onReset} title="Re-run Layout" c={c}>
            ↺
          </IconBtn>
          <IconBtn onClick={onExportPng} title="Export as PNG" c={c}>
            ↓
          </IconBtn>
          <IconBtn
            onClick={onFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            c={c}
            active={isFullscreen}
          >
            {isFullscreen ? '⊠' : '⤢'}
          </IconBtn>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', gap: 10, fontSize: '11px', color: c.textSecondary }}>
          <span>
            <span style={{ color: c.nodeResource, fontWeight: 700 }}>{nodeCount}</span> nodes
          </span>
          <span>
            <span style={{ color: c.edgeAsserted, fontWeight: 700 }}>{edgeCount}</span> edges
          </span>
          {isFiltered && (
            <span style={{ color: c.warning, fontSize: '10px' }}>
              (filtered from {totalTriples.toLocaleString()})
            </span>
          )}
        </div>
      </div>

      {/* ── Row 2: Search + Predicate filter ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 10px',
          background: c.bgPrimary,
          borderBottom: `1px solid ${c.border}`,
        }}
      >
        {/* Search box */}
        <div style={{ position: 'relative', flex: 1, maxWidth: 220 }}>
          <span
            style={{
              position: 'absolute',
              left: 7,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '12px',
              color: c.textMuted,
              pointerEvents: 'none',
            }}
          >
            ⌕
          </span>
          <input
            type="text"
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search nodes…"
            style={{
              width: '100%',
              paddingLeft: 24,
              paddingRight: searchText ? 24 : 8,
              paddingTop: 4,
              paddingBottom: 4,
              background: c.bgCard,
              border: `1px solid ${searchText ? c.accent : c.border}`,
              borderRadius: '6px',
              color: c.textPrimary,
              fontSize: '11px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {searchText && (
            <button
              onClick={() => onSearchChange('')}
              style={{
                position: 'absolute',
                right: 6,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: c.textMuted,
                cursor: 'pointer',
                fontSize: '14px',
                lineHeight: 1,
                padding: 0,
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* Predicate filter */}
        {predicates.length > 0 && (
          <select
            value={selectedPredicate}
            onChange={(e) => onPredicateChange(e.target.value)}
            style={{
              background: selectedPredicate ? `${c.accent}14` : c.bgCard,
              border: `1px solid ${selectedPredicate ? c.accent : c.border}`,
              borderRadius: '6px',
              color: selectedPredicate ? c.accent : c.textSecondary,
              fontSize: '11px',
              padding: '4px 8px',
              cursor: 'pointer',
              outline: 'none',
              maxWidth: 180,
            }}
          >
            <option value="">All predicates ({predicates.length})</option>
            {predicates.map((p) => (
              <option key={p} value={p}>
                {shortenUri(p)}
              </option>
            ))}
          </select>
        )}

        {/* Clear button */}
        {(searchText || selectedPredicate) && (
          <button
            onClick={() => {
              onSearchChange('');
              onPredicateChange('');
            }}
            style={{
              background: 'none',
              border: `1px solid ${c.border}`,
              borderRadius: '6px',
              color: c.textMuted,
              cursor: 'pointer',
              fontSize: '11px',
              padding: '3px 8px',
              flexShrink: 0,
            }}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

// const IconBtn: React.FC<{
//   onClick: () => void;
//   title: string;
//   children: React.ReactNode;
//   c: Theme['colors'];
// }> = ({ onClick, title, children, c }) => (
//   <button
//     onClick={onClick}
//     title={title}
//     style={{
//       background: 'transparent',
//       border: `1px solid ${c.border}`,
//       borderRadius: '6px',
//       color: c.textSecondary,
//       cursor: 'pointer',
//       width: 32,
//       height: 32,
//       display: 'flex',
//       alignItems: 'center',
//       justifyContent: 'center',
//       fontSize: '14px',
//       transition: 'all 0.15s ease',
//     }}
//     onMouseEnter={(e) => {
//       e.currentTarget.style.background = c.bgHover;
//       e.currentTarget.style.color = c.textPrimary;
//       e.currentTarget.style.borderColor = c.accent;
//     }}
//     onMouseLeave={(e) => {
//       e.currentTarget.style.background = 'transparent';
//       e.currentTarget.style.color = c.textSecondary;
//       e.currentTarget.style.borderColor = c.border;
//     }}
//   >
//     {children}
//   </button>
// );

// export const GraphControls: React.FC<GraphControlsProps> = ({
//   currentLayout,
//   onLayoutChange,
//   onZoomIn,
//   onZoomOut,
//   onFit,
//   onReset,
//   nodeCount,
//   edgeCount,
//   theme,
// }) => {
//   const c = theme.colors;

//   return (
//     <div
//       style={{
//         display: 'flex',
//         alignItems: 'center',
//         gap: 8,
//         padding: '8px 12px',
//         background: c.bgSecondary,
//         borderBottom: `1px solid ${c.border}`,
//         flexWrap: 'wrap',
//         flexShrink: 0,
//       }}
//     >
//       <span
//         style={{
//           fontSize: '11px',
//           color: c.textMuted,
//           fontWeight: 600,
//           letterSpacing: '0.05em',
//           textTransform: 'uppercase',
//         }}
//       >
//         Layout
//       </span>

//       <select
//         value={currentLayout}
//         onChange={(e) => onLayoutChange(e.target.value as LayoutType)}
//         style={{
//           background: c.bgCard,
//           border: `1px solid ${c.border}`,
//           borderRadius: '6px',
//           color: c.textPrimary,
//           fontSize: '12px',
//           padding: '4px 8px',
//           cursor: 'pointer',
//           outline: 'none',
//         }}
//       >
//         {LayoutManager.getAllLayouts().map((l) => (
//           <option key={l} value={l}>
//             {LayoutManager.getLayoutLabel(l)}
//           </option>
//         ))}
//       </select>

//       <div style={{ width: 1, height: 20, background: c.border }} />

//       <div style={{ display: 'flex', gap: 4 }}>
//         <IconBtn onClick={onZoomIn} title="Zoom In" c={c}>
//           ＋
//         </IconBtn>
//         <IconBtn onClick={onZoomOut} title="Zoom Out" c={c}>
//           －
//         </IconBtn>
//         <IconBtn onClick={onFit} title="Fit to Screen" c={c}>
//           ⊡
//         </IconBtn>
//         <IconBtn onClick={onReset} title="Re-run Layout" c={c}>
//           ↺
//         </IconBtn>
//       </div>

//       <div style={{ flex: 1 }} />

//       <div style={{ display: 'flex', gap: 12, fontSize: '12px', color: c.textSecondary }}>
//         <span>
//           <span style={{ color: c.nodeResource, fontWeight: 600 }}>{nodeCount}</span> nodes
//         </span>
//         <span>
//           <span style={{ color: c.edgeAsserted, fontWeight: 600 }}>{edgeCount}</span> edges
//         </span>
//       </div>
//     </div>
//   );
// };
