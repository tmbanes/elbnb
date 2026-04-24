"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { 
  Home, Building2, ShieldCheck, MapPin, Search, Calendar, 
  History, ArrowRight, UserCircle, ChevronLeft, ChevronRight,
  Sparkles, Shield, Zap, Users, GraduationCap, LayoutDashboard
} from "lucide-react";
import {
  HeaderLg,
  HeaderMd,
  HeaderSm,
  SubheaderLg,
  SubheaderMd,
  SubheaderSm,
  BodyLg,
  BodyMd,
  BodySm
} from '@/app/typography';

export function RotatingLanding({ initialUser }: { initialUser: any }) {
  const [rotation, setRotation] = useState(0);
  const [activeFace, setActiveFace] = useState(0); // 0: Student, 1: Manager, 2: Admin

  const rotate = (direction: 'left' | 'right') => {
    const newFace = direction === 'right' ? (activeFace + 1) % 3 : (activeFace + 2) % 3;
    setActiveFace(newFace);
    setRotation(prev => direction === 'right' ? prev - 120 : prev + 120);
  };

  const faces = [
    {
      role: "Students",
      icon: <UserCircle className="w-12 h-12" />,
      title: "Find Your Perfect Space",
      desc: "Browse available units, check real-time occupancy, and book your move-in with just a few clicks.",
      color: "#7EB647",
      bg: "bg-[#F1F8E9]",
      accent: "#7EB647",
      link: "/onboarding"
    },
    {
      role: "Managers",
      icon: <Building2 className="w-12 h-12" />,
      title: "Streamline Operations",
      desc: "Manage resident lists, track maintenance, and oversee multiple dormitory buildings from one dashboard.",
      color: "#D48806",
      bg: "bg-[#FFF8E1]",
      accent: "#FFB300",
      link: "/onboarding"
    },
    {
      role: "Admins",
      icon: <ShieldCheck className="w-12 h-12" />,
      title: "Complete Control",
      desc: "Configure dormitory inventory, manage user roles, and generate comprehensive campus housing reports.",
      color: "#C62828",
      bg: "bg-[#FFEBEE]",
      accent: "#E53935",
      link: "/onboarding"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F4F5E1] text-[#3E2723] overflow-x-hidden font-[family-name:var(--font-archivo)] selection:bg-[#7EB647] selection:text-white scroll-smooth">
      {/* SVG Grain Filter */}
      <svg className="hidden">
        <filter id="hill-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feComposite operator="in" in2="SourceGraphic" />
          <feColorMatrix type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 0.15 0" />
          <feBlend mode="multiply" in2="SourceGraphic" />
        </filter>
      </svg>

      {/* Navigation */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[92%] max-w-6xl z-[100] px-10 py-4 flex justify-between items-center bg-white/70 backdrop-blur-2xl border border-white/40 shadow-[0_25px_60px_rgba(0,0,0,0.1)] rounded-[3rem] md:rounded-[100px] transition-all duration-500 hover:w-[94%]">
        <div className="flex items-center gap-3">
          <img src="/logo/logo_house.png" alt="ELBNB Logo" className="h-9 w-auto" />
          <span className={`${HeaderSm} tracking-tighter text-2xl text-[#3E2723]`}>ELBNB</span>
        </div>
        
        <div className="hidden md:flex items-center gap-12">
          <Link href="#features" className={`${SubheaderMd} text-[#3E2723]/70 hover:text-[#7EB647] transition-all font-bold uppercase tracking-widest text-xs`}>Features</Link>
          <Link href="#roles" className={`${SubheaderMd} text-[#3E2723]/70 hover:text-[#7EB647] transition-all font-bold uppercase tracking-widest text-xs`}>Who is it for?</Link>
          <Link href="#get-started" className={`${SubheaderMd} text-[#3E2723]/70 hover:text-[#7EB647] transition-all font-bold uppercase tracking-widest text-xs`}>Get Started</Link>
        </div>

        <Link href="/onboarding">
          <Button className="bg-[#7EB647] hover:bg-[#6da13d] text-white rounded-full px-8 h-12 font-bold shadow-lg shadow-[#7EB647]/20 transition-all active:scale-95">
            Sign Up
          </Button>
        </Link>
      </nav>

      {/* Hero Section (Spacer) */}
      <section className="relative h-[100vh] flex flex-col items-center justify-center pt-20 px-6 text-center overflow-hidden">
        {/* Full-screen entry space leading to the centered horizon and logo */}
      </section>

      {/* GREEN CONTENT AREA - CAROUSEL MOVED HERE */}
      <section id="roles" className="bg-[#7EB647] pt-0 pb-40 px-6 relative z-30" style={{ filter: 'url(#hill-noise)' }}>
        {/* The Hill Cap - Peak at 50vh */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[50vh] w-[150%] h-[100vh] bg-[#7EB647] rounded-[100%] pointer-events-none">
          {/* House Silhouettes on Horizon */}
          <div className="absolute top-0 left-[40%] -translate-y-[80%] opacity-40">
            <Home className="w-16 h-16 text-[#1D4ED8] rotate-[-5deg]" />
          </div>
          <div className="absolute top-0 left-[46%] -translate-y-[95%] opacity-60">
            <Building2 className="w-12 h-12 text-[#1D4ED8] rotate-[-2deg]" />
          </div>
          <div className="absolute top-0 right-[46%] -translate-y-[90%] opacity-50">
            <Home className="w-10 h-10 text-[#1D4ED8] rotate-[3deg]" />
          </div>
          <div className="absolute top-0 right-[42%] -translate-y-[85%] opacity-30">
            <Building2 className="w-20 h-20 text-[#1D4ED8] rotate-[6deg]" />
          </div>
          <div className="absolute top-0 left-[35%] -translate-y-[70%] opacity-20">
            <Home className="w-24 h-24 text-[#1D4ED8] rotate-[-10deg]" />
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto relative">
          
          {/* Logo Centered on the Tip of the Hill (50vh) */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[calc(50vh+50%)] flex justify-center z-50 pointer-events-none w-full px-6">
            <img 
              src="/assets/logo/logo-header.png" 
              alt="ELBNB Logo" 
              className="h-40 md:h-[28rem] w-auto object-contain max-w-[85vw] drop-shadow-[0_40px_80px_rgba(0,0,0,0.4)]" 
            />
          </div>

          {/* Hero Content (Now in the Green Part) */}
          <div className="space-y-8 max-w-4xl mx-auto -mt-16 md:-mt-24 mb-40 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <h1 className={`${HeaderLg} text-5xl md:text-8xl leading-[0.95] tracking-tighter text-white`}>
              Pahingahan para <br />
              <span className="text-white opacity-60 italic font-light">sa Pangarap.</span>
            </h1>
            
            <p className={`${BodyLg} text-white/80 max-w-2xl mx-auto text-xl md:text-2xl leading-relaxed`}>
              Finding a home in Los Baños shouldn't be another hurdle to your degree. 
              ELBNB connects students with safe, comfortable, and study-ready spaces designed to fuel your journey.
            </p>

            <div className="flex flex-col md:flex-row justify-center gap-6 pt-6">
               <Link href="/onboarding">
                  <Button className="bg-white text-[#7EB647] hover:bg-white/90 rounded-2xl px-12 py-8 text-xl font-bold shadow-2xl flex gap-3 mx-auto md:mx-0 transition-all active:scale-95">
                    Find Your Home in Elbi <ArrowRight />
                  </Button>
               </Link>
               <Link href="/onboarding">
                  <Button variant="outline" className="border-2 border-white/30 text-white hover:bg-white/10 rounded-2xl px-12 py-8 text-xl flex gap-3 mx-auto md:mx-0 transition-all active:scale-95">
                    List Your Property
                  </Button>
               </Link>
            </div>
          </div>

          {/* Section 2: Why ELBNB (The Problem & Solution) */}
          <div className="relative pt-20 mb-40">
            <div className="text-center space-y-10 max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-2 rounded-full border border-white/10 mx-auto">
                <Home className="w-5 h-5 text-white" />
                <span className={`${SubheaderSm} uppercase tracking-wider text-white`}>The ELBNB Story</span>
              </div>
              <h2 className={`${HeaderMd} text-white text-4xl md:text-6xl leading-tight`}>
                Dahil ang bawat pangarap, <br />
                <span className="opacity-70 italic font-light leading-relaxed text-3xl md:text-5xl">kailangan ng sapat na pahinga.</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left pt-10">
                <div className="space-y-6 p-8 bg-black/10 backdrop-blur-sm rounded-3xl border border-white/5">
                  <h3 className={`${SubheaderLg} text-white text-3xl font-bold`}>The Struggle</h3>
                  <p className={`${BodyLg} text-white/80 leading-relaxed text-xl`}>
                    We know the Elbi life—the "hell weeks," the long walks from the Upper Campus, and the late-night org meetings. 
                    You give your 100% to your studies; you deserve a place that gives 100% back to you.
                  </p>
                </div>
                <div className="space-y-6 p-8 bg-white/10 backdrop-blur-sm rounded-3xl border border-white/10 shadow-2xl">
                  <h3 className={`${SubheaderLg} text-white text-3xl font-bold`}>The Solution</h3>
                  <p className={`${BodyLg} text-white/90 leading-relaxed text-xl`}>
                    ELBNB isn't just a housing directory. It’s a curated ecosystem of dorms and apartments that prioritize security, 
                    proximity, and a conducive environment for the modern Isko and Iska.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Role Carousel (Moved down slightly or repurposed) */}
          <div className="relative mb-60">
            <div className="text-center mb-24 space-y-4">
              <h2 className={`${HeaderMd} text-white text-5xl md:text-7xl`}>Built for your role.</h2>
              <p className={`${BodyLg} text-white/70 max-w-xl mx-auto text-xl`}>
                Choose your perspective and discover the features tailored to your unique campus housing workflow.
              </p>
            </div>

            {/* THE ROTATING CAROUSEL */}
            <div className="relative h-[600px] flex items-center justify-center perspective-[2000px] z-10">
              <div 
                className="relative w-full h-full preserve-3d transition-transform duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)]"
                style={{ transform: `rotateY(${rotation}deg)` }}
              >
                {faces.map((face, i) => (
                  <div 
                    key={i}
                    className={`absolute inset-0 backface-hidden flex items-center justify-center transition-opacity duration-1000 ${activeFace === i ? 'opacity-100 scale-110' : 'opacity-40 blur-sm scale-90'}`}
                    style={{ transform: `rotateY(${i * 120}deg) translateZ(450px)` }}
                  >
                    {/* House Shaped Card with More Colors */}
                    <div 
                      className={`w-full max-w-[420px] aspect-[4/5] ${face.bg} shadow-2xl overflow-hidden p-12 flex flex-col justify-between group transition-all duration-500`}
                      style={{ 
                        clipPath: 'polygon(50% 0%, 100% 20%, 100% 100%, 0% 100%, 0% 20%)',
                        borderTop: `12px solid ${face.accent}`,
                        boxShadow: `0 30px 60px -12px ${face.accent}40`
                      }}
                    >
                       <div className="space-y-6 pt-10">
                        <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-inner" style={{ backgroundColor: `${face.accent}15`, color: face.accent }}>
                          {face.icon}
                        </div>
                        <div>
                          <h4 className={`${SubheaderSm} uppercase tracking-[0.2em] font-black mb-2`} style={{ color: face.accent }}>{face.role}</h4>
                          <h3 className={`${HeaderMd} text-4xl leading-tight text-[#3E2723]`}>{face.title}</h3>
                        </div>
                        <p className={`${BodyLg} text-[#3E2723]/70 text-base leading-relaxed`}>{face.desc}</p>
                       </div>
                       
                       <Link href={face.link}>
                        <Button 
                          className="w-full text-white rounded-xl py-8 text-lg flex gap-2 shadow-xl hover:scale-105 transition-transform"
                          style={{ backgroundColor: face.accent }}
                        >
                          Enter as {face.role} <ArrowRight size={20} />
                        </Button>
                       </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Controls inside the carousel area */}
              <div className="absolute bottom-[-100px] flex gap-8 z-50">
                <Button 
                  onClick={() => rotate('left')}
                  className="bg-white hover:bg-[#F4F5E1] text-[#3E2723] rounded-full w-16 h-16 shadow-2xl border-none active:scale-90 transition-all group"
                >
                  <ChevronLeft size={32} className="group-hover:-translate-x-1 transition-transform" />
                </Button>
                <Button 
                  onClick={() => rotate('right')}
                  className="bg-white hover:bg-[#F4F5E1] text-[#3E2723] rounded-full w-16 h-16 shadow-2xl border-none active:scale-90 transition-all group"
                >
                  <ChevronRight size={32} className="group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-40 text-center">
            {[
              { label: "Available Units", val: "1,200+", color: "#FFF" },
              { label: "University Partners", val: "15+", color: "#FFF" },
              { label: "Active Students", val: "8,500+", color: "#FFF" },
              { label: "Average Rating", val: "4.9/5", color: "#FFF" }
            ].map((s, i) => (
              <div key={i} className="space-y-1 group cursor-default">
                <p className={`${HeaderLg} text-3xl md:text-5xl group-hover:scale-105 transition-transform`} style={{ color: s.color }}>{s.val}</p>
                <p className={`${SubheaderSm} opacity-60 uppercase tracking-widest text-white text-xs`}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Section 3: Key Features (The Icons/Grid) */}
          <div id="features" className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center mb-40 pt-20">
            <div className="space-y-10">
              <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-2 rounded-full border border-white/10">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <span className={`${SubheaderSm} uppercase tracking-wider text-white`}>Smart Living Ecosystem</span>
              </div>
              <h2 className={`${HeaderLg} text-4xl md:text-6xl leading-tight text-white`}>
                Housing management, <br />
                <span className="opacity-50">simplified for everyone.</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  { icon: <MapPin />, title: "📍 Proximity to Campus", desc: "Filter by distance from your college or the nearest jeepney route.", accent: "#FFEBEE" },
                  { icon: <ShieldCheck />, title: "🛡️ Verified & Secure", desc: "We vet our listings to ensure your safety and peace of mind.", accent: "#FFF8E1" },
                  { icon: <Zap />, title: "📶 Study-Ready Spaces", desc: "Dedicated tags for high-speed Wi-Fi, quiet zones, and well-lit desks.", accent: "#F1F8E9" },
                  { icon: <Users />, title: "🤝 Community First", desc: "Connect with potential roommates who share your vibe and your degree program.", accent: "#E3F2FD" }
                ].map((item, i) => (
                  <div key={i} className="space-y-3 bg-white/5 p-6 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors cursor-default">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white">
                      {item.icon}
                    </div>
                    <h4 className={`${SubheaderMd} text-xl text-white`}>{item.title}</h4>
                    <p className={`${BodyMd} opacity-70 text-white`}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-white/5 rounded-[80px] border border-white/10 flex items-center justify-center overflow-hidden relative">
                 <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                 <div className="relative z-10 text-center p-12 space-y-8">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl mx-auto mb-6 rotate-6">
                      <img src="/logo/logo_house.png" className="w-10 h-10 object-contain" alt="Testimonial" />
                    </div>
                    <p className={`${BodyLg} text-2xl italic font-light leading-relaxed text-white`}>
                      "Dati, nahihirapan ako mag-ikot sa Grove para maghanap ng lilipatan. Sa ELBNB, isang click lang, napanagtag ko na yung 'pahingahan' ko. Super convenient!"
                    </p>
                    <div className="space-y-1">
                      <p className={`${SubheaderLg} text-white text-xl`}>Maya</p>
                      <p className={`${SubheaderMd} opacity-60 text-white uppercase tracking-widest text-sm`}>BS Forestry Student</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          {/* Workflow Section */}
          <div className="text-center space-y-20">
            <h3 className={`${HeaderMd} text-4xl md:text-6xl text-white`}>How it works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
               {/* Connector Line */}
               <div className="hidden md:block absolute top-12 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
               
               {[
                 { step: "01", title: "Verify Account", desc: "Sign up using your university credentials.", color: "#FFEBEE" },
                 { step: "02", title: "Browse & Select", desc: "Filter by location, unit type, and price.", color: "#FFF8E1" },
                 { step: "03", title: "Move In", desc: "Complete the digital inventory and start your stay.", color: "#F1F8E9" }
               ].map((step, i) => (
                 <div key={i} className="relative z-10 space-y-6 group">
                    <div className="w-24 h-24 bg-white text-[#7EB647] rounded-full mx-auto flex items-center justify-center text-3xl font-black shadow-2xl group-hover:scale-110 transition-transform">
                      {step.step}
                    </div>
                    <h4 className={`${HeaderSm} text-2xl text-white`}>{step.title}</h4>
                    <p className={`${BodyMd} opacity-70 max-w-[250px] mx-auto text-white`}>{step.desc}</p>
                 </div>
               ))}
            </div>
          </div>

          {/* Property Categories */}
          <div className="mb-40 space-y-20">
             <div className="text-center space-y-4">
               <h2 className={`${HeaderMd} text-white text-4xl md:text-6xl`}>Property Categories</h2>
               <p className={`${BodyLg} text-white/70 max-w-xl mx-auto text-lg`}>Make navigation easy. Find the stay that fits your lifestyle and budget.</p>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {[
                  { title: "Solo Sanctuary", desc: "For the focused student who needs their own space (Studios & Solo Rooms).", icon: <UserCircle />, accent: "#FFEBEE" },
                  { title: "The Study Squad", desc: "Shared housing for groups and barkadas (2-4 Bedroom units).", icon: <Users />, accent: "#FFF8E1" },
                  { title: "Budget-Friendly Stays", desc: "Quality living that fits the student allowance.", icon: <Sparkles />, accent: "#F1F8E9" }
                ].map((cat, i) => (
                  <div key={i} className="group relative bg-white/10 backdrop-blur-xl p-8 rounded-[40px] border border-white/10 hover:bg-white/20 transition-all cursor-pointer">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                      {React.cloneElement(cat.icon as React.ReactElement, { size: 32 })}
                    </div>
                    <h3 className={`${SubheaderLg} text-white text-2xl mb-3`}>{cat.title}</h3>
                    <p className={`${BodyMd} text-white/60 text-base leading-relaxed mb-6`}>{cat.desc}</p>
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      Browse Category <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                ))}
             </div>
          </div>

          {/* Call to Action Closer */}
          <div id="get-started" className="mb-40 text-center py-40 px-12 bg-white/10 backdrop-blur-2xl rounded-[60px] border border-white/10 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
             <div className="relative z-10 space-y-8">
               <h2 className={`${HeaderMd} text-white text-4xl md:text-6xl`}>Handa ka na bang mahanap ang bago mong tahanan?</h2>
               <p className={`${BodyLg} text-white/80 max-w-2xl mx-auto text-xl leading-relaxed`}>
                 Huwag hayaang mapagod ang iyong pangarap dahil lang sa maling tuluyan.
               </p>
               <Link href="/onboarding">
                 <Button className="bg-white text-[#7EB647] hover:bg-white/90 rounded-2xl px-12 py-6 text-xl font-black shadow-2xl flex gap-3 mx-auto transition-all active:scale-95">
                   Browse Listings Now <ArrowRight size={24} />
                 </Button>
               </Link>
             </div>
          </div>

          {/* Footer Area */}
          <div className="mt-20 pt-16 border-t border-white/10 flex flex-col md:flex-row justify-between items-start gap-12">
             <div className="space-y-6">
               <div className="flex items-center gap-3">
                  <img src="/logo/logo_house.png" alt="ELBNB" className="h-12 w-auto brightness-0 invert" />
                  <span className={`${HeaderSm} text-3xl text-white tracking-tighter`}>ELBNB</span>
               </div>
               <p className={`${BodyMd} text-white/50 max-w-sm text-xl`}>
                 Pahingahan para sa Pangarap.
               </p>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-3 gap-20">
               <div className="space-y-6 text-white">
                  <p className={`${SubheaderSm} uppercase tracking-widest opacity-30`}>Product</p>
                  <ul className="space-y-4 opacity-60 text-lg">
                    <li><Link href="/onboarding" className="hover:opacity-100 transition-opacity">Find a Home</Link></li>
                    <li><Link href="/onboarding" className="hover:opacity-100 transition-opacity">List Property</Link></li>
                    <li><Link href="/onboarding" className="hover:opacity-100 transition-opacity">Student Portal</Link></li>
                  </ul>
               </div>
               <div className="space-y-6 text-white">
                  <p className={`${SubheaderSm} uppercase tracking-widest opacity-30`}>Company</p>
                  <ul className="space-y-4 opacity-60 text-lg">
                    <li><Link href="#" className="hover:opacity-100 transition-opacity">About Us</Link></li>
                    <li><Link href="#" className="hover:opacity-100 transition-opacity">Contact Support</Link></li>
                    <li><Link href="#" className="hover:opacity-100 transition-opacity">Partners</Link></li>
                  </ul>
               </div>
               <div className="space-y-6 text-white">
                  <p className={`${SubheaderSm} uppercase tracking-widest opacity-30`}>Legal</p>
                  <ul className="space-y-4 opacity-60 text-lg">
                    <li><Link href="#" className="hover:opacity-100 transition-opacity">Privacy Policy</Link></li>
                    <li><Link href="#" className="hover:opacity-100 transition-opacity">Terms of Service</Link></li>
                  </ul>
               </div>
             </div>
          </div>
          
          <div className="mt-32 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 opacity-30 text-white">
             <p className={BodySm}>© 2024 ELBNB. From Elbi, For Elbi.</p>
             <div className="flex gap-10">
                <Link href="#" className="hover:opacity-100 transition-opacity">Facebook</Link>
                <Link href="#" className="hover:opacity-100 transition-opacity">Instagram</Link>
                <Link href="#" className="hover:opacity-100 transition-opacity">TikTok</Link>
             </div>
          </div>
        </div>
      </section>

      <style jsx global>{`
        .perspective-2000 {
          perspective: 2000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        body {
          background-color: #F4F5E1;
        }
      `}</style>
    </div>
  );
}
