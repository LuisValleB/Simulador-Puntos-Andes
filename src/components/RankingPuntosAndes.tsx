"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { getAllEntries, runnerSlug } from "@/lib/races";
import type { RankingDiscipline, RunnerRankingEntry } from "@/lib/raceTypes";
import { getPuntosAndesCategory, ScoreBadge, CountryFlag } from "./CountryFlag";

export { getPuntosAndesCategory, ScoreBadge, CountryFlag };

const ALL_ENTRIES: RunnerRankingEntry[] = getAllEntries();
const SEASONS: number[] = Array.from(new Set(ALL_ENTRIES.map((e) => e.season))).sort((a, b) => b - a);

const DISCIPLINES: { id: RankingDiscipline; label: string; desc: string }[] = [
  { id: "General", label: "General", desc: "Todas las distancias y modalidades" },
  { id: "U20", label: "U20", desc: "Categoría Juvenil Sub-20 (15-17 años / 7K)" },
  { id: "KV", label: "KV", desc: "Kilómetro Vertical" },
  { id: "Classic Trail", label: "Classic Trail", desc: "15K Campeonato Nacional Classic" },
  { id: "Short Trail", label: "Short Trail", desc: "40K Trail Corto" },
  { id: "Long Trail", label: "Long Trail", desc: "Ultra / Trail Largo" },
];

export const PAISES_SUDAMERICA = [
  { code: "ARG", name: "Argentina" },
  { code: "BOL", name: "Bolivia" },
  { code: "BRA", name: "Brasil" },
  { code: "CHI", name: "Chile" },
  { code: "COL", name: "Colombia" },
  { code: "ECU", name: "Ecuador" },
  { code: "PAR", name: "Paraguay" },
  { code: "PER", name: "Perú" },
  { code: "URU", name: "Uruguay" },
  { code: "VEN", name: "Venezuela" },
];

function formatRunnerName(fullName: string) {
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

function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return "PA";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  const firstInitial = parts[0][0] || "";
  const lastInitial = parts[parts.length > 2 ? parts.length - 2 : 1][0] || "";
  return `${firstInitial}${lastInitial}`.toUpperCase();
}

