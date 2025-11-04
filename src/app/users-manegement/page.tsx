"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/Header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Users, UserCog, Edit, Trash2, Mail, Phone, Calendar } from "lucide-react"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Footer } from "@/components/Footer"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api/v1"

// Interfaces de dados
interface User {
    id: string
    name: string
    email: string
    phone: string
    address: string
    cpf: string
    password: string
    hidden: boolean
    role: string
    first_access: boolean
}

interface Nurse {
    id: string
    name: string
    email: string
    phone: string
    address: string
    cpf: string
    pix_key: string
    password: string
    verification_seal: boolean
    coren: string
    specialization: string
    shift: string
    department: string
    years_experience: number
    price: number
    bio: string
    hidden: boolean
    role: string
    online: boolean
    first_access: boolean
    start_time: string
    end_time: string
}

interface Visit {
    id: string
    status: string
    patient_id: string
    patient_name: string
    patient_email: string
    description: string
    reason: string
    cancel_reason: string
    nurse_id: string
    nurse_name: string
    value: number
    visit_type: string
    visit_date: string
}

interface AdminData {
    users: User[]
    nurses: Nurse[]
    visits: Visit[]
}

interface ApiResponse {
    data: AdminData
    message: string
    success: boolean
}

// [MUDANÇA] Criado um tipo específico para o formulário de edição.
// Ele combina todas as propriedades de User, Nurse e Visit como opcionais.
type EditFormState = Partial<User> & Partial<Nurse> & Partial<Visit>

