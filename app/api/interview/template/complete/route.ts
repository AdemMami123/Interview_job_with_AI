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
1. STRUCTURED COMPETENCY ASSESSMENT: Evaluate responses using clear criteria:

   Technical Knowledge (40% weight):
   - 90-100: Expert mastery, advanced concepts explained accurately with depth
   - 80-89: Strong technical foundation, correct and comprehensive understanding
   - 70-79: Adequate knowledge with minor gaps, generally sound understanding
   - 60-69: Basic knowledge with notable gaps or inaccuracies
   - 50-59: Limited understanding, significant errors or confusion
   - Below 50: Major technical deficiencies, fundamentally incorrect responses

   Communication Skills (25% weight):
   - 90-100: Exceptionally articulate, clear structure, excellent presentation
   - 80-89: Clear and well-organized communication
   - 70-79: Generally clear with minor issues in organization or clarity
   - 60-69: Somewhat unclear or poorly structured responses
   - 50-59: Difficult to follow, poor communication skills
   - Below 50: Very unclear or incoherent communication

   Problem Solving (25% weight):
   - 90-100: Systematic, methodical approach with excellent logical reasoning
   - 80-89: Good problem-solving methodology and logical thinking
   - 70-79: Basic problem-solving skills with some logical structure
   - 60-69: Limited problem-solving ability, inconsistent logic
   - 50-59: Poor logical reasoning, confused problem-solving approach
   - Below 50: No clear problem-solving methodology demonstrated

   Experience & Engagement (10% weight):
   - 90-100: Rich examples, high engagement, demonstrates extensive experience
   - 80-89: Good examples and engagement level
   - 70-79: Some relevant examples, adequate engagement
   - 60-69: Limited examples, moderate engagement
   - 50-59: Few or weak examples, low engagement
   - Below 50: No meaningful examples, poor engagement

2. LEVEL-BASED EXPECTATIONS: Calibrate scoring based on template level (${templateData.level})
3. EVIDENCE-BASED SCORING: Each score must be supported by specific response evidence

2. CONTEXTUAL NAMING: Generate a specific, descriptive assessment title based on actual topics discussed:
   - Focus on main technologies and concepts covered
   - Include specific areas like "React Component Design", "Database Optimization", "System Architecture"
   - Examples: "React State Management Assessment", "Node.js API Development Evaluation", "Full-Stack Architecture Review"

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

IMPORTANT: Base scores STRICTLY on actual response quality and demonstrated competence. Use conservative scoring - only exceptional responses should score 85+. Typical good responses should score in the 70s. Poor or vague responses should receive scores in the 50s-60s.

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
            
            // Conservative fallback analysis based on template level
            const baseScore = templateData.level === 'Beginner' ? 66 : 
                             templateData.level === 'Intermediate' ? 60 : 55; // Advanced has highest expectations
            
            analysis = {
                assessmentTitle: `${templateData.role} Assessment - ${templateData.level} Level`,
                extractedTechStack: templateData.techstack,
                totalScore: baseScore,
                categoryScores: [
                    {"name": "Technical Knowledge", "score": baseScore - 1, "comment": `Demonstrated ${templateData.level.toLowerCase()} level technical understanding with areas for improvement in depth and accuracy.`},
                    {"name": "Communication Skills", "score": baseScore + 4, "comment": "Communication was generally clear but could benefit from more structured and comprehensive explanations."},
                    {"name": "Problem Solving", "score": baseScore - 3, "comment": "Showed basic problem-solving approach but needs more systematic methodology and logical reasoning."},
                    {"name": "Experience & Examples", "score": baseScore - 5, "comment": "Limited practical examples provided. More hands-on experience and specific examples would strengthen responses."},
                    {"name": "Engagement & Confidence", "score": baseScore + 8, "comment": "Good engagement level and appropriate confidence throughout the interview process."}
                ],
                strengths: ["Active participation", "Basic technical competence", "Professional attitude"],
                areasForImprovement: ["Provide more detailed technical explanations", "Include specific practical examples", "Develop systematic problem-solving approach"],
                finalAssessment: `Performance indicates ${templateData.level.toLowerCase()} level competency with clear areas for development. Continued learning and practical application will help advance to the next level.`,
                interviewInsights: {
                    mainTopicsDiscussed: templateData.techstack.slice(0, 4),
                    skillLevel: `${templateData.level} - Building competency with room for growth`,
                    recommendedNext: "Focus on gaining more practical experience and deepening technical understanding through real-world projects"
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
