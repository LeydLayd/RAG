"use client";

import { useState, useRef, useEffect } from "react";
import UploadModal from "@/components/UploadModal";
import { generateId, getApiUrl } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  timestamp: string;
}

const EXAMPLE_PROMPTS = [
  "¿De qué tratan los documentos indexados?",
  "Resume los puntos clave de los archivos cargados",
  "¿Qué frameworks y tecnologías utiliza este sistema?",
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll al final del chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Alternar visualización de fuentes
  const toggleSource = (msgId: string) => {
    setExpandedSources((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText ?? inputQuery).trim();
    if (!textToSend || loading) return;

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery("");
    setLoading(true);

    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: textToSend }),
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      const botMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: data.answer || "No se obtuvo respuesta.",
        sources: data.sources || [],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Error al comunicarse con el backend. Asegúrate de que el servidor esté activo.";

      const errorMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: `⚠️ No se pudo obtener respuesta: ${errorMsg}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleUploadSuccess = (chunks: number, sourceName: string) => {
    const infoMessage: Message = {
      id: generateId(),
      role: "assistant",
      content: `📄 **Documento indexado con éxito**: Se agregaron ${chunks} fragmentos de "${sourceName}" a la base de conocimiento vectorial (Supabase pgvector). ¡Ya puedes hacerme preguntas sobre su contenido!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, infoMessage]);
  };

  return (
    <div className="flex h-screen flex-col bg-neutral-950 text-neutral-100 font-sans antialiased overflow-hidden">
      {/* Barra superior (Header) */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-800/80 bg-neutral-900/60 px-4 md:px-8 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/10">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-white tracking-tight">RAG Explorer</h1>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-950/70 border border-emerald-700/50 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                pgvector + Gemini
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 hidden sm:block">
              FastAPI · Supabase Vector · LangChain
            </p>
          </div>
        </div>

        {/* Botones laterales (Cargar documento a un lado) */}
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => setMessages([])}
              className="flex items-center gap-1.5 rounded-xl border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-xs font-medium text-neutral-400 hover:bg-neutral-800 hover:text-white transition-all cursor-pointer"
              title="Limpiar conversación"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="hidden sm:inline">Limpiar</span>
            </button>
          )}

          {/* Botón de carga principal en el lateral superior */}
          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white shadow-lg shadow-emerald-950/50 hover:bg-emerald-500 active:scale-95 transition-all cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Subir Documento</span>
          </button>
        </div>
      </header>

      {/* Área de mensajes de chat */}
      <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Estado vacío (Bienvenida y sugerencias) */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center pt-10 text-center animate-in fade-in duration-300">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4 shadow-xl shadow-emerald-950/30">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                ¿En qué puedo ayudarte hoy?
              </h2>
              <p className="mt-2 max-w-md text-xs md:text-sm text-neutral-400">
                Pregunta sobre los documentos almacenados en tu base vectorial o carga nuevos archivos con el botón de subida.
              </p>

              {/* Botón flotante para subir archivo en el estado inicial */}
              <button
                type="button"
                onClick={() => setIsUploadOpen(true)}
                className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-700/60 bg-emerald-950/30 px-4 py-2.5 text-xs font-medium text-emerald-300 hover:bg-emerald-900/40 hover:border-emerald-600 transition-all cursor-pointer shadow-md"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>Cargar nuevo documento (ventana flotante)</span>
              </button>

              {/* Sugerencias de preguntas */}
              <div className="mt-10 w-full max-w-lg space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Preguntas sugeridas
                </p>
                <div className="grid gap-2">
                  {EXAMPLE_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSend(prompt)}
                      className="w-full text-left rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-3 text-xs text-neutral-300 hover:border-neutral-700 hover:bg-neutral-900 hover:text-white transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <span>{prompt}</span>
                      <svg className="h-4 w-4 text-neutral-500 group-hover:text-emerald-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Lista de mensajes */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col gap-1.5 ${
                msg.role === "user" ? "items-end" : "items-start"
              } animate-in fade-in duration-200`}
            >
              <div
                className={`flex gap-3 max-w-[88%] md:max-w-[80%] ${
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-semibold ${
                    msg.role === "user"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-neutral-800 text-emerald-400 border border-neutral-700"
                  }`}
                >
                  {msg.role === "user" ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>

                {/* Burbuja del mensaje */}
                <div
                  className={`rounded-2xl px-4 py-3 text-sm shadow-md leading-relaxed ${
                    msg.role === "user"
                      ? "bg-emerald-600 text-white rounded-tr-xs"
                      : "bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-tl-xs"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Fuentes recuperadas para respuestas del asistente */}
                  {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 border-t border-neutral-800/80 pt-3">
                      <button
                        type="button"
                        onClick={() => toggleSource(msg.id)}
                        className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                      >
                        <svg
                          className={`h-3.5 w-3.5 transition-transform duration-200 ${
                            expandedSources[msg.id] ? "rotate-90" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                        <span>
                          {expandedSources[msg.id] ? "Ocultar" : "Ver"} fuentes de contexto ({msg.sources.length})
                        </span>
                      </button>

                      {expandedSources[msg.id] && (
                        <div className="mt-2.5 space-y-2 animate-in fade-in duration-200">
                          {msg.sources.map((src, i) => (
                            <div
                              key={i}
                              className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-3 text-xs font-mono text-neutral-300 leading-normal"
                            >
                              <div className="flex items-center justify-between text-[10px] text-neutral-500 mb-1.5">
                                <span>Fragmento {i + 1}</span>
                              </div>
                              <p className="line-clamp-6">{src}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Timestamp */}
              <span className={`text-[10px] text-neutral-500 px-12 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                {msg.timestamp}
              </span>
            </div>
          ))}

          {/* Indicador de carga cuando el bot está respondiendo */}
          {loading && (
            <div className="flex items-start gap-3 max-w-[80%] animate-in fade-in duration-200">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-neutral-800 text-emerald-400 border border-neutral-700">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="rounded-2xl rounded-tl-xs border border-neutral-800 bg-neutral-900 px-4 py-3 shadow-md flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-bounce" />
                </div>
                <span className="text-xs text-neutral-400 ml-1">Buscando en pgvector y redactando respuesta...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Barra de entrada inferior */}
      <footer className="border-t border-neutral-800/80 bg-neutral-900/60 p-3 md:p-4 backdrop-blur-md z-20">
        <div className="mx-auto max-w-3xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="relative flex items-center gap-2 rounded-2xl border border-neutral-800 bg-neutral-950 p-2 shadow-xl focus-within:border-emerald-500/80 focus-within:ring-1 focus-within:ring-emerald-500/50 transition-all"
          >
            {/* Botón rápido a un lado del input para abrir la ventana flotante */}
            <button
              type="button"
              onClick={() => setIsUploadOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-emerald-400 transition-colors cursor-pointer"
              title="Cargar documento (ventana flotante)"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>

            {/* Campo de texto */}
            <textarea
              ref={textareaRef}
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Haz una pregunta sobre los documentos... (Enter para enviar)"
              rows={1}
              disabled={loading}
              className="flex-1 bg-transparent px-2 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none resize-none max-h-32 disabled:opacity-50"
            />

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={!inputQuery.trim() || loading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-950/40 hover:bg-emerald-500 disabled:opacity-30 disabled:hover:bg-emerald-600 disabled:cursor-not-allowed transition-all cursor-pointer"
              aria-label="Enviar pregunta"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </form>

          <p className="mt-2 text-center text-[10px] text-neutral-500">
            Presiona <kbd className="rounded bg-neutral-800 px-1 py-0.5 text-neutral-400 font-mono">Enter</kbd> para enviar o <kbd className="rounded bg-neutral-800 px-1 py-0.5 text-neutral-400 font-mono">Shift + Enter</kbd> para salto de línea.
          </p>
        </div>
      </footer>

      {/* Ventana flotante (Modal) de carga */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}