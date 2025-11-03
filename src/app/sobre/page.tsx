"use client"

import { Header } from "@/components/Header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

  return (
    <>
      <Header />

      {/* --- MUDANÇA: Estilo da seção principal atualizado --- */}
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
        {/* ... O resto do código permanece o mesmo ... */}
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
                    Hoje, o Vita conecta centenas de enfermeiros qualificados a milhares de pacientes em todo o
                    Brasil. Continuamos expandindo nossos serviços e melhorando nossa plataforma para oferecer a melhor
                    experiência possível para todos os usuários.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20" style={{ backgroundColor: "#f0fdf4" }}>
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

      {/* Footer */}
      <footer className="py-12" style={{ backgroundColor: "#f3f4f6" }}>
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">Vita</h3>
              <p className="text-sm" style={{ color: "#6b7280" }}>
                Conectando cuidado e confiança através de uma plataforma segura e profissional de serviços de
                enfermagem.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Serviços</h4>
              <ul className="space-y-2 text-sm" style={{ color: "#6b7280" }}>
                <li>
                  <Link href="#" className="hover:text-green-700 transition-colors">
                    Cuidados Domiciliares
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-green-700 transition-colors">
                    Cuidados Pós-Operatórios
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-green-700 transition-colors">
                    Atendimento 24h
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-green-700 transition-colors">
                    Cuidados Geriátricos
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm" style={{ color: "#6b7280" }}>
                <li>
                  <Link href="/about" className="hover:text-green-700 transition-colors">
                    Sobre Nós
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-green-700 transition-colors">
                    Contato
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-green-700 transition-colors">
                    Carreiras
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-green-700 transition-colors">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm" style={{ color: "#6b7280" }}>
                <li>
                  <Link href="#" className="hover:text-green-700 transition-colors">
                    Central de Ajuda
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-green-700 transition-colors">
                    Política de Privacidade
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-green-700 transition-colors">
                    Termos de Uso
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-green-700 transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 text-center text-sm" style={{ borderTop: "1px solid #d1d5db", color: "#6b7280" }}>
            <p>&copy; 2025 Vita. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </>
  )
}