"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ProfileUpload } from './ProfileUpload';
import { EditProfileDialog } from './EditProfileDialog';
import { User } from '@/types/user.types';
import { Home, Edit3, Folder, User as UserIcon, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Nunito } from 'next/font/google';

// Instantiate the custom font
const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '800', '900']
});

interface StudentDashboardProps {
  user: User;
  metadata: any;
}

export function StudentDashboard({ user, metadata }: StudentDashboardProps) {
  const [uploadPhotoOpen, setUploadPhotoOpen] = useState(false);

  // Extract info from metadata
  const studentNum = metadata?.student_number || 'N/A';
  const degreeProg = metadata?.degree_program || 'N/A';
  const college = metadata?.college || 'N/A'; // Providing CAS as requested placeholder if empty
  const contactNum = metadata?.contact_number || 'N/A'; // Example generic placeholder
  const homeAddress = metadata?.home_address || 'N/A';
  const emergencyContact = metadata?.emergency_contact || "N/A"; // Use studentNum as placeholder as per image

  // Safely format birthdate to avoid SSR-Client hydration mismatches
  let formattedBirthdate = '06/09/2005';
  if (user.birthdate) {
    const parts = user.birthdate.split('-');
    if (parts.length === 3) {
      formattedBirthdate = `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
    } else {
      formattedBirthdate = user.birthdate;
    }
  }

  return (
    <div className={`min-h-screen bg-[#F4F5E1] p-4 md:p-12 flex justify-center ${nunito.className} text-[#3E2723]`}>

      {/* Inline SVG filter for noise/grain */}
      <svg className="hidden">
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" stitchTiles="stitch" />
          <feBlend mode="multiply" in="SourceGraphic" in2="noise" />
        </filter>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
          <feColorMatrix type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 0.15 0" in="noise" result="coloredNoise" />
          <feComposite operator="in" in="coloredNoise" in2="SourceGraphic" result="composite" />
          <feBlend mode="multiply" in="composite" in2="SourceGraphic" />
        </filter>
      </svg>

      {/* Main card container */}
      <div
        className="relative w-full max-w-5xl mt-16 px-6 md:px-12 pt-28 pb-16 z-10"
      >

        {/* EXACT FOLDER SHAPE BACKGROUNDS */}
        <div className="absolute inset-0 z-0 pointer-events-none drop-shadow-[0_25px_25px_rgba(0,0,0,0.15)]" style={{ filter: 'url(#grain)' }}>
          {/* Top Tab - sitting at the top */}
          <div className="absolute top-0 left-0 w-full md:w-[65%] h-[50%] md:h-[70%] bg-[#7EB647] rounded-t-[50px] md:rounded-tl-[160px] md:rounded-tr-[40px]" />

          {/* Bottom Wide Body - starts at 15% depth to align with bridge */}
          <div className="absolute bottom-0 left-0 w-full h-[65%] md:h-[85%] bg-[#7EB647] rounded-b-[40px] md:rounded-tr-[100px]" />

          {/* Smooth Concave Bridge for the Folder Tab (desktop) */}
          <div
            className="hidden md:block absolute top-[15%] left-[65%] w-[80px] h-[80px] -translate-y-[100%] pointer-events-none"
            style={{ background: 'radial-gradient(circle at top right, transparent 80px, #7EB647 80px)' }}
          />
        </div>

        {/* Absolute Top Left: House & Profile (Breakout Effect) */}
        <div className="absolute top-[-90px] md:top-[-100px] left-[10px] md:left-[30px] z-20 w-[240px] h-[240px] md:w-[280px] md:h-[280px] flex items-center justify-center">
          {/* Dark Blue House Shape - Supersized with Rounded Mask and Texture */}
          <div
            className="absolute inset-0 bg-[#2A4392] -z-10"
            style={{
              maskImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 50 10 L 10 45 L 10 60 L 90 60 L 90 45 Z' fill='black' stroke='black' stroke-width='8' stroke-linejoin='round' stroke-linecap='round' /%3E%3C/svg%3E")`,
              WebkitMaskImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 50 10 L 10 45 L 10 60 L 90 60 L 90 45 Z' fill='black' stroke='black' stroke-width='8' stroke-linejoin='round' stroke-linecap='round' /%3E%3C/svg%3E")`,
              maskSize: 'contain',
              WebkitMaskSize: 'contain',
              maskRepeat: 'no-repeat',
              WebkitMaskRepeat: 'no-repeat',
              maskPosition: 'center',
              WebkitMaskPosition: 'center'
            }}
          >
            {/* House Grain Texture Overlay */}
            <div
              className="absolute inset-0 z-0 opacity-[0.25] mix-blend-overlay pointer-events-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            />
          </div>

          {/* Circular Profile Picture wrapped in Dialog to trigger Photo Upload directly */}
          <Dialog open={uploadPhotoOpen} onOpenChange={setUploadPhotoOpen}>
            <DialogTrigger asChild>
              <button
                className="relative top-[12px] w-[160px] h-[160px] md:w-[180px] md:h-[180px] bg-[#F4F5E1] rounded-full overflow-hidden border-[10px] md:border-[12px] border-[#3E2723] shadow-2xl flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-300 group z-10"
              >
                {user.profile_picture_url ? (
                  <img
                    src={user.profile_picture_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-20 h-20 text-[#3E2723]/30" />
                )}
                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Edit3 size={36} className="text-white mb-1" />
                  <span className="text-white text-[12px] font-bold tracking-wider">EDIT</span>
                </div>
              </button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md bg-[#F4F5E1] border-[#7EB647]">
              <DialogHeader>
                <DialogTitle className="text-[#3E2723] font-bold">Update Profile Picture</DialogTitle>
                <DialogDescription className="text-[#3E2723]/70">
                  Upload a new photo to your account.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <ProfileUpload initialProfileUrl={user.profile_picture_url} />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Content Container */}
        <div className="relative z-30">

          {/* Header section (Greeting & Accoms Link) */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end">

            <div className="mt-[160px] md:mt-0 md:ml-[310px] leading-tight drop-shadow-sm pb-12 md:pb-0 relative z-30">
              <h2 className="text-2xl font-bold text-[#3E2723]/90">Kumusta,</h2>
              <h1 className="text-4xl md:text-5xl font-black text-[#3E2723] tracking-tight mt-1">
                {user.first_name} {user.last_name}?
              </h1>
            </div>

            {/* Accommodations Link */}
            <Link
              href="/dashboard/accommodations"
              className="flex items-center gap-2 mt-4 md:mt-0 mb-2 md:mr-8 text-[#3E2723] opacity-60 hover:opacity-100 transition-opacity z-30 relative"
            >
              <Home className="w-5 h-5 fill-[#3E2723]/30" />
              <span className="text-lg font-bold tracking-[0.1em] uppercase">Accommodations</span>
            </Link>
          </div>

          {/* Dividing section via a subtle curved overlay instead of strict line */}
          <div className="w-full h-auto mt-12 bg-[#8bc453] rounded-[40px_100px_40px_40px] px-8 py-10 shadow-inner" style={{ filter: 'url(#grain)', backgroundBlendMode: 'multiply' }}>

            {/* Title */}
            <div className="flex items-center gap-3 mb-8 text-[#3E2723]">
              <UserIcon className="w-6 h-6 stroke-[2.5]" />
              <h3 className="text-xl font-bold tracking-[0.05em] uppercase">Personal Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-y-10 gap-x-6">

              {/* Academic Info - 4 columns on large screens */}
              <div className="md:col-span-12">
                <h4 className="font-bold opacity-90 tracking-wide uppercase mb-3 text-sm">Academic Info</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-base font-semibold leading-snug">{formattedBirthdate}</p>
                    <p className="text-sm opacity-80 leading-snug font-medium">Birthdate</p>
                  </div>
                  <div>
                    <p className="text-base font-semibold leading-snug">{studentNum}</p>
                    <p className="text-sm opacity-80 leading-snug font-medium">Student Number</p>
                  </div>
                  <div>
                    <p className="text-base font-semibold leading-snug">{degreeProg}</p>
                    <p className="text-sm opacity-80 leading-snug font-medium">Degree Program</p>
                  </div>
                  <div>
                    <p className="text-base font-semibold leading-snug">{college}</p>
                    <p className="text-sm opacity-80 leading-snug font-medium">College</p>
                  </div>
                </div>
              </div>

              {/* Contact Details - 3 columns, span up to 9 slots on desktop */}
              <div className="md:col-span-9">
                <h4 className="font-bold opacity-90 tracking-wide uppercase mb-3 text-sm">Contact Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <p className="text-base font-semibold leading-snug break-all">{user.email}</p>
                    <p className="text-sm opacity-80 leading-snug font-medium">Email Address</p>
                  </div>
                  <div>
                    <p className="text-base font-semibold leading-snug">{contactNum}</p>
                    <p className="text-sm opacity-80 leading-snug font-medium">Contact Number</p>
                  </div>
                  <div>
                    <p className="text-base font-semibold leading-snug">{homeAddress}</p>
                    <p className="text-sm opacity-80 leading-snug font-medium">Home Address</p>
                  </div>
                </div>
              </div>

              {/* Emergency Contacts - 1 column, span remaining 3 slots */}
              <div className="md:col-span-3">
                <h4 className="font-bold opacity-90 tracking-wide uppercase mb-3 text-sm">Emergency Contacts</h4>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <p className="text-base font-semibold leading-snug">{emergencyContact}</p>
                    <p className="text-sm opacity-80 leading-snug font-medium">Emergency Contact</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Floating Action Buttons */}
          <div className="absolute right-0 bottom-[-20px] flex gap-3 z-30">
            <EditProfileDialog user={user} metadata={metadata} />
            <button className="w-[50px] h-[50px] bg-[#3E2723] text-[#F4F5E1] rounded-full flex items-center justify-center hover:bg-[#2B1B18] transition-colors shadow-xl">
              <Folder size={20} strokeWidth={2.5} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
