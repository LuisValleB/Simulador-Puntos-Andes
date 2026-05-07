import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Simulador Puntos Andes",
  description: "Calcula tu rendimiento, ritmo y proyecciones para tus próximas carreras de trail running.",
  openGraph: {
    title: "Simulador Puntos Andes",
    description: "Calcula tu rendimiento y proyecciones para tus próximas carreras de trail.",
    url: "https://puntosandes.com",
    siteName: "Puntos Andes",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 800,
        alt: "Logo Puntos Andes",
      },
    ],
    locale: "es_CL",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}