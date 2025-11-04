"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Shield,
    CreditCard,
    Clock,
    Star,
    Activity,
    MessageSquare,
} from "lucide-react"
import Image from "next/image"
import { Footer } from "@/components/Footer"

interface PatientData {
    id: string
    name: string
    email: string
    phone: string
    address: string
    cpf: string
    role: string
    first_access: boolean
    created_at: string
    updated_at: string
    hidden: boolean
    visit_count: number
    rating: number
    comments: string[]
    profile_image_id: string
    reviews: {
        nurse_name: string
        rating: number
        comment: string
    }[]
}

interface ApiResponse {
    data: PatientData
    message: string
    success: boolean
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api/v1"

export default function PatientProfile() {
    const params = useParams()
    const router = useRouter()
    const patientId = params.id as string

    const [patient, setPatient] = useState<PatientData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchPatientData = async () => {
            try {
                setLoading(true)
                const response = await fetch(`${API_BASE_URL}/nurse/patient/${patientId}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                })

                if (!response.ok) {
                    throw new Error("Paciente não encontrado")
                }

                const result: ApiResponse = await response.json()

                if (result.success && result.data) {
                    toast.success("Perfil do paciente carregado com sucesso!")

                    // Normaliza os dados para garantir que arrays nunca sejam nulos
                    const normalizedData: PatientData = {
                        ...result.data,
                        comments: result.data.comments || [], // Garante que 'comments' seja sempre um array
                        reviews: result.data.reviews || [],   // Boa prática para 'reviews' também
                    }

                    setPatient(normalizedData) // Salva os dados limpos
                } else {
                    throw new Error(result.message || "Erro ao carregar dados do paciente")
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Erro desconhecido")
                toast.error("Erro ao carregar perfil do paciente")
            } finally {
                setLoading(false)
            }
        }

        if (patientId) {
            fetchPatientData()
        }
    }, [patientId])

    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A"
        const date = new Date(dateString)
        return date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        })
    }

    const formatCPF = (cpf: string) => {
        if (!cpf) return "N/A"
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    }

    const formatPhone = (phone: string) => {
        if (!phone) return "N/A"
        return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
    }

    const renderStars = (rating: number) => {
        return (
            <div style={{ display: "flex", gap: "0.25rem" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={20}
                        style={{
                            fill: star <= rating ? "#fbbf24" : "none",
                            color: star <= rating ? "#fbbf24" : "#d1d5db",
                        }}
                    />
                ))}
            </div>
        )
    }

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
                <Header />
                <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem", textAlign: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                        <div style={{ color: "#15803d", fontSize: "1.125rem" }}>Carregando perfil do paciente...</div>
                    </div>
                </div>
            </div>
        )
    }

    if (error || !patient) {
        return (
            <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
                <Header />
                <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem", textAlign: "center" }}>
                    <h1 style={{ color: "#dc2626", marginBottom: "1rem" }}>{error || "Paciente não encontrado"}</h1>
                    <Button onClick={() => router.back()} style={{ marginTop: "1rem" }}>
                        Voltar
                    </Button>
                </div>
            </div>
        )
    }

    const imageUrl = patient.profile_image_id
        ? `http://localhost:8081/api/v1/user/file/${patient.profile_image_id}`
        : null

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
            <Header />

            <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2rem" }}>
                    {/* Left Column - Patient Info Card */}
                    <div>
                        <Card>
                            <CardContent style={{ padding: "2rem", textAlign: "center" }}>
                                {imageUrl ? (
                                    <div
                                        style={{
                                            width: "150px",
                                            height: "150px",
                                            borderRadius: "50%",
                                            overflow: "hidden",
                                            margin: "0 auto 1rem",
                                            border: "4px solid #15803d",
                                            position: "relative",
                                        }}
                                    >
                                        <Image
                                            src={imageUrl || "/placeholder.svg"}
                                            alt={patient.name}
                                            fill
                                            style={{ objectFit: "cover" }}
                                            unoptimized
                                        />
                                    </div>
                                ) : (
                                    <div
                                        style={{
                                            width: "150px",
                                            height: "150px",
                                            borderRadius: "50%",
                                            backgroundColor: "#15803d",
                                            color: "white",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "3rem",
                                            fontWeight: "bold",
                                            margin: "0 auto 1rem",
                                        }}
                                    >
                                        {patient.name
                                            .split(" ")
                                            .map((n) => n[0])
                                            .slice(0, 2)
                                            .join("")
                                            .toUpperCase()}
                                    </div>
                                )}

                                <h1 style={{ fontSize: "1.75rem", fontWeight: "bold", marginBottom: "0.5rem", color: "#1f2937" }}>
                                    {patient.name}
                                </h1>

                                <p style={{ color: "#15803d", fontWeight: "600", fontSize: "1.125rem", marginBottom: "1rem" }}>
                                    Paciente
                                </p>

                                <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
                                    <Badge
                                        variant={patient.hidden ? "secondary" : "default"}
                                        style={{ backgroundColor: patient.hidden ? "#6b7280" : "#15803d" }}
                                    >
                                        {patient.hidden ? "Inativo" : "Ativo"}
                                    </Badge>
                                    {patient.first_access && (
                                        <Badge variant="outline" style={{ borderColor: "#f59e0b", color: "#f59e0b" }}>
                                            Primeiro Acesso
                                        </Badge>
                                    )}
                                </div>

                                <div
                                    style={{
                                        backgroundColor: "#f0fdf4",
                                        padding: "1rem",
                                        borderRadius: "0.5rem",
                                        marginBottom: "1rem",
                                    }}
                                >
                                    <div style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.25rem" }}>Membro desde</div>
                                    <div style={{ fontSize: "1.125rem", fontWeight: "600", color: "#15803d" }}>
                                        {formatDate(patient.created_at)}
                                    </div>
                                </div>

                                <Button
                                    style={{ backgroundColor: "#15803d", color: "white", width: "100%", marginTop: "1rem" }}
                                    onClick={() => toast.info("Funcionalidade em desenvolvimento")}
                                >
                                    Enviar Mensagem
                                </Button>
                            </CardContent>
                        </Card>

                        <Card style={{ marginTop: "1.5rem" }}>
                            <CardHeader>
                                <CardTitle style={{ color: "#15803d", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <Activity size={20} />
                                    Estatísticas
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div style={{ display: "grid", gap: "1rem" }}>
                                    <div
                                        style={{
                                            padding: "1rem",
                                            backgroundColor: "#f0fdf4",
                                            borderRadius: "0.5rem",
                                            textAlign: "center",
                                        }}
                                    >
                                        <div style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.5rem" }}>
                                            Total de Visitas
                                        </div>
                                        <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#15803d" }}>{patient.visit_count}</div>
                                    </div>

                                    <div
                                        style={{
                                            padding: "1rem",
                                            backgroundColor: "#fef3c7",
                                            borderRadius: "0.5rem",
                                            textAlign: "center",
                                        }}
                                    >
                                        <div style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.5rem" }}>Avaliação</div>
                                        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}>
                                            {renderStars(patient.rating)}
                                            <span style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#f59e0b", marginLeft: "0.5rem" }}>
                                                {patient.rating.toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Details */}
                    <div>
                        {/* Contact Information */}
                        <Card style={{ marginBottom: "1.5rem" }}>
                            <CardHeader>
                                <CardTitle style={{ color: "#15803d", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <User size={20} />
                                    Informações de Contato
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div style={{ display: "grid", gap: "1rem" }}>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "1rem",
                                            padding: "0.75rem",
                                            backgroundColor: "#f9fafb",
                                            borderRadius: "0.5rem",
                                        }}
                                    >
                                        <Mail size={20} style={{ color: "#15803d" }} />
                                        <div>
                                            <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Email</div>
                                            <div style={{ fontWeight: "600", color: "#1f2937" }}>{patient.email}</div>
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "1rem",
                                            padding: "0.75rem",
                                            backgroundColor: "#f9fafb",
                                            borderRadius: "0.5rem",
                                        }}
                                    >
                                        <Phone size={20} style={{ color: "#15803d" }} />
                                        <div>
                                            <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Telefone</div>
                                            <div style={{ fontWeight: "600", color: "#1f2937" }}>{formatPhone(patient.phone)}</div>
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "1rem",
                                            padding: "0.75rem",
                                            backgroundColor: "#f9fafb",
                                            borderRadius: "0.5rem",
                                        }}
                                    >
                                        <MapPin size={20} style={{ color: "#15803d" }} />
                                        <div>
                                            <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Endereço</div>
                                            <div style={{ fontWeight: "600", color: "#1f2937" }}>{patient.address}</div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Personal Information */}
                        <Card style={{ marginBottom: "1.5rem" }}>
                            <CardHeader>
                                <CardTitle style={{ color: "#15803d", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <CreditCard size={20} />
                                    Informações Pessoais
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                    <div
                                        style={{
                                            padding: "1rem",
                                            backgroundColor: "#f9fafb",
                                            borderRadius: "0.5rem",
                                        }}
                                    >
                                        <div style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.25rem" }}>CPF</div>
                                        <div style={{ fontWeight: "600", color: "#1f2937", fontSize: "1.125rem" }}>
                                            {formatCPF(patient.cpf)}
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            padding: "1rem",
                                            backgroundColor: "#f9fafb",
                                            borderRadius: "0.5rem",
                                        }}
                                    >
                                        <div style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.25rem" }}>Função</div>
                                        <div style={{ fontWeight: "600", color: "#1f2937", fontSize: "1.125rem" }}>
                                            {patient.role || "Paciente"}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Account Information */}
                        <Card style={{ marginBottom: "1.5rem" }}>
                            <CardHeader>
                                <CardTitle style={{ color: "#15803d", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <Shield size={20} />
                                    Informações da Conta
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div style={{ display: "grid", gap: "1rem" }}>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "1rem",
                                            padding: "0.75rem",
                                            backgroundColor: "#f9fafb",
                                            borderRadius: "0.5rem",
                                        }}
                                    >
                                        <Calendar size={20} style={{ color: "#15803d" }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Data de Cadastro</div>
                                            <div style={{ fontWeight: "600", color: "#1f2937" }}>{formatDate(patient.created_at)}</div>
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "1rem",
                                            padding: "0.75rem",
                                            backgroundColor: "#f9fafb",
                                            borderRadius: "0.5rem",
                                        }}
                                    >
                                        <Clock size={20} style={{ color: "#15803d" }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Última Atualização</div>
                                            <div style={{ fontWeight: "600", color: "#1f2937" }}>{formatDate(patient.updated_at)}</div>
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "1rem",
                                            padding: "0.75rem",
                                            backgroundColor: patient.first_access ? "#fef3c7" : "#f0fdf4",
                                            borderRadius: "0.5rem",
                                        }}
                                    >
                                        <Shield size={20} style={{ color: patient.first_access ? "#f59e0b" : "#15803d" }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>Status da Conta</div>
                                            <div
                                                style={{
                                                    fontWeight: "600",
                                                    color: patient.first_access ? "#f59e0b" : "#15803d",
                                                }}
                                            >
                                                {patient.first_access ? "Aguardando primeiro acesso" : "Conta ativa"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Reviews Card */}
                        {patient.reviews && patient.reviews.length > 0 && (
                            <Card style={{ marginBottom: "1.5rem" }}>
                                <CardHeader>
                                    <CardTitle style={{ color: "#15803d", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <Star size={20} />
                                        Avaliações dos Enfermeiros ({patient.reviews.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div style={{ display: "grid", gap: "1rem" }}>
                                        {patient.reviews.map((review, index) => (
                                            <div
                                                key={index}
                                                style={{
                                                    padding: "1rem",
                                                    backgroundColor: "#f9fafb",
                                                    borderRadius: "0.5rem",
                                                    border: "1px solid #e5e7eb",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "start",
                                                        marginBottom: "0.75rem",
                                                    }}
                                                >
                                                    <div>
                                                        <div style={{ fontWeight: "600", color: "#1f2937", marginBottom: "0.25rem" }}>
                                                            {review.nurse_name}
                                                        </div>
                                                        {renderStars(review.rating)}
                                                    </div>
                                                </div>
                                                {review.comment && (
                                                    <div style={{ display: "flex", alignItems: "start", gap: "0.5rem" }}>
                                                        <MessageSquare
                                                            size={16}
                                                            style={{ color: "#15803d", marginTop: "0.25rem", flexShrink: 0 }}
                                                        />
                                                        <p style={{ color: "#6b7280", fontSize: "0.875rem", lineHeight: "1.5" }}>
                                                            {review.comment}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                    </div>
                </div>
            </div>
            <Footer />
        </div>
    )
}
