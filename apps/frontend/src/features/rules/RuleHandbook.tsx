import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import type { SourceRule } from '@phonologic/shared-types';
import { Badge, Button, Card, FeedbackPanel, Icon, TextField } from '../../components';
import { playBrowserTts } from '../learning/audioUtils';
import { api } from '../../lib/api';
import { keys } from '../../lib/query';

export function RuleHandbook() {
  const { t } = useTranslation();
  const rulesQuery = useQuery({ queryKey: keys.rules, queryFn: () => api<SourceRule[]>('/learning/rules') });
  const rules = rulesQuery.data || [];
  const error = rulesQuery.error?.message;
  const loading = rulesQuery.isLoading;
  const [search, setSearch] = useState('');
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [audioError, setAudioError] = useState('');
  const load = () => void rulesQuery.refetch();
  const filtered = rules.filter(rule => `${rule.pattern} ${rule.notation} ${rule.condition || ''} ${rule.examples.join(' ')}`.toLowerCase().includes(search.toLowerCase()));
  function play(word: string) {
    playBrowserTts(word, 'US', 0.9);
  }
  return <section className="mx-auto grid max-w-5xl gap-7">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="font-display text-3xl tracking-tight">{t("Sổ tay chữ–âm")}</h1><p className="mt-2 text-on-surface-variant">{t("Tra quy tắc đã kiểm duyệt theo tổ hợp chữ, ký hiệu hoặc từ ví dụ.")}</p></div><Badge tone="blue" icon="menu_book">{rules.length} {t("quy tắc")}</Badge></header>
    <TextField label={t("Tìm quy tắc")} icon="search" value={search} onChange={e => setSearch(e.target.value)} placeholder={t("Nhập tổ hợp chữ hoặc từ ví dụ")} />
    {error && <FeedbackPanel title={t("Không tải được sổ tay")} tone="error" action={t("Thử lại")} onAction={load}>{error}</FeedbackPanel>}
    {loading ? <p role="status" className="py-8 text-center text-outline">{t("Đang tải quy tắc…")}</p> : !filtered.length ? <Card><div className="grid justify-items-center gap-4 py-8 text-center"><Icon name="menu_book" size={40} /><h3>{rules.length ? t("Không tìm thấy quy tắc") : t("Chưa có quy tắc được xuất bản")}</h3><p className="max-w-lg text-sm text-on-surface-variant">{rules.length ? t("Thử tìm bằng một tổ hợp chữ hoặc từ khác.") : t("Chỉ những quy tắc đã đối chiếu với hệ phiên âm riêng mới xuất hiện ở sổ tay.")}</p></div></Card> : <div className="grid gap-5 md:grid-cols-2">{filtered.map(rule => <Card key={rule.id}><div className="grid gap-4"><div className="flex items-center justify-between gap-4"><strong className="font-display text-3xl">{rule.pattern}</strong><Badge tone="blue">{rule.notation}</Badge></div>{rule.condition && <p className="text-sm text-on-surface-variant">{rule.condition}</p>}{rule.note && <div className="rounded-xl bg-tertiary-fixed/40 p-3 text-sm">{rule.note}</div>}<div className="flex flex-wrap gap-2">{rule.examples.map((word, i) => <Button key={`${word}-${i}`} size="sm" variant="outline" onClick={() => { setSelectedWord(word); setAudioError(''); }}>{word}</Button>)}</div></div></Card>)}</div>}
    {selectedWord && <Card tone="blue"><div className="flex flex-wrap items-center justify-between gap-4"><div><h2>{selectedWord}</h2></div><div className="flex gap-2"><Button icon="volume_up" onClick={() => play(selectedWord)}>{t("Nghe từ")}</Button><Button variant="ghost" onClick={() => { window.speechSynthesis?.cancel(); setSelectedWord(null); }}>{t("Đóng")}</Button></div></div>{audioError && <p role="alert" className="mt-4 text-sm text-error">{audioError}</p>}</Card>}
  </section>;
}
