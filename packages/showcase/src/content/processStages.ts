export interface ProcessStage {
  title: string;
  time: string;
  description: string;
}

export const ACT_1: ProcessStage[] = [
  {
    title: 'Discovery',
    time: 'Stage 1',
    description: 'Who is actually stuck, and on what — before anyone opens a design tool.',
  },
  {
    title: 'Research',
    time: 'Stage 2',
    description:
      "Talking to the people who'd use it, and to the data already sitting in support tickets and logs.",
  },
  {
    title: 'Information Architecture',
    time: 'Stage 3',
    description: 'What the product even contains, and how its pieces relate — before a single screen is drawn.',
  },
  {
    title: 'Wireframe',
    time: 'Stage 4',
    description: 'Where things sit on the page, argued in boxes and arrows before anyone picks a color.',
  },
];

export const ACT_2: ProcessStage[] = [
  {
    title: 'Visual Direction',
    time: 'Stage 5',
    description: "cyberui-2045's tokens set color, type, and glow in one place — swap the accent hue, the whole app re-themes.",
  },
  {
    title: 'Design System',
    time: 'Stage 6',
    description: '30+ production components with consistent variants, so "what should a danger button look like" is already answered.',
  },
  {
    title: 'High-Fidelity',
    time: 'Stage 7',
    description: 'The components you drop in are already the finished pixels — no separate polish pass to translate a mockup into code.',
  },
  {
    title: 'Motion & Interaction',
    time: 'Stage 8',
    description: 'Hover, focus, and glow states ship built into every component, not hand-rolled per project.',
  },
];

export const ACT_3: ProcessStage[] = [
  {
    title: 'Prototype & Testing',
    time: 'Stage 9',
    description: "Does it actually work for someone who isn't you? No library answers that for you.",
  },
  {
    title: 'Handoff',
    time: 'Stage 10',
    description:
      "The code you shipped already is the handoff — there's no separate spec to translate, because cyberui-2045 components are the real thing.",
  },
];
