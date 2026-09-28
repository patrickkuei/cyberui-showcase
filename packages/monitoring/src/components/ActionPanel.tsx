import { useState } from 'react';
import { Card } from 'cyberui-2045';

export interface ActionPanelProps {
  /**
   * Stable identity of the current situation (e.g. 'errors', 'latency', 'healthy').
   * An acknowledgment lasts until this changes; the headline may tick freely.
   */
  incidentKey: string;
  headline: string;
  headlineTone: 'success' | 'error';
  primaryActionLabel?: string;
}

const TONE_VAR: Record<ActionPanelProps['headlineTone'], string> = {
  success: 'var(--color-success)',
  error: 'var(--color-error)',
};

export function ActionPanel({ incidentKey, headline, headlineTone, primaryActionLabel }: ActionPanelProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  // Reset during render (not in an effect) when a genuinely new incident starts.
  const [prevIncidentKey, setPrevIncidentKey] = useState(incidentKey);
  if (incidentKey !== prevIncidentKey) {
    setPrevIncidentKey(incidentKey);
    setAcknowledged(false);
  }

  return (
    <Card title="What needs attention" className="action-panel">
      {primaryActionLabel && (
        <div className="action-item">
          <span className="action-dot" style={{ background: TONE_VAR[headlineTone] }} aria-hidden="true" />
          <div className="action-item-body">
            <p className="action-item-title">{headline}</p>
            {!acknowledged ? (
              <button type="button" className="action-item-button" onClick={() => setAcknowledged(true)}>
                {primaryActionLabel}
              </button>
            ) : (
              <span className="action-item-done">Acknowledged</span>
            )}
          </div>
        </div>
      )}
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
