import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type {
  ContentBundle,
} from '@phonologic/shared-types';
import { Button, Badge, Card, Icon } from '../../components';
import { ApiError } from '../../lib/api';

interface LocalValidationIssue {
  key: string;
  params?: Record<string, unknown>;
}

interface FeedbackNotice {
  key: string;
  params?: Record<string, unknown>;
}

interface OperationErrorState {
  err?: unknown;
  key?: string;
  params?: Record<string, unknown>;
  titleKey?: string;
  fallbackKey?: string;
}

interface AdminBundleTabProps {
  draft: ContentBundle;
  onApplyDraft: (updatedBundle: ContentBundle) => void;
  onSaveDraft: (bundleToSave?: ContentBundle) => Promise<void>;
  saving: boolean;
  isDirty: boolean;
}

export function AdminBundleTab({
  draft,
  onApplyDraft,
  onSaveDraft,
  saving,
  isDirty,
}: AdminBundleTabProps) {
  const { t } = useTranslation();
  // Controlled JSON string
  const [jsonString, setJsonString] = useState(() => JSON.stringify(draft, null, 2));
  const [parseError, setParseError] = useState<OperationErrorState | null>(null);
  const [validationErrors, setValidationErrors] = useState<LocalValidationIssue[]>([]);
  const [validationSuccess, setValidationSuccess] = useState<FeedbackNotice | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'notation' | 'schema' | 'sample'>('notation');

  // Keep local jsonString in sync when draft changes externally
  useEffect(() => {
    try {
      const currentParsed = JSON.parse(jsonString);
      if (JSON.stringify(currentParsed) === JSON.stringify(draft)) {
        return;
      }
    } catch {
      // ignore JSON parse error during editing
    }
    setJsonString(JSON.stringify(draft, null, 2));
    setParseError(null);
    setValidationErrors([]);
  }, [draft]);

  // Validate JSON string
  const validateBundleJson = (
    text: string
  ): { valid: boolean; bundle?: ContentBundle; errors: LocalValidationIssue[] } => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      return {
        valid: false,
        errors: [{ key: 'Lỗi cú pháp JSON: {{detail}}', params: { detail } }],
      };
    }

    const errors: LocalValidationIssue[] = [];

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      errors.push({ key: 'Gói nội dung phải là một JSON Object ở cấp gốc.' });
      return { valid: false, errors };
    }

    const root = parsed as Record<string, unknown>;

    if (typeof root.notationVersion !== 'string' || !root.notationVersion.trim()) {
      errors.push({
        key: 'Thiếu notationVersion (chuỗi phiên bản ký hiệu, ví dụ "2026.10-v1").',
      });
    }

    if (typeof root.notationConfirmed !== 'boolean') {
      errors.push({ key: 'Thiếu notationConfirmed (boolean: true hoặc false).' });
    }

    if (!Array.isArray(root.rules)) {
      errors.push({ key: 'Trường "rules" phải là một mảng SourceRule.' });
    } else {
      root.rules.forEach((item: unknown, idx: number) => {
        if (typeof item !== 'object' || item === null || Array.isArray(item)) {
          errors.push({
            key: 'rules[{{index}}]: Quy tắc phải là một object.',
            params: { index: idx },
          });
          return;
        }
        const r = item as Record<string, unknown>;
        if (typeof r.id !== 'string' || !r.id) {
          errors.push({
            key: 'rules[{{index}}]: Thiếu trường "id".',
            params: { index: idx },
          });
        }
        if (typeof r.sourceRow !== 'number') {
          errors.push({
            key: 'rules[{{index}}]: "sourceRow" phải là số dòng.',
            params: { index: idx },
          });
        }
        if (typeof r.sourceLabel !== 'string' || !r.sourceLabel) {
          errors.push({
            key: 'rules[{{index}}]: Thiếu "sourceLabel" (nhãn nguồn Excel).',
            params: { index: idx },
          });
        }
        if (typeof r.pattern !== 'string' || !r.pattern) {
          errors.push({
            key: 'rules[{{index}}]: Thiếu "pattern" (tổ hợp chữ).',
            params: { index: idx },
          });
        }
        if (!Array.isArray(r.examples)) {
          errors.push({
            key: 'rules[{{index}}]: "examples" phải là mảng từ ví dụ.',
            params: { index: idx },
          });
        }
        if (r.status !== 'draft' && r.status !== 'approved') {
          errors.push({
            key: 'rules[{{index}}]: "status" phải là "draft" hoặc "approved".',
            params: { index: idx },
          });
        }
      });
    }

    if (!Array.isArray(root.lessons)) {
      errors.push({ key: 'Trường "lessons" phải là một mảng LessonContent.' });
    } else {
      root.lessons.forEach((item: unknown, idx: number) => {
        if (typeof item !== 'object' || item === null || Array.isArray(item)) {
          errors.push({
            key: 'lessons[{{index}}]: Bài học phải là một object.',
            params: { index: idx },
          });
          return;
        }
        const l = item as Record<string, unknown>;
        if (typeof l.id !== 'string' || !l.id) {
          errors.push({
            key: 'lessons[{{index}}]: Thiếu trường "id".',
            params: { index: idx },
          });
        }
        if (typeof l.title !== 'string' || !l.title) {
          errors.push({
            key: 'lessons[{{index}}]: Thiếu trường "title".',
            params: { index: idx },
          });
        }
        if (l.accent !== 'US' && l.accent !== 'UK') {
          errors.push({
            key: 'lessons[{{index}}]: "accent" phải là "US" hoặc "UK".',
            params: { index: idx },
          });
        }
        if (!Array.isArray(l.questions)) {
          errors.push({
            key: 'lessons[{{index}}]: "questions" phải là một mảng.',
            params: { index: idx },
          });
        } else {
          l.questions.forEach((qItem: unknown, qIdx: number) => {
            if (typeof qItem !== 'object' || qItem === null || Array.isArray(qItem)) {
              errors.push({
                key: 'lessons[{{index}}].questions[{{qIndex}}]: Câu hỏi phải là một object.',
                params: { index: idx, qIndex: qIdx },
              });
              return;
            }
            const q = qItem as Record<string, unknown>;
            if (typeof q.id !== 'string' || !q.id) {
              errors.push({
                key: 'lessons[{{index}}].questions[{{qIndex}}]: Thiếu "id".',
                params: { index: idx, qIndex: qIdx },
              });
            }
            if (typeof q.prompt !== 'string' || !q.prompt) {
              errors.push({
                key: 'lessons[{{index}}].questions[{{qIndex}}]: Thiếu "prompt".',
                params: { index: idx, qIndex: qIdx },
              });
            }
            if (typeof q.kind !== 'string' || !q.kind) {
              errors.push({
                key: 'lessons[{{index}}].questions[{{qIndex}}]: Thiếu "kind".',
                params: { index: idx, qIndex: qIdx },
              });
            }
            if (!Array.isArray(q.choices) || q.choices.length === 0) {
              errors.push({
                key: 'lessons[{{index}}].questions[{{qIndex}}]: "choices" phải có ít nhất 1 lựa chọn.',
                params: { index: idx, qIndex: qIdx },
              });
            }
            if (!Array.isArray(q.correctIds) || q.correctIds.length === 0) {
              errors.push({
                key: 'lessons[{{index}}].questions[{{qIndex}}]: "correctIds" phải có ít nhất 1 đáp án đúng.',
                params: { index: idx, qIndex: qIdx },
              });
            }
          });
        }
      });
    }

    if (!Array.isArray(root.readings)) {
      errors.push({ key: 'Trường "readings" phải là một mảng ReadingContent.' });
    } else {
      root.readings.forEach((item: unknown, idx: number) => {
        if (typeof item !== 'object' || item === null || Array.isArray(item)) {
          errors.push({
            key: 'readings[{{index}}]: Bài đọc phải là một object.',
            params: { index: idx },
          });
          return;
        }
        const rd = item as Record<string, unknown>;
        if (typeof rd.id !== 'string' || !rd.id) {
          errors.push({
            key: 'readings[{{index}}]: Thiếu trường "id".',
            params: { index: idx },
          });
        }
        if (typeof rd.title !== 'string' || !rd.title) {
          errors.push({
            key: 'readings[{{index}}]: Thiếu trường "title".',
            params: { index: idx },
          });
        }
        if (typeof rd.text !== 'string' || !rd.text) {
          errors.push({
            key: 'readings[{{index}}]: Thiếu trường "text".',
            params: { index: idx },
          });
        }
        if (!Array.isArray(rd.targets)) {
          errors.push({
            key: 'readings[{{index}}]: "targets" phải là một mảng.',
            params: { index: idx },
          });
        } else {
          rd.targets.forEach((tgItem: unknown, tIdx: number) => {
            if (typeof tgItem !== 'object' || tgItem === null || Array.isArray(tgItem)) {
              errors.push({
                key: 'readings[{{index}}].targets[{{tIndex}}]: Mục tiêu phải là một object.',
                params: { index: idx, tIndex: tIdx },
              });
              return;
            }
            const tg = tgItem as Record<string, unknown>;
            if (typeof tg.id !== 'string' || !tg.id) {
              errors.push({
                key: 'readings[{{index}}].targets[{{tIndex}}]: Thiếu "id".',
                params: { index: idx, tIndex: tIdx },
              });
            }
            if (typeof tg.word !== 'string' || !tg.word) {
              errors.push({
                key: 'readings[{{index}}].targets[{{tIndex}}]: Thiếu "word".',
                params: { index: idx, tIndex: tIdx },
              });
            }
            if (typeof tg.start !== 'number' || typeof tg.end !== 'number') {
              errors.push({
                key: 'readings[{{index}}].targets[{{tIndex}}]: "start" và "end" phải là vị trí số (offset).',
                params: { index: idx, tIndex: tIdx },
              });
            }
          });
        }
      });
    }

    return {
      valid: errors.length === 0,
      bundle: errors.length === 0 ? (parsed as unknown as ContentBundle) : undefined,
      errors,
    };
  };

  // Metrics from current text if valid
  const bundleMetrics = useMemo(() => {
    try {
      const p = JSON.parse(jsonString);
      if (typeof p !== 'object' || p === null || Array.isArray(p)) return null;
      const root = p as Record<string, unknown>;
      const rulesCount = Array.isArray(root.rules) ? root.rules.length : 0;
      const lessonsCount = Array.isArray(root.lessons) ? root.lessons.length : 0;
      const questionsCount = Array.isArray(root.lessons)
        ? root.lessons.reduce((acc: number, l: unknown) => {
            if (typeof l === 'object' && l !== null && !Array.isArray(l)) {
              const lObj = l as Record<string, unknown>;
              if (Array.isArray(lObj.questions)) {
                return acc + lObj.questions.length;
              }
            }
            return acc;
          }, 0)
        : 0;
      const readingsCount = Array.isArray(root.readings) ? root.readings.length : 0;
      const targetsCount = Array.isArray(root.readings)
        ? root.readings.reduce((acc: number, r: unknown) => {
            if (typeof r === 'object' && r !== null && !Array.isArray(r)) {
              const rObj = r as Record<string, unknown>;
              if (Array.isArray(rObj.targets)) {
                return acc + rObj.targets.length;
              }
            }
            return acc;
          }, 0)
        : 0;
      return {
        rulesCount,
        lessonsCount,
        questionsCount,
        readingsCount,
        targetsCount,
        notationConfirmed: Boolean(root.notationConfirmed),
        notationVersion: typeof root.notationVersion === 'string' ? root.notationVersion : '',
      };
    } catch {
      return null;
    }
  }, [jsonString]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Overview Banner inside Card */}
      <Card tone="white" className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-on-surface font-display">
            {t('Biên soạn gói nội dung có cấu trúc (Content Bundle JSON)')}
          </h3>
          <p className="text-xs text-on-surface-variant mt-1">
            {t(
              'Chỉnh sửa trực tiếp toàn bộ gói nội dung gồm quy tắc âm, bài học (lessons/questions) và bài đọc (readings/targets).'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="secondary"
            icon={showGuide ? 'expand_less' : 'menu_book'}
            aria-expanded={showGuide}
            onClick={() => setShowGuide(!showGuide)}
          >
            {showGuide ? t('Đóng hướng dẫn Schema') : t('Xem hướng dẫn & Schema')}
          </Button>
        </div>
      </Card>

      {/* Guide & Schema Reference Panel inside Card */}
      {showGuide && (
        <Card tone="soft" className="flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-secondary">
                <Icon name="menu_book" size={22} />
              </span>
              <strong className="text-sm font-bold text-on-surface">
                {t('Tài liệu đặc tả Schema & Quy ước Ký hiệu phiên âm')}
              </strong>
            </div>

            {/* Sub-tabs */}
            <div role="tablist" aria-label={t('Tài liệu hướng dẫn')} className="inline-flex flex-wrap items-center gap-1.5">
              <Button
                size="sm"
                variant={activeGuideTab === 'notation' ? 'secondary' : 'outline'}
                aria-pressed={activeGuideTab === 'notation'}
                onClick={() => setActiveGuideTab('notation')}
              >
                {t('1. Hệ phiên âm riêng')}
              </Button>
              <Button
                size="sm"
                variant={activeGuideTab === 'schema' ? 'secondary' : 'outline'}
                aria-pressed={activeGuideTab === 'schema'}
                onClick={() => setActiveGuideTab('schema')}
              >
                {t('2. Cấu trúc Schema')}
              </Button>
              <Button
                size="sm"
                variant={activeGuideTab === 'sample' ? 'secondary' : 'outline'}
                aria-pressed={activeGuideTab === 'sample'}
                onClick={() => setActiveGuideTab('sample')}
              >
                {t('3. Mẫu định dạng tham khảo')}
              </Button>
            </div>
          </div>

          {/* Guide Tab 1: Custom Notation */}
          {activeGuideTab === 'notation' && (
            <div className="flex flex-col gap-3 text-xs leading-relaxed text-on-surface-variant">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 font-medium">
                <strong className="block text-amber-900 mb-1">
                  {t('Nguyên tắc cốt lõi: Không hiển thị IPA cho người học')}
                </strong>
                {t(
                  'PhonoLogic phục vụ người Việt trưởng thành cải thiện phát âm tiếng Anh thông qua việc hiểu mối liên hệ giữa chữ và âm. Sản phẩm sử dụng hệ phiên âm riêng của chủ sản phẩm, tuyệt đối không dùng IPA cho người học.'
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                <div className="p-3 rounded-xl bg-surface-lowest border border-outline-variant/30">
                  <strong className="text-on-surface block mb-1">{t('Dữ liệu nguồn Excel (Draft):')}</strong>
                  <p>
                    {t(
                      'Cột Sound trong Quy tắc.xlsx (ví dụ /a/, /ee/, /igh/, /oo(s)/...) chỉ là nhãn nguồn của tài liệu phác thảo. Cần giữ nguyên sourceLabel và sourceRow để đối chiếu, nhưng phải gán notation chính thức cho từng quy tắc.'
                    )}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-surface-lowest border border-outline-variant/30">
                  <strong className="text-on-surface block mb-1">{t('Ký hiệu chính thức (Custom Notation):')}</strong>
                  <p>
                    {t(
                      'Ký hiệu chính thức được gán vào trường notation của SourceRule, trường notation trong câu hỏi và trường notation trong bóc tách segments. Khi xuất bản, cờ notationConfirmed: true phải được bật.'
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Guide Tab 2: Schema fields */}
          {activeGuideTab === 'schema' && (
            <div className="flex flex-col gap-3 text-xs leading-relaxed text-on-surface-variant">
              <p>
                {t('Một gói nội dung (ContentBundle) bao gồm 5 trường gốc bắt buộc:')}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-surface-lowest border border-outline-variant/30 flex flex-col gap-1.5">
                  <strong className="text-on-surface">1. rules: SourceRule[]</strong>
                  <span>{t('Danh sách quy tắc chữ–âm đối chiếu từ Excel:')}</span>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                    <li><code>id</code> {t('(string): ID duy nhất (ví dụ "rule-ea-ey")')}</li>
                    <li><code>sourceRow</code> {t('(number): Dòng Excel Sheet1')}</li>
                    <li><code>sourceLabel</code> {t('(string): Nhãn nguồn (ví dụ "/ee/")')}</li>
                    <li><code>pattern</code> {t('(string): Tổ hợp chữ (ví dụ "ea")')}</li>
                    <li><code>examples</code> {t('(string[]): Danh sách ví dụ')}</li>
                    <li><code>condition</code> {t('(optional string): Điều kiện ngữ cảnh')}</li>
                    <li><code>notation</code> {t('(string | null): Ký hiệu phiên âm chính thức')}</li>
                    <li><code>status</code> {t("('draft' | 'approved'): Trạng thái duyệt")}</li>
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-surface-lowest border border-outline-variant/30 flex flex-col gap-1.5">
                  <strong className="text-on-surface">2. lessons: LessonContent[]</strong>
                  <span>{t('Các bài học theo lộ trình:')}</span>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                    <li><code>id, title, description</code> {t('(chuỗi ký tự)')}</li>
                    <li><code>accent</code> (&apos;US&apos; | &apos;UK&apos;)</li>
                    <li><code>prerequisiteId</code> {t('(string | null): Bài học tiên quyết')}</li>
                    <li><code>questions: ContentQuestion[]</code>:
                      <ul className="list-circle pl-3 space-y-0.5">
                        <li><code>id, prompt, kind</code> {t('(word_sound, sound_spelling, v.v.)')}</li>
                        <li><code>word, meaning, notation</code></li>
                        <li><code>choices: &#123; id, label, description? &#125;[]</code></li>
                        <li><code>correctIds: string[]</code> {t('(tập đáp án chuẩn xác)')}</li>
                        <li><code>multiple: boolean</code></li>
                        <li><code>segments: &#123; spelling, notation, start, end &#125;[]</code></li>
                      </ul>
                    </li>
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-surface-lowest border border-outline-variant/30 flex flex-col gap-1.5 md:col-span-2">
                  <strong className="text-on-surface">3. readings: ReadingContent[]</strong>
                  <span>{t('Bài đọc trong thư viện Reading:')}</span>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                    <li><code>id, title, description, level, accent, text</code> {t('(thông tin bài đọc)')}</li>
                    <li><code>targets: ReadingTarget[]</code>:
                      <ul className="list-circle pl-3 space-y-0.5">
                        <li><code>id, word, meaning, start, end</code> {t('(vị trí offset chính xác trong chuỗi text)')}</li>
                        <li><code>segments: &#123; spelling, notation, start, end &#125;[]</code></li>
                      </ul>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Guide Tab 3: Sample Skeleton Shape */}
          {activeGuideTab === 'sample' && (
            <div className="flex flex-col gap-2">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-2">
                <Icon name="warning" size={18} />
                <span>
                  {t(
                    'LƯU Ý: Đây là mẫu hướng dẫn cấu trúc để biên tập viên tham khảo hình dạng. Không xuất bản nội dung mẫu giả lập vào cơ sở dữ liệu thật.'
                  )}
                </span>
              </div>
              <pre className="p-3.5 rounded-xl bg-surface-container font-mono text-[11px] text-on-surface overflow-x-auto max-h-64 leading-tight border border-outline-variant/30">
{`{
  "notationVersion": "2026.10-v1",
  "notationConfirmed": false,
  "rules": [
    {
      "id": "rule-ea-ey",
      "sourceRow": 7,
      "sourceLabel": "/ee/",
      "pattern": "ea",
      "examples": ["steak", "break", "great"],
      "condition": "ngoại lệ âm ey",
      "notation": "ey",
      "status": "approved",
      "note": "Xác nhận âm /eɪ/ dùng ký hiệu ey"
    }
  ],
  "lessons": [
    {
      "id": "lesson-ea-1",
      "title": "Tổ hợp chữ EA và các âm chính",
      "description": "Luyện tập nhận diện âm ey trong tổ hợp chữ ea",
      "accent": "US",
      "prerequisiteId": null,
      "questions": [
        {
          "id": "q-steak-1",
          "kind": "word_sound",
          "prompt": "Chọn âm tương ứng với phần chữ gạch chân trong từ:",
          "word": "steak",
          "meaning": "bít tết",
          "notation": "ey",
          "highlight": { "start": 2, "end": 4 },
          "choices": [
            { "id": "c1", "label": "ey", "description": "Âm /eɪ/ trong steak" },
            { "id": "c2", "label": "iy", "description": "Âm /iː/" }
          ],
          "correctIds": ["c1"],
          "multiple": false,
          "audioText": "steak",
          "explanation": "Trong từ steak, tổ hợp ea phát âm là ey",
          "segments": [
            { "spelling": "st", "notation": "st", "start": 0, "end": 2 },
            { "spelling": "ea", "notation": "ey", "start": 2, "end": 4 },
            { "spelling": "k", "notation": "k", "start": 4, "end": 5 }
          ]
        }
      ]
    }
  ],
  "readings": [
    {
      "id": "reading-breakfast",
      "title": "Bữa sáng gia đình",
      "description": "Luyện tập từ vựng steak và break trong ngữ cảnh",
      "level": "Cơ bản",
      "accent": "US",
      "text": "We had steak for breakfast before taking a break.",
      "targets": [
        {
          "id": "tg-steak",
          "word": "steak",
          "meaning": "món bít tết",
          "start": 7,
          "end": 12,
          "segments": [
            { "spelling": "ea", "notation": "ey", "start": 2, "end": 4 }
          ]
        }
      ]
    }
  ]
}`}
              </pre>
            </div>
          )}
        </Card>
      )}

      {/* Metrics Bar from live JSON */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <div className="p-3 rounded-xl bg-surface-lowest border border-outline-variant/30 text-center shadow-sm">
          <span className="block text-[11px] font-bold text-on-surface-variant uppercase">{t('Quy tắc (Rules)')}</span>
          <span className="text-lg font-black text-on-surface font-display">{bundleMetrics ? bundleMetrics.rulesCount : '—'}</span>
        </div>
        <div className="p-3 rounded-xl bg-surface-lowest border border-outline-variant/30 text-center shadow-sm">
          <span className="block text-[11px] font-bold text-on-surface-variant uppercase">{t('Bài học (Lessons)')}</span>
          <span className="text-lg font-black text-on-surface font-display">{bundleMetrics ? bundleMetrics.lessonsCount : '—'}</span>
        </div>
        <div className="p-3 rounded-xl bg-surface-lowest border border-outline-variant/30 text-center shadow-sm">
          <span className="block text-[11px] font-bold text-on-surface-variant uppercase">{t('Câu hỏi (Questions)')}</span>
          <span className="text-lg font-black text-on-surface font-display">{bundleMetrics ? bundleMetrics.questionsCount : '—'}</span>
        </div>
        <div className="p-3 rounded-xl bg-surface-lowest border border-outline-variant/30 text-center shadow-sm">
          <span className="block text-[11px] font-bold text-on-surface-variant uppercase">{t('Bài đọc (Readings)')}</span>
          <span className="text-lg font-black text-on-surface font-display">{bundleMetrics ? bundleMetrics.readingsCount : '—'}</span>
        </div>
        <div className="p-3 rounded-xl bg-surface-lowest border border-outline-variant/30 text-center shadow-sm">
          <span className="block text-[11px] font-bold text-on-surface-variant uppercase">{t('Từ mục tiêu')}</span>
          <span className="text-lg font-black text-on-surface font-display">{bundleMetrics ? bundleMetrics.targetsCount : '—'}</span>
        </div>
        <div className="p-3 rounded-xl bg-surface-lowest border border-outline-variant/30 text-center shadow-sm">
          <span className="block text-[11px] font-bold text-on-surface-variant uppercase">{t('Xác nhận ký hiệu')}</span>
          <span className="inline-block mt-1">
            <Badge tone={bundleMetrics?.notationConfirmed ? 'green' : 'yellow'}>
              {bundleMetrics ? (bundleMetrics.notationConfirmed ? t('Đã xác nhận') : t('Chưa xác nhận')) : '—'}
            </Badge>
          </span>
        </div>
      </div>

      {/* Parse Error & Validation Feedback Banners */}
      {parseError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-300 text-red-950 text-xs flex items-start gap-2.5">
          <span className="text-red-600 mt-0.5 shrink-0">
            <Icon name="cancel" size={20} />
          </span>
          <div className="leading-relaxed">
            <strong className="block text-red-900 font-bold mb-0.5">
              {t(parseError.titleKey || 'Lỗi cú pháp JSON')}
            </strong>
            <span>
              {parseError.err instanceof ApiError
                ? parseError.err.message
                : parseError.key
                  ? t(parseError.key, parseError.params)
                  : parseError.err instanceof Error && parseError.err.message
                    ? parseError.err.message
                    : t(parseError.fallbackKey || parseError.titleKey || 'Lỗi cú pháp JSON')}
            </span>
            {parseError.err instanceof ApiError &&
              Object.keys(parseError.err.fields || {}).length > 0 && (
                <div className="mt-2 space-y-1">
                  {Object.entries(parseError.err.fields).map(([field, fieldMsg]) => (
                    <div key={field} className="text-[11px] font-mono text-red-800">
                      <span className="font-bold">{field}:</span> {fieldMsg}
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-300 text-red-950 text-xs flex flex-col gap-1.5">
          <div className="flex items-center gap-2 font-bold text-red-900">
            <Icon name="error" size={20} />
            <span>
              {t('Phát hiện {{count}} vấn đề cấu trúc không hợp lệ:', {
                count: validationErrors.length,
              })}
            </span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-red-800 max-h-48 overflow-y-auto">
            {validationErrors.map((err, i) => (
              <li key={i}>{t(err.key, err.params)}</li>
            ))}
          </ul>
        </div>
      )}

      {validationSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs flex items-center gap-2 font-medium">
          <span className="text-emerald-600 shrink-0">
            <Icon name="check_circle" size={20} />
          </span>
          <span>{t(validationSuccess.key, validationSuccess.params)}</span>
        </div>
      )}

      {/* Editor Controls & Textarea inside Card */}
      <Card tone="white" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-outline-variant/20">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-on-surface-variant uppercase">
              {t('Trình biên tập JSON trực tiếp')}
            </span>
            {isDirty && (
              <Badge tone="yellow" icon="warning">
                {t('Bản nháp có chỉnh sửa chưa lưu')}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              icon="history"
              title={t('Tải lại từ bản nháp')}
              onClick={() => {
                setJsonString(JSON.stringify(draft, null, 2));
                setParseError(null);
                setValidationErrors([]);
                setValidationSuccess({ key: 'Đã khôi phục dữ liệu từ bản nháp máy chủ.' });
              }}
            >
              {t('Tải lại từ bản nháp')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              icon="format_align_left"
              title={t('Định dạng (Prettify)')}
              onClick={() => {
                try {
                  const p = JSON.parse(jsonString);
                  setJsonString(JSON.stringify(p, null, 2));
                  setParseError(null);
                } catch (err) {
                  const detail = err instanceof Error ? err.message : String(err);
                  setParseError({
                    titleKey: 'Lỗi cú pháp JSON',
                    key: 'Không thể định dạng JSON: {{detail}}',
                    params: { detail },
                    err,
                  });
                }
              }}
            >
              {t('Định dạng (Prettify)')}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              icon="fact_check"
              onClick={() => {
                setParseError(null);
                setValidationSuccess(null);
                const res = validateBundleJson(jsonString);
                if (!res.valid) {
                  setValidationErrors(res.errors);
                } else {
                  setValidationErrors([]);
                  setValidationSuccess({
                    key: 'Cú pháp JSON và cấu trúc ContentBundle hoàn toàn hợp lệ!',
                  });
                }
              }}
            >
              {t('Kiểm tra cú pháp')}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              icon="sync"
              onClick={() => {
                setParseError(null);
                setValidationSuccess(null);
                const res = validateBundleJson(jsonString);
                if (!res.valid) {
                  setValidationErrors(res.errors);
                  return;
                 }
                setValidationErrors([]);
                if (res.bundle) {
                  onApplyDraft(res.bundle);
                  setValidationSuccess({
                    key: 'Đã áp dụng thay đổi vào bản nháp cục bộ thành công.',
                  });
                }
              }}
            >
              {t('Áp dụng vào nháp')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon="save"
              loading={saving}
              onClick={async () => {
                setParseError(null);
                setValidationSuccess(null);
                const res = validateBundleJson(jsonString);
                if (!res.valid) {
                  setValidationErrors(res.errors);
                  return;
                }
                setValidationErrors([]);
                if (res.bundle) {
                  try {
                    await onSaveDraft(res.bundle);
                    setValidationSuccess({
                      key: 'Đã lưu bản nháp thành công lên máy chủ (PUT /learning/admin/draft).',
                    });
                  } catch (err) {
                    setParseError({
                      titleKey: 'Lỗi khi lưu bản nháp lên máy chủ',
                      fallbackKey: 'Lỗi khi lưu bản nháp lên máy chủ',
                      err,
                    });
                  }
                }
              }}
            >
              {t('Lưu bản nháp (PUT)')}
            </Button>
          </div>
        </div>

        {/* Textarea */}
        <div className="relative w-full">
          <textarea
            value={jsonString}
            onChange={(e) => {
              setJsonString(e.target.value);
              setParseError(null);
              setValidationSuccess(null);
            }}
            rows={24}
            spellCheck={false}
            className="w-full p-4 rounded-xl font-mono text-xs text-on-surface bg-surface-low border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition leading-relaxed resize-y min-h-[460px]"
            placeholder={t('Dán hoặc chỉnh sửa gói nội dung ContentBundle tại đây...')}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-2 border-t border-outline-variant/20">
          <span>
            {t('Hỗ trợ đầy đủ định dạng UTF-8 tiếng Việt, escape ký tự JSON tiêu chuẩn.')}
          </span>
          <span>
            {t('Dung lượng ký tự: {{count}} ký tự', { count: jsonString.length.toLocaleString() })}
          </span>
        </div>
      </Card>
    </div>
  );
}
