import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    
    // Rate limit: 10 attempts per 15 minutes per IP
    const { allowed: ipAllowed } = await checkRateLimit({
      key: `login-ip:${ip}`,
      limit: 10,
      windowSeconds: 900, // 15 minutes
    });
    
    if (!ipAllowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again in 15 minutes." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    await dbConnect();
    const user = await User.findOne({ email: email.toLowerCase() });

    // Rate limit per email: 5 failed attempts per 15 minutes
    if (user) {
      const { allowed: emailAllowed } = await checkRateLimit({
        key: `login-email:${email.toLowerCase()}`,
        limit: 5,
        windowSeconds: 900,
      });

      if (!emailAllowed) {
        return NextResponse.json(
          { error: "Too many failed login attempts for this email. Please try again in 15 minutes." },
          { status: 429 }
        );
      }
    }

    // Return generic error (don't reveal if email exists)
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  } catch (err) {
    console.error("Login check error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
