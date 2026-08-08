export interface UploadedDocument {
  id: string;
  type: "protocol" | "participant";
  file: File;
  name: string;
  size: number;
}