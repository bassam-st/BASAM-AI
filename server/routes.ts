import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { chatRequestSchema } from "@shared/schema";
import { generateChatResponse, generateConversationTitle } from "./groq";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Get all conversations
  app.get("/api/conversations", async (req, res) => {
    try {
      const conversations = await storage.getConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get messages for a conversation
  app.get("/api/conversations/:id/messages", async (req, res) => {
    try {
      const { id } = req.params;
      const conversation = await storage.getConversation(id);
      
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      const messages = await storage.getMessages(id);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Delete a conversation
  app.delete("/api/conversations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteConversation(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Chat endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const parsed = chatRequestSchema.parse(req.body);
      const { conversationId, message, imageBase64 } = parsed;

      // Validate image size (max 5MB base64)
      if (imageBase64 && imageBase64.length > 7 * 1024 * 1024) {
        return res.status(400).json({ error: "حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت" });
      }

      let currentConversationId = conversationId;

      // Create new conversation if needed
      if (!currentConversationId) {
        const newConversation = await storage.createConversation({
          title: "محادثة جديدة",
        });
        currentConversationId = newConversation.id;

        // Generate title asynchronously with error handling
        const titleMessage = imageBase64 ? "سؤال عن صورة: " + message : message;
        generateConversationTitle(titleMessage)
          .then(async (title) => {
            await storage.updateConversationTitle(currentConversationId!, title);
          })
          .catch((error) => {
            console.error("Error generating conversation title:", error);
          });
      }

      // Save user message (with image indicator if present)
      const messageContent = imageBase64 ? `[صورة مرفقة] ${message}` : message;
      await storage.createMessage({
        conversationId: currentConversationId,
        role: "user",
        content: messageContent,
      });

      // Get conversation history
      const history = await storage.getMessages(currentConversationId);
      const chatHistory = history.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content.replace("[صورة مرفقة] ", ""),
      }));

      // Generate AI response (pass image if present)
      const aiResponse = await generateChatResponse(chatHistory, imageBase64 || undefined);

      // Save assistant message
      await storage.createMessage({
        conversationId: currentConversationId,
        role: "assistant",
        content: aiResponse,
      });

      res.json({
        conversationId: currentConversationId,
        response: aiResponse,
      });
    } catch (error) {
      console.error("Error in chat:", error);
      
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ error: validationError.message });
      }
      
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  return httpServer;
}
