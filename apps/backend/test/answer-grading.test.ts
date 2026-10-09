import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { isCorrectAnswer } from '../src/learning/answer-grading';
import type { ContentQuestion } from '@phonologic/shared-types';

const spelling: Pick<ContentQuestion, 'kind' | 'choices' | 'correctIds'> = {
  kind: 'spelling',
  choices: ['l', 'e', 't', 't', 'e', 'r'].map((label, index) => ({ id: `${label}${index}`, label })),
  correctIds: ['l0', 'e1', 't2', 't3', 'e4', 'r5'],
};

test('identical repeated spelling tiles do not penalize a correctly assembled word', () => {
  assert.equal(isCorrectAnswer(spelling, ['l0', 'e4', 't3', 't2', 'e1', 'r5']), true);
});

test('spelling still requires the correct visible order and consumes each tile once', () => {
  assert.equal(isCorrectAnswer(spelling, ['l0', 'e1', 't2', 'e4', 't3', 'r5']), false);
  assert.equal(isCorrectAnswer(spelling, ['l0', 'e1', 't2', 't2', 'e4', 'r5']), false);
  assert.equal(isCorrectAnswer(spelling, ['l0', 'e1', 't2', 't3', 'e4']), false);
  assert.equal(isCorrectAnswer(spelling, ['l0', 'e1', 't2', 't3', 'unknown', 'r5']), false);
});

test('same spelling with visibly different notation is not interchangeable', () => {
  const question = { kind: 'spelling' as const, choices: [{ id: 'one', label: 'a', description: 'sound-one' }, { id: 'two', label: 'a', description: 'sound-two' }], correctIds: ['one', 'two'] };
  assert.equal(isCorrectAnswer(question, ['two', 'one']), false);
});

test('multiselect requires every correct choice and no extra or repeated choices', () => {
  const question = { kind: 'sound_spelling' as const, choices: [{ id: 'ea', label: 'ea' }, { id: 'ai', label: 'ai' }, { id: 'oo', label: 'oo' }], correctIds: ['ea', 'ai'] };
  assert.equal(isCorrectAnswer(question, ['ai', 'ea']), true);
  assert.equal(isCorrectAnswer(question, ['ea']), false);
  assert.equal(isCorrectAnswer(question, ['ea', 'ai', 'oo']), false);
  assert.equal(isCorrectAnswer(question, ['ea', 'ea']), false);
});
