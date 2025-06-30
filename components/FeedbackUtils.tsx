// Utility functions for feedback calculations and scoring

export interface ScoringCriteria {
  correctness: number;
  completeness: number;
  clarity: number;
  relevance: number;
}

export interface FeedbackMetrics {
  totalScore: number;
  maxScore: number;
  accuracy: number;
  averageCriteria: ScoringCriteria;
}

/**
 * Convert numeric score to star rating (1-5 stars)
 */
export const calculateStarRating = (score: number, maxScore: number = 100): number => {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 95) return 5;
  if (percentage >= 85) return 4;
  if (percentage >= 75) return 3;
  if (percentage >= 65) return 2;
  if (percentage >= 55) return 1;
  return 0;
};

/**
 * Get performance level based on score
 */
export const getPerformanceLevel = (score: number, maxScore: number = 100) => {
  const percentage = (score / maxScore) * 100;
  
  if (percentage >= 90) {
    return {
      text: "Outstanding",
      color: "text-purple-400",
      bgColor: "bg-purple-900/20",
      borderColor: "border-purple-700",
      description: "Exceptional performance that exceeds expectations"
    };
  }
  
  if (percentage >= 80) {
    return {
      text: "Excellent",
      color: "text-green-400",
      bgColor: "bg-green-900/20",
      borderColor: "border-green-700",
      description: "Strong performance demonstrating solid competency"
    };
  }
  
  if (percentage >= 70) {
    return {
      text: "Good",
      color: "text-blue-400",
      bgColor: "bg-blue-900/20",
      borderColor: "border-blue-700",
      description: "Good performance with room for improvement"
    };
  }
  
  if (percentage >= 60) {
    return {
      text: "Fair",
      color: "text-yellow-400",
      bgColor: "bg-yellow-900/20",
      borderColor: "border-yellow-700",
      description: "Adequate performance requiring focused development"
    };
  }
  
  return {
    text: "Needs Improvement",
    color: "text-red-400",
    bgColor: "bg-red-900/20",
    borderColor: "border-red-700",
    description: "Significant improvement needed across key areas"
  };
};

/**
 * Calculate skill level based on overall performance
 */
export const calculateSkillLevel = (averageScore: number, accuracyRate: number) => {
  if (averageScore >= 90 && accuracyRate >= 85) {
    return {
      level: "Expert" as const,
      description: "Demonstrates mastery with exceptional accuracy and depth",
      confidence: 95
    };
  }
  
  if (averageScore >= 80 && accuracyRate >= 75) {
    return {
      level: "Advanced" as const,
      description: "Strong competency with consistent high-quality responses",
      confidence: 85
    };
  }
  
  if (averageScore >= 65 && accuracyRate >= 60) {
    return {
      level: "Intermediate" as const,
      description: "Solid foundation with good understanding of key concepts",
      confidence: 70
    };
  }
  
  if (averageScore >= 50 && accuracyRate >= 40) {
    return {
      level: "Beginner" as const,
      description: "Basic understanding with opportunities for growth",
      confidence: 55
    };
  }
  
  return {
    level: "Novice" as const,
    description: "Foundational skills need development",
    confidence: 35
  };
};

/**
 * Generate benchmark comparison data
 */
export const calculateBenchmarkComparison = (score: number, role: string, level: string) => {
  // Industry benchmark data (simulated)
  const benchmarks = {
    'Junior': { average: 65, top10: 80, top25: 75 },
    'Mid-level': { average: 72, top10: 85, top25: 80 },
    'Senior': { average: 78, top10: 90, top25: 85 },
    'Lead': { average: 82, top10: 93, top25: 88 },
    'Principal': { average: 85, top10: 95, top25: 90 }
  };

  const benchmark = benchmarks[level as keyof typeof benchmarks] || benchmarks['Mid-level'];
  
  // Calculate percentile
  let percentile;
  if (score >= benchmark.top10) {
    percentile = Math.min(95, 90 + ((score - benchmark.top10) / (100 - benchmark.top10)) * 5);
  } else if (score >= benchmark.top25) {
    percentile = 75 + ((score - benchmark.top25) / (benchmark.top10 - benchmark.top25)) * 15;
  } else if (score >= benchmark.average) {
    percentile = 50 + ((score - benchmark.average) / (benchmark.top25 - benchmark.average)) * 25;
  } else {
    percentile = Math.max(5, (score / benchmark.average) * 50);
  }

  return {
    percentile: Math.round(percentile),
    averageScore: benchmark.average,
    topPerformers: benchmark.top10,
    comparison: score >= benchmark.top10 ? 'top_performer' : 
                score >= benchmark.top25 ? 'above_average' :
                score >= benchmark.average ? 'average' : 'below_average'
  };
};

/**
 * Calculate accuracy rate from question responses
 */
