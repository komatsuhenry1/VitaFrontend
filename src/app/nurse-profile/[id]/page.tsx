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
import { Star } from "lucide-react"
import { toast } from "sonner"

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
    available: boolean // <--- É ESTE CAMPO
    neighborhood: string
    bio: string
    qualifications: string[]
    services: string[]
    days_available: string[]
    start_time: string
    end_time: string
}

interface ApiResponse {
    data: NurseData
    message: string
    success: boolean
}

const API_BASE_URL = "http://localhost:8081/api/v1"

const renderStars = (rating: number) => {
    // ... (Sua função renderStars, mantida igual)
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5

    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            stars.push(<Star key={i} size={24} fill="#fbbf24" color="#fbbf24" strokeWidth={1.5} />)
        } else if (i === fullStars && hasHalfStar) {
            stars.push(
                <div key={i} style={{ position: "relative", display: "inline-block" }}>
                    <Star size={24} fill="none" color="#d1d5db" strokeWidth={1.5} />
                    <Star
                        size={24}
                        fill="#fbbf24"
                        color="#fbbf24"
                        strokeWidth={1.5}
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            clipPath: "polygon(0 0, 50% 0, 50% 100%, 0 100%)",
                        }}
                    />
                </div>,
            )
        } else {
            stars.push(<Star key={i} size={24} fill="none" color="#d1d5db" strokeWidth={1.5} />)
        }
    }

    return stars
}

