import { z } from "zod";

const optionalHttpUrl = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z
    .string()
    .url()
    .refine(
      (value) => {
        try {
          const parsed = new URL(value);
          return parsed.protocol === "http:" || parsed.protocol === "https:";
        } catch {
          return false;
        }
      },
      { message: "Debe ser una URL HTTP(S) válida" },
    )
    .optional(),
);

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  VITE_PUBLIC_APP_URL: optionalHttpUrl,
  VITE_PUBLIC_SITE_URL: optionalHttpUrl,
  VITE_LEGAL_SITE_URL: optionalHttpUrl,
});

export const env = envSchema.parse(import.meta.env);
