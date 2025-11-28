export type User = {
  id: string;
  external_code: string; // E-prefixed code
  name: string;
  role?: string; // e.g. e9999
  niche_id?: string;
  monthly_score?: number;
  age?: number;
  dob?: string;
  phone?: string;
  cin?: string;
  tutor?: {
    prenom?: string;
    nom?: string;
    type?: string;
    phone?: string;
  };
  permissions?: string[];
};

// Seed a default current user for the authenticated area.
function computeAge(dob?: string) {
  if (!dob) return undefined;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

export const currentUser: User & { dob?: string } = {
  id: "1",
  external_code: "CA3144",
  name: "Adnane Belkhadir",
  role: "e0001",
  niche_id: "default",
  monthly_score: 82,
  dob: "1996-11-02",
  age: computeAge("1996-11-02"),
  phone: "+212612989463",
  cin: "AB123456",
  tutor: {
    prenom: "Fatima",
    nom: "Belkhadir",
    type: "parent",
    phone: "+212600000000",
  },
  permissions: ["create_eval_report"],
};

export function useAuth() {
  // lightweight hook - prefer stored user in localStorage when present
  let stored: string | null = null;
  try {
    stored = typeof window !== 'undefined' ? localStorage.getItem('shm_user') : null;
  } catch (e) { stored = null; }
  const user = (stored ? JSON.parse(stored) : currentUser) as any;

  function hasPermission(name: string) {
    return !!(user.permissions || []).includes(name) || user.role === name || user.external_code === name;
  }

  function isAyaBucha() {
    return user.external_code === "E9999" || user.role === "e9999";
  }

  function isKechafNiche() {
    return user.niche_id === "kechaf" || user.role === "x5555";
  }

  function canAccessAll() {
    return user.role === "VV9876";
  }

  return { user, hasPermission, isAyaBucha, isKechafNiche, canAccessAll };
}
