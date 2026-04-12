"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function ConversationalHelpdesk() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: "init",
    role: "assistant",
    content: "Hi! I'm your AI HR Assistant. You can ask me questions about your PTO, benefits, or company policies."
  }]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/v1/agents/policy-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content })
      });

      if (!response.ok) throw new Error("Failed to communicate with AI");

      const data = await response.json();
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer || "Sorry, I am unable to process that right now."
      };
      
      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Error connecting to the AI Helpdesk."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg shadow-brand-primary/20 bg-brand-primary hover:bg-brand-primary/90 flex items-center justify-center z-50 p-0"
        aria-label="Open HR Helpdesk"
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-80 md:w-96 shadow-2xl z-50 flex flex-col h-[500px] border-border animate-in slide-in-from-bottom-10 fade-in">
      <CardHeader className="p-4 border-b border-border flex flex-row items-center justify-between space-y-0 bg-brand-primary/5 rounded-t-xl">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-brand-primary" />
          <h3 className="font-semibold text-sm">HR Helpdesk</h3>
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setIsOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="flex-1 p-4 overflow-y-auto space-y-4 bg-muted/20">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-lg p-3 text-sm flex gap-2 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-background border border-border text-foreground"}`}>
              {msg.role === "assistant" && <Bot className="h-4 w-4 mt-0.5 shrink-0 opacity-70" />}
              <span className="whitespace-pre-wrap">{msg.content}</span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-background border border-border rounded-lg p-3 text-sm flex gap-2 items-center text-muted-foreground w-16">
              <Bot className="h-4 w-4 shrink-0" />
              <div className="flex space-x-1">
                <div className="h-1.5 w-1.5 bg-current rounded-full animate-bounce" />
                <div className="h-1.5 w-1.5 bg-current rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="h-1.5 w-1.5 bg-current rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </CardContent>
      
      <CardFooter className="p-3 border-t border-border bg-background rounded-b-xl">
        <form onSubmit={handleSend} className="flex w-full space-x-2">
          <Input 
            value={inputValue} 
            onChange={(e) => setInputValue(e.target.value)} 
            placeholder="Type your question..." 
            className="flex-1 text-sm bg-background border-border" 
            disabled={isLoading}
          />
          <Button type="submit" size="sm" disabled={!inputValue.trim() || isLoading} className="h-9 w-9 p-0 bg-brand-primary hover:bg-brand-primary/90 text-white shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}

