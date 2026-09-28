import { useState } from 'react';
import { Card } from 'cyberui-2045';

export interface ActionPanelProps {
  headline: string;
  headlineTone: 'success' | 'error';
  primaryActionLabel?: string;
}

const TONE_VAR: Record<ActionPanelProps['headlineTone'], string> = {
  success: 'var(--color-success)',
  error: 'var(--color-error)',
};

export function ActionPanel({ headline, headlineTone, primaryActionLabel }: ActionPanelProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [prevHeadline, setPrevHeadline] = useState(headline);
  if (headline !== prevHeadline) {
    setPrevHeadline(headline);
    setAcknowledged(false);
  }

  return (
    <Card title="What needs attention">
      <div className="action-item">
        <span className="action-dot" style={{ background: TONE_VAR[headlineTone] }} aria-hidden="true" />
        <div className="action-item-body">
          <p className="action-item-title">{headline}</p>
          {primaryActionLabel && !acknowledged && (
            <button type="button" className="action-item-button" onClick={() => setAcknowledged(true)}>
              {primaryActionLabel}
            </button>
          )}
          {primaryActionLabel && acknowledged && <span className="action-item-done">Acknowledged</span>}
        </div>
      </div>
      <div className="action-item action-item--static">
        <span className="action-dot" style={{ background: 'var(--color-success)' }} aria-hidden="true" />
        <div className="action-item-body">
          <p className="action-item-title">Model rollout: model-router v2.3.1</p>
          <p className="action-item-subtitle">Deployed to all regions, 0 rollbacks.</p>
        </div>
      </div>
    </Card>
  );
}
