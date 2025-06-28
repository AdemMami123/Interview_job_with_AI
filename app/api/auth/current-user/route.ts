import { getCurrentUser } from '@/lib/actions/auth.action';

export async function GET() {
    try {
        const user = await getCurrentUser();
        
        if (user) {
            return Response.json({
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                }
            }, { status: 200 });
        } else {
            return Response.json({
                success: false,
                message: 'No authenticated user found'
            }, { status: 401 });
        }
    } catch (error) {
        console.error('Error getting current user:', error);
        return Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
