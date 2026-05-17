'use client'

export function BackgroundDecor() {
  return (
    <>
      {/* Grain filter */}
      <svg className="hidden">
        <filter id="grain-bg-decor">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feComposite operator="in" in2="SourceGraphic" />
          <feColorMatrix type="matrix" values="1 0 0 0 0,0 1 0 0 0,0 0 1 0 0,0 0 0 0.08 0" />
          <feBlend mode="multiply" in2="SourceGraphic" />
        </filter>
      </svg>

      {/* Clouds — left edge */}
      <div className="fixed top-[4%] left-[-4%] pointer-events-none z-[1]">
        <img src="/logo/clouds/cloud-element-23.png" alt="" className="w-52 md:w-72 bg-decor-float" style={{ opacity: 0.45, filter: 'brightness(0.78) sepia(0.25)' }} />
      </div>
      <div className="fixed top-[36%] left-[-3%] pointer-events-none z-[1]">
        <img src="/logo/clouds/cloud-element-23.png" alt="" className="w-36 md:w-52 bg-decor-float-rev" style={{ opacity: 0.32, filter: 'brightness(0.78) sepia(0.25)' }} />
      </div>
      <div className="fixed top-[64%] left-[-2%] pointer-events-none z-[1]">
        <img src="/logo/clouds/cloud-element-25.png" alt="" className="w-24 md:w-36 bg-decor-float-slow" style={{ opacity: 0.22, filter: 'brightness(0.78) sepia(0.25)' }} />
      </div>

      {/* Clouds — right edge */}
      <div className="fixed top-[6%] right-[-4%] pointer-events-none z-[1]">
        <img src="/logo/clouds/cloud-element-24.png" alt="" className="w-56 md:w-80 bg-decor-float-rev" style={{ opacity: 0.45, filter: 'brightness(0.78) sepia(0.25)' }} />
      </div>
      <div className="fixed top-[28%] right-[-2%] pointer-events-none z-[1]">
        <img src="/logo/clouds/cloud-element-24.png" alt="" className="w-32 md:w-48 bg-decor-float" style={{ opacity: 0.32, filter: 'brightness(0.78) sepia(0.25)' }} />
      </div>
      <div className="fixed top-[52%] right-[-1%] pointer-events-none z-[1]">
        <img src="/logo/clouds/cloud-element-23.png" alt="" className="w-20 md:w-32 bg-decor-float-slow" style={{ opacity: 0.22, filter: 'brightness(0.78) sepia(0.25)' }} />
      </div>

      {/* Clouds — top center accents */}
      <div className="fixed top-[2%] left-[22%] pointer-events-none z-[1]">
        <img src="/logo/clouds/cloud-element-25.png" alt="" className="w-20 md:w-28 bg-decor-float-slow" style={{ opacity: 0.28, filter: 'brightness(0.78) sepia(0.25)' }} />
      </div>
      <div className="fixed top-[3%] right-[20%] pointer-events-none z-[1]">
        <img src="/logo/clouds/cloud-element-25.png" alt="" className="w-16 md:w-24 bg-decor-float" style={{ opacity: 0.28, filter: 'brightness(0.78) sepia(0.25)' }} />
      </div>

      {/* Hills — bottom */}
      <div
        className="fixed bottom-0 left-[28%] -translate-x-1/2 w-[280vw] md:w-[180vw] h-[18vh] pointer-events-none z-[1]"
        style={{ background: '#98C965', borderTopLeftRadius: '50% 100%', borderTopRightRadius: '50% 100%', filter: 'url(#grain-bg-decor)', opacity: 0.38 }}
      />
      <div
        className="fixed bottom-0 left-[72%] -translate-x-1/2 w-[260vw] md:w-[160vw] h-[13vh] pointer-events-none z-[1]"
        style={{ background: '#8ABF55', borderTopLeftRadius: '50% 100%', borderTopRightRadius: '50% 100%', filter: 'url(#grain-bg-decor)', opacity: 0.38 }}
      />
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[250vw] md:w-[150vw] h-[9vh] pointer-events-none z-[1]"
        style={{ background: '#7EB647', borderTopLeftRadius: '50% 100%', borderTopRightRadius: '50% 100%', filter: 'url(#grain-bg-decor)', opacity: 0.38 }}
      />

      <style jsx global>{`
        @keyframes bgDecorFloat { 0%,100%{transform:translateX(0)} 50%{transform:translateX(20px)} }
        @keyframes bgDecorFloatRev { 0%,100%{transform:translateX(0)} 50%{transform:translateX(-16px)} }
        .bg-decor-float { animation: bgDecorFloat 14s ease-in-out infinite; }
        .bg-decor-float-rev { animation: bgDecorFloatRev 17s ease-in-out infinite; }
        .bg-decor-float-slow { animation: bgDecorFloat 22s ease-in-out infinite; }
      `}</style>
    </>
  )
}
