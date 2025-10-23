"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/Header"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

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

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

      const loginUrl = `${API_BASE_URL}/auth/login`

      const res = await fetch(loginUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (data.success) {
        const user = data.data.user
        const token = data.data.token

        console.log("====")
        console.log(data)
        console.log("====")

        if (user.role === "NURSE") {
          if (data.data.user.two_factor){
            router.push("/auth/two-factor")
            localStorage.setItem("email", data.data.user.email)
            toast.success(`Verificação ativada. Verifique a caixa de entrada do email: ${data.data.user.email}`)
            return
          }
          localStorage.setItem("token", token)
          localStorage.setItem("user", JSON.stringify(user))  
          toast.success("Login realizado com sucesso!")
          router.push("/dashboard/nurse")
        } else if (user.role === "ADMIN") {
          localStorage.setItem("token", token)
          localStorage.setItem("user", JSON.stringify(user))  
          toast.success("Login realizado com sucesso!")
          router.push("/dashboard/admin")
        } else if (user.role === "PATIENT") {
          if (data.data.user.two_factor) {
            localStorage.setItem("email", data.data.user.email)
            toast.success(`Verificação ativada. Verifique a caixa de entrada do email: ${data.data.user.email}`)
            router.push("/auth/two-factor")
            return
          }
          localStorage.setItem("token", token)
          localStorage.setItem("user", JSON.stringify(user))  
          toast.success("Login realizado com sucesso!")
          router.push("/nurses-list") // Rota ajustada como no Header
        } else {
          router.push("/")
        }
      } else {
        toast.error(data.message || "Falha no login. Verifique suas credenciais.")
      }
    } catch (error) {
      console.error("Erro no login:", error)
      toast.error("Ocorreu um erro ao tentar fazer login. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <Header />

      <section style={heroStyle} >
        <div style={{ maxWidth: "1200px", margin: "0 auto", textAlign: "center" }}>
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: "bold",
              marginBottom: "1rem",
              lineHeight: "1.2",
            }}
          >
            Acesse sua Conta
          </h1>
          <p
            style={{
              fontSize: "1.125rem",
              opacity: 0.9,
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            Entre na sua conta para acessar nossos serviços de saúde
          </p>
        </div>
      </section>

      {/* Login Form Section */}
      <section style={{ padding: "4rem 1rem" }}>
        <div style={{ maxWidth: "500px", margin: "0 auto" }}>
          <Card>
            <CardHeader style={{ textAlign: "center" }}>
              <CardTitle style={{ fontSize: "1.5rem", color: "#15803d" }}>Fazer Login</CardTitle>
              <CardDescription>Digite suas credenciais para acessar sua conta</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Digite sua senha"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div style={{ textAlign: "right" }}>
                  <Link
                    href="/send-email"
                    style={{
                      color: "#15803d",
                      textDecoration: "none",
                      fontSize: "0.875rem",
                    }}
                  >
                    Esqueceu sua senha?
                  </Link>
                </div>

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
                  {isSubmitting ? "Entrando..." : "Entrar"}
                </Button>
              </form>

              <div
                style={{
                  marginTop: "2rem",
                  textAlign: "center",
                  paddingTop: "1.5rem",
                  borderTop: "1px solid #e5e7eb",
                }}
              >
                <p style={{ color: "#6b7280", marginBottom: "1rem" }}>Ainda não tem uma conta?</p>
                <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                  <Link href="/register-nurse">
                    <Button
                      variant="outline"
                      style={{
                        borderColor: "#15803d",
                        color: "#15803d",
                      }}
                    >
                      Sou Enfermeiro
                    </Button>
                  </Link>
                  <Link href="/register-patient">
                    <Button
                      variant="outline"
                      style={{
                        borderColor: "#15803d",
                        color: "#15803d",
                      }}
                    >
                      Sou Paciente
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Benefits Section */}
      <section
        style={{
          backgroundColor: "white",
          padding: "3rem 1rem",
          borderTop: "1px solid #e5e7eb",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              textAlign: "center",
              marginBottom: "3rem",
              color: "#1f2937",
            }}
          >
            Por que escolher o Vita?
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "2rem",
            }}
          >
            <div style={{ textAlign: "center", padding: "1.5rem" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔒</div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.5rem", color: "#15803d" }}>
                Seguro e Confiável
              </h3>
              <p style={{ color: "#6b7280" }}>Seus dados estão protegidos com criptografia de ponta</p>
            </div>
            <div style={{ textAlign: "center", padding: "1.5rem" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚡</div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.5rem", color: "#15803d" }}>
                Acesso Rápido
              </h3>
              <p style={{ color: "#6b7280" }}>Conecte-se instantaneamente com profissionais qualificados</p>
            </div>
            <div style={{ textAlign: "center", padding: "1.5rem" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>💚</div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.5rem", color: "#15803d" }}>
                Cuidado Personalizado
              </h3>
              <p style={{ color: "#6b7280" }}>Atendimento adaptado às suas necessidades específicas</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: "#1f2937",
          color: "white",
          padding: "2rem 1rem",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <p style={{ marginBottom: "1rem" }}>© 2024 Vita. Todos os direitos reservados.</p>
          <div style={{ display: "flex", justifyContent: "center", gap: "2rem", flexWrap: "wrap" }}>
            <Link href="/terms" style={{ color: "#9ca3af", textDecoration: "none" }}>
              Termos de Uso
            </Link>
            <Link href="/privacy" style={{ color: "#9ca3af", textDecoration: "none" }}>
              Política de Privacidade
            </Link>
            <Link href="/contact" style={{ color: "#9ca3af", textDecoration: "none" }}>
              Contato
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}