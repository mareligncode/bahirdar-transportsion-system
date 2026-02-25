export interface SupportTicket {
  _id: string;
  userID: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  category: 'booking' | 'payment' | 'technical' | 'general';
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SupportMessage {
  _id: string;
  ticketID: string;
  userID: string;
  message: string;
  isStaff: boolean;
  attachments?: string[];
  createdAt: string;
}

export interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
}

export interface CreateTicketData {
  subject: string;
  message: string;
  category: SupportTicket['category'];
  priority?: SupportTicket['priority'];
  attachments?: string[];
}