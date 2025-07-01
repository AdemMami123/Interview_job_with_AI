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
- Analyze their final answer and respond thoughtfully
- Acknowledge specific details they mentioned
- If their answer shows good understanding, praise it specifically
- If their answer lacks depth, ask a brief follow-up to help them elaborate
- Show genuine interest in their response
- Be encouraging and professional but honest about their answer quality
- Keep response natural and conversational (2-3 sentences max)
- Examples: 
  * For good answers: "That's excellent! The way you explained [specific detail] shows real depth of understanding."
  * For unclear answers: "Interesting approach! Could you quickly clarify what you meant by [specific part]?"
  * For basic answers: "I appreciate that perspective. That shows you understand the fundamentals well."

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
- First, analyze and respond specifically to what they just said
- Show that you're actively listening by mentioning specific details from their answer
- If their answer demonstrates good knowledge, acknowledge it specifically
- If their answer is vague or incomplete, ask a brief follow-up question to get more detail
- If they mention specific technologies, frameworks, or experiences, show interest
- React authentically to the quality of their response (impressed, concerned, curious, etc.)
- Then smoothly transition to the next question using natural language
- Keep the total response conversational and engaging (2-4 sentences total)
- Sound like a real human interviewer who is genuinely engaged

EXAMPLES OF GOOD RESPONSES:
- "I like how you mentioned [specific detail] - that shows you understand [concept]. Now let me ask about..."
- "Interesting! The way you handled [specific challenge] is exactly what we look for. Moving on to..."
- "Could you elaborate a bit more on [specific part]? I want to make sure I understand your approach before we continue."
- "That's a solid answer! Your experience with [technology] really comes through. Now I'm curious about..."

NEXT QUESTION TO ASK: "${nextQuestion}"

Your response should feel natural and show you're engaged with their specific answer, then transition smoothly to the next question.

Respond with just your natural interviewer response - no JSON formatting needed.`;
            }
        } else {
            // Regular conversational interview prompt (enhanced)
            prompt = `You are a professional job interviewer conducting a conversational interview. You should behave exactly like a human interviewer would - natural, engaging, and responsive to what the candidate says.

INTERVIEW CONTEXT:
- Role: ${interviewContext?.role || 'Software Developer'}
- Level: ${interviewContext?.level || 'Mid-level'}
- Tech Stack: ${interviewContext?.techStack || 'React, Node.js, TypeScript'}
- Conversation Round: ${interviewContext?.conversationCount || 1}

CONVERSATION SO FAR:
${conversationContext}

CURRENT CANDIDATE MESSAGE: "${message}"

INSTRUCTIONS:
- Analyze their response carefully and respond specifically to what they said
- Show active listening by referencing specific details they mentioned
- If they mention technologies, ask about their experience level or specific implementations
- If they describe a project or challenge, dig deeper with follow-up questions
- If their answer shows expertise, acknowledge it and explore further
- If their answer is unclear or basic, help them elaborate with guided questions
- Adapt your questioning style based on their responses (technical depth, communication style, etc.)
- Keep responses conversational and engaging (2-4 sentences max for voice)
- Sound genuinely interested and engaged, not scripted
- Build rapport while maintaining professionalism

RESPONSE STRATEGIES:
- For technical answers: "That's impressive! How did you handle [specific challenge]? What would you do differently?"
- For project descriptions: "Interesting project! What was the most challenging part? How did you overcome it?"
- For vague answers: "Could you walk me through a specific example? I'd love to hear more details."
- For good insights: "Exactly! That shows real understanding. Have you encountered similar situations?"

IMPORTANT: Your response should be natural speech that sounds good when spoken aloud. React authentically to their answer quality and show genuine curiosity about their experience.

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
