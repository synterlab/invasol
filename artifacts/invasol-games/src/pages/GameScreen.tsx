import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Game } from "../engine/Game";
import {
  useGetMe,
  useGetSave,
  useUpsertSave,
  getGetSaveQueryKey,
  getGetMeQueryKey,
} from "@workspace/api-client-react";

function RotatePrompt() {
  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6"
      style={{
        background: "rgba(4,14,10,0.97)",
        fontFamily: "'Space Mono', monospace",
        backdropFilter: "blur(6px)",
      }}
    >
      {/* Animated phone-rotation icon */}
      <div style={{ animation: "rotate-hint 2s ease-in-out infinite" }}>
        <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
          {/* Phone outline */}
          <rect
            x="20" y="10" width="32" height="52"
            rx="5" stroke="#59D98E" strokeWidth="2.5" fill="none"
            style={{ transformOrigin: "36px 36px", animation: "phone-tilt 2s ease-in-out infinite" }}
          />
          <circle cx="36" cy="55" r="2.5" fill="#59D98E" opacity="0.7" />
          {/* Rotation arrows */}
          <path
            d="M13 36 C13 22 22 13 36 13"
            stroke="#A8F0D0" strokeWidth="2" fill="none" strokeLinecap="round"
            strokeDasharray="4 3" opacity="0.6"
          />
          <path d="M13 29 L13 36 L20 36" stroke="#A8F0D0" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
          <path
            d="M59 36 C59 50 50 59 36 59"
            stroke="#A8F0D0" strokeWidth="2" fill="none" strokeLinecap="round"
            strokeDasharray="4 3" opacity="0.6"
          />
          <path d="M59 43 L59 36 L52 36" stroke="#A8F0D0" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
        </svg>
      </div>

      <div className="text-center px-8">
        <p className="font-bold text-sm uppercase tracking-widest mb-2" style={{ color: "#59D98E" }}>
          Rotate Device
        </p>
        <p className="text-xs opacity-50 leading-relaxed" style={{ color: "#A8F0D0" }}>
          Tidebreak plays best in landscape mode. Please rotate your device horizontally.
        </p>
      </div>
    </div>
  );
}

