import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { connectToDatabase } from "@/lib/mongodb";
import GuestModel from "@/models/Guest";

interface Guest {
  id: string;
  name: string;
  slug: string;
  refusalCount: number;
  createdAt: string;
}

const GUESTS_FILE = join(process.cwd(), "data", "guests.json");
const TMP_GUESTS_FILE = join(tmpdir(), "guests.json");

let memoryGuestsCache: Guest[] | null = null;

function shouldUseLocalFallback() {
  return process.env.NODE_ENV !== "production" || process.env.VERCEL !== "1";
}

function readGuestsFile(): Guest[] {
  if (memoryGuestsCache) {
    return memoryGuestsCache;
  }
  try {
    if (existsSync(TMP_GUESTS_FILE)) {
      const content = readFileSync(TMP_GUESTS_FILE, "utf-8");
      memoryGuestsCache = JSON.parse(content).map((g: any) => ({
        ...g,
        refusalCount: g.refusalCount || 0,
      }));
      return memoryGuestsCache!;
    }
  } catch {
    // fallback
  }

  try {
    const content = readFileSync(GUESTS_FILE, "utf-8");
    memoryGuestsCache = JSON.parse(content).map((g: any) => ({
      ...g,
      refusalCount: g.refusalCount || 0,
    }));
    return memoryGuestsCache!;
  } catch {
    memoryGuestsCache = [];
    return [];
  }
}

function writeGuestsFile(guests: Guest[]): void {
  memoryGuestsCache = guests;
  try {
    writeFileSync(GUESTS_FILE, JSON.stringify(guests, null, 2), "utf-8");
  } catch {
    try {
      writeFileSync(TMP_GUESTS_FILE, JSON.stringify(guests, null, 2), "utf-8");
    } catch {
      // Memory fallback active
    }
  }
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// GET: fetch all guests OR single guest by slug
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");

  try {
    const conn = await connectToDatabase();
    if (conn) {
      if (slug) {
        const guest = await GuestModel.findOne({ slug }).lean();
        if (!guest) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json({
          id: guest.id,
          name: guest.name,
          slug: guest.slug,
          refusalCount: guest.refusalCount || 0,
          createdAt: guest.createdAt,
        });
      }

      const guests = await GuestModel.find({}).sort({ createdAt: -1 }).lean();
      return NextResponse.json(
        guests.map((g) => ({
          id: g.id,
          name: g.name,
          slug: g.slug,
          refusalCount: g.refusalCount || 0,
          createdAt: g.createdAt,
        }))
      );
    }
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    if (!shouldUseLocalFallback()) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }
  }

  // Fallback to file/memory storage in local development only
  const guests = readGuestsFile();
  if (slug) {
    const guest = guests.find((g) => g.slug === slug);
    if (!guest) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(guest);
  }

  return NextResponse.json(guests);
}

// POST: add new guest
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name } = body;

  if (!name || typeof name !== "string" || name.trim() === "") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const trimmedName = name.trim();
  const baseSlug = generateSlug(trimmedName);

  try {
    const conn = await connectToDatabase();
    if (conn) {
      let finalSlug = baseSlug;
      let counter = 1;
      while (await GuestModel.exists({ slug: finalSlug })) {
        finalSlug = `${baseSlug}-${counter++}`;
      }

      const id = Date.now().toString();
      const newGuestDoc = await GuestModel.create({
        id,
        name: trimmedName,
        slug: finalSlug,
        refusalCount: 0,
        createdAt: new Date(),
      });

      return NextResponse.json(
        {
          id: newGuestDoc.id,
          name: newGuestDoc.name,
          slug: newGuestDoc.slug,
          refusalCount: newGuestDoc.refusalCount,
          createdAt: newGuestDoc.createdAt,
        },
        { status: 201 }
      );
    }
  } catch (err) {
    console.error("MongoDB save failed:", err);
    if (!shouldUseLocalFallback()) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }
  }

  // Fallback to local storage in local development only
  const guests = readGuestsFile();
  let finalSlug = baseSlug;
  let counter = 1;
  while (guests.some((g) => g.slug === finalSlug)) {
    finalSlug = `${baseSlug}-${counter++}`;
  }

  const newGuest: Guest = {
    id: Date.now().toString(),
    name: trimmedName,
    slug: finalSlug,
    refusalCount: 0,
    createdAt: new Date().toISOString(),
  };

  guests.push(newGuest);
  writeGuestsFile(guests);

  return NextResponse.json(newGuest, { status: 201 });
}

// PATCH: increment refusalCount for a guest by slug or id
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const slug = body.slug || req.nextUrl.searchParams.get("slug");
  const id = body.id || req.nextUrl.searchParams.get("id");

  if (!slug && !id) {
    return NextResponse.json({ error: "Slug or ID required" }, { status: 400 });
  }

  try {
    const conn = await connectToDatabase();
    if (conn) {
      const query = slug ? { slug } : { id };
      const updated = await GuestModel.findOneAndUpdate(
        query,
        { $inc: { refusalCount: 1 } },
        { new: true }
      ).lean();

      if (updated) {
        return NextResponse.json({
          id: updated.id,
          name: updated.name,
          slug: updated.slug,
          refusalCount: updated.refusalCount,
        });
      }
    }
  } catch (err) {
    console.error("MongoDB update failed:", err);
    if (!shouldUseLocalFallback()) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }
  }

  // Fallback to local storage in local development only
  const guests = readGuestsFile();
  const guestIndex = guests.findIndex((g) => (slug ? g.slug === slug : g.id === id));
  if (guestIndex !== -1) {
    guests[guestIndex].refusalCount = (guests[guestIndex].refusalCount || 0) + 1;
    writeGuestsFile(guests);
    return NextResponse.json(guests[guestIndex]);
  }

  return NextResponse.json({ error: "Guest not found" }, { status: 404 });
}

// DELETE: remove guest by id
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  try {
    const conn = await connectToDatabase();
    if (conn) {
      const result = await GuestModel.deleteOne({ id });
      if (result.deletedCount > 0) {
        return NextResponse.json({ success: true });
      }
    }
  } catch (err) {
    console.error("MongoDB delete failed:", err);
    if (!shouldUseLocalFallback()) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }
  }

  // Fallback to local storage in local development only
  const guests = readGuestsFile();
  const filtered = guests.filter((g) => g.id !== id);

  if (filtered.length === guests.length) {
    return NextResponse.json({ error: "Guest not found" }, { status: 404 });
  }

  writeGuestsFile(filtered);
  return NextResponse.json({ success: true });
}
