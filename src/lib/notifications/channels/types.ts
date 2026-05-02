export interface NotificationMessage {
  subject?: string;
  html?: string;
  text: string;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface Channel {
  send(to: string, message: NotificationMessage): Promise<NotificationResult>;
}
