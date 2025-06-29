"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Agent from '@/components/agent';
import DisplayTechIcons from '@/components/DisplayTechIcons';
import dayjs from 'dayjs';

interface TemplateSessionData {
  template: InterviewTemplate | null;
  isPublic: boolean;
}

const TemplateInterviewPage = () => {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;

  const [sessionData, setSessionData] = useState<TemplateSessionData>({ template: null, isPublic: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'info' | 'form' | 'interview'>('info');
  
  // Candidate information
  const [candidateInfo, setCandidateInfo] = useState({
    name: '',
    email: ''
  });

  // Interview session state
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    fetchTemplateData();
    setupCandidateSession();
  }, [templateId]);

  const fetchTemplateData = async () => {
    try {
      setLoading(true);
      
      // Try to fetch as public template first
      const publicResponse = await fetch(`/api/interview/template/public/${templateId}`);
      
      if (publicResponse.ok) {
        const publicData = await publicResponse.json();
        if (publicData.success) {
          setSessionData({
            template: publicData.template,
            isPublic: true
          });
          setLoading(false);
          return;
        }
      }

      // If not public, try to fetch as authenticated user's template
      const privateResponse = await fetch(`/api/interview/template/${templateId}`);
      
      if (privateResponse.ok) {
        const privateData = await privateResponse.json();
        if (privateData.success) {
          setSessionData({
            template: privateData.template,
            isPublic: false
          });
          setLoading(false);
          return;
        }
      }

      // If both fail, show error
      setError('Template not found or not accessible');
      setLoading(false);

    } catch (error) {
      console.error('Error fetching template:', error);
      setError('Failed to load interview template');
      setLoading(false);
    }
  };

  const setupCandidateSession = () => {
    // Generate or get candidate session ID
    let candidateId = localStorage.getItem('candidateSessionId');
    if (!candidateId) {
      candidateId = `candidate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('candidateSessionId', candidateId);
    }
    setUserId(candidateId);

    // Get stored candidate name if exists
    const storedName = localStorage.getItem('candidateName');
    if (storedName) {
      setUserName(storedName);
      setCandidateInfo(prev => ({ ...prev, name: storedName }));
    }
  };

  const handleCandidateInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!candidateInfo.name.trim()) {
      alert('Please enter your name');
      return;
    }

    // Store candidate info
    localStorage.setItem('candidateName', candidateInfo.name.trim());
    localStorage.setItem('candidateEmail', candidateInfo.email.trim());
    
    setUserName(candidateInfo.name.trim());
    setCurrentView('interview');
  };

  const handleStartInterview = () => {
    setCurrentView('form');
  };

  const handleBackToInfo = () => {
    setCurrentView('info');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"></div>
          <span className="text-white">Loading interview template...</span>
        </div>
      </div>
    );
  }

  if (error || !sessionData.template) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 text-center">
        <h1 className="text-2xl font-bold text-red-400 mb-4">Template Not Found</h1>
        <p className="text-gray-300 mb-6">
          {error || 'The interview template you\'re looking for doesn\'t exist or is no longer available.'}
        </p>
        <Button onClick={() => router.push('/')} className="bg-blue-600 hover:bg-blue-700">
          Back to Home
        </Button>
      </div>
    );
  }

  const { template } = sessionData;

  // Interview Information View
  if (currentView === 'info') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-700 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">{template.name}</h1>
            <p className="text-xl text-gray-300">{template.role} Interview</p>
            {sessionData.isPublic && (
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-900/30 border border-green-700 mt-3">
                <span className="text-green-400 text-sm">🌐 Public Template</span>
              </div>
            )}
          </div>

          {/* Template Details */}
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Interview Details</h3>
                <div className="space-y-2 text-gray-300">
                  <p><span className="font-medium">Questions:</span> {template.questionCount} questions</p>
                  <p><span className="font-medium">Level:</span> {template.level}</p>
                  <p><span className="font-medium">Type:</span> {template.type.join(', ')}</p>
                </div>
              </div>

              {template.description && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                  <p className="text-gray-300 leading-relaxed">{template.description}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Technologies Covered</h3>
                <DisplayTechIcons techStack={template.techstack} />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Statistics</h3>
                <div className="space-y-2 text-gray-300">
                  <p><span className="font-medium">Completed:</span> {template.completionCount} times</p>
                  {template.averageScore && template.averageScore > 0 && (
                    <p><span className="font-medium">Average Score:</span> {Math.round(template.averageScore)}%</p>
                  )}
                  <p><span className="font-medium">Created:</span> {dayjs(template.createdAt).format("MMM D, YYYY")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* What to Expect */}
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">What to Expect</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-blue-400">🎯</span>
                  <span className="text-gray-300">AI-powered conversational interview</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-400">🎙️</span>
                  <span className="text-gray-300">Voice interaction (optional, you can type too)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-400">⏱️</span>
                  <span className="text-gray-300">Complete all {template.questionCount} questions at your own pace</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-green-400">📊</span>
                  <span className="text-gray-300">Detailed feedback and scoring</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">📝</span>
                  <span className="text-gray-300">Full transcript provided</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">🔒</span>
                  <span className="text-gray-300">Your responses are confidential</span>
                </div>
              </div>
            </div>
          </div>

          {/* Start Button */}
          <div className="text-center">
            <Button
              onClick={handleStartInterview}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            >
              Start Interview
            </Button>
            <p className="text-gray-400 text-sm mt-3">
              Make sure you have a quiet environment and working microphone/speakers
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Candidate Information Form
  if (currentView === 'form') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-700 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Before We Begin</h1>
            <p className="text-gray-300">Please provide your information</p>
          </div>

          <form onSubmit={handleCandidateInfoSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name" className="text-white">Full Name *</Label>
              <Input
                id="name"
                value={candidateInfo.name}
                onChange={(e) => setCandidateInfo(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your full name"
                className="bg-gray-800 border-gray-600 text-white"
                required
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-white">Email Address (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={candidateInfo.email}
                onChange={(e) => setCandidateInfo(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your.email@example.com"
                className="bg-gray-800 border-gray-600 text-white"
              />
              <p className="text-gray-400 text-sm mt-1">
                Optional: Provide email if you want to receive a copy of your interview results
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                onClick={handleBackToInfo}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6"
              >
                Back
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 flex-1"
              >
                Start Interview
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Interview Session
  if (currentView === 'interview') {
    return (
      <div>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white">{template.name}</h2>
          <p className="text-gray-300">Good luck, {userName}!</p>
        </div>
        
        <Agent 
          userName={userName} 
          userId={userId}
          type="template"
          templateId={templateId}
          questions={template.questions}
          role={template.role}
          level={template.level}
          techstack={template.techstack}
          interviewType={template.type.join(', ')}
        />
      </div>
    );
  }

  return null;
};

export default TemplateInterviewPage;
