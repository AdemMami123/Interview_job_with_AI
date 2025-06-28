import { db } from '@/firebase/admin';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const interviewId = searchParams.get('interviewId');
        const userId = searchParams.get('userId');

        console.log('📥 Fetching feedback for interview:', interviewId, 'user:', userId);

        if (!interviewId) {
            return Response.json({
                success: false,
                error: 'Interview ID is required'
            }, { status: 400 });
        }

        // Fetch the interview first to verify ownership
        const interviewDoc = await db.collection('interviews').doc(interviewId).get();
        
        if (!interviewDoc.exists) {
            return Response.json({
                success: false,
                error: 'Interview not found'
            }, { status: 404 });
        }

        const interviewData = interviewDoc.data();
        
        // Verify user owns this interview (if userId provided)
        if (userId && interviewData?.userId !== userId) {
            return Response.json({
                success: false,
                error: 'Unauthorized access to interview'
            }, { status: 403 });
        }

        // Fetch feedback for this interview
        const feedbackQuery = db.collection('feedback')
            .where('interviewId', '==', interviewId)
            .limit(1);

        const feedbackSnapshot = await feedbackQuery.get();
        
        if (feedbackSnapshot.empty) {
            return Response.json({
                success: false,
                error: 'Feedback not found for this interview'
            }, { status: 404 });
        }

        const feedbackDoc = feedbackSnapshot.docs[0];
        const feedbackData = feedbackDoc.data();

        console.log('✅ Found feedback for interview');

        return Response.json({
            success: true,
            feedback: {
                id: feedbackDoc.id,
                ...feedbackData
            },
            interview: {
                id: interviewDoc.id,
                ...interviewData
            }
        }, { status: 200 });

    } catch (error) {
        console.error('❌ Error fetching feedback:', error);
        return Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
