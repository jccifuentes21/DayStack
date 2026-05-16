export interface ScheduleBlock {
  label: string
  time: string         // "10:30 AM" or "—" when no specific time
  note: string
  startMinutes: number // minutes since midnight, -1 when time is "—"
}

const addMinutes = (base: string, mins: number): string => {
  const [h, m] = base.split(':').map(Number)
  const total = h * 60 + m + mins
  const hh = Math.floor(total / 60) % 24
  const mm = total % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

const to12hr = (time24: string): string => {
  const [h, m] = time24.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

export const generateSchedule = (
  wakeTime: string,
  dayType: string,
): ScheduleBlock[] => {
  if (!wakeTime || dayType === 'unset') return []

  const [wh, wm] = wakeTime.split(':').map(Number)
  const wakeMinutes = wh * 60 + wm

  const t = (offset: number) => to12hr(addMinutes(wakeTime, offset))
  const m = (offset: number) => wakeMinutes + offset

  if (dayType === 'full') {
    return [
      { label: 'Wake up + morning runway', time: t(0),   startMinutes: m(0),   note: 'Tidy, shower, breakfast. Phone down.' },
      { label: 'AlgoExpert',               time: t(90),  startMinutes: m(90),  note: 'Min 1 problem, target 2' },
      { label: 'Personal project',         time: t(150), startMinutes: m(150), note: 'Min 30 min' },
      { label: 'Lunch',                    time: t(270), startMinutes: m(270), note: '' },
      { label: 'Job applications',         time: t(330), startMinutes: m(330), note: 'Min 1 sent or 1 prep step' },
      { label: 'Golf swing practice',      time: t(390), startMinutes: m(390), note: '15 min' },
      { label: 'You time',                 time: t(420), startMinutes: m(420), note: 'Earned rest' },
    ]
  }

  if (dayType === 'half') {
    return [
      { label: 'Wake up + morning runway', time: t(0),   startMinutes: m(0),   note: 'Tidy, shower, breakfast. Phone down.' },
      { label: 'Deep work block',          time: t(90),  startMinutes: m(90),  note: 'One focused block before you leave' },
      { label: 'Golf swing practice',      time: t(180), startMinutes: m(180), note: '15 min — fit in before leaving if possible' },
      { label: 'Activity / social',        time: '—',    startMinutes: -1,     note: 'Sport, gym, or plans' },
      { label: 'Evening buffer',           time: '—',    startMinutes: -1,     note: 'Rest if tired. One small task if energy allows.' },
    ]
  }

  if (dayType === 'light') {
    return [
      { label: 'Wake up + morning runway', time: t(0),   startMinutes: m(0),   note: 'Tidy, shower, breakfast. Phone down.' },
      { label: 'One small task',           time: t(90),  startMinutes: m(90),  note: '30 min max — keep the streak alive' },
      { label: 'Golf swing practice',      time: t(130), startMinutes: m(130), note: '15 min' },
      { label: 'Free day',                 time: '—',    startMinutes: -1,     note: 'No guilt. Light days are by design.' },
    ]
  }

  return []
}
