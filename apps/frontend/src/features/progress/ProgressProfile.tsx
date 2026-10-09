import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AuthResult, LearningDashboard, MeResponse, Preferences, RecordingView } from '@phonologic/shared-types';
import { Badge, Button, Card, FeedbackPanel, Icon, ProgressBar, StatPill, TextField } from '../../components';
import { api, apiBlob, saveAuth } from '../../lib/api';
import { keys } from '../../lib/query';

export function ProgressProfile({ dashboard, user, onUpdated, onLogout }: { dashboard: LearningDashboard; user: MeResponse; onUpdated: () => void; onLogout: () => void }) {
  const { t, i18n } = useTranslation();
  const [prefs, setPrefs] = useState<Preferences>(dashboard.preferences);
  const [fullName, setFullName] = useState(user.fullName);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<Error | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const queryClient = useQueryClient();
  const recordingsQuery = useQuery({ queryKey: keys.recordings, queryFn: () => api<RecordingView[]>('/learning/recordings') });
  const recordings = recordingsQuery.data || [];
  const [recordingError, setRecordingError] = useState<Error | null>(null);
  const [audio, setAudio] = useState<{ id: string; url: string } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const p = dashboard.progress;
  useEffect(() => () => { if (audio) URL.revokeObjectURL(audio.url); }, [audio]);
  const beforeSave = () => { setError(null); setMessage(''); };
  const preferenceMutation = useMutation({
    mutationFn: () => api<Preferences>('/learning/preferences', { method: 'PUT', body: JSON.stringify(prefs) }),
    onMutate: beforeSave,
    onSuccess: () => { setMessage('Đã lưu mục tiêu học tập.'); onUpdated(); },
    onError: e => setError(e),
  });
  const profileMutation = useMutation({
    mutationFn: () => api('/auth/profile', { method: 'PUT', body: JSON.stringify({ fullName }) }),
    onMutate: beforeSave,
    onSuccess: () => { setMessage('Đã lưu tên của bạn.'); onUpdated(); },
    onError: e => setError(e),
  });
  const passwordMutation = useMutation({
    mutationFn: () => api<AuthResult>('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
    onMutate: beforeSave,
    onSuccess: auth => { saveAuth(auth); setCurrentPassword(''); setNewPassword(''); setMessage('Đã đổi mật khẩu.'); onUpdated(); },
    onError: e => setError(e),
  });
  const listenMutation = useMutation({
    mutationFn: (recording: RecordingView) => apiBlob(`/learning/recordings/${recording.id}/audio`),
    onMutate: () => setRecordingError(null),
    onSuccess: (blob, recording) => setAudio({ id: recording.id, url: URL.createObjectURL(blob) }),
    onError: e => setRecordingError(e),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/learning/recordings/${id}`, { method: 'DELETE' }),
    onMutate: () => setRecordingError(null),
    onSuccess: (_, id) => { queryClient.setQueryData(keys.recordings, recordings.filter(row => row.id !== id)); if (audio?.id === id) setAudio(null); setDeleting(null); onUpdated(); },
    onError: e => setRecordingError(e),
  });
  const busy = preferenceMutation.isPending || profileMutation.isPending || passwordMutation.isPending;
  const audioBusy = listenMutation.isPending ? listenMutation.variables?.id : deleteMutation.isPending ? deleteMutation.variables : null;
  function savePreferences(event: FormEvent) { event.preventDefault(); preferenceMutation.mutate(); }
  function saveProfile(event: FormEvent) { event.preventDefault(); profileMutation.mutate(); }
  function changePassword(event: FormEvent) { event.preventDefault(); passwordMutation.mutate(); }
  function listen(recording: RecordingView) { listenMutation.mutate(recording); }
  function removeRecording(id: string) { deleteMutation.mutate(id); }
  return <section className="mx-auto grid max-w-5xl gap-7">
    <Card><div className="flex flex-wrap items-center justify-between gap-5"><div className="flex items-center gap-5"><div className="grid size-20 place-items-center rounded-full bg-primary-container/15 text-primary"><Icon name="person" size={42} /></div><div><h1 className="font-display text-2xl tracking-tight">{user.fullName}</h1><p className="mt-1 break-all text-sm text-outline">{user.email}</p><div className="mt-3"><Badge tone="green" icon="school">{t("Học viên PhonoLogic")}</Badge></div></div></div><Button variant="outline" icon="logout" onClick={onLogout}>{t("Đăng xuất")}</Button></div></Card>
    <div><h2 className="mb-5 text-[22px]!">{t("Tiến bộ của bạn")}</h2><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card><div className="grid gap-3"><StatPill icon="local_fire_department" tone="yellow">{p.streak} {t("ngày", { count: p.streak })}</StatPill><h3>{t("Chuỗi ngày học")}</h3><p className="text-xs text-outline">{p.studyDays} {t("ngày có hoạt động học", { count: p.studyDays })}</p></div></Card>
      <Card><div className="grid gap-3"><StatPill icon="check_circle" tone="green">{p.correct}/{p.answered}</StatPill><h3>{t("Quiz đúng")}</h3><p className="text-xs text-outline">{p.accuracy === null ? t("Chưa đủ dữ liệu") : t("{{percent}}% số câu đã trả lời", { percent: Math.round(p.accuracy) })}</p></div></Card>
      <Card><div className="grid gap-3"><StatPill icon="auto_stories" tone="blue">{p.completedLessons}/{p.totalLessons}</StatPill><h3>{t("Bài hoàn thành")}</h3><p className="text-xs text-outline">{t("Không suy ra kỹ năng nói")}</p></div></Card>
      <Card><div className="grid gap-3"><StatPill icon="replay" tone="yellow">{p.reviewCount} {t("câu")}</StatPill><h3>{t("Cần ôn lại")}</h3><p className="text-xs text-outline">{t("Dựa trên câu trả lời sai")}</p></div></Card>
    </div></div>
    <Card tone="blue"><div className="grid gap-4"><div className="flex items-center gap-3"><Icon name="mic" /><h3>{t("Luyện nói được theo dõi riêng")}</h3></div><p>{p.speakingRecorded} {t("phiên có bản thu ·")} {p.speakingSkipped} {t("phiên bỏ qua nói")}</p><p className="text-sm text-on-surface-variant">{p.speakingScore === null ? t("Chưa có đánh giá phát âm. Nghe lại bản thu để tự đối chiếu; số lượt thu không phải điểm chất lượng phát âm.") : t("Điểm nói: {{score}}", { score: p.speakingScore })}</p><ProgressBar value={p.completedLessons} max={p.totalLessons || 1} label={t("Độ bao phủ bài học")} caption={t("Độ bao phủ bài học, không phải độ chuẩn phát âm")} /></div></Card>
    {p.recent.length > 0 && <Card><h3>{t("Lịch sử trả lời gần đây")}</h3><ul className="mt-5 divide-y divide-surface-highest">{p.recent.map((attempt, i) => <li key={`${attempt.at}-${i}`} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><div className="flex items-center gap-3"><Icon name={attempt.correct ? 'check_circle' : 'replay'} /><span>{t(attempt.title)}</span></div><span className="text-outline">{new Date(attempt.at).toLocaleString(i18n.language === 'en' ? 'en-US' : 'vi-VN')}</span></li>)}</ul></Card>}
    {message && <FeedbackPanel title={t("Đã lưu")} tone="success">{t(message)}</FeedbackPanel>}{error && <FeedbackPanel title={t("Không lưu được")} tone="error">{error.message}</FeedbackPanel>}
    <div className="grid items-start gap-6 md:grid-cols-2">
      <Card><form onSubmit={savePreferences} className="grid gap-5"><h3>{t("Mục tiêu và giọng tham chiếu")}</h3><TextField label={t("Mục tiêu học tập")} value={prefs.goal} onChange={e => setPrefs({ ...prefs, goal: e.target.value })} required maxLength={64} /><TextField label={t("Số phút mỗi ngày")} type="number" min={1} max={180} value={prefs.dailyMinutes} onChange={e => setPrefs({ ...prefs, dailyMinutes: Number(e.target.value) })} required /><fieldset><legend className="mb-3 text-sm font-bold">{t("Giọng tham chiếu")}</legend><div className="flex gap-3"><Button type="button" variant={prefs.accent === 'US' ? 'secondary' : 'outline'} aria-pressed={prefs.accent === 'US'} onClick={() => setPrefs({ ...prefs, accent: 'US' })}>{t("Anh–Mỹ")}</Button><Button type="button" variant={prefs.accent === 'UK' ? 'secondary' : 'outline'} aria-pressed={prefs.accent === 'UK'} onClick={() => setPrefs({ ...prefs, accent: 'UK' })}>{t("Anh–Anh")}</Button></div></fieldset><Button type="submit" loading={busy} variant="outline">{t("Lưu mục tiêu")}</Button></form></Card>
      <div className="grid gap-6"><Card><form onSubmit={saveProfile} className="grid gap-5"><h3>{t("Thông tin tài khoản")}</h3><TextField label={t("Tên của bạn")} value={fullName} onChange={e => setFullName(e.target.value)} autoComplete="name" minLength={2} maxLength={100} required /><Button type="submit" loading={busy} variant="outline">{t("Lưu tên")}</Button></form></Card><Card><form onSubmit={changePassword} className="grid gap-5"><h3>{t("Đổi mật khẩu")}</h3><TextField label={t("Mật khẩu hiện tại")} type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} autoComplete="current-password" required /><TextField label={t("Mật khẩu mới")} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} autoComplete="new-password" required minLength={6} /><Button type="submit" loading={busy} variant="outline">{t("Đổi mật khẩu")}</Button></form></Card></div>
    </div>
    <Card><div className="flex items-center justify-between gap-3"><h3>{t("Bản thu của bạn")}</h3><Badge tone="blue" icon="mic">{recordings.length} {t("bản thu")}</Badge></div><p className="mt-3 text-sm text-outline">{t("Chỉ tài khoản của bạn có thể nghe và xóa các bản thu này.")}</p>{(recordingError || recordingsQuery.error) && <p role="alert" className="mt-4 text-error">{recordingError?.message || recordingsQuery.error?.message}</p>}{!recordings.length && <p className="py-6 text-sm text-on-surface-variant">{t("Chưa có bản thu. Bật mic trong bài học hoặc bài đọc để luyện nói.")}</p>}<ul className="mt-4 divide-y divide-surface-highest">{recordings.map(recording => <li key={recording.id} className="grid gap-3 py-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><strong>{recording.word}</strong><p className="text-xs text-outline">{new Date(recording.createdAt).toLocaleString(i18n.language === 'en' ? 'en-US' : 'vi-VN')}</p></div><div className="flex gap-2"><Button variant="outline" size="sm" icon="play_arrow" loading={audioBusy === recording.id} onClick={() => listen(recording)}>{t("Nghe lại")}</Button><Button variant="ghost" size="sm" icon="delete" disabled={audioBusy === recording.id} onClick={() => setDeleting(recording.id)}>{t("Xóa")}</Button></div></div>{audio?.id === recording.id && <audio className="w-full" src={audio.url} controls autoPlay />}{deleting === recording.id && <div className="flex flex-wrap items-center gap-3 rounded-xl bg-error-container/40 p-3 text-sm"><span>{t("Xóa vĩnh viễn bản thu này?")}</span><Button variant="danger" size="sm" loading={audioBusy === recording.id} onClick={() => removeRecording(recording.id)}>{t("Xóa bản thu")}</Button><Button variant="ghost" size="sm" onClick={() => setDeleting(null)}>{t("Giữ lại")}</Button></div>}</li>)}</ul></Card>
  </section>;
}
