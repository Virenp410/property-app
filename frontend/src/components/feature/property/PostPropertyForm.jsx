"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronRight, MapPin, DollarSign, Building, Phone, Home, UploadCloud } from "lucide-react";
import useSubmitProperty from "@/hooks/useSubmitProperty";

// Initial empty state mapping to the backend schema conceptualization
const INITIAL_STATE = {
  basicInfo: {
    title: "",
    listing_type: 1, // 1 Rent, 2 Sale
    category: "residential",
    propertyName: "",
    description: "",
  },
  location: {
    addressLine1: "",
    city: "",
    state: "Gujarat",
    areaName: "",
    pincode: "",
  },
  transaction_details: {
    monthlyRent: "",
    securityDeposit: "",
    maintenanceCharges: "",
    totalPrice: "",
    ownership: "Freehold",
  },
  categoryDetails: {
    // Residential overlaps
    carpetArea: "", areaSqft: "", bedrooms: "", bathrooms: "", balconies: "",
    floorNo: "", totalFloors: "", furnishing: "Unfurnished", facing: "North",
    parkingType: "None", age: "New Construction", possession: "Ready to Move",
    isGated: false,
    
    // Commercial overlaps
    superArea: "", washrooms: "", lifts: "", parkingSpaces: "", lockInPeriod: "",
    buildingClass: "Grade A", pantry: false, powerBackup: false, fireSafety: false,
    
    // Plot overlaps
    plotLength: "", plotBreadth: "", roadWidth: "", roadWidthUnit: "Feet",
    openSides: "1", cornerPlot: false, boundaryWall: false,
    
    // Hospitality overlaps
    totalArea: "", rooms: "", starRating: "3", operatingSince: "", banquetCapacity: "",
    isOperating: false, restaurant: false, liquor: false, pool: false,
  },
  mediaContact: {
    name: "", phone: "", email: "", amenities: [], imageUrl: ""
  }
};

const STEPS = [
  { id: 1, title: "Basic Info", icon: Home },
  { id: 2, title: "Location", icon: MapPin },
  { id: 3, title: "Transaction", icon: DollarSign },
  { id: 4, title: "Details", icon: Building },
  { id: 5, title: "Contact", icon: Phone },
];