export default function AdminUsersPage() {
    const [adminData, setAdminData] = useState<AdminData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Edit dialog states
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [editingUser, setEditingUser] = useState<User | Nurse | Visit | null>(null)
    const [editingType, setEditingType] = useState<"user" | "nurse" | "visit">("user")
    const [isUpdating, setIsUpdating] = useState(false)

    // Delete dialog states
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [deletingType, setDeletingType] = useState<"user" | "nurse" | "visit">("user")
    const [isDeleting, setIsDeleting] = useState(false)

    // [MUDANÇA] O 'any' foi substituído pelo tipo 'EditFormState' para garantir a segurança de tipos.
    const [editForm, setEditForm] = useState<EditFormState>({
        name: "",
        email: "",
        phone: "",
        address: "",
        cpf: "",
        password: "",
        hidden: false,
        first_access: false,
    })

    useEffect(() => {
        fetchAdminData()
    }, [])

    const fetchAdminData = async () => {
        try {
            setIsLoading(true)
            setError(null)
            const response = await fetch(`${API_BASE_URL}/admin/users`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            })

            if (!response.ok) {
                throw new Error("Erro ao carregar dados dos usuários")
            }

            const apiResponse: ApiResponse = await response.json()
            if (apiResponse.success && apiResponse.data) {
                setAdminData(apiResponse.data)
            } else {
                throw new Error(apiResponse.message || "Erro ao carregar dados")
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro desconhecido")
        } finally {
            setIsLoading(false)
        }
    }

    const openEditDialog = (item: User | Nurse | Visit, type: "user" | "nurse" | "visit") => {
        console.log("[v0] Opening edit dialog for:", type, item)
        console.log("[v0] Item ID:", item.id)

        setEditingUser(item)
        setEditingType(type)

        if (type === "visit") {
            const visit = item as Visit
            setEditForm({
                status: visit.status,
                patient_id: visit.patient_id,
                patient_name: visit.patient_name,
                patient_email: visit.patient_email,
                description: visit.description,
                reason: visit.reason,
                cancel_reason: visit.cancel_reason,
                nurse_id: visit.nurse_id,
                nurse_name: visit.nurse_name,
                value: visit.value,
                visit_type: visit.visit_type,
                visit_date: visit.visit_date,
            })
        } else if (type === "nurse") {
            const nurse = item as Nurse
            setEditForm({
                name: nurse.name,
                email: nurse.email,
                phone: nurse.phone,
                address: nurse.address,
                cpf: nurse.cpf,
                pix_key: nurse.pix_key,
                password: "",
                verification_seal: nurse.verification_seal,
                coren: nurse.coren,
                specialization: nurse.specialization,
                shift: nurse.shift,
                department: nurse.department,
                years_experience: nurse.years_experience,
                price: nurse.price,
                bio: nurse.bio,
                hidden: nurse.hidden,
                first_access: nurse.first_access,
                start_time: nurse.start_time,
                end_time: nurse.end_time,
            })
        } else {
            const patient = item as User
            setEditForm({
                name: patient.name,
                email: patient.email,
                phone: patient.phone,
                address: patient.address,
                cpf: patient.cpf,
                password: "",
                hidden: patient.hidden,
                first_access: patient.first_access,
            })
        }

        setShowEditDialog(true)
    }

    const handleUpdate = async () => {
        if (!editingUser) return

        const updateData = { ...editForm }
        if (!updateData.password || updateData.password.trim() === "") {
            delete updateData.password
        }

        console.log("[v0] Updating item with ID:", editingUser.id)
        console.log("[v0] Update data:", updateData)

        const endpoint =
            editingType === "visit"
                ? `${API_BASE_URL}/admin/visit/${editingUser.id}`
                : `${API_BASE_URL}/admin/user/${editingUser.id}`

        setIsUpdating(true)
        try {
            const response = await fetch(endpoint, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updateData),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || `Erro ao atualizar ${editingType}`)
            }

            const apiResponse = await response.json()

            if (apiResponse.success) {
                await fetchAdminData()
                toast.success("Item atualizado com sucesso!")
                setShowEditDialog(false)
                setEditingUser(null)
            } else {
                throw new Error(apiResponse.message || "Erro ao atualizar")
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erro ao atualizar")
        } finally {
            setIsUpdating(false)
        }
    }

    const openDeleteDialog = (id: string, type: "user" | "nurse" | "visit") => {
        setDeletingId(id)
        setDeletingType(type)
        setShowDeleteDialog(true)
    }

    const handleDelete = async () => {
        if (!deletingId) return

        const endpoint =
            deletingType === "visit"
                ? `${API_BASE_URL}/admin/visit/${deletingId}`
                : `${API_BASE_URL}/admin/user/${deletingId}`

        setIsDeleting(true)
        try {
            const response = await fetch(endpoint, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || `Erro ao excluir ${deletingType}`)
            }

            const apiResponse = await response.json()
            if (apiResponse.success) {
                toast.success("Item excluído com sucesso!")
                fetchAdminData()
            } else {
                throw new Error(apiResponse.message || "Erro ao excluir")
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Erro ao excluir item.")
        } finally {
            setIsDeleting(false)
            setShowDeleteDialog(false)
            setDeletingId(null)
        }
    }

    const handleDeleteFromDialog = () => {
        if (editingUser) {
            setShowEditDialog(false)
            openDeleteDialog(editingUser.id, editingType)
        }
    }

    const formatDate = (dateString: string) => {
        if (!dateString) return "Data inválida"
        const date = new Date(dateString)
        return date.toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value || 0)
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white">
                <Header />
                <div className="flex justify-center items-center min-h-[calc(100vh-80px)]">
                    <Loader2 className="animate-spin text-[#15803d]" size={48} />
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white">
                <Header />
                <div className="flex flex-col justify-center items-center min-h-[calc(100vh-80px)] gap-4">
                    <p className="text-xl text-red-500">{error}</p>
                    <Button onClick={fetchAdminData} className="bg-[#15803d] text-white">
                        Tentar Novamente
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white">
            <Header />

            {/* Hero Section */}
            <section className="bg-gradient-to-r from-[#15803d] to-[#166534] text-white py-16 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-4xl font-bold mb-4">Gerenciamento de Usuários</h1>
                    <p className="text-xl opacity-90">Administre usuários, enfermeiros e visitas da plataforma.</p>
                </div>
            </section>

            {/* Content Section */}
            <section className="py-12 px-4 max-w-7xl mx-auto">
                <Tabs defaultValue="users" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="users" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Usuários ({adminData?.users?.length || 0})
                        </TabsTrigger>
                        <TabsTrigger value="nurses" className="flex items-center gap-2">
                            <UserCog className="h-4 w-4" />
                            Enfermeiros ({adminData?.nurses?.length || 0})
                        </TabsTrigger>
                        <TabsTrigger value="visits" className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Visitas ({adminData?.visits?.length || 0})
                        </TabsTrigger>
                    </TabsList>

                    {/* Users Tab */}
                    <TabsContent value="users">
                        <Card>
                            <CardHeader>
                                <CardTitle>Lista de Usuários</CardTitle>
                                <CardDescription>Gerencie os usuários cadastrados na plataforma.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {adminData?.users?.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>Nenhum usuário cadastrado.</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nome</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Telefone</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead className="text-right">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {adminData?.users?.map((user) => (
                                                <TableRow
                                                    key={user.id}
                                                    className="cursor-pointer hover:bg-muted/50"
                                                    onClick={() => openEditDialog(user, "user")}
                                                >
                                                    <TableCell className="font-medium">{user.name}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                                            {user.email}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                                            {user.phone}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{user.role}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="outline" size="sm" onClick={() => openEditDialog(user, "user")}>
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(user.id, "user")}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Nurses Tab */}
                    <TabsContent value="nurses">
                        <Card>
                            <CardHeader>
                                <CardTitle>Lista de Enfermeiros</CardTitle>
                                <CardDescription>Gerencie os enfermeiros cadastrados na plataforma</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {adminData?.nurses?.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <UserCog className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>Nenhum enfermeiro cadastrado</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nome</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Telefone</TableHead>
                                                <TableHead>Especialização</TableHead>
                                                <TableHead className="text-right">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {adminData?.nurses?.map((nurse) => (
                                                <TableRow
                                                    key={nurse.id}
                                                    className="cursor-pointer hover:bg-muted/50"
                                                    onClick={() => openEditDialog(nurse, "nurse")}
                                                >
                                                    <TableCell className="font-medium">{nurse.name}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                                            {nurse.email}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                                            {nurse.phone}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary">{nurse.specialization}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="outline" size="sm" onClick={() => openEditDialog(nurse, "nurse")}>
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => openDeleteDialog(nurse.id, "nurse")}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Visits Tab */}
                    <TabsContent value="visits">
                        <Card>
                            <CardHeader>
                                <CardTitle>Lista de Visitas</CardTitle>
                                <CardDescription>Gerencie as visitas agendadas na plataforma</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {adminData?.visits?.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>Nenhuma visita cadastrada</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Paciente</TableHead>
                                                <TableHead>Enfermeiro</TableHead>
                                                <TableHead>Data</TableHead>
                                                <TableHead>Valor</TableHead>
                                                <TableHead className="text-right">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {adminData?.visits?.map((visit) => (
                                                <TableRow
                                                    key={visit.id}
                                                    className="cursor-pointer hover:bg-muted/50"
                                                    onClick={() => openEditDialog(visit, "visit")}
                                                >
                                                    <TableCell>
                                                        <Badge
                                                            variant={
                                                                visit.status === "CONFIRMED"
                                                                    ? "default"
                                                                    : visit.status === "PENDING"
                                                                        ? "secondary"
                                                                        : "outline"
                                                            }
                                                        >
                                                            {visit.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-medium">{visit.patient_name}</TableCell>
                                                    <TableCell>{visit.nurse_name}</TableCell>
                                                    <TableCell>{formatDate(visit.visit_date)}</TableCell>
                                                    <TableCell>{formatCurrency(visit.value)}</TableCell>
                                                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="outline" size="sm" onClick={() => openEditDialog(visit, "visit")}>
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => openDeleteDialog(visit.id, "visit")}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </section>

            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            Editar {editingType === "visit" ? "Visita" : editingType === "nurse" ? "Enfermeiro" : "Usuário"}
                        </DialogTitle>
                        <DialogDescription>
                            Atualize as informações{" "}
                            {editingType === "visit" ? "da visita" : `do ${editingType === "nurse" ? "enfermeiro" : "usuário"}`}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {editingType === "visit" ? (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="edit-status">Status</Label>
                                        <Select
                                            value={editForm.status}
                                            onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                                        >
                                            <SelectTrigger id="edit-status">
                                                <SelectValue placeholder="Selecione o status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="PENDING">PENDING</SelectItem>
                                                <SelectItem value="CONFIRMED">CONFIRMED</SelectItem>
                                                <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                                                <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="edit-visit-type">Tipo de Visita</Label>
                                        <Select
                                            value={editForm.visit_type}
                                            onValueChange={(value) => setEditForm({ ...editForm, visit_type: value })}
                                        >
                                            <SelectTrigger id="edit-visit-type">
                                                <SelectValue placeholder="Selecione o tipo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="domiciliar">Domiciliar</SelectItem>
                                                <SelectItem value="hospital">Hospital</SelectItem>
                                                <SelectItem value="clinica">Clínica</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="edit-patient-name">Nome do Paciente</Label>
                                        <Input
                                            id="edit-patient-name"
                                            value={editForm.patient_name || ""}
                                            onChange={(e) => setEditForm({ ...editForm, patient_name: e.target.value })}
                                            disabled
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="edit-nurse-name">Nome do Enfermeiro</Label>
                                        <Input
                                            id="edit-nurse-name"
                                            value={editForm.nurse_name || ""}
                                            onChange={(e) => setEditForm({ ...editForm, nurse_name: e.target.value })}
                                            disabled
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="edit-visit-date">Data da Visita</Label>
                                        <Input
                                            id="edit-visit-date"
                                            type="datetime-local"
                                            value={editForm.visit_date ? new Date(editForm.visit_date).toISOString().slice(0, 16) : ""}
                                            onChange={(e) => setEditForm({ ...editForm, visit_date: new Date(e.target.value).toISOString() })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="edit-value">Valor</Label>
                                        <Input
                                            id="edit-value"
                                            type="number"
                                            value={editForm.value || 0}
                                            onChange={(e) => setEditForm({ ...editForm, value: Number.parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="edit-description">Descrição</Label>
                                    <Textarea
                                        id="edit-description"
                                        value={editForm.description || ""}
                                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="edit-reason">Motivo</Label>
                                    <Textarea
                                        id="edit-reason"
                                        value={editForm.reason || ""}
                                        onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                                        rows={2}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="edit-cancel-reason">Motivo do Cancelamento</Label>
                                    <Textarea
                                        id="edit-cancel-reason"
                                        value={editForm.cancel_reason || ""}
                                        onChange={(e) => setEditForm({ ...editForm, cancel_reason: e.target.value })}
                                        rows={2}
                                        placeholder="Deixe em branco se não cancelado"
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="edit-name">Nome</Label>
                                        <Input
                                            id="edit-name"
                                            value={editForm.name || ""}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="edit-email">Email</Label>
                                        <Input
                                            id="edit-email"
                                            type="email"
                                            value={editForm.email || ""}
                                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="edit-phone">Telefone</Label>
                                        <Input
                                            id="edit-phone"
                                            value={editForm.phone || ""}
                                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="edit-cpf">CPF</Label>
                                        <Input
                                            id="edit-cpf"
                                            value={editForm.cpf || ""}
                                            onChange={(e) => setEditForm({ ...editForm, cpf: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="edit-address">Endereço</Label>
                                    <Input
                                        id="edit-address"
                                        value={editForm.address || ""}
                                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="edit-password">Senha (deixe em branco para não alterar)</Label>
                                    <Input
                                        id="edit-password"
                                        type="password"
                                        value={editForm.password || ""}
                                        onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                        placeholder="Digite uma nova senha ou deixe em branco"
                                    />
                                </div>
                                {editingType === "nurse" && (
                                    <>
                                        <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={2}
                                                            stroke="white"
                                                            className="w-6 h-6"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.745 3.745 0 013.296-1.043A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z"
                                                            />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="edit-verification" className="text-base font-semibold text-green-900">
                                                            Selo de Verificação
                                                        </Label>
                                                        <p className="text-sm text-green-700">
                                                            Autorizar este enfermeiro como verificado na plataforma
                                                        </p>
                                                    </div>
                                                </div>
                                                <Checkbox
                                                    id="edit-verification"
                                                    checked={!!editForm.verification_seal}
                                                    onCheckedChange={(checked) => setEditForm({ ...editForm, verification_seal: !!checked })}
                                                    className="h-6 w-6"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="edit-license">COREN</Label>
                                                <Input
                                                    id="edit-license"
                                                    value={editForm.coren || ""}
                                                    onChange={(e) => setEditForm({ ...editForm, coren: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="edit-specialization">Especialização</Label>
                                                <Input
                                                    id="edit-specialization"
                                                    value={editForm.specialization || ""}
                                                    onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="edit-shift">Turno</Label>
                                                <Input
                                                    id="edit-shift"
                                                    value={editForm.shift || ""}
                                                    onChange={(e) => setEditForm({ ...editForm, shift: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="edit-department">Departamento</Label>
                                                <Input
                                                    id="edit-department"
                                                    value={editForm.department || ""}
                                                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <Label htmlFor="edit-experience">Anos de Experiência</Label>
                                                <Input
                                                    id="edit-experience"
                                                    type="number"
                                                    value={editForm.years_experience || 0}
                                                    onChange={(e) =>
                                                        setEditForm({ ...editForm, years_experience: Number.parseInt(e.target.value) || 0 })
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="edit-price">Preço</Label>
                                                <Input
                                                    id="edit-price"
                                                    type="number"
                                                    value={editForm.price || 0}
                                                    onChange={(e) => setEditForm({ ...editForm, price: Number.parseFloat(e.target.value) || 0 })}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="edit-pix">Chave PIX</Label>
                                                <Input
                                                    id="edit-pix"
                                                    value={editForm.pix_key || ""}
                                                    onChange={(e) => setEditForm({ ...editForm, pix_key: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="edit-start-time">Horário Início</Label>
                                                <Input
                                                    id="edit-start-time"
                                                    value={editForm.start_time || ""}
                                                    onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="edit-end-time">Horário Fim</Label>
                                                <Input
                                                    id="edit-end-time"
                                                    value={editForm.end_time || ""}
                                                    onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="edit-bio">Biografia</Label>
                                            <Textarea
                                                id="edit-bio"
                                                value={editForm.bio || ""}
                                                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                                rows={3}
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="edit-hidden"
                                            checked={!!editForm.hidden}
                                            onCheckedChange={(checked) => setEditForm({ ...editForm, hidden: !!checked })}
                                        />
                                        <Label htmlFor="edit-hidden">Oculto</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="edit-first-access"
                                            checked={!!editForm.first_access}
                                            onCheckedChange={(checked) => setEditForm({ ...editForm, first_access: !!checked })}
                                        />
                                        <Label htmlFor="edit-first-access">Primeiro Acesso</Label>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    <DialogFooter className="sm:justify-between items-center pt-4">
                        <Button variant="destructive" onClick={handleDeleteFromDialog}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleUpdate}
                                disabled={isUpdating}
                                className="bg-[#15803d] text-white hover:bg-[#166534]"
                            >
                                {isUpdating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    "Salvar Alterações"
                                )}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir este {deletingType === "visit" ? "item" : "usuário"}? Esta ação não pode
                            ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 text-white hover:bg-red-700"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Excluindo...
                                </>
                            ) : (
                                "Excluir"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <Footer />
        </div>
    )
}