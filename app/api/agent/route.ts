import { NextResponse } from 'next/server';

type RequestBody = {
  query: string;
};

export async function POST(request: Request) {
  try {
    const { query } = (await request.json()) as RequestBody;
    
    // Log the incoming query
    console.log('Agent received query:', query);
    
    // For now, return a static response that includes the received query
    return NextResponse.json({ 
      message: `Hello! You asked: "${query}"` 
    });
    
  } catch (error) {
    console.error('Agent error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
