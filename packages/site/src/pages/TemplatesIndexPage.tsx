import { TEMPLATES } from '../data/templates';
import { TemplateTile } from '../components/TemplateTile';

export function TemplatesIndexPage() {
  return (
    <div className="templates-index">
      <h1>All templates</h1>
      <div className="templates-index-grid">
        {TEMPLATES.map((item) => (
          <TemplateTile key={item.slug} item={item} size={item.status === 'live' ? 'large' : 'small'} />
        ))}
      </div>
    </div>
  );
}
