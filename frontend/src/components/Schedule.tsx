import type { ScheduleBlock } from '../utils/schedule'

interface Props {
  blocks: ScheduleBlock[]
  isToday: boolean
}

const nowMinutes = (): number => {
  const n = new Date()
  return n.getHours() * 60 + n.getMinutes()
}

const activeIndex = (blocks: ScheduleBlock[]): number => {
  const now = nowMinutes()
  let active = -1
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].startMinutes !== -1 && blocks[i].startMinutes <= now) {
      active = i
    }
  }
  return active
}

const Schedule = ({ blocks, isToday }: Props) => {
  const current = isToday ? activeIndex(blocks) : -1

  return (
    <div className="flex flex-col gap-0">
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 500, color: 'var(--text-2)', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 12px' }}>
        Schedule
      </p>

      <div style={{ position: 'relative', paddingLeft: 20 }}>
        <div style={{ position: 'absolute', left: 0, top: 6, bottom: 6, width: 1, background: 'var(--border)' }} />

        {blocks.map((block, i) => {
          const isActive = i === current
          return (
            <div
              key={i}
              className="flex gap-4"
              style={{ paddingBottom: i < blocks.length - 1 ? 16 : 0 }}
            >
              {/* Time */}
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize:   12,
                color:      isActive ? 'var(--accent)' : 'var(--text-3)',
                minWidth:   64,
                flexShrink: 0,
                paddingTop: 1,
                fontWeight: isActive ? 500 : 400,
                transition: 'color 200ms var(--ease-out)',
              }}>
                {block.time}
              </span>

              {/* Label + note */}
              <div className="flex flex-col gap-0.5">
                <span style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize:   14,
                  fontWeight: isActive ? 600 : 500,
                  color:      isActive ? 'var(--text-1)' : 'var(--text-2)',
                  transition: 'color 200ms var(--ease-out), font-weight 200ms var(--ease-out)',
                }}>
                  {block.label}
                  {isActive && (
                    <span style={{
                      marginLeft:    8,
                      fontFamily:    'var(--font-mono)',
                      fontSize:      9,
                      fontWeight:    500,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase' as const,
                      color:         'var(--accent)',
                      verticalAlign: 'middle',
                    }}>
                      now
                    </span>
                  )}
                </span>
                {block.note && (
                  <span style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize:   12,
                    color:      isActive ? 'var(--text-3)' : 'var(--text-3)',
                  }}>
                    {block.note}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Schedule
