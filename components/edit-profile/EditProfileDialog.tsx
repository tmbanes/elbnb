"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

const collegeDegreeMap: Record<string, string[]> = {
  CAS: ["BA Communication Arts", "BA Philosophy", "BA Sociology", "BS Applied Mathematics", "BS Applied Physics", "BS Biology", "BS Chemistry", "BS Computer Science", "BS Mathematics", "BS Mathematics and Science Teaching", "BS Statistics", "BS Agricultural Chemistry (Jointly administered with CAFS)", "MA Communication Arts", "MA Sociology", "MS Applied Mathematics", "MS Botany", "MS Chemistry", "MS Computer Science", "MS Genetics", "MS Mathematics", "MS Microbiology", "MS Physics", "MS Statistics", "MS Zoology"],
  CEAT: ["BS Agricultural and Biosystems Engineering", "BS Chemical Engineering", "BS Civil Engineering", "BS Electrical Engineering", "BS Industrial Engineering", "BS Mechanical Engineering", "MS Agricultural Engineering", "MS Agrometeorology", "MS Chemical Engineering"],
  CAFS: ["BS Agriculture", "BS Agricultural Biotechnology", "BS Food Science and Technology", "BS Agricultural Chemistry (Jointly administered with CAS)", "MS Agronomy", "MS Animal Science", "MS Entomology", "MS Food Science", "MS Horticulture", "MS Plant Breeding", "MS Plant Pathology", "MS Soil Science", "MS Weed Science"],
  CVM: ["Doctor of Veterinary Medicine (DVM)", "MS Veterinary Medicine"],
  CDC: ["BS Development Communication", "Master of Development Communication", "MS Development Communication"],
  CEM: ["BS Accountancy", "BS Agribusiness Management and Entrepreneurship", "BS Agricultural and Applied Economics", "BS Economics", "Master of Management (MM)", "MS Agricultural Economics", "MS Economics"],
  CHE: ["BS Human Ecology", "BS Nutrition", "MS Applied Nutrition", "MS Clinical Nutrition", "MS Family Resource Management"],
  CFNR: ["BS Forestry", "MS Forestry", "MS Natural Resources Conservation"],
  SESAM: ["Master in Environmental Management (MEM)", "Professional Master in Tropical Marine Ecosystems Management (PMTMEM)", "MS Environmental Science"],
  CPAf: ["Master in Public Affairs (MPAf)", "MS Community Development", "MS Development Management and Governance", "MS Extension Education"]
};

const validIdsList = [
  "Philippine Identification Card (PhilID / National ID) or ePhilID",
  "Philippine Passport (issued by DFA)",
  "Driver’s License (issued by LTO)",
  "Unified Multi-Purpose ID (UMID)",
  "Social Security System (SSS) ID",
  "Government Service Insurance System (GSIS) eCard",
  "Professional Regulation Commission (PRC) ID",
  "Postal ID (plastic card format issued by PhlPost)",
  "Voter’s ID or Voter's Certification (issued by COMELEC)",
  "Seaman’s Book or Seafarer’s Record and Identification Book (SIRB)",
  "Overseas Workers Welfare Administration (OWWA) ID or iDOLE Card",
  "Senior Citizen ID",
  "Person with Disability (PWD) ID",
  "Solo Parent ID",
  "School ID (for currently enrolled students)",
  "Employee or Company ID (for currently employed individuals, issued by a DOLE-registered institution)",
  "PhilHealth ID",
  "Tax Identification Number (TIN) ID",
  "NBI Clearance",
  "Police Clearance",
  "Barangay Clearance or Certification",
  "Pag-IBIG Loyalty Card"
];

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger 
} from "@/components/ui/dialog";
import { User as UserType, SEX } from '@/types/user.types';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { Edit3, Loader2, Camera, ShieldCheck } from 'lucide-react';
import { ProfileUpload } from './ProfileUpload';
import { updateProfileAction } from '@/lib/actions/profile.actions';

