"use client"

import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import { Footer } from "@/components/Footer"

export default function Servicos() {
    const services = [
        {
            title: "Cuidados Domiciliares",
            imageUrl: "/cuidados_domiciliares.png",
            description: "Cuidados médicos completos no conforto do seu lar, incluindo administração de medicamentos, monitoramento de sinais vitais e acompanhamento de tratamentos.",
            items: [
                "Administração de medicamentos",
                "Monitoramento de sinais vitais",
                "Curativos e cuidados com feridas",
                "Acompanhamento de tratamentos",
            ],
        },
        {
            title: "Cuidados Pós-Operatórios",
            imageUrl: "/cuidados_pos_operatorios.png",
            description: "Acompanhamento especializado durante o período de recuperação, garantindo uma reabilitação segura e eficaz após procedimentos cirúrgicos.",
            items: [
                "Cuidados com incisões cirúrgicas",
                "Controle da dor pós-operatória",
                "Fisioterapia respiratória",
                "Orientações para recuperação",
            ],
        },
        {
            title: "Atendimento 24h",
            imageUrl: "/atendimento_24h.png",
            description: "Disponibilidade de enfermeiros qualificados 24 horas por dia, 7 dias por semana para emergências e cuidados contínuos.",
            items: ["Plantões noturnos", "Atendimento de emergência", "Cuidados intensivos domiciliares", "Suporte familiar 24h"],
        },
        {
            title: "Cuidados Geriátricos",
            imageUrl: "/cuidados_geriatricos.png",
            description: "Cuidados especializados para idosos, focando no bem-estar, independência e qualidade de vida dos pacientes da terceira idade.",
            items: ["Cuidados com mobilidade", "Prevenção de quedas", "Estimulação cognitiva", "Cuidados com higiene pessoal"],
        },
        {
            title: "Consultas Especializadas",
            imageUrl: "/consultas_especializadas.png",
            description: "Avaliações de saúde, orientações médicas e acompanhamento de tratamentos com enfermeiros especializados em diferentes áreas.",
            items: ["Avaliação de saúde geral", "Orientações nutricionais", "Educação em saúde", "Acompanhamento de doenças crônicas"],
        },
        {
            title: "Cuidados Paliativos",
            imageUrl: "/cuidados_paliativos.png",
            description: "Suporte compassivo e cuidados especializados para pacientes em situações delicadas, priorizando conforto, dignidade e qualidade de vida.",
            items: ["Controle de sintomas", "Suporte emocional", "Cuidados de conforto", "Apoio à família"],
        },
    ]
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

    return (
        <>
            <Header />

            {/* Hero Section */}
            <section style={heroStyle}>
                <div className="container mx-auto px-4 text-center">
                    <div className="max-w-4xl mx-auto">
                        <Badge
                            variant="secondary"
                            className="mb-6 text-sm font-medium"
                            style={{ backgroundColor: "white", color: "#15803d" }}
                        >
                            Cuidados Profissionais
                        </Badge>
                        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance" style={{ color: "white" }}>
                            Nossos Serviços de Enfermagem
                        </h1>
                        <p className="text-xl md:text-2xl mb-8 text-pretty" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                            Oferecemos uma ampla gama de serviços de enfermagem domiciliar com profissionais qualificados, garantindo
                            cuidados de qualidade no conforto do seu lar.
                        </p>
                    </div>
                </div>
            </section>

            {/* Detailed Services Section */}
            <section className="py-20" style={{ backgroundColor: "#f0fdf4" }}>
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance" style={{ color: "#1f2937" }}>
                            Serviços Especializados
                        </h2>
                        <p className="text-xl max-w-3xl mx-auto text-pretty" style={{ color: "#6b7280" }}>
                            Cada serviço é prestado por enfermeiros registrados e experientes, seguindo os mais altos padrões de
                            qualidade e segurança em cuidados de saúde.
                        </p>
                    </div>

                    <div className="grid md-grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                        {services.map((service) => (
                            <Card key={service.title} className="hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
                                <div className="relative w-full h-48">
                                    <Image
                                        src={service.imageUrl || "/placeholder.svg"}
                                        alt={`Imagem ilustrativa para ${service.title}`}
                                        fill
                                        className="object-cover object-center" // MUDANÇA AQUI
                                    />
                                </div>
                                <div className="flex flex-col flex-grow">
                                    <CardHeader>
                                        <CardTitle>{service.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex flex-col flex-grow">
                                        <CardDescription className="text-base mb-4">{service.description}</CardDescription>
                                        <ul className="text-sm space-y-2 mt-auto" style={{ color: "#6b7280" }}>
                                            {service.items.map((item) => (
                                                <li key={item}>• {item}</li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Process Section */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance" style={{ color: "#1f2937" }}>
                            Como Funciona
                        </h2>
                        <p className="text-xl max-w-2xl mx-auto text-pretty" style={{ color: "#6b7280" }}>
                            Um processo simples e seguro para conectar você aos melhores profissionais de enfermagem.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div
                                className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6"
                                style={{ backgroundColor: "#15803d", color: "white" }}
                            >
                                <span className="text-2xl font-bold">1</span>
                            </div>
                            <h3 className="text-xl font-semibold mb-4">Cadastre-se</h3>
                            <p style={{ color: "#6b7280" }}>
                                Crie sua conta e preencha suas informações de saúde e necessidades específicas de cuidado.
                            </p>
                        </div>

                        <div className="text-center">
                            <div
                                className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6"
                                style={{ backgroundColor: "#15803d", color: "white" }}
                            >
                                <span className="text-2xl font-bold">2</span>
                            </div>
                            <h3 className="text-xl font-semibold mb-4">Escolha o Serviço</h3>
                            <p style={{ color: "#6b7280" }}>
                                Selecione o tipo de cuidado necessário e agende o horário que melhor se adequa à sua rotina.
                            </p>
                        </div>

                        <div className="text-center">
                            <div
                                className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6"
                                style={{ backgroundColor: "#15803d", color: "white" }}
                            >
                                <span className="text-2xl font-bold">3</span>
                            </div>
                            <h3 className="text-xl font-semibold mb-4">Receba o Cuidado</h3>
                            <p style={{ color: "#6b7280" }}>
                                Um enfermeiro qualificado chegará ao seu local no horário agendado para prestar o cuidado necessário.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="py-20" style={{ backgroundColor: "#f0fdf4" }}>
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance" style={{ color: "#1f2937" }}>
                            Planos e Preços
                        </h2>
                        <p className="text-xl max-w-2xl mx-auto text-pretty" style={{ color: "#6b7280" }}>
                            Escolha o plano que melhor atende às suas necessidades de cuidado.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        <Card className="text-center hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle className="text-2xl mb-2">Consulta Única</CardTitle>
                                <div className="text-4xl font-bold mb-2" style={{ color: "#15803d" }}>
                                    R$ 150
                                </div>
                                <CardDescription>Por consulta</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3 text-sm mb-6" style={{ color: "#6b7280" }}>
                                    <li>✅ Consulta domiciliar</li>
                                    <li>✅ Avaliação de saúde</li>
                                    <li>✅ Orientações básicas</li>
                                    <li>✅ Relatório de atendimento</li>
                                </ul>
                                <Link href="/register-patient">
                                    <Button className="w-full" style={{ backgroundColor: "#15803d" }}>
                                        Agendar Consulta
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>

                        <Card className="text-center hover:shadow-lg transition-shadow border-2" style={{ borderColor: "#15803d" }}>
                            <CardHeader>
                                <Badge className="mb-4" style={{ backgroundColor: "#15803d", color: "white" }}>
                                    Mais Popular
                                </Badge>
                                <CardTitle className="text-2xl mb-2">Plano Mensal</CardTitle>
                                <div className="text-4xl font-bold mb-2" style={{ color: "#15803d" }}>
                                    R$ 500
                                </div>
                                <CardDescription>Por mês</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3 text-sm mb-6" style={{ color: "#6b7280" }}>
                                    <li>✅ 4 consultas mensais</li>
                                    <li>✅ Atendimento prioritário</li>
                                    <li>✅ Suporte 24h</li>
                                    <li>✅ Relatórios detalhados</li>
                                    <li>✅ Desconto de 15%</li>
                                </ul>
                                <Link href="/register-patient">
                                    <Button className="w-full" style={{ backgroundColor: "#15803d" }}>
                                        Assinar Plano
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>

                        <Card className="text-center hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle className="text-2xl mb-2">Cuidado Intensivo</CardTitle>
                                <div className="text-4xl font-bold mb-2" style={{ color: "#15803d" }}>
                                    R$ 1200
                                </div>
                                <CardDescription>Por mês</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3 text-sm mb-6" style={{ color: "#6b7280" }}>
                                    <li>✅ Cuidados diários</li>
                                    <li>✅ Enfermeiro dedicado</li>
                                    <li>✅ Atendimento 24h</li>
                                    <li>✅ Equipamentos inclusos</li>
                                    <li>✅ Suporte familiar</li>
                                </ul>
                                <Link href="/register-patient">
                                    <Button className="w-full" style={{ backgroundColor: "#15803d" }}>
                                        Contratar Serviço
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20" style={{ backgroundColor: "#15803d", color: "white" }}>
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance" style={{ color: "white" }}>
                        Pronto para Receber Cuidados Profissionais?
                    </h2>
                    <p className="text-xl mb-8 max-w-2xl mx-auto text-pretty" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                        Cadastre-se agora e conecte-se com enfermeiros qualificados na sua região. Sua saúde é nossa prioridade.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/register-patient">
                            <Button size="lg" className="text-lg px-8 py-3" style={{ backgroundColor: "white", color: "#15803d" }}>
                                Cadastrar como Paciente
                            </Button>
                        </Link>
                        <Link href="/contato">
                            <Button
                                size="lg"
                                variant="outline"
                                className="text-lg px-8 py-3 bg-transparent"
                                style={{ borderColor: "rgba(255, 255, 255, 0.2)", color: "white", backgroundColor: "transparent" }}
                            >
                                Falar Conosco
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </>
    )
}
