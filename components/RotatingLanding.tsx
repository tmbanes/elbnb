"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Icon } from '@iconify/react';
import {
  Building2, ShieldCheck, ArrowRight, UserCircle, ChevronLeft, ChevronRight,
} from "lucide-react";
import {
  HeaderLg, HeaderMd, HeaderSm, SubheaderLg, SubheaderMd, BodyLg, BodyMd
} from '@/app/typography';

// ─── STATIC DATA ───
const FACES = [
  {
    role: "Students",
    icon: <UserCircle className="w-10 h-10" />,
    title: "Find Your Perfect Space",
    desc: "Browse available units, check real-time occupancy, and book your move-in with just a few clicks.",
    accent: "#7EB647",
    bg: "bg-[#F1F8E9]",
  },
  {
    role: "Managers",
    icon: <Building2 className="w-10 h-10" />,
    title: "Streamline Operations",
    desc: "Manage resident lists, track maintenance, and oversee dormitory buildings from one dashboard.",
    accent: "#D48806",
    bg: "bg-[#FFF8E1]",
  },
  {
    role: "Admins",
    icon: <ShieldCheck className="w-10 h-10" />,
    title: "Complete Control",
    desc: "Configure dormitory inventory, manage user roles, and generate comprehensive campus housing reports.",
    accent: "#C62828",
    bg: "bg-[#FFEBEE]",
  }
];

const FEATURES = [
  { icon: "mdi:home-city", title: "Dorms & Rentals", desc: "Compare dorms with curfew and gender rules, or choose flexible renting spaces." },
  { icon: "mdi:bed-king-outline", title: "Real-Time Occupancy", desc: "View open bedspaces and vacant studio slots instantly before you apply." },
  { icon: "mdi:account-cog", title: "Seamless Applications", desc: "Apply, upload documents, and track your move-in status from your dashboard." },
  { icon: "mdi:shield-account", title: "Tailored Dashboards", desc: "Distinct, customized portals for students, building managers, and housing admins." }
];

const FOOTER_COLS = [
  { label: 'Product', links: [['Find a Home', '/onboarding'], ['List Property', '/onboarding'], ['Student Portal', '/onboarding']] },
  { label: 'Company', links: [['About Us', '#'], ['Contact Support', '#'], ['Partners', '#']] },
  { label: 'Legal', links: [['Privacy Policy', '#'], ['Terms of Service', '#']] }
];

// ─── HELPER HOOK: Scroll Reveal ───
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Stop observing once it has revealed
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

