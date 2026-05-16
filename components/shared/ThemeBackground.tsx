"use client";

import React from 'react';

interface ThemeBackgroundProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  showHills?: boolean;
  showClouds?: boolean;
  animate?: boolean;
  isExiting?: boolean;
}

export const ThemeBackground: React.FC<ThemeBackgroundProps> = ({ 
  children, 
  className = "", 
  contentClassName = "",
  showHills = true, 
  showClouds = true,
  animate = true,
  isExiting = false
}) => {
  return (
    <div className={`min-h-screen w-full bg-[#87CEEB] relative overflow-hidden font-sans selection:bg-emerald-500/30 transition-opacity duration-400 ${isExiting ? 'opacity-0' : 'opacity-100'} ${className}`}>
      
      {showClouds && (
        <>
          {/* ─── CLOUD ELEMENTS ─── */}
          <div className="absolute top-[10%] left-[-2%] pointer-events-none z-[1]">
            <img src="/logo/clouds/cloud-element-23.png" alt="Cloud" className="w-48 md:w-80 opacity-90 float-animation" />
          </div>
          <div className="absolute top-[25%] left-[-5%] pointer-events-none z-[1]">
            <img src="/logo/clouds/cloud-element-23.png" alt="Cloud" className="w-40 md:w-64 opacity-40 float-animation-reverse" />
          </div>
          <div className="absolute top-[5%] left-[30%] pointer-events-none z-[1]">
            <img src="/logo/clouds/cloud-element-25.png" alt="Cloud" className="w-32 md:w-56 opacity-60 float-animation-slow" />
          </div>
          <div className="absolute top-[35%] left-[8%] pointer-events-none z-[1]">
            <img src="/logo/clouds/cloud-element-25.png" alt="Cloud" className="w-20 md:w-32 opacity-80 float-animation-slow" />
          </div>
          <div className="absolute top-[10%] right-[-2%] pointer-events-none z-[1]">
            <img src="/logo/clouds/cloud-element-24.png" alt="Cloud" className="w-56 md:w-96 opacity-85 float-animation-reverse" />
          </div>
          <div className="absolute top-[18%] right-[25%] pointer-events-none z-[1]">
            <img src="/logo/clouds/cloud-element-24.png" alt="Cloud" className="w-24 md:w-48 opacity-70 float-animation" />
          </div>
          <div className="absolute top-[38%] right-[12%] pointer-events-none z-[1]">
            <img src="/logo/clouds/cloud-element-23.png" alt="Cloud" className="w-24 md:w-48 opacity-75 float-animation" />
          </div>
          <div className="absolute top-[42%] left-[48%] pointer-events-none z-[1]">
            <img src="/logo/clouds/cloud-element-25.png" alt="Cloud" className="w-16 md:w-28 opacity-80 float-animation" />
          </div>
        </>
      )}

      {showHills && (
        <>
          {/* ─── GROUND HILL ─── */}
          <div 
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[250vw] md:w-[150vw] h-[40vh] z-0 pointer-events-none"
            style={{
              background: '#7EB647',
              borderTopLeftRadius: '50% 100%',
              borderTopRightRadius: '50% 100%',
              filter: 'url(#grain)',
            }}
          />

          <svg className="hidden">
            <filter id="grain">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
              <feComposite operator="in" in2="SourceGraphic" />
              <feColorMatrix type="matrix" values="1 0 0 0 0,0 1 0 0 0,0 0 1 0 0,0 0 0 0.08 0" />
              <feBlend mode="multiply" in2="SourceGraphic" />
            </filter>
          </svg>
        </>
      )}

      {/* ─── CONTENT ─── */}
      <div className={`relative z-10 w-full min-h-screen ${animate ? 'animate-pop' : ''} ${contentClassName}`}>
        {children}
      </div>

      <style jsx global>{`
        @keyframes pop {
          0% {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-pop {
          animation: pop 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
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
  );
};
