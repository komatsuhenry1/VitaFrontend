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
import { Textarea } from "@/components/ui/textarea"
import { Clock, DollarSign, Calendar, Loader2, Plus, X, Award, MapPin } from "lucide-react"
import { toast } from "sonner"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

interface AvailabilityForm {
    start_time: string
    end_time: string
    specialization: string
    price_per_hour: number
    max_patients_per_day: number
    days_available: string[]
    bio: string
    department: string
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
        bio: "",
        department: "",
    })

    // States dos campos dinâmicos
    const [services, setServices] = useState<string[]>([])
    const [selectedService, setSelectedService] = useState("")

    const [qualifications, setQualifications] = useState<string[]>([])
    const [selectedQualification, setSelectedQualification] = useState("")

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
                    setAvailability(result.data.online ?? true)
                    setAvailabilityForm({
                        start_time: result.data.start_time || "08:00",
                        end_time: result.data.end_time || "18:00",
                        specialization: result.data.specialization || "",
                        price_per_hour: result.data.price || 0,
                        max_patients_per_day: result.data.max_patients_per_day || 10,
                        days_available: result.data.days_available || [],
                        bio: result.data.bio || "",
                        department: result.data.department || "",
                    })
                    setServices(result.data.services || [])
                    setQualifications(result.data.qualifications || [])
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
    }, [router])

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
                    qualifications: qualifications,
                    available_neighborhoods: neighborhoods,
                    bio: availabilityForm.bio,
                    department: availabilityForm.department,
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

    // ... (demais funções mantidas iguais) ...
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

    const addQualification = () => {
        if (selectedQualification && !qualifications.includes(selectedQualification)) {
            setQualifications([...qualifications, selectedQualification])
            setSelectedQualification("")
            toast.success("Qualificação adicionada!")
        } else if (qualifications.includes(selectedQualification)) {
            toast.error("Esta qualificação já foi adicionada")
        }
    }

    const removeQualification = (qualificationToRemove: string) => {
        setQualifications(qualifications.filter((qualification) => qualification !== qualificationToRemove))
        toast.success("Qualificação removida!")
    }

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
        // ... (JSX de loading mantido igual) ...
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
                        <p style={{ color: "#6b7280" }}>Carregando configurações...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
            <Header />

            {/* Page Header */}
            <section style={{ padding: "2rem 1rem", backgroundColor: "#ffffff", borderBottom: "1px solid #e5e7eb" }}>
                {/* ... (JSX do Header da Página mantido igual) ... */}
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
                        {/* ... (JSX do Card de Horários mantido igual) ... */}
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
                        {/* ... (JSX do Card de Dias mantido igual) ... */}
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
                                        className={
                                            availabilityForm.days_available.includes(day) ? "bg-[#15803d] hover:bg-[#166534]" : ""
                                        }
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
                            <CardDescription>Configure sua especialização, biografia e valores</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="specialization">Especialização Principal</Label>
                                <Select
                                    value={availabilityForm.specialization}
                                    onValueChange={(value) => setAvailabilityForm({ ...availabilityForm, specialization: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione sua especialização" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Pediatria">Pediatria</SelectItem>
                                        <SelectItem value="Geriatria">Geriatria</SelectItem>
                                        <SelectItem value="UTI/Terapia Intensiva">UTI/Terapia Intensiva</SelectItem>
                                        <SelectItem value="Cardiologia">Cardiologia</SelectItem>
                                        <SelectItem value="Oncologia">Oncologia</SelectItem>
                                        <SelectItem value="Obstetrícia">Obstetrícia</SelectItem>
                                        <SelectItem value="Emergência">Emergência</SelectItem>
                                        <SelectItem value="Domiciliar">Domiciliar</SelectItem>
                                        <SelectItem value="Psiquiatria">Psiquiatria</SelectItem>
                                        <SelectItem value="Nefrologia">Nefrologia</SelectItem>
                                        <SelectItem value="Ortopedia">Ortopedia</SelectItem>
                                        <SelectItem value="Neurologia">Neurologia</SelectItem>
                                        <SelectItem value="Clínica Médica">Clínica Médica</SelectItem>
                                        <SelectItem value="Cirurgia">Cirurgia</SelectItem>
                                        <SelectItem value="Saúde Mental">Saúde Mental</SelectItem>
                                        <SelectItem value="Outra">Outra</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* ==================
                             MUDANÇA FEITA AQUI
                            ==================
                            O Input foi substituído pelo Select com as opções fornecidas.
                            */}
                            <div>
                                <Label htmlFor="department">Departamento/Área de Atuação *</Label>
                                <Select
                                    value={availabilityForm.department}
                                    onValueChange={(value) => setAvailabilityForm({ ...availabilityForm, department: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a área de atuação" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Unidade de Terapia Intensiva (UTI)">
                                            Unidade de Terapia Intensiva (UTI)
                                        </SelectItem>
                                        <SelectItem value="Centro Cirúrgico">Centro Cirúrgico</SelectItem>
                                        <SelectItem value="Emergência/Pronto-Socorro">Emergência/Pronto-Socorro</SelectItem>
                                        <SelectItem value="Clínica Médica">Clínica Médica</SelectItem>
                                        <SelectItem value="Pediatria">Pediatria</SelectItem>
                                        <SelectItem value="Ginecologia e Obstetrícia">Ginecologia e Obstetrícia</SelectItem>
                                        <SelectItem value="Cardiologia">Cardiologia</SelectItem>
                                        <SelectItem value="Oncologia">Oncologia</SelectItem>
                                        <SelectItem value="Home Care/Atendimento Domiciliar">
                                            Home Care/Atendimento Domiciliar
                                        </SelectItem>
                                        <SelectItem value="Saúde da Família (PSF)">Saúde da Família (PSF)</SelectItem>
                                        <SelectItem value="Outro">Outro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="bio">Biografia</Label>
                                <Textarea
                                    id="bio"
                                    value={availabilityForm.bio}
                                    onChange={(e) => setAvailabilityForm({ ...availabilityForm, bio: e.target.value })}
                                    placeholder="Escreva um breve resumo sobre você, sua experiência e sua abordagem de cuidado..."
                                    className="min-h-[120px]"
                                />
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

                    {/* Card Bairros */}
                    <Card>
                        {/* ... (JSX do Card de Bairros mantido igual) ... */}
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
                                    </SelectContent>
                                </Select>
                                <Button
                                    onClick={addNeighborhood}
                                    disabled={!selectedNeighborhood}
                                    className="bg-[#15803d] hover:bg-[#166534]"
                                >
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
                                            style={{
                                                backgroundColor: "#f0fdf4",
                                                color: "#15803d",
                                                border: "1px solid #bbf7d0",
                                            }}
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

                    {/* Qualifications Card */}
                    <Card>
                        {/* ... (JSX do Card de Qualificações mantido igual) ... */}
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Award size={20} />
                                Qualificações e Certificações
                            </CardTitle>
                            <CardDescription>Adicione suas qualificações profissionais e certificações</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <Select value={selectedQualification} onValueChange={setSelectedQualification}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Selecione uma qualificação..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Graduação em Enfermagem">Graduação em Enfermagem</SelectItem>
                                        <SelectItem value="Pós-graduação em UTI">Pós-graduação em UTI</SelectItem>
                                        <SelectItem value="Pós-graduação em Emergência">Pós-graduação em Emergência</SelectItem>
                                        <SelectItem value="Pós-graduação em Pediatria">Pós-graduação em Pediatria</SelectItem>
                                        <SelectItem value="Pós-graduação em Geriatria">Pós-graduação em Geriatria</SelectItem>
                                        <SelectItem value="Pós-graduação em Home Care">Pós-graduação em Home Care</SelectItem>
                                        <SelectItem value="Mestrado em Enfermagem">Mestrado em Enfermagem</SelectItem>
                                        <SelectItem value="Doutorado em Enfermagem">Doutorado em Enfermagem</SelectItem>
                                        <SelectItem value="Certificação BLS (Suporte Básico de Vida)">
                                            Certificação BLS (Suporte Básico de Vida)
                                        </SelectItem>
                                        <SelectItem value="Certificação ACLS (Suporte Avançado de Vida Cardiovascular)">
                                            Certificação ACLS (Suporte Avançado de Vida Cardiovascular)
                                        </SelectItem>
                                        <SelectItem value="Certificação PALS (Suporte Avançado de Vida em Pediatria)">
                                            Certificação PALS (Suporte Avançado de Vida em Pediatria)
                                        </SelectItem>
                                        <SelectItem value="Certificação em Feridas">Certificação em Feridas</SelectItem>
                                        <SelectItem value="Certificação em Estomaterapia">Certificação em Estomaterapia</SelectItem>
                                        <SelectItem value="Certificação em Oncologia">Certificação em Oncologia</SelectItem>
                                        <SelectItem value="Certificação em Nefrologia">Certificação em Nefrologia</SelectItem>
                                        <SelectItem value="Curso de Punção Venosa">Curso de Punção Venosa</SelectItem>
                                        <SelectItem value="Curso de Administração de Medicamentos">
                                            Curso de Administração de Medicamentos
                                        </SelectItem>
                                        <SelectItem value="Curso de Cuidados Paliativos">Curso de Cuidados Paliativos</SelectItem>
                                        <SelectItem value="Curso de Primeiros Socorros">Curso de Primeiros Socorros</SelectItem>
                                        <SelectItem value="Experiência em UTI Neonatal">Experiência em UTI Neonatal</SelectItem>
                                        <SelectItem value="Experiência em Centro Cirúrgico">Experiência em Centro Cirúrgico</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    onClick={addQualification}
                                    disabled={!selectedQualification}
                                    className="bg-[#15803d] hover:bg-[#166534]"
                                >
                                    <Plus size={20} />
                                    Adicionar
                                </Button>
                            </div>

                            {qualifications.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {qualifications.map((qualification, index) => (
                                        <Badge
                                            key={index}
                                            variant="secondary"
                                            className="text-sm py-2 px-3 flex items-center gap-2"
                                            style={{ backgroundColor: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe" }}
                                        >
                                            {qualification}
                                            <button
                                                onClick={() => removeQualification(qualification)}
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
                                    Nenhuma qualificação adicionada.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Services Card */}
                    <Card>
                        {/* ... (JSX do Card de Serviços mantido igual) ... */}
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
                                <Button
                                    onClick={addService}
                                    disabled={!selectedService}
                                    className="bg-[#15803d] hover:bg-[#166534]"
                                >
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
                                            style={{
                                                backgroundColor: "#f0fdf4",
                                                color: "#15803d",
                                                border: "1px solid #bbf7d0",
                                            }}
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
                                    Nenhum serviço adicionado.
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