interface EditProfileDialogProps {
  user: UserType;
  metadata: any;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditProfileDialog({ user, metadata, children, open, onOpenChange, onSuccess }: EditProfileDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isActuallyOpen = open !== undefined ? open : internalOpen;
  const toggleOpen = onOpenChange !== undefined ? onOpenChange : setInternalOpen;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [contactNum, setContactNum] = useState(user.contact_number || metadata?.contact_number || '');
  const [homeAddress, setHomeAddress] = useState(metadata?.home_address || '');
  const [emergencyContact, setEmergencyContact] = useState(metadata?.emergency_contact || '');
  
  const [studentNum, setStudentNum] = useState(metadata?.student_number || '');
  
  const initialDegree = metadata?.degree_program || '';
  const isCustomDegreeInit = initialDegree && !Object.values(collegeDegreeMap).flat().includes(initialDegree);
  const [degreeProgram, setDegreeProgram] = useState(isCustomDegreeInit ? "Others" : initialDegree);
  const [customDegree, setCustomDegree] = useState(isCustomDegreeInit ? initialDegree : '');
  
  const predefinedColleges = ['CAS', 'CEAT', 'CAFS', 'CVM', 'CDC', 'CEM', 'CHE', 'CFNR', 'SESAM', 'CPAf'];
  const initialCollege = metadata?.college || '';
  const isCustomCollegeInit = initialCollege && !predefinedColleges.includes(initialCollege);
  const [college, setCollege] = useState(isCustomCollegeInit ? "Others" : initialCollege);
  const [customCollege, setCustomCollege] = useState(isCustomCollegeInit ? initialCollege : '');
  
  const initialValidId = metadata?.valid_id || '';
  const isCustomValidIdInit = initialValidId && !validIdsList.includes(initialValidId);
  const [validId, setValidId] = useState(isCustomValidIdInit ? "Others" : initialValidId);
  const [customValidId, setCustomValidId] = useState(isCustomValidIdInit ? initialValidId : '');
  const [purposeVisit, setPurposeVisit] = useState(metadata?.purpose_visit || '');
  

  const [adminId, setAdminId] = useState(metadata?.admin_id || '');
  const [officeLocation, setOfficeLocation] = useState(metadata?.office_location || '');
  const [birthdate, setBirthdate] = useState(user.birthdate || '');
  const [sex, setSex] = useState(user.sex || metadata?.sex || '');
  const [enrollmentStatus, setEnrollmentStatus] = useState(metadata?.enrollment_status || 'enrolled');
  const [emergencyPerson, setEmergencyPerson] = useState(metadata?.emergency_person || '');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Refs for auto-scrolling
  const contactRef = useRef<HTMLDivElement>(null);
  const emergencyRef = useRef<HTMLDivElement>(null);
  const studentNumRef = useRef<HTMLDivElement>(null);

  const scrollToError = (errors: Record<string, string>) => {
    if (errors.contact_number) contactRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    else if (errors.emergency_contact) emergencyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    else if (errors.student_num) studentNumRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    
    if (contactNum && !/^\d{11}$/.test(contactNum)) {
      newErrors.contact_number = "Must be exactly 11 digits.";
    }
    
    if (user.role === 'student') {
      if (studentNum && !/^\d{9}$/.test(studentNum)) {
        newErrors.student_num = "Must be exactly 9 digits.";
      }
    }

    if (emergencyContact && !/^\d{11}$/.test(emergencyContact)) {
      newErrors.emergency_contact = "Must be exactly 11 digits.";
    }

    setFieldErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      scrollToError(newErrors);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        contact_number: contactNum,
        home_address: homeAddress,
        emergency_contact: emergencyContact,
        student_num: studentNum,
        degree_program: degreeProgram === "Others" ? customDegree : degreeProgram,
        college: college === "Others" ? customCollege : college,
        valid_id: validId === "Others" ? customValidId : validId,
        purpose_visit: purposeVisit,
        admin_id: adminId,
        office_location: officeLocation,
        birthdate: birthdate,
        sex: sex,
        enrollment_status: enrollmentStatus,
        emergency_person: emergencyPerson,
      };

      await updateProfileAction(payload);
      
      onSuccess?.();
      toggleOpen(false);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to update profile details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isActuallyOpen} onOpenChange={toggleOpen}>
      <DialogTrigger asChild>
        {children || (
          <button className="w-[50px] h-[50px] bg-[#3E2723] text-[#F4F5E1] rounded-full flex items-center justify-center hover:bg-[#2B1B18] transition-colors shadow-xl">
            <Edit3 size={20} strokeWidth={2.5} />
          </button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto bg-[#F4F5E1] border-[4px] border-[#7EB647] rounded-[30px] p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight text-[#3E2723]">Edit Profile</DialogTitle>
          <DialogDescription className="text-[#3E2723]/70 font-medium">
            Update your profile information. Name and Email are strictly read-only.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-6 mt-4">
          {error && <div className="p-3 bg-red-100 text-red-700 rounded-xl text-sm font-bold animate-in fade-in slide-in-from-top-1">{error}</div>}
          
          {/* Editable Section */}
          <div className="space-y-8">
            
            {/* 1. Personal Information */}
            <div className="space-y-4">
              <h3 className="uppercase tracking-widest text-xs font-black text-[#7EB647] flex items-center gap-2">
                Personal Information <div className="h-[2px] w-full bg-[#7EB647]/30 rounded-full" />
              </h3>

              <div className="bg-[#3E2723]/5 p-4 rounded-2xl border-2 border-dashed border-[#3E2723]/20">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="shrink-0">
                    <ProfileUpload initialProfileUrl={user.profile_picture_url} />
                  </div>
                  <div className="text-center md:text-left">
                    <p className="text-sm font-bold text-[#3E2723]">Profile Picture</p>
                    <p className="text-xs text-[#3E2723]/60 mt-1">
                      Click the circle or drag a file to upload.<br/>
                      Accepts JPG, PNG, WEBP (Max 5MB)
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1" ref={contactRef}>
                  <label className="text-xs font-bold text-[#3E2723] opacity-80 uppercase tracking-wide">Contact Number</label>
                  <input 
                    type="tel" 
                    required
                    maxLength={11}
                    value={contactNum}
                    onChange={(e) => {
                      setContactNum(e.target.value.replace(/[^0-9]/g, ''));
                      if (fieldErrors.contact_number) setFieldErrors(prev => ({ ...prev, contact_number: '' }));
                    }}
                    className={`w-full bg-white border-[3px] ${fieldErrors.contact_number ? 'border-red-400' : 'border-[#3E2723]/10'} focus:border-[#7EB647] text-[#3E2723] rounded-xl px-4 py-2 font-semibold outline-none transition-colors`}
                    placeholder="e.g. 09760799992"
                  />
                  {fieldErrors.contact_number ? (
                    <p className="text-[10px] text-red-500 font-bold pl-1">{fieldErrors.contact_number}</p>
                  ) : (
                    <p className="text-[10px] text-[#3E2723]/60 font-semibold pl-1">Format: 11 digits</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3E2723] opacity-80 uppercase tracking-wide">Birthdate</label>
                  <input 
                    type="date" 
                    required
                    value={birthdate}
                    onChange={(e) => setBirthdate(e.target.value)}
                    className="w-full bg-white border-[3px] border-[#3E2723]/10 focus:border-[#7EB647] text-[#3E2723] rounded-xl px-4 py-2 font-semibold outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3E2723] opacity-80 uppercase tracking-wide">Sex</label>
                  <select 
                    required
                    value={sex}
                    onChange={(e) => setSex(e.target.value)}
                    className="w-full bg-white border-[3px] border-[#3E2723]/10 focus:border-[#7EB647] text-[#3E2723] rounded-xl px-4 py-2.5 font-semibold outline-none transition-colors"
                  >
                    <option value="" disabled>Select Sex</option>
                    <option value="M">Male (M)</option>
                    <option value="F">Female (F)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3E2723] opacity-80 uppercase tracking-wide">Home Address</label>
                  <textarea 
                    required
                    value={homeAddress}
                    onChange={(e) => setHomeAddress(e.target.value)}
                    className="w-full bg-white border-[3px] border-[#3E2723]/10 focus:border-[#7EB647] text-[#3E2723] rounded-xl px-4 py-2 font-semibold outline-none transition-colors resize-y"
                    placeholder="Full address"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* 2. Emergency Contact */}
            {(user.role === 'student' || user.role === 'guest') && (
              <div className="space-y-4">
                <h3 className="uppercase tracking-widest text-xs font-black text-[#7EB647] flex items-center gap-2">
                  Emergency Contact <div className="h-[2px] w-full bg-[#7EB647]/30 rounded-full" />
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#3E2723] opacity-80 uppercase tracking-wide">Emergency Person</label>
                    <input 
                      type="text" 
                      required
                      value={emergencyPerson}
                      onChange={(e) => setEmergencyPerson(e.target.value)}
                      className="w-full bg-white border-[3px] border-[#3E2723]/10 focus:border-[#7EB647] text-[#3E2723] rounded-xl px-4 py-2 font-semibold outline-none transition-colors"
                      placeholder="Full name"
                    />
                  </div>
                  <div className="space-y-1" ref={emergencyRef}>
                    <label className="text-xs font-bold text-[#3E2723] opacity-80 uppercase tracking-wide">Emergency Contact</label>
                    <input 
                      type="tel" 
                      required
                      maxLength={11}
                      value={emergencyContact}
                      onChange={(e) => {
                        setEmergencyContact(e.target.value.replace(/[^0-9]/g, ''));
                        if (fieldErrors.emergency_contact) setFieldErrors(prev => ({ ...prev, emergency_contact: '' }));
                      }}
                      className={`w-full bg-white border-[3px] ${fieldErrors.emergency_contact ? 'border-red-400' : 'border-[#3E2723]/10'} focus:border-[#7EB647] text-[#3E2723] rounded-xl px-4 py-2 font-semibold outline-none transition-colors`}
                      placeholder="e.g. 09123456789"
                    />
                    {fieldErrors.emergency_contact ? (
                      <p className="text-[10px] text-red-500 font-bold pl-1">{fieldErrors.emergency_contact}</p>
                    ) : (
                      <p className="text-[10px] text-[#3E2723]/60 font-semibold pl-1">Format: 11 digits (e.g. 09123456789)</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* 3. Student Records */}
            {user.role === 'student' && (
              <div className="space-y-4">
                <h3 className="uppercase tracking-widest text-xs font-black text-[#7EB647] flex items-center gap-2">
                  Academic Information <div className="h-[2px] w-full bg-[#7EB647]/30 rounded-full" />
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1" ref={studentNumRef}>
                    <label className="text-xs font-bold text-[#3E2723] opacity-80 uppercase tracking-wide">Student Number</label>
                    <input 
                      type="tel" 
                      required
                      maxLength={9}
                      value={studentNum}
                      onChange={(e) => {
                        setStudentNum(e.target.value.replace(/[^0-9]/g, ''));
                        if (fieldErrors.student_num) setFieldErrors(prev => ({ ...prev, student_num: '' }));
                      }}
                      className={`w-full bg-white border-[3px] ${fieldErrors.student_num ? 'border-red-400' : 'border-[#3E2723]/10'} focus:border-[#7EB647] text-[#3E2723] rounded-xl px-4 py-2 font-semibold outline-none transition-colors`}
                      placeholder="e.g. 202314986"
                    />
                    {fieldErrors.student_num ? (
                      <p className="text-[10px] text-red-500 font-bold pl-1">{fieldErrors.student_num}</p>
                    ) : (
                      <p className="text-[10px] text-[#3E2723]/60 font-semibold pl-1">Format: 9 digits (e.g. 202314986)</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#3E2723] opacity-80 uppercase tracking-wide">Enrollment Status</label>
                    <select 
                      required
                      value={enrollmentStatus}
                      onChange={(e) => setEnrollmentStatus(e.target.value)}
                      className="w-full bg-white border-[3px] border-[#3E2723]/10 focus:border-[#7EB647] text-[#3E2723] rounded-xl px-4 py-2 font-semibold outline-none transition-colors"
                    >
                      <option value="enrolled">Enrolled</option>
                      <option value="loa">LOA</option>
                      <option value="awol">AWOL</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#3E2723] opacity-80 uppercase tracking-wide">College</label>
                    <select 
                      required
                      value={college}
                      onChange={(e) => {
                        setCollege(e.target.value);
                        setDegreeProgram('');
                        setCustomDegree('');
                      }}
                      className="w-full bg-white border-[3px] border-[#3E2723]/10 focus:border-[#7EB647] text-[#3E2723] rounded-xl px-4 py-2 font-semibold outline-none transition-colors"
                    >
                      <option value="" disabled>Select College</option>
                      <option value="CAS">CAS</option>
                      <option value="CEAT">CEAT</option>
                      <option value="CAFS">CAFS</option>
                      <option value="CVM">CVM</option>
                      <option value="CDC">CDC</option>
                      <option value="CEM">CEM</option>
                      <option value="CHE">CHE</option>
                      <option value="CFNR">CFNR</option>
                      <option value="SESAM">SESAM</option>
                      <option value="CPAf">CPAf</option>
                      <option value="Others">Others</option>
                    </select>
                    {college === "Others" && (
                      <input 
                        type="text" 
                        required
                        value={customCollege}
                        onChange={(e) => setCustomCollege(e.target.value)}
                        className="w-full bg-white border-[3px] border-[#3E2723]/10 focus:border-[#7EB647] text-[#3E2723] rounded-xl px-4 py-2 font-semibold outline-none transition-colors mt-2"
                        placeholder="Please specify your college"
                      />
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#3E2723] opacity-80 uppercase tracking-wide">Degree Program</label>
                    {(college === 'Others' || !college) ? (
                      <input 
                        type="text" 
                        required
                        value={customDegree}
                        onChange={(e) => {
                          setDegreeProgram('Others');
                          setCustomDegree(e.target.value);
                        }}
                        className="w-full bg-white border-[3px] border-[#3E2723]/10 focus:border-[#7EB647] text-[#3E2723] rounded-xl px-4 py-2 font-semibold outline-none transition-colors"
                        placeholder="Enter specific degree program"
                      />
                    ) : (
                      <>
                        <select 
                          required
                          value={degreeProgram}
                          onChange={(e) => setDegreeProgram(e.target.value)}
                          className="w-full bg-white border-[3px] border-[#3E2723]/10 focus:border-[#7EB647] text-[#3E2723] rounded-xl px-4 py-2 font-semibold outline-none transition-colors"
                        >
                          <option value="" disabled>Select Degree</option>
                          {collegeDegreeMap[college]?.map(deg => (
                            <option key={deg} value={deg}>{deg}</option>
                          ))}
                          <option value="Others">Others</option>
                        </select>
                        {degreeProgram === "Others" && (
                          <input 
                            type="text" 
                            required
                            value={customDegree}
                            onChange={(e) => setCustomDegree(e.target.value)}
                            className="w-full bg-white border-[3px] border-[#3E2723]/10 focus:border-[#7EB647] text-[#3E2723] rounded-xl px-4 py-2 font-semibold outline-none transition-colors mt-2"
                            placeholder="Please specify your degree"
                          />
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {user.role === 'guest' && (
              <div className="space-y-4">
                <h3 className="uppercase tracking-widest text-xs font-black text-[#7EB647] flex items-center gap-2">
                  Guest Records <div className="h-[2px] w-full bg-[#7EB647]/30 rounded-full" />
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#3E2723] opacity-80 uppercase tracking-wide">Valid ID</label>
                    <select 
                      required
                      value={validId}
                      onChange={(e) => {
                        setValidId(e.target.value);
                        if (e.target.value !== "Others") setCustomValidId('');
                      }}
                      className="w-full bg-white border-[3px] border-[#3E2723]/10 focus:border-[#7EB647] text-[#3E2723] rounded-xl px-4 py-2 font-semibold outline-none transition-colors"
                    >
                      <option value="" disabled>Select Valid ID</option>
                      {validIdsList.map(id => (
                        <option key={id} value={id}>{id}</option>
                      ))}
                      <option value="Others">Others</option>
                    </select>
                    {validId === "Others" && (
                      <input 
                        type="text" 
                        required
                        value={customValidId}
                        onChange={(e) => setCustomValidId(e.target.value)}
                        className="w-full bg-white border-[3px] border-[#3E2723]/10 focus:border-[#7EB647] text-[#3E2723] rounded-xl px-4 py-2 font-semibold outline-none transition-colors mt-2"
                        placeholder="Please specify your ID"
                      />
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#3E2723] opacity-80 uppercase tracking-wide">Purpose of Visit</label>
                    <input 
                      type="text" 
                      required
                      value={purposeVisit}
                      onChange={(e) => setPurposeVisit(e.target.value)}
                      className="w-full bg-white border-[3px] border-[#3E2723]/10 focus:border-[#7EB647] text-[#3E2723] rounded-xl px-4 py-2 font-semibold outline-none transition-colors"
                    placeholder="e.g. Conference"
                    />
                  </div>
                </div>
              </div>
            )}



            {user.role === 'housing_admin' && (
              <div className="space-y-4">
                <h3 className="uppercase tracking-widest text-xs font-black text-[#7EB647] flex items-center gap-2">
                  Administrative Info <div className="h-[2px] w-full bg-[#7EB647]/30 rounded-full" />
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#3E2723] opacity-80 uppercase tracking-wide">Admin ID</label>
                    <input 
                      type="text" 
                      required
                      value={adminId}
                      onChange={(e) => setAdminId(e.target.value)}
                      className="w-full bg-white border-[3px] border-[#3E2723]/10 focus:border-[#7EB647] text-[#3E2723] rounded-xl px-4 py-2 font-semibold outline-none transition-colors"
                      placeholder="e.g. ADM-99"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#3E2723] opacity-80 uppercase tracking-wide">Office Location</label>
                    <input 
                      type="text" 
                      required
                      value={officeLocation}
                      onChange={(e) => setOfficeLocation(e.target.value)}
                      className="w-full bg-white border-[3px] border-[#3E2723]/10 focus:border-[#7EB647] text-[#3E2723] rounded-xl px-4 py-2 font-semibold outline-none transition-colors"
                      placeholder="e.g. Housing Office 1"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Locked Section */}
          <div className="space-y-4 pt-4">
            <h3 className="uppercase tracking-widest text-xs font-black text-[#3E2723]/50 flex items-center gap-2">
              Locked Records <div className="h-[2px] w-full bg-[#3E2723]/10 rounded-full" />
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 opacity-70">
                <label className="text-xs font-bold text-[#3E2723] uppercase tracking-wide">Full Name</label>
                <div className="w-full bg-[#3e2723]/5 border-[3px] border-transparent text-[#3E2723]/60 rounded-xl px-4 py-2 font-semibold select-none cursor-not-allowed">
                  {user.first_name} {user.last_name}
                </div>
              </div>
              
              <div className="space-y-1 opacity-70">
                <label className="text-xs font-bold text-[#3E2723] uppercase tracking-wide">Email</label>
                <div className="w-full bg-[#3e2723]/5 border-[3px] border-transparent text-[#3E2723]/60 rounded-xl px-4 py-2 font-semibold select-none cursor-not-allowed truncate">
                  {user.email}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={() => toggleOpen(false)}
              className="px-6 py-2.5 rounded-xl font-bold bg-[#3E2723]/10 text-[#3E2723] hover:bg-[#3E2723]/20 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-8 py-2.5 rounded-xl font-bold bg-[#7EB647] text-[#F4F5E1] hover:bg-[#71A63D] transition-colors flex items-center gap-2 shadow-lg disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : "Save Changes"}
            </button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
}