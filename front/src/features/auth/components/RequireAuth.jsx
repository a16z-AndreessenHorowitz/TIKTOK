import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { bootstrapAuthSession } from "../../../api/authApi";
import { useAuth } from "../hooks/useAuth";
import { openLoginModal } from "../model/authUi";

export default function RequireAuth() {
  const { isLoggedIn } = useAuth();
  const location = useLocation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    bootstrapAuthSession().finally(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (ready && !isLoggedIn) {
      sessionStorage.setItem("tt-auth-return", location.pathname);
      openLoginModal();
    }
  }, [ready, isLoggedIn, location.pathname]);

  if (!ready) return null;

  if (!isLoggedIn) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
