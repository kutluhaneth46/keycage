import { NextResponse } from "next/server";
import {
  applyAttempt,
  attackSuite,
  createCage,
  normalizePolicy,
  toNearAccessKeyDraft,
  type Policy,
  type SpendAttempt,
} from "@/lib/policy";

export const runtime = "nodejs";

type Body = {
  policy?: Policy;
  attempts?: SpendAttempt[];
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const policy = normalizePolicy(body.policy ?? createCage().policy);
    let cage = createCage(policy);
    const attempts = body.attempts?.length ? body.attempts : attackSuite();

    for (const attempt of attempts) {
      cage = applyAttempt(cage, {
        ...attempt,
        id: attempt.id || `atk-${Date.now()}`,
        atIso: attempt.atIso || new Date().toISOString(),
      });
    }

    const allowed = cage.ledger.filter((e) => e.decision.ok).length;
    const blocked = cage.ledger.length - allowed;

    return NextResponse.json({
      ok: true,
      summary: {
        attempts: cage.ledger.length,
        allowed,
        blocked,
        spentTodayNear: cage.spentTodayNear,
        gasUsedNear: cage.gasUsedNear,
        remainingDailyNear: Number(
          (policy.dailyBudgetNear - cage.spentTodayNear).toFixed(2),
        ),
        remainingGasNear: Number(
          (policy.gasAllowanceNear - cage.gasUsedNear).toFixed(2),
        ),
      },
      ledger: cage.ledger,
      nearAccessKeyDraft: toNearAccessKeyDraft(policy),
      howToReproduce: [
        "Open / and click Run attack suite, or POST the same policy JSON to /api/attack.",
        "ALLOWED rows must match receivers, methods, and caps. DENY rows must stay denied.",
        "nearAccessKeyDraft shows the protocol FunctionCall key I wrap in KeyCage.",
      ],
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Attack run failed",
      },
      { status: 400 },
    );
  }
}

export async function GET() {
  const cage = createCage();
  return NextResponse.json({
    ok: true,
    defaultPolicy: cage.policy,
    sampleAttempts: attackSuite(),
    nearAccessKeyDraft: toNearAccessKeyDraft(cage.policy),
  });
}
