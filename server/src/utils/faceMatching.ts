/**
 * Face Matching Utility
 * Provides functions for comparing face embeddings and matching faces
 */

/**
 * Calculate cosine similarity between two embedding vectors
 * @param a - First embedding (512D)
 * @param b - Second embedding (512D)
 * @returns Similarity score between -1 and 1 (higher = more similar)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Embedding dimension mismatch: ${a.length} vs ${b.length}`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Calculate Euclidean distance between two embedding vectors
 * @param a - First embedding
 * @param b - Second embedding
 * @returns Distance (lower = more similar)
 */
export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Embedding dimension mismatch: ${a.length} vs ${b.length}`);
  }

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

/**
 * Student with embedding data
 */
export interface StudentWithEmbedding {
  studentId: number;
  studentName: string;
  embedding: number[];
}

/**
 * Face match result
 */
export interface FaceMatch {
  studentId: number;
  studentName: string;
  similarity: number;
}

/**
 * Find the best matching student for a detected face
 * @param queryEmbedding - Embedding from detected face
 * @param students - Array of students with their embeddings
 * @param threshold - Minimum similarity to consider a match (default: 0.5)
 * @returns Best match or null if no match above threshold
 */
export function findBestMatch(
  queryEmbedding: number[],
  students: StudentWithEmbedding[],
  threshold: number = 0.5
): FaceMatch | null {
  let bestMatch: FaceMatch | null = null;

  for (const student of students) {
    const similarity = cosineSimilarity(queryEmbedding, student.embedding);

    if (similarity >= threshold) {
      if (!bestMatch || similarity > bestMatch.similarity) {
        bestMatch = {
          studentId: student.studentId,
          studentName: student.studentName,
          similarity,
        };
      }
    }
  }

  return bestMatch;
}

/**
 * Face from detection result
 */
export interface DetectedFace {
  face_id: number;
  embedding: number[];
}

/**
 * Verified student result
 */
export interface VerifiedStudent {
  faceId: number;
  studentId: number;
  studentName: string;
  similarity: number;
}

/**
 * Unmatched face result
 */
export interface UnmatchedFace {
  faceId: number;
}

/**
 * Suspicious student result
 */
export interface SuspiciousStudent {
  studentId: number;
  studentName: string;
}

/**
 * Face matching result
 */
export interface MatchingResult {
  verified: VerifiedStudent[];
  unmatched: UnmatchedFace[];
  suspicious: SuspiciousStudent[];
}

/**
 * Match all detected faces with self-verified students
 * @param detectedFaces - Faces from class photo
 * @param selfVerifiedStudents - Students who self-verified
 * @param threshold - Matching threshold (default: 0.5)
 * @returns Matching results with verified, unmatched, and suspicious lists
 */
export function matchFacesWithStudents(
  detectedFaces: DetectedFace[],
  selfVerifiedStudents: StudentWithEmbedding[],
  threshold: number = 0.5
): MatchingResult {
  const verified: VerifiedStudent[] = [];
  const unmatched: UnmatchedFace[] = [];
  const matchedStudentIds = new Set<number>();

  // Match each detected face with students
  for (const face of detectedFaces) {
    const match = findBestMatch(
      face.embedding,
      selfVerifiedStudents,
      threshold
    );

    if (match && !matchedStudentIds.has(match.studentId)) {
      verified.push({
        faceId: face.face_id,
        studentId: match.studentId,
        studentName: match.studentName,
        similarity: match.similarity,
      });
      matchedStudentIds.add(match.studentId);
    } else {
      unmatched.push({ faceId: face.face_id });
    }
  }

  // Find suspicious students (self-verified but not found in class photo)
  const suspicious: SuspiciousStudent[] = selfVerifiedStudents
    .filter((s) => !matchedStudentIds.has(s.studentId))
    .map((s) => ({ studentId: s.studentId, studentName: s.studentName }));

  return { verified, unmatched, suspicious };
}

/**
 * Verify a single face against a registered face embedding
 * @param capturedEmbedding - Embedding from captured photo
 * @param registeredEmbedding - Stored registered embedding
 * @param threshold - Minimum similarity threshold (default: 0.5)
 * @returns Verification result
 */
export function verifyFaceMatch(
  capturedEmbedding: number[],
  registeredEmbedding: number[],
  threshold: number = 0.5
): { matched: boolean; similarity: number } {
  const similarity = cosineSimilarity(capturedEmbedding, registeredEmbedding);
  return {
    matched: similarity >= threshold,
    similarity,
  };
}

/**
 * Find all matches above threshold (for debugging/analysis)
 * @param queryEmbedding - Query embedding
 * @param students - Students with embeddings
 * @param threshold - Minimum threshold
 * @returns All matches above threshold, sorted by similarity
 */
export function findAllMatches(
  queryEmbedding: number[],
  students: StudentWithEmbedding[],
  threshold: number = 0.3
): FaceMatch[] {
  const matches: FaceMatch[] = [];

  for (const student of students) {
    const similarity = cosineSimilarity(queryEmbedding, student.embedding);
    if (similarity >= threshold) {
      matches.push({
        studentId: student.studentId,
        studentName: student.studentName,
        similarity,
      });
    }
  }

  // Sort by similarity descending
  return matches.sort((a, b) => b.similarity - a.similarity);
}

export default {
  cosineSimilarity,
  euclideanDistance,
  findBestMatch,
  matchFacesWithStudents,
  verifyFaceMatch,
  findAllMatches,
};
