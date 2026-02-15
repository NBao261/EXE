import { GoogleGenAI } from "@google/genai";
import { config } from "../config/index.js";

// Initialize Gemini AI client
const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

// gemini-embedding-001 produces 3072-dimensional vectors
export const EMBEDDING_DIMENSIONS = 3072;

export const embeddingService = {
  /**
   * Generate embedding for a single text
   */
  async embedText(text: string): Promise<number[]> {
    if (!config.geminiApiKey) {
      throw new Error("Gemini API key not configured");
    }

    try {
      const response = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: text,
      });

      const embedding = response.embeddings?.[0]?.values;

      if (!embedding || embedding.length === 0) {
        throw new Error("No embedding returned from Gemini");
      }

      return embedding;
    } catch (error) {
      console.error("Embedding generation error:", error);
      throw new Error(
        `Failed to generate embedding: ${(error as Error).message}`,
      );
    }
  },

  /**
   * Generate embeddings for multiple texts (batch processing)
   */
  async embedTexts(texts: string[]): Promise<number[][]> {
    // Process in batches to avoid rate limits
    const batchSize = 5;
    const embeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchPromises = batch.map((text) => this.embedText(text));
      const batchResults = await Promise.all(batchPromises);
      embeddings.push(...batchResults);

      // Small delay between batches to respect rate limits
      if (i + batchSize < texts.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return embeddings;
  },

  /**
   * Chunk text into smaller pieces suitable for embedding
   * Uses paragraph-based splitting with size limits
   */
  chunkText(
    text: string,
    maxChunkSize: number = 1000,
    overlap: number = 100,
  ): string[] {
    const chunks: string[] = [];

    // First, split by paragraphs
    const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);

    let currentChunk = "";

    for (const paragraph of paragraphs) {
      const trimmedParagraph = paragraph.trim();

      // If paragraph itself is too large, split by sentences
      if (trimmedParagraph.length > maxChunkSize) {
        // Flush current chunk if exists
        if (currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
          currentChunk = "";
        }

        // Split large paragraph by sentences
        const sentences = trimmedParagraph.split(/(?<=[.!?])\s+/);
        let sentenceChunk = "";

        for (const sentence of sentences) {
          if ((sentenceChunk + " " + sentence).length <= maxChunkSize) {
            sentenceChunk = sentenceChunk
              ? sentenceChunk + " " + sentence
              : sentence;
          } else {
            if (sentenceChunk.length > 0) {
              chunks.push(sentenceChunk.trim());
            }
            sentenceChunk = sentence;
          }
        }

        if (sentenceChunk.length > 0) {
          currentChunk = sentenceChunk;
        }
      } else if (
        (currentChunk + "\n\n" + trimmedParagraph).length <= maxChunkSize
      ) {
        currentChunk = currentChunk
          ? currentChunk + "\n\n" + trimmedParagraph
          : trimmedParagraph;
      } else {
        // Push current chunk and start new one
        if (currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = trimmedParagraph;
      }
    }

    // Don't forget the last chunk
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
    }

    // Add overlap between chunks for better context
    if (overlap > 0 && chunks.length > 1) {
      const overlappedChunks: string[] = [];

      for (let i = 0; i < chunks.length; i++) {
        if (i === 0) {
          overlappedChunks.push(chunks[i]);
        } else {
          // Add last 'overlap' characters from previous chunk
          const prevChunk = chunks[i - 1];
          const overlapText = prevChunk.slice(-overlap);
          overlappedChunks.push(overlapText + " " + chunks[i]);
        }
      }

      return overlappedChunks;
    }

    return chunks;
  },
};
