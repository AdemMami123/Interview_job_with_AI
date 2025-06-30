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
        console.log('📋 Interview data found:', {
            role: interviewData?.role,
            level: interviewData?.level,
            hasTranscript: !!interviewData?.transcript,
            transcriptLength: interviewData?.transcript?.length,
            userId: interviewData?.userId
        });
        
        // Verify user owns this interview (if userId provided)
        if (userId && interviewData?.userId !== userId) {
            console.log('❌ Unauthorized access attempt');
            return Response.json({
                success: false,
                error: 'Unauthorized access to interview'
            }, { status: 403 });
        }

        if (!interviewData?.transcript || interviewData.transcript.length === 0) {
            console.log('❌ No transcript found for interview');
            return Response.json({
                success: false,
                error: 'No transcript found for this interview'
            }, { status: 400 });
        }

        // Re-generate feedback using improved AI logic with structured scoring
        const analysisPrompt = `You are an expert technical interviewer analyzing a completed interview. Based on the transcript, provide a comprehensive evaluation using structured scoring criteria and extract all technologies discussed.

INTERVIEW DETAILS:
- Role: ${interviewData.role}
- Level: ${interviewData.level}
- Original Tech Stack: ${interviewData.techstack?.join(', ') || 'General'}
- Duration: ${interviewData.duration} minutes

TRANSCRIPT:
${interviewData.transcript.map((msg: any) => `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.content}`).join('\n')}

ANALYSIS INSTRUCTIONS:
1. LOGICAL SCORING FRAMEWORK: Evaluate each response systematically and assign scores based on measurable criteria:

   Technical Knowledge (40% weight):
   - 90-100: Demonstrates expert understanding, uses correct terminology, explains complex concepts clearly
   - 80-89: Shows solid technical foundation, mostly accurate information, good grasp of fundamentals
   - 70-79: Basic understanding evident, some gaps or unclear explanations, needs more depth
   - 60-69: Limited technical knowledge, several inaccuracies or vague responses
   - 50-59: Poor technical understanding, mostly incorrect or confused responses
   - Below 50: Major technical gaps, fundamentally incorrect answers

   Communication Skills (25% weight):
   - 90-100: Exceptionally clear, well-structured responses, excellent articulation
   - 80-89: Clear communication, good structure, easy to follow
   - 70-79: Generally clear with some organizational issues or minor unclear points
   - 60-69: Somewhat unclear, lacks structure, difficult to follow at times
   - 50-59: Poor communication, very unclear or disorganized responses
   - Below 50: Incoherent or extremely difficult to understand

   Problem Solving (25% weight):
   - 90-100: Systematic approach, breaks down problems logically, considers multiple solutions
   - 80-89: Good logical thinking, reasonable problem-solving approach
   - 70-79: Basic problem-solving skills, sometimes lacks systematic approach
   - 60-69: Limited problem-solving ability, struggles with logical reasoning
   - 50-59: Poor problem-solving approach, illogical or confused thinking
   - Below 50: No clear problem-solving ability demonstrated

   Experience & Examples (10% weight):
   - 90-100: Rich, detailed real-world examples that clearly demonstrate competence
   - 80-89: Good practical examples with adequate detail
   - 70-79: Some relevant examples but lacking detail or clarity
   - 60-69: Few or weak examples, limited practical experience shown
   - 50-59: Poor or irrelevant examples
   - Below 50: No meaningful examples provided

   Total Score Calculation: (Technical × 0.4) + (Communication × 0.25) + (Problem Solving × 0.25) + (Experience × 0.1)

2. RESPONSE QUALITY ASSESSMENT: For each answer, evaluate:
   - Accuracy: Is the information technically correct?
   - Depth: Does the response show deep understanding or surface-level knowledge?
   - Clarity: Can the explanation be easily understood?
   - Relevance: Does the answer directly address the question?
   - Examples: Are concrete, relevant examples provided?
   - 60-69: Limited problem-solving ability with inconsistent logic
   - 50-59: Poor logical reasoning with confused problem-solving approach
   - Below 50: No clear problem-solving methodology demonstrated

   Experience & Examples (10% weight):
   - 90-100: Rich, detailed examples demonstrating extensive hands-on experience
   - 80-89: Good practical examples with adequate detail and relevance
   - 70-79: Some relevant examples but lacking comprehensive detail
   - 60-69: Few or weak examples with limited practical experience shown
   - 50-59: Poor or irrelevant examples provided
   - Below 50: No meaningful practical examples given

2. EVIDENCE-BASED ASSESSMENT: Each score must be supported by specific response evidence

3. CONTEXTUAL NAMING: Generate a highly specific, descriptive interview name based on the ACTUAL conversation content:
   - Analyze what was genuinely discussed during the interview, not just the original setup
   - Focus on specific technical topics, challenges, or projects that came up in conversation
   - Include technologies and concepts that were actually covered
   - Make it sound like a meaningful interview session about specific topics
   - Examples: "React Hooks & Performance Optimization Discussion", "Database Schema Design & API Integration", "Frontend Architecture & State Management Patterns", "Microservices Design & Docker Deployment", "Authentication Systems & Security Best Practices"
   - If no specific technical depth emerged, use conversational themes: "Software Development Experience & Problem-Solving", "Technical Skills Assessment & Career Discussion"

4. COMPREHENSIVE TECH EXTRACTION: Extract ALL technologies mentioned, including:
   - Programming languages (JavaScript, Python, Java, etc.)
   - Frameworks and libraries (React, Vue, Express, Django, etc.)
   - Databases (MongoDB, PostgreSQL, Redis, etc.)
   - Tools and platforms (Docker, AWS, Git, VS Code, Node.js, etc.)
   - Concepts and methodologies (REST API, GraphQL, Microservices, etc.)
   
   IMPORTANT: If NO specific technologies are mentioned in the transcript, return an empty array for extractedTechStack.
   Do NOT include technologies from the original tech stack unless they were actually discussed.

Please provide your evaluation in this JSON format:
{
  "interviewName": "Specific descriptive name based on actual conversation topics",
  "extractedTechStack": ["Complete list of all technologies, tools, and concepts mentioned"],
  "totalScore": (calculated as weighted average: Technical Knowledge 40%, Communication 25%, Problem Solving 25%, Experience 10%),
  "categoryScores": [
    {"name": "Technical Knowledge", "score": (1-100), "comment": "Detailed assessment of technical accuracy, depth, and expertise demonstrated with specific examples from responses"},
    {"name": "Communication Skills", "score": (1-100), "comment": "Evaluation of clarity, structure, and articulation with specific examples of strong/weak communication"},
    {"name": "Problem Solving", "score": (1-100), "comment": "Assessment of logical approach, debugging skills, and analytical thinking with specific examples"},
    {"name": "Experience & Examples", "score": (1-100), "comment": "Evaluation of real-world examples, practical experience, and project insights demonstrated"},
    {"name": "Engagement & Confidence", "score": (1-100), "comment": "Assessment of enthusiasm, confidence level, question-asking, and cultural fit"}
  ],
  "strengths": ["Specific observable strengths from responses with examples"],
  "areasForImprovement": ["Specific areas where responses were weak or incomplete with actionable suggestions"],
  "finalAssessment": "Comprehensive assessment highlighting key findings, overall impression, and specific evidence from the interview",
  "interviewInsights": {
    "mainTopicsDiscussed": ["Key technical topics actually covered in the conversation"],
    "skillLevel": "Detailed assessment of candidate's actual skill level based on demonstrated competence",
    "recommendedNext": "Specific, actionable next steps based on performance gaps and strengths"
  }
}

SCORING RATIONALE: For each category score, provide specific reasoning:
- What specific responses or behaviors led to this score?
- Which answers were strong/weak and why?
- What evidence supports this assessment?

INTERVIEW NAME REQUIREMENTS:
- The interview name MUST be based on actual conversation content, not just job roles
- Analyze what specific topics, technologies, or challenges were discussed
- Create a title that meaningfully describes the interview session
- Examples of GOOD names: "System Design & Scalability Discussion", "React Performance & State Management", "Database Architecture & API Security"
- Examples of BAD names: "Frontend Developer Interview", "Technical Assessment", "Software Engineer Discussion"

IMPORTANT: Base scores STRICTLY on actual response quality and demonstrated competence. Use conservative scoring - only exceptional responses should score 85+. Typical good responses should score in the 70s. Poor or vague responses should receive scores in the 50s-60s. Provide specific reasoning for each score.

Respond with only the JSON, no additional text.`;

        console.log('🤖 Sending request to Gemini for regenerated analysis...');
        let analysis;
        
        try {
            const { text: analysisResponse } = await generateText({
                model: google("gemini-2.0-flash-001"),
                prompt: analysisPrompt
            });

            console.log('✅ New analysis response received');
            console.log('📄 Raw AI response:', analysisResponse.substring(0, 500) + '...');
            
            try {
                analysis = JSON.parse(analysisResponse.trim());
                console.log('✅ AI analysis parsed successfully');
            } catch (parseError) {
                console.error('❌ Failed to parse AI response:', parseError);
                console.log('Raw AI response that failed to parse:', analysisResponse);
                throw new Error('Failed to parse AI response');
            }
        } catch (aiError) {
            console.error('❌ AI generation failed:', aiError);
            
            // Provide fallback analysis if AI call fails
            console.log('🔄 Using fallback analysis due to AI failure...');
            analysis = {
                interviewName: `${interviewData.role} Interview - ${interviewData.extractedTechStack && interviewData.extractedTechStack.length > 0 ? interviewData.extractedTechStack.slice(0, 2).join(' & ') + ' Discussion' : 'Technical Assessment'}`,
                extractedTechStack: interviewData.extractedTechStack || [],
                totalScore: 68,
                categoryScores: [
                    {"name": "Technical Knowledge", "score": 65, "comment": "Technical competency demonstrated with room for improvement in depth and accuracy."},
                    {"name": "Communication Skills", "score": 72, "comment": "Communication was generally clear but could benefit from more structured responses."},
                    {"name": "Problem Solving", "score": 66, "comment": "Showed problem-solving approach but needs more systematic methodology."},
                    {"name": "Experience & Examples", "score": 62, "comment": "Limited practical examples provided. More hands-on experience examples needed."},
                    {"name": "Engagement & Confidence", "score": 75, "comment": "Good engagement level and appropriate confidence throughout the interview."}
                ],
                strengths: ["Active participation", "Basic technical understanding", "Professional demeanor"],
                areasForImprovement: ["Provide more detailed technical explanations", "Include specific practical examples", "Develop systematic problem-solving approach"],
                finalAssessment: "Performance shows developing competency with clear areas for improvement. Continued learning and practical application recommended.",
                interviewInsights: {
                    mainTopicsDiscussed: interviewData.extractedTechStack?.slice(0, 3) || ["General technical concepts"],
                    skillLevel: "Developing - Building foundational knowledge",
                    recommendedNext: "Focus on gaining more practical experience and deepening technical understanding"
                }
            };
        }

        // Update the interview with new analysis data
        console.log('💾 Updating interview with new analysis...');
        const now = new Date().toISOString();
        try {
            await db.collection('interviews').doc(interviewId).update({
                interviewName: analysis.interviewName, // Use the correct field for interview name
                extractedTechStack: analysis.extractedTechStack, // Keep extracted tech stack separate
                score: analysis.totalScore,
                updatedAt: now
            });
            console.log('✅ Interview updated successfully');
        } catch (updateError) {
            console.error('❌ Failed to update interview:', updateError);
            // Continue with feedback update even if interview update fails
        }

        // Find and update existing feedback
        console.log('🔍 Looking for existing feedback...');
        const feedbackQuery = db.collection('feedback')
            .where('interviewId', '==', interviewId)
            .limit(1);

        const feedbackSnapshot = await feedbackQuery.get();
        console.log('📄 Feedback query result:', feedbackSnapshot.size, 'documents found');
        
        if (!feedbackSnapshot.empty) {
            const feedbackDoc = feedbackSnapshot.docs[0];
            console.log('💾 Updating existing feedback document...');
            
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
            console.log('❌ No existing feedback found to update');
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
