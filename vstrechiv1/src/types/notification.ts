export interface NotificationItem {
  record_id: number;
  notification_id: number;
  user_id: number;
  notification_type: string;
  sent_at: string;
  status: 'read' | 'unread';
  israted: number; // 0 - не оценено, 1 - оценено (для уведомлений с оценкой)
  meeting_id: number | null;
  meeting_title: string | null;
  meeting_start_at: string | null;
  meeting_end_at: string | null;
  meeting_address: string | null;
  meeting_max_people: number | null;
  meeting_district: string | null;
  meeting_adults_only: boolean | null;
  meeting_description: string | null;
  notification_text: string;
  photo_urls: string[];
}
