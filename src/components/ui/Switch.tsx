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
      padding: 'px-0.5',
      translateX: isChecked ? 'translate-x-5' : 'translate-x-0',
    },
    md: {
      track: 'w-12 h-6',
      thumb: 'w-5 h-5',
      padding: 'px-0.5',
      translateX: isChecked ? 'translate-x-6' : 'translate-x-0',
    },
    lg: {
      track: 'w-14 h-7',
      thumb: 'w-6 h-6',
      padding: 'px-0.5',
      translateX: isChecked ? 'translate-x-7' : 'translate-x-0',
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
        ${classes.padding}
        relative inline-flex items-center rounded-full
        transition-colors duration-200 ease-out
        focus:outline-none
        ${isChecked 
          ? 'bg-gradient-primary shadow-inner' 
          : 'bg-muted border-2 border-border'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          ${classes.thumb}
          ${classes.translateX}
          inline-block rounded-full bg-white
          transition-transform duration-200 ease-out
          will-change-transform
        `}
        style={{
          boxShadow: '0 2px 6px rgba(0,0,0,0.25), 0 1px 2px rgba(0,0,0,0.15)',
        }}
      />
    </button>
  )
}
