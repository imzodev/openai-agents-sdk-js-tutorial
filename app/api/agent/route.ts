import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // For now, just return a static response
    return NextResponse.json({ message: "Hello world" });
  } catch (error) {
    console.error('Agent error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
