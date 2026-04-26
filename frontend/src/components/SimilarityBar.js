export function SimilarityBar({ score }) {
  const pct = Math.round((score || 0) * 100);
  const color = pct >= 75 ? 'var(--danger)' : pct >= 40 ? 'var(--warning)' : 'var(--success)';
  return (
    <div className="similarity-bar">
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="bar-value" style={{ color }}>{pct}%</span>
    </div>
  );
}
