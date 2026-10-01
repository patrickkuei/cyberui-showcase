export interface CodeSnippet {
  title: string;
  code: string;
  note?: string;
}

export interface CaseStudyContent {
  problem: string;
  decisions: { title: string; body: string }[];
  keySnippet: CodeSnippet;
  takeaways: string[];
}
