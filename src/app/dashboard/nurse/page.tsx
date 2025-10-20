"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/Header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Wifi, WifiOff, Loader2 } from "lucide-react"
import { toast } from "sonner"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

interface NurseData {
  id: string
  name: string
  specialization: string
  experience: number
  rating: number
  online: boolean // [MUDANÇA] Campo 'online' adicionado à interface
  price: number
  shift: string
  department: string
  image: string
  available: boolean
  location: string
  bio: string
  qualifications: string[]
  services: string[]
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

        const response = await fetch(`${API_BASE_URL}/user/nurse/${nurseId}`, {
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
          setIsOnline(result.data.online) // [MUDANÇA] O estado 'isOnline' é definido com o valor da API

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
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "white" }}>24</div>
                <div style={{ fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.8)" }}>Pacientes Atendidos</div>
              </CardContent>
            </Card>

            <Card style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", border: "none" }}>
              <CardContent style={{ padding: "1.5rem", textAlign: "center" }}>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "white" }}>8</div>
                <div style={{ fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.8)" }}>Consultas Hoje</div>
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
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "white" }}>R$ 2.450</div>
                <div style={{ fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.8)" }}>Ganhos do Mês</div>
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
          {/* </CHANGE> */}

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Agenda de Hoje</CardTitle>
                <CardDescription>Seus próximos atendimentos agendados</CardDescription>
              </CardHeader>
              <CardContent>
                <p style={{ textAlign: "center", color: "#6b7280", padding: "2rem" }}>
                  Nenhuma visita agendada no momento
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Patients Tab */}
          <TabsContent value="patients" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Meus Pacientes</CardTitle>
                <CardDescription>Lista de pacientes sob seus cuidados</CardDescription>
              </CardHeader>
              <CardContent>
                <p style={{ textAlign: "center", color: "#6b7280", padding: "2rem" }}>Nenhum paciente cadastrado</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Atendimentos</CardTitle>
                <CardDescription>Seus atendimentos realizados recentemente</CardDescription>
              </CardHeader>
              <CardContent>
                <p style={{ textAlign: "center", color: "#6b7280", padding: "2rem" }}>Nenhum atendimento concluído</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  )
}
