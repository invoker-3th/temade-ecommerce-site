"use client"

type Props = {
  viewMode?: "grid" | "list"
  items?: number
}

const pulseBase = "bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-md"

export default function ProductGridSkeleton({ viewMode = "grid", items }: Props) {
  const count = items ?? (viewMode === "grid" ? 8 : 4)
  const placeholders = Array.from({ length: count })

  return (
    <div className="w-full">
      <section className="flex flex-col items-center text-center gap-3 mb-8">
        <div className={`${pulseBase} h-8 w-48`} />
        <div className={`${pulseBase} h-4 w-32`} />
        <div className="flex gap-2">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className={`${pulseBase} h-7 w-16`} />
          ))}
        </div>
      </section>

      <div
        className={
          viewMode === "grid"
            ? "grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            : "flex flex-col gap-6"
        }
      >
        {placeholders.map((_, idx) =>
          viewMode === "grid" ? (
            <div key={idx} className="space-y-3">
              <div className={`${pulseBase} aspect-[2/3] w-full`} />
              <div className={`${pulseBase} h-4 w-3/4`} />
              <div className={`${pulseBase} h-3 w-2/4`} />
              <div className={`${pulseBase} h-4 w-1/2`} />
            </div>
          ) : (
            <div key={idx} className="flex flex-col sm:flex-row gap-4 border border-neutral-200 rounded-2xl p-4">
              <div className={`${pulseBase} w-full sm:w-1/3 h-56`} />
              <div className="flex-1 space-y-3">
                <div className={`${pulseBase} h-6 w-1/2`} />
                <div className={`${pulseBase} h-4 w-3/4`} />
                <div className="flex gap-2">
                  {[...Array(3)].map((__, badgeIdx) => (
                    <div key={badgeIdx} className={`${pulseBase} h-6 w-16`} />
                  ))}
                </div>
                <div className={`${pulseBase} h-6 w-32`} />
                <div className="flex gap-3">
                  <div className={`${pulseBase} h-10 w-32`} />
                  <div className={`${pulseBase} h-10 w-24`} />
                </div>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  )
}


