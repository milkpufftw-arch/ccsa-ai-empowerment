export type LibraryModule = "showcases" | "resources";
export interface LibraryCategory {
  id: string;
  module: LibraryModule;
  name: string;
  sortOrder: string;
}
export interface LibraryItem {
  id: string;
  title: string;
  categoryId: string;
  summary: string;
  cover: string;
  videoUrl: string;
  publishedAt: string;
  updatedAt: string;
  sortOrder: string;
  featured: "" | "featured" | "pinned";
  sample: "" | "sample";
  steps: string;
  attachments: string;
}
export interface LibraryShowcase extends LibraryItem {
  organization: string;
  context: string;
  problem: string;
  features: string;
  tools: string;
  prompt: string;
  benefit: string;
  limitations: string;
  gallery: string;
  appUrl: string;
  githubUrl: string;
  instructions: string;
  instructionsUrl: string;
}
export interface LibraryResource extends LibraryItem {
  type: string;
  body: string;
  audience: string;
  level: string;
  source: string;
  resourceUrl: string;
  fee: string;
}
export interface LibrarySnapshot {
  schemaVersion: 1;
  generatedAt: string;
  categories: LibraryCategory[];
  showcases: LibraryShowcase[];
  resources: LibraryResource[];
}
export function libraryUrl(value: unknown): value is string;
export function libraryImage(value: unknown): value is string;
export function splitLines(value: string): string[];
export function parseLinks(value: string): { label: string; url: string }[];
export function validateLibrarySnapshot(input: unknown): LibrarySnapshot;
