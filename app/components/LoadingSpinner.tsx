"use client"

import clsx from "clsx"
import styles from "./loading-spinner.module.css"

type LoadingSpinnerProps = {
  label?: string
  fullscreen?: boolean
  block?: boolean
  className?: string
}

export default function LoadingSpinner({
  label = "Loading data...",
  fullscreen = false,
  block = false,
  className,
}: LoadingSpinnerProps) {
  return (
    <div className={clsx(fullscreen && styles.fullscreen, className)}>
      <div
        className={clsx(
          styles.spinnerWrapper,
          block && styles.block,
        )}
        role="status"
        aria-live="polite"
      >
        <span className={styles.spinnerCircle} aria-hidden="true" />
        {label && <span className={styles.spinnerLabel}>{label}</span>}
      </div>
    </div>
  )
}


