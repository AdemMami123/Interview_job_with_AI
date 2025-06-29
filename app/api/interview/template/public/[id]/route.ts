import { db } from '@/firebase/admin';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        console.log('🌐 Fetching public template:', id);

        if (!id) {
            return Response.json({
                success: false,
                error: 'Template ID is required'
            }, { status: 400 });
        }

        // Fetch template from Firebase
        const templateDoc = await db.collection('interview_templates').doc(id).get();
        
        if (!templateDoc.exists) {
            return Response.json({
                success: false,
                error: 'Template not found'
            }, { status: 404 });
        }

        const templateData = templateDoc.data() as InterviewTemplate;

        // Check if template is public
        if (!templateData.isPublic) {
            return Response.json({
                success: false,
                error: 'This template is private and not accessible via public link'
            }, { status: 403 });
        }

        // Return template data without sensitive information
        const publicTemplateData = {
            id: templateData.id,
            name: templateData.name,
            description: templateData.description,
            role: templateData.role,
            level: templateData.level,
            type: templateData.type,
            techstack: templateData.techstack,
            duration: templateData.duration,
            questionCount: templateData.questionCount,
            questions: templateData.questions,
            completionCount: templateData.completionCount,
            averageScore: templateData.averageScore,
            createdAt: templateData.createdAt
        };

        console.log('✅ Found public template:', templateData.name);

        return Response.json({
            success: true,
            template: publicTemplateData,
            isPublic: true
        }, { status: 200 });

    } catch (error) {
        console.error('❌ Error fetching public template:', error);
        return Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
