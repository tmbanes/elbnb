"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ProfileUpload } from '@/app/dashboard/ProfileUpload';
import { EditProfileDialog } from '@/app/dashboard/EditProfileDialog';
import { User } from '@/types/user.types';
import { Home, Edit3, Folder, CircleUser, User as UserIcon, Upload, ShieldCheck, MapPinHouse, Building2 } from 'lucide-react';
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

interface ProfileComponentProps {
  user: User;
  metadata: any;
}

export function ProfileComponent({ user, metadata }: ProfileComponentProps) {
  const [uploadPhotoOpen, setUploadPhotoOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'accommodations'>('personal');

  const role = user.role;

  // Metadata mapping based on role
  const isStudent = role === 'student';
  const isAdmin = role === 'housing_admin';
  const isManager = role === 'dormitory_manager';
  const isGuest = role === 'guest';

  // Role-specific labels and icons
  const secondFolderLabel = isStudent ? "Accommodations" : 
                            isGuest ? "Visit Details" :
                            isAdmin ? "Administrative Info" :
                            "Management Info";
  
  const SecondFolderIcon = isStudent ? Home :
                           isGuest ? MapPinHouse :
                           isAdmin ? ShieldCheck :
                           Building2;

  const firstFolderSubheader = isStudent ? "Academic Info" :
                               isGuest ? "Guest Info" :
                               "Employee Info";

  // Role-specific metadata
  const studentNum = metadata?.student_number || 'N/A';
  const degreeProg = metadata?.degree_program || 'N/A';
  const college = metadata?.college || 'CAS';
  
  const adminId = metadata?.admin_id || 'N/A';
  const officeLocation = metadata?.office_location || 'N/A';
  
  const employeeId = metadata?.employee_id || 'N/A';
  
  const validId = metadata?.valid_id || 'N/A';
  const purposeVisit = metadata?.purpose_visit || 'N/A';
  const occupancyStatus = metadata?.occupancy_status || 'N/A';

  const contactNum = metadata?.contact_number || 'N/A';
  const homeAddress = metadata?.home_address || 'N/A';
  const emergencyContact = metadata?.emergency_contact || 'N/A';

  const formattedBirthdate = user.birthdate || 'N/A';

  const renderContent = () => {
    return (
      <div className="grid grid-cols-1 grid-rows-1 mt-3 sm:mt-6 relative w-full min-h-[280px] sm:min-h-[350px] md:min-h-[400px]">
        {/* Second Folder (Accommodations/Admin/etc) */}
        <div
          onClick={() => setActiveTab('accommodations')}
          className={`col-start-1 row-start-1 w-full md:w-[80%] justify-self-end overflow-hidden transition-all duration-300 ease-in-out cursor-pointer bg-[#8bc453] shadow-inner px-4 sm:px-6 md:px-12 rounded-tl-[200px] sm:rounded-tl-[400px] md:rounded-tl-[700px] rounded-tr-[40px] sm:rounded-tr-[60px] md:rounded-tr-[100px] rounded-bl-[40px] rounded-br-[40px] ${activeTab === 'accommodations'
            ? 'h-full'
            : 'hover:bg-[#8bc453] hover:shadow-lg'
            }`}
          style={{ filter: 'url(#grain)', backgroundBlendMode: 'multiply' }}
        >
          <div className="flex items-center justify-end gap-3 text-[#3E2723] pt-6 mb-4">
            <SecondFolderIcon className="w-6 h-6 stroke-[2.5]" />
            <h3 className={`${SubheaderLg} text-xl tracking-[0.05em] uppercase`}>{secondFolderLabel}</h3>
          </div>

          <div className="pb-6 pt-3 pl-4 sm:pl-10 md:pl-[180px] pr-4 sm:pr-6 md:pr-12">
            <div className="grid grid-cols-2 gap-y-8 gap-x-6 md:gap-x-8 w-full">
              <div className="md:col-span-12">
                {isStudent && (
                  <>
                    <div className="flex items-center justify-start gap-4 mb-3">
                      <h4 className={`${SubheaderMd} opacity-90 tracking-wide uppercase`}>Current Residence</h4>
                      <Dialog>
                        <DialogTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="text-[#3E2723] opacity-70 hover:opacity-100 transition-opacity text-[10px] font-bold tracking-widest uppercase underline underline-offset-4 whitespace-nowrap"
                          >
                            View Previous Residences
                          </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md bg-[#F4F5E1] border-[#7EB647]">
                          <DialogHeader>
                            <DialogTitle className="text-[#3E2723] font-bold">Previous Accommodations</DialogTitle>
                            <DialogDescription className="text-[#3E2723]/70">A history of your past dormitory assignments.</DialogDescription>
                          </DialogHeader>
                          <div className="mt-4"></div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="grid grid-cols-2 gap-y-5 gap-x-4 sm:gap-x-8 md:gap-x-16 w-full">
                      <div><p className={`${SubheaderLg} leading-snug`}>Eliazo Hall</p><p className={`${SubheaderMd} opacity-80 leading-snug`}>Dormitory Name</p></div>
                      <div><p className={`${SubheaderLg} leading-snug`}>Room 101</p><p className={`${SubheaderMd} opacity-80 leading-snug`}>Unit Number</p></div>
                      <div><p className={`${SubheaderLg} leading-snug`}>08/15/2023</p><p className={`${SubheaderMd} opacity-80 leading-snug`}>Contract Start Date</p></div>
                      <div><p className={`${SubheaderLg} leading-snug`}>05/30/2024</p><p className={`${SubheaderMd} opacity-80 leading-snug`}>Contract End Date</p></div>
                    </div>
                  </>
                )}
                {isGuest && (
                  <div className="grid grid-cols-2 gap-y-5 gap-x-4 sm:gap-x-8 md:gap-x-16 w-full">
                    <div><p className={`${SubheaderLg} leading-snug`}>{purposeVisit}</p><p className={`${SubheaderMd} opacity-80 leading-snug`}>Purpose of Visit</p></div>
                    <div><p className={`${SubheaderLg} leading-snug`}>{occupancyStatus}</p><p className={`${SubheaderMd} opacity-80 leading-snug`}>Occupancy Status</p></div>
                  </div>
                )}
                {(isAdmin || isManager) && (
                  <div className="grid grid-cols-1 gap-y-5 w-full">
                    <div>
                      <p className={`${SubheaderLg} leading-snug`}>{isAdmin ? officeLocation : "Assigned Dormitory"}</p>
                      <p className={`${SubheaderMd} opacity-80 leading-snug`}>{isAdmin ? "Office Location" : "Primary Management Area"}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* First Folder (Personal Information) */}
        <div
          onClick={() => setActiveTab('personal')}
          className={`col-start-1 row-start-1 w-full self-end cursor-pointer relative z-40 bg-[#8bc453] shadow-inner px-4 sm:px-6 md:px-12
          mt-[60px] sm:mt-[80px]
          transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${activeTab === 'personal'
              ? 'rounded-tl-[40px] rounded-tr-[150px] sm:rounded-tr-[300px] rounded-b-[40px]'
              : 'rounded-[40px] hover:bg-[#8bc453] hover:shadow-lg'
            }`}
          style={activeTab === 'personal' ? { filter: 'url(#grain)', backgroundBlendMode: 'multiply' } : {}}
        >
          <div className={`flex items-center gap-3 text-[#3E2723] transition-all duration-500 ${activeTab === 'personal' ? 'pt-8 mb-4' : 'py-5 sm:py-6'}`}>
            <CircleUser className="w-6 h-6 stroke-[2.5]" />
            <h3 className={`${SubheaderLg} text-xl tracking-[0.05em] uppercase`}>Personal Information</h3>
          </div>
          <div className={`grid transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${activeTab === 'personal' ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
            <div className="min-h-0 overflow-hidden">
              <div className={`pb-24 transition-opacity duration-300 delay-100 ${activeTab === 'personal' ? 'opacity-100' : 'opacity-0'}`}>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-y-8 gap-x-6">
                  <div className="md:col-span-12">
                    <h4 className={`${SubheaderMd} opacity-90 tracking-wide uppercase mb-3`}>{firstFolderSubheader}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                      <div><p className={`${SubheaderLg} leading-snug`}>{formattedBirthdate}</p><p className={`${SubheaderMd} opacity-80 leading-snug`}>Birthdate</p></div>
                      
                      {isStudent && (
                        <>
                          <div><p className={`${SubheaderLg} leading-snug`}>{studentNum}</p><p className={`${SubheaderMd} opacity-80 leading-snug`}>Student Number</p></div>
                          <div><p className={`${SubheaderLg} leading-snug`}>{degreeProg}</p><p className={`${SubheaderMd} opacity-80 leading-snug`}>Degree Program</p></div>
                          <div><p className={`${SubheaderLg} leading-snug`}>{college}</p><p className={`${SubheaderMd} opacity-80 leading-snug`}>College</p></div>
                        </>
                      )}
                      
                      {isAdmin && (
                        <div><p className={`${SubheaderLg} leading-snug`}>{adminId}</p><p className={`${SubheaderMd} opacity-80 leading-snug`}>Admin ID</p></div>
                      )}

                      {isManager && (
                        <div><p className={`${SubheaderLg} leading-snug`}>{employeeId}</p><p className={`${SubheaderMd} opacity-80 leading-snug`}>Employee ID</p></div>
                      )}

                      {isGuest && (
                        <div><p className={`${SubheaderLg} leading-snug`}>{validId}</p><p className={`${SubheaderMd} opacity-80 leading-snug`}>Valid ID Reference</p></div>
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-9">
                    <h4 className={`${SubheaderMd} opacity-90 tracking-wide uppercase mb-3`}>Contact Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div><p className={`${SubheaderLg} leading-snug break-all`}>{user.email}</p><p className={`${SubheaderMd} opacity-80 leading-snug`}>Email Address</p></div>
                      <div><p className={`${SubheaderLg} leading-snug`}>{contactNum}</p><p className={`${SubheaderMd} opacity-80 leading-snug`}>Contact Number</p></div>
                      <div><p className={`${SubheaderLg} leading-snug`}>{homeAddress}</p><p className={`${SubheaderMd} opacity-80 leading-snug`}>Home Address</p></div>
                    </div>
                  </div>
                  <div className="md:col-span-3">
                    <h4 className={`${SubheaderMd} opacity-90 tracking-wide uppercase mb-3`}>Emergency Contacts</h4>
                    <div className="grid grid-cols-1 gap-6">
                      <div><p className={`${SubheaderLg} leading-snug`}>{emergencyContact}</p><p className={`${SubheaderMd} opacity-80 leading-snug`}>Emergency Contact</p></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className={`min-h-screen bg-[#F4F5E1] p-3 sm:p-4 md:p-12 flex justify-center items-start ${nunito.className} text-[#3E2723]`}>
      <svg className="hidden">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
          <feColorMatrix type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 0.15 0" in="noise" result="coloredNoise" />
          <feComposite operator="in" in="coloredNoise" in2="SourceGraphic" result="composite" />
          <feBlend mode="multiply" in="composite" in2="SourceGraphic" />
        </filter>
      </svg>

      <div className="relative w-full max-w-5xl mt-10 sm:mt-16 pt-10 sm:pt-12 z-10 flex flex-col">
        <div className="absolute inset-0 z-0 pointer-events-none drop-shadow-[0_25px_25px_rgba(0,0,0,0.15)]" style={{ filter: 'url(#grain)' }}>
          <div className="absolute inset-0 w-full h-full bg-[#7EB647] rounded-t-[150px] sm:rounded-t-[300px] rounded-bl-[40px] rounded-br-[40px]" />
        </div>

        {/* House & Profile breakout */}
        <div className="absolute top-[-40px] sm:top-[-60px] md:top-[-70px] left-[10px] sm:left-[20px] md:left-[30px] z-20 w-[160px] h-[160px] sm:w-[220px] sm:h-[220px] md:w-[280px] md:h-[280px]">
          <div className="absolute left-1/2 top-[64%] -translate-x-1/2 -translate-y-1/2 w-[63%] h-[63%] z-10 rounded-full overflow-hidden bg-[#3E2723] flex items-center justify-center">
            {user.profile_picture_url ? (
              <img src={user.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-1/2 h-1/2 text-[#F4F5E1]/30" />
            )}
          </div>
          <Dialog open={uploadPhotoOpen} onOpenChange={setUploadPhotoOpen}>
            <DialogTrigger asChild>
              <button className="absolute inset-0 z-20 group cursor-pointer" aria-label="Edit profile picture">
                <img src="/assets/user-profile-frame.png" alt="Profile Frame" className="absolute inset-0 w-full h-full object-contain" />
                <div className="absolute left-1/2 top-[64%] -translate-x-1/2 -translate-y-1/2 w-[63%] h-[63%] rounded-full overflow-hidden">
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Edit3 size={28} className="text-white mb-1" />
                    <span className="text-white text-[11px] font-bold tracking-wider">EDIT</span>
                  </div>
                </div>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-[#F4F5E1] border-[#7EB647]">
              <DialogHeader>
                <DialogTitle className="text-[#3E2723] font-bold">Update Profile Picture</DialogTitle>
                <DialogDescription className="text-[#3E2723]/70">Upload a new photo to your account.</DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <ProfileUpload initialProfileUrl={user.profile_picture_url} />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative z-30 flex-1 flex flex-col">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end px-6 md:px-12">
            <div className="mt-[110px] sm:mt-[140px] md:mt-0 md:ml-[270px] leading-tight drop-shadow-sm pb-6 sm:pb-10 md:pb-0 relative z-30">
              <h2 className={`${HeaderMd} text-[#3E2723]/90`}>Kumusta,</h2>
              <h1 className={`${HeaderLg} text-[#3E2723] tracking-tight mt-1`}>{user.first_name} {user.last_name}?</h1>
            </div>
          </div>

          <div className="overflow-hidden rounded-bl-[40px] rounded-br-[40px]">
            {renderContent()}
          </div>

          <div className="absolute right-4 md:right-6 bottom-6 flex gap-3 z-50">
            <EditProfileDialog user={user} metadata={metadata} />
          </div>
        </div>
      </div>
    </div>
  );
}