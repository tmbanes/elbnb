"use client";

import React, { useState } from 'react';
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

  // Read-only specific formatting fallback
  let formattedBirthdate = '06/09/2005';
  if (user.birthdate) {
    const parts = user.birthdate.split('-');
    if (parts.length === 3) formattedBirthdate = `${parts[2]}/${parts[1]}/${parts[0]}`;
    else formattedBirthdate = user.birthdate;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const supabase = getSupabaseBrowserClient();

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          contact_number: contactNum,
          home_address: homeAddress,
          emergency_contact: emergencyContact,
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
            Update your contact and emergency information. Identity and academic records are strictly read-only.
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
                  type="text" 
                  value={contactNum}
                  onChange={(e) => setContactNum(e.target.value)}
                  className="w-full bg-white border-[3px] border-[#3E2723]/10 focus:border-[#7EB647] text-[#3E2723] rounded-xl px-4 py-2 font-semibold outline-none transition-colors"
                  placeholder="e.g. 09123456789"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#3E2723] opacity-80 uppercase tracking-wide">Emergency Contact</label>
                <input 
                  type="text" 
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full bg-white border-[3px] border-[#3E2723]/10 focus:border-[#7EB647] text-[#3E2723] rounded-xl px-4 py-2 font-semibold outline-none transition-colors"
                  placeholder="e.g. 09123456789 or Name"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#3E2723] opacity-80 uppercase tracking-wide">Home Address</label>
              <textarea 
                value={homeAddress}
                onChange={(e) => setHomeAddress(e.target.value)}
                className="w-full min-h-[80px] bg-white border-[3px] border-[#3E2723]/10 focus:border-[#7EB647] text-[#3E2723] rounded-xl px-4 py-2 font-semibold outline-none transition-colors resize-y"
                placeholder="Full address"
              />
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

              <div className="space-y-1 opacity-70">
                <label className="text-xs font-bold text-[#3E2723] uppercase tracking-wide">Student Number</label>
                <div className="w-full bg-[#3e2723]/5 border-[3px] border-transparent text-[#3E2723]/60 rounded-xl px-4 py-2 font-semibold select-none cursor-not-allowed">
                  {metadata?.student_number || 'N/A'}
                </div>
              </div>

              <div className="space-y-1 opacity-70">
                <label className="text-xs font-bold text-[#3E2723] uppercase tracking-wide">Degree Program</label>
                <div className="w-full bg-[#3e2723]/5 border-[3px] border-transparent text-[#3E2723]/60 rounded-xl px-4 py-2 font-semibold select-none cursor-not-allowed">
                  {metadata?.degree_program || 'N/A'}
                </div>
              </div>
              
              <div className="space-y-1 opacity-70">
                <label className="text-xs font-bold text-[#3E2723] uppercase tracking-wide">College</label>
                <div className="w-full bg-[#3e2723]/5 border-[3px] border-transparent text-[#3E2723]/60 rounded-xl px-4 py-2 font-semibold select-none cursor-not-allowed">
                  {metadata?.college || 'CAS'}
                </div>
              </div>

              <div className="space-y-1 opacity-70">
                <label className="text-xs font-bold text-[#3E2723] uppercase tracking-wide">Birthdate</label>
                <div className="w-full bg-[#3e2723]/5 border-[3px] border-transparent text-[#3E2723]/60 rounded-xl px-4 py-2 font-semibold select-none cursor-not-allowed">
                  {formattedBirthdate}
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
