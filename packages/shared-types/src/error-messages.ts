import type { ErrorCode, ErrorParams } from './errors';

export const ERROR_MESSAGES_VI: Record<ErrorCode, string> = {
  // Auth
  AUTH_INVALID_CREDENTIALS: 'Email hoặc mật khẩu không chính xác',
  AUTH_ACCESS_TOKEN_MISSING: 'Thiếu mã truy cập (Access Token)',
  AUTH_ACCESS_TOKEN_INVALID: 'Mã truy cập không hợp lệ hoặc đã hết hạn',
  AUTH_REFRESH_TOKEN_INVALID: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ',
  AUTH_SESSION_EXPIRED: 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại',
  AUTH_ACCOUNT_INACTIVE: 'Tài khoản của bạn đã bị vô hiệu hóa hoặc tạm khóa',
  AUTH_CURRENT_PASSWORD_WRONG: 'Mật khẩu hiện tại không đúng',

  // RBAC
  PERMISSION_DENIED: 'Bạn không có quyền thực hiện hành động này',
  ROLE_NOT_FOUND: 'Không tìm thấy vai trò này trong hệ thống',
  ROLE_EXISTS: 'Vai trò với mã này đã tồn tại',
  ROLE_SYSTEM_IMMUTABLE: 'Không thể chỉnh sửa hoặc xóa vai trò hệ thống mặc định',
  ROLE_CANNOT_REVOKE_OWN_ADMIN: 'Bạn không thể tự gỡ quyền Quản trị viên của chính mình',

  // Users
  USER_NOT_FOUND: 'Không tìm thấy người dùng',
  USER_EXISTS: 'Tài khoản với email này đã tồn tại',

  // Domain
  COURSE_NOT_FOUND: 'Không tìm thấy khóa học',
  LESSON_NOT_FOUND: 'Không tìm thấy bài học',
  VOCABULARY_NOT_FOUND: 'Không tìm thấy từ vựng',

  // Generic
  VALIDATION_ERROR: 'Dữ liệu yêu cầu không hợp lệ',
  NOT_FOUND: 'Không tìm thấy tài nguyên yêu cầu',
  INTERNAL_SERVER_ERROR: 'Đã xảy ra lỗi máy chủ nội bộ. Vui lòng thử lại sau',
};

export const ERROR_MESSAGES_EN: Record<ErrorCode, string> = {
  // Auth
  AUTH_INVALID_CREDENTIALS: 'Incorrect email or password',
  AUTH_ACCESS_TOKEN_MISSING: 'Access token is missing',
  AUTH_ACCESS_TOKEN_INVALID: 'Access token is invalid or expired',
  AUTH_REFRESH_TOKEN_INVALID: 'Your sign-in session is invalid or expired',
  AUTH_SESSION_EXPIRED: 'Your session has expired. Sign in again.',
  AUTH_ACCOUNT_INACTIVE: 'Your account has been suspended or deactivated',
  AUTH_CURRENT_PASSWORD_WRONG: 'Incorrect current password',

  // RBAC
  PERMISSION_DENIED: 'You do not have permission to perform this action',
  ROLE_NOT_FOUND: 'Role not found',
  ROLE_EXISTS: 'A role with this key already exists',
  ROLE_SYSTEM_IMMUTABLE: 'System roles cannot be edited or deleted',
  ROLE_CANNOT_REVOKE_OWN_ADMIN: 'You cannot remove your own administrator role',

  // Users
  USER_NOT_FOUND: 'User not found',
  USER_EXISTS: 'An account with this email already exists',

  // Domain
  COURSE_NOT_FOUND: 'Course not found',
  LESSON_NOT_FOUND: 'Lesson not found',
  VOCABULARY_NOT_FOUND: 'Word not found',

  // Generic
  VALIDATION_ERROR: 'Invalid request data',
  NOT_FOUND: 'Requested resource not found',
  INTERNAL_SERVER_ERROR: 'A server error occurred. Try again later.',
};

export const ERROR_MESSAGES = ERROR_MESSAGES_VI;

