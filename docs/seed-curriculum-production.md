# PhonoLogic — Tài liệu Đặc tả Seed Giáo trình & Bộ Quy tắc Ngữ âm Chuẩn Production

Tài liệu này được suy ra và chuẩn hóa trực tiếp từ dữ liệu nguồn `Quy tắc.xlsx` (Sheet1!A1:C156, gồm 155 quy tắc và 30 nhóm âm) kết hợp với thiết kế giao diện Stitch, hệ thống phân tích nghiệp vụ (`docs/product-analysis.md`) và kiến trúc dữ liệu PhonoLogic.

---

## 1. Chuẩn hóa Hệ ký hiệu Phiên âm Riêng (Custom Phonetic Notation)

Nguyên tắc cốt lõi: **Tuyệt đối không dùng ký hiệu IPA hàn lâm đối với người học.** 
Hệ ký hiệu riêng (Custom Notation) của PhonoLogic được thiết kế trực quan, dễ nhớ, phản ánh trực tiếp quan hệ âm–chữ:

| Nhóm âm (Excel Source) | Ký hiệu chuẩn (Custom Notation) | Tên gọi tiếng Việt | Ví dụ tiêu biểu | Mô tả / Ví dụ nhận diện |
|---|---|---|---|---|
| `/a/` | `/a/` | Âm /a/ | `cat`, `apple`, `cash` | như trong cat, apple, cash |
| `/e/` | `/e/` | Âm /e/ | `egg`, `health`, `said` | như trong egg, health, said |
| `/i/` | `/i/` | Âm /i/ | `kid`, `sit`, `typical` | như trong kid, sit, typical |
| `/o/` | `/o/` | Âm /o/ | `wrong`, `watch`, `option` | như trong wrong, watch, option |
| `/u/` | `/u/` | Âm /u/ | `hug`, `money`, `enough` | như trong hug, money, young |
| `/ai/` | `/ai/` | Âm /ai/ | `train`, `holiday`, `steak` | như trong train, steak, great |
| `/ee/` | `/ee/` | Âm /ee/ | `beach`, `three`, `piece` | như trong beach, three, piece |
| `/igh/` | `/igh/` | Âm /igh/ | `night`, `child`, `reply` | như trong night, child, dry |
| `/oa/` | `/oa/` | Âm /oa/ | `goal`, `open`, `hope` | như trong goal, open, hope |
| `/yoo/` | `/yoo/` | Âm /yoo/ | `unique`, `value`, `huge` | như trong unique, value, huge |
| `/oo(s)/` | `/oo(s)/` | Âm /oo(s)/ (oo ngắn) | `cook`, `look`, `put` | như trong cook, look, put |
| `/oo(l)/` | `/oo(l)/` | Âm /oo(l)/ (oo dài) | `food`, `glue`, `through` | như trong food, glue, through |
| `/oi/` | `/oi/` | Âm /oi/ | `oil`, `coin`, `boy` | như trong oil, coin, boy |
| `/ou/` | `/ou/` | Âm /ou/ | `owl`, `cloud`, `drought` | như trong owl, cloud, drought |
| `/ar/` | `/ar/` | Âm /ar/ | `art`, `garden`, `father` | như trong garden, target, father |
| `/or/` | `/or/` | Âm /or/ | `port`, `daughter`, `author` | như trong daughter, author, port |
| `/ur/` | `/ur/` | Âm /ur/ | `bird`, `letter`, `learn` | như trong letter, learn, girl |
| `/oor/` | `/oor/` | Âm /oor/ | `poor`, `tour`, `mature` | như trong poor, tour, mature |
| `/yoor/` | `/yoor/` | Âm /yoor/ | `pure`, `cure`, `secure` | như trong pure, cure, secure |
| `/air/` | `/air/` | Âm /air/ | `air`, `chair`, `nightmare` | như trong air, repair, nightmare |
| `/b/` | `/b/` | Phụ âm /b/ | `beer`, `bubble`, `build` | như trong beer, bubble, build |
| `/k/` | `/k/` | Phụ âm /k/ / C cứng | `skirt`, `black`, `chemistry` | như trong skirt, black, camping |
| `/d/` | `/d/` | Phụ âm /d/ | `dragon`, `wedding`, `rained` | như trong dragon, wedding, rained |
| `/f/` | `/f/` | Phụ âm /f/ / PH | `funeral`, `effort`, `phone` | như trong funeral, effort, laugh |
| `/g/` | `/g/` | Phụ âm /g/ cứng | `great`, `guide`, `ghost` | như trong great, guide, ghost |
| `/h/` | `/h/` | Phụ âm /h/ | `hill`, `horse`, `whole` | như trong horse, whole, hill |
| `/j/` | `/j/` | Phụ âm /j/ / G mềm | `job`, `gem`, `bridge` | như trong job, gem, bridge |
| `/l/` | `/l/` | Phụ âm /l/ | `life`, `live`, `volcano` | như trong life, language, climb |
| `/ul/` | `/ul/` | Âm /ul/ (Dark L) | `apple`, `natural`, `purple` | như trong apple, people, battle |
| `/m/` | `/m/` | Phụ âm /m/ | `milk`, `climb`, `summer` | như trong milk, summer, climb |
---

