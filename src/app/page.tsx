"use client";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { PersonaProvider } from "@/context/PersonaContext";
import { TankProvider } from "@/context/TankContext";
import LoginScreen from "@/components/LoginScreen";
import ChangePasswordScreen from "@/components/ChangePasswordScreen";
import MainApp from "@/components/MainApp";

function AppRouter() {
  const { auth } = useAuth();

  if (!auth.isLoggedIn) return <LoginScreen />;
  if (auth.mustChangePassword) return <ChangePasswordScreen />;
  return <MainApp />;
}

export default function Home() {
  return (
    <AuthProvider>
      <PersonaProvider>
        <TankProvider>
          <AppRouter />
        </TankProvider>
      </PersonaProvider>
    </AuthProvider>
  );
}
