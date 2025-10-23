"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Shield, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ValidateCodePage() {
    const [email, setEmail] = useState<string | null>(null)
    const [code, setCode] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const emailFromStorage = localStorage.getItem("email")

        if (emailFromStorage) {
            setEmail(emailFromStorage)
        } else {
            toast.error("Email não encontrado. Por favor, faça login novamente.")
            setTimeout(() => {
                router.push("/auth/login")
            }, 2000)
        }
    }, [router])

    const handleValidateCode = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!email || !code) {
            toast.error("Por favor, preencha o código.")
            return
        }

        if (code.length !== 6) {
            toast.error("O código deve ter 6 dígitos.")
            return
        }

        setIsLoading(true)

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/validate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    code: Number.parseInt(code),
                }),
            })

            const result = await response.json()

            if (response.ok && result.success) {
                localStorage.setItem("token", result.data.token)
                localStorage.setItem("user", JSON.stringify(result.data.user))

                localStorage.removeItem("email")

                const userRole = result.data.user.role
                setTimeout(() => {
                    if (userRole === "NURSE") {
                        toast.success("Login realizado com sucesso!")
                        router.push("/dashboard/nurse")
                    } else if (userRole === "PATIENT") {
                        toast.success("Login realizado com sucesso!")
                        router.push("/nurses-list") // Rota ajustada como no Header
                    } else if (userRole === "ADMIN") {
                        toast.success("Login realizado com sucesso!")
                        router.push("/dashboard/admin")
                    } else {
                        router.push("/")
                    }
                }, 1000)
            } else {
                toast.error(result.message || "Código inválido. Tente novamente.")
            }
        } catch (error) {
            console.error("Error validating code:", error)
            toast.error("Erro ao validar código. Verifique sua conexão.")
        } finally {
            setIsLoading(false)
        }
    }

    const HandleResendCode = async () => {
        if (!email) {
            toast.error("Por favor, preencha o email.")
            return
        }

        setIsLoading(true)

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/code`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                }),
            })

            const result = await response.json()

            if (response.ok && result.success) {
                toast.success(result.message)
            } else {
                toast.error(result.message || "Erro ao reenviar código. Tente novamente.")
            }} catch (error) {
            console.error("Error resending code:", error)
            toast.error("Erro ao reenviar código. Verifique sua conexão.")
                } finally {
            setIsLoading(false)
        }
    }




    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 text-center">
                    <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                        <Shield className="h-6 w-6 text-[#15803d]" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Validar Código</CardTitle>
                    <CardDescription>Digite o código de 6 dígitos enviado para seu email</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleValidateCode} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="code">Código de Verificação</Label>
                            <Input
                                id="code"
                                type="text"
                                placeholder="000000"
                                value={code}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, "")
                                    if (value.length <= 6) {
                                        setCode(value)
                                    }
                                }}
                                className="text-center text-2xl tracking-widest font-mono"
                                disabled={isLoading}
                                maxLength={6}
                                required
                                autoFocus
                            />
                            <p className="text-xs text-muted-foreground text-center">Digite o código de 6 dígitos</p>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-[#15803d] hover:bg-[#166534]"
                            disabled={isLoading || code.length !== 6}
                        >
                            {isLoading ? "Validando..." : "Confirmar Código"}
                        </Button>

                        <div className="text-center space-y-2">
                            <p className="text-sm text-muted-foreground">
                                Não recebeu o código?{" "}
                                <button
                                    type="button"
                                    className="text-[#15803d] hover:underline font-medium"
                                onClick={HandleResendCode}
                                >
                                    Reenviar
                                </button>
                            </p>

                            <Link
                                href="/login"
                                className="text-sm text-[#15803d] hover:underline inline-flex items-center gap-1"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Voltar para login
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
