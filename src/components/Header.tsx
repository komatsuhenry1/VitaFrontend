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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

interface UserData {
  name: string
  email: string
  role: "PATIENT" | "NURSE" | "ADMIN"
  id: string
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
    { href: "/visit/nurses-list", label: "Enfermeiros" },
    { href: "/confirmed-visits", label: "Minhas Visitas" },
    { href: "/chat/conversations", label: "Conversas" },
    { href: "/patient/map", label: "Mapa" },
  ],
  NURSE: [
    { href: "/sobre",  label: "Sobre" },
    { href: "/dashboard/nurse", label: "Dashboard" },
    { href: "/visit/all-visits-patient", label: "Visitas" },
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
  const notificationsCount = 3
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      setIsAuthenticated(true)
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser)
          setUserData(user)
        } catch (error) {
          console.error("Erro ao processar dados do usuário:", error)
        }
      }
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setIsAuthenticated(false)
    setUserData(null)
    router.push("/")
    setIsLogoutAlertOpen(false)
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
    isAuthenticated && userData?.role
      ? navLinksConfig[userData.role] ?? navLinksConfig.base
      : navLinksConfig.base

  const avatarUrl = userData?.profile_image_id
    ? `${API_BASE_URL}/user/file/${userData.profile_image_id}`
    : undefined

  let profileUrl = "#"
  if (userData) {
    switch (userData.role) {
      case "PATIENT":
        profileUrl = `/patient/my-profile`
        break
      case "NURSE":
        profileUrl = `/nurse-profile/my-profile`
        break
      default:
        profileUrl = `/profile/${userData.id}`
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
        logoUrl = "/visit/nurses-list"
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
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        {/* [MUDANÇA] Adicionado 'relative' para servir de referência para a navegação */}
        <div className="flex h-16 w-full items-center justify-between px-4">       
          <Link href={logoUrl} className="flex items-center space-x-2">
          <Image src="/logo.png" alt="Vita Logo" width={40} height={40} className="object-cove" />
          <span className="text-lg font-semibold hidden sm:block text-[#15803d]">Vita</span>
        </Link>

          {/* [MUDANÇA] Adicionadas classes para centralizar a navegação de forma absoluta */}
          <nav className="hidden md:flex items-center space-x-8">            {currentNavLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-medium hover:text-primary transition-colors">
              {link.label}
            </Link>
          ))}
          </nav>

          <div className="flex items-center">
            <div className="hidden md:flex items-center space-x-3">
              {isAuthenticated ? (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        {notificationsCount > 0 && (
                          <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0
                         text-xs"
                          >
                            {notificationsCount}
                          </Badge>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                      <DropdownMenuLabel>Notificações</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                    </DropdownMenuContent>
                  </DropdownMenu>

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
                      <DropdownMenuItem asChild>
                        <Link href="/notifications" className="cursor-pointer flex items-center">
                          <Bell className="mr-2 h-4 w-4" />
                          <span>Notificações</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setIsLogoutAlertOpen(true)}
                        className="cursor-pointer text-red-600 flex items-center"
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
                      <Button
                        variant="default"
                        size="sm"
                        className="flex items-center gap-2 bg-[#15803d] hover:bg-[#166534]"
                      >
                        <UserPlus className="h-4 w-4" />
                        Cadastro
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-40 rounded-xl shadow-lg">
                      <DropdownMenuItem asChild>
                        <Link href="/register/patient" className="w-full justify-start">
                          Paciente
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/register/nurse" className="w-full justify-start">
                          Enfermeiro(a)
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>

            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Abrir menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <div className="flex flex-col gap-6 mt-8">
                    {isAuthenticated && userData && (
                      <div className="flex flex-col items-center gap-2 pb-4 border-b text-center">
                        <Avatar className="h-10 w-10">
                          {avatarUrl && <AvatarImage src={avatarUrl} alt={userData.name} />}
                          <AvatarFallback className="bg-[#15803d] text-white">
                            {getInitials(userData.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{userData.name}</p>
                          <p className="text-xs text-muted-foreground">{userData.email}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      {currentNavLinks.map((link) => (
                        <Link key={link.href} href={link.href}>
                          <Button variant="ghost" size="sm" className="w-full justify-start">
                            {link.label}
                          </Button>
                        </Link>
                      ))}
                    </div>

                    <div className="flex flex-col gap-2 pt-4 border-t">
                      {isAuthenticated ? (
                        <>
                          <Link href={profileUrl}>
                            <Button variant="ghost" size="sm" className="justify-start w-full">
                              <User className="h-4 w-4 mr-2" />
                              Meu Perfil
                            </Button>
                          </Link>
                          <Link href="/notifications">
                            <Button variant="ghost" size="sm" className="justify-start w-full">
                              <Bell className="h-4 w-4 mr-2" />
                              Notificações
                              {notificationsCount > 0 && (
                                <Badge variant="destructive" className="ml-auto">
                                  {notificationsCount}
                                </Badge>
                              )}
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsLogoutAlertOpen(true)}
                            className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Sair
                          </Button>
                        </>
                      ) : (
                        <>
                          <Link href="/login">
                            <Button variant="outline" size="sm" className="justify-start w-full bg-transparent">
                              <User className="h-4 w-4 mr-2" />
                              Login
                            </Button>
                          </Link>
                          <Link href="/register/patient">
                            <Button variant="ghost" size="sm" className="justify-start w-full">
                              Cadastrar como Paciente
                            </Button>
                          </Link>
                          <Link href="/register/nurse">
                            <Button variant="ghost" size="sm" className="justify-start w-full">
                              Cadastrar como Enfermeiro(a)
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza que deseja sair?</AlertDialogTitle>
            <AlertDialogDescription>
              Sua sessão será encerrada e você precisará fazer o login novamente para acessar sua conta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Confirmar Saída</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}