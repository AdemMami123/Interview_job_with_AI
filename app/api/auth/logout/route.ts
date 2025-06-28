import { logout } from '@/lib/actions/auth.action';

export async function POST() {
    try {
        const result = await logout();
        
        return Response.json({
            success: result._success,
            message: result.message
        }, { 
            status: result._success ? 200 : 500,
            headers: {
                // Clear the session cookie from the browser
                'Set-Cookie': 'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax'
            }
        });
    } catch (error) {
        console.error('❌ Error in logout API:', error);
        return Response.json({
            success: false,
            message: 'An error occurred during logout'
        }, { status: 500 });
    }
}
