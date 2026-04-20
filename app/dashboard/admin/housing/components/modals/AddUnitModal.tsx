// "use client";

// import { useState, useEffect } from "react";
// import Modal from "./Modal";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Field, FieldGroup } from "@/components/ui/field";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";

// interface Props {
//   isOpen: boolean;
//   onClose: () => void;
//   onSuccess: (unit: any) => void;
//   accommodationId: string;
// }

// const EMPTY = {
//   unit_number: "",
//   unit_type: "single",
//   max_occupancy: "1",
//   rental_fee: "0",
//   billing_period: "monthly",
//   furnishing_status: "unfurnished",
// };

// export default function AddUnitModal({
//   isOpen,
//   onClose,
//   onSuccess,
//   accommodationId,
// }: Props) {
//   const [form, setForm] = useState(() => ({ ...EMPTY }));
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     if (!isOpen) {
//       setForm({ ...EMPTY });
//       setError(null);
//     }
//   }, [isOpen]);

//   function handleChange(name: string, value: string) {
//     setForm((prev) => ({ ...prev, [name]: value }));
//   }

//   async function handleSubmit() {
//     setLoading(true);
//     setError(null);

//     try {
//       const res = await fetch("/api/admin/housing/units", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           accommodation_id: accommodationId,
//           unit_number: form.unit_number,
//           unit_type: form.unit_type,
//           max_occupancy: Number(form.max_occupancy),
//           rental_fee: Number(form.rental_fee),
//           billing_period: form.billing_period,
//           furnishing_status: form.furnishing_status,
//           is_active: true,

//         }),
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || "Failed to add unit");
//       onSuccess(data);
//       onClose();
//     } catch (err: any) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <Modal
//       isOpen={isOpen}
//       onClose={onClose}
//       title="Add Unit"
//       description="Create a new unit for this property."
//     >
//       <div className="space-y-4">
//         <Field>
//           <Label htmlFor="unit_number">Unit Number</Label>
//           <Input
//             id="unit_number"
//             value={form.unit_number}
//             onChange={(event) => handleChange("unit_number", event.target.value)}
//           />
//         </Field>

//         <FieldGroup>
//           <Field>
//             <Label htmlFor="unit_type">Unit Type</Label>
//             <Select
//               value={form.unit_type}
//               onValueChange={(value) => handleChange("unit_type", value)}
//             >
//               <SelectTrigger id="unit_type">
//                 <SelectValue placeholder="Select unit type" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="room">Room</SelectItem>
//                 <SelectItem value="bedspace">Bedspace</SelectItem>
//                 <SelectItem value="whole_unit">Whole Unit</SelectItem>
//               </SelectContent>
//             </Select>
//           </Field>

//           {/* <Field>
//             <Label htmlFor="billing_period">Billing Period</Label>
//             <Select
//               value={form.billing_period}
//               onValueChange={(value) => handleChange("billing_period", value)}
//             >
//               <SelectTrigger id="billing_period">
//                 <SelectValue placeholder="Select billing period" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="monthly">Monthly</SelectItem>
//                 <SelectItem value="weekly">Weekly</SelectItem>
//                 <SelectItem value="daily">Daily</SelectItem>
//               </SelectContent>
//             </Select>
//           </Field> */}

//         </FieldGroup>

//         <FieldGroup>
//           <Field>
//             <Label htmlFor="max_occupancy">Max Occupancy</Label>
//             <Input
//               id="max_occupancy"
//               type="number"
//               min={1}
//               value={form.max_occupancy}
//               onChange={(event) => handleChange("max_occupancy", event.target.value)}
//             />
//           </Field>
//           <Field>
//             <Label htmlFor="rental_fee">Rental Fee</Label>
//             <Input
//               id="rental_fee"
//               type="number"
//               min={0}
//               value={form.rental_fee}
//               onChange={(event) => handleChange("rental_fee", event.target.value)}
//             />
//           </Field>
//         </FieldGroup>

//         <Field>
//           <Label htmlFor="furnishing_status">Furnishing Status</Label>
//           <Select
//             value={form.furnishing_status}
//             onValueChange={(value) => handleChange("furnishing_status", value)}
//           >
//             <SelectTrigger id="furnishing_status">
//               <SelectValue placeholder="Select furnishing status" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="unfurnished">Unfurnished</SelectItem>
//               <SelectItem value="partially_furnished">Partially Furnished</SelectItem>
//               <SelectItem value="fully_furnished">Fully Furnished</SelectItem>
//             </SelectContent>
//           </Select>
//         </Field>

//         {error && <p className="text-sm text-red-500">{error}</p>}

//         <div className="flex items-center justify-end gap-2 pt-2">
//           <Button variant="secondary" onClick={onClose} disabled={loading}>
//             Cancel
//           </Button>
//           <Button onClick={handleSubmit} disabled={loading}>
//             {loading ? "Saving…" : "Add Unit"}
//           </Button>
//         </div>
//       </div>
//     </Modal>
//   );
// }
