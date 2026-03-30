import api from './index';

// 백엔드 NotificationCategory enum
export type NotificationCategory =
  | 'TEAM_INVITE' | 'TEAM_APPLY' | 'TEAM_ACCEPTED' | 'TEAM_REJECTED'
  | 'MEMBER' | 'TROUBLESHOOTING' | 'JOB_POSTING' | 'GITHUB';

export type ActionStatus = 'NONE' | 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface NotificationDto {
  notificationId: number;
  category: NotificationCategory;
  content: string;
  referenceId: number | null;
  referenceUrl: string | null;
  isRead: boolean;
  actionStatus: ActionStatus;
  createdAt: string;
}

export interface PagedNotifications {
  content: NotificationDto[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  last: boolean;
}

/** GET /v1/notifications — 내 알림 목록 (페이지네이션) */
export const getNotifications = (page = 0, size = 20) =>
  api.get<{ data: PagedNotifications }>('/v1/notifications', { params: { page, size } });

/** GET /v1/notifications/unread-count — 안 읽은 알림 개수 */
export const getUnreadCount = () =>
  api.get<{ data: { count: number } }>('/v1/notifications/unread-count');

/** PATCH /v1/notifications/{id}/read — 특정 알림 읽음 처리 */
export const markNotificationRead = (notificationId: number) =>
  api.patch(`/v1/notifications/${notificationId}/read`);

/** PATCH /v1/notifications/read-all — 전체 알림 읽음 처리 */
export const markAllNotificationsRead = () =>
  api.patch('/v1/notifications/read-all');

/** DELETE /v1/notifications/{id} — 특정 알림 삭제 */
export const deleteNotification = (notificationId: number) =>
  api.delete(`/v1/notifications/${notificationId}`);

/** DELETE /v1/notifications/all — 전체 알림 삭제 */
export const deleteAllNotifications = () =>
  api.delete('/v1/notifications/all');

/** SSE 구독 URL (EventSource에서 직접 사용) */
export const SSE_SUBSCRIBE_URL = '/api/v1/notifications/subscribe';
