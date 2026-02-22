export enum MediaFormat {
  Photo = "Photo",
  Audio = "Audio",
  // Video = "Video", Intentionally Omitted -- I don't know what videos are in the CSV; I don't have any
}

export interface MediaRow {
  mlNumber: string;
  format: MediaFormat;
  date: string;
  time: string;
  commonName: string;
  latitude: number;
  longitude: number;
}

export interface EnvConfig {
  cookie: string;
  userAgent: string;
}
