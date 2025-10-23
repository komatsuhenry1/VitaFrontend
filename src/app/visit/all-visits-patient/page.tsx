"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
// --- MUDANÇA: Remover import do next/image se não for mais usado globalmente ---
// import Image from "next/image" 
import { Header } from "@/components/Header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card" // Added CardHeader, CardTitle
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
// --- MUDANÇA: Importar AlertDialog ---
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
// --- MUDANÇA: Importar ícones como na página do paciente ---
import { Clock, CheckCircle, User, Info, MessageCircle, CheckCheck, Calendar } from "lucide-react"

// --- MUDANÇA: Definir API_BASE_URL consistentemente ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api/v1"

interface Visit {
    id: string // ID should be string based on API response
    description: string
    reason: string
    visit_type: string
    created_at: string // Já vem formatado
    date: string       // Já vem formatado
    status: string
    patient_name: string
    patient_id: string
    patient_image_id?: string
    nurse_name: string // Mantido caso necessário, mas não exibido no card principal
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


export default function NurseVisitsPage() {
    const router = useRouter()
    // --- MUDANÇA: Simplificar estado inicial ---
    const [visitsData, setVisitsData] = useState<VisitsResponseData>({
        pending: [],
        confirmed: [],
        completed: [],
        visits_today: [],
    })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null)
    const [showDetailsDialog, setShowDetailsDialog] = useState(false) // Renomeado para clareza
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [showCancelForm, setShowCancelForm] = useState(false) // Flag para mostrar form dentro do Details Dialog
    const [cancelReason, setCancelReason] = useState("")
    const [actionLoading, setActionLoading] = useState(false)

    // A função fetchVisits agora busca os dados e os coloca no estado visitsData
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

    // --- MUDANÇA: Remover funções de formatação de data ---
    // formatDate, formatDateLong, formatTime, getCancellationDeadline

