"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Calendar, Bell, ShieldCheck, ArrowRight } from "lucide-react";
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
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-100">
      {/* Navigation Minimaliste */}
      <nav className="flex justify-between items-center px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <CheckCircle2 className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight">DayAdict</span>
        </div>
        {!user && (
          <Button variant="ghost" onClick={handleLogin} className="font-medium">
            Connexion
          </Button>
        )}
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-16 pb-24 text-center md:pt-32">
        <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-medium mb-8 animate-fade-in">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
          </span>
          Reprenez le contrôle aujourd&apos;hui
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-linear-to-b from-slate-900 to-slate-500">
          Un jour à la fois. <br />
          Une victoire après l&apos;autre.
        </h1>

        <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-600 mb-10 leading-relaxed">
          DayAdict vous aide à briser le cycle des addictions avec un suivi visuel simple, 
          des rappels bienveillants et une communauté qui vous soutient.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button 
            size="lg" 
            onClick={handleLogin}
            className="h-14 px-8 text-lg rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all hover:scale-105"
          >
            Commencer gratuitement <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <p className="text-sm text-slate-400">Aucune carte bancaire requise</p>
        </div>

        {/* Mockup / Visuel du Dashboard */}
        <div className="mt-20 relative max-w-5xl mx-auto">
          <div className="absolute -inset-1 bg-linear-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20"></div>
          <div className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 md:p-8">
             <div className="flex items-center gap-4 border-b border-slate-100 pb-6 mb-6">
                <div className="h-3 w-3 rounded-full bg-red-400"></div>
                <div className="h-3 w-3 rounded-full bg-amber-400"></div>
                <div className="h-3 w-3 rounded-full bg-green-400"></div>
                <div className="h-4 w-64 bg-slate-100 rounded-full ml-4"></div>
             </div>
             <div className="grid grid-cols-7 gap-2 md:gap-4">
                {[...Array(14)].map((_, i) => (
                  <div key={i} className={`aspect-square rounded-lg flex items-center justify-center ${i < 10 ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-300'}`}>
                    {i < 10 ? <CheckCircle2 className="w-6 h-6" /> : <div className="w-6 h-6 border-2 border-dashed border-slate-200 rounded-full" />}
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Features Grid */}
        <section className="grid md:grid-cols-3 gap-12 mt-32 text-left">
          <FeatureCard 
            icon={<Calendar className="w-6 h-6 text-indigo-600" />}
            title="Compteur de Streaks"
            description="Visualisez vos progrès jour après jour. Chaque case cochée est une étape vers votre nouvelle vie."
          />
          <FeatureCard 
            icon={<Bell className="w-6 h-6 text-indigo-600" />}
            title="Notifications Douces"
            description="Recevez des rappels personnalisés pour ne jamais oublier pourquoi vous avez commencé."
          />
          <FeatureCard 
            icon={<ShieldCheck className="w-6 h-6 text-indigo-600" />}
            title="100% Privé"
            description="Vos données vous appartiennent. Nous utilisons Firebase pour garantir une sécurité maximale."
          />
        </section>
      </main>

      <footer className="border-t border-slate-100 py-12 text-center text-slate-500 text-sm">
        © {new Date().getFullYear()} DayAdict - Fabriqué pour votre bien-être.
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors group">
      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-white shadow-sm transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}