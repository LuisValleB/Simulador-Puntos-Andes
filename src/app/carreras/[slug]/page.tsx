import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getRace, getRaces, getCourseRows, getRaceCountryCode } from "@/lib/races";
import { CountryFlag } from "@/components/CountryFlag";
import ResultadosCarrera, { CourseView } from "@/components/ResultadosCarrera";

export function generateStaticParams() {
  return getRaces().map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const race = getRace(slug);
  return { title: race ? `${race.name} – Resultados | Puntos Andes` : "Carrera | Puntos Andes" };
}

export default async function CarreraPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const race = getRace(slug);
  if (!race) notFound();

  const courses: CourseView[] = race.courses.map((c) => ({
    id: c.id,
    label: c.label,
    km: c.km,
    dPlus: c.dPlus,
    dMinus: c.dMinus,
    terrain: c.terrain ?? 3,
    climate: c.climate ?? 3,
    hasSplits: c.hasSplits,
    pointsEnabled: c.pointsEnabled !== false,
    rows: getCourseRows(race, c.id),
  }));

  const mainTerrain = race.courses[0]?.terrain ?? 3;
  const mainClimate = race.courses[0]?.climate ?? 3;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 font-sans flex flex-col items-center py-10 px-4 sm:px-6">
      <main className="w-full max-w-5xl space-y-6">
        <Link href="/carreras" className="text-[10px] font-bold text-[#10A49B] uppercase tracking-widest hover:underline">
          ← Todas las carreras
        </Link>
        <header className="flex items-start gap-4">
          <CountryFlag code={getRaceCountryCode(race)} className="w-10 h-10 text-sm mt-1 shadow-sm flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">{race.name}</h1>
            <p className="text-sm text-stone-500 mt-1">
              {new Date(race.date + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}
              {race.location ? ` • ${race.location}` : ""}
            </p>
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/80 px-2.5 py-1 rounded-lg shadow-2xs">
                <span>Dificultad Terreno:</span>
                <span className="font-black font-mono">{mainTerrain}/5</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200/80 px-2.5 py-1 rounded-lg shadow-2xs">
                <span>Dificultad Clima:</span>
                <span className="font-black font-mono">{mainClimate}/5</span>
              </span>
            </div>
          </div>
        </header>
        <ResultadosCarrera courses={courses} />
      </main>
    </div>
  );
}
