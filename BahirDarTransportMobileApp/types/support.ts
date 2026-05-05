export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'booking' | 'payment' | 'account' | 'trip';
}

export interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  attachments?: string[];
}

export interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
  type: 'feedback' | 'complaint' | 'inquiry' | 'other';
}

export interface Feedback {
  rating: number;
  comment: string;
  category: 'app' | 'service' | 'booking' | 'other';
  userId?: string;
}

export interface Language {
  code: 'en' | 'am';
  name: string;
  nativeName: string;
}

export interface Theme {
  mode: 'light' | 'dark' | 'system';
}

export interface FontSize {
  scale: number; // 0.8 to 1.2
  name: 'small' | 'normal' | 'large' | 'extra-large';
}

export interface PrivacySetting {
  shareLocation: boolean;
  saveHistory: boolean;
  allowNotifications: boolean;
}

export interface AppSetting {
  language: Language['code'];
  theme: Theme['mode'];
  fontSize: FontSize;
  privacy: PrivacySetting;
  autoUpdate: boolean;
  cacheData: boolean;
  downloadOverWifi: boolean;
}

export interface FontSizeOption extends FontSize {
  label: string;
}