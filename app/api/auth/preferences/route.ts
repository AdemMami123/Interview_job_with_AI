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

        // Get user preferences from database
        const preferencesDoc = await db.collection("userPreferences").doc(user.id).get();
        
        // Default preferences if none exist
        const defaultPreferences = {
            emailNotifications: true,
            interviewReminders: true,
            darkMode: true,
        };

        const preferences = preferencesDoc.exists 
            ? { ...defaultPreferences, ...preferencesDoc.data() }
            : defaultPreferences;

        return Response.json({
            success: true,
            preferences
        }, { status: 200 });

    } catch (error) {
        console.error('Error fetching preferences:', error);
        return Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        
        if (!user) {
            return Response.json({
                success: false,
                error: 'Not authenticated'
            }, { status: 401 });
        }

        const preferences = await request.json();

        // Update preferences in database
        await db.collection("userPreferences").doc(user.id).set({
            ...preferences,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        return Response.json({
            success: true,
            message: 'Preferences updated successfully',
            preferences
        }, { status: 200 });

    } catch (error) {
        console.error('Error updating preferences:', error);
        return Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
