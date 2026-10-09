import { useState } from "react";
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
const meanings = ["Con gái (ruột)", "Cháu gái", "Bác sĩ", "Tiếng cười"];
export default function LessonPreview() {
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
          label="Đặt lại bài mẫu"
          variant="ghost"
          onClick={() => {
            reset();
            setStep(1);
          }}
        />
        <ProgressBar
          value={step}
          max={10}
          label="Tiến trình luyện tập"
          caption={`${step} / 10 câu`}
        />
        <StatPill icon="favorite" tone="red">
          5/5
        </StatPill>
      </div>
      <div className="lesson-mode">
        <Badge icon="record_voice_over">Âm vị → Nghĩa</Badge>
        <Badge tone="yellow" icon="bolt">
          Bài tập mẫu
        </Badge>
      </div>
      <div className="lesson-columns">
        <div className="lesson-stage">
          <InstructionCard title="Thử thách kép!">
            Bóc tách chùm chữ chứa âm mục tiêu, sau đó chọn nghĩa tiếng Việt
            tương ứng.
          </InstructionCard>
          <Card className="word-card">
            <img
              src="/stitch/daughter.png"
              alt="Minh họa người mẹ ôm con gái"
            />
            <Badge tone="neutral">Danh từ (Noun)</Badge>
            <h2>DAUGHTER</h2>
            <p>Con gái · Gia đình</p>
            <div className="target-strip">
              <Icon name="filter_vintage" />
              <strong>Chùm chữ mục tiêu: augh</strong>
              <Icon name="spellcheck" />
            </div>
          </Card>
          <div>
            <StepHeading number={1}>Chạm vào chùm chữ mục tiêu:</StepHeading>
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
              Chọn nghĩa tiếng Việt chính xác:
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
              title={correct ? "Chính xác xuất sắc!" : "Hãy thử lại nhé!"}
              tone={correct ? "success" : "error"}
              action={correct ? "Tiếp tục" : "Thử lại"}
              onAction={correct ? reset : () => setChecked(false)}
            >
              {correct
                ? "Bạn đã nhận diện đúng chùm chữ và nghĩa của từ daughter."
                : "Chùm chữ mục tiêu là augh. Daughter có nghĩa là con gái (ruột)."}
            </FeedbackPanel>
          ) : (
            <Button
              className="lesson-submit"
              disabled={!segment || meaning === null}
              onClick={() => setChecked(true)}
            >
              Kiểm tra
              <Icon name="arrow_forward" size={20} />
            </Button>
          )}
        </div>
        <aside className="lesson-notes">
          <Card>
            <div className="section-kicker">
              <Icon name="alt_route" size={20} />
              Lộ trình phản xạ
            </div>
            <ol>
              <li>Nhận diện chùm chữ</li>
              <li>Hiểu nghĩa từ vựng</li>
              <li>Luyện nói với âm mẫu</li>
              <li>Đọc trong ngữ cảnh</li>
            </ol>
          </Card>
          <Card tone="yellow">
            <div className="section-kicker">
              <Icon name="lightbulb" size={20} />
              Mẹo học từ
            </div>
            <p>
              Ghi nhớ từ theo nhóm chữ <strong>d · augh · t · er</strong>, kết
              hợp hình ảnh và nghĩa tiếng Việt.
            </p>
          </Card>
          <Card tone="soft">
            <div className="section-kicker">
              <Icon name="info" size={20} />
              Hệ phiên âm riêng
            </div>
            <p>
              Ký hiệu và âm mẫu sẽ được bổ sung từ bộ quy ước của bạn. Bản mẫu
              này minh họa thao tác chữ và nghĩa.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
