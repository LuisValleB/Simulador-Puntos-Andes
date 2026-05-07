"use client";
import React from 'react';
import SimuladorMTR from '@/components/SimuladorMTR';

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

      <main className="w-full max-w-4xl">
        <SimuladorMTR />
      </main>

      {/* Footer */}
      <footer className="mt-20 mb-8 text-center text-stone-600 text-[10px] font-bold uppercase tracking-widest">
        © {new Date().getFullYear()} Puntos Andes. Todos los derechos reservados.
      </footer>
    </div>
  );
}
