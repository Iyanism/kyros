// App.tsx
import { RouterProvider } from "react-router/dom";
import { router } from "@/routes";
import { Toaster } from "sonner";
import { ErrorBoundaryWrapper } from "@/components/shared/error-boundary-wrapper";

export function App() {
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
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "12px 16px",
            },
          }}
        />
      </>
    </ErrorBoundaryWrapper>
  );
}