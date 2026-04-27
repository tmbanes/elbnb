"use client";

import React, { useState } from 'react';

import { User as UserType, COLLEGE_DEGREE_MAP, COLLEGES } from '@/types/user.types';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { useRouter } from 'next/navigation';
import { Edit3, Loader2, Camera } from 'lucide-react';
import { ProfileUpload } from './ProfileUpload';

interface EditProfileDialogProps {
  user: UserType;
  metadata: any;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EditProfileDialog({ user, metadata, children, open, onOpenChange }: EditProfileDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isActuallyOpen = open !== undefined ? open : internalOpen;
  const toggleOpen = onOpenChange !== undefined ? onOpenChange : setInternalOpen;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [contactNum, setContactNum] = useState(metadata?.contact_number || '');
  const [homeAddress, setHomeAddress] = useState(metadata?.home_address || '');
  const [emergencyContact, setEmergencyContact] = useState(metadata?.emergency_contact || '');
  
  const [studentNum, setStudentNum] = useState(metadata?.student_number || '');
  
  const initialDegree = metadata?.degree_program || '';
  const isCustomDegreeInit = initialDegree && !Object.values(COLLEGE_DEGREE_MAP).flat().includes(initialDegree);
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
  const [occupancyStatus, setOccupancyStatus] = useState(metadata?.occupancy_status || '');
  
  const [employeeId, setEmployeeId] = useState(metadata?.employee_id || '');
  const [adminId, setAdminId] = useState(metadata?.admin_id || '');
  const [officeLocation, setOfficeLocation] = useState(metadata?.office_location || '');
  const [birthdate, setBirthdate] = useState(user.birthdate || '');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (contactNum && !/^\d{11}$/.test(contactNum)) {
      setError("Contact number must be exactly 11 digits.");
      return;
    }

    if (user.role === 'student' && studentNum && !/^\d{9}$/.test(studentNum)) {
      setError("Student number must be exactly 9 digits.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    const supabase = getSupabaseBrowserClient();

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          contact_number: contactNum,
          home_address: homeAddress,
          emergency_contact: emergencyContact,
          student_number: studentNum,
          degree_program: degreeProgram === "Others" ? customDegree : degreeProgram,
          college: college === "Others" ? customCollege : college,
          valid_id: validId === "Others" ? customValidId : validId,
          purpose_visit: purposeVisit,
          occupancy_status: occupancyStatus,
          employee_id: employeeId,
          admin_id: adminId,
          office_location: officeLocation,
          birthdate: birthdate,
        }
      });

      if (updateError) throw updateError;
      
      toggleOpen(false);
      router.refresh();
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
          
          {error && <div className="p-3 bg-red-100 text-red-700 rounded-xl text-sm font-bold">{error}</div>}

          {/* Editable Section */}
          <div className="space-y-4">
            <h3 className="uppercase tracking-widest text-xs font-black text-[#7EB647] flex items-center gap-2">
              Editable Details <div className="h-[2px] w-full bg-[#7EB647]/30 rounded-full" />
            </h3>

