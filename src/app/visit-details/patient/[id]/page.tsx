"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { Header } from "@/components/Header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Calendar,
    MapPin,
    Phone,
    Mail,
    User,
    FileText,
    DollarSign,
    ArrowLeft,
    Home,
    Loader2,
    Shield,
    Star,
    Briefcase,
    AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"
import dynamic from "next/dynamic"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api/v1"

interface VisitDetails {
    id: string
    status: string
    patient_id: string
    patient_name: string
    patient_email: string
    description: string
    reason: string
    cancel_reason: string | null
    nurse_id: string
    nurse_name: string
    visit_value: number
    visit_type: string
    visit_date: string
    created_at: string
    updated_at: string
    confirmation_code: string
}

interface NurseDetails {
    id: string
    name: string
    email: string
    phone: string
    specialization: string
    years_experience: number
    price: number
    rating: number
    cep: string
    street: string
    number: string
    complement: string
    neighborhood: string
    city: string
    uf: string
    latitude: number
    longitude: number
    coren: string
    profile_image_id: string | null
    created_at: string
}

export default function PatientVisitDetailsPage() {
    const router = useRouter()
    const params = useParams()
    const visitId = params.id as string

    const [visit, setVisit] = useState<VisitDetails | null>(null)
    const [nurse, setNurse] = useState<NurseDetails | null>(null)
    const [loading, setLoading] = useState(true)
    const [showEmergencyDialog, setShowEmergencyDialog] = useState(false)
    const [emergencyLoading, setEmergencyLoading] = useState(false)

    const AddressMapWithNoSSR = useMemo(
        () =>
            dynamic(() => import("@/components/AddressMap"), {
                loading: () => (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: "250px",
                            backgroundColor: "#f3f4f6",
                            borderRadius: "0.5rem",
                        }}
                    >
                        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                        <p className="ml-2 text-gray-600">Carregando mapa...</p>
                    </div>
                ),
                ssr: false,
            }),
        [],
    )

    useEffect(() => {
        const fetchVisitDetails = async () => {
            try {
                setLoading(true)

                // Simulate API delay
                await new Promise((resolve) => setTimeout(resolve, 800))

                // Mock visit data
                const mockVisit: VisitDetails = {
                    id: visitId,
                    status: "CONFIRMED",
                    patient_id: "507f1f77bcf86cd799439011",
                    patient_name: "João Silva",
                    patient_email: "joao.silva@email.com",
                    description:
                        "Acompanhamento pós-operatório com troca de curativos e administração de medicamentos prescritos. Necessário verificar sinais vitais e orientar sobre cuidados.",
                    reason: "Acompanhamento pós-operatório",
                    cancel_reason: null,
                    nurse_id: "507f1f77bcf86cd799439012",
                    nurse_name: "Ana Paula Santos",
                    visit_value: 150.0,
                    visit_type: "domiciliar",
                    visit_date: "2025-01-25T14:00:00Z",
                    created_at: "2025-01-20T10:30:00Z",
                    updated_at: "2025-01-20T10:30:00Z",
                    confirmation_code: "123456",
                }

                // Mock nurse data
                const mockNurse: NurseDetails = {
                    id: "507f1f77bcf86cd799439012",
                    name: "Ana Paula Santos",
                    email: "ana.santos@medassist.com",
                    phone: "(11) 99876-5432",
                    specialization: "Enfermagem Domiciliar",
                    years_experience: 8,
                    price: 150.0,
                    rating: 4.8,
                    cep: "04567-890",
                    street: "Rua dos Profissionais",
                    number: "456",
                    complement: "Bloco B, Apto 102",
                    neighborhood: "Vila Mariana",
                    city: "São Paulo",
                    uf: "SP",
                    latitude: -23.5889,
                    longitude: -46.6389,
                    coren: "SP-123456",
                    profile_image_id: null,
                    created_at: "2023-03-10T08:00:00Z",
                }

                setVisit(mockVisit)
                setNurse(mockNurse)
            } catch (error) {
                toast.error("Erro ao carregar detalhes da visita")
                console.error(error)
            } finally {
                setLoading(false)
            }
        }

        fetchVisitDetails()
    }, [visitId])

    const handleEmergency = async () => {
        try {
            setEmergencyLoading(true)

            const user = JSON.parse(localStorage.getItem("user") || "{}")
            const token = localStorage.getItem("token")

            // Call emergency endpoint
            const response = await fetch(`${API_BASE_URL}/emergency/alert`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    visit_id: visitId,
                    patient_id: user.id,
                    nurse_id: visit?.nurse_id,
                    location: {
                        address: `${nurse?.street}, ${nurse?.number}, ${nurse?.neighborhood}, ${nurse?.city} - ${nurse?.uf}`,
                        latitude: nurse?.latitude,
                        longitude: nurse?.longitude,
                    },
                }),
            })

            if (response.ok) {
                toast.success("Alerta de emergência enviado com sucesso! Autoridades foram notificadas.")
                setShowEmergencyDialog(false)
            } else {
                toast.error("Erro ao enviar alerta de emergência. Tente novamente.")
            }
        } catch (error) {
            console.error("Emergency alert error:", error)
            toast.error("Erro ao enviar alerta de emergência. Tente novamente.")
        } finally {
            setEmergencyLoading(false)
        }
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value)
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "PENDING":
                return "#f59e0b"
            case "CONFIRMED":
                return "#15803d"
            case "COMPLETED":
                return "#0891b2"
            case "CANCELLED":
                return "#dc2626"
            default:
                return "#6b7280"
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "PENDING":
                return "Pendente"
            case "CONFIRMED":
                return "Confirmada"
            case "COMPLETED":
                return "Concluída"
            case "CANCELLED":
                return "Cancelada"
            default:
                return status
        }
    }

    const getVisitTypeLabel = (type: string) => {
        switch (type?.toLowerCase()) {
            case "domiciliar":
                return "Domiciliar"
            case "hospitalar":
                return "Hospitalar"
            case "clinica":
                return "Clínica"
            default:
                return type || "N/A"
        }
    }

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
                <Header />
                <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem", textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                        <Loader2 className="h-8 w-8 animate-spin mr-3" style={{ color: "#15803d" }} />
                        <div style={{ color: "#15803d", fontSize: "1.125rem", fontWeight: "500" }}>
                            Carregando detalhes da visita...
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (!visit || !nurse) {
        return (
            <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
                <Header />
                <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem", textAlign: "center" }}>
                    <h1 style={{ color: "#dc2626", marginBottom: "1rem", fontSize: "1.5rem", fontWeight: "600" }}>
                        Visita não encontrada
                    </h1>
                    <Button onClick={() => router.push("/patient")} style={{ backgroundColor: "#15803d", color: "white" }}>
                        Voltar para Dashboard
                    </Button>
                </div>
            </div>
        )
    }

    const nurseImageUrl = nurse.profile_image_id
        ? `${API_BASE_URL}/user/file/${nurse.profile_image_id}`
        : "/nurse-placeholder.jpg"

    const fullAddress = `${nurse.street}, ${nurse.number}, ${nurse.neighborhood}, ${nurse.city} - ${nurse.uf}, ${nurse.cep}`

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
            <Header />
            <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem" }}>
                <div style={{ marginBottom: "2.5rem" }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "1rem",
                            padding: "1.5rem",
                            backgroundColor: "white",
                            borderRadius: "0.75rem",
                            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                        }}
                    >
                        <div>
                            <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#1f2937", marginBottom: "0.5rem" }}>
                                Detalhes da Visita
                            </h1>
                            <p style={{ color: "#6b7280", fontSize: "1rem" }}>Informações completas sobre sua visita agendada</p>
                        </div>
                        <Badge
                            style={{
                                backgroundColor: getStatusColor(visit.status),
                                fontSize: "1rem",
                                padding: "0.75rem 1.5rem",
                                borderRadius: "0.5rem",
                                fontWeight: "600",
                                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                            }}
                        >
                            {getStatusLabel(visit.status)}
                        </Badge>
                    </div>
                </div>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
                        gap: "1.5rem",
                        marginBottom: "1.5rem",
                    }}
                >
                    {/* Visit Information Card */}
                    <Card
                        style={{
                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.07)",
                            border: "1px solid #e5e7eb",
                            transition: "all 0.3s ease",
                        }}
                    >
                        <CardHeader style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                            <CardTitle style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#1f2937" }}>
                                <FileText className="h-5 w-5" style={{ color: "#15803d" }} />
                                Informações da Visita
                            </CardTitle>
                        </CardHeader>
                        <CardContent style={{ display: "grid", gap: "1.25rem", padding: "1.5rem" }}>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                                    <Calendar className="h-4 w-4" style={{ color: "#15803d" }} />
                                    <span
                                        style={{
                                            fontSize: "0.875rem",
                                            fontWeight: "600",
                                            color: "#6b7280",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.05em",
                                        }}
                                    >
                                        Data e Hora
                                    </span>
                                </div>
                                <p style={{ fontSize: "1.125rem", color: "#1f2937", marginLeft: "1.5rem", fontWeight: "500" }}>
                                    {formatDate(visit.visit_date)}
                                </p>
                            </div>

                            <Separator />

                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                                    <Home className="h-4 w-4" style={{ color: "#15803d" }} />
                                    <span
                                        style={{
                                            fontSize: "0.875rem",
                                            fontWeight: "600",
                                            color: "#6b7280",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.05em",
                                        }}
                                    >
                                        Tipo de Visita
                                    </span>
                                </div>
                                <p style={{ fontSize: "1.125rem", color: "#1f2937", marginLeft: "1.5rem", fontWeight: "500" }}>
                                    {getVisitTypeLabel(visit.visit_type)}
                                </p>
                            </div>

                            <Separator />

                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                                    <DollarSign className="h-4 w-4" style={{ color: "#15803d" }} />
                                    <span
                                        style={{
                                            fontSize: "0.875rem",
                                            fontWeight: "600",
                                            color: "#6b7280",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.05em",
                                        }}
                                    >
                                        Valor
                                    </span>
                                </div>
                                <p style={{ fontSize: "1.5rem", fontWeight: "700", color: "#15803d", marginLeft: "1.5rem" }}>
                                    {formatCurrency(visit.visit_value)}
                                </p>
                            </div>

                            <Separator />

                            <div>
                                <span
                                    style={{
                                        fontSize: "0.875rem",
                                        fontWeight: "600",
                                        color: "#6b7280",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                    }}
                                >
                                    Motivo
                                </span>
                                <p style={{ fontSize: "1rem", color: "#1f2937", marginTop: "0.5rem", lineHeight: "1.6" }}>
                                    {visit.reason}
                                </p>
                            </div>

                            <Separator />

                            <div>
                                <span
                                    style={{
                                        fontSize: "0.875rem",
                                        fontWeight: "600",
                                        color: "#6b7280",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                    }}
                                >
                                    Descrição
                                </span>
                                <p style={{ fontSize: "1rem", color: "#1f2937", marginTop: "0.5rem", lineHeight: "1.7" }}>
                                    {visit.description}
                                </p>
                            </div>

                            {visit.cancel_reason && (
                                <>
                                    <Separator />
                                    <div
                                        style={{
                                            padding: "1rem",
                                            backgroundColor: "#fef2f2",
                                            borderRadius: "0.5rem",
                                            border: "1px solid #fecaca",
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: "0.875rem",
                                                fontWeight: "600",
                                                color: "#dc2626",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.05em",
                                            }}
                                        >
                                            Motivo do Cancelamento
                                        </span>
                                        <p style={{ fontSize: "1rem", color: "#991b1b", marginTop: "0.5rem" }}>{visit.cancel_reason}</p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Nurse Information Card */}
                    <Card
                        style={{
                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.07)",
                            border: "1px solid #e5e7eb",
                            transition: "all 0.3s ease",
                        }}
                    >
                        <CardHeader style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                            <CardTitle style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#1f2937" }}>
                                <User className="h-5 w-5" style={{ color: "#15803d" }} />
                                Informações do Enfermeiro(a)
                            </CardTitle>
                        </CardHeader>
                        <CardContent style={{ padding: "1.5rem" }}>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "1rem",
                                    marginBottom: "1.5rem",
                                    padding: "1rem",
                                    backgroundColor: "#f9fafb",
                                    borderRadius: "0.75rem",
                                }}
                            >
                                <img
                                    src={nurseImageUrl || "/placeholder.svg"}
                                    alt={nurse.name}
                                    style={{
                                        width: "90px",
                                        height: "90px",
                                        borderRadius: "50%",
                                        objectFit: "cover",
                                        border: "3px solid #15803d",
                                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                                    }}
                                    onError={(e) => (e.currentTarget.src = "/nurse-placeholder.jpg")}
                                />
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: "1.375rem", fontWeight: "700", color: "#1f2937", marginBottom: "0.25rem" }}>
                                        {nurse.name}
                                    </h3>
                                    <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.5rem" }}>COREN: {nurse.coren}</p>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                        <Star className="h-5 w-5" style={{ color: "#f59e0b", fill: "#f59e0b" }} />
                                        <span style={{ fontSize: "1rem", fontWeight: "700", color: "#1f2937" }}>{nurse.rating}</span>
                                        <span style={{ fontSize: "0.875rem", color: "#6b7280", marginLeft: "0.25rem" }}>/ 5.0</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                                <Button
                                    onClick={() => router.push(`/patient/nurse/${nurse.id}`)}
                                    style={{
                                        backgroundColor: "#15803d",
                                        color: "white",
                                        flex: 1,
                                        fontWeight: "600",
                                        transition: "all 0.2s ease",
                                        boxShadow: "0 2px 4px rgba(21, 128, 61, 0.2)",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = "#166534"
                                        e.currentTarget.style.transform = "translateY(-1px)"
                                        e.currentTarget.style.boxShadow = "0 4px 6px rgba(21, 128, 61, 0.3)"
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = "#15803d"
                                        e.currentTarget.style.transform = "translateY(0)"
                                        e.currentTarget.style.boxShadow = "0 2px 4px rgba(21, 128, 61, 0.2)"
                                    }}
                                >
                                    <User className="h-4 w-4 mr-2" />
                                    Ver Perfil
                                </Button>
                                <Button
                                    onClick={() => router.push("/chats")}
                                    variant="outline"
                                    style={{
                                        flex: 1,
                                        fontWeight: "600",
                                        borderColor: "#15803d",
                                        color: "#15803d",
                                        transition: "all 0.2s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = "#f0fdf4"
                                        e.currentTarget.style.borderColor = "#166534"
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = "transparent"
                                        e.currentTarget.style.borderColor = "#15803d"
                                    }}
                                >
                                    <Mail className="h-4 w-4 mr-2" />
                                    Mensagem
                                </Button>
                            </div>

                            <Separator style={{ marginBottom: "1.25rem" }} />

                            <div style={{ display: "grid", gap: "1.25rem" }}>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                                        <Briefcase className="h-4 w-4" style={{ color: "#15803d" }} />
                                        <span
                                            style={{
                                                fontSize: "0.875rem",
                                                fontWeight: "600",
                                                color: "#6b7280",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.05em",
                                            }}
                                        >
                                            Especialização
                                        </span>
                                    </div>
                                    <p style={{ fontSize: "1rem", color: "#1f2937", marginLeft: "1.5rem", fontWeight: "500" }}>
                                        {nurse.specialization}
                                    </p>
                                </div>

                                <Separator />

                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                                        <Briefcase className="h-4 w-4" style={{ color: "#15803d" }} />
                                        <span
                                            style={{
                                                fontSize: "0.875rem",
                                                fontWeight: "600",
                                                color: "#6b7280",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.05em",
                                            }}
                                        >
                                            Experiência
                                        </span>
                                    </div>
                                    <p style={{ fontSize: "1rem", color: "#1f2937", marginLeft: "1.5rem", fontWeight: "500" }}>
                                        {nurse.years_experience} anos
                                    </p>
                                </div>

                                <Separator />

                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                                        <Mail className="h-4 w-4" style={{ color: "#15803d" }} />
                                        <span
                                            style={{
                                                fontSize: "0.875rem",
                                                fontWeight: "600",
                                                color: "#6b7280",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.05em",
                                            }}
                                        >
                                            Email
                                        </span>
                                    </div>
                                    <p style={{ fontSize: "1rem", color: "#1f2937", marginLeft: "1.5rem" }}>{nurse.email}</p>
                                </div>

                                <Separator />

                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                                        <Phone className="h-4 w-4" style={{ color: "#15803d" }} />
                                        <span
                                            style={{
                                                fontSize: "0.875rem",
                                                fontWeight: "600",
                                                color: "#6b7280",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.05em",
                                            }}
                                        >
                                            Telefone
                                        </span>
                                    </div>
                                    <p style={{ fontSize: "1rem", color: "#1f2937", marginLeft: "1.5rem" }}>{nurse.phone}</p>
                                </div>

                                <Separator />

                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                                        <MapPin className="h-4 w-4" style={{ color: "#15803d" }} />
                                        <span
                                            style={{
                                                fontSize: "0.875rem",
                                                fontWeight: "600",
                                                color: "#6b7280",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.05em",
                                            }}
                                        >
                                            Região de Atuação
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "1rem", color: "#1f2937", marginLeft: "1.5rem", lineHeight: "1.6" }}>
                                        <p>{nurse.neighborhood}</p>
                                        <p>
                                            {nurse.city} - {nurse.uf}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Separator style={{ margin: "1.25rem 0" }} />
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                                    <MapPin className="h-4 w-4" style={{ color: "#15803d" }} />
                                    <span
                                        style={{
                                            fontSize: "0.875rem",
                                            fontWeight: "600",
                                            color: "#6b7280",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.05em",
                                        }}
                                    >
                                        Localização da Visita
                                    </span>
                                </div>
                                <div style={{ borderRadius: "0.5rem", overflow: "hidden", boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)" }}>
                                    <AddressMapWithNoSSR address={fullAddress} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {visit.status === "CONFIRMED" && (
                    <Card
                        style={{
                            marginBottom: "1.5rem",
                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.07)",
                            border: "2px solid #15803d",
                            background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)",
                        }}
                    >
                        <CardHeader style={{ borderBottom: "1px solid #d1fae5" }}>
                            <CardTitle style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#1f2937" }}>
                                <Shield className="h-6 w-6" style={{ color: "#15803d" }} />
                                Código de Confirmação
                            </CardTitle>
                        </CardHeader>
                        <CardContent style={{ padding: "2rem" }}>
                            <p
                                style={{
                                    color: "#6b7280",
                                    marginBottom: "2rem",
                                    lineHeight: "1.7",
                                    fontSize: "1rem",
                                    textAlign: "center",
                                }}
                            >
                                Forneça este código ao enfermeiro(a) ao final do atendimento para confirmar que o serviço foi realizado.
                            </p>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    padding: "2.5rem",
                                    background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
                                    borderRadius: "1rem",
                                    border: "3px solid #15803d",
                                    boxShadow: "0 8px 16px rgba(21, 128, 61, 0.15)",
                                }}
                            >
                                <div style={{ textAlign: "center" }}>
                                    <p
                                        style={{
                                            fontSize: "0.875rem",
                                            fontWeight: "700",
                                            color: "#15803d",
                                            marginBottom: "1rem",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.1em",
                                        }}
                                    >
                                        Seu código de confirmação
                                    </p>
                                    <p
                                        style={{
                                            fontSize: "3.5rem",
                                            fontWeight: "900",
                                            color: "#15803d",
                                            letterSpacing: "0.75rem",
                                            fontFamily: "monospace",
                                            textShadow: "0 2px 4px rgba(21, 128, 61, 0.1)",
                                        }}
                                    >
                                        {visit.confirmation_code}
                                    </p>
                                    <p
                                        style={{
                                            fontSize: "0.875rem",
                                            color: "#6b7280",
                                            marginTop: "1rem",
                                            fontWeight: "500",
                                        }}
                                    >
                                        Código válido apenas para esta visita
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {visit.status === "CONFIRMED" && (
                    <Card
                        style={{
                            marginBottom: "1.5rem",
                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.07)",
                            border: "2px solid #dc2626",
                            background: "linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)",
                        }}
                    >
                        <CardContent style={{ padding: "2rem" }}>
                            <div style={{ textAlign: "center" }}>
                                <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
                                    <AlertTriangle className="h-12 w-12" style={{ color: "#dc2626" }} />
                                </div>
                                <h3
                                    style={{
                                        fontSize: "1.5rem",
                                        fontWeight: "700",
                                        color: "#1f2937",
                                        marginBottom: "0.75rem",
                                    }}
                                >
                                    Segurança em Primeiro Lugar
                                </h3>
                                <p
                                    style={{
                                        color: "#6b7280",
                                        marginBottom: "2rem",
                                        lineHeight: "1.7",
                                        fontSize: "1rem",
                                        maxWidth: "600px",
                                        margin: "0 auto 2rem",
                                    }}
                                >
                                    Caso se sinta ameaçado ou em situação de risco durante o atendimento, pressione o botão abaixo. Um
                                    alerta será enviado imediatamente às autoridades competentes.
                                </p>
                                <Button
                                    onClick={() => setShowEmergencyDialog(true)}
                                    style={{
                                        backgroundColor: "#dc2626",
                                        color: "white",
                                        padding: "1.5rem 3rem",
                                        fontSize: "1.125rem",
                                        fontWeight: "700",
                                        borderRadius: "0.75rem",
                                        boxShadow: "0 4px 6px rgba(220, 38, 38, 0.3)",
                                        transition: "all 0.2s ease",
                                        border: "none",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = "#b91c1c"
                                        e.currentTarget.style.transform = "translateY(-2px)"
                                        e.currentTarget.style.boxShadow = "0 6px 8px rgba(220, 38, 38, 0.4)"
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = "#dc2626"
                                        e.currentTarget.style.transform = "translateY(0)"
                                        e.currentTarget.style.boxShadow = "0 4px 6px rgba(220, 38, 38, 0.3)"
                                    }}
                                >
                                    <AlertTriangle className="h-5 w-5 mr-2" />
                                    Botão de Emergência
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div
                    style={{
                        marginTop: "2rem",
                        padding: "1rem",
                        fontSize: "0.875rem",
                        color: "#6b7280",
                        textAlign: "center",
                        backgroundColor: "white",
                        borderRadius: "0.5rem",
                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                    }}
                >
                    <p style={{ marginBottom: "0.25rem" }}>
                        Criado em: <span style={{ fontWeight: "600", color: "#1f2937" }}>{formatDate(visit.created_at)}</span>
                    </p>
                    <p>
                        Última atualização:{" "}
                        <span style={{ fontWeight: "600", color: "#1f2937" }}>{formatDate(visit.updated_at)}</span>
                    </p>
                </div>
            </div>

            <AlertDialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#dc2626" }}>
                            <AlertTriangle className="h-6 w-6" />
                            Confirmar Alerta de Emergência
                        </AlertDialogTitle>
                        <AlertDialogDescription style={{ lineHeight: "1.7", fontSize: "1rem" }}>
                            Você está prestes a enviar um alerta de emergência. Esta ação notificará imediatamente as autoridades
                            competentes sobre uma situação de risco.
                            <br />
                            <br />
                            <strong style={{ color: "#dc2626" }}>Use este recurso apenas em situações reais de emergência.</strong>
                            <br />
                            <br />
                            Deseja continuar?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={emergencyLoading}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleEmergency}
                            disabled={emergencyLoading}
                            style={{
                                backgroundColor: "#dc2626",
                                color: "white",
                            }}
                        >
                            {emergencyLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <AlertTriangle className="h-4 w-4 mr-2" />
                                    Confirmar Emergência
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
