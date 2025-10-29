"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
} from "@/components/ui/alert-dialog"
import { Menu, LogOut, User, UserPlus, Bell } from "lucide-react"

// --- 1. Importa o hook do Contexto WebSocket ---
import { useWebSocket } from '@/context/WebSocketContext'; // Ajuste o caminho se necessário
import { toast } from "sonner" // toast importado (já estava no outro arquivo, bom ter aqui)


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

interface UserData {
  name: string
  email: string
  role: "PATIENT" | "NURSE" | "ADMIN"
  // Ajuste: id pode vir como _id do localStorage
  _id?: string;
  id?: string; // Mantém 'id' caso venha assim
  profile_image_id?: string
}

// Configuração dos links (mantida)
const navLinksConfig = { /* ... */
  base: [
    { href: "/sobre", label: "Sobre" },
    { href: "/", label: "Início" },
    { href: "/servicos", label: "Serviços" },
    { href: "/contato", label: "Contato" },
  ],
  PATIENT: [
    { href: "/sobre", label: "Sobre" },
    { href: "/nurses-list", label: "Enfermeiros" },
    { href: "/visits/patient", label: "Visitas" },
    { href: "/chat/conversations", label: "Conversas" },
    { href: "/patient/map", label: "Mapa" },
  ],
  NURSE: [
    { href: "/sobre", label: "Sobre" },
    { href: "/dashboard/nurse", label: "Dashboard" },
    { href: "/visits/nurse", label: "Visitas" },
    { href: "/chat/conversations", label: "Conversas" },
    { href: "/availability", label: "Disponibilidade" },
  ],
  ADMIN: [
    { href: "/dashboard/admin", label: "Dashboard" },
    { href: "/users-manegement", label: "Painel Administrativo" },
  ],
}

