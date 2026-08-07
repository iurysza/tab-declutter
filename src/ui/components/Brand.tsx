export function Brand({ compact = false }: { readonly compact?: boolean }) {
  return <div className="brand">
    <span className="brand-mark" aria-hidden="true"><i /><i /><i /><b /></span>
    <span><strong>Tab Declutter</strong>{!compact && <small>Tab grouping, with intent</small>}</span>
  </div>
}
