'use client'

import { ReactNode, useRef, useState, Children, isValidElement } from 'react'

interface CarouselProps {
  children: ReactNode
  showScrollButtons?: boolean
}

export function Carousel({ children, showScrollButtons = true }: CarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftButton, setShowLeftButton] = useState(false)
  const [showRightButton, setShowRightButton] = useState(true)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setShowLeftButton(scrollLeft > 0)
      setShowRightButton(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  // Convert children to array and wrap each with hover tracking
  const childArray = Children.toArray(children)
  const wrappedChildren = childArray.map((child, index) => {
    if (!isValidElement(child)) return child

    // Calculate transform based on hover state
    let transform = ''
    if (hoveredIndex !== null) {
      if (index < hoveredIndex) {
        transform = 'translateX(-40px)'
      } else if (index > hoveredIndex) {
        transform = 'translateX(40px)'
      }
    }

    return (
      <div
        key={index}
        onMouseEnter={() => setHoveredIndex(index)}
        onMouseLeave={() => setHoveredIndex(null)}
        style={{
          transform,
          transition: 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {child}
      </div>
    )
  })

  return (
    <div className="relative group">
      {/* Scroll Container */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScroll}
        onLoad={checkScroll}
        className="flex gap-0 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#d1d5db #f3f4f6',
        }}
      >
        {wrappedChildren}
      </div>

      {/* Left Scroll Button */}
      {showScrollButtons && showLeftButton && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition opacity-0 group-hover:opacity-100"
          aria-label="Scroll left"
        >
          <svg
            className="w-5 h-5 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      )}

      {/* Right Scroll Button */}
      {showScrollButtons && showRightButton && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition opacity-0 group-hover:opacity-100"
          aria-label="Scroll right"
        >
          <svg
            className="w-5 h-5 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      )}

      {/* Custom scrollbar styling */}
      <style>{`
        .scroll-smooth::-webkit-scrollbar {
          height: 6px;
        }
        .scroll-smooth::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 10px;
        }
        .scroll-smooth::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .scroll-smooth::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  )
}
