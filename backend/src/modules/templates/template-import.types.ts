export interface TemplateImportConfidence {
  overall: number;
  layout: number;
  styling: number;
}

export interface TemplateConfig {
  name: string;
  slug?: string;
  htmlStructure: string;
  css: string;
  supportsRtl: boolean;
  confidence: TemplateImportConfidence;
  notes?: string;
}

export type TemplateImportMimeType =
  | 'application/pdf'
  | 'image/png'
  | 'image/jpeg'
  | 'image/jpg';
