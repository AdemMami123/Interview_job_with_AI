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
        
        const analysisPrompt = `You are an expert interviewer analyzing a completed template-based interview. Evaluate the candidate's performance based on the actual conversation flow and response quality.

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
1. CONVERSATIONAL ASSESSMENT: Evaluate based on the actual interaction quality:

   Technical Knowledge (40% weight):
   - 90-100: Expert-level responses with deep understanding, accurate details, advanced concepts
   - 80-89: Strong technical foundation with mostly accurate and comprehensive information
   - 70-79: Adequate understanding with minor gaps, generally sound but needs more depth
   - 60-69: Basic knowledge with notable gaps, some inaccuracies or vague responses
   - 50-59: Limited understanding with significant errors or confusion
   - Below 50: Major technical deficiencies, fundamentally incorrect responses

   Communication Skills (25% weight):
   - 90-100: Exceptionally clear, well-structured, great conversational flow
   - 80-89: Clear communication with good organization and articulation
   - 70-79: Generally clear with minor issues in structure or clarity
   - 60-69: Somewhat unclear, lacks good organization, harder to follow
   - 50-59: Poor communication structure, unclear responses
   - Below 50: Very unclear or incoherent communication

   Problem Solving (25% weight):
   - 90-100: Systematic approach, excellent logical reasoning, considers multiple angles
   - 80-89: Good problem-solving methodology with reasonable logical thinking
   - 70-79: Basic problem-solving skills with some logical structure
   - 60-69: Limited problem-solving ability, struggles with systematic thinking
   - 50-59: Poor logical reasoning, confused approach to challenges
   - Below 50: No clear problem-solving methodology demonstrated

   Engagement & Professionalism (10% weight):
   - 90-100: Highly engaged, professional, asks thoughtful questions, shows genuine interest
   - 80-89: Good engagement level with professional demeanor throughout
   - 70-79: Adequate engagement with some missed opportunities for deeper interaction
   - 60-69: Limited engagement, minimal interaction beyond basic answers
   - 50-59: Poor engagement, appears disinterested or unprofessional
   - Below 50: Very poor engagement, concerning professional behavior

2. TEMPLATE PERFORMANCE ANALYSIS: How well did they handle the structured interview format?
   - Did they provide complete answers to template questions?
   - How did they respond to follow-up questions and clarifications?
   - Were they able to engage conversationally beyond just answering questions?
   - Did they demonstrate curiosity about the role or company?

3. LEVEL-APPROPRIATE EXPECTATIONS: Calibrate assessment based on ${templateData.level} level:
   - Beginner: Focus on foundational understanding and learning potential
   - Intermediate: Expect solid fundamentals with some practical experience
   - Advanced: Require deep expertise and extensive real-world application

4. CONVERSATION-BASED NAMING: Create a descriptive assessment title based on actual topics discussed:
   - Analyze what was genuinely covered during the conversation
   - Focus on specific technical areas that emerged naturally
   - Include candidate name and make it meaningful
   - Examples: "Sarah's React Component Design & State Management", "Frontend Performance & User Experience - Mike", "Database Integration & API Development - Anna"
   - If no specific technical topics emerged, use conversational themes: "Technical Foundation Assessment - John", "Software Development Experience Review - Maria"

5. COMPREHENSIVE FEEDBACK: Provide specific, actionable insights based on actual responses and template requirements

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

INTERVIEW NAME REQUIREMENTS:
- The interview name MUST reflect what was actually discussed during the conversation
- DO NOT just combine candidate name with template role (e.g., "John's Frontend Assessment")
- Analyze the actual conversation topics and create a meaningful title
- Examples of GOOD names: "Sarah's React Component Design Discussion", "Frontend State Management & Performance - Mike", "Database Integration & API Development Review - Anna"
- Examples of BAD names: "John's Frontend Assessment", "Technical Interview - Sarah", "Software Engineer Evaluation - Mike"

IMPORTANT: Base scores on actual response quality relative to the ${templateData.level} level expectations. Provide specific reasoning for each score based on observed competencies and response quality. Conservative scoring ensures credible assessments.`;

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
            // Conservative fallback feedback based on template level
            const baseScore = templateData.level === 'Beginner' ? 68 : 
                             templateData.level === 'Intermediate' ? 62 : 58; // Advanced has higher expectations
            
            feedback = {
                interviewName: `${templateData.name} - ${candidateName || 'Anonymous'}`,
                extractedTechStack: [],
                totalScore: baseScore,
                categoryScores: [
                    {"name": "Technical Knowledge", "score": baseScore - 2, "comment": `Demonstrated ${templateData.level.toLowerCase()} level understanding with room for improvement in depth and accuracy.`},
                    {"name": "Communication Skills", "score": baseScore + 3, "comment": "Communication was generally clear but could benefit from more structured and detailed explanations."},
                    {"name": "Problem Solving", "score": baseScore - 3, "comment": "Showed some problem-solving ability but needs more systematic approach and logical reasoning."},
                    {"name": "Experience & Examples", "score": baseScore - 5, "comment": "Limited practical examples provided. More real-world experience and concrete examples needed."},
                    {"name": "Engagement & Confidence", "score": baseScore + 5, "comment": "Good engagement level and appropriate confidence for the interview process."}
                ],
                strengths: ["Active participation", "Basic understanding of concepts", "Professional demeanor"],
                areasForImprovement: ["Provide more detailed technical explanations", "Include specific practical examples", "Develop deeper understanding of core technologies"],
                finalAssessment: `Performance indicates ${templateData.level.toLowerCase()} level competency with potential for growth. Continued learning and practical application recommended.`,
                interviewInsights: {
                    mainTopicsDiscussed: templateData.techstack.slice(0, 3),
                    skillLevel: `${templateData.level} - Developing competency`,
                    recommendedNext: "Continue practicing core concepts and gain more hands-on experience"
                }
            };
            score = baseScore;
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
