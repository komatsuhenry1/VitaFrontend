"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { ArrowLeft, Loader2 } from "lucide-react"

interface NurseData {
    id: string
    name: string
    specialization: string
    experience: number
    rating: number
    price: number
    shift: string
    department: string
    image: string
    online: boolean // <-- MUDANÇA: de 'available' para 'online'
    neighborhood: string
    bio: string
    qualifications: string[]
    services: string[]
    reviews: Array<{
        patient: string
        rating: number
        comment: string
        date: string
    }>
    // <-- MUDANÇA: 'availability' removido e campos da API adicionados
    days_available: string[] | null
    start_time: string | null
    end_time: string | null
}

interface ApiResponse {
    data: NurseData
    message: string
    success: boolean
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_BASE_URL

export default function ImmediateConsultationNurseProfile() {
    const params = useParams()
    const router = useRouter()
    const nurseId = params.id as string

    const [nurse, setNurse] = useState<NurseData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Estados para o diálogo de consulta imediata
    const [showConsultationDialog, setShowConsultationDialog] = useState(false)
    const [description, setDescription] = useState("")
    const [reason, setReason] = useState("")
    const [cep, setCep] = useState("")
    const [street, setStreet] = useState("")
    const [number, setNumber] = useState("")
    const [complement, setComplement] = useState("")
    const [neighborhood, setNeighborhood] = useState("")
    const [sending, setSending] = useState(false)

    const socketRef = useRef<WebSocket | null>(null)

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
                    throw new Error(result.message || "Erro ao buscar dados do enfermeiro.")
                }

