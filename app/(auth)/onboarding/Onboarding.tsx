"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STYLES = {
  colors: {
    background: '#8dbd59',
    woodDark: '#2d1a12',
    woodLight: '#3e2319',
    paper: '#fcf4d9',
    accent: '#fbbc05',
    glass: '#1a1a1a',
  },
  gradients: {
    roof: 'repeating-linear-gradient(90deg, transparent, transparent 4px, #2d1a12 4px, #2d1a12 6px)',
    wall: 'repeating-linear-gradient(0deg, transparent, transparent 8px, #2d1a12 8px, #2d1a12 10px)',
    lowerWall: 'repeating-linear-gradient(90deg, transparent, transparent 10px, #e8dfc1 10px, #e8dfc1 12px)',
  }
}

export default function Auth() {
  const [openPanel, setOpenPanel] = useState<"upper" | "lower" | null>(null)
  const router = useRouter()

  const toggleUpper = () => {
    setOpenPanel((prev) => (prev === "upper" ? null : "upper"))
  }

  const toggleLower = () => {
    setOpenPanel((prev) => (prev === "lower" ? null : "lower"))
  }

  const goTo = (path: string) => {
    router.push(path)
  }

  const upperOpen = openPanel === "upper"
  const lowerOpen = openPanel === "lower"

  return (
    <div className="min-h-screen bg-[#8dbd59] flex items-center justify-center p-4" style={{ margin: 0, fontFamily: 'var(--font-archivo), sans-serif' }}>
      <div className="w-full max-w-4xl flex flex-col items-center">

        <div
          className="w-[140%] h-40 bg-[#3e2319] border-b-4 border-[#2d1a12] mb-[-4px] relative z-20"
          style={{
            clipPath: 'polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)',
            backgroundImage: STYLES.gradients.roof
          }}
        />

        <div
          className="w-[120%] aspect-[30/7] bg-[#3e2319] border-x-2 border-[#2d1a12] relative overflow-hidden flex items-center justify-center"
          style={{ backgroundImage: STYLES.gradients.wall }}
        >
          <div className="w-[45%] h-[100%] grid grid-cols-2 gap-1 relative">

            <div className={`absolute inset-y-0 left-0 w-1/2 bg-[#fcf4d9] border-[#44291B] transition-transform duration-700 z-10 grid grid-cols-2 grid-rows-2 p-1 gap-1 ${upperOpen ? '-translate-x-full' : 'translate-x-0'}`}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`border-2 border-[#44291B] rounded-sm transition-colors duration-700 ${upperOpen ? 'bg-[#F2C908]' : 'bg-[#1e1e1e]'}`} />
              ))}
              <div className="absolute right-0.5 top-1/2 -translate-y-1/2 flex items-center">
                <button type="button" onClick={(e) => { e.stopPropagation(); toggleUpper(); }} className="w-10 h-10 rounded-full bg-[#3e2319] border-4 border-[#fcf4d9] text-[#fcf4d9] text-xs flex items-center justify-center hover:bg-[#2d1a12] transition-colors">
                  {upperOpen ? '→' : '←'}
                </button>
              </div>
            </div>

            <div className={`absolute inset-y-0 right-0 w-1/2 bg-[#fcf4d9] border border-[#2d1a12] transition-transform duration-700 z-10 grid grid-cols-2 grid-rows-2 p-1 gap-1 ${upperOpen ? 'translate-x-full' : 'translate-x-0'}`}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`border-2 border-[#44291B] rounded-sm transition-colors duration-700 ${upperOpen ? 'bg-[#F2C908]' : 'bg-[#1e1e1e]'}`} />
              ))}
              <div className="absolute left-0.5 top-1/2 -translate-y-1/2 flex items-center">
                <button type="button" onClick={(e) => { e.stopPropagation(); toggleUpper(); }} className="w-10 h-10 rounded-full bg-[#3e2319] border-4 border-[#fcf4d9] text-[#fcf4d9] text-xs flex items-center justify-center hover:bg-[#2d1a12] transition-colors">
                  {upperOpen ? '←' : '→'}
                </button>
              </div>
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center z-0 p-4 gap-2">
              {upperOpen && (
                <>
                  <h2 className="text-xl font-bold text-[#fcf4d9]">New Here? Click to Register!</h2>
                  <button type="button" onClick={() => goTo('/signup')} className="px-20 py-3 bg-[#fbbc05] text-[#1a1a1a] rounded-full font-semibold hover:bg-[#fcf4d9] transition-all">
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="w-[125%] h-10 bg-[#3e2319] border-y-4 border-[#2d1a12] rounded-t-sm flex justify-center items-center relative z-30">
          <div className="w-20 h-20 rounded-full bg-[#2d1a12] flex items-center justify-center mb-[12px] shadow-lg">
            <img src="/assets/logo-icon-white.png" className="w-13 h-13" alt="logo" />
          </div>
        </div>

        <div
          className="w-[125%] aspect-[30/7] bg-[#fcf4d9] border-x-2 border-[#2d1a12] border-b-4 flex items-end justify-center relative overflow-hidden"
          style={{ backgroundImage: STYLES.gradients.lowerWall }}
        >
          <div className="w-[45%] h-[100%] grid grid-cols-2 gap-1 relative">

            <div className={`absolute inset-y-0 left-0 w-1/2 bg-[#fcf4d9] transition-transform duration-700 z-10 grid grid-cols-2 grid-rows-2 p-1 gap-1 ${lowerOpen ? '-translate-x-full' : 'translate-x-0'}`}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`border-2 border-[#44291B] rounded-sm transition-colors duration-700 ${lowerOpen ? 'bg-[#F2C908]' : 'bg-[#1e1e1e]'}`} />
              ))}
              <div className="absolute right-0.5 top-1/2 -translate-y-1/2 flex items-center">
                <button onClick={(e) => { e.stopPropagation(); toggleLower(); }} className="w-10 h-10 rounded-full bg-[#3e2319] border-4 border-[#fcf4d9] text-[#fcf4d9] text-xs flex items-center justify-center hover:bg-[#2d1a12] transition-colors">
                  {lowerOpen ? '→' : '←'}
                </button>
              </div>
            </div>

            <div className={`absolute inset-y-0 right-0 w-1/2 bg-[#fcf4d9] transition-transform duration-700 z-10 grid grid-cols-2 grid-rows-2 p-1 gap-1 ${lowerOpen ? 'translate-x-full' : 'translate-x-0'}`}>
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`border-2 border-[#44291B] rounded-sm transition-colors duration-700 ${lowerOpen ? 'bg-[#F2C908]' : 'bg-[#1e1e1e]'}`} />
              ))}
              <div className="absolute left-0.5 top-1/2 -translate-y-1/2 flex items-center">
                <button onClick={(e) => { e.stopPropagation(); toggleLower(); }} className="w-10 h-10 rounded-full bg-[#3e2319] border-4 border-[#fcf4d9] text-[#fcf4d9] text-xs flex items-center justify-center hover:bg-[#2d1a12] transition-colors">
                  {lowerOpen ? '←' : '→'}
                </button>
              </div>
            </div>

            <div className={`absolute inset-0 z-0 flex flex-col items-center justify-center p-4 gap-4 transition-colors duration-500 ${lowerOpen ? 'bg-[#8dbd59]' : 'bg-transparent'}`}>
              {lowerOpen && (
                <>
                  <h2 className="text-xl font-bold text-[#1e1e1e] text-center">Choose Login Method</h2>
                  <div className="flex flex-col gap-3 w-full items-center">
                    <button
                      type="button"
                      onClick={() => goTo('/login')}
                      className="w-full max-w-[240px] h-10 px-4 bg-[#3e2319] text-[#fcf4d9] rounded-full hover:bg-[#2d1a12] transition-all text-sm font-medium"
                    >
                      Log In with Email
                    </button>
                    <button
                      type="button"
                      onClick={() => goTo('/google-login')}
                      className="w-full max-w-[240px] h-10 px-4 bg-[#fbbc05] text-[#2d1a1a] rounded-full hover:bg-[#fcf4d9] transition-all text-sm font-medium"
                    >
                      Log In with Google
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}