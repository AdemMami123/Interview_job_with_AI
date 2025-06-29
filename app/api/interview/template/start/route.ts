import { db } from '@/firebase/admin';

export async function POST(request: Request) {
    try {
        const { templateId, candidateName, candidateEmail } = await request.json();

        console.log('🚀 Starting template interview:', { templateId, candidateName, candidateEmail });

        if (!templateId) {
            return Response.json({
                success: false,
                error: 'Template ID is required'
            }, { status: 400 });
        }

        // Fetch template to verify it exists and is accessible
        const templateDoc = await db.collection('interview_templates').doc(templateId).get();
        
        if (!templateDoc.exists) {
            return Response.json({
                success: false,
                error: 'Template not found'
            }, { status: 404 });
        }

        const templateData = templateDoc.data() as InterviewTemplate;

        // Check if template is public or if user has access
        if (!templateData.isPublic) {
            // For private templates, you might want to add additional access checks here
            // For now, we'll allow access to private templates via direct link
        }

        // Create interview session
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();

        const sessionData = {
            id: sessionId,
            templateId: templateId,
            candidateName: candidateName || 'Anonymous',
            candidateEmail: candidateEmail,
            startedAt: now,
            status: 'in-progress',
            currentQuestionIndex: 0
        };

        // Save session to Firebase
        await db.collection('interview_sessions').doc(sessionId).set(sessionData);

        console.log('✅ Interview session created successfully');

        return Response.json({
            success: true,
            sessionId: sessionId,
            template: {
                id: templateData.id,
                name: templateData.name,
                description: templateData.description,
                role: templateData.role,
                level: templateData.level,
                type: templateData.type,
                duration: templateData.duration,
                questionCount: templateData.questionCount,
                questions: templateData.questions
            },
            message: 'Interview session started successfully'
        }, { status: 200 });

    } catch (error) {
        console.error('❌ Error starting template interview:', error);
        return Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