## 2. Danh mục 155 Quy tắc Nguồn và Cấu trúc Điều kiện

Dữ liệu được trích xuất nguyên vẹn từ `Quy tắc.xlsx`, gán mã định danh duy nhất (`rule_row_X`), gán ký hiệu chính thức, ghi nhận dòng Excel nguồn và điều kiện ngữ pháp/ngữ âm:

### Nhóm nguyên âm ngắn (Short Vowels)
- **rule_row_2**: `/a/` -> pattern: `a`, condition: `1 syllable` -> ví dụ: `cash, cat`
- **rule_row_3**: `/a/` -> pattern: `a`, condition: `2 syllables` -> ví dụ: `tablet, after`
- **rule_row_4**: `/a/` -> pattern: `a`, condition: `with /ul/ ending` -> ví dụ: `apple, candle, battle, sample`
- **rule_row_5**: `/a/` -> pattern: `a`, condition: `with double consonant` -> ví dụ: `ladder, happy`
- **rule_row_6**: `/e/` -> pattern: `e` -> ví dụ: `egg, jet, wet`
- **rule_row_7**: `/e/` -> pattern: `ea` -> ví dụ: `health, already, threat, weather, sweat`
- **rule_row_8**: `/e/` -> pattern: `ai` -> ví dụ: `said, against`
- **rule_row_9**: `/i/` -> pattern: `i`, condition: `1 syllable` -> ví dụ: `kid, sit, rich`
- **rule_row_10**: `/i/` -> pattern: `i`, condition: `2 syllables, with stress` -> ví dụ: `little, insect`
- **rule_row_11**: `/i/` -> pattern: `i`, condition: `2 syllables, without stress` -> ví dụ: `stupid, improve`
- **rule_row_12**: `/i/` -> pattern: `y` -> ví dụ: `typical, daily, healthy`
- **rule_row_13**: `/o/` -> pattern: `o` -> ví dụ: `option, wrong, logic, conquer`
- **rule_row_14**: `/o/` -> pattern: `wa` -> ví dụ: `watch, water, wash`
- **rule_row_15**: `/o/` -> pattern: `qua` -> ví dụ: `quality, quantity`
- **rule_row_16**: `/o/` -> pattern: `al` -> ví dụ: `all, talk, walk, alternate, although, always`
- **rule_row_17**: `/u/` -> pattern: `u` -> ví dụ: `hug, punch, trunk`
- **rule_row_18**: `/u/` -> pattern: `o` -> ví dụ: `month, money, colour`
- **rule_row_19**: `/u/` -> pattern: `ou` -> ví dụ: `young, enough`
- **rule_row_20**: `/u/` -> pattern: `oo` -> ví dụ: `blood, flood`

