"use client";
import React from 'react';
import Link from 'next/link';
import SimuladorMTR from '@/components/SimuladorPuntosAndes';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 font-sans flex flex-col items-center py-12 px-4 sm:px-6">

      {/* Header Logo */}
      <div className="mb-12 flex flex-col items-center justify-center">
        {/* Placeholder for the logo. The user needs to add 'logo.png' to the public folder */}
        <div className="relative w-64 h-auto mb-4 flex justify-center items-center group">
          <img
            src="/logo.png"
            alt="Puntos Andes"
            className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      </div>

      <main className="w-full max-w-4xl space-y-6">
        {/* Acceso a la nueva herramienta GPX */}
        <div className="flex justify-end px-1">
          <Link 
            href="/simulador-carrera"
            className="text-[10px] font-bold text-[#10A49B] hover:text-teal-700 uppercase tracking-widest transition-colors flex items-center gap-1.5 border border-[#10A49B]/20 rounded-lg px-3 py-1.5 hover:bg-[#10A49B]/5"
          >
            <span className="text-xs">🗺️</span>
            <span>Simulador de Carrera</span>
            <span className="text-[8px] text-stone-400">→</span>
          </Link>
        </div>

        <SimuladorMTR />
      </main>

      {/* Footer */}
      <footer className="mt-20 mb-8 text-center text-stone-600 text-[10px] font-bold uppercase tracking-widest">
        © {new Date().getFullYear()} Puntos Andes. Todos los derechos reservados.
      </footer>
    </div>
  );
}