export const calculateAccuracy = (questionFeedback: Array<{accuracy: string}>) => {
  const correctAnswers = questionFeedback.filter(q => q.accuracy === 'correct').length;
  const partiallyCorrect = questionFeedback.filter(q => q.accuracy === 'partially_correct').length;
  
  // Full credit for correct, half credit for partially correct
  const totalCredit = correctAnswers + (partiallyCorrect * 0.5);
  return (totalCredit / questionFeedback.length) * 100;
};

/**
 * Generate improvement recommendations based on performance
 */
export const generateImprovementRecommendations = (
  questionFeedback: Array<{criteria: ScoringCriteria, score: number}>,
  skillLevel: string,
  averageScore: number
) => {
  const recommendations = {
    immediate: [] as string[],
    shortTerm: [] as string[],
    longTerm: [] as string[]
  };

  // Calculate average criteria scores
  const avgCriteria = {
    correctness: questionFeedback.reduce((sum, q) => sum + q.criteria.correctness, 0) / questionFeedback.length,
    completeness: questionFeedback.reduce((sum, q) => sum + q.criteria.completeness, 0) / questionFeedback.length,
    clarity: questionFeedback.reduce((sum, q) => sum + q.criteria.clarity, 0) / questionFeedback.length,
    relevance: questionFeedback.reduce((sum, q) => sum + q.criteria.relevance, 0) / questionFeedback.length
  };

  // Immediate actions (1-2 weeks)
  if (avgCriteria.clarity < 70) {
    recommendations.immediate.push("Practice explaining technical concepts aloud daily for 15 minutes");
    recommendations.immediate.push("Record yourself answering practice questions to improve clarity");
  }
  
  if (avgCriteria.correctness < 70) {
    recommendations.immediate.push("Review fundamental concepts in areas where you scored below 70%");
    recommendations.immediate.push("Use flashcards for key technical terms and definitions");
  }

  if (averageScore < 60) {
    recommendations.immediate.push("Take one practice interview per week with feedback");
    recommendations.immediate.push("Study common interview questions for your role");
  }

  // Short-term goals (1-3 months)
  if (avgCriteria.completeness < 75) {
    recommendations.shortTerm.push("Create detailed project portfolios with comprehensive explanations");
    recommendations.shortTerm.push("Practice STAR method for behavioral questions");
  }

  if (skillLevel === 'Beginner' || skillLevel === 'Novice') {
    recommendations.shortTerm.push("Complete 2-3 hands-on projects in your technology stack");
    recommendations.shortTerm.push("Join developer communities and participate in discussions");
  }

  recommendations.shortTerm.push("Attend technical workshops or online courses");
  recommendations.shortTerm.push("Find a mentor in your field for guidance and feedback");

  // Long-term development (3-6 months)
  if (averageScore >= 80) {
    recommendations.longTerm.push("Develop leadership skills through team projects or mentoring");
    recommendations.longTerm.push("Contribute to open-source projects to demonstrate expertise");
  }

  recommendations.longTerm.push("Pursue advanced certifications in your specialization");
  recommendations.longTerm.push("Build a comprehensive portfolio showcasing diverse projects");
  recommendations.longTerm.push("Practice system design and architecture discussions");

  return recommendations;
};

/**
 * Format score with appropriate precision and color coding
 */
export const formatScore = (score: number, maxScore: number = 100, precision: number = 1) => {
  const formatted = score.toFixed(precision);
  const percentage = (score / maxScore) * 100;
  
  const colorClass = percentage >= 90 ? 'text-purple-400' :
                    percentage >= 80 ? 'text-green-400' :
                    percentage >= 70 ? 'text-blue-400' :
                    percentage >= 60 ? 'text-yellow-400' : 'text-red-400';
  
  return {
    value: formatted,
    percentage: percentage.toFixed(1),
    colorClass
  };
};

/**
 * Calculate category-specific benchmarks
 */
export const calculateCategoryBenchmark = (score: number, categoryName: string, role: string) => {
  // Category-specific expectations
  const categoryExpectations = {
    'Technical Knowledge': { excellent: 85, good: 75, fair: 65 },
    'Problem Solving': { excellent: 80, good: 70, fair: 60 },
    'Communication': { excellent: 90, good: 80, fair: 70 },
    'Experience & Projects': { excellent: 85, good: 75, fair: 65 },
    'System Design': { excellent: 80, good: 70, fair: 60 }
  };

  const expectations = categoryExpectations[categoryName as keyof typeof categoryExpectations] || 
                      categoryExpectations['Technical Knowledge'];

  if (score >= expectations.excellent) return 'exceed';
  if (score >= expectations.good) return 'meet';
  if (score >= expectations.fair) return 'approaching';
  return 'below';
};

export default {
  calculateStarRating,
  getPerformanceLevel,
  calculateSkillLevel,
  calculateBenchmarkComparison,
  calculateAccuracy,
  generateImprovementRecommendations,
  formatScore,
  calculateCategoryBenchmark
};
