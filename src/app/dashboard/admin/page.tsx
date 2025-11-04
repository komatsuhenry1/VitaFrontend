"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/Header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { toast } from "sonner"
import { Footer } from "@/components/Footer"

interface NurseInfo {
  id: string
  name: string
}

interface DashboardData {
  total_nurses: number
  total_patients: number
  visits_today: number
  pendent_approvations: number
  nurses_ids_pendent_approvations: NurseInfo[]
}

interface Document {
  name: string
  type: string
  download_url: string
  image_id: string
}

interface DocumentsResponse {
  data: Document[]
  message: string
  success: boolean
}

const heroStyle = {
  backgroundImage: `
    linear-gradient(rgba(21, 128, 61, 0.7), rgba(83, 83, 83, 0.8)),
    url('/dashboard_imagem.png')
  `,
  backgroundSize: "cover",
  backgroundPosition: "center",
  color: "white",
  padding: "5rem 0",
}

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [selectedNurseDocuments, setSelectedNurseDocuments] = useState<Document[]>([])
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [approvalLoading, setApprovalLoading] = useState(false)
  const [currentNurseId, setCurrentNurseId] = useState<string>("")
  const [currentNurseName, setCurrentNurseName] = useState<string>("")

  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [rejectionDetails, setRejectionDetails] = useState("")
  const [rejectionLoading, setRejectionLoading] = useState(false)

  const rejectionReasons = [
    "Documentos incompletos",
    "Documentos ilegíveis",
    "Certificação inválida",
    "Experiência insuficiente",
    "Informações inconsistentes",
    "Documentos vencidos",
    "Outros motivos",
  ]

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token")

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api/v1"

      const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      const result = await response.json()

      if (result.success) {
        setDashboardData(result.data)
      }
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error)
      toast.error("Erro ao carregar dados do dashboard. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const fetchNurseDocuments = async (nurse: NurseInfo) => {
    setDocumentsLoading(true)
    setCurrentNurseId(nurse.id)
    setCurrentNurseName(nurse.name)
    try {
      const token = localStorage.getItem("token")
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api/v1"
      const response = await fetch(`${API_BASE_URL}/admin/documents/${nurse.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      const result: DocumentsResponse = await response.json()

      if (result.success) {
        setSelectedNurseDocuments(result.data)
        setIsDocumentsModalOpen(true)
      }
    } catch (error) {
      console.error("Erro ao carregar documentos do enfermeiro:", error)
      toast.error("Erro ao carregar documentos do enfermeiro. Tente novamente.")
    } finally {
      setDocumentsLoading(false)
    }
  }

  const rejectNurse = async (nurseId: string, description: string, details?: string) => {
    setRejectionLoading(true)
    try {
      const token = localStorage.getItem("token")
      const fullDescription = details ? `${description} - ${details}` : description
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api/v1"


      const response = await fetch(`${API_BASE_URL}/admin/reject/${nurseId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description: fullDescription,
        }),
      })
      const result = await response.json()

      if (result.success) {
        await fetchDashboardData()
        setIsDocumentsModalOpen(false)
        setIsRejectionModalOpen(false)
        setRejectionReason("")
        setRejectionDetails("")
        toast.success("Enfermeiro rejeitado com sucesso! Email enviado para enfermeiro com nova solicitação de cadastro.")
      } else {
        toast.error("Erro ao rejeitar enfermeiro: " + result.message)
      }
    } catch (error) {
      console.error("Erro ao rejeitar enfermeiro:", error)
      toast.error("Erro ao rejeitar enfermeiro. Tente novamente.")
    } finally {
      setRejectionLoading(false)
    }
  }

  const handleRejectClick = (nurseId: string, nurseName: string) => {
    setCurrentNurseId(nurseId)
    setCurrentNurseName(nurseName)
    setIsRejectionModalOpen(true)
  }

  const handleConfirmRejection = () => {
    if (!rejectionReason) {
      toast.error("Por favor, selecione um motivo para a rejeição.")
      return
    }
    rejectNurse(currentNurseId, rejectionReason, rejectionDetails)
  }

  const approveNurse = async (nurseId: string) => {
    setApprovalLoading(true)
    try {
      const token = localStorage.getItem("token")

      const response = await fetch(`${API_BASE_URL}/admin/approve/${nurseId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      const result = await response.json()

      if (result.success) {
        setDashboardData((prevData) => ({
          ...prevData!,
          pendent_approvations: prevData!.pendent_approvations - 1,
          nurses_ids_pendent_approvations: prevData!.nurses_ids_pendent_approvations.filter(
            (nurse) => nurse.id !== nurseId,
          ),
        }))
        setIsDocumentsModalOpen(false)
        toast.success("Enfermeiro aprovado com sucesso!")
      } else {
        toast.error("Erro ao aprovar enfermeiro: " + result.message)
      }
    } catch (error) {
      console.error("Erro ao aprovar enfermeiro:", error)
      toast.error("Erro ao aprovar enfermeiro. Tente novamente.")
    } finally {
      setApprovalLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const [recentActivities] = useState([
    { id: 1, action: "Novo cadastro de paciente", user: "João Silva", time: "2 min atrás" },
    { id: 2, action: "Enfermeiro aprovado", user: "Ana Costa", time: "15 min atrás" },
    { id: 3, action: "Consulta agendada", user: "Pedro Lima", time: "1h atrás" },
    { id: 4, action: "Documento enviado", user: "Maria Santos", time: "2h atrás" },
  ])

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api/v1"

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
                    <p style={{ color: "#6b7280" }}>Carregando dados de dashboard...</p>
                </div>
            </div>
        </div>
    )
}

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <Header />

      {/* Hero Section */}
      <section style={heroStyle}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", marginBottom: "1rem" }}>Dashboard Administrativo</h1>
          <p style={{ fontSize: "1.25rem", opacity: 0.9 }}>
            Gerencie usuários, monitore atividades e acompanhe métricas da plataforma Vita
          </p>
        </div>
      </section>

      {/* Stats Cards */}
      <section style={{ padding: "2rem 1rem", maxWidth: "1200px", margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <Card>
            <CardHeader style={{ paddingBottom: "0.5rem" }}>
              <CardTitle style={{ fontSize: "0.875rem", color: "#6b7280" }}>Total de Enfermeiros</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#15803d" }}>
                {dashboardData?.total_nurses || 0}
              </div>
              <p style={{ fontSize: "0.875rem", color: "#10b981" }}>Enfermeiros cadastrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader style={{ paddingBottom: "0.5rem" }}>
              <CardTitle style={{ fontSize: "0.875rem", color: "#6b7280" }}>Total de Pacientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#15803d" }}>
                {dashboardData?.total_patients || 0}
              </div>
              <p style={{ fontSize: "0.875rem", color: "#10b981" }}>Pacientes cadastrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader style={{ paddingBottom: "0.5rem" }}>
              <CardTitle style={{ fontSize: "0.875rem", color: "#6b7280" }}>Consultas Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#15803d" }}>
                {dashboardData?.visits_today || 0}
              </div>
              <p style={{ fontSize: "0.875rem", color: "#10b981" }}>Atendimentos realizados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader style={{ paddingBottom: "0.5rem" }}>
              <CardTitle style={{ fontSize: "0.875rem", color: "#6b7280" }}>Aprovações Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#dc2626" }}>
                {dashboardData?.pendent_approvations || 0}
              </div>
              <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Requer atenção</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="pending" style={{ width: "100%" }}>
          <TabsList style={{ marginBottom: "1.5rem" }}>
            <TabsTrigger value="pending">Aprovações Pendentes</TabsTrigger>
            <TabsTrigger value="users">Gerenciar Usuários</TabsTrigger>
            <TabsTrigger value="activity">Atividades Recentes</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>

          {/* Pending Approvals Tab */}
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Enfermeiros Aguardando Aprovação</CardTitle>
                <CardDescription>Revise e aprove novos cadastros de enfermeiros</CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardData?.nurses_ids_pendent_approvations &&
                dashboardData.nurses_ids_pendent_approvations.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome do Enfermeiro</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dashboardData.nurses_ids_pendent_approvations.map((nurse) => (
                        <TableRow key={nurse.id}>
                          <TableCell style={{ fontWeight: "500" }}>{nurse.name}</TableCell>
                          <TableCell style={{ fontSize: "0.875rem", color: "#6b7280" }}>{nurse.id}</TableCell>
                          <TableCell>
                            <Badge variant="outline" style={{ color: "#f59e0b", borderColor: "#f59e0b" }}>
                              Pendente
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => fetchNurseDocuments(nurse)}
                                    disabled={documentsLoading}
                                  >
                                    {documentsLoading ? "Carregando..." : "Ver Documentos"}
                                  </Button>
                                </DialogTrigger>
                                <DialogContent style={{ maxWidth: "800px" }}>
                                  <DialogHeader>
                                    <DialogTitle>Documentos do Enfermeiro</DialogTitle>
                                    <DialogDescription>
                                      Revise os documentos enviados por {currentNurseName} (ID: {currentNurseId})
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div style={{ maxHeight: "500px", overflowY: "auto" }}>
                                    {selectedNurseDocuments.length > 0 ? (
                                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                        {selectedNurseDocuments.map((doc, index) => {
                                          const imageUrl = doc.image_id
                                            ? `${API_BASE_URL}/admin/file/${doc.image_id}`
                                            : "/placeholder-document.png"

                                          return (
                                            <Card key={index}>
                                              <CardContent style={{ padding: "1rem" }}>
                                                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                                                  <div style={{ flexShrink: 0 }}>
                                                    <Image
                                                      src={imageUrl || "/placeholder.svg"}
                                                      alt={doc.name}
                                                      width={500}
                                                      height={160}
                                                      style={{
                                                        borderRadius: "8px",
                                                        objectFit: "cover",
                                                        border: "1px solid #e5e7eb",
                                                      }}
                                                    />
                                                  </div>
                                                  <div style={{ flex: 1 }}>
                                                    <div style={{ marginBottom: "1rem" }}>
                                                      <h4 style={{ fontWeight: "600", marginBottom: "0.25rem" }}>
                                                        {doc.name}
                                                      </h4>
                                                    </div>
                                                    <Button
                                                      size="sm"
                                                      onClick={() => window.open(doc.download_url, "_blank")}
                                                      style={{ backgroundColor: "#15803d", color: "white" }}
                                                    >
                                                      Download
                                                    </Button>
                                                  </div>
                                                </div>
                                              </CardContent>
                                            </Card>
                                          )
                                        })}
                                      </div>
                                    ) : (
                                      <p>Nenhum documento encontrado.</p>
                                    )}
                                  </div>
                                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                                    <Button
                                      style={{ backgroundColor: "#15803d", color: "white", flex: 1 }}
                                      onClick={() => approveNurse(currentNurseId)}
                                      disabled={approvalLoading || rejectionLoading}
                                    >
                                      {approvalLoading ? "Aprovando..." : "Aprovar Enfermeiro"}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      style={{ color: "#dc2626", borderColor: "#dc2626", flex: 1 }}
                                      onClick={() => handleRejectClick(currentNurseId, currentNurseName)}
                                      disabled={approvalLoading || rejectionLoading}
                                    >   
                                      {rejectionLoading ? "Rejeitando..." : "Rejeitar"}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Button
                                size="sm"
                                style={{ backgroundColor: "#15803d", color: "white" }}
                                onClick={() => approveNurse(nurse.id)}
                                disabled={approvalLoading || rejectionLoading}
                              >
                                {approvalLoading ? "Aprovando..." : "Aprovar"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                style={{ color: "#dc2626", borderColor: "#dc2626" }}
                                onClick={() => handleRejectClick(nurse.id, nurse.name)}
                                disabled={approvalLoading || rejectionLoading}
                              >
                                {rejectionLoading ? "Rejeitando..." : "Rejeitar"}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p style={{ textAlign: "center", color: "#6b7280", padding: "2rem" }}>
                    Nenhum enfermeiro pendente de aprovação no momento.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Management Tab */}
          <TabsContent value="users">
            <div
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Gerenciar Enfermeiros</CardTitle>
                  <CardDescription>Visualizar, editar e desativar contas de enfermeiros</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button style={{ backgroundColor: "#15803d", color: "white", width: "100%" }}>
                    Ver Todos os Enfermeiros
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gerenciar Pacientes</CardTitle>
                  <CardDescription>Visualizar, editar e desativar contas de pacientes</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button style={{ backgroundColor: "#15803d", color: "white", width: "100%" }}>
                    Ver Todos os Pacientes
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Recent Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Atividades Recentes</CardTitle>
                <CardDescription>Acompanhe as últimas ações na plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ padding: "1rem" }}>
                  {recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "1rem",
                        borderBottom: "1px solid #e5e7eb",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <div>
                        <p style={{ fontWeight: "500", marginBottom: "0.25rem" }}>{activity.action}</p>
                        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>por {activity.user}</p>
                      </div>
                      <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>{activity.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <div
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Relatório de Usuários</CardTitle>
                  <CardDescription>Estatísticas detalhadas de cadastros e atividade</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button style={{ backgroundColor: "#15803d", color: "white", width: "100%" }}>Gerar Relatório</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Relatório de Consultas</CardTitle>
                  <CardDescription>Métricas de agendamentos e atendimentos</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button style={{ backgroundColor: "#15803d", color: "white", width: "100%" }}>Gerar Relatório</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Relatório Financeiro</CardTitle>
                  <CardDescription>Análise de receitas e transações</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button style={{ backgroundColor: "#15803d", color: "white", width: "100%" }}>Gerar Relatório</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      <AlertDialog open={isRejectionModalOpen} onOpenChange={setIsRejectionModalOpen}>
        <AlertDialogContent style={{ maxWidth: "500px" }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: "#dc2626", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              Confirmar Rejeição
            </AlertDialogTitle>
            <AlertDialogDescription style={{ fontSize: "1rem", lineHeight: "1.5" }}>
              Você está prestes a rejeitar o cadastro de <strong>{currentNurseName}</strong>.
              <br />
              Esta ação não pode ser desfeita. Por favor, selecione o motivo da rejeição.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div style={{ padding: "1rem 0", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <Label
                htmlFor="rejection-reason"
                style={{ fontSize: "0.875rem", fontWeight: "500", marginBottom: "0.5rem", display: "block" }}
              >
                Motivo da Rejeição *
              </Label>
              <Select value={rejectionReason} onValueChange={setRejectionReason}>
                <SelectTrigger id="rejection-reason">
                  <SelectValue placeholder="Selecione o motivo da rejeição" />
                </SelectTrigger>
                <SelectContent>
                  {rejectionReasons.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label
                htmlFor="rejection-details"
                style={{ fontSize: "0.875rem", fontWeight: "500", marginBottom: "0.5rem", display: "block" }}
              >
                Detalhes Adicionais (Opcional)
              </Label>
              <Textarea
                id="rejection-details"
                placeholder="Forneça mais detalhes sobre o motivo da rejeição..."
                value={rejectionDetails}
                onChange={(e) => setRejectionDetails(e.target.value)}
                style={{ minHeight: "80px", resize: "vertical" }}
              />
            </div>
          </div>

          <AlertDialogFooter style={{ gap: "0.5rem" }}>
            <AlertDialogCancel
              onClick={() => {
                setRejectionReason("")
                setRejectionDetails("")
              }}
              disabled={rejectionLoading}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRejection}
              disabled={rejectionLoading || !rejectionReason}
              style={{
                backgroundColor: "#dc2626",
                color: "white",
                opacity: rejectionLoading || !rejectionReason ? 0.5 : 1,
              }}
            >
              {rejectionLoading ? (
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span
                    style={{
                      width: "16px",
                      height: "16px",
                      border: "2px solid transparent",
                      borderTop: "2px solid white",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  ></span>
                  Rejeitando...
                </span>
              ) : (
                "Confirmar Rejeição"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default AdminDashboard
