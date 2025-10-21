"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, Camera, CheckCircle, XCircle, Shield, Heart } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import Image from "next/image"

const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validateCPF = (cpf: string) => {
  const cleanCPF = cpf.replace(/\D/g, "")
  if (cleanCPF.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += Number.parseInt(cleanCPF.charAt(i)) * (10 - i)
  }
  let checkDigit = 11 - (sum % 11)
  if (checkDigit >= 10) checkDigit = 0
  if (checkDigit !== Number.parseInt(cleanCPF.charAt(9))) return false
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += Number.parseInt(cleanCPF.charAt(i)) * (11 - i)
  }
  checkDigit = 11 - (sum % 11)
  if (checkDigit >= 10) checkDigit = 0
  if (checkDigit !== Number.parseInt(cleanCPF.charAt(10))) return false
  return true
}

const validatePassword = (password: string) => {
  const hasMinLength = password.length >= 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  return {
    isValid: hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar,
    hasMinLength,
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    hasSpecialChar,
  }
}

const formatPhone = (value: string) => {
  const cleaned = value.replace(/\D/g, "")
  if (cleaned.length <= 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3")
  }
  return cleaned.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3")
}

const formatCPF = (value: string) => {
  const cleaned = value.replace(/\D/g, "")
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, "$1.$2.$3-$4")
}

const formatCEP = (value: string) => {
  const cleaned = value.replace(/\D/g, "")
  return cleaned.replace(/(\d{5})(\d{0,3})/, "$1-$2")
}

const DocumentInput = ({
  field,
  label,
  file,
  preview,
  onFileChange,
  onOpenCamera,
}: {
  field: string
  label: string
  file: File | null
  preview: string | null
  onFileChange: (field: string, file: File | null) => void
  onOpenCamera: (field: string) => void
}) => (
  <div className="space-y-2">
    <Label htmlFor={field}>{label}</Label>
    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
      {preview ? (
        <div className="space-y-3">
          <div className="relative w-32 h-32 mx-auto rounded-lg overflow-hidden border-2 border-primary">
            <Image src={preview || "/placeholder.svg"} alt="Preview" fill className="object-cover" />
          </div>
          <p className="text-sm font-medium text-green-600">Imagem carregada: {file?.name}</p>
          <div className="flex justify-center gap-2">
            <input
              type="file"
              id={`${field}-change`}
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => onFileChange(field, e.target.files?.[0] || null)}
              className="hidden"
            />
            <label htmlFor={`${field}-change`}>
              <Button type="button" variant="outline" size="sm" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Alterar
                </span>
              </Button>
            </label>
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenCamera(field)}>
              <Camera className="h-4 w-4 mr-2" />
              Nova Foto
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-center items-center gap-4">
            <input
              type="file"
              id={field}
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => onFileChange(field, e.target.files?.[0] || null)}
              className="hidden"
              required={!file}
            />
            <label
              htmlFor={field}
              className="cursor-pointer flex flex-col items-center gap-2 p-2 rounded-md hover:bg-muted"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm font-medium">Enviar Arquivo</span>
            </label>
            <button
              type="button"
              onClick={() => onOpenCamera(field)}
              className="cursor-pointer flex flex-col items-center gap-2 p-2 rounded-md hover:bg-muted"
            >
              <Camera className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm font-medium">Tirar Foto</span>
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">PDF, JPG, PNG até 5MB</p>
        </>
      )}
    </div>
  </div>
)

