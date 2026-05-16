import axios from 'axios'
import type { Day, Task, Week } from '../types/api'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' },
})

export const getWeek = (offset = 0): Promise<Week> =>
  api.get('/api/weeks', { params: { offset } }).then(r => r.data)

export const updateDay = (
  id: number,
  payload: { day_type?: string; wake_time?: string; notes?: string; focus?: string },
): Promise<Day> =>
  api.patch(`/api/days/${id}`, payload).then(r => r.data)

export const resetDay = (id: number): Promise<Day> =>
  api.post(`/api/days/${id}/reset`).then(r => r.data)

export const toggleTask = (id: number, completed: boolean): Promise<Task> =>
  api.patch(`/api/tasks/${id}`, { completed }).then(r => r.data)

export const createTask = (dayId: number, label: string): Promise<Task> =>
  api.post(`/api/days/${dayId}/tasks`, { label }).then(r => r.data)

export const deleteTask = (id: number): Promise<void> =>
  api.delete(`/api/tasks/${id}`).then(() => undefined)
