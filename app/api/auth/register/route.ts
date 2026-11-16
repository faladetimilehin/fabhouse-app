import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { dbConnect } from "@/lib/mongodb";
import User from "@/models/User";
import { sendEmail, welcomeEmail } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[a-z]/, "Must contain lowercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  role: z.enum(["buyer", "agent", "developer"]).default("buyer"), // Client can suggest, but we override
  phone: z.string().optional(),
  consent: z.literal(true, {
    message: "You must agree to the Privacy Policy and Terms of Service to register.",
  }),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const { allowed } = await checkRateLimit({ key: `register:${ip}`, limit: 8, windowSeconds: 3600 });
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many accounts created from this location. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { name, email, password, role, phone } = parsed.data;

    await dbConnect();

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    // SECURITY: Always create as "buyer" - agents must be manually verified by admin
    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const emailVerificationTokenHash = crypto.createHash("sha256").update(emailVerificationToken).digest("hex");

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: "buyer", // ALWAYS buyer - prevent privilege escalation
      phone,
      consentedToTermsAt: new Date(),
      isEmailVerified: false,
      emailVerificationTokenHash,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      planTier: "free",
    });

    // Send verification email
    const verifyUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${emailVerificationToken}&email=${encodeURIComponent(user.email)}`;
    
    await sendEmail({
      to: user.email,
      subject: "Verify your Fabhouse email",
      html: `
        <p>Hi ${user.name},</p>
        <p>Welcome to Fabhouse! Please verify your email to activate your account.</p>
        <p><a href="${verifyUrl}" style="background: #1a3a52; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email</a></p>
        <p>This link expires in 24 hours. If you didn't create this account, you can safely ignore this email.</p>
      `,
    }).catch(() => {});

    return NextResponse.json(
      { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        message: "Account created! Please check your email to verify your address." 
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
