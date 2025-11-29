"use client"

type Props = {
  items?: number
}

const pulse = "bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-2xl"

export default function SearchResultsSkeleton({ items = 6 }: Props) {
  return (
    <div className="grid gap-4 mt-4 grid-cols-2 md:grid-cols-3">
      {Array.from({ length: items }).map((_, idx) => (
        <div key={idx} className="bg-white shadow p-3 rounded-2xl space-y-3">
          <div className={`${pulse} w-full h-40`} />
          <div className={`${pulse} h-4 w-3/4`} />
          <div className={`${pulse} h-4 w-1/3`} />
        </div>
      ))}
    </div>
  )
}


