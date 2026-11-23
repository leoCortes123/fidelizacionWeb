import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { PwaUpdatePrompt } from "@/components/pwa/PwaUpdatePrompt";
import { ThemeProvider, useTheme } from "@/components/theme/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "./queryClient";
import { AppRoutes } from "./router";

function ThemedToaster() {
  const { theme } = useTheme();
  return (
    <Toaster
      theme={theme}
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        duration: 4500,
        className:
          "!rounded-none !border-2 !border-[var(--lp-ink)] !shadow-[4px_4px_0_var(--lp-ink)] !font-sans",
      }}
    />
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider delayDuration={250}>
          <BrowserRouter>
            <AuthProvider>
              <AppRoutes />
              <PwaUpdatePrompt />
              <ThemedToaster />
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
