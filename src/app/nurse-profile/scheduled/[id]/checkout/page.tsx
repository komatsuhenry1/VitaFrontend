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
    neighborhood: string // Bairro principal do enfermeiro
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

    // Estados do formulário de agendamento
    const [selectedDate, setSelectedDate] = useState("")
    const [selectedTime, setSelectedTime] = useState("")
    const [message, setMessage] = useState("") // Descrição opcional
    const [reason, setReason] = useState("")
    const [visitType, setVisitType] = useState("domiciliar")
    const [value, setValue] = useState("")

    // Estados do formulário de endereço da visita
    const [cep, setCep] = useState("")
    const [street, setStreet] = useState("")
    const [number, setNumber] = useState("")
    const [complement, setComplement] = useState("")
    const [neighborhood, setNeighborhood] = useState("") // Bairro da visita

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

    // Função para formatar o CEP enquanto o usuário digita
    const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let cepValue = e.target.value.replace(/\D/g, "") // Remove tudo que não é dígito

        if (cepValue.length > 8) {
            cepValue = cepValue.substring(0, 8) // Limita a 8 dígitos
        }

        cepValue = cepValue.replace(/^(\d{5})(\d)/, "$1-$2") // Adiciona o hífen (12345-678)

        setCep(cepValue)

        // Opcional: Adicionar aqui uma chamada para a API ViaCEP
        // para preencher rua e bairro automaticamente
        // if (cepValue.length === 9) {
        //   fetchAddressFromCep(cepValue);
        // }
    }


    const handleContinueToPayment = () => {
        setFormError(null) // Limpa erros anteriores

        // Validação de todos os campos obrigatórios
        if (!selectedDate || !selectedTime || !value || !reason || !cep || !street || !number || !neighborhood) {
            setFormError("Por favor, preencha todos os campos obrigatórios (*).")
            return
        }

        const numericValue = Number.parseFloat(value.replace(",", "."))
        if (isNaN(numericValue) || numericValue <= 0) {
            setFormError("O valor deve ser um número positivo válido.")
            return
        }

        // Coleta todos os dados para salvar na sessionStorage
        const bookingData = {
            nurseId,
            nurseName: nurse?.name,
            selectedDate,
            selectedTime,
            message, // Será mapeado para 'description' no backend
            reason,
            visitType,
            value: numericValue,

            // Campos de endereço adicionados
            cep,
            street,
            number,
            complement,
            neighborhood,
        }

        // Salva no sessionStorage para a página de pagamento usar
        sessionStorage.setItem("bookingData", JSON.stringify(bookingData))

        // Navega para a página de pagamento
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
                    {/* Coluna da Esquerda - Resumo */}
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

                    {/* Coluna da Direita - Formulário */}
                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-green-700">Detalhes do Agendamento</CardTitle>
                                <CardDescription>Preencha as informações para agendar sua consulta</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {formError && <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center">{formError}</div>}

                                {/* Data e Hora */}
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

                                {/* Valor */}
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

                                {/* Tipo de Visita */}
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

                                {/* Motivo */}
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

                                {/* Descrição */}
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

                                {/* Seção de Endereço */}
                                <div className="pt-4 border-t">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Endereço da Visita</h3>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-semibold mb-2">
                                                <MapPin className="h-4 w-4 text-green-700" />
                                                CEP *
                                            </label>
                                            <Input
                                                placeholder="00000-000"
                                                value={cep}
                                                onChange={handleCepChange} // Usei a nova função com máscara
                                                maxLength={9} // 8 dígitos + 1 hífen
                                            />
                                        </div>

                                        <div className="grid md:grid-cols-3 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-semibold mb-2">Rua *</label>
                                                <Input placeholder="Nome da rua" value={street} onChange={(e) => setStreet(e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold mb-2">Número *</label>
                                                <Input placeholder="123" value={number} onChange={(e) => setNumber(e.target.value)} />
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold mb-2">Complemento</label>
                                                <Input
                                                    placeholder="Apto, bloco, etc."
                                                    value={complement}
                                                    onChange={(e) => setComplement(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold mb-2">Bairro *</label>
                                                <Input
                                                    placeholder="Nome do bairro"
                                                    value={neighborhood}
                                                    onChange={(e) => setNeighborhood(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Botões de Ação */}
                                <div className="flex gap-4 pt-4">
                                    <Button variant="outline" onClick={() => router.back()} className="flex-1">
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={handleContinueToPayment}
                                        className="flex-1 bg-green-700 hover:bg-green-800 text-white"
                                        disabled={
                                            !selectedDate || !selectedTime || !value || !reason || !cep || !street || !number || !neighborhood
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