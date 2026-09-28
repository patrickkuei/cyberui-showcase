import { Card } from 'cyberui-2045';

export interface StatTileProps {
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'warning' | 'error';
}

const TONE_VAR: Record<NonNullable<StatTileProps['tone']>, string> = {
  default: 'var(--color-default)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  error: 'var(--color-error)',
};

export function StatTile({ label, value, tone = 'default' }: StatTileProps) {
  return (
    <Card title={label} variant="small" titleBorder={false}>
      <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: TONE_VAR[tone] }}>{value}</p>
    </Card>
  );
}
