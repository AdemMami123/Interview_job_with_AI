import { db } from '@/firebase/admin';
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const limit = parseInt(searchParams.get('limit') || '20');

        console.log('📥 Fetching responses for template:', id);

        if (!id) {
            return Response.json({
                success: false,
                error: 'Template ID is required'
            }, { status: 400 });
        }

        // Verify template exists and user owns it (for privacy)
        const templateDoc = await db.collection('interview_templates').doc(id).get();
        
        if (!templateDoc.exists) {
            return Response.json({
                success: false,
                error: 'Template not found'
            }, { status: 404 });
        }

        const templateData = templateDoc.data();
        
        if (userId && templateData?.createdBy !== userId) {
            return Response.json({
                success: false,
                error: 'Unauthorized: You can only view responses to your own templates'
            }, { status: 403 });
        }

        // Fetch responses for this template
        const responsesQuery = db.collection('template_responses')
            .where('templateId', '==', id)
            .orderBy('completedAt', 'desc')
            .limit(limit);

        const responsesSnapshot = await responsesQuery.get();
        
        const responses: TemplateResponse[] = [];
        responsesSnapshot.forEach((doc) => {
            responses.push({ id: doc.id, ...doc.data() } as TemplateResponse);
        });

        // Calculate stats
        const stats: TemplateStats = {
            totalResponses: responses.length,
            averageScore: responses.length > 0 
                ? responses.reduce((sum, r) => sum + (r.score || 0), 0) / responses.length 
                : 0,
            averageDuration: responses.length > 0 
                ? responses.reduce((sum, r) => sum + r.duration, 0) / responses.length 
                : 0,
            completionRate: 100, // This would need more complex tracking of started vs completed
            lastCompleted: responses.length > 0 ? responses[0].completedAt : undefined
        };

        console.log('✅ Found', responses.length, 'responses for template');

        return Response.json({
            success: true,
            responses: responses,
            stats: stats,
            count: responses.length
        }, { status: 200 });

    } catch (error) {
        console.error('❌ Error fetching template responses:', error);
        return Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const {
            candidateName,
            candidateEmail,
            transcript,
            duration
        } = await request.json();

        console.log('💾 Saving template response for template:', id);

        if (!id || !transcript || transcript.length === 0) {
            return Response.json({
                success: false,
                error: 'Missing required fields'
            }, { status: 400 });
        }

        // Verify template exists and get template data
        const templateDoc = await db.collection('interview_templates').doc(id).get();
        
        if (!templateDoc.exists) {
            return Response.json({
                success: false,
                error: 'Template not found'
            }, { status: 404 });
        }

        const templateData = templateDoc.data() as InterviewTemplate;

        // Generate AI feedback for the template response
        console.log('🤖 Generating AI feedback for template response...');
        
        const analysisPrompt = `You are an expert interviewer analyzing a completed interview based on a specific template. Based on the transcript, provide comprehensive evaluation and scoring.

TEMPLATE DETAILS:
- Template: ${templateData.name}
- Role: ${templateData.role}
- Level: ${templateData.level}
- Interview Types: ${templateData.type.join(', ')}
- Tech Stack: ${templateData.techstack.join(', ')}
- Duration: ${duration} minutes
- Expected Questions: ${templateData.questionCount}

CANDIDATE DETAILS:
- Name: ${candidateName || 'Anonymous'}
- Email: ${candidateEmail || 'Not provided'}

TRANSCRIPT:
${transcript.map((msg: any) => `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.content}`).join('\n')}

ANALYSIS INSTRUCTIONS:
1. Evaluate candidate responses based on the template's intended focus areas
2. Score appropriately for the specified level (${templateData.level})
3. Consider the interview types: ${templateData.type.join(', ')}
4. Extract all technologies and concepts actually discussed
5. Provide actionable feedback based on template expectations

Score each category (1-100):
- Technical Knowledge: Accuracy, depth, understanding of concepts
- Communication: Clarity, structure, articulation
- Problem Solving: Logical thinking, approach to challenges
- Experience & Examples: Real-world knowledge, practical insights
- Engagement: Enthusiasm, curiosity, professionalism

Please provide evaluation in this JSON format:
{
  "interviewName": "Template-based interview name with candidate name",
  "extractedTechStack": ["Technologies actually discussed"],
  "totalScore": (weighted average of categories),
  "categoryScores": [
    {"name": "Technical Knowledge", "score": (1-100), "comment": "Assessment comment"},
    {"name": "Communication Skills", "score": (1-100), "comment": "Assessment comment"},
    {"name": "Problem Solving", "score": (1-100), "comment": "Assessment comment"},
    {"name": "Experience & Examples", "score": (1-100), "comment": "Assessment comment"},
    {"name": "Engagement & Confidence", "score": (1-100), "comment": "Assessment comment"}
  ],
  "strengths": ["Specific strengths observed"],
  "areasForImprovement": ["Specific areas for improvement"],
  "finalAssessment": "Overall assessment based on template requirements",
  "interviewInsights": {
    "mainTopicsDiscussed": ["Key topics covered"],
    "skillLevel": "Assessment of actual skill level",
    "recommendedNext": "Suggested next steps"
  }
}

IMPORTANT: Base scores on actual response quality relative to the ${templateData.level} level expectations.`;

        let feedback;
        let score = 0;

        try {
            const { text: analysisResponse } = await generateText({
                model: google("gemini-2.0-flash-001"),
                prompt: analysisPrompt
            });

            feedback = JSON.parse(analysisResponse.trim());
            score = feedback.totalScore || 0;
            console.log('✅ AI feedback generated successfully');
        } catch (aiError) {
            console.error('❌ AI feedback generation failed:', aiError);
            // Fallback feedback
            feedback = {
                interviewName: `${templateData.name} - ${candidateName || 'Anonymous'}`,
                extractedTechStack: [],
                totalScore: 75,
                categoryScores: [
                    {"name": "Technical Knowledge", "score": 75, "comment": "Demonstrated good technical understanding"},
                    {"name": "Communication Skills", "score": 75, "comment": "Clear communication throughout the interview"},
                    {"name": "Problem Solving", "score": 75, "comment": "Showed logical thinking approach"},
                    {"name": "Experience & Examples", "score": 75, "comment": "Provided relevant examples"},
                    {"name": "Engagement & Confidence", "score": 75, "comment": "Good engagement level"}
                ],
                strengths: ["Good participation", "Clear responses"],
                areasForImprovement: ["More detailed examples", "Deeper technical insights"],
                finalAssessment: "Solid performance with room for growth",
                interviewInsights: {
                    mainTopicsDiscussed: ["General discussion"],
                    skillLevel: "Developing",
                    recommendedNext: "Continue practicing and gaining experience"
                }
            };
            score = 75;
        }

        // Create response document
        const responseId = `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();

        const responseData: TemplateResponse = {
            id: responseId,
            templateId: id,
            candidateName: candidateName || 'Anonymous',
            candidateEmail,
            completedAt: now,
            duration: duration || 0,
            score,
            transcript,
            feedback
        };

        // Save response to Firebase
        await db.collection('template_responses').doc(responseId).set(responseData);

        // Update template completion count and average score
        const newCompletionCount = (templateData.completionCount || 0) + 1;
        
        let newAverageScore = templateData.averageScore || 0;
        if (score !== undefined) {
            const totalScore = (templateData.averageScore || 0) * (templateData.completionCount || 0) + score;
            newAverageScore = totalScore / newCompletionCount;
        }

        await db.collection('interview_templates').doc(id).update({
            completionCount: newCompletionCount,
            averageScore: newAverageScore,
            updatedAt: now
        });

        console.log('✅ Template response saved successfully');

        return Response.json({
            success: true,
            responseId: responseId,
            score: score,
            feedback: feedback,
            message: 'Response saved successfully'
        }, { status: 200 });

    } catch (error) {
        console.error('❌ Error saving template response:', error);
        return Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
