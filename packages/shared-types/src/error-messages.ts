import type { ErrorCode, ErrorParams } from './errors';

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
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

export function getErrorMessage(code: ErrorCode, params?: ErrorParams): string {
  let msg = ERROR_MESSAGES[code] ?? code;
  if (params) {
    for (const [key, val] of Object.entries(params)) {
      msg = msg.replace(new RegExp(`{${key}}`, 'g'), String(val));
    }
  }
  return msg;
}
