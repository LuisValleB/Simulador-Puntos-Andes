"use client";
import React from 'react';
import Link from 'next/link';
import SimuladorMTR from '@/components/SimuladorPuntosAndes';
import RankingPuntosAndes from '@/components/RankingPuntosAndes';

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

      <main className="w-full max-w-5xl space-y-6">
        {/* Acceso a la nueva herramienta GPX - Oculto temporalmente */}
        {/*
        <div className="flex justify-end px-1 max-w-lg mx-auto">
          <Link
            href="/simulador-carrera"
            className="text-[10px] font-bold text-[#10A49B] hover:text-teal-700 uppercase tracking-widest transition-colors flex items-center gap-1.5 border border-[#10A49B]/20 rounded-lg px-3 py-1.5 hover:bg-[#10A49B]/5"
          >
            <svg className="w-3 h-3 text-[#10A49B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span>Simulador de Carrera</span>
            <span className="text-[8px] text-stone-400">→</span>
          </Link>
        </div>
        */}

        <RankingPuntosAndes />

        <SimuladorMTR />
      </main>

      {/* Footer */}
      <footer className="mt-20 mb-8 text-center text-stone-600 text-[10px] font-bold uppercase tracking-widest">
        © {new Date().getFullYear()} Puntos Andes. Todos los derechos reservados.
      </footer>
    </div>
  );
}
