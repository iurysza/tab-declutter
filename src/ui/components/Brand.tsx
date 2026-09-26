/** Same artwork as store-assets/icon-src.svg, so the in-app mark matches the toolbar icon. */
export function BrandMark({ size = 24 }: { readonly size?: number }) {
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 96 96" aria-hidden="true">
      <rect width="96" height="96" rx="24" fill="#4338ca" />
      <rect x="18" y="20" width="16" height="14" rx="7" fill="#fbbf24" />
      <rect x="38" y="20" width="40" height="14" rx="7" fill="#fff" />
      <rect x="18" y="41" width="16" height="14" rx="7" fill="#34d399" />
      <rect x="38" y="41" width="28" height="14" rx="7" fill="#fff" />
      <rect x="18" y="62" width="16" height="14" rx="7" fill="#fb7185" />
      <rect x="38" y="62" width="34" height="14" rx="7" fill="#fff" />
    </svg>
  )
}

export function Brand({ size = 24, subtitle }: { readonly size?: number; readonly subtitle?: string }) {
  return (
    <div className="brand">
      <BrandMark size={size} />
      <div>
        <strong>Tab Declutter</strong>
        {subtitle && <small>{subtitle}</small>}
      </div>
    </div>
  )
}
