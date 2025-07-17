import { NextResponse } from "next/server";

export async function GET() {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID || "";
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
    
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      status: "OK",
      env_check: {
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
      },
      values: {
        nextAuthUrl: process.env.NEXTAUTH_URL || "NOT_SET",
        googleClientIdLength: clientId.length,
        googleClientSecretLength: clientSecret.length,
      }
    };

    // 安全地檢查格式
    if (clientId.length > 15) {
      diagnostics.values.googleClientIdPrefix = clientId.substring(0, 15) + "...";
      diagnostics.values.googleClientIdSuffix = "..." + clientId.substring(Math.max(0, clientId.length - 15));
      diagnostics.values.endsWithGoogleDomain = clientId.endsWith('.apps.googleusercontent.com');
    }

    if (clientSecret.length > 10) {
      diagnostics.values.googleClientSecretPrefix = clientSecret.substring(0, 10) + "...";
      diagnostics.values.startsWithGOCSPX = clientSecret.startsWith('GOCSPX-');
    }

    return NextResponse.json(diagnostics);
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json({
      error: "Debug endpoint failed",
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}