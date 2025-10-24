"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/Header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// --- MUDANÇA: Re-adicionar Dialog, Select e Label ---
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
import { Clock, CheckCircle, User, Info, MessageCircle, CheckCheck, Calendar, XCircle } from "lucide-react"
import { toast } from "sonner"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api/v1"

// ... (Interfaces Visit, VisitsResponseData, ApiResponse) ...
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

interface VisitsResponseData {
    pending: Visit[]
    confirmed: Visit[]
    completed: Visit[]
    visits_today: Visit[]
}

interface ApiResponse {
    data: VisitsResponseData
    message: string
    success: boolean
}

// --- MUDANÇA: Definir as opções de cancelamento em um local ---
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
        visits_today: [],
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null)
    // --- MUDANÇA: Remover estados do Dialog de Detalhes ---
    // const [showDetailsDialog, setShowDetailsDialog] = useState(false)

    // --- MUDANÇA: Reverter para estados separados para cada Dialog ---
    const [showConfirmDialog, setShowConfirmDialog] = useState(false) // Para o AlertDialog de Confirmação
    const [showCancelDialog, setShowCancelDialog] = useState(false) // Para o Dialog de Cancelamento

    // --- MUDANÇA: Novo estado para o motivo do cancelamento ---
    const [cancelReason, setCancelReason] = useState("")

    const [actionLoading, setActionLoading] = useState(false)
    // --- MUDANÇA: Remover actionType, pois teremos handlers separados ---
    // const [actionType, setActionType] = useState<"confirm" | "cancel" | null>(null)


    // ... (fetchVisits, formatCurrency, getStatusColor, getStatusLabel, getVisitTypeLabel) ...
    const fetchVisits = async () => {
        try {
            // setLoading(true) // Loading já é true inicialmente
            setError(null) // Limpa erros anteriores
            const token = localStorage.getItem("token")
            if (!token) {
                router.push("/login") // Redireciona se não houver token
                return
            }
            const response = await fetch(`${API_BASE_URL}/nurse/visits`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({})) // Tenta pegar corpo do erro
                throw new Error(errorData.message || `Erro ${response.status}: Falha ao carregar visitas`)
            }

            const result: ApiResponse = await response.json()

            if (result.success && result.data) {
                // Normaliza os status (backend já faz isso, mas garantimos)
                // e garante que arrays vazios sejam tratados corretamente
                setVisitsData({
                    pending: (result.data.pending || []).map((visit) => ({ ...visit, status: "PENDING" })),
                    confirmed: (result.data.confirmed || []).map((visit) => ({ ...visit, status: "CONFIRMED" })),
                    completed: (result.data.completed || []).map((visit) => ({ ...visit, status: "COMPLETED" })),
                    visits_today: result.data.visits_today || [],
                })
            } else {
                throw new Error(result.message || "Erro ao processar dados das visitas")
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro desconhecido ao carregar visitas")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchVisits()
    }, [router]) // Adicionado router como dependência por causa do push

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value)
    }

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
        switch (type?.toLowerCase()) { // Adicionado '?' para segurança
            case "domiciliar": return "Domiciliar";
            case "hospitalar": return "Hospitalar";
            case "clinica": return "Clínica";
            case "consulta": return "Consulta"; // Adicionado
            case "emergencia": return "Emergência"; // Adicionado
            default: return type || "N/A";
        }
    }

    // --- MUDANÇA: Este handler volta a ser apenas para CONFIRMAR ---
    const handleConfirmVisitAction = async () => {
        if (!selectedVisit) return

        try {
            setActionLoading(true)
            const token = localStorage.getItem("token")
            const response = await fetch(`${API_BASE_URL}/nurse/visit/${selectedVisit.id}`, {
                method: "PATCH", // Sem body
                headers: { "Authorization": `Bearer ${token}` },
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Erro ao confirmar visita");
            }

            await fetchVisits()
            setShowConfirmDialog(false) // Fecha o dialog de confirmação
            setSelectedVisit(null)
            toast.success("Visita confirmada com sucesso!")
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erro ao confirmar visita")
        } finally {
            setActionLoading(false)
        }
    }

    // --- MUDANÇA: Novo handler específico para CANCELAR com motivo ---
    const handleCancelVisitAction = async () => {
        if (!selectedVisit) return;

        // Validação do motivo
        if (!cancelReason) {
            toast.error("Por favor, selecione um motivo para o cancelamento.");
            return;
        }

        try {
            setActionLoading(true);
            const token = localStorage.getItem("token");

            // Prepara o body da requisição
            const body = JSON.stringify({ reason: cancelReason });

            const response = await fetch(`${API_BASE_URL}/nurse/visit/${selectedVisit.id}`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json" // Importante
                },
                body: body, // Envia o motivo
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Erro ao cancelar visita");
            }

            await fetchVisits();
            setShowCancelDialog(false); // Fecha o dialog de cancelamento
            setSelectedVisit(null);
            setCancelReason(""); // Limpa o estado do motivo
            toast.success("Visita cancelada com sucesso!");

        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erro ao cancelar visita");
        } finally {
            setActionLoading(false);
        }
    }

    const { pending, confirmed, completed, visits_today } = visitsData

    const VisitCard = ({ visit, status }: { visit: Visit; status: string }) => {
        const patientImageUrl = visit.patient_image_id
            ? `${API_BASE_URL}/user/file/${visit.patient_image_id}`
            : "/patient-placeholder.jpg"

        return (
            <Card key={visit.id} style={{ overflow: "hidden" }}>
                <CardContent style={{ padding: "1.5rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "1.5rem", alignItems: "start" }}>
                        {/* Patient Image */}
                        <div>
                            <img
                                src={patientImageUrl}
                                alt={visit.patient_name || "Paciente"}
                                style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", backgroundColor: "#e5e7eb" }}
                                onError={(e) => (e.currentTarget.src = "/patient-placeholder.jpg")}
                            />
                        </div>

                        {/* Visit Details */}
                        <div>
                            {/* ... (Detalhes da visita) ... */}
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
                                <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#1f2937" }}>
                                    {visit.patient_name || "Paciente não especificado"}
                                </h3>
                                <Badge style={{ backgroundColor: getStatusColor(visit.status) }}>{getStatusLabel(visit.status)}</Badge>
                            </div>

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

                        {/* Action Buttons */}
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
                                <Button
                                    onClick={() => {
                                        setSelectedVisit(visit)
                                        // --- MUDANÇA: Volta a chamar o dialog de confirmação ---
                                        setShowConfirmDialog(true)
                                    }}
                                    style={{ backgroundColor: "#15803d", color: "white" }}
                                >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Confirmar Visita
                                </Button>
                            )}

                            {/* --- MUDANÇA: Botão Cancelar agora chama o dialog de CANCELAMENTO --- */}
                            {status === "CONFIRMED" && (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedVisit(visit)
                                        // --- MUDANÇA: Chama o novo dialog ---
                                        setShowCancelDialog(true)
                                    }}
                                    style={{ borderColor: "#dc2626", color: "#dc2626" }} // Vermelho para cancelar
                                >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Cancelar Visita
                                </Button>
                            )}

                            <Button
                                variant="outline"
                                onClick={() => router.push(`/chat?selected=${visit.patient_id}`)}
                                style={{ borderColor: "#0891b2", color: "#0891b2" }}
                            >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Chat
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => router.push(`/visit-details/${visit.id}`)} // Navega para a nova página
                                style={{ borderColor: "#6b7280", color: "#6b7280" }}
                            >
                                <Info className="h-4 w-4 mr-2" />
                                Ver Detalhes
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    // ... (EmptyState, Loading, Error JSX) ...
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
                    <Button onClick={fetchVisits} style={{ marginTop: "1rem" }}> {/* Botão Tentar Novamente */}
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
                    <p style={{ color: "#6b7280" }}>Gerencie suas visitas agendadas</p>
                </div>

                {/* Seção "Visitas de Hoje" (Sem alterações) */}
                {visits_today.length > 0 && (
                    <div style={{ marginBottom: "2rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                            <Calendar className="h-5 w-5" style={{ color: "#15803d" }} />
                            <h2 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#1f2937" }}>Visitas de Hoje</h2>
                            <Badge style={{ backgroundColor: "#15803d", color: "white" }}>{visits_today.length}</Badge>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1rem" }}>
                            {visits_today.map((visit) => (
                                <Card key={visit.id} style={{ overflow: "hidden", border: "2px solid #15803d", backgroundColor: "#f0fdf4" }}>
                                    <CardContent style={{ padding: "1.5rem" }}>
                                        {/* Info Paciente */}
                                        <div style={{ display: "flex", alignItems: "start", gap: "1rem", marginBottom: "1rem" }}>
                                            <img
                                                src={visit.patient_image_id ? `${API_BASE_URL}/user/file/${visit.patient_image_id}` : "/patient-placeholder.jpg"}
                                                alt={visit.patient_name || "Paciente"}
                                                style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover", backgroundColor: "#e5e7eb" }}
                                                onError={(e) => (e.currentTarget.src = "/patient-placeholder.jpg")}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#1f2937", marginBottom: "0.25rem" }}>
                                                    {visit.patient_name || "Paciente não especificado"}
                                                </h3>
                                            </div>
                                            <Badge style={{ backgroundColor: getStatusColor(visit.status) }}>
                                                {getStatusLabel(visit.status)}
                                            </Badge>
                                        </div>
                                        {/* Detalhes Visita */}
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
                                                <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>Valor: </span>
                                                <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#15803d" }}>{formatCurrency(visit.visit_value)}</span>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>Motivo: </span>
                                                <span style={{ fontSize: "0.875rem" }}>{visit.reason}</span>
                                            </div>
                                        </div>
                                        {/* Botão Detalhes */}
                                        <Button
                                            onClick={() => router.push(`/visit-details/nurse/${visit.id}`)} // Navega
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

                {/* Abas (Sem alterações) */}
                {(pending.length === 0 && confirmed.length === 0 && completed.length === 0 && visits_today.length === 0) ? (
                    <EmptyState icon="📅" title="Nenhuma visita encontrada" description="Você ainda não tem visitas registradas no sistema." />
                ) : (
                    <Tabs defaultValue="pending" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-6">
                            {/* ... (TabsTrigger) ... */}
                            <TabsTrigger value="pending" className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Pendentes ({pending.length})
                            </TabsTrigger>
                            <TabsTrigger value="confirmed" className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                Confirmadas ({confirmed.length})
                            </TabsTrigger>
                            <TabsTrigger value="completed" className="flex items-center gap-2">
                                <CheckCheck className="h-4 w-4" /> {/* Ícone diferente */}
                                Concluídas ({completed.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="pending">
                            {pending.length === 0 ? (
                                <EmptyState icon={<Clock className="h-16 w-16 text-amber-500 mx-auto" />} title="Nenhuma visita pendente" description="Você não tem visitas aguardando sua confirmação." />
                            ) : (
                                <div style={{ display: "grid", gap: "1.5rem" }}>
                                    {pending.map((visit) => <VisitCard key={visit.id} visit={visit} status="PENDING" />)}
                                </div>
                            )}
                        </TabsContent>
                        <TabsContent value="confirmed">
                            {confirmed.length === 0 ? (
                                <EmptyState icon={<CheckCircle className="h-16 w-16 text-green-600 mx-auto" />} title="Nenhuma visita confirmada" description="Você não tem visitas confirmadas agendadas." />
                            ) : (
                                <div style={{ display: "grid", gap: "1.5rem" }}>
                                    {confirmed.map((visit) => <VisitCard key={visit.id} visit={visit} status="CONFIRMED" />)}
                                </div>
                            )}
                        </TabsContent>
                        <TabsContent value="completed">
                            {completed.length === 0 ? (
                                <EmptyState icon={<CheckCheck className="h-16 w-16 text-cyan-600 mx-auto" />} title="Nenhuma visita concluída" description="Você ainda não concluiu nenhuma visita." />
                            ) : (
                                <div style={{ display: "grid", gap: "1.5rem" }}>
                                    {completed.map((visit) => <VisitCard key={visit.id} visit={visit} status="COMPLETED" />)}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                )}
            </div>

            {/* --- MUDANÇA: Dialog de Detalhes REMOVIDO --- */}
            {/* <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}> ... </Dialog> */}

            {/* --- MUDANÇA: AlertDialog volta a ser apenas para CONFIRMAR --- */}
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Visita</AlertDialogTitle>
                        <AlertDialogDescription>
                            Você confirma que está disponível e aceita esta visita?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {selectedVisit && (
                        <div style={{ display: "grid", gap: "0.5rem", padding: "1rem 0", fontSize: "0.9rem" }}>
                            <p><strong>Paciente:</strong> {selectedVisit.patient_name}</p>
                            <p><strong>Data:</strong> {selectedVisit.date}</p>
                            <p><strong>Valor:</strong> {formatCurrency(selectedVisit.visit_value)}</p>
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

            {/* --- MUDANÇA: NOVO Dialog para CANCELAR com motivo --- */}
            <Dialog open={showCancelDialog} onOpenChange={(open) => {
                if (!open) {
                    setCancelReason("") // Limpa o motivo ao fechar
                }
                setShowCancelDialog(open)
            }}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Cancelar Visita</DialogTitle>
                        <DialogDescription>
                            Selecione o motivo do cancelamento. A visita retornará ao status "Pendente".
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="cancel-reason" className="text-right">
                                Motivo
                            </Label>
                            <Select
                                value={cancelReason}
                                onValueChange={setCancelReason}
                            >
                                <SelectTrigger id="cancel-reason" className="col-span-3">
                                    <SelectValue placeholder="Selecione um motivo..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {cancelationReasons.map(reason => (
                                        <SelectItem key={reason.value} value={reason.value}>
                                            {reason.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setShowCancelDialog(false)}
                            disabled={actionLoading}
                        >
                            Voltar
                        </Button>
                        <Button
                            variant="destructive" // Cor vermelha para ação destrutiva
                            onClick={handleCancelVisitAction}
                            disabled={actionLoading || !cancelReason} // Desabilita se estiver carregando OU sem motivo
                        >
                            {actionLoading ? "Cancelando..." : "Confirmar Cancelamento"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    )
}