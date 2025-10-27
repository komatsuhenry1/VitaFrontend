"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/Header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { User, Bell, Lock, Loader2, Eye, History, Save, KeyRound, Trash2, Shield, Calendar } from "lucide-react"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
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

interface NurseProfile {
    id: string
    name: string
    email: string
    phone: string
    address: string
    coren: string
    years_experience: number
    department: string
    bio: string
    specialization: string
    created_at?: string
    updated_at?: string
    hidden?: boolean
    profile_image_id?: string
    experience?: number
    location?: string
}

export default function NurseMyProfile() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [nurseData, setNurseData] = useState<NurseProfile | null>(null)
    const [activeTab, setActiveTab] = useState("profile")

    // Profile form state
    const [profileForm, setProfileForm] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        coren: "",
        years_experience: 0,
        department: "",
        bio: "",
        specialization: "",
    })

    // Security form state
    const [securityForm, setSecurityForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        twoFactorEnabled: false,
    })

    // Notifications form state
    const [notificationsForm, setNotificationsForm] = useState({
        emailNotifications: true,
        smsNotifications: false,
        appointmentReminders: true,
        marketingEmails: false,
    })

    // Privacy form state
    const [privacyForm, setPrivacyForm] = useState({
        profileVisibility: true,
        showEmail: false,
        showPhone: true,
    })

    useEffect(() => {
        const fetchNurseProfile = async () => {
            try {
                const token = localStorage.getItem("token")
                const user = JSON.parse(localStorage.getItem("user") || "{}")

                console.log(user)

                const nurseId = user._id

                if (!user._id || !token) {
                    toast.error("Sessão inválida. Por favor, faça login novamente. NURSE ERROR")
                    localStorage.removeItem("token")
                    localStorage.removeItem("user")
                    router.push("/login")
                    return
                }

                const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/nurse/${nurseId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    cache: "no-store", 
                })

                if (response.ok) {
                    const result = await response.json()
                    const data: NurseProfile = result.data

                    console.log("[v0] Fetched nurse data:", data) 

                    setNurseData(data)

                    setProfileForm({
                        name: data.name || "",
                        email: user.email || "", // Email from localStorage since API doesn't return it
                        phone: data.phone || "", // Will be empty if API doesn't return it
                        address: data.location || "", // Map 'location' from API to 'address' in form
                        coren: data.coren || "", // Will be empty if API doesn't return it
                        years_experience: data.experience || 0, // Map 'experience' from API to 'years_experience'
                        department: data.department || "",
                        bio: data.bio || "",
                        specialization: data.specialization || "",
                    })

                    console.log("[v0] Updated profile form:", profileForm) // Debug log
                } else {
                    toast.error("Erro ao carregar perfil")
                }
            } catch (error) {
                console.error("Error fetching nurse profile:", error)
                toast.error("Erro ao carregar perfil")
            } finally {
                setIsLoading(false)
            }
        }

        fetchNurseProfile()
    }, [router]) // Only depend on router to fetch once on mount

    const handleSaveProfile = async () => {
        setIsSaving(true)
        try {
            const token = localStorage.getItem("token")
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/nurse/update`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: profileForm.name,
                    email: profileForm.email,
                    phone: profileForm.phone,
                    address: profileForm.address,
                    coren: profileForm.coren,
                    years_experience: profileForm.years_experience,
                    department: profileForm.department,
                    bio: profileForm.bio,
                    specialization: profileForm.specialization,
                }),
            })

            if (response.ok) {
                const result = await response.json()
                toast.success(result.message || "Perfil atualizado com sucesso!")

                const user = JSON.parse(localStorage.getItem("user") || "{}")
                user.name = profileForm.name
                user.email = profileForm.email
                localStorage.setItem("user", JSON.stringify(user))

                const updatedResponse = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/nurse/${user.id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    cache: "no-store",
                })

                if (updatedResponse.ok) {
                    const updatedResult = await updatedResponse.json()
                    setNurseData(updatedResult.data)
                }
            } else {
                toast.error("Erro ao atualizar perfil")
            }
        } catch (error) {
            console.error("Error updating profile:", error)
            toast.error("Erro ao atualizar perfil")
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
            toast.error("A nova senha deve ter pelo menos 6 caracteres")
            return
        }

        if (!securityForm.currentPassword) {
            toast.error("Digite sua senha atual")
            return
        }

        setIsSaving(true)
        try {
            const token = localStorage.getItem("token")
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/logged/password`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    password: securityForm.currentPassword,
                    new_password: securityForm.newPassword,
                    two_fa: securityForm.twoFactorEnabled,
                }),
            })

            if (response.ok) {
                toast.success("Configurações de segurança atualizadas! Faça login novamente.")
                localStorage.removeItem("token")
                localStorage.removeItem("user")
                router.push("/login")
            } else {
                const error = await response.json()
                toast.error(error.message || "Erro ao atualizar configurações de segurança")
            }
        } catch (error) {
            console.error("Error updating security:", error)
            toast.error("Erro ao atualizar configurações de segurança")
        } finally {
            setIsSaving(false)
        }
    }

    const handleSaveNotifications = async () => {
        setIsSaving(true)
        try {
            const token = localStorage.getItem("token")
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/nurse/update`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(notificationsForm),
            })

            if (response.ok) {
                toast.success("Preferências de notificação atualizadas!")
            } else {
                toast.error("Erro ao atualizar preferências")
            }
        } catch (error) {
            console.error("Error updating notifications:", error)
            toast.error("Erro ao atualizar preferências")
        } finally {
            setIsSaving(false)
        }
    }

    const handleSavePrivacy = async () => {
        setIsSaving(true)
        try {
            const token = localStorage.getItem("token")
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/nurse/update`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(privacyForm),
            })

            if (response.ok) {
                toast.success("Configurações de privacidade atualizadas!")
            } else {
                toast.error("Erro ao atualizar configurações")
            }
        } catch (error) {
            console.error("Error updating privacy:", error)
            toast.error("Erro ao atualizar configurações")
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeleteAccount = async () => {
        setIsSaving(true)
        try {
            const token = localStorage.getItem("token")
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/nurse/delete`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (response.ok) {
                toast.success("Conta desativada com sucesso")
                localStorage.removeItem("token")
                localStorage.removeItem("user")
                router.push("/")
            } else {
                toast.error("Erro ao desativar conta")
            }
        } catch (error) {
            console.error("Error deleting account:", error)
            toast.error("Erro ao desativar conta")
        } finally {
            setIsSaving(false)
        }
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return "N/A"
        const date = new Date(dateString)
        return date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        })
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
                    <Loader2 className="h-8 w-8 animate-spin text-[#15803d]" />
                </div>
            </div>
        )
    }

    if (!nurseData) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="container mx-auto px-4 py-8 text-center">
                    <h1 className="text-red-600 mb-4">Erro ao carregar perfil</h1>
                    <Button onClick={() => router.push("/nurse-dashboard")}>Voltar para Dashboard</Button>
                </div>
            </div>
        )
    }

    const avatarUrl = nurseData.profile_image_id
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/file/${nurseData.profile_image_id}`
        : undefined

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Meu Perfil</h1>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <div className="grid md:grid-cols-4 gap-6">
                        {/* Sidebar */}
                        <div className="md:col-span-1">
                            <Card>
                                <CardContent className="p-4">
                                    <div className="text-center mb-6 pt-2">
                                        <div className="w-24 h-24 mx-auto mb-3 rounded-full bg-[#15803d] text-white flex items-center justify-center text-2xl font-bold overflow-hidden">
                                            {avatarUrl ? (
                                                <img
                                                    src={avatarUrl || "/placeholder.svg"}
                                                    alt={nurseData.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                nurseData.name
                                                    .split(" ")
                                                    .map((n) => n[0])
                                                    .slice(0, 2)
                                                    .join("")
                                                    .toUpperCase()
                                            )}
                                        </div>
                                        <h2 className="text-lg font-bold text-gray-900">{nurseData.name}</h2>
                                        <p className="text-sm text-[#15803d]">Enfermeiro(a)</p>
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

                        {/* Content */}
                        <div className="md:col-span-3">
                            {/* Profile Tab */}
                            <TabsContent value="profile" className="mt-0 space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-[#15803d] flex items-center gap-2">
                                            <User size={20} />
                                            Informações Pessoais
                                        </CardTitle>
                                        <CardDescription>Atualize suas informações profissionais</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Nome Completo</Label>
                                                <Input
                                                    id="name"
                                                    value={profileForm.name}
                                                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={profileForm.email}
                                                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="phone">Telefone</Label>
                                                <Input
                                                    id="phone"
                                                    value={profileForm.phone}
                                                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                                    placeholder="Digite seu telefone"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="license">COREN</Label>
                                                <Input
                                                    id="license"
                                                    value={profileForm.coren}
                                                    onChange={(e) => setProfileForm({ ...profileForm, coren: e.target.value })}
                                                    placeholder="Digite seu COREN"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="experience">Anos de Experiência</Label>
                                                <Input
                                                    id="experience"
                                                    type="number"
                                                    value={profileForm.years_experience}
                                                    onChange={(e) =>
                                                        setProfileForm({
                                                            ...profileForm,
                                                            years_experience: Number.parseInt(e.target.value) || 0,
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="department">Departamento</Label>
                                                <Input
                                                    id="department"
                                                    value={profileForm.department}
                                                    onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="specialization">Especialização</Label>
                                                <Input
                                                    id="specialization"
                                                    value={profileForm.specialization}
                                                    onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="address">Endereço</Label>
                                            <Input
                                                id="address"
                                                value={profileForm.address}
                                                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="bio">Biografia Profissional</Label>
                                            <Textarea
                                                id="bio"
                                                rows={4}
                                                value={profileForm.bio}
                                                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                                                placeholder="Conte um pouco sobre sua experiência profissional..."
                                            />
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

                            {/* Security Tab */}
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

                            {/* Notifications Tab */}
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
                                                checked={notificationsForm.emailNotifications}
                                                onCheckedChange={(checked) =>
                                                    setNotificationsForm({ ...notificationsForm, emailNotifications: checked })
                                                }
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900 mb-1">Notificações por SMS</div>
                                                <div className="text-sm text-gray-600">Receba lembretes por mensagem de texto</div>
                                            </div>
                                            <Switch
                                                checked={notificationsForm.smsNotifications}
                                                onCheckedChange={(checked) =>
                                                    setNotificationsForm({ ...notificationsForm, smsNotifications: checked })
                                                }
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900 mb-1">Lembretes de Visitas</div>
                                                <div className="text-sm text-gray-600">Receba lembretes antes das suas visitas</div>
                                            </div>
                                            <Switch
                                                checked={notificationsForm.appointmentReminders}
                                                onCheckedChange={(checked) =>
                                                    setNotificationsForm({ ...notificationsForm, appointmentReminders: checked })
                                                }
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900 mb-1">Emails Promocionais</div>
                                                <div className="text-sm text-gray-600">Receba ofertas e novidades</div>
                                            </div>
                                            <Switch
                                                checked={notificationsForm.marketingEmails}
                                                onCheckedChange={(checked) =>
                                                    setNotificationsForm({ ...notificationsForm, marketingEmails: checked })
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

                            {/* Privacy Tab */}
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
                                                <div className="text-sm text-gray-600">Permitir que pacientes vejam seu perfil</div>
                                            </div>
                                            <Switch
                                                checked={privacyForm.profileVisibility}
                                                onCheckedChange={(checked) => setPrivacyForm({ ...privacyForm, profileVisibility: checked })}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900 mb-1">Mostrar Email</div>
                                                <div className="text-sm text-gray-600">Exibir seu email no perfil público</div>
                                            </div>
                                            <Switch
                                                checked={privacyForm.showEmail}
                                                onCheckedChange={(checked) => setPrivacyForm({ ...privacyForm, showEmail: checked })}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900 mb-1">Mostrar Telefone</div>
                                                <div className="text-sm text-gray-600">Exibir seu telefone no perfil público</div>
                                            </div>
                                            <Switch
                                                checked={privacyForm.showPhone}
                                                onCheckedChange={(checked) => setPrivacyForm({ ...privacyForm, showPhone: checked })}
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

                            {/* Account Tab */}
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
                                                <div className="font-semibold text-gray-900">{formatDate(nurseData.created_at)}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                            <Calendar size={20} className="text-[#15803d]" />
                                            <div className="flex-1">
                                                <div className="text-sm text-gray-600">Última Atualização</div>
                                                <div className="font-semibold text-gray-900">{formatDate(nurseData.updated_at)}</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                            <Shield size={20} className="text-[#15803d]" />
                                            <div className="flex-1">
                                                <div className="text-sm text-gray-600">Status da Conta</div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge
                                                        variant={nurseData.hidden ? "secondary" : "default"}
                                                        className={nurseData.hidden ? "" : "bg-[#15803d]"}
                                                    >
                                                        {nurseData.hidden ? "Inativo" : "Ativo"}
                                                    </Badge>
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
