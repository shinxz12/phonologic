import { useState, useMemo } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { ContentBundle } from '@phonologic/shared-types';
import { Button, Badge, Card, Icon } from '../../components';
import { ApiError } from '../../lib/api';

interface AdminPublishTabProps {
  draft: ContentBundle;
  publishedVersion: number;
  onPublish: (flags: { notationConfirmed: boolean; notationVersion: string }) => void;
  publishing: boolean;
  error?: unknown | null;
  lastPublishSuccess: boolean;
}

export function AdminPublishTab({
  draft,
  publishedVersion,
  onPublish,
  publishing,
  error,
  lastPublishSuccess,
}: AdminPublishTabProps) {
  const { t } = useTranslation();
  const [notationVersion, setNotationVersion] = useState(draft.notationVersion || '2026.10-v1');
  const [notationConfirmed, setNotationConfirmed] = useState(draft.notationConfirmed || false);

  // Pre-publish validation and summary stats
  const checkSummary = useMemo(() => {
    const totalRules = draft.rules.length;
    const approvedRules = draft.rules.filter((r) => r.status === 'approved').length;
    const draftRules = draft.rules.filter((r) => r.status === 'draft').length;
    const missingNotationRules = draft.rules.filter((r) => !r.notation || !r.notation.trim()).length;

    const totalLessons = draft.lessons.length;
    const totalQuestions = draft.lessons.reduce((acc, l) => acc + l.questions.length, 0);

    const totalReadings = draft.readings.length;
    const totalTargets = draft.readings.reduce((acc, r) => acc + r.targets.length, 0);

    return {
      totalRules,
      approvedRules,
      draftRules,
      missingNotationRules,
      totalLessons,
      totalQuestions,
      totalReadings,
      totalTargets,
    };
  }, [draft]);

  const canSubmitPublish =
    notationConfirmed &&
    notationVersion.trim().length > 0 &&
    !publishing;

  const handlePublishSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmitPublish) return;
    onPublish({
      notationConfirmed: true,
      notationVersion: notationVersion.trim(),
    });
  };

  const activeServerError =
    !error
      ? null
      : error instanceof ApiError
        ? error.message
        : error instanceof Error
          ? error.message || t('Lỗi không xác định khi xuất bản')
          : typeof error === 'string'
            ? error
            : t('Lỗi không xác định khi xuất bản');

  const activeFieldErrors: Record<string, string> =
    error instanceof ApiError ? error.fields || {} : {};

  const fieldErrorEntries = Object.entries(activeFieldErrors);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Snapshot Version Banner */}
      <Card tone="white" className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary shrink-0">
            <Icon name="history_edu" size={32} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                {t('Snapshot Version Hiện Tại')}
              </span>
              <Badge tone={publishedVersion > 0 ? 'green' : 'neutral'}>
                {publishedVersion > 0 ? t('Bản phát hành v{{version}}', { version: publishedVersion }) : t('Chưa từng xuất bản')}
              </Badge>
            </div>
            <h2 className="text-2xl font-black text-on-surface font-display">
              {publishedVersion > 0 ? t('Phiên bản v{{version}}', { version: publishedVersion }) : t('v0 (Chưa có bản snapshot)')}
            </h2>
            <p className="text-xs text-on-surface-variant mt-1 max-w-xl">
              {t(
                'Khi xuất bản, hệ thống sẽ tạo một bản chụp nội dung bất biến (Immutable Snapshot v{{nextVersion}}). Các phiên học đang chạy sẽ tiếp tục phiên bản cũ; người học bắt đầu phiên mới sẽ dùng snapshot mới này.',
                { nextVersion: publishedVersion + 1 }
              )}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-surface-low border border-outline-variant/20 flex flex-col items-center justify-center text-center shrink-0 w-full md:w-auto">
          <span className="text-[11px] font-bold text-on-surface-variant uppercase">{t('Phiên bản tiếp theo dự kiến')}</span>
          <span className="text-2xl font-black text-primary font-display mt-0.5">
            v{publishedVersion + 1}
          </span>
        </div>
      </Card>

      {/* Success Banner if just published */}
      {lastPublishSuccess && (
        <Card tone="green" className="flex items-start gap-3.5">
          <div className="text-primary mt-0.5 shrink-0">
            <Icon name="check_circle" size={24} />
          </div>
          <div className="text-xs leading-relaxed">
            <strong className="text-on-surface font-bold block text-sm mb-0.5">
              {t('Xuất bản phiên bản v{{version}} thành công!', { version: publishedVersion })}
            </strong>
            <p className="text-on-surface-variant">
              {t(
                'Toàn bộ quy tắc đã duyệt, bài học và bài đọc đã được ghi nhận vào snapshot v{{version}}. Hệ thống học tập của học viên đã được đồng bộ với phiên bản mới nhất.',
                { version: publishedVersion }
              )}
            </p>
          </div>
        </Card>
      )}

      {/* Pre-Publish Checklist */}
      <Card tone="white" className="flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-3">
          <span className="text-secondary">
            <Icon name="fact_check" size={22} />
          </span>
          <h3 className="text-sm font-bold text-on-surface">
            {t('Kiểm tra điều kiện xuất bản gói nội dung')}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {/* Rules status */}
          <div className="p-3.5 rounded-xl bg-surface-low border border-outline-variant/20 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface">{t('Quy tắc chữ–âm (Rules)')}</span>
              <span className="text-xs font-black text-on-surface font-display">{checkSummary.totalRules}</span>
            </div>
            <div className="text-[11px] text-on-surface-variant space-y-0.5">
              <div className="flex justify-between">
                <span>{t('Đã duyệt (Approved):')}</span>
                <strong className="text-emerald-700">{checkSummary.approvedRules}</strong>
              </div>
              <div className="flex justify-between">
                <span>{t('Bản nháp (Draft):')}</span>
                <span className="text-amber-700">{checkSummary.draftRules}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('Chưa có ký hiệu chính thức:')}</span>
                <span className={checkSummary.missingNotationRules > 0 ? 'text-amber-800 font-bold' : 'text-emerald-700'}>
                  {checkSummary.missingNotationRules}
                </span>
              </div>
            </div>
          </div>

          {/* Lessons status */}
          <div className="p-3.5 rounded-xl bg-surface-low border border-outline-variant/20 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface">{t('Bài học theo lộ trình')}</span>
              <span className="text-xs font-black text-on-surface font-display">{checkSummary.totalLessons}</span>
            </div>
            <div className="text-[11px] text-on-surface-variant space-y-0.5">
              <div className="flex justify-between">
                <span>{t('Tổng số câu hỏi:')}</span>
                <strong>{checkSummary.totalQuestions}</strong>
              </div>
              <div className="flex justify-between">
                <span>{t('Dạng bài trắc nghiệm / âm vị:')}</span>
                <span className="text-on-surface-variant">{t('Kiểm tra khi xuất bản')}</span>
              </div>
            </div>
          </div>

          {/* Readings status */}
          <div className="p-3.5 rounded-xl bg-surface-low border border-outline-variant/20 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface">{t('Bài đọc thư viện (Reading)')}</span>
              <span className="text-xs font-black text-on-surface font-display">{checkSummary.totalReadings}</span>
            </div>
            <div className="text-[11px] text-on-surface-variant space-y-0.5">
              <div className="flex justify-between">
                <span>{t('Từ mục tiêu (Targets):')}</span>
                <strong>{checkSummary.totalTargets}</strong>
              </div>
              <div className="flex justify-between">
                <span>{t('Offset văn bản:')}</span>
                <span className="text-on-surface-variant">{t('Kiểm tra khi xuất bản')}</span>
              </div>
            </div>
          </div>
        </div>

        {checkSummary.missingNotationRules > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-start gap-2.5">
            <span className="text-amber-600 mt-0.5 shrink-0">
              <Icon name="warning" size={20} />
            </span>
            <div className="leading-relaxed">
              <strong>{t('Cảnh báo quy tắc chưa có ký hiệu chính thức:')}</strong>
              <p className="mt-0.5">
                {t(
                  'Hiện có {{count}} quy tắc chưa được gán ký hiệu chính thức (Custom Notation). Khi người học truy cập sổ tay quy tắc, chỉ các quy tắc đã được duyệt và có ký hiệu mới được phục vụ.',
                  { count: checkSummary.missingNotationRules }
                )}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Validated Server Issues Display */}
      {(activeServerError || fieldErrorEntries.length > 0) && (
        <Card tone="soft" className="border-2 border-red-300 flex flex-col gap-3">
          <div className="flex items-center gap-2.5 text-error font-bold">
            <Icon name="cancel" size={24} />
            <h3 className="text-sm uppercase tracking-wide">
              {t('Máy chủ phát hiện lỗi kiểm duyệt (Validated Server Issues)')}
            </h3>
          </div>

          {activeServerError && (
            <p className="text-xs font-semibold text-error bg-red-100/70 p-3 rounded-xl border border-red-200">
              {activeServerError}
            </p>
          )}

          {fieldErrorEntries.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-on-surface">{t('Chi tiết lỗi theo từng trường dữ liệu:')}</span>
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                {fieldErrorEntries.map(([field, msg]) => (
                  <div
                    key={field}
                    className="p-2.5 rounded-lg bg-surface-lowest border border-red-200 text-xs flex flex-col gap-0.5"
                  >
                    <code className="text-[11px] font-bold text-error font-mono">{field}</code>
                    <span className="text-on-surface">{msg}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Publish Form */}
      <form onSubmit={handlePublishSubmit}>
        <Card tone="white" className="flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-3">
            <span className="text-primary">
              <Icon name="publish" size={22} />
            </span>
            <h3 className="text-sm font-bold text-on-surface">
              {t('Thông tin xuất bản phiên bản mới (POST /learning/admin/publish)')}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Notation Version input */}
            <div>
              <label htmlFor="publish-notation-version" className="block text-xs font-bold text-on-surface mb-1">
                {t('Phiên bản hệ ký hiệu (Notation Version)')} <span className="text-error">*</span>
              </label>
              <input
                id="publish-notation-version"
                type="text"
                required
                value={notationVersion}
                onChange={(e) => setNotationVersion(e.target.value)}
                placeholder="Ví dụ: 2026.10-v1 hoặc 1.0.0"
                className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-low text-sm font-mono focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <span className="block text-[11px] text-on-surface-variant mt-1">
                {t('Định danh phiên bản quy ước ngữ âm dùng cho lần phát hành này.')}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-low border border-outline-variant/20 flex flex-col justify-center text-xs text-on-surface-variant">
              <strong className="text-on-surface mb-0.5">{t('Cơ chế phát hành an toàn:')}</strong>
              <span>
                {t('Mỗi lần xuất bản tạo một bản ghi độc lập. Học viên đang làm bài tập dở dang không bị ngắt quãng phiên học.')}
              </span>
            </div>
          </div>

          {/* Explicit Notation Confirmation Checkbox */}
          <div className={`p-4 rounded-xl border transition ${notationConfirmed ? 'bg-primary/5 border-primary/40' : 'bg-surface-low border-outline-variant/40'}`}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                id="explicit-notation-confirmation-cb"
                checked={notationConfirmed}
                onChange={(e) => setNotationConfirmed(e.target.checked)}
                className="mt-1 h-5 w-5 rounded border-outline-variant text-primary focus:ring-primary shrink-0 accent-primary"
              />
              <div className="text-xs leading-relaxed">
                <strong className="block text-sm font-bold text-on-surface mb-1">
                  {t('Xác nhận chính thức hệ thống ký hiệu (Notation Confirmation)')} <span className="text-error">*</span>
                </strong>
                <p className="text-on-surface-variant">
                  {t(
                    'Tôi xác nhận rằng toàn bộ hệ thống ký hiệu phiên âm (Custom Notation) trong gói nội dung này đã được rà soát và đối chiếu đúng quy ước riêng của chủ sản phẩm. Tuyệt đối không sử dụng ký hiệu IPA đối với người học. Các nhãn cột Sound trong Excel chỉ đóng vai trò dữ liệu nguồn tham chiếu.'
                  )}
                </p>
              </div>
            </label>
          </div>

          {/* Action Button & Status */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 border-t border-outline-variant/20">
            <div className="text-xs text-on-surface-variant">
              {!notationConfirmed && (
                <span className="text-amber-800 font-semibold flex items-center gap-1">
                  <Icon name="info" size={16} />
                  {t('Vui lòng tích chọn xác nhận hệ thống ký hiệu trước khi xuất bản.')}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="submit"
                variant="primary"
                size="md"
                icon="rocket_launch"
                loading={publishing}
                disabled={!canSubmitPublish}
              >
                {publishing
                  ? t('Đang xuất bản...')
                  : t('Xuất bản phiên bản v{{version}}', { version: publishedVersion + 1 })}
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
