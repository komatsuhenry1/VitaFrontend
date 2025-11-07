"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/Header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
    History,
    Trash2,
    User,
    Lock,
    Bell,
    Eye,
    Calendar,
    Shield,
    Save,
    KeyRound,
    // --- MUDANÇA (1/6): Importar novos ícones ---
    CreditCard,
    ExternalLink,
} from "lucide-react"
import { toast } from "sonner"
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
// --- MUDANÇA (2/6): Lembre-se de atualizar seu tipo NurseProfile ---
// No arquivo @/types/nurse-profile.ts, adicione:
// stripe_account_id?: string
import type { NurseProfile } from "@/types/nurse-profile"
import { Footer } from "@/components/Footer"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api/v1"

export default function NurseMyProfile() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [nurseData, setNurseData] = useState<NurseProfile | null>(null)
    const [activeTab, setActiveTab] = useState("profile")

    const [deletePassword, setDeletePassword] = useState("")
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    const [originalTwoFactor, setOriginalTwoFactor] = useState(false)

    // --- MUDANÇA (3/6): Novo estado para o loading do botão Stripe ---
    const [isSettingUpPayment, setIsSettingUpPayment] = useState(false)

    const [editForm, setEditForm] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        department: "",
        specialization: "",
        bio: "",
        years_experience: 0,
    })

    const [securityForm, setSecurityForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        twoFactorEnabled: false,
    })

    // ... (outros estados 'notificationPrefs' e 'privacySettings' sem mudança) ...
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
        const fetchNurseData = async () => {
            try {
                setIsLoading(true)
                const token = localStorage.getItem("token")
                if (!token) {
                    toast.error("Usuário não encontrado. Faça login novamente.")
                    router.push("/login")
                    return
                }

                const response = await fetch(`${API_BASE_URL}/nurse/my-profile`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                })

                if (!response.ok) {
                    throw new Error("Erro ao carregar perfil")
                }

                const result = await response.json()

                if (result.success && result.data) {
                    // setNurseData irá conter o nurseData completo, 
                    // incluindo o novo campo 'stripe_account_id'
                    setNurseData(result.data)

                    setEditForm({
                        name: result.data.name || "",
                        email: result.data.email || "",
                        phone: result.data.phone || "",
                        address: result.data.location || "",
                        department: result.data.department || "",
                        specialization: result.data.specialization || "",
                        bio: result.data.bio || "",
                        years_experience: result.data.experience || 0,
                    })

                    const currentTwoFactor = result.data.two_factor || false
                    setSecurityForm((prev) => ({
                        ...prev,
                        twoFactorEnabled: currentTwoFactor,
                    }))
                    setOriginalTwoFactor(currentTwoFactor)

                } else {
                    throw new Error(result.message || "Erro ao carregar dados")
                }
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Erro ao carregar perfil")
            } finally {
                setIsLoading(false)
            }
        }

        fetchNurseData()
    }, [router])

    const handleSaveProfile = async () => {
        // ... (código da função sem alteração) ...
        try {
            setIsSaving(true)

            const response = await fetch(`${API_BASE_URL}/nurse/update`, {
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

                if (nurseData) {
                    setNurseData({
                        ...nurseData,
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
        // ... (código da função sem alteração) ...
        // 1. Verificar o que realmente mudou
        const passwordChanged = securityForm.newPassword !== ""
        const twoFactorChanged = securityForm.twoFactorEnabled !== originalTwoFactor

        if (!passwordChanged && !twoFactorChanged) {
            toast.info("Nenhuma alteração detectada.")
            return
        }

        // 2. Senha atual é sempre necessária para qualquer alteração de segurança
        if (!securityForm.currentPassword) {
            toast.error("Digite sua senha atual para salvar as alterações.")
            return
        }

        // 3. Validar nova senha APENAS se ela foi preenchida
        if (passwordChanged) {
            if (securityForm.newPassword !== securityForm.confirmPassword) {
                toast.error("As senhas não coincidem")
                return
            }
            if (securityForm.newPassword.length < 6) {
                toast.error("A nova senha deve ter pelo menos 6 caracteres")
                return
            }
        }

        try {
            setIsSaving(true)

            const response = await fetch(`${API_BASE_URL}/auth/logged/password`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    password: securityForm.currentPassword,
                    new_password: securityForm.newPassword, // O backend agora sabe lidar se isso for ""
                    two_fa: securityForm.twoFactorEnabled,
                }),
            })

            console.log(response)

            const result = await response.json()
            console.log(result)

            if (response.ok && result.success) {
                // 4. Lógica de sucesso condicional
                if (passwordChanged) {
                    // Se a senha mudou, deslogue
                    toast.success("Senha atualizada! Faça login novamente.")
                    localStorage.removeItem("token")
                    localStorage.removeItem("user")
                    router.push("/login")
                } else {
                    // Se APENAS o 2FA mudou, mostre sucesso e fique na página
                    toast.success("Configuração de dois fatores atualizada!")

                    // Atualize o "estado original" para o novo estado
                    setOriginalTwoFactor(securityForm.twoFactorEnabled)

                    // Limpe os campos de senha por segurança
                    setSecurityForm((prev) => ({
                        ...prev,
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: "",
                    }))
                }
            } else {
                throw new Error(result.message || "Erro ao atualizar segurança")
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erro ao atualizar configurações de segurança")
        } finally {
            setIsSaving(false)
        }
    }

    // --- MUDANÇA (4/6): Nova função para o Onboarding do Stripe ---
    const handleSetupPayments = async () => {
        try {
            setIsSettingUpPayment(true)
            const token = localStorage.getItem("token")
            if (!token) {
                toast.error("Sessão expirada. Faça login novamente.")
                setIsSettingUpPayment(false)
                return
            }

            // Chama o novo endpoint do backend
            const response = await fetch(`${API_BASE_URL}/nurse/stripe-onboarding`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            })

            const result = await response.json()

            // O backend retorna { success: true, data: { url: "..." } }
            if (response.ok && result.success && result.data.url) {
                toast.loading("Redirecionando para o portal seguro do Stripe...")
                // Redireciona o usuário para o formulário do Stripe
                window.location.href = result.data.url
            } else {
                throw new Error(result.message || "Erro ao iniciar configuração de pagamentos")
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erro ao conectar com Stripe")
            setIsSettingUpPayment(false)
        }
        // O finally não é necessário aqui, pois o 'loading' só deve parar
        // se houver erro. Se houver sucesso, a página será redirecionada.
    }
    // --- FIM DA NOVA FUNÇÃO ---

    const handleSaveNotifications = async () => {
        // ... (código da função sem alteração) ...
        try {
            setIsSaving(true)

            const response = await fetch(`${API_BASE_URL}/nurse/update`, {
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
        // ... (código da função sem alteração) ...
        try {
            setIsSaving(true)

            const response = await fetch(`${API_BASE_URL}/nurse/update`, {
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
        // ... (código da função sem alteração) ...
        if (!deletePassword) {
            toast.error("Por favor, digite sua senha para confirmar")
            return
        }

        try {
            setIsSaving(true)

            const response = await fetch(`${API_BASE_URL}/nurse/delete`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    password: deletePassword,
                }),
            })

            const result = await response.json()

            if (response.ok && result.success) {
                toast.success(result.message || "Conta desativada com sucesso!")
                localStorage.removeItem("user")
                localStorage.removeItem("token")
                setIsDeleteDialogOpen(false)
                setDeletePassword("")
                router.push("/login")
            } else {
                throw new Error("Erro ao desativar conta, tente novamente.")
            }
        } catch (err) {
            toast.error("Credenciais inválidas, tente novamente.")
        } finally {
            setIsSaving(false)
        }
    }

    const formatDate = (dateString?: string) => {
        // ... (código da função sem alteração) ...
        if (!dateString) return "N/A"
        const date = new Date(dateString)
        return date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        })
    }

    const formatPhone = (phone: string) => {
        // ... (código da função sem alteração) ...
        if (!phone) return "N/A"
        // Este regex formata (XX) XXXXX-XXXX
        return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
    }

    if (isLoading) {
        // ... (JSX de loading sem alteração) ...
        return (
            <div className="min-h-screen bg-gray-50">
                <Header />
                <div className="flex justify-center items-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="w-10 h-10 border-4 border-gray-200 border-t-[#15803d] rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-600">Carregando seu perfil...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (!nurseData) {
        // ... (JSX de erro sem alteração) ...
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
                        <div className="md:col-span-1">
                            <Card>
                                <CardContent className="p-4">
                                    {/* ... (JSX do Avatar e Nome sem alteração) ... */}
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
                                        {/* --- MUDANÇA (5/6): Adicionar o botão "Pagamentos" no menu --- */}
                                        <TabsTrigger
                                            value="payments"
                                            className="w-full justify-start data-[state=active]:bg-[#15803d] data-[state=active]:text-white"
                                        >
                                            <CreditCard className="h-4 w-4 mr-2" />
                                            Pagamentos
                                        </TabsTrigger>
                                        {/* --- FIM DA MUDANÇA --- */}
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
                            {/* Profile Tab */}
                            <TabsContent value="profile" className="mt-0 space-y-6">
                                {/* ... (JSX da aba "Perfil" sem alteração) ... */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-[#15803d] flex items-center gap-2">
                                            <User size={20} />
                                            Informações Pessoais
                                        </CardTitle>
                                        <CardDescription>Atualize suas informações de contato e profissionais</CardDescription>
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
                                            // ⚠️ Lembre-se, a API não está preenchendo isso!
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="phone">Telefone</Label>
                                            <Input
                                                id="phone"
                                                value={editForm.phone}
                                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                                className="mt-1"
                                                placeholder="(XX) XXXXX-XXXX"
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

                                        <div>
                                            <Label htmlFor="department">Departamento</Label>
                                            <Input
                                                id="department"
                                                value={editForm.department}
                                                onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                                                className="mt-1"
                                                placeholder="Ex: UTI, Emergência, Pediatria"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="specialization">Especialização</Label>
                                            <Input
                                                id="specialization"
                                                value={editForm.specialization}
                                                onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                                                className="mt-1"
                                                placeholder="Ex: Enfermagem Intensiva, Cardiologia"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="years_experience">Anos de Experiência</Label>
                                            <Input
                                                id="years_experience"
                                                type="number"
                                                value={editForm.years_experience}
                                                onChange={(e) =>
                                                    setEditForm({ ...editForm, years_experience: Number.parseInt(e.target.value) || 0 })
                                                }
                                                className="mt-1"
                                                min="0"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="bio">Biografia</Label>
                                            <Textarea
                                                id="bio"
                                                value={editForm.bio}
                                                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                                className="mt-1"
                                                rows={4}
                                                placeholder="Conte um pouco sobre sua experiência profissional..."
                                            />
                                        </div>

                                        <Separator />

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="p-4 bg-gray-50 rounded-lg">
                                                <div className="text-sm text-gray-600 mb-1">COREN</div>
                                                <div className="font-semibold text-gray-900">{nurseData.coren || "N/A"}</div>
                                            </div>
                                            <div className="p-4 bg-gray-50 rounded-lg">
                                                <div className="text-sm text-gray-600 mb-1">Função</div>
                                                <div className="font-semibold text-gray-900">Enfermeiro(a)</div>
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

                            {/* Security Tab */}
                            <TabsContent value="security" className="mt-0 space-y-6">
                                {/* ... (JSX da aba "Segurança" sem alteração) ... */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-[#15803d] flex items-center gap-2">
                                            <KeyRound size={20} />
                                            Alterar Senha
                                        </CardTitle>
                                        <CardDescription>
                                            Atualize sua senha para manter sua conta segura. Deixe em branco para não alterar.
                                        </CardDescription>
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

                            {/* --- MUDANÇA (6/6): Adicionar o conteúdo da aba "Pagamentos" --- */}
                            <TabsContent value="payments" className="mt-0">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-[#15803d] flex items-center gap-2">
                                            <CreditCard size={20} />
                                            Configuração de Pagamentos
                                        </CardTitle>
                                        <CardDescription>
                                            Configure sua conta Stripe para receber pagamentos pelas visitas realizadas.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="p-6 bg-gray-50 rounded-lg border">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <h3 className="text-lg font-semibold">Stripe Connect</h3>
                                                    <p className="text-sm text-gray-600">
                                                        Conecte sua conta para receber repasses de forma segura.
                                                    </p>
                                                </div>
                                                {/* Renderização condicional baseada no 'stripe_account_id'.
                                                    Certifique-se que sua API /nurse/my-profile está retornando este campo.
                                                */}
                                                {nurseData.stripe_account_id ? (
                                                    <Badge variant="default" className="bg-green-600 text-base mt-2 sm:mt-0">
                                                        Conta Conectada
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="destructive" className="text-base mt-2 sm:mt-0">
                                                        Não Conectado
                                                    </Badge>
                                                )}
                                            </div>

                                            <Separator className="my-4" />

                                            {nurseData.stripe_account_id ? (
                                                <div>
                                                    <p className="text-sm text-gray-700 mb-4">
                                                        Sua conta de pagamentos está configurada. Você pode gerenciar seus
                                                        dados bancários e repasses a qualquer momento acessando o portal seguro do Stripe.
                                                    </p>
                                                    <Button
                                                        onClick={handleSetupPayments}
                                                        disabled={isSettingUpPayment}
                                                        className="w-full bg-[#15803d] hover:bg-[#166534]"
                                                    >
                                                        <ExternalLink className="h-4 w-4 mr-2" />
                                                        {isSettingUpPayment ? "Carregando Portal..." : "Gerenciar Conta no Stripe"}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div>
                                                    <p className="text-sm text-gray-700 mb-4">
                                                        Para receber pagamentos dos pacientes, você precisa configurar uma conta
                                                        Stripe Express. Clique no botão abaixo para ser redirecionado
                                                        para o portal seguro do Stripe e preencher seus dados (CPF, conta bancária, etc).
                                                    </p>
                                                    <Button
                                                        onClick={handleSetupPayments}
                                                        disabled={isSettingUpPayment}
                                                        className="w-full bg-[#15803d] hover:bg-[#166534]"
                                                    >
                                                        <ExternalLink className="h-4 w-4 mr-2" />
                                                        {isSettingUpPayment ? "Carregando..." : "Configurar Conta de Pagamento"}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            {/* --- FIM DA MUDANÇA --- */}

                            {/* Notifications Tab */}
                            <TabsContent value="notifications" className="mt-0">
                                {/* ... (JSX da aba "Notificações" sem alteração) ... */}
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

                            {/* Privacy Tab */}
                            <TabsContent value="privacy" className="mt-0">
                                {/* ... (JSX da aba "Privacidade" sem alteração) ... */}
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

                            {/* Account Tab */}
                            <TabsContent value="account" className="mt-0">
                                {/* ... (JSX da aba "Conta" sem alteração) ... */}
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
                                            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
                                                    <div className="py-4">
                                                        <Label htmlFor="delete-password" className="text-sm font-medium">
                                                            Digite sua senha para confirmar
                                                        </Label>
                                                        <Input
                                                            id="delete-password"
                                                            type="password"
                                                            placeholder="Sua senha"
                                                            value={deletePassword}
                                                            onChange={(e) => setDeletePassword(e.target.value)}
                                                            className="mt-2"
                                                            disabled={isSaving}
                                                        />
                                                    </div>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel
                                                            onClick={() => {
                                                                setDeletePassword("")
                                                            }}
                                                        >
                                                            Cancelar
                                                        </AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={handleDeleteAccount}
                                                            className="bg-red-600 hover:bg-red-700"
                                                            disabled={isSaving || !deletePassword}
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
            <Footer />
        </div>
    )
}