"use client"

import type React from "react"
import { CheckCircle } from "lucide-react"
import { MessageCircle } from "lucide-react"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { Header } from "@/components/Header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import {
    Calendar,
    MapPin,
    Phone,
    Mail,
    User,
    FileText,
    DollarSign,
    ArrowLeft,
    Home,
    Loader2,
    Shield,
    AlertTriangle,
} from "lucide-react"
import { toast } from "sonner"
import dynamic from "next/dynamic"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api/v1"

// ... (Interfaces VisitDetails, PatientDetails, ApiResponse) ...
interface VisitDetails {
    id: string
    status: string
    patient_id: string
    patient_name: string
    description: string
    reason: string
    cancel_reason?: string | null
    visit_value: number
    visit_type: string
    visit_date: string
    created_at: string
    updated_at: string
}

interface PatientDetails {
    id: string
    name: string
    email: string
    phone: string
    cep: string
    street: string
    number: string
    complement: string
    neighborhood: string
    city: string
    uf: string
    latitude: number
    longitude: number
    cpf: string
    profile_image_id: string | null
}

interface ApiResponse {
    success: boolean
    message: string
    data: {
        visit: VisitDetails
        patient: PatientDetails
    }
}
// Interface para resposta de confirmação (pode ser mais simples)
interface ConfirmationResponse {
    success: boolean
    message: string
}


