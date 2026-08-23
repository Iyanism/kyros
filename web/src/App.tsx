import { RouterProvider } from "react-router/dom";
import { router } from "@/routes";
import { Toaster } from "sonner";
import { useAuthStore } from "./store/authStore";
import { useEffect } from "react";

export function App() {
  const {accessToken, user, restoreSession} = useAuthStore();
  
  useEffect(() => {
    if (accessToken && !user) {
      restoreSession();
    }
  }, [accessToken, user, restoreSession]);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors closeButton/>
    </>
  );
}