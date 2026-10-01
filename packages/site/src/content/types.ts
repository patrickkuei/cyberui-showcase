export interface CodeSnippet {
  title: string;
  code: string;
  note?: string;
  /** Adds a "Full file" link under the block. Used by /process evidence panels. */
  sourceHref?: string;
  /** Commit the snippet was taken from; shown beside the "Full file" link. */
  asOf?: string;
  /**
   * Wrap long lines instead of scrolling horizontally. Right for prose;
   * leave unset for diagrams and code, where line breaks are the content.
   */
  wrap?: boolean;
}

export interface CaseStudyContent {
  problem: string;
  decisions: { title: string; body: string }[];
  keySnippet: CodeSnippet;
  takeaways: string[];
}
