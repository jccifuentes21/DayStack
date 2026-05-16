import { CheckIcon, Clock } from '@phosphor-icons/react'

interface Props {
  value: string
  onChange: (time: string) => void
  savedFlash?: boolean
}

const WakeTimeInput = ({ value, onChange, savedFlash }: Props) => (
  <div className="flex flex-col gap-1.5">
    <label style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 500, color: 'var(--text-2)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
      Wake time
    </label>
    <div className="flex items-center gap-2" style={{ width: 'fit-content' }}>
      <Clock size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
      <input
        type="time"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          fontFamily:  'var(--font-mono)',
          fontSize:    14,
          fontWeight:  400,
          color:       'var(--text-1)',
          background:  'var(--surface)',
          border:      '1px solid var(--border)',
          borderRadius: 6,
          padding:     '5px 10px',
          outline:     'none',
          cursor:      'pointer',
          transition:  'border-color 150ms var(--ease-out)',
          colorScheme: 'dark',
        }}
        onFocus={e  => { e.target.style.borderColor = 'var(--accent)' }}
        onBlur={e   => { e.target.style.borderColor = 'var(--border)' }}
      />
      {savedFlash ? (
        <CheckIcon className="ds-saved-check" size={18} weight="bold" aria-hidden />
      ) : (
        <span style={{ width: 18, flexShrink: 0 }} aria-hidden />
      )}
    </div>
  </div>
)

export default WakeTimeInput
