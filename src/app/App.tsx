import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { PwaUpdatePrompt } from "@/components/pwa/PwaUpdatePrompt";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "./queryClient";
import { AppRoutes } from "./router";

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider delayDuration={250}>
          <BrowserRouter>
            <AuthProvider>
              <AppRoutes />
              <PwaUpdatePrompt />
              <Toaster
                position="top-center"
                richColors
                closeButton
                toastOptions={{ duration: 4500 }}
              />
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
