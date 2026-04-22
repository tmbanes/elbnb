"use client";

import StudentProfileCard, { InfoItem } from "@/components/ui/studentprofile-card";

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F8D5] px-4">
      <StudentProfileCard
        studentName="Lee Donghyuck"
        avatarUrl="/images/avatar.png"
        onEdit={() => console.log("edit")}
        onFolder={() => console.log("folder")}
      >
        {/* Academic Info */}
        <p className="text-[11px] font-bold text-[#d0e8a0] tracking-wide mb-2">
          Academic Info
        </p>
        <div className="grid grid-cols-4 gap-3 mb-4">
          <InfoItem value="06/09/2005" label="Birthdate" />
          <InfoItem value="2023-65898" label="Student Number" />
          <InfoItem value="BS Computer Science" label="Degree Program" />
          <InfoItem value="CAS" label="College" />
        </div>

        {/* Contact Details */}
        <p className="text-[11px] font-bold text-[#d0e8a0] tracking-wide mb-2">
          Contact Details
        </p>
        <div className="grid grid-cols-4 gap-3 mb-4">
          <InfoItem value="markhyuck@up.edu.ph" label="Email Address" />
          <InfoItem value="09662981806" label="Contact Number" />
          <InfoItem value="Tondo, Manila" label="Home Address" />
          <InfoItem value="2023-65898" label="Emergency Contact" />
        </div>
      </StudentProfileCard>
    </div>
  );
}