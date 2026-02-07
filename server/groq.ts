import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `أنت مساعد ذكي يُدعى "BASSAM AI". أنت متخصص في مساعدة المستخدمين العرب والإجابة على أسئلتهم بأسلوب ودود واحترافي.

مميزاتك:
- تجيب بالعربية الفصحى السهلة والواضحة
- تقدم إجابات دقيقة ومفيدة
- تشرح المفاهيم المعقدة بطريقة بسيطة
- تساعد في حل المشاكل بطريقة منظمة
- لديك معرفة واسعة في مختلف المجالات
- يمكنك تحليل الصور ووصفها والإجابة عن أسئلة حولها

قواعد مهمة:
- كن موجزاً ومباشراً في إجاباتك
- استخدم تنسيق واضح عند الحاجة (نقاط، عناوين)
- إذا لم تكن متأكداً من شيء، اذكر ذلك بوضوح
- كن ودوداً ومحترماً دائماً`;

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

type GroqTextContent = {
  type: "text";
  text: string;
};

type GroqImageContent = {
  type: "image_url";
  image_url: {
    url: string;
  };
};

type GroqContentPart = GroqTextContent | GroqImageContent;

type GroqMessage = {
  role: "system" | "user" | "assistant";
  content: string | GroqContentPart[];
};

export async function generateChatResponse(
  messages: ChatMessage[],
  currentImageBase64?: string
): Promise<string> {
  // Use vision model if there's an image in the current request
  const model = currentImageBase64 ? "llama-3.2-90b-vision-preview" : "llama-3.3-70b-versatile";
  
  const chatMessages: GroqMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
  ];

  // Add message history (text only for previous messages)
  for (let i = 0; i < messages.length - 1; i++) {
    const msg = messages[i];
    chatMessages.push({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    });
  }

  // Handle the last message (current one) - may include image
  if (messages.length > 0) {
    const lastMsg = messages[messages.length - 1];
    
    if (currentImageBase64 && lastMsg.role === "user") {
      // Current message with image - use multimodal format
      chatMessages.push({
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: currentImageBase64,
            },
          },
          {
            type: "text",
            text: lastMsg.content || "ما هذه الصورة؟",
          },
        ],
      });
    } else {
      // Text-only message
      chatMessages.push({
        role: lastMsg.role as "user" | "assistant",
        content: lastMsg.content,
      });
    }
  }

  const completion = await groq.chat.completions.create({
    messages: chatMessages as any,
    model,
    temperature: 0.7,
    max_tokens: 2048,
  });

  return completion.choices[0]?.message?.content || "عذراً، لم أتمكن من الرد. حاول مرة أخرى.";
}

export async function generateConversationTitle(userMessage: string): Promise<string> {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "قم بإنشاء عنوان قصير ومختصر (3-5 كلمات بالعربية) يلخص السؤال أو الموضوع التالي. أجب بالعنوان فقط بدون أي شرح أو علامات ترقيم إضافية.",
      },
      {
        role: "user",
        content: userMessage,
      },
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.5,
    max_tokens: 50,
  });

  return completion.choices[0]?.message?.content?.trim() || "محادثة جديدة";
}
