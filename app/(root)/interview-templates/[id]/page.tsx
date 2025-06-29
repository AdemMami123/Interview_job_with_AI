"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DisplayTechIcons from '@/components/DisplayTechIcons';

interface TemplateResponse {
  id: string;
  candidateName: string;
  candidateEmail: string;
  completedAt: string;
  score: number;
  feedback: {
    totalScore: number;
    categoryScores: Array<{
      name: string;
      score: number;
      comment: string;
    }>;
    strengths: string[];
    areasForImprovement: string[];
    finalAssessment: string;
    interviewInsights?: {
      mainTopicsDiscussed: string[];
      skillLevel: string;
      recommendedNext: string;
    };
  };
  responses?: Array<{
    question: string;
    answer: string;
    timestamp: string;
  }>;
}

interface TemplateDetails {
  id: string;
  name: string;
  description: string;
  role: string;
  level: string;
  type: string[];
  techstack: string[];
  duration: number;
  questionCount: number;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  shareableLink: string;
}

const TemplateResultsPage = () => {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;
  
  const [template, setTemplate] = useState<TemplateDetails | null>(null);
  const [responses, setResponses] = useState<TemplateResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'score_high' | 'score_low'>('newest');
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

    const fetchTemplateAndResponses = async () => {
      const currentUserId = await getCurrentUser();
      if (!currentUserId) {
        router.push('/sign-in');
        return;
      }

      try {
        // Fetch template details
        const templateResponse = await fetch(`/api/interview/template/${templateId}`);
        const templateData = await templateResponse.json();
        
        if (!templateData.success) {
          console.error('Failed to fetch template:', templateData.error);
          router.push('/create-template');
          return;
        }

        // Check if user owns this template
        if (templateData.template.createdBy !== currentUserId) {
          console.error('Access denied: User does not own this template');
          router.push('/create-template');
          return;
        }

        setTemplate(templateData.template);

        // Fetch template responses
        const responsesResponse = await fetch(`/api/interview/template/${templateId}/responses?userId=${currentUserId}`);
        const responsesData = await responsesResponse.json();
        
        if (responsesData.success) {
          setResponses(responsesData.responses || []);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        router.push('/create-template');
      } finally {
        setLoading(false);
      }
    };

    if (templateId) {
      fetchTemplateAndResponses();
    }
  }, [templateId, router]);

  const filteredAndSortedResponses = responses
    .filter(response =>
      (response.candidateName && response.candidateName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (response.candidateEmail && response.candidateEmail.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
        case 'oldest':
          return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
        case 'score_high':
          return (b.score || 0) - (a.score || 0);
        case 'score_low':
          return (a.score || 0) - (b.score || 0);
        default:
          return 0;
      }
    });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getCategoryColor = (score: number) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-blue-600';
    if (score >= 40) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const averageScore = responses.length > 0 
    ? Math.round(responses.reduce((sum, r) => sum + (r.score || 0), 0) / responses.length)
    : 0;

  const copyShareableLink = () => {
    if (template?.shareableLink) {
      navigator.clipboard.writeText(template.shareableLink);
      alert('Shareable link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"></div>
          <span className="text-white">Loading template results...</span>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-center text-gray-500 py-12">
        <h3 className="text-lg font-medium mb-2">Template not found</h3>
        <p className="text-sm mb-4">The template you're looking for doesn't exist or you don't have access to it.</p>
        <Button
          onClick={() => router.push('/create-template')}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Back to Templates
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-6 mb-8">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={() => router.push('/create-template')}
              variant="outline"
              className="text-gray-400 border-gray-600 hover:text-white hover:border-gray-500"
            >
              ← Back to Templates
            </Button>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2">{template.name}</h1>
          <p className="text-gray-400 mb-4">{template.description}</p>
          
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="bg-gray-800 px-3 py-1 rounded-lg">
              <span className="text-gray-400">Role:</span>
              <span className="text-white ml-2">{template.role}</span>
            </div>
            <div className="bg-gray-800 px-3 py-1 rounded-lg">
              <span className="text-gray-400">Level:</span>
              <span className="text-white ml-2">{template.level}</span>
            </div>
            <div className="bg-gray-800 px-3 py-1 rounded-lg">
              <span className="text-gray-400">Questions:</span>
              <span className="text-white ml-2">{template.questionCount}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <span className="text-gray-400 text-sm">Tech Stack:</span>
            <DisplayTechIcons techStack={template.techstack} />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg min-w-[300px]">
          <h3 className="text-lg font-semibold text-white mb-4">Template Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Responses:</span>
              <span className="text-white font-medium">{responses.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Average Score:</span>
              <span className={`font-medium ${getScoreColor(averageScore)}`}>
                {averageScore}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Visibility:</span>
              <span className={`font-medium ${template.isPublic ? 'text-green-400' : 'text-yellow-400'}`}>
                {template.isPublic ? 'Public' : 'Private'}
              </span>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-700">
            <h4 className="text-sm font-medium text-white mb-2">Share Template</h4>
            <div className="flex gap-2">
              <Input
                value={template.shareableLink}
                readOnly
                className="bg-gray-700 border-gray-600 text-white text-xs"
              />
              <Button
                onClick={copyShareableLink}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3"
              >
                Copy
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by candidate name or email..."
          className="flex-1 bg-gray-800 border-gray-600 text-white"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="bg-gray-800 border-gray-600 text-white rounded-md px-3 py-2 min-w-[200px]"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="score_high">Highest Score</option>
          <option value="score_low">Lowest Score</option>
        </select>
      </div>

      {/* Responses List */}
      {filteredAndSortedResponses.length > 0 ? (
        <div className="space-y-4">
          {filteredAndSortedResponses.map((response) => (
            <div key={response.id} className="bg-gray-800 rounded-lg p-6">
              <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="text-lg font-semibold text-white">
                      {response.candidateName}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getCategoryColor(response.score || 0)}`}>
                      {response.score || 0}%
                    </span>
                  </div>
                  
                  <p className="text-gray-400 text-sm mb-2">{response.candidateEmail}</p>
                  <p className="text-gray-500 text-xs">
                    Completed: {new Date(response.completedAt).toLocaleString()}
                  </p>
                  
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-white mb-2">AI Assessment Summary:</h4>
                    <p className="text-gray-300 text-sm">{response.feedback?.finalAssessment || 'Assessment completed'}</p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-3">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      <span className={getScoreColor(response.score || 0)}>
                        {response.score || 0}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">AI Score</div>
                  </div>
                  
                  <Button
                    onClick={() => router.push(`/interview/${response.id}/template-feedback`)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-12">
          <h3 className="text-lg font-medium mb-2">No responses yet</h3>
          <p className="text-sm mb-4">
            {searchTerm
              ? "No responses match your search criteria"
              : "No candidates have completed this interview template yet"}
          </p>
          <div className="flex flex-col items-center gap-4">
            <p className="text-xs text-gray-400">Share your template link to get started:</p>
            <div className="flex gap-2 max-w-md w-full">
              <Input
                value={template.shareableLink}
                readOnly
                className="bg-gray-700 border-gray-600 text-white text-xs"
              />
              <Button
                onClick={copyShareableLink}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Copy Link
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateResultsPage;
