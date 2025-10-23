"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// --- MUDANÇA: Remover imports do Dialog de Detalhes ---
// import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api/v1"

// ... (Interface Visit e VisitsResponse) ...
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
    const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null) // Mantido para confirmação
    // --- MUDANÇA: Remover estado do Dialog de Detalhes ---
    // const [showDetailsDialog, setShowDetailsDialog] = useState(false)
    const [showCompletionDialog, setShowCompletionDialog] = useState(false)
    const [completingVisit, setCompletingVisit] = useState(false)

    // ... (useEffect fetchVisits) ...
    useEffect(() => {
        const fetchVisits = async () => {
            try {
                setLoading(true)
                const token = localStorage.getItem("token")

                if (!token) {
                    router.push("/login")
                    return
                }
                
                console.log("Fetching visits from:", `${API_BASE_URL}/user/visits`); // LOG 1: Verifica a URL
                const response = await fetch(`${API_BASE_URL}/user/visits`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                })

                console.log("Response status:", response.status); // LOG 2: Verifica o status

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


    // ... (getStatusColor, getStatusLabel, getVisitTypeLabel) ...
    const getStatusColor = (status: string) => {
        switch (status) {
            case "PENDING": return "#f59e0b";
            case "CONFIRMED": return "#15803d";
            case "COMPLETED": return "#0891b2";
            default: return "#6b7280";
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case "PENDING": return "Pendente";
            case "CONFIRMED": return "Confirmada";
            case "COMPLETED": return "Concluída";
            default: return status;
        }
    }

    const getVisitTypeLabel = (type: string) => {
        switch (type?.toLowerCase()) {
            case "domiciliar": return "Domiciliar";
            case "hospitalar": return "Hospitalar";
            case "clinica": return "Clínica";
            default: return type || 'N/A';
        }
    }


    const pendingVisits = visits.filter((visit) => visit.status === "PENDING")
    const confirmedVisits = visits.filter((visit) => visit.status === "CONFIRMED")
    const completedVisits = visits.filter((visit) => visit.status === "COMPLETED")

    const VisitCard = ({ visit, status }: { visit: Visit; status: string }) => (
        <Card key={visit.id} style={{ overflow: "hidden" }}>
            <CardContent style={{ padding: "1.5rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "1.5rem", alignItems: "start" }}>
                    {/* ... (Imagem da Enfermeira) ... */}
                    <div>
                        <img
                            src={visit.nurse?.image ? `${API_BASE_URL}/user/file/${visit.nurse.image}` : "/nurse-profile.jpg"}
                            alt={visit.nurse?.name || "Enfermeiro"}
                            style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover" }}
                            onError={(e) => (e.currentTarget.src = "/nurse-profile.jpg")} // Fallback
                        />
                    </div>

                    {/* Visit Details */}
                    <div>
                        {/* ... (Nome, Badge, Especialização, Data, Tipo, Motivo, Descrição) ... */}
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
                            <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#1f2937" }}>
                                {visit.nurse?.name || "Enfermeiro não especificado"}
                            </h3>
                            <Badge style={{ backgroundColor: getStatusColor(visit.status) }}>{getStatusLabel(visit.status)}</Badge>
                        </div>
                        <p style={{ color: "#15803d", fontWeight: "500", marginBottom: "0.75rem" }}>
                            {visit.nurse?.specialization || "Enfermagem"}
                        </p>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem", marginBottom: "0.75rem" }}>
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

                    {/* Action Buttons */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {/* --- MUDANÇA: Botões Ver Detalhes agora navegam --- */}
                        {(status === "PENDING" || status === "COMPLETED") && (
                            <Button
                                variant="outline"
                                onClick={() => router.push(`/visit-details/patient/${visit.id}`)} // Navega
                                style={{
                                    borderColor: status === "PENDING" ? "#f59e0b" : "#0891b2",
                                    color: status === "PENDING" ? "#f59e0b" : "#0891b2"
                                }}
                            >
                                <Info className="h-4 w-4 mr-2" />
                                Ver Detalhes
                            </Button>
                        )}

                        {status === "CONFIRMED" && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => router.push(`/nurse-profile/${visit.nurse?.id}`)} // Ajuste a rota se necessário
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
                                {/* Botão Ver Detalhes para CONFIRMED também navega */}
                                <Button
                                    variant="outline"
                                    onClick={() => router.push(`/visit-details/patient/${visit.id}`)} // Navega
                                    style={{ borderColor: "#6b7280", color: "#6b7280" }} // Cor neutra
                                >
                                    <Info className="h-4 w-4 mr-2" />
                                    Ver Detalhes
                                </Button>
                            </>
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

            const response = await fetch(`${API_BASE_URL}/user/visit/${selectedVisit.id}/complete`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Erro ao concluir visita");
            }
            // Re-fetch visits after completion
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
            } else {
                console.error("Failed to re-fetch visits after completion:", result.message);
            }

            setShowCompletionDialog(false)
            setSelectedVisit(null)
            // Add toast notification for success
            // toast.success("Visita concluída com sucesso!");
        } catch (err) {
            // Use toast for error notification
            // toast.error(err instanceof Error ? err.message : "Erro ao concluir visita");
            alert(err instanceof Error ? err.message : "Erro ao concluir visita") // Fallback alert
        } finally {
            setCompletingVisit(false)
        }
    }

    const handleOpenChat = (nurseId: string | undefined) => { // Make nurseId optional
        if (nurseId) {
            router.push(`/chat?selected=${nurseId}`) // Use query param for chat page
        } else {
            // toast.error("Não foi possível iniciar o chat: ID do enfermeiro não encontrado.");
            alert("Não foi possível iniciar o chat: ID do enfermeiro não encontrado."); // Fallback
        }
    }

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
                <Header />
                <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem", textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                        <div style={{ color: "#15803d", fontSize: "1.125rem" }}>Carregando suas visitas...</div>
                        {/* Consider adding a spinner here */}
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
                    <Button onClick={() => window.location.reload()} style={{ marginTop: "1rem" }}> {/* Reload page on error */}
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
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1rem" }}>
                            {visitsToday.map((visit) => (
                                <Card key={visit.id} style={{ overflow: "hidden", border: "2px solid #15803d", backgroundColor: "#f0fdf4" }}>
                                    <CardContent style={{ padding: "1.5rem" }}>
                                        {/* ... (Info Enfermeira) ... */}
                                        <div style={{ display: "flex", alignItems: "start", gap: "1rem", marginBottom: "1rem" }}>
                                            <img
                                                src={visit.nurse?.image ? `${API_BASE_URL}/user/file/${visit.nurse.image}` : "/nurse-profile.jpg"}
                                                alt={visit.nurse?.name || "Enfermeiro"}
                                                style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover" }}
                                                onError={(e) => (e.currentTarget.src = "/nurse-profile.jpg")}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#1f2937", marginBottom: "0.25rem" }}>
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
                                                <span style={{ fontSize: "0.875rem", fontWeight: "500" }}>{getVisitTypeLabel(visit.visit_type)}</span>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>Motivo: </span>
                                                <span style={{ fontSize: "0.875rem" }}>{visit.reason}</span>
                                            </div>
                                        </div>
                                        {/* --- MUDANÇA: Botão navega --- */}
                                        <Button
                                            onClick={() => router.push(`/visit-details/patient/${visit.id}`)} // Navega
                                            style={{ width: "100%", backgroundColor: "#15803d", color: "white" }}
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

                {/* Abas */}
                {visits.length === 0 && visitsToday.length === 0 ? ( // Verifica visitsToday também
                    // ... (Empty State geral)
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
                    <Tabs defaultValue={confirmedVisits.length > 0 ? "confirmed" : (pendingVisits.length > 0 ? "pending" : "completed")} className="w-full"> {/* Default inteligente */}
                        <TabsList className="grid w-full grid-cols-3 mb-6">
                            {/* ... (TabsTrigger) ... */}
                            <TabsTrigger value="pending" className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Pendentes ({pendingVisits.length})
                            </TabsTrigger>
                            <TabsTrigger value="confirmed" className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                Confirmadas ({confirmedVisits.length})
                            </TabsTrigger>
                            <TabsTrigger value="completed" className="flex items-center gap-2">
                                <CheckCheck className="h-4 w-4" /> {/* Ícone diferente */}
                                Concluídas ({completedVisits.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="pending">
                            {pendingVisits.length === 0 ? (
                                <EmptyState icon={<Clock className="h-16 w-16 text-amber-500 mx-auto" />} title="Nenhuma visita pendente" description="Você não tem visitas aguardando confirmação." />
                            ) : (
                                <div style={{ display: "grid", gap: "1.5rem" }}>
                                    {pendingVisits.map((visit) => <VisitCard key={visit.id} visit={visit} status="PENDING" />)}
                                </div>
                            )}
                        </TabsContent>
                        <TabsContent value="confirmed">
                            {confirmedVisits.length === 0 ? (
                                <EmptyState icon={<CheckCircle className="h-16 w-16 text-green-600 mx-auto" />} title="Nenhuma visita confirmada" description="Você não tem visitas confirmadas no momento." />
                            ) : (
                                <div style={{ display: "grid", gap: "1.5rem" }}>
                                    {confirmedVisits.map((visit) => <VisitCard key={visit.id} visit={visit} status="CONFIRMED" />)}
                                </div>
                            )}
                        </TabsContent>
                        <TabsContent value="completed">
                            {completedVisits.length === 0 ? (
                                <EmptyState icon={<CheckCheck className="h-16 w-16 text-cyan-600 mx-auto" />} title="Nenhuma visita concluída" description="Você ainda não tem visitas concluídas." />
                            ) : (
                                <div style={{ display: "grid", gap: "1.5rem" }}>
                                    {completedVisits.map((visit) => <VisitCard key={visit.id} visit={visit} status="COMPLETED" />)}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                )}
            </div>

            {/* --- MUDANÇA: Dialog de Detalhes REMOVIDO --- */}
            {/* <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}> ... </Dialog> */}

            {/* AlertDialog para Confirmação de Conclusão (Mantido) */}
            <AlertDialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
                {/* ... (Conteúdo do AlertDialog para concluir visita) ... */}
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