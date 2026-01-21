import fs from "fs";
import path from "path";
import type { DocumentType } from "../types/document.types.js";

export const documentService = {
  /**
   * Extract text from uploaded document
   */
  async extractText(filePath: string, fileType: DocumentType): Promise<string> {
    switch (fileType) {
      case "pdf":
        return this.extractFromPdf(filePath);
      case "docx":
        return this.extractFromDocx(filePath);
      case "pptx":
        return this.extractFromPptx(filePath);
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  },

  /**
   * Extract text from PDF
   */
  async extractFromPdf(filePath: string): Promise<string> {
    // Dynamic import for pdf-parse
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParseModule = (await import("pdf-parse")) as any;
    const pdfParse = pdfParseModule.default || pdfParseModule;
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text.trim();
  },

  /**
   * Extract text from DOCX
   */
  async extractFromDocx(filePath: string): Promise<string> {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value.trim();
  },

  /**
   * Extract text from PPTX (simplified - reads as zip with XML)
   */
  async extractFromPptx(filePath: string): Promise<string> {
    // PPTX is a zip file with XML content
    const AdmZip = (await import("adm-zip")).default;
    const zip = new AdmZip(filePath);
    const entries = zip.getEntries();

    let text = "";
    for (const entry of entries) {
      if (
        entry.entryName.startsWith("ppt/slides/slide") &&
        entry.entryName.endsWith(".xml")
      ) {
        const content = entry.getData().toString("utf8");
        // Extract text between <a:t> tags
        const matches = content.match(/<a:t>([^<]*)<\/a:t>/g);
        if (matches) {
          text +=
            matches.map((m: string) => m.replace(/<\/?a:t>/g, "")).join(" ") +
            "\n";
        }
      }
    }

    return text.trim() || "Không thể trích xuất nội dung từ slide.";
  },

  /**
   * Delete file from disk
   */
  async deleteFile(filePath: string): Promise<void> {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  },

  /**
   * Get full file path
   */
  getFilePath(uploadDir: string, filename: string): string {
    return path.join(uploadDir, filename);
  },
};
