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
// MUDANÇA: importado Loader2, CheckCircle, XCircle
import { ArrowLeft, Clock, DollarSign, FileText, MapPin, Loader2, CheckCircle, XCircle } from "lucide-react"
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

// NOVO: Função para formatar o CEP
const formatCEP = (value: string) => {
    const cleaned = value.replace(/\D/g, "")
    return cleaned.replace(/^(\d{5})(\d{0,3})$/, "$1-$2").substring(0, 9)
}

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

    // MUDANÇA: Estados de Endereço
    const [cep, setCep] = useState("")
    const [street, setStreet] = useState("")
    const [number, setNumber] = useState("")
    const [complement, setComplement] = useState("")
    const [neighborhood, setNeighborhood] = useState("")
    const [city, setCity] = useState("") // NOVO
    const [uf, setUf] = useState("") // NOVO

    const [formError, setFormError] = useState<string | null>(null)
    // MUDANÇA: Estados de Loading e Erro do CEP
    const [isCepLoading, setIsCepLoading] = useState(false)
    const [cepError, setCepError] = useState<string>("")


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

    // MUDANÇA: useEffect para buscar o endereço do CEP
    useEffect(() => {
        const cleanCep = cep.replace(/\D/g, "")

        if (cleanCep.length !== 8) {
            setCepError(cleanCep.length > 0 && cleanCep.length < 8 ? "CEP incompleto" : "")

            // Opcional: limpar campos se o usuário apagar o CEP
            if (street || neighborhood || city || uf) {
                setStreet("")
                setNeighborhood("")
                setCity("")
                setUf("")
            }
            return
        }

        const fetchCepData = async () => {
            setIsCepLoading(true)
            setCepError("")

            try {
                const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
                if (!response.ok) throw new Error("Erro na rede ao buscar CEP")

                const data = await response.json()

                if (data.erro) {
                    setCepError("CEP não encontrado")
                    toast.error("CEP não encontrado", {
                        description: "Verifique o número e tente novamente.",
                    })
                    setStreet("")
                    setNeighborhood("")
                    setCity("")
                    setUf("")
                } else {
                    // Preenche os campos
                    setStreet(data.logradouro || "")
                    setNeighborhood(data.bairro || "")
                    setCity(data.localidade || "")
                    setUf(data.uf || "")
                    toast.success("Endereço preenchido!")
                    document.getElementById("number")?.focus()
                }
            } catch (error) {
                console.error("Erro ao buscar CEP:", error)
                setCepError("Erro ao buscar CEP")
                toast.error("Erro ao buscar CEP", {
                    description: "Não foi possível conectar ao serviço. Tente novamente.",
                })
            } finally {
                setIsCepLoading(false)
            }
        }

        const timer = setTimeout(() => {
            fetchCepData()
        }, 500)

        return () => clearTimeout(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cep])

    // MUDANÇA: Função de alteração de CEP com formatação
    const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formattedValue = formatCEP(e.target.value)
        setCep(formattedValue)
    }

    // MUDANÇA: Variável de controle para desabilitar campos
    const isAddressDisabled = isCepLoading || (street.length > 0 && !cepError)


    const handleContinueToPayment = () => {
        setFormError(null)

        // MUDANÇA: Incluindo city e uf na validação
        if (
            !visitTime ||
            !description.trim() ||
            !reason.trim() ||
            !cep.trim() ||
            !street.trim() ||
            !number.trim() ||
            !neighborhood.trim() ||
            !city.trim() || // NOVO
            !uf.trim() // NOVO
        ) {
            setFormError("Por favor, preencha todos os campos obrigatórios.")
            return
        }

        // MUDANÇA: Validação do CEP
        if (cepError || cep.replace(/\D/g, "").length !== 8) {
            setFormError("Por favor, corrija o CEP antes de continuar.")
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
            cep: cep.replace(/\D/g, ""), // Limpa o CEP para envio
            street,
            number,
            complement,
            neighborhood,
            city, // NOVO
            uf, // NOVO
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
                                        {/* MUDANÇA: Adicionado lógica de ícones */}
                                        <div className="relative">
                                            <Input
                                                id="cep"
                                                placeholder="00000-000"
                                                value={cep}
                                                onChange={handleCepChange}
                                                maxLength={9}
                                                className={cepError ? "border-red-500" : cep.replace(/\D/g, "").length === 8 && !isCepLoading ? "border-green-500" : ""}
                                                disabled={isCepLoading}
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                {isCepLoading ? (
                                                    <Loader2 className="h-5 w-5 text-green-700 animate-spin" />
                                                ) : cep.replace(/\D/g, "").length === 8 ? (
                                                    cepError ? (
                                                        <XCircle className="h-5 w-5 text-red-500" />
                                                    ) : (
                                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                                    )
                                                ) : null}
                                            </div>
                                        </div>
                                        {cepError && <p className="text-xs text-red-500 mt-1">{cepError}</p>}
                                    </div>

                                    {/* UF and City */}
                                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                                        {/* NOVO: Campo de UF adicionado */}
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold mb-2 block">Estado (UF) *</Label>
                                            <Input
                                                placeholder="Preenchido automaticamente"
                                                value={uf}
                                                onChange={(e) => setUf(e.target.value)}
                                                required
                                                disabled={isAddressDisabled}
                                                className="disabled:opacity-100 disabled:cursor-default"
                                            />
                                        </div>
                                        {/* NOVO: Campo de Cidade adicionado */}
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold mb-2 block">Cidade *</Label>
                                            <Input
                                                placeholder="Preenchido automaticamente"
                                                value={city}
                                                onChange={(e) => setCity(e.target.value)}
                                                required
                                                disabled={isAddressDisabled}
                                                className="disabled:opacity-100 disabled:cursor-default"
                                            />
                                        </div>
                                    </div>

                                    {/* Street and Number */}
                                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                                        <div className="md:col-span-2">
                                            <Label className="text-sm font-semibold mb-2 block">Rua *</Label>
                                            {/* MUDANÇA: Adicionado desabilitação */}
                                            <Input
                                                id="street"
                                                placeholder="Nome da rua"
                                                value={street}
                                                onChange={(e) => setStreet(e.target.value)}
                                                disabled={isAddressDisabled}
                                                className="disabled:opacity-100 disabled:cursor-default"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-sm font-semibold mb-2 block">Número *</Label>
                                            <Input id="number" placeholder="123" value={number} onChange={(e) => setNumber(e.target.value)} required />
                                        </div>
                                    </div>

                                    {/* Complement and Neighborhood */}
                                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <Label className="text-sm font-semibold mb-2 block">Complemento</Label>
                                            <Input
                                                placeholder="Apto, Bloco, etc. (opcional)"
                                                value={complement}
                                                onChange={(e) => setComplement(e.target.value)}
                                            />
                                        </div>
                                        {/* MUDANÇA: Adicionado desabilitação */}
                                        <div>
                                            <Label className="text-sm font-semibold mb-2 block">Bairro *</Label>
                                            <Input
                                                id="neighborhood"
                                                placeholder="Nome do bairro"
                                                value={neighborhood}
                                                onChange={(e) => setNeighborhood(e.target.value)}
                                                disabled={isAddressDisabled}
                                                className="disabled:opacity-100 disabled:cursor-default"
                                                required
                                            />
                                        </div>
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
                                            !neighborhood.trim() ||
                                            isCepLoading
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