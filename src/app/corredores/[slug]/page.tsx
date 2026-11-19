import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getRunnerProfile, getAllRunnerSlugs } from "@/lib/races";
import { CountryFlag, ScoreBadge, getPuntosAndesCategory } from "@/components/CountryFlag";

export function generateStaticParams() {
  return getAllRunnerSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const profile = getRunnerProfile(slug);
  return {
    title: profile ? `${profile.name} – Perfil y Resultados | Puntos Andes` : "Corredor | Puntos Andes",
    description: profile
      ? `Historial deportivo y puntaje Puntos Andes de ${profile.name} (${profile.countryCode}).`
      : "Perfil de corredor en Puntos Andes",
  };
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatRunnerName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return { first: fullName, last: "" };
  if (parts.length === 2) {
    return { first: parts[0], last: parts[1].toUpperCase() };
  }
  if (parts.length === 3) {
    return { first: parts[0], last: `${parts[1]} ${parts[2]}`.toUpperCase() };
  }
  const first = parts.slice(0, 2).join(" ");
  const last = parts.slice(2).join(" ").toUpperCase();
  return { first, last };
}

export default async function CorredorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = getRunnerProfile(slug);

  if (!profile) {
    notFound();
  }

  const { first, last } = formatRunnerName(profile.name);
  const bestCat = getPuntosAndesCategory(profile.bestScore, profile.gender);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 font-sans flex flex-col items-center py-10 px-4 sm:px-6">
      <main className="w-full max-w-4xl space-y-6">
        {/* Navigation link */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-[10px] font-bold text-[#10A49B] uppercase tracking-widest hover:underline flex items-center gap-1"
          >
            ← Volver al Ranking Oficial
          </Link>
          <Link
            href="/carreras"
            className="text-[10px] font-bold text-stone-500 uppercase tracking-widest hover:text-[#10A49B] transition-colors"
          >
            Ver todas las carreras →
          </Link>
        </div>

        {/* Profile Card Header */}
        <section className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-6 min-w-0">
              {/* Avatar circle */}
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center font-black text-xl sm:text-2xl flex-shrink-0 border-4 shadow-sm"
                style={{
                  backgroundColor: `${bestCat.bg}15`,
                  borderColor: bestCat.bg,
                  color: "#1c1917",
                }}
              >
                {getInitials(profile.name)}
              </div>

              {/* Name and Badges */}
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight leading-tight">
                  <span className="font-semibold">{first}</span>{" "}
                  <span className="font-black text-stone-950">{last}</span>
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <div className="inline-flex items-center gap-1.5 bg-stone-100 border border-stone-200/80 px-2.5 py-0.5 rounded-full text-xs font-bold text-stone-700">
                    <CountryFlag code={profile.countryCode} className="w-3.5 h-3.5" />
                    <span>{profile.countryCode}</span>
                  </div>
                  <span className="inline-flex items-center bg-stone-100 border border-stone-200/80 px-2.5 py-0.5 rounded-full text-xs font-medium text-stone-600">
                    {profile.gender === "H" ? "Hombre" : "Mujer"}
                  </span>
                  {profile.ageCategory && (
                    <span className="inline-flex items-center bg-stone-100 border border-stone-200/80 px-2.5 py-0.5 rounded-full text-xs font-mono text-stone-600">
                      {profile.ageCategory}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Performance Badge */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-4 sm:pt-0 border-stone-100">
              <div className="text-left sm:text-right">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Mejor Rendimiento
                </span>
                <div className="mt-1">
                  {profile.bestScore > 0 ? (
                    <div className="inline-flex items-center gap-2">
                      <span className="text-3xl sm:text-4xl font-black text-stone-900 tabular-nums">
                        {profile.bestScore}
                      </span>
                      <div
                        className="px-2.5 py-1 rounded-lg text-xs font-black tracking-tight"
                        style={{ backgroundColor: bestCat.bg, color: bestCat.text }}
                      >
                        {bestCat.name}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm font-semibold text-stone-400">Sin puntaje</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-stone-100">
            <div className="bg-[#FDFBF7] border border-stone-200/80 rounded-xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                Carreras
              </span>
              <span className="text-lg sm:text-xl font-black text-stone-800 tabular-nums">
                {profile.totalRaces}
              </span>
            </div>
            <div className="bg-[#FDFBF7] border border-stone-200/80 rounded-xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                Promedio
              </span>
              <span className="text-lg sm:text-xl font-black text-stone-800 tabular-nums">
                {profile.avgScore > 0 ? `${profile.avgScore} pts` : "—"}
              </span>
            </div>
            <div className="bg-[#FDFBF7] border border-stone-200/80 rounded-xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                Km Recorridos
              </span>
              <span className="text-lg sm:text-xl font-black text-stone-800 tabular-nums">
                {profile.totalKm} km
              </span>
            </div>
            <div className="bg-[#FDFBF7] border border-stone-200/80 rounded-xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                Desnivel Acumulado
              </span>
              <span className="text-lg sm:text-xl font-black text-stone-800 tabular-nums">
                +{profile.totalDPlus} m
              </span>
            </div>
          </div>
        </section>

        {/* Historial de Carreras */}
        <section className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-stone-100 flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
                Historial de Carreras Oficiales
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Resultados y rendimientos certificados en el circuito Puntos Andes
              </p>
            </div>
            <span className="text-xs font-bold bg-[#10A49B]/10 text-[#10A49B] px-3 py-1 rounded-full">
              {profile.history.length} {profile.history.length === 1 ? "carrera" : "carreras"}
            </span>
          </div>

          <div className="divide-y divide-stone-100">
            {profile.history.map((item) => (
              <div key={item.id} className="p-4 sm:p-6 hover:bg-[#10A49B]/[0.02] transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Race details */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <CountryFlag code={item.raceCountryCode} className="w-5 h-5 flex-shrink-0" />
                      <Link
                        href={`/carreras/${item.raceSlug}`}
                        className="font-black text-stone-900 text-sm sm:text-base hover:text-[#10A49B] transition-colors truncate"
                      >
                        {item.raceName}
                      </Link>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-stone-500">
                      <span className="font-semibold text-stone-700">{item.courseLabel}</span>
                      <span>•</span>
                      <span>
                        {new Date(item.raceDate + "T12:00:00").toLocaleDateString("es-CL", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      {item.raceLocation && (
                        <>
                          <span>•</span>
                          <span>{item.raceLocation}</span>
                        </>
                      )}
                      <span>•</span>
                      <span className="font-mono">{item.km} km (+{item.dPlus}m)</span>
                      <span>•</span>
                      <span className="inline-flex items-center text-amber-800 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded text-[10px] font-bold">
                        Terreno {item.terrain ?? 3}/5
                      </span>
                      <span className="inline-flex items-center text-sky-800 bg-sky-50 border border-sky-200/60 px-1.5 py-0.5 rounded text-[10px] font-bold">
                        Clima {item.climate ?? 3}/5
                      </span>
                    </div>
                  </div>

                  {/* Result & Score */}
                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    {item.position && (
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">
                          Puesto
                        </span>
                        <span className="font-black text-sm text-stone-800 tabular-nums">
                          #{item.position}
                        </span>
                      </div>
                    )}
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">
                        Tiempo
                      </span>
                      <span className="font-mono font-bold text-sm text-stone-800">
                        {item.time}
                      </span>
                    </div>

                    <div className="flex-shrink-0 min-w-[100px] text-right">
                      {item.hasSplits ? (
                        <span className="text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg">
                          Etapas 2 Días
                        </span>
                      ) : !item.pointsEnabled ? (
                        <span className="text-[11px] font-bold text-stone-400 bg-stone-100 px-2.5 py-1 rounded-lg">
                          No medible
                        </span>
                      ) : (
                        <ScoreBadge score={item.score} gender={profile.gender} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Sub-splits for Grand K (K21 Día 1 + K42 Día 2) */}
                {item.hasSplits && item.splits && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-3 border-t border-stone-100">
                    {/* Día 1: K21 */}
                    <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-black uppercase tracking-wider bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded">
                            Día 1 • K21
                          </span>
                          <span className="text-[11px] text-stone-500 font-mono">
                            {item.splits.k21?.category || profile.ageCategory}
                          </span>
                        </div>
                        <div className="text-xs font-mono font-bold text-stone-800 mt-1">
                          Tiempo: {item.splits.k21?.time || "—"}
                        </div>
                      </div>
                      <div>
                        {item.splits.k21?.score ? (
                          <ScoreBadge score={item.splits.k21.score} gender={profile.gender} />
                        ) : (
                          <span className="text-xs text-stone-400 font-mono">—</span>
                        )}
                      </div>
                    </div>

                    {/* Día 2: K42 */}
                    <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-black uppercase tracking-wider bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded">
                            Día 2 • K42
                          </span>
                          <span className="text-[11px] text-stone-500 font-mono">
                            {item.splits.k42?.category || profile.ageCategory}
                          </span>
                        </div>
                        <div className="text-xs font-mono font-bold text-stone-800 mt-1">
                          Tiempo: {item.splits.k42?.time || "—"}
                        </div>
                      </div>
                      <div>
                        {item.splits.k42?.score ? (
                          <ScoreBadge score={item.splits.k42.score} gender={profile.gender} />
                        ) : (
                          <span className="text-xs text-stone-400 font-mono">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-16 text-center text-stone-500 text-[10px] font-bold uppercase tracking-widest">
        © {new Date().getFullYear()} Puntos Andes. Sistema Oficial de Rendimiento Sudamericano.
      </footer>
    </div>
  );
}