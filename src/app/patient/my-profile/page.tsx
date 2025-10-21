"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { User, Calendar, Shield, Save, Lock, Bell, Eye, History, KeyRound, Trash2 } from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

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
    profile_image_id?: string
}

interface ApiResponse {
    data: PatientData
    message: string
    success: boolean
}

export default function MyProfile() {
    const router = useRouter()
    const [patient, setPatient] = useState<PatientData | null>(null)
    const [loading, setLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [activeTab, setActiveTab] = useState("profile")

    const [editForm, setEditForm] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
    })

    const [securityForm, setSecurityForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        twoFactorEnabled: false,
    })

    const [notificationPrefs, setNotificationPrefs] = useState({
        emailNotifications: true,
        smsNotifications: false,
        appointmentReminders: true,
        promotionalEmails: false,
    })

    const [privacySettings, setPrivacySettings] = useState({
        profileVisible: true,
        showEmail: false,
        showPhone: false,
    })

    useEffect(() => {
        const fetchPatientData = async () => {
            try {
                setLoading(true)
                const storedUser = localStorage.getItem("user")
                if (!storedUser) {
                    toast.error("Usuário não encontrado. Faça login novamente.")
                    router.push("/login")
                    return
                }

                console.log("entrou aqui")

                const user = JSON.parse(storedUser)
                const patientId = user._id

                console.log(" dsadsadasda")

                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/nurse/patient/${patientId}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                })

                if (!response.ok) {
                    throw new Error("Erro ao carregar perfil")
                }

                const result: ApiResponse = await response.json()

                if (result.success && result.data) {
                    setPatient(result.data)
                    setEditForm({
                        name: result.data.name,
                        email: result.data.email,
                        phone: result.data.phone,
                        address: result.data.address,
                    })
                } else {
                    throw new Error(result.message || "Erro ao carregar dados")
                }
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Erro ao carregar perfil")
            } finally {
                setLoading(false)
            }
        }

        fetchPatientData()
    }, [router])

    const handleSaveProfile = async () => {
        try {
            setIsSaving(true)

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/update`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify(editForm),
            })

            const result = await response.json()

            if (response.ok && result.success) {
                toast.success(result.message || "Perfil atualizado com sucesso!")

                if (patient) {
                    setPatient({
                        ...patient,
                        ...editForm,
                    })
                }

                const storedUser = localStorage.getItem("user")
                if (storedUser) {
                    const user = JSON.parse(storedUser)
                    localStorage.setItem("user", JSON.stringify({ ...user, ...editForm }))
                }
            } else {
                throw new Error(result.message || "Erro ao atualizar perfil")
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erro ao atualizar perfil")
        } finally {
            setIsSaving(false)
        }
    }

    const handleSaveSecurity = async () => {
        if (securityForm.newPassword !== securityForm.confirmPassword) {
            toast.error("As senhas não coincidem")
            return
        }

        if (securityForm.newPassword && securityForm.newPassword.length < 6) {
            toast.error("A senha deve ter pelo menos 6 caracteres")
            return
        }

        if (!securityForm.currentPassword) {
            toast.error("Digite sua senha atual")
            return
        }

        try {
            setIsSaving(true)

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/logged/password`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    password: securityForm.currentPassword,
                    new_password: securityForm.newPassword,
                    two_fa: securityForm.twoFactorEnabled,
                }),
            })

            console.log(response)
            
            const result = await response.json()
            console.log(result)
            
            if (response.ok && result.success) {
                toast.success("Configurações de segurança atualizadas! Faça login novamente.")
                localStorage.removeItem("token")
                localStorage.removeItem("user")
                router.push("/login")
                setSecurityForm({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                    twoFactorEnabled: securityForm.twoFactorEnabled,
                })
            } else {
                throw new Error(result.message || "Erro ao atualizar segurança")
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erro ao atualizar configurações de segurança")
        } finally {
            setIsSaving(false)
        }
    }

    const handleSaveNotifications = async () => {
        try {
            setIsSaving(true)

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/update`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify(notificationPrefs),
            })

            const result = await response.json()

            if (response.ok && result.success) {
                toast.success(result.message || "Preferências de notificação atualizadas!")
            } else {
                throw new Error(result.message || "Erro ao atualizar notificações")
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erro ao atualizar preferências")
        } finally {
            setIsSaving(false)
        }
    }

    const handleSavePrivacy = async () => {
        try {
            setIsSaving(true)

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/update`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify(privacySettings),
            })

            const result = await response.json()

            if (response.ok && result.success) {
                toast.success(result.message || "Configurações de privacidade atualizadas!")
            } else {
                throw new Error(result.message || "Erro ao atualizar privacidade")
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erro ao atualizar configurações")
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeleteAccount = async () => {
        try {
            setIsSaving(true)

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/delete`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            })

            const result = await response.json()

            if (response.ok && result.success) {
                toast.success(result.message || "Conta desativada com sucesso!")
                localStorage.removeItem("user")
                localStorage.removeItem("token")
                router.push("/login")
            } else {
                throw new Error(result.message || "Erro ao desativar conta")
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erro ao desativar conta")
        } finally {
            setIsSaving(false)
        }
    }

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
                        <p style={{ color: "#6b7280" }}>Carregando seu perfil...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (!patient) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="container mx-auto px-4 py-8 text-center">
                    <h1 className="text-red-600 mb-4">Erro ao carregar perfil</h1>
                    <Button onClick={() => router.push("/")}>Voltar para Início</Button>
                </div>
            </div>
        )
    }

    const avatarUrl = patient.profile_image_id
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/file/${patient.profile_image_id}`
        : undefined

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Meu Perfil</h1>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <div className="grid md:grid-cols-4 gap-6">
                        <div className="md:col-span-1">
                            <Card>
                                <CardContent className="p-4">
                                    <div className="text-center mb-6 pt-2">
                                        <div className="w-24 h-24 mx-auto mb-3 rounded-full bg-[#15803d] text-white flex items-center justify-center text-2xl font-bold overflow-hidden">
                                            {avatarUrl ? (
                                                <img
                                                    src={avatarUrl || "/placeholder.svg"}
                                                    alt={patient.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                patient.name
                                                    .split(" ")
                                                    .map((n) => n[0])
                                                    .slice(0, 2)
                                                    .join("")
                                                    .toUpperCase()
                                            )}
                                        </div>
                                        <h2 className="text-lg font-bold text-gray-900">{patient.name}</h2>
                                        <p className="text-sm text-[#15803d]">Paciente</p>
                                    </div>

                                    <Separator className="mb-4" />

                                    <TabsList className="flex flex-col h-auto w-full bg-transparent space-y-1">
                                        <TabsTrigger
                                            value="profile"
                                            className="w-full justify-start data-[state=active]:bg-[#15803d] data-[state=active]:text-white"
                                        >
                                            <User className="h-4 w-4 mr-2" />
                                            Perfil
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="security"
                                            className="w-full justify-start data-[state=active]:bg-[#15803d] data-[state=active]:text-white"
                                        >
                                            <Lock className="h-4 w-4 mr-2" />
                                            Segurança
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="notifications"
                                            className="w-full justify-start data-[state=active]:bg-[#15803d] data-[state=active]:text-white"
                                        >
                                            <Bell className="h-4 w-4 mr-2" />
                                            Notificações
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="privacy"
                                            className="w-full justify-start data-[state=active]:bg-[#15803d] data-[state=active]:text-white"
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            Privacidade
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="account"
                                            className="w-full justify-start data-[state=active]:bg-[#15803d] data-[state=active]:text-white"
                                        >
                                            <History className="h-4 w-4 mr-2" />
                                            Conta
                                        </TabsTrigger>
                                    </TabsList>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="md:col-span-3">
                            <TabsContent value="profile" className="mt-0 space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-[#15803d] flex items-center gap-2">
                                            <User size={20} />
                                            Informações Pessoais
                                        </CardTitle>
                                        <CardDescription>Atualize suas informações de contato e endereço</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label htmlFor="name">Nome Completo</Label>
                                            <Input
                                                id="name"
                                                value={editForm.name}
                                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={editForm.email}
                                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="phone">Telefone</Label>
                                            <Input
                                                id="phone"
                                                value={editForm.phone}
                                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="address">Endereço</Label>
                                            <Input
                                                id="address"
                                                value={editForm.address}
                                                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                                className="mt-1"
                                            />
                                        </div>

                                        <Separator />

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="p-4 bg-gray-50 rounded-lg">
                                                <div className="text-sm text-gray-600 mb-1">CPF</div>
                                                <div className="font-semibold text-gray-900">{formatCPF(patient.cpf)}</div>
                                            </div>
                                            <div className="p-4 bg-gray-50 rounded-lg">
                                                <div className="text-sm text-gray-600 mb-1">Função</div>
                                                <div className="font-semibold text-gray-900">Paciente</div>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={handleSaveProfile}
                                            disabled={isSaving}
                                            className="w-full bg-[#15803d] hover:bg-[#166534]"
                                        >
                                            <Save className="h-4 w-4 mr-2" />
                                            {isSaving ? "Salvando..." : "Salvar Alterações"}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="security" className="mt-0 space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-[#15803d] flex items-center gap-2">
                                            <KeyRound size={20} />
                                            Alterar Senha
                                        </CardTitle>
                                        <CardDescription>Atualize sua senha para manter sua conta segura</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <Label htmlFor="currentPassword">Senha Atual</Label>
                                            <Input
                                                id="currentPassword"
                                                type="password"
                                                value={securityForm.currentPassword}
                                                onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                                                className="mt-1"
                                                placeholder="Digite sua senha atual"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="newPassword">Nova Senha</Label>
                                            <Input
                                                id="newPassword"
                                                type="password"
                                                value={securityForm.newPassword}
                                                onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                                                className="mt-1"
                                                placeholder="Digite sua nova senha"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                                            <Input
                                                id="confirmPassword"
                                                type="password"
                                                value={securityForm.confirmPassword}
                                                onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                                                className="mt-1"
                                                placeholder="Confirme sua nova senha"
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-[#15803d] flex items-center gap-2">
                                            <Shield size={20} />
                                            Autenticação de Dois Fatores
                                        </CardTitle>
                                        <CardDescription>Adicione uma camada extra de segurança à sua conta</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900 mb-1">Verificação em Duas Etapas</div>
                                                <div className="text-sm text-gray-600">Receba um código por email sempre que fizer login</div>
                                            </div>
                                            <Switch
                                                checked={securityForm.twoFactorEnabled}
                                                onCheckedChange={(checked) => setSecurityForm({ ...securityForm, twoFactorEnabled: checked })}
                                            />
                                        </div>

                                        <Button
                                            onClick={handleSaveSecurity}
                                            disabled={isSaving}
                                            className="w-full mt-4 bg-[#15803d] hover:bg-[#166534]"
                                        >
                                            <Save className="h-4 w-4 mr-2" />
                                            {isSaving ? "Salvando..." : "Salvar Configurações de Segurança"}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="notifications" className="mt-0">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-[#15803d] flex items-center gap-2">
                                            <Bell size={20} />
                                            Preferências de Notificação
                                        </CardTitle>
                                        <CardDescription>Escolha como deseja receber notificações</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900 mb-1">Notificações por Email</div>
                                                <div className="text-sm text-gray-600">Receba atualizações importantes por email</div>
                                            </div>
                                            <Switch
                                                checked={notificationPrefs.emailNotifications}
                                                onCheckedChange={(checked) =>
                                                    setNotificationPrefs({ ...notificationPrefs, emailNotifications: checked })
                                                }
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900 mb-1">Notificações por SMS</div>
                                                <div className="text-sm text-gray-600">Receba lembretes por mensagem de texto</div>
                                            </div>
                                            <Switch
                                                checked={notificationPrefs.smsNotifications}
                                                onCheckedChange={(checked) =>
                                                    setNotificationPrefs({ ...notificationPrefs, smsNotifications: checked })
                                                }
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900 mb-1">Lembretes de Consultas</div>
                                                <div className="text-sm text-gray-600">Receba lembretes antes das suas consultas</div>
                                            </div>
                                            <Switch
                                                checked={notificationPrefs.appointmentReminders}
                                                onCheckedChange={(checked) =>
                                                    setNotificationPrefs({ ...notificationPrefs, appointmentReminders: checked })
                                                }
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900 mb-1">Emails Promocionais</div>
                                                <div className="text-sm text-gray-600">Receba ofertas e novidades</div>
                                            </div>
                                            <Switch
                                                checked={notificationPrefs.promotionalEmails}
                                                onCheckedChange={(checked) =>
                                                    setNotificationPrefs({ ...notificationPrefs, promotionalEmails: checked })
                                                }
                                            />
                                        </div>

                                        <Button
                                            onClick={handleSaveNotifications}
                                            disabled={isSaving}
                                            className="w-full bg-[#15803d] hover:bg-[#166534]"
                                        >
                                            <Save className="h-4 w-4 mr-2" />
                                            {isSaving ? "Salvando..." : "Salvar Preferências"}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="privacy" className="mt-0">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-[#15803d] flex items-center gap-2">
                                            <Eye size={20} />
                                            Configurações de Privacidade
                                        </CardTitle>
                                        <CardDescription>Controle quem pode ver suas informações</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900 mb-1">Perfil Visível</div>
                                                <div className="text-sm text-gray-600">Permitir que enfermeiros vejam seu perfil</div>
                                            </div>
                                            <Switch
                                                checked={privacySettings.profileVisible}
                                                onCheckedChange={(checked) =>
                                                    setPrivacySettings({ ...privacySettings, profileVisible: checked })
                                                }
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900 mb-1">Mostrar Email</div>
                                                <div className="text-sm text-gray-600">Exibir seu email no perfil público</div>
                                            </div>
                                            <Switch
                                                checked={privacySettings.showEmail}
                                                onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, showEmail: checked })}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900 mb-1">Mostrar Telefone</div>
                                                <div className="text-sm text-gray-600">Exibir seu telefone no perfil público</div>
                                            </div>
                                            <Switch
                                                checked={privacySettings.showPhone}
                                                onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, showPhone: checked })}
                                            />
                                        </div>

                                        <Button
                                            onClick={handleSavePrivacy}
                                            disabled={isSaving}
                                            className="w-full bg-[#15803d] hover:bg-[#166534]"
                                        >
                                            <Save className="h-4 w-4 mr-2" />
                                            {isSaving ? "Salvando..." : "Salvar Configurações"}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="account" className="mt-0">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-[#15803d] flex items-center gap-2">
                                            <History size={20} />
                                            Informações da Conta
                                        </CardTitle>
                                        <CardDescription>Detalhes sobre sua conta e atividade</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                            <Calendar size={20} className="text-[#15803d]" />
                                            <div className="flex-1">
                                                <div className="text-sm text-gray-600">Data de Cadastro</div>
                                                <div className="font-semibold text-gray-900">{formatDate(patient.created_at)}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                            <Calendar size={20} className="text-[#15803d]" />
                                            <div className="flex-1">
                                                <div className="text-sm text-gray-600">Última Atualização</div>
                                                <div className="font-semibold text-gray-900">{formatDate(patient.updated_at)}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                            <Shield size={20} className="text-[#15803d]" />
                                            <div className="flex-1">
                                                <div className="text-sm text-gray-600">Status da Conta</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge
                                                        variant={patient.hidden ? "secondary" : "default"}
                                                        className={patient.hidden ? "" : "bg-[#15803d]"}
                                                    >
                                                        {patient.hidden ? "Inativo" : "Ativo"}
                                                    </Badge>
                                                    {patient.first_access && (
                                                        <Badge variant="outline" className="border-amber-500 text-amber-500">
                                                            Primeiro Acesso
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <Separator />

                                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                            <h3 className="font-semibold text-red-900 mb-2">Zona de Perigo</h3>
                                            <p className="text-sm text-red-700 mb-4">
                                                Ações irreversíveis que afetam permanentemente sua conta
                                            </p>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" className="w-full" disabled={isSaving}>
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Desativar Conta
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Tem certeza que deseja desativar sua conta?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Esta ação não pode ser desfeita. Sua conta será permanentemente desativada e todos os seus
                                                            dados serão removidos do sistema.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={handleDeleteAccount}
                                                            className="bg-red-600 hover:bg-red-700"
                                                            disabled={isSaving}
                                                        >
                                                            {isSaving ? "Desativando..." : "Sim, desativar conta"}
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </div>
                    </div>
                </Tabs>
            </div>
        </div>
    )
}
