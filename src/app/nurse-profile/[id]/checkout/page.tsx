"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Calendar, Clock, DollarSign, FileText, MapPin } from "lucide-react"
import { toast } from "sonner"
import { Footer } from "@/components/Footer"

interface NurseData {
    id: string
    name: string
    specialization: string
    price: number
    image: string
    neighborhood: string
}

interface ApiResponse {
    data: NurseData
    message: string
    success: boolean
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api/v1"

export default function CheckoutPage() {
    const params = useParams()
    const router = useRouter()
    const nurseId = params.id as string

    const [nurse, setNurse] = useState<NurseData | null>(null)
    const [loading, setLoading] = useState(true)

    const [selectedDate, setSelectedDate] = useState("")
    const [selectedTime, setSelectedTime] = useState("")
    const [message, setMessage] = useState("")
    const [reason, setReason] = useState("")
    const [visitType, setVisitType] = useState("domiciliar")
    const [value, setValue] = useState("")

    const [formError, setFormError] = useState<string | null>(null)

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
                }
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Erro ao carregar dados")
            } finally {
                setLoading(false)
            }
        }

        if (nurseId) {
            fetchNurseData()
        }
    }, [nurseId])

    const handleContinueToPayment = () => {
        if (!selectedDate || !selectedTime || !value || !reason) {
            setFormError("Por favor, preencha todos os campos obrigatórios.")
            return
        }

        const numericValue = Number.parseFloat(value.replace(",", "."))
        if (isNaN(numericValue) || numericValue <= 0) {
            setFormError("O valor deve ser um número positivo válido.")
            return
        }

        // Store booking data in sessionStorage to use in payment page
        const bookingData = {
            nurseId,
            nurseName: nurse?.name,
            selectedDate,
            selectedTime,
            message,
            reason,
            visitType,
            value: numericValue,
        }
        sessionStorage.setItem("bookingData", JSON.stringify(bookingData))

        // Navigate to payment page
        router.push(`/nurse-profile/${nurseId}/payment`)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="flex justify-center items-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="w-10 h-10 border-4 border-gray-200 border-t-green-700 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Carregando...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (!nurse) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="max-w-4xl mx-auto px-4 py-8 text-center">
                    <h1 className="text-red-600 mb-4">Enfermeiro não encontrado</h1>
                    <Button onClick={() => router.back()}>Voltar</Button>
                </div>
            </div>
        )
    }

    const imageUrl = nurse?.image ? `${API_BASE_URL}/user/file/${nurse.image}` : "/placeholder-avatar.png"

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="max-w-5xl mx-auto px-4 py-8">
                <Button variant="ghost" onClick={() => router.back()} className="mb-6">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar ao Perfil
                </Button>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Left Column - Nurse Summary */}
                    <div className="md:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-green-700">Resumo da Consulta</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                                        <Image src={imageUrl || "/placeholder.svg"} alt={nurse.name} fill className="object-cover" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{nurse.name}</h3>
                                        <p className="text-sm text-green-700">{nurse.specialization}</p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t">
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                        <MapPin className="h-4 w-4" />
                                        <span>{nurse.neighborhood}</span>
                                    </div>
                                    {value && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <DollarSign className="h-4 w-4" />
                                            <span className="font-semibold text-green-700">R$ {value}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Booking Form */}
                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-green-700">Detalhes do Agendamento</CardTitle>
                                <CardDescription>Preencha as informações para agendar sua consulta</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {formError && <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center">{formError}</div>}

                                {/* Date and Time */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                                            <Calendar className="h-4 w-4 text-green-700" />
                                            Data *
                                        </label>
                                        <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                                            <Clock className="h-4 w-4 text-green-700" />
                                            Horário *
                                        </label>
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

                                {/* Value */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                                        <DollarSign className="h-4 w-4 text-green-700" />
                                        Valor da Consulta (R$) *
                                    </label>
                                    <Input
                                        type="number"
                                        placeholder="Ex: 120.00"
                                        value={value}
                                        onChange={(e) => setValue(e.target.value)}
                                    />
                                </div>

                                {/* Visit Type */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                                        <MapPin className="h-4 w-4 text-green-700" />
                                        Tipo de Visita *
                                    </label>
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

                                {/* Reason */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                                        <FileText className="h-4 w-4 text-green-700" />
                                        Motivo da Consulta *
                                    </label>
                                    <Input
                                        placeholder="Ex: Acompanhamento pós-operatório"
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                                        <FileText className="h-4 w-4 text-green-700" />
                                        Descrição (opcional)
                                    </label>
                                    <Textarea
                                        placeholder="Descreva brevemente o tipo de cuidado necessário..."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        rows={4}
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-4 pt-4">
                                    <Button variant="outline" onClick={() => router.back()} className="flex-1">
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={handleContinueToPayment}
                                        className="flex-1 bg-green-700 hover:bg-green-800 text-white"
                                        disabled={!selectedDate || !selectedTime || !value || !reason}
                                    >
                                        Continuar para Pagamento
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    )
}
