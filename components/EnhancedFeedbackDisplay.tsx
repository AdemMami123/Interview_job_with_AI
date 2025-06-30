import React from 'react';
import { Card } from '@/components/ui/card';
import PreciseFeedbackAnalysis from '@/components/PreciseFeedbackAnalysis';

interface QuestionFeedback {
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
}

interface CategoryScore {
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
}

interface SkillAssessment {
  level: 'Expert' | 'Advanced' | 'Intermediate' | 'Beginner' | 'Novice';
  confidence: number;
  evidence: string[];
  gaps: string[];
}

interface EnhancedFeedbackData {
  overallScore: number;
  maxScore: number;
  accuracy: number; // Note: This will be overridden by our weighted calculation
  categoryScores: CategoryScore[];
  questionFeedback: QuestionFeedback[];
  skillAssessment: SkillAssessment;
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

interface AnalyticsMetrics {
  weightedAccuracy: number;
  consistencyScore: number;
  scoreConfidence: number;
  improvementTrend: number;
  reliabilityIndex: number;
}

interface Props {
  feedback: EnhancedFeedbackData;
  interviewRole: string;
  interviewLevel: string;
}

const EnhancedFeedbackDisplay: React.FC<Props> = ({ feedback, interviewRole, interviewLevel }) => {
  // Helper functions for scoring and display - using industry-standard thresholds
  const getStarRating = (score: number, maxScore: number = 100): number => {
    const percentage = (score / maxScore) * 100;
    // Industry-standard performance thresholds for technical interviews
    if (percentage >= 90) return 5;  // Outstanding - top 10% performers
    if (percentage >= 80) return 4;  // Excellent - top 25% performers  
    if (percentage >= 70) return 3;  // Good - above average
    if (percentage >= 60) return 2;  // Fair - meets minimum requirements
    if (percentage >= 50) return 1;  // Below expectations but shows potential
    return 0; // Significant improvement needed
  };

  // Calculate weighted accuracy based on response quality
  const calculateWeightedAccuracy = (): number => {
    if (feedback.questionFeedback.length === 0) return 0;
    
    const totalWeight = feedback.questionFeedback.reduce((sum, q) => {
      // Weight based on question difficulty and importance
      const baseWeight = 1;
      const difficultyMultiplier = q.score >= 80 ? 1.2 : q.score >= 60 ? 1.0 : 0.8;
      return sum + (baseWeight * difficultyMultiplier);
    }, 0);

    const weightedScore = feedback.questionFeedback.reduce((sum, q) => {
      const weight = q.score >= 80 ? 1.2 : q.score >= 60 ? 1.0 : 0.8;
      const accuracyValue = q.accuracy === 'correct' ? 1 : 
                           q.accuracy === 'partially_correct' ? 0.6 : 0;
      return sum + (accuracyValue * weight);
    }, 0);

    return Math.round((weightedScore / totalWeight) * 100);
  };

  // Calculate confidence interval for scores
  const calculateScoreConfidence = (scores: number[]): { lower: number; upper: number; confidence: number } => {
    if (scores.length === 0) return { lower: 0, upper: 0, confidence: 0 };
    
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    // 95% confidence interval
    const marginOfError = 1.96 * (stdDev / Math.sqrt(scores.length));
    const confidence = Math.max(60, Math.min(95, 100 - (stdDev / mean) * 50));
    
    return {
      lower: Math.max(0, mean - marginOfError),
      upper: Math.min(100, mean + marginOfError),
      confidence: Math.round(confidence)
    };
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <svg
        key={index}
        className={`w-5 h-5 ${index < rating ? 'text-yellow-400 fill-current' : 'text-gray-400'}`}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  const getAccuracyColor = (accuracy: string) => {
    switch (accuracy) {
      case 'correct': return 'text-green-400 bg-green-900/20 border-green-700';
      case 'partially_correct': return 'text-yellow-400 bg-yellow-900/20 border-yellow-700';
      case 'incorrect': return 'text-red-400 bg-red-900/20 border-red-700';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-700';
    }
  };

  const getBenchmarkColor = (benchmark: string) => {
    switch (benchmark) {
      case 'exceed': return 'text-green-400';
      case 'meet': return 'text-blue-400';
      case 'approaching': return 'text-yellow-400';
      case 'below': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'Expert': return 'text-purple-400 bg-purple-900/20';
      case 'Advanced': return 'text-green-400 bg-green-900/20';
      case 'Intermediate': return 'text-blue-400 bg-blue-900/20';
      case 'Beginner': return 'text-yellow-400 bg-yellow-900/20';
      case 'Novice': return 'text-red-400 bg-red-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const overallPercentage = (feedback.overallScore / feedback.maxScore) * 100;
  const overallStars = getStarRating(feedback.overallScore, feedback.maxScore);

  // Calculate realistic accuracy using weighted method
  const weightedAccuracy = calculateWeightedAccuracy();
  
  // Calculate score confidence and reliability metrics
  const questionScores = feedback.questionFeedback.map(q => q.score);
  const scoreConfidence = calculateScoreConfidence(questionScores);
  
  // Calculate performance consistency 
  const scoreStdDev = Math.sqrt(
    questionScores.reduce((sum, score) => sum + Math.pow(score - feedback.overallScore, 2), 0) / questionScores.length
  );
  const consistencyScore = Math.max(0, 100 - (scoreStdDev * 2)); // Lower std dev = higher consistency

  // Calculate skill progression indicator
  const firstHalfAvg = questionScores.slice(0, Math.ceil(questionScores.length / 2))
    .reduce((sum, score) => sum + score, 0) / Math.ceil(questionScores.length / 2);
  const secondHalfAvg = questionScores.slice(Math.ceil(questionScores.length / 2))
    .reduce((sum, score) => sum + score, 0) / Math.floor(questionScores.length / 2);
  const improvementTrend = secondHalfAvg - firstHalfAvg;

  // Calculate realistic precision metrics for analysis
  const precisionMetrics = {
    totalQuestions: feedback.questionFeedback.length,
    correctAnswers: feedback.questionFeedback.filter(q => q.accuracy === 'correct').length,
    partiallyCorrect: feedback.questionFeedback.filter(q => q.accuracy === 'partially_correct').length,
    incorrectAnswers: feedback.questionFeedback.filter(q => q.accuracy === 'incorrect').length,
    averageScore: feedback.overallScore,
    weightedAccuracy, // Using our calculated weighted accuracy
    consistencyScore: Math.round(consistencyScore),
    scoreConfidence: scoreConfidence.confidence,
    improvementTrend: Math.round(improvementTrend),
    averageCriteria: {
      correctness: Math.round(feedback.questionFeedback.reduce((sum, q) => sum + q.criteria.correctness, 0) / feedback.questionFeedback.length),
      completeness: Math.round(feedback.questionFeedback.reduce((sum, q) => sum + q.criteria.completeness, 0) / feedback.questionFeedback.length),
      clarity: Math.round(feedback.questionFeedback.reduce((sum, q) => sum + q.criteria.clarity, 0) / feedback.questionFeedback.length),
      relevance: Math.round(feedback.questionFeedback.reduce((sum, q) => sum + q.criteria.relevance, 0) / feedback.questionFeedback.length),
    },
    skillDistribution: {
      expert: feedback.questionFeedback.filter(q => q.score >= 90).length,
      advanced: feedback.questionFeedback.filter(q => q.score >= 80 && q.score < 90).length,
      intermediate: feedback.questionFeedback.filter(q => q.score >= 65 && q.score < 80).length,
      beginner: feedback.questionFeedback.filter(q => q.score >= 50 && q.score < 65).length,
      novice: feedback.questionFeedback.filter(q => q.score < 50).length,
    }
  };

  return (
    <div className="space-y-8">
      {/* Overall Performance Summary */}
      <Card className="bg-gray-900 border-gray-700 p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">Interview Performance Report</h2>
          <p className="text-gray-300 text-lg">{interviewRole} • {interviewLevel} Level</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Overall Score */}
          <div className="text-center p-6 bg-gray-800 rounded-lg border border-gray-600">
            <h3 className="text-lg font-semibold text-white mb-2">Overall Score</h3>
            <div className="text-4xl font-bold text-white mb-2">
              {feedback.overallScore}/{feedback.maxScore}
            </div>
            <div className="text-2xl text-gray-300 mb-3">
              {overallPercentage.toFixed(1)}%
            </div>
            <div className="flex justify-center mb-2">
              {renderStars(overallStars)}
            </div>
            <div className="text-sm text-gray-400">
              {overallPercentage >= 90 ? 'Outstanding' :
               overallPercentage >= 80 ? 'Excellent' :
               overallPercentage >= 70 ? 'Good' :
               overallPercentage >= 60 ? 'Fair' : 'Needs Improvement'}
            </div>
          </div>

          {/* Accuracy Rate */}
          <div className="text-center p-6 bg-gray-800 rounded-lg border border-gray-600">
            <h3 className="text-lg font-semibold text-white mb-2">Answer Accuracy</h3>
            <div className="text-4xl font-bold text-blue-400 mb-2">
              {weightedAccuracy.toFixed(1)}%
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3 mb-3">
              <div 
                className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${weightedAccuracy}%` }}
              />
            </div>
            <div className="text-sm text-gray-400">
              Weighted Response Accuracy
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Confidence: {scoreConfidence.confidence}%
            </div>
          </div>

          {/* Skill Level */}
          <div className="text-center p-6 bg-gray-800 rounded-lg border border-gray-600">
            <h3 className="text-lg font-semibold text-white mb-2">Skill Assessment</h3>
            <div className={`text-2xl font-bold mb-2 px-3 py-1 rounded-lg ${getSkillLevelColor(feedback.skillAssessment.level)}`}>
              {feedback.skillAssessment.level}
            </div>
            <div className="text-sm text-gray-300 mb-2">
              Confidence: {feedback.skillAssessment.confidence}%
            </div>
            <div className="text-sm text-gray-400">
              Based on {feedback.questionFeedback.length} responses
            </div>
          </div>
        </div>

        {/* Enhanced Benchmark Comparison with Realistic Metrics */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
          <h3 className="text-xl font-semibold text-white mb-4">Performance Analytics & Benchmarks</h3>
          <div className="grid md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-purple-400">
                {feedback.benchmarkComparison.percentile}th
              </div>
              <div className="text-sm text-gray-400">Percentile</div>
              <div className="text-xs text-gray-500">Industry ranking</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">
                {precisionMetrics.consistencyScore}%
              </div>
              <div className="text-sm text-gray-400">Consistency Score</div>
              <div className="text-xs text-gray-500">Performance stability</div>
            </div>
            <div>
              <div className={`text-2xl font-bold ${improvementTrend >= 0 ? 'text-green-400' : 'text-orange-400'}`}>
                {improvementTrend >= 0 ? '+' : ''}{improvementTrend.toFixed(1)}
              </div>
              <div className="text-sm text-gray-400">Improvement Trend</div>
              <div className="text-xs text-gray-500">During interview</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400">
                {scoreConfidence.lower.toFixed(0)}-{scoreConfidence.upper.toFixed(0)}
              </div>
              <div className="text-sm text-gray-400">Score Range</div>
              <div className="text-xs text-gray-500">95% confidence</div>
            </div>
          </div>
          
          {/* Performance Insights */}
          <div className="mt-4 p-4 bg-gray-700 rounded-lg">
            <h4 className="text-white font-medium mb-2">Key Performance Insights:</h4>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span className={`${consistencyScore >= 80 ? 'text-green-400' : consistencyScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {consistencyScore >= 80 ? '✓' : consistencyScore >= 60 ? '!' : '×'}
                </span>
                <span className="text-gray-300">
                  {consistencyScore >= 80 ? 'Highly consistent performance' : 
                   consistencyScore >= 60 ? 'Moderate performance variation' : 
                   'Inconsistent response quality'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`${improvementTrend >= 5 ? 'text-green-400' : improvementTrend >= -5 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {improvementTrend >= 5 ? '↗' : improvementTrend >= -5 ? '→' : '↘'}
                </span>
                <span className="text-gray-300">
                  {improvementTrend >= 5 ? 'Strong improvement throughout interview' : 
                   improvementTrend >= -5 ? 'Stable performance maintained' : 
                   'Performance declined during interview'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Precision Analysis Metrics */}
      <PreciseFeedbackAnalysis 
        metrics={precisionMetrics}
        role={interviewRole}
        level={interviewLevel}
      />

      {/* Detailed Category Analysis */}
      <Card className="bg-gray-900 border-gray-700 p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Category Performance Analysis</h2>
        <div className="space-y-6">
          {feedback.categoryScores.map((category, index) => {
            const categoryPercentage = (category.score / category.maxScore) * 100;
            const categoryStars = getStarRating(category.score, category.maxScore);
            
            return (
              <div key={index} className="bg-gray-800 rounded-lg p-6 border border-gray-600">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{category.name}</h3>
                    <p className="text-gray-400 text-sm">{category.questions} questions assessed</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      {category.score}/{category.maxScore}
                    </div>
                    <div className="flex justify-end mb-1">
                      {renderStars(categoryStars)}
                    </div>
                    <div className={`text-sm font-medium ${getBenchmarkColor(category.benchmark)}`}>
                      {category.benchmark.replace('_', ' ').toUpperCase()} Benchmark
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      categoryPercentage >= 90 ? 'bg-green-500' :
                      categoryPercentage >= 80 ? 'bg-blue-500' :
                      categoryPercentage >= 70 ? 'bg-yellow-500' :
                      categoryPercentage >= 60 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${categoryPercentage}%` }}
                  />
                </div>

                {/* Criteria Breakdown */}
                <div className="grid md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-white">{category.criteria.technical}</div>
                    <div className="text-xs text-gray-400">Technical</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-white">{category.criteria.communication}</div>
                    <div className="text-xs text-gray-400">Communication</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-white">{category.criteria.problemSolving}</div>
                    <div className="text-xs text-gray-400">Problem Solving</div>
                  </div>
                  {category.criteria.leadership && (
                    <div className="text-center">
                      <div className="text-lg font-semibold text-white">{category.criteria.leadership}</div>
                      <div className="text-xs text-gray-400">Leadership</div>
                    </div>
                  )}
                </div>

                <p className="text-gray-300 text-sm">{category.comment}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Question-by-Question Analysis */}
      <Card className="bg-gray-900 border-gray-700 p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Question-by-Question Analysis</h2>
        <div className="space-y-6">
          {feedback.questionFeedback.map((qFeedback, index) => (
            <div key={index} className="bg-gray-800 rounded-lg p-6 border border-gray-600">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Question {qFeedback.questionNumber}
                </h3>
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getAccuracyColor(qFeedback.accuracy)}`}>
                    {qFeedback.accuracy.replace('_', ' ').toUpperCase()}
                  </div>
                  <div className="text-xl font-bold text-white">
                    {qFeedback.score}/100
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-300 mb-2">Question:</h4>
                <p className="text-gray-400 bg-gray-700 p-3 rounded">{qFeedback.question}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-4">
                <div>
                  <h4 className="font-medium text-gray-300 mb-2">Your Answer:</h4>
                  <p className="text-gray-400 bg-gray-700 p-3 rounded text-sm">
                    {qFeedback.userAnswer}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-300 mb-2">Model Answer:</h4>
                  <p className="text-gray-400 bg-green-900/20 p-3 rounded text-sm border border-green-700">
                    {qFeedback.correctAnswer}
                  </p>
                </div>
              </div>

              {/* Enhanced Scoring Criteria with Realistic Weightings */}
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-white">{qFeedback.criteria.correctness}/100</div>
                  <div className="text-xs text-gray-400">Correctness</div>
                  <div className="text-xs text-gray-500">(40% weight)</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-white">{qFeedback.criteria.completeness}/100</div>
                  <div className="text-xs text-gray-400">Completeness</div>
                  <div className="text-xs text-gray-500">(25% weight)</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-white">{qFeedback.criteria.clarity}/100</div>
                  <div className="text-xs text-gray-400">Clarity</div>
                  <div className="text-xs text-gray-500">(20% weight)</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-white">{qFeedback.criteria.relevance}/100</div>
                  <div className="text-xs text-gray-400">Relevance</div>
                  <div className="text-xs text-gray-500">(15% weight)</div>
                </div>
              </div>

              {/* Question Difficulty & Impact Assessment */}
              <div className="mb-4 p-3 bg-gray-700 rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <span className="text-gray-300">Question Weight: </span>
                    <span className={`font-medium ${
                      qFeedback.score >= 80 ? 'text-purple-400' : 
                      qFeedback.score >= 60 ? 'text-blue-400' : 
                      'text-yellow-400'
                    }`}>
                      {qFeedback.score >= 80 ? 'High Impact' : 
                       qFeedback.score >= 60 ? 'Standard' : 
                       'Foundational'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-300">Calculated Score: </span>
                    <span className="text-white font-bold">
                      {Math.round(
                        qFeedback.criteria.correctness * 0.4 + 
                        qFeedback.criteria.completeness * 0.25 + 
                        qFeedback.criteria.clarity * 0.2 + 
                        qFeedback.criteria.relevance * 0.15
                      )}/100
                    </span>
                  </div>
                </div>
              </div>

              {/* Enhanced Keyword Analysis with Scoring Impact */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-300 mb-2">Keyword & Content Analysis:</h4>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-green-400 font-medium">Key Terms Found ({qFeedback.keywordMatch.found.length}): </span>
                    <div className="text-gray-400 mt-1">
                      {qFeedback.keywordMatch.found.length > 0 ? (
                        qFeedback.keywordMatch.found.map((keyword, idx) => (
                          <span key={idx} className="inline-block bg-green-900/30 text-green-300 px-2 py-1 rounded-full text-xs mr-1 mb-1">
                            {keyword}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500">None detected</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-red-400 font-medium">Missing Key Terms ({qFeedback.keywordMatch.missed.length}): </span>
                    <div className="text-gray-400 mt-1">
                      {qFeedback.keywordMatch.missed.length > 0 ? (
                        qFeedback.keywordMatch.missed.map((keyword, idx) => (
                          <span key={idx} className="inline-block bg-red-900/30 text-red-300 px-2 py-1 rounded-full text-xs mr-1 mb-1">
                            {keyword}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500">All covered</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-400 font-medium">Content Quality: </span>
                    <div className="text-gray-400 mt-1">
                      <div className={`inline-block px-2 py-1 rounded-full text-xs ${
                        qFeedback.keywordMatch.found.length / qFeedback.keywordMatch.expected.length >= 0.8 ? 'bg-green-900/30 text-green-300' :
                        qFeedback.keywordMatch.found.length / qFeedback.keywordMatch.expected.length >= 0.5 ? 'bg-yellow-900/30 text-yellow-300' :
                        'bg-red-900/30 text-red-300'
                      }`}>
                        {Math.round((qFeedback.keywordMatch.found.length / qFeedback.keywordMatch.expected.length) * 100)}% keyword coverage
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-300 mb-2">Feedback:</h4>
                <p className="text-gray-400 text-sm">{qFeedback.feedback}</p>
              </div>

              {qFeedback.improvements.length > 0 && (
                <div>
                  <h4 className="font-medium text-orange-400 mb-2">Specific Improvements:</h4>
                  <ul className="space-y-1">
                    {qFeedback.improvements.map((improvement, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-orange-400 mt-1">•</span>
                        <span className="text-gray-400">{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Transparent Scoring Logic Explanation */}
      <Card className="bg-gray-900 border-gray-700 p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Scoring Methodology & Transparency</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg p-5 border border-gray-600">
            <h3 className="text-lg font-semibold text-blue-400 mb-3">Assessment Criteria Weights</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Technical Correctness</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '40%' }}></div>
                  </div>
                  <span className="text-white font-medium">40%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Response Completeness</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                  <span className="text-white font-medium">25%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Communication Clarity</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-700 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '20%' }}></div>
                  </div>
                  <span className="text-white font-medium">20%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Answer Relevance</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-700 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                  </div>
                  <span className="text-white font-medium">15%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-5 border border-gray-600">
            <h3 className="text-lg font-semibold text-green-400 mb-3">Performance Benchmarks</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Expert Level (90-100)</span>
                <span className="text-purple-400 font-medium">Top 5% performers</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Advanced Level (80-89)</span>
                <span className="text-green-400 font-medium">Top 20% performers</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Proficient Level (70-79)</span>
                <span className="text-blue-400 font-medium">Above average</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Competent Level (60-69)</span>
                <span className="text-yellow-400 font-medium">Meets requirements</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Developing Level (50-59)</span>
                <span className="text-orange-400 font-medium">Needs improvement</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Novice Level (&lt;50)</span>
                <span className="text-red-400 font-medium">Significant gaps</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-900/20 rounded-lg border border-blue-700">
          <h4 className="text-blue-400 font-medium mb-2">Scoring Confidence & Reliability</h4>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-white">{scoreConfidence.confidence}%</div>
              <div className="text-gray-400">Assessment Confidence</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">{precisionMetrics.consistencyScore}%</div>
              <div className="text-gray-400">Response Consistency</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">{feedback.questionFeedback.length}</div>
              <div className="text-gray-400">Data Points Analyzed</div>
            </div>
          </div>
          <p className="text-gray-300 text-sm mt-3">
            Scores are calculated using weighted criteria with {scoreConfidence.confidence}% statistical confidence. 
            Performance ranges from {scoreConfidence.lower.toFixed(1)} to {scoreConfidence.upper.toFixed(1)} 
            based on response quality analysis.
          </p>
        </div>
      </Card>

      {/* Skill Assessment Details */}
      <Card className="bg-gray-900 border-gray-700 p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Detailed Skill Assessment</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-green-400 mb-4">Evidence of Competency</h3>
            <ul className="space-y-2">
              {feedback.skillAssessment.evidence.map((evidence, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span className="text-gray-300 text-sm">{evidence}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-red-400 mb-4">Identified Skill Gaps</h3>
            <ul className="space-y-2">
              {feedback.skillAssessment.gaps.map((gap, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">×</span>
                  <span className="text-gray-300 text-sm">{gap}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* Improvement Plan */}
      <Card className="bg-gray-900 border-gray-700 p-6">
        <h2 className="text-2xl font-bold text-white mb-6">Personalized Improvement Plan</h2>
        
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div>
            <h3 className="text-lg font-semibold text-red-400 mb-4">Immediate Actions (1-2 weeks)</h3>
            <ul className="space-y-2">
              {feedback.improvementPlan.immediate.map((action, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">•</span>
                  <span className="text-gray-300 text-sm">{action}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-yellow-400 mb-4">Short-term Goals (1-3 months)</h3>
            <ul className="space-y-2">
              {feedback.improvementPlan.shortTerm.map((goal, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">•</span>
                  <span className="text-gray-300 text-sm">{goal}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-green-400 mb-4">Long-term Development (3-6 months)</h3>
            <ul className="space-y-2">
              {feedback.improvementPlan.longTerm.map((development, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">•</span>
                  <span className="text-gray-300 text-sm">{development}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Recommended Resources */}
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">Recommended Learning Resources</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {feedback.improvementPlan.resources.map((resource, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-4 border border-gray-600">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-white">{resource.title}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    resource.type === 'course' ? 'bg-blue-900/50 text-blue-300' :
                    resource.type === 'book' ? 'bg-purple-900/50 text-purple-300' :
                    resource.type === 'practice' ? 'bg-green-900/50 text-green-300' :
                    'bg-gray-700 text-gray-300'
                  }`}>
                    {resource.type}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-2">{resource.description}</p>
                {resource.url && (
                  <a 
                    href={resource.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm underline"
                  >
                    Access Resource →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EnhancedFeedbackDisplay;
