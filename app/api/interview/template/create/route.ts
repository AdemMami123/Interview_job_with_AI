import { db } from '@/firebase/admin';
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export async function POST(request: Request) {
    try {
        console.log('📝 Creating new interview template...');
        const {
            name,
            description,
            role,
            level,
            type,
            techstack,
            questionCount,
            questions,
            isPublic = false,
            generateQuestions = true,
            userId
        }: CreateTemplateRequest & { userId: string } = await request.json();

        console.log('📋 Template data:', {
            name,
            role,
            level,
            type,
            techstack,
            questionCount,
            generateQuestions
        });

        if (!name || !role || !level || !type || !questionCount || !userId) {
            return Response.json({
                success: false,
                error: 'Missing required fields'
            }, { status: 400 });
        }

        let finalQuestions: string[] = [];

        // Generate questions using AI if requested or no custom questions provided
        if (generateQuestions || !questions || questions.length === 0) {
            console.log('🤖 Generating questions with AI...');
            
            const questionPrompt = `Generate ${questionCount} interview questions for a ${level} level ${role} position.

REQUIREMENTS:
- Interview Type Focus: ${type.join(', ')}
- Experience Level: ${level}
- Tech Stack: ${techstack.join(', ')}

QUESTION GUIDELINES:
1. Mix question types based on the specified types: ${type.join(', ')}
2. For Technical: Include coding concepts, system design, problem-solving
3. For Behavioral: Include past experiences, leadership, teamwork scenarios
4. For Leadership: Include team management, decision-making, conflict resolution
5. For Sales: Include client management, negotiation, target achievement
6. For Product: Include product strategy, user experience, market analysis

IMPORTANT:
- Questions should be appropriate for ${level} level
- Avoid special characters that break voice assistants (/, *, etc.)
- Make questions conversational and suitable for voice interviews
- Each question should allow for detailed responses

Return ONLY a JSON array of questions:
["Question 1", "Question 2", "Question 3", ...]`;

            try {
                const { text: questionsResponse } = await generateText({
                    model: google("gemini-2.0-flash-001"),
                    prompt: questionPrompt
                });

                finalQuestions = JSON.parse(questionsResponse.trim());
                console.log('✅ Generated', finalQuestions.length, 'questions');
            } catch (aiError) {
                console.error('❌ AI question generation failed:', aiError);
                // Fallback to basic questions
                finalQuestions = [
                    "Tell me about yourself and your background.",
                    `What interests you most about the ${role} position?`,
                    "Describe a challenging project you've worked on.",
                    "How do you stay updated with new technologies?",
                    "What are your career goals?"
                ];
            }
        } else {
            finalQuestions = questions;
        }

        // Create template ID and shareable link
        const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const shareableLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/interview/template/${templateId}`;
        const now = new Date().toISOString();

        const templateData: InterviewTemplate = {
            id: templateId,
            name,
            description: description || '',
            role,
            level,
            type,
            techstack,
            questionCount,
            questions: finalQuestions,
            isPublic,
            createdBy: userId,
            createdAt: now,
            updatedAt: now,
            shareableLink,
            completionCount: 0,
            averageScore: 0
        };

        // Save template to Firebase
        console.log('💾 Saving template to Firebase...');
        await db.collection('interview_templates').doc(templateId).set(templateData);

        console.log('✅ Template created successfully');

        return Response.json({
            success: true,
            template: templateData,
            message: 'Interview template created successfully'
        }, { status: 200 });

    } catch (error) {
        console.error('❌ Error creating template:', error);
        return Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const limit = parseInt(searchParams.get('limit') || '20');
        const includePublic = searchParams.get('includePublic') === 'true';

        console.log('📥 Fetching templates for user:', userId);

        if (!userId) {
            return Response.json({
                success: false,
                error: 'User ID is required'
            }, { status: 400 });
        }

        let query = db.collection('interview_templates');

        if (includePublic) {
            // Get both user's templates and public templates
            const userTemplatesQuery = query
                .where('createdBy', '==', userId)
                .limit(limit);

            const publicTemplatesQuery = query
                .where('isPublic', '==', true)
                .limit(limit);

            const [userSnapshot, publicSnapshot] = await Promise.all([
                userTemplatesQuery.get(),
                publicTemplatesQuery.get()
            ]);

            const templates: InterviewTemplate[] = [];
            
            userSnapshot.forEach((doc) => {
                templates.push({ id: doc.id, ...doc.data() } as InterviewTemplate);
            });

            publicSnapshot.forEach((doc) => {
                const templateData = { id: doc.id, ...doc.data() } as InterviewTemplate;
                // Don't duplicate if user already owns this template
                if (!templates.find(t => t.id === templateData.id)) {
                    templates.push(templateData);
                }
            });

            // Sort by creation date on the client side
            templates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            return Response.json({
                success: true,
                templates: templates.slice(0, limit),
                count: templates.length
            }, { status: 200 });
        } else {
            // Get only user's templates
            const templatesQuery = query
                .where('createdBy', '==', userId)
                .limit(limit);

            const querySnapshot = await templatesQuery.get();
            
            const templates: InterviewTemplate[] = [];
            querySnapshot.forEach((doc) => {
                templates.push({ id: doc.id, ...doc.data() } as InterviewTemplate);
            });

            // Sort by creation date on the client side
            templates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            console.log('✅ Found', templates.length, 'templates for user');

            return Response.json({
                success: true,
                templates: templates,
                count: templates.length
            }, { status: 200 });
        }

    } catch (error) {
        console.error('❌ Error fetching templates:', error);
        return Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
