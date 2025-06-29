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
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.type.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
    template.techstack.some(tech => tech.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredPublicTemplates = publicTemplates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.type.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
    template.techstack.some(tech => tech.toLowerCase().includes(searchTerm.toLowerCase()))
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
      <div className="flex justify-center items-center min-h-96">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"></div>
          <span className="text-white">Loading templates...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Interview Templates</h1>
          <p className="text-gray-400 mt-2">
            Create, manage, and share interview templates with candidates
          </p>
        </div>
        <Button
          onClick={handleCreateTemplate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
        >
          Create New Template
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search templates by name, role, type, or technology..."
          className="max-w-md bg-gray-800 border-gray-600 text-white"
        />
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('my-templates')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'my-templates'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            My Templates ({templates.length})
          </button>
          <button
            onClick={() => setActiveTab('public-templates')}
            className={`px-4 py-2 text-sm font-medium ml-8 ${
              activeTab === 'public-templates'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Public Templates ({publicTemplates.length})
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      {activeTab === 'my-templates' && (
        <div>
          {filteredTemplates.length > 0 ? (
            <div className="interviews-section">
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
            <div className="text-center text-gray-500 py-12">
              <h3 className="text-lg font-medium mb-2">No templates found</h3>
              <p className="text-sm mb-4">
                {searchTerm
                  ? "No templates match your search criteria"
                  : "You haven't created any interview templates yet"}
              </p>
              {!searchTerm && (
                <Button
                  onClick={handleCreateTemplate}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Create Your First Template
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'public-templates' && (
        <div>
          {filteredPublicTemplates.length > 0 ? (
            <div className="interviews-section">
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
            <div className="text-center text-gray-500 py-12">
              <h3 className="text-lg font-medium mb-2">No public templates found</h3>
              <p className="text-sm">
                {searchTerm
                  ? "No public templates match your search criteria"
                  : "No public templates are available at the moment"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CreateTemplatePage;
