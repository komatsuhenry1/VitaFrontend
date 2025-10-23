"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { Header } from "@/components/Header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    Calendar, MapPin, Phone, Mail, User, FileText, DollarSign, ArrowLeft, Home, Loader2, Shield, Star, Briefcase, AlertTriangle
} from "lucide-react"
import { toast } from "sonner"
import dynamic from "next/dynamic"
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


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api/v1"

// ... (Interfaces VisitDetails, NurseDetails) ...
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
    confirmation_code: string
}

interface NurseDetails {
    id: string
    name: string
    email: string
    phone: string
    specialization: string
    years_experience: number
    price: number
    rating: number
    cep: string
    street: string
    number: string
    complement: string
    neighborhood: string
    city: string
    uf: string
    latitude: number
    longitude: number
    coren: string
    profile_image_id: string | null
    created_at: string
}


export default function PatientVisitDetailsPage() {
    const router = useRouter()
    const params = useParams()
    const visitId = params.id as string

    const [visit, setVisit] = useState<VisitDetails | null>(null)
    const [nurse, setNurse] = useState<NurseDetails | null>(null)
    const [loading, setLoading] = useState(true)
    const [showEmergencyDialog, setShowEmergencyDialog] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)

    // ... (AddressMapWithNoSSR, useEffect, formatCurrency, formatDate, getStatus*, getVisitTypeLabel, handleEmergency) ...
    const AddressMapWithNoSSR = useMemo(
        () =>
            dynamic(() => import("@/components/AddressMap"), {
                loading: () => (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "250px", backgroundColor: "#f3f4f6", borderRadius: "0.5rem" }}>
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
                setLoading(true);
                // MOCK DATA (Replace with actual fetch)
                await new Promise((resolve) => setTimeout(resolve, 800));
                const mockVisit: VisitDetails = { id: visitId, status: "CONFIRMED", patient_id: "507f1f77bcf86cd799439011", patient_name: "João Silva", patient_email: "joao.silva@email.com", description: "Acompanhamento pós-operatório com troca de curativos e administração de medicamentos prescritos. Necessário verificar sinais vitais e orientar sobre cuidados.", reason: "Acompanhamento pós-operatório", cancel_reason: null, nurse_id: "507f1f77bcf86cd799439012", nurse_name: "Ana Paula Santos", visit_value: 150.0, visit_type: "domiciliar", visit_date: "2025-01-25T14:00:00Z", created_at: "2025-01-20T10:30:00Z", updated_at: "2025-01-20T10:30:00Z", confirmation_code: "123456" };
                const mockNurse: NurseDetails = { id: "507f1f77bcf86cd799439012", name: "Ana Paula Santos", email: "ana.santos@medassist.com", phone: "(11) 99876-5432", specialization: "Enfermagem Domiciliar", years_experience: 8, price: 150.0, rating: 4.8, cep: "04567-890", street: "Rua dos Profissionais", number: "456", complement: "Bloco B, Apto 102", neighborhood: "Vila Mariana", city: "São Paulo", uf: "SP", latitude: -23.5889, longitude: -46.6389, coren: "SP-123456", profile_image_id: null, created_at: "2023-03-10T08:00:00Z" };
                setVisit(mockVisit);
                setNurse(mockNurse);
            } catch (error) { toast.error("Erro ao carregar detalhes da visita"); console.error(error); }
            finally { setLoading(false); }
        }
        if (visitId) fetchVisitDetails();
    }, [visitId]);

    const formatCurrency = (value: number) => { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value); }
    const formatDate = (dateString: string) => { const date = new Date(dateString); return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
    const getStatusColor = (status: string) => { switch (status) { case "PENDING": return "#f59e0b"; case "CONFIRMED": return "#15803d"; case "COMPLETED": return "#0891b2"; case "CANCELLED": return "#dc2626"; default: return "#6b7280"; } }
    const getStatusLabel = (status: string) => { switch (status) { case "PENDING": return "Pendente"; case "CONFIRMED": return "Confirmada"; case "COMPLETED": return "Concluída"; case "CANCELLED": return "Cancelada"; default: return status; } }
    const getVisitTypeLabel = (type: string) => { switch (type?.toLowerCase()) { case "domiciliar": return "Domiciliar"; case "hospitalar": return "Hospitalar"; case "clinica": return "Clínica"; default: return type || "N/A"; } }

    const handleEmergency = async () => {
        setActionLoading(true)
        try {
            console.log("Enviando alerta de emergência para visita:", visit?.id);
            await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API call
            toast.success("Alerta de emergência enviado!")
            // No need to manually close dialog, AlertDialog handles it on action/cancel
        } catch (error) {
            toast.error("Erro ao enviar alerta de emergência")
        } finally {
            setActionLoading(false)
        }
    }


    if (loading) { /* ... Loading JSX ... */
        return (
            <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
                <Header />
                <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem", textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                        <Loader2 className="h-8 w-8 animate-spin mr-3" style={{ color: "#15803d" }} />
                        <div style={{ color: "#15803d", fontSize: "1.125rem" }}>Carregando detalhes da visita...</div>
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
                    <h1 style={{ color: "#dc2626", marginBottom: "1rem" }}>Visita não encontrada</h1>
                    <Button onClick={() => router.push("/patient")}>Voltar para Dashboard</Button> {/* Ajuste a rota se necessário */}
                </div>
            </div>
        )
    }

    const nurseImageUrl = nurse.profile_image_id ? `${API_BASE_URL}/user/file/${nurse.profile_image_id}` : "/nurse-placeholder.jpg"
    const fullAddress = `${nurse.street}, ${nurse.number}, ${nurse.neighborhood}, ${nurse.city} - ${nurse.uf}, ${nurse.cep}`

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
                    <p style={{ color: "#6b7280" }}>Agendada com {nurse.name}</p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
                    {/* Visit Information Card */}
                    <Card>
                        {/* ... (Visit Details Content) ... */}
                        <CardHeader><CardTitle style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><FileText className="h-5 w-5 text-green-700" />Informações da Visita</CardTitle></CardHeader>
                        <CardContent style={{ display: "grid", gap: "1rem" }}>
                            <div><div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}><Calendar className="h-4 w-4 text-gray-500" /><span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280" }}>Data e Hora</span></div><p style={{ fontSize: "1rem", color: "#1f2937", marginLeft: "1.5rem" }}>{formatDate(visit.visit_date)}</p></div>
                            <Separator />
                            <div><div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}><Home className="h-4 w-4 text-gray-500" /><span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280" }}>Tipo de Visita</span></div><p style={{ fontSize: "1rem", color: "#1f2937", marginLeft: "1.5rem" }}>{getVisitTypeLabel(visit.visit_type)}</p></div>
                            <Separator />
                            <div><div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}><DollarSign className="h-4 w-4 text-gray-500" /><span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280" }}>Valor</span></div><p style={{ fontSize: "1.25rem", fontWeight: "600", color: "#15803d", marginLeft: "1.5rem" }}>{formatCurrency(visit.visit_value)}</p></div>
                            <Separator />
                            <div><span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280" }}>Motivo</span><p style={{ fontSize: "1rem", color: "#1f2937", marginTop: "0.25rem" }}>{visit.reason}</p></div>
                            <Separator />
                            <div><span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280" }}>Descrição</span><p style={{ fontSize: "1rem", color: "#1f2937", marginTop: "0.25rem", lineHeight: "1.6" }}>{visit.description}</p></div>
                            {visit.cancel_reason && (<><Separator /><div><span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#dc2626" }}>Motivo do Cancelamento</span><p style={{ fontSize: "1rem", color: "#1f2937", marginTop: "0.25rem" }}>{visit.cancel_reason}</p></div></>)}
                        </CardContent>
                    </Card>

                    {/* Nurse Information Card */}
                    <Card>
                        {/* ... (Nurse Details Content) ... */}
                        <CardHeader><CardTitle style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><User className="h-5 w-5 text-green-700" />Informações do Enfermeiro(a)</CardTitle></CardHeader>
                        <CardContent>
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
                                <img src={nurseImageUrl} alt={nurse.name} style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", backgroundColor: "#e5e7eb" }} onError={(e) => (e.currentTarget.src = "/nurse-placeholder.jpg")} />
                                <div style={{ flex: 1 }}><h3 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#1f2937" }}>{nurse.name}</h3><p style={{ fontSize: "0.875rem", color: "#6b7280" }}>COREN: {nurse.coren}</p><div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.25rem" }}><Star className="h-4 w-4 text-yellow-500 fill-yellow-500" /><span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#1f2937" }}>{nurse.rating}</span></div></div>
                            </div>
                            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                                <Button onClick={() => router.push(`/nurse-profile/${nurse.id}`)} style={{ backgroundColor: "#15803d", color: "white", flex: 1, minWidth: '150px' }}><User className="h-4 w-4 mr-2" />Ver Perfil</Button>
                                <Button onClick={() => router.push(`/chat?selected=${nurse.id}`)} variant="outline" style={{ flex: 1, minWidth: '150px' }}><Mail className="h-4 w-4 mr-2" />Enviar Mensagem</Button>
                            </div>
                            <Separator style={{ marginBottom: "1rem" }} />
                            <div style={{ display: "grid", gap: "1rem" }}>
                                <div><div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}><Briefcase className="h-4 w-4 text-gray-500" /><span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280" }}>Especialização</span></div><p style={{ fontSize: "1rem", color: "#1f2937", marginLeft: "1.5rem" }}>{nurse.specialization}</p></div>
                                <Separator />
                                <div><div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}><Briefcase className="h-4 w-4 text-gray-500" /><span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280" }}>Experiência</span></div><p style={{ fontSize: "1rem", color: "#1f2937", marginLeft: "1.5rem" }}>{nurse.years_experience} anos</p></div>
                                <Separator />
                                <div><div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}><Mail className="h-4 w-4 text-gray-500" /><span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280" }}>Email</span></div><p style={{ fontSize: "1rem", color: "#1f2937", marginLeft: "1.5rem" }}>{nurse.email}</p></div>
                                <Separator />
                                <div><div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}><Phone className="h-4 w-4 text-gray-500" /><span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280" }}>Telefone</span></div><p style={{ fontSize: "1rem", color: "#1f2937", marginLeft: "1.5rem" }}>{nurse.phone}</p></div>
                                <Separator />
                                <div><div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}><MapPin className="h-4 w-4 text-gray-500" /><span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280" }}>Região de Atuação</span></div><div style={{ fontSize: "1rem", color: "#1f2937", marginLeft: "1.5rem", lineHeight: "1.6" }}><p>{nurse.neighborhood}</p><p>{nurse.city} - {nurse.uf}</p></div></div>
                            </div>
                            <Separator style={{ margin: "1rem 0" }} />
                            <div><div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}><MapPin className="h-4 w-4 text-gray-500" /><span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280" }}>Localização Estimada da Visita</span></div>
                                <AddressMapWithNoSSR address={fullAddress} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Confirmation Code Display & Emergency Button */}
                {visit.status === "CONFIRMED" && (
                    <Card style={{ marginBottom: "1.5rem" }}>
                        <CardHeader>
                            <CardTitle style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <Shield className="h-5 w-5 text-green-700" />
                                Código de Confirmação e Emergência
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* --- MUDANÇA: Aplicando a estrutura de grid --- */}
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', alignItems: 'center' }}>
                                {/* Confirmation Code */}
                                <div>
                                    <p style={{ color: "#6b7280", marginBottom: "1rem", lineHeight: "1.6" }}>
                                        Forneça este código ao enfermeiro(a) ao final do atendimento para confirmar que o serviço foi realizado.
                                    </p>
                                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "1.5rem", backgroundColor: "#f0fdf4", borderRadius: "0.5rem", border: "1px solid #a7f3d0" }}>
                                        <div style={{ textAlign: "center" }}>
                                            <p style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280", marginBottom: "0.5rem" }}>Seu código:</p>
                                            <p style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#15803d", letterSpacing: "0.5rem", fontFamily: "monospace" }}>{visit.confirmation_code}</p>
                                        </div>
                                    </div>
                                </div>

                            </div>
                            {/* --- FIM DA MUDANÇA --- */}
                        </CardContent>
                    </Card>
                )}

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
                    <p>Agendado em: {formatDate(visit.created_at)}</p>
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