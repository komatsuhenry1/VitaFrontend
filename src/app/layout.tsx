// src/app/layout.tsx
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
// --- Imports mantidos ---
import { WebSocketProvider } from '@/context/WebSocketContext';
import { GlobalNotificationDialog } from '@/components/GlobalNotificationDialog';
// Removidos imports desnecessários que estavam na versão antiga do seu prompt
// (router, icons, dialog components, etc.)


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

          {/* --- MUDANÇA REALIZADA ---
            Removemos as props 'position' e 'richColors' 
            para voltar ao estilo padrão (o da sua "versão antiga").
          */}
          <Toaster />

          <GlobalNotificationDialog />
        </WebSocketProvider>
      </body>
    </html>
  )
}