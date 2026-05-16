interface Props {
  current: string
  onChange: (type: string) => void
}

const types = [
  { value: 'full',  label: 'Full',  color: 'var(--full)',  bg: 'var(--full-bg)'  },
  { value: 'half',  label: 'Half',  color: 'var(--half)',  bg: 'var(--half-bg)'  },
  { value: 'light', label: 'Light', color: 'var(--light)', bg: 'var(--light-bg)' },
]

const DayTypePicker = ({ current, onChange }: Props) => (
  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
    {types.map(({ value, label, color, bg }) => {
      const isActive = current === value
      return (
        <button
          key={value}
          onClick={() => onChange(value)}
          aria-pressed={isActive}
          style={{
            fontFamily:    'var(--font-sans)',
            fontSize:      13,
            fontWeight:    500,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            padding:       '7px 18px',
            borderRadius:  99,
            border:        'none',
            cursor:        'pointer',
            minHeight:     36,
            transition:    'background 150ms var(--ease-out), color 150ms var(--ease-out), transform 120ms var(--ease-out)',
            background:    isActive ? bg             : 'var(--surface)',
            color:         isActive ? color          : 'var(--text-3)',
          }}
          onMouseDown={e  => { e.currentTarget.style.transform = 'scale(0.96)' }}
          onMouseUp={e    => { e.currentTarget.style.transform = 'scale(1)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
        >
          {label}
        </button>
      )
    })}
  </div>
)

export default DayTypePicker
