"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

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
    latitude?: number
    longitude?: number
}

interface ApiResponse {
    data: Nurse[]
    message: string
    success: boolean
}

export default function NursesMapPage() {
    const [nurses, setNurses] = useState<Nurse[]>([])
    const [selectedNurse, setSelectedNurse] = useState<Nurse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [userLocation, setUserLocation] = useState({ lat: -23.5505, lng: -46.6333 }) // Default: São Paulo

    useEffect(() => {
        const fetchNurses = async () => {
            try {
                setLoading(true)
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/all_nurses`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                })

                if (!response.ok) {
                    throw new Error("Falha ao carregar enfermeiros")
                }

                const data: ApiResponse = await response.json()

                if (data.success) {
                    // Filter only available nurses
                    const availableNurses = data.data.filter((nurse) => nurse.available)
                    // Add mock coordinates for demonstration (in production, these would come from the API)
                    const nursesWithCoords = availableNurses.map((nurse, index) => ({
                        ...nurse,
                        latitude: userLocation.lat + (Math.random() - 0.5) * 0.1,
                        longitude: userLocation.lng + (Math.random() - 0.5) * 0.1,
                    }))
                    setNurses(nursesWithCoords)
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
                    {/* Map Container */}
                    <Card style={{ overflow: "hidden", position: "relative" }}>
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                backgroundColor: "#e5e7eb",
                                position: "relative",
                                overflow: "hidden",
                            }}
                        >
                            {/* Simple map visualization */}
                            <div
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 50%, #6ee7b7 100%)",
                                    position: "relative",
                                }}
                            >
                                {/* User location marker */}
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "50%",
                                        left: "50%",
                                        transform: "translate(-50%, -50%)",
                                        zIndex: 10,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "20px",
                                            height: "20px",
                                            backgroundColor: "#3b82f6",
                                            borderRadius: "50%",
                                            border: "3px solid white",
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                                        }}
                                    />
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: "25px",
                                            left: "50%",
                                            transform: "translateX(-50%)",
                                            backgroundColor: "white",
                                            padding: "4px 8px",
                                            borderRadius: "4px",
                                            fontSize: "12px",
                                            fontWeight: "600",
                                            whiteSpace: "nowrap",
                                            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                        }}
                                    >
                                        Você está aqui
                                    </div>
                                </div>

                                {/* Nurse markers */}
                                {nurses.map((nurse, index) => {
                                    const offsetX = ((nurse.longitude || 0) - userLocation.lng) * 3000
                                    const offsetY = ((nurse.latitude || 0) - userLocation.lat) * 3000

                                    return (
                                        <div
                                            key={nurse.id}
                                            style={{
                                                position: "absolute",
                                                top: `calc(50% + ${offsetY}px)`,
                                                left: `calc(50% + ${offsetX}px)`,
                                                transform: "translate(-50%, -50%)",
                                                cursor: "pointer",
                                                zIndex: selectedNurse?.id === nurse.id ? 20 : 5,
                                            }}
                                            onClick={() => setSelectedNurse(nurse)}
                                        >
                                            <div
                                                style={{
                                                    width: "40px",
                                                    height: "40px",
                                                    backgroundColor: selectedNurse?.id === nurse.id ? "#15803d" : "#10b981",
                                                    borderRadius: "50%",
                                                    border: "3px solid white",
                                                    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    color: "white",
                                                    fontWeight: "bold",
                                                    fontSize: "18px",
                                                    transition: "all 0.2s",
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = "scale(1.2)"
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = "scale(1)"
                                                }}
                                            >
                                                👨‍⚕️
                                            </div>
                                            {selectedNurse?.id === nurse.id && (
                                                <div
                                                    style={{
                                                        position: "absolute",
                                                        top: "45px",
                                                        left: "50%",
                                                        transform: "translateX(-50%)",
                                                        backgroundColor: "white",
                                                        padding: "6px 10px",
                                                        borderRadius: "6px",
                                                        fontSize: "13px",
                                                        fontWeight: "600",
                                                        whiteSpace: "nowrap",
                                                        boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                                                        border: "2px solid #15803d",
                                                    }}
                                                >
                                                    {nurse.name}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}

                                {/* Map controls */}
                                <div
                                    style={{
                                        position: "absolute",
                                        bottom: "20px",
                                        right: "20px",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "8px",
                                    }}
                                >
                                    <Button
                                        style={{
                                            backgroundColor: "white",
                                            color: "#15803d",
                                            width: "40px",
                                            height: "40px",
                                            padding: 0,
                                            fontSize: "20px",
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                                        }}
                                    >
                                        +
                                    </Button>
                                    <Button
                                        style={{
                                            backgroundColor: "white",
                                            color: "#15803d",
                                            width: "40px",
                                            height: "40px",
                                            padding: 0,
                                            fontSize: "20px",
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                                        }}
                                    >
                                        −
                                    </Button>
                                </div>

                                {/* Legend */}
                                <div
                                    style={{
                                        position: "absolute",
                                        top: "20px",
                                        left: "20px",
                                        backgroundColor: "white",
                                        padding: "12px",
                                        borderRadius: "8px",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                                    }}
                                >
                                    <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px", color: "#1f2937" }}>
                                        Legenda
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                                        <div
                                            style={{
                                                width: "16px",
                                                height: "16px",
                                                backgroundColor: "#3b82f6",
                                                borderRadius: "50%",
                                                border: "2px solid white",
                                            }}
                                        />
                                        <span style={{ fontSize: "13px", color: "#6b7280" }}>Sua localização</span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <div
                                            style={{
                                                width: "16px",
                                                height: "16px",
                                                backgroundColor: "#10b981",
                                                borderRadius: "50%",
                                                border: "2px solid white",
                                            }}
                                        />
                                        <span style={{ fontSize: "13px", color: "#6b7280" }}>Enfermeiro disponível</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Sidebar with nurse details */}
                    <div style={{ overflowY: "auto" }}>
                        {selectedNurse ? (
                            <Card>
                                <CardContent style={{ padding: "1.5rem" }}>
                                    <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                                        <img
                                            src={selectedNurse.image || "/placeholder.svg?height=80&width=80&query=nurse professional"}
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
                                        <Link href={`/visit/nurses-list/${selectedNurse.id}`} style={{ flex: 1 }}>
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
                                        Clique em um marcador verde no mapa para ver os detalhes do enfermeiro
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* List of all available nurses */}
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
                                                    src={nurse.image || "/placeholder.svg?height=50&width=50&query=nurse"}
                                                    alt={nurse.name}
                                                    style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover" }}
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
