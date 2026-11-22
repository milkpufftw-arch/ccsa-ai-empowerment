export interface PublicOrganization {
  id: string;
  name: string;
  city: string;
  region: string;
  summary: string;
  features: string;
  aiDirection: string;
  logoUrl: string;
}
export interface PublicCourse {
  id: string;
  title: string;
  category: string;
  description: string;
  date: string;
  time: string;
  location: string;
  audience: string;
  agenda: string;
  registrationUrl: string;
  registrationStatus: "not_open" | "open" | "closed" | "full";
  organizationId: string;
}
export interface PublicAnnouncement {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  date: string;
}
export interface PublicRecruitment {
  id: string;
  startDate: string;
  endDate: string;
  recruitmentStatus: "not_open" | "open" | "closed" | "announced";
  formUrl: string;
  resultsUrl: string;
  description: string;
}
export interface PublicSnapshot {
  schemaVersion: 1;
  generatedAt: string;
  organizations: PublicOrganization[];
  courses: PublicCourse[];
  announcements: PublicAnnouncement[];
  recruitment: PublicRecruitment | null;
}
export const publicFields: Record<string, string[]>;
export const courseCategories: string[];
export function validatePublicSnapshot(data: unknown): PublicSnapshot;
