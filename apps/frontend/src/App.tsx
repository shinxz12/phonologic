import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Accent, AuthResult, LearningDashboard, LessonSummary, MeResponse, Preferences, SessionView } from '@phonologic/shared-types';
import { AccentSelector, Badge, Button, Card, FeedbackPanel, Icon, IconButton, LanguageSelector, Navigation, StatPill } from './components';
import { AuthScreen } from './features/auth';
import { LearningHome } from './features/home';
import { RuleHandbook } from './features/rules';
import { api, clearAuth, getStoredAuth } from './lib/api';
import { keys } from './lib/query';

const LearningSession = lazy(() => import('./features/learning').then(module => ({ default: module.LearningSession })));
const ReadingLibrary = lazy(() => import('./features/reading').then(module => ({ default: module.ReadingLibrary })));
const ReadingDetail = lazy(() => import('./features/reading').then(module => ({ default: module.ReadingDetail })));
const ProgressProfile = lazy(() => import('./features/progress').then(module => ({ default: module.ProgressProfile })));
const AdminContent = lazy(() => import('./features/admin').then(module => ({ default: module.AdminContent })));

const navItems = [
  { id: 'learn', label: 'Học', icon: 'home' },
  { id: 'practice', label: 'Luyện tập', icon: 'graphic_eq' },
  { id: 'reading', label: 'Đọc', icon: 'auto_stories' },
  { id: 'progress', label: 'Tiến bộ', icon: 'bar_chart' },
];
function currentRoute() { return window.location.hash.slice(1) || 'learn'; }
function navigate(route: string) { window.location.hash = route; }

