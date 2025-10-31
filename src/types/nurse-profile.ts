export interface NurseProfile {
    id: string
    name: string
    email: string
    phone: string
    address: string
    coren: string
    years_experience: number
    department: string
    bio: string
    specialization: string
    created_at?: string
    updated_at?: string
    hidden?: boolean
    profile_image_id?: string
    experience?: number
    location?: string
}