import { usageStylesPart1 } from "./usage-styles/usageStyles-part1.ts";
import { usageStylesPart2 } from "./usage-styles/usageStyles-part2.ts";
import { usageStylesPart3 } from "./usage-styles/usageStyles-part3.ts";

const usageStylesBase = [usageStylesPart1, usageStylesPart2, usageStylesPart3]
  .join("\n")
  .replaceAll("rgba(255, 77, 77,", "rgba(var(--accent-rgb),")
  .replaceAll("#ff4d4d", "var(--accent)")
  .replaceAll("#e64545", "var(--accent-strong)")
  .replaceAll("#cc3d3d", "var(--accent-strong)")
  .replaceAll("var(--font-mono)", "var(--mono)");

const usageStylesEnhancements = `
  .usage-page-header {
    display: grid;
    gap: 14px;
    margin: 0 0 18px;
  }

  .usage-page-title {
    font-size: clamp(1.9rem, 3vw, 2.5rem);
    font-weight: 800;
    letter-spacing: -0.06em;
    color: var(--text-strong);
  }

  .usage-page-subtitle {
    max-width: 64ch;
    font-size: 14px;
    line-height: 1.65;
  }

  .usage-header,
  .usage-left-card,
  .usage-insight-card,
  .usage-summary-card,
  .cost-breakdown,
  .session-summary-card,
  .session-detail-empty,
  .session-detail-panel,
  .sessions-card .session-bars,
  .context-details-panel,
  .context-breakdown-card,
  .session-timeseries-compact,
  .session-logs-compact,
  .usage-mosaic {
    border-radius: 22px;
    border: 1px solid var(--border);
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.05), transparent 100%),
      var(--bg-elevated);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.04),
      0 14px 32px rgba(2, 8, 23, 0.08);
  }

  .usage-header {
    overflow: hidden;
  }

  .usage-header-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
  }

  .usage-header-title,
  .usage-controls,
  .usage-header-metrics,
  .usage-presets,
  .usage-query-actions,
  .usage-filter-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }

  .usage-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
    gap: 20px;
    align-items: start;
  }

  .usage-grid-left,
  .usage-grid-right {
    display: grid;
    gap: 20px;
  }

  .usage-filters-inline {
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
  }

  .usage-filters-inline select,
  .usage-filters-inline input[type="date"],
  .usage-filters-inline input[type="text"],
  .usage-query-input,
  details.usage-filter-select,
  .sessions-sort select,
  .usage-export-button,
  .usage-pin-btn {
    min-height: 42px;
    border-radius: 14px;
    border: 1px solid var(--border);
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.06), transparent 100%),
      rgba(255, 255, 255, 0.04);
    color: var(--text);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }

  .usage-query-input {
    padding: 0 14px;
  }

  details.usage-filter-select {
    padding: 8px 12px;
  }

  .usage-filter-popover,
  .usage-export-popover {
    border-radius: 18px;
    border: 1px solid var(--border);
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.08), transparent 100%),
      var(--panel-strong);
    box-shadow: var(--shadow-lg);
    backdrop-filter: blur(16px);
  }

  .usage-filter-option,
  .usage-export-item {
    border-radius: 12px;
  }

  .usage-filter-option:hover,
  .usage-export-item:hover {
    background: rgba(var(--accent-rgb), 0.08);
  }

  .usage-action-btn,
  .usage-query-actions .btn,
  .sessions-action-btn,
  .usage-export-button,
  .usage-pin-btn {
    border-radius: 14px;
  }

  .usage-action-btn,
  .usage-query-actions .btn,
  .sessions-action-btn,
  .usage-export-button,
  .usage-pin-btn,
  .chart-toggle .toggle-btn {
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .usage-primary-btn,
  .usage-export-button.primary {
    border-color: transparent;
    background: var(--gradient-accent) !important;
    color: var(--accent-foreground) !important;
    box-shadow:
      0 16px 30px rgba(var(--accent-rgb), 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.16);
  }

  .usage-primary-btn:hover,
  .usage-export-button.primary:hover {
    box-shadow:
      0 20px 34px rgba(var(--accent-rgb), 0.24),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
  }

  .usage-secondary-btn,
  .usage-export-button,
  .usage-pin-btn {
    border: 1px solid var(--border);
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.06), transparent 100%),
      rgba(255, 255, 255, 0.04);
    color: var(--text);
  }

  .chart-toggle {
    display: inline-flex;
    gap: 4px;
    padding: 4px;
    border-radius: 16px;
    border: 1px solid var(--border);
    background: rgba(255, 255, 255, 0.04);
  }

  .chart-toggle .toggle-btn {
    border-radius: 12px;
  }

  .chart-toggle .toggle-btn.active {
    background: var(--accent);
    color: #ffffff;
    box-shadow: 0 10px 18px rgba(var(--accent-rgb), 0.18);
  }

  .usage-query-bar {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
  }

  .usage-filter-row,
  .usage-query-chips,
  .usage-query-suggestions,
  .active-filters,
  .usage-badges,
  .cost-breakdown-legend,
  .context-legend {
    gap: 8px;
  }

  .usage-filter-badge,
  .usage-metric-badge,
  .usage-badge,
  .legend-item,
  .filter-chip,
  .usage-query-suggestion,
  .usage-query-chip {
    border: 1px solid var(--border);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.05);
    color: var(--text);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }

  .usage-metric-badge {
    display: inline-flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px 12px;
    min-width: 118px;
    border-radius: 18px;
  }

  .usage-query-hint,
  .usage-summary-hint,
  .usage-insight-subtitle,
  .session-bar-meta,
  .cost-breakdown-total,
  .session-summary-meta,
  .context-weight-desc,
  .context-total {
    color: var(--muted);
    line-height: 1.6;
  }

  .usage-summary-grid,
  .session-summary-grid,
  .usage-insights-grid,
  .usage-mosaic-grid {
    gap: 18px;
  }

  .usage-summary-card,
  .session-summary-card {
    padding: 16px;
    border-radius: 18px;
  }

  .usage-summary-title,
  .session-summary-title,
  .usage-insight-title,
  .cost-breakdown-header,
  .context-breakdown-title {
    color: var(--text-strong);
    font-weight: 700;
    letter-spacing: -0.03em;
  }

  .usage-summary-value,
  .session-summary-value,
  .usage-list-value {
    color: var(--text-strong);
    font-weight: 800;
    letter-spacing: -0.04em;
  }

  .usage-list-item,
  .context-breakdown-item,
  .usage-error-row {
    border-radius: 14px;
    border: 1px solid var(--border);
    background: rgba(255, 255, 255, 0.03);
    padding: 12px 14px;
  }

  .daily-bar-wrapper {
    border-radius: 14px 14px 0 0;
  }

  .daily-bar-wrapper:hover {
    background: rgba(var(--accent-rgb), 0.07);
  }

  .daily-bar {
    border-radius: 10px 10px 4px 4px;
    background: var(--gradient-accent);
    box-shadow: 0 12px 22px rgba(var(--accent-rgb), 0.18);
  }

  .daily-bar-tooltip {
    border-radius: 16px;
    border-color: var(--border);
    background: var(--panel-strong);
    box-shadow: var(--shadow-lg);
  }

  .usage-mosaic {
    overflow: hidden;
  }

  .usage-daypart-cell,
  .usage-hour-cell {
    border-radius: 14px;
  }

  .sessions-card .session-bars {
    padding: 10px;
  }

  .sessions-card .session-bar-row {
    border-radius: 16px;
    border: 1px solid transparent;
    padding: 10px 12px;
    transition:
      border-color var(--duration-fast) var(--ease-out),
      background var(--duration-fast) var(--ease-out),
      transform var(--duration-fast) var(--ease-out);
  }

  .sessions-card .session-bar-row:hover {
    transform: translateY(-1px);
    border-color: var(--border-hover);
    background: rgba(255, 255, 255, 0.05);
  }

  .sessions-card .session-bar-row.selected {
    border-color: rgba(var(--accent-rgb), 0.18);
    background: rgba(var(--accent-rgb), 0.1);
  }

  .sessions-card .session-bar-track {
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
  }

  .sessions-card .session-bar-fill {
    border-radius: inherit;
    background: var(--gradient-accent);
  }

  .session-copy-btn,
  .context-expand-btn {
    border-radius: 12px;
    border: 1px solid var(--border);
    background: rgba(255, 255, 255, 0.05);
  }

  .session-detail-panel {
    border: 1px solid rgba(var(--accent-rgb), 0.26) !important;
    box-shadow:
      0 24px 56px rgba(var(--accent-rgb), 0.12),
      inset 0 1px 0 rgba(255, 255, 255, 0.06);
  }

  .session-detail-header,
  .filter-chip {
    border-radius: 16px;
  }

  .session-detail-header {
    border-bottom: 1px solid var(--border);
    padding: 12px 16px;
  }

  .session-close-btn {
    border-radius: 12px;
    border: 1px solid var(--border);
    background: rgba(255, 255, 255, 0.04);
  }

  .timeseries-chart-wrapper,
  .context-stacked-bar,
  .cost-breakdown-bar {
    border-radius: 18px;
    border: 1px solid var(--border);
    background: rgba(255, 255, 255, 0.03);
    overflow: hidden;
  }

  .cost-segment,
  .context-segment,
  .ts-bar {
    transition: opacity var(--duration-fast) var(--ease-out);
  }

  .legend-dot.output,
  .cost-segment.output {
    background: #f26b74;
  }

  .legend-dot.input,
  .cost-segment.input {
    background: #e6a74a;
  }

  .legend-dot.cache-write,
  .cost-segment.cache-write {
    background: #33ba86;
  }

  .legend-dot.cache-read,
  .cost-segment.cache-read {
    background: #5aa7ff;
  }

  .context-segment.system,
  .legend-dot.system {
    background: var(--accent);
  }

  .context-segment.skills,
  .legend-dot.skills {
    background: #20b9a0;
  }

  .context-segment.tools,
  .legend-dot.tools {
    background: #e6a74a;
  }

  .context-segment.files,
  .legend-dot.files {
    background: #f26b74;
  }

  @media (max-width: 920px) {
    .usage-grid {
      grid-template-columns: 1fr;
    }

    .usage-query-bar {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 620px) {
    .usage-header-row,
    .usage-controls,
    .usage-header-metrics,
    .usage-query-actions {
      width: 100%;
    }

    .usage-header-metrics > *,
    .usage-query-actions > *,
    .usage-controls > * {
      flex: 1 1 auto;
    }

    .usage-page-title {
      font-size: 1.8rem;
    }

    .usage-metric-badge {
      min-width: 0;
      flex: 1 1 140px;
    }
  }
`;

export const usageStylesString = [usageStylesBase, usageStylesEnhancements].join("\n");
