import { UnitAccomodationsDisplayService } from "@/services/unit_accommodation";
import { Accommodation } from "@/types/accommodation_units";
import Link from "next/link";

export default async function Page() {
  const { data: accommodations, error } =
  // JUST CHANGE THE PARAMETER TO "guest" TO FETCH GUEST ACCOMMODATIONS INSTEAD OF STUDENT
  // To review 
    await UnitAccomodationsDisplayService.listAccomodations("guest");

  if (error) {
    return <div className="p-10 text-red-500">Error: {error}</div>;
  }

  // LIMIT TO 3 ITEMS ONLY (TEMP FRONTEND PAGINATION)
  // TODO: Implement proper pagination with backend support
  const pageSize = 3;
  const page = 1; // static for now
  const start = (page - 1) * pageSize;
  const paginated = accommodations?.slice(start, start + pageSize);

  return (
    <div
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat overflow-x-hidden"
      style={{ backgroundImage: "url('/assets/textured-white-1.png')" }}
    >
      <div className="max-w-[1240px] mx-auto px-6 py-10">
        
        {/* FLEXIBLE LAYOUT */}
        <div className="flex flex-col md:flex-row gap-6 items-start">

          {/* FILTER COLUMN */}
          <div className="w-full md:w-[230px] md:min-w-[230px]">

            <div className="w-full md:w-[230px] h-full min-h-full bg-[#F2C908] border border-[#E5E7EB] rounded-[8px] p-6 shadow-[0px_1px_2px_0px_#0000000D] space-y-4 font-[Arial,sans-serif]">

              <h2 className="text-[18px] font-bold font-['Archivo',sans-serif] text-[#1F2937]">
                Filters
              </h2>

              {/* LOCATION */}
              <div className="space-y-1">
                <label className="text-[13px] text-[#44291B]">Location</label>
                <input
                  placeholder="City or Region"
                  className="w-full bg-white/80 border border-[#E5E7EB] rounded-md px-3 py-2 text-sm"
                />
              </div>

              {/* PRICE */}
              <div className="space-y-1">
                <label className="text-[13px] text-[#44291B]">
                  Price Range (per month)
                </label>
                <div className="flex gap-2">
                  <input
                    placeholder="Min"
                    className="w-full bg-white/80 border border-[#E5E7EB] rounded-md px-3 py-2 text-sm"
                  />
                  <input
                    placeholder="Max"
                    className="w-full bg-white/80 border border-[#E5E7EB] rounded-md px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* ROOM TYPE */}
              <div className="space-y-2">
                <label className="text-[13px] text-[#44291B]">Room Type</label>

                <div className="space-y-1 text-sm text-[#44291B]">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="accent-[#1F3C88]" />
                    Single Room
                  </label>

                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="accent-[#1F3C88]" />
                    Shared Room
                  </label>

                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="accent-[#1F3C88]" />
                    Entire Apartment
                  </label>
                </div>
              </div>

              {/* AVAILABILITY */}
              <div className="space-y-1">
                <label className="text-[13px] text-[#44291B]">Availability</label>
                <input
                  placeholder="mm/dd/yyyy"
                  className="w-full bg-white/80 border border-[#E5E7EB] rounded-md px-3 py-2 text-sm"
                />
              </div>

              {/* APPLY BUTTON */}
              <button className="w-full mt-2 bg-[#264384] hover:bg-[#182f6b] text-white py-2.5 rounded-md font-medium transition">
                Apply Filters
              </button>

            </div>
          </div>

          {/* ACCOMM LIST COLUMN */}
          <div className="flex-1 min-w-0 -mt-3">

            {/* TITLE + SORT */}
            <div className="flex justify-between items-start mb-2">
              <h1 className="font-archivoBlack font-black uppercase text-[40px] leading-[32px] text-[#44291B]">
                AVAILABLE <br /> ACCOMMODATIONS
              </h1>

              <div className="text-sm mt-5">
                <span className="text-[#6B7280]">Sort by:</span>&nbsp;
                <select className="bg-transparent text-[#44291B]">
                  <option>Featured</option>
                  <option>Price Low → High</option>
                  <option>Price High → Low</option>
                </select>
              </div>

            </div>

            {/* ACCOMMODATION CARDS */}
            <div className="space-y-3">
              {paginated?.map((acc: Accommodation) => (
                <div
                  key={acc.accommodation_id}
                  className="bg-[#F6F8D5] border border-[#7C6A58] rounded-2xl flex gap-1 overflow-hidden"
                >
                  {/* IMAGE SIDE */}
                  <div className="w-[200px] bg-gray-300 flex items-center justify-center text-gray-500 text-xs">
                    [Image Placeholder]
                  </div>

                  {/* CONTENT SIDE */}
                  <div className="flex-1 min-w-0 p-6">
                    <div className="flex justify-between gap-4">
                      <h2 className="font-archivo font-extrabold text-2xl uppercase text-[#44291B] truncate">
                        {acc.name}
                      </h2>

                      {/* !! ADD PROPER PRICE !! */}
                      <div className="flex flex-col items-end whitespace-nowrap">
                        <span className="font-archivo font-bold text-[#44291B] text-2xl">
                          ₱ 500
                        </span>

                        <span className="text-xs text-[#6B7280] font-sans">
                          / month
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-[#6B7280] -mt-6">
                      {acc.location}
                    </p>

                    {/* !! ADD TYPE, OCCUPANTS, AND ITS LOGO !! */}
                    <div className="flex gap-3 text-sm text-[#4B5563] mt-3">
                      <span className="px-0 py-1">Type: ---</span>
                      <span className="px-2 py-1">Occupants: ---</span>
                    </div>

                    {/* !! ADD PROPER DESCRIPTION !! */}
                    <p className="text-sm text-[#4B5563] mt-3">
                      Add the description of the accommodation here. This is a placeholder text.
                    </p>

                    <div className="flex gap-3 mt-4">
                      <button className="px-9 py-2 border border-[#7C6A58] rounded-lg text-sm text-[#44291B]">
                        View Details
                      </button>

                      <Link 
                        href="/guest/accommodation/application" 
                        className="px-8 py-2 bg-[#2B4A8B] text-white rounded-lg text-sm inline-block"
                      >
                        Apply
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CRUMB PAGINATION !! NEEDS LOGIC */}
            <div className="flex items-center justify-center gap-2 mt-6 text-sm">
              
              {/* Prev */}
              <button className="px-3 py-1 border border-[#D1D5DB] rounded text-[#1F2937]">
                &lt;
              </button>

              {/* Page Numbers (PLACEHOLDER) */}
              <button className="px-3 py-1 rounded bg-[#264384] text-white">
                1
              </button>

              <button className="px-3 py-1 rounded text-[#374151]">
                2
              </button>

              <button className="px-3 py-1 rounded text-[#374151]">
                3
              </button>

              {/* Next */}
              <button className="px-3 py-1 border border-[#D1D5DB] rounded text-[#1F2937]">
                &gt;
              </button>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}