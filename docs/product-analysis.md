# PhonoLogic — Phân tích UI và nghiệp vụ sản phẩm

Ngày: 09/10/2026. Trạng thái: đề xuất để định hướng, chưa phải đặc tả đã được duyệt.

**Yêu cầu đã xác nhận:** người Việt trưởng thành; sử dụng hệ phiên âm mới của chủ sản phẩm, không sử dụng IPA. Chủ sản phẩm xác nhận có bộ quy ước riêng ngoài Excel; bộ quy ước chưa được cung cấp. Cột Sound chỉ là dữ liệu nguồn, chưa được xem là ký hiệu chính thức. Các ký hiệu IPA xuất hiện trong mockup là nội dung phải thay thế, không phải chuẩn của sản phẩm.

## 1. Kết luận sản phẩm

PhonoLogic nên giúp **người Việt trưởng thành cải thiện phát âm tiếng Anh bằng cách hiểu quan hệ chữ–âm và luyện trong ngữ cảnh**. Giá trị chính là biết một từ được đọc thế nào, nhận ra phần chữ tạo âm, nghe mẫu, luyện nói và quay lại những lỗi còn yếu.

Vòng học: **Nghe → nhận diện → bóc tách chữ–âm → nói → đọc trong ngữ cảnh → ôn tập**. Nghĩa tiếng Việt hỗ trợ hiểu từ; điểm kinh nghiệm và streak hỗ trợ thói quen. Không dùng XP làm bằng chứng tiến bộ phát âm.

Ba hướng triển khai:

| Hướng | Lợi ích | Đánh đổi |
|---|---|---|
| **Khuyến nghị: nội dung chữ–âm đã kiểm duyệt + luyện nói từng từ + ôn lỗi** | Bám thiết kế, tạo giá trị học tập rõ, kiểm soát đáp án | Cần chuẩn hóa dữ liệu và thử nghiệm chấm phát âm |
| Thư viện quy tắc và quiz trước | Ra bản thử nhanh; ít phụ thuộc AI | Chưa kiểm chứng trực tiếp việc người học nói tốt hơn |
| Toàn bộ trò chơi, giải đấu, cửa hàng và AI ngay | Nhiều tính năng giống mockup | Phạm vi lớn; dễ ưu tiên phần thưởng trước chất lượng học |

Đề xuất MVP mobile web responsive, dùng được trên desktop. Lựa chọn nền tảng này là đề xuất, cần chốt trước triển khai; không suy ra native app chỉ từ nhãn “App Mobile”.

## 2. Nguồn và mức chắc chắn

