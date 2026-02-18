/**
 * Input Validation Schemas
 * 
 * Zentrale Sammlung aller Zod-Validation-Schemas für API-Requests
 */

import { z } from 'zod';

// ============================================================================
// ANNOUNCEMENT SCHEMAS
// ============================================================================

export const AnnouncementCreateSchema = z.object({
  title: z.string()
    .min(1, 'Titel ist erforderlich')
    .max(255, 'Titel darf maximal 255 Zeichen lang sein'),
  
  content: z.string()
    .min(1, 'Inhalt ist erforderlich')
    .max(50000, 'Inhalt ist zu lang'),
  
  category: z.enum(['news', 'event', 'training', 'info']).default('news'),
  
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  
  isPinned: z.boolean().optional().default(false),
  allowRsvp: z.boolean().optional().default(false),
  
  expiresAt: z.string()
    .datetime({ message: 'Ungültiges Datum-Format' })
    .optional()
    .nullable(),
  
  teamIds: z.array(z.number().int().positive())
    .optional()
    .default([]),
  
  imageUrl: z.string()
    .url({ message: 'Ungültige URL' })
    .optional()
    .nullable(),
});

export const AnnouncementUpdateSchema = AnnouncementCreateSchema.partial();

// ============================================================================
// AUTHENTICATION SCHEMAS
// ============================================================================

export const LoginSchema = z.object({
  firstName: z.string()
    .min(1, 'Vorname ist erforderlich')
    .max(100, 'Vorname zu lang'),
  
  lastName: z.string()
    .min(1, 'Nachname ist erforderlich')
    .max(100, 'Nachname zu lang'),
  
  password: z.string()
    .min(6, 'Passwort muss mindestens 6 Zeichen lang sein')
    .max(100, 'Passwort zu lang'),
});

export const PasswordUpdateSchema = z.object({
  currentPassword: z.string().min(1, 'Aktuelles Passwort erforderlich'),
  newPassword: z.string()
    .min(8, 'Neues Passwort muss mindestens 8 Zeichen lang sein')
    .max(100, 'Passwort zu lang')
    .regex(/[A-Z]/, 'Passwort muss mindestens einen Großbuchstaben enthalten')
    .regex(/[a-z]/, 'Passwort muss mindestens einen Kleinbuchstaben enthalten')
    .regex(/[0-9]/, 'Passwort muss mindestens eine Ziffer enthalten'),
});

// ============================================================================
// ATTENDANCE SCHEMAS
// ============================================================================

export const AttendanceCreateSchema = z.object({
  trainingId: z.number().int().positive(),
  memberId: z.number().int().positive(),
  status: z.enum(['present', 'absent', 'excused']).nullable(),
  notes: z.string().max(500, 'Notiz zu lang').optional(),
  reason: z.string().max(500, 'Grund zu lang').optional(),
});

// ============================================================================
// MESSAGE / TICKET SCHEMAS
// ============================================================================

export const MessageCreateSchema = z.object({
  subject: z.string()
    .min(1, 'Betreff ist erforderlich')
    .max(255, 'Betreff zu lang'),
  
  message: z.string()
    .min(1, 'Nachricht ist erforderlich')
    .max(10000, 'Nachricht zu lang'),
  
  target: z.string().max(100).optional(),
});

export const MessageReplySchema = z.object({
  body: z.string()
    .min(1, 'Antwort ist erforderlich')
    .max(10000, 'Antwort zu lang'),
});

export const MessageAssignSchema = z.object({
  assigneeId: z.number().int().positive().nullable(),
});

// ============================================================================
// TODO SCHEMAS
// ============================================================================

export const TodoCreateSchema = z.object({
  title: z.string()
    .min(1, 'Titel ist erforderlich')
    .max(255, 'Titel zu lang'),
  
  description: z.string()
    .max(10000, 'Beschreibung zu lang')
    .optional(),
  
  status: z.enum(['open', 'in_progress', 'done', 'blocked'])
    .optional()
    .default('open'),
  
  priority: z.enum(['low', 'normal', 'high', 'urgent'])
    .optional()
    .default('normal'),
  
  dueDate: z.string()
    .datetime()
    .optional()
    .nullable(),
  
  assigneeId: z.number().int().positive().optional().nullable(),
});

export const TodoUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(10000).optional(),
  status: z.enum(['open', 'in_progress', 'done', 'blocked']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  assigneeId: z.number().int().positive().optional().nullable(),
});

// ============================================================================
// POLL SCHEMAS
// ============================================================================

export const PollVoteSchema = z.object({
  optionIds: z.array(z.number().int().positive())
    .min(1, 'Mindestens eine Option muss ausgewählt werden'),
});

// ============================================================================
// RSVP SCHEMAS
// ============================================================================

export const RsvpCreateSchema = z.object({
  announcementId: z.number().int().positive(),
  status: z.enum(['accepted', 'declined', 'maybe']),
});

export const RsvpAttendanceSchema = z.object({
  attended: z.boolean().nullable(),
});

// ============================================================================
// PROFILE SCHEMAS
// ============================================================================

export const ProfileUpdateSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email('Ungültige E-Mail-Adresse').optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  birthDate: z.string().optional(),
  allergies: z.string().max(1000).optional().nullable(),
  diseases: z.string().max(1000).optional().nullable(),
  medications: z.string().max(1000).optional().nullable(),
  emergencyContact: z.string().max(200).optional().nullable(),
  emergencyPhone: z.string().max(50).optional().nullable(),
  emergencyContact2: z.string().max(200).optional().nullable(),
  emergencyPhone2: z.string().max(50).optional().nullable(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validiert Daten gegen ein Zod-Schema
 * 
 * @param schema - Zod-Schema
 * @param data - Zu validierende Daten
 * @returns Validierte Daten
 * @throws Error mit detaillierten Validierungsfehlern
 */
export function validateRequest<T>(schema: z.Schema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((e: z.ZodIssue) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      
      throw new Error(
        `Validierung fehlgeschlagen: ${errors.map((e: { field: string; message: string }) => `${e.field}: ${e.message}`).join(', ')}`
      );
    }
    throw error;
  }
}

/**
 * Validiert Daten und gibt ein Result-Objekt zurück
 * 
 * @param schema - Zod-Schema
 * @param data - Zu validierende Daten
 * @returns Result-Objekt mit success/error
 */
export function validateRequestSafe<T>(
  schema: z.Schema<T>, 
  data: unknown
): { success: true; data: T } | { success: false; error: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`);
      return { success: false, error: errors.join(', ') };
    }
    return { success: false, error: 'Unbekannter Validierungsfehler' };
  }
}
