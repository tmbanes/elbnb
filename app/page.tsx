"use client";
import { useState } from "react";

export default function Home() {
  const [count, setCount] = useState(0);
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6">
      <div className="max-w-3xl text-center space-y-8">
        {/* Logo or Brand Name */}
        <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter text-slate-900">
          Elbnb<span className="text-blue-600">.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-slate-600 font-medium max-w-xl mx-auto">
          Coming Soon!
        </p>

        {/* Counter Widget */}
        <div className="flex flex-col items-center gap-4 pt-4">
          <button
            onClick={() => setCount(count + 1)}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all active:scale-95"
          >
            Add to Counter
          </button>
          <p className="text-slate-500 font-medium">
            Clicks: <span className="text-slate-900 font-bold">{count}</span>
          </p>
        </div>

        {/* Small decorative divider */}
        <div className="w-16 h-1 bg-blue-600 mx-auto rounded-full mt-8"></div>
      </div>
    </main>
  );
}
