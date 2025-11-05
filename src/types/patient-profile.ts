export interface PatientData {
    id: string
    name: string
    email: string
    phone: string
    address: string
    cpf: string
    role: string
    first_access: boolean
    two_factor: boolean
    created_at: string
    updated_at: string
    hidden: boolean
    profile_image_id?: string
}

export interface ApiResponse {
    data: PatientData
    message: string
    success: boolean
}
