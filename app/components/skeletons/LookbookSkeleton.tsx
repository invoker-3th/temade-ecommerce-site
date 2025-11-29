"use client"

const pulse = "bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-md"

export default function LookbookSkeleton() {
  return (
    <div className="py-10 space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`${pulse} w-full h-[300px] md:h-[500px]`} />
        <div className={`${pulse} w-full h-[300px] md:h-[500px]`} />
      </div>
      {[...Array(3)].map((_, idx) => (
        <div key={idx} className="space-y-6">
          <div className={`${pulse} h-16 md:h-24 w-4/5 mx-auto`} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((__, imgIdx) => (
              <div key={imgIdx} className={`${pulse} w-full min-h-[300px] md:min-h-[400px]`} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}


