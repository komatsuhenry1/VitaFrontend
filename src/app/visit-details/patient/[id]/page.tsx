"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { Header } from "@/components/Header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Calendar, MapPin, Phone, Mail, User, FileText, DollarSign, ArrowLeft, Home, Loader2, Shield, Star, Briefcase, AlertTriangle
} from "lucide-react"
import { toast } from "sonner"
import dynamic from "next/dynamic"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api/v1"

// --- INTERFACES AJUSTADAS PARA CORRESPONDER À API REAL ---
interface VisitDetails {
    id: string
    status: string
    // patient_id, patient_name, patient_email removidos (não usados diretamente e não presentes no DTO)
    description: string
    reason: string
    cancel_reason: string | null // Vem como string vazia "", ajustar se necessário
    nurse_id: string
    nurse_name: string
    visit_value: number
    visit_type: string
    visit_date: string // API retorna string UTC "2025-10-24 16:00:00 +0000 UTC"
    created_at: string // API retorna string UTC
    updated_at: string // API retorna string UTC
    confirmation_code: string
}

interface NurseDetails {
    id: string
    name: string
    email: string
    phone: string
    specialization: string
    years_experience: number
    rating: number
    coren: string
    profile_image_id: string | null // API retorna string ou potentially null/vazio
    // Campos de endereço, preço e created_at removidos pois não estão na resposta da API /user/visit-info
}

// --- INTERFACE PARA A RESPOSTA DA API ---
interface ApiResponse {
    success: boolean
    message: string
    data: {
        visit: VisitDetails
        nurse: NurseDetails
    }
}


