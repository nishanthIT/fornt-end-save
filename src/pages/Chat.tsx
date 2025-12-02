import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Send, Phone, Video, MoreVertical, Search, Plus, Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { chatService, Chat as ChatType, Message } from "@/services/chatService";
import { useToast } from "@/hooks/use-toast";
import socketService from "@/services/socketService";

// Mock data - replace with real API calls
const mockChats = [
  {
    id: "1",
    name: "General Discussion",
    type: "group",
    lastMessage: "Great work on the new features!",
    lastMessageTime: "2 min ago",
    unreadCount: 3,
    participants: 12,
    avatar: null,
  },
  {
    id: "2",
    name: "John Smith",
    type: "personal",
    lastMessage: "Can you check the inventory?",
    lastMessageTime: "5 min ago",
    unreadCount: 1,
    participants: 2,
    avatar: null,
  },
  {
    id: "3",
    name: "Product Team",
    type: "group",
    lastMessage: "Meeting at 3 PM today",
    lastMessageTime: "1 hour ago",
    unreadCount: 0,
    participants: 8,
    avatar: null,
  },
  {
    id: "4",
    name: "Sarah Johnson",
    type: "personal",
    lastMessage: "Thanks for the update!",
    lastMessageTime: "2 hours ago",
    unreadCount: 0,
    participants: 2,
    avatar: null,
  },
];

const Chat = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [chats, setChats] = useState<ChatType[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatType | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [newChatType, setNewChatType] = useState<"PERSONAL" | "GROUP">("PERSONAL");
  const [newChatName, setNewChatName] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Load chats on component mount
  useEffect(() => {
    loadChats();
    
    // Connect to socket when component mounts
    if (user) {
      socketService.connect();
      socketService.joinUserRoom(user.id);
      
      // Listen for new messages
      socketService.onMessageReceived((message: Message) => {
        const formattedMessage = formatMessageForUI(message);
        setMessages(prev => [...prev, formattedMessage]);
        
        // Update chat list with new message
        setChats(prev => prev.map(chat => 
          chat.id === message.chatId 
            ? { 
                ...chat, 
                lastMessage: message.content, 
                updatedAt: message.createdAt,
                lastMessageTime: 'Just now'
              }
            : chat
        ));
      });
    }

    // Cleanup on unmount
    return () => {
      socketService.offMessageReceived();
      socketService.disconnect();
    };
  }, [user]);

  // Handle joining/leaving chat rooms when selected chat changes
  useEffect(() => {
    if (selectedChat) {
      socketService.joinChat(selectedChat.id);
      
      return () => {
        socketService.leaveChat(selectedChat.id);
      };
    }
  }, [selectedChat]);

  // Load chat details when chatId changes
  useEffect(() => {
    if (chatId && chats.length > 0) {
      const chat = chats.find(c => c.id === chatId);
      if (chat) {
        setSelectedChat(chat);
        loadMessages(chatId);
      } else {
        // Try to load chat details if not found in list
        loadChatDetails(chatId);
      }
    }
  }, [chatId, chats]);

  const loadChats = async () => {
    try {
      setLoading(true);
      const chatsData = await chatService.getUserChats();
      setChats(chatsData);
    } catch (error) {
      console.error('Error loading chats:', error);
      toast({
        title: "Error",
        description: "Failed to load chats. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadChatDetails = async (chatId: string) => {
    try {
      const chat = await chatService.getChatDetails(chatId);
      setSelectedChat(chat);
      loadMessages(chatId);
    } catch (error) {
      console.error('Error loading chat details:', error);
      toast({
        title: "Error",
        description: "Failed to load chat details.",
        variant: "destructive",
      });
    }
  };

  const loadMessages = async (chatId: string) => {
    try {
      setLoadingMessages(true);
      const messagesData = await chatService.getChatMessages(chatId);
      setMessages(messagesData);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages.",
        variant: "destructive",
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || sendingMessage) return;

    try {
      setSendingMessage(true);
      const message = await chatService.sendMessage(selectedChat.id, {
        content: newMessage.trim()
      });
      
      setMessages(prev => [...prev, message]);
      setNewMessage("");
      
      // Update chat's last message in the list
      setChats(prev => prev.map(chat => 
        chat.id === selectedChat.id 
          ? { ...chat, lastMessage: newMessage.trim(), updatedAt: new Date().toISOString() }
          : chat
      ));
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCreateChat = async () => {
    if (!newChatName.trim()) return;

    try {
      const newChat = await chatService.createChat({
        name: newChatName.trim(),
        type: newChatType,
        participantIds: [] // We'll implement participant selection later
      });
      
      setChats(prev => [newChat, ...prev]);
      setShowNewChatDialog(false);
      setNewChatName("");
      
      // Navigate to the new chat
      navigate(`/chat/${newChat.id}`);
      
      toast({
        title: "Success",
        description: "Chat created successfully!",
      });
    } catch (error) {
      console.error('Error creating chat:', error);
      toast({
        title: "Error",
        description: "Failed to create chat. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleChatSelect = (chat: ChatType) => {
    setSelectedChat(chat);
    navigate(`/chat/${chat.id}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Chat List Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold">Messages</h1>
            <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 w-8 p-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start New Chat</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex gap-4">
                    <Button
                      variant={newChatType === "personal" ? "default" : "outline"}
                      onClick={() => setNewChatType("personal")}
                      className="flex-1"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Personal
                    </Button>
                    <Button
                      variant={newChatType === "group" ? "default" : "outline"}
                      onClick={() => setNewChatType("group")}
                      className="flex-1"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Group
                    </Button>
                  </div>
                  <Input
                    placeholder={newChatType === "personal" ? "Enter username or email" : "Enter group name"}
                    value={newChatName}
                    onChange={(e) => setNewChatName(e.target.value)}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowNewChatDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => {
                      // Handle chat creation logic here
                      setShowNewChatDialog(false);
                      setNewChatName("");
                    }}>
                      Create
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Chat List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-100 ${
                  selectedChat?.id === chat.id ? 'bg-blue-50 border border-blue-200' : ''
                }`}
              >
                <Avatar className="h-12 w-12 mr-3">
                  <AvatarImage src={chat.avatar} />
                  <AvatarFallback className={chat.type === 'group' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}>
                    {chat.type === 'group' ? <Users className="h-6 w-6" /> : getInitials(chat.name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium truncate">{chat.name}</h3>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {chat.lastMessageTime}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {chat.type === 'group' && (
                        <span className="text-xs text-gray-400">{chat.participants}</span>
                      )}
                      {chat.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs h-5 w-5 rounded-full p-0 flex items-center justify-center">
                          {chat.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={selectedChat.avatar} />
                  <AvatarFallback className={selectedChat.type === 'group' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}>
                    {selectedChat.type === 'group' ? <Users className="h-5 w-5" /> : getInitials(selectedChat.name)}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <h2 className="font-semibold">{selectedChat.name}</h2>
                  <p className="text-sm text-gray-500">
                    {selectedChat.type === 'group' 
                      ? `${selectedChat.participants} members` 
                      : 'Active now'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Video className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>View profile</DropdownMenuItem>
                    <DropdownMenuItem>Mute notifications</DropdownMenuItem>
                    <DropdownMenuItem>Clear history</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">Delete chat</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.isOwnMessage
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      {!message.isOwnMessage && selectedChat.type === 'group' && (
                        <p className="text-xs text-gray-500 mb-1">{message.senderName}</p>
                      )}
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${message.isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* No Chat Selected */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No chat selected</h3>
              <p className="text-gray-500">Choose a conversation from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;