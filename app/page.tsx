"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  auth,
  googleProvider,
  signInWithPopup,
  onAuthStateChanged,
  type User,
} from "@/lib/firebase";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [loading, user, router]);

  const handleLogin = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setAuthError("Impossible de se connecter avec Google. Réessaie plus tard.");
      console.error(error);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error(error);
    }
  };

  const isAuthenticated = !!user;

  return (
    <main className="min-h-screen bg-linear-to-b from-background to-muted flex items-center justify-center px-4">
      <div className="max-w-3xl w-full bg-card border border-border rounded-2xl shadow-lg p-8 md:p-10 flex flex-col gap-8">
        <section className="space-y-4">
          <p className="text-sm font-medium text-primary uppercase tracking-[0.2em]">
            DayAdict
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold leading-tight">
            Une mini routine pour suivre tes habitudes au quotidien.
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-xl">
            Chaque jour, tu coches si tu as tenu ton objectif. Pas de jugement,
            juste un tableau simple pour t&apos;aider à garder le cap et voir tes
            progrès jour après jour.
          </p>
        </section>

        <section className="space-y-4">
          {!isAuthenticated && (
            <div className="space-y-3">
              <h2 className="text-lg font-medium">
                Commence par créer ton espace sécurisé
              </h2>
              <p className="text-sm text-muted-foreground">
                Connecte-toi avec Google pour sauvegarder tes journées sur ton
                compte. Tes données restent privées et liées à ton profil.
              </p>
              <Button
                onClick={handleLogin}
                className="mt-2 flex items-center gap-2"
                size="lg"
              >
                <span>Continuer avec Google</span>
              </Button>
              {authError && (
                <p className="text-sm text-destructive mt-2">{authError}</p>
              )}
              {loading && !authError && (
                <p className="text-xs text-muted-foreground">
                  Vérification de ta session en cours...
                </p>
              )}
            </div>
          )}

          {isAuthenticated && user && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Connecté en tant que
                  </p>
                  <p className="font-medium text-base">
                    {user.displayName || user.email}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                >
                  Se déconnecter
                </Button>
              </div>

              <div className="mt-2 rounded-xl border border-dashed border-border bg-muted/60 p-4 space-y-2">
                <p className="text-sm font-medium">Ton tableau d&apos;habitudes arrive 👀</p>
                <p className="text-xs text-muted-foreground">
                  Ici, tu pourras bientôt ajouter une habitude (par exemple
                  &quot;ne pas fumer&quot;) et cocher chaque jour si tu as tenu.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
