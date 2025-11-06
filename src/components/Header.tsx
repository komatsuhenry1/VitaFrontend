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
import { Menu, LogOut, User, UserPlus, Bell, Search, Settings } from "lucide-react"
import { useWebSocket } from "@/context/WebSocketContext"
import { toast } from "sonner"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api/v1"

interface UserData {
  name: string
  email: string
  role: "PATIENT" | "NURSE" | "ADMIN"
  _id?: string
  id?: string
  profile_image_id?: string
}

const navLinksConfig = {
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
  const [scrolled, setScrolled] = useState(false)
  const notificationsCount = 3
  const router = useRouter()
  const { disconnectWebSocket } = useWebSocket()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      setIsAuthenticated(true)
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser)
          user.id = user._id || user.id
          setUserData(user)
        } catch (error) {
          console.error("Erro ao processar dados do usuário:", error)
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          setIsAuthenticated(false)
        }
      }
    }
  }, [])

  const handleLogout = async () => {
    const token = localStorage.getItem("token")
    if (userData?.role === "NURSE") {
      disconnectWebSocket()
      if (token) {
        try {
          await fetch(`${API_BASE_URL}/nurse/offline`, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          })
        } catch (error) {
          console.error("Erro ao atualizar status:", error)
        }
      }
    }
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setIsAuthenticated(false)
    setUserData(null)
    router.push("/")
    setIsLogoutAlertOpen(false)
    toast.success("Logout realizado com sucesso!")
  }

  const getInitials = (name: string) => {
    if (!name) return ""
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const currentNavLinks =
    isAuthenticated && userData?.role ? (navLinksConfig[userData.role] ?? navLinksConfig.base) : navLinksConfig.base

  const avatarUrl = userData?.profile_image_id ? `${API_BASE_URL}/user/file/${userData.profile_image_id}` : undefined

  let profileUrl = "#"
  if (userData) {
    const userId = userData.id
    switch (userData.role) {
      case "PATIENT":
        profileUrl = `/patient/my-profile`
        break
      case "NURSE":
        profileUrl = `/nurse-profile/my-profile`
        break
      default:
        profileUrl = `/profile/${userId}`
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
        logoUrl = "/nurses-list"
        break
      case "ADMIN":
        logoUrl = "/dashboard/admin"
        break
      default:
        logoUrl = "/"
        break
    }
  }

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
            ? "bg-white/80 backdrop-blur-xl shadow-lg border-b border-gray-200/50"
            : "bg-white/60 backdrop-blur-md border-b border-gray-100"
          }`}
        style={{
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="flex h-20 w-full items-center justify-between px-6 max-w-7xl mx-auto">
          {/* Logo */}
          <Link href={logoUrl} className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-[#15803d]/20 rounded-full blur-xl group-hover:bg-[#15803d]/30 transition-all duration-300"></div>
              <Image
                src="/logo.png"
                alt="Vita Logo"
                width={48}
                height={48}
                className="object-cover relative z-10 group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-[#15803d] to-[#166534] bg-clip-text text-transparent hidden sm:block">
              Vita
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {currentNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#15803d] transition-colors group"
              >
                {link.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#15803d] to-[#166534] group-hover:w-full transition-all duration-300"></span>
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Search Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:flex rounded-full hover:bg-gray-100 transition-all duration-300"
                >
                  <Search className="h-5 w-5 text-gray-600" />
                </Button>

                {/* Notifications */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hidden md:flex rounded-full hover:bg-gray-100 relative transition-all duration-300"
                    >
                      <Bell className="h-5 w-5 text-gray-600" />
                      {notificationsCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold animate-pulse">
                          {notificationsCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 rounded-2xl shadow-2xl border-gray-200">
                    <DropdownMenuLabel className="text-base font-semibold">Notificações</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="p-4 text-sm text-gray-600 text-center">
                      Você tem {notificationsCount} notificações não lidas
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="hidden md:flex items-center gap-3 rounded-full hover:bg-gray-100 pr-4 transition-all duration-300"
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10 ring-2 ring-[#15803d]/20 ring-offset-2">
                          {avatarUrl && <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={userData?.name} />}
                          <AvatarFallback className="bg-gradient-to-br from-[#15803d] to-[#166534] text-white font-semibold">
                            {userData ? getInitials(userData.name) : "U"}
                          </AvatarFallback>
                        </Avatar>
                        {userData?.role === "NURSE" && (
                          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-900">{userData?.name?.split(" ")[0]}</p>
                        <p className="text-xs text-gray-500">{userData?.role}</p>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 rounded-2xl shadow-2xl border-gray-200">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-semibold leading-none">{userData?.name}</p>
                        <p className="text-xs leading-none text-gray-500">{userData?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={profileUrl} className="cursor-pointer flex items-center gap-3 py-2">
                        <User className="h-4 w-4 text-gray-600" />
                        <span>Meu Perfil</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer flex items-center gap-3 py-2">
                        <Settings className="h-4 w-4 text-gray-600" />
                        <span>Configurações</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setIsLogoutAlertOpen(true)}
                      className="cursor-pointer text-red-600 hover:!text-red-700 hover:!bg-red-50 flex items-center gap-3 py-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" className="rounded-full hover:bg-gray-100">
                    <User className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="rounded-full bg-gradient-to-r from-[#15803d] to-[#166534] hover:from-[#166534] hover:to-[#15803d] shadow-lg shadow-[#15803d]/30">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Cadastro
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48 rounded-2xl shadow-2xl">
                    <DropdownMenuItem asChild>
                      <Link href="/register/patient" className="cursor-pointer py-3">
                        Paciente
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/register/nurse" className="cursor-pointer py-3">
                        Enfermeiro(a)
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Mobile Menu */}
            <div className="lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <div className="flex flex-col gap-6 mt-8">
                    {isAuthenticated && userData && (
                      <div className="flex flex-col items-center gap-3 pb-6 border-b">
                        <Avatar className="h-16 w-16 ring-4 ring-[#15803d]/20">
                          {avatarUrl && <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={userData.name} />}
                          <AvatarFallback className="bg-gradient-to-br from-[#15803d] to-[#166534] text-white text-xl">
                            {getInitials(userData.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-center">
                          <p className="font-semibold text-gray-900">{userData.name}</p>
                          <p className="text-sm text-gray-500">{userData.email}</p>
                        </div>
                      </div>
                    )}
                    <nav className="flex flex-col gap-2">
                      {currentNavLinks.map((link) => (
                        <Link key={link.href} href={link.href}>
                          <Button variant="ghost" className="w-full justify-start text-base">
                            {link.label}
                          </Button>
                        </Link>
                      ))}
                    </nav>
                    <div className="flex flex-col gap-2 pt-4 border-t">
                      {isAuthenticated ? (
                        <>
                          <Link href={profileUrl}>
                            <Button variant="ghost" className="w-full justify-start">
                              <User className="h-4 w-4 mr-2" />
                              Meu Perfil
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            onClick={() => setIsLogoutAlertOpen(true)}
                            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Sair
                          </Button>
                        </>
                      ) : (
                        <>
                          <Link href="/login">
                            <Button variant="outline" className="w-full justify-start bg-transparent">
                              <User className="h-4 w-4 mr-2" />
                              Login
                            </Button>
                          </Link>
                          <Link href="/register/patient">
                            <Button variant="ghost" className="w-full justify-start">
                              Cadastrar Paciente
                            </Button>
                          </Link>
                          <Link href="/register/nurse">
                            <Button variant="ghost" className="w-full justify-start">
                              Cadastrar Enfermeiro(a)
                            </Button>
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

      <AlertDialog open={isLogoutAlertOpen} onOpenChange={setIsLogoutAlertOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza que deseja sair?</AlertDialogTitle>
            <AlertDialogDescription>
              Sua sessão será encerrada e você precisará fazer o login novamente para acessar sua conta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="rounded-full bg-red-600 hover:bg-red-700">
              Confirmar Saída
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
