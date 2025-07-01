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
    <div className="w-full bg-gradient-to-br from-gray-900 via-black to-gray-800 relative min-h-[calc(100vh-80px)]">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-5 pointer-events-none"></div>
      
      <div className="relative z-10 max-w-5xl mx-auto p-6 max-sm:p-4">
        {/* Enhanced Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full px-6 py-2 border border-blue-500/30 mb-6">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span className="text-blue-300 text-sm font-medium">
              {template ? 'Edit Template' : 'Template Builder'}
            </span>
          </div>
          
          <h1 className="text-4xl max-sm:text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent mb-4">
            {template ? 'Edit Interview Template' : 'Create Interview Template'}
          </h1>
          <p className="text-lg max-sm:text-base text-gray-300 mb-8 max-w-2xl mx-auto">
            {template 
              ? 'Update your template to keep it current and effective'
              : 'Build a comprehensive interview template to streamline your hiring process'
            }
          </p>
        </div>

        {/* Enhanced Form Container */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/10 p-8 max-sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-8 max-sm:space-y-6">
            {/* Enhanced Basic Information Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">1</span>
                </div>
                <h3 className="text-xl font-semibold text-white">Basic Information</h3>
              </div>
              
              <div className="grid gap-6 max-sm:gap-4 md:grid-cols-2 max-sm:grid-cols-1">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white font-medium flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a.994.994 0 01-1.414 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Template Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Senior React Developer Interview"
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400 h-12 text-lg rounded-xl focus:bg-white/15 focus:border-blue-400/50 transition-all duration-300"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-white font-medium flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                    </svg>
                    Job Role *
                  </Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    placeholder="e.g., Frontend Developer"
                    className="bg-white/10 border-white/20 text-white placeholder-gray-400 h-12 text-lg rounded-xl focus:bg-white/15 focus:border-blue-400/50 transition-all duration-300"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-white font-medium flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  Description
                </Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of what this interview template covers..."
                  className="w-full h-24 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 resize-none focus:bg-white/15 focus:border-blue-400/50 transition-all duration-300"
                  rows={3}
                />
              </div>
            </div>

            {/* Enhanced Interview Configuration Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">2</span>
                </div>
                <h3 className="text-xl font-semibold text-white">Interview Configuration</h3>
              </div>
              
              <div className="grid gap-6 max-sm:gap-4 md:grid-cols-3 max-sm:grid-cols-1">
                <div className="space-y-2">
                  <Label className="text-white font-medium flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Difficulty Level *
                  </Label>
                  <select
                    value={formData.level}
                    onChange={(e) => handleInputChange('level', e.target.value)}
                    className="w-full h-12 px-4 bg-white/10 border border-white/20 rounded-xl text-white focus:bg-white/15 focus:border-blue-400/50 transition-all duration-300"
                    required
                  >
                    {DIFFICULTY_LEVELS.map(level => (
                      <option key={level} value={level} className="bg-gray-800">{level}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white font-medium flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Number of Questions *
                  </Label>
                  <Input
                    type="number"
                    value={formData.questionCount}
                    onChange={(e) => handleInputChange('questionCount', parseInt(e.target.value))}
                    min="1"
                    max="20"
                    className="bg-white/10 border-white/20 text-white h-12 text-lg rounded-xl focus:bg-white/15 focus:border-blue-400/50 transition-all duration-300"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-white font-medium flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Estimated Duration
                  </Label>
                  <div className="bg-white/10 border border-white/20 rounded-xl h-12 flex items-center px-4 text-gray-300">
                    ≈ {Math.ceil(formData.questionCount * 3)} minutes
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Interview Types Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">3</span>
                </div>
                <h3 className="text-xl font-semibold text-white">Interview Types</h3>
                <span className="text-sm text-gray-400">(Select at least one)</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {INTERVIEW_TYPES.map(type => (
                  <label 
                    key={type} 
                    className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 group ${
                      formData.type.includes(type)
                        ? 'border-blue-500 bg-blue-500/10 text-white'
                        : 'border-white/20 bg-white/5 text-gray-300 hover:border-blue-400/50 hover:bg-blue-500/5'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.type.includes(type)}
                      onChange={() => handleTypeToggle(type)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center transition-all duration-300 ${
                      formData.type.includes(type)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-400 group-hover:border-blue-400'
                    }`}>
                      {formData.type.includes(type) && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="font-medium">{type}</span>
                  </label>
                ))}
              </div>
            </div>

          {/* Tech Stack */}
          <div>
            <Label className="text-white max-sm:text-lg">Tech Stack</Label>
            <div className="space-y-3 max-sm:space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 max-sm:grid-cols-1 gap-2 max-sm:gap-3">
                {POPULAR_TECHS.map(tech => (
                  <label key={tech} className="flex items-center space-x-2 max-sm:space-x-3 cursor-pointer max-sm:p-2 max-sm:bg-gray-800 max-sm:rounded-lg">
                    <input
                      type="checkbox"
                      checked={formData.techstack.includes(tech)}
                      onChange={() => handleTechToggle(tech)}
                      className="rounded max-sm:w-5 max-sm:h-5"
                    />
                    <span className="text-sm max-sm:text-base text-gray-300">{tech}</span>
                  </label>
                ))}
              </div>
              
              <div className="flex gap-2 max-sm:flex-col max-sm:gap-3">
                <Input
                  value={customTech}
                  onChange={(e) => setCustomTech(e.target.value)}
                  placeholder="Add custom technology..."
                  className="bg-gray-800 border-gray-600 text-white max-sm:h-12 max-sm:text-lg"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTech())}
                />
                <Button type="button" onClick={addCustomTech} className="bg-blue-600 hover:bg-blue-700 max-sm:w-full max-sm:py-3 max-sm:text-lg">
                  Add
                </Button>
              </div>

              {formData.techstack.length > 0 && (
                <div className="flex flex-wrap gap-2 max-sm:gap-3">
                  {formData.techstack.map(tech => (
                    <span
                      key={tech}
                      className="inline-flex items-center px-2 py-1 max-sm:px-3 max-sm:py-2 bg-blue-900/50 text-blue-300 text-sm max-sm:text-base rounded-full border border-blue-700"
                    >
                      {tech}
                      <button
                        type="button"
                        onClick={() => removeTech(tech)}
                        className="ml-2 max-sm:ml-3 text-blue-400 hover:text-blue-200 max-sm:text-lg"
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

            {/* Enhanced Visibility Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">5</span>
                </div>
                <h3 className="text-xl font-semibold text-white">Visibility Settings</h3>
              </div>
              
              <label className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                formData.isPublic
                  ? 'border-green-500 bg-green-500/10 text-white'
                  : 'border-white/20 bg-white/5 text-gray-300 hover:border-green-400/50 hover:bg-green-500/5'
              }`}>
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-6 h-6 rounded-lg border-2 mr-4 flex items-center justify-center transition-all duration-300 ${
                  formData.isPublic
                    ? 'border-green-500 bg-green-500'
                    : 'border-gray-400'
                }`}>
                  {formData.isPublic && (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div>
                  <div className="font-medium mb-1">Make this template public</div>
                  <div className="text-sm text-gray-400">
                    Allow others in the community to discover and use this template
                  </div>
                </div>
              </label>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex gap-4 max-sm:gap-3 max-sm:flex-col pt-8 border-t border-white/10">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Saving Template...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {template ? 'Update Template' : 'Create Template'}
                  </div>
                )}
              </Button>
              
              {onCancel && (
                <Button
                  type="button"
                  onClick={onCancel}
                  className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-lg font-medium transition-all duration-300"
                >
                  Cancel
                </Button>
              )}
            </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default TemplateBuilder;
