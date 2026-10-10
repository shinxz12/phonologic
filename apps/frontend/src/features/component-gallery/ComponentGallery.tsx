import LessonPreview from "./components/LessonPreview";
import "./ComponentGallery.css";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  IconButton,
  Icon,
  Badge,
  Card,
  StatPill,
  ProgressBar,
  TextField,
  AnswerOption,
  SegmentTile,
  FeedbackPanel,
  LessonNode,
  Navigation,
  type NavItem,
} from "../../components";

const rawNav: NavItem[] = [
  { id: "overview", label: "Tổng quan", icon: "grid_view" },
  { id: "foundation", label: "Nền tảng", icon: "palette" },
  { id: "controls", label: "Thao tác", icon: "touch_app" },
  { id: "learning", label: "Học & luyện tập", icon: "school" },
  { id: "preview", label: "Bài học mẫu", icon: "record_voice_over" },
];

const palette = [
  ["Primary container", "#58cc02"],
  ["Primary", "#2b6c00"],
  ["Secondary container", "#2fb8ff"],
  ["Secondary", "#006590"],
  ["Tertiary container", "#ddad00"],
  ["Error", "#ba1a1a"],
];

const rawMeanings = ["Con gái (ruột)", "Cháu gái", "Bác sĩ", "Tiếng cười"];

