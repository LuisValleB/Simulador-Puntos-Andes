import GPXParser from 'gpxparser';

export interface ProfilePoint {
  distance: number;    // km acumulados
  elevation: number;   // metros
  lat: number;
  lon: number;
  gradient?: number;   // % gradiente respecto al punto anterior
}

export interface TrackData {
  points: ProfilePoint[];
  totalDistance: number;   // km
  dPlus: number;           // metros D+
  dMinus: number;          // metros D-
  kme: number;             // KmE = distancia + D+/100 + D-/200
  altitudeAvg: number;     // altitud media (para SPTC)
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function parseGPX(fileContent: string): TrackData {
  let rawPoints: { lat: number; lon: number; ele: number }[] = [];

  const isKML = fileContent.includes('<kml') || fileContent.includes('<LineString>') || fileContent.includes('<coordinates>');

  if (isKML) {
    // Parseo de KML usando DOMParser si está disponible en el navegador
    if (typeof DOMParser !== 'undefined') {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(fileContent, "text/xml");
      const coordinatesNodes = xmlDoc.getElementsByTagName("coordinates");
      
      for (let i = 0; i < coordinatesNodes.length; i++) {
        const text = coordinatesNodes[i].textContent || "";
        const pairs = text.trim().split(/\s+/);
        for (const pair of pairs) {
          if (!pair) continue;
          const parts = pair.split(",");
          if (parts.length >= 2) {
            const lon = parseFloat(parts[0]);
            const lat = parseFloat(parts[1]);
            const ele = parts.length >= 3 ? parseFloat(parts[2]) || 0 : 0;
            if (!isNaN(lat) && !isNaN(lon)) {
              rawPoints.push({ lat, lon, ele });
            }
          }
        }
      }
    } else {
      // Fallback simple con Regex para extraer coordenadas
      const matches = fileContent.match(/<coordinates>([\s\S]*?)<\/coordinates>/g);
      if (matches) {
        for (const match of matches) {
          const content = match.replace(/<\/?coordinates>/g, '').trim();
          const pairs = content.split(/\s+/);
          for (const pair of pairs) {
            if (!pair) continue;
            const parts = pair.split(",");
            if (parts.length >= 2) {
              const lon = parseFloat(parts[0]);
              const lat = parseFloat(parts[1]);
              const ele = parts.length >= 3 ? parseFloat(parts[2]) || 0 : 0;
              if (!isNaN(lat) && !isNaN(lon)) {
                rawPoints.push({ lat, lon, ele });
              }
            }
          }
        }
      }
    }
  } else {
    // Intentar parsear como GPX estándar
    const gpx = new GPXParser();
    gpx.parse(fileContent);
    
    if (gpx.tracks && gpx.tracks.length > 0 && gpx.tracks[0].points && gpx.tracks[0].points.length > 0) {
      rawPoints = gpx.tracks[0].points;
    } else if ((gpx as any).routes && (gpx as any).routes.length > 0 && (gpx as any).routes[0].points && (gpx as any).routes[0].points.length > 0) {
      rawPoints = (gpx as any).routes[0].points;
    } else if ((gpx as any).waypoints && (gpx as any).waypoints.length > 0) {
      rawPoints = (gpx as any).waypoints;
    }
  }

  if (!rawPoints || !rawPoints.length) {
    throw new Error('No se encontraron coordenadas válidas en el archivo. Asegúrate de que sea un formato GPX o KML con rutas/tracks definidos.');
  }

  let cumulativeDistance = 0;
  let dPlus = 0;
  let dMinus = 0;
  let elevationSum = 0;

  const points: ProfilePoint[] = rawPoints.map((point, i) => {
    let gradient = 0;
    if (i > 0) {
      const prev = rawPoints[i - 1];
      const segDist = haversineDistance(prev.lat, prev.lon, point.lat, point.lon);
      cumulativeDistance += segDist;
      const elevDiff = point.ele - prev.ele;
      if (elevDiff > 0) dPlus += elevDiff;
      else dMinus += Math.abs(elevDiff);
      gradient = segDist > 0 ? (elevDiff / (segDist * 1000)) * 100 : 0;
    }
    elevationSum += point.ele;
    return {
      distance: parseFloat(cumulativeDistance.toFixed(3)),
      elevation: Math.round(point.ele),
      lat: point.lat,
      lon: point.lon,
      gradient: parseFloat(gradient.toFixed(1))
    };
  });

  // Si el track tiene solo un punto o distancia nula
  if (cumulativeDistance <= 0) {
    throw new Error('El track contiene coordenadas pero no describe una distancia medible.');
  }

  // Fórmula MTR de Puntos Andes: KmE = distancia + D+/100 + D-/200
  const kme = parseFloat((cumulativeDistance + (dPlus / 100) + (dMinus / 200)).toFixed(2));

  return {
    points,
    totalDistance: parseFloat(cumulativeDistance.toFixed(2)),
    dPlus: Math.round(dPlus),
    dMinus: Math.round(dMinus),
    kme,
    altitudeAvg: Math.round(elevationSum / rawPoints.length)
  };
}
