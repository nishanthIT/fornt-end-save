import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(serverUrl: string = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3000') {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(serverUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to server:', this.socket?.id);
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Join user's personal room
  joinUserRoom(userId: string | number) {
    if (this.socket) {
      this.socket.emit('join_user_room', userId);
    }
  }

  // Join a specific chat room
  joinChat(chatId: string) {
    if (this.socket) {
      this.socket.emit('join_chat', chatId);
    }
  }

  // Leave a specific chat room
  leaveChat(chatId: string) {
    if (this.socket) {
      this.socket.emit('leave_chat', chatId);
    }
  }

  // Send a message (this will be handled by the backend API, but we can emit for real-time updates)
  emitNewMessage(chatId: string, message: any) {
    if (this.socket) {
      this.socket.emit('new_message', { chatId, message });
    }
  }

  // Listen for new messages
  onMessageReceived(callback: (message: any) => void) {
    if (this.socket) {
      this.socket.on('message_received', callback);
    }
  }

  // Remove message listener
  offMessageReceived() {
    if (this.socket) {
      this.socket.off('message_received');
    }
  }

  // Typing indicators
  startTyping(chatId: string, userInfo: any) {
    if (this.socket) {
      this.socket.emit('typing_start', { chatId, userInfo });
    }
  }

  stopTyping(chatId: string, userInfo: any) {
    if (this.socket) {
      this.socket.emit('typing_stop', { chatId, userInfo });
    }
  }

  // Listen for typing indicators
  onUserTyping(callback: (userInfo: any) => void) {
    if (this.socket) {
      this.socket.on('user_typing', callback);
    }
  }

  onUserStoppedTyping(callback: (userInfo: any) => void) {
    if (this.socket) {
      this.socket.on('user_stopped_typing', callback);
    }
  }

  // Remove typing listeners
  offTypingListeners() {
    if (this.socket) {
      this.socket.off('user_typing');
      this.socket.off('user_stopped_typing');
    }
  }

  // Get connection status
  getConnectionStatus() {
    return this.isConnected;
  }

  // Get socket instance
  getSocket() {
    return this.socket;
  }
}

// Create and export a singleton instance
export const socketService = new SocketService();
export default socketService;