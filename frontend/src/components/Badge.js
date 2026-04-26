/**
 * Badge component for risk levels and classifications.
 * variant: 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral'
 */
export function Badge({ children, variant = 'neutral', dot = true }) {
  return (
    <span className={`badge badge-${variant}`}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  );
}

export function RiskBadge({ level }) {
  const map = { LOW: 'success', MEDIUM: 'warning', HIGH: 'danger' };
  return <Badge variant={map[level] || 'neutral'}>{level || '—'}</Badge>;
}

export function ClassificationBadge({ value }) {
  const map = {
    AUTHORIZED: ['info', '✓ Authorized'],
    FAN_CONTENT: ['purple', '◷ Fan Content'],
    PIRACY_LIKELY: ['danger', '⚠ Piracy Likely'],
  };
  const [variant, label] = map[value] || ['neutral', value || '—'];
  return <Badge variant={variant} dot={false}>{label}</Badge>;
}

export function StatusBadge({ status }) {
  const map = { OPEN: 'warning', ACTIONED: 'success', IGNORED: 'neutral' };
  return <Badge variant={map[status] || 'neutral'}>{status || '—'}</Badge>;
}
