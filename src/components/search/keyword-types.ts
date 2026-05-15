export type KeywordSuggestion = {
  id: string;
  term: string;
  label: string;
  category: string | null;
};

export type KeywordSearchResponse = {
  suggestions?: KeywordSuggestion[];
};