export default function VisitDetailsPage() {
    const router = useRouter()
    const params = useParams()
    const visitId = params.id as string

    const [visit, setVisit] = useState<VisitDetails | null>(null)
    const [patient, setPatient] = useState<PatientDetails | null>(null)
    const [loading, setLoading] = useState(true)
    const [showEmergencyDialog, setShowEmergencyDialog] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)
    const [confirmationCode, setConfirmationCode] = useState("")
    const [codeLoading, setCodeLoading] = useState(false)

    // ... (useMemo AddressMapWithNoSSR) ...
    const AddressMapWithNoSSR = useMemo( /* ... definição do mapa ... */
        () =>
            dynamic(() => import("@/components/NursesMap"), {
                loading: () => (<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "250px", backgroundColor: "#f3f4f6", borderRadius: "0.5rem" }}> <Loader2 className="h-6 w-6 animate-spin text-gray-500" /> <p className="ml-2 text-gray-600">Carregando mapa...</p> </div>),
                ssr: false,
            }),
        [],
    )

    // ... (useEffect fetchVisitDetails) ...
    useEffect(() => {
        const fetchVisitDetails = async () => {
            // ... (lógica fetch existente) ...
            if (!visitId) { toast.error("ID da visita inválido."); setLoading(false); return; }
            try {
                setLoading(true);
                const token = localStorage.getItem("token");
                if (!token) { toast.error("Autenticação necessária."); router.push("/login"); return; }

                const response = await fetch(`${API_BASE_URL}/nurse/visit-info/${visitId}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                });
                const result: ApiResponse = await response.json();

                if (!response.ok) { throw new Error(result.message || `Erro ${response.status}: Falha ao buscar dados da visita.`); }
                if (result.success && result.data && result.data.visit && result.data.patient) {
                    const fetchedVisit = result.data.visit;
                    if (fetchedVisit.cancel_reason === "") fetchedVisit.cancel_reason = null;
                    const fetchedPatient = result.data.patient;
                    if (fetchedPatient.profile_image_id === "") fetchedPatient.profile_image_id = null;
                    setVisit(fetchedVisit);
                    setPatient(fetchedPatient);
                } else { throw new Error(result.message || "Dados da visita ou paciente não encontrados."); }
            } catch (error) {
                console.error("Fetch Visit Details Error:", error);
                toast.error(error instanceof Error ? error.message : "Erro ao carregar detalhes.");
                setVisit(null); setPatient(null);
            } finally { setLoading(false); }
        }
        fetchVisitDetails()
    }, [visitId, router]);


    // ... (formatCurrency, formatCPF, formatPhone, getStatusColor, getStatusLabel, getVisitTypeLabel) ...
    const formatCurrency = (value: number) => { /* ... */ return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value); }
    const formatCPF = (cpf: string | undefined | null): string => { /* ... */ if (!cpf) return "N/A"; return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"); }
    const formatPhone = (phone: string | undefined | null): string => { /* ... */ if (!phone) return "N/A"; const cleaned = phone.replace(/\D/g, ''); if (cleaned.length === 11) { return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3"); } else if (cleaned.length === 10) { return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3"); } return phone; }
    const getStatusColor = (status: string | undefined) => { /* ... */ switch (status) { case "PENDING": return "#f59e0b"; case "CONFIRMED": return "#15803d"; case "COMPLETED": return "#0891b2"; case "CANCELLED": return "#dc2626"; default: return "#6b7280"; } }
    const getStatusLabel = (status: string | undefined) => { /* ... */ switch (status) { case "PENDING": return "Pendente"; case "CONFIRMED": return "Confirmada"; case "COMPLETED": return "Concluída"; case "CANCELLED": return "Cancelada"; default: return status || 'N/A'; } }
    const getVisitTypeLabel = (type: string | undefined) => { /* ... */ switch (type?.toLowerCase()) { case "domiciliar": return "Domiciliar"; case "hospitalar": return "Hospitalar"; case "clinica": return "Clínica"; default: return type || "N/A"; } }


    // --- MUDANÇA: handleConfirmationCode com chamada real ---
    const handleConfirmationCode = async () => {
        if (!visit) return; // Garante que 'visit' não é null
        if (confirmationCode.length !== 6 || !/^\d{6}$/.test(confirmationCode)) {
            toast.error("O código de confirmação deve ter 6 dígitos numéricos.")
            return
        }

        try {
            setCodeLoading(true)
            const token = localStorage.getItem("token")
            if (!token) {
                toast.error("Erro de autenticação. Faça login novamente.");
                setCodeLoading(false);
                return;
            }

            // Chamada real ao backend para confirmar/completar
            const response = await fetch(`${API_BASE_URL}/nurse/service-confirmation/${visit.id}`, {
                method: "PATCH", // Ou "PATCH", dependendo da sua API
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ confirmation_code: confirmationCode }), // Envia o código no corpo
            })

            const result: ConfirmationResponse = await response.json(); // Assume uma resposta simples

            if (!response.ok) {
                throw new Error(result.message || `Erro ${response.status}: Falha ao confirmar visita.`);
            }

            if (result.success) {
                toast.success(result.message || "Visita confirmada com sucesso!")
                router.push("/visits/nurse") // Redireciona para a lista de visitas do enfermeiro
            } else {
                // Caso a API retorne 2xx mas success: false
                throw new Error(result.message || "Código inválido ou erro ao confirmar.")
            }

        } catch (error) {
            console.error("Confirmation code error:", error);
            // Mostra o erro da API ou um erro genérico
            toast.error(error instanceof Error ? error.message : "Erro ao validar código de confirmação. Tente novamente.")
        } finally {
            setCodeLoading(false)
        }
    }
    // --- FIM DA MUDANÇA ---

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => { /* ... */ const value = e.target.value.replace(/\D/g, "").slice(0, 6); setConfirmationCode(value); }

    // ... (handleEmergency - pode precisar ajustar o payload se a localização do paciente for necessária) ...
    const handleEmergency = async () => { /* ... */
        try {
            setActionLoading(true)
            const token = localStorage.getItem("token")
            // A API `/emergency/alert` precisa existir e funcionar
            const response = await fetch(`${API_BASE_URL}/emergency/alert`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    visit_id: visitId,
                    // patient_id: visit?.patient_id, // Usar o ID da visita
                    nurse_id: localStorage.getItem("userId"), // ID do enfermeiro logado
                    location: { // Localização do PACIENTE (se disponível)
                        address: patient ? `${patient.street}, ${patient.number}, ${patient.neighborhood}, ${patient.city} - ${patient.uf}` : "Endereço indisponível",
                        latitude: patient?.latitude ?? null,
                        longitude: patient?.longitude ?? null,
                    },
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
            setActionLoading(false);
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
                        <p style={{ color: "#6b7280" }}>Carregando detalhes da visita...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (!visit || !patient) { /* ... Error/Not Found JSX ... */
        return ( /* ... not found ... */
            <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
                <Header />
                <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem", textAlign: "center" }}>
                    <h1 style={{ color: "#dc2626", marginBottom: "1rem", fontSize: "1.5rem", fontWeight: "600" }}>
                        Visita não encontrada ou erro ao carregar.
                    </h1>
                    <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>Verifique o ID da visita ou tente novamente mais tarde.</p>
                    <Button onClick={() => router.back()} style={{ backgroundColor: "#15803d", color: "white" }}>
                        Voltar
                    </Button>
                </div>
            </div>
        )
    }

    const patientImageUrl = patient.profile_image_id
        ? `${API_BASE_URL}/user/file/${patient.profile_image_id}`
        : "/patient-placeholder.jpg"

    // Endereço completo para o mapa (usando dados do paciente)
    const fullAddress = `${patient.street}, ${patient.number}, ${patient.neighborhood}, ${patient.city} - ${patient.uf}, ${patient.cep}`

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
            <Header />
            <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem" }}>
                {/* --- HEADER COM BOTÃO VOLTAR e BADGE --- */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <Badge style={{ backgroundColor: getStatusColor(visit.status), fontSize: "1rem", padding: "0.5rem 1rem", borderRadius: "0.5rem", fontWeight: "600" }}>
                        {getStatusLabel(visit.status)}
                    </Badge>
                </div>
                {/* --- TÍTULO --- */}
                <div style={{ marginBottom: "2rem" }}>
                    <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#1f2937", marginBottom: "0.5rem" }}>
                        Detalhes da Visita
                    </h1>
                    <p style={{ color: "#6b7280" }}>Visita agendada para {patient.name}</p>
                </div>

                {/* --- GRID PRINCIPAL --- */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
                    {/* --- CARD VISITA --- */}
                    <Card style={{ boxShadow: "0 4px 6px rgba(0, 0, 0, 0.07)", border: "1px solid #e5e7eb" }}>
                        <CardHeader style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                            <CardTitle style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#1f2937" }}><FileText className="h-5 w-5 text-green-700" />Informações da Visita</CardTitle>
                        </CardHeader>
                        <CardContent style={{ display: "grid", gap: "1.25rem", padding: "1.5rem" }}>
                            {/* ... Conteúdo do Card Visita ... */}
                            <div><div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}><Calendar className="h-4 w-4 text-green-700" /><span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Data e Hora</span></div><p style={{ fontSize: "1.125rem", color: "#1f2937", marginLeft: "1.5rem", fontWeight: "500" }}>{visit.visit_date}</p></div>
                            <Separator />
                            <div><div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}><Home className="h-4 w-4 text-green-700" /><span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Tipo</span></div><p style={{ fontSize: "1.125rem", color: "#1f2937", marginLeft: "1.5rem", fontWeight: "500" }}>{getVisitTypeLabel(visit.visit_type)}</p></div>
                            <Separator />
                            <div><div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}><DollarSign className="h-4 w-4 text-green-700" /><span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Valor</span></div><p style={{ fontSize: "1.5rem", fontWeight: "700", color: "#15803d", marginLeft: "1.5rem" }}>{formatCurrency(visit.visit_value)}</p></div>
                            <Separator />
                            <div><span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Motivo</span><p style={{ fontSize: "1rem", color: "#1f2937", marginTop: "0.5rem", lineHeight: "1.6" }}>{visit.reason}</p></div>
                            <Separator />
                            <div><span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Descrição</span><p style={{ fontSize: "1rem", color: "#1f2937", marginTop: "0.5rem", lineHeight: "1.7" }}>{visit.description}</p></div>
                            {visit.cancel_reason && (<><Separator /><div style={{ padding: "1rem", backgroundColor: "#fef2f2", borderRadius: "0.5rem", border: "1px solid #fecaca" }}><span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#dc2626", textTransform: "uppercase" }}>Motivo do Cancelamento</span><p style={{ fontSize: "1rem", color: "#991b1b", marginTop: "0.5rem" }}>{visit.cancel_reason}</p></div></>)}
                        </CardContent>
                    </Card>

                    {/* --- CARD PACIENTE --- */}
                    <Card style={{ boxShadow: "0 4px 6px rgba(0, 0, 0, 0.07)", border: "1px solid #e5e7eb" }}>
                        <CardHeader style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                            <CardTitle style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#1f2937" }}><User className="h-5 w-5 text-green-700" />Informações do Paciente</CardTitle>
                        </CardHeader>
                        <CardContent style={{ padding: "1.5rem" }}>
                            {/* ... Conteúdo do Card Paciente ... */}
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", padding: "1rem", backgroundColor: "#f9fafb", borderRadius: "0.75rem" }}>
                                <img src={patientImageUrl} alt={patient.name} style={{ width: "90px", height: "90px", borderRadius: "50%", objectFit: "cover", border: "3px solid #15803d", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/patient-placeholder.jpg"; }} />
                                <div style={{ flex: 1 }}><h3 style={{ fontSize: "1.375rem", fontWeight: "700", color: "#1f2937", marginBottom: "0.25rem" }}>{patient.name}</h3><p style={{ fontSize: "0.875rem", color: "#6b7280" }}>CPF: {formatCPF(patient.cpf)}</p></div>
                            </div>
                            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
                                <Button onClick={() => router.push(`/chat/${patient.id}`)} style={{ flex: 1, backgroundColor: "#15803d", color: "white", fontWeight: "600" }}><MessageCircle className="h-4 w-4 mr-2" />Chat</Button>
                                <Button onClick={() => router.push(`/patient-profile/${patient.id}`)} variant="outline" style={{ flex: 1, fontWeight: "600", borderColor: "#15803d", color: "#15803d" }}><User className="h-4 w-4 mr-2" />Ver Perfil</Button>
                            </div>
                            <Separator style={{ marginBottom: "1.25rem" }} />
                            <div style={{ display: "grid", gap: "1.25rem" }}>
                                <div><div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}><Mail className="h-4 w-4 text-green-700" /><span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Email</span></div><p style={{ fontSize: "1rem", color: "#1f2937", marginLeft: "1.5rem" }}>{patient.email}</p></div>
                                <Separator />
                                <div><div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}><Phone className="h-4 w-4 text-green-700" /><span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Telefone</span></div><p style={{ fontSize: "1rem", color: "#1f2937", marginLeft: "1.5rem" }}>{formatPhone(patient.phone)}</p></div>
                                <Separator />
                                <div><div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}><MapPin className="h-4 w-4 text-green-700" /><span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Endereço</span></div>
                                    <div style={{ fontSize: "1rem", color: "#1f2937", marginLeft: "1.5rem", lineHeight: "1.6" }}>
                                        <p>{patient.street}, {patient.number}</p>
                                        {patient.complement && <p>{patient.complement}</p>}
                                        <p>{patient.neighborhood}</p>
                                        <p>{patient.city} - {patient.uf}</p>
                                        <p>CEP: {patient.cep}</p>
                                    </div>
                                </div>
                            </div>
                            <Separator style={{ margin: "1.25rem 0" }} />
                            {/* Mapa */}
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                                    <MapPin className="h-4 w-4" style={{ color: "#15803d" }} />
                                    <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>Localização da Visita</span>
                                </div>
                                <div style={{ borderRadius: "0.5rem", overflow: "hidden", boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)" }}>
                                    {/* Passa o endereço completo do PACIENTE para o mapa */}
                                    <AddressMapWithNoSSR address={fullAddress} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* --- CARD CONFIRMAÇÃO --- */}
                {visit.status === "CONFIRMED" && (
                    <Card style={{ marginBottom: "1.5rem", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.07)", border: "2px solid #15803d", background: "linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)" }}>
                        <CardHeader style={{ borderBottom: "1px solid #d1fae5" }}><CardTitle style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#1f2937" }}><Shield className="h-6 w-6" style={{ color: "#15803d" }} />Confirmação de Atendimento</CardTitle></CardHeader>
                        <CardContent style={{ padding: "2rem" }}>
                            {/* ... Conteúdo da confirmação ... */}
                            <p style={{ color: "#6b7280", marginBottom: "2rem", lineHeight: "1.7", fontSize: "1rem", textAlign: "center" }}>Para confirmar que o atendimento foi realizado, solicite ao paciente o código de confirmação de 6 dígitos e insira abaixo.</p>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem", maxWidth: "500px", margin: "0 auto" }}>
                                <div style={{ width: "100%" }}>
                                    <label htmlFor="confirmation-code" style={{ display: "block", fontSize: "0.875rem", fontWeight: "700", color: "#15803d", marginBottom: "0.75rem", textAlign: "center", textTransform: "uppercase" }}>Código de Confirmação</label>
                                    <Input id="confirmation-code" type="text" placeholder="000000" value={confirmationCode} onChange={handleCodeChange} maxLength={6} style={{ fontSize: "2rem", letterSpacing: "0.75rem", textAlign: "center", fontWeight: "700", padding: "1.5rem", border: "2px solid #15803d", borderRadius: "0.75rem", backgroundColor: "white" }} disabled={codeLoading} />
                                    <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "0.75rem", textAlign: "center", fontWeight: "500" }}>Digite os 6 dígitos fornecidos pelo paciente</p>
                                </div>
                                <Button onClick={handleConfirmationCode} disabled={confirmationCode.length !== 6 || codeLoading} style={{ backgroundColor: "#15803d", color: "white", padding: "1.25rem 2.5rem", fontSize: "1.125rem", fontWeight: "700", borderRadius: "0.75rem", boxShadow: "0 4px 6px rgba(21, 128, 61, 0.3)", transition: "all 0.2s ease", width: "100%" }}>
                                    {codeLoading ? (<><Loader2 className="h-5 w-5 mr-2 animate-spin" />Validando...</>) : (<><CheckCircle className="h-5 w-5 mr-2" />Confirmar Atendimento</>)}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* --- CARD EMERGÊNCIA --- */}
                {visit.status === "CONFIRMED" && (
                    <Card style={{ marginBottom: "1.5rem", boxShadow: "0 4px 6px rgba(0, 0, 0, 0.07)", border: "2px solid #dc2626", background: "linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)" }}>
                        <CardContent style={{ padding: "2rem" }}>
                            {/* ... Conteúdo da Emergência ... */}
                            <div style={{ textAlign: "center" }}>
                                <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}><AlertTriangle className="h-12 w-12" style={{ color: "#dc2626" }} /></div>
                                <h3 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1f2937", marginBottom: "0.75rem" }}>Segurança em Primeiro Lugar</h3>
                                <p style={{ color: "#6b7280", marginBottom: "2rem", lineHeight: "1.7", fontSize: "1rem", maxWidth: "600px", margin: "0 auto 2rem" }}>Caso se sinta ameaçado ou em situação de risco durante o atendimento, pressione o botão abaixo. Um alerta será enviado imediatamente às autoridades competentes.</p>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button style={{ backgroundColor: "#dc2626", color: "white", padding: "1.5rem 3rem", fontSize: "1.125rem", fontWeight: "700", borderRadius: "0.75rem", boxShadow: "0 4px 6px rgba(220, 38, 38, 0.3)", transition: "all 0.2s ease", border: "none" }}><AlertTriangle className="h-5 w-5 mr-2" />Botão de Emergência</Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#dc2626" }}><AlertTriangle className="h-6 w-6" />Confirmar Alerta de Emergência</AlertDialogTitle>
                                            <AlertDialogDescription style={{ lineHeight: "1.7", fontSize: "1rem" }}>Você está prestes a enviar um alerta de emergência...<br /><br /><strong style={{ color: "#dc2626" }}>Use apenas em situações reais de emergência.</strong><br /><br />Deseja continuar?</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel disabled={actionLoading}>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleEmergency} disabled={actionLoading} style={{ backgroundColor: "#dc2626", color: "white" }}>
                                                {actionLoading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando...</>) : (<><AlertTriangle className="h-4 w-4 mr-2" />Confirmar Emergência</>)}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* --- TIMESTAMPS --- */}
                <div style={{ marginTop: "2rem", padding: "1rem", fontSize: "0.875rem", color: "#6b7280", textAlign: "center", backgroundColor: "white", borderRadius: "0.5rem", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)" }}>
                    <p style={{ marginBottom: "0.25rem" }}>Criado em: <span style={{ fontWeight: "600", color: "#1f2937" }}>{visit.created_at}</span></p>
                    <p>Última atualização: <span style={{ fontWeight: "600", color: "#1f2937" }}>{visit.updated_at}</span></p>
                </div>
            </div>

            {/* Emergency Alert Dialog (Mantido aqui, mas trigger está no card) */}
            <AlertDialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
                {/* ... conteúdo do AlertDialog ... */}
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#dc2626" }}>
                            <AlertTriangle className="h-6 w-6" />
                            Confirmar Alerta de Emergência
                        </AlertDialogTitle>
                        <AlertDialogDescription style={{ lineHeight: "1.7", fontSize: "1rem" }}>
                            Você está prestes a enviar um alerta de emergência. Esta ação notificará imediatamente as autoridades
                            competentes sobre uma situação de risco.
                            <br />
                            <br />
                            <strong style={{ color: "#dc2626" }}>Use este recurso apenas em situações reais de emergência.</strong>
                            <br />
                            <br />
                            Deseja continuar?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={actionLoading}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleEmergency}
                            disabled={actionLoading}
                            style={{
                                backgroundColor: "#dc2626",
                                color: "white",
                            }}
                        >
                            {actionLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Enviando...
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