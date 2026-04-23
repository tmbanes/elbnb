"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ProfileUpload } from '@/app/dashboard/ProfileUpload';
import { EditProfileDialog } from '@/app/dashboard/EditProfileDialog';
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
  const [activeTab, setActiveTab] = useState<'personal' | 'accommodations'>('personal');

  const studentNum = metadata?.student_number || 'N/A';
  const degreeProg = metadata?.degree_program || 'N/A';
  const college = metadata?.college || 'CAS';
  const contactNum = metadata?.contact_number || '09662981806';
  const homeAddress = metadata?.home_address || 'Tondo, Manila';
  const emergencyContact = metadata?.emergency_contact || studentNum;

  let formattedBirthdate = '06/09/2005';
  if (user.birthdate) {
    const parts = user.birthdate.split('-');
    if (parts.length === 3) {
      formattedBirthdate = `${parts[2]}/${parts[1]}/${parts[0]}`;
    } else {
      formattedBirthdate = user.birthdate;
    }
  }

  return (
    <div className={`min-h-screen bg-[#F4F5E1] p-3 sm:p-4 md:p-12 flex justify-center items-start ${nunito.className} text-[#3E2723]`}>

      {/* SVG grain filter */}
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
      <div className="relative w-full max-w-5xl mt-10 sm:mt-16 pt-10 sm:pt-12 z-10 flex flex-col">

        {/* Folder shape background */}
        <div className="absolute inset-0 z-0 pointer-events-none drop-shadow-[0_25px_25px_rgba(0,0,0,0.15)]" style={{ filter: 'url(#grain)' }}>
          <div className="absolute inset-0 w-full h-full bg-[#7EB647] rounded-t-[150px] sm:rounded-t-[300px] rounded-bl-[40px] rounded-br-[40px]" />
        </div>

        {/* House & Profile breakout — increase top value to move everything down */}
        <div className="absolute top-[-40px] sm:top-[-60px] md:top-[-70px] left-[10px] sm:left-[20px] md:left-[30px] z-20 w-[160px] h-[160px] sm:w-[220px] sm:h-[220px] md:w-[280px] md:h-[280px] flex items-center justify-center">

          {/* Circular Profile Picture — behind the frame */}
          <div className="relative z-10 top-[30px] sm:top-[50px] md:top-[40px] w-[100px] h-[100px] sm:w-[138px] sm:h-[138px] md:w-[177px] md:h-[177px] rounded-full overflow-hidden bg-[#3E2723] flex items-center justify-center">
            {user.profile_picture_url ? (
              <img
                src={user.profile_picture_url}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon className="w-20 h-20 text-[#F4F5E1]/30" />
            )}
          </div>

          {/* Frame as clickable edit button — front layer */}
          <Dialog open={uploadPhotoOpen} onOpenChange={setUploadPhotoOpen}>
            <DialogTrigger asChild>
              <button
                className="absolute inset-0 z-50 flex items-center justify-center group cursor-pointer"
                aria-label="Edit profile picture"
              >
                {/* Frame image — same scale as profile */}
                <img
                  src="/assets/user-profile-frame.png"
                  alt="Profile Frame"
                  className="absolute inset-0 w-full h-full object-contain scale-[1] transition-transform duration-300"
                />

                {/* Hover overlay — same size and top offset as profile picture */}
                <div className="relative z-10 top-[30px] sm:top-[50px] md:top-[40px] w-[100px] h-[100px] sm:w-[138px] sm:h-[138px] md:w-[177px] md:h-[177px] rounded-full overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Edit3 size={36} className="text-white mb-1" />
                    <span className="text-white text-[12px] font-bold tracking-wider">EDIT</span>
                  </div>
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
        <div className="relative z-30 flex-1 flex flex-col">

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end px-6 md:px-12">
            <div className="mt-[110px] sm:mt-[140px] md:mt-0 md:ml-[270px] leading-tight drop-shadow-sm pb-6 sm:pb-10 md:pb-0 relative z-30">
              <h2 className={`${HeaderMd} text-[#3E2723]/90`}>Kumusta,</h2>
              <h1 className={`${HeaderLg} text-[#3E2723] tracking-tight mt-1`}>
                {user.first_name} {user.last_name}?
              </h1>
            </div>
          </div>

          {/* Overlapping containers — clipped to uniform rounded corners */}
          <div className="overflow-hidden rounded-bl-[40px] rounded-br-[40px]">
          <div className="grid grid-cols-1 grid-rows-1 mt-3 sm:mt-6 relative w-full min-h-[280px] sm:min-h-[350px] md:min-h-[400px]">

            {/* Accommodations Container */}
            <div
              onClick={() => setActiveTab('accommodations')}
              className={`col-start-1 row-start-1 w-full md:w-[80%] justify-self-end overflow-hidden transition-all duration-300 ease-in-out cursor-pointer bg-[#8bc453] shadow-inner px-4 sm:px-6 md:px-12 rounded-tl-[200px] sm:rounded-tl-[400px] md:rounded-tl-[700px] rounded-tr-[40px] sm:rounded-tr-[60px] md:rounded-tr-[100px] rounded-bl-[40px] rounded-br-[40px] ${activeTab === 'accommodations'
                ? 'h-full'
                : 'hover:bg-[#8bc453]/90 hover:shadow-lg'
                }`}
              style={{ filter: 'url(#grain)', backgroundBlendMode: 'multiply' }}
            >
              {/* Accommodations title */}
              <div className="flex items-center justify-end gap-3 text-[#3E2723] pt-6 mb-4">
                <Home className="w-6 h-6 stroke-[2.5]" />
                <h3 className={`${SubheaderLg} text-xl tracking-[0.05em] uppercase`}>Accommodations</h3>
              </div>

              <div className="pb-6 pt-3 pl-4 sm:pl-10 md:pl-[180px] pr-4 sm:pr-6 md:pr-12">
                <div className="grid grid-cols-2 gap-y-8 gap-x-6 md:gap-x-8 w-full">
                  <div className="md:col-span-12">
                    <h4 className={`${SubheaderMd} opacity-90 tracking-wide uppercase mb-3`}>Current Residence</h4>

                    <div className="grid grid-cols-2 gap-y-5 gap-x-4 sm:gap-x-8 md:gap-x-16 w-full">

                      {/* Row 1 */}
                      <div>
                        <p className={`${SubheaderLg} leading-snug`}>Eliazo Hall</p>
                        <p className={`${SubheaderMd} opacity-80 leading-snug`}>Dormitory Name</p>
                      </div>
                      <div>
                        <p className={`${SubheaderLg} leading-snug`}>Room 101</p>
                        <p className={`${SubheaderMd} opacity-80 leading-snug`}>Unit Number</p>
                      </div>

                      {/* Row 2 */}
                      <div>
                        <p className={`${SubheaderLg} leading-snug`}>08/15/2023</p>
                        <p className={`${SubheaderMd} opacity-80 leading-snug`}>Contract Start Date</p>
                      </div>

                      {/* Last cell — Contract End Date + button on same row */}
                      <div className="flex items-end justify-between gap-4">
                        <div>
                          <p className={`${SubheaderLg} leading-snug`}>05/30/2024</p>
                          <p className={`${SubheaderMd} opacity-80 leading-snug`}>Contract End Date</p>
                        </div>

                        <Dialog>
                          <DialogTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="text-[#3E2723] opacity-70 hover:opacity-100 transition-opacity text-[10px] font-bold tracking-widest uppercase underline underline-offset-4 text-right leading-snug pb-1"
                            >
                              View Previous<br />Accommodations
                            </button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md bg-[#F4F5E1] border-[#7EB647]">
                            <DialogHeader>
                              <DialogTitle className="text-[#3E2723] font-bold">
                                Previous Accommodations
                              </DialogTitle>
                              <DialogDescription className="text-[#3E2723]/70">
                                A history of your past dormitory assignments.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="mt-4">
                              {/* Content goes here */}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Information Container */}
            <div
              onClick={() => setActiveTab('personal')}
              className={`col-start-1 row-start-1 w-full self-end overflow-hidden transition-all duration-300 ease-in-out cursor-pointer relative z-40 bg-[#8bc453] shadow-inner px-4 sm:px-6 md:px-12 ${activeTab === 'personal'
                ? 'min-h-[300px] sm:min-h-[350px] md:min-h-[380px] mt-[36px] sm:mt-[50px] max-h-[950px] rounded-tl-[40px] rounded-tr-[150px] sm:rounded-tr-[300px] rounded-b-[40px]'
                : 'mt-[60px] sm:mt-[80px] max-h-[90px] sm:max-h-[105px] rounded-[40px] hover:bg-[#8bc453]/90 hover:mt-[44px] sm:hover:mt-[60px] hover:shadow-lg'
                }`}
              style={activeTab === 'personal' ? { filter: 'url(#grain)', backgroundBlendMode: 'multiply' } : {}}
            >
              {/* Personal Information title */}
              <div className={`flex items-center gap-3 text-[#3E2723] transition-all duration-300 ${activeTab === 'personal' ? 'pt-8 mb-4' : 'py-6'}`}>
                <UserIcon className="w-6 h-6 stroke-[2.5]" />
                <h3 className={`${SubheaderLg} text-xl tracking-[0.05em] uppercase`}>Personal Information</h3>
              </div>

              <div className={`transition-opacity duration-300 pb-24 ${activeTab === 'personal' ? 'opacity-100' : 'opacity-0'}`}>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-y-8 gap-x-6">

                  {/* Academic Info */}
                  <div className="md:col-span-12">
                    <h4 className={`${SubheaderMd} opacity-90 tracking-wide uppercase mb-3`}>Academic Info</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                      <div>
                        <p className={`${SubheaderLg} leading-snug`}>{formattedBirthdate}</p>
                        <p className={`${SubheaderMd} opacity-80 leading-snug`}>Birthdate</p>
                      </div>
                      <div>
                        <p className={`${SubheaderLg} leading-snug`}>{studentNum}</p>
                        <p className={`${SubheaderMd} opacity-80 leading-snug`}>Student Number</p>
                      </div>
                      <div>
                        <p className={`${SubheaderLg} leading-snug`}>{degreeProg}</p>
                        <p className={`${SubheaderMd} opacity-80 leading-snug`}>Degree Program</p>
                      </div>
                      <div>
                        <p className={`${SubheaderLg} leading-snug`}>{college}</p>
                        <p className={`${SubheaderMd} opacity-80 leading-snug`}>College</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Details */}
                  <div className="md:col-span-9">
                    <h4 className={`${SubheaderMd} opacity-90 tracking-wide uppercase mb-3`}>Contact Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div>
                        <p className={`${SubheaderLg} leading-snug break-all`}>{user.email}</p>
                        <p className={`${SubheaderMd} opacity-80 leading-snug`}>Email Address</p>
                      </div>
                      <div>
                        <p className={`${SubheaderLg} leading-snug`}>{contactNum}</p>
                        <p className={`${SubheaderMd} opacity-80 leading-snug`}>Contact Number</p>
                      </div>
                      <div>
                        <p className={`${SubheaderLg} leading-snug`}>{homeAddress}</p>
                        <p className={`${SubheaderMd} opacity-80 leading-snug`}>Home Address</p>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contacts */}
                  <div className="md:col-span-3">
                    <h4 className={`${SubheaderMd} opacity-90 tracking-wide uppercase mb-3`}>Emergency Contacts</h4>
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <p className={`${SubheaderLg} leading-snug`}>{emergencyContact}</p>
                        <p className={`${SubheaderMd} opacity-80 leading-snug`}>Emergency Contact</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
          </div>


          {/* Floating Action Buttons */}
          <div className="absolute right-4 md:right-6 bottom-6 flex gap-3 z-50">
            <EditProfileDialog user={user} metadata={metadata} />
          </div>

        </div>
      </div>
    </div>
  );
}