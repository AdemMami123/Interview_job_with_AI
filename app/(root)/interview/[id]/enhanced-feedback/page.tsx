"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import EnhancedFeedbackDisplay from '@/components/EnhancedFeedbackDisplay';

interface EnhancedFeedbackData {
  overallScore: number;
  maxScore: number;
  accuracy: number;
  categoryScores: Array<{
    name: string;
    score: number;
    maxScore: number;
    questions: number;
    criteria: {
      technical: number;
      communication: number;
      problemSolving: number;
      leadership?: number;
    };
    benchmark: 'exceed' | 'meet' | 'approaching' | 'below';
    comment: string;
  }>;
  questionFeedback: Array<{
    questionNumber: number;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    accuracy: 'correct' | 'partially_correct' | 'incorrect';
    score: number;
    criteria: {
      correctness: number;
      completeness: number;
      clarity: number;
      relevance: number;
    };
    feedback: string;
    improvements: string[];
    keywordMatch: {
      expected: string[];
      found: string[];
      missed: string[];
    };
  }>;
  skillAssessment: {
    level: 'Expert' | 'Advanced' | 'Intermediate' | 'Beginner' | 'Novice';
    confidence: number;
    evidence: string[];
    gaps: string[];
  };
  improvementPlan: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
    resources: Array<{
      title: string;
      type: 'course' | 'book' | 'practice' | 'documentation';
      url?: string;
      description: string;
    }>;
  };
  benchmarkComparison: {
    percentile: number;
    averageScore: number;
    topPerformers: number;
  };
}

interface InterviewData {
  id: string;
  role: string;
  level: string;
  type: string;
  techstack: string[];
}

const EnhancedFeedbackPage = () => {
  const params = useParams();
  const router = useRouter();
  const [enhancedFeedback, setEnhancedFeedback] = useState<EnhancedFeedbackData | null>(null);
  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUserId = async () => {
      try {
        const response = await fetch('/api/auth/current-user');
        if (response.ok) {
          const userData = await response.json();
          if (userData.success && userData.user) {
            setCurrentUserId(userData.user.id);
            return userData.user.id;
          }
        }
        
        // Fallback to localStorage
        const storedUserId = localStorage.getItem('userId');
        setCurrentUserId(storedUserId);
        return storedUserId;
      } catch (error) {
        console.error("Error getting user:", error);
        const storedUserId = localStorage.getItem('userId');
        setCurrentUserId(storedUserId);
        return storedUserId;
      }
    };

    const fetchEnhancedFeedback = async () => {
      if (!params.id) {
        setError('Interview ID is required');
        setLoading(false);
        return;
      }

      try {
        const userId = await getUserId();
        
        // First, try to fetch existing enhanced feedback
        const response = await fetch(
          `/api/interview/feedback/enhanced?interviewId=${params.id}${userId ? `&userId=${userId}` : ''}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setEnhancedFeedback(data.feedback);
            
            // Also fetch basic interview data
            const interviewResponse = await fetch(
              `/api/interview/get/${params.id}`
            );
            if (interviewResponse.ok) {
              const interviewData = await interviewResponse.json();
              if (interviewData.success) {
                setInterview(interviewData.interview);
              }
            }
          } else {
            // Enhanced feedback doesn't exist, we'll show generate button
            setError('Enhanced feedback not available');
          }
        } else {
          setError('Enhanced feedback not found');
        }
      } catch (error) {
        console.error('Error fetching enhanced feedback:', error);
        setError('Failed to load enhanced feedback');
      } finally {
        setLoading(false);
      }
    };

    fetchEnhancedFeedback();
  }, [params.id]);

  const handleGenerateEnhancedFeedback = async () => {
    if (!params.id || !currentUserId || generating) return;
    
    setGenerating(true);
    setError(null);
    
    try {
      console.log('🔄 Starting enhanced feedback generation for interview:', params.id);
      
      const response = await fetch('/api/interview/feedback/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interviewId: params.id,
          userId: currentUserId,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setEnhancedFeedback(data.feedback);
          
          // Also fetch interview data
          const interviewResponse = await fetch(`/api/interview/get/${params.id}`);
          if (interviewResponse.ok) {
            const interviewData = await interviewResponse.json();
            if (interviewData.success) {
              setInterview(interviewData.interview);
            }
          }
          
          setError(null);
        } else {
          setError('Failed to generate enhanced feedback: ' + (data.error || 'Unknown error'));
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        setError('Failed to generate enhanced feedback: ' + (errorData.error || `HTTP ${response.status}`));
      }
    } catch (error) {
      console.error('❌ Error generating enhanced feedback:', error);
      setError('An error occurred while generating enhanced feedback: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-96">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"></div>
              <span className="text-white">Loading enhanced feedback...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !enhancedFeedback) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-96 gap-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-white mb-4">Enhanced Feedback</h2>
              <p className="text-gray-400 mb-6">
                Enhanced feedback provides detailed question-by-question analysis with precise scoring, 
                corrective feedback, and personalized improvement plans.
              </p>
              
              {error.includes('not available') || error.includes('not found') ? (
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">What You'll Get:</h3>
                  <ul className="text-left text-gray-300 space-y-2 mb-6">
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>Accuracy-based scoring for each response</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>Detailed breakdown by correctness, completeness, clarity, and relevance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>Model answers and corrective feedback for improvements</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>Skill level assessment with evidence and gap analysis</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>Personalized improvement plan with resources</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      <span>Performance benchmarking against industry standards</span>
                    </li>
                  </ul>
                  
                  <Button 
                    onClick={handleGenerateEnhancedFeedback}
                    disabled={generating}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
                  >
                    {generating ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Generating Enhanced Feedback...
                      </div>
                    ) : (
                      'Generate Enhanced Feedback'
                    )}
                  </Button>
                </div>
              ) : (
                <p className="text-red-400 mb-4">{error}</p>
              )}
              
              <div className="flex gap-4 justify-center">
                <Button variant="outline" asChild className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white">
                  <Link href={`/interview/${params.id}/feedback`}>View Basic Feedback</Link>
                </Button>
                <Button variant="outline" asChild className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white">
                  <Link href="/">Back to Dashboard</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!enhancedFeedback || !interview) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-96 gap-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-white mb-2">Unable to Load Enhanced Feedback</h2>
              <p className="text-gray-400 mb-4">Enhanced feedback data not found for this interview.</p>
              <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                <Link href="/">Back to Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Enhanced Interview Analysis</h1>
            <p className="text-gray-400">Comprehensive, data-driven feedback with actionable insights</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white">
              <Link href={`/interview/${params.id}/feedback`}>Basic Feedback</Link>
            </Button>
            <Button variant="outline" asChild className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white">
              <Link href="/">Dashboard</Link>
            </Button>
          </div>
        </div>

        {/* Enhanced Feedback Display */}
        <EnhancedFeedbackDisplay 
          feedback={enhancedFeedback}
          interviewRole={interview.role}
          interviewLevel={interview.level}
        />

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center mt-12">
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/interview">Take Another Interview</Link>
          </Button>
          <Button 
            onClick={handleGenerateEnhancedFeedback}
            disabled={generating}
            variant="outline" 
            className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            {generating ? 'Regenerating...' : 'Regenerate Analysis'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedFeedbackPage;