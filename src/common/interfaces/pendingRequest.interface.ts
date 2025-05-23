export interface PendingRequest {
  request_id: number;
  sender_id: number;
  created_at: Date;
  email: string;
  first_name: string;
  last_name: string;
}