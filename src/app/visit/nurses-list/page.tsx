"use client"

import { useState, useEffect, useRef } from "react"
import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronDown, ChevronUp, Filter, X } from "lucide-react"
import Link from "next/link"

const heroStyle = {
  backgroundImage: `
    linear-gradient(rgba(21, 128, 61, 0.7), rgba(83, 83, 83, 0.8)),
    url('/equipe_enfermeiros.png')
  `,
  backgroundSize: "cover",
  backgroundPosition: "center",
  color: "white",
  padding: "5rem 0",
}

interface Nurse {
  id: string
  name: string
  specialization: string
  years_experience: number
  price: number
  shift: string
  department: string
  image: string
  available: boolean
  location: string
  neighborhood: string
  city: string
  uf: string
  street: string
  max_patients_per_day: number
  days_available: string[] | null
  services: string[] | null
  available_neighborhoods: string[] | null
  rating?: number
}

interface ApiResponse {
  data: Nurse[] | null
  message: string
  success: boolean
}

const DAYS_OF_WEEK = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]

export default function PatientDashboard() {
  const [nurses, setNurses] = useState<Nurse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [selectedAvailableNeighborhoods, setSelectedAvailableNeighborhoods] = useState<string[]>([])
  const [specializationFilter, setSpecializationFilter] = useState("")
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(500)

  const [sortBy, setSortBy] = useState("default")

  const [serviceInput, setServiceInput] = useState("")
  const [neighborhoodInput, setNeighborhoodInput] = useState("")
  const [showServiceSuggestions, setShowServiceSuggestions] = useState(false)
  const [showNeighborhoodSuggestions, setShowNeighborhoodSuggestions] = useState(false)

  const serviceInputRef = useRef<HTMLDivElement>(null)
  const neighborhoodInputRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchNurses = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api/v1"}/user/all_nurses`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        )

        if (!response.ok) {
          throw new Error("Falha ao carregar enfermeiros")
        }

        const data: ApiResponse = await response.json()

        if (data.success) {
          setNurses(data.data || [])
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

  useEffect(() => {
    if (nurses.length > 0) {
      const prices = nurses.map((n) => n.price).filter((p) => p > 0)
      if (prices.length > 0) {
        const min = Math.floor(Math.min(...prices))
        const max = Math.ceil(Math.max(...prices))
        setMinPrice(min)
        setMaxPrice(max)
      }
    }
  }, [nurses])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (serviceInputRef.current && !serviceInputRef.current.contains(event.target as Node)) {
        setShowServiceSuggestions(false)
      }
      if (neighborhoodInputRef.current && !neighborhoodInputRef.current.contains(event.target as Node)) {
        setShowNeighborhoodSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredNurses = nurses.filter((nurse) => {
    const matchesSpecialization =
      !specializationFilter ||
      specializationFilter === "all" ||
      nurse.specialization.toLowerCase() === specializationFilter.toLowerCase()

    const matchesPrice = nurse.price >= minPrice && nurse.price <= maxPrice

    const matchesDays =
      selectedDays.length === 0 ||
      (nurse.days_available && selectedDays.some((day) => nurse.days_available?.includes(day)))

    const matchesServices =
      selectedServices.length === 0 ||
      (nurse.services && selectedServices.some((service) => nurse.services?.includes(service)))

    const matchesAvailableNeighborhoods =
      selectedAvailableNeighborhoods.length === 0 ||
      (nurse.available_neighborhoods &&
        selectedAvailableNeighborhoods.some((neighborhood) => nurse.available_neighborhoods?.includes(neighborhood)))

    return matchesSpecialization && matchesPrice && matchesDays && matchesServices && matchesAvailableNeighborhoods
  })

  const sortedNurses = [...filteredNurses].sort((a, b) => {
    switch (sortBy) {
      case "price-high":
        return b.price - a.price
      case "price-low":
        return a.price - b.price
      case "rating":
        const ratingA = a.rating ?? 0
        const ratingB = b.rating ?? 0
        return ratingB - ratingA
      case "popular":
        return b.years_experience - a.years_experience
      default:
        return 0
    }
  })

  const uniqueSpecializations = Array.from(new Set(nurses.map((nurse) => nurse.specialization))).filter(Boolean)
  const allServices = Array.from(new Set(nurses.flatMap((nurse) => nurse.services || []))).filter(Boolean)
  const allAvailableNeighborhoods = Array.from(
    new Set(nurses.flatMap((nurse) => nurse.available_neighborhoods || [])),
  ).filter(Boolean)

  const filteredServiceSuggestions = allServices.filter(
    (service) => service.toLowerCase().includes(serviceInput.toLowerCase()) && !selectedServices.includes(service),
  )

  const filteredNeighborhoodSuggestions = allAvailableNeighborhoods.filter(
    (neighborhood) =>
      neighborhood.toLowerCase().includes(neighborhoodInput.toLowerCase()) &&
      !selectedAvailableNeighborhoods.includes(neighborhood),
  )

  const clearFilters = () => {
    setSpecializationFilter("")
    setSelectedDays([])
    setSelectedServices([])
    setSelectedAvailableNeighborhoods([])
    setServiceInput("")
    setNeighborhoodInput("")
    setSortBy("default")
    if (nurses.length > 0) {
      const prices = nurses.map((n) => n.price).filter((p) => p > 0)
      if (prices.length > 0) {
        setMinPrice(Math.floor(Math.min(...prices)))
        setMaxPrice(Math.ceil(Math.max(...prices)))
      }
    }
  }

  const toggleDay = (day: string) => {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
  }

  const addService = (service: string) => {
    if (!selectedServices.includes(service)) {
      setSelectedServices((prev) => [...prev, service])
      setServiceInput("")
      setShowServiceSuggestions(false)
    }
  }

  const removeService = (service: string) => {
    setSelectedServices((prev) => prev.filter((s) => s !== service))
  }

  const addNeighborhood = (neighborhood: string) => {
    if (!selectedAvailableNeighborhoods.includes(neighborhood)) {
      setSelectedAvailableNeighborhoods((prev) => [...prev, neighborhood])
      setNeighborhoodInput("")
      setShowNeighborhoodSuggestions(false)
    }
  }

  const removeNeighborhood = (neighborhood: string) => {
    setSelectedAvailableNeighborhoods((prev) => prev.filter((n) => n !== neighborhood))
  }

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
            <p style={{ color: "#6b7280" }}>Carregando enfermeiros...</p>
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

      <section style={heroStyle}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", marginBottom: "1rem" }}>Encontre o Enfermeiro Ideal</h1>
          <p style={{ fontSize: "1.25rem", opacity: 0.9, maxWidth: "600px", margin: "0 auto" }}>
            Conecte-se com profissionais qualificados e experientes para receber o melhor cuidado de saúde
          </p>
        </div>
      </section>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem 1rem" }}>
        <Card style={{ marginBottom: "2rem" }}>
          <CardHeader>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <CardTitle style={{ color: "#15803d" }}>Filtros de Busca</CardTitle>
              <Button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                variant="outline"
                style={{ borderColor: "#15803d", color: "#15803d" }}
              >
                <Filter style={{ width: "16px", height: "16px", marginRight: "0.5rem" }} />
                {showAdvancedFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
                {showAdvancedFilters ? (
                  <ChevronUp style={{ width: "16px", height: "16px", marginLeft: "0.5rem" }} />
                ) : (
                  <ChevronDown style={{ width: "16px", height: "16px", marginLeft: "0.5rem" }} />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showAdvancedFilters && (
              <div
                style={{
                  padding: "1.5rem",
                  backgroundColor: "#f9fafb",
                  borderRadius: "8px",
                  marginBottom: "1rem",
                }}
              >
                <h3 style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "1.5rem", color: "#15803d" }}>
                  Filtros Avançados
                </h3>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "#374151" }}>
                    Especialização
                  </label>
                  <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma especialização" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {uniqueSpecializations.map((spec) => (
                        <SelectItem key={spec} value={spec}>
                          {spec.charAt(0).toUpperCase() + spec.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "#374151" }}>
                    Faixa de Preço
                  </label>
                  <div style={{ padding: "1rem 0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                      <div>
                        <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>Mínimo</span>
                        <div style={{ fontSize: "1.25rem", fontWeight: "600", color: "#15803d" }}>R$ {minPrice}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>Máximo</span>
                        <div style={{ fontSize: "1.25rem", fontWeight: "600", color: "#15803d" }}>R$ {maxPrice}+</div>
                      </div>
                    </div>

                    <div style={{ position: "relative", height: "40px" }}>
                      <input
                        type="range"
                        min="0"
                        max="500"
                        value={minPrice}
                        onChange={(e) => {
                          const value = Number(e.target.value)
                          if (value < maxPrice) {
                            setMinPrice(value)
                          }
                        }}
                        style={{
                          position: "absolute",
                          width: "100%",
                          height: "6px",
                          background: "transparent",
                          pointerEvents: "all",
                          appearance: "none",
                          WebkitAppearance: "none",
                          zIndex: 2,
                        }}
                      />
                      <input
                        type="range"
                        min="0"
                        max="500"
                        value={maxPrice}
                        onChange={(e) => {
                          const value = Number(e.target.value)
                          if (value > minPrice) {
                            setMaxPrice(value)
                          }
                        }}
                        style={{
                          position: "absolute",
                          width: "100%",
                          height: "6px",
                          background: "transparent",
                          pointerEvents: "all",
                          appearance: "none",
                          WebkitAppearance: "none",
                          zIndex: 2,
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          top: "17px",
                          left: "0",
                          right: "0",
                          height: "6px",
                          backgroundColor: "#e5e7eb",
                          borderRadius: "3px",
                          zIndex: 1,
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            left: `${(minPrice / 500) * 100}%`,
                            right: `${100 - (maxPrice / 500) * 100}%`,
                            height: "100%",
                            backgroundColor: "#15803d",
                            borderRadius: "3px",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Days Available */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "#374151" }}>
                    Dias Disponíveis
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {DAYS_OF_WEEK.map((day) => (
                      <label
                        key={day}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          padding: "0.5rem 1rem",
                          backgroundColor: selectedDays.includes(day) ? "#dcfce7" : "white",
                          border: `1px solid ${selectedDays.includes(day) ? "#15803d" : "#d1d5db"}`,
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        <Checkbox checked={selectedDays.includes(day)} onCheckedChange={() => toggleDay(day)} />
                        <span style={{ fontSize: "0.875rem" }}>{day}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Services */}
                {allServices.length > 0 && (
                  <div style={{ marginBottom: "1.5rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "#374151" }}>
                      Serviços Oferecidos
                    </label>

                    {selectedServices.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        {selectedServices.map((service) => (
                          <Badge
                            key={service}
                            style={{
                              backgroundColor: "#dcfce7",
                              color: "#15803d",
                              padding: "0.5rem 0.75rem",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            {service}
                            <X
                              style={{ width: "14px", height: "14px", cursor: "pointer" }}
                              onClick={() => removeService(service)}
                            />
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div ref={serviceInputRef} style={{ position: "relative" }}>
                      <Input
                        placeholder="Digite para buscar serviços..."
                        value={serviceInput}
                        onChange={(e) => {
                          setServiceInput(e.target.value)
                          setShowServiceSuggestions(true)
                        }}
                        onFocus={() => setShowServiceSuggestions(true)}
                      />

                      {showServiceSuggestions && filteredServiceSuggestions.length > 0 && (
                        <div
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            backgroundColor: "white",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            marginTop: "0.25rem",
                            maxHeight: "200px",
                            overflowY: "auto",
                            zIndex: 10,
                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                          }}
                        >
                          {filteredServiceSuggestions.map((service) => (
                            <div
                              key={service}
                              onClick={() => addService(service)}
                              style={{
                                padding: "0.75rem 1rem",
                                cursor: "pointer",
                                borderBottom: "1px solid #f3f4f6",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                            >
                              {service}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Neighborhoods */}
                {allAvailableNeighborhoods.length > 0 && (
                  <div style={{ marginBottom: "1.5rem" }}>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "#374151" }}>
                      Bairros Atendidos
                    </label>

                    {selectedAvailableNeighborhoods.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        {selectedAvailableNeighborhoods.map((neighborhood) => (
                          <Badge
                            key={neighborhood}
                            style={{
                              backgroundColor: "#dcfce7",
                              color: "#15803d",
                              padding: "0.5rem 0.75rem",
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            {neighborhood}
                            <X
                              style={{ width: "14px", height: "14px", cursor: "pointer" }}
                              onClick={() => removeNeighborhood(neighborhood)}
                            />
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div ref={neighborhoodInputRef} style={{ position: "relative" }}>
                      <Input
                        placeholder="Digite para buscar bairros..."
                        value={neighborhoodInput}
                        onChange={(e) => {
                          setNeighborhoodInput(e.target.value)
                          setShowNeighborhoodSuggestions(true)
                        }}
                        onFocus={() => setShowNeighborhoodSuggestions(true)}
                      />

                      {showNeighborhoodSuggestions && filteredNeighborhoodSuggestions.length > 0 && (
                        <div
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            backgroundColor: "white",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            marginTop: "0.25rem",
                            maxHeight: "200px",
                            overflowY: "auto",
                            zIndex: 10,
                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                          }}
                        >
                          {filteredNeighborhoodSuggestions.map((neighborhood) => (
                            <div
                              key={neighborhood}
                              onClick={() => addNeighborhood(neighborhood)}
                              style={{
                                padding: "0.75rem 1rem",
                                cursor: "pointer",
                                borderBottom: "1px solid #f3f4f6",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                            >
                              {neighborhood}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Button onClick={clearFilters} variant="outline" style={{ borderColor: "#15803d", color: "#15803d" }}>
                  Limpar Todos os Filtros
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#15803d" }}>
            {sortedNurses.length} Enfermeiros Encontrados
          </h2>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>Ordenar por:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger style={{ width: "200px" }}>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Padrão</SelectItem>
                <SelectItem value="price-high">Maior Preço</SelectItem>
                <SelectItem value="price-low">Menor Preço</SelectItem>
                <SelectItem value="popular">Mais Populares</SelectItem>
                <SelectItem value="rating">Melhor Avaliação</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Nurses Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1.5rem" }}>
          {sortedNurses.map((nurse) => (
            <Card
              key={nurse.id}
              style={{ transition: "transform 0.2s", cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <CardContent style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                  <img
                    src={
                      nurse.image
                        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/file/${nurse.image}`
                        : "/nurse-professional.jpg"
                    }
                    alt={nurse.name}
                    style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover" }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#1f2937" }}>{nurse.name}</h3>
                      <Badge
                        variant={nurse.available ? "default" : "secondary"}
                        style={{ backgroundColor: nurse.available ? "#15803d" : "#6b7280" }}
                      >
                        {nurse.available ? "Disponível" : "Indisponível"}
                      </Badge>
                    </div>
                    <p style={{ color: "#15803d", fontWeight: "600", marginBottom: "0.25rem" }}>
                      {nurse.specialization.charAt(0).toUpperCase() + nurse.specialization.slice(1)}
                    </p>
                    <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>{nurse.department}</p>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.5rem",
                    marginBottom: "1rem",
                    fontSize: "0.875rem",
                  }}
                >
                  <div>
                    <span style={{ color: "#6b7280" }}>Experiência:</span>
                    <span style={{ marginLeft: "0.25rem", fontWeight: "600" }}>{nurse.years_experience} anos</span>
                  </div>
                  {nurse.shift && (
                    <div>
                      <span style={{ color: "#6b7280" }}>Turno:</span>
                      <span style={{ marginLeft: "0.25rem", fontWeight: "600" }}>
                        {nurse.shift.charAt(0).toUpperCase() + nurse.shift.slice(1)}
                      </span>
                    </div>
                  )}
                  <div style={{ gridColumn: "1 / -1" }}>
                    <span style={{ color: "#6b7280" }}>Localização:</span>
                    <span style={{ marginLeft: "0.25rem", fontWeight: "600" }}>
                      {nurse.neighborhood}, {nurse.city} - {nurse.uf?.toUpperCase()}
                    </span>
                  </div>
                  {nurse.days_available && nurse.days_available.length > 0 && (
                    <div style={{ gridColumn: "1 / -1" }}>
                      <span style={{ color: "#6b7280" }}>Dias:</span>
                      <span style={{ marginLeft: "0.25rem", fontWeight: "600" }}>
                        {nurse.days_available.join(", ")}
                      </span>
                    </div>
                  )}
                  {nurse.services && nurse.services.length > 0 && (
                    <div style={{ gridColumn: "1 / -1" }}>
                      <span style={{ color: "#6b7280" }}>Serviços:</span>
                      <span style={{ marginLeft: "0.25rem", fontWeight: "600" }}>{nurse.services.join(", ")}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#15803d" }}>R$ {nurse.price}</span>
                    <span style={{ color: "#6b7280", fontSize: "0.875rem" }}>/hora</span>
                  </div>

                  <Link href={`/visit/nurses-list/${nurse.id}`}>
                    <Button
                      style={{
                        backgroundColor: nurse.available ? "#15803d" : "#6b7280",
                        color: "white",
                      }}
                      disabled={!nurse.available}
                    >
                      {nurse.available ? "Ver Perfil" : "Indisponível"}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {sortedNurses.length === 0 && !loading && (
          <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>
            <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>Nenhum enfermeiro encontrado</h3>
            <p>Tente ajustar os filtros para encontrar mais opções.</p>
          </div>
        )}
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
        
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
        }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #15803d;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #15803d;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  )
}
