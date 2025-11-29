"use client"

const pulse = "bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-md"

export default function ProductDetailSkeleton() {
  return (
    <div className="px-4 py-8 max-w-7xl mx-auto space-y-10">
      <div className={`${pulse} h-4 w-48`} />
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex flex-col lg:flex-row gap-4 w-full lg:w-1/2">
          <div className="flex lg:flex-col gap-3 w-full lg:w-1/3">
            {[...Array(4)].map((_, idx) => (
              <div key={idx} className={`${pulse} w-24 h-24 lg:w-full lg:h-24`} />
            ))}
          </div>
          <div className={`${pulse} w-full aspect-[3/4]`} />
        </div>

        <div className="w-full lg:w-1/2 space-y-5">
          <div className={`${pulse} h-8 w-3/4`} />
          <div className="flex gap-2">
            {[...Array(4)].map((_, idx) => (
              <div key={idx} className={`${pulse} h-4 w-8`} />
            ))}
          </div>
          <div className={`${pulse} h-10 w-32`} />
          <div className={`${pulse} h-24 w-full`} />
          <div className="space-y-2">
            <div className={`${pulse} h-4 w-40`} />
            <div className="flex gap-2 flex-wrap">
              {[...Array(4)].map((_, idx) => (
                <div key={idx} className={`${pulse} h-10 w-24`} />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className={`${pulse} h-4 w-40`} />
            <div className="flex gap-2 flex-wrap">
              {[...Array(4)].map((_, idx) => (
                <div key={idx} className={`${pulse} h-10 w-20`} />
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className={`${pulse} h-12 w-40`} />
            <div className={`${pulse} h-12 w-28`} />
            <div className={`${pulse} h-12 w-12 rounded-full`} />
          </div>
          <div className="space-y-3 border-t pt-4">
            {[...Array(3)].map((_, idx) => (
              <div key={idx} className="flex justify-between">
                <div className={`${pulse} h-4 w-32`} />
                <div className={`${pulse} h-4 w-24`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


