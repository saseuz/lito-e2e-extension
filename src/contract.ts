export type LookupData = {
  word: string;
  language: string;
  origin: 'local' | 'provider';
  meanings: {
    part_of_speech: string;
    senses: { definitions: string[]; examples: { text: string; attribution: string | null; license: string | null; license_url: string | null }[] }[];
    pronunciations: { text: string; notation: string; audio_url: string | null }[];
  }[];
  source: { name: string; url: string; attribution: string; license: string; license_url: string };
};
