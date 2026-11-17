import Link from "next/link";
import { getRaces } from "@/lib/races";

export const metadata = { title: "Carreras | Puntos Andes" };

export default function CarrerasPage() {
  const races = getRaces();
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 font-sans flex flex-col items-center py-10 px-4 sm:px-6">
      <main className="w-full max-w-3xl space-y-6">
        <Link href="/" className="text-[10px] font-bold text-[#10A49B] uppercase tracking-widest hover:underline">
          ← Inicio
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">Carreras puntuables</h1>
        <div className="grid gap-3">
          {races.map((r) => (
            <Link
              key={r.slug}
              href={`/carreras/${r.slug}`}
              className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm hover:border-[#10A49B] transition-colors flex justify-between items-center gap-3"
            >
              <div>
                <p className="font-black text-stone-900">{r.name}</p>
                <p className="text-xs text-stone-500 mt-0.5">
                  {r.date}{r.location ? ` • ${r.location}` : ""} • {r.courses.map((c) => c.id).join(" · ")}
                </p>
              </div>
              <span className="text-xs font-bold text-[#10A49B] whitespace-nowrap">
                {r.results.length} resultados →
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