    // Função para formatar moeda permanece útil
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value)
    }

    // Funções de Status e Tipo permanecem as mesmas
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


    // Lógica de confirmação e cancelamento (ajustada para usar AlertDialog)
    const handleConfirmVisitAction = async () => { // Renomeado para evitar conflito
        if (!selectedVisit) return

        try {
            setActionLoading(true)
            const token = localStorage.getItem("token")
            // Endpoint para CONFIRMAR
            const response = await fetch(`${API_BASE_URL}/nurse/visit/${selectedVisit.id}/confirm`, {
                method: "PUT", // Usar PUT ou PATCH conforme sua API
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                // Body geralmente não é necessário para confirmar, mas depende da sua API
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Erro ao confirmar visita");
            }

            await fetchVisits() // Recarrega a lista
            setShowConfirmDialog(false)
            setSelectedVisit(null)
        } catch (err) {
            alert(err instanceof Error ? err.message : "Erro ao confirmar visita") // Usar toast se preferir
        } finally {
            setActionLoading(false)
        }
    }

    const handleCancelVisitAction = async () => { // Renomeado para evitar conflito
        if (!selectedVisit || !cancelReason.trim()) {
            alert("Por favor, selecione o motivo do cancelamento") // Usar toast se preferir
            return
        }

        try {
            setActionLoading(true)
            const token = localStorage.getItem("token")
            // Endpoint para CANCELAR
            const response = await fetch(`${API_BASE_URL}/nurse/visit/${selectedVisit.id}/cancel`, {
                method: "PUT", // Usar PUT ou PATCH conforme sua API
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ reason: cancelReason }), // Envia o motivo
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Erro ao cancelar visita");
            }

            await fetchVisits() // Recarrega a lista
            setShowDetailsDialog(false) // Fecha o dialog de detalhes onde o form está
            setShowCancelForm(false)
            setSelectedVisit(null)
            setCancelReason("")
        } catch (err) {
            alert(err instanceof Error ? err.message : "Erro ao cancelar visita") // Usar toast se preferir
        } finally {
            setActionLoading(false)
        }
    }


    const { pending, confirmed, completed, visits_today } = visitsData

    // --- MUDANÇA: VisitCard agora é interno e adaptado para enfermeiro ---
    const VisitCard = ({ visit, status }: { visit: Visit; status: string }) => {
        // --- MUDANÇA: Lógica de imagem padronizada ---
        const patientImageUrl = visit.patient_image_id
            ? `${API_BASE_URL}/user/file/${visit.patient_image_id}`
            : "/patient-placeholder.jpg" // Use um placeholder padrão

        return (
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
                        {/* Patient Image */}
                        <div>
                            {/* --- MUDANÇA: Usando <img> padrão --- */}
                            <img
                                src={patientImageUrl}
                                alt={visit.patient_name || "Paciente"}
                                style={{
                                    width: "80px",
                                    height: "80px",
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                    backgroundColor: "#e5e7eb", // Cor de fundo caso a imagem falhe
                                }}
                                // Adiciona um fallback simples caso a imagem principal falhe
                                onError={(e) => (e.currentTarget.src = "/patient-placeholder.jpg")}
                            />
                        </div>

                        {/* Visit Details */}
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
                                <h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#1f2937" }}>
                                    {visit.patient_name || "Paciente não especificado"}
                                </h3>
                                <Badge style={{ backgroundColor: getStatusColor(visit.status) }}>{getStatusLabel(visit.status)}</Badge>
                            </div>

                            {/* Removido especialização (é do enfermeiro, não do paciente) */}

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
                                    {/* --- MUDANÇA: Usando string direto --- */}
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
                                onClick={() => router.push(`/patient-profile/${visit.patient_id}`)} // Rota para perfil do paciente
                                style={{ borderColor: "#15803d", color: "#15803d" }}
                            >
                                <User className="h-4 w-4 mr-2" />
                                Ver Paciente
                            </Button>

                            {status === "PENDING" && (
                                <Button
                                    onClick={() => {
                                        setSelectedVisit(visit)
                                        setShowConfirmDialog(true)
                                    }}
                                    style={{ backgroundColor: "#15803d", color: "white" }}
                                >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Confirmar Visita
                                </Button>
                            )}

                            {/* Botão de Cancelar agora é mostrado no Dialog de Detalhes */}
                            {/* Botão Chat (se aplicável para enfermeiro) */}
                            <Button
                                variant="outline"
                                onClick={() => router.push(`/chat?selected=${visit.patient_id}`)} // Ajuste a rota do chat se necessário
                                style={{ borderColor: "#0891b2", color: "#0891b2" }}
                            >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Chat
                            </Button>

                            {/* Botão genérico de detalhes */}
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSelectedVisit(visit);
                                    setShowDetailsDialog(true);
                                    // Decide se mostra o form de cancelamento baseado no status
                                    setShowCancelForm(status === "CONFIRMED");
                                }}
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
    // --- FIM DA MUDANÇA ---

    // --- MUDANÇA: EmptyState copiado da página do paciente ---
    const EmptyState = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
        <Card>
            <CardContent style={{ padding: "3rem", textAlign: "center" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>{icon}</div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#1f2937", marginBottom: "0.5rem" }}>{title}</h2>
                <p style={{ color: "#6b7280" }}>{description}</p>
            </CardContent>
        </Card>
    )
    // --- FIM DA MUDANÇA ---


    if (loading) {
        // ... (Loading state igual ao da página do paciente)
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
        // ... (Error state igual ao da página do paciente)
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

            {/* --- MUDANÇA: Layout principal igual ao da página do paciente --- */}
            <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem" }}>
                <div style={{ marginBottom: "2rem" }}>
                    <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#1f2937", marginBottom: "0.5rem" }}>
                        Minhas Visitas
                    </h1>
                    <p style={{ color: "#6b7280" }}>Gerencie suas visitas agendadas</p>
                </div>

                {/* Seção "Visitas de Hoje" */}
                {visits_today.length > 0 && (
                    <div style={{ marginBottom: "2rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                            <Calendar className="h-5 w-5" style={{ color: "#15803d" }} />
                            <h2 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#1f2937" }}>Visitas de Hoje</h2>
                            <Badge style={{ backgroundColor: "#15803d", color: "white" }}>{visits_today.length}</Badge>
                        </div>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
                                gap: "1rem",
                            }}
                        >
                            {visits_today.map((visit) => (
                                // Usando um card simplificado para "Visitas de Hoje" como no paciente
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
                                                src={visit.patient_image_id ? `${API_BASE_URL}/user/file/${visit.patient_image_id}` : "/patient-placeholder.jpg"}
                                                alt={visit.patient_name || "Paciente"}
                                                style={{
                                                    width: "60px",
                                                    height: "60px",
                                                    borderRadius: "50%",
                                                    objectFit: "cover",
                                                    backgroundColor: "#e5e7eb",
                                                }}
                                                onError={(e) => (e.currentTarget.src = "/patient-placeholder.jpg")}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#1f2937", marginBottom: "0.25rem" }}>
                                                    {visit.patient_name || "Paciente não especificado"}
                                                </h3>
                                                {/* Pode adicionar info extra aqui se quiser */}
                                            </div>
                                            <Badge style={{ backgroundColor: getStatusColor(visit.status) }}>
                                                {getStatusLabel(visit.status)}
                                            </Badge>
                                        </div>
                                        <div style={{ display: "grid", gap: "0.5rem", marginBottom: "1rem" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                <Clock className="h-4 w-4" style={{ color: "#6b7280" }} />
                                                <span style={{ fontSize: "0.875rem", fontWeight: "500" }}>{visit.date}</span> {/* Usa string */}
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
                                        <Button
                                            onClick={() => {
                                                setSelectedVisit(visit);
                                                setShowDetailsDialog(true);
                                                setShowCancelForm(visit.status === "CONFIRMED"); // Mostra cancel no detalhe se confirmado
                                            }}
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
                {(pending.length === 0 && confirmed.length === 0 && completed.length === 0) ? (
                    <Card>
                        <CardContent style={{ padding: "3rem", textAlign: "center" }}>
                            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📅</div>
                            <h2 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#1f2937", marginBottom: "0.5rem" }}>
                                Nenhuma visita encontrada
                            </h2>
                            <p style={{ color: "#6b7280" }}>Você ainda não tem visitas registradas no sistema.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <Tabs defaultValue="pending" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-6">
                            <TabsTrigger value="pending" className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Pendentes ({pending.length})
                            </TabsTrigger>
                            <TabsTrigger value="confirmed" className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                Confirmadas ({confirmed.length})
                            </TabsTrigger>
                            <TabsTrigger value="completed" className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" /> {/* Ícone pode ser diferente se quiser */}
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
            {/* --- FIM DA MUDANÇA --- */}


            {/* Details Dialog (Adaptado) */}
            <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Detalhes da Visita</DialogTitle>
                        <DialogDescription>Informações completas sobre a visita agendada</DialogDescription>
                    </DialogHeader>

                    {selectedVisit && (
                        <div style={{ display: "grid", gap: "1.5rem" }}>
                            {/* Patient Info */}
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                <img
                                    src={selectedVisit.patient_image_id ? `${API_BASE_URL}/user/file/${selectedVisit.patient_image_id}` : "/patient-placeholder.jpg"}
                                    alt={selectedVisit.patient_name}
                                    style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", backgroundColor: "#e5e7eb" }}
                                    onError={(e) => (e.currentTarget.src = "/patient-placeholder.jpg")}
                                />
                                <div>
                                    <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.25rem" }}>
                                        {selectedVisit.patient_name}
                                    </h3>
                                    {/* Pode adicionar link para perfil aqui se quiser */}
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
                                    <p>{selectedVisit.date}</p> {/* Usa string */}
                                </div>
                                <div>
                                    <span style={{ fontWeight: "600", color: "#6b7280" }}>Tipo de Visita:</span>
                                    <p>{getVisitTypeLabel(selectedVisit.visit_type)}</p>
                                </div>
                                <div>
                                    <span style={{ fontWeight: "600", color: "#6b7280" }}>Valor da Visita:</span>
                                    <p style={{ color: "#15803d", fontWeight: "600" }}>{formatCurrency(selectedVisit.visit_value)}</p>
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
                                    <p>{selectedVisit.created_at}</p> {/* Usa string */}
                                </div>
                                {/* Prazo de cancelamento não é relevante para o enfermeiro aqui */}
                            </div>

                            {/* Cancel Form (mostrado condicionalmente) */}
                            {showCancelForm && selectedVisit.status === "CONFIRMED" && (
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
                                    <Button
                                        variant="destructive"
                                        onClick={handleCancelVisitAction}
                                        disabled={actionLoading || !cancelReason.trim()}
                                    >
                                        {actionLoading ? "Cancelando..." : "Confirmar Cancelamento"}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                            Fechar
                        </Button>
                        {/* Botão Ver Perfil do Paciente movido para o Card */}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialog (AlertDialog) */}
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Visita</AlertDialogTitle>
                        <AlertDialogDescription>
                            Você confirma que está disponível e aceita esta visita?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {selectedVisit && ( // Mostra um resumo
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

        </div>
    )
}