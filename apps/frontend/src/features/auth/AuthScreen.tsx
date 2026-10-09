import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import type { AuthResult } from '@phonologic/shared-types';
import { Button, TextField, Icon, IconButton, Badge, LanguageSelector } from '../../components';
import { api, ApiError, saveAuth } from '../../lib/api';

export function AuthScreen({ onAuthenticated }: { onAuthenticated: (auth: AuthResult) => void }) {
  const { t } = useTranslation();
  const [register, setRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const authMutation = useMutation({
    mutationFn: () => api<AuthResult>(`/auth/${register ? 'register' : 'login'}`, { method: 'POST', body: JSON.stringify({ email, password, ...(register ? { fullName } : {}) }) }),
    onSuccess: auth => { saveAuth(auth); onAuthenticated(auth); },
  });
  const busy = authMutation.isPending;
  const error = authMutation.error?.message || '';
  const fields = authMutation.error instanceof ApiError ? authMutation.error.fields : {};
  function submit(event: FormEvent) { event.preventDefault(); authMutation.mutate(); }
  return <main className="grid min-h-dvh md:grid-cols-2">
    <section className="hidden flex-col overflow-hidden bg-[#e8f8dc] p-8 md:flex lg:px-14 lg:py-10" aria-label={t("Giới thiệu PhonoLogic")}>
      <div className="flex items-center gap-3 font-display text-2xl text-primary"><Icon name="graphic_eq" /><strong>PhonoLogic</strong></div>
      <div className="mt-16"><h1 className="text-4xl leading-tight tracking-tight text-primary lg:text-6xl">{t("Hiểu chữ.")}<br />{t("Nghe âm.")}<br />{t("Nói tự tin.")}</h1><p className="mt-6 max-w-sm text-lg leading-7 text-on-surface-variant">{t("Luyện phát âm tiếng Anh từ những mối liên hệ chữ–âm, từng từ đến từng câu.")}</p></div>
      <img className="mx-auto my-5 w-3/4 max-w-80 rounded-3xl mix-blend-multiply" src="/stitch/daughter.png" alt={t("Minh họa mẹ và con gái trong một tình huống giao tiếp gia đình")} />
      <div className="mt-auto flex items-center gap-3 text-sm text-primary"><Icon name="headphones" /><span>{t("Nghe · Nhận diện · Luyện nói · Ôn tập")}</span></div>
    </section>
    <section className="grid min-h-dvh content-start bg-surface px-5 py-6 md:content-center md:p-8 lg:p-12">
      <div className="mb-6 flex justify-end"><LanguageSelector /></div>
      <header className="mb-10 flex items-center gap-2 font-display text-lg text-primary md:hidden"><Icon name="graphic_eq" /><strong>PhonoLogic</strong><div className="ml-auto"><Badge tone="green">{t('Học phát âm')}</Badge></div></header>
      <div className="mx-auto w-full max-w-100">
        <div className="mx-auto mb-7 grid size-23 place-items-center rounded-full border-10 border-white bg-[#e3facb] text-primary"><Icon name={register ? 'school' : 'waving_hand'} size={42} /></div>
        <h2 className="text-center text-2xl! tracking-tight">{register ? t("Tạo tài khoản học viên") : t("Chào mừng trở lại!")}</h2>
        <p className="mx-auto mt-3 mb-7 max-w-88 text-center text-on-surface-variant">{register ? t("Lưu lộ trình của bạn và bắt đầu luyện chữ–âm theo cách mới.") : t("Tiếp tục luyện phát âm và quay lại những phần bạn cần ôn.")}</p>
        <form onSubmit={submit} className="grid gap-5">
          {register && <TextField label={t("Tên của bạn")} icon="person" value={fullName} onChange={e => setFullName(e.target.value)} autoComplete="name" required minLength={2} maxLength={100} error={fields.fullName} />}
          <TextField label="Email" icon="mail" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required error={fields.email} />
          <div className="relative [&_input]:pr-12"><TextField label={t("Mật khẩu")} icon="lock" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} autoComplete={register ? 'new-password' : 'current-password'} minLength={register ? 6 : undefined} required hint={register ? t("Tối thiểu 6 ký tự.") : undefined} error={fields.password} /><IconButton className="absolute! top-9 right-3" variant="ghost" size="sm" type="button" label={showPassword ? t("Ẩn mật khẩu") : t("Hiện mật khẩu")} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)} icon={showPassword ? 'visibility_off' : 'visibility'} /></div>
          {error && <p className="text-sm text-error" role="alert">{error}</p>}
          <Button type="submit" size="lg" icon="play_arrow" loading={busy}>{register ? t("Tạo tài khoản và bắt đầu") : t("Đăng nhập")}</Button>
        </form>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2 border-t border-surface-highest pt-6"><span>{register ? t("Đã có tài khoản?") : t("Chưa có tài khoản?")}</span><Button variant="ghost" size="sm" disabled={busy} onClick={() => { setRegister(!register); authMutation.reset(); setPassword(''); }}>{register ? t("Đăng nhập") : t("Đăng ký ngay")}</Button></div>
        <p className="mt-5 text-center text-xs leading-5 text-outline">{t("Tiến độ được lưu riêng theo tài khoản. Bản thu chỉ được tạo khi bạn chủ động bật mic.")}</p>
      </div>
    </section>
  </main>;
}
