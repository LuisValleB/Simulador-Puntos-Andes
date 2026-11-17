"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import type { RaceResultRow } from "@/lib/raceTypes";
import { runnerSlug } from "@/lib/races";
import { ScoreBadge, CountryFlag } from "./RankingPuntosAndes";

export interface CourseView {
  id: string;
  label: string;
  km: number;
  dPlus: number;
  dMinus: number;
  hasSplits?: boolean;
  pointsEnabled?: boolean;
  rows: RaceResultRow[];
}

export default function ResultadosCarrera({ courses }: { courses: CourseView[] }) {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [gender, setGender] = useState<"ALL" | "H" | "M">("ALL");
  const [age, setAge] = useState("ALL");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(25);

  const course = courses.find((c) => c.id === courseId) ?? courses[0];

  const ages = useMemo(
    () => Array.from(new Set(course?.rows.map((r) => r.ageCategory).filter(Boolean))).sort(),
    [course]
  );

  const rows = useMemo(() => {
    if (!course) return [];
    const q = query.trim().toLowerCase();
    return course.rows.filter(
      (r) =>
        (gender === "ALL" || r.gender === gender) &&
        (age === "ALL" || r.ageCategory === age) &&
        (!q || r.name.toLowerCase().includes(q))
    );
  }, [course, gender, age, query]);

  if (!course) return <p className="text-sm text-stone-500">Sin resultados cargados.</p>;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden">
      {/* Course Selector Tabs */}
      <div className="flex flex-wrap gap-1 p-3 bg-stone-50 border-b border-stone-200">
        {courses.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              setCourseId(c.id);
              setAge("ALL");
              setVisible(25);
            }}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${c.id === course.id
                ? "bg-[#10A49B] text-white shadow-sm"
                : "text-stone-600 hover:bg-white"
              }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Course Info Banner */}
      <div className="px-4 sm:px-6 pt-4 text-xs text-stone-500 flex flex-wrap items-center justify-between gap-x-5 gap-y-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>
            <strong className="text-stone-700">{course.km}</strong> km
          </span>
          <span>
            D+ <strong className="text-stone-700">+{course.dPlus}</strong> m
          </span>
          <span>
            D− <strong className="text-stone-700">−{course.dMinus}</strong> m
          </span>
          <span>
            <strong className="text-stone-700">{course.rows.length}</strong> finalistas
          </span>
        </div>
        {course.hasSplits && (
          <span className="text-[11px] font-semibold text-[#10A49B] bg-[#10A49B]/10 px-2.5 py-0.5 rounded-full">
            Etapas separadas Día 1 (K21) y Día 2 (K42)
          </span>
        )}
        {course.pointsEnabled === false && !course.hasSplits && (
          <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
            Postas / Relevos (no aplica Puntos Andes individuales)
          </span>
        )}
      </div>

      {/* Explanatory note for Grand K and Postas */}
      {course.hasSplits && (
        <div className="mx-4 sm:mx-6 mt-3 p-3 bg-teal-50/70 border border-[#10A49B]/30 rounded-xl text-xs text-stone-700 leading-relaxed">
          <strong className="text-[#10A49B]">Grand K:</strong> Los Puntos Andes se valoran por
          separado para cada jornada (Día 1: K21 y Día 2: K42), preservando el rendimiento exacto de
          cada carrera individual sin ponderar por volumen combinado.
        </div>
      )}

      {/* Filters Bar */}
      <div className="px-4 sm:px-6 py-4 flex flex-wrap items-center gap-2.5">
        <div className="inline-flex p-1 bg-stone-100 border border-stone-200 rounded-xl">
          {([["ALL", "General"], ["M", "Mujer"], ["H", "Hombre"]] as const).map(
            ([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setGender(id);
                  setVisible(25);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${gender === id ? "bg-[#10A49B] text-white" : "text-stone-600"
                  }`}
              >
                {label}
              </button>
            )
          )}
        </div>
        <select
          value={age}
          onChange={(e) => {
            setAge(e.target.value);
            setVisible(25);
          }}
          className="bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-stone-700"
        >
          <option value="ALL">Categoría de edad: Todas</option>
          {ages.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setVisible(25);
          }}
          placeholder="Buscar corredor..."
          className="bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs w-44"
        />
      </div>

      {/* Results Table */}
      <div className="overflow-x-auto">
        {course.hasSplits ? (
          /* ================= GRAND K SPLITS VIEW ================= */
          <div className="divide-y divide-stone-200 text-xs">
            <div className="bg-stone-50/80 px-4 py-3 border-y border-stone-200 flex justify-between items-center text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              <span>Pos. • Corredor • Desglose K21 y K42</span>
              <span>Tiempo Total Acumulado</span>
            </div>
            {rows.slice(0, visible).map((r) => (
              <div
                key={r.name}
                className="p-4 hover:bg-[#10A49B]/[0.03] transition-colors space-y-2.5"
              >
                {/* Header row: Runner info & Grand K Total */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center font-black text-xs text-stone-800 tabular-nums">
                      {r.position}
                    </span>
                    <CountryFlag code={r.countryCode} />
                    <Link
                      href={`/corredores/${runnerSlug(r.name)}`}
                      className="font-black text-sm text-stone-900 hover:text-[#10A49B] transition-colors"
                    >
                      {r.name}
                    </Link>
                    <span className="text-[11px] text-stone-500 font-mono">({r.ageCategory})</span>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span className="text-[10px] uppercase font-bold text-stone-400">
                      Total Grand K:
                    </span>
                    <span className="font-mono font-black text-sm text-stone-800 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                      {r.time}
                    </span>
                  </div>
                </div>

                {/* Day 1 & Day 2 Sub-rows */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-2 sm:pl-9">
                  {/* K21 Día 1 */}
                  <div className="bg-stone-50/80 border border-stone-200/90 rounded-xl p-2.5 flex items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-teal-100/80 text-teal-800 px-1.5 py-0.5 rounded">
                          Día 1 • K21
                        </span>
                        <span className="text-[11px] text-stone-500 font-medium">
                          {r.gender === "H" ? "Hombre" : "Mujer"} •{" "}
                          {r.splits?.k21?.category || r.ageCategory}
                        </span>
                      </div>
                      <div className="text-xs font-mono font-bold text-stone-800">
                        Tiempo: {r.splits?.k21?.time || "—"}
                      </div>
                    </div>
                    <div>
                      {r.splits?.k21?.score ? (
                        <ScoreBadge score={r.splits.k21.score} gender={r.gender} />
                      ) : (
                        <span className="text-[11px] text-stone-400 italic font-mono">—</span>
                      )}
                    </div>
                  </div>

                  {/* K42 Día 2 */}
                  <div className="bg-stone-50/80 border border-stone-200/90 rounded-xl p-2.5 flex items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-sky-100/80 text-sky-800 px-1.5 py-0.5 rounded">
                          Día 2 • K42
                        </span>
                        <span className="text-[11px] text-stone-500 font-medium">
                          {r.gender === "H" ? "Hombre" : "Mujer"} •{" "}
                          {r.splits?.k42?.category || r.ageCategory}
                        </span>
                      </div>
                      <div className="text-xs font-mono font-bold text-stone-800">
                        Tiempo: {r.splits?.k42?.time || "—"}
                      </div>
                    </div>
                    <div>
                      {r.splits?.k42?.score ? (
                        <ScoreBadge score={r.splits.k42.score} gender={r.gender} />
                      ) : (
                        <span className="text-[11px] text-stone-400 italic font-mono">—</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {rows.length === 0 && (
              <div className="py-10 text-center text-stone-400">
                Sin resultados para los filtros seleccionados.
              </div>
            )}
          </div>
        ) : (
          /* ================= STANDARD COURSES & POSTAS VIEW ================= */
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-y border-stone-200 bg-stone-50/70 text-[11px] font-bold text-stone-500">
                <th className="py-3 px-4 w-16">Pos.</th>
                <th className="py-3 px-4">Corredor</th>
                <th className="py-3 px-4">Género</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Tiempo</th>
                <th className="py-3 px-4 text-right">Puntos Andes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rows.slice(0, visible).map((r, i) => (
                <tr key={`${r.name}-${i}`} className="hover:bg-[#10A49B]/[0.04]">
                  <td className="py-3 px-4 font-bold text-stone-800 tabular-nums">
                    {r.position}
                  </td>
                  <td className="py-3 px-4 font-semibold text-stone-800">
                    <div className="flex items-center gap-2">
                      <CountryFlag code={r.countryCode} />
                      <Link
                        href={`/corredores/${runnerSlug(r.name)}`}
                        className="hover:text-[#10A49B] transition-colors"
                      >
                        {r.name}
                      </Link>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-stone-600">
                    {r.gender === "H" ? "Hombre" : "Mujer"}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-stone-700">
                    {r.ageCategory}
                  </td>
                  <td className="py-3 px-4 font-mono text-stone-700">{r.time}</td>
                  <td className="py-3 px-4 text-right">
                    {course.pointsEnabled === false ? (
                      <span className="text-stone-400 font-mono text-[11px] italic">
                        No medible
                      </span>
                    ) : (
                      <ScoreBadge score={r.score} gender={r.gender} />
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-stone-400">
                    Sin resultados para los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {visible < rows.length && (
        <div className="p-3 bg-stone-50 border-t border-stone-200 text-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + 50)}
            className="px-4 py-1.5 rounded-lg bg-white border border-stone-300 text-xs font-bold text-stone-700 hover:border-[#10A49B] hover:text-[#10A49B] cursor-pointer"
          >
            Ver más ({rows.length - visible} restantes)
          </button>
        </div>
      )}
    </div>
  );
}