export default function PostPropertyForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [imageFiles, setImageFiles] = useState([]);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const pushToast = (type, message) => {
    setToast({ type, message });
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 4500);
  };

  const { isSubmitting, submitProperty } = useSubmitProperty({
    toast: ({ type, message }) => pushToast(type, message),
  });

  useEffect(() => {
    return () => window.clearTimeout(toastTimerRef.current);
  }, []);

  const handleUpdate = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 5));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const buildLocationPayload = (location) => ({
    address_line_1: String(location?.addressLine1 || "").trim(),
    city: String(location?.city || "").trim(),
    state: String(location?.state || "").trim(),
    area: String(location?.areaName || "").trim(),
    pincode: String(location?.pincode || "").trim(),
  });

  const buildTransactionPayload = (transaction, listingType) => {
    const isRent = Number(listingType) === 1;
    if (isRent) {
      return {
        monthly_rent: String(transaction?.monthlyRent || "").trim(),
        security_deposit: String(transaction?.securityDeposit || "").trim(),
        maintenance_charges: String(transaction?.maintenanceCharges || "").trim(),
      };
    }

    return {
      total_price: String(transaction?.totalPrice || "").trim(),
      maintenance_charges: String(transaction?.maintenanceCharges || "").trim(),
      ownership: String(transaction?.ownership || "").trim(),
    };
  };

  const pickPrimitiveDetails = (details) => {
    const obj = details && typeof details === "object" ? details : {};

    const KEY_MAP = {
      areaSqft: "area_sqft",
      carpetArea: "carpet_area",
      floorNo: "floor_no",
      totalFloors: "total_floors",
      parkingType: "parking_type",
      isGated: "is_gated_community",
      age: "property_age",
      possession: "possession_status",
    };

    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined || value === null) continue;
      const t = typeof value;
      if (t !== "string" && t !== "number" && t !== "boolean") continue;

      const mappedKey = KEY_MAP[key] || key;
      result[mappedKey] = value;
    }
    return result;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (isSubmitting) return;

    const basic = formData.basicInfo || {};
    const location = formData.location || {};
    const transaction = formData.transaction_details || {};
    const details = formData.categoryDetails || {};
    const contact = formData.mediaContact || {};

    try {
      await submitProperty({
        property_title: String(basic.title || "").trim(),
        category: String(basic.category || "").trim(),
        listing_type: Number(basic.listing_type || 1),
        type_name: String(basic.propertyName || "").trim(),
        description: String(basic.description || "").trim(),

        contact_name: String(contact.name || "").trim(),
        contact_phone: String(contact.phone || "").trim(),
        contact_email: String(contact.email || "").trim(),

        ...pickPrimitiveDetails(details),

        location: buildLocationPayload(location),
        transaction_details: buildTransactionPayload(transaction, basic.listing_type),
        amenities: Array.isArray(contact.amenities) ? contact.amenities : [],

        images: imageFiles,
      });

      setFormData(INITIAL_STATE);
      setImageFiles([]);
      setCurrentStep(1);
    } catch (err) {
      const message = String(err?.message || "").trim();
      if (message) pushToast("error", message);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-[20px] border border-[#eef0f4] bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
       {toast ? (
         <div className="border-b border-[#eef0f4] bg-white px-6 py-4 lg:px-10">
           <div
             className={`rounded-xl border px-4 py-3 text-sm shadow-sm ${
               toast.type === "success"
                 ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                 : toast.type === "error"
                 ? "border-rose-200 bg-rose-50 text-rose-900"
                 : "border-slate-200 bg-slate-50 text-slate-900"
             }`}
           >
             {toast.message}
           </div>
         </div>
       ) : null}
	       {/* Stepper Header */}
	       <div className="border-b border-[#eef0f4] bg-[#fdfdfd] p-6 lg:px-10">
          <div className="relative flex items-center justify-between">
            {/* Connecting Line */}
            <div className="absolute left-[10%] right-[10%] top-5 h-[2px] -translate-y-1/2 bg-[#e2e8f0]" />
            <div 
              className="absolute left-[10%] top-5 h-[2px] -translate-y-1/2 bg-[#C9A24D] transition-all duration-500" 
              style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 80}%` }} 
            />

            {STEPS.map((s) => {
              const Icon = s.icon;
              const isActive = currentStep === s.id;
              const isPast = currentStep > s.id;
              return (
                <div key={s.id} className="relative z-10 flex flex-col items-center gap-2 bg-[#fdfdfd] px-2 text-center w-20">
                  <div className={`grid h-10 w-10 place-items-center rounded-full border-2 transition-all duration-300 ${
                    isActive ? "border-[#C9A24D] bg-[#C9A24D] text-white shadow-[0_4px_12px_rgba(201,162,77,0.3)] scale-110" : 
                    isPast ? "border-[#C9A24D] bg-[#FBF6EA] text-[#C9A24D]" : "border-[#e2e8f0] bg-white text-[#cbd5e1]"
                  }`}>
                    {isPast ? <Check size={18} strokeWidth={3} /> : <Icon size={18} />}
                  </div>
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${isActive || isPast ? "text-[#334155]" : "text-[#94a3b8]"}`}>{s.title}</span>
                </div>
              );
            })}
          </div>
       </div>
       
		       <form id="post-property-form" onSubmit={handleSubmit} className="p-6 lg:p-10 min-h-[450px] bg-white">
	         {currentStep === 1 && <Step1BasicInfo data={formData.basicInfo} update={(f, v) => handleUpdate('basicInfo', f, v)} />}
	         {currentStep === 2 && <Step2Location data={formData.location} update={(f, v) => handleUpdate('location', f, v)} />}
	         {currentStep === 3 && <Step3Transaction data={formData.transaction_details} listingType={formData.basicInfo.listing_type} update={(f, v) => handleUpdate('transaction_details', f, v)} />}
	         {currentStep === 4 && <Step4CategoryDetails data={formData.categoryDetails} category={formData.basicInfo.category} update={(f, v) => handleUpdate('categoryDetails', f, v)} />}
	         {currentStep === 5 && (
             <Step5ContactMedia
               data={formData.mediaContact}
               update={(f, v) => handleUpdate('mediaContact', f, v)}
               files={imageFiles}
               setFiles={setImageFiles}
               disabled={isSubmitting}
             />
           )}
	       </form>
       
	       <div className="flex items-center justify-between border-t border-[#eef0f4] bg-[#f9fafc] p-6 lg:px-10">
	         <button 
	           type="button" 
	           onClick={prevStep} 
	           disabled={currentStep === 1 || isSubmitting} 
	           className="rounded-xl border border-[#cbd5e1] bg-white px-6 py-2.5 text-sm font-semibold text-[#475569] shadow-sm transition hover:bg-[#f1f5f9] disabled:cursor-not-allowed disabled:opacity-40"
	         >
	           Back
	         </button>
	         {currentStep < 5 ? (
	           <button 
	             type="button" 
	             onClick={nextStep} 
	             disabled={isSubmitting}
	             className="flex items-center gap-2 rounded-xl bg-[#0f172a] px-8 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#1e293b] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
	           >
	             Continue <ChevronRight size={16} />
	           </button>
		         ) : (
		           <button 
		             type="button"
		             onClick={handleSubmit}
		             disabled={isSubmitting}
		             className="flex items-center gap-2 rounded-xl bg-[#C9A24D] px-8 py-2.5 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(201,162,77,0.3)] transition hover:-translate-y-0.5 hover:bg-[#B58A3A] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
		           >
		             <Check size={16} /> {isSubmitting ? "Submitting..." : "Submit Property"}
		           </button>
		         )}
	       </div>
	    </div>
  );
}