export default function GameScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [gameOver, setGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [finalWave, setFinalWave] = useState(1);
  const [finalPearls, setFinalPearls] = useState(0);
  const [isPortrait, setIsPortrait] = useState(false);
  const gameRef = useRef<Game | null>(null);
  const saveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: me } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: saveData } = useGetSave({
    query: { enabled: !!me, queryKey: getGetSaveQueryKey() },
  });

  const upsertSave = useUpsertSave({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSaveQueryKey() });
      },
    },
  });

  const pushSave = useCallback(
    (score: number, pearls: number, wave: number) => {
      if (!me) return;
      const upgrades = gameRef.current
        ? JSON.stringify(gameRef.current.upgrades ?? {})
        : "{}";
      upsertSave.mutate({
        data: { highScore: score, pearls, upgradesJson: upgrades, currentWave: wave },
      });
    },
    [me, upsertSave]
  );

  const handleGameOver = useCallback(() => {
    const game = gameRef.current;
    if (!game) return;
    setFinalScore(game.score);
    setFinalWave(game.wave);
    setFinalPearls(game.pearls);
    setGameOver(true);
    pushSave(game.score, game.pearls, game.wave);
    if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
  }, [pushSave]);

  /* ─── Landscape lock + portrait detection ─── */
  useEffect(() => {
    const checkOrientation = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // Only show rotate prompt on mobile (touch) devices in portrait
      const isMobile = navigator.maxTouchPoints > 0 && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
      setIsPortrait(isMobile && h > w);
    };

    checkOrientation();

    // Try to lock to landscape on supported browsers (PWA / fullscreen)
    const tryLandscapeLock = async () => {
      try {
        // @ts-expect-error — screen.orientation.lock is not in all TS libs
        if (screen.orientation && typeof screen.orientation.lock === "function") {
          await screen.orientation.lock("landscape");
        }
      } catch {
        // Not supported or not in fullscreen — fall back to soft prompt
      }
    };
    tryLandscapeLock();

    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
      // Release orientation lock on exit
      try {
        // @ts-expect-error
        if (screen.orientation && typeof screen.orientation.unlock === "function") {
          screen.orientation.unlock();
        }
      } catch { /* ignore */ }
    };
  }, []);

  /* ─── Canvas resize ─── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (gameRef.current) {
        gameRef.current.turret.x = canvas.width / 2;
        gameRef.current.turret.y = canvas.height * 0.9;
        gameRef.current.tideline.baseY = canvas.height * 0.82;
        if (!gameRef.current.tideline.hasBreach) {
          gameRef.current.tideline.y = canvas.height * 0.82;
        }
      }
    };

    window.addEventListener("resize", resize);
    resize();

    const savedUpgrades = saveData?.upgradesJson
      ? JSON.parse(saveData.upgradesJson)
      : {};
    const initialPearls = saveData?.pearls ?? 0;
    const game = new Game(canvas, handleGameOver, initialPearls, savedUpgrades);
    gameRef.current = game;

    let rafId: number;
    const loop = (time: number) => {
      game.update(time);
      game.render();
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    saveIntervalRef.current = setInterval(() => {
      if (game && !game.isGameOver) {
        pushSave(game.score, game.pearls, game.wave);
      }
    }, 15000);

    const handleVisibility = () => {
      if (game) game.paused = document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
      cancelAnimationFrame(rafId);
      if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
      game.cleanup();
    };
  }, [handleGameOver, saveData]);

  return (
    <div
      className="relative w-full h-[100dvh] overflow-hidden"
      style={{ background: "#040e0a", touchAction: "none" }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ touchAction: "none" }}
        data-testid="canvas-game"
      />

      {/* Top HUD fade */}
      <div
        className="absolute top-0 left-0 right-0 h-16 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, rgba(4,14,10,0.7), transparent)" }}
      />

      {/* Portrait rotate prompt — shown on mobile portrait only */}
      {isPortrait && <RotatePrompt />}

      {/* Game over overlay */}
      {gameOver && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center p-6 z-20"
          style={{
            background: "rgba(4,14,10,0.95)",
            fontFamily: "'Space Mono', monospace",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            className="text-5xl font-bold mb-1 text-center tracking-wider"
            style={{ fontFamily: "'Bungee', sans-serif", color: "#FF6F59" }}
            data-testid="text-game-over"
          >
            TIDE BREACHED
          </div>

          <div className="w-24 h-1 rounded my-4" style={{ background: "rgba(89,217,142,0.3)" }} />

          <div className="text-sm mb-1 opacity-70" style={{ color: "#E8D9A6" }}>
            Wave {finalWave} Reached
          </div>
          <div
            className="text-3xl font-bold mb-2"
            style={{ color: "#59D98E" }}
          >
            {finalScore.toLocaleString()}
          </div>
          <div className="text-sm mb-8 opacity-60" style={{ color: "#A8F0D0" }}>
            {finalPearls} Pearls earned
          </div>

          {!me && (
            <div
              className="text-xs text-center mb-6 opacity-60 px-4 py-2 rounded-lg"
              style={{
                color: "#E8D9A6",
                background: "rgba(232,217,166,0.08)",
                border: "1px solid rgba(232,217,166,0.15)",
              }}
            >
              Sign in to save your score to the leaderboard
            </div>
          )}

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Button
              className="h-14 w-full font-bold text-lg uppercase tracking-widest"
              style={{
                background: "#59D98E",
                color: "#040e0a",
                fontFamily: "'Space Mono', monospace",
                boxShadow: "0 0 20px rgba(89,217,142,0.3)",
              }}
              onClick={() => window.location.reload()}
              data-testid="button-play-again"
            >
              Play Again
            </Button>
            <Button
              variant="outline"
              className="h-12 w-full font-bold uppercase tracking-wider"
              style={{
                borderColor: "rgba(232,217,166,0.4)",
                color: "#E8D9A6",
                fontFamily: "'Space Mono', monospace",
                background: "transparent",
              }}
              onClick={() => setLocation("/shop")}
              data-testid="button-shop"
            >
              Reef Shop
            </Button>
            <Button
              variant="ghost"
              className="h-12 w-full font-bold uppercase tracking-wider"
              style={{
                color: "rgba(244,251,246,0.5)",
                fontFamily: "'Space Mono', monospace",
              }}
              onClick={() => setLocation("/title")}
              data-testid="button-menu"
            >
              Main Menu
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
