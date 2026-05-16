import { useEffect, useRef, useState } from 'react'
import { CheckIcon } from '@phosphor-icons/react'

interface Props {
  value: string
  onCommit: (value: string) => Promise<boolean>
}

const FocusInput = ({ value, onCommit }: Props) => {
  const [local, setLocal] = useState(value)
  const [savedFlash, setSavedFlash] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedClearRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setLocal(value)
  }, [value])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (savedClearRef.current) clearTimeout(savedClearRef.current)
    }
  }, [])

  const handleChange = (v: string) => {
    setLocal(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const ok = await onCommit(v)
      if (ok) {
        setSavedFlash(true)
        if (savedClearRef.current) clearTimeout(savedClearRef.current)
        savedClearRef.current = setTimeout(() => setSavedFlash(false), 1600)
      }
    }, 600)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
        Today's focus
      </label>
      <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
        <input
          type="text"
          value={local}
          onChange={e => handleChange(e.target.value)}
          placeholder="What does winning today look like?"
          maxLength={120}
          style={{
            fontFamily:   'var(--font-sans)',
            fontSize:     14,
            color:        'var(--text-1)',
            background:   'transparent',
            border:       'none',
            borderBottom: '1px solid var(--border)',
            outline:      'none',
            padding:      '4px 0 8px',
            flex:         '1 1 auto',
            minWidth:     0,
            transition:   'border-color 150ms var(--ease-out)',
            colorScheme:  'dark',
          }}
          onFocus={e => {
            e.currentTarget.style.borderBottomColor = 'var(--accent)'
          }}
          onBlur={e => {
            e.currentTarget.style.borderBottomColor = 'var(--border)'
          }}
        />
        {savedFlash ? (
          <CheckIcon className="ds-saved-check" size={18} weight="bold" aria-hidden />
        ) : (
          <span style={{ width: 18, flexShrink: 0 }} aria-hidden />
        )}
      </div>
    </div>
  )
}

export default FocusInput
