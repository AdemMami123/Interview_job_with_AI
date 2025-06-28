import { db } from '@/firebase/admin';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const limit = parseInt(searchParams.get('limit') || '10');

        console.log('📥 Fetching interviews for user:', userId);

        if (!userId) {
            return Response.json({
                success: false,
                error: 'User ID is required'
            }, { status: 400 });
        }

        // Fetch interviews from Firebase
        const interviewsQuery = db.collection('interviews')
            .where('userId', '==', userId)
            .where('completed', '==', true)
            .orderBy('completedAt', 'desc')
            .limit(limit);

        const querySnapshot = await interviewsQuery.get();
        
        const interviews: Interview[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            interviews.push({
                id: doc.id,
                ...data
            } as Interview);
        });

        console.log('✅ Found', interviews.length, 'interviews for user');

        return Response.json({
            success: true,
            interviews: interviews,
            count: interviews.length
        }, { status: 200 });

    } catch (error) {
        console.error('❌ Error fetching interviews:', error);
        return Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
