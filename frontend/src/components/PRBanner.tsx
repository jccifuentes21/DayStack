import { EnvelopeSimpleIcon } from '@phosphor-icons/react'

const PRBanner = () => (
  <div
    className="flex items-center gap-2"
    style={{
      padding:      '8px 12px',
      borderRadius: 8,
      border:       '1px solid var(--border)',
      background:   'var(--surface)',
    }}
  >
    <EnvelopeSimpleIcon size={14} style={{ color: 'var(--text-2)', flexShrink: 0 }} />
    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--text-2)' }}>
      PR email? Handle it first, then return to your schedule.
    </span>
  </div>
)

export default PRBanner
