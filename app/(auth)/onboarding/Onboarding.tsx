"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import { User } from '@/types/user.types'

const STYLES = {
  gradients: {
    roof: 'repeating-linear-gradient(90deg, transparent, transparent 4px, #2d1a12 4px, #2d1a12 6px)',
    wall: 'repeating-linear-gradient(0deg, transparent, transparent 8px, #2d1a12 8px, #2d1a12 10px)',
    lowerWall: 'repeating-linear-gradient(90deg, transparent, transparent 10px, #e8dfc1 10px, #e8dfc1 12px)',
  }
}

export default function Auth() {
  const [openPanel, setOpenPanel] = useState<"upper" | "lower" | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser((session?.user as unknown as User) ?? null);
    });
    return () => listener?.subscription.unsubscribe();
  }, [supabase]);

  const toggleUpper = () => setOpenPanel((prev) => (prev === "upper" ? null : "upper"))
  const toggleLower = () => setOpenPanel((prev) => (prev === "lower" ? null : "lower"))
  const goTo = (path: string) => router.push(path)

  const upperOpen = openPanel === "upper"
  const lowerOpen = openPanel === "lower"

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#87CEEB]"
      style={{ margin: 0, fontFamily: 'var(--font-archivo), sans-serif' }}
    >
      {/* Grain filter */}
      <svg className="hidden">
        <filter id="grain-ob">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feComposite operator="in" in2="SourceGraphic" />
          <feColorMatrix type="matrix" values="1 0 0 0 0,0 1 0 0 0,0 0 1 0 0,0 0 0 0.08 0" />
          <feBlend mode="multiply" in2="SourceGraphic" />
        </filter>
      </svg>

      {/* Clouds — left side */}
      <div className="absolute top-[8%] left-[-2%] pointer-events-none z-[5]">
        <img src="/logo/clouds/cloud-element-23.png" alt="" className="w-56 md:w-80 opacity-90 float-animation" />
      </div>
      <div className="absolute top-[30%] left-[-4%] pointer-events-none z-[3]">
        <img src="/logo/clouds/cloud-element-23.png" alt="" className="w-36 md:w-52 opacity-40 float-animation-reverse" />
      </div>
      <div className="absolute top-[5%] left-[28%] pointer-events-none z-[4]">
        <img src="/logo/clouds/cloud-element-25.png" alt="" className="w-32 md:w-44 opacity-60 float-animation-slow" />
      </div>

      {/* Clouds — right side */}
      <div className="absolute top-[8%] right-[-2%] pointer-events-none z-[5]">
        <img src="/logo/clouds/cloud-element-24.png" alt="" className="w-64 md:w-96 opacity-85 float-animation-reverse" />
      </div>
      <div className="absolute top-[22%] right-[20%] pointer-events-none z-[4]">
        <img src="/logo/clouds/cloud-element-24.png" alt="" className="w-28 md:w-40 opacity-60 float-animation" />
      </div>
      <div className="absolute top-[40%] right-[8%] pointer-events-none z-[5]">
        <img src="/logo/clouds/cloud-element-23.png" alt="" className="w-28 md:w-40 opacity-70 float-animation-slow" />
      </div>

      {/* Green hills (like the homepage) */}
      <div
        className="absolute bottom-0 left-[30%] -translate-x-1/2 w-[280vw] md:w-[180vw] h-[30vh] z-[1] pointer-events-none"
        style={{
          background: '#98C965',
          borderTopLeftRadius: '50% 100%',
          borderTopRightRadius: '50% 100%',
          filter: 'url(#grain-ob)',
        }}
      />
      <div
        className="absolute bottom-0 left-[75%] -translate-x-1/2 w-[260vw] md:w-[160vw] h-[24vh] z-[2] pointer-events-none"
        style={{
          background: '#8ABF55',
          borderTopLeftRadius: '50% 100%',
          borderTopRightRadius: '50% 100%',
          filter: 'url(#grain-ob)',
        }}
      />
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[250vw] md:w-[150vw] h-[18vh] z-[3] pointer-events-none"
        style={{
          background: '#7EB647',
          borderTopLeftRadius: '50% 100%',
          borderTopRightRadius: '50% 100%',
          filter: 'url(#grain-ob)',
        }}
      />

      {/* House UI */}
      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">

        {/* Roof */}
        <div
          className="w-[140%] h-40 bg-[#3e2319] border-b-4 border-[#2d1a12] mb-[-4px] relative z-20"
          style={{
            clipPath: 'polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)',
            backgroundImage: STYLES.gradients.roof
          }}
        />

        {/* Upper wall / window (Sign Up) */}
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

        {/* Middle band with logo */}
        <div className="w-[125%] h-10 bg-[#3e2319] border-y-4 border-[#2d1a12] rounded-t-sm flex justify-center items-center relative z-30">
          <button
            type="button"
            onClick={() => goTo('/')}
            className="w-20 h-20 rounded-full bg-[#2d1a12] flex items-center justify-center mb-[12px] shadow-lg hover:bg-[#fbbc05] transition-colors duration-300 cursor-pointer group"
            title="Go to Home"
          >
            <img src="/assets/logo-icon-white.png" className="w-13 h-13 transition-all duration-300 group-hover:invert" alt="logo" />
          </button>
        </div>

        {/* Lower wall / door (Log In) */}
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

            <div className={`absolute inset-0 z-0 flex flex-col items-center justify-center p-4 gap-4 transition-colors duration-500 ${lowerOpen ? 'bg-[#87CEEB]' : 'bg-transparent'}`}>
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

      <style jsx global>{`
        @keyframes cloudFloat {
          0%, 100% { transform: translateX(0px); }
          50% { transform: translateX(25px); }
        }
        @keyframes cloudFloatReverse {
          0%, 100% { transform: translateX(0px); }
          50% { transform: translateX(-20px); }
        }
        .float-animation { animation: cloudFloat 12s ease-in-out infinite; }
        .float-animation-reverse { animation: cloudFloatReverse 15s ease-in-out infinite; }
        .float-animation-slow { animation: cloudFloat 18s ease-in-out infinite; }
      `}</style>
    </div>
  )
}
