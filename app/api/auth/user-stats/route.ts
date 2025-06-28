import { getCurrentUser } from '@/lib/actions/auth.action';
import { db } from '@/firebase/admin';

export async function GET() {
    try {
        const user = await getCurrentUser();
        
        if (!user) {
            return Response.json({
                success: false,
                error: 'Not authenticated'
            }, { status: 401 });
        }

        // Get user's completed interviews
        const interviewsSnapshot = await db.collection('interviews')
            .where('userId', '==', user.id)
            .where('completed', '==', true)
            .get();

        const interviews = interviewsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Calculate statistics
        const totalInterviews = interviews.length;
        const totalScore = interviews.reduce((sum: number, interview: any) => {
            return sum + (interview.score || 0);
        }, 0);
        const averageScore = totalInterviews > 0 ? Math.round(totalScore / totalInterviews) : 0;
        
        // Calculate total practice time (assuming each interview is ~30 minutes on average)
        const totalHours = Math.round((totalInterviews * 30) / 60 * 10) / 10; // Round to 1 decimal

        return Response.json({
            success: true,
            stats: {
                totalInterviews,
                averageScore,
                totalHours,
                recentInterviews: interviews
                    .sort((a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
                    .slice(0, 5)
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Error fetching user stats:', error);
        return Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
