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
            // Notification preferences
            emailNotifications: true,
            interviewReminders: true,
            weeklyReports: false,
            achievementNotifications: true,
            
            // Interview preferences
            difficulty: 'medium' as const,
            interviewDuration: 30,
            voiceEnabled: true,
            autoSave: true,
            showHints: true,
            feedbackDetail: 'detailed' as const,
            pauseEnabled: true,
            
            // Appearance preferences
            darkMode: true,
            language: 'en',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            
            // Privacy preferences
            profileVisibility: 'private' as const,
            shareStats: false,
            dataCollection: true,
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

        // Validate preferences structure and values
        const validatedPreferences = validatePreferences(preferences);
        
        if (!validatedPreferences.valid) {
            return Response.json({
                success: false,
                error: 'Invalid preferences data',
                details: validatedPreferences.errors
            }, { status: 400 });
        }

        // Update preferences in database
        await db.collection("userPreferences").doc(user.id).set({
            ...validatedPreferences.data,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        return Response.json({
            success: true,
            message: 'Preferences updated successfully',
            preferences: validatedPreferences.data
        }, { status: 200 });

    } catch (error) {
        console.error('Error updating preferences:', error);
        return Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

function validatePreferences(preferences: any): { valid: boolean; data?: any; errors?: string[] } {
    const errors: string[] = [];
    const validatedData: any = {};

    // Notification preferences
    if (typeof preferences.emailNotifications === 'boolean') {
        validatedData.emailNotifications = preferences.emailNotifications;
    }
    if (typeof preferences.interviewReminders === 'boolean') {
        validatedData.interviewReminders = preferences.interviewReminders;
    }
    if (typeof preferences.weeklyReports === 'boolean') {
        validatedData.weeklyReports = preferences.weeklyReports;
    }
    if (typeof preferences.achievementNotifications === 'boolean') {
        validatedData.achievementNotifications = preferences.achievementNotifications;
    }

    // Interview preferences
    if (['easy', 'medium', 'hard'].includes(preferences.difficulty)) {
        validatedData.difficulty = preferences.difficulty;
    }
    if (typeof preferences.interviewDuration === 'number' && preferences.interviewDuration >= 15 && preferences.interviewDuration <= 120) {
        validatedData.interviewDuration = preferences.interviewDuration;
    }
    if (typeof preferences.voiceEnabled === 'boolean') {
        validatedData.voiceEnabled = preferences.voiceEnabled;
    }
    if (typeof preferences.autoSave === 'boolean') {
        validatedData.autoSave = preferences.autoSave;
    }
    if (typeof preferences.showHints === 'boolean') {
        validatedData.showHints = preferences.showHints;
    }
    if (['basic', 'detailed', 'comprehensive'].includes(preferences.feedbackDetail)) {
        validatedData.feedbackDetail = preferences.feedbackDetail;
    }
    if (typeof preferences.pauseEnabled === 'boolean') {
        validatedData.pauseEnabled = preferences.pauseEnabled;
    }

    // Appearance preferences
    if (typeof preferences.darkMode === 'boolean') {
        validatedData.darkMode = preferences.darkMode;
    }
    if (typeof preferences.language === 'string' && preferences.language.length <= 10) {
        validatedData.language = preferences.language;
    }
    if (typeof preferences.timezone === 'string' && preferences.timezone.length <= 50) {
        validatedData.timezone = preferences.timezone;
    }

    // Privacy preferences
    if (['public', 'private'].includes(preferences.profileVisibility)) {
        validatedData.profileVisibility = preferences.profileVisibility;
    }
    if (typeof preferences.shareStats === 'boolean') {
        validatedData.shareStats = preferences.shareStats;
    }
    if (typeof preferences.dataCollection === 'boolean') {
        validatedData.dataCollection = preferences.dataCollection;
    }

    return {
        valid: errors.length === 0,
        data: validatedData,
        errors: errors.length > 0 ? errors : undefined
    };
}
