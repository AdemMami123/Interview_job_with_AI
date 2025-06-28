import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export async function POST(request: Request) {
    try {
        console.log('📥 Received interview chat request');
        const { message, conversationHistory, interviewContext } = await request.json();
        console.log('📝 Request data:', { message, historyLength: conversationHistory?.length, interviewContext });
        
        // Build conversation context
        const conversationContext = conversationHistory.map((msg: any) => 
            `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.content}`
        ).join('\n');
        
        const prompt = `You are a professional job interviewer conducting a conversational interview. You should behave exactly like a human interviewer would - natural, engaging, and responsive to what the candidate says.

INTERVIEW CONTEXT:
- Role: ${interviewContext?.role || 'Software Developer'}
- Level: ${interviewContext?.level || 'Mid-level'}
- Tech Stack: ${interviewContext?.techStack || 'React, Node.js, TypeScript'}

CONVERSATION SO FAR:
${conversationContext}

CURRENT CANDIDATE MESSAGE: "${message}"

INSTRUCTIONS:
- Respond naturally like a human interviewer would
- Ask follow-up questions based on what they just said
- Show genuine interest in their responses
- Keep responses conversational and engaging (2-4 sentences max for voice)
- If this is early in the interview, focus on getting to know them
- If they mention specific technologies or experiences, ask about them in detail
- Be encouraging and professional
- Don't just follow a script - adapt to the conversation flow
- When they mention technologies, frameworks, or tools, explore their experience with them
- Ask about specific projects, challenges, and implementations

IMPORTANT: Your response should be natural speech that sounds good when spoken aloud. Avoid bullet points, long lists, or formal structures. Just talk like a real person would.

Respond with just your natural interviewer response - no JSON formatting needed.`;

        console.log('🤖 Sending request to Gemini...');
        const { text: response } = await generateText({
            model: google("gemini-2.0-flash-001"),
            prompt
        });

        console.log('✅ Gemini response received:', response.trim());
        
        return Response.json({
            success: true,
            response: response.trim()
        }, { status: 200 });
        
    } catch (error) {
        console.error('❌ Error in interview chat:', error);
        return Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
