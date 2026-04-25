import React from 'react';
import { Calendar, MapPin, Home, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { SubheaderMd, SubheaderSm, BodyMd, BodySm } from '@/app/typography';

interface PastAccommodationCardProps {
  name: string;
  unit: string;
  location: string;
  startDate: string;
  endDate: string;
  status: string;
}

export function PastAccommodationCard({
  name,
  unit,
  location,
  startDate,
  endDate,
  status
}: PastAccommodationCardProps) {
  
  const getStatusIcon = (s: string) => {
    switch (s.toLowerCase()) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'terminated':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-amber-600" />;
    }
  };

  const getStatusColor = (s: string) => {
    switch (s.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'terminated': return 'bg-red-100 text-red-700 border-red-200';
      case 'cancelled': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="bg-white/60 backdrop-blur-sm border border-[#7EB647]/20 rounded-2xl p-5 mb-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#7EB647]/10 rounded-xl">
            <Home className="w-5 h-5 text-[#7EB647]" />
          </div>
          <div>
            <h4 className={`${SubheaderMd} text-[#3E2723]`}>{name}</h4>
            <p className={`${BodySm} opacity-60 flex items-center gap-1`}>
              <MapPin className="w-3 h-3" /> {location}
            </p>
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${getStatusColor(status)}`}>
          {getStatusIcon(status)}
          {status}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className={`${SubheaderSm} opacity-40 uppercase tracking-wider`}>Unit</p>
          <p className={`${BodyMd} font-bold`}>{unit}</p>
        </div>
        <div className="space-y-1">
          <p className={`${SubheaderSm} opacity-40 uppercase tracking-wider`}>Duration</p>
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3 opacity-40" />
            <p className={`${BodySm} font-medium`}>{startDate} - {endDate}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
