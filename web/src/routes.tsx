import { createBrowserRouter } from "react-router";
import { Landing } from "@/pages/landing";
import { Login } from "@/pages/auth/login";
import { Register } from "@/pages/auth/register";
import { Dashboard } from "@/pages/dashboard/dashboard";
import { Chamber } from "@/pages/dashboard/chamber";
import { NotFound } from "@/pages/not-found";

export const router = createBrowserRouter([
  { path: "/", element: <Landing /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/chamber", element: <Chamber /> },
  { path: "*", element: <NotFound /> },
]);