/* =====================================================================
   STEP 1: BASIC INFORMATION
   ===================================================================== */
function Step1BasicInfo({ data, update }) {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#0f172a]">Basic Information</h2>
        <p className="mt-1 text-sm text-[#64748b]">Provide the core details of the property you are listing.</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#1e293b]">Property Title</label>
          <input 
            type="text" value={data.title} onChange={e => update('title', e.target.value)} 
            placeholder="e.g., Spacious 3BHK in Downtown"
            className="w-full rounded-xl border border-[#cbd5e1] px-4 py-3 text-sm text-[#0f172a] shadow-sm outline-none transition focus:border-[#C9A24D] focus:ring-1 focus:ring-[#C9A24D]"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#1e293b]">Listing Type</label>
            <div className="flex rounded-xl border border-[#cbd5e1] bg-[#f8fafc] p-1">
              <button type="button" onClick={() => update('listing_type', 1)} className={`w-full rounded-lg py-2 text-sm font-semibold transition ${data.listing_type === 1 ? 'bg-white text-[#C9A24D] shadow-sm' : 'text-[#64748b] hover:bg-[#f1f5f9]'}`}>Rent</button>
              <button type="button" onClick={() => update('listing_type', 2)} className={`w-full rounded-lg py-2 text-sm font-semibold transition ${data.listing_type === 2 ? 'bg-white text-[#C9A24D] shadow-sm' : 'text-[#64748b] hover:bg-[#f1f5f9]'}`}>Sale</button>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#1e293b]">Property Category</label>
            <select 
              value={data.category} onChange={e => update('category', e.target.value)}
              className="w-full rounded-xl border border-[#cbd5e1] bg-white px-4 py-3 text-sm text-[#0f172a] shadow-sm outline-none transition focus:border-[#C9A24D] focus:ring-1 focus:ring-[#C9A24D]"
            >
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="plot">Plot / Land</option>
              <option value="hospitality">Hospitality</option>
            </select>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-[#1e293b]">Property Type / Name</label>
            <input 
              type="text" value={data.propertyName} onChange={e => update('propertyName', e.target.value)} 
              placeholder="e.g., Apartment, Villa, Office Space, etc."
              className="w-full rounded-xl border border-[#cbd5e1] px-4 py-3 text-sm text-[#0f172a] shadow-sm outline-none transition focus:border-[#C9A24D] focus:ring-1 focus:ring-[#C9A24D]"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#1e293b]">Description</label>
          <textarea 
            rows="4" value={data.description} onChange={e => update('description', e.target.value)}
            placeholder="Highlight the key features and selling points..."
            className="w-full resize-none rounded-xl border border-[#cbd5e1] px-4 py-3 text-sm text-[#0f172a] shadow-sm outline-none transition focus:border-[#C9A24D] focus:ring-1 focus:ring-[#C9A24D]"
          />
        </div>
      </div>
    </div>
  );
}

