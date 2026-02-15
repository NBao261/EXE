import { ObjectId, Document as MongoDocument } from "mongodb";
import { getDb } from "../config/database.js";
import type { DocumentChunk } from "../types/defense.types.js";
import { embeddingService, EMBEDDING_DIMENSIONS } from "./embedding.service.js";

const COLLECTION_NAME = "documentchunks";
const INDEX_NAME = "vector_index";

export const vectorService = {
  /**
   * Store document chunks with their embeddings
   */
  async storeChunks(
    chunks: string[],
    embeddings: number[][],
    metadata: {
      documentId: ObjectId;
      userId: ObjectId;
      sessionId: ObjectId;
    },
  ): Promise<ObjectId[]> {
    const db = getDb();
    const collection = db.collection<DocumentChunk>(COLLECTION_NAME);

    const documents: Omit<DocumentChunk, "_id">[] = chunks.map(
      (content, index) => ({
        documentId: metadata.documentId,
        userId: metadata.userId,
        sessionId: metadata.sessionId,
        content,
        chunkIndex: index,
        embedding: embeddings[index],
        metadata: {
          startChar: 0, // TODO: Calculate actual positions
          endChar: content.length,
        },
        createdAt: new Date(),
      }),
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await collection.insertMany(documents as any);
    return Object.values(result.insertedIds);
  },

  /**
   * Perform vector similarity search using MongoDB Atlas Vector Search
   * Requires the "vector_index" search index to be created on the collection
   */
  async searchSimilar(
    queryEmbedding: number[],
    sessionId: ObjectId,
    topK: number = 5,
  ): Promise<{ content: string; score: number }[]> {
    const db = getDb();
    const collection = db.collection(COLLECTION_NAME);

    try {
      const results = await collection
        .aggregate([
          {
            $vectorSearch: {
              index: INDEX_NAME,
              path: "embedding",
              queryVector: queryEmbedding,
              numCandidates: topK * 10, // Search more candidates for better accuracy
              limit: topK,
              filter: {
                sessionId: sessionId,
              },
            },
          },
          {
            $project: {
              content: 1,
              score: { $meta: "vectorSearchScore" },
            },
          },
        ])
        .toArray();

      return results.map((doc) => ({
        content: doc.content as string,
        score: doc.score as number,
      }));
    } catch (error) {
      console.error("Vector search error:", error);

      // Fallback to simple text search if vector index not available
      console.warn("Falling back to simple text search");
      const textResults = await collection
        .find({ sessionId })
        .limit(topK)
        .toArray();

      return textResults.map((doc) => ({
        content: (doc as unknown as DocumentChunk).content,
        score: 0.5, // Default score for fallback
      }));
    }
  },

  /**
   * Search by text query (embeds the query first)
   */
  async searchByText(
    query: string,
    sessionId: ObjectId,
    topK: number = 5,
  ): Promise<{ content: string; score: number }[]> {
    const queryEmbedding = await embeddingService.embedText(query);
    return this.searchSimilar(queryEmbedding, sessionId, topK);
  },

  /**
   * Delete all chunks for a session
   */
  async deleteSessionChunks(sessionId: ObjectId): Promise<number> {
    const db = getDb();
    const collection = db.collection(COLLECTION_NAME);
    const result = await collection.deleteMany({ sessionId });
    return result.deletedCount;
  },

  /**
   * Get chunk count for a session
   */
  async getChunkCount(sessionId: ObjectId): Promise<number> {
    const db = getDb();
    const collection = db.collection(COLLECTION_NAME);
    return collection.countDocuments({ sessionId });
  },
};
