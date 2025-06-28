import { getCurrentUser } from '@/lib/actions/auth.action';
import { db } from '@/firebase/admin';

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        
        if (!user) {
            return Response.json({
                success: false,
                error: 'Not authenticated'
            }, { status: 401 });
        }

        const { name, email } = await request.json();

        if (!name || !email) {
            return Response.json({
                success: false,
                error: 'Name and email are required'
            }, { status: 400 });
        }

        // Update user in database
        await db.collection("users").doc(user.id).update({
            name,
            email,
            updatedAt: new Date().toISOString()
        });

        return Response.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user.id,
                name,
                email
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Error updating profile:', error);
        return Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
