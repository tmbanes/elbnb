"use client";

import React from "react";

export default function AuthBackground() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#8dbd59]">
      {/* Animated Clouds/Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#fcf4d9]/20 rounded-full blur-[100px] animate-blob" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#5591AB]/20 rounded-full blur-[120px] animate-blob animation-delay-2000" />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-[#fbbc05]/10 rounded-full blur-[80px] animate-blob animation-delay-4000" />
      
      {/* Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
      
      {/* Floating Clouds (CSS Only) */}
      <div className="cloud-container absolute inset-0 pointer-events-none opacity-40">
        <div className="cloud cloud-1" />
        <div className="cloud cloud-2" />
        <div className="cloud cloud-3" />
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite alternate;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .cloud {
          position: absolute;
          background: white;
          border-radius: 100px;
          filter: blur(40px);
        }
        .cloud-1 {
          width: 300px;
          height: 100px;
          top: 10%;
          left: -150px;
          animation: drift 25s linear infinite;
        }
        .cloud-2 {
          width: 400px;
          height: 120px;
          top: 40%;
          left: -200px;
          animation: drift 35s linear infinite 5s;
        }
        .cloud-3 {
          width: 250px;
          height: 80px;
          bottom: 15%;
          left: -100px;
          animation: drift 30s linear infinite 2s;
        }
        
        @keyframes drift {
          from { transform: translateX(-100%); }
          to { transform: translateX(calc(100vw + 100%)); }
        }
      `}</style>
    </div>
  );
}
