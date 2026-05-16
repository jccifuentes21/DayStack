import { useMemo, useState } from 'react'
import { ToastContainer } from 'react-toastify'
import { useWeek } from './hooks/useWeek'
import WeekNav from './components/WeekNav'
import WeekStrip from './components/WeekStrip'
import DayPanel from './components/DayPanel'

const TODAY = new Date().toLocaleDateString('en-CA') // en-CA → YYYY-MM-DD in local timezone

const Skeleton = () => (
  <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 md:px-6">
    {[70, 50, 65, 50, 65].map((w, i) => (
      <div
        key={i}
        style={{
          height: 14,
          width: `${w}%`,
          background: 'var(--surface-2)',
          borderRadius: 6,
          opacity: 1 - i * 0.15,
        }}
      />
    ))}
  </div>
)

const App = () => {
  const { week, weekOffset, loading, error, retryWeek, navigateByWeeks, updateDay, resetDay, toggleTask, createTask, deleteTask } = useWeek()
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null)

  const selectedDay = useMemo(() => {
    if (!week) return null
    if (selectedDayId !== null) return week.days.find(d => d.id === selectedDayId) ?? null
    return week.days.find(d => d.date === TODAY) ?? week.days[0] ?? null
  }, [week, selectedDayId])

  const handleDaySelect = (dayId: number) => setSelectedDayId(dayId)

  const handleNavigate = (delta: number) => {
    setSelectedDayId(null)
    navigateByWeeks(delta)
  }

  return (
    <>
      <ToastContainer
        position="top-right"
        theme="dark"
        autoClose={4000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable={false}
        toastStyle={{ fontFamily: 'var(--font-sans)' }}
      />
      {error ? (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-5 p-6">
          <p
            style={{
              color:      'var(--text-2)',
              fontFamily: 'var(--font-mono)',
              fontSize:   13,
              textAlign:  'center',
              maxWidth:   '42ch',
              margin:     0,
            }}
          >
            {error}
          </p>
          <button
            type="button"
            onClick={retryWeek}
            style={{
              fontFamily:    'var(--font-sans)',
              fontSize:      13,
              fontWeight:    500,
              padding:       '10px 18px',
              borderRadius:  8,
              border:        '1px solid var(--border)',
              background:    'var(--surface)',
              color:         'var(--text-1)',
              cursor:        'pointer',
              transition:    'background 150ms var(--ease-out), border-color 150ms var(--ease-out)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--surface-2)'
              e.currentTarget.style.borderColor = 'var(--text-3)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--surface)'
              e.currentTarget.style.borderColor = 'var(--border)'
            }}
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="flex min-h-[100dvh] flex-col">
          <header
            className="sticky top-0 z-10 flex flex-col gap-2 pb-2 pt-3"
            style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}
          >
            {/* Nav row — same max-width and centering as the day panel below */}
            <div className="mx-auto w-full max-w-lg px-4 md:px-6">
              <WeekNav weekStart={week?.week_start ?? ''} weekOffset={weekOffset} onNavigate={handleNavigate} />
            </div>

            {/* Strip — wrapper centers it, pills carry their own px via scrollPadding */}
            <div className="mx-auto w-full max-w-lg overflow-hidden">
              <WeekStrip
                days={week?.days ?? []}
                selectedDayId={selectedDay?.id ?? null}
                today={TODAY}
                onSelect={handleDaySelect}
                loading={loading}
              />
            </div>
          </header>

          <main className="flex-1 py-5 md:py-8">
            {loading && !week ? (
              <Skeleton />
            ) : selectedDay ? (
              <DayPanel
                key={selectedDay.id}
                day={selectedDay}
                today={TODAY}
                onDayUpdate={updateDay}
                onDayReset={resetDay}
                onTaskToggle={toggleTask}
                onTaskCreate={createTask}
                onTaskDelete={deleteTask}
              />
            ) : null}
          </main>
        </div>
      )}
    </>
  )
}

export default App
