import { Router, type IRouter, type Request, type Response } from "express";
import { db, savesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpsertSaveBody } from "@workspace/api-zod";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): number | null {
  const session = req.session as unknown as Record<string, unknown>;
  const userId = session["userId"] as number | undefined;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return null;
  }
  return userId;
}

router.get("/save", async (req: Request, res: Response): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const [save] = await db
    .select()
    .from(savesTable)
    .where(eq(savesTable.userId, userId))
    .limit(1);

  if (!save) {
    res.status(404).json({ error: "Save not found" });
    return;
  }

  res.json({
    userId: save.userId,
    highScore: save.highScore,
    pearls: save.pearls,
    upgradesJson: save.upgradesJson,
    currentWave: save.currentWave,
    updatedAt: save.updatedAt.toISOString(),
  });
});

router.post("/save", async (req: Request, res: Response): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const parsed = UpsertSaveBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { highScore, pearls, upgradesJson, currentWave } = parsed.data;

  const [existing] = await db
    .select({ highScore: savesTable.highScore })
    .from(savesTable)
    .where(eq(savesTable.userId, userId))
    .limit(1);

  const newHighScore = existing && highScore !== undefined
    ? Math.max(existing.highScore, highScore)
    : (highScore ?? existing?.highScore ?? 0);

  const now = new Date();

  const [save] = await db
    .insert(savesTable)
    .values({
      userId,
      highScore: newHighScore,
      pearls: pearls ?? 0,
      upgradesJson: upgradesJson ?? "{}",
      currentWave: currentWave ?? 1,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: savesTable.userId,
      set: {
        highScore: newHighScore,
        ...(pearls !== undefined ? { pearls } : {}),
        ...(upgradesJson !== undefined ? { upgradesJson } : {}),
        ...(currentWave !== undefined ? { currentWave } : {}),
        updatedAt: now,
      },
    })
    .returning();

  req.log.info({ userId }, "Save upserted");
  res.json({
    userId: save.userId,
    highScore: save.highScore,
    pearls: save.pearls,
    upgradesJson: save.upgradesJson,
    currentWave: save.currentWave,
    updatedAt: save.updatedAt.toISOString(),
  });
});

export default router;
