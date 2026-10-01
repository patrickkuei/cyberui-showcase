import { useState } from 'react';
import { Badge, TabNavigation } from 'cyberui-2045';
import { getTemplate, isLive } from '../data/templates';
import { CASE_STUDIES } from '../content/caseStudies';
import { CODE_SNIPPETS } from '../content/codeSnippets';
import { CaseStudy } from '../components/CaseStudy';
import { CodeViewer } from '../components/CodeViewer';

const TABS = ['Preview', 'Code', 'Case Study'] as const;
type Tab = (typeof TABS)[number];

export interface TemplatePageProps {
  slug: string;
}

export function TemplatePage({ slug }: TemplatePageProps) {
  const [tab, setTab] = useState<Tab>('Preview');
  const item = getTemplate(slug);

  if (!item) {
    return (
      <div className="template-page">
        <a className="back-link" href="#/templates">
          All templates
        </a>
        <p>No template named "{slug}" yet.</p>
      </div>
    );
  }

  if (!isLive(item)) {
    return (
      <div className="template-page">
        <a className="back-link" href="#/templates">
          All templates
        </a>
        <h1>{item.name}</h1>
        <p>This template isn't built yet — check back soon, or see what's live now.</p>
      </div>
    );
  }

  const caseStudy = CASE_STUDIES[item.slug];
  const snippets = CODE_SNIPPETS[item.slug] ?? [];

  return (
    <div className="template-page">
      <a className="back-link" href="#/templates">
        All templates
      </a>

      <header className="template-page-header">
        <h1>{item.name}</h1>
        <Badge variant="secondary" size="sm">
          {item.accentLabel} accent
        </Badge>
      </header>
      <p className="template-page-tagline">{item.tagline}</p>

      <TabNavigation tabs={TABS} activeTab={tab} onTabChange={(next) => setTab(next as Tab)} />

      <div className="template-page-body">
        {tab === 'Preview' && (
          <div className="preview-frame">
            <iframe title={`${item.name} live preview`} src={item.livePreviewPath} />
          </div>
        )}
        {tab === 'Code' && <CodeViewer snippets={snippets} />}
        {tab === 'Case Study' && caseStudy && <CaseStudy content={caseStudy} />}
      </div>
    </div>
  );
}
