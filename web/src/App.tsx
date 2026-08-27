// App.tsx
import { RouterProvider } from "react-router/dom";
import { router } from "@/routes";
import { Toaster } from "sonner";
import { useAuthStore } from "./store/authStore";
import { useEffect, useState } from "react";
import { ErrorBoundaryWrapper } from "@/components/shared/error-boundary-wrapper";

export function App() {
  const { accessToken, user, restoreSession } = useAuthStore();
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    const restore = async () => {
      try {
        if (accessToken && !user) {
          await restoreSession();
        }
      } catch (error) {
        console.error("Failed to restore session:", error);
      } finally {
        setIsRestoring(false);
      }
    };

    restore();
  }, [accessToken, user, restoreSession]);

  // Show loading state while restoring session
  if (isRestoring) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fbfcfe]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#e2e8f0] border-t-[#2457e6]" />
          <p className="text-[15px] text-[#7b8799]">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundaryWrapper name="AppRoot">
      <>
        <RouterProvider router={router} />
        <Toaster 
          position="top-right" 
          richColors 
          closeButton 
          expand={false}
          duration={4000}
          toastOptions={{
            style: {
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '12px 16px',
            },
          }}
        />
      </>
    </ErrorBoundaryWrapper>
  );
}