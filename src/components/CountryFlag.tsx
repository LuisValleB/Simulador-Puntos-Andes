import React from "react";

export function getPuntosAndesCategory(score: number, gender: "H" | "M") {
  if (gender === "H") {
    if (score >= 900) return { name: "Élite Mundial", bg: "#1abc9c", text: "#ffffff" };
    if (score >= 800) return { name: "Élite Nacional", bg: "#3498db", text: "#ffffff" };
    if (score >= 700) return { name: "Nivel Avanzado", bg: "#f1c40f", text: "#1c1917" };
    if (score >= 500) return { name: "Amateur Competitivo", bg: "#e67e22", text: "#ffffff" };
    if (score >= 300) return { name: "En Desarrollo", bg: "#bdc3c7", text: "#1c1917" };
    return { name: "Inicio del Camino", bg: "#d6eaf8", text: "#1c1917" };
  } else {
    if (score >= 800) return { name: "Élite Mundial", bg: "#1abc9c", text: "#ffffff" };
    if (score >= 700) return { name: "Élite Nacional", bg: "#3498db", text: "#ffffff" };
    if (score >= 600) return { name: "Nivel Avanzado", bg: "#f1c40f", text: "#1c1917" };
    if (score >= 400) return { name: "Amateur Competitivo", bg: "#e67e22", text: "#ffffff" };
    if (score >= 200) return { name: "En Desarrollo", bg: "#bdc3c7", text: "#1c1917" };
    return { name: "Inicio del Camino", bg: "#d6eaf8", text: "#1c1917" };
  }
}

export function ScoreBadge({ score, gender }: { score: number; gender: "H" | "M" }) {
  const cat = getPuntosAndesCategory(score, gender);
  return (
    <div
      className="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold shadow-sm whitespace-nowrap transition-transform"
      style={{ backgroundColor: cat.bg, color: cat.text }}
    >
      <span className="font-black text-sm tabular-nums tracking-tight">{score}</span>
      <span
        className="mx-1.5 h-3.5 w-px opacity-40"
        style={{ backgroundColor: cat.text }}
      />
      <span className="text-[11px] font-bold tracking-tight">{cat.name}</span>
    </div>
  );
}

