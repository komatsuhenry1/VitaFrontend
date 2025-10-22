"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

// --- MUDANÇA: Interfaces atualizadas ---

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
    // Agora são obrigatórios e vêm da API
    latitude: number
    longitude: number
    // Novo campo para a localização do paciente
    patient_location: PatientLocation
}

interface ApiResponse {
    data: Nurse[]
    message: string
    success: boolean
}
// --- FIM DA MUDANÇA ---

const NursesMapWithNoSSR = dynamic(() => import("@/components/ui/NursesMap"), {
    loading: () => (
        <div className="flex h-full w-full items-center justify-center rounded-lg bg-gray-100">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            <p className="ml-3 text-gray-600">Carregando mapa interativo...</p>
        </div>
    ),
    ssr: false, // Essencial para bibliotecas de mapa
})

// --- MUDANÇA: Função para randomizar localização (Fuzzing) ---
/**
 * Adiciona uma pequena variação aleatória às coordenadas para
 * mostrar uma localização "aproximada" e proteger a privacidade.
 * 0.002 graus é ~222 metros.
 */
const FUZZ_AMOUNT = 0.002
const fuzzCoordinates = (lat: number, lng: number) => {
    const latOffset = (Math.random() - 0.5) * FUZZ_AMOUNT * 2
    const lngOffset = (Math.random() - 0.5) * FUZZ_AMOUNT * 2
    return {
        latitude: lat + latOffset,
        longitude: lng + lngOffset,
    }
}
// --- FIM DA MUDANÇA ---

