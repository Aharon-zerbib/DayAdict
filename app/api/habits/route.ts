import { NextResponse } from "next/server";

export type Habit = {
  id: string;
  name: string;
  description?: string;
  stoppedAt: string; // ISO date string de la date d'arrêt
  previousPerDay: number; // combien par jour avant
};

const mockHabits: Habit[] = [
  {
    id: "1",
    name: "Ne pas fumer",
    description: "Coche chaque jour où tu n'as pas fumé.",
    stoppedAt: new Date().toISOString(),
    previousPerDay: 10,
  },
];

export async function GET() {
  return NextResponse.json({ habits: mockHabits });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body.name !== "string") {
    return NextResponse.json(
      { error: "Le champ 'name' est requis." },
      { status: 400 }
    );
  }

  if (!body.stoppedAt || typeof body.stoppedAt !== "string") {
    return NextResponse.json(
      { error: "Le champ 'stoppedAt' (date ISO) est requis." },
      { status: 400 }
    );
  }

  if (
    body.previousPerDay === undefined ||
    typeof body.previousPerDay !== "number" ||
    Number.isNaN(body.previousPerDay)
  ) {
    return NextResponse.json(
      { error: "Le champ 'previousPerDay' (nombre par jour) est requis." },
      { status: 400 }
    );
  }

  const newHabit: Habit = {
    id: Date.now().toString(),
    name: body.name,
    description:
      typeof body.description === "string" ? body.description : undefined,
    stoppedAt: body.stoppedAt,
    previousPerDay: body.previousPerDay,
  };

  return NextResponse.json({ habit: newHabit }, { status: 201 });
}
