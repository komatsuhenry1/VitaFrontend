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
import { Clock, CheckCircle, User, MessageCircle } from "lucide-react"

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
}

interface VisitsResponse {
    pending: Visit[]
    confirmed: Visit[]
    completed: Visit[]
}

export default function NurseVisitsPage() {
    const router = useRouter()
    const [visits, setVisits] = useState<VisitsResponse>({
        pending: [],
        confirmed: [],
        completed: [],
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null)
    const [showDialog, setShowDialog] = useState(false)
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [showCancelForm, setShowCancelForm] = useState(false)
    const [cancelReason, setCancelReason] = useState("")
    const [actionLoading, setActionLoading] = useState(false)

    useEffect(() => {
        fetchVisits()
    }, [])

    const fetchVisits = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem("token")
            const response = await fetch(`${API_BASE_URL}/nurse/visits`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                throw new Error("Erro ao carregar visitas")
            }

            const result = await response.json()

            if (result.success && result.data) {
                const normalizedData = {
                    pending: result.data.pending || [],
                    confirmed: result.data.confirmed || [],
                    completed: result.data.completed || [],
                }
                setVisits(normalizedData)
            } else {
                throw new Error(result.message || "Erro ao carregar visitas")
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro desconhecido")
        } finally {
            setLoading(false)
        }
    }

    const handleConfirmVisit = async () => {
        if (!selectedVisit) return

        try {
            setActionLoading(true)
            const token = localStorage.getItem("token")
            const response = await fetch(`${API_BASE_URL}/nurse/visit/${selectedVisit.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ reason: cancelReason }),
            })

            if (!response.ok) {
                throw new Error("Erro ao confirmar visita")
            }

            await fetchVisits()
            setShowConfirmDialog(false)
            setSelectedVisit(null)
        } catch (err) {
            alert(err instanceof Error ? err.message : "Erro ao confirmar visita")
        } finally {
            setActionLoading(false)
        }
    }

    const handleOpenChat = (patientId: string) => {
        router.push(`/chat/${patientId}`)
    }

    const handleCancelVisit = async () => {
        if (!selectedVisit || !cancelReason.trim()) {
            alert("Por favor, selecione o motivo do cancelamento")
            return
        }

        try {
            setActionLoading(true)
            const token = localStorage.getItem("token")
            const response = await fetch(`${API_BASE_URL}/nurse/visit/${selectedVisit.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ reason: cancelReason }),
            })

            if (!response.ok) {
                throw new Error("Erro ao cancelar visita")
            }

            await fetchVisits()
            setShowDialog(false)
            setShowCancelForm(false)
            setSelectedVisit(null)
            setCancelReason("")
        } catch (err) {
            alert(err instanceof Error ? err.message : "Erro ao cancelar visita")
        } finally {
            setActionLoading(false)
        }
    }

    // ================== FUNÇÕES DE DATA CORRIGIDAS ==================
    const parseDateFromAPI = (dateString: string): Date | null => {
        if (!dateString) return null;

        const parts = dateString.match(/(\d{2})\/(\d{2})\/(\d{4})\s(\d{2}):(\d{2})/);

        if (parts) {
            const [, day, month, year, hour, minute] = parts;
            const isoString = `${year}-${month}-${day}T${hour}:${minute}:00`;
            const date = new Date(isoString);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }

        const fallbackDate = new Date(dateString);
        if (!isNaN(fallbackDate.getTime())) {
            return fallbackDate;
        }

        return null;
    };

    const formatDate = (dateString: string) => {
        const date = parseDateFromAPI(dateString);
        if (!date) return "Data inválida";

        return date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatDateLong = (dateString: string) => {
        const date = parseDateFromAPI(dateString);
        if (!date) return "Data inválida";

        return date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    const formatTime = (dateString: string) => {
        const date = parseDateFromAPI(dateString);
        if (!date) return "";

        return date.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };
    // ===============================================================

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value)
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
        if (!type) return "Não informado"
        switch (type.toLowerCase()) {
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
                return type
        }
    }

    const getCancellationDeadline = (visitDate: string) => {
        const visit = parseDateFromAPI(visitDate);
        if (!visit) {
            return "Data de limite indisponível";
        }
        const deadline = new Date(visit.getTime() - 24 * 60 * 60 * 1000)
        return formatDateLong(deadline.toISOString()) + " às " + formatTime(deadline.toISOString())
    }

    const pendingVisits = visits.pending
    const confirmedVisits = visits.confirmed
    const completedVisits = visits.completed

    const VisitCard = ({ visit }: { visit: Visit }) => (
        <Card key={visit.id} style={{ overflow: "hidden" }}>
            <CardContent style={{ padding: "1.5rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "1.5rem", alignItems: "start" }}>
                    <div style={{ width: "80px", height: "80px", borderRadius: "50%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {visit.patient_image_id ? (
                            <img
                                src={`${API_BASE_URL}/user/file/${visit.patient_image_id}`}
                                alt={visit.patient_name || "Paciente"}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                        ) : (
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#15803d", color: "white", fontSize: "2rem", fontWeight: "600" }}>
                                {visit.patient_name ? visit.patient_name.charAt(0).toUpperCase() : "P"}
                            </div>
                        )}
                    </div>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
                            <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#1f2937" }}>
                                {visit.patient_name || "Paciente não especificado"}
                            </h3>
                            <Badge style={{ backgroundColor: getStatusColor(visit.status) }}>{getStatusLabel(visit.status)}</Badge>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem", marginBottom: "0.75rem" }}>
                            <div>
                                <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>📅 Data:</span>
                                <span style={{ marginLeft: "0.5rem", fontWeight: "500" }}>{formatDate(visit.date)}</span>
                            </div>
                            <div>
                                <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>🏥 Tipo:</span>
                                <span style={{ marginLeft: "0.5rem", fontWeight: "500" }}>
                                    {getVisitTypeLabel(visit.visit_type)}
                                </span>
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
                        <Button variant="outline" onClick={() => { setSelectedVisit(visit); setShowDialog(true); setShowCancelForm(false); }} style={{ borderColor: "#15803d", color: "#15803d" }} >
                            <User className="h-4 w-4 mr-2" />
                            Ver Detalhes
                        </Button>
                        {visit.status === "PENDING" && (
                            <Button onClick={() => { setSelectedVisit(visit); setShowConfirmDialog(true); }} style={{ backgroundColor: "#15803d", color: "white" }} >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Confirmar Visita
                            </Button>
                        )}
                        {visit.status === "CONFIRMED" && (
                            <>
                                <Button variant="destructive" onClick={() => { setSelectedVisit(visit); setShowDialog(true); setShowCancelForm(true); }} >
                                    Cancelar Visita
                                </Button>
                                <Button variant="outline" onClick={() => handleOpenChat(visit.patient_id)} style={{ borderColor: "#0891b2", color: "#0891b2" }} >
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    Chat
                                </Button>
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

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
                <Header />
                <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem", textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                        <div style={{ color: "#15803d", fontSize: "1.125rem" }}>Carregando suas visitas...</div>
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

                <Tabs defaultValue="pending" className="w-full">
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
                            <CheckCircle className="h-4 w-4" />
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
                                    <VisitCard key={visit.id} visit={visit} />
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
                                    <VisitCard key={visit.id} visit={visit} />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="completed">
                        {completedVisits.length === 0 ? (
                            <EmptyState
                                icon={<CheckCircle className="h-16 w-16 text-cyan-600 mx-auto" />}
                                title="Nenhuma visita concluída"
                                description="Você ainda não tem visitas concluídas."
                            />
                        ) : (
                            <div style={{ display: "grid", gap: "1.5rem" }}>
                                {completedVisits.map((visit) => (
                                    <VisitCard key={visit.id} visit={visit} />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            {/* Details Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Detalhes da Visita</DialogTitle>
                        <DialogDescription>Informações completas sobre a visita agendada</DialogDescription>
                    </DialogHeader>

                    {selectedVisit && (
                        <div style={{ display: "grid", gap: "1.5rem" }}>
                            <div style={{ display: "grid", gap: "1rem" }}>
                                <div>
                                    <span style={{ fontWeight: "600", color: "#6b7280" }}>Paciente:</span>
                                    <p style={{ fontSize: "1.125rem", fontWeight: "600" }}>{selectedVisit.patient_name}</p>
                                </div>

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
                                    <span style={{ fontWeight: "600", color: "#6b7280" }}>Valor da Visita:</span>
                                    <p style={{ color: "#15803d", fontWeight: "600", fontSize: "1.125rem" }}>
                                        {formatCurrency(selectedVisit.visit_value)}
                                    </p>
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

                                {selectedVisit.status === "CONFIRMED" && (
                                    <div style={{ backgroundColor: "#fef3c7", border: "1px solid #fbbf24", borderRadius: "0.5rem", padding: "1rem", }} >
                                        <p style={{ fontSize: "0.875rem", fontWeight: "600", color: "#92400e", marginBottom: "0.25rem" }} > Prazo para Cancelamento </p>
                                        <p style={{ fontSize: "0.875rem", color: "#78350f" }}> Até {getCancellationDeadline(selectedVisit.date)} </p>
                                    </div>
                                )}
                            </div>

                            {showCancelForm && (
                                <div style={{ display: "grid", gap: "0.75rem", borderTop: "1px solid #e5e7eb", paddingTop: "1rem" }}>
                                    <Label htmlFor="cancelReason">Motivo do Cancelamento *</Label>
                                    <Select value={cancelReason} onValueChange={setCancelReason}>
                                        <SelectTrigger id="cancelReason">
                                            <SelectValue placeholder="Selecione o motivo do cancelamento" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Conflito de horário">Conflito de horário</SelectItem>
                                            <SelectItem value="Paciente indisponível">Paciente indisponível</SelectItem>
                                            <SelectItem value="Emergência pessoal">Emergência pessoal</SelectItem>
                                            <SelectItem value="Condições climáticas adversas">Condições climáticas adversas</SelectItem>
                                            <SelectItem value="Problemas de saúde do enfermeiro">Problemas de saúde do enfermeiro</SelectItem>
                                            <SelectItem value="Outro motivo">Outro motivo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => { if (selectedVisit?.patient_id) { router.push(`/patient-profile/${selectedVisit.patient_id}`) } }} disabled={!selectedVisit?.patient_id} >
                            Ver Perfil do Paciente
                        </Button>

                        {showCancelForm && (
                            <>
                                <Button variant="outline" onClick={() => setShowCancelForm(false)}>
                                    Voltar
                                </Button>
                                <Button variant="destructive" onClick={handleCancelVisit} disabled={actionLoading || !cancelReason.trim()} >
                                    {actionLoading ? "Cancelando..." : "Confirmar Cancelamento"}
                                </Button>
                            </>
                        )}

                        {!showCancelForm && (
                            <Button variant="outline" onClick={() => setShowDialog(false)}>
                                Fechar
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialog */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar Visita</DialogTitle>
                        <DialogDescription>Tem certeza que deseja confirmar esta visita?</DialogDescription>
                    </DialogHeader>

                    {selectedVisit && (
                        <div style={{ display: "grid", gap: "1rem", padding: "1rem 0" }}>
                            <div>
                                <span style={{ fontWeight: "600", color: "#6b7280" }}>Paciente:</span>
                                <p style={{ fontSize: "1.125rem", fontWeight: "600" }}>{selectedVisit.patient_name}</p>
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
                                <span style={{ fontWeight: "600", color: "#6b7280" }}>Valor:</span>
                                <p style={{ color: "#15803d", fontWeight: "600" }}>{formatCurrency(selectedVisit.visit_value)}</p>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={actionLoading}>
                            Cancelar
                        </Button>
                        <Button onClick={handleConfirmVisit} disabled={actionLoading} style={{ backgroundColor: "#15803d", color: "white" }}>
                            {actionLoading ? "Confirmando..." : "Confirmar Visita"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}