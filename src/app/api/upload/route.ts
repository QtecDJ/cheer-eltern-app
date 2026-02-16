import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getActiveProfile } from "@/modules/profile-switcher";
import { v2 as cloudinary } from "cloudinary";

// Cloudinary Konfiguration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    // Early return: Session prüfen
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Nicht eingeloggt" },
        { status: 401 }
      );
    }

    const activeProfileId = getActiveProfile(session);

    const formData = await request.formData();
    const file = formData.get("file") as File;

    // Early return: Keine Datei
    if (!file) {
      return NextResponse.json(
        { error: "Keine Datei hochgeladen" },
        { status: 400 }
      );
    }

    // Early return: Dateityp prüfen
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Nur Bilder (JPG, PNG, WebP, GIF) erlaubt" },
        { status: 400 }
      );
    }

    // Early return: Dateigröße prüfen (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Datei zu groß (max. 5MB)" },
        { status: 400 }
      );
    }

    // Datei zu Base64 konvertieren
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    // Zu Cloudinary hochladen
    const result = await cloudinary.uploader.upload(base64, {
      folder: "eltern-app/profile-pictures",
      public_id: `user_${activeProfileId}`,
      overwrite: true,
      transformation: [
        { width: 400, height: 400, crop: "fill", gravity: "face" },
        { quality: "auto", fetch_format: "auto" },
      ],
    });

    return NextResponse.json({
      success: true,
      url: result.secure_url,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Fehler beim Hochladen" },
      { status: 500 }
    );
  }
}
