import React from 'react';

interface AnalysisMetrics {
  totalQuestions: number;
  correctAnswers: number;
  partiallyCorrect: number;
  incorrectAnswers: number;
  averageScore: number;
  weightedAccuracy?: number; // New weighted accuracy calculation
  consistencyScore?: number; // Performance consistency metric
  scoreConfidence?: number; // Statistical confidence in scores
  improvementTrend?: number; // Trend throughout interview
  averageCriteria: {
    correctness: number;
    completeness: number;
    clarity: number;
    relevance: number;
  };
  skillDistribution: {
    expert: number;
    advanced: number;
    intermediate: number;
    beginner: number;
    novice: number;
  };
}

interface Props {
  metrics: AnalysisMetrics;
  role: string;
  level: string;
}

const PreciseFeedbackAnalysis: React.FC<Props> = ({ metrics, role, level }) => {
  const accuracyRate = (metrics.correctAnswers / metrics.totalQuestions) * 100;
  const partialAccuracyRate = (metrics.partiallyCorrect / metrics.totalQuestions) * 100;
  const errorRate = (metrics.incorrectAnswers / metrics.totalQuestions) * 100;

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 80) return 'text-blue-400';
    if (score >= 70) return 'text-yellow-400';
    if (score >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  const getProgressBarColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 80) return 'bg-blue-500';
    if (score >= 70) return 'bg-yellow-500';
    if (score >= 60) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-700 p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Precision Analysis Metrics</h2>
      
      {/* Overall Statistics */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="text-center p-4 bg-gray-800 rounded-lg border border-gray-600">
          <div className="text-3xl font-bold text-green-400 mb-2">{metrics.correctAnswers}</div>
          <div className="text-sm text-gray-400">Correct Responses</div>
          <div className="text-xs text-gray-500">{accuracyRate.toFixed(1)}% accuracy</div>
        </div>
        
        <div className="text-center p-4 bg-gray-800 rounded-lg border border-gray-600">
          <div className="text-3xl font-bold text-yellow-400 mb-2">{metrics.partiallyCorrect}</div>
          <div className="text-sm text-gray-400">Partially Correct</div>
          <div className="text-xs text-gray-500">{partialAccuracyRate.toFixed(1)}% partial</div>
        </div>
        
        <div className="text-center p-4 bg-gray-800 rounded-lg border border-gray-600">
          <div className="text-3xl font-bold text-red-400 mb-2">{metrics.incorrectAnswers}</div>
          <div className="text-sm text-gray-400">Incorrect Responses</div>
          <div className="text-xs text-gray-500">{errorRate.toFixed(1)}% error rate</div>
        </div>
        
        <div className="text-center p-4 bg-gray-800 rounded-lg border border-gray-600">
          <div className={`text-3xl font-bold mb-2 ${getScoreColor(metrics.averageScore)}`}>
            {metrics.averageScore.toFixed(1)}
          </div>
          <div className="text-sm text-gray-400">Average Score</div>
          <div className="text-xs text-gray-500">out of 100 points</div>
        </div>
      </div>

      {/* Detailed Criteria Analysis */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-white mb-4">Evaluation Criteria Breakdown</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300 font-medium">Correctness</span>
                <span className={`font-bold ${getScoreColor(metrics.averageCriteria.correctness)}`}>
                  {metrics.averageCriteria.correctness.toFixed(1)}/100
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(metrics.averageCriteria.correctness)}`}
                  style={{ width: `${metrics.averageCriteria.correctness}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Technical accuracy and factual correctness
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300 font-medium">Completeness</span>
                <span className={`font-bold ${getScoreColor(metrics.averageCriteria.completeness)}`}>
                  {metrics.averageCriteria.completeness.toFixed(1)}/100
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(metrics.averageCriteria.completeness)}`}
                  style={{ width: `${metrics.averageCriteria.completeness}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Thoroughness and coverage of key points
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300 font-medium">Clarity</span>
                <span className={`font-bold ${getScoreColor(metrics.averageCriteria.clarity)}`}>
                  {metrics.averageCriteria.clarity.toFixed(1)}/100
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(metrics.averageCriteria.clarity)}`}
                  style={{ width: `${metrics.averageCriteria.clarity}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Communication effectiveness and articulation
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300 font-medium">Relevance</span>
                <span className={`font-bold ${getScoreColor(metrics.averageCriteria.relevance)}`}>
                  {metrics.averageCriteria.relevance.toFixed(1)}/100
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(metrics.averageCriteria.relevance)}`}
                  style={{ width: `${metrics.averageCriteria.relevance}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Appropriateness and direct answering
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Skill Level Distribution */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white mb-4">Response Quality Distribution</h3>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <span className="text-gray-300">Expert Level Responses</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(metrics.skillDistribution.expert / metrics.totalQuestions) * 100}%` }}
                  />
                </div>
                <span className="text-gray-400 text-sm w-12 text-right">
                  {metrics.skillDistribution.expert}/{metrics.totalQuestions}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-gray-300">Advanced Level Responses</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(metrics.skillDistribution.advanced / metrics.totalQuestions) * 100}%` }}
                  />
                </div>
                <span className="text-gray-400 text-sm w-12 text-right">
                  {metrics.skillDistribution.advanced}/{metrics.totalQuestions}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-gray-300">Intermediate Level Responses</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(metrics.skillDistribution.intermediate / metrics.totalQuestions) * 100}%` }}
                  />
                </div>
                <span className="text-gray-400 text-sm w-12 text-right">
                  {metrics.skillDistribution.intermediate}/{metrics.totalQuestions}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="text-gray-300">Beginner Level Responses</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(metrics.skillDistribution.beginner / metrics.totalQuestions) * 100}%` }}
                  />
                </div>
                <span className="text-gray-400 text-sm w-12 text-right">
                  {metrics.skillDistribution.beginner}/{metrics.totalQuestions}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-gray-300">Novice Level Responses</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(metrics.skillDistribution.novice / metrics.totalQuestions) * 100}%` }}
                  />
                </div>
                <span className="text-gray-400 text-sm w-12 text-right">
                  {metrics.skillDistribution.novice}/{metrics.totalQuestions}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
        <h4 className="text-lg font-semibold text-white mb-3">Key Performance Insights</h4>
        <div className="space-y-2 text-sm">
          {accuracyRate >= 80 && (
            <div className="flex items-start gap-2">
              <span className="text-green-400 mt-1">✓</span>
              <span className="text-gray-300">
                Strong accuracy rate of {accuracyRate.toFixed(1)}% indicates solid knowledge foundation
              </span>
            </div>
          )}
          
          {metrics.averageCriteria.clarity >= 80 && (
            <div className="flex items-start gap-2">
              <span className="text-green-400 mt-1">✓</span>
              <span className="text-gray-300">
                Excellent communication clarity with {metrics.averageCriteria.clarity.toFixed(1)}/100 score
              </span>
            </div>
          )}

          {metrics.averageCriteria.correctness < 70 && (
            <div className="flex items-start gap-2">
              <span className="text-orange-400 mt-1">!</span>
              <span className="text-gray-300">
                Technical accuracy needs improvement - focus on fundamental concepts
              </span>
            </div>
          )}

          {metrics.averageCriteria.completeness < 70 && (
            <div className="flex items-start gap-2">
              <span className="text-orange-400 mt-1">!</span>
              <span className="text-gray-300">
                Responses could be more comprehensive - provide more detailed explanations
              </span>
            </div>
          )}

          {errorRate > 30 && (
            <div className="flex items-start gap-2">
              <span className="text-red-400 mt-1">×</span>
              <span className="text-gray-300">
                High error rate of {errorRate.toFixed(1)}% - consider additional study and practice
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreciseFeedbackAnalysis;
