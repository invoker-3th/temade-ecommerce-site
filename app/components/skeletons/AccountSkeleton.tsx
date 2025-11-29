"use client"

const pulse = "bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-md"

export default function AccountSkeleton() {
  return (
    <div className="w-full">
      <div className="w-full h-[223px] bg-[#000]/20 relative">
        <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center gap-4">
          <div className={`${pulse} h-12 w-3/4`} />
          <div className="flex gap-2">
            {[...Array(3)].map((_, idx) => (
              <div key={idx} className={`${pulse} h-4 w-16`} />
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#FFFBEB] flex flex-col md:flex-row gap-6 p-6">
        <div className="w-full md:w-1/4 space-y-4">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className={`${pulse} h-12 w-full`} />
          ))}
        </div>
        <div className="flex-1 space-y-6">
          <div className="flex justify-between">
            <div className={`${pulse} h-8 w-48`} />
            <div className={`${pulse} h-10 w-24`} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, idx) => (
              <div key={idx} className="space-y-2">
                <div className={`${pulse} h-4 w-28`} />
                <div className={`${pulse} h-12 w-full`} />
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, idx) => (
              <div key={idx} className="space-y-2">
                <div className={`${pulse} h-4 w-32`} />
                <div className={`${pulse} h-12 w-full`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}


