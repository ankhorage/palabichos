export interface VocabularyCategory {
  readonly id: string;
  readonly title: string;
}

export interface VocabularyWord {
  readonly id: string;
  readonly text: string;
  readonly translation: string;
  readonly categoryIds: readonly string[];
}

export interface VocabEntry {
  readonly wordId: string;
  readonly correctResolutions: number;
}

export interface VocabLibrary {
  readonly entries: readonly VocabEntry[];
}
