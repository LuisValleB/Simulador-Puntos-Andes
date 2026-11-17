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
    hasSplits: c.hasSplits,
    pointsEnabled: c.pointsEnabled !== false,
    rows: getCourseRows(race, c.id),
  }));

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 font-sans flex flex-col items-center py-10 px-4 sm:px-6">
      <main className="w-full max-w-5xl space-y-6">
        <Link href="/carreras" className="text-[10px] font-bold text-[#10A49B] uppercase tracking-widest hover:underline">
          ← Todas las carreras
        </Link>
        <header className="flex items-start gap-4">
          <CountryFlag code={getRaceCountryCode(race)} className="w-10 h-10 text-sm mt-1 shadow-sm flex-shrink-0" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">{race.name}</h1>
            <p className="text-sm text-stone-500 mt-1">
              {new Date(race.date + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}
              {race.location ? ` • ${race.location}` : ""}
            </p>
            <p className="text-[11px] text-stone-400 mt-1">
              Puntos Andes calculados con terreno {race.courses[0]?.terrain} y clima {race.courses[0]?.climate}.
            </p>
          </div>
        </header>
        <ResultadosCarrera courses={courses} />
      </main>
    </div>
  );
}
