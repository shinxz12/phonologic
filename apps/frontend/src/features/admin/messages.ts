export const adminEn: Record<string, string> = {
  // Header & Common
  'Quản trị nội dung & Ngữ âm': 'Content Management & Phonology',
  'Biên tập quy tắc chữ–âm đối chiếu Excel (Quy tắc.xlsx), chuẩn hóa hệ ký hiệu phiên âm riêng (Custom Notation), biên soạn bài học và xuất bản snapshot học tập bất biến.':
    'Edit spelling–sound rules mapped from Excel (Quy tắc.xlsx), standardize custom notation, author lessons, and publish immutable learning snapshots.',
  'Snapshot v{{version}}': 'Snapshot v{{version}}',
  'Bản nháp có chỉnh sửa chưa lưu': 'Draft has unsaved changes',
  'Hủy thay đổi': 'Discard changes',
  'Lưu bản nháp (PUT)': 'Save draft (PUT)',
  'Xuất bản phiên bản mới': 'Publish new version',
  'Đã khôi phục dữ liệu từ bản nháp máy chủ.': 'Restored data from server draft.',
  'Đang tải dữ liệu quản trị nội dung & ngữ âm...': 'Loading content & phonology admin data...',
  'Lỗi truy cập bảng quản trị': 'Admin dashboard access error',
  'Thử tải lại': 'Try reload',
  'Đã lưu bản nháp thành công lên máy chủ (PUT /learning/admin/draft).':
    'Draft saved successfully to server (PUT /learning/admin/draft).',
  'Xuất bản thành công phiên bản v{{version}}! Học viên đã được đồng bộ snapshot mới.':
    'Successfully published version v{{version}}! Learners have been synchronized with the new snapshot.',
  'Đã đánh dấu giải quyết báo cáo thành công.': 'Marked report as resolved successfully.',
  'Lỗi khi lưu bản nháp lên máy chủ': 'Error saving draft to server',
  'Lỗi khi giải quyết báo cáo': 'Error resolving report',
  'Lỗi không xác định khi xuất bản': 'Unknown error publishing content',

  // Navigation Tabs
  'Quy tắc nguồn Excel': 'Excel Source Rules',
  'Gói nội dung JSON': 'JSON Content Bundle',
  'Xuất bản & Snapshot': 'Publish & Snapshot',
  'Báo cáo nội dung': 'Content Reports',

  // Rules Tab
  'Dữ liệu nguồn Excel (Quy tắc.xlsx) & Ký hiệu phiên âm chính thức':
    'Excel Source Data (Quy tắc.xlsx) & Official Phonetic Notation',
  'Cột Sound nguồn (/a/, /ee/, /igh/, /oo(s)/...) và số dòng hiển thị bên dưới là dữ liệu đối chiếu từ file Excel gốc, chưa phải ký hiệu chính thức. Biên tập viên cần rà soát và gán Ký hiệu chính thức (Custom Notation) theo quy ước riêng của chủ sản phẩm (tuyệt đối không sử dụng IPA cho người học) trước khi xuất bản.':
    'The Sound source column (/a/, /ee/, /igh/, /oo(s)/...) and row numbers below are reference data from the original Excel file, NOT official notations. Editors must review and assign Official Custom Notation according to the product owner conventions (strictly no IPA for learners) before publishing.',
  'Tổng số quy tắc': 'Total rules',
  'Từ Sheet1!A1:C156': 'From Sheet1!A1:C156',
  'Đã duyệt (Approved)': 'Approved',
  'Sẵn sàng xuất bản': 'Ready to publish',
  'Bản nháp (Draft)': 'Draft',
  'Cần rà soát': 'Needs review',
  'Đã có ký hiệu': 'Has notation',
  'Đã đủ 100%': '100% complete',
  'Còn thiếu {{count}} ký hiệu': '{{count}} notation(s) missing',
  'Tìm kiếm quy tắc': 'Search rules',
  'Tìm theo tổ hợp chữ (ea, ai...), ví dụ (steak...), dòng Excel, nhãn nguồn, ký hiệu...':
    'Search by letter pattern (ea, ai...), example (steak...), Excel row, source label, notation...',
  'Trạng thái:': 'Status:',
  'Tất cả ({{count}})': 'All ({{count}})',
  'Đã duyệt ({{count}})': 'Approved ({{count}})',
  'Bản nháp ({{count}})': 'Draft ({{count}})',
  'Ký hiệu:': 'Notation:',
  'Tất cả': 'All',
  'Đã gán ({{count}})': 'Assigned ({{count}})',
  'Chưa gán ({{count}})': 'Unassigned ({{count}})',
  'Có thay đổi chưa lưu': 'Unsaved changes',
  'Lưu bản nháp': 'Save draft',
  'Hiển thị {{count}} / {{total}} quy tắc phù hợp': 'Showing {{count}} / {{total}} matching rules',
  'Trước': 'Previous',
  'Sau': 'Next',
  'Trang {{current}} / {{total}}': 'Page {{current}} / {{total}}',
  'Trang {{current}} / {{total}} (Tổng số {{count}} quy tắc)':
    'Page {{current}} / {{total}} (Total {{count}} rules)',
  'Không tìm thấy quy tắc nào': 'No rules found',
  'Thử thay đổi từ khóa tìm kiếm hoặc bấm "Tất cả" ở bộ lọc trạng thái và ký hiệu.':
    'Try changing your search query or reset status and notation filters to "All".',
  'Dòng Excel #{{row}}': 'Excel Row #{{row}}',
  'Nguồn Excel:': 'Excel Source:',
  'Đã duyệt': 'Approved',
  'Bản nháp': 'Draft',
  'Ký hiệu chính thức:': 'Official Notation:',
  'Chưa gán ký hiệu': 'No notation assigned',
  'Về nháp': 'To Draft',
  'Duyệt': 'Approve',
  'Sửa': 'Edit',
  'Tổ hợp chữ (Combination / Pattern):': 'Combination / Pattern:',
  'Ví dụ ({{count}}):': 'Examples ({{count}}):',
  'Điều kiện ngữ cảnh:': 'Context Condition:',
  'Ghi chú kiểm duyệt:': 'Review Note:',
  'Ký hiệu chính thức (Custom Notation)': 'Official Custom Notation',
  'Quy ước riêng của sản phẩm (không dùng IPA). Bỏ trống nếu chưa chốt.':
    'Product-specific convention (no IPA). Leave empty if unconfirmed.',
  'Trạng thái kiểm duyệt': 'Review Status',
  'Điều kiện ngữ cảnh (Bảo lưu dữ liệu gốc, chỉnh sửa nếu cần)':
    'Context condition (preserves original, edit if needed)',
  'Ghi chú rà soát / kiểm duyệt': 'Review / Audit note',
  'Hủy': 'Cancel',
  'Cập nhật quy tắc': 'Update rule',
  'Trang trước': 'Previous page',
  'Trang sau': 'Next page',

  // Bundle Tab
  'Biên soạn gói nội dung có cấu trúc (Content Bundle JSON)':
    'Structured Content Bundle Authoring (JSON)',
  'Chỉnh sửa trực tiếp toàn bộ gói nội dung gồm quy tắc âm, bài học (lessons/questions) và bài đọc (readings/targets).':
    'Directly edit the entire content bundle including sound rules, lessons/questions, and readings/targets.',
  'Xem hướng dẫn & Schema': 'View Guide & Schema',
  'Đóng hướng dẫn Schema': 'Close Schema Guide',
  'Tài liệu đặc tả Schema & Quy ước Ký hiệu phiên âm':
    'Schema Specification & Phonetic Notation Conventions',
  '1. Hệ phiên âm riêng': '1. Custom Notation',
  '2. Cấu trúc Schema': '2. Schema Structure',
  '3. Mẫu định dạng tham khảo': '3. Reference Template',
  'Nguyên tắc cốt lõi: Không hiển thị IPA cho người học':
    'Core Principle: No IPA Displayed to Learners',
  'PhonoLogic phục vụ người Việt trưởng thành cải thiện phát âm tiếng Anh thông qua việc hiểu mối liên hệ giữa chữ và âm. Sản phẩm sử dụng hệ phiên âm riêng của chủ sản phẩm, tuyệt đối không dùng IPA cho người học.':
    'PhonoLogic helps adult Vietnamese learners improve English pronunciation through understanding letter–sound relationships. The product uses the owner custom notation system and strictly avoids IPA for learners.',
  'Dữ liệu nguồn Excel (Draft):': 'Excel Source Data (Draft):',
  'Cột Sound trong Quy tắc.xlsx (ví dụ /a/, /ee/, /igh/, /oo(s)/...) chỉ là nhãn nguồn của tài liệu phác thảo. Cần giữ nguyên sourceLabel và sourceRow để đối chiếu, nhưng phải gán notation chính thức cho từng quy tắc.':
    'The Sound column in Quy tắc.xlsx (e.g. /a/, /ee/, /igh/, /oo(s)/...) is draft source labeling. Retain sourceLabel and sourceRow for reference, but assign official notation for each rule.',
  'Ký hiệu chính thức (Custom Notation):': 'Official Notation (Custom):',
  'Ký hiệu chính thức được gán vào trường notation của SourceRule, trường notation trong câu hỏi và trường notation trong bóc tách segments. Khi xuất bản, cờ notationConfirmed: true phải được bật.':
    'Official notation is assigned to SourceRule.notation, question.notation, and word segment notation. On publication, the notationConfirmed: true flag is required.',
  'Một gói nội dung (ContentBundle) bao gồm 5 trường gốc bắt buộc:':
    'A content bundle (ContentBundle) contains 5 mandatory root fields:',
  'Danh sách quy tắc chữ–âm đối chiếu từ Excel:':
    'List of spelling–sound rules mapped from Excel:',
  '(string): ID duy nhất (ví dụ "rule-ea-ey")': '(string): Unique ID (e.g. "rule-ea-ey")',
  '(number): Dòng Excel Sheet1': '(number): Excel Sheet1 row',
  '(string): Nhãn nguồn (ví dụ "/ee/")': '(string): Source label (e.g. "/ee/")',
  '(string): Tổ hợp chữ (ví dụ "ea")': '(string): Letter pattern (e.g. "ea")',
  '(string[]): Danh sách ví dụ': '(string[]): Examples list',
  '(optional string): Điều kiện ngữ cảnh': '(optional string): Context condition',
  '(string | null): Ký hiệu phiên âm chính thức': '(string | null): Official phonetic notation',
  "('draft' | 'approved'): Trạng thái duyệt": "('draft' | 'approved'): Review status",
  'Các bài học theo lộ trình:': 'Learning path lessons:',
  '(chuỗi ký tự)': '(string)',
  '(string | null): Bài học tiên quyết': '(string | null): Prerequisite lesson ID',
  '(word_sound, sound_spelling, v.v.)': '(word_sound, sound_spelling, etc.)',
  '(tập đáp án chuẩn xác)': '(exact correct answer set)',
  'Bài đọc trong thư viện Reading:': 'Reading library content:',
  '(thông tin bài đọc)': '(reading metadata & text)',
  '(vị trí offset chính xác trong chuỗi text)': '(exact character offset in text string)',
  'LƯU Ý: Đây là mẫu hướng dẫn cấu trúc để biên tập viên tham khảo hình dạng. Không xuất bản nội dung mẫu giả lập vào cơ sở dữ liệu thật.':
    'NOTE: This is a structural reference guide for editors. Do NOT publish mock or fabricated content into live production data.',
  'Quy tắc (Rules)': 'Rules',
  'Bài học (Lessons)': 'Lessons',
  'Câu hỏi (Questions)': 'Questions',
  'Bài đọc (Readings)': 'Readings',
  'Từ mục tiêu': 'Target Words',
  'Xác nhận ký hiệu': 'Notation Confirmed',
  'Đã xác nhận': 'Confirmed',
  'Chưa xác nhận': 'Unconfirmed',
  'Lỗi cú pháp JSON': 'JSON Syntax Error',
  'Phát hiện {{count}} vấn đề cấu trúc không hợp lệ:':
    'Detected {{count}} invalid structural issue(s):',
  'Cú pháp JSON và cấu trúc ContentBundle hoàn toàn hợp lệ!':
    'JSON syntax and ContentBundle structure are completely valid!',
  'Đã áp dụng thay đổi vào bản nháp cục bộ thành công.':
    'Applied changes to local draft successfully.',
  'Trình biên tập JSON trực tiếp': 'Direct JSON Editor',
  'Tải lại từ bản nháp': 'Reload from draft',
  'Định dạng (Prettify)': 'Prettify JSON',
  'Kiểm tra cú pháp': 'Validate Syntax',
  'Áp dụng vào nháp': 'Apply to draft',
  'Dán hoặc chỉnh sửa gói nội dung ContentBundle tại đây...':
    'Paste or edit ContentBundle JSON here...',
  'Hỗ trợ đầy đủ định dạng UTF-8 tiếng Việt, escape ký tự JSON tiêu chuẩn.':
    'Full UTF-8 Vietnamese support, standard JSON character escaping.',
  'Dung lượng ký tự: {{count}} ký tự': 'Character count: {{count}} characters',

  // Publish Tab
  'Snapshot Version Hiện Tại': 'Current Snapshot Version',
  'Chưa từng xuất bản': 'Never published',
  'Bản phát hành v{{version}}': 'Release v{{version}}',
  'Phiên bản v{{version}}': 'Version v{{version}}',
  'v0 (Chưa có bản snapshot)': 'v0 (No snapshot yet)',
  'Khi xuất bản, hệ thống sẽ tạo một bản chụp nội dung bất biến (Immutable Snapshot v{{nextVersion}}). Các phiên học đang chạy sẽ tiếp tục phiên bản cũ; người học bắt đầu phiên mới sẽ dùng snapshot mới này.':
    'When published, the system creates an Immutable Snapshot v{{nextVersion}}. Ongoing learning sessions retain their existing snapshot; new sessions use this new release.',
  'Phiên bản tiếp theo dự kiến': 'Target Next Version',
  'Xuất bản phiên bản v{{version}} thành công!': 'Successfully published version v{{version}}!',
  'Toàn bộ quy tắc đã duyệt, bài học và bài đọc đã được ghi nhận vào snapshot v{{version}}. Hệ thống học tập của học viên đã được đồng bộ với phiên bản mới nhất.':
    'All approved rules, lessons, and readings have been captured into snapshot v{{version}}. Learner systems are synchronized with the latest release.',
  'Kiểm tra điều kiện xuất bản gói nội dung': 'Pre-publish Checklist & Validation',
  'Quy tắc chữ–âm (Rules)': 'Spelling–sound rules (Rules)',
  'Đã duyệt (Approved):': 'Approved:',
  'Bản nháp (Draft):': 'Draft:',
  'Chưa có ký hiệu chính thức:': 'Missing official notation:',
  'Bài học theo lộ trình': 'Curriculum lessons',
  'Tổng số câu hỏi:': 'Total questions:',
  'Dạng bài trắc nghiệm / âm vị:': 'Quiz / Phonetic question kinds:',
  'Kiểm tra khi xuất bản': 'Validated upon publishing',
  'Bài đọc thư viện (Reading)': 'Reading library content',
  'Từ mục tiêu (Targets):': 'Target words (Targets):',
  'Offset văn bản:': 'Text offsets:',
  'Cảnh báo quy tắc chưa có ký hiệu chính thức:':
    'Warning: Rules without official notation:',
  'Hiện có {{count}} quy tắc chưa được gán ký hiệu chính thức (Custom Notation). Khi người học truy cập sổ tay quy tắc, chỉ các quy tắc đã được duyệt và có ký hiệu mới được phục vụ.':
    'Currently {{count}} rule(s) do not have official custom notation assigned. Only approved rules with official notation are served to learners in the rulebook.',
  'Máy chủ phát hiện lỗi kiểm duyệt (Validated Server Issues)':
    'Server Validation Issues (Validated Server Issues)',
  'Chi tiết lỗi theo từng trường dữ liệu:': 'Error details by field path:',
  'Thông tin xuất bản phiên bản mới (POST /learning/admin/publish)':
    'Publish New Version Details (POST /learning/admin/publish)',
  'Phiên bản hệ ký hiệu (Notation Version)': 'Notation Version',
  'Định danh phiên bản quy ước ngữ âm dùng cho lần phát hành này.':
    'Identifier for the phonetic notation convention used for this release.',
  'Cơ chế phát hành an toàn:': 'Safe Release Guarantee:',
  'Mỗi lần xuất bản tạo một bản ghi độc lập. Học viên đang làm bài tập dở dang không bị ngắt quãng phiên học.':
    'Each release creates an independent immutable snapshot. Active student sessions are not disrupted.',
  'Xác nhận chính thức hệ thống ký hiệu (Notation Confirmation)':
    'Official Notation Confirmation (Notation Confirmation)',
  'Tôi xác nhận rằng toàn bộ hệ thống ký hiệu phiên âm (Custom Notation) trong gói nội dung này đã được rà soát và đối chiếu đúng quy ước riêng của chủ sản phẩm. Tuyệt đối không sử dụng ký hiệu IPA đối với người học. Các nhãn cột Sound trong Excel chỉ đóng vai trò dữ liệu nguồn tham chiếu.':
    'I confirm that all phonetic notations (Custom Notation) in this bundle have been reviewed and verified according to the product owner official conventions. IPA is strictly forbidden for learners. Excel Sound column labels serve only as draft source references.',
  'Vui lòng tích chọn xác nhận hệ thống ký hiệu trước khi xuất bản.':
    'Please check the notation confirmation box before publishing.',
  'Đang xuất bản...': 'Publishing...',
  'Xuất bản phiên bản v{{version}}': 'Publish version v{{version}}',

  // Reports Tab
  'Báo cáo nội dung từ người học (Content Reports)':
    'Learner Content Reports (Content Reports)',
  'Xử lý phản hồi từ người học khi gặp câu hỏi hoặc quy tắc có vấn đề về chữ–âm, giải thích hoặc hiển thị.':
    'Review learner feedback on spelling–sound questions or rules regarding accuracy, explanation, or display.',
  'Tổng số báo cáo': 'Total reports',
  '{{count}} báo cáo chưa xử lý': '{{count}} open report(s)',
  'Đã xử lý toàn bộ': 'All reports resolved',
  'Từ người học gửi qua POST /learning/reports':
    'Submitted by learners via POST /learning/reports',
  'Chưa xử lý (Open)': 'Open',
  'Cần kiểm duyệt viên rà soát': 'Needs editor review',
  'Đã giải quyết (Resolved)': 'Resolved',
  'Đã giải quyết': 'Resolved',
  'Đã kiểm tra và đóng': 'Verified and closed',
  'Tìm theo mô tả, questionId, ruleId, userId...':
    'Search by description, questionId, ruleId, userId...',
  'Chưa xử lý ({{count}})': 'Open ({{count}})',
  'Đã giải quyết ({{count}})': 'Resolved ({{count}})',
  'Không có báo cáo nào': 'No reports found',
  'Hiện tại không có báo cáo nào phù hợp với bộ lọc được chọn.':
    'No reports currently match the selected filter.',
  'Đánh dấu đã giải quyết': 'Mark as resolved',
  'Đã đóng báo cáo': 'Report closed',
  'Nội dung người học phản ánh:': 'Learner feedback description:',
  'Người gửi:': 'Sender:',
  'Thời gian:': 'Date:',

  // Local JSON & Schema Validation
  'Lỗi cú pháp JSON: {{detail}}': 'JSON syntax error: {{detail}}',
  'Không thể định dạng JSON: {{detail}}': 'Cannot prettify JSON: {{detail}}',
  'Không thể định dạng: {{detail}}': 'Cannot prettify: {{detail}}',
  'Cú pháp JSON không hợp lệ: {{detail}}': 'Invalid JSON syntax: {{detail}}',
  'Lỗi cú pháp không xác định': 'Unknown syntax error',
  'Gói nội dung phải là một JSON Object ở cấp gốc.':
    'Content bundle must be a root JSON object.',
  'Thiếu notationVersion (chuỗi phiên bản ký hiệu, ví dụ "2026.10-v1").':
    'Missing notationVersion (notation version string, e.g. "2026.10-v1").',
  'Thiếu notationConfirmed (boolean: true hoặc false).':
    'Missing notationConfirmed (boolean: true or false).',
  'Trường "rules" phải là một mảng SourceRule.':
    'Field "rules" must be an array of SourceRule.',
  'rules[{{index}}]: Quy tắc phải là một object.':
    'rules[{{index}}]: Rule must be an object.',
  'rules[{{index}}]: Thiếu trường "id".':
    'rules[{{index}}]: Missing "id" field.',
  'rules[{{index}}]: "sourceRow" phải là số dòng.':
    'rules[{{index}}]: "sourceRow" must be a row number.',
  'rules[{{index}}]: Thiếu "sourceLabel" (nhãn nguồn Excel).':
    'rules[{{index}}]: Missing "sourceLabel" (Excel source label).',
  'rules[{{index}}]: Thiếu "pattern" (tổ hợp chữ).':
    'rules[{{index}}]: Missing "pattern" (letter pattern).',
  'rules[{{index}}]: "examples" phải là mảng từ ví dụ.':
    'rules[{{index}}]: "examples" must be an array of example words.',
  'rules[{{index}}]: "status" phải là "draft" hoặc "approved".':
    'rules[{{index}}]: "status" must be "draft" or "approved".',
  'Trường "lessons" phải là một mảng LessonContent.':
    'Field "lessons" must be an array of LessonContent.',
  'lessons[{{index}}]: Bài học phải là một object.':
    'lessons[{{index}}]: Lesson must be an object.',
  'lessons[{{index}}]: Thiếu trường "id".':
    'lessons[{{index}}]: Missing "id" field.',
  'lessons[{{index}}]: Thiếu trường "title".':
    'lessons[{{index}}]: Missing "title" field.',
  'lessons[{{index}}]: "accent" phải là "US" hoặc "UK".':
    'lessons[{{index}}]: "accent" must be "US" or "UK".',
  'lessons[{{index}}]: "questions" phải là một mảng.':
    'lessons[{{index}}]: "questions" must be an array.',
  'lessons[{{index}}].questions[{{qIndex}}]: Câu hỏi phải là một object.':
    'lessons[{{index}}].questions[{{qIndex}}]: Question must be an object.',
  'lessons[{{index}}].questions[{{qIndex}}]: Thiếu "id".':
    'lessons[{{index}}].questions[{{qIndex}}]: Missing "id".',
  'lessons[{{index}}].questions[{{qIndex}}]: Thiếu "prompt".':
    'lessons[{{index}}].questions[{{qIndex}}]: Missing "prompt".',
  'lessons[{{index}}].questions[{{qIndex}}]: Thiếu "kind".':
    'lessons[{{index}}].questions[{{qIndex}}]: Missing "kind".',
  'lessons[{{index}}].questions[{{qIndex}}]: "choices" phải có ít nhất 1 lựa chọn.':
    'lessons[{{index}}].questions[{{qIndex}}]: "choices" must have at least 1 option.',
  'lessons[{{index}}].questions[{{qIndex}}]: "correctIds" phải có ít nhất 1 đáp án đúng.':
    'lessons[{{index}}].questions[{{qIndex}}]: "correctIds" must have at least 1 correct answer.',
  'Trường "readings" phải là một mảng ReadingContent.':
    'Field "readings" must be an array of ReadingContent.',
  'readings[{{index}}]: Bài đọc phải là một object.':
    'readings[{{index}}]: Reading must be an object.',
  'readings[{{index}}]: Thiếu trường "id".':
    'readings[{{index}}]: Missing "id" field.',
  'readings[{{index}}]: Thiếu trường "title".':
    'readings[{{index}}]: Missing "title" field.',
  'readings[{{index}}]: Thiếu trường "text".':
    'readings[{{index}}]: Missing "text" field.',
  'readings[{{index}}]: "targets" phải là một mảng.':
    'readings[{{index}}]: "targets" must be an array.',
  'readings[{{index}}].targets[{{tIndex}}]: Mục tiêu phải là một object.':
    'readings[{{index}}].targets[{{tIndex}}]: Target must be an object.',
  'readings[{{index}}].targets[{{tIndex}}]: Thiếu "id".':
    'readings[{{index}}].targets[{{tIndex}}]: Missing "id".',
  'readings[{{index}}].targets[{{tIndex}}]: Thiếu "word".':
    'readings[{{index}}].targets[{{tIndex}}]: Missing "word".',
  'readings[{{index}}].targets[{{tIndex}}]: "start" và "end" phải là vị trí số (offset).':
    'readings[{{index}}].targets[{{tIndex}}]: "start" and "end" must be numeric offsets.',
  'Lọc theo trạng thái': 'Filter by status',
  'Lọc theo ký hiệu': 'Filter by notation',
  'Lọc báo cáo': 'Filter reports',
  'Tài liệu hướng dẫn': 'Documentation guide',
  'Ví dụ: ey, iy, ow...': 'E.g.: ey, iy, ow...',
  'Ví dụ: 2 âm tiết, trọng âm rơi vào âm tiết đầu...': 'E.g.: 2 syllables, stress on first syllable...',
  'Ví dụ: Cần kiểm tra dialect US/UK, từ hiếm, từ ngoại lệ...': 'E.g.: Check US/UK dialect, rare words, exceptions...',
  'Ví dụ: 2026.10-v1 hoặc 1.0.0': 'E.g.: 2026.10-v1 or 1.0.0',
};
