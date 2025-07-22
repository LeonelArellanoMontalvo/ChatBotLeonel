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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const formSchema = z.object({
  message: z.string().min(1, "El mensaje no puede estar vacío."),
});

type FormValues = z.infer<typeof formSchema>;

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [topic, setTopic] = useState<string>("Computación en la nube");
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
        content: `¡Hola! Soy Chatbot Leonel. Pregúntame lo que quieras sobre "${topic}". Puedes cambiar el tema en cualquier momento.`,
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
        content: `Tema cambiado a "${newTopic}". ¿Cómo puedo ayudarte?`,
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
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      toast({
        variant: "destructive",
        title: "¡Uy! Algo salió mal.",
        description: "Hubo un problema al comunicarse con la IA. Por favor, inténtalo de nuevo más tarde.",
      });
      setMessages((prev) => prev.slice(0, prev.length - 1));
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-2xl h-[90vh] flex flex-col shadow-2xl">
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-bold tracking-tight text-primary">Chatbot Leonel</CardTitle>
        <CardDescription>Un chatbot impulsado por IA para responder a tus preguntas.</CardDescription>
        <div className="flex items-center gap-2 pt-2">
          <Label htmlFor="topic-input" className="whitespace-nowrap">Tema actual:</Label>
          <Input id="topic-input" defaultValue={topic} onBlur={(e) => handleTopicChange(e.target.value)} placeholder="Ej: Historia Mundial" />
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
                    <span className="text-sm">Pensando...</span>
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
              placeholder="Escribe tu pregunta aquí..."
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
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar"}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