                if (result.success && result.data) {
                    setNurse(result.data)
                } else {
                    throw new Error(result.message || "Erro ao carregar dados do enfermeiro")
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Erro desconhecido")
            } finally {
                setLoading(false)
            }
        }

        if (nurseId) {
            fetchNurseData()
        }
    }, [nurseId])

    useEffect(() => {
        const token = localStorage.getItem("token")
        if (!token) return

        const socket = new WebSocket(`${WS_BASE_URL}/ws/chat?token=${token}`)
        socketRef.current = socket

        socket.onopen = () => console.log("[v0] WebSocket: Conexão estabelecida para consulta imediata")
        socket.onclose = () => console.log("[v0] WebSocket: Conexão encerrada")
        socket.onerror = (error) => console.error("[v0] WebSocket: Erro detectado:", error)

        return () => {
            if (socketRef.current) {
                socketRef.current.close()
            }
        }
    }, [])

    const handleRequestConsultation = async () => {
        if (
            !description.trim() ||
            !reason.trim() ||
            !cep.trim() ||
            !street.trim() ||
            !number.trim() ||
            !neighborhood.trim()
        ) {
            toast.error("Por favor, preencha todos os campos obrigatórios")
            return
        }

        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
            toast.error("Erro de conexão. Tente novamente.")
            return
        }

        try {
            setSending(true)

            const consultationData = {
                description: description.trim(),
                reason: reason.trim(),
                cep: cep.trim(),
                street: street.trim(),
                number: number.trim(),
                complement: complement.trim(),
                neighborhood: neighborhood.trim(),
            }

            const messagePayload = {
                receiver_id: nurseId,
                message: `Solicitação de Consulta Imediata:\n\nMotivo: ${consultationData.reason}\n\nDescrição: ${consultationData.description}\n\nEndereço:\n${consultationData.street}, ${consultationData.number}${consultationData.complement ? ` - ${consultationData.complement}` : ""}\n${consultationData.neighborhood}\nCEP: ${consultationData.cep}`,
            }

            socketRef.current.send(JSON.stringify(messagePayload))

            toast.success("Solicitação enviada com sucesso!")

            setTimeout(() => {
                router.push(`/chats?selected=${nurseId}`)
            }, 1000)
        } catch (err) {
            toast.error("Erro ao enviar solicitação. Tente novamente.")
            console.error("[v0] Erro ao enviar mensagem:", err)
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
                        <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4" style={{ color: "#15803d" }} />
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

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
            <Header />

            <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem" }}>


                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2rem" }}>
                    {/* Left Column - Nurse Info */}
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
                                        variant={nurse.online ? "default" : "secondary"} // <-- MUDANÇA
                                        style={{ backgroundColor: nurse.online ? "#15803d" : "#6b7280" }} // <-- MUDANÇA
                                    >
                                        {nurse.online ? "Online Agora" : "Offline"} {/* <-- MUDANÇA */}
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
                                <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "1.5rem" }}>📍 {nurse.neighborhood}</p>

                                <Button
                                    onClick={() => setShowConsultationDialog(true)}
                                    disabled={!nurse.online} // <-- MUDANÇA
                                    style={{
                                        backgroundColor: nurse.online ? "#15803d" : "#9ca3af", // <-- MUDANÇA
                                        color: "white",
                                        width: "100%",
                                        cursor: nurse.online ? "pointer" : "not-allowed", // <-- MUDANÇA
                                    }}
                                >
                                    {nurse.online ? "Solicitar Consulta Imediata" : "Enfermeiro Indisponível"} {/* <-- MUDANÇA */}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Availability */}
                        {/* <-- MUDANÇA: Bloco inteiro de disponibilidade atualizado */}
                        <Card>
                            <CardHeader>
                                <CardTitle style={{ color: "#15803d" }}>Disponibilidade</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {nurse.days_available && nurse.days_available.length > 0 && nurse.start_time && nurse.end_time ? (
                                    <>
                                        <div style={{ marginBottom: "1rem" }}>
                                            <span style={{ fontWeight: "600", display: "block", marginBottom: "0.25rem" }}>
                                                Horário:
                                            </span>
                                            <span style={{ color: "#6b7280" }}>{`${nurse.start_time} - ${nurse.end_time}`}</span>
                                        </div>
                                        <div>
                                            <span style={{ fontWeight: "600", display: "block", marginBottom: "0.5rem" }}>
                                                Dias da Semana:
                                            </span>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                                                {nurse.days_available.map((day) => (
                                                    <Badge
                                                        key={day}
                                                        variant="outline"
                                                        style={{ borderColor: "#15803d", color: "#15803d" }}
                                                    >
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

                    {/* Right Column - Details */}
                    <div>
                        {/* Bio */}
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

                        {/* Qualifications */}
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
                                                    borderBottom:
                                                        index < nurse.qualifications.length - 1 ? "1px solid #e5e7eb" : "none",
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

                        {/* Services */}
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

                        {/* Reviews */}
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
                                                <span style={{ fontWeight: "600" }}>{review.patient}</span>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                    <span style={{ color: "#15803d" }}>{`⭐`.repeat(Math.floor(review.rating))}</span>
                                                    <span style={{ color: "#6b7280", fontSize: "0.875rem" }}>{review.date}</span>
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

            <Dialog open={showConsultationDialog} onOpenChange={setShowConsultationDialog}>
                <DialogContent style={{ maxWidth: "600px", maxHeight: "90vh", overflowY: "auto" }}>
                    <DialogHeader>
                        <DialogTitle style={{ color: "#15803d", fontSize: "1.5rem" }}>Solicitar Consulta Imediata</DialogTitle>
                        <DialogDescription>
                            Preencha os dados abaixo para solicitar uma consulta imediata com {nurse.name}.
                        </DialogDescription>
                    </DialogHeader>

                    <div style={{ marginTop: "1rem" }}>
                        {/* Motivo da Consulta */}
                        <div style={{ marginBottom: "1rem" }}>
                            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
                                Motivo da Consulta <span style={{ color: "#dc2626" }}>*</span>
                            </label>
                            <Input
                                placeholder="Ex: Aplicação de medicação, Curativo, Aferição de pressão..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                disabled={sending}
                            />
                        </div>

                        {/* Descrição */}
                        <div style={{ marginBottom: "1rem" }}>
                            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
                                Descrição <span style={{ color: "#dc2626" }}>*</span>
                            </label>
                            <Textarea
                                placeholder="Descreva detalhadamente o atendimento necessário..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
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
                            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
                                CEP <span style={{ color: "#dc2626" }}>*</span>
                            </label>
                            <Input
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
                                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
                                    Rua <span style={{ color: "#dc2626" }}>*</span>
                                </label>
                                <Input
                                    placeholder="Nome da rua"
                                    value={street}
                                    onChange={(e) => setStreet(e.target.value)}
                                    disabled={sending}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
                                    Número <span style={{ color: "#dc2626" }}>*</span>
                                </label>
                                <Input
                                    placeholder="123"
                                    value={number}
                                    onChange={(e) => setNumber(e.target.value)}
                                    disabled={sending}
                                />
                            </div>
                        </div>

                        {/* Complemento */}
                        <div style={{ marginBottom: "1rem" }}>
                            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Complemento</label>
                            <Input
                                placeholder="Apto, Bloco, etc. (opcional)"
                                value={complement}
                                onChange={(e) => setComplement(e.target.value)}
                                disabled={sending}
                            />
                        </div>

                        {/* Bairro */}
                        <div style={{ marginBottom: "1.5rem" }}>
                            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
                                Bairro <span style={{ color: "#dc2626" }}>*</span>
                            </label>
                            <Input
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
                                        Enviando...
                                    </>
                                ) : (
                                    "Solicitar Consulta"
                                )}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}