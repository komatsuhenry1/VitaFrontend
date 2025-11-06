"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Footer } from "@/components/Footer"

interface NurseData {
    id: string
    name: string
    specialization: string
    experience: number
    rating: number
    price: number
    shift: string
    department: string
    image: string
    online: boolean
    neighborhood: string
    bio: string
    qualifications: string[]
    services: string[]
    reviews: Array<{
        patient_name: string
        rating: number
        comment: string
    }>
    days_available: string[] | null
    start_time: string | null
    end_time: string | null
}

interface ApiResponse {
    data: NurseData
    message: string
    success: boolean
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api/v1"

export default function ImmediateConsultationNurseProfile() {
    const params = useParams()
    const router = useRouter()
    const nurseId = params.id as string

    const [nurse, setNurse] = useState<NurseData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchNurseData = async () => {
            try {
                setLoading(true)
                const response = await fetch(`${API_BASE_URL}/user/nurse/${nurseId}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
                    },
                })

                const result: ApiResponse = await response.json()

                if (!response.ok) {
                    console.error("Erro ao buscar dados do enfermeiro (resposta do backend):", result)
                    throw new Error(result.message || "Erro ao buscar dados do enfermeiro.")
                }

                if (result.success && result.data) {
                    setNurse(result.data)
                } else {
                    throw new Error(result.message || "Erro ao carregar dados do enfermeiro")
                }
            } catch (err) {
                console.error("Erro no fetchNurseData:", err)
                setError(err instanceof Error ? err.message : "Erro desconhecido")
            } finally {
                setLoading(false)
            }
        }

        if (nurseId) {
            fetchNurseData()
        }
    }, [nurseId])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="flex justify-center items-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="w-10 h-10 border-4 border-gray-200 border-t-green-700 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Carregando perfil do enfermeiro...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (error || !nurse) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="max-w-4xl mx-auto px-4 py-8 text-center">
                    <h1 className="text-red-600 mb-4">{error || "Enfermeiro não encontrado"}</h1>
                    <Button onClick={() => router.back()}>Voltar</Button>
                </div>
            </div>
        )
    }

    const imageUrl = nurse?.image ? `${API_BASE_URL}/user/file/${nurse.image}` : "/placeholder-avatar.png"

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="max-w-5xl mx-auto px-4 py-8">
                <div className="grid md:grid-cols-3 gap-6">
                    {/* Left Column - Nurse Info */}
                    <div className="md:col-span-1">
                        <Card className="mb-6">
                            <CardContent className="p-6 text-center">
                                <div className="relative w-36 h-36 rounded-full overflow-hidden mx-auto mb-4">
                                    <Image src={imageUrl || "/placeholder.svg"} alt={nurse.name} fill className="object-cover" />
                                </div>
                                <h1 className="text-2xl font-bold mb-2 text-gray-900">{nurse.name}</h1>
                                <p className="text-green-700 font-semibold text-lg mb-2">{nurse.specialization}</p>
                                <p className="text-gray-600 mb-4">{nurse.department}</p>

                                <div className="flex justify-center gap-4 mb-4">
                                    <Badge
                                        variant={nurse.online ? "default" : "secondary"}
                                        className={nurse.online ? "bg-green-700" : "bg-gray-500"}
                                    >
                                        {nurse.online ? "Online Agora" : "Offline"}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-700">{nurse.experience}</div>
                                        <div className="text-sm text-gray-600">Anos de experiência</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-700">
                                            ⭐ {nurse.rating > 0 ? nurse.rating.toFixed(1) : "N/A"}
                                        </div>
                                        <div className="text-sm text-gray-600">Avaliação</div>
                                    </div>
                                </div>

                                <div className="text-3xl font-bold text-green-700 mb-1">
                                    {nurse.price > 0 ? `R$ ${nurse.price}/hora` : "Preço a combinar"}
                                </div>
                                <p className="text-gray-600 text-sm mb-6">📍 {nurse.neighborhood}</p>

                                <Button
                                    onClick={() => router.push(`/nurse-profile/online/${nurseId}/checkout`)}
                                    disabled={!nurse.online}
                                    className={`w-full ${nurse.online ? "bg-green-700 hover:bg-green-800" : "bg-gray-400 cursor-not-allowed"}`}
                                >
                                    {nurse.online ? "Solicitar Consulta Imediata" : "Enfermeiro Indisponível"}
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-green-700">Disponibilidade</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {nurse.days_available && nurse.days_available.length > 0 && nurse.start_time && nurse.end_time ? (
                                    <>
                                        <div className="mb-4">
                                            <span className="font-semibold block mb-1">Horário:</span>
                                            <span className="text-gray-600">{`${nurse.start_time} - ${nurse.end_time}`}</span>
                                        </div>
                                        <div>
                                            <span className="font-semibold block mb-2">Dias da Semana:</span>
                                            <div className="flex flex-wrap gap-2">
                                                {nurse.days_available.map((day) => (
                                                    <Badge key={day} variant="outline" className="border-green-700 text-green-700">
                                                        {day}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-gray-600 text-center">Disponibilidade não informada</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Details */}
                    <div className="md:col-span-2">
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle className="text-green-700">Sobre</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="leading-relaxed text-gray-700">
                                    {nurse.bio || "Informações sobre o profissional não disponíveis."}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle className="text-green-700">Qualificações</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {nurse.qualifications && nurse.qualifications.length > 0 ? (
                                    <ul className="space-y-2">
                                        {nurse.qualifications.map((qualification, index) => (
                                            <li key={index} className="flex items-start">
                                                <span className="text-green-700 mr-2">✓</span>
                                                <span>{qualification}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-600 text-center">Qualificações não informadas</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle className="text-green-700">Serviços Oferecidos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {nurse.services && nurse.services.length > 0 ? (
                                    <ul className="space-y-2">
                                        {nurse.services.map((service, index) => (
                                            <li key={index} className="flex items-start">
                                                <span className="text-green-700 mr-2">•</span>
                                                <span>{service}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-gray-600 text-center">Serviços não informados</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-green-700">Avaliações dos Pacientes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {nurse.reviews && nurse.reviews.length > 0 ? (
                                    <div className="space-y-4">
                                        {nurse.reviews.map((review, index) => (
                                            <div key={index} className="pb-4 border-b last:border-b-0">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-semibold">{review.patient_name}</span>
                                                    <span className="text-green-700">{`⭐`.repeat(Math.floor(review.rating))}</span>
                                                </div>
                                                <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-600 text-center">Nenhuma avaliação disponível</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    )
}
