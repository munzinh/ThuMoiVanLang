import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

interface Guest {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

const GUESTS_FILE = join(process.cwd(), "data", "guests.json");

function readGuests(): Guest[] {
  try {
    const content = readFileSync(GUESTS_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    return [];
  }
}

function writeGuests(guests: Guest[]): void {
  writeFileSync(GUESTS_FILE, JSON.stringify(guests, null, 2), "utf-8");
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
  const guests = readGuests();

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

  const guests = readGuests();
  const slug = generateSlug(name.trim());

  // Check if slug already exists
  let finalSlug = slug;
  let counter = 1;
  while (guests.some((g) => g.slug === finalSlug)) {
    finalSlug = `${slug}-${counter++}`;
  }

  const newGuest: Guest = {
    id: Date.now().toString(),
    name: name.trim(),
    slug: finalSlug,
    createdAt: new Date().toISOString(),
  };

  guests.push(newGuest);
  writeGuests(guests);

  return NextResponse.json(newGuest, { status: 201 });
}

// DELETE: remove guest by id
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const guests = readGuests();
  const filtered = guests.filter((g) => g.id !== id);

  if (filtered.length === guests.length) {
    return NextResponse.json({ error: "Guest not found" }, { status: 404 });
  }

  writeGuests(filtered);
  return NextResponse.json({ success: true });
}
