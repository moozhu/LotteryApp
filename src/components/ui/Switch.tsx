import { useState, useEffect } from 'react'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function Switch({ checked, onChange, disabled = false, size = 'md' }: SwitchProps) {
  const [isChecked, setIsChecked] = useState(checked)

  useEffect(() => {
    setIsChecked(checked)
  }, [checked])

  const handleClick = () => {
    if (disabled) return
    const newValue = !isChecked
    setIsChecked(newValue)
    onChange(newValue)
  }

  const sizeClasses = {
    sm: {
      track: 'w-10 h-5',
      thumb: 'w-4 h-4',
      translate: 'translate-x-5',
    },
    md: {
      track: 'w-12 h-6',
      thumb: 'w-5 h-5',
      translate: 'translate-x-6',
    },
    lg: {
      track: 'w-14 h-7',
      thumb: 'w-6 h-6',
      translate: 'translate-x-7',
    },
  }

  const classes = sizeClasses[size]

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      disabled={disabled}
      onClick={handleClick}
      className={`
        ${classes.track}
        relative inline-flex items-center rounded-full transition-all duration-300 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background
        ${isChecked 
          ? 'bg-gradient-primary shadow-inner' 
          : 'bg-muted border-2 border-border'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}
      `}
    >
      <span
        className={`
          ${classes.thumb}
          inline-block rounded-full bg-white shadow-md transform transition-all duration-300 ease-in-out
          ${isChecked ? classes.translate : 'translate-x-0.5'}
        `}
        style={{
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}
      />
    </button>
  )
}
