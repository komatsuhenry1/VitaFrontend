"use client"

import type React from "react"
import { CheckCircle } from "lucide-react"
import { MessageCircle } from "lucide-react"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { Header } from "@/components/Header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
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
}

interface PatientDetails {
    id: string
    name: string
    email: string
    phone: string
    address: string
    cep: string
    street: string
    number: string
    complement: string
    neighborhood: string
    city: string
    uf: string
    latitude: number
    longitude: number
    cpf: string
    profile_image_id: string | null
    created_at: string
}

export default function VisitDetailsPage() {
    const router = useRouter()
    const params = useParams()
    const visitId = params.id as string

    const [visit, setVisit] = useState<VisitDetails | null>(null)
    const [patient, setPatient] = useState<PatientDetails | null>(null)
    const [loading, setLoading] = useState(true)
    const [showEmergencyDialog, setShowEmergencyDialog] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)
    const [confirmationCode, setConfirmationCode] = useState("")
    const [codeLoading, setCodeLoading] = useState(false)

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
                    patient_name: "Julia Braga",
                    patient_email: "julia.braga@email.com",
                    description:
                        "Paciente necessita de acompanhamento pós-operatório com troca de curativos e administração de medicamentos prescritos.",
                    reason: "Acompanhamento pós-operatório",
                    cancel_reason: null,
                    nurse_id: "507f1f77bcf86cd799439012",
                    nurse_name: "Ana Silva",
                    visit_value: 150.0,
                    visit_type: "domiciliar",
                    visit_date: "2025-01-25T14:00:00Z",
                    created_at: "2025-01-20T10:30:00Z",
                    updated_at: "2025-01-20T10:30:00Z",
                }

                // Mock patient data
                const mockPatient: PatientDetails = {
                    id: "507f1f77bcf86cd799439011",
                    name: "Julia Braga",
                    email: "julia.braga@email.com",
                    phone: "(11) 98765-4321",
                    address: "Rua das Flores, 123, Apto 45",
                    cep: "01234-567",
                    street: "Rua das Flores",
                    number: "123",
                    complement: "Apto 45",
                    neighborhood: "Vila Prudente",
                    city: "São Paulo",
                    uf: "SP",
                    latitude: -23.5505,
                    longitude: -46.6333,
                    cpf: "123.456.789-00",
                    profile_image_id: null,
                    created_at: "2024-06-15T08:00:00Z",
                }

                setVisit(mockVisit)
                setPatient(mockPatient)
            } catch (error) {
                toast.error("Erro ao carregar detalhes da visita")
                console.error(error)
            } finally {
                setLoading(false)
            }
        }

        fetchVisitDetails()
    }, [visitId])

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

    const handleConfirmationCode = async () => {
        if (confirmationCode.length !== 6) {
            toast.error("O código deve ter 6 dígitos")
            return
        }

        if (!/^\d{6}$/.test(confirmationCode)) {
            toast.error("O código deve conter apenas números")
            return
        }

        try {
            setCodeLoading(true)

            // Simulate API call to verify confirmation code
            await new Promise((resolve) => setTimeout(resolve, 1000))

            // Mock validation - in production, this would call the backend
            const isValidCode = confirmationCode === "123456" // Mock validation

            if (isValidCode) {
                toast.success("Código confirmado! Visita concluída com sucesso.")
                router.push("/nurse/visits/nurse")
            } else {
                toast.error("Código inválido. Verifique e tente novamente.")
            }
        } catch (error) {
            toast.error("Erro ao validar código de confirmação")
        } finally {
            setCodeLoading(false)
        }
    }

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, "").slice(0, 6)
        setConfirmationCode(value)
    }

    const handleEmergency = async () => {
        try {
            setActionLoading(true)

            // Simulate API call to trigger emergency alert
            await new Promise((resolve) => setTimeout(resolve, 1000))

            // In production, this would:
            // - Send alert to emergency services
            // - Notify admin/support team
            // - Log the emergency event
            // - Share location with authorities

            toast.success("Alerta de emergência enviado! Ajuda está a caminho.")
            setShowEmergencyDialog(false)
        } catch (error) {
            toast.error("Erro ao enviar alerta de emergência")
        } finally {
            setActionLoading(false)
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

    if (!visit || !patient) {
        return (
            <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
                <Header />
                <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem", textAlign: "center" }}>
                    <h1 style={{ color: "#dc2626", marginBottom: "1rem", fontSize: "1.5rem", fontWeight: "600" }}>
                        Visita não encontrada
                    </h1>
                    <Button
                        onClick={() => router.push("/nurse/visits/nurse")}
                        style={{ backgroundColor: "#15803d", color: "white" }}
                    >
                        Voltar para Visitas
                    </Button>
                </div>
            </div>
        )
    }

    const patientImageUrl = patient.profile_image_id
        ? `${API_BASE_URL}/user/file/${patient.profile_image_id}`
        : "/patient-placeholder.jpg"

    const fullAddress = `${patient.street}, ${patient.number}, ${patient.neighborhood}, ${patient.city} - ${patient.uf}, ${patient.cep}`

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
                            <p style={{ color: "#6b7280", fontSize: "1rem" }}>Informações completas sobre a visita agendada</p>
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
                                Informações do Paciente
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
                                    src={patientImageUrl || "/placeholder.svg"}
                                    alt={patient.name}
                                    style={{
                                        width: "90px",
                                        height: "90px",
                                        borderRadius: "50%",
                                        objectFit: "cover",
                                        border: "3px solid #15803d",
                                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                                    }}
                                    onError={(e) => (e.currentTarget.src = "/patient-placeholder.jpg")}
                                />
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: "1.375rem", fontWeight: "700", color: "#1f2937", marginBottom: "0.25rem" }}>
                                        {patient.name}
                                    </h3>
                                    <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>CPF: {patient.cpf}</p>
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
                                <Button
                                    onClick={() => router.push(`/chat/${patient.id}`)}
                                    style={{
                                        flex: 1,
                                        backgroundColor: "#15803d",
                                        color: "white",
                                        padding: "0.75rem 1.5rem",
                                        fontSize: "1rem",
                                        fontWeight: "600",
                                        borderRadius: "0.5rem",
                                        boxShadow: "0 2px 4px rgba(21, 128, 61, 0.2)",
                                        transition: "all 0.2s ease",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "0.5rem",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = "#166534"
                                        e.currentTarget.style.transform = "translateY(-2px)"
                                        e.currentTarget.style.boxShadow = "0 4px 6px rgba(21, 128, 61, 0.3)"
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = "#15803d"
                                        e.currentTarget.style.transform = "translateY(0)"
                                        e.currentTarget.style.boxShadow = "0 2px 4px rgba(21, 128, 61, 0.2)"
                                    }}
                                >
                                    <MessageCircle className="h-4 w-4" />
                                    Chat
                                </Button>
                                <Button
                                    onClick={() => router.push(`/patient-profile/${patient.id}`)}
                                    style={{
                                        flex: 1,
                                        backgroundColor: "white",
                                        color: "#15803d",
                                        padding: "0.75rem 1.5rem",
                                        fontSize: "1rem",
                                        fontWeight: "600",
                                        borderRadius: "0.5rem",
                                        border: "2px solid #15803d",
                                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                                        transition: "all 0.2s ease",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "0.5rem",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = "#f0fdf4"
                                        e.currentTarget.style.transform = "translateY(-2px)"
                                        e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)"
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = "white"
                                        e.currentTarget.style.transform = "translateY(0)"
                                        e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.05)"
                                    }}
                                >
                                    <User className="h-4 w-4" />
                                    Ver Perfil
                                </Button>
                            </div>

                            <div style={{ display: "grid", gap: "1.25rem" }}>
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
                                    <p style={{ fontSize: "1rem", color: "#1f2937", marginLeft: "1.5rem" }}>{patient.email}</p>
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
                                    <p style={{ fontSize: "1rem", color: "#1f2937", marginLeft: "1.5rem" }}>{patient.phone}</p>
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
                                            Endereço
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "1rem", color: "#1f2937", marginLeft: "1.5rem", lineHeight: "1.6" }}>
                                        <p>
                                            {patient.street}, {patient.number}
                                        </p>
                                        {patient.complement && <p>{patient.complement}</p>}
                                        <p>{patient.neighborhood}</p>
                                        <p>
                                            {patient.city} - {patient.uf}
                                        </p>
                                        <p>CEP: {patient.cep}</p>
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
                                Confirmação de Atendimento
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
                                Para confirmar que o atendimento foi realizado, solicite ao paciente o código de confirmação de 6
                                dígitos e insira abaixo.
                            </p>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: "1.5rem",
                                    maxWidth: "500px",
                                    margin: "0 auto",
                                }}
                            >
                                <div style={{ width: "100%" }}>
                                    <label
                                        htmlFor="confirmation-code"
                                        style={{
                                            display: "block",
                                            fontSize: "0.875rem",
                                            fontWeight: "700",
                                            color: "#15803d",
                                            marginBottom: "0.75rem",
                                            textAlign: "center",
                                            textTransform: "uppercase",
                                            letterSpacing: "0.05em",
                                        }}
                                    >
                                        Código de Confirmação
                                    </label>
                                    <Input
                                        id="confirmation-code"
                                        type="text"
                                        placeholder="000000"
                                        value={confirmationCode}
                                        onChange={handleCodeChange}
                                        maxLength={6}
                                        style={{
                                            fontSize: "2rem",
                                            letterSpacing: "0.75rem",
                                            textAlign: "center",
                                            fontWeight: "700",
                                            padding: "1.5rem",
                                            border: "2px solid #15803d",
                                            borderRadius: "0.75rem",
                                            backgroundColor: "white",
                                        }}
                                        disabled={codeLoading}
                                    />
                                    <p
                                        style={{
                                            fontSize: "0.875rem",
                                            color: "#6b7280",
                                            marginTop: "0.75rem",
                                            textAlign: "center",
                                            fontWeight: "500",
                                        }}
                                    >
                                        Digite os 6 dígitos fornecidos pelo paciente
                                    </p>
                                </div>
                                <Button
                                    onClick={handleConfirmationCode}
                                    disabled={confirmationCode.length !== 6 || codeLoading}
                                    style={{
                                        backgroundColor: "#15803d",
                                        color: "white",
                                        padding: "1.25rem 2.5rem",
                                        fontSize: "1.125rem",
                                        fontWeight: "700",
                                        borderRadius: "0.75rem",
                                        boxShadow: "0 4px 6px rgba(21, 128, 61, 0.3)",
                                        transition: "all 0.2s ease",
                                        width: "100%",
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!codeLoading && confirmationCode.length === 6) {
                                            e.currentTarget.style.backgroundColor = "#166534"
                                            e.currentTarget.style.transform = "translateY(-2px)"
                                            e.currentTarget.style.boxShadow = "0 6px 8px rgba(21, 128, 61, 0.4)"
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = "#15803d"
                                        e.currentTarget.style.transform = "translateY(0)"
                                        e.currentTarget.style.boxShadow = "0 4px 6px rgba(21, 128, 61, 0.3)"
                                    }}
                                >
                                    {codeLoading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                            Validando...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="h-5 w-5 mr-2" />
                                            Confirmar Atendimento
                                        </>
                                    )}
                                </Button>
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

            {/* Emergency Alert Dialog */}
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
                        <AlertDialogCancel disabled={actionLoading}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleEmergency}
                            disabled={actionLoading}
                            style={{
                                backgroundColor: "#dc2626",
                                color: "white",
                            }}
                        >
                            {actionLoading ? (
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
