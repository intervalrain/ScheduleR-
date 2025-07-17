import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";

export async function POST(request: NextRequest) {
  // 安全檢查 - 只允許在特定條件下執行
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.MIGRATION_SECRET || "migration-secret-2025";
  
  if (authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("Starting database migration...");
    
    // 執行 Prisma 遷移
    execSync("npx prisma migrate deploy", { 
      stdio: "inherit",
      env: process.env 
    });
    
    console.log("Database migration completed successfully");
    
    return NextResponse.json({ 
      message: "Migration completed successfully",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Migration failed:", error);
    
    return NextResponse.json(
      { 
        error: "Migration failed", 
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// 健康檢查端點
export async function GET() {
  return NextResponse.json({
    message: "Migration endpoint ready",
    timestamp: new Date().toISOString()
  });
}