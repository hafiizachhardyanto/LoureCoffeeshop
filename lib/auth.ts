import { db, collection, query, where, getDocs, doc, getDoc, updateDoc } from "@/lib/firebase";
import type { User } from "@/types";

export async function validateSession(sessionToken: string): Promise<User | null> {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("sessionToken", "==", sessionToken));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data() as Omit<User, "id">;
    return { id: userDoc.id, ...userData };
  } catch (error) {
    console.error("Session validation error:", error);
    return null;
  }
}

export function setAuthCookies(user: User & { sessionToken: string }): void {
  if (typeof window === "undefined") return;
  
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `sessionToken=${user.sessionToken}; expires=${expires}; path=/; secure; samesite=strict`;
  document.cookie = `userRole=${user.role}; expires=${expires}; path=/; secure; samesite=strict`;
  document.cookie = `userId=${user.id}; expires=${expires}; path=/; secure; samesite=strict`;
}

export function clearAuthCookies(): void {
  if (typeof window === "undefined") return;
  
  document.cookie = "sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

export function getAuthCookies(): { sessionToken?: string; userRole?: string; userId?: string } {
  if (typeof window === "undefined") return {};
  
  const cookies = document.cookie.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=");
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  
  return {
    sessionToken: cookies.sessionToken,
    userRole: cookies.userRole,
    userId: cookies.userId,
  };
}