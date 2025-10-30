"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/Header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
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
import { Input } from "@/components/ui/input"
import { Loader2, User, CheckCircle, XCircle, MessageCircle, Info, Calendar, Clock, CheckCheck } from "lucide-react"
import { toast } from "sonner"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api/v1"

interface Visit {
    id: string
    description: string
    reason: string
    visit_type: string
    created_at: string
    date: string
    status: string
    patient_name: string
    patient_id: string
    patient_image_id?: string
    nurse_name: string
    visit_value: number
    cancel_reason?: string | null
}

interface VisitsResponseData {
    pending: Visit[]
    confirmed: Visit[]
    completed: Visit[]
    rejected: Visit[]
    visits_today: Visit[]
}

interface ApiResponse {
    data: VisitsResponseData
    message: string
    success: boolean
}

interface ConfirmationResponse {
    success: boolean
    message: string
}

const cancelationReasons = [
    { value: "emergencia_pessoal", label: "Emergência Pessoal" },
    { value: "conflito_agenda", label: "Conflito de Agenda" },
    { value: "paciente_solicitou", label: "Paciente Solicitou" },
    { value: "outro", label: "Outro" },
]

export default function NurseVisitsPage() {
    const router = useRouter()
    const [visitsData, setVisitsData] = useState<VisitsResponseData>({
        pending: [],
        confirmed: [],
        completed: [],
        rejected: [],
        visits_today: [],
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [showCancelDialog, setShowCancelDialog] = useState(false)
    const [showRejectDialog, setShowRejectDialog] = useState(false)
    const [showConfirmServiceDialog, setShowConfirmServiceDialog] = useState(false)
    const [confirmationCodeInput, setConfirmationCodeInput] = useState("")
    const [confirmingService, setConfirmingService] = useState(false)
    const [cancelReason, setCancelReason] = useState("")
    const [actionLoading, setActionLoading] = useState(false)

    const fetchVisits = async () => {
        try {
            setError(null)
            const token = localStorage.getItem("token")
            if (!token) {
                router.push("/login")
                return
            }
            const response = await fetch(`${API_BASE_URL}/nurse/visits`, { headers: { Authorization: `Bearer ${token}` } })
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.message || `Erro ${response.status}`)
            }
            const result: ApiResponse = await response.json()
            if (result.success && result.data) {
                setVisitsData({
                    pending: (result.data.pending || []).map((visit) => ({ ...visit, status: "PENDING" })),
                    confirmed: (result.data.confirmed || []).map((visit) => ({ ...visit, status: "CONFIRMED" })),
                    completed: (result.data.completed || []).map((visit) => ({ ...visit, status: "COMPLETED" })),
                    rejected: (result.data.rejected || []).map((visit) => ({ ...visit, status: "REJECTED" })),
                    visits_today: (result.data.visits_today || []).map((visit) => ({
                        ...visit,
                        cancel_reason: visit.cancel_reason === "" ? null : visit.cancel_reason,
                    })),
                })
            } else {
                throw new Error(result.message || "Erro ao processar dados.")
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro desconhecido.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchVisits()
    }, [router])

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
    }
    const getStatusColor = (status: string) => {
        switch (status) {
            case "PENDING":
                return "#f59e0b"
            case "CONFIRMED":
                return "#15803d"
            case "COMPLETED":
                return "#0891b2"
            case "REJECTED":
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
            case "REJECTED":
                return "Rejeitada"
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
            case "consulta":
                return "Consulta"
            case "emergencia":
                return "Emergência"
            default:
                return type || "N/A"
        }
    }

    const handleConfirmVisitAction = async () => {
        if (!selectedVisit) return
        try {
            setActionLoading(true)
            const token = localStorage.getItem("token")
            const response = await fetch(`${API_BASE_URL}/nurse/visit/${selectedVisit.id}`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.message || "Erro ao confirmar")
            }
            await fetchVisits()
            setShowConfirmDialog(false)
            setSelectedVisit(null)
            toast.success("Visita confirmada!")
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erro")
        } finally {
            setActionLoading(false)
        }
    }

    const handleCancelVisitAction = async () => {
        if (!selectedVisit || !cancelReason) {
            toast.error("Selecione um motivo.")
            return
        }
        try {
            setActionLoading(true)
            const token = localStorage.getItem("token")
            const response = await fetch(`${API_BASE_URL}/nurse/visit/${selectedVisit.id}`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ reason: cancelReason }),
            })
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.message || "Erro ao cancelar")
            }
            await fetchVisits()
            setShowCancelDialog(false)
            setSelectedVisit(null)
            setCancelReason("")
            toast.success("Visita cancelada!")
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erro")
        } finally {
            setActionLoading(false)
        }
    }

    const handleRejectVisit = async () => {
        if (!selectedVisit) return
        try {
            setActionLoading(true)
            const token = localStorage.getItem("token")
            const response = await fetch(`${API_BASE_URL}/nurse/reject-visit/${selectedVisit.id}`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.message || "Erro ao rejeitar visita")
            }
            await fetchVisits()
            setShowRejectDialog(false)
            setSelectedVisit(null)
            toast.success("Visita rejeitada!")
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erro ao rejeitar visita")
        } finally {
            setActionLoading(false)
        }
    }

    const handleConfirmServiceAction = async () => {
        if (!selectedVisit) return
        if (confirmationCodeInput.length !== 6 || !/^\d{6}$/.test(confirmationCodeInput)) {
            toast.error("O código de confirmação deve ter 6 dígitos numéricos.")
            return
        }

        try {
            setConfirmingService(true)
            const token = localStorage.getItem("token")
            if (!token) {
                toast.error("Erro de autenticação.")
                setConfirmingService(false)
                return
            }

            const response = await fetch(`${API_BASE_URL}/nurse/service-confirmation/${selectedVisit.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ confirmation_code: confirmationCodeInput }),
            })

            const result: ConfirmationResponse = await response.json()

            if (!response.ok) {
                throw new Error(result.message || `Erro ${response.status}: Falha ao confirmar serviço.`)
            }

            if (result.success) {
                toast.success(result.message || "Serviço confirmado com sucesso!")
                setShowConfirmServiceDialog(false)
                setSelectedVisit(null)
                setConfirmationCodeInput("")
                await fetchVisits()
            } else {
                throw new Error(result.message || "Código inválido ou erro ao confirmar.")
            }
        } catch (error) {
            console.error("Service confirmation error:", error)
            toast.error(error instanceof Error ? error.message : "Erro ao confirmar serviço. Tente novamente.")
        } finally {
            setConfirmingService(false)
        }
    }

    const handleConfirmRejectedVisit = async (visit: Visit) => {
        try {
            setActionLoading(true)
            const token = localStorage.getItem("token")
            const response = await fetch(`${API_BASE_URL}/nurse/visit/${visit.id}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.message || "Erro ao confirmar visita")
            }

            toast.success("Visita confirmada com sucesso!")
            await fetchVisits()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erro ao confirmar visita")
        } finally {
            setActionLoading(false)
        }
    }

    const handleCodeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, "").slice(0, 6)
        setConfirmationCodeInput(value)
    }

    const { pending, confirmed, completed, rejected, visits_today } = visitsData

    const VisitCard = ({ visit, status }: { visit: Visit; status: string }) => {
        const patientImageUrl = visit.patient_image_id
            ? `${API_BASE_URL}/user/file/${visit.patient_image_id}`
            : "/patient-placeholder.jpg"

        return (
            <Card key={visit.id} style={{ overflow: "hidden" }}>
                <CardContent style={{ padding: "1.5rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "1.5rem", alignItems: "start" }}>
                        <div>
                            <img
                                src={patientImageUrl || "/placeholder.svg"}
                                alt={visit.patient_name || "Paciente"}
                                style={{
                                    width: "80px",
                                    height: "80px",
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                    backgroundColor: "#e5e7eb",
                                }}
                                onError={(e) => {
                                    e.currentTarget.onerror = null
                                    e.currentTarget.src = "/patient-placeholder.jpg"
                                }}
                            />
                        </div>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
                                <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#1f2937" }}>
                                    {visit.patient_name || "Paciente"}
                                </h3>
                                <Badge style={{ backgroundColor: getStatusColor(visit.status) }}>{getStatusLabel(visit.status)}</Badge>
                            </div>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(2, 1fr)",
                                    gap: "0.75rem",
                                    marginBottom: "0.75rem",
                                }}
                            >
                                <div>
                                    <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>📅 Data:</span>
                                    <span style={{ marginLeft: "0.5rem", fontWeight: "500" }}>{visit.date}</span>
                                </div>
                                <div>
                                    <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>🏥 Tipo:</span>
                                    <span style={{ marginLeft: "0.5rem", fontWeight: "500" }}>{getVisitTypeLabel(visit.visit_type)}</span>
                                </div>
                            </div>
                            <div style={{ marginBottom: "0.75rem" }}>
                                <span style={{ fontSize: "0.875rem", color: "#6b7280", fontWeight: "600" }}>Valor: </span>
                                <span style={{ color: "#15803d", fontWeight: "600" }}>{formatCurrency(visit.visit_value)}</span>
                            </div>
                            <div style={{ marginBottom: "0.5rem" }}>
                                <span style={{ fontSize: "0.875rem", color: "#6b7280", fontWeight: "600" }}>Motivo: </span>
                                <span style={{ color: "#4b5563" }}>{visit.reason}</span>
                            </div>
                            {visit.description && (
                                <div>
                                    <span style={{ fontSize: "0.875rem", color: "#6b7280", fontWeight: "600" }}>Descrição: </span>
                                    <span style={{ color: "#4b5563" }}>{visit.description}</span>
                                </div>
                            )}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            <Button
                                variant="outline"
                                onClick={() => router.push(`/patient-profile/${visit.patient_id}`)}
                                style={{ borderColor: "#15803d", color: "#15803d" }}
                            >
                                <User className="h-4 w-4 mr-2" />
                                Ver Paciente
                            </Button>

                            {status === "PENDING" && (
                                <>
                                    <Button
                                        onClick={() => {
                                            setSelectedVisit(visit)
                                            setShowConfirmDialog(true)
                                        }}
                                        style={{ backgroundColor: "#15803d", color: "white" }}
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Confirmar
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setSelectedVisit(visit)
                                            setShowRejectDialog(true)
                                        }}
                                        variant="outline"
                                        style={{ borderColor: "#dc2626", color: "#dc2626" }}
                                    >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Rejeitar
                                    </Button>
                                </>
                            )}

                            {status === "CONFIRMED" && (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSelectedVisit(visit)
                                            setShowCancelDialog(true)
                                        }}
                                        style={{ borderColor: "#dc2626", color: "#dc2626" }}
                                    >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setSelectedVisit(visit)
                                            setShowConfirmServiceDialog(true)
                                        }}
                                        style={{ backgroundColor: "#0891b2", color: "white" }}
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" /> Confirmar Serviço
                                    </Button>
                                </>
                            )}

                            <Button
                                variant="outline"
                                onClick={() => router.push(`/chat/${visit.patient_id}`)}
                                style={{ borderColor: "#0891b2", color: "#0891b2" }}
                            >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Chat
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => router.push(`/visit-details/nurse/${visit.id}`)}
                                style={{ borderColor: "#6b7280", color: "#6b7280" }}
                            >
                                <Info className="h-4 w-4 mr-2" />
                                Detalhes
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const RejectedVisitCard = ({ visit }: { visit: Visit }) => {
        const patientImageUrl = visit.patient_image_id
            ? `${API_BASE_URL}/user/file/${visit.patient_image_id}`
            : "/patient-placeholder.jpg"

        return (
            <Card key={visit.id} style={{ overflow: "hidden" }}>
                <CardContent style={{ padding: "1.5rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "1.5rem", alignItems: "start" }}>
                        <div>
                            <img
                                src={patientImageUrl || "/placeholder.svg"}
                                alt={visit.patient_name || "Paciente"}
                                style={{
                                    width: "80px",
                                    height: "80px",
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                    backgroundColor: "#e5e7eb",
                                }}
                                onError={(e) => {
                                    e.currentTarget.onerror = null
                                    e.currentTarget.src = "/patient-placeholder.jpg"
                                }}
                            />
                        </div>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
                                <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#1f2937" }}>
                                    {visit.patient_name || "Paciente"}
                                </h3>
                                <Badge style={{ backgroundColor: getStatusColor(visit.status) }}>{getStatusLabel(visit.status)}</Badge>
                            </div>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(2, 1fr)",
                                    gap: "0.75rem",
                                    marginBottom: "0.75rem",
                                }}
                            >
                                <div>
                                    <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>📅 Data:</span>
                                    <span style={{ marginLeft: "0.5rem", fontWeight: "500" }}>{visit.date}</span>
                                </div>
                                <div>
                                    <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>🏥 Tipo:</span>
                                    <span style={{ marginLeft: "0.5rem", fontWeight: "500" }}>{getVisitTypeLabel(visit.visit_type)}</span>
                                </div>
                            </div>
                            <div style={{ marginBottom: "0.75rem" }}>
                                <span style={{ fontSize: "0.875rem", color: "#6b7280", fontWeight: "600" }}>Valor: </span>
                                <span style={{ color: "#15803d", fontWeight: "600" }}>{formatCurrency(visit.visit_value)}</span>
                            </div>
                            <div style={{ marginBottom: "0.5rem" }}>
                                <span style={{ fontSize: "0.875rem", color: "#6b7280", fontWeight: "600" }}>Motivo: </span>
                                <span style={{ color: "#4b5563" }}>{visit.reason}</span>
                            </div>
                            {visit.description && (
                                <div>
                                    <span style={{ fontSize: "0.875rem", color: "#6b7280", fontWeight: "600" }}>Descrição: </span>
                                    <span style={{ color: "#4b5563" }}>{visit.description}</span>
                                </div>
                            )}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            <Button
                                variant="outline"
                                onClick={() => router.push(`/visit-details/nurse/${visit.id}`)}
                                style={{ borderColor: "#6b7280", color: "#6b7280" }}
                            >
                                <Info className="h-4 w-4 mr-2" />
                                Ver Detalhes
                            </Button>
                            <Button
                                onClick={() => handleConfirmRejectedVisit(visit)}
                                disabled={actionLoading}
                                style={{ backgroundColor: "#15803d", color: "white" }}
                            >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Confirmar
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const EmptyState = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
        <Card>
            <CardContent style={{ padding: "3rem", textAlign: "center" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>{icon}</div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#1f2937", marginBottom: "0.5rem" }}>{title}</h2>
                <p style={{ color: "#6b7280" }}>{description}</p>
            </CardContent>
        </Card>
    )

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
                <Header />
                <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem", textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                        <div style={{ color: "#15803d", fontSize: "1.125rem" }}>Carregando...</div>
                    </div>
                </div>
            </div>
        )
    }
    if (error) {
        return (
            <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
                <Header />
                <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem", textAlign: "center" }}>
                    <h1 style={{ color: "#dc2626", marginBottom: "1rem" }}>{error}</h1>
                    <Button onClick={fetchVisits} style={{ marginTop: "1rem" }}>
                        Tentar Novamente
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
            <Header />
            <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem" }}>
                <div style={{ marginBottom: "2rem" }}>
                    <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#1f2937", marginBottom: "0.5rem" }}>
                        Minhas Visitas
                    </h1>
                    <p style={{ color: "#6b7280" }}>Gerencie suas visitas agendadas</p>
                </div>

                {visits_today.length > 0 && (
                    <div style={{ marginBottom: "2rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                            <Calendar className="h-5 w-5" style={{ color: "#15803d" }} />
                            <h2 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#1f2937" }}>Visitas de Hoje</h2>
                            <Badge style={{ backgroundColor: "#15803d", color: "white" }}>{visits_today.length}</Badge>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1rem" }}>
                            {visits_today.map((visit) => (
                                <Card
                                    key={visit.id}
                                    style={{ overflow: "hidden", border: "2px solid #15803d", backgroundColor: "#f0fdf4" }}
                                >
                                    <CardContent style={{ padding: "1.5rem" }}>
                                        <div style={{ display: "flex", alignItems: "start", gap: "1rem", marginBottom: "1rem" }}>
                                            <img
                                                src={
                                                    visit.patient_image_id
                                                        ? `${API_BASE_URL}/user/file/${visit.patient_image_id}`
                                                        : "/patient-placeholder.jpg"
                                                }
                                                alt={visit.patient_name || "Paciente"}
                                                style={{
                                                    width: "60px",
                                                    height: "60px",
                                                    borderRadius: "50%",
                                                    objectFit: "cover",
                                                    backgroundColor: "#e5e7eb",
                                                }}
                                                onError={(e) => {
                                                    e.currentTarget.onerror = null
                                                    e.currentTarget.src = "/patient-placeholder.jpg"
                                                }}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <h3
                                                    style={{ fontSize: "1.125rem", fontWeight: "600", color: "#1f2937", marginBottom: "0.25rem" }}
                                                >
                                                    {visit.patient_name}
                                                </h3>
                                            </div>
                                            <Badge style={{ backgroundColor: getStatusColor(visit.status) }}>
                                                {getStatusLabel(visit.status)}
                                            </Badge>
                                        </div>
                                        <div style={{ display: "grid", gap: "0.5rem", marginBottom: "1rem" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                <Clock className="h-4 w-4 text-gray-500" />
                                                <span style={{ fontSize: "0.875rem", fontWeight: "500" }}>{visit.date}</span>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>Tipo: </span>
                                                <span style={{ fontSize: "0.875rem", fontWeight: "500" }}>
                                                    {getVisitTypeLabel(visit.visit_type)}
                                                </span>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>Valor: </span>
                                                <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#15803d" }}>
                                                    {formatCurrency(visit.visit_value)}
                                                </span>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>Motivo: </span>
                                                <span style={{ fontSize: "0.875rem" }}>{visit.reason}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", gap: "0.5rem" }}>
                                            <Button
                                                onClick={() => router.push(`/visit-details/nurse/${visit.id}`)}
                                                variant="outline"
                                                style={{ flex: 1, borderColor: "#15803d", color: "#15803d" }}
                                            >
                                                <Info className="h-4 w-4 mr-2" /> Detalhes
                                            </Button>
                                            {visit.status === "CONFIRMED" && (
                                                <Button
                                                    onClick={() => {
                                                        setSelectedVisit(visit)
                                                        setShowConfirmServiceDialog(true)
                                                    }}
                                                    style={{ flex: 1, backgroundColor: "#0891b2", color: "white" }}
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-2" /> Confirmar Serviço
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {pending.length === 0 &&
                    confirmed.length === 0 &&
                    completed.length === 0 &&
                    rejected.length === 0 &&
                    visits_today.length === 0 ? (
                    <EmptyState
                        icon="📅"
                        title="Nenhuma visita encontrada"
                        description="Você ainda não tem visitas registradas no sistema."
                    />
                ) : (
                    <Tabs defaultValue="pending" className="w-full">
                        <TabsList className="grid w-full grid-cols-4 mb-6">
                            <TabsTrigger value="pending" className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Pendentes ({pending.length})
                            </TabsTrigger>
                            <TabsTrigger value="confirmed" className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                Confirmadas ({confirmed.length})
                            </TabsTrigger>
                            <TabsTrigger value="completed" className="flex items-center gap-2">
                                <CheckCheck className="h-4 w-4" />
                                Concluídas ({completed.length})
                            </TabsTrigger>
                            <TabsTrigger value="rejected" className="flex items-center gap-2">
                                <XCircle className="h-4 w-4" />
                                Rejeitadas ({rejected.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="pending">
                            {pending.length === 0 ? (
                                <EmptyState
                                    icon={<Clock className="h-16 w-16 text-amber-500 mx-auto" />}
                                    title="Nada pendente"
                                    description="Sem visitas aguardando confirmação."
                                />
                            ) : (
                                <div style={{ display: "grid", gap: "1.5rem" }}>
                                    {pending.map((visit) => (
                                        <VisitCard key={visit.id} visit={visit} status="PENDING" />
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                        <TabsContent value="confirmed">
                            {confirmed.length === 0 ? (
                                <EmptyState
                                    icon={<CheckCircle className="h-16 w-16 text-green-600 mx-auto" />}
                                    title="Nada confirmado"
                                    description="Sem visitas confirmadas agendadas."
                                />
                            ) : (
                                <div style={{ display: "grid", gap: "1.5rem" }}>
                                    {confirmed.map((visit) => (
                                        <VisitCard key={visit.id} visit={visit} status="CONFIRMED" />
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                        <TabsContent value="completed">
                            {completed.length === 0 ? (
                                <EmptyState
                                    icon={<CheckCheck className="h-16 w-16 text-cyan-600 mx-auto" />}
                                    title="Nada concluído"
                                    description="Sem visitas concluídas ainda."
                                />
                            ) : (
                                <div style={{ display: "grid", gap: "1.5rem" }}>
                                    {completed.map((visit) => (
                                        <VisitCard key={visit.id} visit={visit} status="COMPLETED" />
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                        <TabsContent value="rejected">
                            {rejected.length === 0 ? (
                                <EmptyState
                                    icon={<XCircle className="h-16 w-16 text-red-600 mx-auto" />}
                                    title="Nada rejeitado"
                                    description="Sem visitas rejeitadas."
                                />
                            ) : (
                                <div style={{ display: "grid", gap: "1.5rem" }}>
                                    {rejected.map((visit) => (
                                        <RejectedVisitCard key={visit.id} visit={visit} />
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                )}
            </div>

            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Visita</AlertDialogTitle>
                        <AlertDialogDescription>Confirma que está disponível e aceita esta visita?</AlertDialogDescription>
                    </AlertDialogHeader>
                    {selectedVisit && (
                        <div style={{ display: "grid", gap: "0.5rem", padding: "1rem 0", fontSize: "0.9rem" }}>
                            <p>
                                <strong>Paciente:</strong> {selectedVisit.patient_name}
                            </p>
                            <p>
                                <strong>Data:</strong> {selectedVisit.date}
                            </p>
                            <p>
                                <strong>Valor:</strong> {formatCurrency(selectedVisit.visit_value)}
                            </p>
                        </div>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={actionLoading}>Voltar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmVisitAction}
                            disabled={actionLoading}
                            style={{ backgroundColor: "#15803d" }}
                        >
                            {actionLoading ? "Confirmando..." : "Confirmar Visita"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Rejeitar Visita</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja rejeitar esta visita? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {selectedVisit && (
                        <div style={{ display: "grid", gap: "0.5rem", padding: "1rem 0", fontSize: "0.9rem" }}>
                            <p>
                                <strong>Paciente:</strong> {selectedVisit.patient_name}
                            </p>
                            <p>
                                <strong>Data:</strong> {selectedVisit.date}
                            </p>
                            <p>
                                <strong>Valor:</strong> {formatCurrency(selectedVisit.visit_value)}
                            </p>
                        </div>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={actionLoading}>Voltar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRejectVisit}
                            disabled={actionLoading}
                            style={{ backgroundColor: "#dc2626" }}
                        >
                            {actionLoading ? "Rejeitando..." : "Rejeitar Visita"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog
                open={showCancelDialog}
                onOpenChange={(open) => {
                    if (!open) {
                        setCancelReason("")
                    }
                    setShowCancelDialog(open)
                }}
            >
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Cancelar Visita</DialogTitle>
                        <DialogDescription>Selecione o motivo. A visita voltará a Pendente.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="cancel-reason" className="text-right">
                                Motivo
                            </Label>
                            <Select value={cancelReason} onValueChange={setCancelReason}>
                                <SelectTrigger id="cancel-reason" className="col-span-3">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {cancelationReasons.map((reason) => (
                                        <SelectItem key={reason.value} value={reason.value}>
                                            {reason.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowCancelDialog(false)} disabled={actionLoading}>
                            Voltar
                        </Button>
                        <Button variant="destructive" onClick={handleCancelVisitAction} disabled={actionLoading || !cancelReason}>
                            {actionLoading ? "Cancelando..." : "Confirmar Cancelamento"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={showConfirmServiceDialog}
                onOpenChange={(open) => {
                    if (!open) {
                        setConfirmationCodeInput("")
                        setSelectedVisit(null)
                    }
                    setShowConfirmServiceDialog(open)
                }}
            >
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Confirmar Serviço Realizado</DialogTitle>
                        <DialogDescription>
                            Insira o código de 6 dígitos fornecido pelo paciente para confirmar a conclusão da visita.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="confirmation-code-input" className="text-right">
                                Código
                            </Label>
                            <Input
                                id="confirmation-code-input"
                                value={confirmationCodeInput}
                                onChange={handleCodeInputChange}
                                placeholder="000000"
                                maxLength={6}
                                className="col-span-3 text-center text-lg tracking-[0.3em]"
                                disabled={confirmingService}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowConfirmServiceDialog(false)} disabled={confirmingService}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleConfirmServiceAction}
                            disabled={confirmingService || confirmationCodeInput.length !== 6}
                            style={{ backgroundColor: "#0891b2", color: "white" }}
                        >
                            {confirmingService ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Confirmando...
                                </>
                            ) : (
                                "Confirmar Serviço"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
