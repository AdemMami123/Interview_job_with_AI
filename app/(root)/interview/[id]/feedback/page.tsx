"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import DisplayTechIcons from '@/components/DisplayTechIcons';
import TranscriptViewer from '@/components/TranscriptViewer';
import dayjs from 'dayjs';

interface FeedbackData {
  id: string;
  interviewId: string;
  interviewName: string;
  extractedTechStack: string[];
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
  createdAt: string;
}

interface InterviewData {
  id: string;
  role: string;
  level: string;
  type: string;
  techstack: string[];
  score: number;
  duration: number;
  completedAt: string;
  transcript?: { role: string; content: string }[];
}

// Helper function to convert score to star rating
const getStarRating = (score: number) => {
  if (score >= 95) return 5;
  if (score >= 85) return 4;
  if (score >= 75) return 3;
  if (score >= 65) return 2;
  if (score >= 55) return 1;
  return 0;
};

// Helper function to render stars
const renderStars = (rating: number) => {
  return Array.from({ length: 5 }, (_, index) => (
    <svg
      key={index}
      className={`w-6 h-6 ${index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ));
};

// Helper function to get performance level and color
const getPerformanceLevel = (score: number) => {
  if (score >= 90) return { text: "Excellent", color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" };
  if (score >= 80) return { text: "Very Good", color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200" };
  if (score >= 70) return { text: "Good", color: "text-yellow-600", bgColor: "bg-yellow-50", borderColor: "border-yellow-200" };
  if (score >= 60) return { text: "Fair", color: "text-orange-600", bgColor: "bg-orange-50", borderColor: "border-orange-200" };
  return { text: "Needs Improvement", color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200" };
};

const FeedbackPage = () => {
  const params = useParams();
  const router = useRouter();
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    // Get current user ID for verification
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

    const fetchFeedback = async () => {
      if (!params.id) {
        setError('Interview ID is required');
        setLoading(false);
        return;
      }

      try {
        const userId = await getUserId();
        const response = await fetch(
          `/api/interview/feedback?interviewId=${params.id}${userId ? `&userId=${userId}` : ''}`
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch feedback');
        }

        const data = await response.json();
        
        if (data.success) {
          setFeedback(data.feedback);
          setInterview(data.interview);
        } else {
          throw new Error(data.error || 'Failed to fetch feedback');
        }
      } catch (error) {
        console.error('Error fetching feedback:', error);
        setError(error instanceof Error ? error.message : 'Failed to load feedback');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [params.id]);

  const handleRegenerateFeedback = async () => {
    if (!params.id || !currentUserId || regenerating) return;
    
    setRegenerating(true);
    try {
      const response = await fetch('/api/interview/feedback/regenerate', {
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
          // Refresh the page to show updated feedback
          window.location.reload();
        } else {
          alert('Failed to regenerate feedback: ' + data.error);
        }
      } else {
        alert('Failed to regenerate feedback');
      }
    } catch (error) {
      console.error('Error regenerating feedback:', error);
      alert('An error occurred while regenerating feedback');
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"></div>
          <span className="text-white">Loading feedback...</span>
        </div>
      </div>
    );
  }

  if (error || !feedback || !interview) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 gap-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Unable to Load Feedback</h2>
          <p className="text-gray-400 mb-4">{error || 'Feedback not found for this interview.'}</p>
          <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  const starRating = getStarRating(feedback.totalScore);
  const performanceLevel = getPerformanceLevel(feedback.totalScore);
  const formattedDate = dayjs(interview.completedAt).format("MMMM D, YYYY [at] h:mm A");

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-700 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-2">
              {feedback.interviewName || interview.role}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-300">
              <span>{interview.level} • {interview.type}</span>
              <span>•</span>
              <span>Completed on {formattedDate}</span>
              <span>•</span>
              <span>{interview.duration} minutes</span>
            </div>
          </div>
          <Button variant="outline" asChild className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white">
            <Link href="/">Back to Dashboard</Link>
          </Button>
          <Button 
            variant="outline" 
            onClick={handleRegenerateFeedback}
            disabled={regenerating}
            className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white disabled:opacity-50"
          >
            {regenerating ? 'Regenerating...' : 'Regenerate Feedback'}
          </Button>
        </div>

        {/* Overall Score */}
        <div className={`p-6 rounded-lg border ${
          feedback.totalScore >= 90 ? 'bg-green-900/20 border-green-700' :
          feedback.totalScore >= 80 ? 'bg-blue-900/20 border-blue-700' :
          feedback.totalScore >= 70 ? 'bg-yellow-900/20 border-yellow-700' :
          feedback.totalScore >= 60 ? 'bg-orange-900/20 border-orange-700' :
          'bg-red-900/20 border-red-700'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Overall Performance</h3>
              <div className="flex items-center gap-3">
                <div className="flex">{renderStars(starRating)}</div>
                <span className="text-2xl font-bold text-white">{feedback.totalScore}/100</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${performanceLevel.color} bg-gray-800`}>
                  {performanceLevel.text}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400 mb-2">Technologies Covered</p>
              <DisplayTechIcons techStack={feedback.extractedTechStack} />
            </div>
          </div>
        </div>
      </div>

      {/* Category Scores */}
      <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Detailed Assessment</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {feedback.categoryScores.map((category, index) => {
            const categoryLevel = getPerformanceLevel(category.score);
            return (
              <div key={index} className="p-4 border border-gray-700 rounded-lg bg-gray-800/50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-white">{category.name}</h3>
                  <span className="text-lg font-semibold text-white">{category.score}/100</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
                  <div 
                    className={`h-2 rounded-full ${
                      category.score >= 90 ? 'bg-green-500' :
                      category.score >= 80 ? 'bg-blue-500' :
                      category.score >= 70 ? 'bg-yellow-500' :
                      category.score >= 60 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${category.score}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-300">{category.comment}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strengths and Improvements */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-green-400 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Strengths
          </h2>
          <ul className="space-y-2">
            {feedback.strengths.map((strength, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-400 mt-1">•</span>
                <span className="text-gray-300">{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-orange-400 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Areas for Improvement
          </h2>
          <ul className="space-y-2">
            {feedback.areasForImprovement.map((area, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-orange-400 mt-1">•</span>
                <span className="text-gray-300">{area}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Interview Insights */}
      {feedback.interviewInsights && (
        <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Interview Insights</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="font-medium text-white mb-2">Main Topics Discussed</h3>
              <div className="flex flex-wrap gap-2">
                {feedback.interviewInsights.mainTopicsDiscussed.map((topic, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-900/50 text-blue-300 text-xs rounded-full border border-blue-700">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-medium text-white mb-2">Skill Level Assessment</h3>
              <p className="text-sm text-gray-300">{feedback.interviewInsights.skillLevel}</p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-2">Recommended Next Steps</h3>
              <p className="text-sm text-gray-300">{feedback.interviewInsights.recommendedNext}</p>
            </div>
          </div>
        </div>
      )}

      {/* Final Assessment */}
      <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Final Assessment</h2>
        <p className="text-gray-300 leading-relaxed">{feedback.finalAssessment}</p>
      </div>

      {/* Transcript Viewer */}
      {interview.transcript && interview.transcript.length > 0 && (
        <TranscriptViewer transcript={interview.transcript} />
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
          <Link href="/interview">Take Another Interview</Link>
        </Button>
        <Button variant="outline" asChild className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white">
          <Link href="/">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
};

export default FeedbackPage;
