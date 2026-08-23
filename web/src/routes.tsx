import { createBrowserRouter, redirect } from "react-router";
import { Landing } from "@/pages/landing";
import { Login } from "@/pages/auth/login";
import { Register } from "@/pages/auth/register";
import { Dashboard } from "@/pages/dashboard/dashboard";
import { Chamber } from "@/pages/dashboard/chamber";
import { NotFound } from "@/pages/not-found";
import { useAuthStore } from "./store/authStore";

const redirectToDashboard = async () => {
  const isAuthenticated = useAuthStore.getState().isAuthenticated;
  
  if (isAuthenticated) {
    throw redirect("/dashboard");
  }
}

const protectedRoute = async () => {
  const isAuthenticated = useAuthStore.getState().isAuthenticated
  
  if (!isAuthenticated) {
    throw redirect("/login");
  }
}

export const router = createBrowserRouter([
  { path: "/", element: <Landing />},
  { path: "/login", element: <Login />, loader: redirectToDashboard },
  { path: "/register", element: <Register />, loader: redirectToDashboard },
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/chamber", element: <Chamber />, loader: protectedRoute },
  { path: "*", element: <NotFound /> },
]);