import { Timeline } from 'cyberui-2045';
import { ACT_2 } from '../content/processStages';

export function ProcessActTwo() {
  const events = ACT_2.map((stage) => ({
    title: stage.title,
    time: stage.time,
    description: stage.description,
    status: 'info' as const,
  }));

  return (
    <section className="process-act process-act-glow">
      <h2>Where cyberui-2045 takes over</h2>
      <p className="process-act-lede">The four stages this library actually exists to accelerate.</p>
      <Timeline events={events} />
    </section>
  );
}