### Nhóm nguyên âm dài & nguyên âm đôi (Long Vowels & Diphthongs)
- **rule_row_21 .. 31**: `/ai/` (long-a) -> `ai` (train, maintain, fail), `ay` (array, holiday), `a` (maple, nation), `ae` (maelstrom), `a-e` (persuade, parade), `ea` (steak, great, break - *ngoại lệ kinh điển*), `ey` (obey, survey), `ei` (vein, beige), `eigh` (neighbor, weight), `et` (buffet, bouquet), `aigh` (straight).
- **rule_row_32 .. 39**: `/ee/` (long-e) -> `ee` (three, feel, teeth, green), `ea` (beach, meal, read, speak), `e` (he, she, ego), `e-e` (complete, compete, delete), `ei` (ceiling, receive, receipt), `ey` (money, key, monkey), `ie` (piece, believe, field), `i-e` (machine, cuisine, routine).
- **rule_row_40 .. 45**: `/igh/` (long-i) -> `igh` (knight, night), `ie` (tie, lie), `i` (child, item, virus), `y` (dry, reply, rely), `i-e` (crime, decide), `ei` (either, seismic, feisty).
- **rule_row_46 .. 53**: `/oa/` (long-o) -> `oa` (download, goal, approach), `ow` (show, pillow, arrow), `o` (open, old, zero), `oe` (toe, hoe), `o-e` (hope, wrote, lonely), `ough` (although, doughnut), `ou` (shoulder, soul), `eau` (bureau, gateau).
- **rule_row_54 .. 58**: `/yoo/` (long-u) -> `u` (unique, menu), `ue` (barbecue, statue, value), `u-e` (tube, volume, huge), `ew` (knew, nephew), `eu` (European, neutron).
- **rule_row_59 .. 62**: `/oo(s)/` (short-oo) -> `oo` (cook, look, foot), `ou` (should, could), `u` (put, pull, push), `o` (wolf, wolves).
- **rule_row_63 .. 73**: `/oo(l)/` (long-oo) -> `oo` (balloon, food), `ue` (glue, true), `u-e` (rude, tune), `ew` (crew, threw), `ui` (suit, cruise, bruise), `ou` (group, wound), `o-e` (movement, improve), `o` (womb, tomb), `u` (truth), `oe` (canoe), `ough` (through).
- **rule_row_74 .. 75**: `/oi/` (oi) -> `oi` (oil, boil, coin, choice), `oy` (boy, joy, enjoy).
- **rule_row_76 .. 78**: `/ou/` (ou) -> `ou` (account, without, blouse, hour), `ow` (owl, powder, clown), `ough` (drought, plough).

### Nhóm nguyên âm biến đổi theo âm R (R-Controlled Vowels)
- **rule_row_79 .. 83**: `/ar/` (ar) -> `ar` (garden, target, art), `a` (father), `alm` (calm, palm), `alf` (half, calf), `alves` (halves, calves).
- **rule_row_84 .. 94**: `/or/` (or) -> `or` (horror, afford), `oar` (coarse, soar), `oor` (indoor, outdoor), `ore` (adore, ignore), `our` (pour, court), `aw` (crawl, withdraw), `au` (author, audio, exhaust), `war` (award, reward), `quar` (aquarium), `augh` (naughty, daughter - *tập trung bài học Stitch*), `ough` (thought, brought).
- **rule_row_95 .. 104**: `/ur/` (ur) -> `er (with stress)` (herb, person), `ir` (sir, girl, thirsty), `ur` (church, hurt), `ear` (learn, Earth, research), `wor` (work, worth, world), `er (without stress)` (letter, computer), `our` (colour, harbour), `re` (centre, theatre), `ar` (sugar, guitar), `or` (doctor, comfort).
- **rule_row_105 .. 107**: `/oor/` (oor) -> `oor` (boorish, poor), `ure` (ensure, mature), `our` (tour, tourist).
- **rule_row_108 .. 109**: `/yoor/` (yoor) -> `ure` (pure, cure, secure), `ur` (purify, security, duration).
- **rule_row_110 .. 115**: `/air/` (air) -> `air` (dairy, repair), `are` (nightmare, declare, aware), `ear` (bear), `ere` (there), `eir` (their, heir), `aer` (aerobic).

