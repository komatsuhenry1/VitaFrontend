"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Clock, DollarSign, FileText, MapPin } from "lucide-react"
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

export default function ImmediateCheckoutPage() {
    const params = useParams()
    const router = useRouter()
    const nurseId = params.id as string

    const [nurse, setNurse] = useState<NurseData | null>(null)
    const [loading, setLoading] = useState(true)

    // Helper para pegar o horário atual formatado
    const getFormattedCurrentTime = () => {
        const now = new Date()
        const hours = now.getHours().toString().padStart(2, "0")
        const minutes = now.getMinutes().toString().padStart(2, "0")
        return `${hours}:${minutes}`
    }

    const [visitTime, setVisitTime] = useState(getFormattedCurrentTime())
    const [description, setDescription] = useState("")
    const [reason, setReason] = useState("")
    const [visitType, setVisitType] = useState("domiciliar")
    const [cep, setCep] = useState("")
    const [street, setStreet] = useState("")
    const [number, setNumber] = useState("")
    const [complement, setComplement] = useState("")
    const [neighborhood, setNeighborhood] = useState("")

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
        if (
            !visitTime ||
            !description.trim() ||
            !reason.trim() ||
            !cep.trim() ||
            !street.trim() ||
            !number.trim() ||
            !neighborhood.trim()
        ) {
            setFormError("Por favor, preencha todos os campos obrigatórios.")
            return
        }

        // Store booking data in sessionStorage to use in payment page
        const bookingData = {
            nurseId,
            nurseName: nurse?.name,
            visitTime,
            description,
            reason,
            visitType,
            cep,
            street,
            number,
            complement,
            neighborhood,
            value: nurse?.price || 0,
        }
        sessionStorage.setItem("immediateBookingData", JSON.stringify(bookingData))

        // Navigate to payment page
        router.push(`/nurse-profile/online/${nurseId}/payment`)
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
                                <CardTitle className="text-green-700">Resumo da Consulta Imediata</CardTitle>
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
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <DollarSign className="h-4 w-4" />
                                        <span className="font-semibold text-green-700">R$ {nurse.price}/hora</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Booking Form */}
                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-green-700">Detalhes da Consulta Imediata</CardTitle>
                                <CardDescription>Preencha as informações para solicitar uma consulta imediata</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {formError && <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center">{formError}</div>}

                                {/* Visit Time */}
                                <div>
                                    <Label className="flex items-center gap-2 text-sm font-semibold mb-2">
                                        <Clock className="h-4 w-4 text-green-700" />
                                        Horário da Visita (Hoje) *
                                    </Label>
                                    <Input type="time" value={visitTime} onChange={(e) => setVisitTime(e.target.value)} />
                                </div>

                                {/* Visit Type */}
                                <div>
                                    <Label className="flex items-center gap-2 text-sm font-semibold mb-2">
                                        <MapPin className="h-4 w-4 text-green-700" />
                                        Tipo de Visita *
                                    </Label>
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
                                    <Label className="flex items-center gap-2 text-sm font-semibold mb-2">
                                        <FileText className="h-4 w-4 text-green-700" />
                                        Motivo da Consulta *
                                    </Label>
                                    <Input
                                        placeholder="Ex: Aplicação de medicação, Curativo..."
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <Label className="flex items-center gap-2 text-sm font-semibold mb-2">
                                        <FileText className="h-4 w-4 text-green-700" />
                                        Descrição *
                                    </Label>
                                    <Textarea
                                        placeholder="Descreva detalhadamente o atendimento necessário..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={4}
                                    />
                                </div>

                                {/* Address Section */}
                                <div className="pt-4 border-t">
                                    <h3 className="font-semibold text-gray-900 mb-4">Endereço para Atendimento</h3>

                                    {/* CEP */}
                                    <div className="mb-4">
                                        <Label className="text-sm font-semibold mb-2 block">CEP *</Label>
                                        <Input placeholder="00000-000" value={cep} onChange={(e) => setCep(e.target.value)} maxLength={9} />
                                    </div>

                                    {/* Street and Number */}
                                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                                        <div className="md:col-span-2">
                                            <Label className="text-sm font-semibold mb-2 block">Rua *</Label>
                                            <Input placeholder="Nome da rua" value={street} onChange={(e) => setStreet(e.target.value)} />
                                        </div>
                                        <div>
                                            <Label className="text-sm font-semibold mb-2 block">Número *</Label>
                                            <Input placeholder="123" value={number} onChange={(e) => setNumber(e.target.value)} />
                                        </div>
                                    </div>

                                    {/* Complement */}
                                    <div className="mb-4">
                                        <Label className="text-sm font-semibold mb-2 block">Complemento</Label>
                                        <Input
                                            placeholder="Apto, Bloco, etc. (opcional)"
                                            value={complement}
                                            onChange={(e) => setComplement(e.target.value)}
                                        />
                                    </div>

                                    {/* Neighborhood */}
                                    <div>
                                        <Label className="text-sm font-semibold mb-2 block">Bairro *</Label>
                                        <Input
                                            placeholder="Nome do bairro"
                                            value={neighborhood}
                                            onChange={(e) => setNeighborhood(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-4 pt-4">
                                    <Button variant="outline" onClick={() => router.back()} className="flex-1">
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={handleContinueToPayment}
                                        className="flex-1 bg-green-700 hover:bg-green-800 text-white"
                                        disabled={
                                            !visitTime ||
                                            !description.trim() ||
                                            !reason.trim() ||
                                            !cep.trim() ||
                                            !street.trim() ||
                                            !number.trim() ||
                                            !neighborhood.trim()
                                        }
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
