import type { LearningDashboard, LessonSummary } from '@phonologic/shared-types';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, Icon, LessonNode, ProgressBar } from '../../components';

export function LearningHome({ dashboard, practice = false, busy, onStart, onReview, onRules, onAdmin }: { dashboard: LearningDashboard; practice?: boolean; busy: boolean; onStart: (lesson: LessonSummary) => void; onReview: () => void; onRules: () => void; onAdmin?: () => void }) {
  const { t } = useTranslation();
  const { progress, preferences, lessons } = dashboard;
  return <div className="grid items-start gap-9 xl:grid-cols-[minmax(0,1fr)_280px]">
    <section className="min-w-0">
      <div className="flex flex-col items-start justify-between gap-4 rounded-3xl bg-linear-to-br from-[#388300] via-primary-container to-secondary p-5 sm:p-6 lg:p-8 text-white shadow-[0_5px_0_var(--primary)] md:flex-row md:items-center">
        <div className="max-w-xl">
          <Badge tone="yellow" icon="school">{practice ? t("Luyện tập theo nhu cầu") : t("Lộ trình chữ–âm")}</Badge>
          <h1 className="mt-3 mb-2 whitespace-pre-line font-display text-2xl leading-8 tracking-tight lg:text-[28px] lg:leading-9">
            {practice ? t("Luyện phản xạ.\nGhi nhớ qua từng từ.") : t("Làm chủ chữ và âm\ntrong tiếng Anh.")}
          </h1>
          <p className="text-xs sm:text-sm leading-relaxed text-white/90">
            {practice ? t("Ôn những câu bạn từng trả lời sai, hoặc luyện lại một bài đã học.") : t("Nghe mẫu, nhận diện chữ–âm, rồi luyện nói trong ngữ cảnh.")}
          </p>
        </div>
        <Button variant="outline" size="sm" className="shrink-0 bg-white! text-primary! font-bold! shadow-xs" icon="menu_book" onClick={onRules}>
          {t("Sổ tay quy tắc")}
        </Button>
      </div>
      {dashboard.contentNotice && <div className="mx-1 my-6 flex items-start gap-3 text-sm leading-5 text-on-surface-variant"><Icon name="info" size={20} /><p>{t(dashboard.contentNotice)}</p></div>}
      {practice && <Card tone="blue" className="my-7"><div className="flex flex-wrap items-center gap-4"><Icon name="replay" size={32} /><div className="flex-1"><h3>{t("Ôn phần còn yếu")}</h3><p className="mt-2 text-sm">{progress.reviewCount ? t("{{count}} câu cần ôn từ các lần luyện trước.", { count: progress.reviewCount }) : t("Chưa có câu sai cần ôn. Tiếp tục học để ghi nhận kết quả.")}</p></div><Button onClick={onReview} disabled={!progress.reviewCount} loading={busy} icon="play_arrow">{t("Bắt đầu ôn")}</Button></div></Card>}
      {lessons.length ? <div className={practice ? 'mt-7 grid gap-5 sm:grid-cols-2' : 'relative flex flex-col items-center gap-8 overflow-hidden py-11'}>
        {!practice && <svg className="pointer-events-none absolute top-11 left-1/2 -translate-x-1/2" width="320" height={Math.max(280, lessons.length * 164)} viewBox={`0 0 320 ${Math.max(280, lessons.length * 164)}`} aria-hidden="true"><path d={lessons.map((_, i) => `${i === 0 ? 'M' : 'Q'} ${i === 0 ? '160 48' : `${i % 2 ? 330 : -10} ${i * 164 - 38} 160 ${i * 164 + 48}`}`).join(' ')} fill="none" stroke="var(--surface-highest)" strokeWidth="9" strokeLinecap="round" strokeDasharray="4 13" /></svg>}
        {lessons.map((lesson, index) => practice ? <Card key={lesson.id}><div className="grid gap-4"><div><Badge tone={lesson.status === 'completed' ? 'green' : 'blue'} icon={lesson.status === 'completed' ? 'check_circle' : 'graphic_eq'}>{lesson.accent}</Badge></div><h3>{lesson.title}</h3><p className="text-sm text-on-surface-variant">{lesson.description}</p><span className="text-sm text-outline">{lesson.questionCount} {t("câu hỏi", { count: lesson.questionCount })}</span><Button disabled={lesson.status === 'locked'} loading={busy} onClick={() => onStart(lesson)} icon={lesson.status === 'locked' ? 'lock' : 'play_arrow'}>{lesson.status === 'completed' ? t("Luyện lại") : lesson.sessionId ? t("Tiếp tục") : t("Bắt đầu")}</Button></div></Card> : <div key={lesson.id} className={`z-1 grid min-h-34 max-w-58 justify-items-center gap-3 text-center ${index % 3 === 1 ? '-translate-x-10' : index % 3 === 2 ? 'translate-x-10' : ''}`}><Badge tone={lesson.status === 'completed' ? 'green' : 'neutral'}>{lesson.questionCount} {t("câu ·", { count: lesson.questionCount })} {lesson.accent}</Badge><LessonNode status={lesson.status} label={lesson.title} onClick={() => !busy && onStart(lesson)} />{lesson.status === 'current' && <Button size="sm" loading={busy} onClick={() => onStart(lesson)}>{lesson.sessionId ? t("Tiếp tục bài học") : t("Bắt đầu ngay")}</Button>}</div>)}
      </div> : <Card className="mt-7"><div className="grid justify-items-center gap-5 py-5 text-center"><div className="grid size-25 place-items-center rounded-full bg-[#e7f6dc] text-primary"><Icon name="auto_stories" size={48} /></div><h2 className="text-[22px]! leading-8!">{t("Nội dung đang chờ kiểm duyệt")}</h2><p className="max-w-98 text-sm leading-6 text-on-surface-variant">{t("Quy tắc nguồn cần được đối chiếu với hệ phiên âm riêng trước khi trở thành bài học. Khi nội dung được xuất bản, lộ trình của bạn sẽ xuất hiện tại đây.")}</p>{onAdmin && <Button onClick={onAdmin} icon="edit_note">{t("Kiểm duyệt nội dung")}</Button>}<Button variant="ghost" onClick={onRules}>{t("Mở sổ tay quy tắc")}</Button></div></Card>}
    </section>
    <aside className="hidden gap-5 xl:grid">
      <Card><div className="grid gap-5"><div className="flex items-center gap-2 text-primary"><Icon name="flag" /><h3>{t("Mục tiêu của bạn")}</h3></div><p className="text-sm text-on-surface-variant">{t(preferences.goal)}</p><div><Badge tone="green" icon="schedule">{preferences.dailyMinutes} {t("phút mỗi ngày")}</Badge></div><div className="flex justify-between gap-3 text-sm"><span>{t("Giọng tham chiếu")}</span><strong>{preferences.accent === 'US' ? t("Anh–Mỹ") : t("Anh–Anh")}</strong></div></div></Card>
      <Card><div className="grid gap-5"><div className="flex items-center gap-2 text-secondary"><Icon name="trending_up" /><h3>{t("Tiến độ học tập")}</h3></div><ProgressBar value={progress.completedLessons} max={progress.totalLessons || 1} label={t("Bài học đã hoàn thành")} caption={t("{{completed}}/{{total}} bài học hoàn thành", { completed: progress.completedLessons, total: progress.totalLessons })} /><div className="flex justify-between gap-3 text-sm"><span>{t("Tỷ lệ quiz đúng")}</span><strong>{progress.accuracy === null ? t("Chưa có dữ liệu") : `${Math.round(progress.accuracy)}%`}</strong></div><div className="flex justify-between text-sm"><span>{t("Câu cần ôn")}</span><strong>{progress.reviewCount}</strong></div><div className="flex justify-between text-sm"><span>{t("Chuỗi ngày học")}</span><strong>{progress.streak} {t("ngày")}</strong></div></div></Card>
      <Card tone="yellow"><div className="grid gap-4"><div className="flex items-center gap-2"><Icon name="lightbulb" /><h3>{t("Học ít, nhớ lâu")}</h3></div><p className="text-sm leading-6 text-on-surface-variant">{t("Nghe cả từ trước khi tập trung vào một tổ hợp chữ. Cùng một cách viết có thể tạo ra nhiều âm khác nhau.")}</p><Button variant="ghost" size="sm" onClick={onRules}>{t("Tra cứu chữ–âm")}</Button></div></Card>
      <p className="px-2 text-xs leading-5 text-outline">{t("Kết quả nói được theo dõi riêng với quiz.")}</p>
    </aside>
  </div>;
}
