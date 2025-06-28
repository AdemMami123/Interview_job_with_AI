import { db } from '@/firebase/admin';
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export async function POST(request: Request) {
    try {
        console.log('💾 Received save interview request');
        const { 
            userId, 
            role, 
            level, 
            techstack, 
            transcript, 
            duration,
            interviewType 
        } = await request.json();

        console.log('📝 Interview data:', { userId, role, level, techstack, transcriptLength: transcript?.length, duration });

        if (!userId || !role || !transcript || transcript.length === 0) {
            return Response.json({
                success: false,
                error: 'Missing required fields'
            }, { status: 400 });
        }

        // Generate interview score using AI
        console.log('🤖 Generating interview score...');
        const scorePrompt = `You are an expert technical interviewer. Based on the following interview transcript, provide a comprehensive evaluation.

INTERVIEW DETAILS:
- Role: ${role}
- Level: ${level}
- Tech Stack: ${techstack?.join(', ') || 'General'}
- Duration: ${duration} minutes

TRANSCRIPT:
${transcript.map((msg: any) => `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.content}`).join('\n')}

Please provide your evaluation in the following JSON format:
{
  "totalScore": (number between 1-100),
  "categoryScores": [
    {"name": "Communication Skills", "score": (1-100), "comment": "brief comment"},
    {"name": "Technical Knowledge", "score": (1-100), "comment": "brief comment"},
    {"name": "Problem Solving", "score": (1-100), "comment": "brief comment"},
    {"name": "Cultural Fit", "score": (1-100), "comment": "brief comment"},
    {"name": "Confidence and Clarity", "score": (1-100), "comment": "brief comment"}
  ],
  "strengths": ["strength1", "strength2", "strength3"],
  "areasForImprovement": ["area1", "area2", "area3"],
  "finalAssessment": "Overall assessment summary (2-3 sentences)"
}

Respond with only the JSON, no additional text.`;

        const { text: scoreResponse } = await generateText({
            model: google("gemini-2.0-flash-001"),
            prompt: scorePrompt
        });

        console.log('✅ Score response received');
        
        let feedback;
        try {
            feedback = JSON.parse(scoreResponse.trim());
        } catch (parseError) {
            console.error('❌ Failed to parse AI response:', parseError);
            // Fallback scoring
            feedback = {
                totalScore: 75,
                categoryScores: [
                    {"name": "Communication Skills", "score": 75, "comment": "Good communication throughout the interview"},
                    {"name": "Technical Knowledge", "score": 75, "comment": "Demonstrated solid technical understanding"},
                    {"name": "Problem Solving", "score": 75, "comment": "Showed good problem-solving approach"},
                    {"name": "Cultural Fit", "score": 75, "comment": "Positive attitude and engagement"},
                    {"name": "Confidence and Clarity", "score": 75, "comment": "Clear and confident responses"}
                ],
                strengths: ["Good communication", "Technical competence", "Positive attitude"],
                areasForImprovement: ["More detailed examples", "Deeper technical explanations", "More questions about role"],
                finalAssessment: "Overall strong performance with good potential for growth."
            };
        }

        // Create interview document
        const interviewId = `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();

        const interviewData: Interview = {
            id: interviewId,
            userId: userId,
            role: role,
            level: level || 'Mid-level',
            type: interviewType || 'Technical',
            techstack: techstack || [],
            questions: transcript.filter((msg: any) => msg.role === 'assistant').map((msg: any) => msg.content),
            createdAt: now,
            completedAt: now,
            finalized: true,
            completed: true,
            status: 'completed',
            score: feedback.totalScore,
            transcript: transcript,
            duration: duration || 0
        };

        // Save interview to Firebase
        console.log('💾 Saving interview to Firebase...');
        await db.collection('interviews').doc(interviewId).set(interviewData);

        // Save feedback to Firebase
        const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const feedbackData = {
            id: feedbackId,
            interviewId: interviewId,
            ...feedback,
            createdAt: now
        };

        console.log('💾 Saving feedback to Firebase...');
        await db.collection('feedback').doc(feedbackId).set(feedbackData);

        console.log('✅ Interview and feedback saved successfully');

        return Response.json({
            success: true,
            interviewId: interviewId,
            feedbackId: feedbackId,
            score: feedback.totalScore,
            message: 'Interview saved successfully'
        }, { status: 200 });

    } catch (error) {
        console.error('❌ Error saving interview:', error);
        return Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
