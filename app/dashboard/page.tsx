"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  LogOut, 
  Trash2, 
  Edit2, 
  Flame, 
  TrendingUp, 
  Clock,
  Calendar as CalendarIcon
} from "lucide-react";
import { auth, db, onAuthStateChanged, type User } from "@/lib/firebase";
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  Timestamp,
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
  const [form, setForm] = useState({ name: "", stoppedAt: "", previousPerDay: "" });
  const [saving, setSaving] = useState(false);

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
    const q = query(collection(db, "habits"), where("userId", "==", user.uid));
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => {
        const data = doc.data();
        const stoppedAtDate = data.stoppedAt instanceof Timestamp ? data.stoppedAt.toDate() : new Date(data.stoppedAt);
        return { id: doc.id, name: data.name, stoppedAt: stoppedAtDate, previousPerDay: data.previousPerDay } as Habit;
      });
      setHabits(items);
    });
  }, [user]);

  const getDaysSince = (date: Date) => {
    const diff = new Date().getTime() - date.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.stoppedAt || !user) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "habits"), {
        ...form,
        previousPerDay: Number(form.previousPerDay),
        stoppedAt: new Date(form.stoppedAt),
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      setForm({ name: "", stoppedAt: "", previousPerDay: "" });
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-500 animate-pulse">Chargement de votre univers...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Flame className="text-white w-5 h-5" fill="white" />
            </div>
            <span className="font-bold text-lg hidden sm:block">DayAdict</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 hidden md:block italic">&quot;{user?.displayName || "Champion"}&quot;</span>
            <Button variant="ghost" size="sm" onClick={() => auth.signOut()} className="text-slate-500 hover:text-red-600">
              <LogOut className="w-4 h-4 mr-2" /> Quitter
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="text-orange-500 w-5 h-5" />
            </div>
            <p className="text-slate-500 text-sm font-medium">Habitudes suivies</p>
            <p className="text-3xl font-bold text-slate-900">{habits.length}</p>
          </div>
          <div className="bg-indigo-600 p-6 rounded-3xl shadow-lg shadow-indigo-100 text-white md:col-span-2 relative overflow-hidden">
             <div className="relative z-10">
                <p className="opacity-80 text-sm font-medium">Total de jours cumulés</p>
                <p className="text-4xl font-black mt-1">
                  {habits.reduce((acc, h) => acc + getDaysSince(h.stoppedAt), 0)} Jours
                </p>
             </div>
             <Flame className="absolute -right-5 -bottom-5 w-40 h-40 opacity-10 rotate-12" fill="white" />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Formulaire de gauche */}
          <aside className="lg:col-span-1">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 sticky top-24">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" /> Nouvel Objectif
              </h2>
              <form onSubmit={handleCreateHabit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Nom</label>
                  <input 
                    placeholder="ex: Cigarettes, Sucre..." 
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Date de fin</label>
                  <div className="relative">
                    <input 
                      type="date" 
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={form.stoppedAt}
                      onChange={e => setForm({...form, stoppedAt: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Conso/jour avant</label>
                  <input 
                    type="number" 
                    placeholder="10" 
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={form.previousPerDay}
                    onChange={e => setForm({...form, previousPerDay: e.target.value})}
                  />
                </div>
                <Button className="w-full rounded-xl h-12 bg-indigo-600 hover:bg-indigo-700 font-bold" disabled={saving}>
                  {saving ? "Création..." : "Lancer le compteur"}
                </Button>
              </form>
            </div>
          </aside>

          {/* Liste des habitudes */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Mes victoires</h2>
            {habits.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Aucun compteur actif pour le moment.</p>
              </div>
            ) : (
              habits.map((habit) => (
                <HabitCard 
                  key={habit.id} 
                  habit={habit} 
                  days={getDaysSince(habit.stoppedAt)}
                  onDelete={() => { /* Ta fonction delete */ }}
                />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function HabitCard({ habit, days, onDelete }: { habit: Habit, days: number, onDelete: () => void }) {
  return (
    <div className="group bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center ${days > 0 ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'}`}>
            <span className="text-xl font-black leading-none">{days}</span>
            <span className="text-[10px] font-bold uppercase mt-1">Jours</span>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">{habit.name}</h3>
            <p className="text-sm text-slate-400 flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" /> Depuis le {habit.stoppedAt.toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-indigo-600">
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} className="h-9 w-9 text-slate-400 hover:text-red-600">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Barre de progression visuelle (optionnelle) */}
      <div className="mt-6 flex items-center justify-between text-xs font-bold text-slate-400">
        <div className="flex items-center gap-2">
          <span className="bg-slate-100 px-2 py-1 rounded text-slate-600">
            Impact : {Math.round(days * habit.previousPerDay)} évités
          </span>
        </div>
        <div className="text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
          Série en cours 🔥
        </div>
      </div>
    </div>
  );
}