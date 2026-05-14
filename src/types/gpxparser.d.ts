declare module 'gpxparser' {
  export default class GPXParser {
    tracks: Array<{
      points: Array<{
        lat: number;
        lon: number;
        ele: number;
      }>;
    }>;
    parse(gpxstring: string): void;
  }
}