export default function PatientVisitDetailsPage() {
    const router = useRouter()
    const params = useParams()
    const visitId = params.id as string

    const [visit, setVisit] = useState<VisitDetails | null>(null)
    const [nurse, setNurse] = useState<NurseDetails | null>(null)
    const [loading, setLoading] = useState(true)
    const [showEmergencyDialog, setShowEmergencyDialog] = useState(false)
    const [emergencyLoading, setEmergencyLoading] = useState(false)

    // O Mapa foi removido pois a API não retorna mais os dados de endereço/lat/lon do enfermeiro
    // const AddressMapWithNoSSR = useMemo(...)

    // --- USE EFFECT COM FETCH REAL ---
    useEffect(() => {
        const fetchVisitDetails = async () => {
            if (!visitId) {
                toast.error("ID da visita inválido.")
                setLoading(false)
                return
            }
            try {
                setLoading(true)
                const token = localStorage.getItem("token")
                if (!token) {
                    toast.error("Autenticação necessária.")
                    router.push("/login") // Redireciona para login se não houver token
                    return
                }

                const response = await fetch(`${API_BASE_URL}/user/visit-info/${visitId}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                })

                const result: ApiResponse = await response.json()

                if (!response.ok) {
                     // Tenta usar a mensagem da API, senão uma genérica
                    throw new Error(result.message || `Erro ${response.status}: Falha ao buscar dados da visita.`);
                }

                if (result.success && result.data && result.data.visit && result.data.nurse) {
                    // Trata cancel_reason vazio como null
                    if (result.data.visit.cancel_reason === "") {
                        result.data.visit.cancel_reason = null;
                    }
                     // Trata profile_image_id vazio como null
                     if (result.data.nurse.profile_image_id === "") {
                        result.data.nurse.profile_image_id = null;
                    }

                    setVisit(result.data.visit)
                    setNurse(result.data.nurse)
                } else {
                    throw new Error(result.message || "Dados da visita ou enfermeiro não encontrados na resposta da API.")
                }

            } catch (error) {
                console.error("Fetch Visit Details Error:", error);
                toast.error(error instanceof Error ? error.message : "Erro ao carregar detalhes da visita")
                // Opcional: redirecionar ou mostrar mensagem de erro mais proeminente
                setVisit(null) // Garante que não tentará renderizar dados inválidos
                setNurse(null)
            } finally {
                setLoading(false)
            }
        }

        fetchVisitDetails()
    }, [visitId, router]) // Adiciona router como dependência

    // ... (handleEmergency, formatCurrency, formatDate, getStatus*, getVisitTypeLabel) ...
    const handleEmergency = async () => {
        // Implementação existente...
        try {
            setEmergencyLoading(true)
            const user = JSON.parse(localStorage.getItem("user") || "{}")
            const token = localStorage.getItem("token")

            // A API `/emergency/alert` precisa existir e funcionar
            const response = await fetch(`${API_BASE_URL}/emergency/alert`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    visit_id: visitId,
                    patient_id: user.id, // Certifique-se que user.id existe
                    nurse_id: visit?.nurse_id,
                    // A localização do enfermeiro não está mais disponível aqui
                    // Você pode enviar a localização do paciente (se tiver) ou omitir
                    location: { address: "Localização não disponível nesta versão", latitude: null, longitude: null },
                }),
            })

            if (response.ok) {
                toast.success("Alerta de emergência enviado com sucesso! Autoridades foram notificadas.")
                setShowEmergencyDialog(false)
            } else {
                 const errorData = await response.json().catch(() => ({}));
                toast.error(errorData.message || "Erro ao enviar alerta de emergência. Tente novamente.");
            }
        } catch (error) {
            console.error("Emergency alert error:", error);
            toast.error("Erro ao enviar alerta de emergência. Tente novamente.");
        } finally {
            setEmergencyLoading(false);
        }
    }
    const formatCurrency = (value: number) => { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value); }
    const formatDate = (dateString: string) => {
        // Tenta parsear a data UTC vinda do Go
        const date = new Date(dateString.replace(" +0000 UTC", "Z")); // Adiciona 'Z' para indicar UTC
        if (isNaN(date.getTime())) {
            return "Data inválida"; // Fallback se o parse falhar
        }
        return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }); // Especifica o Timezone
    }
    const getStatusColor = (status: string) => { switch (status) { case "PENDING": return "#f59e0b"; case "CONFIRMED": return "#15803d"; case "COMPLETED": return "#0891b2"; case "CANCELLED": return "#dc2626"; default: return "#6b7280"; } }
    const getStatusLabel = (status: string) => { switch (status) { case "PENDING": return "Pendente"; case "CONFIRMED": return "Confirmada"; case "COMPLETED": return "Concluída"; case "CANCELLED": return "Cancelada"; default: return status; } }
    const getVisitTypeLabel = (type: string) => { switch (type?.toLowerCase()) { case "domiciliar": return "Domiciliar"; case "hospitalar": return "Hospitalar"; case "clinica": return "Clínica"; default: return type || "N/A"; } }


    if (loading) { /* ... Loading JSX ... */
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

    if (!visit || !nurse) { /* ... Error/Not Found JSX ... */
         return (
            <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
                <Header />
                <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem", textAlign: "center" }}>
                    <h1 style={{ color: "#dc2626", marginBottom: "1rem", fontSize: "1.5rem", fontWeight: "600" }}>
                         Visita não encontrada ou erro ao carregar.
                    </h1>
                     <p style={{color: "#6b7280", marginBottom: "1.5rem"}}>Verifique o ID da visita ou tente novamente mais tarde.</p>
                    <Button onClick={() => router.back()} style={{ backgroundColor: "#15803d", color: "white" }}>
                        Voltar
                    </Button>
                </div>
            </div>
        )
    }

    // A URL da imagem usa o ID retornado pela API ou o placeholder
    const nurseImageUrl = nurse.profile_image_id
        ? `${API_BASE_URL}/user/file/${nurse.profile_image_id}`
        : "/nurse-placeholder.jpg"

    // O endereço completo não pode mais ser construído aqui
    // const fullAddress = `${nurse.street}, ...`

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
            <Header />
            <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem" }}>
                {/* ... (Header with Back Button and Title) ... */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <Button onClick={() => router.back()} variant="outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ArrowLeft className="h-4 w-4" /> Voltar
                    </Button>
                    <Badge style={{ backgroundColor: getStatusColor(visit.status), fontSize: "1rem", padding: "0.5rem 1rem" }}>
                        {getStatusLabel(visit.status)}
                    </Badge>
                </div>
                <div style={{ marginBottom: "2rem" }}>
                    <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#1f2937", marginBottom: "0.5rem" }}>
                        Detalhes da Visita
                    </h1>
                     {/* Usa o nome do enfermeiro vindo da API */}
                    <p style={{ color: "#6b7280" }}>Agendada com {nurse.name}</p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
                    {/* Visit Information Card */}
                    <Card style={{ boxShadow: "0 4px 6px rgba(0, 0, 0, 0.07)", border: "1px solid #e5e7eb" }}>
                        <CardHeader style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                            <CardTitle style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#1f2937" }}>
                                <FileText className="h-5 w-5" style={{ color: "#15803d" }} /> Informações da Visita
                            </CardTitle>
                        </CardHeader>
                        <CardContent style={{ display: "grid", gap: "1.25rem", padding: "1.5rem" }}>
                            {/* ... (Exibe os dados de 'visit' - Data, Tipo, Valor, Motivo, Descrição) ... */}
                             <div><div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}><Calendar className="h-4 w-4 text-green-700" /><span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Data e Hora</span></div><p style={{ fontSize: "1.125rem", color: "#1f2937", marginLeft: "1.5rem", fontWeight: "500" }}>{formatDate(visit.visit_date)}</p></div>
                             <Separator />
                             <div><div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}><Home className="h-4 w-4 text-green-700" /><span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Tipo de Visita</span></div><p style={{ fontSize: "1.125rem", color: "#1f2937", marginLeft: "1.5rem", fontWeight: "500" }}>{getVisitTypeLabel(visit.visit_type)}</p></div>
                             <Separator />
                             <div><div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}><DollarSign className="h-4 w-4 text-green-700" /><span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Valor</span></div><p style={{ fontSize: "1.5rem", fontWeight: "700", color: "#15803d", marginLeft: "1.5rem" }}>{formatCurrency(visit.visit_value)}</p></div>
                             <Separator />
                             <div><span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Motivo</span><p style={{ fontSize: "1rem", color: "#1f2937", marginTop: "0.5rem", lineHeight: "1.6" }}>{visit.reason}</p></div>
                             <Separator />
                             <div><span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Descrição</span><p style={{ fontSize: "1rem", color: "#1f2937", marginTop: "0.5rem", lineHeight: "1.7" }}>{visit.description}</p></div>
                             {visit.cancel_reason && ( /* Mostra motivo do cancelamento se existir */
                                <>
                                    <Separator />
                                    <div style={{ padding: "1rem", backgroundColor: "#fef2f2", borderRadius: "0.5rem", border: "1px solid #fecaca" }}>
                                        <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#dc2626", textTransform: "uppercase" }}>Motivo do Cancelamento</span>
                                        <p style={{ fontSize: "1rem", color: "#991b1b", marginTop: "0.5rem" }}>{visit.cancel_reason}</p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Nurse Information Card */}
                    <Card style={{ boxShadow: "0 4px 6px rgba(0, 0, 0, 0.07)", border: "1px solid #e5e7eb" }}>
                        <CardHeader style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                            <CardTitle style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#1f2937" }}>
                                <User className="h-5 w-5" style={{ color: "#15803d" }} /> Informações do Enfermeiro(a)
                            </CardTitle>
                        </CardHeader>
                        <CardContent style={{ padding: "1.5rem" }}>
                             {/* ... (Exibe os dados de 'nurse' - Imagem, Nome, Coren, Rating, Botões) ... */}
                             <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", padding: "1rem", backgroundColor: "#f9fafb", borderRadius: "0.75rem" }}>
                                <img
                                    src={nurseImageUrl}
                                    alt={nurse.name}
                                    style={{ width: "90px", height: "90px", borderRadius: "50%", objectFit: "cover", border: "3px solid #15803d", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}
                                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/nurse-placeholder.jpg"; }} // Melhor fallback
                                />
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: "1.375rem", fontWeight: "700", color: "#1f2937", marginBottom: "0.25rem" }}>{nurse.name}</h3>
                                    <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.5rem" }}>COREN: {nurse.coren}</p>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                        <Star className="h-5 w-5" style={{ color: "#f59e0b", fill: "#f59e0b" }} />
                                        <span style={{ fontSize: "1rem", fontWeight: "700", color: "#1f2937" }}>{nurse.rating > 0 ? nurse.rating.toFixed(1) : "N/A"}</span> {/* Mostra N/A se rating for 0 */}
                                        <span style={{ fontSize: "0.875rem", color: "#6b7280", marginLeft: "0.25rem" }}>/ 5.0</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                                {/* Link ajustado para a rota correta do perfil do enfermeiro */}
                                <Button onClick={() => router.push(`/nurse-profile/${nurse.id}`)} style={{ backgroundColor: "#15803d", color: "white", flex: 1, minWidth: '150px', fontWeight: "600" }}><User className="h-4 w-4 mr-2" />Ver Perfil</Button>
                                {/* Link ajustado para levar ao chat com o enfermeiro selecionado */}
                                <Button onClick={() => router.push(`/chat/${nurse.id}`)} variant="outline" style={{ flex: 1, minWidth: '150px', fontWeight: "600", borderColor: "#15803d", color: "#15803d" }}><Mail className="h-4 w-4 mr-2" />Mensagem</Button>
                            </div>
                            <Separator style={{ marginBottom: "1.25rem" }} />
                            <div style={{ display: "grid", gap: "1.25rem" }}>
                                {/* ... (Exibe os dados de 'nurse' - Especialização, Experiência, Email, Telefone) ... */}
                                 <div><div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}><Briefcase className="h-4 w-4 text-green-700" /><span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Especialização</span></div><p style={{ fontSize: "1rem", color: "#1f2937", marginLeft: "1.5rem", fontWeight: "500" }}>{nurse.specialization}</p></div>
                                 <Separator />
                                 <div><div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}><Briefcase className="h-4 w-4 text-green-700" /><span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Experiência</span></div><p style={{ fontSize: "1rem", color: "#1f2937", marginLeft: "1.5rem", fontWeight: "500" }}>{nurse.years_experience} anos</p></div>
                                 <Separator />
                                 <div><div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}><Mail className="h-4 w-4 text-green-700" /><span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Email</span></div><p style={{ fontSize: "1rem", color: "#1f2937", marginLeft: "1.5rem" }}>{nurse.email}</p></div>
                                 <Separator />
                                 <div><div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}><Phone className="h-4 w-4 text-green-700" /><span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Telefone</span></div><p style={{ fontSize: "1rem", color: "#1f2937", marginLeft: "1.5rem" }}>{nurse.phone}</p></div>
                                 {/* --- MUDANÇA: Seção de Endereço/Mapa Removida --- */}
                                {/* <Separator />
                                <div> ... Região de Atuação ... </div>
                                <Separator style={{ margin: "1.25rem 0" }} />
                                <div> ... Localização da Visita (Mapa) ... </div> */}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Confirmation Code Display */}
                {visit.status === "CONFIRMED" && (
                    <Card style={{ marginBottom: "1.5rem", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.07)", border: "2px solid #15803d", background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)" }}>
                        <CardHeader style={{ borderBottom: "1px solid #d1fae5" }}><CardTitle style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#1f2937" }}><Shield className="h-6 w-6" style={{ color: "#15803d" }} />Código de Confirmação</CardTitle></CardHeader>
                        <CardContent style={{ padding: "2rem" }}>
                             {/* ... (Conteúdo do Código de Confirmação) ... */}
                              <p style={{ color: "#6b7280", marginBottom: "2rem", lineHeight: "1.7", fontSize: "1rem", textAlign: "center", }}>Forneça este código ao enfermeiro(a) ao final do atendimento para confirmar que o serviço foi realizado.</p>
                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "2.5rem", background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", borderRadius: "1rem", border: "3px solid #15803d", boxShadow: "0 8px 16px rgba(21, 128, 61, 0.15)" }}>
                                <div style={{ textAlign: "center" }}><p style={{ fontSize: "0.875rem", fontWeight: "700", color: "#15803d", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Seu código de confirmação</p><p style={{ fontSize: "3.5rem", fontWeight: "900", color: "#15803d", letterSpacing: "0.75rem", fontFamily: "monospace", textShadow: "0 2px 4px rgba(21, 128, 61, 0.1)" }}>{visit.confirmation_code}</p><p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "1rem", fontWeight: "500" }}>Código válido apenas para esta visita</p></div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                 {/* Emergency Button Card */}
                {visit.status === "CONFIRMED" && (
                    <Card style={{ marginBottom: "1.5rem", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.07)", border: "2px solid #dc2626", background: "linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)" }}>
                        <CardContent style={{ padding: "2rem" }}>
                             {/* ... (Conteúdo do Botão de Emergência) ... */}
                             <div style={{ textAlign: "center" }}>
                                <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}><AlertTriangle className="h-12 w-12" style={{ color: "#dc2626" }} /></div>
                                <h3 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1f2937", marginBottom: "0.75rem" }}>Segurança em Primeiro Lugar</h3>
                                <p style={{ color: "#6b7280", marginBottom: "2rem", lineHeight: "1.7", fontSize: "1rem", maxWidth: "600px", margin: "0 auto 2rem" }}>Caso se sinta ameaçado ou em situação de risco durante o atendimento, pressione o botão abaixo. Um alerta será enviado imediatamente às autoridades competentes.</p>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button style={{ backgroundColor: "#dc2626", color: "white", padding: "1.5rem 3rem", fontSize: "1.125rem", fontWeight: "700", borderRadius: "0.75rem", boxShadow: "0 4px 6px rgba(220, 38, 38, 0.3)", transition: "all 0.2s ease", border: "none" }}
                                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#b91c1c"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 8px rgba(220, 38, 38, 0.4)"; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#dc2626"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 6px rgba(220, 38, 38, 0.3)"; }}>
                                            <AlertTriangle className="h-5 w-5 mr-2" />Botão de Emergência
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#dc2626" }}><AlertTriangle className="h-6 w-6" />Confirmar Alerta de Emergência</AlertDialogTitle>
                                            <AlertDialogDescription style={{ lineHeight: "1.7", fontSize: "1rem" }}>Você está prestes a enviar um alerta de emergência...<br /><br /><strong style={{ color: "#dc2626" }}>Use apenas em situações reais de emergência.</strong><br /><br />Deseja continuar?</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel disabled={emergencyLoading}>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleEmergency} disabled={emergencyLoading} style={{ backgroundColor: "#dc2626", color: "white" }}>
                                                {emergencyLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando...</> : <><AlertTriangle className="h-4 w-4 mr-2" />Confirmar Emergência</>}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Timestamps */}
                <div style={{ marginTop: "2rem", padding: "1rem", fontSize: "0.875rem", color: "#6b7280", textAlign: "center", backgroundColor: "white", borderRadius: "0.5rem", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)" }}>
                    <p style={{ marginBottom: "0.25rem" }}>Criado em: <span style={{ fontWeight: "600", color: "#1f2937" }}>{formatDate(visit.created_at)}</span></p>
                    <p>Última atualização: <span style={{ fontWeight: "600", color: "#1f2937" }}>{formatDate(visit.updated_at)}</span></p>
                </div>
            </div>

            {/* Emergency Alert Dialog (Movido para dentro do Card, mas pode ficar aqui se preferir) */}
            {/* <AlertDialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}> ... </AlertDialog> */}
        </div>
    )
}