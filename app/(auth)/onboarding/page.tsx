"use client";
import { useEffect, useState } from 'react';
import Onboarding from './Onboarding';

export default function OnboardingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Green fade-out overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#7EB647',
          opacity: mounted ? 0 : 1,
          transition: 'opacity 0.6s ease-in-out',
          pointerEvents: 'none',
          zIndex: 9999,
        }}
      />
      <Onboarding />
    </>
  );
}
