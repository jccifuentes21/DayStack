import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import * as client from '../api/client'
import type { Day, Task, Week } from '../types/api'

interface UseWeekReturn {
  week: Week | null
  weekOffset: number
  loading: boolean
  error: string | null
  retryWeek: () => void
  navigateByWeeks: (delta: number) => void
  updateDay: (dayId: number, payload: { day_type?: string; wake_time?: string; notes?: string; focus?: string }) => Promise<boolean>
  resetDay: (dayId: number) => Promise<void>
  toggleTask: (taskId: number, completed: boolean) => Promise<void>
  createTask: (dayId: number, label: string) => Promise<void>
  deleteTask: (taskId: number) => void
}

const normalizeWeek = (week: Week): Week => ({
  ...week,
  week_start: week.week_start.slice(0, 10),
  days: week.days.map(d => ({ ...d, date: d.date.slice(0, 10) })),
})

const applyTaskToggle = (week: Week | null, taskId: number, completed: boolean): Week | null => {
  if (!week) return null
  return {
    ...week,
    days: week.days.map(d => ({
      ...d,
      tasks: d.tasks.map(t => (t.id === taskId ? { ...t, completed } : t)),
    })),
  }
}

const replaceDay = (week: Week | null, updated: Day): Week | null => {
  if (!week) return null
  return {
    ...week,
    days: week.days.map(d => (d.id === updated.id ? updated : d)),
  }
}

const cloneDay = (d: Day): Day => structuredClone(d)

const errMsg = (e: unknown) =>
  e instanceof Error ? e.message : 'Something went wrong'

