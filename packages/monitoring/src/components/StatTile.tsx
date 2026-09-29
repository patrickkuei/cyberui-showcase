import type { ReactNode } from 'react';
import { Card } from 'cyberui-2045';

export interface StatTileProps {
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'warning' | 'error';
  icon?: ReactNode;
  status?: string;
  statusTone?: 'default' | 'success' | 'warning' | 'error';
}

const TONE_VAR: Record<NonNullable<StatTileProps['tone']>, string> = {
  default: 'var(--color-default)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  error: 'var(--color-error)',
};

export function StatTile({ label, value, tone = 'default', icon, status, statusTone = 'default' }: StatTileProps) {
  return (
    <Card title={label} variant="small" titleBorder={false} className="panel-surface">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {icon && (
          <span style={{ color: 'var(--color-secondary)', display: 'inline-flex' }} aria-hidden="true">
            {icon}
          </span>
        )}
        <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: TONE_VAR[tone] }}>{value}</p>
      </div>
      {status && (
        <p
          style={{
            margin: '0.375rem 0 0',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            color: TONE_VAR[statusTone],
          }}
        >
          <span
            aria-hidden="true"
            style={{ width: 6, height: 6, borderRadius: '9999px', background: 'currentColor', display: 'inline-block' }}
          />
          {status}
        </p>
      )}
    </Card>
  );
}
