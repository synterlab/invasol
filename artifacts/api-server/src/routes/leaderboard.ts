import { Router, type IRouter, type Request, type Response } from "express";
import { db, savesTable, usersTable } from "@workspace/db";
import { eq, desc, gt, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/leaderboard", async (_req: Request, res: Response): Promise<void> => {
  const rows = await db
    .select({
      username: usersTable.username,
      highScore: savesTable.highScore,
      currentWave: savesTable.currentWave,
    })
    .from(savesTable)
    .innerJoin(usersTable, eq(savesTable.userId, usersTable.id))
    .where(gt(savesTable.highScore, 0))
    .orderBy(desc(savesTable.highScore), desc(savesTable.currentWave))
    .limit(20);

  res.json(
    rows.map((r, i) => ({
      rank: i + 1,
      username: r.username,
      highScore: r.highScore,
      currentWave: r.currentWave,
    }))
  );
});

export default router;
