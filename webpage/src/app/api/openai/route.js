import { NextResponse } from 'next/server';
import { submitToOpenAI } from '../../../lib/openaiService';
import { checkUserAuth } from './client-auth';

/**
 * POST handler for OpenAI API requests
 * @param {Request} request - The incoming request object
 * @returns {NextResponse} The API response
 */
export async function POST(request) {
  try {
    // Check authentication without using middleware
    const authCheck = await checkUserAuth();
    if (!authCheck.isAuthenticated) {
      // For debugging, still allow the request but include auth info in response
      console.log('OpenAI API: User not authenticated:', authCheck.message);
      // Uncomment to enforce authentication:
      // return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const { promptText, variables } = await request.json();
    
    if (!promptText) {
      return NextResponse.json(
        { error: 'Prompt text is required' },
        { status: 400 }
      );
    }
    
    const response = await submitToOpenAI(promptText, variables || {});
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('API route error:', error);
    
    return NextResponse.json(
      { error: error.message || 'An error occurred processing your request' },
      { status: 500 }
    );
  }
}