- [Stitch project](https://stitch.withgoogle.com/projects/17316557323109953295): đọc bằng MCP trực tiếp với API key được cung cấp sau khi kết nối MCP tích hợp trả lỗi quyền truy cập.
- 14 tài nguyên: **13 màn hình UI và 1 hình minh họa**. Đã lấy HTML/ảnh và xem ảnh tổng quan. Snapshot tại `docs/research/stitch/screens.json`; tên file HTML/ảnh dùng screen ID.
- `Quy tắc.xlsx`, `Sheet1!A1:C156`: 3 cột Sound / Combination / Example; **155 dòng quy tắc, 30 nhãn âm, 460 mục ví dụ khi tách bằng dấu phẩy**. 460 là số lượt mục ví dụ, không phải số từ duy nhất hay số từ đã kiểm duyệt.
- **Quan sát**: thành phần và nội dung có trong thiết kế hoặc Excel. **Đề xuất**: nghiệp vụ cần thêm để chức năng hoạt động. **Chưa xác nhận**: đối tượng kiểm duyệt, chuẩn giọng, tiêu chí chấm và thông số kinh tế trò chơi.

Mockup không chứng minh backend, AI, thanh toán hay dữ liệu học tập đã tồn tại. Các số 97%, 98%, XP và streak là dữ liệu minh họa.

## 3. Bóc tách UI thành nghiệp vụ

Screen ID bên dưới là tiền tố duy nhất của ID trong snapshot, giúp tra đúng ảnh/HTML.

| Màn hình / ID | UI quan sát | Nghiệp vụ tương ứng | Khoảng trống phải bổ sung |
|---|---|---|---|
| Lộ trình desktop `f5683b8d` | Sidebar, cây bài học, khóa, rương, boss, nhiệm vụ, giải đấu | Chọn bài tiếp theo, quản lý điều kiện mở khóa, tiến độ, phần thưởng | Điều kiện đạt bài, quay lại bài cũ, trạng thái chưa học/đang học/hoàn thành |
| Lộ trình mobile `89387815` | Cây bài học, sổ tay, bài đang học, boss 60s | Cùng nghiệp vụ với desktop, bố cục một cột | Quy tắc đồng bộ tiến độ; CTA tiếp tục bài |
| Quiz 4 chiều `59e012c1` | Từ `steak`, highlight `ea`, chọn âm (mockup đang ghi IPA), nghe mẫu, feedback | Từ + đoạn chữ → chọn âm trong ngữ cảnh; phối hợp nhiều dạng câu hỏi | Quy tắc chuyển chế độ, tổng kết phiên và xử lý sai |
| Âm → chữ `7db7a20b` | Nghe /eɪ/, chọn nhiều nhóm tổ hợp chữ | Truy vấn các cách viết cho âm; kiểm tra tập đáp án | Phạm vi “tất cả” phải giới hạn theo bộ nội dung/bài học |
| Chữ → âm `545feae3` | `ea`, chọn nhiều âm, bảng quy tắc | Nhận diện quan hệ một chữ–nhiều âm | Không lẫn câu hỏi quy tắc tổng quát với câu hỏi có một từ cụ thể |
| Từ vựng desktop `037ba233` | DAUGHTER, ảnh, segment d/augh/t/er, nghĩa, thu âm | Một từ gồm các nhiệm vụ nhận diện chữ–âm, nghĩa, nói | Bước thu âm bị lặp; thứ tự bước 1–3–2–3 phải sửa |
| Từ vựng mobile `03872e3e` | Ba bước, nghe chậm, thu lại, bỏ qua nói | Trình tự 1 nhận diện → 2 nghĩa → 3 nói | Không tiết lộ đáp án trước khi trả lời; hiển thị trạng thái bỏ qua |
| Studio tablet `5e6ce68c` | Bài tập trung tâm, sidebar mẹo, chọn US/UK, biểu đồ | Cùng bài từ vựng, hỗ trợ so sánh giọng và kết quả | MCP ghi device DESKTOP dù tên Tablet; breakpoint cần định nghĩa lại |
| Reading library `ba669144` | Nhóm bài đọc, âm mục tiêu, cấp độ, khóa, hoàn thành | Tìm/chọn bài đọc phù hợp, tiếp tục hoặc đọc lại | Thiếu tìm kiếm/lọc rõ ràng; thẻ ghi 4 từ mục tiêu nhưng chỉ hiện 3 |
| Reading detail `b4a0c731` | Đoạn đọc, daughter, nghĩa, segment, nói, ghép chữ | Luyện từ trong câu; hoàn thành các từ mục tiêu và bài đọc | Resume từng đoạn/từ; nghe câu và nghe từ; đánh giá đọc hiểu riêng |
| Hồ sơ `cd973f78` | Streak, XP, bản đồ âm, thành tích, bạn bè, PRO | Hồ sơ người học, thống kê kỹ năng, cài đặt, lịch sử | Công thức “độ chuẩn”, quản lý bản thu, tài khoản và đăng xuất |
| Đăng nhập `6c4a32a` | Email/tên đăng nhập, mật khẩu, quên mật khẩu, mạng xã hội | Xác thực và khôi phục tài khoản | Sai mật khẩu, khóa tạm, email chưa xác minh, đăng nhập bị hủy |
| Đăng ký `c6aea0b1` | Biệt danh, nhóm người học, email, mật khẩu, quà mới | Tạo tài khoản, onboarding, cấp quà một lần nếu giữ cơ chế này | Trùng email, xác minh, chọn mục tiêu và giọng; không mặc định quà theo mockup |

Hình `79ed7926` là asset minh họa nghĩa từ, không phải nghiệp vụ riêng. Ma trận quy tắc, xếp hạng, cửa hàng xuất hiện ở navigation nhưng **chưa có màn hình độc lập** trong bộ thiết kế. Chế độ âm → nhận diện từ được nhắc tới nhưng chưa có màn riêng.

## 4. Đánh giá UI cho người trưởng thành

Giữ hệ màu xanh lá cho tiến trình/CTA, xanh lam cho âm mục tiêu, thẻ đáp án lớn, ký hiệu phiên âm mới nổi bật, thanh tiến độ và nghe chậm. Desktop có vùng bài tập và vùng giải thích; mobile dùng một nhiệm vụ chính mỗi bước.

Đề xuất điều hướng thống nhất: **Học · Luyện tập · Đọc · Tiến bộ**. Sổ tay quy tắc truy cập từ Học/Luyện tập; hồ sơ và cài đặt từ avatar. Thiết kế hiện dùng 5 tab ở lộ trình, 6 tab ở Reading, và thiếu Reading trên một số màn. Cần thống nhất trước build.

Thứ tự tương tác bài tập: đề bài → trả lời → kiểm tra → phản hồi → tiếp tục. Mockup thường đã hiển thị đáp án đúng, mẹo và kết quả AI cùng lúc; sản phẩm phải tách thành các trạng thái. Mobile nên có thanh hành động cuối màn, tránh phải cuộn qua toàn bộ bước để tiếp tục. Dùng icon kèm chữ, focus rõ, thông báo đúng/sai không phụ thuộc màu, kích thước chữ phiên âm dễ đọc và thao tác bàn phím trên desktop.

Minh họa và mascot có thể giữ ở mức hỗ trợ. Với người trưởng thành, đề xuất ưu tiên mục tiêu giao tiếp, mẹo tiếng Việt ngắn và bằng chứng tiến bộ hơn quà, tim và giải đấu. Cách gọi “bóc tách hình vị” trong Studio cần đổi thành “bóc tách chữ–âm”: các segment hiển thị không mặc nhiên là hình vị mang nghĩa.

## 5. Các nghiệp vụ cốt lõi và tiêu chí chấp nhận

| ID | Nghiệp vụ | Quy tắc đề xuất / tiêu chí chấp nhận |
|---|---|---|
| AUTH-01 | Tạo và đăng nhập tài khoản | Tạo hồ sơ một lần; không tạo trùng khi retry; lỗi trường rõ ràng; khôi phục mật khẩu có màn riêng |
| ONB-01 | Thiết lập mục tiêu | Lưu mục tiêu, thời lượng/ngày, giọng tham chiếu; có thể sửa trong cài đặt; cho phép bỏ qua kiểm tra đầu vào |
| CNT-01 | Nhập và kiểm duyệt nội dung | Mỗi bản ghi giữ sheet/dòng nguồn, trạng thái duyệt, phiên bản; nội dung chưa duyệt không sinh câu hỏi |
| REF-01 | Tra cứu quy tắc | Tra theo âm hoặc tổ hợp chữ, hiện điều kiện, ví dụ, giọng và ngoại lệ; mỗi ví dụ mở được thẻ từ |
| LRN-01 | Học theo lộ trình | Tiếp tục đúng bài đang học; mở khóa theo điều kiện đã cấu hình; đọc lại không cấp phần thưởng hoàn thành lần đầu |
| QZ-01 | Âm → tổ hợp chữ | Đáp án là tập các lựa chọn hợp lệ trong phạm vi câu hỏi; đúng khi chọn đủ và không chọn thừa; feedback giải thích từng lựa chọn |
| QZ-02 | Tổ hợp chữ → âm | Câu hỏi ghi rõ giọng và tập quy tắc; cho phép nhiều đáp án; không mặc định ánh xạ một–một |
| QZ-03 | Từ + đoạn chữ → âm | Từ, nghĩa/từ loại nếu cần và giọng xác định pronunciation; highlight đúng span; chỉ sinh từ dữ liệu đã duyệt |
| QZ-04 | Âm → nhận diện từ | Nghe âm rồi chọn từ chứa âm đích; có pronunciation và span chứng minh đáp án; đây là nghiệp vụ đề xuất từ nhãn chế độ 4 |
| VOC-01 | Bóc tách từ và nghĩa | Lưu kết quả nhận diện chữ–âm, nghĩa và nói riêng; không dùng một đáp án nghĩa để suy ra đã làm chủ phát âm |
| SPK-01 | Thu âm và phản hồi | Nghe mẫu, cấp quyền, bắt đầu/dừng, nghe lại, thu lại; có trạng thái thiếu tiếng, lỗi tải, xử lý và không chấm được |
| SPK-02 | Bỏ qua nói | Hoàn thành bước còn lại, ghi `speaking_skipped`; không tạo điểm nói giả hoặc báo đã hoàn thành ba kỹ năng |
| RD-01 | Đọc và luyện từ trong câu | Bài có đoạn, audio và từ mục tiêu có offset; lưu tiến độ từng từ; quay lại đúng vị trí |
| SPL-01 | Ghép chữ / chính tả | Token có định danh riêng để xử lý chữ lặp; gỡ/xếp lại được; so khớp từ hoàn chỉnh; chưa hiện lời giải trước submit |
| REV-01 | Ôn phần yếu | Đưa câu sai vào hàng ôn theo rule/âm và giọng; lượt ôn mới ảnh hưởng mastery; loại câu lỗi nội dung khỏi tính điểm |
| PRG-01 | Tiến bộ | Tách accuracy quiz, kết quả luyện nói và độ bao phủ; thiếu dữ liệu hiện “chưa đủ dữ liệu”; giữ lịch sử lần thử |
| REP-01 | Báo lỗi nội dung | Gửi rule/question/version và mô tả vào hàng kiểm duyệt; sửa nội dung không âm thầm đổi lịch sử cũ |
| ADM-01 | Xuất bản nội dung | Người biên tập sửa, người kiểm duyệt duyệt; preview đáp án; publish phiên bản mới và có khả năng ngừng dùng câu sai |

Vai trò tối thiểu: người học, biên tập nội dung, kiểm duyệt ngữ âm, quản trị. Công cụ quản trị là đề xuất vận hành cần thiết, chưa có trong Stitch.

## 6. Luồng và trạng thái cần có

**Phiên học:** chọn bài → tạo phiên với phiên bản nội dung cố định → lần lượt trả lời → nhận feedback → tổng kết từng kỹ năng → cập nhật ôn tập/tiến độ → bài tiếp theo.

**Câu hỏi:** chưa trả lời → đang chọn → kiểm tra → đúng/sai → giải thích → tiếp tục. Khi nộp đáp án, khóa thay đổi đến khi chuyển câu. Retry request không được ghi hai lần kết quả hoặc XP. Thoát giữa bài lưu câu hiện tại và các câu đã trả lời; khi quay lại không tự chấm câu đang dở.

**Thu âm:** chưa xin quyền → sẵn sàng → đang ghi → nghe lại → tải lên → đang phân tích → có kết quả / không đủ chất lượng / lỗi. Từ chối quyền mic có hướng dẫn và nút bỏ qua. Mất mạng giữ bản thu tạm trong phiên nếu môi trường cho phép, hiển thị retry; không trừ thành tích vì lỗi dịch vụ. Kết quả chấm đến muộn chỉ gắn với đúng attempt.

**Bài đọc:** chưa học → đang học → hoàn thành phần bắt buộc → đã luyện nói / bỏ qua nói. Thứ tự từ “ngẫu nhiên” nên được chọn theo âm mục tiêu và phần yếu, lưu thứ tự trong phiên để resume ổn định.

**Lộ trình:** khóa → khả dụng → đang học → hoàn thành → cần ôn. Điều kiện mở khóa dựa vào bài tiên quyết và quiz đã hoàn thành; trong MVP việc bỏ qua nói không chặn lộ trình nhưng kỹ năng nói vẫn ghi chưa đánh giá.

## 7. Excel: dữ liệu có thể dùng và vấn đề cần xử lý

Excel là nguồn seed cho **quan hệ chữ–âm và ví dụ**, chưa phải kho nội dung hoàn chỉnh. Chưa có tài liệu định nghĩa đầy đủ hệ phiên âm mới, audio, nghĩa tiếng Việt, giọng, span chữ, cấp độ, trọng âm có cấu trúc, đáp án quiz hoặc bài đọc.

| Bằng chứng nguồn | Ý nghĩa nghiệp vụ |
|---|---|
| A2:A156 dùng `/a/`, `/ai/`, `/ee/`, `/igh/`, `/oo(s)/`, `/oo(l)/`… | Giữ nguyên nhãn nguồn; chỉ tạo `notation_symbol` chính thức sau khi đối chiếu bộ quy ước riêng. Không tự đổi sang IPA hoặc suy giá trị âm khi chưa có định nghĩa/audio được duyệt |
| B7, B26, B33 cùng `ea`, thuộc /e/, /ai/, /ee/ | Mô hình nhiều–nhiều; quiz cần nhiều đáp án hoặc ngữ cảnh từ |
| B3:B5 và B10:B11 có điều kiện số âm tiết/trọng âm/phụ âm đôi | Tách pattern khỏi điều kiện; không bỏ điều kiện khi import |
| A95:C104 gom nhiều ví dụ dưới `/ur/` | Phải kiểm duyệt theo giọng và trọng âm từng từ; không tự tách hoặc gộp nhóm ký hiệu của hệ mới theo cách phân loại IPA; xác nhận quy ước nhóm với chủ sản phẩm |
| C33 có `read`, C68 có `wound`, C27 có `survey (v)/(n)` | Lưu pronunciation theo nghĩa/từ loại/ngữ cảnh; không suy âm chỉ từ spelling |
| C120 có `situation` trong nhóm /k/ với chữ `c` | Bản ghi cần đánh dấu nghi vấn: spelling của từ không chứa `c`; không dùng làm câu đúng trước khi kiểm duyệt |
| C103 có `guitar` trong nhóm `/ur/` với `ar` | Đánh dấu rà soát mapping và giọng; không tự sửa nguồn |
| C105 có `roorback`; C124 có `antique shop` | Kiểm tra từ hiếm/lỗi gõ; phân biệt từ đơn với cụm từ |
| 30 nhãn âm trong 155 dòng | Con số 44 âm IPA trên mockup cần bỏ; độ bao phủ tính theo danh mục hệ phiên âm mới đã xác nhận |

Các ví dụ là danh sách minh họa, không chứng minh quy tắc áp dụng mọi từ. Không sinh phiên âm hay highlight bằng regex chữ đơn thuần. Đặc biệt `ough`, `augh`, `ea`, chữ câm và split digraph `a-e` cần mapping theo từng pronunciation.

Thiết kế nêu /eɪ/ có “8 cách viết”, trong khi Excel có **11 dòng** ở A21:C31. Đây là khác biệt phạm vi, không dùng số trên UI làm sự thật. Tỷ lệ 70%, 75%, 80%, 20%, 5% trong các màn chưa có corpus hoặc cách tính; nên bỏ ở MVP.

Quy trình import đề xuất: giữ bản gốc → gắn ID/dòng nguồn → tách pattern/điều kiện/ví dụ → đánh dấu đa nghĩa/giọng/nghi vấn → bổ sung pronunciation và span → kiểm duyệt → publish. Không chỉnh file Excel nguồn trong lần phân tích này.

### Quy ước hệ phiên âm mới cần đặc tả

Mỗi ký hiệu có ID, cách hiển thị, mô tả âm, audio mẫu và ví dụ. Lưu nguyên bản nhãn nguồn như `/oo(s)/`, `/oo(l)/`; không mặc định đây là ký hiệu chính thức hoặc tự diễn giải hậu tố. Bộ quy ước riêng là nguồn chuẩn để quyết định cách hiển thị. Cần quy ước ghép ký hiệu thành phiên âm một từ, ngắt âm tiết, trọng âm, chữ câm và biến thể giọng. Danh mục có phiên bản để sửa quy ước mà vẫn truy được bài học cũ. UI, đáp án quiz, sổ tay và feedback phải dùng cùng một hệ.

Nếu dịch vụ chấm nói chỉ trả nhãn IPA hoặc một hệ khác, adapter chỉ chuyển sang ID của hệ mới theo bảng tương ứng được duyệt. Không hiển thị IPA cho người học. Nếu chưa ánh xạ được, giữ phản hồi cấp từ hoặc bỏ chi tiết âm, không tạo điểm âm giả.

## 8. Ranh giới chấm phát âm AI

Thiết kế có điểm tổng, điểm âm vị, spectrogram và nhận xét khẩu hình. Đây là yêu cầu sản phẩm tiềm năng, không phải khả năng đã xác minh.

MVP cần thử nghiệm một dịch vụ chấm trên bản thu người Việt, có giọng tham chiếu nhất quán. Tách nhận diện từ đúng khỏi chất lượng phát âm; transcript đúng chưa đủ để kết luận pronunciation đúng. Nếu chỉ có điểm cấp từ, UI chỉ hiện điểm cấp từ. Điểm âm vị chỉ bật khi nhà cung cấp thực sự trả dữ liệu đó và kết quả được kiểm chứng.

Không suy “tròn môi/cuống lưỡi chuẩn tuyệt đối” từ audio hoặc minh họa sóng. Không hiển thị biểu đồ F1–F2 giả. Khi độ tin cậy thấp, yêu cầu thu lại và nêu lý do như âm lượng nhỏ/nhiễu. Điểm 0 do lỗi dịch vụ không được tính vào tiến bộ.

Trước pilot cần thống nhất lưu bản thu bao lâu, quyền nghe/xóa, nhà cung cấp xử lý, chi phí mỗi lượt và giới hạn retry. Đây là quyết định vận hành gắn trực tiếp với tính năng ghi âm.

## 9. Mô hình dữ liệu tối thiểu

| Thực thể | Dữ liệu và quan hệ quan trọng |
|---|---|
| Learner / Preferences | Mục tiêu, thời lượng, giọng tham chiếu, múi giờ |
| Sound | ID âm, ký hiệu hệ phiên âm mới, phiên bản hệ ký hiệu, định nghĩa và audio mẫu, giọng; hiện có 30 nhãn nguồn, chưa xác nhận danh mục đầy đủ |
| SpellingPattern / Rule | Pattern, điều kiện, sound, ghi chú, dòng nguồn, trạng thái/phiên bản |
| Word / WordSense | Spelling, từ loại, nghĩa tiếng Việt, câu ví dụ |
| Pronunciation / Segment | WordSense + giọng + chuỗi ký hiệu hệ mới đã duyệt + audio; span ký tự và chuỗi âm; hỗ trợ đoạn không liền nhau/chữ câm |
| Lesson / Question | Mục tiêu, tiên quyết, phiên bản; dạng câu hỏi, lựa chọn và tập đáp án chuẩn |
| Session / Attempt | Learner, phiên bản nội dung, đáp án, thời gian, trạng thái bỏ qua, kết quả từng kỹ năng |
| Recording / Assessment | Attempt, audio, giọng/model/version, điểm, confidence, lỗi, trạng thái xử lý |
| Reading / TargetOccurrence | Đoạn đọc, audio, offset từ trong câu, WordSense/Pronunciation và rule mục tiêu |
| SkillProgress / ReviewItem | Theo learner + rule/sound + giọng; bằng chứng từ attempt, lịch ôn |
| RewardLedger | Nếu có XP/quà: sự kiện duy nhất, loại nguồn và số lượng; chống cấp trùng |
| ContentReport | Question/rule/version, lý do, trạng thái kiểm duyệt |

Nội dung thay đổi tạo phiên bản mới. Attempt cũ giữ phiên bản từng học. Một người học có thể biết nghĩa nhưng phát âm yếu, nên không gộp ba kỹ năng vào một cờ “đã làm chủ”.

## 10. Phạm vi MVP và thứ tự thực hiện

**P0 — để pilot:** chuẩn hóa một tập nhỏ quy tắc có nội dung đã duyệt; đăng nhập; mục tiêu/giọng; sổ tay; lộ trình; quiz chữ–âm có ngữ cảnh; thẻ từ với audio; thu âm/nghe lại và thử nghiệm chấm cấp từ; ôn câu sai; tiến bộ cơ bản; công cụ kiểm duyệt tối thiểu. Chọn 5–8 nhóm âm, 50–100 từ làm mục tiêu kế hoạch ban đầu, không coi đó là số nội dung sẵn có.

**P1 — sau khi vòng học được kiểm chứng:** đủ bốn dạng phản xạ; reading library/detail; ghép chữ; lịch ôn theo thời gian; phản hồi âm vị nếu kiểm chứng được; streak và nhiệm vụ đơn giản.

**P2:** giải đấu, bạn bè, tặng quà, shop, gem, heart, PRO/thanh toán, freeze và biểu đồ ngữ âm chuyên sâu. Những nhãn này có trong mockup nhưng nghiệp vụ giá, reset tuần, thăng hạng, mua/hoàn tiền chưa được thiết kế.

Nếu cần XP trong pilot, dùng cấu hình thử nghiệm rõ ràng và chỉ cấp một lần cho hoàn thành hợp lệ. Không chặn học bằng tim ở MVP. Tỷ lệ đúng làm điều kiện mở khóa cần chốt sau pilot; không hardcode +10/+15/+20/+25 XP từ các màn khác nhau.

Thứ tự: **duyệt dữ liệu → dựng một vòng học hoàn chỉnh → kiểm chứng chấm nói → đo tiến bộ/ôn lỗi → mở rộng bài đọc → gamification**.

## 11. Đo thành công và kiểm chứng

- Activation: tỷ lệ người đăng ký hoàn thành phiên đầu; ghi rõ mẫu số và cửa sổ đo.
- Học tập: accuracy trên bài kiểm tra trước/sau gồm cả từ chưa luyện; phân tách theo âm và giọng.
- Nói: người đánh giá độc lập kiểm tra một tập bản thu trước/sau, đối chiếu kết quả AI; không dùng điểm AI tự tăng làm bằng chứng duy nhất.
- Thói quen: quay lại sau 7 ngày, số phiên có hoạt động học thực, tỷ lệ hoàn thành ôn.
- Vận hành: tỷ lệ chấm thất bại, latency, chi phí trên phiên học và tỷ lệ nội dung bị báo sai.

Tình huống cần kiểm chứng trước release: đáp án `ea` nhiều âm; từ nhiều nghĩa; UK/US; segment chữ câm/split digraph; retry không nhân XP; resume đúng câu; skip mic không có điểm giả; kết quả AI đến muộn; sửa nội dung không làm đổi attempt cũ; bài đọc thiếu từ mục tiêu phải bị chặn publish.

## 12. Quyết định cần chốt trước triển khai

1. Giọng tham chiếu MVP: UK hay US. Thiết kế đang trộn cả hai; dữ liệu Excel chưa gắn giọng.
2. Mức ưu tiên trung tâm: sửa phát âm khi nói hay học quy tắc chữ–âm. Đề xuất kết hợp, nhưng tiến bộ nói là kết quả cuối.
3. Ai kiểm duyệt hệ phiên âm mới, nghĩa và mapping chữ–âm; tập nội dung nào được chọn làm pilot.
4. Nền tảng đầu tiên: mobile web responsive được đề xuất; native app cần phạm vi riêng.
5. Nhà cung cấp và tiêu chí chấp nhận chấm phát âm, thời gian lưu bản thu, ngân sách lượt chấm.

Sau khi các quyết định này được xác nhận, có thể chuyển tài liệu thành PRD chi tiết, backlog triển khai và acceptance criteria theo từng màn. Chưa triển khai ứng dụng trong giai đoạn phân tích này.
