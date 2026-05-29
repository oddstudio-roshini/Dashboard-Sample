// // types/clinics.ts — Updated with new Hospital and ClinicDoctor fields

// export interface Hospital {
//   id: number;
//   name: string;
//   area: string;
//   city: string;
//   state: string;
//   pincode: string;
//   address: string;
//   specialization: string;
//   contactName: string;
//   contactNumber: string;
//   email: string;
//   bodyPart: string;
//   status: 'ACTIVE' | 'INACTIVE';
//   establishedYear: number;
//   branchCount: number;
//   doctorCount: number;
// }

// export interface Branch {
//   id: number;
//   hospitalId: number;
//   hospitalName: string;
//   branchName: string;
//   branchCode: string;
//   address: string;
//   city: string;
//   contactPhone: string;
//   contactEmail: string;
//   managerName: string;
//   totalDoctors: number;
//   status: 'ACTIVE' | 'INACTIVE';
// }

// export interface ClinicDoctor {
//   id: number;
//   branchId: number;
//   branchName: string;
//   hospitalId: number;
//   hospitalName: string;
//   firstName: string;
//   lastName: string;
//   fullName: string;
//   specialization: string;
//   highestQualification: string;
//   registrationNumber: string;
//   experienceYears: number;
//   contactPhone: string;
//   contactEmail: string;
//   consultationFee: number;
//   availableDays: string;
//   consultationHours: string;
//   status: 'ACTIVE' | 'INACTIVE';
//   patientCount: number;
// }

// export interface ClinicPatient {
//   id: number;
//   clinicDoctorId: number;
//   doctorName: string;
//   firstName: string;
//   lastName: string;
//   fullName: string;
//   age: number;
//   gender: string;
//   contactPhone: string;
//   contactEmail: string;
//   address: string;
//   diagnosis: string;
//   appointmentDate: string;
//   appointmentStatus: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
//   visitType: string;
//   notes: string;
// }

// export interface ClinicStats {
//   totalHospitals: number;
//   totalBranches: number;
//   totalDoctors: number;
//   totalPatients: number;
// }

// export const BODY_PARTS = [
//   { label: 'Shoulder', emoji: '💪' },
//   { label: 'Neck', emoji: '🫀' },
//   { label: 'Back', emoji: '⬅️' },
//   { label: 'Ankle', emoji: '🦶' },
//   { label: 'Knee', emoji: '🦵' },
//   { label: 'Wrist', emoji: '✋' },
//   { label: 'Toes', emoji: '🦶' },
//   { label: 'Elbows', emoji: '💪' },
//   { label: 'Finger', emoji: '☝️' },
//   { label: 'Thumb', emoji: '👍' },
//   { label: 'Torso', emoji: '🫁' },
//   { label: 'Stroke/Miscellaneous', emoji: '🧠' },
// ] as const;



export interface Hospital {
  id: number;
  name: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  address: string;
  specialization: string;
  contactName: string;
  contactNumber: string;
  email: string;
  bodyPart: string;
  status: 'ACTIVE' | 'INACTIVE';
  establishedYear: number;
  latitude: number | null;
  longitude: number | null;
  branchCount: number;
  doctorCount: number;
}

export interface Branch {
  id: number;
  hospitalId: number;
  hospitalName: string;
  branchName: string;
  branchCode: string;
  address: string;
  city: string;
  contactPhone: string;
  contactEmail: string;
  managerName: string;
  totalDoctors: number;
  latitude: number | null;
  longitude: number | null;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface ClinicDoctor {
  id: number;
  branchId: number;
  branchName: string;
  hospitalId: number;
  hospitalName: string;
  firstName: string;
  lastName: string;
  fullName: string;
  specialization: string;
  highestQualification: string;
  registrationNumber: string;
  experienceYears: number;
  contactPhone: string;
  contactEmail: string;
  consultationFee: number;
  availableDays: string;
  consultationHours: string;
  status: 'ACTIVE' | 'INACTIVE';
  patientCount: number;
}

export interface ClinicPatient {
  id: number;
  clinicDoctorId: number;
  doctorName: string;
  firstName: string;
  lastName: string;
  fullName: string;
  age: number;
  gender: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  diagnosis: string;
  appointmentDate: string;
  appointmentStatus: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  visitType: string;
  notes: string;
}

export interface ClinicStats {
  totalHospitals: number;
  totalBranches: number;
  totalDoctors: number;
  totalPatients: number;
}

export interface BodyPartCount {
  bodyPart: string;
  hospitalCount: number;
  branchCount: number;
}

export const BODY_PARTS = [
  { label: 'Shoulder', emoji: '💪' },
  { label: 'Neck',     emoji: '🫀' },
  { label: 'Back',     emoji: '🧍' },
  { label: 'Ankle',    emoji: '🦶' },
  { label: 'Knee',     emoji: '🦵' },
  { label: 'Wrist',    emoji: '✋' },
  { label: 'Toes',     emoji: '🦶' },
  { label: 'Elbows',   emoji: '💪' },
  { label: 'Finger',   emoji: '☝️' },
  { label: 'Thumb',    emoji: '👍' },
  { label: 'Torso',    emoji: '🫁' },
  { label: 'Stroke',   emoji: '🧠' },
] as const;
