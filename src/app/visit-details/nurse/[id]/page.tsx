"use client"

import type React from "react"
import { CheckCircle } from "lucide-react" // Import CheckCircle icon

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
                        <div style={{ color: "#15803d", fontSize: "1.125rem" }}>Carregando detalhes da visita...</div>
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
                    <h1 style={{ color: "#dc2626", marginBottom: "1rem" }}>Visita não encontrada</h1>
                    <Button onClick={() => router.push("/nurse/visits/nurse")}>Voltar para Visitas</Button>
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
                {/* Header with Back Button */}
                <div style={{ marginBottom: "2rem" }}>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "1rem",
                        }}
                    >
                        <div>
                            <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#1f2937", marginBottom: "0.5rem" }}>
                                Detalhes da Visita
                            </h1>
                            <p style={{ color: "#6b7280" }}>Informações completas sobre a visita agendada</p>
                        </div>
                        <Badge style={{ backgroundColor: getStatusColor(visit.status), fontSize: "1rem", padding: "0.5rem 1rem" }}>
                            {getStatusLabel(visit.status)}
                        </Badge>
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
                    {/* Visit Information Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <FileText className="h-5 w-5" style={{ color: "#15803d" }} />
                                Informações da Visita
                            </CardTitle>
                        </CardHeader>
                        <CardContent style={{ display: "grid", gap: "1rem" }}>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                                    <Calendar className="h-4 w-4" style={{ color: "#6b7280" }} />
                                    <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280" }}>Data e Hora</span>
                                </div>
                                <p style={{ fontSize: "1rem", color: "#1f2937", marginLeft: "1.5rem" }}>
                                    {formatDate(visit.visit_date)}
                                </p>
                            </div>

                            <Separator />

                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                                    <Home className="h-4 w-4" style={{ color: "#6b7280" }} />
                                    <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280" }}>Tipo de Visita</span>
                                </div>
                                <p style={{ fontSize: "1rem", color: "#1f2937", marginLeft: "1.5rem" }}>
                                    {getVisitTypeLabel(visit.visit_type)}
                                </p>
                            </div>

                            <Separator />

                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                                    <DollarSign className="h-4 w-4" style={{ color: "#6b7280" }} />
                                    <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280" }}>Valor</span>
                                </div>
                                <p style={{ fontSize: "1.25rem", fontWeight: "600", color: "#15803d", marginLeft: "1.5rem" }}>
                                    {formatCurrency(visit.visit_value)}
                                </p>
                            </div>

                            <Separator />

                            <div>
                                <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280" }}>Motivo</span>
                                <p style={{ fontSize: "1rem", color: "#1f2937", marginTop: "0.25rem" }}>{visit.reason}</p>
                            </div>

                            <Separator />

                            <div>
                                <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280" }}>Descrição</span>
                                <p style={{ fontSize: "1rem", color: "#1f2937", marginTop: "0.25rem", lineHeight: "1.6" }}>
                                    {visit.description}
                                </p>
                            </div>

                            {visit.cancel_reason && (
                                <>
                                    <Separator />
                                    <div>
                                        <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#dc2626" }}>
                                            Motivo do Cancelamento
                                        </span>
                                        <p style={{ fontSize: "1rem", color: "#1f2937", marginTop: "0.25rem" }}>{visit.cancel_reason}</p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Patient Information Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <User className="h-5 w-5" style={{ color: "#15803d" }} />
                                Informações do Paciente
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
                                <img
                                    src={patientImageUrl || "/placeholder.svg"}
                                    alt={patient.name}
                                    style={{
                                        width: "80px",
                                        height: "80px",
                                        borderRadius: "50%",
                                        objectFit: "cover",
                                        backgroundColor: "#e5e7eb",
                                    }}
                                    onError={(e) => (e.currentTarget.src = "/patient-placeholder.jpg")}
                                />
                                <div>
                                    <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#1f2937" }}>{patient.name}</h3>
                                    <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>CPF: {patient.cpf}</p>
                                </div>
                            </div>

                            <div style={{ display: "grid", gap: "1rem" }}>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                                        <Mail className="h-4 w-4" style={{ color: "#6b7280" }} />
                                        <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280" }}>Email</span>
                                    </div>
                                    <p style={{ fontSize: "1rem", color: "#1f2937", marginLeft: "1.5rem" }}>{patient.email}</p>
                                </div>

                                <Separator />

                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                                        <Phone className="h-4 w-4" style={{ color: "#6b7280" }} />
                                        <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280" }}>Telefone</span>
                                    </div>
                                    <p style={{ fontSize: "1rem", color: "#1f2937", marginLeft: "1.5rem" }}>{patient.phone}</p>
                                </div>

                                <Separator />

                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                                        <MapPin className="h-4 w-4" style={{ color: "#6b7280" }} />
                                        <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280" }}>Endereço</span>
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

                            <Separator style={{ margin: "1rem 0" }} />
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                                    <MapPin className="h-4 w-4" style={{ color: "#6b7280" }} />
                                    <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280" }}>
                                        Localização da Visita
                                    </span>
                                </div>
                                <AddressMapWithNoSSR address={fullAddress} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {visit.status === "CONFIRMED" && (
                    <Card style={{ marginBottom: "1.5rem" }}>
                        <CardHeader>
                            <CardTitle style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <Shield className="h-5 w-5" style={{ color: "#15803d" }} />
                                Confirmação de Atendimento
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p style={{ color: "#6b7280", marginBottom: "1rem", lineHeight: "1.6" }}>
                                Para confirmar que o atendimento foi realizado, solicite ao paciente o código de confirmação de 6
                                dígitos e insira abaixo.
                            </p>
                            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
                                <div style={{ flex: 1, maxWidth: "300px" }}>
                                    <label
                                        htmlFor="confirmation-code"
                                        style={{
                                            display: "block",
                                            fontSize: "0.875rem",
                                            fontWeight: "600",
                                            color: "#374151",
                                            marginBottom: "0.5rem",
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
                                            fontSize: "1.5rem",
                                            letterSpacing: "0.5rem",
                                            textAlign: "center",
                                            fontWeight: "600",
                                        }}
                                        disabled={codeLoading}
                                    />
                                    <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
                                        Digite os 6 dígitos do código
                                    </p>
                                </div>
                                <Button
                                    onClick={handleConfirmationCode}
                                    disabled={confirmationCode.length !== 6 || codeLoading}
                                    style={{ backgroundColor: "#15803d", color: "white" }}
                                >
                                    {codeLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Validando...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Confirmar Atendimento
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Action Buttons */}
                <Card>
                    <CardContent style={{ padding: "1.5rem" }}>
                        <div style={{ textAlign: "center" }}>
                            <p style={{ color: "#6b7280", marginBottom: "1rem", fontSize: "0.875rem" }}>
                                Use o botão abaixo apenas em situações de emergência
                            </p>
                            <Button
                                onClick={() => setShowEmergencyDialog(true)}
                                style={{
                                    backgroundColor: "#dc2626",
                                    color: "white",
                                    fontWeight: "600",
                                    fontSize: "1rem",
                                    padding: "1rem 2rem",
                                    height: "auto",
                                }}
                            >
                                <AlertTriangle className="h-5 w-5 mr-2" />
                                Emergência - Caso se sinta ameaçado
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Timestamps */}
                <div style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#6b7280", textAlign: "center" }}>
                    <p>Criado em: {formatDate(visit.created_at)}</p>
                    <p>Última atualização: {formatDate(visit.updated_at)}</p>
                </div>
            </div>

            {/* Emergency Alert Dialog */}
            <AlertDialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#dc2626" }}>
                            <AlertTriangle className="h-5 w-5" />
                            Alerta de Emergência
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Você está prestes a acionar um alerta de emergência. Esta ação irá:
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div style={{ padding: "1rem 0" }}>
                        <ul style={{ listStyle: "disc", paddingLeft: "1.5rem", color: "#374151", lineHeight: "1.8" }}>
                            <li>Notificar os serviços de emergência</li>
                            <li>Alertar a equipe de suporte do MedAssist</li>
                            <li>Compartilhar sua localização atual</li>
                            <li>Registrar o incidente no sistema</li>
                        </ul>
                        <div
                            style={{
                                marginTop: "1rem",
                                padding: "0.75rem",
                                backgroundColor: "#fef2f2",
                                borderLeft: "4px solid #dc2626",
                                borderRadius: "0.25rem",
                            }}
                        >
                            <p style={{ fontSize: "0.875rem", color: "#991b1b", fontWeight: "500" }}>
                                Use este botão apenas em situações de real emergência ou perigo.
                            </p>
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={actionLoading}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleEmergency}
                            disabled={actionLoading}
                            style={{ backgroundColor: "#dc2626" }}
                        >
                            {actionLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Enviando Alerta...
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
