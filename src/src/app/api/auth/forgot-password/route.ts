import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = schema.parse(body);

    // TODO: Implement password reset flow
    // 1. Find user by email
    // 2. Generate reset token
    // 3. Send email via Resend
    // For now, always return success to prevent email enumeration
    console.warn(`[Auth] Password reset requested for: ${email}`);

    return NextResponse.json({
      message: "If an account exists with that email, a reset link has been sent.",
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 },
    );
  }
}
