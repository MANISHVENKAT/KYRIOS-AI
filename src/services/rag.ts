import { DocumentItem } from '../types';

export interface RetrievedChunk {
  documentId: string;
  documentTitle: string;
  chunkText: string;
  score: number;
}

export const RagService = {
  chunkText(text: string, chunkSize = 400, overlap = 50): string[] {
    const words = text.split(/\s+/);
    if (words.length <= chunkSize) return [text];

    const chunks: string[] = [];
    let i = 0;
    while (i < words.length) {
      const slice = words.slice(i, i + chunkSize);
      chunks.push(slice.join(' '));
      i += chunkSize - overlap;
    }
    return chunks;
  },

  retrieveRelevantChunks(query: string, docs: DocumentItem[], topK = 4): RetrievedChunk[] {
    if (!query.trim() || docs.length === 0) return [];

    const queryTerms = query
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(t => t.length > 2);

    if (queryTerms.length === 0) return [];

    const scored: RetrievedChunk[] = [];

    for (const doc of docs) {
      for (const chunk of doc.chunks) {
        const lowerChunk = chunk.toLowerCase();
        let matchScore = 0;

        for (const term of queryTerms) {
          if (lowerChunk.includes(term)) {
            const occurrences = (lowerChunk.match(new RegExp(term, 'g')) || []).length;
            matchScore += occurrences * 2;
          }
        }

        if (matchScore > 0) {
          scored.push({
            documentId: doc.id,
            documentTitle: doc.name,
            chunkText: chunk,
            score: matchScore
          });
        }
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }
};
