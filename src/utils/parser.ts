import { Question, ParseResult } from '../types';

export const SAMPLE_MCQ_TEXT = `Section: Physics
Q: What is the SI unit of force?
A) Joule
B) Newton
C) Watt
D) Pascal
Answer: B
Explanation: The SI unit of force is the Newton (N), defined as the force needed to accelerate 1 kg of mass at 1 m/s^2.
---
Section: Physics
Q: Which of these is a vector quantity?
A) Mass
B) Speed
C) Velocity
D) Energy
Answer: C
Explanation: Velocity has both magnitude and direction, making it a vector quantity, unlike speed which is scalar.
---
Section: Chemistry
Q: What is the atomic number of Carbon?
A) 6
B) 12
C) 8
D) 14
Answer: A
Explanation: Carbon has 6 protons in its nucleus, giving it an atomic number of 6.
---
Section: Chemistry
Q: Which gas is most abundant in Earth's atmosphere?
A) Oxygen
B) Carbon Dioxide
C) Nitrogen
D) Argon
Answer: C
Explanation: Nitrogen makes up about 78% of Earth's atmosphere, far more than oxygen (~21%).
---
Section: Mathematics
Q: What is the value of pi rounded to two decimal places?
A) 3.12
B) 3.14
C) 3.16
D) 3.18
Answer: B
Explanation: Pi (the ratio of a circle's circumference to its diameter) is approximately 3.14159, rounding to 3.14.
---
Section: Mathematics
Q: Solve for x: 2x + 6 = 14
A) 2
B) 4
C) 6
D) 8
Answer: B
Explanation: 2x + 6 = 14 -> 2x = 8 -> x = 4.`;

export function parseMCQs(raw: string, defaultPosMarks: number = 4): ParseResult {
  if (!raw || !raw.trim()) {
    return { questions: [], sections: [], errors: [], totalMarks: 0 };
  }

  // Split by standard separator lines: ---
  let blocks = raw.split(/\n\s*---\s*\n|\r\n\s*---\s*\r\n|^---$/m).map(b => b.trim()).filter(Boolean);
  if (blocks.length <= 1) {
    blocks = raw.split(/-{3,}/).map(b => b.trim()).filter(Boolean);
  }

  const questions: Question[] = [];
  const sections: string[] = [];
  const errors: string[] = [];

  blocks.forEach((block, idx) => {
    const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const q: Question = {
      id: `q${idx + 1}`,
      section: 'General',
      text: '',
      options: [],
      answer: null,
      marks: defaultPosMarks,
      explanation: ''
    };

    let lastField: 'section' | 'text' | 'option' | 'answer' | 'marks' | 'explanation' | null = null;

    lines.forEach(line => {
      let m: RegExpMatchArray | null;
      if (/^section\s*:/i.test(line)) {
        q.section = line.replace(/^section\s*:/i, '').trim() || 'General';
        lastField = 'section';
      } else if (/^(q|question)\s*:/i.test(line)) {
        q.text = line.replace(/^(q|question)\s*:/i, '').trim();
        lastField = 'text';
      } else if ((m = line.match(/^([A-Da-d])[\)\.\:\-]\s*(.*)$/))) {
        q.options.push({ label: m[1].toUpperCase(), text: m[2].trim() });
        lastField = 'option';
      } else if (/^answer\s*:/i.test(line)) {
        const ansRaw = line.replace(/^answer\s*:/i, '').trim().toUpperCase();
        const letters = ansRaw.match(/[A-D]/g);
        q.answer = letters ? letters[0] : null;
        lastField = 'answer';
      } else if (/^marks\s*:/i.test(line)) {
        const mk = parseFloat(line.replace(/^marks\s*:/i, ''));
        if (!isNaN(mk)) q.marks = mk;
        lastField = 'marks';
      } else if (/^explanation\s*:/i.test(line)) {
        q.explanation = line.replace(/^explanation\s*:/i, '').trim();
        lastField = 'explanation';
      } else {
        // Multi-line continuation
        if (lastField === 'text') {
          q.text += ' ' + line;
        } else if (lastField === 'explanation') {
          q.explanation += ' ' + line;
        } else if (lastField === 'option' && q.options.length > 0) {
          q.options[q.options.length - 1].text += ' ' + line;
        }
      }
    });

    if (!q.text || q.options.length < 2) {
      errors.push(`Question block #${idx + 1} is missing question text or needs at least 2 options and was skipped.`);
      return;
    }

    if (!q.answer) {
      errors.push(`Question #${questions.length + 1} ("${q.text.slice(0, 35)}...") has no Answer: specified.`);
    }

    questions.push(q);
    if (!sections.includes(q.section)) {
      sections.push(q.section);
    }
  });

  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || defaultPosMarks), 0);
  return { questions, sections, errors, totalMarks };
}

export function formatQuestionsToText(questions: Question[]): string {
  return questions.map(q => {
    const parts = [
      `Section: ${q.section || 'General'}`,
      `Q: ${q.text}`,
      ...q.options.map(o => `${o.label}) ${o.text}`),
      `Answer: ${q.answer || 'A'}`
    ];
    if (q.explanation) {
      parts.push(`Explanation: ${q.explanation}`);
    }
    return parts.join('\n');
  }).join('\n---\n');
}

export function playChime(freq = 660, duration = 0.25) {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio might be blocked by browser policy until gesture
  }
}
