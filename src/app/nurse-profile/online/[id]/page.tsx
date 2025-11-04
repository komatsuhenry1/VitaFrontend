"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Footer } from "@/components/Footer"

// Interfaces (mantidas iguais)
interface NurseData {
    id: string
    name: string
    specialization: string
    experience: number
    rating: number
    price: number // Precisamos do preço
    shift: string
    department: string
    image: string
    online: boolean
    neighborhood: string
    bio: string
    qualifications: string[]
    services: string[]
    reviews: Array<{
        patient_name: string
        rating: number
        comment: string
    }>
    days_available: string[] | null
    start_time: string | null
    end_time: string | null
}

interface ApiResponse {
    data: NurseData
    message: string
    success: boolean
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api/v1"

export default function ImmediateConsultationNurseProfile() {
    const params = useParams()
    const router = useRouter()
    const nurseId = params.id as string

    const [nurse, setNurse] = useState<NurseData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Helper para pegar o horário atual formatado (ex: "14:30")
    const getFormattedCurrentTime = () => {
        const now = new Date()
        const hours = now.getHours().toString().padStart(2, "0")
        const minutes = now.getMinutes().toString().padStart(2, "0")
        return `${hours}:${minutes}`
    }

    // Estados para o diálogo
    const [showConsultationDialog, setShowConsultationDialog] = useState(false)
    const [description, setDescription] = useState("")
    const [reason, setReason] = useState("")
    const [visitType, setVisitType] = useState("domiciliar")
    const [visitTime, setVisitTime] = useState(getFormattedCurrentTime()) // NOVO ESTADO
    const [cep, setCep] = useState("")
    const [street, setStreet] = useState("")
    const [number, setNumber] = useState("")
    const [complement, setComplement] = useState("")
    const [neighborhood, setNeighborhood] = useState("")
    const [sending, setSending] = useState(false)

    // useEffect para buscar dados do enfermeiro (mantido igual)
    useEffect(() => {
        const fetchNurseData = async () => {
            try {
                setLoading(true)
                const response = await fetch(`${API_BASE_URL}/user/nurse/${nurseId}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
                    },
                })

                const result: ApiResponse = await response.json()

                if (!response.ok) {
                    // Adicionamos o log da resposta de erro aqui também
                    console.error("Erro ao buscar dados do enfermeiro (resposta do backend):", result)
                    throw new Error(result.message || "Erro ao buscar dados do enfermeiro.")
                }

                if (result.success && result.data) {
                    setNurse(result.data)
                } else {
                    throw new Error(result.message || "Erro ao carregar dados do enfermeiro")
                }
            } catch (err) {
                // Logamos o erro final
                console.error("Erro no fetchNurseData:", err)
                setError(err instanceof Error ? err.message : "Erro desconhecido")
            } finally {
                setLoading(false)
            }
        }

        if (nurseId) {
            fetchNurseData()
        }
    }, [nurseId])

    // ============================================
    // ALTERAÇÃO PRINCIPAL: handleRequestConsultation
    // ============================================
    const handleRequestConsultation = async () => {
        // Validação dos campos (mantida e correta)
        if (
            !description.trim() ||
            !reason.trim() ||
            !visitType.trim() ||
            !visitTime.trim() || // <-- ADICIONADO
            !cep.trim() ||
            !street.trim() ||
            !number.trim() ||
            !neighborhood.trim()
        ) {
            toast.error("Por favor, preencha todos os campos obrigatórios")
            return
        }

        // Verifica se temos os dados do enfermeiro (nurseId já é validado pelo useRouter)
        if (!nurse) {
            toast.error("Dados do enfermeiro não carregados. Tente novamente.")
            return
        }

        // Pega o token do paciente
        const token = localStorage.getItem("token")
        if (!token) {
            toast.error("Erro de autenticação. Faça login novamente.")
            router.push("/login") // Redireciona para login se não houver token
            return
        }

        setSending(true) // Inicia o estado de envio

        // --- PREPARA A DATA ---
        // Criar a data de hoje
        const today = new Date()
        const [hours, minutes] = visitTime.split(":")

        // Definir o horário no objeto Date (no fuso horário local)
        today.setHours(Number.parseInt(hours, 10))
        today.setMinutes(Number.parseInt(minutes, 10))
        today.setSeconds(0)
        today.setMilliseconds(0)

        // Formatar para ISO 8601 em UTC (formato "Z")
        const visitDateISO = today.toISOString()
        // --- FIM PREPARA A DATA ---

        // Monta o corpo da requisição conforme o DTO esperado pelo backend
        const requestBody = {
            nurse_id: nurse.id, // ID do enfermeiro vindo do estado 'nurse'
            value: nurse.price, // <-- ADICIONADO (Vem do perfil do enfermeiro)
            date: visitDateISO, // <-- ADICIONADO (Data/hora formatada)
            description: description.trim(),
            reason: reason.trim(),
            visit_type: visitType,
            cep: cep.trim(),
            street: street.trim(),
            number: number.trim(),
            complement: complement.trim(),
            neighborhood: neighborhood.trim(),
        }

        try {
            // Faz a chamada POST para o endpoint correto
            const response = await fetch(`${API_BASE_URL}/user/immediate-visit`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`, // Token do PACIENTE
                },
                body: JSON.stringify(requestBody),
            })

            // Processa a resposta do backend
            if (response.ok) {
                const result = await response.json() // Opcional, se precisar de dados da resposta
                toast.success(result.message || "Solicitação enviada com sucesso!")

                // Fecha o dialog
                setShowConsultationDialog(false)

                // Limpa os campos (opcional)
                setDescription("")
                setReason("")
                setVisitTime(getFormattedCurrentTime()) // <-- RESETADO
                setCep("")
                setStreet("")
                setNumber("")
                setComplement("")
                setNeighborhood("")
                setVisitType("domiciliar")

                // Redireciona para a tela de espera ou confirmação (ajuste a rota se necessário)
                // Poderia ser uma nova página tipo /solicitacao/[visitId]/aguardando
                toast.info("Aguardando confirmação do enfermeiro...")
                // router.push(`/chats?selected=${nurseId}`) // Ou redireciona para o chat
            } else {
                // Tenta pegar a mensagem de erro do backend
                const errorResult = await response.json()
                console.error("Resposta de erro completa do backend:", errorResult)
                // Tenta pegar 'error' ou 'message' do JSON de resposta
                throw new Error(
                    errorResult.message || errorResult.error || `Erro ${response.status}: Falha ao solicitar visita.`,
                )
            }
        } catch (err) {
            // Mostra o erro para o usuário
            toast.error(err instanceof Error ? err.message : "Erro desconhecido ao enviar solicitação.")
            console.error("Erro ao solicitar visita imediata (no catch final):", err) // Loga o erro já processado
        } finally {
            setSending(false)
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
                        <p style={{ color: "#6b7280" }}>Carregando perfil do enfermeiro...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (error || !nurse) {
        return (
            <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
                <Header />
                <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem", textAlign: "center" }}>
                    <h1 style={{ color: "#dc2626", marginBottom: "1rem" }}>{error || "Enfermeiro não encontrado"}</h1>
                    <Button onClick={() => router.back()} style={{ marginTop: "1rem" }}>
                        Voltar
                    </Button>
                </div>
            </div>
        )
    }

    const imageUrl = nurse?.image ? `${API_BASE_URL}/user/file/${nurse.image}` : "/placeholder-avatar.png"

    // JSX principal (mantido igual, exceto pelo Dialog)
    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
            <Header />

            <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2rem" }}>
                    {/* Left Column - Nurse Info (mantido igual) */}
                    <div>
                        <Card style={{ marginBottom: "1.5rem" }}>
                            <CardContent style={{ padding: "2rem", textAlign: "center" }}>
                                <div
                                    style={{
                                        position: "relative",
                                        width: "150px",
                                        height: "150px",
                                        borderRadius: "50%",
                                        overflow: "hidden",
                                        margin: "0 auto 1rem",
                                    }}
                                >
                                    <Image src={imageUrl || "/placeholder.svg"} alt={nurse.name} fill style={{ objectFit: "cover" }} />
                                </div>
                                <h1 style={{ fontSize: "1.75rem", fontWeight: "bold", marginBottom: "0.5rem", color: "#1f2937" }}>
                                    {nurse.name}
                                </h1>
                                <p style={{ color: "#15803d", fontWeight: "600", fontSize: "1.125rem", marginBottom: "0.5rem" }}>
                                    {nurse.specialization}
                                </p>
                                <p style={{ color: "#6b7280", marginBottom: "1rem" }}>{nurse.department}</p>

                                <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginBottom: "1rem" }}>
                                    <Badge
                                        variant={nurse.online ? "default" : "secondary"}
                                        style={{ backgroundColor: nurse.online ? "#15803d" : "#6b7280" }}
                                    >
                                        {nurse.online ? "Online Agora" : "Offline"}
                                    </Badge>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                                    <div style={{ textAlign: "center" }}>
                                        <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#15803d" }}>{nurse.experience}</div>
                                        <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Anos de experiência</div>
                                    </div>
                                    <div style={{ textAlign: "center" }}>
                                        <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#15803d" }}>
                                            ⭐ {nurse.rating > 0 ? nurse.rating.toFixed(1) : "N/A"}
                                        </div>
                                        <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Avaliação</div>
                                    </div>
                                </div>

                                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#15803d", marginBottom: "0.25rem" }}>
                                    {nurse.price > 0 ? `R$ ${nurse.price}/hora` : "Preço a combinar"}
                                </div>
                                <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
                                    📍 {nurse.neighborhood}
                                </p>

                                <Button
                                    onClick={() => setShowConsultationDialog(true)}
                                    disabled={!nurse.online}
                                    style={{
                                        backgroundColor: nurse.online ? "#15803d" : "#9ca3af",
                                        color: "white",
                                        width: "100%",
                                        cursor: nurse.online ? "pointer" : "not-allowed",
                                    }}
                                >
                                    {nurse.online ? "Solicitar Consulta Imediata" : "Enfermeiro Indisponível"}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Availability (mantido igual) */}
                        <Card>
                            <CardHeader>
                                <CardTitle style={{ color: "#15803d" }}>Disponibilidade</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {nurse.days_available && nurse.days_available.length > 0 && nurse.start_time && nurse.end_time ? (
                                    <>
                                        <div style={{ marginBottom: "1rem" }}>
                                            <span style={{ fontWeight: "600", display: "block", marginBottom: "0.25rem" }}>Horário:</span>
                                            <span style={{ color: "#6b7280" }}>{`${nurse.start_time} - ${nurse.end_time}`}</span>
                                        </div>
                                        <div>
                                            <span style={{ fontWeight: "600", display: "block", marginBottom: "0.5rem" }}>
                                                Dias da Semana:
                                            </span>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                                                {nurse.days_available.map((day) => (
                                                    <Badge key={day} variant="outline" style={{ borderColor: "#15803d", color: "#15803d" }}>
                                                        {day}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <p style={{ color: "#6b7280", textAlign: "center" }}>Disponibilidade não informada</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Details (mantido igual) */}
                    <div>
                        {/* ... (Cards de Bio, Qualificações, Serviços mantidos iguais) ... */}
                        <Card style={{ marginBottom: "1.5rem" }}>
                            <CardHeader>
                                <CardTitle style={{ color: "#15803d" }}>Sobre</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p style={{ lineHeight: "1.6", color: "#4b5563" }}>
                                    {nurse.bio || "Informações sobre o profissional não disponíveis."}
                                </p>
                            </CardContent>
                        </Card>

                        <Card style={{ marginBottom: "1.5rem" }}>
                            <CardHeader>
                                <CardTitle style={{ color: "#15803d" }}>Qualificações</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {nurse.qualifications && nurse.qualifications.length > 0 ? (
                                    <ul style={{ listStyle: "none", padding: 0 }}>
                                        {nurse.qualifications.map((qualification, index) => (
                                            <li
                                                key={index}
                                                style={{
                                                    padding: "0.5rem 0",
                                                    borderBottom: index < nurse.qualifications.length - 1 ? "1px solid #e5e7eb" : "none",
                                                }}
                                            >
                                                <span style={{ color: "#15803d", marginRight: "0.5rem" }}>✓</span>
                                                {qualification}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p style={{ color: "#6b7280", textAlign: "center" }}>Qualificações não informadas</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card style={{ marginBottom: "1.5rem" }}>
                            <CardHeader>
                                <CardTitle style={{ color: "#15803d" }}>Serviços Oferecidos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {nurse.services && nurse.services.length > 0 ? (
                                    <ul style={{ listStyle: "none", padding: 0 }}>
                                        {nurse.services.map((service, index) => (
                                            <li
                                                key={index}
                                                style={{
                                                    padding: "0.5rem 0",
                                                    borderBottom: index < nurse.services.length - 1 ? "1px solid #e5e7eb" : "none",
                                                }}
                                            >
                                                <span style={{ color: "#15803d", marginRight: "0.5rem" }}>•</span>
                                                {service}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p style={{ color: "#6b7280", textAlign: "center" }}>Serviços não informados</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle style={{ color: "#15803d" }}>Avaliações dos Pacientes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {nurse.reviews && nurse.reviews.length > 0 ? (
                                    nurse.reviews.map((review, index) => (
                                        <div
                                            key={index}
                                            style={{
                                                padding: "1rem 0",
                                                borderBottom: index < nurse.reviews.length - 1 ? "1px solid #e5e7eb" : "none",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    marginBottom: "0.5rem",
                                                }}
                                            >
                                                <span style={{ fontWeight: "600" }}>{review.patient_name}</span>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                    <span style={{ color: "#15803d" }}>{`⭐`.repeat(Math.floor(review.rating))}</span>
                                                </div>
                                            </div>
                                            <p style={{ color: "#4b5563", lineHeight: "1.5" }}>{review.comment}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p style={{ color: "#6b7280", textAlign: "center" }}>Nenhuma avaliação disponível</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Dialog de Solicitação (Função handleRequestConsultation atualizada) */}
            <Dialog open={showConsultationDialog} onOpenChange={setShowConsultationDialog}>
                <DialogContent style={{ maxWidth: "600px", maxHeight: "90vh", overflowY: "auto" }}>
                    {/* Conteúdo do Dialog (mantido igual) */}
                    <DialogHeader>
                        <DialogTitle style={{ color: "#15803d", fontSize: "1.5rem" }}>Solicitar Consulta Imediata</DialogTitle>
                        <DialogDescription>
                            Preencha os dados abaixo para solicitar uma consulta imediata com {nurse?.name}.
                        </DialogDescription>
                    </DialogHeader>

                    <div style={{ marginTop: "1rem" }}>
                        {/* Motivo da Consulta */}
                        <div style={{ marginBottom: "1rem" }}>
                            <Label htmlFor="reason">
                                Motivo da Consulta <span style={{ color: "#dc2626" }}>*</span>
                            </Label>
                            <Input
                                id="reason"
                                placeholder="Ex: Aplicação de medicação, Curativo..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                disabled={sending}
                            />
                        </div>

                        {/* Descrição */}
                        <div style={{ marginBottom: "1rem" }}>
                            <Label htmlFor="description">
                                Descrição <span style={{ color: "#dc2626" }}>*</span>
                            </Label>
                            <Textarea
                                id="description"
                                placeholder="Descreva detalhadamente o atendimento necessário..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                disabled={sending}
                            />
                        </div>

                        {/* Tipo de Visita */}
                        <div style={{ marginBottom: "1rem" }}>
                            <Label htmlFor="visitType">
                                Tipo de Visita <span style={{ color: "#dc2626" }}>*</span>
                            </Label>
                            <Select value={visitType} onValueChange={setVisitType} disabled={sending}>
                                <SelectTrigger id="visitType">
                                    <SelectValue placeholder="Selecione o tipo de visita" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="domiciliar">Domiciliar</SelectItem>
                                    <SelectItem value="hospitalar">Hospitalar</SelectItem>
                                    <SelectItem value="clinica">Clínica</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Horário da Visita */}
                        <div style={{ marginBottom: "1rem" }}>
                            <Label htmlFor="visitTime">
                                Horário da Visita (Hoje) <span style={{ color: "#dc2626" }}>*</span>
                            </Label>
                            <Input
                                id="visitTime"
                                type="time"
                                value={visitTime}
                                onChange={(e) => setVisitTime(e.target.value)}
                                disabled={sending}
                            />
                        </div>

                        {/* Endereço para Atendimento */}
                        <div
                            style={{ marginTop: "1.5rem", marginBottom: "1rem", paddingTop: "1rem", borderTop: "1px solid #e5e7eb" }}
                        >
                            <h3 style={{ fontWeight: "600", color: "#1f2937", marginBottom: "1rem" }}>Endereço para Atendimento</h3>
                        </div>

                        {/* CEP */}
                        <div style={{ marginBottom: "1rem" }}>
                            <Label htmlFor="cep">
                                CEP <span style={{ color: "#dc2626" }}>*</span>
                            </Label>
                            <Input
                                id="cep"
                                placeholder="00000-000"
                                value={cep}
                                onChange={(e) => setCep(e.target.value)}
                                disabled={sending}
                                maxLength={9}
                            />
                        </div>

                        {/* Rua e Número */}
                        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                            <div>
                                <Label htmlFor="street">
                                    Rua <span style={{ color: "#dc2626" }}>*</span>
                                </Label>
                                <Input
                                    id="street"
                                    placeholder="Nome da rua"
                                    value={street}
                                    onChange={(e) => setStreet(e.target.value)}
                                    disabled={sending}
                                />
                            </div>
                            <div>
                                <Label htmlFor="number">
                                    Número <span style={{ color: "#dc2626" }}>*</span>
                                </Label>
                                <Input
                                    id="number"
                                    placeholder="123"
                                    value={number}
                                    onChange={(e) => setNumber(e.target.value)}
                                    disabled={sending}
                                />
                            </div>
                        </div>

                        {/* Complemento */}
                        <div style={{ marginBottom: "1rem" }}>
                            {" "}
                            {/* Ajuste de margem */}
                            <Label htmlFor="complement">Complemento</Label>
                            <Input
                                id="complement"
                                placeholder="Apto, Bloco, etc. (opcional)"
                                value={complement}
                                onChange={(e) => setComplement(e.target.value)}
                                disabled={sending}
                            />
                        </div>

                        {/* Bairro */}
                        <div style={{ marginBottom: "1.5rem" }}>
                            <Label htmlFor="neighborhood">
                                Bairro <span style={{ color: "#dc2626" }}>*</span>
                            </Label>
                            <Input
                                id="neighborhood"
                                placeholder="Nome do bairro"
                                value={neighborhood}
                                onChange={(e) => setNeighborhood(e.target.value)}
                                disabled={sending}
                            />
                        </div>

                        <div style={{ display: "flex", gap: "1rem" }}>
                            <Button
                                onClick={() => setShowConsultationDialog(false)}
                                variant="outline"
                                style={{ flex: 1 }}
                                disabled={sending}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleRequestConsultation}
                                style={{
                                    backgroundColor: "#15803d",
                                    color: "white",
                                    flex: 1,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "0.5rem",
                                }}
                                disabled={
                                    !description.trim() ||
                                    !reason.trim() ||
                                    !visitType.trim() ||
                                    !visitTime.trim() || // <-- ADICIONADO
                                    !cep.trim() ||
                                    !street.trim() ||
                                    !number.trim() ||
                                    !neighborhood.trim() ||
                                    sending
                                }
                            >
                                {sending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Enviando Solicitação...
                                    </>
                                ) : (
                                    "Solicitar Consulta Agora"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            <Footer />
        </div>
    )
}
