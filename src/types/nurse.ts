export interface PatientLocation {
    latitude: number;
    longitude: number;
}

export interface Nurse {
    id: string;
    name: string;
    specialization: string;
    years_experience: number;
    price: number;
    shift: string;
    image: string;
    available: boolean;
    location: string;
    neighborhood: string;
    latitude: number;
    longitude: number;
    patient_location: PatientLocation;
}