import { useTranslation } from 'react-i18next';
import type { SessionView } from '@phonologic/shared-types';
import { Card, Badge, StatPill, Button, Icon } from '../../../components';

export interface SessionSummaryProps {
  session: SessionView;
  onExit: () => void;
}

export function SessionSummary({ session, onExit }: SessionSummaryProps) {
  const { t } = useTranslation();
  const totalQuestions = session.questions.length;
  const correctCount = session.answers.filter((a) => a.correct).length;
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  // Build a lookup for answers by questionId
  const answersByQuestionId: Record<string, (typeof session.answers)[number]> = {};
  for (const ans of session.answers) {
    answersByQuestionId[ans.questionId] = ans;
  }

  const speakingLabel =
    session.speaking === 'recorded'
      ? t('Đã thu âm')
      : session.speaking === 'skipped'
      ? t('Đã bỏ qua')
      : t('Chưa thu âm');

  return (
    <div className="flex flex-col gap-8 w-full max-w-3xl mx-auto py-6 animate-in fade-in duration-300">
      {/* Victory / Completion Banner */}
      <Card
        tone="soft"
        className="p-8! text-center flex flex-col items-center gap-4 rounded-3xl border border-outline-variant/30"
      >
        <div className="w-20 h-20 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shadow-[0_4px_0_#46a302]">
          <Icon name="emoji_events" size={44} />
        </div>

        <div>
          <Badge tone="green" icon="check_circle">
            {t('Đã hoàn thành phiên học')}
          </Badge>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-on-surface mt-2 tracking-tight">
            {session.mode === 'review' ? t('Ôn tập câu sai') : session.title}
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            {session.mode === 'review'
              ? t('Phiên ôn tập củng cố lỗi sai')
              : t('Bài học lộ trình ngữ âm chuẩn')}{' '}
            · {t('Giọng {{accent}}', { accent: session.accent })}
          </p>
        </div>

        {/* Real Metrics Row */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <StatPill icon="check_circle" tone="green">
            {t('Đúng {{correct}}/{{total}} câu', { correct: correctCount, total: totalQuestions })}
          </StatPill>
          <StatPill icon="percent" tone={accuracy >= 80 ? 'green' : accuracy >= 50 ? 'yellow' : 'red'}>
            {t('Độ chính xác {{accuracy}}%', { accuracy })}
          </StatPill>
          <StatPill icon="mic" tone="blue">
            {t('Luyện nói: {{status}}', { status: speakingLabel })}
          </StatPill>
        </div>
      </Card>

      {/* Review Questions Breakdown */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-lg text-on-surface flex items-center gap-2">
            <Icon name="fact_check" size={22} />
            {t('Chi tiết các câu hỏi trong phiên')}
          </h3>
          <span className="text-xs text-on-surface-variant">
            {t('Tổng cộng {{count}} câu', { count: totalQuestions })}
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {session.questions.map((q, idx) => {
            const ans = answersByQuestionId[q.id];
            const isCorrect = ans ? ans.correct : false;

            return (
              <div
                key={q.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col gap-2.5 bg-surface-lowest ${
                  ans
                    ? isCorrect
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-error/40 bg-error/5'
                    : 'border-outline-variant/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-surface-high text-on-surface text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-display font-bold text-sm text-on-surface">
                      {q.word ? t('Từ "{{word}}"', { word: q.word }) : q.prompt}
                    </span>
                  </div>

                  {ans ? (
                    <Badge tone={isCorrect ? 'green' : 'red'} icon={isCorrect ? 'check' : 'close'}>
                      {isCorrect ? t('Chính xác') : t('Cần ôn lại')}
                    </Badge>
                  ) : (
                    <Badge tone="neutral">{t('Chưa trả lời')}</Badge>
                  )}
                </div>

                {q.word && q.prompt && (
                  <p className="text-xs text-on-surface-variant pl-8">{q.prompt}</p>
                )}

                {ans && ans.explanation && (
                  <div className="ml-8 mt-1 p-2.5 rounded-xl bg-surface-low text-xs text-on-surface-variant flex items-start gap-2">
                    <Icon name="info" size={16} />
                    <span>{ans.explanation}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Exit CTA */}
      <div className="flex items-center justify-center pt-4">
        <Button variant="primary" size="lg" onClick={onExit} className="min-w-[200px]">
          {t('Quay lại lộ trình')}
          <Icon name="arrow_forward" size={20} />
        </Button>
      </div>
    </div>
  );
}
