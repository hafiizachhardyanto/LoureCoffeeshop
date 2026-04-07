import type { User } from "@/types";

export async function validateSession(sessionToken: string): Promise<User | null> {
  try {
    const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery`;
    
    const body = {
      structuredQuery: {
        from: [{ collectionId: "users" }],
        where: {
          fieldFilter: {
            field: { fieldPath: "sessionToken" },
            op: "EQUAL",
            value: { stringValue: sessionToken }
          }
        }
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (!result || !Array.isArray(result) || result.length === 0 || !result[0].document) {
      return null;
    }

    const userDoc = result[0].document;
    const userData = userDoc.fields;
    
    return {
      id: userDoc.name.split('/').pop() || '',
      name: userData.name?.stringValue || '',
      phone: userData.phone?.stringValue || '',
      email: userData.email?.stringValue || '',
      role: (userData.role?.stringValue as "user" | "admin" | "cashier") || "user",
      sessionToken: userData.sessionToken?.stringValue,
    } as User;
  } catch (error) {
    console.error("Session validation error:", error);
    return null;
  }
}

export function setAuthCookies(user: User): void {
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