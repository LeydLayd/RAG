/**
 * Genera un identificador único seguro compatible con entornos seguros e inseguros (HTTP / IP local).
 */
export function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {
      // Fallback si el contexto no es seguro
    }
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Obtiene la URL base para la API.
 * Por defecto usa la ruta relativa '/api', la cual Next.js redirige (proxy)
 * internamente a http://127.0.0.1:8000 sin problemas de CORS ni de IP de red.
 */
export function getApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return "/api";
}
