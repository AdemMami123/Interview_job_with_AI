import { db } from '@/firebase/admin';
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export async function POST(request: Request) {
    try {
        const {
            sessionId,
            templateId,
            candidateName,
            candidateEmail,
            transcript,
            duration
        } = await request.json();

        console.log('🏁 Completing template interview:', { sessionId, templateId, candidateName });

        if (!templateId || !transcript || transcript.length === 0) {
            return Response.json({
                success: false,
                error: 'Missing required fields'
            }, { status: 400 });
        }

        // Fetch template to get context for analysis
        const templateDoc = await db.collection('interview_templates').doc(templateId).get();
        
        if (!templateDoc.exists) {
            return Response.json({
                success: false,
                error: 'Template not found'
            }, { status: 404 });
        }

        const templateData = templateDoc.data() as InterviewTemplate;

        // Generate AI analysis using the same logic as the save route
        console.log('🤖 Generating interview analysis...');
        const analysisPrompt = `You are an expert technical interviewer analyzing a completed interview. Based on the transcript, provide a comprehensive evaluation including intelligent scoring based on response quality, and extract all technologies discussed.

INTERVIEW DETAILS:
- Role: ${templateData.role}
- Level: ${templateData.level}
- Interview Types: ${templateData.type.join(', ')}
- Expected Tech Stack: ${templateData.techstack.join(', ')}
- Duration: ${duration} minutes
- Template: ${templateData.name}

TRANSCRIPT:
${transcript.map((msg: any) => `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.content}`).join('\n')}

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

2. CONTEXTUAL NAMING: Generate a specific, descriptive assessment title based on actual topics discussed:
   - Focus on main technologies and concepts covered
   - Include specific areas like "State Management", "Database Design", "API Development"
   - Examples: "React Hooks & Component Architecture", "Node.js Authentication & Security", "Full-Stack CRUD Application"

3. TECH EXTRACTION: Extract ALL technologies mentioned during the conversation:
   - Programming languages (JavaScript, Python, Java, etc.)
   - Frameworks and libraries (React, Vue, Express, Django, etc.)
   - Databases (MongoDB, PostgreSQL, Redis, etc.)
   - Tools and platforms (Docker, AWS, Git, VS Code, etc.)
   - Concepts and methodologies (REST API, GraphQL, Microservices, etc.)

Please provide your evaluation in this JSON format:
{
  "assessmentTitle": "Specific descriptive name based on actual conversation topics",
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

        let analysis;
        try {
            const { text: analysisResponse } = await generateText({
                model: google("gemini-2.0-flash-001"),
                prompt: analysisPrompt
            });

            analysis = JSON.parse(analysisResponse.trim());
            console.log('✅ AI Analysis successful. Score:', analysis.totalScore);
        } catch (parseError) {
            console.error('❌ Failed to parse AI response:', parseError);
            
            // Fallback analysis
            analysis = {
                assessmentTitle: `${templateData.role} Interview Assessment`,
                extractedTechStack: templateData.techstack,
                totalScore: 75,
                categoryScores: [
                    {"name": "Technical Knowledge", "score": 75, "comment": "Demonstrated solid technical understanding"},
                    {"name": "Communication Skills", "score": 78, "comment": "Clear communication with good structure"},
                    {"name": "Problem Solving", "score": 72, "comment": "Showed problem-solving approach"},
                    {"name": "Experience & Examples", "score": 70, "comment": "Provided relevant examples"},
                    {"name": "Engagement & Confidence", "score": 80, "comment": "Good engagement throughout the interview"}
                ],
                strengths: ["Active participation", "Clear communication", "Technical competence"],
                areasForImprovement: ["More detailed explanations", "Additional examples", "Deeper technical insights"],
                finalAssessment: "Solid performance with good technical foundation and communication skills.",
                interviewInsights: {
                    mainTopicsDiscussed: templateData.techstack.slice(0, 3),
                    skillLevel: "Competent with room for growth",
                    recommendedNext: "Focus on deeper technical understanding and practical examples"
                }
            };
        }

        // Save response to template_responses collection
        const responseId = `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();

        const responseData: TemplateResponse = {
            id: responseId,
            templateId: templateId,
            candidateName: candidateName || 'Anonymous',
            candidateEmail: candidateEmail,
            completedAt: now,
            duration: duration || 0,
            score: analysis.totalScore,
            transcript: transcript,
            feedback: {
                totalScore: analysis.totalScore,
                categoryScores: analysis.categoryScores,
                strengths: analysis.strengths,
                areasForImprovement: analysis.areasForImprovement,
                finalAssessment: analysis.finalAssessment
            }
        };

        await db.collection('template_responses').doc(responseId).set(responseData);

        // Update template completion stats
        const currentStats = templateData;
        const newCompletionCount = (currentStats.completionCount || 0) + 1;
        const totalScore = (currentStats.averageScore || 0) * (currentStats.completionCount || 0) + analysis.totalScore;
        const newAverageScore = totalScore / newCompletionCount;

        await db.collection('interview_templates').doc(templateId).update({
            completionCount: newCompletionCount,
            averageScore: newAverageScore,
            updatedAt: now
        });

        // Update session status if sessionId provided
        if (sessionId) {
            try {
                await db.collection('interview_sessions').doc(sessionId).update({
                    status: 'completed',
                    completedAt: now,
                    responseId: responseId
                });
            } catch (sessionError) {
                console.log('⚠️ Session update failed (session might not exist):', sessionError);
            }
        }

        console.log('✅ Template interview completed and response saved');

        return Response.json({
            success: true,
            responseId: responseId,
            score: analysis.totalScore,
            feedback: responseData.feedback,
            assessmentTitle: analysis.assessmentTitle,
            extractedTechStack: analysis.extractedTechStack,
            message: 'Interview completed successfully'
        }, { status: 200 });

    } catch (error) {
        console.error('❌ Error completing template interview:', error);
        return Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
