import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AppSidebar } from "@/components/app-sidebar";
import { ChatMessage } from "@/components/chat-message";
import { ChatInput } from "@/components/chat-input";
import { EmptyChat } from "@/components/empty-chat";
import { TypingIndicator } from "@/components/typing-indicator";
import type { Conversation, Message } from "@shared/schema";

export default function ChatPage() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const sidebarStyle = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  // Fetch all conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

  // Fetch messages for active conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/conversations", activeConversationId, "messages"],
    enabled: !!activeConversationId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, imageBase64 }: { message: string; imageBase64?: string }) => {
      const res = await apiRequest("POST", "/api/chat", {
        conversationId: activeConversationId,
        message,
        imageBase64,
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (!activeConversationId && data.conversationId) {
        setActiveConversationId(data.conversationId);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/conversations", data.conversationId || activeConversationId, "messages"],
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إرسال الرسالة. حاول مرة أخرى.",
        variant: "destructive",
      });
    },
  });

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/conversations/${id}`);
    },
    onSuccess: () => {
      if (activeConversationId) {
        setActiveConversationId(null);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({
        title: "تم الحذف",
        description: "تم حذف المحادثة بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف المحادثة",
        variant: "destructive",
      });
    },
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sendMessageMutation.isPending]);

  const handleNewConversation = () => {
    setActiveConversationId(null);
  };

  const handleSendMessage = (message: string, imageBase64?: string) => {
    sendMessageMutation.mutate({ message, imageBase64 });
  };

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full">
        <AppSidebar
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={setActiveConversationId}
          onDelete={(id) => deleteConversationMutation.mutate(id)}
          onNew={handleNewConversation}
          isLoading={conversationsLoading}
        />

        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center gap-3 p-4 border-b bg-background shrink-0">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <h2 className="font-medium truncate">
              {activeConversationId
                ? conversations.find((c) => c.id === activeConversationId)?.title || "محادثة"
                : "محادثة جديدة"}
            </h2>
          </header>

          <ScrollArea className="flex-1">
            <div className="max-w-3xl mx-auto p-4">
              {!activeConversationId && messages.length === 0 && !sendMessageMutation.isPending ? (
                <EmptyChat />
              ) : messagesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-24 rounded-lg bg-muted/50 animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                  {sendMessageMutation.isPending && <TypingIndicator />}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="max-w-3xl mx-auto w-full">
            <ChatInput
              onSend={handleSendMessage}
              isLoading={sendMessageMutation.isPending}
            />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
