import { db } from '@/firebase/admin';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const includePublic = searchParams.get('includePublic') === 'true';
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search');

        console.log('📥 Fetching templates list:', { userId, includePublic, limit, search });

        let templates: InterviewTemplate[] = [];

        if (includePublic) {
            // Get public templates
            let publicQuery = db.collection('interview_templates')
                .where('isPublic', '==', true)
                .limit(limit * 2); // Get more to account for potential filtering

            const publicSnapshot = await publicQuery.get();
            
            publicSnapshot.forEach((doc) => {
                const templateData = { id: doc.id, ...doc.data() } as InterviewTemplate;
                if (!search || 
                    templateData.name.toLowerCase().includes(search.toLowerCase()) ||
                    templateData.role.toLowerCase().includes(search.toLowerCase()) ||
                    templateData.type.some(t => t.toLowerCase().includes(search.toLowerCase())) ||
                    templateData.techstack.some(tech => tech.toLowerCase().includes(search.toLowerCase()))
                ) {
                    templates.push(templateData);
                }
            });
        }

        if (userId) {
            // Get user's own templates
            let userQuery = db.collection('interview_templates')
                .where('createdBy', '==', userId)
                .limit(limit * 2); // Get more to account for potential filtering

            const userSnapshot = await userQuery.get();
            
            userSnapshot.forEach((doc) => {
                const templateData = { id: doc.id, ...doc.data() } as InterviewTemplate;
                
                // Don't duplicate if already included from public templates
                if (!templates.find(t => t.id === templateData.id)) {
                    if (!search || 
                        templateData.name.toLowerCase().includes(search.toLowerCase()) ||
                        templateData.role.toLowerCase().includes(search.toLowerCase()) ||
                        templateData.type.some(t => t.toLowerCase().includes(search.toLowerCase())) ||
                        templateData.techstack.some(tech => tech.toLowerCase().includes(search.toLowerCase()))
                    ) {
                        templates.push(templateData);
                    }
                }
            });
        }

        // Sort by creation date (newest first) and limit results
        templates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        templates = templates.slice(0, limit);

        console.log('✅ Found', templates.length, 'templates');

        return Response.json({
            success: true,
            templates: templates,
            count: templates.length
        }, { status: 200 });

    } catch (error) {
        console.error('❌ Error fetching templates list:', error);
        return Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