// ─── STAGGERED REVEAL COMPONENT ───
const Reveal = ({ children, className = "", id = "", delay = 0 }: { children: React.ReactNode, className?: string, id?: string, delay?: number }) => {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div
      id={id}
      ref={ref}
      className={`transition-all duration-[1000ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export function RotatingLanding({ initialUser }: { initialUser: any }) {
  const router = useRouter();

  // States
  const [activeFace, setActiveFace] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [ripple, setRipple] = useState<{ active: boolean; x: number; y: number } | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [logoTilt, setLogoTilt] = useState({ rotateX: 0, rotateY: 0 });
  const logoRef = useRef<HTMLImageElement>(null);

  // Effects
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 40);
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handlers
  const rotate = (direction: 'left' | 'right') => {
    const newFace = direction === 'right' ? (activeFace + 1) % 3 : (activeFace + 2) % 3;
    setActiveFace(newFace);
    setRotation(prev => direction === 'right' ? prev - 120 : prev + 120);
  };

  const handleCTAClick = (e: React.MouseEvent<HTMLButtonElement | HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple({ active: true, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    if (!initialUser) setTimeout(() => router.push('/onboarding'), 800);
    else if (initialUser && !initialUser.role) setTimeout(() => router.push('/complete-profile'), 800);
    else if (initialUser.role === "student") setTimeout(() => router.push('/student/dashboard'), 800);
    else if (initialUser.role === "dormitory_manager") setTimeout(() => router.push('/manager/dashboard'), 800);
    else if (initialUser.role === "housing_admin") setTimeout(() => router.push('/admin/dashboard'), 800);

  };

  const handleHeroMouseMove = (e: React.MouseEvent) => {
    if (!logoRef.current) return;
    window.requestAnimationFrame(() => {
      if (!logoRef.current) return;
      const rect = logoRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const rotateY = ((e.clientX - centerX) / (window.innerWidth / 2)) * 15;
      const rotateX = -((e.clientY - centerY) / (window.innerHeight / 2)) * 10;
      setLogoTilt({ rotateX, rotateY });
    });
  };

  const handleHeroMouseLeave = () => {
    setLogoTilt({ rotateX: 0, rotateY: 0 });
  };

  return (
    <div className="bg-[#F4F5E1] text-[#3E2723] overflow-x-hidden font-[family-name:var(--font-archivo)]">

      {/* ─── GLOBAL SVG FILTERS ─── */}
      <svg className="hidden">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feComposite operator="in" in2="SourceGraphic" />
          <feColorMatrix type="matrix" values="1 0 0 0 0,0 1 0 0 0,0 0 1 0 0,0 0 0 0.08 0" />
          <feBlend mode="multiply" in2="SourceGraphic" />
        </filter>
      </svg>

      {/* ─── EXPANDING RIPPLE EFFECT ─── */}
      {ripple?.active && (
        <div className="fixed inset-0 z-[999] pointer-events-none overflow-hidden">
          <div
            className="absolute bg-[#7EB647] rounded-full"
            style={{
              left: ripple.x, top: ripple.y,
              width: '300vw', height: '300vw',
              transform: 'translate(-50%, -50%) scale(0)',
              animation: 'rippleExpand 0.8s cubic-bezier(0.4,0,0.2,1) forwards',
            }}
          />
        </div>
      )}

      {/* ─── NAVIGATION ─── */}
      <header
        className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 rounded-full px-8 py-3.5 flex justify-between items-center backdrop-blur-2xl border ${scrolled ? 'w-[88%] max-w-5xl bg-white/90 shadow-xl border-white/80' : 'w-[94%] max-w-6xl bg-white/60 border-white/50'
          }`}
      >
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src="/logo/logo_house.png" alt="ELBNB" className="h-7 w-auto group-hover:rotate-12 transition-transform" />
          <span className={`${HeaderSm} text-lg tracking-tighter text-[#3E2723] font-black`}>ELBNB</span>
        </div>

        <nav className="hidden md:flex items-center gap-10">
          {[['#features', 'Features'], ['#roles', 'For Who?'], ['#get-started', 'Get Started']].map(([href, label]) => (
            <a
              key={href}
              href={href}
              onClick={(e) => {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                  target.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
              className="text-[#3E2723]/60 hover:text-[#7EB647] transition-colors font-semibold uppercase tracking-widest text-[11px] cursor-pointer"
            >
              {label}
            </a>
          ))}
        </nav>

        <Button
          onClick={handleCTAClick}
          className="bg-[#7EB647] hover:bg-[#6da13d] text-white rounded-full px-6 h-10 text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
        >
          Sign Up
        </Button>
      </header>

      <main>
        {/* ─── HERO SECTION ─── */}
        <section
          className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 text-center pt-24 pb-0 overflow-hidden bg-[#87CEEB]"

          onMouseMove={handleHeroMouseMove}
          onMouseLeave={handleHeroMouseLeave}
        >
          {/* ─── PARALLAX CLOUDS (SKY SECTION) ─── */}
          <div className="absolute top-[12%] left-[-2%] pointer-events-none z-[5]" style={{ transform: `translateY(${scrollY * 0.3}px)` }}>
            <img src="/logo/clouds/cloud-element-23.png" alt="Cloud" className="w-56 md:w-80 opacity-90 float-animation" />
          </div>
          <div className="absolute top-[25%] left-[-5%] pointer-events-none z-[3]" style={{ transform: `translateY(${scrollY * 0.05}px)` }}>
            <img src="/logo/clouds/cloud-element-23.png" alt="Cloud" className="w-48 md:w-64 opacity-40 float-animation-reverse" />
          </div>
          <div className="absolute top-[5%] left-[30%] pointer-events-none z-[4]" style={{ transform: `translateY(${scrollY * 0.1}px)` }}>
            <img src="/logo/clouds/cloud-element-25.png" alt="Cloud" className="w-40 md:w-56 opacity-60 float-animation-slow" />
          </div>
          <div className="absolute top-[35%] left-[8%] pointer-events-none z-[5]" style={{ transform: `translateY(${scrollY * 0.2}px)` }}>
            <img src="/logo/clouds/cloud-element-25.png" alt="Cloud" className="w-24 md:w-32 opacity-80 float-animation-slow" />
          </div>
          <div className="absolute top-[10%] right-[-2%] pointer-events-none z-[5]" style={{ transform: `translateY(${scrollY * 0.15}px)` }}>
            <img src="/logo/clouds/cloud-element-24.png" alt="Cloud" className="w-64 md:w-96 opacity-85 float-animation-reverse" />
          </div>
          <div className="absolute top-[18%] right-[25%] pointer-events-none z-[4]" style={{ transform: `translateY(${scrollY * 0.18}px)` }}>
            <img src="/logo/clouds/cloud-element-24.png" alt="Cloud" className="w-32 md:w-48 opacity-70 float-animation" />
          </div>
          <div className="absolute top-[38%] right-[12%] pointer-events-none z-[5]" style={{ transform: `translateY(${scrollY * 0.25}px)` }}>
            <img src="/logo/clouds/cloud-element-23.png" alt="Cloud" className="w-32 md:w-48 opacity-75 float-animation" />
          </div>
          <div className="absolute top-[42%] left-[48%] pointer-events-none z-[6]" style={{ transform: `translateY(${scrollY * 0.28}px)` }}>
            <img src="/logo/clouds/cloud-element-25.png" alt="Cloud" className="w-20 md:w-28 opacity-80 float-animation" />
          </div>

          {/* ─── HERO CONTENT ─── */}
          <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
              <h1 className="sr-only">ELBNB: Pahingahan para sa Pangarap.</h1>
              <img
                ref={logoRef}
                src="/logo/logo-header-original.png"
                alt="ELBNB - Pahingahan para sa Pangarap"
                className="w-[350px] md:w-[450px] lg:w-[550px] h-auto object-contain drop-shadow-xl mt-0"
                style={{
                  transform: `perspective(800px) rotateX(${logoTilt.rotateX}deg) rotateY(${logoTilt.rotateY}deg)`,
                  transition: 'transform 0.15s ease-out',
                }}
              />
            </div>
          </div>

          {/* ─── BACKGROUND HILLS (DEPTH EFFECT) ─── */}

          {/* 1. Farthest Hill (Lightest color, slowest scroll for high depth) */}
          <div
            className="absolute bottom-0 left-[30%] -translate-x-1/2 w-[280vw] md:w-[180vw] h-[85vh] md:h-[50vh] z-[1] pointer-events-none"
            style={{
              background: '#98C965',
              borderTopLeftRadius: '50% 100%',
              borderTopRightRadius: '50% 100%',
              filter: 'url(#grain)',
              transform: `translateY(${-120 + scrollY * 0.25}px)`,
            }}
          />

          {/* 2. Middle Hill (Midtone color, medium scroll speed) */}
          <div
            className="absolute bottom-0 left-[75%] -translate-x-1/2 w-[260vw] md:w-[160vw] h-[82vh] md:h-[45vh] z-[2] pointer-events-none"
            style={{
              background: '#8ABF55',
              borderTopLeftRadius: '50% 100%',
              borderTopRightRadius: '50% 100%',
              filter: 'url(#grain)',
              transform: `translateY(${-90 + scrollY * 0.12}px)`,
            }}
          />

          {/* 3. Foreground Hill (Original, rich color, scrolls naturally with the page) */}
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[250vw] md:w-[150vw] h-[80vh] md:h-[35vh] z-[3] pointer-events-none"
            style={{
              background: '#7EB647',
              borderTopLeftRadius: '50% 100%',
              borderTopRightRadius: '50% 100%',
              filter: 'url(#grain)',
              transform: `translateY(-60px)`,
            }}
          />
        </section>

        {/* ─── CONTENT SECTION (TEXTURED GREEN WITH HERO TEXT & BUTTONS) ─── */}
        <div className="relative z-20 text-white pt-32 -mt-[120px] pb-10">

          {/* Global Layer 1: Textured green contiguous background */}
          <div className="absolute inset-0 z-0 bg-[#7EB647]" style={{ filter: 'url(#grain)' }} />

          {/* Layer 2: Parallax Clouds overlapping the hill */}
          <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden">
            <div className="absolute top-[-10%] right-[-5%]" style={{ transform: `translateY(${scrollY * 0.12}px)` }}>
              <img src="/logo/clouds/cloud-element-24.png" className="w-80 md:w-[450px] opacity-[0.9] float-animation-reverse" />
            </div>
            <div className="absolute top-[15%] right-[10%]" style={{ transform: `translateY(${scrollY * 0.15}px)` }}>
              <img src="/logo/clouds/cloud-element-23.png" className="w-32 md:w-48 opacity-[0.7] float-animation" />
            </div>
            <div className="absolute top-[20%] left-[20%]" style={{ transform: `translateY(${scrollY * 0.08}px)` }}>
              <img src="/logo/clouds/cloud-element-25.png" className="w-32 md:w-40 opacity-[0.6] float-animation-reverse" />
            </div>
          </div>

          {/* Content Layer */}
          <div className="relative z-20">

            {/* Hero Text */}
            <div className="relative z-20 text-center space-y-3 max-w-2xl mx-auto font-medium">
              <p className={`${BodyLg} text-white/90 max-w-2xl mx-auto text-lg md:text-xl leading-relaxed mt-6 md:mt-1`}>
                Finding a home in Los Baños shouldn't be another hurdle to your degree.
                ELBNB connects students with safe, comfortable, study-ready spaces.
              </p>
            </div>

            {/* Buttons */}
            <div className="relative z-20 flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 mb-16 px-6">
              <button
                onClick={handleCTAClick}
                className="bg-[#7EB647] hover:bg-[#6da13d] text-white rounded-2xl px-8 py-4 text-base font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center gap-2 transition-all duration-300 active:scale-95"
              >
                Find Your Home <ArrowRight size={18} className="opacity-80" />
              </button>
              <button
                onClick={handleCTAClick}
                className="bg-white/80 hover:bg-white text-[#3E2723] rounded-2xl px-8 py-4 text-base font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 border border-black/5 flex items-center gap-2 transition-all duration-300 active:scale-95 backdrop-blur-sm"
              >
                List Your Property
              </button>
            </div>

            {/* Sections */}
            <div className="relative z-20">

              {/* ─── THE STORY ─── */}
              <section className="py-28 px-6 max-w-5xl mx-auto space-y-14">
                <Reveal delay={0}>
                  <div className="text-center space-y-3 max-w-2xl mx-auto">
                    <p className="text-white/50 uppercase tracking-[0.2em] text-xs font-bold">The ELBNB Story</p>
                    <h2 className={`${HeaderMd} text-3xl md:text-5xl leading-tight`}>
                      Dahil ang bawat pangarap,{' '}
                      <em className="not-italic opacity-60 font-light">kailangan ng sapat na pahinga.</em>
                    </h2>
                  </div>
                </Reveal>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { title: "The Struggle", desc: "We know the Elbi life — the 'hell weeks,' long walks from the Upper Campus, and late-night org meetings. You give your 100% to your studies; you deserve a place that gives 100% back.", bg: "bg-black/10 border-white/5" },
                    { title: "The Solution", desc: "ELBNB isn't just a housing directory. It's a curated ecosystem of dorms and apartments that prioritize security, proximity, and a conducive environment for the modern Isko and Iska.", bg: "bg-white/10 border-white/15 shadow-xl" }
                  ].map((card, i) => (
                    <Reveal key={i} delay={150 + (i * 150)}>
                      <div className={`${card.bg} h-full rounded-3xl p-10 space-y-4 border hover:-translate-y-2 transition-transform duration-300 backdrop-blur-sm`}>
                        <p className="text-white/50 uppercase tracking-widest text-xs font-bold">{card.title}</p>
                        <p className={`${BodyLg} text-white/90 leading-relaxed text-lg`}>{card.desc}</p>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </section>

              <div className="h-px bg-white/10 mx-8 md:mx-20" />

              {/* ─── FEATURES ─── */}
              <section id="features" className="py-28 px-6 max-w-5xl mx-auto space-y-14">
                <Reveal delay={0}>
                  <div className="text-center space-y-3 max-w-xl mx-auto">
                    <p className="text-white/50 uppercase tracking-[0.2em] text-xs font-bold">Smart Living Ecosystem</p>
                    <h2 className={`${HeaderMd} text-3xl md:text-5xl`}>Housing, <span className="opacity-50 font-light">simplified.</span></h2>
                  </div>
                </Reveal>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {FEATURES.map((f, i) => (
                    <Reveal key={i} delay={150 + (i * 100)}>
                      <div className="group h-full bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:-translate-y-1 transition-all duration-300 rounded-2xl p-8 border border-white/10 hover:border-white/30 space-y-4">
                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                          <Icon icon={f.icon} />
                        </div>
                        <h4 className={`${SubheaderMd} text-lg font-bold`}>{f.title}</h4>
                        <p className={`${BodyMd} text-white/60 leading-relaxed`}>{f.desc}</p>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </section>

              <div className="h-px bg-white/10 mx-8 md:mx-20" />

              {/* ─── 3D ROLE CAROUSEL ─── */}
              <section id="roles" className="py-28 px-6 max-w-5xl mx-auto space-y-14">
                <Reveal delay={0}>
                  <div className="text-center space-y-3 max-w-xl mx-auto mb-10">
                    <p className="text-white/50 uppercase tracking-[0.2em] text-xs font-bold">Built For Everyone</p>
                    <h2 className={`${HeaderMd} text-3xl md:text-5xl`}>Your role, your tools.</h2>
                  </div>
                </Reveal>

                <Reveal delay={200}>
                  <div className="relative h-[500px] flex items-center justify-center" style={{ perspective: '2000px' }}>
                    <div
                      className="relative w-full h-full transition-transform duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)]"
                      style={{ transformStyle: 'preserve-3d', transform: `rotateY(${rotation}deg)` }}
                    >
                      {FACES.map((face, i) => (
                        <div
                          key={i}
                          className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${activeFace === i ? 'opacity-100' : 'opacity-30 blur-sm scale-90 pointer-events-none'}`}
                          style={{ transform: `rotateY(${i * 120}deg) translateZ(350px)`, backfaceVisibility: 'hidden' }}
                        >
                          <div
                            className={`w-full max-w-sm ${face.bg} rounded-3xl p-10 flex flex-col gap-6 border-4 border-white/50`}
                            style={{ boxShadow: `0 30px 60px -15px ${face.accent}60` }}
                          >
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner" style={{ backgroundColor: `${face.accent}20`, color: face.accent }}>
                              {face.icon}
                            </div>
                            <div className="space-y-2">
                              <p className="uppercase tracking-widest text-[11px] font-black" style={{ color: face.accent }}>{face.role}</p>
                              <h3 className={`${HeaderSm} text-2xl text-[#3E2723] leading-tight`}>{face.title}</h3>
                              <p className={`${BodyMd} text-[#3E2723]/70 text-sm leading-relaxed`}>{face.desc}</p>
                            </div>
                            <div onClick={handleCTAClick} className="mt-4 cursor-pointer">
                              <Button className="w-full text-white rounded-xl py-6 text-sm font-bold flex justify-between px-6 transition-all hover:scale-[1.02] active:scale-95 shadow-md" style={{ backgroundColor: face.accent }}>
                                <span>Enter as {face.role}</span> <ArrowRight size={16} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Carousel Controls */}
                    <div className="absolute -bottom-6 flex gap-4 z-50">
                      <Button onClick={() => rotate('left')} className="bg-white/20 hover:bg-white/40 text-white rounded-full w-14 h-14 shadow-xl border border-white/10 backdrop-blur-md transition-all active:scale-90">
                        <ChevronLeft size={24} />
                      </Button>
                      <Button onClick={() => rotate('right')} className="bg-white/20 hover:bg-white/40 text-white rounded-full w-14 h-14 shadow-xl border border-white/10 backdrop-blur-md transition-all active:scale-90">
                        <ChevronRight size={24} />
                      </Button>
                    </div>
                  </div>
                </Reveal>
              </section>

              <div className="h-px bg-white/10 mx-8 md:mx-20" />

              {/* ─── BIG CTA ─── */}
              <section id="get-started" className="py-28 px-6 max-w-5xl mx-auto space-y-14">
                <Reveal delay={0}>
                  <div className="max-w-4xl mx-auto text-center space-y-10 bg-white/10 backdrop-blur-md rounded-[3rem] p-12 md:p-20 border border-white/10 shadow-2xl">
                    <div className="space-y-5">
                      <p className="text-white/50 uppercase tracking-[0.2em] text-sm font-bold">Get Started</p>
                      <h2 className={`${HeaderMd} text-4xl md:text-6xl leading-tight`}>
                        Handa ka na bang mahanap<br />ang bago mong tahanan?
                      </h2>
                    </div>
                    <button
                      onClick={handleCTAClick}
                      className="bg-white text-[#7EB647] hover:bg-[#f4f5e1] rounded-full px-10 py-5 text-lg font-black shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] inline-flex gap-3 mx-auto items-center transition-all hover:-translate-y-1 active:scale-95"
                    >
                      Browse Listings Now <ArrowRight size={20} />
                    </button>
                  </div>
                </Reveal>
              </section>
            </div>
          </div>
        </div>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[#7EB647] py-16 px-6 pb-32 text-white relative z-10" style={{ filter: 'url(#grain)' }}>
        <div className="max-w-5xl mx-auto space-y-12 relative z-10">
          <div className="flex flex-col items-center text-center gap-12">
            <div className="space-y-4 max-w-xs flex flex-col items-center">
              <div className="flex items-center gap-3">
                <img src="/logo/logo_house.png" alt="ELBNB" className="h-8 w-auto brightness-0 invert" />
                <span className={`${HeaderSm} text-2xl tracking-tighter font-black`}>ELBNB</span>
              </div>
              <p className="text-white/60 text-sm leading-relaxed">Pahingahan para sa Pangarap. Connecting students with safe, study-ready spaces.</p>
              <p className="text-white/40 text-xs italic font-bold">"From Elbi, For Elbi."</p>
            </div>

            {/* <div className="grid grid-cols-2 md:grid-cols-3 gap-10 md:gap-16">
              {FOOTER_COLS.map((col, i) => (
                <div key={i} className="space-y-4">
                  <p className="text-white/40 uppercase tracking-[0.15em] text-xs font-bold">{col.label}</p>
                  <ul className="space-y-3">
                    {col.links.map(([label, href], j) => (
                      <li key={j}>
                        <Link href={href} className="text-white/70 hover:text-white hover:underline underline-offset-4 transition-all text-sm">
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div> */}
          </div>

          <div className="pt-8 border-t border-white/20 flex flex-col md:flex-row justify-end items-center gap-6">
            <p className="text-white/40 text-xs font-semibold">© 2026 ELBNB. All rights reserved.</p>
            {/* <div className="flex items-center gap-6">
              {['Facebook', 'Instagram', 'TikTok'].map((s) => (
                <Link key={s} href="#" className="text-white/50 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
                  {s}
                </Link>
              ))}
            </div> */}
          </div>
        </div>
      </footer>

      {/* ─── GLOBAL STYLES ─── */}
      <style jsx global>{`
        html, body { background-color: #F4F5E1; scroll-behavior: smooth !important; }
        
        @keyframes rippleExpand {
          0%   { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }

        /* Natural Cloud Drifting Keyframes */
        @keyframes cloudFloat {
          0%, 100% { transform: translateX(0px); }
          50% { transform: translateX(25px); }
        }
        @keyframes cloudFloatReverse {
          0%, 100% { transform: translateX(0px); }
          50% { transform: translateX(-20px); }
        }
        
        /* Cloud Animation Classes */
        .float-animation { animation: cloudFloat 12s ease-in-out infinite; }
        .float-animation-reverse { animation: cloudFloatReverse 15s ease-in-out infinite; }
        .float-animation-slow { animation: cloudFloat 18s ease-in-out infinite; }
      `}</style>
    </div>
  );
}