/* =====================================================================
   STEP 2: LOCATION DETAILS
   ===================================================================== */
function Step2Location({ data, update }) {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#0f172a]">Location Details</h2>
        <p className="mt-1 text-sm text-[#64748b]">Where is this property located?</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[#1e293b]">Address Line 1</label>
          <input 
            type="text" value={data.addressLine1} onChange={e => update('addressLine1', e.target.value)}
            placeholder="House/Plot number, Street name"
            className="w-full rounded-xl border border-[#cbd5e1] px-4 py-3 text-sm text-[#0f172a] shadow-sm outline-none transition focus:border-[#C9A24D] focus:ring-1 focus:ring-[#C9A24D]"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#1e293b]">City</label>
            <input 
              type="text" value={data.city} onChange={e => update('city', e.target.value)}
              className="w-full rounded-xl border border-[#cbd5e1] px-4 py-3 text-sm text-[#0f172a] shadow-sm outline-none transition focus:border-[#C9A24D] focus:ring-1 focus:ring-[#C9A24D]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#1e293b]">State</label>
            <input 
              type="text" value={data.state} onChange={e => update('state', e.target.value)}
              className="w-full rounded-xl border border-[#cbd5e1] px-4 py-3 text-sm text-[#0f172a] shadow-sm outline-none transition focus:border-[#C9A24D] focus:ring-1 focus:ring-[#C9A24D]"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#1e293b]">Area Name / Locality</label>
            <input 
              type="text" value={data.areaName} onChange={e => update('areaName', e.target.value)}
              className="w-full rounded-xl border border-[#cbd5e1] px-4 py-3 text-sm text-[#0f172a] shadow-sm outline-none transition focus:border-[#C9A24D] focus:ring-1 focus:ring-[#C9A24D]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#1e293b]">Pincode</label>
            <input 
              type="number" value={data.pincode} onChange={e => update('pincode', e.target.value)}
              className="w-full rounded-xl border border-[#cbd5e1] px-4 py-3 text-sm text-[#0f172a] shadow-sm outline-none transition focus:border-[#C9A24D] focus:ring-1 focus:ring-[#C9A24D]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* =====================================================================
   STEP 3: TRANSACTION DETAILS
   ===================================================================== */
function Step3Transaction({ data, listingType, update }) {
  const isRent = listingType === 1;

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#0f172a]">Transaction Details</h2>
        <p className="mt-1 text-sm text-[#64748b]">Configure your pricing for {isRent ? "Rent" : "Sale"}.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {isRent ? (
          <>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#1e293b]">Monthly Rent (₹)</label>
              <input type="number" value={data.monthlyRent} onChange={e => update('monthlyRent', e.target.value)} className="w-full rounded-xl border border-[#cbd5e1] px-4 py-3 text-sm text-[#0f172a] shadow-sm outline-none transition focus:border-[#C9A24D] focus:ring-1 focus:ring-[#C9A24D]" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#1e293b]">Security Deposit (₹)</label>
              <input type="number" value={data.securityDeposit} onChange={e => update('securityDeposit', e.target.value)} className="w-full rounded-xl border border-[#cbd5e1] px-4 py-3 text-sm text-[#0f172a] shadow-sm outline-none transition focus:border-[#C9A24D] focus:ring-1 focus:ring-[#C9A24D]" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#1e293b]">Maintenance Charges (Per Month) (₹)</label>
              <input type="number" value={data.maintenanceCharges} onChange={e => update('maintenanceCharges', e.target.value)} className="w-full rounded-xl border border-[#cbd5e1] px-4 py-3 text-sm text-[#0f172a] shadow-sm outline-none transition focus:border-[#C9A24D] focus:ring-1 focus:ring-[#C9A24D]" />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#1e293b]">Total Expected Price (₹)</label>
              <input type="number" value={data.totalPrice} onChange={e => update('totalPrice', e.target.value)} className="w-full rounded-xl border border-[#cbd5e1] px-4 py-3 text-sm text-[#0f172a] shadow-sm outline-none transition focus:border-[#C9A24D] focus:ring-1 focus:ring-[#C9A24D]" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#1e293b]">Maintenance Charges (₹)</label>
              <input type="number" value={data.maintenanceCharges} onChange={e => update('maintenanceCharges', e.target.value)} className="w-full rounded-xl border border-[#cbd5e1] px-4 py-3 text-sm text-[#0f172a] shadow-sm outline-none transition focus:border-[#C9A24D] focus:ring-1 focus:ring-[#C9A24D]" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-[#1e293b]">Ownership Type</label>
              <select value={data.ownership} onChange={e => update('ownership', e.target.value)} className="w-full rounded-xl border border-[#cbd5e1] bg-white px-4 py-3 text-sm text-[#0f172a] shadow-sm outline-none transition focus:border-[#C9A24D] focus:ring-1 focus:ring-[#C9A24D]">
                {['Freehold', 'Leasehold', 'Co-operative Society', 'Power of Attorney'].map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DetailsSwitchToggle({ label, checked, onToggle }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4 shadow-sm">
      <span className="text-sm font-semibold text-[#334155]">{label}</span>
      <button
        type="button"
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-[#C9A24D]' : 'bg-[#cbd5e1]'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
        />
      </button>
    </div>
  );
}

function DetailsInputField({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase text-[#64748b]">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-[#cbd5e1] px-3 py-2.5 text-sm text-[#0f172a] shadow-sm outline-none transition focus:border-[#C9A24D] focus:ring-1 focus:ring-[#C9A24D]"
      />
    </div>
  );
}

function DetailsSelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase text-[#64748b]">{label}</label>
      <select
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-[#cbd5e1] bg-white px-3 py-2.5 text-sm text-[#0f172a] shadow-sm outline-none transition focus:border-[#C9A24D] focus:ring-1 focus:ring-[#C9A24D]"
      >
        {options.map((o) => (
          <option key={o.value || o} value={o.value || o}>
            {o.label || o}
          </option>
        ))}
      </select>
    </div>
  );
}

/* =====================================================================
   STEP 4: CATEGORY SPECIFIC DETAILS
   ===================================================================== */
function Step4CategoryDetails({ data, category, update }) {
  const facingOptions = ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West'];

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
      <div>
        <h2 className="text-xl font-bold capitalize text-[#0f172a]">{category} Details</h2>
        <p className="mt-1 text-sm text-[#64748b]">Attributes specific to {category} properties.</p>
      </div>

	      {category === 'residential' && (
	        <div className="space-y-6">
	          <div className="grid gap-4 sm:grid-cols-2">
	            <DetailsInputField label="Carpet Area (sqft)" value={data.carpetArea} onChange={e => update('carpetArea', e.target.value)} type="number" />
	            <DetailsInputField label="Super Built-up Area (sqft)" value={data.areaSqft} onChange={e => update('areaSqft', e.target.value)} type="number" />
	            <DetailsInputField label="Bedrooms" value={data.bedrooms} onChange={e => update('bedrooms', e.target.value)} type="number" />
	            <DetailsInputField label="Bathrooms" value={data.bathrooms} onChange={e => update('bathrooms', e.target.value)} type="number" />
	            <DetailsInputField label="Balconies" value={data.balconies} onChange={e => update('balconies', e.target.value)} type="number" />
	            <div className="grid grid-cols-2 gap-2">
	              <DetailsInputField label="Floor No" value={data.floorNo} onChange={e => update('floorNo', e.target.value)} type="number" />
	              <DetailsInputField label="Total Floors" value={data.totalFloors} onChange={e => update('totalFloors', e.target.value)} type="number" />
	            </div>
	            <DetailsSelectField label="Furnishing" value={data.furnishing} onChange={e => update('furnishing', e.target.value)} options={['Unfurnished', 'Semi-Furnished', 'Fully Furnished']} />
	            <DetailsSelectField label="Facing" value={data.facing} onChange={e => update('facing', e.target.value)} options={facingOptions} />
	            <DetailsSelectField label="Parking Type" value={data.parkingType} onChange={e => update('parkingType', e.target.value)} options={['None', 'Open', 'Covered']} />
	            <DetailsSelectField label="Property Age" value={data.age} onChange={e => update('age', e.target.value)} options={['New Construction', '1 to 5 Years', '5 to 10 Years', '10+ Years']} />
	            <DetailsSelectField label="Possession Status" value={data.possession} onChange={e => update('possession', e.target.value)} options={['Ready to Move', 'Under Construction']} />
	          </div>
	          <div className="grid sm:grid-cols-2 gap-4">
              <DetailsSwitchToggle label="Gated Community" checked={!!data.isGated} onToggle={() => update('isGated', !data.isGated)} />
            </div>
	        </div>
	      )}

	      {category === 'commercial' && (
	        <div className="space-y-6">
	          <div className="grid gap-4 sm:grid-cols-2">
	            <DetailsInputField label="Carpet Area (sqft)" value={data.carpetArea} onChange={e => update('carpetArea', e.target.value)} type="number" />
	            <DetailsInputField label="Super Area (sqft)" value={data.superArea} onChange={e => update('superArea', e.target.value)} type="number" />
	            <DetailsInputField label="Floor No" value={data.floorNo} onChange={e => update('floorNo', e.target.value)} type="number" />
	            <DetailsInputField label="Total Floors" value={data.totalFloors} onChange={e => update('totalFloors', e.target.value)} type="number" />
	            <DetailsInputField label="Washrooms (0 for common)" value={data.washrooms} onChange={e => update('washrooms', e.target.value)} type="number" />
	            <DetailsInputField label="Lifts Count" value={data.lifts} onChange={e => update('lifts', e.target.value)} type="number" />
	            <DetailsSelectField label="Furnishing" value={data.furnishing} onChange={e => update('furnishing', e.target.value)} options={[{value:1,label:'Bare Shell'}, {value:2,label:'Warm Shell'}, {value:3,label:'Fully Furnished'}]} />
	            <DetailsInputField label="Parking Spaces" value={data.parkingSpaces} onChange={e => update('parkingSpaces', e.target.value)} type="number" />
	            <DetailsInputField label="Lock-in Period (Months)" value={data.lockInPeriod} onChange={e => update('lockInPeriod', e.target.value)} type="number" />
	            <DetailsSelectField label="Building Class" value={data.buildingClass} onChange={e => update('buildingClass', e.target.value)} options={['Grade A', 'Grade B', 'Grade C']} />
	          </div>
	          <div className="grid gap-4 sm:grid-cols-3">
	            <DetailsSwitchToggle label="Pantry Available" checked={!!data.pantry} onToggle={() => update('pantry', !data.pantry)} />
	            <DetailsSwitchToggle label="Power Backup" checked={!!data.powerBackup} onToggle={() => update('powerBackup', !data.powerBackup)} />
	            <DetailsSwitchToggle label="Fire Safety" checked={!!data.fireSafety} onToggle={() => update('fireSafety', !data.fireSafety)} />
	          </div>
	        </div>
	      )}

	      {category === 'plot' && (
	        <div className="space-y-6">
	          <div className="grid gap-4 sm:grid-cols-2">
	            <DetailsInputField label="Area / Dimensions (sqft)" value={data.areaSqft} onChange={e => update('areaSqft', e.target.value)} type="number" />
	            <div className="grid grid-cols-2 gap-2">
	              <DetailsInputField label="Length" value={data.plotLength} onChange={e => update('plotLength', e.target.value)} type="number" />
	              <DetailsInputField label="Breadth" value={data.plotBreadth} onChange={e => update('plotBreadth', e.target.value)} type="number" />
	            </div>
	            <DetailsSelectField label="Facing" value={data.facing} onChange={e => update('facing', e.target.value)} options={facingOptions} />
	            <div className="grid grid-cols-2 gap-2">
	               <DetailsInputField label="Road Width" value={data.roadWidth} onChange={e => update('roadWidth', e.target.value)} type="number" />
	               <DetailsSelectField label="Unit" value={data.roadWidthUnit} onChange={e => update('roadWidthUnit', e.target.value)} options={['Feet', 'Meters']} />
	            </div>
	            <DetailsSelectField label="Open Sides" value={data.openSides} onChange={e => update('openSides', e.target.value)} options={['1', '2', '3', '4']} />
	            <DetailsSelectField label="Possession Status" value={data.possession} onChange={e => update('possession', e.target.value)} options={['Immediate', 'Future']} />
	          </div>
	          <div className="grid gap-4 sm:grid-cols-3">
	            <DetailsSwitchToggle label="Corner Plot" checked={!!data.cornerPlot} onToggle={() => update('cornerPlot', !data.cornerPlot)} />
	            <DetailsSwitchToggle label="Boundary Wall" checked={!!data.boundaryWall} onToggle={() => update('boundaryWall', !data.boundaryWall)} />
	            <DetailsSwitchToggle label="Gated Community" checked={!!data.isGated} onToggle={() => update('isGated', !data.isGated)} />
	          </div>
	        </div>
	      )}

	      {category === 'hospitality' && (
	        <div className="space-y-6">
	          <div className="grid gap-4 sm:grid-cols-2">
	            <DetailsInputField label="Total Area (sqft)" value={data.totalArea} onChange={e => update('totalArea', e.target.value)} type="number" />
	            <DetailsInputField label="Number of Rooms" value={data.rooms} onChange={e => update('rooms', e.target.value)} type="number" />
	            <DetailsInputField label="Total Floors" value={data.totalFloors} onChange={e => update('totalFloors', e.target.value)} type="number" />
	            <DetailsSelectField label="Star Rating" value={data.starRating} onChange={e => update('starRating', e.target.value)} options={['1','2','3','4','5']} />
	            <DetailsInputField label="Operating Since (Year)" value={data.operatingSince} onChange={e => update('operatingSince', e.target.value)} type="number" />
	            <DetailsInputField label="Banquet Capacity" value={data.banquetCapacity} onChange={e => update('banquetCapacity', e.target.value)} type="number" />
	            <DetailsInputField label="Parking Spaces" value={data.parkingSpaces} onChange={e => update('parkingSpaces', e.target.value)} type="number" />
	          </div>
	          <div className="grid gap-4 sm:grid-cols-3">
	            <DetailsSwitchToggle label="Is Operating" checked={!!data.isOperating} onToggle={() => update('isOperating', !data.isOperating)} />
	            <DetailsSwitchToggle label="Restaurant" checked={!!data.restaurant} onToggle={() => update('restaurant', !data.restaurant)} />
	            <DetailsSwitchToggle label="Liquor License" checked={!!data.liquor} onToggle={() => update('liquor', !data.liquor)} />
	            <DetailsSwitchToggle label="Swimming Pool" checked={!!data.pool} onToggle={() => update('pool', !data.pool)} />
	            <DetailsSwitchToggle label="Power Backup" checked={!!data.powerBackup} onToggle={() => update('powerBackup', !data.powerBackup)} />
	          </div>
	        </div>
	      )}
    </div>
  );
}

/* =====================================================================
   STEP 5: CONTACT & MEDIA
   ===================================================================== */
function Step5ContactMedia({ data, update, files = [], setFiles, disabled = false }) {
	  const amntList = ['Gym', 'Spa', 'Pool', 'Parking', 'WiFi', 'Garden', 'Clubhouse', 'Security'];
	  
	  const toggleAmenity = (amnt) => {
	    const list = data.amenities || [];
    if (list.includes(amnt)) update('amenities', list.filter(a => a !== amnt));
    else update('amenities', [...list, amnt]);
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-8">
      <div>
        <h2 className="text-xl font-bold text-[#0f172a]">Contact & Media</h2>
        <p className="mt-1 text-sm text-[#64748b]">Finalize listing images and your contact details.</p>
      </div>

      <div className="space-y-4">
         <h3 className="text-sm font-bold uppercase tracking-wider text-[#94a3b8]">Contact Information</h3>
         <div className="grid gap-4 sm:grid-cols-2">
           <div><label className="mb-1.5 block text-xs font-semibold text-[#334155]">Contact Name</label><input type="text" value={data.name} onChange={e => update('name', e.target.value)} className="w-full rounded-xl border border-[#cbd5e1] px-4 py-3 text-sm text-[#0f172a]" /></div>
           <div><label className="mb-1.5 block text-xs font-semibold text-[#334155]">Contact Phone</label><input type="text" value={data.phone} onChange={e => update('phone', e.target.value)} className="w-full rounded-xl border border-[#cbd5e1] px-4 py-3 text-sm text-[#0f172a]" /></div>
           <div className="sm:col-span-2"><label className="mb-1.5 block text-xs font-semibold text-[#334155]">Contact Email</label><input type="email" value={data.email} onChange={e => update('email', e.target.value)} className="w-full rounded-xl border border-[#cbd5e1] px-4 py-3 text-sm text-[#0f172a]" /></div>
         </div>
      </div>

      <div className="space-y-4">
         <h3 className="text-sm font-bold uppercase tracking-wider text-[#94a3b8]">Amenities Overview</h3>
         <div className="flex flex-wrap gap-2">
           {amntList.map(a => (
             <button 
               key={a} type="button" onClick={() => toggleAmenity(a)}
               className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                 data.amenities.includes(a) ? "bg-[#C9A24D] text-white shadow-md" : "border border-[#cbd5e1] bg-white text-[#64748b] hover:bg-[#f1f5f9]"
               }`}
             >
               {a}
             </button>
           ))}
         </div>
      </div>

	      <div className="space-y-4">
	         <h3 className="text-sm font-bold uppercase tracking-wider text-[#94a3b8]">Media</h3>
	         <div className="rounded-xl border-2 border-dashed border-[#cbd5e1] bg-[#f8fafc] p-8 text-center transition hover:border-[#C9A24D] hover:bg-[#fcfaf5]">
	            <UploadCloud className="mx-auto mb-2 h-10 w-10 text-[#94a3b8]" />
	            <p className="text-sm font-semibold text-[#334155]">Upload High Quality Photos</p>
	            <p className="text-xs text-[#94a3b8]">Drag and drop or click to browse</p>
              <div className="mt-4">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={disabled}
                  onChange={(e) => {
                    const next = Array.from(e.target.files || []).filter(Boolean);
                    if (typeof setFiles === "function") setFiles(next);
                  }}
                  className="w-full rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 text-sm"
                />
                {Array.isArray(files) && files.length ? (
                  <p className="mt-2 text-xs font-medium text-[#64748b]">{files.length} image(s) selected</p>
                ) : null}
              </div>
	            <div className="mt-4">
	               <label className="mb-1 block text-xs text-left font-semibold text-[#334155]">Or provide Image URL for now</label>
	               <input type="text" value={data.imageUrl} onChange={e => update('imageUrl', e.target.value)} placeholder="https://..." className="w-full rounded-lg border border-[#cbd5e1] px-3 py-2 text-sm" />
	            </div>
	         </div>
	      </div>
	    </div>
	  );
}
