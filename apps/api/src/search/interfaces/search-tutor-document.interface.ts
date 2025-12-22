export interface SearchTutorDocument {
  id: string;
  profileId: string;
  name: string;
  bio?: string | null;
  subjects: string[];
  languages: string[];
  location?: string | null;
  hourlyRate?: number | null;
  rating?: number | null;
  updatedAt: string;
}