export function Header() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false)
  const notificationsCount = 0 // Exemplo, ajuste conforme sua lógica
  const router = useRouter()

  // --- 2. Pega a função de desconectar do contexto ---
  const { disconnectWebSocket } = useWebSocket();

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      setIsAuthenticated(true)
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser)
          // Normaliza o ID para userData.id
          user.id = user._id || user.id;
          setUserData(user)
        } catch (error) {
          console.error("Erro ao processar dados do usuário:", error)
          // Considerar limpar localStorage inválido
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setIsAuthenticated(false);
        }
      } else {
        // Token existe mas user não? Limpa tudo.
        localStorage.removeItem("token");
        setIsAuthenticated(false);
      }
    }
  }, [])

  // --- 3. Atualiza handleLogout ---
  const handleLogout = () => {
    console.log("Executando logout...");

    // Verifica se é um enfermeiro antes de desconectar
    if (userData?.role === "NURSE") {
      console.log("Usuário é enfermeiro, desconectando WebSocket...");
      disconnectWebSocket(); // Chama a desconexão do contexto
    } else {
      console.log("Usuário não é enfermeiro, pulando desconexão WebSocket.");
    }

    // Continua com o processo normal de logout
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setIsAuthenticated(false)
    setUserData(null)
    router.push("/") // Redireciona para home (ou login)
    setIsLogoutAlertOpen(false)
    toast.success("Logout realizado com sucesso!"); // Adiciona feedback
  }

  // Função getInitials (mantida)
  const getInitials = (name: string) => { /* ... */
    if (!name) return ""
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  // Lógica de links e avatar (mantida)
  const currentNavLinks = /* ... */
    isAuthenticated && userData?.role
      ? navLinksConfig[userData.role] ?? navLinksConfig.base
      : navLinksConfig.base

  const avatarUrl = userData?.profile_image_id
    ? `${API_BASE_URL}/user/file/${userData.profile_image_id}`
    : undefined

  let profileUrl = "#"
  if (userData) {
    // Usa userData.id (normalizado no useEffect)
    const userId = userData.id;
    switch (userData.role) {
      case "PATIENT":
        profileUrl = `/patient/my-profile` // Ou use ID se necessário: `/patient/profile/${userId}`
        break
      case "NURSE":
        profileUrl = `/nurse-profile/my-profile` // Ou use ID se necessário: `/nurse/profile/${userId}`
        break
      default:
        // Rota genérica ou específica para Admin
        profileUrl = `/profile/${userId}` // Assumindo uma rota genérica
        break
    }
  }
  let logoUrl = "/"
  if (isAuthenticated && userData?.role) {
    switch (userData.role) {
      case "NURSE":
        logoUrl = "/dashboard/nurse"
        break
      case "PATIENT":
        logoUrl = "/nurses-list" // Ou talvez um dashboard de paciente?
        break
      case "ADMIN":
        logoUrl = "/dashboard/admin"
        break
      default:
        logoUrl = "/"
        break
    }
  }

  // --- JSX (mantido igual, apenas a função onClick do logout foi alterada) ---
  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="flex h-16 w-full items-center justify-between px-4">
          <Link href={logoUrl} className="flex items-center space-x-2">
            <Image src="/logo.png" alt="Vita Logo" width={40} height={40} className="object-cover" /> {/* Corrigido object-cove */}
            <span className="text-lg font-semibold hidden sm:block text-[#15803d]">Vita</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            {currentNavLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm font-medium hover:text-primary transition-colors">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center">
            {/* --- Lógica Desktop --- */}
            <div className="hidden md:flex items-center space-x-3 ml-auto"> {/* Adicionado ml-auto para empurrar para a direita */}
              {isAuthenticated ? (
                <>
                  {/* Removido DropdownMenu vazio */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <Avatar className="h-10 w-10">
                          {avatarUrl && <AvatarImage src={avatarUrl} alt={userData?.name} />}
                          <AvatarFallback className="bg-[#15803d] text-white">
                            {userData ? getInitials(userData.name) : "U"}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{userData?.name}</p>
                          <p className="text-xs leading-none text-muted-foreground">{userData?.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={profileUrl} className="cursor-pointer flex items-center">
                          <User className="mr-2 h-4 w-4" />
                          <span>Meu Perfil</span>
                        </Link>
                      </DropdownMenuItem>
                      {/* Link de Notificações Condicional (Exemplo) */}
                      {userData?.role !== 'ADMIN' && ( // Não mostra para Admin, por exemplo
                        <DropdownMenuItem asChild>
                          <Link href="/notifications" className="cursor-pointer flex items-center">
                            <Bell className="mr-2 h-4 w-4" />
                            <span>Notificações</span>
                            {/* Lógica de contagem de notificações precisa ser implementada */}
                            {/* {notificationsCount > 0 && <Badge variant="destructive" className="ml-auto">{notificationsCount}</Badge>} */}
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setIsLogoutAlertOpen(true)}
                        className="cursor-pointer text-red-600 hover:!text-red-700 hover:!bg-red-50 flex items-center" // Adicionado hover styles
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sair</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
                      <User className="h-4 w-4" />
                      Login
                    </Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="default" size="sm" className="flex items-center gap-2 bg-[#15803d] hover:bg-[#166534]">
                        <UserPlus className="h-4 w-4" />
                        Cadastro
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-40 rounded-xl shadow-lg">
                      <DropdownMenuItem asChild>
                        <Link href="/register/patient" className="cursor-pointer w-full justify-start"> Paciente </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/register/nurse" className="cursor-pointer w-full justify-start"> Enfermeiro(a) </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>

            {/* --- Lógica Mobile (Sheet) --- */}
            <div className="md:hidden ml-auto"> {/* Adicionado ml-auto */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Abrir menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <div className="flex flex-col gap-6 mt-8">
                    {/* User Info no Topo */}
                    {isAuthenticated && userData && (
                      <div className="flex flex-col items-center gap-2 pb-4 border-b text-center">
                        <Avatar className="h-10 w-10">
                          {avatarUrl && <AvatarImage src={avatarUrl} alt={userData.name} />}
                          <AvatarFallback className="bg-[#15803d] text-white">{getInitials(userData.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{userData.name}</p>
                          <p className="text-xs text-muted-foreground">{userData.email}</p>
                        </div>
                      </div>
                    )}

                    {/* Links de Navegação */}
                    <nav className="flex flex-col gap-2">
                      {currentNavLinks.map((link) => (
                        <Link key={link.href} href={link.href} passHref>
                          <Button variant="ghost" size="sm" className="w-full justify-start">{link.label}</Button>
                        </Link>
                      ))}
                    </nav>

                    {/* Links de Ação (Login/Logout, Perfil, Cadastro) */}
                    <div className="flex flex-col gap-2 pt-4 border-t">
                      {isAuthenticated ? (
                        <>
                          <Link href={profileUrl} passHref>
                            <Button variant="ghost" size="sm" className="justify-start w-full"><User className="h-4 w-4 mr-2" />Meu Perfil</Button>
                          </Link>
                          {/* Link de Notificações Condicional */}
                          {userData?.role !== 'ADMIN' && (
                            <Link href="/notifications" passHref>
                              <Button variant="ghost" size="sm" className="justify-start w-full">
                                <Bell className="h-4 w-4 mr-2" />Notificações
                                {/* {notificationsCount > 0 && <Badge variant="destructive" className="ml-auto">{notificationsCount}</Badge>} */}
                              </Button>
                            </Link>
                          )}
                          <Button
                            variant="ghost" size="sm" onClick={() => setIsLogoutAlertOpen(true)}
                            className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50 w-full"
                          >
                            <LogOut className="h-4 w-4 mr-2" />Sair
                          </Button>
                        </>
                      ) : (
                        <>
                          <Link href="/login" passHref>
                            <Button variant="outline" size="sm" className="justify-start w-full bg-transparent"><User className="h-4 w-4 mr-2" />Login</Button>
                          </Link>
                          <Link href="/register/patient" passHref>
                            <Button variant="ghost" size="sm" className="justify-start w-full">Cadastrar Paciente</Button>
                          </Link>
                          <Link href="/register/nurse" passHref>
                            <Button variant="ghost" size="sm" className="justify-start w-full">Cadastrar Enfermeiro(a)</Button>
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* --- AlertDialog (mantido igual) --- */}
      <AlertDialog open={isLogoutAlertOpen} onOpenChange={setIsLogoutAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza que deseja sair?</AlertDialogTitle>
            <AlertDialogDescription>
              Sua sessão será encerrada e você precisará fazer o login novamente para acessar sua conta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            {/* handleLogout agora chama disconnectWebSocket */}
            <AlertDialogAction onClick={handleLogout} className="bg-red-600 hover:bg-red-700">Confirmar Saída</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}