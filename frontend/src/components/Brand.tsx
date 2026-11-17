export default function Brand({ compact = false }: { compact?: boolean }) {
  return <span className={`brand ${compact ? 'brand-compact' : ''}`}>
    <span className="brand-mark"><img src="/brand/kora-cloud.png" alt="" /></span>
    <span className="brand-copy"><img src="/brand/kora-wordmark.png" alt="Kora" /><small>AI for Cloud</small></span>
  </span>
}
