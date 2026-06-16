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

export default function GameScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [gameOver, setGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [finalWave, setFinalWave] = useState(1);
  const [finalPearls, setFinalPearls] = useState(0);
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

      {/* Top HUD fade overlay */}
      <div
        className="absolute top-0 left-0 right-0 h-16 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, rgba(4,14,10,0.7), transparent)" }}
      />

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
