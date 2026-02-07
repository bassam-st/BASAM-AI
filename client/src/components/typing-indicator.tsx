import { Bot } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex gap-4 p-4 rounded-lg bg-card" data-testid="typing-indicator">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
        <Bot className="h-5 w-5" />
      </div>
      <div className="flex-1 space-y-2">
        <p className="text-sm font-medium text-muted-foreground">ذكاء</p>
        <div className="flex gap-1.5 items-center pt-2">
          <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 rounded-full bg-muted-foreground/60 animate-bounce" />
        </div>
      </div>
    </div>
  );
}
