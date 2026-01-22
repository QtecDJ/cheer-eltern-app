import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "./db";
import bcrypt from "bcryptjs";

const SESSION_COOKIE = "member_session";
const PUBLIC_SESSION_COOKIE = "member_session_public";

export interface SessionUser {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  email: string | null;
  teamId: number | null;
  teamName: string | null;
  userRole: string | null;
  coachTeamId: number | null;
}

// Hilfsfunktion zum Prüfen ob User Admin oder Trainer ist
export function isAdminOrTrainer(userRole: string | null): boolean {
  return userRole === "admin" || userRole === "trainer" || userRole === "coach";
}

// Passwort-Vergleich: unterstützt bcrypt-Hashes und Klartext-Passwörter
async function verifyPassword(inputPassword: string, storedHash: string): Promise<boolean> {
  // Prüfe ob es ein bcrypt-Hash ist (beginnt mit $2a$, $2b$ oder $2y$)
  if (storedHash.startsWith("$2")) {
    return bcrypt.compare(inputPassword, storedHash);
  }
  // Klartext-Vergleich für alte Passwörter
  return inputPassword === storedHash;
}

// Passwort hashen mit bcrypt
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Hilfsfunktion: Erzeuge Public Session Cookie Value
function buildPublicSessionCookie(session: SessionUser) {
  return JSON.stringify({
    userId: session.id,
    teamId: session.teamId,
    teamName: session.teamName,
    primaryRole: session.userRole,
  });
}

export async function login(firstName: string, lastName: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Finde das Mitglied über Vor- UND Nachnamen für eindeutige Identifikation
    const member = await prisma.member.findFirst({
      where: {
        firstName: {
          equals: firstName,
          mode: "insensitive",
        },
        lastName: {
          equals: lastName,
          mode: "insensitive",
        },
        status: "active",
      },
      include: {
        team: true,
      },
    });

    if (!member) {
      return { success: false, error: "Vorname, Nachname oder Passwort falsch" };
    }

    // Prüfe Passwort (falls vorhanden, sonst erstmaliger Login)
    if (member.passwordHash) {
      const isValid = await verifyPassword(password, member.passwordHash);
      if (!isValid) {
        return { success: false, error: "Vorname, Nachname oder Passwort falsch" };
      }
    } else {
      // Erstes Login - setze das Passwort (gehasht mit bcrypt)
      const hashedPassword = await hashPassword(password);
      await prisma.member.update({
        where: { id: member.id },
        data: { 
          passwordHash: hashedPassword,
          lastLogin: new Date(),
        },
      });
    }

    // Update lastLogin
    await prisma.member.update({
      where: { id: member.id },
      data: { lastLogin: new Date() },
    });

    // Erstelle Session
    const sessionData: SessionUser = {
      id: member.id,
      name: member.name,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      teamId: member.teamId,
      teamName: member.team?.name || null,
      userRole: member.userRole || null,
      coachTeamId: member.coachTeamId || null,
    };

    const cookieStore = await cookies();
    const sessionJson = JSON.stringify(sessionData);

    // Safe check: warn if cookie size approaches limits (avoid accidental breakage)
    try {
      const approxSize = Buffer.byteLength(sessionJson, 'utf8');
      if (approxSize > 3800) {
        console.warn('[Auth] Session cookie size approaching limit:', approxSize);
      }
    } catch (e) {
      // Buffer might not be available in some runtimes - ignore
    }

    cookieStore.set(SESSION_COOKIE, sessionJson, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 Tage
      path: "/",
    });
    // Setze das Public Session Cookie (NICHT httpOnly)
    cookieStore.set(PUBLIC_SESSION_COOKIE, buildPublicSessionCookie(sessionData), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return { success: true };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "Ein Fehler ist aufgetreten" };
  }
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(PUBLIC_SESSION_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE);
    
    if (!sessionCookie?.value) {
      return null;
    }

    return JSON.parse(sessionCookie.value) as SessionUser;
  } catch {
    return null;
  }
}

/**
 * @deprecated Candidate for removal/relocation. Kept for compatibility.
 */
// `requireAuth` moved to `src/deprecated/lib/auth.deprecated.ts` and removed
// to clean up unused exports.

// Session aktualisieren (z.B. nach Profil-Änderungen)
export async function updateSession(updates: Partial<SessionUser>): Promise<void> {
  const session = await getSession();
  if (!session) return;
  
  const newSession = { ...session, ...updates };
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, JSON.stringify(newSession), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}
