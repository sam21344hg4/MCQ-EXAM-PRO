export interface Question {
  id: number;
  qid?: number | string; // Authentic UWorld/Coursology Question ID (e.g. 19624)
  subject?: string;
  system?: string;
  topic?: string;
  stem: string;
  options: { label: string; text: string; peerPercent?: number }[];
  correctAnswer: string;
  explanation: string;
  educationalObjective: string;
  image?: string; // Optional image URL for the question
  imageCaption?: string; // Optional caption for the image
  peerStats?: Record<string, number>;
}
