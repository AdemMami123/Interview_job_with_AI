"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const INTERVIEW_TYPES = [
  'Technical',
  'Behavioral', 
  'Leadership',
  'Sales',
  'Product',
  'Cultural Fit'
];

const DIFFICULTY_LEVELS = [
  'Beginner',
  'Intermediate', 
  'Advanced'
];

const POPULAR_TECHS = [
  'React', 'Vue', 'Angular', 'JavaScript', 'TypeScript', 'Node.js', 'Express',
  'Python', 'Django', 'Flask', 'Java', 'Spring', 'C#', '.NET', 'PHP', 'Laravel',
  'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'AWS', 'Azure', 'Docker', 'Kubernetes',
  'Git', 'GraphQL', 'REST API', 'Microservices', 'Machine Learning', 'Data Science'
];

interface TemplateBuilderProps {
  template?: InterviewTemplate;
  onSave?: (template: InterviewTemplate) => void;
  onCancel?: () => void;
}

const TemplateBuilder: React.FC<TemplateBuilderProps> = ({ template, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    role: '',
    level: 'Intermediate' as 'Beginner' | 'Intermediate' | 'Advanced',
    type: [] as string[],
    techstack: [] as string[],
    questionCount: 5,
    questions: [] as string[],
    isPublic: false,
    generateQuestions: true
  });

  const [customTech, setCustomTech] = useState('');
  const [customQuestion, setCustomQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/current-user');
        if (response.ok) {
          const userData = await response.json();
          if (userData.success && userData.user) {
            setUserId(userData.user.id);
          }
        } else {
          // Fallback to localStorage
          const storedUserId = localStorage.getItem('userId');
          if (storedUserId) {
            setUserId(storedUserId);
          }
        }
      } catch (error) {
        console.error('Error getting user:', error);
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId) {
          setUserId(storedUserId);
        }
      }
    };

    getCurrentUser();

    // If editing existing template, populate form
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || '',
        role: template.role,
        level: template.level,
        type: template.type,
        techstack: template.techstack,
        questionCount: template.questionCount,
        questions: template.questions,
        isPublic: template.isPublic,
        generateQuestions: false
      });
    }
  }, [template]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTypeToggle = (type: string) => {
    setFormData(prev => ({
      ...prev,
      type: prev.type.includes(type) 
        ? prev.type.filter(t => t !== type)
        : [...prev.type, type]
    }));
  };

  const handleTechToggle = (tech: string) => {
    setFormData(prev => ({
      ...prev,
      techstack: prev.techstack.includes(tech)
        ? prev.techstack.filter(t => t !== tech)
        : [...prev.techstack, tech]
    }));
  };

  const addCustomTech = () => {
    if (customTech.trim() && !formData.techstack.includes(customTech.trim())) {
      setFormData(prev => ({
        ...prev,
        techstack: [...prev.techstack, customTech.trim()]
      }));
      setCustomTech('');
    }
  };

  const removeTech = (tech: string) => {
    setFormData(prev => ({
      ...prev,
      techstack: prev.techstack.filter(t => t !== tech)
    }));
  };

  const addCustomQuestion = () => {
    if (customQuestion.trim()) {
      setFormData(prev => ({
        ...prev,
        questions: [...prev.questions, customQuestion.trim()],
        generateQuestions: false
      }));
      setCustomQuestion('');
    }
  };

  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      alert('Please sign in to create templates');
      return;
    }

    if (!formData.name || !formData.role || formData.type.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      const requestData = {
        ...formData,
        userId
      };

      const url = template 
        ? `/api/interview/template/${template.id}` 
        : '/api/interview/template/create';
      
      const method = template ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Template saved successfully:', result.template);
        if (onSave) {
          onSave(result.template);
        }
      } else {
        console.error('❌ Failed to save template:', result.error);
        alert('Failed to save template: ' + result.error);
      }
    } catch (error) {
      console.error('❌ Error saving template:', error);
      alert('An error occurred while saving the template');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-700 p-8">
        <h2 className="text-2xl font-bold text-white mb-6">
          {template ? 'Edit Interview Template' : 'Create Interview Template'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <Label htmlFor="name" className="text-white">Template Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Senior React Developer Interview"
                className="bg-gray-800 border-gray-600 text-white"
                required
              />
            </div>
            <div>
              <Label htmlFor="role" className="text-white">Job Role *</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => handleInputChange('role', e.target.value)}
                placeholder="e.g., Frontend Developer"
                className="bg-gray-800 border-gray-600 text-white"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="text-white">Description</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief description of what this interview template covers..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white"
              rows={3}
            />
          </div>

          {/* Interview Configuration */}
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <Label className="text-white">Difficulty Level *</Label>
              <select
                value={formData.level}
                onChange={(e) => handleInputChange('level', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white"
                required
              >
                {DIFFICULTY_LEVELS.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-white">Number of Questions *</Label>
              <Input
                type="number"
                value={formData.questionCount}
                onChange={(e) => handleInputChange('questionCount', parseInt(e.target.value))}
                min="1"
                max="20"
                className="bg-gray-800 border-gray-600 text-white"
                required
              />
            </div>
          </div>

          {/* Interview Types */}
          <div>
            <Label className="text-white">Interview Types * (Select at least one)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {INTERVIEW_TYPES.map(type => (
                <label key={type} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.type.includes(type)}
                    onChange={() => handleTypeToggle(type)}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-300">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tech Stack */}
          <div>
            <Label className="text-white">Tech Stack</Label>
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {POPULAR_TECHS.map(tech => (
                  <label key={tech} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.techstack.includes(tech)}
                      onChange={() => handleTechToggle(tech)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-300">{tech}</span>
                  </label>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Input
                  value={customTech}
                  onChange={(e) => setCustomTech(e.target.value)}
                  placeholder="Add custom technology..."
                  className="bg-gray-800 border-gray-600 text-white"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTech())}
                />
                <Button type="button" onClick={addCustomTech} className="bg-blue-600 hover:bg-blue-700">
                  Add
                </Button>
              </div>

              {formData.techstack.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.techstack.map(tech => (
                    <span
                      key={tech}
                      className="inline-flex items-center px-2 py-1 bg-blue-900/50 text-blue-300 text-sm rounded-full border border-blue-700"
                    >
                      {tech}
                      <button
                        type="button"
                        onClick={() => removeTech(tech)}
                        className="ml-2 text-blue-400 hover:text-blue-200"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Questions */}
          <div>
            <Label className="text-white">Questions</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.generateQuestions}
                  onChange={(e) => handleInputChange('generateQuestions', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-300">
                  Generate questions automatically using AI
                </span>
              </div>

              {!formData.generateQuestions && (
                <>
                  <div className="flex gap-2">
                    <Input
                      value={customQuestion}
                      onChange={(e) => setCustomQuestion(e.target.value)}
                      placeholder="Add a custom question..."
                      className="bg-gray-800 border-gray-600 text-white"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomQuestion())}
                    />
                    <Button type="button" onClick={addCustomQuestion} className="bg-blue-600 hover:bg-blue-700">
                      Add
                    </Button>
                  </div>

                  {formData.questions.length > 0 && (
                    <div className="space-y-2">
                      {formData.questions.map((question, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-gray-800 rounded-lg">
                          <span className="text-sm text-gray-300 flex-1">{index + 1}. {question}</span>
                          <button
                            type="button"
                            onClick={() => removeQuestion(index)}
                            className="text-red-400 hover:text-red-200"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Visibility */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.isPublic}
              onChange={(e) => handleInputChange('isPublic', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-300">
              Make this template public (others can find and use it)
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              {isLoading ? 'Saving...' : (template ? 'Update Template' : 'Create Template')}
            </Button>
            {onCancel && (
              <Button
                type="button"
                onClick={onCancel}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default TemplateBuilder;
