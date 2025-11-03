"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/Header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Wifi, WifiOff, Loader2, Star, Calendar, Clock, DollarSign, User } from "lucide-react"

interface DashboardStats {
  patients_attended: number
  appointments_today: number
  average_rating: number
  monthly_earnings: number
}

interface Visit {
  id: string
  description: string
  reason: string
  visit_type: string
  visit_value: number
  created_at: string
  date: string
  status: "PENDING" | "CONFIRMED" | "COMPLETED"
  patient_name: string
  patient_id: string
  nurse_name: string
}

interface Profile {
  name: string
  email: string
  phone: string
  coren: string
  experience_years: number
  department: string
  bio: string
}

interface Availability {
  is_available: boolean
  start_time: string
  end_time: string
  specialization: string
}

interface Review {
  patient_name: string
  rating: number
  comment: string
}

interface DashboardData {
  online: boolean
  stats: DashboardStats
  visits: Visit[]
  profile: Profile
  availability: Availability
  reviews: Review[] // Added reviews field
}

interface ApiResponse {
  data: DashboardData
  message: string
  success: boolean
}

const renderStars = (rating: number) => {
  return (
    <div style={{ display: "flex", gap: "0.25rem" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={16}
          style={{
            fill: star <= rating ? "#fbbf24" : "none",
            stroke: star <= rating ? "#fbbf24" : "#d1d5db",
          }}
        />
      ))}
    </div>
  )
}

