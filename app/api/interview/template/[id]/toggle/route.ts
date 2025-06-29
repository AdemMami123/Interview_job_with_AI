import { db } from '@/firebase/admin';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { userId, isPublic } = await request.json();

        console.log('🔄 Toggling template visibility:', { id, isPublic });

        if (!id) {
            return Response.json({
                success: false,
                error: 'Template ID is required'
            }, { status: 400 });
        }

        // Verify template exists and user owns it
        const templateDoc = await db.collection('interview_templates').doc(id).get();
        
        if (!templateDoc.exists) {
            return Response.json({
                success: false,
                error: 'Template not found'
            }, { status: 404 });
        }

        const templateData = templateDoc.data();
        
        if (userId && templateData?.createdBy !== userId) {
            return Response.json({
                success: false,
                error: 'Unauthorized: You can only modify your own templates'
            }, { status: 403 });
        }

        // Update template visibility
        await db.collection('interview_templates').doc(id).update({
            isPublic: isPublic,
            updatedAt: new Date().toISOString()
        });

        console.log('✅ Template visibility updated successfully');

        return Response.json({
            success: true,
            isPublic: isPublic,
            message: `Template is now ${isPublic ? 'public' : 'private'}`
        }, { status: 200 });

    } catch (error) {
        console.error('❌ Error toggling template visibility:', error);
        return Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