export default function NursesMapPage() {
    const [nurses, setNurses] = useState<Nurse[]>([])
    const [selectedNurse, setSelectedNurse] = useState<Nurse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    // Começa com um padrão, mas será ATUALIZADO PELA API
    const [userLocation, setUserLocation] = useState({ lat: -23.5505, lng: -46.6333 })

    // --- MUDANÇA: Lógica de fetch totalmente refeita ---
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
                    // 1. REQUISITO: Pegar a localização EXATA do paciente vinda da API
                    if (data.data.length > 0 && data.data[0].patient_location) {
                        const patLoc = data.data[0].patient_location
                        setUserLocation({ lat: patLoc.latitude, lng: patLoc.longitude })
                    }

                    const availableNurses = data.data.filter((nurse) => nurse.available)

                    // 2. REQUISITO: Mostrar enfermeiros de forma APROXIMADA
                    const nursesWithFuzzedCoords = availableNurses.map((nurse) => {
                        // Pega as coordenadas "embaralhadas"
                        const { latitude, longitude } = fuzzCoordinates(nurse.latitude, nurse.longitude)

                        return {
                            ...nurse,
                            latitude: latitude,   // Sobrescreve com o valor aproximado
                            longitude: longitude, // Sobrescreve com o valor aproximado
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
    }, []) // Roda apenas UMA VEZ
    // --- FIM DA MUDANÇA ---


    // O JSX de Loading e Error permanece o mesmo...
    if (loading) {
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
                        <p style={{ color: "#6b7280" }}>Carregando mapa...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
                <Header />
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
                    <div style={{ textAlign: "center", color: "#dc2626" }}>
                        <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>Erro ao carregar dados</h3>
                        <p>{error}</p>
                        <Button onClick={() => window.location.reload()} style={{ marginTop: "1rem", backgroundColor: "#15803d" }}>
                            Tentar Novamente
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    // O JSX principal permanece o mesmo...
    const nurse = selectedNurse
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
    const imageUrl = nurse?.image ? `${API_BASE_URL}/user/file/${nurse.image}` : "/placeholder-avatar.png"

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
                        <Button variant="outline" style={{ borderColor: "#15803d", color: "#15803d" }}>
                            Ver Lista
                        </Button>
                    </Link>
                </div>

                <div
                    style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "1.5rem", height: "calc(100vh - 250px)" }}
                >
                    <Card style={{ overflow: "hidden", position: "relative" }}>
                        {/* Este componente agora recebe a localização EXATA do paciente
                          e a lista de enfermeiros com localizações APROXIMADAS 
                        */}
                        <NursesMapWithNoSSR
                            userLocation={userLocation}
                            nurses={nurses}
                            selectedNurse={selectedNurse}
                            onSelectNurse={setSelectedNurse}
                        />
                    </Card>

                    <div style={{ overflowY: "auto" }}>
                        {selectedNurse ? (
                            <Card>
                                <CardContent style={{ padding: "1.5rem" }}>
                                    <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                                        <img
                                            src={selectedNurse.image ? `${API_BASE_URL}/user/file/${selectedNurse.image}` : "/placeholder-avatar.png"}
                                            alt={selectedNurse.name}
                                            style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover" }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#1f2937", marginBottom: "0.5rem" }}>
                                                {selectedNurse.name}
                                            </h3>
                                            <p style={{ color: "#15803d", fontWeight: "600", marginBottom: "0.25rem" }}>
                                                {selectedNurse.specialization}
                                            </p>
                                            <Badge style={{ backgroundColor: "#15803d" }}>Disponível Agora</Badge>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: "1rem", fontSize: "0.875rem" }}>
                                        <div style={{ marginBottom: "0.5rem" }}>
                                            <span style={{ color: "#6b7280" }}>Experiência:</span>
                                            <span style={{ marginLeft: "0.5rem", fontWeight: "600" }}>
                                                {selectedNurse.years_experience} anos
                                            </span>
                                        </div>
                                        <div style={{ marginBottom: "0.5rem" }}>
                                            <span style={{ color: "#6b7280" }}>Turno:</span>
                                            <span style={{ marginLeft: "0.5rem", fontWeight: "600" }}>{selectedNurse.shift}</span>
                                        </div>
                                        <div style={{ marginBottom: "0.5rem" }}>
                                            <span style={{ color: "#6b7280" }}>Localização:</span>
                                            <span style={{ marginLeft: "0.5rem", fontWeight: "600" }}>{selectedNurse.location}</span>
                                        </div>
                                        <div>
                                            <span style={{ color: "#6b7280" }}>Bairro:</span>
                                            <span style={{ marginLeft: "0.5rem", fontWeight: "600" }}>{selectedNurse.neighborhood}</span>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: "1.5rem" }}>
                                        <div style={{ fontSize: "1.75rem", fontWeight: "bold", color: "#15803d" }}>
                                            {selectedNurse.price > 0 ? `R$ ${selectedNurse.price}` : "A combinar"}
                                        </div>
                                        {selectedNurse.price > 0 && <span style={{ color: "#6b7280", fontSize: "0.875rem" }}>/hora</span>}
                                    </div>

                                    <div style={{ display: "flex", gap: "0.5rem" }}>
                                        <Link href={`/nurse-profile/${selectedNurse.id}`} style={{ flex: 1 }}>
                                            <Button style={{ backgroundColor: "#15803d", color: "white", width: "100%" }}>
                                                Ver Perfil Completo
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardContent style={{ padding: "2rem", textAlign: "center" }}>
                                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🗺️</div>
                                    <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#1f2937", marginBottom: "0.5rem" }}>
                                        Selecione um Enfermeiro
                                    </h3>
                                    <p style={{ color: "#6b7280" }}>
                                        Clique em um marcador no mapa ou na lista abaixo para ver os detalhes
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        <div style={{ marginTop: "1.5rem" }}>
                            <h3 style={{ fontSize: "1.125rem", fontWeight: "bold", color: "#1f2937", marginBottom: "1rem" }}>
                                Todos os Enfermeiros Disponíveis ({nurses.length})
                            </h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                {nurses.map((nurse) => (
                                    <Card
                                        key={nurse.id}
                                        style={{
                                            cursor: "pointer",
                                            border: selectedNurse?.id === nurse.id ? "2px solid #15803d" : "1px solid #e5e7eb",
                                            transition: "all 0.2s",
                                        }}
                                        onClick={() => setSelectedNurse(nurse)}
                                    >
                                        <CardContent style={{ padding: "1rem" }}>
                                            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                                                <img
                                                    src={nurse.image ? `${API_BASE_URL}/user/file/${nurse.image}` : "/placeholder-avatar.png"}
                                                    alt={nurse.name}
                                                    style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover" }}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: "600", color: "#1f2937", marginBottom: "0.25rem" }}>
                                                        {nurse.name}
                                                    </div>
                                                    <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>{nurse.specialization}</div>
                                                </div>
                                                <div style={{ textAlign: "right" }}>
                                                    <div style={{ fontWeight: "bold", color: "#15803d" }}>
                                                        {nurse.price > 0 ? `R$ ${nurse.price}` : "A combinar"}
                                                    </div>
                                                    <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{nurse.neighborhood}</div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
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