const formatDate = (isoDate: string) => {
  const date = new Date(isoDate)
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const year = date.getFullYear()
  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")

  return `${day}/${month}/${year} às ${hours}:${minutes}`
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api/v1"

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

export default function NurseDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/nurse}/nurse/dashboard_info`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })

        if (response.ok) {
          const apiResponse: ApiResponse = await response.json()
          const data = apiResponse.data
          setDashboardData(data)
          setIsOnline(data.online)
        } else {
          console.error("Failed to fetch dashboard data")
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

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

  const getScheduleVisits = () => {
    if (!dashboardData) return []
    return dashboardData.visits.filter((visit) => visit.status === "PENDING" || visit.status === "CONFIRMED")
  }

  const getCompletedVisits = () => {
    if (!dashboardData) return []
    return dashboardData.visits.filter((visit) => visit.status === "COMPLETED")
  }

  const getUniquePatients = () => {
    if (!dashboardData) return []
    const patientMap = new Map()
    dashboardData.visits.forEach((visit) => {
      if (!patientMap.has(visit.patient_id)) {
        patientMap.set(visit.patient_id, {
          id: visit.patient_id,
          name: visit.patient_name,
          last_visit: visit.date,
        })
      }
    })
    return Array.from(patientMap.values())
  }

  const formatVisitType = (type: string) => {
    const types: { [key: string]: string } = {
      clinica: "Consulta Clínica",
      domiciliar: "Consulta Domiciliar",
    }
    return types[type] || type
  }

  const formatStatus = (status: string) => {
    const statuses: { [key: string]: string } = {
      PENDING: "Pendente",
      CONFIRMED: "Confirmado",
      COMPLETED: "Concluído",
    }
    return statuses[status] || status
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
        <Header />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "calc(100vh - 80px)",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <Loader2 className="animate-spin" size={48} style={{ color: "#15803d", margin: "0 auto" }} />
            <p style={{ marginTop: "1rem", color: "#6b7280" }}>Carregando dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
        <Header />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "calc(100vh - 80px)",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <p style={{ fontSize: "1.25rem", color: "#6b7280" }}>Erro ao carregar dados do dashboard</p>
          <Button onClick={() => window.location.reload()} style={{ backgroundColor: "#15803d", color: "white" }}>
            Tentar Novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      <Header />

      <section
        style={heroStyle}
      >
        {/* Decorative background elements */}
        <div
          style={{
            position: "absolute",
            top: "-50%",
            right: "-10%",
            width: "500px",
            height: "500px",
            background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-30%",
            left: "-5%",
            width: "400px",
            height: "400px",
            background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <h1 style={{ fontSize: "3rem", fontWeight: "bold", marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>
            Dashboard do Enfermeiro
          </h1>
          <p style={{ fontSize: "1.25rem", opacity: 0.9, marginBottom: "2.5rem", fontWeight: "300" }}>
            Gerencie seus atendimentos e acompanhe sua carreira profissional
          </p>

          <div style={{ display: "flex", justifyContent: "center", marginBottom: "3rem" }}>
            <div
              style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                gap: "1rem",
                padding: "0.5rem",
                background: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(10px)",
                borderRadius: "9999px",
                border: "2px solid rgba(255, 255, 255, 0.3)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
              }}
            >
              <button
                onClick={toggleOnlineStatus}
                disabled={isToggling}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "0.875rem 2rem",
                  fontSize: "1rem",
                  fontWeight: "700",
                  borderRadius: "9999px",
                  border: "none",
                  background: isOnline
                    ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                    : "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
                  color: "white",
                  cursor: isToggling ? "not-allowed" : "pointer",
                  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: isOnline
                    ? "0 0 0 0 rgba(16, 185, 129, 0.7), 0 4px 20px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                    : "0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                  transform: isToggling ? "scale(0.95)" : "scale(1)",
                  opacity: isToggling ? 0.8 : 1,
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  if (!isToggling) {
                    e.currentTarget.style.transform = "scale(1.05)"
                    e.currentTarget.style.boxShadow = isOnline
                      ? "0 0 0 8px rgba(16, 185, 129, 0.2), 0 8px 30px rgba(16, 185, 129, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)"
                      : "0 6px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)"
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isToggling) {
                    e.currentTarget.style.transform = "scale(1)"
                    e.currentTarget.style.boxShadow = isOnline
                      ? "0 0 0 0 rgba(16, 185, 129, 0.7), 0 4px 20px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                      : "0 4px 12px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                  }
                }}
              >
                {/* Animated background shimmer effect */}
                {isOnline && !isToggling && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: "-100%",
                      width: "100%",
                      height: "100%",
                      background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)",
                      animation: "shimmer 3s infinite",
                    }}
                  />
                )}

                {/* Icon */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.2)",
                    transition: "all 0.3s ease",
                  }}
                >
                  {isToggling ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : isOnline ? (
                    <Wifi size={18} />
                  ) : (
                    <WifiOff size={18} />
                  )}
                </div>

                {/* Status text */}
                <span style={{ letterSpacing: "0.05em" }}>
                  {isToggling ? "ALTERANDO..." : isOnline ? "ONLINE" : "OFFLINE"}
                </span>

                {/* Pulse indicator */}
                <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      backgroundColor: isOnline ? "#ffffff" : "#d1d5db",
                      boxShadow: isOnline ? "0 0 8px rgba(255, 255, 255, 0.8)" : "none",
                      transition: "all 0.3s ease",
                    }}
                  />
                  {isOnline && (
                    <div
                      style={{
                        position: "absolute",
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        backgroundColor: "#ffffff",
                        animation: "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
                      }}
                    />
                  )}
                </div>
              </button>

              {/* Status badge */}
              <div
                style={{
                  padding: "0.5rem 1.25rem",
                  borderRadius: "9999px",
                  background: isOnline ? "rgba(16, 185, 129, 0.2)" : "rgba(107, 114, 128, 0.2)",
                  border: `1px solid ${isOnline ? "rgba(16, 185, 129, 0.4)" : "rgba(107, 114, 128, 0.4)"}`,
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "white",
                  transition: "all 0.3s ease",
                }}
              >
                {isOnline ? "Aceitando Consultas" : "Indisponível"}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1.5rem",
              marginTop: "2rem",
            }}
          >
            <Card
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)"
                e.currentTarget.style.transform = "translateY(-4px)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.15)"
                e.currentTarget.style.transform = "translateY(0)"
              }}
            >
              <CardContent style={{ padding: "1.5rem", textAlign: "center" }}>
                <User size={32} style={{ color: "white", margin: "0 auto 0.5rem" }} />
                <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "white", marginBottom: "0.25rem" }}>
                  {dashboardData.stats.patients_attended}
                </div>
                <div style={{ fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.9)", fontWeight: "500" }}>
                  Pacientes Atendidos
                </div>
              </CardContent>
            </Card>

            <Card
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)"
                e.currentTarget.style.transform = "translateY(-4px)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.15)"
                e.currentTarget.style.transform = "translateY(0)"
              }}
            >
              <CardContent style={{ padding: "1.5rem", textAlign: "center" }}>
                <Calendar size={32} style={{ color: "white", margin: "0 auto 0.5rem" }} />
                <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "white", marginBottom: "0.25rem" }}>
                  {dashboardData.stats.appointments_today}
                </div>
                <div style={{ fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.9)", fontWeight: "500" }}>
                  Consultas Hoje
                </div>
              </CardContent>
            </Card>

            <Card
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)"
                e.currentTarget.style.transform = "translateY(-4px)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.15)"
                e.currentTarget.style.transform = "translateY(0)"
              }}
            >
              <CardContent style={{ padding: "1.5rem", textAlign: "center" }}>
                <Star size={32} style={{ color: "#fbbf24", margin: "0 auto 0.5rem" }} />
                <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "white", marginBottom: "0.25rem" }}>
                  {dashboardData.stats.average_rating.toFixed(1)}
                </div>
                <div style={{ fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.9)", fontWeight: "500" }}>
                  Avaliação Média
                </div>
              </CardContent>
            </Card>

            <Card
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)"
                e.currentTarget.style.transform = "translateY(-4px)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.15)"
                e.currentTarget.style.transform = "translateY(0)"
              }}
            >
              <CardContent style={{ padding: "1.5rem", textAlign: "center" }}>
                <DollarSign size={32} style={{ color: "white", margin: "0 auto 0.5rem" }} />
                <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "white", marginBottom: "0.25rem" }}>
                  R$ {dashboardData.stats.monthly_earnings.toFixed(2)}
                </div>
                <div style={{ fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.9)", fontWeight: "500" }}>
                  Ganhos do Mês
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section style={{ padding: "3rem 1rem", maxWidth: "1200px", margin: "0 auto" }}>
        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="schedule">Agenda</TabsTrigger>
            <TabsTrigger value="patients">Pacientes</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="reviews">Avaliações</TabsTrigger>
          </TabsList>

          {/* Schedule Tab - Shows PENDING and CONFIRMED visits */}
          <TabsContent value="schedule" className="space-y-4">
            <Card style={{ border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)" }}>
              <CardHeader style={{ background: "linear-gradient(to right, #f9fafb, #ffffff)" }}>
                <CardTitle style={{ color: "#15803d" }}>Agenda de Hoje</CardTitle>
                <CardDescription>Seus próximos atendimentos agendados</CardDescription>
              </CardHeader>
              <CardContent style={{ padding: "1.5rem" }}>
                <div className="space-y-3">
                  {getScheduleVisits().length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "3rem 1rem",
                        color: "#9ca3af",
                        backgroundColor: "#f9fafb",
                        borderRadius: "0.5rem",
                      }}
                    >
                      <Calendar size={48} style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
                      <p>Nenhuma visita agendada no momento</p>
                    </div>
                  ) : (
                    getScheduleVisits().map((visit) => (
                      <div
                        key={visit.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "1.25rem",
                          border: "1px solid #e5e7eb",
                          borderRadius: "0.75rem",
                          backgroundColor: "#ffffff",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)"
                          e.currentTarget.style.borderColor = "#15803d"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = "none"
                          e.currentTarget.style.borderColor = "#e5e7eb"
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontWeight: "600",
                              fontSize: "1.125rem",
                              color: "#1f2937",
                              marginBottom: "0.25rem",
                            }}
                          >
                            {visit.patient_name}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.5rem" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.25rem",
                                color: "#6b7280",
                                fontSize: "0.875rem",
                              }}
                            >
                              <Clock size={14} />
                              {formatDate(visit.date)}
                            </div>
                            <div style={{ color: "#9ca3af" }}>•</div>
                            <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                              {formatVisitType(visit.visit_type)}
                            </div>
                            <div style={{ color: "#9ca3af" }}>•</div>
                            <div style={{ fontSize: "0.875rem", fontWeight: "600", color: "#15803d" }}>
                              R$ {visit.visit_value.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={visit.status === "CONFIRMED" ? "default" : "secondary"}
                          style={{
                            backgroundColor: visit.status === "CONFIRMED" ? "#dcfce7" : "#f3f4f6",
                            color: visit.status === "CONFIRMED" ? "#15803d" : "#6b7280",
                            border: "none",
                            padding: "0.5rem 1rem",
                          }}
                        >
                          {formatStatus(visit.status)}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Patients Tab - Shows unique patients from all visits */}
          <TabsContent value="patients" className="space-y-4">
            <Card style={{ border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)" }}>
              <CardHeader style={{ background: "linear-gradient(to right, #f9fafb, #ffffff)" }}>
                <CardTitle style={{ color: "#15803d" }}>Meus Pacientes</CardTitle>
                <CardDescription>Lista de pacientes sob seus cuidados</CardDescription>
              </CardHeader>
              <CardContent style={{ padding: "1.5rem" }}>
                <div className="space-y-3">
                  {getUniquePatients().length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "3rem 1rem",
                        color: "#9ca3af",
                        backgroundColor: "#f9fafb",
                        borderRadius: "0.5rem",
                      }}
                    >
                      <User size={48} style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
                      <p>Nenhum paciente cadastrado</p>
                    </div>
                  ) : (
                    getUniquePatients().map((patient) => (
                      <div
                        key={patient.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "1.25rem",
                          border: "1px solid #e5e7eb",
                          borderRadius: "0.75rem",
                          backgroundColor: "#ffffff",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)"
                          e.currentTarget.style.borderColor = "#15803d"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = "none"
                          e.currentTarget.style.borderColor = "#e5e7eb"
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: "600", fontSize: "1.125rem", color: "#1f2937" }}>
                            {patient.name}
                          </div>
                          <div style={{ color: "#6b7280", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                            ID: {patient.id}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.25rem" }}>
                            Última visita
                          </div>
                          <div style={{ fontSize: "0.875rem", fontWeight: "600", color: "#15803d" }}>
                            {formatDate(patient.last_visit)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab - Shows COMPLETED visits */}
          <TabsContent value="history" className="space-y-4">
            <Card style={{ border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)" }}>
              <CardHeader style={{ background: "linear-gradient(to right, #f9fafb, #ffffff)" }}>
                <CardTitle style={{ color: "#15803d" }}>Histórico de Atendimentos</CardTitle>
                <CardDescription>Seus atendimentos realizados recentemente</CardDescription>
              </CardHeader>
              <CardContent style={{ padding: "1.5rem" }}>
                <div className="space-y-3">
                  {getCompletedVisits().length === 0 ? (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "3rem 1rem",
                        color: "#9ca3af",
                        backgroundColor: "#f9fafb",
                        borderRadius: "0.5rem",
                      }}
                    >
                      <Clock size={48} style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
                      <p>Nenhum atendimento concluído</p>
                    </div>
                  ) : (
                    getCompletedVisits().map((visit) => (
                      <div
                        key={visit.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "1.25rem",
                          border: "1px solid #e5e7eb",
                          borderRadius: "0.75rem",
                          backgroundColor: "#ffffff",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)"
                          e.currentTarget.style.borderColor = "#15803d"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = "none"
                          e.currentTarget.style.borderColor = "#e5e7eb"
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontWeight: "600",
                              fontSize: "1.125rem",
                              color: "#1f2937",
                              marginBottom: "0.25rem",
                            }}
                          >
                            {visit.patient_name}
                          </div>
                          <div style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                            {formatVisitType(visit.visit_type)}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.5rem" }}>
                            {formatDate(visit.date)} • Criado em: {formatDate(visit.created_at)}
                          </div>
                        </div>
                        <div
                          style={{
                            fontWeight: "700",
                            fontSize: "1.25rem",
                            color: "#15803d",
                            padding: "0.5rem 1rem",
                            backgroundColor: "#dcfce7",
                            borderRadius: "0.5rem",
                          }}
                        >
                          R$ {visit.visit_value.toFixed(2)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            <Card style={{ border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)" }}>
              <CardHeader style={{ background: "linear-gradient(to right, #fef3c7, #fef9e7)" }}>
                <CardTitle style={{ color: "#92400e", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Star size={24} style={{ fill: "#fbbf24", stroke: "#fbbf24" }} />
                  Avaliações dos Pacientes
                </CardTitle>
                <CardDescription>Veja o que seus pacientes estão dizendo sobre você</CardDescription>
              </CardHeader>
              <CardContent style={{ padding: "1.5rem" }}>
                {!dashboardData.reviews || dashboardData.reviews.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "3rem 1rem",
                      color: "#9ca3af",
                      backgroundColor: "#f9fafb",
                      borderRadius: "0.5rem",
                    }}
                  >
                    <Star size={48} style={{ margin: "0 auto 1rem", opacity: 0.5, stroke: "#d1d5db" }} />
                    <p>Nenhuma avaliação recebida ainda</p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: "1rem" }}>
                    {dashboardData.reviews.map((review, index) => (
                      <div
                        key={index}
                        style={{
                          padding: "1.5rem",
                          border: "1px solid #e5e7eb",
                          borderRadius: "0.75rem",
                          backgroundColor: "#ffffff",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(251, 191, 36, 0.15)"
                          e.currentTarget.style.borderColor = "#fbbf24"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = "none"
                          e.currentTarget.style.borderColor = "#e5e7eb"
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: "1rem",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontWeight: "600",
                                fontSize: "1.125rem",
                                color: "#1f2937",
                                marginBottom: "0.5rem",
                              }}
                            >
                              {review.patient_name}
                            </div>
                            {renderStars(review.rating)}
                          </div>
                          <Badge
                            style={{
                              backgroundColor: "#fef3c7",
                              color: "#92400e",
                              border: "1px solid #fbbf24",
                              padding: "0.25rem 0.75rem",
                              fontSize: "0.875rem",
                              fontWeight: "600",
                            }}
                          >
                            {review.rating.toFixed(1)} ★
                          </Badge>
                        </div>
                        <p
                          style={{
                            color: "#4b5563",
                            fontSize: "0.9375rem",
                            lineHeight: "1.6",
                            fontStyle: "italic",
                            padding: "1rem",
                            backgroundColor: "#f9fafb",
                            borderRadius: "0.5rem",
                            borderLeft: "3px solid #fbbf24",
                          }}
                        >
                          "{review.comment}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      {/* Add keyframes for animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
