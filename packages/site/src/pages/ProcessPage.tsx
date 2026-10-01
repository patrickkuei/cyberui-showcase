import { ProcessAct } from '../components/ProcessAct';
import { ProcessActTwo } from '../components/ProcessActTwo';
import { useRevealOnScroll } from '../hooks/useRevealOnScroll';
import { ACT_1, ACT_3 } from '../content/processStages';

function useReveal() {
  const { ref, visible } = useRevealOnScroll<HTMLDivElement>();
  return { ref, className: `process-reveal${visible ? ' process-reveal-visible' : ''}` };
}

export function ProcessPage() {
  const act1 = useReveal();
  const act2 = useReveal();
  const act3 = useReveal();

  return (
    <div className="process-page">
      <h1>How we design</h1>
      <p className="process-intro">
        Ten stages go into a real product. cyberui-2045 only helps with four of them — here's
        honestly which ones.
      </p>

      <div ref={act1.ref} className={act1.className}>
        <ProcessAct
          title="Before the pixels"
          lede="Entirely on your team. No library does this for you."
          stages={ACT_1}
        />
      </div>

      <div ref={act2.ref} className={act2.className}>
        <ProcessActTwo />
      </div>

      <div ref={act3.ref} className={act3.className}>
        <ProcessAct
          title="Proving it's real"
          lede="Back to your team for testing. Handoff barely exists — the code you shipped already is the handoff."
          stages={ACT_3}
        />
      </div>
    </div>
  );
}
