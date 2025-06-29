import { db } from '@/firebase/admin';

export async function POST(request: Request) {
    try {
        const { 
            responseId, 
            templateId, 
            ownerUserId, 
            feedback,
            rating 
        } = await request.json();

        console.log('📝 Adding feedback to template response:', { responseId, templateId });

        if (!responseId || !templateId) {
            return Response.json({
                success: false,
                error: 'Response ID and Template ID are required'
            }, { status: 400 });
        }

        // Verify template exists and user owns it
        const templateDoc = await db.collection('interview_templates').doc(templateId).get();
        
        if (!templateDoc.exists) {
            return Response.json({
                success: false,
                error: 'Template not found'
            }, { status: 404 });
        }

        const templateData = templateDoc.data();
        
        if (ownerUserId && templateData?.createdBy !== ownerUserId) {
            return Response.json({
                success: false,
                error: 'Unauthorized: You can only provide feedback on responses to your own templates'
            }, { status: 403 });
        }

        // Verify response exists
        const responseDoc = await db.collection('template_responses').doc(responseId).get();
        
        if (!responseDoc.exists) {
            return Response.json({
                success: false,
                error: 'Response not found'
            }, { status: 404 });
        }

        // Add owner feedback to the response
        const now = new Date().toISOString();
        await db.collection('template_responses').doc(responseId).update({
            ownerFeedback: feedback,
            ownerRating: rating,
            feedbackProvidedAt: now,
            feedbackProvidedBy: ownerUserId
        });

        console.log('✅ Feedback added to template response');

        return Response.json({
            success: true,
            message: 'Feedback added successfully'
        }, { status: 200 });

    } catch (error) {
        console.error('❌ Error adding feedback to template response:', error);
        return Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const responseId = searchParams.get('responseId');

        console.log('📥 Fetching template response feedback:', responseId);

        if (!responseId) {
            return Response.json({
                success: false,
                error: 'Response ID is required'
            }, { status: 400 });
        }

        // Fetch response with feedback
        const responseDoc = await db.collection('template_responses').doc(responseId).get();
        
        if (!responseDoc.exists) {
            return Response.json({
                success: false,
                error: 'Response not found'
            }, { status: 404 });
        }

        const responseData = responseDoc.data() as TemplateResponse & {
            ownerFeedback?: string;
            ownerRating?: number;
            feedbackProvidedAt?: string;
            feedbackProvidedBy?: string;
        };

        console.log('✅ Found template response feedback');

        return Response.json({
            success: true,
            response: responseData
        }, { status: 200 });

    } catch (error) {
        console.error('❌ Error fetching template response feedback:', error);
        return Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
