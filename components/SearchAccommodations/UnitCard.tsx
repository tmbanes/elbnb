"use client";

import { Unit, Accommodation } from "@/types/accommodation_units";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Banknote } from "lucide-react";

interface UnitCardProps {
  unit: Unit;
  accommodation: Accommodation | undefined;
  onDetailsClick: (unit: Unit) => void;
  appliedAccommodationIds?: Set<string>;
  userRole?: string;
}

export function UnitCard({
  unit,
  accommodation,
  onDetailsClick,
  appliedAccommodationIds = new Set(),
  userRole = 'guest',
}: UnitCardProps) {
  const hasVacancy = unit.vacant_slots > 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = accommodation?.allowed_application ? new Date(accommodation.allowed_application) : null;
  if (deadline) deadline.setHours(23, 59, 59, 999);
  const isApplicationOpen = deadline ? today <= deadline : false;

  return (
    <div
      className="flex-shrink-0 w-72 min-h-[420px] rounded-2xl shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ease-out overflow-hidden group flex flex-col transform-gpu will-change-transform"
      style={{ backgroundColor: "#FDFFF4" }}
    >
      {/* Image Placeholder */}
      <div className="h-48 relative overflow-hidden flex-shrink-0 bg-gray-200">
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 group-hover:scale-105 transition-transform duration-300 ease-out">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className="mt-2 text-xs text-gray-400 font-medium">No Image Available</span>
        </div>

        {/* Vacancy Chip */}
        {isApplicationOpen && (
          <div className="absolute top-3 left-3 z-10">
            {unit.vacant_slots > 5 ? (
              <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-md border border-white/20 backdrop-blur-sm">
                Available
              </span>
            ) : unit.vacant_slots > 0 ? (
              <span className="px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full shadow-md border border-white/20 backdrop-blur-sm">
                Limited
              </span>
            ) : (
              <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-md border border-white/20 backdrop-blur-sm">
                Full
              </span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Title */}
        <h3
          className="text-2xl font-black mb-1 line-clamp-2 min-h-[4rem]"
          style={{ color: "#44291B", lineHeight: "2rem" }}
        >
          {userRole === "student" 
            ? String(unit.unit_number || '').toUpperCase()
            : (unit.unit_type === "wholeunit" ? "WHOLE UNIT" : String(unit.unit_type || '').toUpperCase())
          }
        </h3>

        {/* ACCOMMODATION NAME */}
        <div className="flex items-center gap-2 text-sm font-bold mt-1" style={{ color: "#44291B" }}>
          <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span className="truncate">{accommodation?.name || "N/A"}</span>
        </div>

        {/* LOCATION */}
        <div className="flex items-start gap-2 text-[11px] mb-3 opacity-80" style={{ color: "#44291B" }}>
          <svg className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="line-clamp-1">{accommodation?.location || "Location not set"}</span>
        </div>

        {/* Key Details */}
        <div className="flex flex-col gap-1 mb-3 flex-1 text-xs" style={{ color: "#44291B" }}>
          {userRole !== "guest" && <p>Type: <span className="font-medium">{unit.unit_type}</span></p>}
          {userRole !== "guest" && <p>Furnishing: <span className="font-medium">{unit.furnishing_status}</span></p>}
          {userRole === "guest" ? (
            <p>Units Available: <span className="font-medium">{(unit as any).available_units_count || (unit.vacant_slots > 0 ? 1 : 0)}</span></p>
          ) : (
            <p>Vacant Slots: <span className="font-medium">{unit.vacant_slots}</span></p>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center gap-1.5 mb-4">
          <Banknote className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold" style={{ color: "#264384" }}>
            {unit.rental_fee ? `₱${unit.rental_fee.toLocaleString()}` : "Price not set"}
            {unit.rental_fee && unit.billing_period ? (
              <span className="text-xs font-normal ml-1" style={{ color: "#44291B" }}>/ {unit.billing_period}</span>
            ) : null}
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-auto">
          {isApplicationOpen ? (
            hasVacancy ? (
              appliedAccommodationIds.has(unit.accommodation_id) ? (
                <button
                  disabled
                  className="w-full px-4 py-2.5 rounded-lg text-sm font-bold bg-gray-300 text-gray-500 cursor-not-allowed pointer-events-none text-center"
                >
                  Already Applied
                </button>
              ) : (
                <Link
                  href={
                    userRole === "guest"
                      ? `/guest/accommodations/application?accommodationId=${unit.accommodation_id}`
                      : `/student/accommodations/application?accommodationId=${unit.accommodation_id}&unitId=${unit.unit_id}`
                  }
                  className="w-full px-4 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm text-center text-white hover:opacity-90 active:scale-[0.98]"
                  style={{ backgroundColor: "#264384" }}
                >
                  Apply
                </Link>
              )
            ) : (
              <button
                disabled
                className="w-full px-4 py-2.5 rounded-lg text-sm font-bold bg-gray-300 text-gray-500 cursor-not-allowed pointer-events-none text-center"
              >
                Apply (Full)
              </button>
            )
          ) : (
            <button
              disabled
              className="w-full px-4 py-2.5 rounded-lg text-sm font-bold bg-gray-300 text-gray-500 cursor-not-allowed pointer-events-none text-center"
            >
              Applications Closed
            </button>
          )}
          <button
            onClick={() => onDetailsClick(unit)}
            className="w-full px-4 py-2.5 rounded-lg text-sm font-bold transition-all active:scale-[0.98] bg-transparent hover:bg-black/5"
            style={{ borderColor: "#264384", color: "#264384", borderWidth: "2px" }}
          >
            View Unit
          </button>
        </div>
      </div>
    </div>
  );
}

