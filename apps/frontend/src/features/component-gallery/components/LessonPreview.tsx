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
  AnswerOption,
  SegmentTile,
  StepHeading,
  InstructionCard,
  FeedbackPanel,
} from "../../../components";

const rawMeanings = ["Con gái (ruột)", "Cháu gái", "Bác sĩ", "Tiếng cười"];

export default function LessonPreview() {
  const { t } = useTranslation();
  const meanings = rawMeanings.map((m) => t(m));
  const [segment, setSegment] = useState("");
  const [meaning, setMeaning] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [step, setStep] = useState(1);
  const correct = segment === "augh" && meaning === 0;

  const reset = () => {
    setChecked(false);
    setSegment("");
    setMeaning(null);
    setStep((s) => (s === 10 ? 1 : s + 1));
  };

  return (
    <div className="lesson-preview">
      <div className="lesson-top">
        <IconButton
          icon="close"
          label={t("Đặt lại bài mẫu")}
          variant="ghost"
          onClick={() => {
            reset();
            setStep(1);
          }}
        />
        <ProgressBar
          value={step}
          max={10}
          label={t("Tiến trình luyện tập")}
          caption={t("{{step}} / 10 câu", { step })}
        />
        <StatPill icon="favorite" tone="red">
          5/5
        </StatPill>
      </div>
      <div className="lesson-mode">
        <Badge icon="record_voice_over">{t("Âm vị → Nghĩa")}</Badge>
        <Badge tone="yellow" icon="bolt">
          {t("Bài tập mẫu")}
        </Badge>
      </div>
      <div className="lesson-columns">
        <div className="lesson-stage">
          <InstructionCard title={t("Thử thách kép!")}>
            {t(
              "Bóc tách chùm chữ chứa âm mục tiêu, sau đó chọn nghĩa tiếng Việt tương ứng."
            )}
          </InstructionCard>
          <Card className="word-card">
            <img
              src="/stitch/daughter.png"
              alt={t("Minh họa người mẹ ôm con gái")}
            />
            <Badge tone="neutral">{t("Danh từ (Noun)")}</Badge>
            <h2>DAUGHTER</h2>
            <p>{t("Con gái · Gia đình")}</p>
            <div className="target-strip">
              <Icon name="filter_vintage" />
              <strong>{t("Chùm chữ mục tiêu: augh")}</strong>
              <Icon name="spellcheck" />
            </div>
          </Card>
          <div>
            <StepHeading number={1}>
              {t("Chạm vào chùm chữ mục tiêu:")}
            </StepHeading>
            <div className="segment-row">
              {["d", "augh", "t", "er"].map((s) => (
                <SegmentTile
                  key={s}
                  spelling={s}
                  selected={segment === s}
                  disabled={checked}
                  state={
                    checked && segment === s
                      ? s === "augh"
                        ? "correct"
                        : "incorrect"
                      : "idle"
                  }
                  onClick={() => setSegment(s)}
                />
              ))}
            </div>
          </div>
          <div>
            <StepHeading number={2}>
              {t("Chọn nghĩa tiếng Việt chính xác:")}
            </StepHeading>
            <div className="answer-stack">
              {meanings.map((label, i) => (
                <AnswerOption
                  key={label}
                  label={label}
                  letter={String.fromCharCode(65 + i)}
                  selected={meaning === i}
                  disabled={checked}
                  state={
                    checked && meaning === i
                      ? i === 0
                        ? "correct"
                        : "incorrect"
                      : "idle"
                  }
                  onClick={() => setMeaning(i)}
                />
              ))}
            </div>
          </div>
          {checked ? (
            <FeedbackPanel
              title={correct ? t("Chính xác xuất sắc!") : t("Hãy thử lại nhé!")}
              tone={correct ? "success" : "error"}
              action={correct ? t("Tiếp tục") : t("Thử lại")}
              onAction={correct ? reset : () => setChecked(false)}
            >
              {correct
                ? t("Bạn đã nhận diện đúng chùm chữ và nghĩa của từ daughter.")
                : t(
                    "Chùm chữ mục tiêu là augh. Daughter có nghĩa là con gái (ruột)."
                  )}
            </FeedbackPanel>
          ) : (
            <Button
              className="lesson-submit"
              disabled={!segment || meaning === null}
              onClick={() => setChecked(true)}
            >
              {t("Kiểm tra")}
              <Icon name="arrow_forward" size={20} />
            </Button>
          )}
        </div>
        <aside className="lesson-notes">
          <Card>
            <div className="section-kicker">
              <Icon name="alt_route" size={20} />
              {t("Lộ trình phản xạ")}
            </div>
            <ol>
              <li>{t("Nhận diện chùm chữ")}</li>
              <li>{t("Hiểu nghĩa từ vựng")}</li>
              <li>{t("Luyện nói với âm mẫu")}</li>
              <li>{t("Đọc trong ngữ cảnh")}</li>
            </ol>
          </Card>
          <Card tone="yellow">
            <div className="section-kicker">
              <Icon name="lightbulb" size={20} />
              {t("Mẹo học từ")}
            </div>
            <p>
              {t("Ghi nhớ từ theo nhóm chữ")} <strong>d · augh · t · er</strong>
              {", "}
              {t("kết hợp hình ảnh và nghĩa tiếng Việt.")}
            </p>
          </Card>
          <Card tone="soft">
            <div className="section-kicker">
              <Icon name="info" size={20} />
              {t("Hệ phiên âm riêng")}
            </div>
            <p>
              {t(
                "Ký hiệu và âm mẫu sẽ được bổ sung từ bộ quy ước của bạn. Bản mẫu này minh họa thao tác chữ và nghĩa."
              )}
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
