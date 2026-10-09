import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ContentReportView } from '@phonologic/shared-types';
import { Button, Badge, Card, Icon } from '../../components';

interface AdminReportsTabProps {
  reports: ContentReportView[];
  onResolveReport: (reportId: string) => void;
  resolvingId: string | null;
}

export function AdminReportsTab({
  reports,
  onResolveReport,
  resolvingId,
}: AdminReportsTabProps) {
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [search, setSearch] = useState('');

  const stats = useMemo(() => {
    const total = reports.length;
    const open = reports.filter((r) => r.status === 'open').length;
    const resolved = reports.filter((r) => r.status === 'resolved').length;
    return { total, open, resolved };
  }, [reports]);

  const filteredReports = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reports.filter((item) => {
      if (filter !== 'all' && item.status !== filter) return false;
      if (!q) return true;
      const matchId = item.id.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchQId = (item.questionId || '').toLowerCase().includes(q);
      const matchRId = (item.ruleId || '').toLowerCase().includes(q);
      const matchUser = item.userId.toLowerCase().includes(q);
      return matchId || matchDesc || matchQId || matchRId || matchUser;
    });
  }, [reports, filter, search]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Overview Banner inside Card */}
      <Card tone="white" className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-on-surface font-display">
            {t('Báo cáo nội dung từ người học (Content Reports)')}
          </h3>
          <p className="text-xs text-on-surface-variant mt-1">
            {t(
              'Xử lý phản hồi từ người học khi gặp câu hỏi hoặc quy tắc có vấn đề về chữ–âm, giải thích hoặc hiển thị.'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge tone={stats.open > 0 ? 'yellow' : 'green'}>
            {stats.open > 0
              ? t('{{count}} báo cáo chưa xử lý', { count: stats.open })
              : t('Đã xử lý toàn bộ')}
          </Badge>
        </div>
      </Card>

      {/* Stats Summary inside Card components with tones */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <Card tone="white" className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            {t('Tổng số báo cáo')}
          </span>
          <span className="text-2xl font-black text-on-surface font-display">{stats.total}</span>
          <span className="text-xs text-on-surface-variant">
            {t('Từ người học gửi qua POST /learning/reports')}
          </span>
        </Card>
        <Card tone="yellow" className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-tertiary uppercase tracking-wider">
            {t('Chưa xử lý (Open)')}
          </span>
          <span className="text-2xl font-black text-tertiary font-display">{stats.open}</span>
          <span className="text-xs text-on-surface-variant">{t('Cần kiểm duyệt viên rà soát')}</span>
        </Card>
        <Card tone="green" className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">
            {t('Đã giải quyết (Resolved)')}
          </span>
          <span className="text-2xl font-black text-primary font-display">{stats.resolved}</span>
          <span className="text-xs text-on-surface-variant">{t('Đã kiểm tra và đóng')}</span>
        </Card>
      </div>

      {/* Toolbar inside Card */}
      <Card tone="white" className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute left-3 top-2.5 text-outline pointer-events-none">
            <Icon name="search" size={20} />
          </span>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-outline-variant bg-surface-low text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder={t('Tìm theo mô tả, questionId, ruleId, userId...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Pills */}
        <div role="group" aria-label={t('Lọc báo cáo')} className="inline-flex flex-wrap items-center gap-1.5 shrink-0">
          <Button
            size="sm"
            variant={filter === 'all' ? 'secondary' : 'outline'}
            aria-pressed={filter === 'all'}
            onClick={() => setFilter('all')}
          >
            {t('Tất cả ({{count}})', { count: stats.total })}
          </Button>
          <Button
            size="sm"
            variant={filter === 'open' ? 'secondary' : 'outline'}
            aria-pressed={filter === 'open'}
            onClick={() => setFilter('open')}
          >
            {t('Chưa xử lý ({{count}})', { count: stats.open })}
          </Button>
          <Button
            size="sm"
            variant={filter === 'resolved' ? 'secondary' : 'outline'}
            aria-pressed={filter === 'resolved'}
            onClick={() => setFilter('resolved')}
          >
            {t('Đã giải quyết ({{count}})', { count: stats.resolved })}
          </Button>
        </div>
      </Card>

      {/* Reports List using Card */}
      {filteredReports.length === 0 ? (
        <Card tone="soft" className="p-8 text-center flex flex-col items-center justify-center gap-2">
          <div className="text-outline">
            <Icon name="check_circle" size={48} />
          </div>
          <p className="font-bold text-base text-on-surface">{t('Không có báo cáo nào')}</p>
          <p className="text-xs text-on-surface-variant max-w-sm">
            {t('Hiện tại không có báo cáo nào phù hợp với bộ lọc được chọn.')}
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3.5">
          {filteredReports.map((report) => {
            const isResolving = resolvingId === report.id;
            const isResolved = report.status === 'resolved';

            return (
              <Card
                key={report.id}
                tone={isResolved ? 'white' : 'soft'}
                className={`transition ${!isResolved ? 'ring-1 ring-amber-300' : 'opacity-80'}`}
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-outline-variant/15">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-on-surface-variant">
                      ID: #{report.id.slice(0, 8)}
                    </span>
                    <Badge tone={isResolved ? 'green' : 'yellow'}>
                      {isResolved ? t('Đã giải quyết') : t('Bản nháp')}
                    </Badge>
                    <Badge tone="neutral">
                      Snapshot v{report.version}
                    </Badge>
                    {report.questionId && (
                      <Badge tone="blue">
                        Question: {report.questionId}
                      </Badge>
                    )}
                    {report.ruleId && (
                      <Badge tone="yellow">
                        Rule: {report.ruleId}
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div>
                    {!isResolved ? (
                      <Button
                        variant="primary"
                        size="sm"
                        icon="check"
                        loading={isResolving}
                        onClick={() => onResolveReport(report.id)}
                      >
                        {t('Đánh dấu đã giải quyết')}
                      </Button>
                    ) : (
                      <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                        <Icon name="done_all" size={16} />
                        {t('Đã đóng báo cáo')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Body: Description & Details */}
                <div className="pt-3 flex flex-col gap-2">
                  <div className="text-xs text-on-surface bg-surface-low p-3 rounded-xl border border-outline-variant/20 leading-relaxed font-sans">
                    <strong className="block text-[11px] uppercase font-bold text-on-surface-variant mb-1">
                      {t('Nội dung người học phản ánh:')}
                    </strong>
                    <p className="whitespace-pre-wrap">{report.description}</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-on-surface-variant pt-1">
                    <span>
                      {t('Người gửi:')} <code className="font-mono">{report.userId}</code>
                    </span>
                    <span>
                      {t('Thời gian:')} {new Date(report.createdAt).toLocaleString(i18n.language.startsWith('en') ? 'en-US' : 'vi-VN')}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
