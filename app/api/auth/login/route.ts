import { NextRequest, NextResponse } from "next/server";
import { authenticateServerUser } from "@/lib/security/server-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body || {};

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { error: "Please enter your email address" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || !password) {
      return NextResponse.json(
        { error: "Please enter your password" },
        { status: 400 }
      );
    }

    const { user, token } = authenticateServerUser(email, password);

    return NextResponse.json({
      success: true,
      user,
      token
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid credentials";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
