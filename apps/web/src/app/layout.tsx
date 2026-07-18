import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "PeopleFlow — Plataforma de DP e RH",
    template: "%s · PeopleFlow",
  },
  description:
    "Plataforma HCM multiempresa: Departamento Pessoal, Recursos Humanos, ponto digital, admissão, férias, recrutamento e IA.",
};

/**
 * Tema claro/escuro de primeira classe (doc 13 §2): o script inline aplica
 * o tema ANTES do primeiro paint (sem flash), respeitando a escolha salva
 * ou a preferência do sistema.
 */
const themeScript = `
(function () {
  var saved = localStorage.getItem("pf-theme");
  var theme = saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.dataset.theme = theme;
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