export default function NurseProfile() {
    const params = useParams()
    const router = useRouter()
    const nurseId = params.id as string

    const [nurse, setNurse] = useState<NurseData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [selectedDate, setSelectedDate] = useState("")
    const [selectedTime, setSelectedTime] = useState("")
    const [message, setMessage] = useState("")
    const [showBookingForm, setShowBookingForm] = useState(false)

    const [reason, setReason] = useState("")
    const [visitType, setVisitType] = useState("domiciliar")
    const [value, setValue] = useState("")

    const [bookingLoading, setBookingLoading] = useState(false)
    const [bookingSuccess, setBookingSuccess] = useState(false)
    const [bookingError, setBookingError] = useState<string | null>(null)

    useEffect(() => {
        const fetchNurseData = async () => {
            try {
                setLoading(true)
                const response = await fetch(`${API_BASE_URL}/user/nurse/${nurseId}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                })

                const result: ApiResponse = await response.json()

                if (!response.ok) {
                    throw new Error(result.message || "Enfermeiro não encontrado")
                }

                if (result.success && result.data) {
                    setNurse(result.data)
                    setValue(result.data.price > 0 ? String(result.data.price) : "")
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

    if (loading) {
        // ... (JSX de loading, mantido igual)
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
        // ... (JSX de erro, mantido igual)
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

    const handleBooking = async () => {
        // ... (lógica do handleBooking, mantida igual)
        if (!selectedDate || !selectedTime || !value) {
            setBookingError("Por favor, selecione data, horário e informe o valor.")
            return
        }

        const numericValue = parseFloat(value.replace(",", "."))
        if (isNaN(numericValue) || numericValue <= 0) {
            setBookingError("O valor deve ser um número positivo válido.")
            return
        }

        try {
            setBookingLoading(true)
            setBookingError(null)

            const dateTimeString = `${selectedDate}T${selectedTime}:00Z`

            const requestBody = {
                description: message || "Consulta de enfermagem",
                reason: reason || "Atendimento geral",
                visit_type: visitType,
                nurse_id: nurseId,
                date: dateTimeString,
                value: numericValue,
            }

            const token = localStorage.getItem("token")
            const response = await fetch(`${API_BASE_URL}/user/visit`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody),
            })

            const result = await response.json()

            if (response.ok && result.success) {
                toast.success("Visita agendada com sucesso!")
                setBookingSuccess(true)
                setBookingError(null)

                setTimeout(() => {
                    setShowBookingForm(false)
                    setBookingSuccess(false)
                    setSelectedDate("")
                    setSelectedTime("")
                    setMessage("")
                    setReason("")
                    setVisitType("domiciliar")
                    setValue(nurse && typeof nurse.price === "number" && nurse.price > 0 ? String(nurse.price) : "")
                }, 2000)
            } else {
                throw new Error(result.message || "Erro ao agendar visita")
            }
        } catch (err) {
            setBookingError(err instanceof Error ? err.message : "Erro ao agendar visita")
        } finally {
            setBookingLoading(false)
        }
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

                                {/* ==================
                                MUDANÇA FEITA AQUI
                                ==================
                                O bloco de código abaixo (que exibia Disponível/Indisponível) foi comentado.
                                
                                <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginBottom: "1rem" }}>
                                    <Badge
                                        variant={nurse.available ? "default" : "secondary"}
                                        style={{ backgroundColor: nurse.available ? "#15803d" : "#6b7280" }}
                                    >
                                        {nurse.available ? "Disponível" : "Indisponível"}
                                    </Badge>
                                </div>
                                */}

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                                    <div style={{ textAlign: "center" }}>
                                        <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#15803d" }}>{nurse.experience}</div>
                                        <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Anos de experiência</div>
                                    </div>
                                    <div style={{ textAlign: "center" }}>
                                        <div style={{ display: "flex", justifyContent: "center", gap: "0.25rem", marginBottom: "0.25rem" }}>
                                            {nurse.rating > 0 ? (
                                                renderStars(nurse.rating)
                                            ) : (
                                                <span style={{ color: "#6b7280" }}>Sem avaliações</span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                                            {nurse.rating > 0 ? `${nurse.rating.toFixed(1)} estrelas` : "Avaliação"}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#15803d", marginBottom: "0.25rem" }}>
                                    {nurse.price > 0 ? `R$ ${nurse.price}/hora` : "Preço a combinar"}
                                </div>
                                <p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "1.5rem" }}>📍 {nurse.neighborhood}</p>

                                <Button
                                    onClick={() => setShowBookingForm(true)}
                                    style={{ backgroundColor: "#15803d", color: "white", width: "100%" }}
                                >
                                    Agendar Consulta
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            {/* ... (JSX do Card de Disponibilidade, mantido igual) ... */}
                            <CardHeader>
                                <CardTitle style={{ color: "#15803d" }}>Disponibilidade</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {nurse.days_available && nurse.days_available.length > 0 ? (
                                    <>
                                        <div style={{ marginBottom: "1rem" }}>
                                            <div style={{ fontWeight: "600", marginBottom: "0.5rem", color: "#1f2937" }}>
                                                Dias Disponíveis:
                                            </div>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                                                {nurse.days_available.map((day, index) => (
                                                    <Badge key={index} style={{ backgroundColor: "#dcfce7", color: "#15803d" }}>
                                                        {day}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                        {nurse.start_time && nurse.end_time && (
                                            <div>
                                                <div style={{ fontWeight: "600", marginBottom: "0.5rem", color: "#1f2937" }}>
                                                    Horário de Trabalho:
                                                </div>
                                                <div style={{ color: "#6b7280" }}>
                                                    {nurse.start_time} - {nurse.end_time}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p style={{ color: "#6b7280", textAlign: "center" }}>Disponibilidade não informada</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Details */}
                    <div>
                        {/* ... (JSX dos Cards Sobre, Qualificações, Serviços, mantidos iguais) ... */}
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
                    </div>
                </div>
            </div>

            <Dialog open={showBookingForm} onOpenChange={setShowBookingForm}>
                {/* ... (JSX do Dialog, mantido igual) ... */}
                <DialogContent style={{ maxWidth: "600px" }}>
                    <DialogHeader>
                        <DialogTitle style={{ color: "#15803d", fontSize: "1.5rem" }}>Agendar Consulta</DialogTitle>
                        <DialogDescription>Preencha os dados abaixo para agendar uma consulta com {nurse.name}</DialogDescription>
                    </DialogHeader>

                    <div style={{ marginTop: "1rem" }}>
                        {bookingSuccess && (
                            <div
                                style={{
                                    backgroundColor: "#dcfce7",
                                    color: "#15803d",
                                    padding: "1rem",
                                    borderRadius: "0.5rem",
                                    marginBottom: "1rem",
                                    textAlign: "center",
                                    fontWeight: "600",
                                }}
                            >
                                ✓ Visita agendada com sucesso!
                            </div>
                        )}

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
                            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>
                                Valor da Consulta (R$)
                            </label>
                            <Input
                                type="number"
                                placeholder="Ex: 80.00"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                            />
                        </div>

                        <div style={{ marginBottom: "1sem" }}>
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
                                disabled={!selectedDate || !selectedTime || !value || bookingLoading}
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