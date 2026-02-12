// BahirDarTransportMobileApp/types/support.ts
export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: 'technical' | 'booking' | 'payment' | 'refund' | 'general';
  created_at: string;
  updated_at: string;
}

export interface Feedback {
  id: string;
  user_id: string;
  rating: number;
  comment: string;
  category: 'app' | 'service' | 'driver' | 'bus';
  created_at: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: 'booking' | 'payment' | 'account' | 'general';
}