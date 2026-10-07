"use client";

import { useState, useRef, useEffect } from "react";
import { getApiUrl } from "@/lib/utils";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (chunksCreated: number, sourceName: string) => void;
}

export default function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const [activeTab, setActiveTab] = useState<"file" | "text">("file");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const handleFileChange = (selectedFile: File) => {
    setFile(selectedFile);
    if (!sourceName) {
      setSourceName(selectedFile.name);
    }
    setError(null);
    setSuccessMsg(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    let contentToIngest = "";
    let finalSource = sourceName.trim();

    if (activeTab === "file") {
      if (!file) {
        setError("Por favor selecciona un archivo.");
        return;
      }
      try {
        contentToIngest = await file.text();
        if (!finalSource) finalSource = file.name;
      } catch {
        setError("No se pudo leer el archivo. Asegúrate de que sea un archivo de texto válido.");
        return;
      }
    } else {
      if (!text.trim()) {
        setError("Por favor escribe o pega el texto a indexar.");
        return;
      }
      contentToIngest = text.trim();
      if (!finalSource) finalSource = "Texto manual";
    }

    if (!contentToIngest.trim()) {
      setError("El documento está vacío.");
      return;
    }

    setLoading(true);

    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: contentToIngest,
          metadata: {
            source: finalSource,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || `Error ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      const chunks = data.chunks_created ?? 0;
      setSuccessMsg(`¡Documento indexado con éxito! Se crearon ${chunks} fragmentos (chunks).`);
      setFile(null);
      setText("");
      setSourceName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (onSuccess) onSuccess(chunks, finalSource);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocurrió un error inesperado al conectar con el servidor.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Fondo clicable */}
      <div className="absolute inset-0" onClick={() => !loading && onClose()} />

      {/* Ventana modal */}
      <div className="relative w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl shadow-emerald-950/20 z-10 flex flex-col gap-5 text-neutral-100">
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Cargar Documento</h2>
              <p className="text-xs text-neutral-400">Indexa información en pgvector para consultar en el chat</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Cerrar modal"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Pestañas (Archivo / Texto manual) */}
        <div className="flex rounded-lg bg-neutral-950/60 p-1 border border-neutral-800/80">
          <button
            type="button"
            onClick={() => { setActiveTab("file"); setError(null); }}
            className={`flex-1 rounded-md py-2 text-xs font-medium transition-all ${
              activeTab === "file"
                ? "bg-neutral-800 text-white shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Subir Archivo
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("text"); setError(null); }}
            className={`flex-1 rounded-md py-2 text-xs font-medium transition-all ${
              activeTab === "text"
                ? "bg-neutral-800 text-white shadow-sm"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Pegar Texto
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {activeTab === "file" ? (
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Archivo de texto (.txt, .md, .json, .csv)
              </label>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-emerald-500 bg-emerald-950/20"
                    : file
                    ? "border-emerald-600/60 bg-neutral-950/40"
                    : "border-neutral-800 bg-neutral-950/30 hover:border-neutral-700 hover:bg-neutral-950/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.markdown,.json,.csv,.text"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <svg
                  className={`h-9 w-9 mb-2 transition-colors ${
                    file ? "text-emerald-400" : "text-neutral-500"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
                {file ? (
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-emerald-300 break-all">{file.name}</p>
                    <p className="text-xs text-neutral-400">{(file.size / 1024).toFixed(1)} KB</p>
                    <span className="inline-block mt-2 text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                      Hacer clic para cambiar archivo
                    </span>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-neutral-300 font-medium">
                      Arrastra y suelta tu archivo aquí
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      o haz clic para explorar tus documentos
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Texto del documento
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Pega aquí el contenido que deseas agregar a la base de conocimiento..."
                rows={5}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950/50 p-3 text-sm text-neutral-200 placeholder-neutral-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all resize-none"
              />
            </div>
          )}

          {/* Nombre / Fuente opcional */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Etiqueta de origen / Título de la fuente <span className="text-neutral-500">(opcional)</span>
            </label>
            <input
              type="text"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              placeholder={activeTab === "file" && file ? file.name : "Ej: Documentación de la API"}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-950/50 px-3.5 py-2.5 text-sm text-neutral-200 placeholder-neutral-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Mensajes de error o éxito */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-800/40 bg-red-950/20 p-3 text-xs text-red-300">
              <svg className="h-4 w-4 shrink-0 text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2.5 rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-3 text-xs text-emerald-300">
              <svg className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-neutral-800 px-4 py-2 text-xs font-medium text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors disabled:opacity-50"
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={loading || (activeTab === "file" ? !file : !text.trim())}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-medium text-white shadow-lg shadow-emerald-950/40 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="h-3.5 w-3.5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Indexando en Supabase...</span>
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>Cargar Documento</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
