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

3. CONTEXTUAL NAMING: Generate a specific, descriptive interview name based on actual topics discussed:
   - Focus on main technologies and concepts covered
   - Include specific areas like "State Management", "Database Design", "API Development"
   - Examples: "React State Management Deep Dive", "Database Design & Optimization", "Full-Stack Authentication Implementation"

4. CRITICAL TECH EXTRACTION: Carefully analyze the transcript and extract ONLY technologies that were actually mentioned, discussed, or referenced during the conversation:
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

SCORING RATIONALE: For each category score, provide specific reasoning:
- What specific responses or behaviors led to this score?
- Which answers were strong/weak and why?
- What evidence supports this assessment?

IMPORTANT: Base scores STRICTLY on actual response quality and demonstrated competence. Low-quality, vague, or incorrect answers should receive appropriately low scores (50s-60s). Average performance should score in the 70s. Only exceptional, detailed, and accurate responses should score 85+.

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
            
            // Enhanced fallback analysis with more conservative default values
            analysis = {
                interviewName: `${role} Technical Interview - ${new Date().toLocaleDateString()}`,
                extractedTechStack: extractedFromTranscript.length > 0 ? extractedFromTranscript : [],
                totalScore: 65, // More conservative default - represents "Fair" performance
                categoryScores: [
                    {"name": "Technical Knowledge", "score": 63, "comment": "Demonstrated basic technical understanding. Responses showed some familiarity with concepts but lacked depth and specific examples."},
                    {"name": "Communication Skills", "score": 68, "comment": "Communication was generally clear but could benefit from more structured responses and better articulation of complex ideas."},
                    {"name": "Problem Solving", "score": 62, "comment": "Showed some problem-solving approach but responses indicated need for more systematic thinking and logical breakdown of problems."},
                    {"name": "Experience & Examples", "score": 60, "comment": "Limited practical examples provided. Responses suggested theoretical knowledge but minimal real-world application experience."},
                    {"name": "Engagement & Confidence", "score": 72, "comment": "Candidate showed good engagement and reasonable confidence level throughout the interview process."}
                ],
                strengths: ["Demonstrated engagement", "Showed basic understanding of fundamental concepts", "Maintained professional demeanor"],
                areasForImprovement: ["Provide more detailed technical explanations with specific examples", "Develop structured problem-solving methodology", "Gain more hands-on practical experience"],
                finalAssessment: "Performance indicates developing technical competency with solid foundational knowledge. Candidate shows potential but needs continued learning and practical application to advance to next level. Focus on deepening technical understanding and gaining more hands-on experience.",
                interviewInsights: {
                    mainTopicsDiscussed: extractedFromTranscript.slice(0, 3).length > 0 ? extractedFromTranscript.slice(0, 3) : ["General technical concepts"],
                    skillLevel: "Developing - Foundational knowledge with room for growth",
                    recommendedNext: "Focus on practical application, work on real projects, and deepen understanding of core technologies"
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
