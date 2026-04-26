"use client";
import { useState } from "react";
import { Archivo_Black, Archivo } from "next/font/google";
import { Icon } from "@iconify/react";

const archivoBlack = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-archivo-black",
});

const archivo = Archivo({
  weight: "100",
  subsets: ["latin"],
  variable: "--font-archivo",
});

type InfoItemProps = {
  value: string;
  label: string;
};

export function InfoItem({ value, label }: InfoItemProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[13px] text-[#1a2a08]">{value}</p>
      <p className="text-[11px] text-[#a0c870]">{label}</p>
    </div>
  );
}

type ProfileCardProps = {
  studentName: string;
  avatarUrl?: string;
  onEdit?: () => void;
  onFolder?: () => void;
  children: React.ReactNode;
};

export default function StudentProfileCard({
  studentName,
  avatarUrl,
  onEdit,
  onFolder,
  children,
}: ProfileCardProps) {
  const [isPersonalOpen, setIsPersonalOpen] = useState(false);
  const [isAccomOpen, setIsAccomOpen] = useState(false);

  return (
    <div className="max-w-4xl mx-auto px-4">
    {/* max-w controls width, mx-auto centers it, px adds side whitespace */}
      {/* Outer card */}
      <div className="bg-[#7ab648] rounded-t-3xl rounded-b-[32px] pt-6 px-6">

        {/* Header */}
        <div className="flex items-center gap-4 mb-4">

          {/* Avatar with frame overlay */}
          <div className="relative w-[175px] h-[175px] flex-shrink-0">

            {/* Avatar sits behind */}
            <div className="w-full h-full rounded-full overflow-hidden bg-[#c8a070]">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={studentName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="w-full h-full flex items-center justify-center text-[#3a2010] font-medium text-lg">
                  {studentName.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            {/* Frame overlays on top */}
            <img
              src="/assets/user-profile-frame.png"
              alt="frame"
              className="absolute inset-0 w-[291px] h-[291px] object-contain z-10 pointer-events-none"
            />
          </div>

          {/* Greeting */}
          <div>
            <p style={{
    textShadow: `
      -2px -2px 3px rgba(0,0,0,0.6),
      2px 2px 3px rgba(255,255,255,0.12)
    `
  }} className="${archivoBlack.variable} font-[family-name:var(--font-archivo-black)] text-[36px] text-[#44291B]">Kumusta,</p>
            <h1 style={{
    textShadow: `
      -2px -2px 3px rgba(0,0,0,0.6),
      2px 2px 3px rgba(255,255,255,0.12)
    `
  }} className="${archivoBlack.variable} font-[family-name:var(--font-archivo-black)] text-[64px] font-bold text-[#44291B]">{studentName}?</h1>
          </div>
        </div>

        {/* Inner card */}
        <div className="bg-[#5a9e2f] rounded-2xl px-6 py-5">

          {/* Accommodations toggle */}
          <button
            onClick={() => setIsAccomOpen(!isAccomOpen)}
            className={`${archivoBlack.variable} font-[family-name:var(--font-archivo-black)] flex items-center gap-2 w-full text-left text-[#648A3B] text-[28.8px] tracking-widest uppercase py-2`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width={40} height={40} viewBox="0 0 24 24"><path fill="#648A3B" d="M5 20V9.5l7-5.288L19 9.5V20h-5.192v-6.384h-3.616V20z"></path></svg>
            <span>Accommodations</span>
            <span className={`ml-auto text-[10px] transition-transform duration-300 ${isAccomOpen ? "rotate-180" : "rotate-0"}`}>
            </span>
          </button>

          {/* Accommodations collapsible */}
          <div className={`${archivo.variable} font-[family-name:var(--font-archivo)] overflow-hidden transition-all duration-300 ease-in-out text-[#44291B] ${isAccomOpen ? "max-h-[400px] py-3" : "max-h-0"}`}>
            <div className="grid grid-cols-2 gap-3">
              <InfoItem value="Men's Dorm (Lower Campus)" label="Dormitory Name" />
              <InfoItem value="09662981806" label="Unit Number" />
              <InfoItem value="January 25, 2026" label="Contract Start Date" />
              <InfoItem value="June 25, 2026" label="Contract End Date" />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#4a8020] my-2" />

          {/* Personal Information toggle */}
          <button
            onClick={() => setIsPersonalOpen(!isPersonalOpen)}
            className={`${archivoBlack.variable} font-[family-name:var(--font-archivo-black)] flex items-center gap-2 w-full text-left text-[#648A3B] text-[28.8px] tracking-widest uppercase py-2`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width={40} height={40} viewBox="0 0 512 512"><path fill="#648A3B" fillRule="evenodd" d="M256 42.667A213.333 213.333 0 0 1 469.334 256c0 117.821-95.513 213.334-213.334 213.334c-117.82 0-213.333-95.513-213.333-213.334C42.667 138.18 138.18 42.667 256 42.667m21.334 234.667h-42.667c-52.815 0-98.158 31.987-117.715 77.648c30.944 43.391 81.692 71.685 139.048 71.685s108.104-28.294 139.049-71.688c-19.557-45.658-64.9-77.645-117.715-77.645M256 106.667c-35.346 0-64 28.654-64 64s28.654 64 64 64s64-28.654 64-64s-28.653-64-64-64"></path></svg>
            <span>Personal Information</span>
            <span className={`ml-auto text-[10px] transition-transform duration-300 ${isPersonalOpen ? "rotate-180" : "rotate-0"}`}>
            </span>
          </button>

          {/* Personal Information collapsible */}
          <div className={`${archivo.variable} font-[family-name:var(--font-archivo)] text-[#44291B] text-[22px] overflow-hidden transition-all duration-300 ease-in-out ${isPersonalOpen ? "max-h-[600px] py-3" : "max-h-0"}`}>
            {children}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={onEdit}
              className="w-8 h-8 rounded-full bg-[#3a6a18] flex items-center justify-center text-[#c8e8a0] text-sm hover:bg-[#4a7a28] transition-colors"
            >
              ✎
            </button>
            <button
              onClick={onFolder}
              className="w-8 h-8 rounded-full bg-[#3a6a18] flex items-center justify-center text-[#c8e8a0] text-sm hover:bg-[#4a7a28] transition-colors"
            >
              🗀
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}