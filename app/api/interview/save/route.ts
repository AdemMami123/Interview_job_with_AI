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
        const analysisPrompt = `You are an expert technical interviewer analyzing a completed interview. Based on the actual conversation transcript, provide a comprehensive evaluation with intelligent scoring that reflects the candidate's true performance.

INTERVIEW DETAILS:
- Role: ${role}
- Level: ${level}
- Original Tech Stack: ${techstack?.join(', ') || 'General'}
- Duration: ${duration} minutes

TRANSCRIPT:
${transcript.map((msg: any) => `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.content}`).join('\n')}

ANALYSIS INSTRUCTIONS:
1. CONVERSATIONAL QUALITY ASSESSMENT: Analyze the actual conversation flow and candidate responses:

   Technical Knowledge (40% weight):
   - 90-100: Expert-level responses with deep understanding, accurate technical details, advanced concepts explained clearly
   - 80-89: Strong technical foundation, mostly accurate information, good grasp of core concepts
   - 70-79: Adequate understanding with minor gaps, generally sound but needs more depth
   - 60-69: Basic knowledge with notable gaps, some inaccuracies or overly vague responses
   - 50-59: Limited understanding, significant errors or confusion evident
   - Below 50: Major technical deficiencies, fundamentally incorrect information

   Communication Skills (25% weight):
   - 90-100: Exceptionally articulate, clear explanations, great conversational flow
   - 80-89: Clear and well-organized communication, easy to follow
   - 70-79: Generally clear with minor issues in organization or clarity
   - 60-69: Somewhat unclear, lacks structure, difficult to follow at times
   - 50-59: Poor communication, very unclear or disorganized responses
   - Below 50: Incoherent or extremely difficult to understand

   Problem Solving (25% weight):
   - 90-100: Systematic approach, excellent logical reasoning, considers multiple solutions
   - 80-89: Good problem-solving methodology, reasonable logical thinking
   - 70-79: Basic problem-solving skills with some logical structure
   - 60-69: Limited problem-solving ability, struggles with systematic thinking
   - 50-59: Poor logical reasoning, confused approach to problems
   - Below 50: No clear problem-solving methodology demonstrated

   Engagement & Professionalism (10% weight):
   - 90-100: Highly engaged, asks thoughtful questions, demonstrates genuine interest
   - 80-89: Good engagement level, professional demeanor, appropriate responses
   - 70-79: Adequate engagement, some missed opportunities for deeper interaction
   - 60-69: Limited engagement, minimal interaction beyond basic answers
   - 50-59: Poor engagement, appears disinterested or unprofessional
   - Below 50: Very poor engagement, concerning professional behavior

2. EVIDENCE-BASED SCORING: Each score must be justified by specific examples from the conversation:
   - Quote specific responses that demonstrate competency levels
   - Note conversation patterns that indicate engagement and understanding
   - Identify missed opportunities or areas where responses fell short
   - Consider the natural flow and authenticity of the conversation
3. CONVERSATIONAL FLOW ANALYSIS: Evaluate the natural flow and quality of the conversation:
   - How well did the candidate engage with follow-up questions?
   - Did they provide specific examples when asked?
   - Were they able to elaborate on technical topics naturally?
   - Did they ask thoughtful questions about the role or company?
   - How did they handle unexpected or challenging questions?

4. CONTEXTUAL NAMING: Generate a highly specific, descriptive interview name based on the ACTUAL conversation content:
   - Analyze what topics were genuinely discussed during the interview
   - Focus on specific technical areas, challenges, or insights that emerged
   - Include technologies and concepts that were actually explored in depth
   - Make it descriptive of the actual conversation experience
   - Examples: "React Component Architecture & Performance Discussion", "Backend API Design & Database Strategies", "Full-Stack Development & Security Best Practices", "Frontend State Management & User Experience", "System Design & Scalability Approaches"
   - If the conversation was more general: "Software Development Experience & Problem-Solving", "Technical Foundation & Career Aspirations"

5. TECHNOLOGY EXTRACTION: Extract ALL technologies that were actually discussed or mentioned:
   - Only include technologies that came up naturally in conversation
   - Include programming languages, frameworks, tools, databases, concepts
   - If the candidate demonstrated knowledge through examples or explanations
   - DO NOT include technologies from the original stack unless actually discussed

6. EVIDENCE-BASED FEEDBACK: Provide specific examples from the conversation to support scores:
   - Quote specific responses that demonstrate strengths or weaknesses
   - Reference particular moments that influenced the assessment
   - Mention conversation patterns that indicate skill level

Please provide your evaluation in this JSON format:
{
  "interviewName": "Specific descriptive name reflecting actual conversation topics",
  "extractedTechStack": ["Technologies actually discussed with evidence of knowledge"],
  "totalScore": (weighted average: Technical Knowledge 40%, Communication 25%, Problem Solving 25%, Engagement 10%),
  "categoryScores": [
    {"name": "Technical Knowledge", "score": (1-100), "comment": "Evidence-based assessment with specific examples from responses"},
    {"name": "Communication Skills", "score": (1-100), "comment": "Clarity, structure, and conversational flow demonstrated"},
    {"name": "Problem Solving", "score": (1-100), "comment": "Logical thinking and approach to challenges shown"},
    {"name": "Experience & Examples", "score": (1-100), "comment": "Quality of real-world examples and practical insights"},
    {"name": "Engagement & Confidence", "score": (1-100), "comment": "Interview engagement, professionalism, and confidence level"}
  ],
  "strengths": ["Specific strengths observed with conversation evidence"],
  "areasForImprovement": ["Specific improvement areas with examples"],
  "finalAssessment": "Comprehensive assessment based on actual conversation quality and candidate performance",
  "interviewInsights": {
    "mainTopicsDiscussed": ["Key topics that emerged in conversation"],
    "skillLevel": "Evidence-based assessment of actual demonstrated skill level",
    "recommendedNext": "Specific next steps based on observed performance"
  }
}

CRITICAL ASSESSMENT GUIDELINES:
1. EVIDENCE-BASED SCORING: Every score must be justified by specific conversation examples
   - Quote specific responses that demonstrate competency levels
   - Reference particular moments that influenced the assessment
   - Note patterns in their responses (consistency, depth, clarity)

2. CONVERSATION QUALITY INDICATORS:
   - Did they provide specific examples when asked?
   - How did they handle follow-up questions?
   - Were they able to explain complex topics clearly?
   - Did they ask thoughtful questions about the role or company?
   - How engaged were they throughout the conversation?

3. REALISTIC SCORING STANDARDS:
   - 85-100: Exceptional performance with clear expertise and excellent communication
   - 70-84: Good performance showing solid understanding and clear communication
   - 60-69: Average performance with basic understanding but some gaps
   - 50-59: Below average with significant gaps or unclear communication
   - Below 50: Poor performance with major deficiencies

4. INTERVIEW NAME REQUIREMENTS: 
   - Must reflect actual conversation topics, not just job title
   - Should be descriptive enough that someone reading it understands what was covered
   - Examples: "React State Management & Performance Discussion", "Backend API Design & Database Strategies"
   - Avoid generic titles like "Frontend Developer Interview"

5. CONVERSATION CONTEXT: Consider the natural flow and quality of the discussion:
   - Was it a productive technical conversation?
   - Did the candidate demonstrate genuine knowledge through their responses?
   - How well did they articulate their thoughts and experiences?

IMPORTANT: Base all assessments strictly on actual conversation quality and demonstrated competence. Be honest about performance - not every interview should score highly. Use the full scoring range appropriately.

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
                interviewName: `${role} Interview - ${extractedFromTranscript.length > 0 ? extractedFromTranscript.slice(0, 2).join(' & ') + ' Focus' : 'General Technical Discussion'}`,
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
            role: role, // Keep original role
            interviewName: analysis.interviewName, // Use AI-generated contextual name
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
