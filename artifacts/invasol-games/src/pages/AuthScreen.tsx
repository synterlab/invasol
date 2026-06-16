import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useRegister,
  useLogin,
  getGetMeQueryKey,
} from "@workspace/api-client-react";

export default function AuthScreen() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSuccess = () => {
    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    setLocation("/title");
  };

  const register = useRegister({
    mutation: {
      onSuccess,
      onError: (e: unknown) => {
        const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
        setError(msg ?? "Registration failed");
      },
    },
  });

  const login = useLogin({
    mutation: {
      onSuccess,
      onError: (e: unknown) => {
        const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
        setError(msg ?? "Login failed");
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimUser = username.trim();
    if (!trimUser || !password) {
      setError("Username and password are required");
      return;
    }
    const data = { username: trimUser, password };
    if (mode === "register") {
      register.mutate({ data });
    } else {
      login.mutate({ data });
    }
  };

  const isPending = register.isPending || login.isPending;

  return (
    <div
      className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-6"
      style={{
        background: "linear-gradient(180deg, #040e0a 0%, #071f16 60%, #0B3D2E 100%)",
        color: "#F4FBF6",
        fontFamily: "'Space Mono', monospace",
      }}
    >
      <div className="w-full max-w-xs">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="text-4xl font-bold tracking-widest mb-1"
            style={{
              fontFamily: "'Bungee', sans-serif",
              color: "#59D98E",
              textShadow: "0 0 24px rgba(89,217,142,0.4)",
            }}
          >
            TIDEBREAK
          </div>
          <div className="text-xs opacity-40" style={{ color: "#A8F0D0" }}>
            INVASOL GAMES
          </div>
        </div>

        {/* Mode toggle */}
        <div
          className="flex rounded-xl overflow-hidden mb-6 p-1"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); }}
              className="flex-1 py-2.5 text-xs uppercase tracking-widest font-bold rounded-lg transition-all"
              style={{
                background: mode === m ? "rgba(89,217,142,0.15)" : "transparent",
                color: mode === m ? "#59D98E" : "rgba(244,251,246,0.4)",
                border: mode === m ? "1px solid rgba(89,217,142,0.3)" : "1px solid transparent",
              }}
            >
              {m === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="text-xs opacity-50 mb-1.5 block" style={{ color: "#A8F0D0" }}>
              Username
            </label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_username"
              autoComplete="username"
              minLength={3}
              maxLength={32}
              className="h-12"
              style={{
                background: "rgba(255,255,255,0.05)",
                borderColor: "rgba(89,217,142,0.2)",
                color: "#F4FBF6",
                fontFamily: "'Space Mono', monospace",
              }}
              data-testid="input-username"
            />
          </div>
          <div>
            <label className="text-xs opacity-50 mb-1.5 block" style={{ color: "#A8F0D0" }}>
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              minLength={6}
              className="h-12"
              style={{
                background: "rgba(255,255,255,0.05)",
                borderColor: "rgba(89,217,142,0.2)",
                color: "#F4FBF6",
                fontFamily: "'Space Mono', monospace",
              }}
              data-testid="input-password"
            />
          </div>

          {error && (
            <div
              className="text-xs px-3 py-2.5 rounded-xl"
              style={{
                background: "rgba(255,111,89,0.1)",
                border: "1px solid rgba(255,111,89,0.25)",
                color: "#FF9A7A",
              }}
              data-testid="text-error"
            >
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isPending}
            className="h-13 w-full font-bold text-base uppercase tracking-widest mt-1"
            style={{
              background: "linear-gradient(135deg, #1E8E63, #59D98E)",
              color: "#040e0a",
              fontFamily: "'Space Mono', monospace",
              boxShadow: "0 0 20px rgba(89,217,142,0.25)",
              height: "52px",
            }}
            data-testid="button-submit"
          >
            {isPending ? "..." : mode === "login" ? "Sign In" : "Register"}
          </Button>
        </form>

        <div className="mt-8 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <Button
            variant="ghost"
            className="w-full h-11 font-bold uppercase tracking-wider text-xs"
            style={{
              color: "rgba(244,251,246,0.35)",
              fontFamily: "'Space Mono', monospace",
            }}
            onClick={() => setLocation("/title")}
            data-testid="button-skip"
          >
            Play without account
          </Button>
        </div>
      </div>
    </div>
  );
}
