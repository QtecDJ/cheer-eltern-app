import { cookies } from "next/headers";
import { prisma } from "./db";
import bcrypt from "bcryptjs";

const SESSION_COOKIE = "eltern_session";

export interface SessionUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  childId: number;
  childName: string;
  teamId: number | null;
  teamName: string | null;
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
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Finde den Elternteil über die E-Mail
    const member = await prisma.member.findFirst({
      where: {
        email: email,
        status: "active",
      },
      include: {
        team: true,
      },
    });

    if (!member) {
      return { success: false, error: "E-Mail oder Passwort falsch" };
    }

    // Prüfe Passwort (falls vorhanden, sonst erstmaliger Login)
    if (member.passwordHash) {
      const isValid = await verifyPassword(password, member.passwordHash);
      if (!isValid) {
        return { success: false, error: "E-Mail oder Passwort falsch" };
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
      email: member.email || "",
      firstName: member.firstName,
      lastName: member.lastName,
      childId: member.id,
      childName: `${member.firstName} ${member.lastName}`,
      teamId: member.teamId,
      teamName: member.team?.name || null,
    };

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 Tage
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

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error("Nicht eingeloggt");
  }
  return session;
}
