// src/app/layout.tsx
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
// --- Imports mantidos ---
import { WebSocketProvider } from '@/context/WebSocketContext';
// --- CORRIGIDO: Agora só importamos ---
import { GlobalNotificationDialog } from '@/components/GlobalNotificationDialog';
// Removidos imports específicos do dialog que estavam aqui antes, pois estão no componente separado
// import { useRouter } from "next/navigation";
// import { User, BellRing } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { useWebSocket } from "@/context/WebSocketContext";
// import { toast } from "sonner";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Vita - Conectando Cuidado e Confiança",
  description:
    "Plataforma profissional que conecta enfermeiros qualificados a pacientes, oferecendo cuidados de saúde personalizados e confiáveis.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <WebSocketProvider>
          {children}
          <Toaster position="top-right" richColors />
          {/* --- Uso do Componente Importado --- */}
          <GlobalNotificationDialog />
        </WebSocketProvider>
      </body>
    </html>
  )
}