export const BACKEND_MESSAGES_EN: Record<string, string> = {
  'Múi giờ không hợp lệ': 'Invalid time zone',
  'Chưa có nội dung bài học được xuất bản': 'No lesson content has been published yet',
  'Không tìm thấy bài học': 'Lesson not found',
  'Bạn cần hoàn thành bài học tiên quyết trước': 'Complete the prerequisite lesson first',
  'Không có nội dung bài học nào': 'No lesson content is available',
  'Không có câu hỏi nào cần ôn tập': 'No questions need review',
  'Không tìm thấy phiên học': 'Learning session not found',
  'Phiên học đã hoàn thành': 'The session is already complete',
  'Đã hết câu hỏi trong phiên': 'There are no remaining questions',
  'Chỉ được trả lời câu hỏi hiện tại': 'Only the current question can be answered',
  'Phiên bản bài đọc không tồn tại': 'Reading version not found',
  'Chưa có nội dung bài đọc': 'No reading content has been published',
  'Không tìm thấy bài đọc': 'Reading not found',
  'Từ mục tiêu không thuộc bài đọc này': 'This target does not belong to the reading',
  'Cần hoàn thành tất cả các từ mục tiêu trước khi hoàn thành bài đọc': 'Practice all target words before completing this reading',
  'Tập tin ghi âm không hợp lệ': 'Invalid audio file',
  'Kích thước tập tin ghi âm vượt quá giới hạn 5MB': 'Audio files must be smaller than 5 MB',
  'Không tìm thấy bản thu âm': 'Recording not found',
  'Dữ liệu nội dung chưa đạt chuẩn xuất bản': 'Content is not ready for publishing',
  'Không tìm thấy báo cáo': 'Report not found',
  'Email hoặc mật khẩu không chính xác': 'Incorrect email or password',
  'Thiếu mã truy cập (Access Token)': 'Access token is missing',
  'Mã truy cập không hợp lệ hoặc đã hết hạn': 'Access token is invalid or expired',
  'Phiên đăng nhập đã hết hạn hoặc không hợp lệ': 'Your sign-in session is invalid or expired',
  'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại': 'Your session has expired. Sign in again.',
  'Tài khoản của bạn đã bị vô hiệu hóa hoặc tạm khóa': 'Your account has been suspended or deactivated',
  'Mật khẩu hiện tại không đúng': 'Incorrect current password',
  'Mật khẩu hiện tại không chính xác': 'Incorrect current password',
  'Bạn không có quyền thực hiện hành động này': 'You do not have permission to perform this action',
  'Không tìm thấy vai trò này trong hệ thống': 'Role not found',
  'Vai trò với mã này đã tồn tại': 'A role with this key already exists',
  'Không thể chỉnh sửa hoặc xóa vai trò hệ thống mặc định': 'System roles cannot be edited or deleted',
  'Bạn không thể tự gỡ quyền Quản trị viên của chính mình': 'You cannot remove your own administrator role',
  'Không tìm thấy người dùng': 'User not found',
  'Tài khoản với email này đã tồn tại': 'An account with this email already exists',
  'Email đã được sử dụng': 'This email is already in use',
  'Không tìm thấy khóa học': 'Course not found',
  'Không tìm thấy từ vựng': 'Word not found',
  'Dữ liệu yêu cầu không hợp lệ': 'Invalid request data',
  'Không tìm thấy tài nguyên yêu cầu': 'Requested resource not found',
  'Đã xảy ra lỗi máy chủ nội bộ. Vui lòng thử lại sau': 'A server error occurred. Try again later.',
  'Email không đúng định dạng': 'Enter a valid email address',
  'Vui lòng nhập mật khẩu': 'Enter your password',
  'Mật khẩu phải có tối thiểu 6 ký tự': 'Your password must have at least 6 characters',
  'Họ và tên tối thiểu 2 ký tự': 'Your name must have at least 2 characters',
  'Họ và tên tối đa 100 ký tự': 'Your name must have at most 100 characters',
  'Mật khẩu mới phải khác mật khẩu hiện tại': 'The new password must be different from your current password',
  'Mật khẩu mới tối thiểu 6 ký tự': 'The new password must have at least 6 characters',
  'Nhập mật khẩu hiện tại': 'Enter your current password',
  'Họ và tên không được bỏ trống': 'Enter your name',
  'Ký hiệu phiên âm chưa được xác nhận': 'The custom notation system has not been confirmed',
  'ID bị trùng': 'Duplicate ID',
  'Quy tắc đã duyệt cần ký hiệu chính thức': 'An approved rule requires official notation',
  'Cần ít nhất một bài học': 'At least one lesson is required',
  'Bài học chưa có câu hỏi': 'A lesson has no questions',
  'Câu hỏi chưa có lựa chọn': 'A question has no choices',
  'Câu hỏi chưa có đáp án đúng': 'A question has no correct answer',
  'Đáp án không thuộc các lựa chọn': 'An answer ID is not in the choices',
  'Câu chọn một phải có đúng một đáp án': 'A single-choice question must have exactly one correct answer',
  'Quy tắc tham chiếu phải được duyệt và có ký hiệu': 'Referenced rules must be approved and have official notation',
  'Highlight cần có từ và offset hợp lệ': 'A highlight requires a word and valid offsets',
  'Segment cần khớp từ và offset hợp lệ': 'Segments must match the word and have valid offsets',
  'Bài tiên quyết không tồn tại hoặc có chu trình': 'The prerequisite is missing or forms a cycle',
  'Offset từ mục tiêu không khớp văn bản': 'Target word offsets do not match the text',
  'Không thể tạo phiên học mới': 'Unable to create a learning session',
  'Không thể tạo phiên ôn tập': 'Unable to create a review session',
  'Không tìm thấy câu hỏi hiện tại': 'Current question not found',
  'Không thể cập nhật phiên học': 'Unable to update the learning session',
  'Không thể cập trạng thái luyện nói': 'Unable to update speaking status',
  'Không thể cập nhật trạng thái luyện nói': 'Unable to update speaking status',
  'Từ cần ghi âm phải từ 1 đến 128 ký tự': 'The recording word must contain 1–128 characters',
  'Định dạng âm thanh không được hỗ trợ': 'This audio format is not supported',
  'Phiên học không tồn tại hoặc không thuộc quyền sở hữu của bạn': 'The session is missing or does not belong to your account',
  'Bài đọc không hợp lệ': 'Invalid reading',
  'Không thể lưu bản thu âm': 'Unable to save the recording',
  'Mã vai trò này đã tồn tại': 'A role with this key already exists',
  'Không thể tạo vai trò': 'Unable to create role',
  'Không tìm thấy vai trò': 'Role not found',
  'Không thể xóa vai trò mặc định của hệ thống': 'System roles cannot be edited or deleted',
  'Yêu cầu đăng nhập': 'Access token is missing',
  'Bạn không có quyền thực hiện thao tác này': 'You do not have permission to perform this action',
  'Email này đã được sử dụng': 'This email is already in use',
  'Không thể tạo tài khoản': 'Unable to create account',
  'Tài khoản đã bị tạm khóa hoặc vô hiệu hóa': 'Your account has been suspended or deactivated',
  'Phiên làm việc đã hết hạn hoặc tài khoản không hoạt động': 'Your session has expired. Sign in again.',
  'Thiếu access token': 'Access token is missing',
  'Access token không hợp lệ': 'Access token is invalid or expired',
  'Phiên đăng nhập đã hết hiệu lực': 'Your sign-in session is invalid or expired',
  'Chưa có nội dung chính thức được xuất bản. Vui lòng quay lại sau hoặc liên hệ quản trị viên.': 'No official content has been published yet. Please check back later or contact an administrator.',
  'Ôn tập câu sai': 'Missed question review',
  'Yêu cầu không hợp lệ': 'Invalid request',
  'Dữ liệu không hợp lệ': 'Invalid data',
  'Mã vai trò tối thiểu 2 ký tự': 'Role code must have at least 2 characters',
  'Mã vai trò tối đa 64 ký tự': 'Role code must have at most 64 characters',
  'Mã vai trò phải là chữ hoa không dấu và dấu gạch dưới (VD: TEACHER_ASSISTANT)': 'Role code must be uppercase letters without accents and underscores (e.g. TEACHER_ASSISTANT)',
  'Nhập tên hiển thị vai trò': 'Enter role display name',
  'Quyền không hợp lệ': 'Invalid permission',
  'Phải chỉ định ít nhất một vai trò': 'At least one role must be specified',
  'Refresh token không được để trống': 'Refresh token cannot be empty',
};

export function getErrorMessage(
  code: ErrorCode,
  params?: ErrorParams,
  lang: 'vi' | 'en' = 'vi',
): string {
  const dict = lang === 'en' ? ERROR_MESSAGES_EN : ERROR_MESSAGES_VI;
  let msg = dict[code] ?? ERROR_MESSAGES_VI[code] ?? code;
  if (params) {
    for (const [key, val] of Object.entries(params)) {
      msg = msg.replace(new RegExp(`{${key}}`, 'g'), String(val));
    }
  }
  return msg;
}

export function translateBackendMessage(message: string, lang: 'vi' | 'en' = 'vi'): string {
  if (lang === 'vi') return message;
  return BACKEND_MESSAGES_EN[message] ?? message;
}