export default function RankingPuntosAndes() {
  const [selectedDiscipline, setSelectedDiscipline] = useState<RankingDiscipline>("General");
  const [genderFilter, setGenderFilter] = useState<"ALL" | "M" | "H">("ALL");
  const [nationalityFilter, setNationalityFilter] = useState<string | null>(null);
  const [ageFilter, setAgeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState<number>(10);

  const [season, setSeason] = useState<string>("ALL"); // "ALL" = histórico

  // Mejor resultado por corredor dentro de la modalidad y temporada elegidas
  const disciplineRunners = useMemo(() => {
    let filtered = ALL_ENTRIES;
    if (season !== "ALL") filtered = filtered.filter((r) => String(r.season) === season);
    if (selectedDiscipline === "U20") {
      filtered = filtered.filter((r) => r.isU20);
    } else if (selectedDiscipline !== "General") {
      filtered = filtered.filter((r) => r.discipline === selectedDiscipline);
    }

    const bestByRunner = new Map<string, RunnerRankingEntry>();
    for (const r of filtered) {
      const existing = bestByRunner.get(r.runnerKey);
      if (!existing || r.score > existing.score) {
        bestByRunner.set(r.runnerKey, r);
      }
    }

    return Array.from(bestByRunner.values()).sort((a, b) => b.score - a.score);
  }, [selectedDiscipline, season]);

  // Corredores filtrados por país para el Top 3 y la clasificación general
  const countryFilteredRunners = useMemo(() => {
    if (!nationalityFilter) return [];
    if (nationalityFilter === "ALL") return disciplineRunners;
    return disciplineRunners.filter((r) => r.countryCode === nationalityFilter);
  }, [disciplineRunners, nationalityFilter]);

  const selectedCountry = useMemo(() => {
    return PAISES_SUDAMERICA.find((p) => p.code === nationalityFilter);
  }, [nationalityFilter]);

  const regionTitle = selectedCountry ? selectedCountry.name : "Sudamérica";

  // Top 3 Women & Top 3 Men for the selected discipline and country
  const top3Women = useMemo(
    () => countryFilteredRunners.filter((r) => r.gender === "M").slice(0, 3),
    [countryFilteredRunners]
  );

  const top3Men = useMemo(
    () => countryFilteredRunners.filter((r) => r.gender === "H").slice(0, 3),
    [countryFilteredRunners]
  );

  // Available age categories in the current discipline
  const availableAgeCategories = useMemo(() => {
    const set = new Set<string>();
    countryFilteredRunners.forEach((r) => {
      if (r.ageCategory && r.ageCategory !== "Sin Categoria") {
        set.add(r.ageCategory);
      }
    });
    return Array.from(set).sort();
  }, [countryFilteredRunners]);

  // Filtered table runners for "Clasificación oficial del Ranking Puntos Andes"
  const tableRunners = useMemo(() => {
    return countryFilteredRunners.filter((r) => {
      if (genderFilter !== "ALL" && r.gender !== genderFilter) return false;
      if (ageFilter !== "ALL" && r.ageCategory !== ageFilter) return false;
      if (
        searchQuery.trim() !== "" &&
        !r.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [countryFilteredRunners, genderFilter, ageFilter, searchQuery]);

  const displayedRunners = useMemo(
    () => tableRunners.slice(0, visibleCount),
    [tableRunners, visibleCount]
  );

  const handleResetFilters = () => {
    setSelectedDiscipline("General");
    setSeason("ALL");
    setGenderFilter("ALL");
    setNationalityFilter("ALL");
    setAgeFilter("ALL");
    setSearchQuery("");
    setVisibleCount(10);
  };

  const handleDisciplineChange = (disc: RankingDiscipline) => {
    setSelectedDiscipline(disc);
    setAgeFilter("ALL");
    setVisibleCount(10);
  };

  return (
    <section className="w-full mt-8 space-y-6 font-sans">
      {/* ==================== SELECTOR DE PAÍS / SUDAMÉRICA ==================== */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200/90 p-5 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#10A49B]">
              Filtro Territorial
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight mt-0.5">
              Selecciona tu país
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {!nationalityFilter ? (
              <span className="text-xs font-semibold text-stone-400">
                Ningún país seleccionado
              </span>
            ) : nationalityFilter === "ALL" ? (
              <span className="inline-flex items-center gap-1.5 bg-teal-50 border border-teal-200/80 text-[#10A49B] px-3 py-1 rounded-full text-xs font-bold shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-[#10A49B]" />
                Top Sudamérica
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 bg-stone-100 border border-stone-200 text-stone-800 px-3 py-1 rounded-full text-xs font-bold shadow-2xs">
                <CountryFlag code={nationalityFilter} className="w-4 h-4 shadow-2xs" />
                <span>Ranking {regionTitle}</span>
              </span>
            )}
          </div>
        </div>

        {/* Banderas de Sudamérica + Botón TOP SUDAMÉRICA al final */}
        <div className="mt-5 flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Banderas de cada país primero */}
          {PAISES_SUDAMERICA.map((p) => {
            const isSelected = nationalityFilter === p.code;
            return (
              <button
                key={p.code}
                type="button"
                onClick={() => {
                  setNationalityFilter(p.code);
                  setVisibleCount(10);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border shadow-2xs ${
                  isSelected
                    ? "bg-[#10A49B] text-white border-[#10A49B] shadow-sm ring-2 ring-[#10A49B]/30"
                    : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50 hover:border-stone-300"
                }`}
              >
                <CountryFlag code={p.code} className="w-4.5 h-4.5 shadow-2xs" />
                <span>{p.name}</span>
              </button>
            );
          })}

          {/* Opción TOP SUDAMÉRICA de las últimas */}
          <button
            type="button"
            onClick={() => {
              setNationalityFilter("ALL");
              setVisibleCount(10);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 border shadow-2xs ${
              nationalityFilter === "ALL"
                ? "bg-[#10A49B] text-white border-[#10A49B] shadow-sm ring-2 ring-[#10A49B]/30"
                : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100 hover:border-stone-300"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${nationalityFilter === "ALL" ? "bg-white" : "bg-[#10A49B]"}`} />
            <span>TOP SUDAMÉRICA</span>
          </button>
        </div>

        {/* Mensaje de espera si no ha seleccionado país */}
        {!nationalityFilter && (
          <div className="mt-6 p-6 bg-stone-50 rounded-xl border border-dashed border-stone-200 text-center">
            <p className="text-xs font-bold text-stone-600">
              Selecciona tu país para consultar el ranking nacional o elige TOP SUDAMÉRICA para la clasificación continental.
            </p>
          </div>
        )}
      </div>

      {/* Main Ranking Container Card: solo se muestra tras seleccionar país o Top Sudamérica */}
      {nationalityFilter && (
        <div className="bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden">
        {/* Top Metadata Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-3 bg-stone-50 border-b border-stone-200 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10A49B]" />
            <span className="text-[11px] font-black uppercase tracking-widest text-stone-700">
              Ranking Oficial Puntos Andes • {regionTitle} • Temporada 2026
            </span>
          </div>
          <Link href="/carreras" className="text-[11px] text-[#10A49B] font-bold hover:underline">
            Ver todas las carreras cargadas →
          </Link>
        </div>

        {/* ==================== PART 1: TOP 3 ==================== */}
        <div className="px-4 sm:px-8 pt-8 pb-10 border-b border-stone-200">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              Top 3 {regionTitle}
            </h2>
            <div className="mt-3 flex items-center justify-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
                TIPO DE CARRERA
              </span>
              <span
                className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-stone-300 text-[10px] text-stone-500 cursor-help"
                title="Filtra el ranking según la modalidad oficial de Trail Running"
              >
                i
              </span>
            </div>
          </div>

          {/* Category / Discipline Selector Tabs */}
          <div className="mt-4 flex justify-center">
            <div className="inline-flex flex-wrap justify-center gap-1 p-1 bg-stone-100 border border-stone-200 rounded-xl">
              {DISCIPLINES.map((d) => {
                const isActive = selectedDiscipline === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleDisciplineChange(d.id)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${isActive
                        ? "bg-[#10A49B] text-white shadow-sm"
                        : "text-stone-600 hover:text-stone-900 hover:bg-white/60"
                      }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active discipline subtitle */}
          <p className="text-center text-xs text-stone-400 mt-2 font-medium">
            {DISCIPLINES.find((d) => d.id === selectedDiscipline)?.desc}
          </p>

          {/* Top 3 Cards Grid (MUJER / HOMBRE) */}
          {top3Women.length === 0 && top3Men.length === 0 ? (
            <div className="mt-8 max-w-xl mx-auto text-center py-10 px-6 bg-stone-50 rounded-2xl border border-dashed border-stone-300">
              <p className="text-sm font-bold text-stone-700">
                Sin resultados registrados para {regionTitle} en la categoría {selectedDiscipline}
              </p>
              <p className="text-xs text-stone-500 mt-1">
                Prueba cambiando de modalidad o selecciona la opción TOP SUDAMÉRICA para ver la clasificación general.
              </p>
            </div>
          ) : (
            <div className="mt-7 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Card MUJER */}
              <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-3.5 sm:p-6">
                <div className="pb-3 mb-2 border-b border-stone-100 flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase tracking-widest text-stone-800">
                    MUJER
                  </h3>
                  <span className="text-[10px] font-bold text-stone-400 uppercase">
                    {selectedDiscipline} • {regionTitle}
                  </span>
                </div>

                {top3Women.length === 0 ? (
                  <p className="text-xs text-stone-400 py-8 text-center">
                    Sin clasificadas de {regionTitle} en esta categoría.
                  </p>
                ) : (
                  <div className="divide-y divide-stone-100">
                    {top3Women.map((runner, idx) => {
                      const { first, last } = formatRunnerName(runner.name);
                      return (
                        <div
                          key={runner.id}
                          className="py-3 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-3"
                        >
                          <Link
                            href={`/corredores?slug=${runnerSlug(runner.name)}`}
                            className="group flex items-center gap-2.5 sm:gap-3.5 min-w-0 hover:opacity-95 flex-1 overflow-hidden"
                          >
                            <span className="w-4 sm:w-5 text-lg sm:text-xl font-black italic text-stone-900 tabular-nums text-center flex-shrink-0">
                              {idx + 1}
                            </span>
                            <div
                              className="w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-black text-xs sm:text-sm flex-shrink-0 border-2 shadow-sm group-hover:scale-105 transition-transform"
                              style={{
                                backgroundColor: `${getPuntosAndesCategory(runner.score, runner.gender).bg}22`,
                                borderColor: getPuntosAndesCategory(runner.score, runner.gender).bg,
                                color: "#1c1917",
                              }}
                            >
                              {getInitials(runner.name)}
                            </div>
                            <div className="min-w-0 flex-1 overflow-hidden">
                              <p className="text-xs sm:text-sm text-stone-800 truncate leading-snug group-hover:text-[#10A49B] transition-colors">
                                <span className="font-medium">{first}</span>{" "}
                                <span className="font-black tracking-tight">{last}</span>
                              </p>
                              <div className="flex items-center gap-1 sm:gap-1.5 mt-0.5 whitespace-nowrap overflow-hidden">
                                <CountryFlag code={runner.countryCode} className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="text-[11px] font-bold text-stone-600 flex-shrink-0">
                                  {runner.countryCode}
                                </span>
                                <span className="text-[10px] text-stone-400 truncate">
                                  • {runner.distance}
                                </span>
                                <span className="text-[10px] text-stone-400 hidden sm:inline flex-shrink-0">
                                  ({runner.time})
                                </span>
                              </div>
                            </div>
                          </Link>
                          <div className="flex-shrink-0 self-center">
                            <ScoreBadge score={runner.score} gender={runner.gender} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Card HOMBRE */}
              <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-3.5 sm:p-6">
                <div className="pb-3 mb-2 border-b border-stone-100 flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase tracking-widest text-stone-800">
                    HOMBRE
                  </h3>
                  <span className="text-[10px] font-bold text-stone-400 uppercase">
                    {selectedDiscipline} • {regionTitle}
                  </span>
                </div>

                {top3Men.length === 0 ? (
                  <p className="text-xs text-stone-400 py-8 text-center">
                    Sin clasificados de {regionTitle} en esta categoría.
                  </p>
                ) : (
                  <div className="divide-y divide-stone-100">
                    {top3Men.map((runner, idx) => {
                      const { first, last } = formatRunnerName(runner.name);
                      return (
                        <div
                          key={runner.id}
                          className="py-3 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-3"
                        >
                          <Link
                            href={`/corredores?slug=${runnerSlug(runner.name)}`}
                            className="group flex items-center gap-2.5 sm:gap-3.5 min-w-0 hover:opacity-95 flex-1 overflow-hidden"
                          >
                            <span className="w-4 sm:w-5 text-lg sm:text-xl font-black italic text-stone-900 tabular-nums text-center flex-shrink-0">
                              {idx + 1}
                            </span>
                            <div
                              className="w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-black text-xs sm:text-sm flex-shrink-0 border-2 shadow-sm group-hover:scale-105 transition-transform"
                              style={{
                                backgroundColor: `${getPuntosAndesCategory(runner.score, runner.gender).bg}22`,
                                borderColor: getPuntosAndesCategory(runner.score, runner.gender).bg,
                                color: "#1c1917",
                              }}
                            >
                              {getInitials(runner.name)}
                            </div>
                            <div className="min-w-0 flex-1 overflow-hidden">
                              <p className="text-xs sm:text-sm text-stone-800 truncate leading-snug group-hover:text-[#10A49B] transition-colors">
                                <span className="font-medium">{first}</span>{" "}
                                <span className="font-black tracking-tight">{last}</span>
                              </p>
                              <div className="flex items-center gap-1 sm:gap-1.5 mt-0.5 whitespace-nowrap overflow-hidden">
                                <CountryFlag code={runner.countryCode} className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="text-[11px] font-bold text-stone-600 flex-shrink-0">
                                  {runner.countryCode}
                                </span>
                                <span className="text-[10px] text-stone-400 truncate">
                                  • {runner.distance}
                                </span>
                                <span className="text-[10px] text-stone-400 hidden sm:inline flex-shrink-0">
                                  ({runner.time})
                                </span>
                              </div>
                            </div>
                          </Link>
                          <div className="flex-shrink-0 self-center">
                            <ScoreBadge score={runner.score} gender={runner.gender} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ==================== PART 2: CLASIFICACIÓN OFICIAL TOP 10 SUDAMÉRICA (Solo visible en Top Sudamérica) ==================== */}
        {nationalityFilter === "ALL" && (
          <div className="px-4 sm:px-8 py-9 bg-[#FDFBF7]/50">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              Clasificación oficial del Ranking Puntos Andes
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Top 10 Sudamérica • Filtrado por modalidad, género, país y categoría de edad
            </p>
          </div>

          {/* Gender Segmented Switch (General / Mujer / Hombre) */}
          <div className="mt-5 flex justify-center">
            <div className="inline-flex p-1 bg-white border border-stone-200 rounded-xl shadow-xs">
              {[
                { id: "ALL", label: "General" },
                { id: "M", label: "Mujer" },
                { id: "H", label: "Hombre" },
              ].map((g) => {
                const active = genderFilter === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      setGenderFilter(g.id as "ALL" | "M" | "H");
                      setVisibleCount(10);
                    }}
                    className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${active
                        ? "bg-[#10A49B] text-white shadow-xs"
                        : "text-stone-600 hover:text-stone-900"
                      }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filters Row (Categoría, Nacionalidad, Categoría de edad, Buscador, Borrar filtros) */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            {/* Modalidad / Categoría */}
            <select
              value={selectedDiscipline}
              onChange={(e) => handleDisciplineChange(e.target.value as RankingDiscipline)}
              className="bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs font-medium text-stone-700 focus:outline-none focus:border-[#10A49B] shadow-2xs"
            >
              {DISCIPLINES.map((d) => (
                <option key={d.id} value={d.id}>
                  Categoría: {d.label}
                </option>
              ))}
            </select>

            {/* Temporada / Histórico */}
            <select
              value={season}
              onChange={(e) => {
                setSeason(e.target.value);
                setVisibleCount(10);
              }}
              className="bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs font-medium text-stone-700 focus:outline-none focus:border-[#10A49B] shadow-2xs"
            >
              <option value="ALL">Histórico (todas las temporadas)</option>
              {SEASONS.map((s) => (
                <option key={s} value={String(s)}>
                  Temporada {s}
                </option>
              ))}
            </select>

            {/* País (Sudamérica) */}
            <select
              value={nationalityFilter}
              onChange={(e) => {
                setNationalityFilter(e.target.value);
                setVisibleCount(10);
              }}
              className="bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs font-medium text-stone-700 focus:outline-none focus:border-[#10A49B] shadow-2xs"
            >
              <option value="ALL">País: Toda Sudamérica</option>
              {PAISES_SUDAMERICA.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>

            {/* Categoría de Edad */}
            <select
              value={ageFilter}
              onChange={(e) => {
                setAgeFilter(e.target.value);
                setVisibleCount(10);
              }}
              className="bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs font-medium text-stone-700 focus:outline-none focus:border-[#10A49B] shadow-2xs"
            >
              <option value="ALL">Categoría de edad: Todas</option>
              {availableAgeCategories.map((cat) => (
                <option key={cat} value={cat}>
                  Edad: {cat}
                </option>
              ))}
            </select>

            {/* Search Runner */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(10);
                }}
                placeholder="Buscar corredor..."
                className="bg-white border border-stone-300 rounded-lg pl-3 pr-7 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-[#10A49B] shadow-2xs w-44"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-bold text-stone-700 underline hover:text-[#10A49B] ml-1 cursor-pointer"
            >
              Borrar todos los filtros
            </button>
          </div>

          {/* Official Classification Table */}
          <div className="mt-6 bg-white border border-stone-200 rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/70 text-[11px] font-bold text-stone-500">
                    <th className="py-3.5 px-4 w-24">Clasificación</th>
                    <th className="py-3.5 px-4">Corredor</th>
                    <th className="py-3.5 px-4">Nacionalidad</th>
                    <th className="py-3.5 px-4">Género</th>
                    <th className="py-3.5 px-4">Categoría de edad</th>
                    <th className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1">
                        Puntos Andes
                        <span
                          className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-stone-300 text-[9px] text-stone-400"
                          title="Puntaje oficial calculado con el algoritmo Puntos Andes"
                        >
                          i
                        </span>
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs">
                  {displayedRunners.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-stone-400 font-medium">
                        No se encontraron corredores para los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    displayedRunners.map((runner, index) => {
                      const { first, last } = formatRunnerName(runner.name);
                      const cat = getPuntosAndesCategory(runner.score, runner.gender);
                      return (
                        <tr
                          key={runner.id}
                          className="hover:bg-[#10A49B]/[0.04] transition-colors"
                        >
                          {/* Rank */}
                          <td className="py-3.5 px-4 font-bold text-stone-800 tabular-nums">
                            {index + 1}
                          </td>

                          {/* Runner */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <Link
                                href={`/corredores?slug=${runnerSlug(runner.name)}`}
                                className="w-9 h-9 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0 border hover:scale-105 transition-transform"
                                style={{
                                  backgroundColor: `${cat.bg}22`,
                                  borderColor: cat.bg,
                                  color: "#1c1917",
                                }}
                              >
                                {getInitials(runner.name)}
                              </Link>
                              <div>
                                <Link
                                  href={`/corredores?slug=${runnerSlug(runner.name)}`}
                                  className="text-stone-800 leading-tight hover:text-[#10A49B] transition-colors inline-block"
                                >
                                  <span className="font-medium">{first}</span>{" "}
                                  <span className="font-bold">{last}</span>
                                </Link>
                                <div className="text-[10px] text-stone-400 mt-0.5">
                                  <Link href={`/carreras/${runner.raceSlug}`} className="hover:text-[#10A49B] hover:underline">
                                    {runner.race}
                                  </Link>{" "}
                                  • {runner.distance} ({runner.time})
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Nationality */}
                          <td className="py-3.5 px-4">
                            <div className="inline-flex items-center gap-2 font-semibold text-stone-700">
                              <CountryFlag code={runner.countryCode} />
                              <span>{runner.countryCode}</span>
                            </div>
                          </td>

                          {/* Gender */}
                          <td className="py-3.5 px-4 text-stone-600 font-medium">
                            {runner.gender === "H" ? "Hombre" : "Mujer"}
                          </td>

                          {/* Age Category */}
                          <td className="py-3.5 px-4 text-stone-700 font-semibold font-mono text-[11px]">
                            {runner.ageCategory}
                          </td>

                          {/* Score Pill */}
                          <td className="py-3.5 px-4 text-right">
                            <ScoreBadge score={runner.score} gender={runner.gender} />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer of Table: Showing Top 10 + Load more / Collapse */}
            {tableRunners.length > 10 && (
              <div className="px-4 py-3 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-2">
                <span className="text-[11px] text-stone-500 font-medium">
                  Mostrando <strong>{displayedRunners.length}</strong> de{" "}
                  <strong>{tableRunners.length}</strong> corredores clasificados
                </span>
                <div className="flex items-center gap-2">
                  {visibleCount < tableRunners.length && (
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => prev + 20)}
                      className="px-3.5 py-1.5 rounded-lg bg-white border border-stone-300 text-xs font-bold text-stone-700 hover:border-[#10A49B] hover:text-[#10A49B] transition-colors cursor-pointer"
                    >
                      Ver más corredores (+20)
                    </button>
                  )}
                  {visibleCount > 10 && (
                    <button
                      type="button"
                      onClick={() => setVisibleCount(10)}
                      className="px-3.5 py-1.5 rounded-lg bg-stone-200/70 text-xs font-bold text-stone-700 hover:bg-stone-300/70 transition-colors cursor-pointer"
                    >
                      Volver al Top 10 Sudamérica
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
      )}
    </section>
  );
}