const heroStyle = {
  backgroundImage: `
    linear-gradient(rgba(21, 128, 61, 0.7), rgba(83, 83, 83, 0.8)),
    url('/sobre_imagem.png')
  `,
  backgroundSize: "cover",
  backgroundPosition: "center",
  color: "white",
  padding: "5rem 0",
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    uf: "",
    cpf: "",
    password: "",
    coren: "",
    specialization: "",
    department: "",
    years_experience: "",
    qualifications: null as File | null,
    general_register: null as File | null,
    residence_comprovant: null as File | null,
    license_document: null as File | null,
    profile_image: null as File | null,
  })

  const [validationErrors, setValidationErrors] = useState({
    email: "",
    cpf: "",
    password: "",
    phone: "",
    coren: "",
    cep: "",
  })

  const [previews, setPreviews] = useState({
    qualifications: null as string | null,
    general_register: null as string | null,
    residence_comprovant: null as string | null,
    license_document: null as string | null,
    profile_image: null as string | null,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [capturingField, setCapturingField] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // MUDANÇA: Função para iniciar a câmera
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      console.error("Erro ao acessar a câmera:", err)
      toast.error("Não foi possível acessar a câmera.", {
        description: "Por favor, verifique as permissões da câmera no seu navegador.",
      })
      setIsCameraOpen(false)
    }
  }

  // MUDANÇA: Função para parar a câmera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }

  // MUDANÇA: Efeito para ligar/desligar a câmera quando o modal abre/fecha
  useEffect(() => {
    if (isCameraOpen) {
      startCamera()
    } else {
      stopCamera()
    }

    // Função de limpeza para garantir que a câmera pare se o componente for desmontado
    return () => {
      stopCamera()
    }
  }, [isCameraOpen])

  // MUDANÇA: Função que é chamada pelos botões "Tirar Foto"
  const handleOpenCamera = (field: string) => {
    setCapturingField(field)
    setIsCameraOpen(true)
  }

  // MUDANÇA: Função para capturar a imagem do vídeo
  const handleCapture = () => {
    if (videoRef.current && canvasRef.current && capturingField) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const context = canvas.getContext("2d")
      if (context) {
        context.translate(canvas.width, 0)
        context.scale(-1, 1)
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Converte o canvas para um Blob, depois para um File
        canvas.toBlob((blob) => {
          if (blob) {
            const fileName = `${capturingField}_${Date.now()}.jpg`
            const file = new File([blob], fileName, { type: "image/jpeg" })
            handleFileChange(capturingField, file) // Reutiliza sua função existente!
            setIsCameraOpen(false) // Fecha o modal após a captura
          }
        }, "image/jpeg")
      }
    }
  }

  const handleInputChange = (field: string, value: string) => {
    let formattedValue = value

    if (field === "phone") {
      formattedValue = formatPhone(value)
    } else if (field === "cpf") {
      formattedValue = formatCPF(value)
    } else if (field === "cep") {
      formattedValue = formatCEP(value)
    }

    setFormData((prev) => ({ ...prev, [field]: formattedValue }))

    if (field === "email" && value) {
      setValidationErrors((prev) => ({
        ...prev,
        email: validateEmail(value) ? "" : "Email inválido",
      }))
    } else if (field === "cpf" && value.replace(/\D/g, "").length === 11) {
      setValidationErrors((prev) => ({
        ...prev,
        cpf: validateCPF(value) ? "" : "CPF inválido",
      }))
    } else if (field === "phone" && value) {
      const cleaned = value.replace(/\D/g, "")
      setValidationErrors((prev) => ({
        ...prev,
        phone: cleaned.length >= 10 ? "" : "Telefone incompleto",
      }))
    } else if (field === "coren" && value) {
      const corenRegex = /^COREN-[A-Z]{2}\s?\d{4,6}$/i
      setValidationErrors((prev) => ({
        ...prev,
        coren: corenRegex.test(value) ? "" : "Formato: COREN-UF 123456",
      }))
    } else if (field === "cep" && value) {
      const cleaned = value.replace(/\D/g, "")
      setValidationErrors((prev) => ({
        ...prev,
        cep: cleaned.length === 8 ? "" : "CEP deve ter 8 dígitos",
      }))
    }
  }

  const handleFileChange = (field: string, file: File | null) => {
    setFormData((prev) => ({ ...prev, [field]: file }))

    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviews((prev) => ({ ...prev, [field]: reader.result as string }))
      }
      reader.readAsDataURL(file)
    } else if (!file) {
      setPreviews((prev) => ({ ...prev, [field]: null }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const emailValid = validateEmail(formData.email)
    const cpfValid = validateCPF(formData.cpf)
    const passwordValidation = validatePassword(formData.password)
    const phoneValid = formData.phone.replace(/\D/g, "").length >= 10
    const corenRegex = /^COREN-[A-Z]{2}\s?\d{4,6}$/i
    const corenValid = corenRegex.test(formData.coren)
    const cepValid = formData.cep.replace(/\D/g, "").length === 8

    if (!emailValid || !cpfValid || !passwordValidation.isValid || !phoneValid || !corenValid || !cepValid) {
      setValidationErrors({
        email: emailValid ? "" : "Email inválido",
        cpf: cpfValid ? "" : "CPF inválido",
        password: passwordValidation.isValid ? "" : "Senha não atende aos requisitos",
        phone: phoneValid ? "" : "Telefone incompleto",
        coren: corenValid ? "" : "Formato: COREN-UF 123456",
        cep: cepValid ? "" : "CEP deve ter 8 dígitos",
      })
      toast.error("Por favor, corrija os erros no formulário")
      return
    }

    setIsSubmitting(true)

    const formDataToSend = new FormData()

    formDataToSend.append("name", formData.name)
    formDataToSend.append("email", formData.email)
    formDataToSend.append("phone", formData.phone.replace(/\D/g, ""))
    formDataToSend.append("cep", formData.cep.replace(/\D/g, ""))
    formDataToSend.append("street", formData.street)
    formDataToSend.append("number", formData.number)
    formDataToSend.append("complement", formData.complement)
    formDataToSend.append("neighborhood", formData.neighborhood)
    formDataToSend.append("city", formData.city)
    formDataToSend.append("uf", formData.uf)
    formDataToSend.append("cpf", formData.cpf.replace(/\D/g, ""))
    formDataToSend.append("password", formData.password)
    formDataToSend.append("coren", formData.coren)
    formDataToSend.append("specialization", formData.specialization)
    formDataToSend.append("department", formData.department)
    formDataToSend.append("years_experience", formData.years_experience)

    if (formData.qualifications) formDataToSend.append("qualifications", formData.qualifications)
    if (formData.general_register) formDataToSend.append("general_register", formData.general_register)
    if (formData.residence_comprovant) formDataToSend.append("residence_comprovant", formData.residence_comprovant)
    if (formData.license_document) formDataToSend.append("license_document", formData.license_document)
    if (formData.profile_image) formDataToSend.append("profile_image", formData.profile_image)

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
      const registerUrl = `${API_BASE_URL}/auth/nurse`
      const response = await fetch(registerUrl, {
        method: "POST",
        body: formDataToSend,
      })

      if (response.ok) {
        toast.success("Cadastro solicitado com sucesso!", {
          description: "Você receberá um email quando seu cadastro for aprovado.",
        })
      } else {
        const errorData = await response.json()
        toast.error("Erro ao cadastrar", {
          description: errorData.message || "Tente novamente mais tarde.",
        })
      }
    } catch (error) {
      console.error("Erro de rede ou na requisição:", error)
      toast.error("Não foi possível conectar ao servidor", {
        description: "Verifique sua conexão e tente novamente.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const passwordValidation = validatePassword(formData.password)

  return (
    <>
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm mx-4 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Processando seu cadastro...</h3>
            <p className="text-sm text-gray-600">Estamos enviando seus documentos. Isso pode levar alguns minutos.</p>
          </div>
        </div>
      )}

      <Header />

      <section style={heroStyle}>
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-4 text-sm font-medium">
            Junte-se à Nossa Equipe
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 text-balance">Cadastro de Enfermeiro</h1>
          <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto text-pretty">
            Faça parte da maior plataforma de cuidados domiciliares do Brasil. Conecte-se com pacientes que precisam do
            seu cuidado profissional.
          </p>
        </div>
      </section>

      <section className="py-12 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Flexibilidade Total</h3>
              <p className="text-sm text-muted-foreground">Escolha seus horários e locais de trabalho</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Segurança Garantida</h3>
              <p className="text-sm text-muted-foreground">Plataforma segura com verificação rigorosa</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Renda Extra</h3>
              <p className="text-sm text-muted-foreground">Aumente sua renda com trabalhos adicionais</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-center">Cadastro Completo</CardTitle>
                <CardDescription className="text-center">
                  Preencha todos os campos para completar seu cadastro como enfermeiro
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Informações Pessoais</h3>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo *</Label>
                        <Input
                          id="name"
                          placeholder="Seu nome completo"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <div className="relative">
                          <Input
                            id="email"
                            type="email"
                            placeholder="seu@email.com"
                            value={formData.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            className={
                              validationErrors.email
                                ? "border-red-500"
                                : formData.email && !validationErrors.email
                                  ? "border-green-500"
                                  : ""
                            }
                            required
                          />
                          {formData.email && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {validationErrors.email ? (
                                <XCircle className="h-5 w-5 text-red-500" />
                              ) : (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              )}
                            </div>
                          )}
                        </div>
                        {validationErrors.email && <p className="text-xs text-red-500">{validationErrors.email}</p>}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone *</Label>
                        <div className="relative">
                          <Input
                            id="phone"
                            placeholder="(11) 99999-9999"
                            value={formData.phone}
                            onChange={(e) => handleInputChange("phone", e.target.value)}
                            className={
                              validationErrors.phone
                                ? "border-red-500"
                                : formData.phone.replace(/\D/g, "").length >= 10
                                  ? "border-green-500"
                                  : ""
                            }
                            maxLength={15}
                            required
                          />
                          {formData.phone && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {validationErrors.phone ? (
                                <XCircle className="h-5 w-5 text-red-500" />
                              ) : formData.phone.replace(/\D/g, "").length >= 10 ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : null}
                            </div>
                          )}
                        </div>
                        {validationErrors.phone && <p className="text-xs text-red-500">{validationErrors.phone}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cpf">CPF *</Label>
                        <div className="relative">
                          <Input
                            id="cpf"
                            placeholder="000.000.000-00"
                            value={formData.cpf}
                            onChange={(e) => handleInputChange("cpf", e.target.value)}
                            className={
                              validationErrors.cpf
                                ? "border-red-500"
                                : formData.cpf.replace(/\D/g, "").length === 11 && !validationErrors.cpf
                                  ? "border-green-500"
                                  : ""
                            }
                            maxLength={14}
                            required
                          />
                          {formData.cpf.replace(/\D/g, "").length === 11 && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {validationErrors.cpf ? (
                                <XCircle className="h-5 w-5 text-red-500" />
                              ) : (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              )}
                            </div>
                          )}
                        </div>
                        {validationErrors.cpf && <p className="text-xs text-red-500">{validationErrors.cpf}</p>}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-md font-semibold">Endereço</h4>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="cep">CEP *</Label>
                          <div className="relative">
                            <Input
                              id="cep"
                              placeholder="00000-000"
                              value={formData.cep}
                              onChange={(e) => handleInputChange("cep", e.target.value)}
                              className={
                                validationErrors.cep
                                  ? "border-red-500"
                                  : formData.cep.replace(/\D/g, "").length === 8
                                    ? "border-green-500"
                                    : ""
                              }
                              maxLength={9}
                              required
                            />
                            {formData.cep.replace(/\D/g, "").length === 8 && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                {validationErrors.cep ? (
                                  <XCircle className="h-5 w-5 text-red-500" />
                                ) : (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                )}
                              </div>
                            )}
                          </div>
                          {validationErrors.cep && <p className="text-xs text-red-500">{validationErrors.cep}</p>}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="street">Rua *</Label>
                          <Input
                            id="street"
                            placeholder="Nome da rua"
                            value={formData.street}
                            onChange={(e) => handleInputChange("street", e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="number">Número *</Label>
                          <Input
                            id="number"
                            placeholder="123"
                            value={formData.number}
                            onChange={(e) => handleInputChange("number", e.target.value)}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="complement">Complemento</Label>
                          <Input
                            id="complement"
                            placeholder="Apto, bloco, etc."
                            value={formData.complement}
                            onChange={(e) => handleInputChange("complement", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="neighborhood">Bairro *</Label>
                          <Select onValueChange={(value) => handleInputChange("neighborhood", value)} required>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="centro">Centro</SelectItem>
                              <SelectItem value="tatuape">Tatuapé</SelectItem>
                              <SelectItem value="mooca">Mooca</SelectItem>
                              <SelectItem value="vila mariana">Vila Mariana</SelectItem>
                              <SelectItem value="pinheiros">Pinheiros</SelectItem>
                              <SelectItem value="itaim bibi">Itaim Bibi</SelectItem>
                              <SelectItem value="jardins">Jardins</SelectItem>
                              <SelectItem value="moema">Moema</SelectItem>
                              <SelectItem value="santana">Santana</SelectItem>
                              <SelectItem value="ipiranga">Ipiranga</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="city">Cidade *</Label>
                          <Select onValueChange={(value) => handleInputChange("city", value)} required>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="São Paulo">São Paulo</SelectItem>
                              <SelectItem value="Rio de Janeiro">Rio de Janeiro</SelectItem>
                              <SelectItem value="Belo Horizonte">Belo Horizonte</SelectItem>
                              <SelectItem value="Brasília">Brasília</SelectItem>
                              <SelectItem value="Curitiba">Curitiba</SelectItem>
                              <SelectItem value="Porto Alegre">Porto Alegre</SelectItem>
                              <SelectItem value="Salvador">Salvador</SelectItem>
                              <SelectItem value="Fortaleza">Fortaleza</SelectItem>
                              <SelectItem value="Recife">Recife</SelectItem>
                              <SelectItem value="Manaus">Manaus</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="uf">Estado *</Label>
                          <Select onValueChange={(value) => handleInputChange("uf", value)} required>
                            <SelectTrigger>
                              <SelectValue placeholder="UF" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sp">SP</SelectItem>
                              <SelectItem value="rj">RJ</SelectItem>
                              <SelectItem value="mg">MG</SelectItem>
                              <SelectItem value="df">DF</SelectItem>
                              <SelectItem value="pr">PR</SelectItem>
                              <SelectItem value="rs">RS</SelectItem>
                              <SelectItem value="ba">BA</SelectItem>
                              <SelectItem value="ce">CE</SelectItem>
                              <SelectItem value="pe">PE</SelectItem>
                              <SelectItem value="am">AM</SelectItem>
                              <SelectItem value="sc">SC</SelectItem>
                              <SelectItem value="go">GO</SelectItem>
                              <SelectItem value="es">ES</SelectItem>
                              <SelectItem value="pa">PA</SelectItem>
                              <SelectItem value="ma">MA</SelectItem>
                              <SelectItem value="pb">PB</SelectItem>
                              <SelectItem value="rn">RN</SelectItem>
                              <SelectItem value="al">AL</SelectItem>
                              <SelectItem value="se">SE</SelectItem>
                              <SelectItem value="mt">MT</SelectItem>
                              <SelectItem value="ms">MS</SelectItem>
                              <SelectItem value="ro">RO</SelectItem>
                              <SelectItem value="ac">AC</SelectItem>
                              <SelectItem value="ap">AP</SelectItem>
                              <SelectItem value="rr">RR</SelectItem>
                              <SelectItem value="to">TO</SelectItem>
                              <SelectItem value="pi">PI</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="password">Senha *</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Mínimo 8 caracteres"
                          value={formData.password}
                          onChange={(e) => handleInputChange("password", e.target.value)}
                          className={
                            formData.password && !passwordValidation.isValid
                              ? "border-red-500"
                              : formData.password && passwordValidation.isValid
                                ? "border-green-500"
                                : ""
                          }
                          required
                          minLength={8}
                        />
                        {formData.password && (
                          <div className="text-xs space-y-1 mt-2">
                            <div
                              className={`flex items-center gap-2 ${passwordValidation.hasMinLength ? "text-green-600" : "text-gray-500"}`}
                            >
                              {passwordValidation.hasMinLength ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : (
                                <XCircle className="h-3 w-3" />
                              )}
                              Mínimo 8 caracteres
                            </div>
                            <div
                              className={`flex items-center gap-2 ${passwordValidation.hasUpperCase ? "text-green-600" : "text-gray-500"}`}
                            >
                              {passwordValidation.hasUpperCase ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : (
                                <XCircle className="h-3 w-3" />
                              )}
                              Uma letra maiúscula
                            </div>
                            <div
                              className={`flex items-center gap-2 ${passwordValidation.hasLowerCase ? "text-green-600" : "text-gray-500"}`}
                            >
                              {passwordValidation.hasLowerCase ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : (
                                <XCircle className="h-3 w-3" />
                              )}
                              Uma letra minúscula
                            </div>
                            <div
                              className={`flex items-center gap-2 ${passwordValidation.hasNumber ? "text-green-600" : "text-gray-500"}`}
                            >
                              {passwordValidation.hasNumber ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : (
                                <XCircle className="h-3 w-3" />
                              )}
                              Um número
                            </div>
                            <div
                              className={`flex items-center gap-2 ${passwordValidation.hasSpecialChar ? "text-green-600" : "text-gray-500"}`}
                            >
                              {passwordValidation.hasSpecialChar ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : (
                                <XCircle className="h-3 w-3" />
                              )}
                              Um caractere especial
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="coren">Número COREN *</Label>
                        <div className="relative">
                          <Input
                            id="coren"
                            placeholder="Ex: COREN-SP 123456"
                            value={formData.coren}
                            onChange={(e) => handleInputChange("coren", e.target.value)}
                            className={
                              validationErrors.coren
                                ? "border-red-500"
                                : formData.coren && !validationErrors.coren
                                  ? "border-green-500"
                                  : ""
                            }
                            required
                          />
                          {formData.coren && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {validationErrors.coren ? (
                                <XCircle className="h-5 w-5 text-red-500" />
                              ) : (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              )}
                            </div>
                          )}
                        </div>
                        {validationErrors.coren && <p className="text-xs text-red-500">{validationErrors.coren}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">Informações Profissionais</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="specialization">Especialização *</Label>
                        <Select onValueChange={(value) => handleInputChange("specialization", value)} required>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione sua especialização" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pediatria">Pediatria</SelectItem>
                            <SelectItem value="Geriatria">Geriatria</SelectItem>
                            <SelectItem value="UTI/Terapia Intensiva">UTI/Terapia Intensiva</SelectItem>
                            <SelectItem value="Cardiologia">Cardiologia</SelectItem>
                            <SelectItem value="Oncologia">Oncologia</SelectItem>
                            <SelectItem value="Obstetrícia">Obstetrícia</SelectItem>
                            <SelectItem value="Emergência">Emergência</SelectItem>
                            <SelectItem value="Domiciliar">Domiciliar</SelectItem>
                            <SelectItem value="Psiquiatria">Psiquiatria</SelectItem>
                            <SelectItem value="Nefrologia">Nefrologia</SelectItem>
                            <SelectItem value="Ortopedia">Ortopedia</SelectItem>
                            <SelectItem value="Neurologia">Neurologia</SelectItem>
                            <SelectItem value="Clínica Médica">Clínica Médica</SelectItem>
                            <SelectItem value="Cirurgia">Cirurgia</SelectItem>
                            <SelectItem value="Saúde Mental">Saúde Mental</SelectItem>
                            <SelectItem value="Outra">Outra</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {/* Alteração aqui */}
                    <div className="space-y-2">
                      <Label htmlFor="department">Departamento/Área de Atuação *</Label>
                      <Select onValueChange={(value) => handleInputChange("department", value)} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a área de atuação" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Unidade de Terapia Intensiva (UTI)">
                            Unidade de Terapia Intensiva (UTI)
                          </SelectItem>
                          <SelectItem value="Centro Cirúrgico">Centro Cirúrgico</SelectItem>
                          <SelectItem value="Emergência/Pronto-Socorro">Emergência/Pronto-Socorro</SelectItem>
                          <SelectItem value="Clínica Médica">Clínica Médica</SelectItem>
                          <SelectItem value="Pediatria">Pediatria</SelectItem>
                          <SelectItem value="Ginecologia e Obstetrícia">Ginecologia e Obstetrícia</SelectItem>
                          <SelectItem value="Cardiologia">Cardiologia</SelectItem>
                          <SelectItem value="Oncologia">Oncologia</SelectItem>
                          <SelectItem value="Home Care/Atendimento Domiciliar">
                            Home Care/Atendimento Domiciliar
                          </SelectItem>
                          <SelectItem value="Saúde da Família (PSF)">Saúde da Família (PSF)</SelectItem>
                          <SelectItem value="Outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Fim da alteração */}
                    <div className="space-y-2">
                      <Label htmlFor="years_experience">Anos de Experiência *</Label>
                      <Select onValueChange={(value) => handleInputChange("years_experience", value)} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione sua experiência" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 a 3 anos</SelectItem>
                          <SelectItem value="3">3 a 5 anos</SelectItem>
                          <SelectItem value="5">5 a 10 anos</SelectItem>
                          <SelectItem value="10">Mais de 10 anos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Documentos Obrigatórios
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        Envie um arquivo ou tire uma foto de cada documento.
                      </p>
                    </div>

                    <DocumentInput
                      label="Certificados de Qualificação *"
                      field="qualifications"
                      file={formData.qualifications}
                      preview={previews.qualifications}
                      onFileChange={handleFileChange}
                      onOpenCamera={handleOpenCamera}
                    />
                    <DocumentInput
                      label="Registro Geral (RG) *"
                      field="general_register"
                      file={formData.general_register}
                      preview={previews.general_register}
                      onFileChange={handleFileChange}
                      onOpenCamera={handleOpenCamera}
                    />
                    <DocumentInput
                      label="Comprovante de Residência *"
                      field="residence_comprovant"
                      file={formData.residence_comprovant}
                      preview={previews.residence_comprovant}
                      onFileChange={handleFileChange}
                      onOpenCamera={handleOpenCamera}
                    />
                    <DocumentInput
                      label="Registro Profissional (COREN) *"
                      field="license_document"
                      file={formData.license_document}
                      preview={previews.license_document}
                      onFileChange={handleFileChange}
                      onOpenCamera={handleOpenCamera}
                    />
                    <DocumentInput
                      label="Foto de Perfil *"
                      field="profile_image"
                      file={formData.profile_image}
                      preview={previews.profile_image}
                      onFileChange={handleFileChange}
                      onOpenCamera={handleOpenCamera}
                    />
                  </div>

                  <div className="pt-6 flex flex-col justify-center">
                    <Button
                      type="submit"
                      style={{
                        backgroundColor: "#15803d",
                        color: "white",
                        padding: "0.75rem",
                        fontSize: "1rem",
                        fontWeight: "600",
                        cursor: isSubmitting ? "not-allowed" : "pointer",
                        opacity: isSubmitting ? 0.7 : 1,
                      }}
                      disabled={isSubmitting}
                    >
                      <CheckCircle className="mr-2 h-5 w-5" />
                      {isSubmitting ? "Cadastrando..." : "Finalizar Cadastro"}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-3">
                      Ao se cadastrar, você concorda com nossos{" "}
                      <Link href="/termos" className="text-primary hover:underline">
                        Termos de Uso
                      </Link>{" "}
                      e{" "}
                      <Link href="/privacidade" className="text-primary hover:underline">
                        Política de Privacidade
                      </Link>
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Próximos Passos</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto font-bold">
                  1
                </div>
                <h3 className="font-semibold">Análise de Documentos</h3>
                <p className="text-sm text-muted-foreground">Nossa equipe analisará seus documentos em até 48 horas</p>
              </div>
              <div className="space-y-3">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto font-bold">
                  2
                </div>
                <h3 className="font-semibold">Verificação de Antecedentes</h3>
                <p className="text-sm text-muted-foreground">
                  Realizamos verificação completa para garantir a segurança
                </p>
              </div>
              <div className="space-y-3">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto font-bold">
                  3
                </div>
                <h3 className="font-semibold">Aprovação e Ativação</h3>
                <p className="text-sm text-muted-foreground">
                  Após aprovação, você poderá começar a receber solicitações
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Tirar Foto do Documento</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-auto rounded-md"
              style={{ transform: "scaleX(-1)" }}
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCameraOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCapture} className="bg-primary hover:bg-primary/90">
              <Camera className="mr-2 h-4 w-4" /> Capturar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
