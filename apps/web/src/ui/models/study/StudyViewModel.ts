export interface Flashcard {
  readonly id: string;
  readonly topic: string;
  readonly front: string;
  readonly back: string;
}

export interface Course {
  readonly name: string;
  readonly progress: number;
  readonly totalHours: number;
  readonly completedHours: number;
  readonly lastStudied: string;
}

export interface StudyViewModel {
  flashcards: readonly Flashcard[];
  courses: readonly Course[];
}
