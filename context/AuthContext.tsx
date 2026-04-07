"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { 
  auth, 
  db, 
  onAuthStateChanged, 
  doc, 
  getDoc,
  updateDoc,
  signOut,
  type FirebaseUser 
} from "@/lib/firebase";
import { clearAuthCookies, getAuthCookies } from "@/lib/auth";
import type { User } from "@/types";

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (uid: string) => {
    try {
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        setUser(userData);
        
        await updateDoc(userDocRef, {
          lastLoginAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      
      if (fbUser) {
        await fetchUserData(fbUser.uid);
      } else {
        const cookies = getAuthCookies();
        if (cookies.userId) {
          await fetchUserData(cookies.userId);
        } else {
          setUser(null);
        }
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
      clearAuthCookies();
      localStorage.removeItem("sessionToken");
      setUser(null);
      setFirebaseUser(null);
      window.location.href = "/auth/login";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const refreshUser = async () => {
    if (firebaseUser) {
      await fetchUserData(firebaseUser.uid);
    } else {
      const cookies = getAuthCookies();
      if (cookies.userId) {
        await fetchUserData(cookies.userId);
      }
    }
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    isAdmin: user?.role === "admin",
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}