import { db } from '@/firebase/admin';
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export async function POST(request: Request) {
    try {
        console.log('🔄 Received regenerate feedback request');
        const { interviewId, userId } = await request.json();

        console.log('📝 Regenerating feedback for interview:', interviewId, 'user:', userId);

        if (!interviewId) {
            return Response.json({
                success: false,
                error: 'Interview ID is required'
            }, { status: 400 });
        }

        // Fetch the interview
        const interviewDoc = await db.collection('interviews').doc(interviewId).get();
        
        if (!interviewDoc.exists) {
            return Response.json({
                success: false,
                error: 'Interview not found'
            }, { status: 404 });
        }

        const interviewData = interviewDoc.data();
        
        // Verify user owns this interview (if userId provided)
        if (userId && interviewData?.userId !== userId) {
            return Response.json({
                success: false,
                error: 'Unauthorized access to interview'
            }, { status: 403 });
        }

        if (!interviewData?.transcript || interviewData.transcript.length === 0) {
            return Response.json({
                success: false,
                error: 'No transcript found for this interview'
            }, { status: 400 });
        }

        // Re-generate feedback using the same AI logic as in save route
        const analysisPrompt = `You are an expert technical interviewer analyzing a completed interview. Based on the transcript, provide a comprehensive evaluation including intelligent scoring based on response quality, and extract all technologies discussed.

INTERVIEW DETAILS:
- Role: ${interviewData.role}
- Level: ${interviewData.level}
- Original Tech Stack: ${interviewData.techstack?.join(', ') || 'General'}
- Duration: ${interviewData.duration} minutes

TRANSCRIPT:
${interviewData.transcript.map((msg: any) => `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.content}`).join('\n')}

ANALYSIS INSTRUCTIONS:
1. INTELLIGENT SCORING: Analyze candidate responses for:
   - Technical accuracy and depth of knowledge
   - Communication clarity and structure
   - Problem-solving approach and logical thinking
   - Examples and practical experience mentioned
   - Confidence level and engagement
   - Understanding of best practices and industry standards

   Score each category based on actual response quality:
   - 95-100: Exceptional - Expert-level knowledge, clear explanations, excellent examples
   - 85-94: Excellent - Strong technical knowledge, good communication, solid examples
   - 75-84: Good - Adequate knowledge, decent communication, some practical insights
   - 65-74: Fair - Basic understanding, unclear explanations, limited examples
   - 55-64: Poor - Weak knowledge, confused responses, no practical insights
   - Below 55: Very Poor - Incorrect information, incoherent responses, major gaps

2. CONTEXTUAL NAMING: Generate a specific, descriptive interview name based on actual topics discussed:
   - Focus on main technologies and concepts covered
   - Include specific areas like "State Management", "Database Design", "API Development"
   - Examples: "React Hooks & Component Architecture", "Node.js Authentication & Security", "Full-Stack CRUD Application"

3. COMPREHENSIVE TECH EXTRACTION: Extract ALL technologies mentioned, including:
   - Programming languages (JavaScript, Python, Java, etc.)
   - Frameworks and libraries (React, Vue, Express, Django, etc.)
   - Databases (MongoDB, PostgreSQL, Redis, etc.)
   - Tools and platforms (Docker, AWS, Git, VS Code, etc.)
   - Concepts and methodologies (REST API, GraphQL, Microservices, etc.)

Please provide your evaluation in this JSON format:
{
  "interviewName": "Specific descriptive name based on actual conversation topics",
  "extractedTechStack": ["Complete list of all technologies, tools, and concepts mentioned"],
  "totalScore": (calculated as weighted average: Technical Knowledge 40%, Communication 25%, Problem Solving 25%, Clarity 10%),
  "categoryScores": [
    {"name": "Technical Knowledge", "score": (1-100), "comment": "Assessment of technical accuracy, depth, and expertise demonstrated"},
    {"name": "Communication Skills", "score": (1-100), "comment": "Clarity of explanations, structure of responses, listening skills"},
    {"name": "Problem Solving", "score": (1-100), "comment": "Logical approach, debugging skills, analytical thinking"},
    {"name": "Experience & Examples", "score": (1-100), "comment": "Real-world examples, practical experience, project insights"},
    {"name": "Engagement & Confidence", "score": (1-100), "comment": "Enthusiasm, confidence level, question-asking, cultural fit"}
  ],
  "strengths": ["Specific observable strengths from responses"],
  "areasForImprovement": ["Specific areas where responses were weak or incomplete"],
  "finalAssessment": "Comprehensive assessment highlighting key findings and overall impression",
  "interviewInsights": {
    "mainTopicsDiscussed": ["Key technical topics covered"],
    "skillLevel": "Assessment of candidate's actual skill level based on responses",
    "recommendedNext": "Suggested next steps or areas to focus on"
  }
}

IMPORTANT: Base scores STRICTLY on actual response quality. If a candidate gives vague, incorrect, or incomplete answers, reflect that with appropriately low scores. Only give high scores for genuinely impressive, detailed, and accurate responses.

Respond with only the JSON, no additional text.`;

        const { text: analysisResponse } = await generateText({
            model: google("gemini-2.0-flash-001"),
            prompt: analysisPrompt
        });

        console.log('✅ New analysis response received');
        
        let analysis;
        try {
            analysis = JSON.parse(analysisResponse.trim());
        } catch (parseError) {
            console.error('❌ Failed to parse AI response:', parseError);
            return Response.json({
                success: false,
                error: 'Failed to parse AI analysis response'
            }, { status: 500 });
        }

        // Update the interview with new analysis data
        const now = new Date().toISOString();
        await db.collection('interviews').doc(interviewId).update({
            role: analysis.interviewName,
            extractedTechStack: analysis.extractedTechStack, // Keep extracted tech stack separate
            score: analysis.totalScore,
            updatedAt: now
        });

        // Find and update existing feedback
        const feedbackQuery = db.collection('feedback')
            .where('interviewId', '==', interviewId)
            .limit(1);

        const feedbackSnapshot = await feedbackQuery.get();
        
        if (!feedbackSnapshot.empty) {
            const feedbackDoc = feedbackSnapshot.docs[0];
            await feedbackDoc.ref.update({
                ...analysis,
                updatedAt: now
            });
            
            console.log('✅ Feedback regenerated successfully');
            
            return Response.json({
                success: true,
                message: 'Feedback regenerated successfully',
                feedback: {
                    id: feedbackDoc.id,
                    ...analysis,
                    updatedAt: now
                }
            }, { status: 200 });
        } else {
            return Response.json({
                success: false,
                error: 'Original feedback not found'
            }, { status: 404 });
        }

    } catch (error) {
        console.error('❌ Error regenerating feedback:', error);
        return Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
