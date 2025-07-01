"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import TemplateBuilder from '@/components/TemplateBuilder';
import TemplateCard from '@/components/TemplateCard';

const CreateTemplatePage = () => {
  const router = useRouter();
  const [templates, setTemplates] = useState<InterviewTemplate[]>([]);
  const [publicTemplates, setPublicTemplates] = useState<InterviewTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingTemplate, setEditingTemplate] = useState<InterviewTemplate | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'my-templates' | 'public-templates'>('my-templates');
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/current-user');
        if (response.ok) {
          const userData = await response.json();
          if (userData.success && userData.user) {
            setUserId(userData.user.id);
            return userData.user.id;
          }
        }
        
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId) {
          setUserId(storedUserId);
          return storedUserId;
        }
        
        return null;
      } catch (error) {
        console.error('Error getting user:', error);
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId) {
          setUserId(storedUserId);
          return storedUserId;
        }
        return null;
      }
    };

    const fetchTemplates = async () => {
      const currentUserId = await getCurrentUser();
      if (!currentUserId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch user's templates
        const userResponse = await fetch(`/api/interview/template/create?userId=${currentUserId}`);
        const userData = await userResponse.json();
        
        if (userData.success) {
          setTemplates(userData.templates);
        }

        // Fetch public templates
        const publicResponse = await fetch(`/api/interview/template/list?includePublic=true&limit=50`);
        const publicData = await publicResponse.json();
        
        if (publicData.success) {
          // Filter out templates owned by current user from public templates
          const filteredPublicTemplates = publicData.templates.filter(
            (template: InterviewTemplate) => template.createdBy !== currentUserId
          );
          setPublicTemplates(filteredPublicTemplates);
        }

      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const handleCreateTemplate = () => {
    if (!userId) {
      alert('Please sign in to create templates');
      return;
    }
    setEditingTemplate(undefined);
    setCurrentView('create');
  };

  const handleEditTemplate = (template: InterviewTemplate) => {
    setEditingTemplate(template);
    setCurrentView('edit');
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/interview/template/${templateId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      const result = await response.json();

      if (result.success) {
        setTemplates(prev => prev.filter(t => t.id !== templateId));
        console.log('✅ Template deleted successfully');
      } else {
        alert('Failed to delete template: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('An error occurred while deleting the template');
    }
  };

  const handleViewResults = (templateId: string) => {
    router.push(`/interview-templates/${templateId}`);
  };

  const handleToggleVisibility = async (templateId: string, isPublic: boolean) => {
    try {
      const response = await fetch(`/api/interview/template/${templateId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isPublic })
      });

      const result = await response.json();

      if (result.success) {
        setTemplates(prev => prev.map(t => 
          t.id === templateId ? { ...t, isPublic } : t
        ));
        console.log('✅ Template visibility updated');
      } else {
        alert('Failed to update template visibility: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating template visibility:', error);
      alert('An error occurred while updating template visibility');
    }
  };

  const handleSaveTemplate = (savedTemplate: InterviewTemplate) => {
    if (editingTemplate) {
      // Update existing template
      setTemplates(prev => prev.map(t => 
        t.id === savedTemplate.id ? savedTemplate : t
      ));
    } else {
      // Add new template
      setTemplates(prev => [savedTemplate, ...prev]);
    }
    setCurrentView('list');
    setEditingTemplate(undefined);
  };

  const handleCancelEdit = () => {
    setCurrentView('list');
    setEditingTemplate(undefined);
  };

  const filteredTemplates = templates.filter(template =>
    (template.name && template.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (template.role && template.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (template.type && template.type.some(t => t && t.toLowerCase().includes(searchTerm.toLowerCase()))) ||
    (template.techstack && template.techstack.some(tech => tech && tech.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const filteredPublicTemplates = publicTemplates.filter(template =>
    (template.name && template.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (template.role && template.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (template.type && template.type.some(t => t && t.toLowerCase().includes(searchTerm.toLowerCase()))) ||
    (template.techstack && template.techstack.some(tech => tech && tech.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  if (currentView === 'create' || currentView === 'edit') {
    return (
      <TemplateBuilder
        template={editingTemplate}
        onSave={handleSaveTemplate}
        onCancel={handleCancelEdit}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-gray-600 rounded-full"></div>
              <div className="absolute top-0 left-0 w-20 h-20 border-4 border-blue-500 rounded-full animate-spin border-t-transparent"></div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Templates</h2>
          <p className="text-gray-400">Fetching your interview templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-gray-900 via-black to-gray-800">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-5 pointer-events-none"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto p-6 max-sm:p-4">
        {/* Enhanced Header */}
        <div className="text-center mb-12 max-sm:mb-8">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full px-6 py-2 border border-blue-500/30 mb-6">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span className="text-blue-300 text-sm font-medium">Template Management</span>
          </div>
          
          <h1 className="text-5xl max-sm:text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent mb-4">
            Interview Templates
          </h1>
          <p className="text-xl max-sm:text-lg text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Create professional interview templates, streamline your hiring process, and share them with your team
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={handleCreateTemplate}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 max-sm:w-full"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Template
            </Button>
            
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {templates.length} templates created
            </div>
          </div>
        </div>

        {/* Enhanced Search */}
        <div className="mb-8 max-sm:mb-6">
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search templates by name, role, technology, or type..."
              className="pl-12 pr-4 py-4 text-lg bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-gray-400 rounded-xl focus:bg-white/15 focus:border-blue-400/50 transition-all duration-300"
            />
          </div>
        </div>

        {/* Enhanced Tabs */}
        <div className="mb-8 max-sm:mb-6">
          <div className="flex justify-center">
            <div className="inline-flex bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('my-templates')}
                className={`px-6 py-3 text-sm font-medium rounded-lg transition-all duration-300 flex items-center gap-2 ${
                  activeTab === 'my-templates'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                My Templates
                <span className={`px-2 py-1 text-xs rounded-full ${
                  activeTab === 'my-templates' 
                    ? 'bg-white/20 text-white' 
                    : 'bg-gray-600 text-gray-300'
                }`}>
                  {templates.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('public-templates')}
                className={`px-6 py-3 text-sm font-medium rounded-lg transition-all duration-300 flex items-center gap-2 ${
                  activeTab === 'public-templates'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Public Templates
                <span className={`px-2 py-1 text-xs rounded-full ${
                  activeTab === 'public-templates' 
                    ? 'bg-white/20 text-white' 
                    : 'bg-gray-600 text-gray-300'
                }`}>
                  {publicTemplates.length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Templates Grid */}
        {activeTab === 'my-templates' && (
          <div>
            {filteredTemplates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-sm:gap-4">
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    showStats={true}
                    isOwner={true}
                    onEdit={handleEditTemplate}
                    onDelete={handleDeleteTemplate}
                    onToggleVisibility={handleToggleVisibility}
                    onViewResults={handleViewResults}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="max-w-md mx-auto">
                  <div className="mb-6">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {searchTerm ? "No templates found" : "Start creating templates"}
                    </h3>
                    <p className="text-gray-400 mb-6 leading-relaxed">
                      {searchTerm
                        ? "Try adjusting your search criteria or browse all templates"
                        : "Create your first interview template to streamline your hiring process and ensure consistent candidate evaluation"}
                    </p>
                  </div>
                  
                  {!searchTerm && (
                    <Button
                      onClick={handleCreateTemplate}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      Create Your First Template
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'public-templates' && (
          <div>
            {filteredPublicTemplates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-sm:gap-4">
                {filteredPublicTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    showStats={true}
                    isOwner={false}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="max-w-md mx-auto">
                  <div className="mb-6">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {searchTerm ? "No public templates found" : "No public templates yet"}
                    </h3>
                    <p className="text-gray-400 leading-relaxed">
                      {searchTerm
                        ? "Try different search terms or check back later for new public templates"
                        : "Public templates shared by the community will appear here. Check back later or create your own template to share!"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateTemplatePage;
