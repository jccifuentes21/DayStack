import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react'

interface Props {
  weekStart: string
  weekOffset: number
  onNavigate: (delta: number) => void
}

const formatRange = (weekStart: string): string => {
  if (!weekStart) return ''
  const start = new Date(weekStart + 'T00:00:00')
  const end   = new Date(weekStart + 'T00:00:00')
  end.setDate(end.getDate() + 6)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  const s = start.toLocaleDateString('en-US', opts)
  const e = end.toLocaleDateString('en-US', opts)
  return start.getMonth() === end.getMonth()
    ? `${s} – ${end.getDate()}`
    : `${s} – ${e}`
}

const NavBtn = ({ label, onClick, children }: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) => (
  <button
    onClick={onClick}
    aria-label={label}
    style={{
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      width:          36,
      height:         36,
      borderRadius:   8,
      border:         'none',
      background:     'transparent',
      color:          'var(--text-2)',
      cursor:         'pointer',
      transition:     'background 150ms var(--ease-out), transform 120ms var(--ease-out)',
      flexShrink:     0,
    }}
    onMouseEnter={e  => { e.currentTarget.style.background = 'var(--surface-2)' }}
    onMouseLeave={e  => { e.currentTarget.style.background = 'transparent' }}
    onMouseDown={e   => { e.currentTarget.style.transform = 'scale(0.92)' }}
    onMouseUp={e     => { e.currentTarget.style.transform = 'scale(1)' }}
  >
    {children}
  </button>
)

const WeekNav = ({ weekStart, weekOffset, onNavigate }: Props) => (
  <div className="flex w-full items-center justify-between">
    <NavBtn label="Previous week" onClick={() => onNavigate(-1)}>
      <CaretLeftIcon size={15} weight="bold" />
    </NavBtn>

    <div className="flex flex-col items-center gap-0.5">
      <span style={{
        fontFamily:    'var(--font-mono)',
        fontSize:      12,
        color:         'var(--text-2)',
        letterSpacing: '0.03em',
      }}>
        {formatRange(weekStart)}
      </span>
      {weekOffset !== 0 && (
        <span style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      10,
          color:         'var(--text-3)',
          letterSpacing: '0.04em',
        }}>
          {weekOffset > 0 ? `+${weekOffset}w` : `${weekOffset}w`}
        </span>
      )}
    </div>

    <NavBtn label="Next week" onClick={() => onNavigate(1)}>
      <CaretRightIcon size={15} weight="bold" />
    </NavBtn>
  </div>
)

export default WeekNav
