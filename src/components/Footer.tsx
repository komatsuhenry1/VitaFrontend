"use client"

import Link from "next/link"

export function Footer() {
    return (
        <footer className="py-12" style={{ backgroundColor: "#f3f4f6" }}>
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-4 gap-8">
                    <div>
                        <h3 className="font-bold text-lg mb-4">Vita</h3>
                        <p className="text-sm" style={{ color: "#6b7280" }}>
                            Conectando cuidado e confiança através de uma plataforma segura e profissional de serviços de enfermagem.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4">Serviços</h4>
                        <ul className="space-y-2 text-sm" style={{ color: "#6b7280" }}>
                            <li>
                                <Link href="#" className="hover:text-green-700 transition-colors">
                                    Cuidados Domiciliares
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-green-700 transition-colors">
                                    Cuidados Pós-Operatórios
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-green-700 transition-colors">
                                    Atendimento 24h
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-green-700 transition-colors">
                                    Cuidados Geriátricos
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4">Empresa</h4>
                        <ul className="space-y-2 text-sm" style={{ color: "#6b7280" }}>
                            <li>
                                <Link href="/about" className="hover:text-green-700 transition-colors">
                                    Sobre Nós
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="hover:text-green-700 transition-colors">
                                    Contato
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-green-700 transition-colors">
                                    Carreiras
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-green-700 transition-colors">
                                    Blog
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4">Suporte</h4>
                        <ul className="space-y-2 text-sm" style={{ color: "#6b7280" }}>
                            <li>
                                <Link href="#" className="hover:text-green-700 transition-colors">
                                    Central de Ajuda
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-green-700 transition-colors">
                                    Política de Privacidade
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-green-700 transition-colors">
                                    Termos de Uso
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-green-700 transition-colors">
                                    FAQ
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-8 pt-8 text-center text-sm" style={{ borderTop: "1px solid #d1d5db", color: "#6b7280" }}>
                    <p>&copy; 2025 Vita. Todos os direitos reservados.</p>
                </div>
            </div>
        </footer>
    )
}
