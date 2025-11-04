"use client"

import type React from "react"
import { useState } from "react"

import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { toast } from "sonner"
import { Footer } from "@/components/Footer"

interface ContactFormData {
    name: string
    email: string
    phone: string
    subject: string
    message: string
}

interface FormStatus {
    message: string
    type: "success" | "error" | ""
}

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

export default function Contato() {
    const [formData, setFormData] = useState<ContactFormData>({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
    })

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formStatus, setFormStatus] = useState<FormStatus>({ message: "", type: "" })

    const handleChange = (field: keyof ContactFormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setFormStatus({ message: "", type: "" })

        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api/v1"

        try {
            const contactUsUrl = `${API_BASE_URL}/user/contact`
            const response = await fetch(contactUsUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            },
            )

            if (!response.ok) {
                toast.success("Erro ao enviar mensagem. Tente novamente.")
                throw new Error("Ocorreu um erro ao enviar a mensagem. Tente novamente.")
            }

            toast.success("Mensagem de contato enviada com sucesso.")

            setFormStatus({
                message: "Mensagem enviada com sucesso! Entraremos em contato em breve.",
                type: "success",
            })
            setFormData({ name: "", email: "", phone: "", subject: "", message: "" })
        } catch (error: unknown) {
            setFormStatus({
                message: error instanceof Error ? error.message : "Falha na comunicação com o servidor.",
                type: "error",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            <Header />

            {/* Hero Section */}
            <section style={heroStyle}>
                <div className="container mx-auto px-4 text-center">
                    <div className="max-w-4xl mx-auto">
                        <Badge variant="secondary" className="mb-6 text-sm font-medium bg-white text-green-700">
                            Estamos Aqui para Ajudar
                        </Badge>
                        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance text-white">Entre em Contato Conosco</h1>
                        <p className="text-xl md:text-2xl mb-8 text-pretty text-white/90">
                            Tem dúvidas sobre nossos serviços? Precisa de ajuda? Nossa equipe está pronta para atendê-lo com todo o
                            cuidado e atenção que você merece.
                        </p>
                    </div>
                </div>
            </section>

            {/* Contact Form Section */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-2 gap-12">
                        {/* Contact Form */}
                        <div>
                            <h2 className="text-3xl font-bold mb-6 text-gray-800">Envie sua Mensagem</h2>
                            <p className="text-lg mb-8 text-gray-600">
                                Preencha o formulário abaixo e nossa equipe entrará em contato com você o mais breve possível.
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="name">Nome Completo *</Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => handleChange("name", e.target.value)}
                                            required
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="phone">Telefone</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => handleChange("phone", e.target.value)}
                                            className="mt-1"
                                            placeholder="(11) 99999-9999"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="email">E-mail *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleChange("email", e.target.value)}
                                        required
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="subject">Assunto *</Label>
                                    <Select
                                        onValueChange={(value) => handleChange("subject", value)}
                                        required
                                        value={formData.subject || ""}
                                    >
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Selecione o assunto" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Informações sobre serviços">Informações sobre serviços</SelectItem>
                                            <SelectItem value="Agendamento de consulta">Agendamento de consulta</SelectItem>
                                            <SelectItem value="Suporte técnico">Suporte técnico</SelectItem>
                                            <SelectItem value="Parceria/Trabalhe conosco">Parceria/Trabalhe conosco</SelectItem>
                                            <SelectItem value="Reclamação">Reclamação</SelectItem>
                                            <SelectItem value="Outros">Outros</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="message">Mensagem *</Label>
                                    <Textarea
                                        id="message"
                                        value={formData.message}
                                        onChange={(e) => handleChange("message", e.target.value)}
                                        required
                                        className="mt-1 min-h-32"
                                        placeholder="Descreva sua dúvida ou solicitação..."
                                    />
                                </div>

                                {formStatus.message && (
                                    <div
                                        className={`p-4 rounded-lg text-center font-medium ${formStatus.type === "success"
                                            ? "bg-green-50 text-green-800 border border-green-200"
                                            : "bg-red-50 text-red-800 border border-red-200"
                                            }`}
                                    >
                                        {formStatus.message}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    size="lg"
                                    className="w-full text-lg bg-green-700 hover:bg-green-800"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Enviando..." : "Enviar Mensagem"}
                                </Button>
                            </form>
                        </div>

                        {/* Contact Information */}
                        <div>
                            <h2 className="text-3xl font-bold mb-6 text-gray-800">Informações de Contato</h2>

                            <div className="space-y-6 mb-8">
                                <Card className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                                <span className="text-xl">📞</span>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg mb-2">Telefone</h3>
                                                <p className="text-gray-600">
                                                    <strong>Central de Atendimento:</strong>
                                                    <br />
                                                    (11) 3000-0000
                                                    <br />
                                                    <strong>WhatsApp:</strong>
                                                    <br />
                                                    (11) 97885-4493
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                                <span className="text-xl">✉️</span>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg mb-2">E-mail</h3>
                                                <p className="text-gray-600">
                                                    <strong>Atendimento Geral:</strong>
                                                    <br />
                                                    contato@vita.com.br
                                                    <br />
                                                    <strong>Suporte Técnico:</strong>
                                                    <br />
                                                    suporte@vita.com.br
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                                <span className="text-xl">📍</span>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg mb-2">Endereço</h3>
                                                <p className="text-gray-600">
                                                    Av. Paulista, 1000 - Sala 1501
                                                    <br />
                                                    Bela Vista, São Paulo - SP
                                                    <br />
                                                    CEP: 01310-100
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                                <span className="text-xl">⏰</span>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg mb-2">Horário de Atendimento</h3>
                                                <p className="text-gray-600">
                                                    <strong>Segunda a Sexta:</strong> 8h às 18h
                                                    <br />
                                                    <strong>Sábados:</strong> 8h às 14h
                                                    <br />
                                                    <strong>Emergências:</strong> 24h por dia
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="rounded-2xl p-6 bg-green-50 border border-green-200">
                                <h3 className="font-semibold text-lg mb-4 text-green-700">Atendimento de Emergência</h3>
                                <p className="text-sm mb-4 text-gray-600">
                                    Para situações de emergência, nossa equipe está disponível 24 horas por dia, 7 dias por semana.
                                </p>
                                <Button size="sm" className="w-full bg-green-700 hover:bg-green-800">
                                    Ligar para Emergência
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20" style={{ backgroundColor: "#f0fdf4" }}>
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance" style={{ color: "#1f2937" }}>
                            Perguntas Frequentes
                        </h2>
                        <p className="text-xl max-w-2xl mx-auto text-pretty" style={{ color: "#6b7280" }}>
                            Encontre respostas para as dúvidas mais comuns sobre nossos serviços.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Como agendar uma consulta?</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>
                                    Você pode agendar através do nosso site, cadastrando-se como paciente e escolhendo o serviço desejado.
                                    Também pode ligar para nossa central de atendimento.
                                </CardDescription>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Quais são os métodos de pagamento?</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>
                                    Aceitamos cartão de crédito, débito, PIX e boleto bancário. Para planos mensais, oferecemos desconto
                                    no pagamento à vista.
                                </CardDescription>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Os enfermeiros são qualificados?</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>
                                    Sim! Todos os nossos enfermeiros são registrados no COREN, possuem experiência comprovada e passam por
                                    rigoroso processo de seleção e verificação.
                                </CardDescription>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Atendem em toda São Paulo?</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>
                                    Atendemos em toda a Grande São Paulo. Para outras regiões, consulte nossa central de atendimento para
                                    verificar disponibilidade.
                                </CardDescription>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Posso cancelar um agendamento?</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>
                                    Sim, você pode cancelar com até 24 horas de antecedência sem custos. Cancelamentos com menos tempo
                                    podem ter taxa de cancelamento.
                                </CardDescription>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Como funciona o atendimento 24h?</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>
                                    Nosso atendimento 24h é para emergências e cuidados intensivos. Entre em contato através do telefone
                                    de emergência para avaliação da situação.
                                </CardDescription>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20" style={{ backgroundColor: "#15803d", color: "white" }}>
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance" style={{ color: "white" }}>
                        Ainda tem Dúvidas?
                    </h2>
                    <p className="text-xl mb-8 max-w-2xl mx-auto text-pretty" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                        Nossa equipe está pronta para esclarecer todas as suas dúvidas e ajudá-lo a encontrar o melhor cuidado.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/register/patient">
                            <Button size="lg" className="text-lg px-8 py-3" style={{ backgroundColor: "white", color: "#15803d" }}>
                                Cadastrar-se Agora
                            </Button>
                        </Link>
                        <Button
                            size="lg"
                            variant="outline"
                            className="text-lg px-8 py-3 bg-transparent"
                            style={{ borderColor: "rgba(255, 255, 255, 0.2)", color: "white", backgroundColor: "transparent" }}
                        >
                            Ligar Agora
                        </Button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <Footer />
        </>
    )
}
