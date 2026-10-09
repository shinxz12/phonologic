import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import type { ContentReportInput } from '@phonologic/shared-types';
import { api } from '../../../lib/api';
import { Button, IconButton, Icon } from '../../../components';

export interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  questionId?: string;
  ruleId?: string;
  version: number;
}

export function ReportDialog({ isOpen, onClose, questionId, ruleId, version }: ReportDialogProps) {
  const { t } = useTranslation();
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [validationErrorKey, setValidationErrorKey] = useState<string | null>(null);

  const reportMutation = useMutation({
    mutationFn: (payload: ContentReportInput) =>
      api<{ success: boolean }>('/learning/reports', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setDescription('');
        setValidationErrorKey(null);
        onClose();
      }, 1500);
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setValidationErrorKey('Vui lòng nhập mô tả lỗi.');
      return;
    }

    setValidationErrorKey(null);
    reportMutation.mutate({
      questionId,
      ruleId,
      version,
      description: description.trim(),
    });
  };

  const validationError = validationErrorKey ? t(validationErrorKey) : null;
  const errorMessage = validationError || (reportMutation.error ? reportMutation.error.message : null);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
    >
      <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl border border-outline-variant/30 flex flex-col gap-4 animate-in fade-in duration-200">
        <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
          <div className="flex items-center gap-2 text-error">
            <Icon name="flag" size={24} />
            <h2 id="report-dialog-title" className="font-display text-lg font-bold text-on-surface">
              {t('Báo lỗi nội dung')}
            </h2>
          </div>
          <IconButton icon="close" label={t('Đóng')} variant="ghost" size="sm" onClick={onClose} />
        </div>

        {submitted ? (
          <div className="py-8 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
              <Icon name="check" size={28} />
            </div>
            <p className="font-display font-bold text-on-surface">{t('Đã gửi báo cáo thành công!')}</p>
            <p className="text-sm text-on-surface-variant">
              {t('Cảm ơn bạn đã đóng góp giúp cải thiện chất lượng bài học.')}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <p className="text-sm text-on-surface-variant">
              {t('Nếu phát hiện lỗi phiên âm, phát âm TTS không chuẩn, đáp án không chính xác hoặc câu hỏi khó hiểu, vui lòng gửi phản hồi cho ban biên tập.')}
            </p>

            <div className="bg-surface-low rounded-lg p-3 text-xs text-on-surface-variant space-y-1">
              <div>
                {t('Phiên bản nội dung:')} <strong>v{version}</strong>
              </div>
              {questionId && (
                <div>
                  {t('Mã câu hỏi:')} <code className="font-mono">{questionId}</code>
                </div>
              )}
              {ruleId && (
                <div>
                  {t('Mã quy tắc:')} <code className="font-mono">{ruleId}</code>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="report-description" className="font-display text-sm font-bold text-on-surface">
                {t('Mô tả chi tiết lỗi')} <span className="text-error">*</span>
              </label>
              <textarea
                id="report-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("Ví dụ: Chùm ký tự 'ea' trong từ steak bị xếp sai âm vị, âm mẫu đọc không chuẩn...")}
                className="w-full rounded-xl border border-outline-variant bg-surface-lowest p-3 text-sm text-on-surface focus:outline-2 focus:outline-secondary resize-none"
                disabled={reportMutation.isPending}
              />
              {errorMessage && <p className="text-xs text-error font-medium">{errorMessage}</p>}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" size="md" onClick={onClose} disabled={reportMutation.isPending}>
                {t('Hủy bỏ')}
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={reportMutation.isPending}
                disabled={!description.trim()}
              >
                {t('Gửi báo cáo')}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
