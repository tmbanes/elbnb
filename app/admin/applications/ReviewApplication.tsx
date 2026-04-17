"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ReviewApplication({ applicationId, onClose }: { applicationId: string; onClose: () => void; }) {
    const data = {
        id: "0001",
        status: "Pending",
        submitted: "April 01, 2026 - 12:00 PM",

        firstName: "Juan",
        lastName: "Dela Cruz",
        middleName: "Santos",
        email: "student@up.edu.ph",
        contact: "09123456789",
        program: "BS Computer Science",
        year: "Sophomore",
        studentNum: "2022-12345",

        stay: {
            duration: "6 months",
            checkIn: "2026-04-05",
            checkOut: "2026-11-29",
            companions: "Solo",
            dorm: "Women's Dorm",
            roomType: "Solo dorm",
        },

        accommodation: {
            name: "Men's Dorm",
            unit: "Unit 203",
            roommates: 0,
        },

        documents: [
            "Valid ID",
            "Application Form",
            "Billing Statement",
        ],

        history: [
            "Application Submitted - Jan 10, 2026",
            "ID Verified - Jan 12, 2026",
        ],
    };

    return (
        <div className="p-6 space-y-6 bg-[#F6F8D5]">
            {/* HEADER */}
            <div>
              <h2 className="text-2xl font-bold">
                Application #{data.id} (Status: {data.status})
              </h2>
              <p className="text-sm text-gray-600">Submitted {data.submitted}</p>
              <Button variant="outline" onClick={onClose}>Close</Button>
            </div>

            {/* STUDENT INFO */}
            <Card className="p-4 space-y-4">
                <h3 className="font-semibold text-lg">Student Information</h3>

                <div className="flex gap-4 items-center">
                    <img
                        src="/default-avatar.png"
                        className="w-16 h-16 rounded-full object-cover"
                    />

                    <div>
                      <p className="font-semibold">
                          {data.firstName} {data.middleName} {data.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{data.studentNum}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p>{data.email}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Year Level</p>
                        <p>{data.year}</p>
                    </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Course</p>
                  <p>{data.program}</p>
                </div>
            </Card>

            {/* STAY DETAILS */}
            <Card className="p-4 space-y-4">
                <h3 className="font-semibold text-lg">Stay Details</h3>

                <p><b>Duration:</b> {data.stay.duration}</p>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Check-in</p>
                        <p>{data.stay.checkIn}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Check-out</p>
                        <p>{data.stay.checkOut}</p>
                    </div>
                </div>

                <p><b>Companions:</b> {data.stay.companions}</p>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Preferred Dorm</p>
                        <p>{data.stay.dorm}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Room Type</p>
                        <p>{data.stay.roomType}</p>
                    </div>
                </div>
            </Card>

            {/* ACCOMMODATION */}
            <Card className="p-4 space-y-2">
                <h3 className="font-semibold text-lg">Accommodation Details</h3>
                <p>
                    Name: {data.accommodation.name} &nbsp;&nbsp; | &nbsp;&nbsp;
                    Unit: {data.accommodation.unit} &nbsp;&nbsp; | &nbsp;&nbsp;
                    Roommates: {data.accommodation.roommates}
                </p>
            </Card>

            {/* DOCUMENTS */}
            <Card className="p-4 space-y-2">
                <h3 className="font-semibold text-lg">Uploaded Documents</h3>
                {data.documents.map((doc, i) => (
                    <div key={i} className="flex justify-between border p-2 rounded">
                        <span>{doc}</span>
                        <Button size="sm" variant="outline">Preview</Button>
                    </div>
                ))}
            </Card>

            {/* NOTES */}
            <Card className="p-4 space-y-2">
                <h3 className="font-semibold text-lg">Manager Notes</h3>
                <textarea
                    className="w-full border rounded p-2"
                    defaultValue="This should already be filled by the manager"
                />
                <Button size="sm">Reply</Button>
            </Card>

            {/* HISTORY */}
            <Card className="p-4 space-y-2">
                <h3 className="font-semibold text-lg">Application History</h3>
                <ul className="list-disc pl-5">
                    {data.history.map((item, i) => (
                        <li key={i}>{item}</li>
                    ))}
                </ul>
            </Card>

            {/* ACTIONS */}
            <div className="flex gap-4">
                <Button className="bg-green-600 hover:bg-green-700">Approve</Button>
                <Button className="bg-red-600 hover:bg-red-700">Reject</Button>
            </div>
        </div>
    );
}
