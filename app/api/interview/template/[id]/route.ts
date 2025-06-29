import { db } from '@/firebase/admin';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        console.log('📥 Fetching template:', id);

        if (!id) {
            return Response.json({
                success: false,
                error: 'Template ID is required'
            }, { status: 400 });
        }

        // Fetch template from Firebase
        const templateDoc = await db.collection('interview_templates').doc(id).get();
        
        if (!templateDoc.exists) {
            return Response.json({
                success: false,
                error: 'Template not found'
            }, { status: 404 });
        }

        const templateData = { id: templateDoc.id, ...templateDoc.data() } as InterviewTemplate;

        console.log('✅ Found template:', templateData.name);

        return Response.json({
            success: true,
            template: templateData
        }, { status: 200 });

    } catch (error) {
        console.error('❌ Error fetching template:', error);
        return Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const updateData = await request.json();
        
        console.log('📝 Updating template:', id);

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
        
        if (updateData.userId && templateData?.createdBy !== updateData.userId) {
            return Response.json({
                success: false,
                error: 'Unauthorized: You can only update your own templates'
            }, { status: 403 });
        }

        // Update template
        const updatedData = {
            ...updateData,
            updatedAt: new Date().toISOString()
        };

        delete updatedData.userId; // Remove userId from update data

        await db.collection('interview_templates').doc(id).update(updatedData);

        // Fetch updated template
        const updatedDoc = await db.collection('interview_templates').doc(id).get();
        const updatedTemplate = { id: updatedDoc.id, ...updatedDoc.data() } as InterviewTemplate;

        console.log('✅ Template updated successfully');

        return Response.json({
            success: true,
            template: updatedTemplate,
            message: 'Template updated successfully'
        }, { status: 200 });

    } catch (error) {
        console.error('❌ Error updating template:', error);
        return Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { userId } = await request.json();
        
        console.log('🗑️ Deleting template:', id);

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
                error: 'Unauthorized: You can only delete your own templates'
            }, { status: 403 });
        }

        // Delete template
        await db.collection('interview_templates').doc(id).delete();

        // Also delete associated responses (optional - you might want to keep them for analytics)
        const responsesQuery = db.collection('template_responses').where('templateId', '==', id);
        const responsesSnapshot = await responsesQuery.get();
        
        const deleteBatch = db.batch();
        responsesSnapshot.docs.forEach((doc) => {
            deleteBatch.delete(doc.ref);
        });
        
        if (!responsesSnapshot.empty) {
            await deleteBatch.commit();
            console.log('🗑️ Deleted', responsesSnapshot.size, 'associated responses');
        }

        console.log('✅ Template deleted successfully');

        return Response.json({
            success: true,
            message: 'Template deleted successfully'
        }, { status: 200 });

    } catch (error) {
        console.error('❌ Error deleting template:', error);
        return Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
