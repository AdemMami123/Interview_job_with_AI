import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import DisplayTechIcons from './DisplayTechIcons';

interface RecommendedInterview {
  id: string;
  name: string;
  description?: string;
  role: string;
  level: string;
  type: string[];
  techstack: string[];
  questionCount: number;
  completionCount: number;
  averageScore?: number;
  recommendationScore: number;
  reasons: string[];
  category: string;
  rank: number;
  confidence: number;
}

interface RecommendedInterviewsProps {
  recommendations: RecommendedInterview[];
  isLoading: boolean;
  userSkillProfile?: {
    dominantTechStack: string[];
    experienceLevel: string;
    strongAreas: string[];
    improvementAreas: string[];
    recentPerformance: number;
  };
}

const RecommendedInterviews: React.FC<RecommendedInterviewsProps> = ({
  recommendations,
  isLoading,
  userSkillProfile
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-900 border border-gray-700 rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-3/4 mb-3"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="flex gap-2 mb-3">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-6 w-16 bg-gray-700 rounded"></div>
              ))}
            </div>
            <div className="h-10 bg-gray-700 rounded w-32"></div>
          </div>
        ))}
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-900 border border-gray-700 rounded-lg">
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-white">Getting Recommendations Ready</h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            We're preparing personalized interview recommendations for you. Complete an interview to unlock skill-based suggestions!
          </p>
          <Button asChild className="mt-4">
            <Link href="/interview">Start Your First Interview</Link>
          </Button>
        </div>
      </div>
    );
  }

  const getCategoryBadgeColor = (category: string) => {
    const colors = {
      'skill_improvement': 'bg-red-900/50 text-red-300 border-red-700',
      'skill_reinforcement': 'bg-green-900/50 text-green-300 border-green-700',
      'level_progression': 'bg-blue-900/50 text-blue-300 border-blue-700',
      'trending': 'bg-purple-900/50 text-purple-300 border-purple-700',
      'diverse': 'bg-orange-900/50 text-orange-300 border-orange-700',
      'general': 'bg-gray-900/50 text-gray-300 border-gray-700'
    };
    return colors[category as keyof typeof colors] || colors.general;
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      'skill_improvement': '📈',
      'skill_reinforcement': '💪',
      'level_progression': '🚀',
      'trending': '🔥',
      'diverse': '🌟',
      'general': '📝'
    };
    return icons[category as keyof typeof icons] || icons.general;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-orange-400';
  };

  return (
    <div className="space-y-4">
      {userSkillProfile && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-white mb-3">
            Recommendations based on your profile
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-gray-400">Experience Level:</span>
              <div className="text-white font-medium">{userSkillProfile.experienceLevel}</div>
            </div>
            <div>
              <span className="text-gray-400">Strong Areas:</span>
              <div className="text-green-400 font-medium">
                {userSkillProfile.strongAreas.slice(0, 2).join(', ') || 'Building profile...'}
              </div>
            </div>
            <div>
              <span className="text-gray-400">Focus Areas:</span>
              <div className="text-orange-400 font-medium">
                {userSkillProfile.improvementAreas.slice(0, 2).join(', ') || 'Building profile...'}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {recommendations.map((recommendation) => (
          <div
            key={recommendation.id}
            className="bg-gray-900 border border-gray-700 rounded-lg p-6 hover:border-gray-600 transition-colors group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                    {recommendation.name || `${recommendation.role} Interview`}
                  </h3>
                  <div className={`px-2 py-1 text-xs border rounded-full ${getCategoryBadgeColor(recommendation.category)}`}>
                    {getCategoryIcon(recommendation.category)} {recommendation.reasons[0]}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 mb-3 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    📋 {recommendation.role}
                  </span>
                  <span className="flex items-center gap-1">
                    ⭐ {recommendation.level}
                  </span>
                  <span className="flex items-center gap-1">
                    ❓ {recommendation.questionCount} questions
                  </span>
                  {recommendation.completionCount > 0 && (
                    <span className="flex items-center gap-1">
                      👥 {recommendation.completionCount} completed
                    </span>
                  )}
                </div>

                {recommendation.description && (
                  <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                    {recommendation.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  <DisplayTechIcons techStack={recommendation.techstack} />
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className={`font-medium ${getConfidenceColor(recommendation.confidence)}`}>
                    {Math.round(recommendation.confidence * 100)}% match
                  </span>
                  {recommendation.reasons.slice(0, 2).map((reason, index) => (
                    <span key={index} className="flex items-center gap-1">
                      • {reason}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 ml-4">
                <div className="text-right">
                  <div className="text-xs text-gray-400">Rank</div>
                  <div className="text-lg font-bold text-white">#{recommendation.rank}</div>
                </div>
                
                <Button 
                  asChild 
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-500 text-white"
                >
                  <Link href={`/interview/template/${recommendation.id}`}>
                    Start Interview
                  </Link>
                </Button>
              </div>
            </div>

            {recommendation.averageScore && (
              <div className="mt-4 pt-3 border-t border-gray-700 text-xs text-gray-400">
                <span>Average score: </span>
                <span className="text-white font-medium">{Math.round(recommendation.averageScore)}%</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-center pt-4">
        <Button asChild variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
          <Link href="/interview-templates">Browse All Templates</Link>
        </Button>
      </div>
    </div>
  );
};

export default RecommendedInterviews;
