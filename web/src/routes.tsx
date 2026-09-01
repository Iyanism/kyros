import { createBrowserRouter, redirect } from "react-router";
import { Landing } from "@/pages/landing";
import { Login } from "@/pages/auth/login";
import { Register } from "@/pages/auth/register";
import { Dashboard } from "@/pages/dashboard/dashboard";
import { Chamber } from "@/pages/dashboard/chamber";
import { NotFound } from "@/pages/not-found";
import { useAuthStore, isSessionValid } from "@/store/authStore";
import { Users } from "@/pages/dashboard/users";
import { Clients } from "@/pages/dashboard/clients";
import { Inbound } from "@/pages/dashboard/inbound";
import { ErrorBoundaryPage } from "@/pages/error-boundary";
import type { UserRole } from "@/types/user";

function requireAuth() {
  if (!isSessionValid()) {
    throw redirect("/login");
  }
}

function requireRoles(...allowed: UserRole[]) {
  requireAuth();
  const { user, hasRole } = useAuthStore.getState();
  if (!user || !hasRole(allowed)) {
    throw redirect("/dashboard");
  }
}

const redirectIfAuthenticated = () => {
  if (isSessionValid()) {
    throw redirect("/dashboard");
  }
};

const protectedLoader = () => {
  requireAuth();
};

const adminLoader = () => {
  requireRoles("admin");
};

const staffLoader = () => {
  requireRoles("admin", "operator");
};

export const router = createBrowserRouter([
  {
    ErrorBoundary: ErrorBoundaryPage,
    children: [
      { path: "/", element: <Landing /> },
      { path: "/login", element: <Login />, loader: redirectIfAuthenticated },
      { path: "/register", element: <Register />, loader: redirectIfAuthenticated },

      { path: "/dashboard", element: <Dashboard />, loader: protectedLoader },
      { path: "/chamber", element: <Chamber />, loader: protectedLoader },
      { path: "/inbound", element: <Inbound />, loader: staffLoader },

      { path: "/users", element: <Users />, loader: adminLoader },
      { path: "/clients", element: <Clients />, loader: adminLoader },

      { path: "*", element: <NotFound /> },
    ],
  },
]);
