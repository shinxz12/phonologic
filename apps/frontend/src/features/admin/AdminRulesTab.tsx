import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { SourceRule } from '@phonologic/shared-types';
import { Button, Badge, Card, Icon } from '../../components';

interface AdminRulesTabProps {
  rules: SourceRule[];
  onUpdateRule: (updatedRule: SourceRule) => void;
  onSaveDraft: () => void;
  saving: boolean;
  isDirty: boolean;
}

export function AdminRulesTab({
  rules,
  onUpdateRule,
  onSaveDraft,
  saving,
  isDirty,
}: AdminRulesTabProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'approved'>('all');
  const [notationFilter, setNotationFilter] = useState<'all' | 'has' | 'missing'>('all');
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // Edit form state
  const [editNotation, setEditNotation] = useState('');
  const [editStatus, setEditStatus] = useState<'draft' | 'approved'>('draft');
  const [editCondition, setEditCondition] = useState('');
  const [editNote, setEditNote] = useState('');

  // Pagination for large rule datasets (e.g. 155 Excel rows)
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const stats = useMemo(() => {
    const total = rules.length;
    const approved = rules.filter((r) => r.status === 'approved').length;
    const draft = rules.filter((r) => r.status === 'draft').length;
    const hasNotation = rules.filter((r) => r.notation && r.notation.trim().length > 0).length;
    const missingNotation = total - hasNotation;
    return { total, approved, draft, hasNotation, missingNotation };
  }, [rules]);

  const filteredRules = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rules.filter((rule) => {
      if (statusFilter !== 'all' && rule.status !== statusFilter) return false;
      if (notationFilter === 'has' && (!rule.notation || !rule.notation.trim())) return false;
      if (notationFilter === 'missing' && rule.notation && rule.notation.trim().length > 0) return false;

      if (!q) return true;
      const matchRow = String(rule.sourceRow).includes(q);
      const matchLabel = rule.sourceLabel.toLowerCase().includes(q);
      const matchPattern = rule.pattern.toLowerCase().includes(q);
      const matchExamples = rule.examples.some((ex) => ex.toLowerCase().includes(q));
      const matchNotation = (rule.notation || '').toLowerCase().includes(q);
      const matchCondition = (rule.condition || '').toLowerCase().includes(q);
      const matchNote = (rule.note || '').toLowerCase().includes(q);

      return (
        matchRow ||
        matchLabel ||
        matchPattern ||
        matchExamples ||
        matchNotation ||
        matchCondition ||
        matchNote
      );
    });
  }, [rules, search, statusFilter, notationFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRules.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRules = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRules.slice(start, start + pageSize);
  }, [filteredRules, currentPage, pageSize]);

  const startEdit = (rule: SourceRule) => {
    setEditingRuleId(rule.id);
    setEditNotation(rule.notation || '');
    setEditStatus(rule.status);
    setEditCondition(rule.condition || '');
    setEditNote(rule.note || '');
  };

  const saveEdit = (originalRule: SourceRule) => {
    const updated: SourceRule = {
      ...originalRule,
      notation: editNotation.trim().length > 0 ? editNotation.trim() : null,
      status: editStatus,
      condition: editCondition.trim().length > 0 ? editCondition.trim() : undefined,
      note: editNote.trim().length > 0 ? editNote.trim() : undefined,
    };
    onUpdateRule(updated);
    setEditingRuleId(null);
  };

  const toggleApprovalQuick = (rule: SourceRule) => {
    const updated: SourceRule = {
      ...rule,
      status: rule.status === 'approved' ? 'draft' : 'approved',
    };
    onUpdateRule(updated);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Notice Banner */}
      <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950">
        <div className="text-amber-600 mt-0.5 shrink-0">
          <Icon name="info" size={24} />
        </div>
        <div className="text-sm leading-relaxed">
          <strong className="font-bold text-amber-900 block mb-1">
            {t('Dữ liệu nguồn Excel (Quy tắc.xlsx) & Ký hiệu phiên âm chính thức')}
          </strong>
          <p className="text-amber-800">
            {t(
              'Cột Sound nguồn (/a/, /ee/, /igh/, /oo(s)/...) và số dòng hiển thị bên dưới là dữ liệu đối chiếu từ file Excel gốc, chưa phải ký hiệu chính thức. Biên tập viên cần rà soát và gán Ký hiệu chính thức (Custom Notation) theo quy ước riêng của chủ sản phẩm (tuyệt đối không sử dụng IPA cho người học) trước khi xuất bản.'
            )}
          </p>
        </div>
      </div>

      {/* Stats Summary Cards using existing Card component */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Card tone="white" className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            {t('Tổng số quy tắc')}
          </span>
          <span className="text-2xl font-black text-on-surface font-display">{stats.total}</span>
          <span className="text-xs text-on-surface-variant">{t('Từ Sheet1!A1:C156')}</span>
        </Card>
        <Card tone="green" className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">
            {t('Đã duyệt (Approved)')}
          </span>
          <span className="text-2xl font-black text-primary font-display">{stats.approved}</span>
          <span className="text-xs text-on-surface-variant">{t('Sẵn sàng xuất bản')}</span>
        </Card>
        <Card tone="yellow" className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-tertiary uppercase tracking-wider">
            {t('Bản nháp (Draft)')}
          </span>
          <span className="text-2xl font-black text-tertiary font-display">{stats.draft}</span>
          <span className="text-xs text-on-surface-variant">{t('Cần rà soát')}</span>
        </Card>
        <Card tone="blue" className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
            {t('Đã có ký hiệu')}
          </span>
          <span className="text-2xl font-black text-secondary font-display">{stats.hasNotation}</span>
          <span className="text-xs text-on-surface-variant">
            {stats.missingNotation > 0
              ? t('Còn thiếu {{count}} ký hiệu', { count: stats.missingNotation })
              : t('Đã đủ 100%')}
          </span>
        </Card>
      </div>

      {/* Search and Filters Toolbar inside Card */}
      <Card tone="white" className="flex flex-col gap-4">
        {/* Search input */}
        <div className="w-full">
          <label htmlFor="rules-search-input" className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">
            {t('Tìm kiếm quy tắc')}
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-outline pointer-events-none">
              <Icon name="search" size={20} />
            </span>
            <input
              id="rules-search-input"
              type="text"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface-low text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
              placeholder={t('Tìm theo tổ hợp chữ (ea, ai...), ví dụ (steak...), dòng Excel, nhãn nguồn, ký hiệu...')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1 border-t border-outline-variant/20">
          <div className="flex flex-wrap items-center gap-4">
            {/* Status filter */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-on-surface-variant mr-1">{t('Trạng thái:')}</span>
              <div role="group" aria-label={t('Lọc theo trạng thái')} className="inline-flex flex-wrap items-center gap-1.5">
                <Button
                  size="sm"
                  variant={statusFilter === 'all' ? 'secondary' : 'outline'}
                  aria-pressed={statusFilter === 'all'}
                  onClick={() => {
                    setStatusFilter('all');
                    setPage(1);
                  }}
                >
                  {t('Tất cả ({{count}})', { count: stats.total })}
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'approved' ? 'secondary' : 'outline'}
                  aria-pressed={statusFilter === 'approved'}
                  onClick={() => {
                    setStatusFilter('approved');
                    setPage(1);
                  }}
                >
                  {t('Đã duyệt ({{count}})', { count: stats.approved })}
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'draft' ? 'secondary' : 'outline'}
                  aria-pressed={statusFilter === 'draft'}
                  onClick={() => {
                    setStatusFilter('draft');
                    setPage(1);
                  }}
                >
                  {t('Bản nháp ({{count}})', { count: stats.draft })}
                </Button>
              </div>
            </div>

            {/* Notation filter */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-on-surface-variant mr-1">{t('Ký hiệu:')}</span>
              <div role="group" aria-label={t('Lọc theo ký hiệu')} className="inline-flex flex-wrap items-center gap-1.5">
                <Button
                  size="sm"
                  variant={notationFilter === 'all' ? 'secondary' : 'outline'}
                  aria-pressed={notationFilter === 'all'}
                  onClick={() => {
                    setNotationFilter('all');
                    setPage(1);
                  }}
                >
                  {t('Tất cả')}
                </Button>
                <Button
                  size="sm"
                  variant={notationFilter === 'has' ? 'secondary' : 'outline'}
                  aria-pressed={notationFilter === 'has'}
                  onClick={() => {
                    setNotationFilter('has');
                    setPage(1);
                  }}
                >
                  {t('Đã gán ({{count}})', { count: stats.hasNotation })}
                </Button>
                <Button
                  size="sm"
                  variant={notationFilter === 'missing' ? 'secondary' : 'outline'}
                  aria-pressed={notationFilter === 'missing'}
                  onClick={() => {
                    setNotationFilter('missing');
                    setPage(1);
                  }}
                >
                  {t('Chưa gán ({{count}})', { count: stats.missingNotation })}
                </Button>
              </div>
            </div>
          </div>

          {/* Unsaved changes notice */}
          {isDirty && (
            <div className="flex items-center gap-2">
              <Badge tone="yellow" icon="warning">
                {t('Có thay đổi chưa lưu')}
              </Badge>
              <Button
                variant="primary"
                size="sm"
                icon="save"
                loading={saving}
                onClick={onSaveDraft}
              >
                {t('Lưu bản nháp')}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Results Metadata & Pagination */}
      <div className="flex items-center justify-between text-xs text-on-surface-variant px-1">
        <span>
          {t('Hiển thị {{count}} / {{total}} quy tắc phù hợp', {
            count: paginatedRules.length,
            total: filteredRules.length,
          })}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {t('Trước')}
            </Button>
            <span>{t('Trang {{current}} / {{total}}', { current: currentPage, total: totalPages })}</span>
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              {t('Sau')}
            </Button>
          </div>
        )}
      </div>

      {/* Rules List using Card */}
      {filteredRules.length === 0 ? (
        <Card tone="soft" className="p-8 text-center flex flex-col items-center justify-center gap-2">
          <div className="text-outline">
            <Icon name="search_off" size={48} />
          </div>
          <p className="font-bold text-base text-on-surface">{t('Không tìm thấy quy tắc nào')}</p>
          <p className="text-xs text-on-surface-variant max-w-sm">
            {t('Thử thay đổi từ khóa tìm kiếm hoặc bấm "Tất cả" ở bộ lọc trạng thái và ký hiệu.')}
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3.5">
          {paginatedRules.map((rule) => {
            const isEditing = editingRuleId === rule.id;

            return (
              <Card
                key={rule.id}
                tone={rule.status === 'approved' ? 'white' : 'soft'}
                className={`transition ${isEditing ? 'ring-2 ring-primary' : ''}`}
              >
                {/* Header row: Source labels prominently displayed, status & actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-outline-variant/15">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Excel Source Row */}
                    <Badge tone="neutral">
                      {t('Dòng Excel #{{row}}', { row: rule.sourceRow })}
                    </Badge>

                    {/* Prominent Excel Sound draft label */}
                    <Badge tone="yellow">
                      <span className="font-medium text-amber-700">{t('Nguồn Excel:')} </span>
                      <span className="font-mono text-sm tracking-wide">{rule.sourceLabel}</span>
                    </Badge>

                    {/* Status badge */}
                    <Badge tone={rule.status === 'approved' ? 'green' : 'yellow'}>
                      {rule.status === 'approved' ? t('Đã duyệt') : t('Bản nháp')}
                    </Badge>

                    {/* Official Notation Badge */}
                    {rule.notation && rule.notation.trim().length > 0 ? (
                      <Badge tone="blue">
                        <span className="font-medium text-sky-700">{t('Ký hiệu chính thức:')} </span>
                        <span className="font-mono text-sm font-black">{rule.notation}</span>
                      </Badge>
                    ) : (
                      <Badge tone="neutral">
                        {t('Chưa gán ký hiệu')}
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!isEditing && (
                      <>
                        <Button
                          size="sm"
                          variant={rule.status === 'approved' ? 'outline' : 'primary'}
                          icon={rule.status === 'approved' ? 'undo' : 'check'}
                          title={rule.status === 'approved' ? t('Về nháp') : t('Duyệt')}
                          onClick={() => toggleApprovalQuick(rule)}
                        >
                          {rule.status === 'approved' ? t('Về nháp') : t('Duyệt')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          icon="edit"
                          onClick={() => startEdit(rule)}
                        >
                          {t('Sửa')}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Body: Pattern & Examples */}
                <div className="pt-3 grid grid-cols-1 md:grid-cols-2 gap-3.5 text-sm">
                  <div>
                    <span className="block text-xs font-bold text-on-surface-variant uppercase mb-1">
                      {t('Tổ hợp chữ (Combination / Pattern):')}
                    </span>
                    <span className="inline-block px-3 py-1 rounded-lg bg-surface-container font-mono font-bold text-base text-on-surface border border-outline-variant/30">
                      {rule.pattern}
                    </span>
                  </div>

                  <div>
                    <span className="block text-xs font-bold text-on-surface-variant uppercase mb-1">
                      {t('Ví dụ ({{count}}):', { count: rule.examples.length })}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {rule.examples.map((ex, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-surface-low border border-outline-variant/20 text-xs font-medium text-on-surface"
                        >
                          {ex}
                        </span>
                      ))}
                    </div>
                  </div>

                  {rule.condition && !isEditing && (
                    <div className="md:col-span-2 pt-1">
                      <span className="block text-xs font-bold text-on-surface-variant uppercase mb-0.5">
                        {t('Điều kiện ngữ cảnh:')}
                      </span>
                      <span className="text-xs text-on-surface bg-surface-low px-2.5 py-1 rounded-lg inline-block border border-outline-variant/20">
                        {rule.condition}
                      </span>
                    </div>
                  )}

                  {rule.note && !isEditing && (
                    <div className="md:col-span-2 pt-1">
                      <span className="block text-xs font-bold text-on-surface-variant uppercase mb-0.5">
                        {t('Ghi chú kiểm duyệt:')}
                      </span>
                      <span className="text-xs text-on-surface-variant italic bg-amber-50/60 px-2.5 py-1 rounded-lg inline-block border border-amber-200/40">
                        {rule.note}
                      </span>
                    </div>
                  )}
                </div>

                {/* Inline Editing Form */}
                {isEditing && (
                  <div className="mt-4 pt-4 border-t border-primary/20 bg-surface-low/70 -mx-6 -mb-6 p-4 md:p-6 rounded-b-[inherit] flex flex-col gap-3.5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {/* Official Notation input */}
                      <div>
                        <label
                          htmlFor={`edit-notation-${rule.id}`}
                          className="block text-xs font-bold text-on-surface mb-1"
                        >
                          {t('Ký hiệu chính thức (Custom Notation)')}
                          <span className="block text-[11px] font-normal text-on-surface-variant">
                            {t('Quy ước riêng của sản phẩm (không dùng IPA). Bỏ trống nếu chưa chốt.')}
                          </span>
                        </label>
                        <input
                          id={`edit-notation-${rule.id}`}
                          type="text"
                          value={editNotation}
                          onChange={(e) => setEditNotation(e.target.value)}
                          placeholder="Ví dụ: ey, iy, ow..."
                          className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-lowest text-sm font-mono focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                      </div>

                      {/* Status select */}
                      <div>
                        <label className="block text-xs font-bold text-on-surface mb-1">
                          {t('Trạng thái kiểm duyệt')}
                        </label>
                        <div className="flex items-center gap-4 mt-2">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-emerald-800">
                            <input
                              type="radio"
                              name={`status-${rule.id}`}
                              checked={editStatus === 'approved'}
                              onChange={() => setEditStatus('approved')}
                              className="accent-emerald-600"
                            />
                            {t('Đã duyệt (Approved)')}
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-amber-800">
                            <input
                              type="radio"
                              name={`status-${rule.id}`}
                              checked={editStatus === 'draft'}
                              onChange={() => setEditStatus('draft')}
                              className="accent-amber-600"
                            />
                            {t('Bản nháp (Draft)')}
                          </label>
                        </div>
                      </div>

                      {/* Condition input */}
                      <div className="md:col-span-2">
                        <label
                          htmlFor={`edit-condition-${rule.id}`}
                          className="block text-xs font-bold text-on-surface mb-1"
                        >
                          {t('Điều kiện ngữ cảnh (Bảo lưu dữ liệu gốc, chỉnh sửa nếu cần)')}
                        </label>
                        <input
                          id={`edit-condition-${rule.id}`}
                          type="text"
                          value={editCondition}
                          onChange={(e) => setEditCondition(e.target.value)}
                          placeholder="Ví dụ: 2 âm tiết, trọng âm rơi vào âm tiết đầu..."
                          className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-lowest text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                      </div>

                      {/* Note input */}
                      <div className="md:col-span-2">
                        <label
                          htmlFor={`edit-note-${rule.id}`}
                          className="block text-xs font-bold text-on-surface mb-1"
                        >
                          {t('Ghi chú rà soát / kiểm duyệt')}
                        </label>
                        <input
                          id={`edit-note-${rule.id}`}
                          type="text"
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          placeholder="Ví dụ: Cần kiểm tra dialect US/UK, từ hiếm, từ ngoại lệ..."
                          className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-lowest text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingRuleId(null)}
                      >
                        {t('Hủy')}
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        icon="check"
                        onClick={() => saveEdit(rule)}
                      >
                        {t('Cập nhật quy tắc')}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-on-surface-variant pt-2 border-t border-outline-variant/20">
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t('Trang trước')}
          </Button>
          <span>
            {t('Trang {{current}} / {{total}} (Tổng số {{count}} quy tắc)', {
              current: currentPage,
              total: totalPages,
              count: filteredRules.length,
            })}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            {t('Trang sau')}
          </Button>
        </div>
      )}
    </div>
  );
}
