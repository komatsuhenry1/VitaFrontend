"use client"

// Removido useRef, BellRing, User dos imports diretos aqui
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/Header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Wifi, WifiOff, Loader2, Calendar, Clock, MapPin, DollarSign } from "lucide-react"
import { toast } from "sonner"
// Removidos Dialogs daqui
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"

// --- Importa o Hook do Contexto ---
import { useWebSocket } from '@/context/WebSocketContext'; // Ajuste o caminho se necessário

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api/v1"

// --- Interfaces (mantidas) ---
interface Schedule {
  id: string
  status: string
  patient_id: string
  patient_name: string
  patient_email: string
  description: string
  reason: string
  cancel_reason: string
  nurse_id: string
  nurse_name: string
  value: number
  visit_type: string
  visit_date: string
  created_at: string
  updated_at: string
}

interface NurseData {
  id: string
  name: string
  specialization: string
  experience: number
  rating: number
  online: boolean // Útil para status inicial ao carregar a página
  price: number
  shift: string
  department: string
  image: string
  available: boolean // Disponibilidade geral
  location: string
  bio: string
  qualifications: string[]
  services: string[]
  schedules: Schedule[]
  total_patients: number
  earnings: number
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

// --- Interface VisitNotification REMOVIDA daqui ---

// --- Estilo Hero (mantido) ---
const heroStyle = {
  backgroundImage: `
    linear-gradient(rgba(21, 128, 61, 0.7), rgba(83, 83, 83, 0.8)),
    url('/dashboard_imagem.png')
  `,
  backgroundSize: "cover",
  backgroundPosition: "center",
  color: "white",
  padding: "5rem 0",
}

// --- Funções utilitárias (mantidas) ---
const formatDateTime = (isoDate: string) => {
  const date = new Date(isoDate)
  const dateStr = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
  const timeStr = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  return { date: dateStr, time: timeStr }
}
const getStatusBadge = (status: string) => {
  const statusMap: Record<string, { color: string; bg: string; label: string }> = {
    PENDING: { color: "#f59e0b", bg: "#fef3c7", label: "Pendente" },
    CONFIRMED: { color: "#10b981", bg: "#d1fae5", label: "Confirmado" },
    COMPLETED: { color: "#3b82f6", bg: "#dbeafe", label: "Concluído" },
    CANCELLED: { color: "#ef4444", bg: "#fee2e2", label: "Cancelado" }, // Verifique se é CANCELED ou CANCELLED
  }
  return statusMap[status] || { color: "#6b7280", bg: "#f3f4f6", label: status }
}


export default function NurseDashboard() {
  const router = useRouter()
  const [nurseData, setNurseData] = useState<NurseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // --- Estados e Funções WebSocket locais REMOVIDOS ---

  // --- Usa o Contexto WebSocket ---
  const { isOnline, isConnecting, connectWebSocket, disconnectWebSocket } = useWebSocket();

  // Estados de disponibilidade geral (mantidos)
  // 'availability' refere-se à disponibilidade configurada (dias/horas), não ao status online imediato
  const [availability, setAvailability] = useState(true);
  const [availabilityForm, setAvailabilityForm] = useState({
    start_time: "08:00",
    end_time: "18:00",
    specialization: "",
    price_per_hour: 0,
    max_patients_per_day: 10,
    days_available: [] as string[],
  })
  const [isSavingAvailability, setIsSavingAvailability] = useState(false)

  // useEffect para buscar dados (sem cleanup de WS)
  useEffect(() => {
    const fetchNurseData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token")
        const user = JSON.parse(localStorage.getItem("user") || "{}")
        const nurseId = user._id || user.id

        if (!token || !nurseId) {
          router.push("/login")
          return
        }

        const response = await fetch(`${API_BASE_URL}/nurse/dashboard_info`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Erro desconhecido ao buscar dados" }));
          throw new Error(errorData.message || "Erro ao carregar dados do enfermeiro");
        }

        const result = await response.json()

        if (result.success && result.data) {
          setNurseData(result.data)
          // Define o estado inicial de 'availability' baseado nos dados carregados
          setAvailability(result.data.available ?? true) // Usa ?? true como fallback se 'available' não vier
          // O estado 'isOnline' do contexto será a fonte da verdade para o status real-time
          setAvailabilityForm({
            start_time: result.data.start_time || "08:00",
            end_time: result.data.end_time || "18:00",
            specialization: result.data.specialization || "",
            price_per_hour: result.data.price || 0,
            max_patients_per_day: result.data.max_patients_per_day || 10,
            days_available: result.data.days_available || [],
          })
        } else {
          throw new Error(result.message || "Erro ao carregar dados")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido")
        console.error("Error fetching nurse data:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchNurseData()
    // O cleanup do WebSocket agora é feito pelo Provider no layout
  }, [router])


  // ===================================
  // FUNÇÃO 'handleToggleOnline' ATUALIZADA
  // ===================================
  const handleToggleOnline = async () => {
    // 1. Pega o token para a chamada de API
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Token não encontrado. Faça login novamente.");
      router.push("/login");
      return;
    }

    // 2. Cria uma função auxiliar para chamar a API de toggle
    const callApiToggle = async (): Promise<boolean> => {
      try {
        const response = await fetch(`${API_BASE_URL}/nurse/online`, {
          method: "PATCH", // Assumindo PATCH para a atualização de status
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          toast.error(errorData.message || "Erro ao atualizar status no servidor.");
          return false; // Falha
        }
        return true; // Sucesso
      } catch (error) {
        console.error("Erro ao tentar mudar status online:", error);
        toast.error("Erro de rede ao tentar mudar status.");
        return false; // Falha
      }
    };

    // 3. Lógica principal: decide a ordem das chamadas
    if (isOnline) {
      // INTENÇÃO: Ficar OFFLINE
      // 1. Desconecta o WS imediatamente
      disconnectWebSocket();
      // 2. Tenta atualizar o status no DB (mostra erro se falhar, mas o WS já está off)
      await callApiToggle();
    } else {
      // INTENÇÃO: Ficar ONLINE
      // 1. Primeiro, tenta atualizar o status no DB
      const apiSuccess = await callApiToggle();

      // 2. Só tenta conectar o WS se a API registrar o "online" com sucesso
      if (apiSuccess) {
        connectWebSocket();
      } else {
        // A falha já foi notificada pelo toast dentro de callApiToggle
        console.log("Não foi possível conectar o WebSocket pois a API de status falhou.");
      }
    }
  }

  // Funções de disponibilidade geral (mantidas)
  // Esta função salva as configurações GERAIS, não o status online imediato
  const handleSaveAvailability = async () => {
    setIsSavingAvailability(true)
    try {
      const token = localStorage.getItem("token")
      // Endpoint /nurse/update parece ser para dados gerais, não status online
      const response = await fetch(`${API_BASE_URL}/nurse/update`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Enviando dados gerais de disponibilidade/configuração
          start_time: availabilityForm.start_time,
          end_time: availabilityForm.end_time,
          specialization: availabilityForm.specialization,
          price: availabilityForm.price_per_hour,
          max_patients_per_day: availabilityForm.max_patients_per_day,
          days_available: availabilityForm.days_available,
          // 'available' aqui se refere à disponibilidade geral configurada
          // Diferente do 'isOnline' do WebSocket para chamadas imediatas
          available: availability,
        }),
      })

      if (response.ok) {
        toast.success("Configurações de disponibilidade atualizadas com sucesso!")
      } else {
        const errorResult = await response.json().catch(() => ({ message: "Erro desconhecido ao atualizar" }));
        toast.error(errorResult.message || "Erro ao atualizar disponibilidade")
      }
    } catch (error) {
      console.error("Error updating general availability:", error)
      toast.error("Erro ao atualizar disponibilidade")
    } finally {
      setIsSavingAvailability(false)
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

  // --- JSX de Loading e Erro (mantidos) ---
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
        <Header />
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", flexDirection: "column", gap: "1rem" }}>
          <Loader2 className="animate-spin" size={48} style={{ color: "#15803d" }} />
          <p style={{ color: "#6b7280" }}>Carregando dados do enfermeiro...</p>
        </div>
      </div>
    )
  }
  if (error) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
        <Header />
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", flexDirection: "column", gap: "1rem" }}>
          <p style={{ color: "#dc2626", fontSize: "1.125rem", fontWeight: "600" }}>Erro ao carregar dados</p>
          <p style={{ color: "#6b7280" }}>{error}</p>
          <Button onClick={() => window.location.reload()} style={{ backgroundColor: "#15803d", color: "white" }}>Tentar Novamente</Button>
        </div>
      </div>
    )
  }
  if (!nurseData) { return null } // Retorna nulo se nurseData ainda não carregou após loading ser false

  // --- Lógica de filtragem e pacientes (mantida) ---
  const upcomingSchedules = nurseData.schedules?.filter(s => s.status === "PENDING" || s.status === "CONFIRMED") || []
  const completedSchedules = nurseData.schedules?.filter(s => s.status === "COMPLETED") || []
  // Garante que uniquePatients seja inicializado como array vazio
  const uniquePatients = completedSchedules.reduce(
    (acc, schedule) => {
      if (!acc.find((p) => p.patient_id === schedule.patient_id)) {
        acc.push({
          patient_id: schedule.patient_id, patient_name: schedule.patient_name, patient_email: schedule.patient_email,
          total_visits: completedSchedules.filter((s) => s.patient_id === schedule.patient_id).length,
          last_visit: schedule.visit_date,
          total_spent: completedSchedules.filter((s) => s.patient_id === schedule.patient_id).reduce((sum, s) => sum + s.value, 0),
        })
      }
      return acc
    },
    [] as Array<{ patient_id: string; patient_name: string; patient_email: string; total_visits: number; last_visit: string; total_spent: number }>,
  )


  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
      <Header />

      {/* Hero Section (Botão usa estado do Contexto) */}
      <section style={heroStyle}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", marginBottom: "1rem" }}>Dashboard do Enfermeiro</h1>
          <p style={{ fontSize: "1.25rem", opacity: 0.9, marginBottom: "2rem" }}>
            Gerencie seus atendimentos e acompanhe sua carreira profissional
          </p>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "2rem" }}>
            {/* O Botão agora usa isOnline e isConnecting do CONTEXTO */}
            <button
              onClick={handleToggleOnline} // Chama a função que usa o contexto
              disabled={isConnecting} // Usa isConnecting do contexto
              style={{
                display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 2rem",
                fontSize: "1.125rem", fontWeight: "600", borderRadius: "9999px", border: "3px solid",
                borderColor: isOnline ? "#10b981" : "#6b7280", // Usa isOnline do contexto
                backgroundColor: isOnline ? "#10b981" : "#374151", // Usa isOnline do contexto
                color: "white", cursor: isConnecting ? "wait" : "pointer", transition: "all 0.3s ease",
                boxShadow: isOnline ? "0 0 20px rgba(16, 185, 129, 0.5), 0 0 40px rgba(16, 185, 129, 0.3)" : "0 4px 6px rgba(0, 0, 0, 0.1)",
                transform: isConnecting ? "scale(0.95)" : "scale(1)", opacity: isConnecting ? 0.7 : 1,
              }}
              onMouseEnter={(e) => { if (!isConnecting) e.currentTarget.style.transform = "scale(1.05)" }}
              onMouseLeave={(e) => { if (!isConnecting) e.currentTarget.style.transform = "scale(1)" }}
            >
              {isConnecting ? ( // Usa isConnecting do contexto
                <Loader2 className="animate-spin" size={24} />
              ) : isOnline ? ( // Usa isOnline do contexto
                <Wifi size={24} />
              ) : (
                <WifiOff size={24} />
              )}
              <span> {/* Texto dinâmico usando isOnline e isConnecting do contexto */}
                {isConnecting ? (isOnline ? "Desconectando..." : "Conectando...")
                  : isOnline ? "ONLINE"
                    : "OFFLINE"}
              </span>
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: isOnline ? "#ffffff" : "#9ca3af", animation: isOnline ? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" : "none", }} />
            </button>
          </div>
          {/* Stats Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginTop: "2rem" }}>
            <Card style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", border: "none" }}>
              <CardContent style={{ padding: "1.5rem", textAlign: "center" }}>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "white" }}>{nurseData.total_patients || 0}</div>
                <div style={{ fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.8)" }}>Pacientes Atendidos</div>
              </CardContent>
            </Card>
            <Card style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", border: "none" }}>
              <CardContent style={{ padding: "1.5rem", textAlign: "center" }}>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "white" }}>{upcomingSchedules.length}</div>
                <div style={{ fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.8)" }}>Consultas</div>
              </CardContent>
            </Card>
            <Card style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", border: "none" }}>
              <CardContent style={{ padding: "1.5rem", textAlign: "center" }}>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "white" }}>{nurseData.rating > 0 ? nurseData.rating.toFixed(1) : "N/A"}</div>
                <div style={{ fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.8)" }}>Avaliação Média</div>
              </CardContent>
            </Card>
            <Card style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", border: "none" }}>
              <CardContent style={{ padding: "1.5rem", textAlign: "center" }}>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "white" }}>R$ {nurseData.earnings?.toFixed(2) || "0.00"}</div>
                <div style={{ fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.8)" }}>Ganhos Totais</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Dashboard Content (Tabs) */}
      <section style={{ padding: "3rem 1rem", maxWidth: "1200px", margin: "0 auto" }}>
        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="schedule">Agenda</TabsTrigger>
            <TabsTrigger value="patients">Pacientes</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>
          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-4 mt-4"> {/* Adicionado mt-4 */}
            <Card>
              <CardHeader>
                <CardTitle>Agenda de Atendimentos</CardTitle>
                <CardDescription>Seus próximos atendimentos agendados</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingSchedules.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {upcomingSchedules.map((schedule) => {
                      const { date, time } = formatDateTime(schedule.visit_date)
                      const statusBadge = getStatusBadge(schedule.status)
                      return (
                        <Card key={schedule.id} style={{ border: "1px solid #e5e7eb", transition: "all 0.2s" }}>
                          <CardContent style={{ padding: "1.5rem" }}>
                            {/* Conteúdo do Card de Agendamento */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                              <div>
                                <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#1f2937" }}>{schedule.patient_name}</h3>
                                <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>{schedule.patient_email}</p>
                              </div>
                              <Badge variant="outline" style={{ color: statusBadge.color, backgroundColor: statusBadge.bg, borderColor: statusBadge.color + '40' }}>{statusBadge.label}</Badge> {/* Usando Badge */}
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1rem", fontSize: '0.875rem', color: '#4b5563' }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><Calendar size={16} style={{ color: "#15803d" }} /><span>{date}</span></div>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><Clock size={16} style={{ color: "#15803d" }} /><span>{time}</span></div>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><MapPin size={16} style={{ color: "#15803d" }} /><span>{schedule.visit_type === "domiciliar" ? "Domiciliar" : schedule.visit_type}</span></div>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><DollarSign size={16} style={{ color: "#15803d" }} /><span>R$ {schedule.value.toFixed(2)}</span></div>
                            </div>
                            {schedule.reason && (<div style={{ marginBottom: "0.75rem" }}><p style={{ fontWeight: "600", color: "#374151" }}>Motivo:</p><p style={{ color: "#6b7280" }}>{schedule.reason}</p></div>)}
                            {schedule.description && (<div style={{ marginBottom: "0.75rem" }}><p style={{ fontWeight: "600", color: "#374151" }}>Descrição:</p><p style={{ color: "#6b7280" }}>{schedule.description}</p></div>)}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                ) : (<p style={{ textAlign: "center", color: "#6b7280", padding: "2rem" }}>Nenhuma visita agendada</p>)}
              </CardContent>
            </Card>
          </TabsContent>
          {/* Patients Tab */}
          <TabsContent value="patients" className="space-y-4 mt-4"> {/* Adicionado mt-4 */}
            <Card>
              <CardHeader>
                <CardTitle>Meus Pacientes</CardTitle>
                <CardDescription>Pacientes com atendimentos concluídos</CardDescription>
              </CardHeader>
              <CardContent>
                {uniquePatients.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
                    {uniquePatients.map((patient) => {
                      const { date } = formatDateTime(patient.last_visit)
                      return (
                        <Card key={patient.patient_id} style={{ border: "1px solid #e5e7eb", transition: "all 0.2s" }}>
                          <CardContent style={{ padding: "1.5rem" }}>
                            {/* Conteúdo do Card Paciente */}
                            <div style={{ marginBottom: "1rem" }}>
                              <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#1f2937", marginBottom: "0.25rem" }}>{patient.patient_name}</h3>
                              <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>{patient.patient_email}</p>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: '0.875rem' }}>
                              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#6b7280" }}>Total de Visitas:</span><span style={{ fontWeight: "600", color: "#15803d" }}>{patient.total_visits}</span></div>
                              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#6b7280" }}>Última Visita:</span><span style={{ fontWeight: "600", color: "#4b5563" }}>{date}</span></div>
                              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#6b7280" }}>Total Gasto:</span><span style={{ fontWeight: "600", color: "#15803d" }}>R$ {patient.total_spent.toFixed(2)}</span></div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                ) : (<p style={{ textAlign: "center", color: "#6b7280", padding: "2rem" }}>Nenhum paciente</p>)}
              </CardContent>
            </Card>
          </TabsContent>
          {/* History Tab */}
          <TabsContent value="history" className="space-y-4 mt-4"> {/* Adicionado mt-4 */}
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Atendimentos</CardTitle>
                <CardDescription>Atendimentos concluídos recentemente</CardDescription>
              </CardHeader>
              <CardContent>
                {completedSchedules.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {completedSchedules.map((schedule) => {
                      const { date, time } = formatDateTime(schedule.visit_date)
                      const statusBadge = getStatusBadge(schedule.status)
                      return (
                        <Card key={schedule.id} style={{ border: "1px solid #e5e7eb", transition: "all 0.2s" }}>
                          <CardContent style={{ padding: "1.5rem" }}>
                            {/* Conteúdo Card Histórico (similar ao da Agenda) */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                              <div>
                                <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#1f2937" }}>{schedule.patient_name}</h3>
                                <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>{schedule.patient_email}</p>
                              </div>
                              <Badge variant="outline" style={{ color: statusBadge.color, backgroundColor: statusBadge.bg, borderColor: statusBadge.color + '40' }}>{statusBadge.label}</Badge>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1rem", fontSize: '0.875rem', color: '#4b5563' }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><Calendar size={16} style={{ color: "#15803d" }} /><span>{date}</span></div>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><Clock size={16} style={{ color: "#15803d" }} /><span>{time}</span></div>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><MapPin size={16} style={{ color: "#15803d" }} /><span>{schedule.visit_type === "domiciliar" ? "Domiciliar" : schedule.visit_type}</span></div>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><DollarSign size={16} style={{ color: "#15803d" }} /><span>R$ {schedule.value.toFixed(2)}</span></div>
                            </div>
                            {schedule.reason && (<div style={{ marginBottom: "0.75rem" }}><p style={{ fontWeight: "600", color: "#374151" }}>Motivo:</p><p style={{ color: "#6b7280" }}>{schedule.reason}</p></div>)}
                            {schedule.description && (<div style={{ marginBottom: "0.75rem" }}><p style={{ fontWeight: "600", color: "#374151" }}>Descrição:</p><p style={{ color: "#6b7280" }}>{schedule.description}</p></div>)}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                ) : (<p style={{ textAlign: "center", color: "#6b7280", padding: "2rem" }}>Nenhum atendimento concluído</p>)}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  )
}