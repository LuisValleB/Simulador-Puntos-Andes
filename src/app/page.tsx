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
      <footer className="mt-16 mb-8 px-4 w-full max-w-lg mx-auto text-center flex flex-col items-center gap-6">
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-stone-200 text-stone-600 text-xs sm:text-sm leading-relaxed shadow-md">
          <p className="mb-2">
            El <strong>Simulador Puntos Andes</strong> es una herramienta gratuita desarrollada para la comunidad.
          </p>
          <p>
            Este proyecto se mantiene vivo y es financiado íntegramente gracias a tus compras en <strong>PACUL</strong>.
          </p>
          <p className="mt-4 text-stone-800">
            Apoya nuestro trabajo y descubre nuestra indumentaria deportiva visitando <br className="sm:hidden" />
            <a href="https://www.pacul.cl" target="_blank" rel="noopener noreferrer" className="inline-block mt-2 sm:mt-0 px-5 py-2 bg-[#10A49B] text-white font-bold rounded-lg hover:bg-[#0c8a82] transition-all transform hover:scale-105 shadow-sm">
              www.pacul.cl
            </a>
          </p>
        </div>
        <div className="text-stone-500 text-[10px] font-bold uppercase tracking-widest">
          © {new Date().getFullYear()} Puntos Andes. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