export default function ComponentGallery() {
  const { t } = useTranslation();
  const nav: NavItem[] = rawNav.map((item) => ({
    ...item,
    label: t(item.label),
  }));
  const meanings = rawMeanings.map((m) => t(m));

  const [active, setActive] = useState("overview");
  const [segment, setSegment] = useState("ai");
  const [answer, setAnswer] = useState(0);
  const [visible, setVisible] = useState(false);
  const [notice, setNotice] = useState(false);

  const navigate = (id: string) => {
    setActive(id);
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="gallery-shell">
      <aside className="gallery-sidebar">
        <a className="brand" href="#overview">
          <span className="brand-mark">
            <Icon name="record_voice_over" size={25} />
          </span>
          PhonoLogic
        </a>
        <div className="sidebar-label">{t("Design system")}</div>
        <Navigation items={nav} activeId={active} onChange={navigate} />
        <div className="sidebar-bottom">
          <span className="mini-avatar">
            <Icon name="auto_awesome" />
          </span>
          <div>
            <strong>Stitch foundations</strong>
            <span>Core components · v0.1</span>
          </div>
        </div>
      </aside>
      <div className="gallery-content">
        <header className="gallery-topbar">
          <div className="topbar-stats">
            <StatPill icon="local_fire_department" tone="yellow">
              {t("7 Ngày")}
            </StatPill>
            <StatPill icon="diamond" tone="blue">
              {t("1,420 Đá Quý")}
            </StatPill>
            <StatPill icon="favorite" tone="red">
              5/5
            </StatPill>
          </div>
          <span className="topbar-title">{t("Thư viện thành phần")}</span>
          <span className="mini-avatar">
            <Icon name="person" />
          </span>
        </header>
        <main className="gallery-main">
          <section id="overview" className="gallery-intro">
            <div>
              <div className="intro-badges">
                <Badge tone="green" icon="verified">
                  PhonoLogic / Core UI
                </Badge>
                <span>React + TypeScript</span>
              </div>
              <h1>
                {t("Một ngôn ngữ thiết kế.")}
                <br />
                {t("Cả hành trình học.")}
              </h1>
              <p>
                {t(
                  "Những thành phần nền tảng của PhonoLogic, được xây từ màu sắc, kiểu chữ và chi tiết giao diện trong thiết kế Stitch."
                )}
              </p>
              <div className="intro-actions">
                <Button icon="play_arrow" onClick={() => navigate("preview")}>
                  {t("Thử bài học mẫu")}
                </Button>
                <Button variant="outline" onClick={() => navigate("controls")}>
                  {t("Khám phá components")}
                  <Icon name="arrow_downward" size={18} />
                </Button>
              </div>
            </div>
            <div className="intro-visual">
              <div className="visual-stars">
                <Icon name="auto_awesome" size={30} />
                <Badge tone="yellow" icon="bolt">
                  {t("Học từng chút, tiến mỗi ngày")}
                </Badge>
              </div>
              <div className="visual-segments">
                <SegmentTile spelling="d" />
                <SegmentTile spelling="augh" selected state="correct" />
                <SegmentTile spelling="t" />
                <SegmentTile spelling="er" />
              </div>
              <div className="visual-caption">
                <Icon name="check_circle" size={20} />
                {t("Bóc tách chữ. Hiểu âm. Nhớ từ.")}
              </div>
            </div>
          </section>
          <section id="foundation" className="gallery-section">
            <div className="section-heading">
              <div>
                <span className="section-kicker">{t("Nền tảng")}</span>
                <h2>{t("Màu sắc & kiểu chữ")}</h2>
              </div>
              <Badge tone="neutral">{t("Tokens từ Stitch")}</Badge>
            </div>
            <div className="foundation-grid">
              <Card>
                <h3>{t("Bảng màu cốt lõi")}</h3>
                <div className="palette-grid">
                  {palette.map(([label, color]) => (
                    <div className="swatch" key={color}>
                      <div style={{ background: color }} />
                      <strong>{label}</strong>
                      <span>{color}</span>
                    </div>
                  ))}
                </div>
                <div className="surface-row">
                  <span style={{ background: "#fbf9f8" }}>Surface</span>
                  <span style={{ background: "#f5f3f3" }}>Surface low</span>
                  <span style={{ background: "#efeded" }}>Container</span>
                </div>
              </Card>
              <Card>
                <span className="section-kicker">Plus Jakarta Sans</span>
                <div className="type-display">
                  {t("Học âm.")}
                  <br />
                  {t("Hiểu từ.")}
                </div>
                <div className="type-example">
                  <strong>{t("Tiêu đề / 28 · 36 / 800")}</strong>
                  <p>
                    {t(
                      "Nunito Sans cho nội dung dễ đọc. Mỗi bài học là một bước nhỏ trên hành trình cải thiện phát âm."
                    )}
                  </p>
                  <span>Body / 16 · 24 / 600</span>
                </div>
                <div className="radius-samples">
                  <span>16</span>
                  <span>32</span>
                  <span>48</span>
                  <span>Pill</span>
                </div>
              </Card>
            </div>
          </section>
          <section id="controls" className="gallery-section">
            <div className="section-heading">
              <div>
                <span className="section-kicker">{t("Thao tác")}</span>
                <h2>{t("Rõ ràng ở mọi trạng thái")}</h2>
              </div>
              <span className="section-meta">Buttons · Inputs · Status</span>
            </div>
            <div className="controls-grid">
              <Card>
                <h3>{t("Nút hành động")}</h3>
                <p className="component-description">
                  {t("Bề mặt nổi, góc bo tròn và phản hồi khi nhấn.")}
                </p>
                <div className="button-stack">
                  <Button icon="play_arrow">{t("Bắt đầu ngay")}</Button>
                  <Button variant="secondary" icon="volume_up">
                    {t("Nghe âm mẫu")}
                  </Button>
                  <Button variant="outline" icon="replay">
                    {t("Luyện tập lại")}
                  </Button>
                </div>
                <div className="inline-wrap">
                  <Button size="sm">{t("Nhỏ")}</Button>
                  <Button disabled>{t("Chưa mở khóa")}</Button>
                  <Button loading>{t("Đang xử lý")}</Button>
                </div>
                <Button variant="ghost" onClick={() => setNotice(!notice)}>
                  {t("Xem phản hồi")}
                  <Icon name="arrow_forward" size={18} />
                </Button>
                {notice && (
                  <FeedbackPanel title={t("Sẵn sàng học!")} tone="info">
                    {t("Đây là trạng thái thông báo của component.")}
                  </FeedbackPanel>
                )}
              </Card>
              <Card>
                <h3>{t("Nhập thông tin")}</h3>
                <div className="field-stack">
                  <TextField
                    label={t("Email của bạn")}
                    placeholder="ban@example.com"
                    type="email"
                    icon="mail"
                    autoComplete="email"
                  />
                  <div className="password-field">
                    <TextField
                      label={t("Mật khẩu")}
                      placeholder={t("Nhập mật khẩu")}
                      type={visible ? "text" : "password"}
                      icon="lock"
                      autoComplete="new-password"
                    />
                    <IconButton
                      variant="ghost"
                      icon={visible ? "visibility_off" : "visibility"}
                      label={visible ? t("Ẩn mật khẩu") : t("Hiện mật khẩu")}
                      onClick={() => setVisible(!visible)}
                    />
                  </div>
                  <TextField
                    label={t("Biệt danh")}
                    defaultValue="ngoc anh"
                    error={t("Biệt danh không được chứa khoảng trắng.")}
                    icon="badge"
                  />
                </div>
              </Card>
              <Card>
                <h3>{t("Trạng thái & tiến trình")}</h3>
                <div className="status-stack">
                  <div className="inline-wrap">
                    <Badge tone="green" icon="verified">
                      {t("Hoàn thành")}
                    </Badge>
                    <Badge icon="headphones">{t("Luyện âm")}</Badge>
                    <Badge tone="yellow" icon="stars">
                      +15 XP
                    </Badge>
                    <Badge tone="red" icon="error">
                      {t("Cần thử lại")}
                    </Badge>
                  </div>
                  <ProgressBar
                    value={6}
                    max={10}
                    label={t("Tiến trình thử thách")}
                    caption={t("6 / 10 câu")}
                  />
                  <ProgressBar
                    value={45}
                    label={t("Lộ trình học")}
                    caption="45%"
                  />
                  <div className="inline-wrap">
                    <StatPill icon="local_fire_department" tone="yellow">
                      x6 Combo
                    </StatPill>
                    <StatPill icon="favorite" tone="red">
                      5/5
                    </StatPill>
                  </div>
                </div>
              </Card>
            </div>
          </section>
          <section id="learning" className="gallery-section">
            <div className="section-heading">
              <div>
                <span className="section-kicker">{t("Học & luyện tập")}</span>
                <h2>{t("Chạm, chọn và tiến bộ")}</h2>
              </div>
              <span className="section-meta">Selection · Feedback · Path</span>
            </div>
            <div className="learning-grid">
              <Card>
                <h3>{t("Lựa chọn đáp án")}</h3>
                <p className="component-description">
                  {t("Thử chọn một thẻ để xem trạng thái selected.")}
                </p>
                <div className="answer-stack">
                  {meanings.slice(0, 3).map((label, i) => (
                    <AnswerOption
                      key={label}
                      label={label}
                      letter={String.fromCharCode(65 + i)}
                      selected={answer === i}
                      onClick={() => setAnswer(i)}
                    />
                  ))}
                  <AnswerOption
                    label={t("Con gái (ruột)")}
                    letter="A"
                    state="correct"
                    selected
                    description={t("Trạng thái đáp án đúng")}
                  />
                  <AnswerOption
                    label={t("Tiếng cười")}
                    letter="D"
                    state="incorrect"
                    selected
                    description={t("Trạng thái cần thử lại")}
                  />
                </div>
              </Card>
              <div className="learning-side">
                <Card tone="soft">
                  <h3>{t("Chùm ký tự")}</h3>
                  <p className="component-description">
                    {t("Chọn một tổ hợp chữ mục tiêu.")}
                  </p>
                  <div className="segment-row">
                    {["ai", "ay", "ea", "a-e"].map((s) => (
                      <SegmentTile
                        key={s}
                        spelling={s}
                        selected={segment === s}
                        onClick={() => setSegment(s)}
                      />
                    ))}
                  </div>
                  <div className="notation-example">
                    <SegmentTile spelling="chữ" notation={t("Ký hiệu riêng")} />
                    <p>
                      {t("Truyền ký hiệu của hệ phiên âm mới qua prop ")}
                      <code>notation</code>.
                    </p>
                  </div>
                </Card>
                <Card>
                  <h3>{t("Nút bài học")}</h3>
                  <div className="lesson-nodes">
                    <LessonNode
                      status="completed"
                      label={t("Đã hoàn thành")}
                      onClick={() => navigate("preview")}
                    />
                    <LessonNode
                      status="current"
                      label={t("Bài đang học")}
                      onClick={() => navigate("preview")}
                    />
                    <LessonNode status="locked" label={t("Chưa mở khóa")} />
                    <LessonNode
                      status="reward"
                      label={t("Phần thưởng")}
                      onClick={() => navigate("preview")}
                    />
                  </div>
                </Card>
                <FeedbackPanel title={t("Tuyệt vời!")}>
                  {t(
                    "Bóc tách chùm chữ chính xác. Tiếp tục luyện để ghi nhớ lâu hơn."
                  )}
                </FeedbackPanel>
              </div>
            </div>
          </section>
          <section id="preview" className="gallery-section">
            <div className="section-heading">
              <div>
                <span className="section-kicker">{t("Bài học mẫu")}</span>
                <h2>{t("Components trong một trải nghiệm")}</h2>
              </div>
              <Badge icon="touch_app">{t("Có thể tương tác")}</Badge>
            </div>
            <LessonPreview />
          </section>
          <footer className="gallery-footer">
            <span className="brand">
              <Icon name="record_voice_over" />
              PhonoLogic
            </span>
            <p>{t("Core design system · Dựa trên thiết kế Stitch")}</p>
            <a href="/stitch/reference.html" target="_blank" rel="noreferrer">
              {t("Xem thiết kế tham chiếu")}
              <Icon name="open_in_new" size={16} />
            </a>
          </footer>
        </main>
      </div>
      <div className="gallery-mobile-nav">
        <Navigation
          items={nav}
          activeId={active}
          onChange={navigate}
          placement="bottom"
        />
      </div>
    </div>
  );
}
