"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { auth, db, onAuthStateChanged, type User } from "@/lib/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

type Habit = {
  id: string;
  name: string;
  stoppedAt: Date;
  previousPerDay: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [form, setForm] = useState({
    name: "",
    stoppedAt: "",
    previousPerDay: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    previousPerDay: "",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        router.replace("/");
        return;
      }
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!user) return;

    const habitsRef = collection(db, "habits");
    const q = query(habitsRef, where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: Habit[] = [];

        snapshot.docs.forEach((doc) => {
          const data = doc.data() as {
            name?: string;
            stoppedAt?: Timestamp | Date | string;
            previousPerDay?: number;
            userId?: string;
          };

          if (data.userId !== user?.uid) {
            return;
          }

          let stoppedAtDate: Date;
          if (!data.stoppedAt) {
            stoppedAtDate = new Date();
          } else if (data.stoppedAt instanceof Timestamp) {
            stoppedAtDate = data.stoppedAt.toDate();
          } else if (data.stoppedAt instanceof Date) {
            stoppedAtDate = data.stoppedAt;
          } else {
            stoppedAtDate = new Date(data.stoppedAt);
          }

          items.push({
            id: doc.id,
            name: data.name || "Habitude",
            stoppedAt: stoppedAtDate,
            previousPerDay: data.previousPerDay ?? 0,
          });
        });

        setHabits(items);
      },
      (err) => {
        console.error(err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.replace("/");
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name || !form.stoppedAt || !form.previousPerDay) {
      setError("Merci de remplir tous les champs.");
      return;
    }

    const previousPerDayNumber = Number(form.previousPerDay.replace(",", "."));
    if (Number.isNaN(previousPerDayNumber) || previousPerDayNumber <= 0) {
      setError("La consommation avant doit être un nombre positif.");
      return;
    }

    if (!user) {
      setError("Tu dois être connecté pour ajouter une habitude.");
      return;
    }

    setSaving(true);
    try {
      const habitsRef = collection(db, "habits");
      await addDoc(habitsRef, {
        name: form.name,
        stoppedAt: new Date(form.stoppedAt),
        previousPerDay: previousPerDayNumber,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });

      setForm({ name: "", stoppedAt: "", previousPerDay: "" });
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'ajout de l'habitude.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (habit: Habit) => {
    setEditingId(habit.id);
    setEditForm({
      name: habit.name,
      previousPerDay: String(habit.previousPerDay),
    });
    setError(null);
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateHabit = async (habitId: string) => {
    if (!user) return;

    if (!editForm.name || !editForm.previousPerDay) {
      setError("Merci de remplir tous les champs de modification.");
      return;
    }

    const previousPerDayNumber = Number(
      editForm.previousPerDay.replace(",", ".")
    );
    if (Number.isNaN(previousPerDayNumber) || previousPerDayNumber <= 0) {
      setError("La consommation avant doit être un nombre positif.");
      return;
    }

    try {
      const habitRef = doc(db, "habits", habitId);
      await updateDoc(habitRef, {
        name: editForm.name,
        previousPerDay: previousPerDayNumber,
      });
      setEditingId(null);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la mise à jour.");
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (!user) return;

    const confirmDelete = window.confirm(
      "Supprimer ce compteur ? Cette action est définitive."
    );
    if (!confirmDelete) return;

    try {
      const habitRef = doc(db, "habits", habitId);
      await deleteDoc(habitRef);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la suppression.");
    }
  };

  const getDaysSince = (stoppedAt: Date) => {
    const stopDate = stoppedAt;
    const now = new Date();
    const diffMs = now.getTime() - stopDate.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return days < 0 ? 0 : days;
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Chargement de ton tableau...
        </p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 md:px-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Ton tableau DayAdict
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Salut {user.displayName || user.email}, on va suivre tes habitudes au jour le jour.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Se déconnecter
          </Button>
        </header>

        <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-base md:text-lg font-medium">
            Ajoute une habitude à suivre
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl">
            Exemple : tu arrêtes de fumer. Dis-nous depuis quand tu as arrêté
            et combien tu fumais avant, et on calcule pour toi le compteur de
            jours sans.
          </p>

          <form className="grid gap-4 md:grid-cols-3" onSubmit={handleCreateHabit}>
            <div className="md:col-span-1 flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Habitude / addiction
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Ne pas fumer"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Date d&apos;arrêt
              </label>
              <input
                type="date"
                name="stoppedAt"
                value={form.stoppedAt}
                onChange={handleChange}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Combien par jour avant
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                name="previousPerDay"
                value={form.previousPerDay}
                onChange={handleChange}
                placeholder="10"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              />
            </div>

            <div className="md:col-span-3 flex items-center justify-between gap-3 pt-1">
              {error && (
                <p className="text-xs text-destructive max-w-xs">{error}</p>
              )}
              <Button type="submit" size="sm" disabled={saving} className="ml-auto">
                {saving ? "Ajout en cours..." : "Ajouter"}
              </Button>
            </div>
          </form>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-[0.15em]">
            Tes compteurs
          </h2>
          {habits.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Tu n&apos;as pas encore ajouté d&apos;habitude. Commence par en créer une
              juste au-dessus.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {habits.map((habit) => {
                const days = getDaysSince(habit.stoppedAt);
                return (
                  <div
                    key={habit.id}
                    className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-medium text-base">
                        {editingId === habit.id ? (
                          <input
                            name="name"
                            value={editForm.name}
                            onChange={handleEditChange}
                            className="h-8 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-ring/50 focus-visible:ring-[2px]"
                          />
                        ) : (
                          habit.name
                        )}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {days} jour{days > 1 ? "s" : ""} sans
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <span>Avant :</span>
                        {editingId === habit.id ? (
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            name="previousPerDay"
                            value={editForm.previousPerDay}
                            onChange={handleEditChange}
                            className="h-7 w-20 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-ring/50 focus-visible:ring-[2px]"
                          />
                        ) : (
                          <span>{habit.previousPerDay}</span>
                        )}
                        <span>/ jour</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {editingId === habit.id ? (
                          <>
                            <Button
                              size="icon-sm"
                              variant="secondary"
                              onClick={() => handleUpdateHabit(habit.id)}
                            >
                              OK
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => setEditingId(null)}
                            >
                              Annuler
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => handleEditClick(habit)}
                            >
                              Modifier
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="destructive"
                              onClick={() => handleDeleteHabit(habit.id)}
                            >
                              Supprimer
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
