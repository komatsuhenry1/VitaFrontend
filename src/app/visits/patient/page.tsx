"use client"

import { AlertDialogAction } from "@/components/ui/alert-dialog"
import { AlertDialogCancel } from "@/components/ui/alert-dialog"
import { AlertDialogFooter } from "@/components/ui/alert-dialog"
import { AlertDialogDescription } from "@/components/ui/alert-dialog"
import { AlertDialogTitle } from "@/components/ui/alert-dialog"
import { AlertDialogHeader } from "@/components/ui/alert-dialog"
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog"
import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { Clock, CheckCircle, Info, MessageCircle, CheckCheck, Calendar, Star } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api/v1"

interface Visit {
    id: string
    description: string
    reason: string
    visit_type: string
    date: string
    status: string
    nurse: {
        id: string
        name: string
        specialization: string
        image: string
    }
    created_at: string
    rating: number // Added rating field
}

interface VisitsResponse {
    data: {
        all_visits: Visit[]
        visits_today: Visit[]
    }
    message: string
    success: boolean
}

export default function VisitsPage() {
    const router = useRouter()
    const [visits, setVisits] = useState<Visit[]>([])
    const [visitsToday, setVisitsToday] = useState<Visit[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null)
    const [showDetailsDialog, setShowDetailsDialog] = useState(false)
    const [showCompletionDialog, setShowCompletionDialog] = useState(false)
    const [completingVisit, setCompletingVisit] = useState(false)

    const [showReviewDialog, setShowReviewDialog] = useState(false)
    const [reviewVisit, setReviewVisit] = useState<Visit | null>(null)
    const [rating, setRating] = useState(0)
    const [comment, setComment] = useState("")
    const [submittingReview, setSubmittingReview] = useState(false)

    useEffect(() => {
        const fetchVisits = async () => {
            try {
                setLoading(true)
                const token = localStorage.getItem("token")

                if (!token) {
                    router.push("/login")
                    return
                }

                console.log("Fetching visits from:", `${API_BASE_URL}/user/visits`)
                const response = await fetch(`${API_BASE_URL}/user/visits`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                })

                console.log("Response status:", response.status)

                if (!response.ok) {
                    throw new Error("Erro ao carregar visitas")
                }

                const result: VisitsResponse = await response.json()

                if (result.success && result.data) {
                    setVisits(result.data.all_visits || [])
                    setVisitsToday(result.data.visits_today || [])
                } else {
                    throw new Error(result.message || "Erro ao carregar visitas")
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Erro desconhecido")
            } finally {
                setLoading(false)
            }
        }

        fetchVisits()
    }, [router])

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
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

    const pendingVisits = visits.filter((visit) => visit.status === "PENDING")
    const confirmedVisits = visits.filter((visit) => visit.status === "CONFIRMED")
    const completedVisits = visits.filter((visit) => visit.status === "COMPLETED")

    const VisitCard = ({ visit, status }: { visit: Visit; status: string }) => (
        <Card key={visit.id} style={{ overflow: "hidden" }}>
            <CardContent style={{ padding: "1.5rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "1.5rem", alignItems: "start" }}>
                    {/* Nurse Image */}
                    <div>
                        <img
                            src={visit.nurse?.image ? `${API_BASE_URL}/user/file/${visit.nurse.image}` : "/nurse-profile.jpg"}
                            alt={visit.nurse?.name || "Enfermeiro"}
                            style={{
                                width: "80px",
                                height: "80px",
                                borderRadius: "50%",
                                objectFit: "cover",
                            }}
                            onError={(e) => (e.currentTarget.src = "/nurse-profile.jpg")}
                        />
                    </div>

                    {/* Visit Details */}
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
                            <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#1f2937" }}>
                                {visit.nurse?.name || "Enfermeiro não especificado"}
                            </h3>
                            <Badge style={{ backgroundColor: getStatusColor(visit.status) }}>{getStatusLabel(visit.status)}</Badge>
                        </div>

                        <p style={{ color: "#15803d", fontWeight: "500", marginBottom: "0.75rem" }}>
                            {visit.nurse?.specialization || "Enfermagem"}
                        </p>

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
                        {(status === "PENDING" || status === "COMPLETED") && (
                            <Button
                                onClick={() => router.push(`/visit-details/patient/${visit.id}`)}
                                style={{
                                    backgroundColor: status === "PENDING" ? "#f59e0b" : "#0891b2",
                                    color: "white",
                                }}
                            >
                                <Info className="h-4 w-4 mr-2" />
                                Ver Detalhes
                            </Button>
                        )}

                        {status === "CONFIRMED" && (
                            <>
                                <Button
                                    onClick={() => router.push(`/nurse-profile/${visit.nurse?.id}`)}
                                    style={{ backgroundColor: "#15803d", color: "white" }}
                                >
                                    Ver Perfil
                                </Button>
                                <Button
                                    onClick={() => handleOpenChat(visit.nurse?.id)}
                                    style={{ backgroundColor: "#0891b2", color: "white" }}
                                >
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    Chat
                                </Button>
                                <Button
                                    onClick={() => router.push(`/visit-details/patient/${visit.id}`)}
                                    style={{ backgroundColor: "#6b7280", color: "white" }}
                                >
                                    <Info className="h-4 w-4 mr-2" />
                                    Ver Detalhes
                                </Button>
                            </>
                        )}

                        {status === "COMPLETED" && (
                            <>
                                {visit.rating > 0 ? (
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                                        <span style={{ fontSize: "0.875rem", color: "#6b7280", fontWeight: "600" }}>Sua Avaliação</span>
                                        <div style={{ display: "flex", gap: "0.25rem" }}>
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className="h-5 w-5"
                                                    style={{
                                                        fill: star <= visit.rating ? "#f59e0b" : "transparent",
                                                        stroke: star <= visit.rating ? "#f59e0b" : "#d1d5db",
                                                        strokeWidth: 2,
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        onClick={() => {
                                            setReviewVisit(visit)
                                            setRating(0)
                                            setComment("")
                                            setShowReviewDialog(true)
                                        }}
                                        style={{ backgroundColor: "#f59e0b", color: "white" }}
                                    >
                                        <Star className="h-4 w-4 mr-2" />
                                        Adicionar Avaliação
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )

    const EmptyState = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
        <Card>
            <CardContent style={{ padding: "3rem", textAlign: "center" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>{icon}</div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#1f2937", marginBottom: "0.5rem" }}>{title}</h2>
                <p style={{ color: "#6b7280" }}>{description}</p>
            </CardContent>
        </Card>
    )

    const handleCompleteVisit = async () => {
        if (!selectedVisit) return

        try {
            setCompletingVisit(true)
            const token = localStorage.getItem("token")

            const response = await fetch(`${API_BASE_URL}/user/visit/${selectedVisit.id}/complete`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                throw new Error("Erro ao concluir visita")
            }

            const visitsResponse = await fetch(`${API_BASE_URL}/user/visits`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            })

            const result: VisitsResponse = await visitsResponse.json()
            if (result.success && result.data) {
                setVisits(result.data.all_visits || [])
                setVisitsToday(result.data.visits_today || [])
            }

            setShowCompletionDialog(false)
            setSelectedVisit(null)
        } catch (err) {
            alert(err instanceof Error ? err.message : "Erro ao concluir visita")
        } finally {
            setCompletingVisit(false)
        }
    }

    const handleOpenChat = (nurseId: string | undefined) => {
        if (nurseId) {
            router.push(`/chat/${nurseId}`)
        } else {
            alert("Não foi possível iniciar o chat: ID do enfermeiro não encontrado.")
        }
    }

    const handleSubmitReview = async () => {
        if (!reviewVisit || rating === 0) {
            alert("Por favor, selecione uma avaliação de 1 a 5 estrelas")
            return
        }

        try {
            setSubmittingReview(true)
            const token = localStorage.getItem("token")

            const response = await fetch(`${API_BASE_URL}/user/review/${reviewVisit.id}`, {
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

            const visitsResponse = await fetch(`${API_BASE_URL}/user/visits`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            })

            const result: VisitsResponse = await visitsResponse.json()
            if (result.success && result.data) {
                setVisits(result.data.all_visits || [])
                setVisitsToday(result.data.visits_today || [])
            }

            toast.success("Avaliação enviada com sucesso!")
            setShowReviewDialog(false)
            setReviewVisit(null)
            setRating(0)
            setComment("")
        } catch (err) {
            alert(err instanceof Error ? err.message : "Erro ao enviar avaliação")
        } finally {
            setSubmittingReview(false)
        }
    }

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
                <Header />
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
                    <div style={{ textAlign: "center" }}>
                        <div
                            style={{
                                width: "40px",
                                height: "40px",
                                border: "4px solid #e5e7eb",
                                borderTop: "4px solid #15803d",
                                borderRadius: "50%",
                                animation: "spin 1s linear infinite",
                                margin: "0 auto 1rem",
                            }}
                        ></div>
                        <p style={{ color: "#6b7280" }}>Carregando visitas...</p>
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
                    <Button
                        onClick={() => window.location.reload()}
                        style={{ marginTop: "1rem", backgroundColor: "#15803d", color: "white" }}
                    >
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
                    <p style={{ color: "#6b7280" }}>Acompanhe todas as suas consultas agendadas</p>
                </div>

                {visitsToday.length > 0 && (
                    <div style={{ marginBottom: "2rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                            <Calendar className="h-5 w-5" style={{ color: "#15803d" }} />
                            <h2 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#1f2937" }}>Visitas de Hoje</h2>
                            <Badge style={{ backgroundColor: "#15803d", color: "white" }}>{visitsToday.length}</Badge>
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
                                gap: "1rem",
                            }}
                        >
                            {visitsToday.map((visit) => (
                                <Card
                                    key={visit.id}
                                    style={{
                                        overflow: "hidden",
                                        border: "2px solid #15803d",
                                        backgroundColor: "#f0fdf4",
                                    }}
                                >
                                    <CardContent style={{ padding: "1.5rem" }}>
                                        <div style={{ display: "flex", alignItems: "start", gap: "1rem", marginBottom: "1rem" }}>
                                            <img
                                                src={
                                                    visit.nurse?.image ? `${API_BASE_URL}/user/file/${visit.nurse.image}` : "/nurse-profile.jpg"
                                                }
                                                alt={visit.nurse?.name || "Enfermeiro"}
                                                style={{
                                                    width: "60px",
                                                    height: "60px",
                                                    borderRadius: "50%",
                                                    objectFit: "cover",
                                                }}
                                                onError={(e) => (e.currentTarget.src = "/nurse-profile.jpg")}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <h3
                                                    style={{ fontSize: "1.125rem", fontWeight: "600", color: "#1f2937", marginBottom: "0.25rem" }}
                                                >
                                                    {visit.nurse?.name || "Enfermeiro não especificado"}
                                                </h3>
                                                <p style={{ color: "#15803d", fontWeight: "500", fontSize: "0.875rem" }}>
                                                    {visit.nurse?.specialization || "Enfermagem"}
                                                </p>
                                            </div>
                                            <Badge style={{ backgroundColor: getStatusColor(visit.status) }}>
                                                {getStatusLabel(visit.status)}
                                            </Badge>
                                        </div>

                                        <div style={{ display: "grid", gap: "0.5rem", marginBottom: "1rem" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                <Clock className="h-4 w-4" style={{ color: "#6b7280" }} />
                                                <span style={{ fontSize: "0.875rem", fontWeight: "500" }}>{visit.date}</span>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>Tipo: </span>
                                                <span style={{ fontSize: "0.875rem", fontWeight: "500" }}>
                                                    {getVisitTypeLabel(visit.visit_type)}
                                                </span>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>Motivo: </span>
                                                <span style={{ fontSize: "0.875rem" }}>{visit.reason}</span>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={() => router.push(`/visit-details/patient/${visit.id}`)}
                                            style={{
                                                width: "100%",
                                                backgroundColor: "#15803d",
                                                color: "white",
                                            }}
                                        >
                                            <Info className="h-4 w-4 mr-2" />
                                            Ver Detalhes da Visita
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {visits.length === 0 && visitsToday.length === 0 ? (
                    <Card>
                        <CardContent style={{ padding: "3rem", textAlign: "center" }}>
                            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📅</div>
                            <h2 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#1f2937", marginBottom: "0.5rem" }}>
                                Nenhuma visita agendada
                            </h2>
                            <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
                                Você ainda não tem visitas agendadas. Encontre um enfermeiro e agende sua primeira consulta!
                            </p>
                            <Button onClick={() => router.push("/")} style={{ backgroundColor: "#15803d", color: "white" }}>
                                Buscar Enfermeiros
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Tabs
                        defaultValue={confirmedVisits.length > 0 ? "pending" : pendingVisits.length > 0 ? "pending" : "completed"}
                        className="w-full"
                    >
                        <TabsList className="grid w-full grid-cols-3 mb-6">
                            <TabsTrigger value="pending" className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Pendentes ({pendingVisits.length})
                            </TabsTrigger>
                            <TabsTrigger value="confirmed" className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                Confirmadas ({confirmedVisits.length})
                            </TabsTrigger>
                            <TabsTrigger value="completed" className="flex items-center gap-2">
                                <CheckCheck className="h-4 w-4" />
                                Concluídas ({completedVisits.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="pending">
                            {pendingVisits.length === 0 ? (
                                <EmptyState
                                    icon={<Clock className="h-16 w-16 text-amber-500 mx-auto" />}
                                    title="Nenhuma visita pendente"
                                    description="Você não tem visitas aguardando confirmação."
                                />
                            ) : (
                                <div style={{ display: "grid", gap: "1.5rem" }}>
                                    {pendingVisits.map((visit) => (
                                        <VisitCard key={visit.id} visit={visit} status="PENDING" />
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="confirmed">
                            {confirmedVisits.length === 0 ? (
                                <EmptyState
                                    icon={<CheckCircle className="h-16 w-16 text-green-600 mx-auto" />}
                                    title="Nenhuma visita confirmada"
                                    description="Você não tem visitas confirmadas no momento."
                                />
                            ) : (
                                <div style={{ display: "grid", gap: "1.5rem" }}>
                                    {confirmedVisits.map((visit) => (
                                        <VisitCard key={visit.id} visit={visit} status="CONFIRMED" />
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="completed">
                            {completedVisits.length === 0 ? (
                                <EmptyState
                                    icon={<CheckCheck className="h-16 w-16 text-cyan-600 mx-auto" />}
                                    title="Nenhuma visita concluída"
                                    description="Você ainda não tem visitas concluídas."
                                />
                            ) : (
                                <div style={{ display: "grid", gap: "1.5rem" }}>
                                    {completedVisits.map((visit) => (
                                        <VisitCard key={visit.id} visit={visit} status="COMPLETED" />
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                )}
            </div>

            {/* Details Dialog */}
            <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Detalhes da Visita</DialogTitle>
                        <DialogDescription>Informações completas sobre a visita agendada</DialogDescription>
                    </DialogHeader>

                    {selectedVisit && (
                        <div style={{ display: "grid", gap: "1.5rem" }}>
                            {/* Nurse Info */}
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                <img
                                    src={
                                        selectedVisit.nurse?.image
                                            ? `${API_BASE_URL}/user/file/${selectedVisit.nurse.image}`
                                            : "/nurse-profile.jpg"
                                    }
                                    alt={selectedVisit.nurse?.name}
                                    style={{
                                        width: "80px",
                                        height: "80px",
                                        borderRadius: "50%",
                                        objectFit: "cover",
                                    }}
                                    onError={(e) => (e.currentTarget.src = "/nurse-profile.jpg")}
                                />
                                <div>
                                    <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.25rem" }}>
                                        {selectedVisit.nurse?.name}
                                    </h3>
                                    <p style={{ color: "#15803d", fontWeight: "500" }}>{selectedVisit.nurse?.specialization}</p>
                                </div>
                            </div>

                            {/* Visit Details */}
                            <div style={{ display: "grid", gap: "1rem" }}>
                                <div>
                                    <span style={{ fontWeight: "600", color: "#6b7280" }}>Status:</span>
                                    <Badge style={{ backgroundColor: getStatusColor(selectedVisit.status), marginLeft: "0.5rem" }}>
                                        {getStatusLabel(selectedVisit.status)}
                                    </Badge>
                                </div>

                                <div>
                                    <span style={{ fontWeight: "600", color: "#6b7280" }}>Data e Hora:</span>
                                    <p>{formatDate(selectedVisit.date)}</p>
                                </div>

                                <div>
                                    <span style={{ fontWeight: "600", color: "#6b7280" }}>Tipo de Visita:</span>
                                    <p>{getVisitTypeLabel(selectedVisit.visit_type)}</p>
                                </div>

                                <div>
                                    <span style={{ fontWeight: "600", color: "#6b7280" }}>Motivo:</span>
                                    <p>{selectedVisit.reason}</p>
                                </div>

                                {selectedVisit.description && (
                                    <div>
                                        <span style={{ fontWeight: "600", color: "#6b7280" }}>Descrição:</span>
                                        <p>{selectedVisit.description}</p>
                                    </div>
                                )}

                                <div>
                                    <span style={{ fontWeight: "600", color: "#6b7280" }}>Agendado em:</span>
                                    <p>{formatDate(selectedVisit.created_at)}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button onClick={() => setShowDetailsDialog(false)} style={{ backgroundColor: "#6b7280", color: "white" }}>
                            Fechar
                        </Button>
                        {selectedVisit && (
                            <Button
                                onClick={() => {
                                    setShowDetailsDialog(false)
                                    router.push(`/nurse/${selectedVisit.nurse?.id}`)
                                }}
                                style={{ backgroundColor: "#15803d", color: "white" }}
                            >
                                Ver Perfil do Enfermeiro
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Completion Confirmation Dialog */}
            <AlertDialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Conclusão da Visita</AlertDialogTitle>
                        <AlertDialogDescription>
                            Você confirma que o serviço foi realizado com sucesso? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={completingVisit} style={{ backgroundColor: "#6b7280", color: "white" }}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCompleteVisit}
                            disabled={completingVisit}
                            style={{ backgroundColor: "#15803d" }}
                        >
                            {completingVisit ? "Confirmando..." : "Confirmar Conclusão"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Avaliar Atendimento</DialogTitle>
                        <DialogDescription>Como foi sua experiência com {reviewVisit?.nurse?.name}?</DialogDescription>
                    </DialogHeader>

                    <div style={{ display: "grid", gap: "1.5rem", padding: "1rem 0" }}>
                        {/* Star Rating */}
                        <div>
                            <label style={{ fontWeight: "600", color: "#1f2937", marginBottom: "0.5rem", display: "block" }}>
                                Avaliação *
                            </label>
                            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            cursor: "pointer",
                                            padding: "0.25rem",
                                            transition: "transform 0.2s",
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
                                        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                                    >
                                        <Star
                                            className="h-8 w-8"
                                            style={{
                                                fill: star <= rating ? "#f59e0b" : "transparent",
                                                stroke: star <= rating ? "#f59e0b" : "#d1d5db",
                                                strokeWidth: 2,
                                            }}
                                        />
                                    </button>
                                ))}
                            </div>
                            <p style={{ textAlign: "center", marginTop: "0.5rem", color: "#6b7280", fontSize: "0.875rem" }}>
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
                            <label style={{ fontWeight: "600", color: "#1f2937", marginBottom: "0.5rem", display: "block" }}>
                                Comentário (opcional)
                            </label>
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
                            onClick={() => {
                                setShowReviewDialog(false)
                                setReviewVisit(null)
                                setRating(0)
                                setComment("")
                            }}
                            disabled={submittingReview}
                            style={{ backgroundColor: "#6b7280", color: "white" }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSubmitReview}
                            disabled={submittingReview || rating === 0}
                            style={{ backgroundColor: "#f59e0b", color: "white" }}
                        >
                            {submittingReview ? "Enviando..." : "Enviar Avaliação"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

const reviewCommentOptions = [
    // Boas
    "Excelente atendimento, muito atenciosa!",
    "Profissional muito competente e cuidadoso",
    "Atendimento pontual e eficiente",
    "Muito educado e prestativo",
    "Recomendo o serviço",
    "Atendimento dentro do esperado",
    "Profissional dedicado e atencioso",
    "Ótima experiência, voltarei a solicitar",
    "Serviço de qualidade, muito satisfeito",
    "Cuidado excepcional com o paciente",

    // Médias
    "O atendimento foi bom, mas poderia ter sido mais ágil",
    "Cumpriu o básico, nada de especial",
    "Profissional simpático, mas parecia um pouco apressado",
    "O serviço foi ok, mas faltou um pouco mais de atenção",
    "Boa comunicação, mas atrasou um pouco para chegar",
    "Atendimento razoável, esperava um pouco mais de cuidado",
    "Profissional competente, mas o serviço poderia ser mais detalhado",

    // Ruins
    "O atendimento deixou a desejar, pouco atencioso",
    "Houve atraso e falta de comunicação",
    "Não seguiu todas as orientações solicitadas",
    "Parecia com pressa e não explicou o procedimento direito",
    "Experiência abaixo do esperado",
    "Não fiquei satisfeito com o atendimento recebido",
    "Faltou empatia durante o atendimento",
    "Profissional pouco preparado para a situação",
    "Serviço demorado e pouco eficiente",
    "Atendimento ruim, não recomendo",
]
