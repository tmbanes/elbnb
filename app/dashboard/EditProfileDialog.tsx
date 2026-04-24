"use client";

import React, { useState } from 'react';

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

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger 
} from "@/components/ui/dialog";
import { User as UserType } from '@/types/user.types';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { useRouter } from 'next/navigation';
import { Edit3, Loader2 } from 'lucide-react';

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
  const isCustomDegreeInit = initialDegree && !Object.values(collegeDegreeMap).flat().includes(initialDegree);
  const [degreeProgram, setDegreeProgram] = useState(isCustomDegreeInit ? "Others" : initialDegree);
  const [customDegree, setCustomDegree] = useState(isCustomDegreeInit ? initialDegree : '');
  
  const predefinedColleges = ['CAS', 'CEAT', 'CAFS', 'CVM', 'CDC', 'CEM', 'CHE', 'CFNR', 'SESAM', 'CPAf'];
  const initialCollege = metadata?.college || '';
  const isCustomCollegeInit = initialCollege && !predefinedColleges.includes(initialCollege);
  const [college, setCollege] = useState(isCustomCollegeInit ? "Others" : initialCollege);
  const [customCollege, setCustomCollege] = useState(isCustomCollegeInit ? initialCollege : '');
  
  const [validId, setValidId] = useState(metadata?.valid_id || '');
  const [purposeVisit, setPurposeVisit] = useState(metadata?.purpose_visit || '');
  const [occupancyStatus, setOccupancyStatus] = useState(metadata?.occupancy_status || '');
  
  const [employeeId, setEmployeeId] = useState(metadata?.employee_id || '');
  const [birthdate, setBirthdate] = useState(user.birthdate || '');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (contactNum && !/^\d+$/.test(contactNum)) {
      setError("Contact number must contain only valid numbers.");
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
          valid_id: validId,
          purpose_visit: purposeVisit,
          occupancy_status: occupancyStatus,
          employee_id: employeeId,
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#3E2723] opacity-80 uppercase tracking-wide">Contact Number</label>
                <input 
                  type="tel" 
                  required
                  maxLength={11}
                  value={contactNum}
                  onChange={(e) => setContactNum(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full bg-white border-[3px] border-[#3E2723]/10 focus:border-[#7EB647] text-[#3E2723] rounded-xl px-4 py-2 font-semibold outline-none transition-colors"
                  placeholder="e.g. 09123456789"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#3E2723] opacity-80 uppercase tracking-wide">Emergency Contact</label>
                <input 
                  type="text" 
                  required
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full bg-white border-[3px] border-[#3E2723]/10 focus:border-[#7EB647] text-[#3E2723] rounded-xl px-4 py-2 font-semibold outline-none transition-colors"
                  placeholder="e.g. 09123456789 or Name"
                />
              </div>
            </div>
            
            {user.role === 'student' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3E2723] opacity-80 uppercase tracking-wide">Student Number</label>
                  <input 
                    type="text" 
                    required
                    value={studentNum}
                    onChange={(e) => setStudentNum(e.target.value)}
                    className="w-full bg-white border-[3px] border-[#3E2723]/10 focus:border-[#7EB647] text-[#3E2723] rounded-xl px-4 py-2 font-semibold outline-none transition-colors"
                    placeholder="e.g. 202X-XXXXX"
                  />
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
              </div>
            )}

            {user.role === 'guest' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3E2723] opacity-80 uppercase tracking-wide">Valid ID</label>
                  <input 
                    type="text" 
                    required
                    value={validId}
                    onChange={(e) => setValidId(e.target.value)}
                    className="w-full bg-white border-[3px] border-[#3E2723]/10 focus:border-[#7EB647] text-[#3E2723] rounded-xl px-4 py-2 font-semibold outline-none transition-colors"
                    placeholder="e.g. Passport / License"
                  />
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
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#3E2723] opacity-80 uppercase tracking-wide">Occupancy Status</label>
                  <input 
                    type="text" 
                    required
                    value={occupancyStatus}
                    onChange={(e) => setOccupancyStatus(e.target.value)}
                    className="w-full bg-white border-[3px] border-[#3E2723]/10 focus:border-[#7EB647] text-[#3E2723] rounded-xl px-4 py-2 font-semibold outline-none transition-colors"
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
                    className="w-full bg-white border-[3px] border-[#3E2723]/10 focus:border-[#7EB647] text-[#3E2723] rounded-xl px-4 py-2 font-semibold outline-none transition-colors"
                    placeholder="e.g. EMP-12345"
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
                  className="w-full bg-white border-[3px] border-[#3E2723]/10 focus:border-[#7EB647] text-[#3E2723] rounded-xl px-4 py-2 font-semibold outline-none transition-colors resize-y"
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
                  className="w-full bg-white border-[3px] border-[#3E2723]/10 focus:border-[#7EB647] text-[#3E2723] rounded-xl px-4 py-2 font-semibold outline-none transition-colors"
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
