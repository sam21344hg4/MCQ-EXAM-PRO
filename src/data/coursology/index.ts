import rawQuestions from "./qbankQuestions.json";
import rawTaxonomy from "./qbankTaxonomy.json";

export interface QBankQuestion {
  id: number;
  subject: string;
  system: string;
  topic: string;
  category: string;
  peerCorrect: number | null;
  timeSpent: string;
  correctAnswer?: string | null;
}

export interface CategoryTaxonomy {
  name: string;
  count: number;
  qids: number[];
}

export interface SystemTaxonomy {
  name: string;
  count: number;
  categories: CategoryTaxonomy[];
  qids: number[];
}

export interface SubjectTaxonomy {
  name: string;
  count: number;
  qids: number[];
}

export interface QBankTaxonomy {
  totalQuestions: number;
  subjects: SubjectTaxonomy[];
  systems: SystemTaxonomy[];
}

export const qbankQuestions: QBankQuestion[] = rawQuestions as QBankQuestion[];
export const qbankTaxonomy: QBankTaxonomy = rawTaxonomy as QBankTaxonomy;

export const questionsById: Map<number, QBankQuestion> = new Map(
  qbankQuestions.map((q) => [q.id, q])
);

export type QuestionMode =
  | "all"
  | "unused"
  | "used"
  | "incorrect"
  | "marked"
  | "omitted"
  | "correct";

export type TestMode = "tutor" | "timed";

export interface UserQBankProgress {
  usedIds: Set<number>;
  incorrectIds: Set<number>;
  markedIds: Set<number>;
  omittedIds: Set<number>;
  correctIds: Set<number>;
}

export interface TestFilterCriteria {
  questionMode: QuestionMode;
  selectedSubjects: string[]; // Subject names
  selectedSystems: string[]; // System names
  selectedCategories: string[]; // Category names (optional fine-grained filter)
  progress?: UserQBankProgress;
}

/**
 * Filter questions based on selected criteria
 */
export function filterQuestions(criteria: TestFilterCriteria): QBankQuestion[] {
  const {
    questionMode,
    selectedSubjects,
    selectedSystems,
    selectedCategories,
    progress,
  } = criteria;

  const subjectSet = new Set(selectedSubjects);
  const systemSet = new Set(selectedSystems);
  const categorySet = new Set(selectedCategories);

  return qbankQuestions.filter((q) => {
    // 1. Filter by subject
    if (subjectSet.size > 0 && !subjectSet.has(q.subject)) {
      return false;
    }

    // 2. Filter by system
    if (systemSet.size > 0 && !systemSet.has(q.system)) {
      return false;
    }

    // 3. Filter by subcategory if specified
    if (categorySet.size > 0 && !categorySet.has(q.category)) {
      return false;
    }

    // 4. Filter by question status mode
    if (progress) {
      switch (questionMode) {
        case "unused":
          if (progress.usedIds.has(q.id)) return false;
          break;
        case "used":
          if (!progress.usedIds.has(q.id)) return false;
          break;
        case "incorrect":
          if (!progress.incorrectIds.has(q.id)) return false;
          break;
        case "marked":
          if (!progress.markedIds.has(q.id)) return false;
          break;
        case "omitted":
          if (!progress.omittedIds.has(q.id)) return false;
          break;
        case "correct":
          if (!progress.correctIds.has(q.id)) return false;
          break;
        case "all":
        default:
          break;
      }
    }

    return true;
  });
}

/**
 * Randomly pick N questions from filtered candidates
 */
export function generateTestBlock(
  candidates: QBankQuestion[],
  count: number
): QBankQuestion[] {
  if (candidates.length <= count) {
    return [...candidates];
  }

  // Fisher-Yates shuffle copy
  const shuffled = [...candidates];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}
