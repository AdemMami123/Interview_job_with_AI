import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export async function POST(request: Request) {
    try {
        const { answer, currentQuestion, userId, questionIndex, totalQuestions } = await request.json();
        
        let prompt: string;
        
        if (questionIndex < totalQuestions - 1) {
            // Continue with next question
            prompt = `You are a professional interviewer conducting a real-time voice interview. The candidate just answered: "${answer}" to the question: "${currentQuestion}".

Your task:
1. First, provide a brief, natural acknowledgment of their answer (1-2 sentences). Be genuine and respond to what they actually said.
2. If their answer was interesting or needs clarification, ask a brief follow-up question (optional).
3. Then transition smoothly to the next question.

Keep your response conversational and natural, like a real interviewer would. Don't be robotic or overly formal.

Return your response in this exact JSON format:
{
    "feedback": "Your brief, natural acknowledgment here",
    "nextInstruction": "Great! Let's move on to the next question."
}

Make sure your feedback actually relates to what they said, not generic responses.`;
        } else {
            // End of interview
            prompt = `You are a professional interviewer. The candidate just answered: "${answer}" to the final question: "${currentQuestion}".

Your task:
1. Provide a brief, genuine acknowledgment of their final answer
2. Thank them professionally for their time
3. Let them know about next steps

Keep it warm but professional, like how a real interviewer would conclude.

Return your response in this exact JSON format:
{
    "feedback": "Brief acknowledgment of their final answer",
    "nextInstruction": "Thank you for taking the time to speak with me today. We'll be in touch soon with feedback. Have a great day!"
}

Make sure your feedback relates to what they actually said in their final answer.`;
        }

        const { text: response } = await generateText({
            model: google("gemini-2.0-flash-001"),
            prompt
        });

        // Clean the response - remove markdown code blocks if present
        let cleanResponse = response.trim();
        if (cleanResponse.startsWith('```json')) {
            cleanResponse = cleanResponse.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        } else if (cleanResponse.startsWith('```')) {
            cleanResponse = cleanResponse.replace(/^```\n?/, '').replace(/\n?```$/, '');
        }

        const parsedResponse = JSON.parse(cleanResponse);
        
        return Response.json({
            success: true,
            data: parsedResponse
        }, { status: 200 });
        
    } catch (error) {
        console.error('Error in interview continue:', error);
        return Response.json({
            success: false,
            error: 'An error occurred while processing your request.'
        }, { status: 500 });
    }
}
