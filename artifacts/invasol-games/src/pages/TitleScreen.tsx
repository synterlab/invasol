import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  useGetMe,
  useGetLeaderboard,
  useLogout,
  getGetMeQueryKey,
} from "@workspace/api-client-react";

function LogoCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let frame = 0;
    let raf: number;

    const W = canvas.width;
    const H = canvas.height;

    interface Droplet {
      x: number; y: number;
      tx: number; ty: number;
      r: number; color: string; t: number;
    }

    const droplets: Droplet[] = [];
    const colors = ["#1E8E63", "#59D98E", "#A8F0D0", "#FF9A3C", "#E8D9A6"];
    for (let i = 0; i < 50; i++) {
      droplets.push({
        x: Math.random() * W,
        y: -10 + Math.random() * H * 1.2,
        tx: W * 0.08 + (i / 50) * W * 0.84,
        ty: H * 0.5,
        r: 2 + Math.random() * 5,
        color: colors[i % colors.length],
        t: 0,
      });
    }

    function easeOutBack(t: number) {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }

    let waveT = 0;
    let phase: "assemble" | "idle" = "assemble";

    function draw() {
      ctx.clearRect(0, 0, W, H);
      frame++;
      waveT += 0.04;
      const progress = Math.min(frame / 80, 1);
      const ep = easeOutBack(Math.min(progress, 0.95));
      if (progress >= 1) phase = "idle";

      const seaGrad = ctx.createLinearGradient(0, 0, 0, H);
      seaGrad.addColorStop(0, "rgba(4,14,10,0)");
      seaGrad.addColorStop(1, "rgba(11,61,46,0.3)");
      ctx.fillStyle = seaGrad;
      ctx.fillRect(0, 0, W, H);

      for (const d of droplets) {
        const cx = d.x + (d.tx - d.x) * ep;
        const cy = d.y + (d.ty - d.y) * ep;
        const wobble = phase === "idle" ? Math.sin(waveT + d.x * 0.05) * 1.5 : 0;
        ctx.globalAlpha = 0.5 + ep * 0.5;
        ctx.fillStyle = d.color;
        ctx.shadowColor = d.color;
        ctx.shadowBlur = 6 * ep;
        ctx.beginPath();
        ctx.arc(cx, cy + wobble, d.r * (0.8 + ep * 0.2), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = ep;
      ctx.shadowColor = "#59D98E";
      ctx.shadowBlur = 24 * ep;
      ctx.fillStyle = "#59D98E";
      ctx.font = `bold ${W * 0.115}px 'Bungee', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("TIDEBREAK", W / 2, H * 0.4);

      ctx.shadowBlur = 0;
      ctx.globalAlpha = ep * 0.65;
      ctx.fillStyle = "#E8D9A6";
      ctx.font = `${W * 0.055}px 'Space Mono', monospace`;
      ctx.letterSpacing = "0.1em";
      ctx.fillText("INVASOL GAMES", W / 2, H * 0.72);
      ctx.letterSpacing = "0";
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvasRef} width={360} height={120} className="w-full max-w-sm" />;
}

export default function TitleScreen() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: user } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: leaderboard } = useGetLeaderboard();

  const logout = useLogout({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/");
      },
    },
  });

  return (
    <div
      className="min-h-[100dvh] w-full flex flex-col items-center p-6 pb-10 overflow-y-auto"
      style={{
        background: "linear-gradient(180deg, #040e0a 0%, #071f16 50%, #0B3D2E 100%)",
        color: "#F4FBF6",
        fontFamily: "'Space Mono', monospace",
      }}
    >
      {/* Header */}
      <div className="w-full max-w-sm flex justify-between items-center mb-4 mt-2">
        {user ? (
          <div className="flex items-center gap-3">
            <span
              className="text-xs font-bold px-2 py-1 rounded-full"
              style={{ background: "rgba(89,217,142,0.12)", color: "#59D98E", border: "1px solid rgba(89,217,142,0.25)" }}
            >
              {user.username}
            </span>
            <button
              onClick={() => logout.mutate()}
              className="text-xs opacity-40 hover:opacity-70 transition-opacity underline"
              data-testid="button-logout"
            >
              logout
            </button>
          </div>
        ) : (
          <button
            onClick={() => setLocation("/")}
            className="text-xs underline opacity-50 hover:opacity-80 transition-opacity"
            style={{ color: "#E8D9A6" }}
            data-testid="button-login"
          >
            Sign in to save progress
          </button>
        )}
        <span style={{ color: "#E8D9A6" }} className="text-xs opacity-40">v2.0</span>
      </div>

      {/* Logo */}
      <div className="w-full max-w-sm flex justify-center mb-6">
        <LogoCanvas />
      </div>

      {/* Description */}
      <p
        className="text-xs text-center mb-8 opacity-50 max-w-xs leading-relaxed"
        style={{ color: "#A8F0D0" }}
      >
        Defend the tideline from the slime invasion. Drag to aim, release to fire. Hold to charge.
      </p>

      {/* CTA */}
      <div className="w-full max-w-sm flex flex-col gap-3 mb-10">
        <Button
          className="h-14 w-full font-bold text-xl uppercase tracking-widest"
          style={{
            background: "linear-gradient(135deg, #1E8E63, #59D98E)",
            color: "#040e0a",
            fontFamily: "'Space Mono', monospace",
            boxShadow: "0 0 24px rgba(89,217,142,0.35)",
          }}
          onClick={() => setLocation("/game")}
          data-testid="button-play"
        >
          Deploy
        </Button>
        <Button
          variant="outline"
          className="h-12 w-full font-bold uppercase tracking-wider"
          style={{
            borderColor: "rgba(232,217,166,0.35)",
            color: "#E8D9A6",
            fontFamily: "'Space Mono', monospace",
            background: "transparent",
          }}
          onClick={() => setLocation("/shop")}
          data-testid="button-shop"
        >
          Reef Shop
        </Button>
      </div>

      {/* Leaderboard */}
      {leaderboard && leaderboard.length > 0 && (
        <div className="w-full max-w-sm">
          <h2
            className="text-xs uppercase tracking-widest opacity-50 mb-3 text-center"
            style={{ color: "#A8F0D0" }}
          >
            Tideline Defenders
          </h2>
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              border: "1px solid rgba(30,142,99,0.25)",
              background: "rgba(0,0,0,0.3)",
              backdropFilter: "blur(4px)",
            }}
          >
            {leaderboard.slice(0, 8).map((entry, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-2.5 border-b last:border-b-0 text-sm"
                style={{
                  borderColor: "rgba(30,142,99,0.12)",
                  background:
                    user && entry.username === user.username
                      ? "rgba(89,217,142,0.07)"
                      : "transparent",
                }}
                data-testid={`row-leaderboard-${i}`}
              >
                <span
                  className="w-6 text-center font-bold text-xs"
                  style={{
                    color: i === 0 ? "#FFD07A" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : "rgba(244,251,246,0.35)",
                  }}
                >
                  {entry.rank}
                </span>
                <span className="flex-1 truncate text-xs" style={{ color: "#F4FBF6" }}>
                  {entry.username}
                </span>
                <span className="text-xs font-bold" style={{ color: "#59D98E" }}>
                  {entry.highScore.toLocaleString()}
                </span>
                <span className="text-xs opacity-40" style={{ color: "#E8D9A6" }}>
                  W{entry.currentWave}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer: social + badge */}
      <div className="w-full max-w-sm flex flex-col items-center gap-5 mt-10">
        {/* X (Twitter) */}
        <a
          href="https://x.com/Invasolgames"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 transition-opacity"
          style={{ color: "#A8F0D0", textDecoration: "none", opacity: 0.5 }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "0.5")}
          aria-label="Follow @Invasolgames on X"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span className="text-xs font-bold tracking-wide" style={{ fontFamily: "'Space Mono', monospace" }}>
            @Invasolgames
          </span>
        </a>

        <p className="text-xs opacity-20 text-center" style={{ color: "#A8F0D0" }}>
          Drag from anywhere · Release to fire · Hold 0.2s to charge
        </p>
      </div>
    </div>
  );
}
