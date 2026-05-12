"use client"

import { useEffect, useState } from "react"

const FRAMES = Array.from({ length: 10 }, (_, i) =>
  `/logo/loading-animation/elbnb-loading-${String(i + 4).padStart(2, "0")}.png`
)

const FRAME_DURATION = 40
const FADE_DURATION = 20

export function PageLoader() {
  const [current, setCurrent] = useState(0)
  const [next, setNext] = useState(1)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true)

      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % FRAMES.length)
        setNext((prev) => (prev + 1) % FRAMES.length)
        setFading(false)
      }, FADE_DURATION)
    }, FRAME_DURATION + FADE_DURATION)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="page-loader w-full h-full flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in-95 duration-500 ease-out">
      <div className="relative flex items-center justify-center mb-6 w-40 h-40">
        {/* Next frame underneath */}
        <img
          src={FRAMES[next]}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-contain"
        />
        {/* Current frame fades out on top */}
        <img
          src={FRAMES[current]}
          alt="Loading..."
          className="absolute inset-0 w-full h-full object-contain"
          style={{
            opacity: fading ? 0 : 1,
            transition: `opacity ${FADE_DURATION}ms ease-in-out`,
          }}
        />
      </div>
      <p className="mt-2 text-[#8ba665] font-medium tracking-wide animate-pulse">Loading...</p>
    </div>
  )
}