export const useWeek = (): UseWeekReturn => {
  const [week, setWeek] = useState<Week | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const offsetRef = useRef(0)

  useEffect(() => {
    fetchWeek(0)
  }, [])

  const fetchWeek = async (offset: number) => {
    setLoading(true)
    setError(null)
    try {
      const data = await client.getWeek(offset)
      setWeek(normalizeWeek(data))
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }

  const navigateByWeeks = (delta: number) => {
    const next = offsetRef.current + delta
    offsetRef.current = next
    setWeekOffset(next)
    fetchWeek(next)
  }

  const retryWeek = () => fetchWeek(offsetRef.current)

  const restoreDayFromSnapshot = async (dayId: number, snapshot: Day) => {
    try {
      const raw: Day = await client.updateDay(dayId, {
        day_type: snapshot.day_type,
        wake_time: snapshot.wake_time,
        notes: snapshot.notes,
        focus: snapshot.focus,
      })
      const updated: Day = { ...raw, date: raw.date.slice(0, 10) }

      const templatesSnap = snapshot.tasks.filter(t => t.source === 'template').sort((a, b) => a.sort_order - b.sort_order)
      const templatesNow = updated.tasks.filter(t => t.source === 'template').sort((a, b) => a.sort_order - b.sort_order)
      for (let i = 0; i < templatesSnap.length; i++) {
        const st = templatesSnap[i]
        const nt = templatesNow[i]
        if (nt && st.label === nt.label && st.completed !== nt.completed) {
          await client.toggleTask(nt.id, st.completed)
        }
      }

      const customsSnap = snapshot.tasks.filter(t => t.source === 'custom').sort((a, b) => a.sort_order - b.sort_order)
      for (const st of customsSnap) {
        const created = await client.createTask(dayId, st.label)
        if (st.completed !== created.completed) {
          await client.toggleTask(created.id, st.completed)
        }
      }

      const data = await client.getWeek(offsetRef.current)
      setWeek(normalizeWeek(data))
    } catch (e) {
      toast.error(`Couldn't undo reset: ${errMsg(e)}`, { autoClose: 4000 })
      throw e
    }
  }

  const updateDay = async (
    dayId: number,
    payload: { day_type?: string; wake_time?: string; notes?: string; focus?: string },
  ): Promise<boolean> => {
    try {
      const raw: Day = await client.updateDay(dayId, payload)
      const updated: Day = { ...raw, date: raw.date.slice(0, 10) }
      setWeek(prev => replaceDay(prev, updated))
      return true
    } catch (e) {
      toast.error(`Failed to save: ${errMsg(e)}`, { autoClose: 3000 })
      return false
    }
  }

  const resetDay = async (dayId: number) => {
    const snap = week?.days.find(d => d.id === dayId)
    if (!snap) return
    const snapshot = cloneDay(snap)

    try {
      const raw: Day = await client.resetDay(dayId)
      const updated: Day = { ...raw, date: raw.date.slice(0, 10) }
      setWeek(prev => replaceDay(prev, updated))

      toast(
        ({ closeToast }) => (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span style={{ color: 'var(--text-2)', fontSize: 13 }}>Day reset</span>
            <button
              type="button"
              onClick={() => {
                closeToast?.()
                void restoreDayFromSnapshot(dayId, snapshot).catch(() => {})
              }}
              style={{
                color:       'var(--accent)',
                background:  'none',
                border:      'none',
                cursor:      'pointer',
                fontFamily:  'var(--font-sans)',
                fontSize:    13,
                fontWeight:  500,
                padding:     '0 0 0 16px',
                flexShrink:  0,
              }}
            >
              Undo
            </button>
          </span>
        ),
        {
          theme:     'dark',
          autoClose: 6000,
        },
      )
    } catch (e) {
      toast.error(`Reset failed: ${errMsg(e)}`, { autoClose: 3000 })
    }
  }

  const toggleTask = async (taskId: number, completed: boolean) => {
    setWeek(prev => applyTaskToggle(prev, taskId, completed))
    try {
      await client.toggleTask(taskId, completed)
    } catch {
      setWeek(prev => applyTaskToggle(prev, taskId, !completed))
      toast.error('Failed to save — change reverted', { autoClose: 3000 })
    }
  }

  const createTask = async (dayId: number, label: string) => {
    try {
      const task: Task = await client.createTask(dayId, label)
      setWeek(prev => {
        if (!prev) return null
        return {
          ...prev,
          days: prev.days.map(d =>
            d.id === dayId ? { ...d, tasks: [...d.tasks, task] } : d,
          ),
        }
      })
    } catch (e) {
      toast.error(`Failed to add task: ${errMsg(e)}`, { autoClose: 3000 })
      throw e // re-throw so AddTaskInput can clear its busy state
    }
  }

  const deleteTask = (taskId: number) => {
    // Capture task data before removing from state so we can restore on undo
    let deletedTask: Task | undefined
    let deletedDayId: number | undefined

    setWeek(prev => {
      if (!prev) return null
      return {
        ...prev,
        days: prev.days.map(d => {
          const found = d.tasks.find(t => t.id === taskId)
          if (found) {
            deletedTask = found
            deletedDayId = d.id
            return { ...d, tasks: d.tasks.filter(t => t.id !== taskId) }
          }
          return d
        }),
      }
    })

    const restore = () => {
      if (!deletedTask || !deletedDayId) return
      const task = deletedTask
      const dayId = deletedDayId
      setWeek(prev => {
        if (!prev) return null
        return {
          ...prev,
          days: prev.days.map(d =>
            d.id === dayId
              ? { ...d, tasks: [...d.tasks, task].sort((a, b) => a.sort_order - b.sort_order) }
              : d
          ),
        }
      })
    }

    let didUndo = false

    toast(
      ({ closeToast }) => (
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span style={{ color: 'var(--text-2)', fontSize: 13 }}>Task removed</span>
          <button
            onClick={() => { didUndo = true; restore(); closeToast?.() }}
            style={{
              color:       'var(--accent)',
              background:  'none',
              border:      'none',
              cursor:      'pointer',
              fontFamily:  'var(--font-sans)',
              fontSize:    13,
              fontWeight:  500,
              padding:     '0 0 0 16px',
              flexShrink:  0,
            }}
          >
            Undo
          </button>
        </span>
      ),
      {
        theme:     'dark',
        autoClose: 4000,
        onClose:   () => {
          if (!didUndo) {
            client.deleteTask(taskId).catch(() => fetchWeek(offsetRef.current))
          }
        },
      },
    )
  }

  return { week, weekOffset, loading, error, retryWeek, navigateByWeeks, updateDay, resetDay, toggleTask, createTask, deleteTask }
}