### Nhóm phụ âm & tổ hợp phụ âm (Consonants & Clusters)
- **rule_row_116 .. 118**: `/b/` -> `b` (beer, boy), `bb` (bubble, cabbage), `bu` (build, buoy).
- **rule_row_119 .. 124**: `/k/` -> `k` (skirt, snake), `c` (camping, crunchy), `ck` (snack, black), `ch` (character, chemistry), `qu` (mosquitoes, bouquet), `que` (antique shop, boutique).
- **rule_row_125 .. 127**: `/d/` -> `d` (dragon, children), `dd` (addict, wedding), `ed` (rained, called, argued).
- **rule_row_128 .. 131**: `/f/` -> `f` (funeral, perform), `ff` (different, effort), `gh` (enough, cough, laugh), `ph` (photographer, atmosphere).
- **rule_row_132 .. 136**: `/g/` -> `g` (garbage, great), `gg` (blogger, luggage), `gu` (guardian, guide, guest), `gh` (spaghetti, ghost), `gue` (league, colleague).
- **rule_row_137 .. 138**: `/h/` -> `h` (horror, heal, horse), `wh` (whole, who, whom).
- **rule_row_139 .. 144**: `/j/` -> `j` (jungle, object, January), `ge` (image, orange, garbage), `g (before e)` (gem, gene, genius), `g (before i)` (ginger, giant, digital), `g (before y)` (gym, biology), `dge` (knowledge, bridge).
- **rule_row_145 .. 146**: `/l/` -> `l` (life, live, language), `ll` (all, collect, shell).
- **rule_row_147 .. 151**: `/ul/` -> `le` (people, battle, apple), `il` (pupil, evil), `al` (natural, chemical, local), `el` (panel, pixel), `ul` (culture, adult).
- **rule_row_152 .. 156**: `/m/` -> `m` (milk, medicine), `mm` (grammar, summer), `me` (income, sometimes), `mb` (climb, comb, crumb), `mn` (column, solemn, condemn).

---

## 3. Kiến trúc 6 Dạng Bài tập Phản xạ (Phonological Reflex Question Kinds)

Hệ thống bài học của PhonoLogic khai thác triệt để 6 dạng câu hỏi nhằm rèn luyện phản xạ hai chiều giữa chữ viết và âm thanh:

```mermaid
graph LR
    A[Chữ viết Grapheme] <--> B[Âm thanh Phoneme]
    B <--> C[Từ vựng Word]
    A <--> C
```

1. **`word_sound` (Từ + Vị trí chữ -> Nhận diện âm)**:
   - Người học nhìn thấy từ (ví dụ: `steak`), hệ thống gạch chân tổ hợp chữ (`ea`, highlight: `[2, 4]`).
   - Yêu cầu: Chọn đúng âm vị mà tổ hợp đó đại diện trong từ này (`long-a`).
   - Ý nghĩa: Ngăn ngừa việc máy móc gán `ea` luôn đọc là `long-e`.

2. **`sound_spelling` (Âm thanh -> Nhiều tổ hợp chữ)**:
   - Câu hỏi nhiều đáp án (`multiple: true`).
   - Đề bài: "Âm [long-a] có thể được viết bằng những tổ hợp chữ nào sau đây?"
   - Đáp án đúng: `ai`, `ay`, `a-e`, `ea`, `eigh`.
   - Ý nghĩa: Xây dựng phản xạ chính tả toàn diện cho người học.

3. **`spelling_sound` (Tổ hợp chữ -> Nhiều âm thanh có thể có)**:
   - Câu hỏi nhiều đáp án (`multiple: true`).
   - Đề bài: "Tổ hợp chữ 'ea' có thể phát âm thành những âm nào?"
   - Đáp án đúng: `long-e` (beach), `short-e` (health), `long-a` (steak).
   - Ý nghĩa: Giúp người học làm chủ tính đa âm vị của cùng một hình thái chữ.

