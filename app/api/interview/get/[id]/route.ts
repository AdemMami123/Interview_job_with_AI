import { db } from '@/firebase/admin';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const interviewId = params.id;

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

        return Response.json({
            success: true,
            interview: {
                id: interviewDoc.id,
                ...interviewData
            }
        }, { status: 200 });

    } catch (error) {
        console.error('❌ Error fetching interview:', error);
        return Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
