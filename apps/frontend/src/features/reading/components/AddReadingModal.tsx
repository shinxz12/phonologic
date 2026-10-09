import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Accent, ReadingContent, ReadingTarget, WordSegment, AdminContentView } from '@phonologic/shared-types';
import { api } from '../../../lib/api';
import { keys } from '../../../lib/query';
import { Button, IconButton, Icon, Card, TextField, Badge } from '../../../components';

export interface AddReadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

interface TargetDraft {
  word: string;
  meaning: string;
}

export function AddReadingModal({ isOpen, onClose, onSaved }: AddReadingModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('A1');
  const [accent, setAccent] = useState<Accent>('US');
  const [text, setText] = useState('');
  const [targets, setTargets] = useState<TargetDraft[]>([
    { word: '', meaning: '' },
  ]);
  const [error, setError] = useState<string | null>(null);

  // Validate target words in text and calculate offsets
  const validatedTargets = useMemo(() => {
    const results: Array<{
      draft: TargetDraft;
      start: number;
      end: number;
      valid: boolean;
      error?: string;
    }> = [];

    const lowerText = text.toLowerCase();

    for (const tgt of targets) {
      const cleanWord = tgt.word.trim();
      if (!cleanWord) continue;

      const lowerWord = cleanWord.toLowerCase();
      const start = lowerText.indexOf(lowerWord);

      if (start === -1) {
        results.push({
          draft: tgt,
          start: -1,
          end: -1,
          valid: false,
          error: t('Từ "{{word}}" không có trong nội dung bài đọc.', { word: cleanWord }),
        });
      } else {
        const end = start + cleanWord.length;
        results.push({
          draft: tgt,
          start,
          end,
          valid: true,
        });
      }
    }

    return results;
  }, [text, targets, t]);

  const handleAddTarget = () => {
    setTargets([...targets, { word: '', meaning: '' }]);
  };

  const handleRemoveTarget = (index: number) => {
    setTargets(targets.filter((_, idx) => idx !== index));
  };

  const handleTargetChange = (index: number, field: keyof TargetDraft, value: string) => {
    const next = [...targets];
    next[index] = { ...next[index], [field]: value };
    setTargets(next);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      // 1. Fetch current draft bundle
      const adminData = await api<AdminContentView>('/learning/admin');
      const currentDraft = adminData.draft;

      // 2. Build ReadingTarget objects
      const finalTargets: ReadingTarget[] = validatedTargets.map((vt, idx) => {
        const cleanWord = vt.draft.word.trim();
        // Generate default character segments
        const segments: WordSegment[] = [];
        let curr = 0;
        for (const ch of cleanWord) {
          segments.push({
            spelling: ch,
            notation: `/${ch}/`,
            start: curr,
            end: curr + ch.length,
          });
          curr += ch.length;
        }

        return {
          id: `tgt-${Date.now().toString(36)}-${idx}`,
          word: cleanWord,
          meaning: vt.draft.meaning.trim() || cleanWord,
          start: vt.start,
          end: vt.end,
          segments,
        };
      });

      // 3. Build new ReadingContent object
      const newReading: ReadingContent = {
        id: `reading-${Date.now().toString(36)}`,
        title: title.trim(),
        description: description.trim(),
        level,
        accent,
        text: text.trim(),
        targets: finalTargets,
      };

      const updatedDraft = {
        ...currentDraft,
        readings: [...(currentDraft.readings || []), newReading],
      };

      // 4. Save draft
      await api('/learning/admin/draft', {
        method: 'PUT',
        body: JSON.stringify(updatedDraft),
      });

      // 5. Automatically publish a new snapshot so it appears live
      await api('/learning/admin/publish', {
        method: 'POST',
        body: JSON.stringify({
          notationConfirmed: true,
          notationVersion: currentDraft.notationVersion || '2026.10-v1',
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.dashboard });
      queryClient.invalidateQueries({ queryKey: keys.admin });
      onSaved?.();
      onClose();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : t('Lỗi khi thêm bài đọc');
      setError(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError(t('Vui lòng nhập tiêu đề bài đọc.'));
      return;
    }
    if (!text.trim()) {
      setError(t('Vui lòng nhập nội dung đoạn văn bài đọc.'));
      return;
    }

    const hasInvalid = validatedTargets.some((vt) => !vt.valid);
    if (hasInvalid) {
      const invalidItem = validatedTargets.find((vt) => !vt.valid);
      setError(invalidItem?.error || t('Có từ mục tiêu không hợp lệ.'));
      return;
    }

    if (validatedTargets.length === 0) {
      setError(t('Vui lòng nhập ít nhất một từ mục tiêu trong bài đọc.'));
      return;
    }

    saveMutation.mutate();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-reading-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
    >
      <Card tone="white" className="max-w-2xl w-full max-h-[90vh] flex flex-col p-6! rounded-2xl shadow-2xl border border-outline-variant/30">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary-container text-on-primary-container">
              <Icon name="auto_stories" size={24} />
            </div>
            <div>
              <h2 id="add-reading-modal-title" className="font-display font-bold text-lg text-on-surface">
                {t('Thêm bài đọc ngữ cảnh mới')}
              </h2>
              <p className="text-xs text-on-surface-variant">
                {t('Soạn bài đọc, đoạn văn và từ vựng mục tiêu cho học viên')}
              </p>
            </div>
          </div>
          <IconButton icon="close" label={t('Đóng')} variant="ghost" size="sm" onClick={onClose} />
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 flex flex-col gap-4 min-h-0">
          {error && (
            <div className="p-3 rounded-xl bg-error-container text-on-error-container text-xs flex items-center gap-2">
              <Icon name="error" size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <TextField
            label={t('Tiêu đề bài đọc')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('Ví dụ: A Sunny Day at the Beach')}
            required
          />

          {/* Description */}
          <TextField
            label={t('Mô tả bài đọc')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('Ví dụ: Luyện tập các từ chứa âm /ee/ và /ai/...')}
          />

          {/* Level & Accent Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">
                {t('Cấp độ')}
              </label>
              <div className="flex gap-2">
                {(['A1', 'A2', 'B1', 'B2'] as const).map((lvl) => (
                  <Button
                    key={lvl}
                    size="sm"
                    type="button"
                    variant={level === lvl ? 'secondary' : 'outline'}
                    onClick={() => setLevel(lvl)}
                    className="flex-1 min-h-9! font-bold! text-xs!"
                    style={{ borderRadius: '10px' }}
                  >
                    {lvl}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">
                {t('Chuẩn giọng')}
              </label>
              <div className="flex gap-2">
                {(['US', 'UK'] as const).map((acc) => (
                  <Button
                    key={acc}
                    size="sm"
                    type="button"
                    variant={accent === acc ? 'secondary' : 'outline'}
                    onClick={() => setAccent(acc)}
                    className="flex-1 min-h-9! font-bold! text-xs!"
                    style={{ borderRadius: '10px' }}
                  >
                    {acc}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Passage Text */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase">
              {t('Nội dung đoạn văn')} *
            </label>
            <textarea
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('Nhập đoạn văn câu chuyện bằng tiếng Anh...')}
              className="w-full p-3 text-sm border border-outline-variant/60 bg-surface-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y shadow-2xs leading-relaxed"
              style={{ borderRadius: '10px' }}
              required
            />
          </div>
          {/* Target Words Section */}
          <div className="flex flex-col gap-3 pt-2 border-t border-outline-variant/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface uppercase">
                {t('Từ vựng mục tiêu trong bài')} ({targets.length})
              </span>
              <Button size="sm" type="button" variant="outline" icon="add" onClick={handleAddTarget} style={{ borderRadius: '10px' }}>
                {t('Thêm từ')}
              </Button>
            </div>

            <div className="flex flex-col gap-2.5">
              {targets.map((tgt, idx) => {
                const validation = validatedTargets.find((v) => v.draft === tgt);
                return (
                  <div key={idx} className="p-3 rounded-xl bg-surface-low border border-outline-variant/30 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={tgt.word}
                          onChange={(e) => handleTargetChange(idx, 'word', e.target.value)}
                          placeholder={t('Từ vựng (tiếng Anh)')}
                          className="w-full px-3 py-2 text-sm rounded-xl! border border-outline-variant/60 bg-white text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          style={{ borderRadius: '10px' }}
                          required
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={tgt.meaning}
                          onChange={(e) => handleTargetChange(idx, 'meaning', e.target.value)}
                          placeholder={t('Nghĩa tiếng Việt')}
                          className="w-full px-3 py-2 text-sm rounded-xl! border border-outline-variant/60 bg-white text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          style={{ borderRadius: '10px' }}
                          required
                        />
                      </div>
                      {targets.length > 1 && (
                        <IconButton
                          icon="delete"
                          label={t('Xóa')}
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => handleRemoveTarget(idx)}
                        />
                      )}
                    </div>

                    {tgt.word && (
                      <div className="flex items-center gap-2 text-[11px]">
                        {validation?.valid ? (
                          <Badge tone="green" icon="check">
                            {t('Khớp vị trí: [{{start}}, {{end}}]', { start: validation.start, end: validation.end })}
                          </Badge>
                        ) : (
                          <Badge tone="neutral" icon="warning">
                            {t('Chưa tìm thấy trong văn bản')}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-outline-variant/20 flex items-center justify-end gap-3 mt-auto">
            <Button variant="ghost" type="button" onClick={onClose} style={{ borderRadius: '10px' }}>
              {t('Hủy')}
            </Button>
            <Button variant="primary" type="submit" loading={saveMutation.isPending} icon="save" style={{ borderRadius: '10px' }}>
              {t('Lưu & Xuất bản bài đọc')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
