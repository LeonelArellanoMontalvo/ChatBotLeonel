"use client";

import { useState, useRef, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { answerQuestions } from "@/ai/flows/answer-questions";
import { useToast } from "@/hooks/use-toast";
import { Bot, User, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  correctness?: number;
  usefulness?: number;
}

const formSchema = z.object({
  message: z.string().min(1, "Message cannot be empty."),
});

type FormValues = z.infer<typeof formSchema>;

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [topic, setTopic] = useState<string>("Cloud Computing");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    setMessages([
      {
        id: "init",
        role: "assistant",
        content: `Hello! I'm Gemini Tutor. Ask me anything about "${topic}". You can change the topic at any time.`,
      },
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleTopicChange = (newTopic: string) => {
    setTopic(newTopic);
    setMessages([
      {
        id: `topic-change-${Date.now()}`,
        role: "assistant",
        content: `Topic changed to "${newTopic}". How can I help you?`,
      },
    ]);
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: data.message,
    };
    setMessages((prev) => [...prev, userMessage]);
    reset();

    try {
      const response = await answerQuestions({
        topic: topic,
        question: data.message,
      });

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.answer,
        correctness: response.correctness,
        usefulness: response.usefulness,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem communicating with the AI. Please try again later.",
      });
      setMessages((prev) => prev.slice(0, prev.length - 1));
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreBadgeClass = (score: number) => {
    if (score >= 0.8) return "bg-green-600 hover:bg-green-700";
    if (score >= 0.5) return "bg-yellow-500 hover:bg-yellow-600";
    return "bg-red-600 hover:bg-red-700";
  };
  
  return (
    <Card className="w-full max-w-2xl h-[90vh] flex flex-col shadow-2xl">
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-bold tracking-tight text-primary">Gemini Tutor</CardTitle>
        <CardDescription>An AI-powered chatbot to answer your questions.</CardDescription>
        <div className="flex items-center gap-2 pt-2">
          <Label htmlFor="topic-input" className="whitespace-nowrap">Current Topic:</Label>
          <Input id="topic-input" defaultValue={topic} onBlur={(e) => handleTopicChange(e.target.value)} placeholder="e.g., World History" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full p-6">
            <div className="space-y-6">
              {messages.map((message) => (
                <div key={message.id} className={cn("flex items-start gap-4", message.role === "user" ? "justify-end" : "justify-start")}>
                  {message.role === "assistant" && (
                    <Avatar className="h-8 w-8 border-2 border-primary">
                      <AvatarFallback><Bot className="h-5 w-5 text-primary" /></AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn("max-w-[80%] rounded-2xl p-4 shadow-md", message.role === "user" ? "bg-primary text-primary-foreground rounded-br-none" : "bg-secondary text-secondary-foreground rounded-bl-none")}>
                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    {message.role === "assistant" && (message.correctness !== undefined || message.usefulness !== undefined) && (
                      <div className="mt-3 pt-2 border-t border-border/50 flex flex-wrap gap-2">
                        {message.correctness !== undefined && (
                          <Badge className={cn("text-white", getScoreBadgeClass(message.correctness))}>Correctness: {(message.correctness * 100).toFixed(0)}%</Badge>
                        )}
                        {message.usefulness !== undefined && (
                          <Badge className={cn("text-white", getScoreBadgeClass(message.usefulness))}>Usefulness: {(message.usefulness * 100).toFixed(0)}%</Badge>
                        )}
                      </div>
                    )}
                  </div>
                  {message.role === "user" && (
                    <Avatar className="h-8 w-8 border-2 border-accent">
                      <AvatarFallback><User className="h-5 w-5 text-accent" /></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-4 justify-start">
                  <Avatar className="h-8 w-8 border-2 border-primary">
                    <AvatarFallback><Bot className="h-5 w-5 text-primary" /></AvatarFallback>
                  </Avatar>
                  <div className="max-w-[75%] rounded-2xl p-4 shadow-md bg-secondary text-secondary-foreground rounded-bl-none flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-4 border-t">
        <form onSubmit={handleSubmit(onSubmit)} className="flex w-full items-start gap-4">
          <div className="flex-1">
            <Textarea
              {...register("message")}
              placeholder="Type your question here..."
              className="resize-none"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                  e.preventDefault();
                  handleSubmit(onSubmit)();
                }
              }}
              disabled={isLoading}
            />
            {errors.message && <p className="text-destructive text-xs mt-1 px-1">{errors.message.message}</p>}
          </div>
          <Button type="submit" disabled={isLoading} className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
