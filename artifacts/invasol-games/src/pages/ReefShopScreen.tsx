import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  useGetMe,
  useGetSave,
  useUpsertSave,
  getGetMeQueryKey,
  getGetSaveQueryKey,
} from "@workspace/api-client-react";

interface Upgrade {
  id: string;
  name: string;
  desc: string;
  cost: number;
  icon: string;
  tag?: string;
}

const UPGRADES: Upgrade[] = [
  {
    id: "wider_charge",
    name: "Tide Burst",
    desc: "Charge shot fans into 3 projectiles",
    cost: 100,
    icon: "◎",
    tag: "OFFENSE",
  },
  {
    id: "slower_tide",
    name: "Reef Anchor",
    desc: "Slimes move 20% slower toward shore",
    cost: 250,
    icon: "⚓",
    tag: "DEFENSE",
  },
  {
    id: "twin_turret",
    name: "Twin Cannon",
    desc: "Deploy a second turret beside yours",
    cost: 500,
    icon: "⟁",
    tag: "OFFENSE",
  },
  {
    id: "coral_skin",
    name: "Coral Plating",
    desc: "Rare coral armor for your turret",
    cost: 75,
    icon: "✦",
    tag: "STYLE",
  },
];

export default function ReefShopScreen() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

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

  const pearls = saveData?.pearls ?? 0;
  const upgrades: Record<string, boolean> = saveData?.upgradesJson
    ? JSON.parse(saveData.upgradesJson)
    : {};

  const buyUpgrade = (upgrade: Upgrade) => {
    if (!me || pearls < upgrade.cost || upgrades[upgrade.id]) return;
    const newUpgrades = { ...upgrades, [upgrade.id]: true };
    upsertSave.mutate({
      data: {
        pearls: pearls - upgrade.cost,
        upgradesJson: JSON.stringify(newUpgrades),
      },
    });
  };

  return (
    <div
      className="min-h-[100dvh] w-full flex flex-col p-5 pb-10"
      style={{
        background: "linear-gradient(180deg, #040e0a 0%, #071f16 50%, #0B3D2E 100%)",
        color: "#F4FBF6",
        fontFamily: "'Space Mono', monospace",
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-end mb-6 mt-2">
        <div>
          <div
            className="text-2xl tracking-widest font-bold"
            style={{ fontFamily: "'Bungee', sans-serif", color: "#E8D9A6" }}
          >
            Reef Shop
          </div>
          <div className="text-xs opacity-40 mt-1" style={{ color: "#A8F0D0" }}>
            Permanent upgrades
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: "rgba(89,217,142,0.1)", border: "1px solid rgba(89,217,142,0.2)" }}>
          <span
            className="text-xl font-bold"
            style={{ color: "#59D98E" }}
            data-testid="text-pearls"
          >
            {pearls}
          </span>
          <span className="text-xs opacity-60" style={{ color: "#A8F0D0" }}>◉ Pearls</span>
        </div>
      </div>

      {!me && (
        <div
          className="mb-5 px-4 py-3 rounded-xl text-xs text-center"
          style={{
            background: "rgba(255,111,89,0.08)",
            border: "1px solid rgba(255,111,89,0.25)",
            color: "#FF9A7A",
          }}
        >
          Sign in to spend Pearls and keep upgrades across sessions
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 flex-1">
        {UPGRADES.map((upgrade) => {
          const owned = !!upgrades[upgrade.id];
          const canAfford = pearls >= upgrade.cost && !!me;
          const locked = !owned && !canAfford;

          return (
            <button
              key={upgrade.id}
              disabled={owned || locked}
              onClick={() => buyUpgrade(upgrade)}
              className="rounded-2xl p-4 flex flex-col gap-2 items-start text-left transition-all active:scale-95 relative overflow-hidden"
              style={{
                background: owned
                  ? "rgba(89,217,142,0.1)"
                  : canAfford
                  ? "rgba(30,142,99,0.12)"
                  : "rgba(255,255,255,0.03)",
                border: `1.5px solid ${owned ? "rgba(89,217,142,0.4)" : canAfford ? "rgba(30,142,99,0.35)" : "rgba(255,255,255,0.08)"}`,
                opacity: locked ? 0.45 : 1,
                cursor: owned ? "default" : canAfford ? "pointer" : "not-allowed",
              }}
              data-testid={`button-upgrade-${upgrade.id}`}
            >
              {upgrade.tag && (
                <span
                  className="text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-full absolute top-3 right-3"
                  style={{
                    background: upgrade.tag === "OFFENSE" ? "rgba(255,111,89,0.15)" : upgrade.tag === "DEFENSE" ? "rgba(89,217,142,0.15)" : "rgba(232,217,166,0.15)",
                    color: upgrade.tag === "OFFENSE" ? "#FF9A7A" : upgrade.tag === "DEFENSE" ? "#59D98E" : "#E8D9A6",
                  }}
                >
                  {upgrade.tag}
                </span>
              )}
              <span className="text-3xl mt-1">{upgrade.icon}</span>
              <span
                className="text-sm font-bold uppercase tracking-wide leading-tight"
                style={{ color: owned ? "#59D98E" : "#F4FBF6" }}
              >
                {upgrade.name}
              </span>
              <span className="text-xs leading-snug opacity-55" style={{ color: "#A8F0D0" }}>
                {upgrade.desc}
              </span>
              {owned ? (
                <span
                  className="text-xs font-bold mt-auto flex items-center gap-1"
                  style={{ color: "#59D98E" }}
                >
                  ✓ Equipped
                </span>
              ) : (
                <span
                  className="text-sm font-bold mt-auto"
                  style={{ color: canAfford ? "#59D98E" : "rgba(244,251,246,0.4)" }}
                >
                  {upgrade.cost} ◉
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex gap-3">
        <Button
          className="flex-1 h-12 font-bold uppercase tracking-wider"
          style={{
            background: "linear-gradient(135deg, #1E8E63, #59D98E)",
            color: "#040e0a",
            fontFamily: "'Space Mono', monospace",
          }}
          onClick={() => setLocation("/game")}
        >
          Deploy
        </Button>
        <Button
          variant="outline"
          className="flex-1 h-12 font-bold uppercase tracking-wider"
          style={{
            borderColor: "rgba(232,217,166,0.25)",
            color: "rgba(244,251,246,0.5)",
            fontFamily: "'Space Mono', monospace",
            background: "transparent",
          }}
          onClick={() => setLocation("/title")}
          data-testid="button-back"
        >
          Surface
        </Button>
      </div>
    </div>
  );
}
