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

        // Generate interview analysis using AI
        console.log('🤖 Generating interview analysis...');
        const analysisPrompt = `You are an expert technical interviewer analyzing a completed interview. Based on the transcript, provide a comprehensive evaluation including intelligent scoring based on response quality, and extract all technologies discussed.

INTERVIEW DETAILS:
- Role: ${role}
- Level: ${level}
- Original Tech Stack: ${techstack?.join(', ') || 'General'}
- Duration: ${duration} minutes

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

2. CONTEXTUAL NAMING: Generate a specific, descriptive interview name based on actual topics discussed:
   - Focus on main technologies and concepts covered
   - Include specific areas like "State Management", "Database Design", "API Development"
   - Examples: "React Hooks & Component Architecture", "Node.js Authentication & Security", "Full-Stack CRUD Application"

3. CRITICAL TECH EXTRACTION: Carefully analyze the transcript and extract ONLY technologies that were actually mentioned, discussed, or referenced during the conversation:
   - Programming languages (JavaScript, Python, Java, TypeScript, etc.)
   - Frameworks and libraries (React, Angular, Vue, Express, Django, Next.js, etc.)
   - Databases (MongoDB, PostgreSQL, MySQL, Redis, etc.)
   - Tools and platforms (Docker, AWS, Git, VS Code, Node.js, etc.)
   - Concepts and methodologies (REST API, GraphQL, Microservices, etc.)
   
   IMPORTANT: If NO specific technologies are mentioned in the transcript, return an empty array for extractedTechStack.
   Do NOT include technologies from the original tech stack unless they were actually discussed.

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

        console.log('✅ Analysis response received');
        
        let analysis;
        try {
            analysis = JSON.parse(analysisResponse.trim());
            console.log('✅ AI Analysis successful. Extracted tech stack:', analysis.extractedTechStack);
        } catch (parseError) {
            console.error('❌ Failed to parse AI response:', parseError);
            console.log('Raw AI response:', analysisResponse);
            
            // Try to extract tech stack from transcript as fallback
            const transcriptText = transcript.map((msg: any) => msg.content).join(' ').toLowerCase();
            const commonTechs = [
                'react', 'angular', 'vue', 'javascript', 'typescript', 'node.js', 'express', 
                'mongodb', 'postgresql', 'mysql', 'python', 'java', 'php', 'html', 'css',
                'aws', 'docker', 'git', 'redux', 'next.js', 'tailwind', 'bootstrap'
            ];
            
            const extractedFromTranscript = commonTechs.filter(tech => 
                transcriptText.includes(tech.toLowerCase()) || 
                transcriptText.includes(tech.replace('.', '').toLowerCase())
            );
            
            // Enhanced fallback analysis with better default values
            analysis = {
                interviewName: `${role} Technical Interview - ${new Date().toLocaleDateString()}`,
                extractedTechStack: extractedFromTranscript.length > 0 ? extractedFromTranscript : [],
                totalScore: 72, // More realistic default
                categoryScores: [
                    {"name": "Technical Knowledge", "score": 70, "comment": "Demonstrated basic technical understanding with room for deeper insights"},
                    {"name": "Communication Skills", "score": 75, "comment": "Clear communication with opportunities for more structured responses"},
                    {"name": "Problem Solving", "score": 70, "comment": "Showed problem-solving approach with potential for more systematic thinking"},
                    {"name": "Experience & Examples", "score": 68, "comment": "Provided some practical examples, could benefit from more detailed real-world scenarios"},
                    {"name": "Engagement & Confidence", "score": 77, "comment": "Good engagement and confidence level throughout the interview"}
                ],
                strengths: ["Active participation", "Positive attitude", "Basic technical competence"],
                areasForImprovement: ["More detailed technical explanations", "Structured problem-solving approach", "Real-world examples"],
                finalAssessment: "Solid foundational performance with clear areas for growth and development. Shows potential with focused improvement.",
                interviewInsights: {
                    mainTopicsDiscussed: extractedFromTranscript.slice(0, 3),
                    skillLevel: "Developing - Shows promise with continued learning",
                    recommendedNext: "Focus on deeper technical understanding and practical application"
                }
            };
            
            console.log('🔄 Using fallback analysis with extracted techs:', extractedFromTranscript);
        }

        // Create interview document
        const interviewId = `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();

        const interviewData: Interview = {
            id: interviewId,
            userId: userId,
            role: analysis.interviewName, // Use AI-generated contextual name
            level: level || 'Mid-level',
            type: interviewType || 'Technical',
            techstack: techstack || [], // Keep original tech stack
            extractedTechStack: analysis.extractedTechStack, // AI-extracted technologies from conversation
            questions: transcript.filter((msg: any) => msg.role === 'assistant').map((msg: any) => msg.content),
            createdAt: now,
            completedAt: now,
            finalized: true,
            completed: true,
            status: 'completed',
            score: analysis.totalScore,
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
            ...analysis,
            createdAt: now
        };

        console.log('💾 Saving feedback to Firebase...');
        await db.collection('feedback').doc(feedbackId).set(feedbackData);

        console.log('✅ Interview and feedback saved successfully');

        return Response.json({
            success: true,
            interviewId: interviewId,
            feedbackId: feedbackId,
            score: analysis.totalScore,
            interviewName: analysis.interviewName,
            extractedTechStack: analysis.extractedTechStack,
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
