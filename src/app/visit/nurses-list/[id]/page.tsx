"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
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

interface NurseData {
    id: string
    name: string
    specialization: string
    experience: number
    rating: number
    price: number // O preço por hora do enfermeiro
    shift: string
    department: string
    image: string
    available: boolean
    location: string
    bio: string
    qualifications: string[]
    services: string[]
    reviews: Array<{
        patient: string
        rating: number
        comment: string
        date: string
    }>
    availability: Array<{
        day: string
        hours: string
    }>
}

interface ApiResponse {
    data: NurseData
    message: string
    success: boolean
}

export default function NurseProfile() {
    const params = useParams()
    const router = useRouter()
    const nurseId = params.id as string

    const [nurse, setNurse] = useState<NurseData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Estados para o formulário de agendamento
    const [selectedDate, setSelectedDate] = useState("")
    const [selectedTime, setSelectedTime] = useState("")
    const [message, setMessage] = useState("")
    const [showBookingForm, setShowBookingForm] = useState(false)
    const [reason, setReason] = useState("")
    const [visitType, setVisitType] = useState("domiciliar")
    const [value, setValue] = useState("") // 👈 Nova alteração: Estado para o Valor

    // Estados para o processo de agendamento
    const [bookingLoading, setBookingLoading] = useState(false)
    const [bookingSuccess, setBookingSuccess] = useState(false)
    const [bookingError, setBookingError] = useState<string | null>(null)

    useEffect(() => {
        const fetchNurseData = async () => {
            try {
                setLoading(true);
                const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
                const response = await fetch(`${API_BASE_URL}/user/nurse/${nurseId}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
                    },
                });
                console.log("response", response);

                // ================== MUDANÇA PRINCIPAL ==================

                // 1. Leia a resposta JSON ANTES de verificar o status 'ok'.
                //    Isso garante que você tenha a mensagem de erro da API.
                const result: ApiResponse = await response.json();
                console.log("result", result);

                // 2. Agora, verifique o status da resposta.
                //    Se não estiver 'ok', lance um erro usando a mensagem da API.
                if (!response.ok) {
                    throw new Error(result.message || "Erro ao buscar dados do enfermeiro.");
                }

                // A lógica de sucesso continua a mesma.
                // O `else if` anterior se torna desnecessário com esta nova estrutura.
                if (result.success && result.data) {
                    setNurse(result.data);
                    setValue(result.data.price > 0 ? String(result.data.price) : "");
                } else {
                    // Um fallback caso a API retorne sucesso mas sem dados.
                    throw new Error(result.message || "Erro ao carregar dados do enfermeiro");
                }

                // ================== FIM DA MUDANÇA ==================

            } catch (err) {
                setError(err instanceof Error ? err.message : "Erro desconhecido");
            } finally {
                setLoading(false);
            }
        };

        if (nurseId) {
            fetchNurseData();
        }
    }, [nurseId]);

    const handleBooking = async () => {
        if (!selectedDate || !selectedTime || !value) { // 👈 Alteração: Validar o campo 'value'
            setBookingError("Por favor, selecione data, horário e informe o valor.")
            return
        }

        const numericValue = parseFloat(value.replace(",", ".")) // 💡 Limpeza: Garante que o valor é numérico
        if (isNaN(numericValue) || numericValue <= 0) {
            setBookingError("O valor deve ser um número positivo válido.")
            return
        }

        try {
            setBookingLoading(true)
            setBookingError(null)

            // Combine data e hora em formato ISO (pode ser necessário ajuste de fuso horário no backend)
            // Aqui mantemos o formato Z para indicar UTC, conforme o código original.
            const dateTimeString = `${selectedDate}T${selectedTime}:00Z`

            const requestBody = {
                description: message || "Consulta de enfermagem",
                reason: reason || "Atendimento geral",
                visit_type: visitType,
                nurse_id: nurseId,
                date: dateTimeString,
                value: numericValue, // 👈 Nova alteração: Incluir o valor numérico
            }

            const token = localStorage.getItem("token")
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

            const response = await fetch(`${API_BASE_URL}/user/visit`, { // 💡 Boa Prática: Usar a constante API_BASE_URL
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token ?? ""}`,
                },
                body: JSON.stringify(requestBody),
            })

            const result = await response.json()

            if (response.ok && result.success) {
                toast.success("Consulta solicitada com sucesso!")
                setBookingSuccess(true)
                setBookingError(null)

                // Limpar o formulário e fechar o diálogo
                setTimeout(() => {
                    setShowBookingForm(false)
                    setBookingSuccess(false)
                    setSelectedDate("")
                    setSelectedTime("")
                    setMessage("")
                    setReason("")
                    setVisitType("domiciliar")
                    setValue(nurse && typeof nurse.price === "number" && nurse.price > 0 ? String(nurse.price) : "") // 👈 Alteração: Limpa/Reseta o campo value com checagem segura
                }, 2000)
            } else {
                throw new Error(result.message || "Erro ao agendar visita. Verifique a disponibilidade.")
            }
        } catch (err) {
            setBookingError(err instanceof Error ? err.message : "Erro desconhecido ao agendar")
        } finally {
            setBookingLoading(false)
        }
    }

    // Código de exibição omitido para brevidade, foco no Dialog
    if (loading) {
        return (
            <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
                <Header />
                <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem", textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                        <div style={{ color: "#15803d", fontSize: "1.125rem" }}>Carregando perfil do enfermeiro...</div>
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
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
    const imageUrl = nurse?.image ? `${API_BASE_URL}/user/file/${nurse.image}` : "/placeholder-avatar.png"

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
            <Header />

            <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem" }}>
                {/* Botão Voltar */}
                <Button
                    onClick={() => router.back()}
                    variant="outline"
                    style={{ marginBottom: "1.5rem", borderColor: "#15803d", color: "#15803d" }}
                >
                    ← Voltar à Lista
                </Button>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2rem" }}>
                    {/* Coluna Esquerda - Info Enfermeiro */}
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

                                {/* <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginBottom: "1rem" }}>
                                    <Badge
                                        variant={nurse.available ? "default" : "secondary"}
                                        style={{ backgroundColor: nurse.available ? "#15803d" : "#6b7280" }}
                                    >
                                        {nurse.available ? "Disponível" : "Indisponível"}
                                    </Badge>
                                </div> */}

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                                    <div style={{ textAlign: "center" }}>
                                        <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#15803d" }}>{nurse.experience}</div>
                                        <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Anos de experiência</div>
                                    </div>
                                    <div style={{ textAlign: "center" }}>
                                        <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#15803d" }}>
                                            ⭐ {nurse.rating > 0 ? nurse.rating : "N/A"}
                                        </div>
                                        <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Avaliação</div>
                                    </div>
                                </div>

                                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#15803d", marginBottom: "0.25rem" }}>
                                    {nurse.price > 0 ? `R$ ${nurse.price}/hora` : "Preço a combinar"}
                                </div>
                                <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "1.5rem" }}>📍 {nurse.location}</p>

                                <Button
                                    onClick={() => setShowBookingForm(true)}
                                    style={{ backgroundColor: "#15803d", color: "white", width: "100%" }}
                                >
                                    Agendar Consulta
                                </Button>                            </CardContent>
                        </Card>

                        {/* Disponibilidade */}
                        <Card>
                            <CardHeader>
                                <CardTitle style={{ color: "#15803d" }}>Disponibilidade</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {nurse.availability && nurse.availability.length > 0 ? (
                                    nurse.availability.map((slot, index) => (
                                        <div
                                            key={index}
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                padding: "0.5rem 0",
                                                borderBottom: index < nurse.availability.length - 1 ? "1px solid #e5e7eb" : "none",
                                            }}
                                        >
                                            <span style={{ fontWeight: "600" }}>{slot.day}</span>
                                            <span style={{ color: "#6b7280" }}>{slot.hours}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p style={{ color: "#6b7280", textAlign: "center" }}>Disponibilidade não informada</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Coluna Direita - Detalhes */}
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

                        {/* Qualificações */}
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

                        {/* Serviços */}
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

                        {/* Avaliações */}
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

            <Dialog open={showBookingForm} onOpenChange={setShowBookingForm}>
                <DialogContent style={{ maxWidth: "600px" }}>
                    <DialogHeader>
                        <DialogTitle style={{ color: "#15803d", fontSize: "1.5rem" }}>Agendar Consulta</DialogTitle>
                        <DialogDescription>Preencha os dados abaixo para agendar uma consulta com {nurse.name}</DialogDescription>
                    </DialogHeader>

                    <div style={{ marginTop: "1rem" }}>

                        {bookingError && (
                            <div
                                style={{
                                    backgroundColor: "#fee2e2",
                                    color: "#dc2626",
                                    padding: "1rem",
                                    borderRadius: "0.5rem",
                                    marginBottom: "1rem",
                                    textAlign: "center",
                                }}
                            >
                                {bookingError}
                            </div>
                        )}

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                            <div>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Data</label>
                                <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                            </div>
                            <div>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Horário</label>
                                <Select value={selectedTime} onValueChange={setSelectedTime}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o horário" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="08:00">08:00</SelectItem>
                                        <SelectItem value="09:00">09:00</SelectItem>
                                        <SelectItem value="10:00">10:00</SelectItem>
                                        <SelectItem value="11:00">11:00</SelectItem>
                                        <SelectItem value="14:00">14:00</SelectItem>
                                        <SelectItem value="15:00">15:00</SelectItem>
                                        <SelectItem value="16:00">16:00</SelectItem>
                                        <SelectItem value="17:00">17:00</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div style={{ marginBottom: "1rem" }}>
                            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Valor da Consulta (R$)</label>
                            {/* 👈 Nova alteração: Campo de Valor */}
                            <Input
                                type="number"
                                placeholder="Ex: 80.00"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                            />
                        </div>

                        <div style={{ marginBottom: "1rem" }}>
                            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Tipo de Visita</label>
                            <Select value={visitType} onValueChange={setVisitType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="domiciliar">Domiciliar</SelectItem>
                                    <SelectItem value="hospitalar">Hospitalar</SelectItem>
                                    <SelectItem value="clinica">Clínica</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div style={{ marginBottom: "1rem" }}>
                            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Motivo da Consulta</label>
                            <Input
                                placeholder="Ex: Acompanhamento pós-operatório"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </div>

                        <div style={{ marginBottom: "1rem" }}>
                            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
                                Descrição (opcional)
                            </label>
                            <Textarea
                                placeholder="Descreva brevemente o tipo de cuidado necessário..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                        </div>

                        <div style={{ display: "flex", gap: "1rem" }}>
                            <Button
                                onClick={() => setShowBookingForm(false)}
                                variant="outline"
                                style={{ flex: 1 }}
                                disabled={bookingLoading}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleBooking}
                                style={{ backgroundColor: "#15803d", color: "white", flex: 1 }}
                                disabled={!selectedDate || !selectedTime || !value || bookingLoading} // 👈 Alteração: Desabilita se 'value' estiver vazio
                            >
                                {bookingLoading ? "Agendando..." : "Confirmar Agendamento"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}