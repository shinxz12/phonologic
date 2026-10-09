import type { ContentQuestion } from '@phonologic/shared-types';

type GradableQuestion = Pick<ContentQuestion, 'kind' | 'choices' | 'correctIds'>;

export function isCorrectAnswer(question: GradableQuestion, selectedIds: string[]): boolean {
  if (selectedIds.length !== question.correctIds.length || selectedIds.some((id, index) => selectedIds.indexOf(id) !== index)) return false;
  if (question.kind !== 'spelling') return selectedIds.every(id => question.correctIds.includes(id));

  return question.correctIds.every((expectedId, index) => {
    const selectedId = selectedIds[index];
    if (expectedId === selectedId) return true;
    const expected = question.choices.find(choice => choice.id === expectedId);
    const selected = question.choices.find(choice => choice.id === selectedId);
    // Identical visible tiles are interchangeable; their spelling order is not.
    return Boolean(expected && selected && expected.label === selected.label && expected.description === selected.description);
  });
}
