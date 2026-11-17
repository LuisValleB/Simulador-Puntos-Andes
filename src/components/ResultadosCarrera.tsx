"use client";

import React, { useMemo, useState } from "react";
import type { RaceResultRow } from "@/lib/raceTypes";
import { ScoreBadge } from "./RankingPuntosAndes";

export interface CourseView {
  id: string;
  label: string;
  km: number;
  dPlus: number;
  dMinus: number;
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
      <div className="flex flex-wrap gap-1 p-3 bg-stone-50 border-b border-stone-200">
        {courses.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => { setCourseId(c.id); setAge("ALL"); setVisible(25); }}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
              c.id === course.id ? "bg-[#10A49B] text-white shadow-sm" : "text-stone-600 hover:bg-white"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="px-4 sm:px-6 pt-4 text-xs text-stone-500 flex flex-wrap gap-x-5 gap-y-1">
        <span><strong className="text-stone-700">{course.km}</strong> km</span>
        <span>D+ <strong className="text-stone-700">{course.dPlus}</strong> m</span>
        <span>D− <strong className="text-stone-700">{course.dMinus}</strong> m</span>
        <span><strong className="text-stone-700">{course.rows.length}</strong> finalistas</span>
      </div>

      <div className="px-4 sm:px-6 py-4 flex flex-wrap items-center gap-2.5">
        <div className="inline-flex p-1 bg-stone-100 border border-stone-200 rounded-xl">
          {([["ALL", "General"], ["M", "Mujer"], ["H", "Hombre"]] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => { setGender(id); setVisible(25); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                gender === id ? "bg-[#10A49B] text-white" : "text-stone-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <select
          value={age}
          onChange={(e) => { setAge(e.target.value); setVisible(25); }}
          className="bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-stone-700"
        >
          <option value="ALL">Categoría de edad: Todas</option>
          {ages.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setVisible(25); }}
          placeholder="Buscar corredor..."
          className="bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-xs w-44"
        />
      </div>

      <div className="overflow-x-auto">
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
                <td className="py-3 px-4 font-bold text-stone-800 tabular-nums">{r.position}</td>
                <td className="py-3 px-4 font-semibold text-stone-800">{r.name}</td>
                <td className="py-3 px-4 text-stone-600">{r.gender === "H" ? "Hombre" : "Mujer"}</td>
                <td className="py-3 px-4 font-mono text-[11px] text-stone-700">{r.ageCategory}</td>
                <td className="py-3 px-4 font-mono text-stone-700">{r.time}</td>
                <td className="py-3 px-4 text-right"><ScoreBadge score={r.score} gender={r.gender} /></td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="py-10 text-center text-stone-400">Sin resultados para los filtros.</td></tr>
            )}
          </tbody>
        </table>
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
