import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type {
  AdminContentView,
  ContentBundle,
  SourceRule,
} from '@phonologic/shared-types';
import { api, ApiError } from '../../lib/api';
import { queryClient, keys } from '../../lib/query';
import { Button, Badge, Card, FeedbackPanel, Icon } from '../../components';
import { AdminRulesTab } from './AdminRulesTab';
import { AdminBundleTab } from './AdminBundleTab';
import { AdminPublishTab } from './AdminPublishTab';
import { AdminReportsTab } from './AdminReportsTab';

export interface AdminContentProps {
  onPublished: () => void;
}

const DEFAULT_EMPTY_BUNDLE: ContentBundle = {
  notationVersion: '2026.10-v1',
  notationConfirmed: false,
  rules: [],
  lessons: [],
  readings: [],
};

export function AdminContent({ onPublished }: AdminContentProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'rules' | 'bundle' | 'publish' | 'reports'>('rules');

  // Server state via TanStack Query
  const adminQuery = useQuery<AdminContentView>({
    queryKey: keys.admin,
    queryFn: () => api<AdminContentView>('/learning/admin'),
  });

  // Local draft state for editing
  const [draft, setDraft] = useState<ContentBundle | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Local feedback banners
  const [successNotice, setSuccessNotice] = useState<{
    key: string;
    params?: Record<string, unknown>;
  } | null>(null);
  const [generalError, setGeneralError] = useState<{
    err?: unknown;
    fallbackKey: string;
  } | null>(null);
  const [publishError, setPublishError] = useState<unknown | null>(null);
  const [lastPublishSuccess, setLastPublishSuccess] = useState(false);
  const [resolvingReportId, setResolvingReportId] = useState<string | null>(null);
  // Synchronize draft when server query succeeds (do NOT overwrite unsaved edits if dirty)
  useEffect(() => {
    if (adminQuery.data?.draft && !isDirty && draft === null) {
      setDraft(adminQuery.data.draft);
    }
  }, [adminQuery.data, isDirty, draft]);

  // Mutations
  const saveDraftMutation = useMutation({
    mutationFn: (bundleToSave: ContentBundle) =>
      api<AdminContentView>('/learning/admin/draft', {
        method: 'PUT',
        body: JSON.stringify(bundleToSave),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(keys.admin, data);
      setDraft(data.draft);
      setIsDirty(false);
      setSuccessNotice({
        key: 'Đã lưu bản nháp thành công lên máy chủ (PUT /learning/admin/draft).',
      });
      setGeneralError(null);
      setPublishError(null);
    },
    onError: (err) => {
      setGeneralError({
        err,
        fallbackKey: 'Lỗi khi lưu bản nháp lên máy chủ',
      });
    },
  });

  const publishMutation = useMutation({
    mutationFn: (body: { notationConfirmed: boolean; notationVersion: string }) =>
      api<AdminContentView>('/learning/admin/publish', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(keys.admin, data);
      queryClient.invalidateQueries({ queryKey: keys.dashboard });
      queryClient.invalidateQueries({ queryKey: keys.rules });
      setDraft(data.draft);
      setIsDirty(false);
      setLastPublishSuccess(true);
      setPublishError(null);
      setSuccessNotice({
        key: 'Xuất bản thành công phiên bản v{{version}}! Học viên đã được đồng bộ snapshot mới.',
        params: {
          version: data.publishedVersion,
        },
      });
      onPublished();
    },
    onError: (err) => {
      setLastPublishSuccess(false);
      setPublishError(err);
    },
  });

  const resolveReportMutation = useMutation({
    mutationFn: (reportId: string) =>
      api<{ success: boolean }>(`/learning/admin/reports/${reportId}/resolve`, {
        method: 'POST',
      }),
    onSuccess: (_, reportId) => {
      queryClient.setQueryData<AdminContentView | undefined>(keys.admin, (old) => {
        if (!old) return old;
        return {
          ...old,
          reports: old.reports.map((r) =>
            r.id === reportId ? { ...r, status: 'resolved' as const } : r
          ),
        };
      });
      setSuccessNotice({ key: 'Đã đánh dấu giải quyết báo cáo thành công.' });
      setResolvingReportId(null);
    },
    onError: (err) => {
      setGeneralError({
        err,
        fallbackKey: 'Lỗi khi giải quyết báo cáo',
      });
      setResolvingReportId(null);
    },
  });

  // Effective current draft bundle
  const currentBundle: ContentBundle = draft ?? adminQuery.data?.draft ?? DEFAULT_EMPTY_BUNDLE;
  const publishedVersion = adminQuery.data?.publishedVersion ?? 0;
  const reports = adminQuery.data?.reports ?? [];

  const openReportsCount = useMemo(
    () => reports.filter((r) => r.status === 'open').length,
    [reports]
  );

  // Loading state
  if (adminQuery.isLoading && !adminQuery.data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-on-surface-variant min-h-[360px] gap-3">
        <div className="animate-spin text-primary">
          <Icon name="progress_activity" size={40} />
        </div>
        <p className="text-sm font-semibold">{t('Đang tải dữ liệu quản trị nội dung & ngữ âm...')}</p>
      </div>
    );
  }

  // Initial error state if failed to load
  if (adminQuery.isError && !adminQuery.data) {
    const message =
      adminQuery.error instanceof ApiError
        ? adminQuery.error.message
        : adminQuery.error instanceof Error
          ? adminQuery.error.message
          : t('Lỗi truy cập bảng quản trị');

    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Card tone="soft" className="p-8 text-center flex flex-col items-center gap-4">
          <div className="text-error">
            <Icon name="error" size={48} />
          </div>
          <h2 className="text-lg font-bold text-on-surface font-display">
            {t('Lỗi truy cập bảng quản trị')}
          </h2>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            {message}
          </p>
          <Button
            variant="primary"
            icon="refresh"
            onClick={() => adminQuery.refetch()}
          >
            {t('Thử tải lại')}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-6 flex flex-col gap-6">
      {/* Top Header Bar inside Card */}
      <Card tone="white" className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-black text-on-surface font-display tracking-tight">
              {t('Quản trị nội dung & Ngữ âm')}
            </h1>
            <Badge tone="blue" icon="admin_panel_settings">
              <span translate="no">rbac.manageRoles</span>
            </Badge>
            <Badge tone={publishedVersion > 0 ? 'green' : 'neutral'}>
              {t('Snapshot v{{version}}', { version: publishedVersion })}
            </Badge>
            {isDirty && (
              <Badge tone="yellow" icon="edit">
                {t('Bản nháp có chỉnh sửa chưa lưu')}
              </Badge>
            )}
          </div>
          <p className="text-xs text-on-surface-variant max-w-2xl leading-relaxed">
            {t(
              'Biên tập quy tắc chữ–âm đối chiếu Excel (Quy tắc.xlsx), chuẩn hóa hệ ký hiệu phiên âm riêng (Custom Notation), biên soạn bài học và xuất bản snapshot học tập bất biến.'
            )}
          </p>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon="undo"
            onClick={() => {
              if (adminQuery.data?.draft) {
                setDraft(adminQuery.data.draft);
                setIsDirty(false);
                setSuccessNotice({ key: 'Đã khôi phục dữ liệu từ bản nháp máy chủ.' });
              }
            }}
            disabled={!isDirty}
          >
            {t('Hủy thay đổi')}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon="save"
            loading={saveDraftMutation.isPending}
            disabled={!isDirty}
            onClick={() => saveDraftMutation.mutate(currentBundle)}
          >
            {t('Lưu bản nháp (PUT)')}
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon="publish"
            onClick={() => setActiveTab('publish')}
          >
            {t('Xuất bản phiên bản mới')}
          </Button>
        </div>
      </Card>

      {/* Dismissible Feedback Banners */}
      {successNotice && (
        <FeedbackPanel title={t('Hoàn thành')} tone="success" action={t('Đóng')} onAction={() => setSuccessNotice(null)}>
          {t(successNotice.key, successNotice.params)}
        </FeedbackPanel>
      )}
      {generalError && (
        <FeedbackPanel title={t('Không thực hiện được')} tone="error" action={t('Đóng')} onAction={() => setGeneralError(null)}>
          {generalError.err instanceof Error ? generalError.err.message : t(generalError.fallbackKey)}
        </FeedbackPanel>
      )}

      {/* Main Tab Navigation (Mobile Usable with horizontal scroll) */}
      <nav className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-outline-variant/20 -mx-3 px-3 sm:mx-0 sm:px-0">
        <Button size="sm" variant={activeTab === 'rules' ? 'primary' : 'outline'} className="min-h-11! shrink-0" aria-pressed={activeTab === 'rules'} onClick={() => setActiveTab('rules')} icon="table_chart">
          {t('Quy tắc nguồn Excel')} <Badge tone="neutral">{currentBundle.rules.length}</Badge>
        </Button>
        <Button size="sm" variant={activeTab === 'bundle' ? 'primary' : 'outline'} className="min-h-11! shrink-0" aria-pressed={activeTab === 'bundle'} onClick={() => setActiveTab('bundle')} icon="data_object">
          {t('Gói nội dung JSON')} <Badge tone="neutral">{currentBundle.lessons.length}L / {currentBundle.readings.length}R</Badge>
        </Button>
        <Button size="sm" variant={activeTab === 'publish' ? 'primary' : 'outline'} className="min-h-11! shrink-0" aria-pressed={activeTab === 'publish'} onClick={() => setActiveTab('publish')} icon="publish">
          {t('Xuất bản & Snapshot')} <Badge tone="neutral">v{publishedVersion}</Badge>
        </Button>
        <Button size="sm" variant={activeTab === 'reports' ? 'primary' : 'outline'} className="min-h-11! shrink-0" aria-pressed={activeTab === 'reports'} onClick={() => setActiveTab('reports')} icon="flag">
          {t('Báo cáo nội dung')} <Badge tone={openReportsCount > 0 ? 'yellow' : 'neutral'}>{openReportsCount}</Badge>
        </Button>
      </nav>

      {/* Tab Panels */}
      <main className="w-full">
        {activeTab === 'rules' && (
          <AdminRulesTab
            rules={currentBundle.rules}
            onUpdateRule={(updatedRule: SourceRule) => {
              const newRules = currentBundle.rules.map((r) =>
                r.id === updatedRule.id ? updatedRule : r
              );
              setDraft({ ...currentBundle, rules: newRules });
              setIsDirty(true);
              setSuccessNotice(null);
            }}
            onSaveDraft={() => saveDraftMutation.mutate(currentBundle)}
            saving={saveDraftMutation.isPending}
            isDirty={isDirty}
          />
        )}

        {activeTab === 'bundle' && (
          <AdminBundleTab
            draft={currentBundle}
            onApplyDraft={(newBundle: ContentBundle) => {
              setDraft(newBundle);
              setIsDirty(true);
              setSuccessNotice(null);
            }}
            onSaveDraft={async (bundleToSave?: ContentBundle) => {
              await saveDraftMutation.mutateAsync(bundleToSave ?? currentBundle);
            }}
            saving={saveDraftMutation.isPending}
            isDirty={isDirty}
          />
        )}

        {activeTab === 'publish' && (
          <AdminPublishTab
            draft={currentBundle}
            publishedVersion={publishedVersion}
            onPublish={(flags: { notationConfirmed: boolean; notationVersion: string }) => {
              publishMutation.mutate(flags);
            }}
            publishing={publishMutation.isPending}
            error={publishError}
            lastPublishSuccess={lastPublishSuccess}
          />
        )}

        {activeTab === 'reports' && (
          <AdminReportsTab
            reports={reports}
            onResolveReport={(reportId: string) => {
              setResolvingReportId(reportId);
              resolveReportMutation.mutate(reportId);
            }}
            resolvingId={resolvingReportId}
          />
        )}
      </main>
    </div>
  );
}
