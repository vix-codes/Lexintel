
import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    DATABASE_URL: process.env.DATABASE_URL ? 'loaded' : 'missing',
    SESSION_SECRET: process.env.SESSION_SECRET ? 'loaded' : 'missing',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'loaded' : 'missing',
  });
}

    
