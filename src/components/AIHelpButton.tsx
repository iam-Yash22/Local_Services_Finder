import { useState, useEffect, useRef } from "react";
import { MessageCircleQuestion, X, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTranslation } from "react-i18next";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIHelpButton() {
  const { user, role } = useAuth();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const canSearch = Boolean(user && role === "user");
  const welcome = !user
    ? t("chatbot.welcomeGuest")
    : !canSearch
      ? t("chatbot.welcomeRole")
      : t("chatbot.welcomeCustomer");

  useEffect(() => {
    setMessages([]);
  }, [user?.id, role]);

  useEffect(() => {
    if (open && (
      messages.length === 0
      || (messages.length === 1 && messages[0].role === "assistant" && messages[0].content !== welcome)
    )) {
      setMessages([{ role: "assistant", content: welcome }]);
    }
  }, [open, messages, welcome]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || typing || !canSearch) return;
    const userMsg: Message = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    try {
      const history = messages.filter(m => m.role !== "assistant" || !m.content.startsWith("👋"));
      const data = await apiRequest<{
        reply: string;
        searchedOnline: boolean;
        hasLocalResults: boolean;
        error?: string;
      }>("/ai-chat", {
        method: "POST",
        body: JSON.stringify({ message: msg, history }),
      });

      if (data?.searchedOnline && !data?.hasLocalResults) {
        setMessages((prev) => [...prev, { role: "assistant", content: "🔍 Searching online services..." }]);
        await new Promise((r) => setTimeout(r, 800));
        setMessages((prev) => {
          const without = prev.slice(0, -1);
          return [...without, { role: "assistant", content: data.reply }];
        });
      } else if (data?.error) {
        setMessages((prev) => [...prev, { role: "assistant", content: `⚠️ ${data.error}` }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: /[\u0900-\u097f]/.test(msg)
        ? t("chatbot.unableToProcess", { lng: "hi" })
        : t("chatbot.unableToProcess", { lng: "en" })
      }]);
    } finally {
      setTyping(false);
    }
  };

  const showSuggestions = canSearch && messages.length <= 1 && !typing;

  return (
    <>
      <motion.button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-[0_0_25px_rgba(139,92,246,0.4)]"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{ y: [0, -6, 0] }}
        transition={{ y: { repeat: Infinity, duration: 3, ease: "easeInOut" } }}
        aria-label={t("chatbot.help")}
      >
        {open ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[400px] max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-card shadow-elevated overflow-hidden flex flex-col"
            style={{ maxHeight: "75vh" }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">{t("chatbot.title")}</h3>
                <p className="text-xs text-white/70">
                  {!user ? t("chatbot.signInToSearch") : t("chatbot.searchLocal")}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm max-w-[85%] leading-relaxed ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1 [&>ul]:my-1">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : msg.content}
                  </div>
                </motion.div>
              ))}

              {/* Quick suggestions */}
              {showSuggestions && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {["findPlumber", "howItWorks", "whatCanHelp"].map((key) => (
                    <button
                      key={key}
                      onClick={() => handleSend(t(`chatbot.${key}`))}
                      className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                    >
                      {t(`chatbot.${key}`)}
                    </button>
                  ))}
                </div>
              )}

              {!user && messages.length > 0 && (
                <div className="flex gap-2">
                  <Link to="/register" onClick={() => setOpen(false)} className="flex-1">
                    <Button size="sm" className="w-full">{t("auth.signUp")}</Button>
                  </Link>
                  <Link to="/login" onClick={() => setOpen(false)} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full">{t("auth.signIn")}</Button>
                  </Link>
                </div>
              )}

              {typing && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border p-3 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={canSearch ? t("chatbot.askService") : t("chatbot.signInToSearch")}
                disabled={!canSearch}
                className="flex-1 rounded-full border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
              />
              <Button size="icon" onClick={() => handleSend()} disabled={typing || !canSearch} aria-label={t("chatbot.sendMessage")} className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 border-0 shrink-0 hover:from-purple-500 hover:to-blue-500">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
