'use client'

import { ReactNode, useRef, useState, Children, isValidElement, useEffect, useCallback } from 'react'

interface CarouselProps {
  children: ReactNode
}

export function Carousel({ children }: CarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  
  // Hover-based scroll state
  const isScrollingRef = useRef<boolean>(false)
  const scrollDirectionRef = useRef<'left' | 'right' | null>(null)
  const animationFrameRef = useRef<number>()

  const scrollLoop = useCallback(() => {
    if (!isScrollingRef.current || !scrollContainerRef.current) return

    const speed = 7 // Pixels per frame
    if (scrollDirectionRef.current === 'left') {
      scrollContainerRef.current.scrollLeft -= speed
    } else if (scrollDirectionRef.current === 'right') {
      scrollContainerRef.current.scrollLeft += speed
    }

    animationFrameRef.current = requestAnimationFrame(scrollLoop)
  }, [])

  const startScroll = (direction: 'left' | 'right') => {
    scrollDirectionRef.current = direction
    if (!isScrollingRef.current) {
      isScrollingRef.current = true
      scrollLoop()
    }
  }

  const stopScroll = () => {
    isScrollingRef.current = false
    scrollDirectionRef.current = null
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return
    const { left, width } = scrollContainerRef.current.getBoundingClientRect()
    const x = e.clientX - left
    const threshold = 150 // Pixels from edge to trigger scroll

    if (x < threshold) {
      startScroll('left')
    } else if (x > width - threshold) {
      startScroll('right')
    } else {
      stopScroll()
    }
  }

  useEffect(() => {
    return () => stopScroll() // Cleanup on unmount
  }, [])

  // Convert children to array and wrap each with hover tracking
  const childArray = Children.toArray(children)
  const wrappedChildren = childArray.map((child, index) => {
    if (!isValidElement(child)) return child

    const isHovered = hoveredIndex === index;

    // Calculate transform based on hover state
    let transform = ''
    if (hoveredIndex !== null) {
      if (index < hoveredIndex) {
        transform = 'translateX(-30px)'
      } else if (index > hoveredIndex) {
        transform = 'translateX(30px)'
      }
    }

    return (
      <div
        key={index}
        onMouseEnter={() => setHoveredIndex(index)}
        onMouseLeave={() => setHoveredIndex(null)}
        className="transition-all duration-300"
        style={{
          transform: isHovered ? 'scale(1.08) translateY(-12px)' : transform,
          transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
          zIndex: isHovered ? 50 : childArray.length - index,
          marginLeft: index === 0 ? 0 : '-3rem',
          position: 'relative',
        }}
      >
        <div className="transition-all duration-300 rounded-2xl">
          {child}
        </div>
      </div>
    )
  })

  return (
    <div 
      className="relative group w-full"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        stopScroll()
        setHoveredIndex(null)
      }}
    >
      {/* Scroll Container */}
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto pt-8 pb-12 snap-x snap-mandatory px-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {wrappedChildren}
      </div>
    </div>
  )
}
