"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/Header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Clock, DollarSign, Calendar, Loader2, Plus, X, MapPin } from "lucide-react" // Adicionado MapPin
import { toast } from "sonner"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

interface AvailabilityForm {
    start_time: string
    end_time: string
    specialization: string
    price_per_hour: number
    max_patients_per_day: number
    days_available: string[]
}

export default function NurseAvailabilityPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [availability, setAvailability] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    const [availabilityForm, setAvailabilityForm] = useState<AvailabilityForm>({
        start_time: "08:00",
        end_time: "18:00",
        specialization: "",
        price_per_hour: 0,
        max_patients_per_day: 10,
        days_available: [],
    })

    // Services management
    const [services, setServices] = useState<string[]>([])
    const [selectedService, setSelectedService] = useState("")

    // ✅ NOVO: State para os bairros
    const [neighborhoods, setNeighborhoods] = useState<string[]>([])
    const [selectedNeighborhood, setSelectedNeighborhood] = useState("")

    useEffect(() => {
        const fetchNurseData = async () => {
            try {
                const token = localStorage.getItem("token")
                if (!token) {
                    router.push("/login")
                    return
                }

                const response = await fetch(`${API_BASE_URL}/nurse/availability`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })

                if (!response.ok) {
                    throw new Error("Erro ao carregar dados de disponibilidade")
                }

                const result = await response.json()

                if (result.success && result.data) {
                    setAvailability(result.data.online)
                    setAvailabilityForm({
                        start_time: result.data.start_time || "08:00",
                        end_time: result.data.end_time || "18:00",
                        specialization: result.data.specialization || "",
                        price_per_hour: result.data.price || 0,
                        max_patients_per_day: result.data.max_patients_per_day || 10,
                        days_available: result.data.days_available || [],
                    })
                    setServices(result.data.services || [])
                    // ✅ NOVO: Popula os bairros com dados da API
                    setNeighborhoods(result.data.available_neighborhoods || [])
                }
            } catch (err) {
                console.error("Error fetching nurse data:", err)
                toast.error("Erro ao carregar seus dados.")
            } finally {
                setLoading(false)
            }
        }

        fetchNurseData()
    }, [])

    const handleSaveAvailability = async () => {
        setIsSaving(true)
        try {   
            const token = localStorage.getItem("token")
            const response = await fetch(`${API_BASE_URL}/nurse/update`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    start_time: availabilityForm.start_time,
                    end_time: availabilityForm.end_time,
                    specialization: availabilityForm.specialization,
                    price: availabilityForm.price_per_hour,
                    max_patients_per_day: availabilityForm.max_patients_per_day,
                    days_available: availabilityForm.days_available,
                    online: availability,
                    services: services,
                    // ✅ NOVO: Envia os bairros para a API
                    available_neighborhoods: neighborhoods,
                }),
            })

            if (response.ok) {
                toast.success("Configurações atualizadas com sucesso!")
            } else {
                toast.error("Erro ao atualizar configurações")
            }
        } catch (error) {
            console.error("Error updating availability:", error)
            toast.error("Erro ao atualizar configurações")
        } finally {
            setIsSaving(false)
        }
    }

    const toggleDayAvailability = (day: string) => {
        setAvailabilityForm((prev) => ({
            ...prev,
            days_available: prev.days_available.includes(day)
                ? prev.days_available.filter((d) => d !== day)
                : [...prev.days_available, day],
        }))
    }

    const addService = () => {
        if (selectedService && !services.includes(selectedService)) {
            setServices([...services, selectedService])
            setSelectedService("")
            toast.success("Serviço adicionado!")
        } else if (services.includes(selectedService)) {
            toast.error("Este serviço já foi adicionado")
        }
    }

    const removeService = (serviceToRemove: string) => {
        setServices(services.filter((service) => service !== serviceToRemove))
        toast.success("Serviço removido!")
    }

    // ✅ NOVO: Funções para adicionar e remover bairros
    const addNeighborhood = () => {
        if (selectedNeighborhood && !neighborhoods.includes(selectedNeighborhood)) {
            setNeighborhoods([...neighborhoods, selectedNeighborhood])
            setSelectedNeighborhood("")
            toast.success("Bairro adicionado!")
        } else if (neighborhoods.includes(selectedNeighborhood)) {
            toast.error("Este bairro já foi adicionado")
        }
    }

    const removeNeighborhood = (neighborhoodToRemove: string) => {
        setNeighborhoods(neighborhoods.filter((neighborhood) => neighborhood !== neighborhoodToRemove))
        toast.success("Bairro removido!")
    }


    if (loading) {
        return (
            <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
                <Header />
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        minHeight: "60vh",
                        flexDirection: "column",
                        gap: "1rem",
                    }}
                >
                    <Loader2 className="animate-spin" size={48} style={{ color: "#15803d" }} />
                    <p style={{ color: "#6b7280" }}>Carregando configurações...</p>
                </div>
            </div>
        )
    }

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
            <Header />

            {/* Page Header */}
            <section style={{ padding: "2rem 1rem", backgroundColor: "#ffffff", borderBottom: "1px solid #e5e7eb" }}>
                <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                    <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#1f2937", marginBottom: "0.5rem" }}>
                        Configurações de Disponibilidade
                    </h1>
                    <p style={{ color: "#6b7280" }}>Gerencie seus horários, serviços e disponibilidade para atendimentos</p>
                </div>
            </section>

            {/* Main Content */}
            <section style={{ padding: "2rem 1rem", maxWidth: "1200px", margin: "0 auto" }}>
                <div className="space-y-6">

                    {/* Working Hours Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock size={20} />
                                Horários de Trabalho
                            </CardTitle>
                            <CardDescription>Defina seus horários de início e término de atendimento</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="start-time">Horário de Início</Label>
                                    <Input
                                        id="start-time"
                                        type="time"
                                        value={availabilityForm.start_time}
                                        onChange={(e) => setAvailabilityForm({ ...availabilityForm, start_time: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="end-time">Horário de Término</Label>
                                    <Input
                                        id="end-time"
                                        type="time"
                                        value={availabilityForm.end_time}
                                        onChange={(e) => setAvailabilityForm({ ...availabilityForm, end_time: e.target.value })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Days Available Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar size={20} />
                                Dias Disponíveis
                            </CardTitle>
                            <CardDescription>Selecione os dias da semana em que você está disponível</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"].map((day) => (
                                    <Button
                                        key={day}
                                        type="button"
                                        variant={availabilityForm.days_available.includes(day) ? "default" : "outline"}
                                        onClick={() => toggleDayAvailability(day)}
                                        className={availabilityForm.days_available.includes(day) ? "bg-[#15803d] hover:bg-[#166534]" : ""}
                                    >
                                        {day}
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Professional Info Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Informações Profissionais</CardTitle>
                            <CardDescription>Configure sua especialização e valores</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="specialization">Especialização</Label>
                                <Select
                                    value={availabilityForm.specialization}
                                    onValueChange={(value) => setAvailabilityForm({ ...availabilityForm, specialization: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione sua especialização" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pediatria">Pediatria</SelectItem>
                                        <SelectItem value="geriatria">Geriatria</SelectItem>
                                        <SelectItem value="cardiologia">Cardiologia</SelectItem>
                                        <SelectItem value="oncologia">Oncologia</SelectItem>
                                        <SelectItem value="geral">Enfermagem Geral</SelectItem>
                                        <SelectItem value="uti">UTI</SelectItem>
                                        <SelectItem value="emergencia">Emergência</SelectItem>
                                        <SelectItem value="home_care">Home Care</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="price" className="flex items-center gap-2">
                                        <DollarSign size={16} />
                                        Valor por Hora (R$)
                                    </Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={availabilityForm.price_per_hour}
                                        onChange={(e) =>
                                            setAvailabilityForm({
                                                ...availabilityForm,
                                                price_per_hour: Number.parseFloat(e.target.value) || 0,
                                            })
                                        }
                                        placeholder="150.00"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="max-patients">Máximo de Pacientes por Dia</Label>
                                    <Input
                                        id="max-patients"
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={availabilityForm.max_patients_per_day}
                                        onChange={(e) =>
                                            setAvailabilityForm({
                                                ...availabilityForm,
                                                max_patients_per_day: Number.parseInt(e.target.value) || 10,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ✅ NOVO: Card de Bairros */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin size={20} />
                                Bairros de Atendimento
                            </CardTitle>
                            <CardDescription>Selecione os bairros onde você pode realizar atendimentos</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Select value={selectedNeighborhood} onValueChange={setSelectedNeighborhood}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Selecione um bairro..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Centro">Centro</SelectItem>
                                        <SelectItem value="Vila Prudente">Vila Prudente</SelectItem>
                                        <SelectItem value="Tatuapé">Tatuapé</SelectItem>
                                        <SelectItem value="Mooca">Mooca</SelectItem>
                                        <SelectItem value="Ipiranga">Ipiranga</SelectItem>
                                        <SelectItem value="Vila Mariana">Vila Mariana</SelectItem>
                                        <SelectItem value="Pinheiros">Pinheiros</SelectItem>
                                        <SelectItem value="Jardins">Jardins</SelectItem>
                                        <SelectItem value="Moema">Moema</SelectItem>
                                        <SelectItem value="Itaim Bibi">Itaim Bibi</SelectItem>
                                        <SelectItem value="Brooklin">Brooklin</SelectItem>
                                        <SelectItem value="Santo Amaro">Santo Amaro</SelectItem>
                                        <SelectItem value="Butantã">Butantã</SelectItem>
                                        <SelectItem value="Lapa">Lapa</SelectItem>
                                        <SelectItem value="Santana">Santana</SelectItem>
                                        <SelectItem value="Vila Guilherme">Vila Guilherme</SelectItem>
                                        <SelectItem value="Penha">Penha</SelectItem>
                                        <SelectItem value="São Miguel">São Miguel</SelectItem>
                                        <SelectItem value="Outro">Outro</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button onClick={addNeighborhood} disabled={!selectedNeighborhood} className="bg-[#15803d] hover:bg-[#166534]">
                                    <Plus size={20} />
                                    Adicionar
                                </Button>
                            </div>

                            {neighborhoods.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {neighborhoods.map((neighborhood, index) => (
                                        <Badge
                                            key={index}
                                            variant="secondary"
                                            className="text-sm py-2 px-3 flex items-center gap-2"
                                            style={{ backgroundColor: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}
                                        >
                                            {neighborhood}
                                            <button
                                                onClick={() => removeNeighborhood(neighborhood)}
                                                className="hover:text-red-600"
                                                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                                            >
                                                <X size={14} />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ textAlign: "center", color: "#9ca3af", padding: "2rem", fontSize: "0.875rem" }}>
                                    Nenhum bairro adicionado ainda. Adicione os bairros que você atende acima.
                                </p>
                            )}
                        </CardContent>
                    </Card>


                    {/* Services Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Serviços Oferecidos</CardTitle>
                            <CardDescription>Selecione os serviços que você está apto a prestar</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Select value={selectedService} onValueChange={setSelectedService}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Selecione um serviço..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Aplicação de injeções intramusculares">
                                            Aplicação de injeções intramusculares
                                        </SelectItem>
                                        <SelectItem value="Aplicação de injeções subcutâneas">Aplicação de injeções subcutâneas</SelectItem>
                                        <SelectItem value="Aplicação de injeções endovenosas">Aplicação de injeções endovenosas</SelectItem>
                                        <SelectItem value="Curativos simples">Curativos simples</SelectItem>
                                        <SelectItem value="Curativos complexos">Curativos complexos</SelectItem>
                                        <SelectItem value="Aferição de pressão arterial">Aferição de pressão arterial</SelectItem>
                                        <SelectItem value="Aferição de temperatura">Aferição de temperatura</SelectItem>
                                        <SelectItem value="Aferição de glicemia">Aferição de glicemia</SelectItem>
                                        <SelectItem value="Administração de medicamentos orais">
                                            Administração de medicamentos orais
                                        </SelectItem>
                                        <SelectItem value="Administração de medicamentos tópicos">
                                            Administração de medicamentos tópicos
                                        </SelectItem>
                                        <SelectItem value="Sondagem vesical">Sondagem vesical</SelectItem>
                                        <SelectItem value="Sondagem nasogástrica">Sondagem nasogástrica</SelectItem>
                                        <SelectItem value="Coleta de exames laboratoriais">Coleta de exames laboratoriais</SelectItem>
                                        <SelectItem value="Cuidados com traqueostomia">Cuidados com traqueostomia</SelectItem>
                                        <SelectItem value="Cuidados com ostomias">Cuidados com ostomias</SelectItem>
                                        <SelectItem value="Nebulização">Nebulização</SelectItem>
                                        <SelectItem value="Oxigenoterapia">Oxigenoterapia</SelectItem>
                                        <SelectItem value="Banho no leito">Banho no leito</SelectItem>
                                        <SelectItem value="Mudança de decúbito">Mudança de decúbito</SelectItem>
                                        <SelectItem value="Fisioterapia respiratória">Fisioterapia respiratória</SelectItem>
                                        <SelectItem value="Acompanhamento pós-operatório">Acompanhamento pós-operatório</SelectItem>
                                        <SelectItem value="Cuidados paliativos">Cuidados paliativos</SelectItem>
                                        <SelectItem value="Monitoramento de pacientes crônicos">
                                            Monitoramento de pacientes crônicos
                                        </SelectItem>
                                        <SelectItem value="Educação em saúde">Educação em saúde</SelectItem>
                                        <SelectItem value="Acompanhamento de idosos">Acompanhamento de idosos</SelectItem>
                                        <SelectItem value="Cuidados com feridas">Cuidados com feridas</SelectItem>
                                        <SelectItem value="Aspiração de vias aéreas">Aspiração de vias aéreas</SelectItem>
                                        <SelectItem value="Controle de diurese">Controle de diurese</SelectItem>
                                        <SelectItem value="Massagem terapêutica">Massagem terapêutica</SelectItem>
                                        <SelectItem value="Reabilitação motora">Reabilitação motora</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button onClick={addService} disabled={!selectedService} className="bg-[#15803d] hover:bg-[#166534]">
                                    <Plus size={20} />
                                    Adicionar
                                </Button>
                            </div>

                            {services.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {services.map((service, index) => (
                                        <Badge
                                            key={index}
                                            variant="secondary"
                                            className="text-sm py-2 px-3 flex items-center gap-2"
                                            style={{ backgroundColor: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}
                                        >
                                            {service}
                                            <button
                                                onClick={() => removeService(service)}
                                                className="hover:text-red-600"
                                                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                                            >
                                                <X size={14} />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ textAlign: "center", color: "#9ca3af", padding: "2rem", fontSize: "0.875rem" }}>
                                    Nenhum serviço adicionado ainda. Adicione os serviços que você oferece acima.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Save Button */}
                    <Button
                        onClick={handleSaveAvailability}
                        disabled={isSaving}
                        className="w-full bg-[#15803d] hover:bg-[#166534]"
                        size="lg"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvando Configurações...
                            </>
                        ) : (
                            "Salvar Todas as Configurações"
                        )}
                    </Button>
                </div>
            </section>
        </div>
    )
}