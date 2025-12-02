import api from '@/utils/axiosInstance';

export interface Chat {
  id: string;
  name: string;
  type: 'PERSONAL' | 'GROUP';
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
  participants: ChatParticipant[];
  messages?: Message[];
  _count: {
    messages: number;
    participants: number;
  };
}

export interface ChatParticipant {
  id: string;
  chatId: string;
  userId: number;
  userType: 'ADMIN' | 'EMPLOYEE' | 'CUSTOMER';
  joinedAt: string;
  isAdmin: boolean;
}

export interface Message {
  id: string;
  content: string;
  chatId: string;
  senderId: number;
  senderType: 'ADMIN' | 'EMPLOYEE' | 'CUSTOMER';
  createdAt: string;
  updatedAt: string;
}

export interface CreateChatRequest {
  name: string;
  type?: 'PERSONAL' | 'GROUP';
  participantIds?: Array<{
    userId: number;
    userType: 'ADMIN' | 'EMPLOYEE' | 'CUSTOMER';
  }>;
}

export interface SendMessageRequest {
  content: string;
}

export const chatService = {
  // Get all chats for the authenticated user
  getUserChats: async (): Promise<Chat[]> => {
    const response = await api.get('/chat');
    return response.data;
  },

  // Get specific chat details
  getChatDetails: async (chatId: string): Promise<Chat> => {
    const response = await api.get(`/chat/${chatId}`);
    return response.data;
  },

  // Get messages for a specific chat
  getChatMessages: async (chatId: string, page = 1, limit = 50): Promise<Message[]> => {
    const response = await api.get(`/chat/${chatId}/messages`, {
      params: { page, limit }
    });
    return response.data;
  },

  // Send a message to a specific chat
  sendMessage: async (chatId: string, messageData: SendMessageRequest): Promise<Message> => {
    const response = await api.post(`/chat/${chatId}/messages`, messageData);
    return response.data;
  },

  // Create a new chat
  createChat: async (chatData: CreateChatRequest): Promise<Chat> => {
    const response = await api.post('/chat', chatData);
    return response.data;
  },

  // Add participant to a chat
  addParticipant: async (chatId: string, participantData: { userId: number; userType: string }): Promise<ChatParticipant> => {
    const response = await api.post(`/chat/${chatId}/participants`, participantData);
    return response.data;
  },

  // Remove participant from a chat
  removeParticipant: async (chatId: string, participantId: string): Promise<void> => {
    await api.delete(`/chat/${chatId}/participants/${participantId}`);
  }
};