4. **`sound_word` (Nghe âm -> Nhận diện từ chứa âm)**:
   - Đề bài: "Từ nào dưới đây có chứa âm [or]?"
   - Các lựa chọn: `daughter`, `laugh`, `matter`, `light`.
   - Đáp án đúng: `daughter` (nhờ tổ hợp `augh` phát âm thành `or`).

5. **`meaning` (Từ vựng, ngữ nghĩa & Bóc tách cấu trúc âm)**:
   - Hiển thị từ vựng với các mảnh ghép bóc tách âm chính xác (ví dụ `daughter` -> `d [d]`, `augh [or]`, `t [t]`, `er [ur]`).
   - Người học chọn nghĩa tiếng Việt chính xác và liên kết trực tiếp với cách đọc.

6. **`spelling` (Ghép chữ từ kho ký tự - Spelling Construction)**:
   - Kho mảnh ghép chữ cái, yêu cầu bấm chọn đúng thứ tự để tạo thành từ (ví dụ `l-e-t-t-e-r` hoặc `d-a-u-g-h-t-e-r`).
   - Kiểm tra khả năng nhớ chính tả tương ứng với chuỗi âm thanh đã học.

---

## 4. Đặc tả Cấu trúc 6 Sheet trong File Excel Nâng cao

File Excel `Quy tắc.xlsx` được nâng cấp mở rộng thành bộ cơ sở dữ liệu giáo trình hoàn chỉnh với 6 sheet chuẩn:

1. **Sheet `SourceRules_155`**: 
   - Danh sách đầy đủ 155 quy tắc với các cột: `id`, `sourceRow`, `sourceLabel`, `pattern`, `condition`, `examples`, `notation`, `status` (`approved`), `note`, `viExplanation`.
2. **Sheet `Vocabulary_Bank`**:
   - Kho từ vựng đại diện tần suất cao được bóc tách âm chuẩn xác: `word`, `meaningVi`, `pos`, `cefr`, `targetSound`, `targetPattern`, `segmentBreakdown`, `accent`, `sampleSentence`.
3. **Sheet `Curriculum_Lessons`**:
   - Danh mục bài học theo lộ trình tiến độ sư phạm: `id`, `titleVi`, `titleEn`, `descriptionVi`, `descriptionEn`, `level`, `accent`, `orderIndex`, `prerequisiteId`, `targetRuleIds`.
4. **Sheet `Question_Bank_6Types`**:
   - Ngân hàng câu hỏi thực tế bao phủ 6 dạng bài tập: `id`, `lessonId`, `kind`, `promptVi`, `promptEn`, `word`, `meaning`, `notation`, `highlightSpan`, `choicesJson`, `correctIdsJson`, `multiple`, `ruleId`, `segmentsJson`, `explanationVi`.
5. **Sheet `Reading_Passages`**:
   - Các bài đọc theo ngữ cảnh thực tế: `id`, `titleVi`, `titleEn`, `descriptionVi`, `level`, `accent`, `storyText`, `targetWordsJson` (với offset bắt đầu/kết thúc chính xác và segments âm).
6. **Sheet `Phonetic_Notation_Guide`**:
   - Bản quy chuẩn giải mã 30 nhóm âm, đối chiếu khẩu hình, so sánh IPA và lưu ý ngữ âm đặc thù.

---

## 5. Quy trình Đồng bộ & Vận hành Production Seed

1. **Khởi tạo và biên tập**: Biên tập viên có thể mở file Excel để kiểm duyệt hoặc thêm bớt ví dụ.
2. **Chạy script đồng bộ**:
   ```sh
   # Working directory: packages/db
   bun run seed:production
   ```
3. **Cơ chế phát hành bất biến (Immutable Snapshot)**:
   - Dữ liệu seed được nhập vào bản nháp (`learningContentDrafts`).
   - Khi chạy seed production hoặc bấm **Xuất bản** trên bảng quản trị, hệ thống kiểm tra toàn vẹn (không trùng ID, offset chính xác, segments khớp ký tự) và đóng gói thành `Snapshot v1`.
   - Toàn bộ học viên ngay lập tức có lộ trình học tập, bài tập 6 dạng và bài đọc thư viện phong phú, không phụ thuộc vào dữ liệu giả lập.
