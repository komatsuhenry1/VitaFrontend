"use client"

import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Star } from "lucide-react"
import Link from "next/link"

export default function About() {
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

  const testimonials = [
    {
      name: "Maria Oliveira",
      role: "Paciente",
      rating: 5,
      comment:
        "O Vita transformou minha experiência com cuidados de saúde. Encontrei uma enfermeira incrível que cuida da minha mãe com muito carinho e profissionalismo.",
      avatar: "👵",
    },
    {
      name: "Ana Silva",
      role: "Enfermeira",
      rating: 5,
      comment:
        "Como enfermeira, o Vita me deu a flexibilidade de trabalhar com autonomia e conectar com pacientes que realmente precisam dos meus cuidados. Plataforma excelente!",
      avatar: "👩‍⚕️",
    },
    {
      name: "João Santos",
      role: "Paciente",
      rating: 5,
      comment:
        "Após minha cirurgia, precisava de cuidados especializados em casa. O Vita facilitou todo o processo e encontrei profissionais qualificados rapidamente.",
      avatar: "👨",
    },
    {
      name: "Carla Mendes",
      role: "Enfermeira",
      rating: 5,
      comment:
        "A plataforma é intuitiva e segura. Consigo gerenciar minha agenda, receber pagamentos e manter contato com meus pacientes de forma profissional.",
      avatar: "👩‍⚕️",
    },
    {
      name: "Roberto Lima",
      role: "Paciente",
      rating: 5,
      comment:
        "Meu pai precisa de cuidados constantes e o Vita nos ajudou a encontrar enfermeiros confiáveis. A qualidade do atendimento é excepcional!",
      avatar: "👴",
    },
  ]

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
              Nossa História
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance" style={{ color: "white" }}>
              Sobre o Vita
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-pretty" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
              Transformando o cuidado de saúde através da tecnologia, conectando profissionais qualificados a pacientes
              que precisam de cuidados especializados no conforto de seus lares.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance" style={{ color: "#1f2937" }}>
                Nossa Missão
              </h2>
              <p className="text-lg mb-6" style={{ color: "#6b7280" }}>
                Democratizar o acesso a cuidados de saúde de qualidade, conectando enfermeiros qualificados a pacientes
                que necessitam de atendimento domiciliar personalizado e humanizado.
              </p>
              <p className="text-lg" style={{ color: "#6b7280" }}>
                Acreditamos que todos merecem receber cuidados de saúde dignos e profissionais, independentemente de sua
                localização ou condição física.
              </p>
            </div>
            <div className="rounded-2xl p-8" style={{ backgroundColor: "#f0fdf4" }}>
              <div className="text-center">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-2xl font-bold mb-4" style={{ color: "#15803d" }}>
                  Nosso Objetivo
                </h3>
                <p style={{ color: "#6b7280" }}>
                  Ser a principal plataforma de conexão entre enfermeiros e pacientes no Brasil, garantindo cuidados de
                  excelência e acessibilidade para todos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20" style={{ backgroundColor: "#f0fdf4" }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance" style={{ color: "#1f2937" }}>
              Nossos Valores
            </h2>
            <p className="text-xl max-w-2xl mx-auto text-pretty" style={{ color: "#6b7280" }}>
              Os princípios que guiam nossa missão de transformar o cuidado de saúde.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div
                  className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: "#dcfce7" }}
                >
                  <span className="text-2xl">🤝</span>
                </div>
                <CardTitle>Confiança</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Construímos relacionamentos baseados na transparência, segurança e credibilidade entre todos os
                  usuários da nossa plataforma.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div
                  className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: "#dcfce7" }}
                >
                  <span className="text-2xl">💚</span>
                </div>
                <CardTitle>Humanização</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Priorizamos o cuidado humanizado, tratando cada paciente com dignidade, respeito e atenção
                  individualizada.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div
                  className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: "#dcfce7" }}
                >
                  <span className="text-2xl">⚡</span>
                </div>
                <CardTitle>Inovação</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Utilizamos tecnologia de ponta para facilitar conexões eficientes e melhorar continuamente a
                  experiência de cuidado.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div
                  className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: "#dcfce7" }}
                >
                  <span className="text-2xl">🎯</span>
                </div>
                <CardTitle>Excelência</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Mantemos os mais altos padrões de qualidade em todos os serviços, garantindo profissionais
                  qualificados e cuidados excepcionais.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div
                  className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: "#dcfce7" }}
                >
                  <span className="text-2xl">🌍</span>
                </div>
                <CardTitle>Acessibilidade</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Trabalhamos para tornar cuidados de saúde de qualidade acessíveis a todas as pessoas,
                  independentemente de sua localização.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div
                  className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: "#dcfce7" }}
                >
                  <span className="text-2xl">🛡️</span>
                </div>
                <CardTitle>Segurança</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Implementamos protocolos rigorosos de segurança para proteger dados e garantir ambientes seguros para
                  pacientes e profissionais.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance" style={{ color: "#1f2937" }}>
                Nossa História
              </h2>
            </div>

            <div className="space-y-12">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="md:w-1/3">
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center mx-auto"
                    style={{ backgroundColor: "#dcfce7" }}
                  >
                    <span className="text-3xl">💡</span>
                  </div>
                </div>
                <div className="md:w-2/3">
                  <h3 className="text-2xl font-bold mb-4" style={{ color: "#15803d" }}>
                    O Início (2023)
                  </h3>
                  <p className="text-lg" style={{ color: "#6b7280" }}>
                    O Vita nasceu da necessidade observada de conectar profissionais de enfermagem qualificados com
                    pacientes que precisavam de cuidados domiciliares. Identificamos uma lacuna no mercado onde tanto
                    enfermeiros quanto pacientes enfrentavam dificuldades para se conectar de forma segura e eficiente.
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row-reverse gap-8 items-center">
                <div className="md:w-1/3">
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center mx-auto"
                    style={{ backgroundColor: "#dcfce7" }}
                  >
                    <span className="text-3xl">🚀</span>
                  </div>
                </div>
                <div className="md:w-2/3">
                  <h3 className="text-2xl font-bold mb-4" style={{ color: "#15803d" }}>
                    Desenvolvimento (2024)
                  </h3>
                  <p className="text-lg" style={{ color: "#6b7280" }}>
                    Desenvolvemos uma plataforma robusta e segura, implementando rigorosos processos de verificação para
                    enfermeiros e sistemas de avaliação que garantem a qualidade dos serviços. Nossa tecnologia permite
                    conexões rápidas e seguras entre profissionais e pacientes.
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="md:w-1/3">
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center mx-auto"
                    style={{ backgroundColor: "#dcfce7" }}
                  >
                    <span className="text-3xl">🌟</span>
                  </div>
                </div>
                <div className="md:w-2/3">
                  <h3 className="text-2xl font-bold mb-4" style={{ color: "#15803d" }}>
                    Presente
                  </h3>
                  <p className="text-lg" style={{ color: "#6b7280" }}>
                    Hoje, o Vita conecta centenas de enfermeiros qualificados a milhares de pacientes em todo o Brasil.
                    Continuamos expandindo nossos serviços e melhorando nossa plataforma para oferecer a melhor
                    experiência possível para todos os usuários.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20" style={{ backgroundColor: "#f0fdf4" }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance" style={{ color: "#1f2937" }}>
              O Que Dizem Nossos Usuários
            </h2>
            <p className="text-xl max-w-2xl mx-auto text-pretty" style={{ color: "#6b7280" }}>
              Depoimentos reais de pacientes e enfermeiros que confiam no Vita.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent>
                {testimonials.map((testimonial, index) => (
                  <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-1">
                      <Card className="h-full hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-center gap-4 mb-4">
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                              style={{ backgroundColor: "#dcfce7" }}
                            >
                              {testimonial.avatar}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                              <CardDescription>{testimonial.role}</CardDescription>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {Array.from({ length: testimonial.rating }).map((_, i) => (
                              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm" style={{ color: "#6b7280" }}>
                            &ldquo;{testimonial.comment}&rdquo;
                          </p>                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance" style={{ color: "#1f2937" }}>
              Nossa Equipe
            </h2>
            <p className="text-xl max-w-2xl mx-auto text-pretty" style={{ color: "#6b7280" }}>
              Profissionais dedicados trabalhando para transformar o cuidado de saúde.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div
                  className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: "#dcfce7" }}
                >
                  <span className="text-2xl">👨‍💼</span>
                </div>
                <CardTitle>Dr. João Silva</CardTitle>
                <CardDescription>CEO & Fundador</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm" style={{ color: "#6b7280" }}>
                  Médico com 15 anos de experiência em gestão hospitalar e tecnologia em saúde.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div
                  className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: "#dcfce7" }}
                >
                  <span className="text-2xl">👩‍⚕️</span>
                </div>
                <CardTitle>Enf. Maria Santos</CardTitle>
                <CardDescription>Diretora de Enfermagem</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm" style={{ color: "#6b7280" }}>
                  Enfermeira especialista com 20 anos de experiência em cuidados domiciliares.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div
                  className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: "#dcfce7" }}
                >
                  <span className="text-2xl">👨‍💻</span>
                </div>
                <CardTitle>Carlos Oliveira</CardTitle>
                <CardDescription>CTO</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm" style={{ color: "#6b7280" }}>
                  Engenheiro de software especializado em plataformas de saúde e segurança digital.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20" style={{ backgroundColor: "#15803d", color: "white" }}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-balance" style={{ color: "white" }}>
            Faça Parte da Nossa Missão
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-pretty" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
            Junte-se a nós na transformação do cuidado de saúde. Seja você um profissional de enfermagem ou alguém que
            precisa de cuidados especializados.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register/patient">
              <Button size="lg" className="text-lg px-8 py-3" style={{ backgroundColor: "white", color: "#15803d" }}>
                Cadastrar como Paciente
              </Button>
            </Link>
            <Link href="/register/nurse">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-3 bg-transparent"
                style={{ borderColor: "rgba(255, 255, 255, 0.2)", color: "white", backgroundColor: "transparent" }}
              >
                Cadastrar como Enfermeiro
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
