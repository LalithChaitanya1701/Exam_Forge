import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseMCQs, formatQuestionsToText, SAMPLE_MCQ_TEXT } from '../src/utils/parser.js';

describe('parseMCQs', () => {
  test('parses sample MCQ text correctly', () => {
    const result = parseMCQs(SAMPLE_MCQ_TEXT, 4);
    assert.equal(result.errors.length, 0);
    assert.equal(result.questions.length, 6);
    assert.deepEqual(result.sections, ['Physics', 'Chemistry', 'Mathematics']);
    assert.equal(result.totalMarks, 24);

    const q1 = result.questions[0];
    assert.equal(q1.section, 'Physics');
    assert.equal(q1.text, 'What is the SI unit of force?');
    assert.equal(q1.answer, 'B');
    assert.equal(q1.options.length, 4);
    assert.equal(q1.marks, 4);
  });

  test('handles empty input gracefully', () => {
    const result = parseMCQs('', 4);
    assert.deepEqual(result.questions, []);
    assert.deepEqual(result.sections, []);
    assert.equal(result.totalMarks, 0);
  });

  test('does not misidentify letters inside descriptive answer lines', () => {
    const text = `Section: General
Q: Which option is best?
A) Option 1
B) Option 2
Answer: None of the above
---
Section: General
Q: Second question?
A) First choice
B) Second choice
Answer: Option B
`;
    const result = parseMCQs(text, 2);
    assert.equal(result.questions.length, 2);
    // "None of the above" should not assign 'A' because there is no standalone option letter
    assert.equal(result.questions[0].answer, null);
    // "Option B" should match the standalone 'B'
    assert.equal(result.questions[1].answer, 'B');
  });

  test('formats questions back to text', () => {
    const result = parseMCQs(SAMPLE_MCQ_TEXT, 4);
    const text = formatQuestionsToText(result.questions);
    assert.ok(text.includes('Section: Physics'));
    assert.ok(text.includes('Answer: B'));
  });
});
