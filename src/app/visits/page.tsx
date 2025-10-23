"use client"

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
import { Clock, CheckCircle, Info, MessageCircle, CheckCheck, Calendar } from "lucide-react"

// ... (Interface Visit e VisitsResponse) ...
interface Visit {
    id: string
    description: string
    reason: string
    visit_type: string
    date: string // Já vem como string formatada
    status: string
    nurse: {
        id: string
        name: string
        specialization: string
        image: string
    }
    created_at: string // Já vem como string formatada
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

    useEffect(() => {
        // ... (fetchVisits permanece o mesmo) ...
        const fetchVisits = async () => {
            try {
                setLoading(true)
                const token = localStorage.getItem("token")

                if (!token) {
                    router.push("/login")
                    return
                }

                const response = await fetch("http://localhost:8081/api/v1/user/visits", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                })

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

    // --- MUDANÇA: Função 'formatDate' removida ---
    // A data já vem formatada do backend (ex: "23/10/2025 14:00")
    // const formatDate = (dateString: string) => {
    //   const date = new Date(dateString) // <-- ISSO CAUSA O ERRO "Invalid Date"
    //   return date.toLocaleDateString("pt-BR", {
    //     day: "2-digit",
    //     month: "2-digit",
    //     year: "numeric",
    //     hour: "2-digit",
    //     minute: "2-digit",
    //   })
    // }
    // --- FIM DA MUDANÇA ---

    const getStatusColor = (status: string) => {
        // ... (função permanece a mesma)
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
        // ... (função permanece a mesma)
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
        // ... (função permanece a mesma)
        switch (type.toLowerCase()) {
            case "domiciliar":
                return "Domiciliar"
            case "hospitalar":
                return "Hospitalar"
            case "clinica":
                return "Clínica"
            default:
                return type
        }
    }

    const pendingVisits = visits.filter((visit) => visit.status === "PENDING")
    const confirmedVisits = visits.filter((visit) => visit.status === "CONFIRMED")
    const completedVisits = visits.filter((visit) => visit.status === "COMPLETED")

    const VisitCard = ({ visit, status }: { visit: Visit; status: string }) => (
        <Card key={visit.id} style={{ overflow: "hidden" }}>
            <CardContent style={{ padding: "1.5rem" }}>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "auto 1fr auto",
                        gap: "1.5rem",
                        alignItems: "start",
                    }}
                >
                    {/* ... (Imagem da Enfermeira) ... */}
                    <div>
                        <img
                            src={
                                visit.nurse?.image
                                    ? `http://localhost:8081/api/v1/user/file/${visit.nurse.image}`
                                    : "/nurse-profile.jpg"
                            }
                            alt={visit.nurse?.name || "Enfermeiro"}
                            style={{
                                width: "80px",
                                height: "80px",
                                borderRadius: "50%",
                                objectFit: "cover",
                            }}
                        />
                    </div>

                    {/* Visit Details */}
                    <div>
                        {/* ... (Nome e Badge) ... */}
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
                                {/* --- MUDANÇA: Usando a string 'visit.date' diretamente --- */}
                                <span style={{ marginLeft: "0.5rem", fontWeight: "500" }}>{visit.date}</span>
                            </div>
                            <div>
                                <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>🏥 Tipo:</span>
                                <span style={{ marginLeft: "0.5rem", fontWeight: "500" }}>{getVisitTypeLabel(visit.visit_type)}</span>
                            </div>
                        </div>
                        {/* ... (Motivo e Descrição) ... */}
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

                    {/* ... (Botões de Ação) ... */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {status === "PENDING" && (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSelectedVisit(visit)
                                    setShowDetailsDialog(true)
                                }}
                                style={{ borderColor: "#f59e0b", color: "#f59e0b" }}
                            >
                                <Info className="h-4 w-4 mr-2" />
                                Ver Detalhes
                            </Button>
                        )}

                        {status === "CONFIRMED" && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => router.push(`/nurse/${visit.nurse?.id}`)}
                                    style={{ borderColor: "#15803d", color: "#15803d" }}
                                >
                                    Ver Perfil
                                </Button>
                                <Button
                                    onClick={() => {
                                        setSelectedVisit(visit)
                                        setShowCompletionDialog(true)
                                    }}
                                    style={{ backgroundColor: "#15803d", color: "white" }}
                                >
                                    <CheckCheck className="h-4 w-4 mr-2" />
                                    Confirmar Conclusão
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => handleOpenChat(visit.nurse?.id)}
                                    style={{ borderColor: "#0891b2", color: "#0891b2" }}
                                >
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    Chat
                                </Button>
                            </>
                        )}

                        {status === "COMPLETED" && (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSelectedVisit(visit)
                                    setShowDetailsDialog(true)
                                }}
                                style={{ borderColor: "#0891b2", color: "#0891b2" }}
                            >
                                <Info className="h-4 w-4 mr-2" />
                                Ver Detalhes
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )

    // ... (EmptyState, handleCompleteVisit, handleOpenChat, loading, error...)
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

            const response = await fetch(`http://localhost:8081/api/v1/user/visit/${selectedVisit.id}/complete`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                throw new Error("Erro ao concluir visita")
            }

            const visitsResponse = await fetch("http://localhost:8081/api/v1/user/visits", {
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

    const handleOpenChat = (nurseId: string) => {
        router.push(`/chat/${nurseId}`)
    }

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
                    <Button onClick={() => router.back()} style={{ marginTop: "1rem" }}>
                        Voltar
                    </Button>
                </div>
            </div>
        )
    }


    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
            <Header />

            <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem" }}>
                {/* ... (Header da Página) ... */}
                <div style={{ marginBottom: "2rem" }}>
                    <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#1f2937", marginBottom: "0.5rem" }}>
                        Minhas Visitas
                    </h1>
                    <p style={{ color: "#6b7280" }}>Acompanhe todas as suas consultas agendadas</p>
                </div>


                {/* Card "Visitas de Hoje" */}
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
                                        {/* ... (Info Enfermeira) ... */}
                                        <div style={{ display: "flex", alignItems: "start", gap: "1rem", marginBottom: "1rem" }}>
                                            <img
                                                src={
                                                    visit.nurse?.image
                                                        ? `http://localhost:8081/api/v1/user/file/${visit.nurse.image}`
                                                        : "/nurse-profile.jpg"
                                                }
                                                alt={visit.nurse?.name || "Enfermeiro"}
                                                style={{
                                                    width: "60px",
                                                    height: "60px",
                                                    borderRadius: "50%",
                                                    objectFit: "cover",
                                                }}
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
                                                {/* --- MUDANÇA: Usando a string 'visit.date' diretamente --- */}
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
                                            onClick={() => {
                                                setSelectedVisit(visit)
                                                setShowDetailsDialog(true)
                                            }}
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

                {/* ... (Abas: Pendentes, Confirmadas, Concluídas) ... */}
                {visits.length === 0 ? (
                    // ... (Empty State)
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
                    <Tabs defaultValue="confirmed" className="w-full">
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

                        {/* Abas... */}
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
                                    icon={<CheckCircle className="h-16 w-16 text-cyan-600 mx-auto" />}
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
                            {/* ... (Info Enfermeira) ... */}
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                <img
                                    src={
                                        selectedVisit.nurse?.image
                                            ? `http://localhost:8081/api/v1/user/file/${selectedVisit.nurse.image}`
                                            : "/nurse-profile.jpg"
                                    }
                                    alt={selectedVisit.nurse?.name}
                                    style={{
                                        width: "80px",
                                        height: "80px",
                                        borderRadius: "50%",
                                        objectFit: "cover",
                                    }}
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
                                    {/* --- MUDANÇA: Usando a string 'selectedVisit.date' diretamente --- */}
                                    <p>{selectedVisit.date}</p>
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
                                    {/* --- MUDANÇA: Usando a string 'selectedVisit.created_at' diretamente --- */}
                                    <p>{selectedVisit.created_at}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
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

            {/* ... (AlertDialog para Confirmação) ... */}
            <AlertDialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Conclusão da Visita</AlertDialogTitle>
                        <AlertDialogDescription>
                            Você confirma que o serviço foi realizado com sucesso? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={completingVisit}>Cancelar</AlertDialogCancel>
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

        </div>
    )
}