import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { queryClient } from './queryClient';
import { AppRoutes } from './router';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="top-center"
            richColors
            closeButton
            toastOptions={{ duration: 4500 }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
