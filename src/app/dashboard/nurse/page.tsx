"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/Header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Wifi, WifiOff, Loader2, Calendar, Clock, MapPin, DollarSign } from "lucide-react"
import { toast } from "sonner"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

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
  online: boolean
  price: number
  shift: string
  department: string
  image: string
  available: boolean
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

const formatDateTime = (isoDate: string) => {
  const date = new Date(isoDate)
  const dateStr = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
  const timeStr = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })
  return { date: dateStr, time: timeStr }
}

const getStatusBadge = (status: string) => {
  const statusMap: Record<string, { color: string; bg: string; label: string }> = {
    PENDING: { color: "#f59e0b", bg: "#fef3c7", label: "Pendente" },
    CONFIRMED: { color: "#10b981", bg: "#d1fae5", label: "Confirmado" },
    COMPLETED: { color: "#3b82f6", bg: "#dbeafe", label: "Concluído" },
    CANCELLED: { color: "#ef4444", bg: "#fee2e2", label: "Cancelado" },
  }
  return statusMap[status] || { color: "#6b7280", bg: "#f3f4f6", label: status }
}

export default function NurseDashboard() {
  const router = useRouter()
  const [nurseData, setNurseData] = useState<NurseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [availability, setAvailability] = useState(true)
  const [isOnline, setIsOnline] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  const [availabilityForm, setAvailabilityForm] = useState({
    start_time: "08:00",
    end_time: "18:00",
    specialization: "",
    price_per_hour: 0,
    max_patients_per_day: 10,
    days_available: [] as string[],
  })
  const [isSavingAvailability, setIsSavingAvailability] = useState(false)

  useEffect(() => {
    const fetchNurseData = async () => {
      try {
        const token = localStorage.getItem("token")
        const user = JSON.parse(localStorage.getItem("user") || "{}")
        const nurseId = user._id || user.id

        if (!token || !nurseId) {
          router.push("/login")
          return
        }

        const response = await fetch(`${API_BASE_URL}/nurse/dashboard_info`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Erro ao carregar dados do enfermeiro")
        }

        const result = await response.json()

        if (result.success && result.data) {
          setNurseData(result.data)
          setAvailability(result.data.available)
          setIsOnline(result.data.online)

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
  }, [router])

  const toggleOnlineStatus = async () => {
    setIsToggling(true)
    try {
      const response = await fetch(`${API_BASE_URL}/nurse/online`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        setIsOnline(!isOnline)
      } else {
        console.error("Failed to toggle online status")
      }
    } catch (error) {
      console.error("Error toggling online status:", error)
    } finally {
      setIsToggling(false)
    }
  }

  const handleSaveAvailability = async () => {
    setIsSavingAvailability(true)
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
          available: availability,
        }),
      })

      if (response.ok) {
        toast.success("Disponibilidade atualizada com sucesso!")
      } else {
        toast.error("Erro ao atualizar disponibilidade")
      }
    } catch (error) {
      console.error("Error updating availability:", error)
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

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
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
          <p style={{ color: "#6b7280" }}>Carregando dados do enfermeiro...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
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
          <p style={{ color: "#dc2626", fontSize: "1.125rem", fontWeight: "600" }}>Erro ao carregar dados</p>
          <p style={{ color: "#6b7280" }}>{error}</p>
          <Button onClick={() => window.location.reload()} style={{ backgroundColor: "#15803d", color: "white" }}>
            Tentar Novamente
          </Button>
        </div>
      </div>
    )
  }

  if (!nurseData) {
    return null
  }

  const upcomingSchedules =
    nurseData.schedules?.filter((schedule) => schedule.status === "PENDING" || schedule.status === "CONFIRMED") || []

  const completedSchedules = nurseData.schedules?.filter((schedule) => schedule.status === "COMPLETED") || []

  // Extract unique patients from completed schedules
  const uniquePatients = completedSchedules.reduce(
    (acc, schedule) => {
      if (!acc.find((p) => p.patient_id === schedule.patient_id)) {
        acc.push({
          patient_id: schedule.patient_id,
          patient_name: schedule.patient_name,
          patient_email: schedule.patient_email,
          total_visits: completedSchedules.filter((s) => s.patient_id === schedule.patient_id).length,
          last_visit: schedule.visit_date,
          total_spent: completedSchedules
            .filter((s) => s.patient_id === schedule.patient_id)
            .reduce((sum, s) => sum + s.value, 0),
        })
      }
      return acc
    },
    [] as Array<{
      patient_id: string
      patient_name: string
      patient_email: string
      total_visits: number
      last_visit: string
      total_spent: number
    }>,
  )

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
      <Header />

      {/* Hero Section */}
      <section style={heroStyle}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", marginBottom: "1rem" }}>Dashboard do Enfermeiro</h1>
          <p style={{ fontSize: "1.25rem", opacity: 0.9, marginBottom: "2rem" }}>
            Gerencie seus atendimentos e acompanhe sua carreira profissional
          </p>

          <div style={{ display: "flex", justifyContent: "center", marginBottom: "2rem" }}>
            <button
              onClick={toggleOnlineStatus}
              disabled={isToggling}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "1rem 2rem",
                fontSize: "1.125rem",
                fontWeight: "600",
                borderRadius: "9999px",
                border: "3px solid",
                borderColor: isOnline ? "#10b981" : "#6b7280",
                backgroundColor: isOnline ? "#10b981" : "#374151",
                color: "white",
                cursor: isToggling ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
                boxShadow: isOnline
                  ? "0 0 20px rgba(16, 185, 129, 0.5), 0 0 40px rgba(16, 185, 129, 0.3)"
                  : "0 4px 6px rgba(0, 0, 0, 0.1)",
                transform: isToggling ? "scale(0.95)" : "scale(1)",
                opacity: isToggling ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isToggling) {
                  e.currentTarget.style.transform = "scale(1.05)"
                }
              }}
              onMouseLeave={(e) => {
                if (!isToggling) {
                  e.currentTarget.style.transform = "scale(1)"
                }
              }}
            >
              {isToggling ? (
                <Loader2 className="animate-spin" size={24} />
              ) : isOnline ? (
                <Wifi size={24} />
              ) : (
                <WifiOff size={24} />
              )}
              <span>{isToggling ? "Alterando..." : isOnline ? "ONLINE - Disponível" : "OFFLINE - Indisponível"}</span>
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: isOnline ? "#ffffff" : "#9ca3af",
                  animation: isOnline ? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" : "none",
                }}
              />
            </button>
          </div>

          {/* Stats Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1.5rem",
              marginTop: "2rem",
            }}
          >
            <Card style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", border: "none" }}>
              <CardContent style={{ padding: "1.5rem", textAlign: "center" }}>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "white" }}>
                  {nurseData.total_patients || 0}
                </div>
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
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "white" }}>
                  {nurseData.rating.toFixed(1)}
                </div>
                <div style={{ fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.8)" }}>Avaliação Média</div>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", border: "none" }}>
              <CardContent style={{ padding: "1.5rem", textAlign: "center" }}>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "white" }}>
                  R$ {nurseData.earnings?.toFixed(2) || "0.00"}
                </div>
                <div style={{ fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.8)" }}>Ganhos Totais</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Dashboard Content */}
      <section style={{ padding: "3rem 1rem", maxWidth: "1200px", margin: "0 auto" }}>
        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="schedule">Agenda</TabsTrigger>
            <TabsTrigger value="patients">Pacientes</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-4">
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
                        <Card
                          key={schedule.id}
                          style={{
                            border: "1px solid #e5e7eb",
                            transition: "all 0.2s",
                          }}
                        >
                          <CardContent style={{ padding: "1.5rem" }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                marginBottom: "1rem",
                              }}
                            >
                              <div>
                                <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#1f2937" }}>
                                  {schedule.patient_name}
                                </h3>
                                <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>{schedule.patient_email}</p>
                              </div>
                              <span
                                style={{
                                  padding: "0.25rem 0.75rem",
                                  borderRadius: "9999px",
                                  fontSize: "0.75rem",
                                  fontWeight: "600",
                                  color: statusBadge.color,
                                  backgroundColor: statusBadge.bg,
                                }}
                              >
                                {statusBadge.label}
                              </span>
                            </div>

                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                                gap: "1rem",
                                marginBottom: "1rem",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <Calendar size={16} style={{ color: "#15803d" }} />
                                <span style={{ fontSize: "0.875rem", color: "#4b5563" }}>{date}</span>
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <Clock size={16} style={{ color: "#15803d" }} />
                                <span style={{ fontSize: "0.875rem", color: "#4b5563" }}>{time}</span>
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <MapPin size={16} style={{ color: "#15803d" }} />
                                <span style={{ fontSize: "0.875rem", color: "#4b5563" }}>
                                  {schedule.visit_type === "domiciliar" ? "Domiciliar" : schedule.visit_type}
                                </span>
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <DollarSign size={16} style={{ color: "#15803d" }} />
                                <span style={{ fontSize: "0.875rem", color: "#4b5563" }}>
                                  R$ {schedule.value.toFixed(2)}
                                </span>
                              </div>
                            </div>

                            {schedule.reason && (
                              <div style={{ marginBottom: "0.75rem" }}>
                                <p style={{ fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>Motivo:</p>
                                <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>{schedule.reason}</p>
                              </div>
                            )}

                            {schedule.description && (
                              <div style={{ marginBottom: "0.75rem" }}>
                                <p style={{ fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>Descrição:</p>
                                <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>{schedule.description}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                ) : (
                  <p style={{ textAlign: "center", color: "#6b7280", padding: "2rem" }}>
                    Nenhuma visita agendada no momento
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Patients Tab */}
          <TabsContent value="patients" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Meus Pacientes</CardTitle>
                <CardDescription>Pacientes com atendimentos concluídos</CardDescription>
              </CardHeader>
              <CardContent>
                {uniquePatients.length > 0 ? (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                      gap: "1rem",
                    }}
                  >
                    {uniquePatients.map((patient) => {
                      const { date } = formatDateTime(patient.last_visit)

                      return (
                        <Card
                          key={patient.patient_id}
                          style={{
                            border: "1px solid #e5e7eb",
                            transition: "all 0.2s",
                          }}
                        >
                          <CardContent style={{ padding: "1.5rem" }}>
                            <div style={{ marginBottom: "1rem" }}>
                              <h3
                                style={{
                                  fontSize: "1.125rem",
                                  fontWeight: "600",
                                  color: "#1f2937",
                                  marginBottom: "0.25rem",
                                }}
                              >
                                {patient.patient_name}
                              </h3>
                              <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>{patient.patient_email}</p>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>Total de Visitas:</span>
                                <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#15803d" }}>
                                  {patient.total_visits}
                                </span>
                              </div>

                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>Última Visita:</span>
                                <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#4b5563" }}>
                                  {date}
                                </span>
                              </div>

                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>Total Gasto:</span>
                                <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "#15803d" }}>
                                  R$ {patient.total_spent.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                ) : (
                  <p style={{ textAlign: "center", color: "#6b7280", padding: "2rem" }}>
                    Nenhum paciente com atendimentos concluídos
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
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
                        <Card
                          key={schedule.id}
                          style={{
                            border: "1px solid #e5e7eb",
                            transition: "all 0.2s",
                          }}
                        >
                          <CardContent style={{ padding: "1.5rem" }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                marginBottom: "1rem",
                              }}
                            >
                              <div>
                                <h3 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#1f2937" }}>
                                  {schedule.patient_name}
                                </h3>
                                <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>{schedule.patient_email}</p>
                              </div>
                              <span
                                style={{
                                  padding: "0.25rem 0.75rem",
                                  borderRadius: "9999px",
                                  fontSize: "0.75rem",
                                  fontWeight: "600",
                                  color: statusBadge.color,
                                  backgroundColor: statusBadge.bg,
                                }}
                              >
                                {statusBadge.label}
                              </span>
                            </div>

                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                                gap: "1rem",
                                marginBottom: "1rem",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <Calendar size={16} style={{ color: "#15803d" }} />
                                <span style={{ fontSize: "0.875rem", color: "#4b5563" }}>{date}</span>
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <Clock size={16} style={{ color: "#15803d" }} />
                                <span style={{ fontSize: "0.875rem", color: "#4b5563" }}>{time}</span>
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <MapPin size={16} style={{ color: "#15803d" }} />
                                <span style={{ fontSize: "0.875rem", color: "#4b5563" }}>
                                  {schedule.visit_type === "domiciliar" ? "Domiciliar" : schedule.visit_type}
                                </span>
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <DollarSign size={16} style={{ color: "#15803d" }} />
                                <span style={{ fontSize: "0.875rem", color: "#4b5563" }}>
                                  R$ {schedule.value.toFixed(2)}
                                </span>
                              </div>
                            </div>

                            {schedule.reason && (
                              <div style={{ marginBottom: "0.75rem" }}>
                                <p style={{ fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>Motivo:</p>
                                <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>{schedule.reason}</p>
                              </div>
                            )}

                            {schedule.description && (
                              <div>
                                <p style={{ fontSize: "0.875rem", fontWeight: "600", color: "#374151" }}>Descrição:</p>
                                <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>{schedule.description}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                ) : (
                  <p style={{ textAlign: "center", color: "#6b7280", padding: "2rem" }}>Nenhum atendimento concluído</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  )
}
