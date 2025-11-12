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
import {
    Loader2,
    User,
    CheckCircle,
    XCircle,
    MessageCircle,
    Info,
    Calendar,
    Clock,
    CheckCheck,
    Star,
} from "lucide-react"
import { toast } from "sonner"
import { Footer } from "@/components/Footer"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api/v1"

// --- Interfaces ---

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
    rating: number
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

// --- Constantes e Utilitários ---

const cancelationReasons = [
    { value: "emergencia_pessoal", label: "Emergência Pessoal" },
    { value: "conflito_agenda", label: "Conflito de Agenda" },
    { value: "paciente_solicitou", label: "Paciente Solicitou" },
    { value: "outro", label: "Outro" },
]

const reviewCommentOptions = [
    "Excelente atendimento, muito atenciosa!",
    "Profissional muito competente e cuidadoso",
    // ... (opções omitidas por brevidade)
]

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

/**
 * Retorna a variante de cor correta do Badge com base no status.
 */
const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
        case "PENDING":
            return "secondary"
        case "CONFIRMED":
            return "default"
        case "COMPLETED":
            return "outline"
        case "REJECTED":
            return "destructive"
        default:
            return "secondary"
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

// --- Componente Principal ---

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

    const [showReviewDialog, setShowReviewDialog] = useState(false)
    const [reviewVisit, setReviewVisit] = useState<Visit | null>(null)
    const [rating, setRating] = useState(0)
    const [comment, setComment] = useState("")
    const [submittingReview, setSubmittingReview] = useState(false)

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

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

    const handleSubmitReview = async () => {
        if (!reviewVisit || rating === 0) {
            toast.error("Por favor, selecione uma avaliação de 1 a 5 estrelas")
            return
        }

        try {
            setSubmittingReview(true)
            const token = localStorage.getItem("token")

            const response = await fetch(`${API_BASE_URL}/nurse/review/${reviewVisit.id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    rating,
                    comment: comment.trim() || undefined,
                }),
            })

            if (!response.ok) {
                throw new Error("Erro ao enviar avaliação")
            }

            toast.success("Avaliação enviada com sucesso!")
            setShowReviewDialog(false)
            setReviewVisit(null)
            setRating(0)
            setComment("")

            // Refresh visits to update rating
            await fetchVisits()
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erro ao enviar avaliação")
        } finally {
            setSubmittingReview(false)
        }
    }

    const { pending, confirmed, completed, rejected, visits_today } = visitsData

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="flex justify-center items-center min-h-[60vh]">
                    <div className="text-center space-y-2">
                        <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
                        <p className="text-muted-foreground">Carregando visitas...</p>
                    </div>
                </div>
            </div>
        )
    }
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
                    <h1 className="text-destructive mb-4 text-xl font-semibold">{error}</h1>
                    <Button onClick={fetchVisits}>Tentar Novamente</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Minhas Visitas</h1>
                    <p className="text-muted-foreground">Gerencie suas visitas agendadas</p>
                </div>

                {visits_today.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <Calendar className="h-5 w-5 text-primary" />
                            <h2 className="text-2xl font-semibold text-foreground">Visitas de Hoje</h2>
                            <Badge variant="default">{visits_today.length}</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {visits_today.map((visit) => (
                                <Card
                                    key={visit.id}
                                    className="border-2 border-primary/20 bg-primary/5 hover:shadow-lg transition-shadow"
                                >
                                    <CardContent className="p-6">
                                        <div className="flex items-start gap-4 mb-4">
                                            <img
                                                src={
                                                    visit.patient_image_id
                                                        ? `${API_BASE_URL}/user/file/${visit.patient_image_id}`
                                                        : "/patient-placeholder.jpg"
                                                }
                                                alt={visit.patient_name || "Paciente"}
                                                className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/20 bg-gray-200"
                                                onError={(e) => {
                                                    e.currentTarget.onerror = null
                                                    e.currentTarget.src = "/patient-placeholder.jpg"
                                                }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-foreground truncate mb-1">
                                                    {visit.patient_name}
                                                </h3>
                                                <Badge variant={getStatusVariant(visit.status)}>
                                                    {getStatusLabel(visit.status)}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="space-y-2 mb-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">{visit.date}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Tipo: </span>
                                                <span className="font-medium">{getVisitTypeLabel(visit.visit_type)}</span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Valor: </span>
                                                <span className="font-semibold text-primary">
                                                    {formatCurrency(visit.visit_value)}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-muted-foreground">Motivo: </span>
                                                <span className="text-foreground">{visit.reason}</span>
                                            </div>
                                        </div>
                                        {/* 👇 ALTERAÇÃO AQUI (Visitas de Hoje) */}
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => router.push(`/visit-details/nurse/${visit.id}`)}
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 relative justify-center" // Alinhamento
                                            >
                                                <Info className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2" />{" "}
                                                Detalhes
                                            </Button>
                                            {visit.status === "CONFIRMED" && (
                                                <Button
                                                    onClick={() => {
                                                        setSelectedVisit(visit)
                                                        setShowConfirmServiceDialog(true)
                                                    }}
                                                    size="sm"
                                                    className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white relative"
                                                >
                                                    <CheckCircle className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2" />{" "}
                                                    Confirmar
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
                        icon={<Calendar className="h-16 w-16 text-muted-foreground" />}
                        title="Nenhuma visita encontrada"
                        description="Você ainda não tem visitas registradas no sistema."
                    />
                ) : (
                    <Tabs defaultValue="pending" className="w-full">
                        <TabsList className="grid w-full grid-cols-4 mb-6 h-auto">
                            <TabsTrigger value="pending" className="flex items-center gap-2 py-3">
                                <Clock className="h-4 w-4" />
                                Pendentes <Badge variant="outline" className="ml-1">{pending.length}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="confirmed" className="flex items-center gap-2 py-3">
                                <CheckCircle className="h-4 w-4" />
                                Confirmadas <Badge variant="outline" className="ml-1">{confirmed.length}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="completed" className="flex items-center gap-2 py-3">
                                <CheckCheck className="h-4 w-4" />
                                Concluídas <Badge variant="outline" className="ml-1">{completed.length}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="rejected" className="flex items-center gap-2 py-3">
                                <XCircle className="h-4 w-4" />
                                Rejeitadas <Badge variant="outline" className="ml-1">{rejected.length}</Badge>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="pending" className="space-y-6">
                            {pending.length === 0 ? (
                                <EmptyState
                                    icon={<Clock className="h-16 w-16 text-amber-500" />}
                                    title="Nada pendente"
                                    description="Sem visitas aguardando confirmação."
                                />
                            ) : (
                                pending.map((visit) => (
                                    <VisitCard
                                        key={visit.id}
                                        visit={visit}
                                        status="PENDING"
                                        router={router}
                                        onConfirm={() => {
                                            setSelectedVisit(visit)
                                            setShowConfirmDialog(true)
                                        }}
                                        onReject={() => {
                                            setSelectedVisit(visit)
                                            setShowRejectDialog(true)
                                        }}
                                    />
                                ))
                            )}
                        </TabsContent>
                        <TabsContent value="confirmed" className="space-y-6">
                            {confirmed.length === 0 ? (
                                <EmptyState
                                    icon={<CheckCircle className="h-16 w-16 text-primary" />}
                                    title="Nada confirmado"
                                    description="Sem visitas confirmadas agendadas."
                                />
                            ) : (
                                confirmed.map((visit) => (
                                    <VisitCard
                                        key={visit.id}
                                        visit={visit}
                                        status="CONFIRMED"
                                        router={router}
                                        onCancel={() => {
                                            setSelectedVisit(visit)
                                            setShowCancelDialog(true)
                                        }}
                                        onConfirmService={() => {
                                            setSelectedVisit(visit)
                                            setShowConfirmServiceDialog(true)
                                        }}
                                    />
                                ))
                            )}
                        </TabsContent>
                        <TabsContent value="completed" className="space-y-6">
                            {completed.length === 0 ? (
                                <EmptyState
                                    icon={<CheckCheck className="h-16 w-16 text-cyan-600" />}
                                    title="Nada concluído"
                                    description="Sem visitas concluídas ainda."
                                />
                            ) : (
                                completed.map((visit) => (
                                    <VisitCard
                                        key={visit.id}
                                        visit={visit}
                                        status="COMPLETED"
                                        router={router}
                                        onAddReview={() => {
                                            setReviewVisit(visit)
                                            setRating(0)
                                            setComment("")
                                            setShowReviewDialog(true)
                                        }}
                                    />
                                ))
                            )}
                        </TabsContent>
                        <TabsContent value="rejected" className="space-y-6">
                            {rejected.length === 0 ? (
                                <EmptyState
                                    icon={<XCircle className="h-16 w-16 text-destructive" />}
                                    title="Nada rejeitado"
                                    description="Sem visitas rejeitadas."
                                />
                            ) : (
                                rejected.map((visit) => (
                                    <RejectedVisitCard
                                        key={visit.id}
                                        visit={visit}
                                        router={router}
                                        onConfirmRejected={() => handleConfirmRejectedVisit(visit)}
                                        actionLoading={actionLoading}
                                    />
                                ))
                            )}
                        </TabsContent>
                    </Tabs>
                )}
            </div>

            {/* --- Diálogos --- */}

            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Visita</AlertDialogTitle>
                        <AlertDialogDescription>Confirma que está disponível e aceita esta visita?</AlertDialogDescription>
                    </AlertDialogHeader>
                    {selectedVisit && (
                        <div className="space-y-1 py-4 text-sm">
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
                        <AlertDialogAction onClick={handleConfirmVisitAction} disabled={actionLoading}>
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
                        <div className="space-y-1 py-4 text-sm">
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
                        >
                            {actionLoading ? "Rejeitando..." : "Rejeitar Visita"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog
                open={showCancelDialog}
                onOpenChange={(open) => {
                    if (!open) setCancelReason("")
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
                        <Button variant="outline" onClick={() => setShowCancelDialog(false)} disabled={actionLoading}>
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
                        <Button variant="outline" onClick={() => setShowConfirmServiceDialog(false)} disabled={confirmingService}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleConfirmServiceAction}
                            disabled={confirmingService || confirmationCodeInput.length !== 6}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white"
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

            <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Avaliar Paciente</DialogTitle>
                        <DialogDescription>Como foi sua experiência com {reviewVisit?.patient_name}?</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Star Rating */}
                        <div>
                            <Label className="text-sm font-semibold mb-3 block text-center">Avaliação *</Label>
                            <div className="flex gap-2 justify-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary rounded-full p-1"
                                    >
                                        <Star
                                            className="h-10 w-10"
                                            fill={star <= rating ? "hsl(var(--warning))" : "transparent"}
                                            strokeWidth={1.5}
                                        />
                                    </button>
                                ))}
                            </div>
                            <p className="text-center mt-3 text-sm font-medium text-muted-foreground">
                                {rating === 0 && "Selecione uma avaliação"}
                                {rating === 1 && "Muito Ruim"}
                                {rating === 2 && "Ruim"}
                                {rating === 3 && "Regular"}
                                {rating === 4 && "Bom"}
                                {rating === 5 && "Excelente"}
                            </p>
                        </div>

                        {/* Comment */}
                        <div>
                            <Label className="text-sm font-semibold mb-2 block">Comentário (opcional)</Label>
                            <Select value={comment} onValueChange={setComment}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um comentário..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {reviewCommentOptions.map((option, index) => (
                                        <SelectItem key={index} value={option}>
                                            {option}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowReviewDialog(false)
                                setReviewVisit(null)
                                setRating(0)
                                setComment("")
                            }}
                            disabled={submittingReview}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSubmitReview}
                            disabled={submittingReview || rating === 0}
                            className="bg-amber-500 hover:bg-amber-600 text-white"
                        >
                            {submittingReview ? "Enviando..." : "Enviar Avaliação"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Footer />
        </div>
    )
}

// --- Componentes de Card (Movidos para fora) ---

interface VisitCardProps {
    visit: Visit
    status: string
    router: ReturnType<typeof useRouter>
    onConfirm?: () => void
    onReject?: () => void
    onCancel?: () => void
    onConfirmService?: () => void
    onAddReview?: () => void
}

const VisitCard = ({
    visit,
    status,
    router,
    onConfirm,
    onReject,
    onCancel,
    onConfirmService,
    onAddReview,
}: VisitCardProps) => {
    const patientImageUrl = visit.patient_image_id
        ? `${API_BASE_URL}/user/file/${visit.patient_image_id}`
        : "/patient-placeholder.jpg"

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-6">
                    {/* Patient Info */}
                    <div className="flex items-start gap-4 flex-1">
                        <img
                            src={patientImageUrl}
                            alt={visit.patient_name || "Paciente"}
                            className="w-20 h-20 rounded-full object-cover ring-2 ring-border bg-gray-200"
                            onError={(e) => {
                                e.currentTarget.onerror = null
                                e.currentTarget.src = "/patient-placeholder.jpg"
                            }}
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="font-semibold text-lg text-foreground">{visit.patient_name || "Paciente"}</h3>
                                <Badge variant={getStatusVariant(visit.status)}>{getStatusLabel(visit.status)}</Badge>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm mb-3">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <span className="font-medium">{visit.date}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Info className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <span>{getVisitTypeLabel(visit.visit_type)}</span>
                                </div>
                            </div>

                            <div className="text-sm font-semibold text-primary mb-3">{formatCurrency(visit.visit_value)}</div>

                            <div className="mt-1 space-y-2 text-sm">
                                <div>
                                    <span className="font-semibold text-muted-foreground">Motivo: </span>
                                    <span>{visit.reason}</span>
                                </div>
                                {visit.description && (
                                    <div>
                                        <span className="font-semibold text-muted-foreground">Descrição: </span>
                                        <span>{visit.description}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    {/* 👇 ALTERAÇÃO: Aplicado layout 'relative' + 'absolute' */}
                    <div className="flex flex-col gap-2 sm:w-48">
                        <Button
                            onClick={() => router.push(`/patient-profile/${visit.patient_id}`)}
                            variant="outline"
                            size="sm"
                            className="relative justify-center pl-6" // <-- adiciona espaço pro texto
                        >
                            {/* Ícone posicionado absolutamente */}
                            <User className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2" />
                            Ver Paciente
                        </Button>

                        <Button
                            onClick={() => router.push(`/chat/${visit.patient_id}`)}
                            variant="outline"
                            size="sm"
                            className="relative justify-center" // <-- adiciona espaço pro texto
                        >
                            <MessageCircle className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2" />
                            Chat
                        </Button>

                        <Button
                            onClick={() => router.push(`/visit-details/nurse/${visit.id}`)}
                            variant="outline"
                            size="sm"
                            className="relative justify-center" // Texto centralizado
                        >
                            <Info className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2" />
                            Detalhes
                        </Button>

                        {status === "PENDING" && (
                            <>
                                <Button onClick={onConfirm} variant="default" size="sm" className="relative">
                                    <CheckCircle className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2" />
                                    Confirmar
                                </Button>
                                <Button onClick={onReject} variant="destructive" size="sm" className="relative">
                                    <XCircle className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2" />
                                    Rejeitar
                                </Button>
                            </>
                        )}

                        {status === "CONFIRMED" && (
                            <>
                                <Button onClick={onCancel} variant="destructive" size="sm" className="relative">
                                    <XCircle className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2" />
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={onConfirmService}
                                    size="sm"
                                    className="bg-cyan-600 hover:bg-cyan-700 text-white relative"
                                >
                                    <CheckCircle className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2" />{" "}
                                    Confirmar Serviço
                                </Button>
                            </>
                        )}

                        {status === "COMPLETED" && (
                            <>
                                {visit.rating > 0 ? (
                                    <div className="flex flex-col items-center gap-2 p-3 border rounded-md bg-muted/30">
                                        <span className="text-xs font-semibold text-muted-foreground">Sua Avaliação</span>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className="h-4 w-4"
                                                    fill={star <= visit.rating ? "hsl(var(--warning))" : "transparent"}
                                                    strokeWidth={1.5}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        onClick={onAddReview}
                                        size="sm"
                                        className="bg-amber-500 hover:bg-amber-600 text-white relative"
                                    >
                                        <Star className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2" />
                                        Avaliar Paciente
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

interface RejectedVisitCardProps {
    visit: Visit
    router: ReturnType<typeof useRouter>
    onConfirmRejected: () => void
    actionLoading: boolean
}

const RejectedVisitCard = ({ visit, router, onConfirmRejected, actionLoading }: RejectedVisitCardProps) => {
    const patientImageUrl = visit.patient_image_id
        ? `${API_BASE_URL}/user/file/${visit.patient_image_id}`
        : "/patient-placeholder.jpg"

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-6">
                    {/* Patient Info */}
                    <div className="flex items-start gap-4 flex-1">
                        <img
                            src={patientImageUrl}
                            alt={visit.patient_name || "Paciente"}
                            className="w-20 h-20 rounded-full object-cover ring-2 ring-border bg-gray-200"
                            onError={(e) => {
                                e.currentTarget.onerror = null
                                e.currentTarget.src = "/patient-placeholder.jpg"
                            }}
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="font-semibold text-lg text-foreground">{visit.patient_name || "Paciente"}</h3>
                                <Badge variant={getStatusVariant(visit.status)}>{getStatusLabel(visit.status)}</Badge>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm mb-3">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <span className="font-medium">{visit.date}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Info className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <span>{getVisitTypeLabel(visit.visit_type)}</span>
                                </div>
                            </div>
                            <div className="text-sm font-semibold text-primary mb-3">{formatCurrency(visit.visit_value)}</div>
                            <div className="mt-1 space-y-2 text-sm">
                                <div>
                                    <span className="font-semibold text-muted-foreground">Motivo: </span>
                                    <span>{visit.reason}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    {/* 👇 ALTERAÇÃO: Aplicado layout 'relative' + 'absolute' */}
                    <div className="flex flex-col gap-2 sm:w-48">
                        <Button
                            onClick={() => router.push(`/visit-details/nurse/${visit.id}`)}
                            variant="outline"
                            size="sm"
                            className="relative justify-center"
                        >
                            <Info className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2" />
                            Ver Detalhes
                        </Button>
                        <Button
                            onClick={onConfirmRejected}
                            disabled={actionLoading}
                            variant="default"
                            size="sm"
                            className="relative"
                        >
                            <CheckCircle className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2" />
                            Confirmar Mesmo Assim
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

// --- Componente EmptyState (Movido para fora) ---
interface EmptyStateProps {
    icon: React.ReactNode
    title: string
    description: string
}

const EmptyState = ({ icon, title, description }: EmptyStateProps) => (
    <Card>
        <CardContent className="p-12 text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
                {icon}
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">{title}</h2>
            <p className="text-muted-foreground max-w-md mx-auto">{description}</p>
        </CardContent>
    </Card>
)