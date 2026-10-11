import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Exam, SectionBreakdown } from '../server/db.js';

function gradeExamLogic(
  exam: Exam,
  answers: Record<string, string>
) {
  let correct = 0;
  let wrong = 0;
  let unattempted = 0;
  let scoreObtained = 0;

  const bySection: Record<string, SectionBreakdown> = {};

  exam.questions.forEach(q => {
    const sec = q.section || 'General';
    const qPosMarks = Number(q.marks) || Number(exam.posMarks) || 4;

    if (!bySection[sec]) {
      bySection[sec] = { total: 0, correct: 0, wrong: 0, unattempted: 0, marks: 0, marksTotal: 0 };
    }
    bySection[sec].total += 1;
    bySection[sec].marksTotal += qPosMarks;

    const userChoice = answers[q.id];
    if (userChoice == null || userChoice === '') {
      unattempted += 1;
      bySection[sec].unattempted += 1;
    } else if (!q.answer) {
      // Question has no official answer key: do not penalize student with negative marks
      unattempted += 1;
      bySection[sec].unattempted += 1;
    } else if (String(userChoice).toUpperCase() === String(q.answer).toUpperCase()) {
      correct += 1;
      scoreObtained += qPosMarks;
      bySection[sec].correct += 1;
      bySection[sec].marks += qPosMarks;
    } else {
      wrong += 1;
      scoreObtained -= exam.negMarks;
      bySection[sec].wrong += 1;
      bySection[sec].marks -= exam.negMarks;
    }
  });

  const percentage = exam.totalMarks > 0 ? (scoreObtained / exam.totalMarks) * 100 : 0;

  return {
    score: Math.round(scoreObtained * 100) / 100,
    percentage: Math.round(percentage * 100) / 100,
    correct,
    wrong,
    unattempted,
    bySection
  };
}

describe('Exam Scoring & Grading Logic', () => {
  const mockExam: Exam = {
    id: 'exam-test-1',
    title: 'Test Exam',
    duration: 60,
    posMarks: 4,
    negMarks: 1,
    sections: ['Physics', 'Chemistry'],
    totalMarks: 16,
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 'q1',
        section: 'Physics',
        text: 'Question 1',
        options: [{ label: 'A', text: '1' }, { label: 'B', text: '2' }],
        answer: 'A',
        marks: 4,
        explanation: ''
      },
      {
        id: 'q2',
        section: 'Physics',
        text: 'Question 2',
        options: [{ label: 'A', text: '1' }, { label: 'B', text: '2' }],
        answer: 'B',
        marks: 4,
        explanation: ''
      },
      {
        id: 'q3',
        section: 'Chemistry',
        text: 'Question 3',
        options: [{ label: 'A', text: '1' }, { label: 'B', text: '2' }],
        answer: 'A',
        marks: 4,
        explanation: ''
      },
      {
        id: 'q4',
        section: 'Chemistry',
        text: 'Question 4 (Missing answer key)',
        options: [{ label: 'A', text: '1' }, { label: 'B', text: '2' }],
        answer: null,
        marks: 4,
        explanation: ''
      }
    ]
  };

  test('scores correctly with positive marks, wrong marks and unattempted', () => {
    // q1 correct (+4), q2 wrong (-1), q3 unattempted (0), q4 missing key (no penalty)
    const result = gradeExamLogic(mockExam, {
      q1: 'A',
      q2: 'A',
      q4: 'B' // answered, but question has no answer key
    });

    assert.equal(result.correct, 1);
    assert.equal(result.wrong, 1);
    assert.equal(result.unattempted, 2); // q3 unattempted + q4 treated as unattempted/neutral
    assert.equal(result.score, 3); // 4 - 1 = 3
    assert.equal(result.percentage, 18.75); // 3 / 16 * 100 = 18.75%
  });

  test('grades case-insensitively', () => {
    const result = gradeExamLogic(mockExam, {
      q1: 'a', // lowercase
      q2: 'b'
    });

    assert.equal(result.correct, 2);
    assert.equal(result.wrong, 0);
    assert.equal(result.score, 8);
  });

  test('computes section breakdowns properly', () => {
    const result = gradeExamLogic(mockExam, {
      q1: 'A',
      q2: 'A'
    });

    assert.equal(result.bySection['Physics'].total, 2);
    assert.equal(result.bySection['Physics'].correct, 1);
    assert.equal(result.bySection['Physics'].wrong, 1);
    assert.equal(result.bySection['Physics'].marks, 3);

    assert.equal(result.bySection['Chemistry'].total, 2);
    assert.equal(result.bySection['Chemistry'].correct, 0);
    assert.equal(result.bySection['Chemistry'].unattempted, 2);
    assert.equal(result.bySection['Chemistry'].marks, 0);
  });
});
