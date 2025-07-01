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
        
        // Different prompts for template vs regular interviews
        let prompt = '';
        
        if (interviewContext?.isTemplateInterview) {
            // Template interview prompt
            const isLastQuestion = interviewContext.isLastQuestion;
            const nextQuestion = interviewContext.nextQuestion;
            const currentQuestionIndex = interviewContext.currentQuestionIndex;
            
            if (isLastQuestion) {
                prompt = `You are a professional job interviewer conducting a structured template interview. The candidate has just answered the final question.

INTERVIEW CONTEXT:
- Role: ${interviewContext?.role || 'Software Developer'}
- Level: ${interviewContext?.level || 'Mid-level'}
- Tech Stack: ${interviewContext?.techStack || 'General'}
- This was the FINAL question in the interview

CONVERSATION SO FAR:
${conversationContext}

CANDIDATE'S FINAL ANSWER: "${message}"

INSTRUCTIONS:
- This is the candidate's final answer in the interview
- Provide a thoughtful, acknowledging response to their final answer
- Show appreciation for their response 
- Keep it natural and conversational (2-3 sentences max)
- Be encouraging and professional
- Thank them for their time and responses
- Examples: "That's a really thoughtful approach! I can see you've put a lot of consideration into that.", "Excellent answer! Your experience really shows through in your responses."

Respond with just your natural interviewer response - no JSON formatting needed.`;
            } else {
                prompt = `You are a professional job interviewer conducting a structured template interview. The candidate has just answered a question and you need to respond naturally before moving to the next question.

INTERVIEW CONTEXT:
- Role: ${interviewContext?.role || 'Software Developer'}
- Level: ${interviewContext?.level || 'Mid-level'}
- Tech Stack: ${interviewContext?.techStack || 'General'}
- Current question: ${currentQuestionIndex + 1} of ${interviewContext.templateQuestions?.length || 'several'}
- Next question will be: "${nextQuestion}"

CONVERSATION SO FAR:
${conversationContext}

CANDIDATE'S CURRENT ANSWER: "${message}"

INSTRUCTIONS:
- First, respond naturally to what they just said (acknowledge, show interest, maybe ask a brief follow-up if their answer was vague)
- Then smoothly transition to the next question
- Keep the response conversational and engaging (2-4 sentences total)
- Sound like a real human interviewer who is genuinely interested
- Be encouraging and professional
- If their answer was particularly good, acknowledge it
- If their answer was brief or unclear, you can ask for a bit more detail before moving on
- Transition naturally to the next question using phrases like "That's interesting! Now I'd like to ask about...", "Great answer! Let me ask you about something else...", "I can see you have experience there. Moving on to..."

NEXT QUESTION TO ASK: "${nextQuestion}"

Your response should acknowledge their answer AND ask the next question in a natural, conversational way.

Respond with just your natural interviewer response - no JSON formatting needed.`;
            }
        } else {
            // Regular conversational interview prompt (existing)
            prompt = `You are a professional job interviewer conducting a conversational interview. You should behave exactly like a human interviewer would - natural, engaging, and responsive to what the candidate says.

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
        }

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