            {/* Profile Picture Section */}
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#3E2723] opacity-80 uppercase tracking-wide">Contact Number</label>
                <input 
                  type="tel" 
                  required
                  maxLength={11}
                  value={contactNum}
                  onChange={(e) => setContactNum(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full bg-[#fcf4d9] border-none text-[#2d1a12] rounded-full px-4 h-11 font-semibold outline-none shadow-sm focus:ring-2 focus:ring-[#7EB647] transition-all placeholder:text-[#2d1a12]/30"
                  placeholder="e.g. 09760799992"
                />
                <p className="text-[10px] text-[#3E2723]/60 font-semibold pl-1">Format: 11 digits (e.g. 09760799992)</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#3E2723] opacity-80 uppercase tracking-wide">Emergency Contact</label>
                <input 
                  type="text" 
                  required
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full bg-[#fcf4d9] border-none text-[#2d1a12] rounded-full px-4 h-11 font-semibold outline-none shadow-sm focus:ring-2 focus:ring-[#7EB647] transition-all placeholder:text-[#2d1a12]/30"
                  placeholder="e.g. 09123456789 or Name"
                />
              </div>
            </div>
            
            {user.role === 'student' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3E2723] opacity-80 uppercase tracking-wide">Student Number</label>
                  <input 
                    type="tel" 
                    required
                    maxLength={9}
                    value={studentNum}
                    onChange={(e) => setStudentNum(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-[#fcf4d9] border-none text-[#2d1a12] rounded-full px-4 h-11 font-semibold outline-none shadow-sm focus:ring-2 focus:ring-[#7EB647] transition-all placeholder:text-[#2d1a12]/30"
                    placeholder="e.g. 202314986"
                  />
                  <p className="text-[10px] text-[#3E2723]/60 font-semibold pl-1">Format: 9 digits (e.g. 202314986)</p>
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
                      className="w-full bg-[#fcf4d9] border-none text-[#2d1a12] rounded-full px-4 h-11 font-semibold outline-none shadow-sm focus:ring-2 focus:ring-[#7EB647] transition-all placeholder:text-[#2d1a12]/30"
                      placeholder="Enter specific degree program"
                    />
                  ) : (
                    <>
                      <Select
                        value={degreeProgram}
                        onValueChange={(value) => setDegreeProgram(value)}
                      >
                        <SelectTrigger className="w-full bg-[#fcf4d9] text-[#2d1a12] border-none rounded-full h-11 px-4 font-semibold shadow-sm focus:ring-2 focus:ring-[#7EB647]">
                          <SelectValue placeholder="Select Degree" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#fcf4d9] text-[#2d1a12] rounded-xl border-[#3E2723]/10">
                          {COLLEGE_DEGREE_MAP[college]?.map(deg => (
                            <SelectItem key={deg} value={deg}>{deg}</SelectItem>
                          ))}
                          <SelectItem value="Others">Others</SelectItem>
                        </SelectContent>
                      </Select>
                      {degreeProgram === "Others" && (
                        <input 
                          type="text" 
                          required
                          value={customDegree}
                          onChange={(e) => setCustomDegree(e.target.value)}
                          className="w-full bg-[#fcf4d9] border-none text-[#2d1a12] rounded-full px-4 h-11 font-semibold outline-none shadow-sm focus:ring-2 focus:ring-[#7EB647] transition-all placeholder:text-[#2d1a12]/30 mt-2"
                          placeholder="Please specify your degree"
                        />
                      )}
                    </>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3E2723] opacity-80 uppercase tracking-wide">College</label>
                  <Select 
                    value={college}
                    onValueChange={(value) => {
                      setCollege(value);
                      setDegreeProgram('');
                      setCustomDegree('');
                    }}
                  >
                    <SelectTrigger className="w-full bg-[#fcf4d9] text-[#2d1a12] border-none rounded-full h-11 px-4 font-semibold shadow-sm focus:ring-2 focus:ring-[#7EB647]">
                      <SelectValue placeholder="Select College" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#fcf4d9] text-[#2d1a12] rounded-xl border-[#3E2723]/10">
                      <SelectItem value="CAS">CAS</SelectItem>
                      <SelectItem value="CEAT">CEAT</SelectItem>
                      <SelectItem value="CAFS">CAFS</SelectItem>
                      <SelectItem value="CVM">CVM</SelectItem>
                      <SelectItem value="CDC">CDC</SelectItem>
                      <SelectItem value="CEM">CEM</SelectItem>
                      <SelectItem value="CHE">CHE</SelectItem>
                      <SelectItem value="CFNR">CFNR</SelectItem>
                      <SelectItem value="SESAM">SESAM</SelectItem>
                      <SelectItem value="CPAf">CPAf</SelectItem>
                      <SelectItem value="Others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                  {college === "Others" && (
                    <input 
                      type="text" 
                      required
                      value={customCollege}
                      onChange={(e) => setCustomCollege(e.target.value)}
                      className="w-full bg-[#fcf4d9] border-none text-[#2d1a12] rounded-full px-4 h-11 font-semibold outline-none shadow-sm focus:ring-2 focus:ring-[#7EB647] transition-all placeholder:text-[#2d1a12]/30 mt-2"
                      placeholder="Please specify your college"
                    />
                  )}
                </div>
              </div>
            )}

            {user.role === 'guest' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3E2723] opacity-80 uppercase tracking-wide">Valid ID</label>
                  <Select 
                    value={validId}
                    onValueChange={(value) => {
                      setValidId(value);
                      if (value !== "Others") setCustomValidId('');
                    }}
                  >
                    <SelectTrigger className="w-full bg-[#fcf4d9] text-[#2d1a12] border-none rounded-full h-11 px-4 font-semibold shadow-sm focus:ring-2 focus:ring-[#7EB647]">
                      <SelectValue placeholder="Select Valid ID" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#fcf4d9] text-[#2d1a12] rounded-xl border-[#3E2723]/10">
                      {validIdsList.map(id => (
                        <SelectItem key={id} value={id}>{id}</SelectItem>
                      ))}
                      <SelectItem value="Others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                  {validId === "Others" && (
                    <input 
                      type="text" 
                      required
                      value={customValidId}
                      onChange={(e) => setCustomValidId(e.target.value)}
                      className="w-full bg-[#fcf4d9] border-none text-[#2d1a12] rounded-full px-4 h-11 font-semibold outline-none shadow-sm focus:ring-2 focus:ring-[#7EB647] transition-all placeholder:text-[#2d1a12]/30 mt-2"
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
                    className="w-full bg-[#fcf4d9] border-none text-[#2d1a12] rounded-full px-4 h-11 font-semibold outline-none shadow-sm focus:ring-2 focus:ring-[#7EB647] transition-all placeholder:text-[#2d1a12]/30"
                  placeholder="e.g. Conference"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3E2723] opacity-80 uppercase tracking-wide">Occupancy Status</label>
                  <input 
                    type="text" 
                    required
                    value={occupancyStatus}
                    onChange={(e) => setOccupancyStatus(e.target.value)}
                    className="w-full bg-[#fcf4d9] border-none text-[#2d1a12] rounded-full px-4 h-11 font-semibold outline-none shadow-sm focus:ring-2 focus:ring-[#7EB647] transition-all placeholder:text-[#2d1a12]/30"
                  placeholder="e.g. Active"
                  />
                </div>
              </div>
            )}

            {user.role === 'dormitory_manager' && (
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3E2723] opacity-80 uppercase tracking-wide">Employee ID</label>
                  <input 
                    type="text" 
                    required
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full bg-[#fcf4d9] border-none text-[#2d1a12] rounded-full px-4 h-11 font-semibold outline-none shadow-sm focus:ring-2 focus:ring-[#7EB647] transition-all placeholder:text-[#2d1a12]/30"
                    placeholder="e.g. EMP-12345"
                  />
                </div>
              </div>
            )}

            {user.role === 'housing_admin' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3E2723] opacity-80 uppercase tracking-wide">Admin ID</label>
                  <input 
                    type="text" 
                    required
                    value={adminId}
                    onChange={(e) => setAdminId(e.target.value)}
                    className="w-full bg-[#fcf4d9] border-none text-[#2d1a12] rounded-full px-4 h-11 font-semibold outline-none shadow-sm focus:ring-2 focus:ring-[#7EB647] transition-all placeholder:text-[#2d1a12]/30"
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
                    className="w-full bg-[#fcf4d9] border-none text-[#2d1a12] rounded-full px-4 h-11 font-semibold outline-none shadow-sm focus:ring-2 focus:ring-[#7EB647] transition-all placeholder:text-[#2d1a12]/30"
                    placeholder="e.g. Housing Office 1"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#3E2723] opacity-80 uppercase tracking-wide">Home Address</label>
                <textarea 
                  required
                  value={homeAddress}
                  onChange={(e) => setHomeAddress(e.target.value)}
                  className="w-full bg-[#fcf4d9] border-none text-[#2d1a12] rounded-2xl px-4 py-3 font-semibold outline-none shadow-sm focus:ring-2 focus:ring-[#7EB647] transition-all placeholder:text-[#2d1a12]/30 resize-y"
                  placeholder="Full address"
                  rows={2}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#3E2723] opacity-80 uppercase tracking-wide">Birthdate</label>
                <input 
                  type="date" 
                  required
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                  className="w-full bg-[#fcf4d9] border-none text-[#2d1a12] rounded-full px-4 h-11 font-semibold outline-none shadow-sm focus:ring-2 focus:ring-[#7EB647] transition-all placeholder:text-[#2d1a12]/30"
                />
              </div>
            </div>
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
