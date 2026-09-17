export type VocabularyCategoryId = string;

export interface VocabularyCategory {
  readonly id: VocabularyCategoryId;
  readonly title: string;
}

export interface VocabularyWord {
  readonly id: string;
  readonly text: string;
  readonly translation: string;
  readonly categoryIds: readonly VocabularyCategoryId[];
}

export interface VocabEntry {
  readonly wordId: string;
  readonly correctResolutions: number;
}

export interface VocabLibrary {
  readonly entries: readonly VocabEntry[];
}
