"use client"

import { useState, useEffect, useRef } from "react"
import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

interface PatientLocation {
  latitude: number
  longitude: number
}

interface Nurse {
  id: string
  name: string
  specialization: string
  years_experience: number
  price: number
  shift: string
  image: string
  available: boolean
  location: string
  neighborhood: string
  latitude: number
  longitude: number
  patient_location: PatientLocation
}

interface ApiResponse {
  data: Nurse[]
  message: string
  success: boolean
}

const NursesMapWithNoSSR = dynamic(() => import("@/components/ui/NursesMap"), {
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-lg bg-gray-100">
      <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      <p className="ml-3 text-gray-600">Carregando mapa interativo...</p>
    </div>
  ),
  ssr: false,
})

const FUZZ_AMOUNT = 0.002
const fuzzCoordinates = (lat: number, lng: number) => {
  const latOffset = (Math.random() - 0.5) * FUZZ_AMOUNT * 2
  const lngOffset = (Math.random() - 0.5) * FUZZ_AMOUNT * 2
  return {
    latitude: lat + latOffset,
    longitude: lng + lngOffset,
  }
}

export default function NursesMapPage() {
  const [nurses, setNurses] = useState<Nurse[]>([])
  const [selectedNurse, setSelectedNurse] = useState<Nurse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState({ lat: -23.5505, lng: -46.6333 })

  const rightPanelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchNurses = async () => {
      try {
        setLoading(true)
        setError(null)
        const token = localStorage.getItem("token")
        if (!token) {
          throw new Error("Usuário não autenticado")
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/online_nurses`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Falha ao carregar enfermeiros")
        }

        const data: ApiResponse = await response.json()

        if (data.success) {
          if (data.data.length > 0 && data.data[0].patient_location) {
            const patLoc = data.data[0].patient_location
            setUserLocation({ lat: patLoc.latitude, lng: patLoc.longitude })
          }

          const availableNurses = data.data.filter((nurse) => nurse.available)

          const nursesWithFuzzedCoords = availableNurses.map((nurse) => {
            const { latitude, longitude } = fuzzCoordinates(nurse.latitude, nurse.longitude)

            return {
              ...nurse,
              latitude: latitude,
              longitude: longitude,
            }
          })

          setNurses(nursesWithFuzzedCoords)
        } else {
          throw new Error(data.message || "Erro ao carregar dados")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido")
        console.error("Erro ao buscar enfermeiros:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchNurses()
  }, [])

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <Header />

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem 1rem" }}>
        <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "2rem", fontWeight: "bold", color: "#15803d", marginBottom: "0.5rem" }}>
              Mapa de Enfermeiros Disponíveis
            </h1>
            <p style={{ color: "#6b7280" }}>{nurses.length} enfermeiros online próximos à sua localização</p>
          </div>
          <Link href="/patient">
          </Link>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "1.5rem", height: "calc(100vh - 250px)" }}
        >
          <Card style={{ overflow: "hidden", position: "relative" }}>
            <NursesMapWithNoSSR
              userLocation={userLocation}
              nurses={nurses}
              selectedNurse={selectedNurse}
              onSelectNurse={setSelectedNurse}
            />
          </Card>

          <div ref={rightPanelRef} style={{ overflowY: "auto" }}>
            <div>
              <h3 style={{ fontSize: "1.125rem", fontWeight: "bold", color: "#1f2937", marginBottom: "1rem" }}>
                Todos os Enfermeiros Disponíveis ({nurses.length})
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {nurses.map((nurse) => {
                  const isSelected = selectedNurse?.id === nurse.id

                  return (
                    <Card
                      key={nurse.id}
                      style={{
                        cursor: "pointer",
                        border: isSelected ? "2px solid #15803d" : "1px solid #e5e7eb",
                        transition: "all 0.2s",
                      }}
                      onClick={() => setSelectedNurse(nurse)}
                    >
                      <CardContent style={{ padding: "1rem" }}>
                        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                          <img
                            src={nurse.image ? `${API_BASE_URL}/user/file/${nurse.image}` : "/placeholder-avatar.png"}
                            alt={nurse.name}
                            style={{
                              width: isSelected ? "80px" : "60px",
                              height: isSelected ? "80px" : "60px",
                              borderRadius: "50%",
                              objectFit: "cover",
                              flexShrink: 0,
                              transition: "all 0.2s",
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: "600", color: "#1f2937", marginBottom: "0.25rem" }}>
                              {nurse.name}
                            </div>
                            <div
                              style={{
                                fontSize: "0.875rem",
                                color: "#15803d",
                                fontWeight: "600",
                                marginBottom: "0.25rem",
                              }}
                            >
                              {nurse.specialization}
                            </div>

                            {isSelected && (
                              <Badge style={{ backgroundColor: "#15803d", marginBottom: "0.5rem" }}>
                                Disponível Agora
                              </Badge>
                            )}

                            {isSelected ? (
                              <div style={{ marginTop: "0.75rem", fontSize: "0.875rem" }}>
                                <div style={{ marginBottom: "0.5rem" }}>
                                  <span style={{ color: "#6b7280" }}>Experiência:</span>
                                  <span style={{ marginLeft: "0.5rem", fontWeight: "600" }}>
                                    {nurse.years_experience} anos
                                  </span>
                                </div>
                                <div style={{ marginBottom: "0.5rem" }}>
                                  <span style={{ color: "#6b7280" }}>Turno:</span>
                                  <span style={{ marginLeft: "0.5rem", fontWeight: "600" }}>{nurse.shift}</span>
                                </div>
                                <div style={{ marginBottom: "0.5rem" }}>
                                  <span style={{ color: "#6b7280" }}>Localização:</span>
                                  <span style={{ marginLeft: "0.5rem", fontWeight: "600" }}>{nurse.location}</span>
                                </div>
                                <div style={{ marginBottom: "0.75rem" }}>
                                  <span style={{ color: "#6b7280" }}>Bairro:</span>
                                  <span style={{ marginLeft: "0.5rem", fontWeight: "600" }}>{nurse.neighborhood}</span>
                                </div>

                                <div style={{ marginBottom: "1rem" }}>
                                  <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#15803d" }}>
                                    {nurse.price > 0 ? `R$ ${nurse.price}` : "A combinar"}
                                  </div>
                                  {nurse.price > 0 && (
                                    <span style={{ color: "#6b7280", fontSize: "0.875rem" }}>/hora</span>
                                  )}
                                </div>

                                <Link
                                  href={`/nurse-profile/online/${nurse.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  style={{ display: "block" }}
                                >
                                  <Button
                                    style={{
                                      backgroundColor: "#15803d",
                                      color: "white",
                                      width: "100%",
                                    }}
                                  >
                                    Ver Perfil Completo
                                  </Button>
                                </Link>
                              </div>
                            ) : (
                              <div style={{ marginTop: "0.5rem" }}>
                                <div style={{ fontWeight: "bold", color: "#15803d" }}>
                                  {nurse.price > 0 ? `R$ ${nurse.price}/hora` : "A combinar"}
                                </div>
                                <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{nurse.neighborhood}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