export function CountryFlag({ code, className = "w-4 h-4" }: { code: string; className?: string }) {
  if (code === "ARG") {
    return (
      <span className={`inline-flex items-center justify-center ${className} rounded-full overflow-hidden border border-stone-200 flex-shrink-0 shadow-[0_0_2px_rgba(0,0,0,0.15)]`} title="Argentina">
        <svg viewBox="0 0 36 36" className="w-full h-full">
          <path fill="#74ACDF" d="M0 0h36v12H0zM0 24h36v12H0z" />
          <path fill="#FFF" d="M0 12h36v12H0z" />
          <circle cx="18" cy="18" r="3.5" fill="#F6B40E" />
        </svg>
      </span>
    );
  }
  if (code === "CHI") {
    return (
      <span className={`inline-flex items-center justify-center ${className} rounded-full overflow-hidden border border-stone-200 flex-shrink-0 shadow-[0_0_2px_rgba(0,0,0,0.15)]`} title="Chile">
        <svg viewBox="0 0 36 36" className="w-full h-full">
          <path fill="#D52B1E" d="M0 18h36v18H0z" />
          <path fill="#FFF" d="M18 0h18v18H18z" />
          <path fill="#0039A6" d="M0 0h18v18H0z" />
          <polygon
            fill="#FFF"
            points="9,4.5 10.3,8.5 14.5,8.5 11.1,11 12.4,15 9,12.5 5.6,15 6.9,11 3.5,8.5 7.7,8.5"
          />
        </svg>
      </span>
    );
  }
  if (code === "URU") {
    return (
      <span className={`inline-flex items-center justify-center ${className} rounded-full overflow-hidden border border-stone-200 flex-shrink-0 shadow-[0_0_2px_rgba(0,0,0,0.15)]`} title="Uruguay">
        <svg viewBox="0 0 36 36" className="w-full h-full">
          <path fill="#FFF" d="M0 0h36v36H0z" />
          <path fill="#0038A8" d="M0 4h36v4H0zm0 8h36v4H0zm0 8h36v4H0zm0 8h36v4H0z" />
          <path fill="#FFF" d="M0 0h16v16H0z" />
          <circle cx="8" cy="8" r="3" fill="#F6B40E" />
        </svg>
      </span>
    );
  }
  if (code === "BRA") {
    return (
      <span className={`inline-flex items-center justify-center ${className} rounded-full overflow-hidden border border-stone-200 flex-shrink-0 shadow-[0_0_2px_rgba(0,0,0,0.15)]`} title="Brasil">
        <svg viewBox="0 0 36 36" className="w-full h-full">
          <path fill="#009B3A" d="M0 0h36v36H0z" />
          <polygon fill="#FEDF00" points="18,4 32,18 18,32 4,18" />
          <circle cx="18" cy="18" r="6.5" fill="#002776" />
          <path fill="#FFF" d="M12 19a7 7 0 0 1 12-2" stroke="#FFF" strokeWidth="1" />
        </svg>
      </span>
    );
  }
  if (code === "COL") {
    return (
      <span className={`inline-flex items-center justify-center ${className} rounded-full overflow-hidden border border-stone-200 flex-shrink-0 shadow-[0_0_2px_rgba(0,0,0,0.15)]`} title="Colombia">
        <svg viewBox="0 0 36 36" className="w-full h-full">
          <path fill="#FCD116" d="M0 0h36v18H0z" />
          <path fill="#003893" d="M0 18h36v9H0z" />
          <path fill="#CE1126" d="M0 27h36v9H0z" />
        </svg>
      </span>
    );
  }
  if (code === "PER") {
    return (
      <span className={`inline-flex items-center justify-center ${className} rounded-full overflow-hidden border border-stone-200 flex-shrink-0 shadow-[0_0_2px_rgba(0,0,0,0.15)]`} title="Perú">
        <svg viewBox="0 0 36 36" className="w-full h-full">
          <path fill="#D91023" d="M0 0h12v36H0zM24 0h12v36H24z" />
          <path fill="#FFF" d="M12 0h12v36H12z" />
        </svg>
      </span>
    );
  }
  if (code === "VEN") {
    return (
      <span className={`inline-flex items-center justify-center ${className} rounded-full overflow-hidden border border-stone-200 flex-shrink-0 shadow-[0_0_2px_rgba(0,0,0,0.15)]`} title="Venezuela">
        <svg viewBox="0 0 36 36" className="w-full h-full">
          <path fill="#FCD116" d="M0 0h36v12H0z" />
          <path fill="#003893" d="M0 12h36v12H0z" />
          <path fill="#CE1126" d="M0 24h36v12H0z" />
        </svg>
      </span>
    );
  }
  if (code === "BOL") {
    return (
      <span className={`inline-flex items-center justify-center ${className} rounded-full overflow-hidden border border-stone-200 flex-shrink-0 shadow-[0_0_2px_rgba(0,0,0,0.15)]`} title="Bolivia">
        <svg viewBox="0 0 36 36" className="w-full h-full">
          <path fill="#D52B1E" d="M0 0h36v12H0z" />
          <path fill="#FCD116" d="M0 12h36v12H0z" />
          <path fill="#007934" d="M0 24h36v12H0z" />
        </svg>
      </span>
    );
  }
  if (code === "ECU") {
    return (
      <span className={`inline-flex items-center justify-center ${className} rounded-full overflow-hidden border border-stone-200 flex-shrink-0 shadow-[0_0_2px_rgba(0,0,0,0.15)]`} title="Ecuador">
        <svg viewBox="0 0 36 36" className="w-full h-full">
          <path fill="#FFDD00" d="M0 0h36v18H0z" />
          <path fill="#034EA2" d="M0 18h36v9H0z" />
          <path fill="#ED1C24" d="M0 27h36v9H0z" />
        </svg>
      </span>
    );
  }
  if (code === "PAR") {
    return (
      <span className={`inline-flex items-center justify-center ${className} rounded-full overflow-hidden border border-stone-200 flex-shrink-0 shadow-[0_0_2px_rgba(0,0,0,0.15)]`} title="Paraguay">
        <svg viewBox="0 0 36 36" className="w-full h-full">
          <path fill="#D52B1E" d="M0 0h36v12H0z" />
          <path fill="#FFF" d="M0 12h36v12H0z" />
          <path fill="#0038A8" d="M0 24h36v12H0z" />
        </svg>
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center justify-center ${className} rounded-full overflow-hidden bg-stone-100 border border-stone-200 flex-shrink-0 text-[8px] font-black text-stone-600`}>
      {code ? code.slice(0, 2) : "•"}
    </span>
  );
}