export default function App() {
  const { t } = useTranslation();
  const [auth, setAuth] = useState<AuthResult | null>(getStoredAuth);
  const [route, setRoute] = useState(currentRoute);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('phonologic.sidebar.collapsed') === 'true';
    }
    return false;
  });
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('phonologic.sidebar.collapsed', String(next));
      return next;
    });
  };
  const queryClient = useQueryClient();
  const meQuery = useQuery({ queryKey: keys.me, queryFn: () => api<MeResponse>('/auth/me'), enabled: !!auth });
  const dashboardQuery = useQuery({ queryKey: keys.dashboard, queryFn: () => api<LearningDashboard>('/learning/dashboard'), enabled: !!auth });
  const user = meQuery.data;
  const dashboard = dashboardQuery.data;
  const [actionError, setError] = useState<Error | null>(null);
  const error = actionError?.message || meQuery.error?.message || dashboardQuery.error?.message || '';
  const loading = meQuery.isLoading || dashboardQuery.isLoading;
  useEffect(() => {
    const onRoute = () => { setRoute(currentRoute()); setError(null); window.scrollTo(0, 0); };
    const onLogout = () => { queryClient.clear(); setAuth(null); };
    window.addEventListener('hashchange', onRoute);
    window.addEventListener('phonologic:logout', onLogout);
    return () => { window.removeEventListener('hashchange', onRoute); window.removeEventListener('phonologic:logout', onLogout); };
  }, [queryClient]);
  const reload = useCallback(async () => {
    setError(null);
    await Promise.all([queryClient.invalidateQueries({ queryKey: keys.me }), queryClient.invalidateQueries({ queryKey: keys.dashboard })]);
  }, [queryClient]);
  const startMutation = useMutation({
    mutationFn: (lesson: LessonSummary) => api<SessionView>('/learning/sessions', { method: 'POST', body: JSON.stringify({ lessonId: lesson.id }) }),
    onMutate: () => setError(null),
    onSuccess: session => { queryClient.setQueryData(keys.session(session.id), session); navigate(`session/${session.id}`); },
    onError: e => setError(e),
  });
  const reviewMutation = useMutation({
    mutationFn: () => api<SessionView>('/learning/review', { method: 'POST' }),
    onMutate: () => setError(null),
    onSuccess: session => { queryClient.setQueryData(keys.session(session.id), session); navigate(`session/${session.id}`); },
    onError: e => setError(e),
  });
  const logoutMutation = useMutation({
    mutationFn: () => api('/auth/logout', { method: 'POST' }),
    onSuccess: () => { clearAuth(); navigate('learn'); },
    onError: e => setError(e),
  });
  const updateAccentMutation = useMutation({
    mutationFn: (accent: Accent) =>
      api<Preferences>('/learning/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          goal: dashboard?.preferences.goal || 'communicate',
          dailyMinutes: dashboard?.preferences.dailyMinutes || 15,
          timezone: dashboard?.preferences.timezone || 'Asia/Ho_Chi_Minh',
          accent,
        }),
      }),
    onSuccess: (newPrefs) => {
      queryClient.setQueryData<LearningDashboard | undefined>(keys.dashboard, (old) => {
        if (!old) return old;
        return { ...old, preferences: newPrefs };
      });
      queryClient.invalidateQueries({ queryKey: keys.dashboard });
    },
  });
  const busy = startMutation.isPending || reviewMutation.isPending || logoutMutation.isPending || updateAccentMutation.isPending;
  if (!auth) return <AuthScreen onAuthenticated={result => { queryClient.clear(); setAuth(result); navigate('learn'); }} />;
  const admin = !!user?.permissions.includes('rbac.manageRoles');
  const sessionId = route.startsWith('session/') ? route.slice(8) : null;
  const readingId = route.startsWith('reading/') ? route.slice(8) : null;
  const immersive = !!sessionId || !!readingId;
  const active = sessionId ? 'learn' : readingId ? 'reading' : route === 'rules' ? 'practice' : route;
  return <div className="min-h-dvh">
    {!immersive && (
      <aside
        className={`fixed inset-y-0 left-0 z-20 hidden flex-col border-r border-surface-highest bg-white transition-all duration-200 lg:flex ${
          isSidebarCollapsed ? 'w-20 px-3 py-6 items-center' : 'w-56 px-5 py-7'
        }`}
      >
        <div className={`mb-8 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} w-full`}>
          <Button
            variant="ghost"
            className={`justify-start! gap-2! p-0! text-primary! ${isSidebarCollapsed ? 'size-10! justify-center!' : ''}`}
            onClick={() => navigate('learn')}
            aria-label={t("PhonoLogic — về lộ trình")}
          >
            <Icon name="graphic_eq" />
            {!isSidebarCollapsed && <strong className="font-display text-lg">PhonoLogic</strong>}
          </Button>
          <IconButton
            icon={isSidebarCollapsed ? "chevron_right" : "chevron_left"}
            label={isSidebarCollapsed ? t("Mở rộng thanh bên") : t("Thu gọn thanh bên")}
            size="sm"
            variant="ghost"
            onClick={toggleSidebar}
          />
        </div>

        <Navigation
          items={navItems.map(item => ({ ...item, label: t(item.label) }))}
          activeId={active}
          onChange={navigate}
          collapsed={isSidebarCollapsed}
        />

        <div className={`mt-5 grid gap-2 w-full ${isSidebarCollapsed ? 'justify-items-center' : ''}`}>
          {isSidebarCollapsed ? (
            <>
              <IconButton icon="menu_book" label={t("Sổ tay quy tắc")} size="sm" variant="ghost" onClick={() => navigate('rules')} />
              {admin && <IconButton icon="edit_note" label={t("Nội dung")} size="sm" variant="ghost" onClick={() => navigate('admin')} />}
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" icon="menu_book" onClick={() => navigate('rules')} className="w-full justify-start! gap-3! px-4! py-3! rounded-xl! text-left! font-bold! text-on-surface-variant hover:text-on-surface">{t("Sổ tay quy tắc")}</Button>
              {admin && <Button variant="ghost" size="sm" icon="edit_note" onClick={() => navigate('admin')} className="w-full justify-start! gap-3! px-4! py-3! rounded-xl! text-left! font-bold! text-on-surface-variant hover:text-on-surface">{t("Nội dung")}</Button>}
            </>
          )}
        </div>

        {isSidebarCollapsed ? (
          <div className="mt-auto">
            <IconButton
              icon="person"
              label={user?.fullName || auth.user.fullName}
              className="rounded-full! bg-primary-container/20 text-primary"
              onClick={() => navigate('progress')}
            />
          </div>
        ) : (
          <Button
            variant="ghost"
            className="mt-auto h-auto! justify-start! gap-3! rounded-2xl! bg-surface-low! p-3! text-left! font-normal!"
            onClick={() => navigate('progress')}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-container/15 text-primary">
              <Icon name="person" />
            </span>
            <span className="min-w-0">
              <strong className="block truncate text-sm">{user?.fullName || auth.user.fullName}</strong>
              <span className="text-xs text-outline">{t("Hồ sơ học viên")}</span>
            </span>
          </Button>
        )}
      </aside>
    )}
    <div className={immersive ? 'w-full min-h-dvh' : isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-56'}>
      {!immersive && (
        <header className="sticky top-0 z-10 flex min-h-16 items-center justify-between gap-3 border-b border-surface-highest bg-surface/95 px-4 backdrop-blur-sm md:px-8">
          <Button variant="ghost" className="justify-start! gap-2! p-0! text-primary! lg:hidden!" onClick={() => setIsMobileDrawerOpen(true)} aria-label={t("Mở menu điều hướng")}><Icon name="menu" /><Icon name="graphic_eq" /><strong className="font-display text-sm max-[360px]:hidden">PhonoLogic</strong></Button>
          <div className="hidden items-center gap-3 lg:flex"><StatPill icon="local_fire_department" tone="yellow">{dashboard?.progress.streak ?? 0} {t("ngày", { count: dashboard?.progress.streak ?? 0 })}</StatPill><StatPill icon="check_circle" tone="blue">{dashboard?.progress.completedLessons ?? 0} {t("bài", { count: dashboard?.progress.completedLessons ?? 0 })}</StatPill></div>
          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2.5">
            <LanguageSelector />
            <AccentSelector currentAccent={dashboard?.preferences.accent || 'US'} onChange={(acc: Accent) => updateAccentMutation.mutate(acc)} disabled={updateAccentMutation.isPending} />
            {admin && <div className="hidden sm:inline-flex"><IconButton size="sm" variant="ghost" icon="edit_note" label={t("Nội dung")} onClick={() => navigate('admin')} /></div>}
            <IconButton className="rounded-full! bg-primary! text-white!" variant="ghost" icon="person" label={t("Mở hồ sơ và cài đặt")} onClick={() => navigate('progress')} />
          </div>
        </header>
      )}
      <main className={immersive ? 'w-full min-h-dvh p-0' : 'mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8 pb-28 lg:pb-10'}>
        {error && <div className="mb-6"><FeedbackPanel title={t("Không thực hiện được")} tone="error" action={t("Thử tải lại")} onAction={() => void reload()}>{error}</FeedbackPanel></div>}
        <Suspense fallback={<p className="py-12 text-center text-outline" role="status">{t('Đang tải giao diện…')}</p>}>
        {loading ? <Card><p className="py-12 text-center text-outline" role="status">{t("Đang tải lộ trình của bạn…")}</p></Card> : !dashboard || !user ? <Card><div className="grid justify-items-center gap-5 py-10"><Icon name="cloud_off" size={42} /><h3>{t("Chưa kết nối được dữ liệu học tập")}</h3><Button onClick={() => void reload()}>{t("Thử lại")}</Button><Button variant="ghost" onClick={() => clearAuth()}>{t("Về đăng nhập")}</Button></div></Card> :
          sessionId ? <LearningSession key={sessionId} sessionId={sessionId} onExit={() => { navigate('learn'); void reload(); }} onUpdated={() => void reload()} /> :
          readingId ? <ReadingDetail key={readingId} readingId={readingId} onExit={() => { navigate('reading'); void reload(); }} onUpdated={() => void reload()} /> :
          route === 'rules' ? <RuleHandbook /> :
          route === 'reading' ? <ReadingLibrary readings={dashboard.readings} admin={admin} onOpen={id => navigate(`reading/${id}`)} /> :
          route === 'progress' ? <ProgressProfile dashboard={dashboard} user={user} onUpdated={() => void reload()} onLogout={() => logoutMutation.mutate()} /> :
          route === 'admin' ? admin ? <AdminContent onPublished={() => void reload()} /> : <FeedbackPanel title={t("Không có quyền truy cập")} tone="error">{t("Tài khoản này không có quyền quản lý nội dung.")}</FeedbackPanel> :
          <LearningHome dashboard={dashboard} practice={route === 'practice'} busy={busy} onStart={lesson => startMutation.mutate(lesson)} onReview={() => reviewMutation.mutate()} onRules={() => navigate('rules')} onAdmin={admin ? () => navigate('admin') : undefined} />}
        </Suspense>
      </main>
      {!immersive && <div className="fixed inset-x-0 bottom-0 z-20 border-t border-surface-highest bg-white px-2 pb-[env(safe-area-inset-bottom)] lg:hidden"><Navigation items={navItems.map(item => ({ ...item, label: t(item.label) }))} activeId={active} onChange={navigate} placement="bottom" /></div>}
      {/* Mobile / Tablet Drawer Menu */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={() => setIsMobileDrawerOpen(false)} aria-hidden="true" />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-surface-highest bg-white px-5 py-6 shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between pb-6 border-b border-outline-variant/20">
              <div className="flex items-center gap-2 text-primary font-display font-bold text-lg">
                <Icon name="graphic_eq" />
                <span>PhonoLogic</span>
              </div>
              <IconButton icon="close" label={t("Đóng menu")} variant="ghost" size="sm" onClick={() => setIsMobileDrawerOpen(false)} />
            </div>
            <div className="py-4">
              <Navigation items={navItems.map(item => ({ ...item, label: t(item.label) }))} activeId={active} onChange={(id) => { navigate(id); setIsMobileDrawerOpen(false); }} />
            </div>
            <div className="mt-4 grid gap-1 border-t border-outline-variant/20 pt-4">
              <Button variant="ghost" size="sm" icon="menu_book" onClick={() => { navigate('rules'); setIsMobileDrawerOpen(false); }} className="w-full justify-start! gap-3! px-4! py-3! rounded-xl! text-left! font-bold! text-on-surface-variant hover:text-on-surface">{t("Sổ tay quy tắc")}</Button>
              {admin && <Button variant="ghost" size="sm" icon="edit_note" onClick={() => { navigate('admin'); setIsMobileDrawerOpen(false); }} className="w-full justify-start! gap-3! px-4! py-3! rounded-xl! text-left! font-bold! text-on-surface-variant hover:text-on-surface">{t("Nội dung")}</Button>}
            </div>
            <Button variant="ghost" className="mt-auto h-auto! justify-start! gap-3! rounded-2xl! bg-surface-low! p-3! text-left! font-normal!" onClick={() => { navigate('progress'); setIsMobileDrawerOpen(false); }}>
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-container/15 text-primary"><Icon name="person" /></span>
              <span className="min-w-0"><strong className="block truncate text-sm">{user?.fullName || auth.user.fullName}</strong><span className="text-xs text-outline">{t("Hồ sơ học viên")}</span></span>
            </Button>
          </aside>
        </div>
      )}
    </div>
  </div>;
}
