import { db } from '@/firebase/admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '6');

    console.log('🔍 Recommendations API called with:', { userId, limit });

    if (!userId) {
      return Response.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    // Fetch user's completed interviews to analyze skills and performance
    const interviewsQuery = db.collection('interviews')
      .where('userId', '==', userId)
      .where('completed', '==', true)
      .orderBy('completedAt', 'desc')
      .limit(20); // Get recent interviews for analysis

    const interviewsSnapshot = await interviewsQuery.get();
    const userInterviews = interviewsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('📊 User interviews found:', userInterviews.length);
    console.log('📋 Sample interview data:', userInterviews[0]);

    // If user has no interviews, return empty recommendations with message
    if (userInterviews.length === 0) {
      console.log('⚠️ No interviews found for user');
      return Response.json({
        success: true,
        recommendations: [],
        skillProfile: null,
        message: 'Complete your first interview to get personalized recommendations'
      }, { status: 200 });
    }

    // Fetch feedback for completed interviews to understand skill levels
    const feedbackPromises = userInterviews.map(async (interview) => {
      const feedbackQuery = db.collection('feedback') // Changed from 'enhancedFeedback' to 'feedback'
        .where('interviewId', '==', interview.id)
        .limit(1);
      
      const feedbackSnapshot = await feedbackQuery.get();
      return feedbackSnapshot.empty ? null : {
        interviewId: interview.id,
        ...feedbackSnapshot.docs[0].data()
      };
    });

    const feedbacks = (await Promise.all(feedbackPromises)).filter(Boolean);
    console.log('📈 Feedback data found for interviews:', feedbacks.length);

    // Analyze user's skill profile
    const skillProfile = analyzeUserSkills(userInterviews, feedbacks);
    console.log('🎯 User skill profile:', skillProfile);
    
    // Fetch available templates for recommendations
    const templatesQuery = db.collection('interview_templates') // Changed from interviewTemplates
      .where('isPublic', '==', true)
      .orderBy('completionCount', 'desc')
      .limit(100); // Increased limit to get more options

    const templatesSnapshot = await templatesQuery.get();
    const availableTemplates = templatesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('📋 Available templates found:', availableTemplates.length);

    // Generate personalized recommendations
    const recommendations = generateRecommendations(
      skillProfile,
      userInterviews,
      availableTemplates,
      limit
    );

    console.log('✨ Generated recommendations:', recommendations.length);
    console.log('📝 Sample recommendation:', recommendations[0]);

    return Response.json({
      success: true,
      recommendations,
      skillProfile: {
        dominantTechStack: skillProfile.dominantTechStack,
        experienceLevel: skillProfile.experienceLevel,
        strongAreas: skillProfile.strongAreas,
        improvementAreas: skillProfile.improvementAreas,
        recentPerformance: skillProfile.averageScore
      },
      debug: {
        userInterviewsCount: userInterviews.length,
        feedbackCount: feedbacks.length,
        templatesCount: availableTemplates.length,
        recommendationsGenerated: recommendations.length
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error generating recommendations:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function analyzeUserSkills(interviews: any[], feedbacks: any[]) {
  console.log('🔍 Analyzing user skills...');
  
  const techStackCount: Record<string, number> = {};
  const levelCount: Record<string, number> = {};
  const typeCount: Record<string, number> = {};
  const scores: number[] = [];
  const skillRatings: Record<string, number[]> = {};

  // Analyze interview history
  interviews.forEach((interview, index) => {
    console.log(`📊 Processing interview ${index + 1}:`, {
      role: interview.role,
      level: interview.level,
      techstack: interview.techstack,
      extractedTechStack: interview.extractedTechStack,
      score: interview.score
    });

    // Count tech stack usage - try both techstack and extractedTechStack
    const techArray = interview.extractedTechStack || interview.techstack || [];
    if (Array.isArray(techArray)) {
      techArray.forEach((tech: string) => {
        if (tech && typeof tech === 'string') {
          techStackCount[tech] = (techStackCount[tech] || 0) + 1;
        }
      });
    }

    // Count experience levels
    if (interview.level && typeof interview.level === 'string') {
      levelCount[interview.level] = (levelCount[interview.level] || 0) + 1;
    }

    // Count interview types
    if (interview.type) {
      if (typeof interview.type === 'string') {
        typeCount[interview.type] = (typeCount[interview.type] || 0) + 1;
      } else if (Array.isArray(interview.type)) {
        interview.type.forEach((t: string) => {
          if (t && typeof t === 'string') {
            typeCount[t] = (typeCount[t] || 0) + 1;
          }
        });
      }
    }

    // Collect scores
    if (typeof interview.score === 'number' && interview.score > 0) {
      scores.push(interview.score);
    }
  });

  console.log('📈 Analysis results:', { techStackCount, levelCount, typeCount, scores });

  // Analyze feedback for skill strengths and weaknesses
  feedbacks.forEach(feedback => {
    if (feedback && feedback.categoryScores && Array.isArray(feedback.categoryScores)) {
      feedback.categoryScores.forEach((category: any) => {
        if (category && category.name && typeof category.score === 'number') {
          skillRatings[category.name] = skillRatings[category.name] || [];
          skillRatings[category.name].push(category.score);
        }
      });
    }
  });

  // Determine dominant tech stack (top 3)
  const dominantTechStack = Object.entries(techStackCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([tech]) => tech);

  // Determine experience level (most common)
  const experienceLevel = Object.entries(levelCount)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Mid-level';

  // Calculate average score
  const averageScore = scores.length > 0 
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : 0;

  // Identify strong and weak areas
  const skillAverages = Object.entries(skillRatings).map(([skill, ratings]) => ({
    skill,
    average: ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length,
    count: ratings.length
  }));

  const strongAreas = skillAverages
    .filter(({ average, count }) => average >= 70 && count >= 1) // Lowered thresholds
    .sort((a, b) => b.average - a.average)
    .slice(0, 3)
    .map(({ skill }) => skill);

  const improvementAreas = skillAverages
    .filter(({ average, count }) => average < 60 && count >= 1) // Lowered thresholds
    .sort((a, b) => a.average - b.average)
    .slice(0, 3)
    .map(({ skill }) => skill);

  const result = {
    dominantTechStack,
    experienceLevel,
    averageScore,
    strongAreas,
    improvementAreas,
    interviewCount: interviews.length,
    preferredType: Object.entries(typeCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Technical'
  };

  console.log('🎯 Final skill profile:', result);
  return result;
}

function generateRecommendations(
  skillProfile: any,
  userInterviews: any[],
  availableTemplates: any[],
  limit: number
) {
  console.log('🎯 Generating recommendations with:', {
    skillProfile,
    userInterviewsCount: userInterviews.length,
    availableTemplatesCount: availableTemplates.length,
    limit
  });

  const recommendations: any[] = [];
  
  // Create a Set of interview IDs that user has completed (including template-based interviews)
  const completedInterviewIds = new Set();
  const completedTemplateIds = new Set();
  
  userInterviews.forEach(interview => {
    if (interview.templateId) {
      completedTemplateIds.add(interview.templateId);
    }
    if (interview.id) {
      completedInterviewIds.add(interview.id);
    }
  });

  console.log('🚫 Excluding completed templates:', Array.from(completedTemplateIds));

  if (availableTemplates.length === 0) {
    console.log('⚠️ No available templates found');
    return [];
  }

  // If user has no interviews, provide default beginner recommendations
  if (userInterviews.length === 0) {
    console.log('👋 New user - providing beginner recommendations');
    return availableTemplates
      .filter(template => template.level === 'Beginner' || template.level === 'Intermediate')
      .slice(0, limit)
      .map((template, index) => ({
        ...template,
        recommendationScore: 80 - (index * 5), // Descending scores
        reasons: ['Perfect for beginners', 'Start your journey'],
        category: 'beginner_friendly',
        rank: index + 1,
        confidence: 0.8
      }));
  }

  // Recommendation categories with priorities
  const categories = [
    {
      type: 'skill_improvement',
      weight: 0.3,
      description: 'Practice areas you need to improve'
    },
    {
      type: 'skill_reinforcement', 
      weight: 0.25,
      description: 'Strengthen your existing skills'
    },
    {
      type: 'level_progression',
      weight: 0.2,
      description: 'Challenge yourself with the next level'
    },
    {
      type: 'trending',
      weight: 0.15,
      description: 'Popular interviews in your field'
    },
    {
      type: 'diverse',
      weight: 0.1,
      description: 'Explore new technologies'
    }
  ];

  availableTemplates.forEach((template, index) => {
    console.log(`🔍 Evaluating template ${index + 1}/${availableTemplates.length}:`, template.name);
    
    // Skip if user already interviewed with this template
    if (completedTemplateIds.has(template.id)) {
      console.log(`⏭️ Skipping completed template: ${template.name}`);
      return;
    }

    let score = 20; // Higher base score to ensure recommendations
    let reasons: string[] = [];

    // Skill improvement recommendations
    if (skillProfile.improvementAreas && Array.isArray(skillProfile.improvementAreas) && skillProfile.improvementAreas.length > 0) {
      const hasImprovement = skillProfile.improvementAreas.some((area: string) => 
        template.techstack && Array.isArray(template.techstack) && 
        template.techstack.some((tech: string) => 
          tech && area && tech.toLowerCase().includes(area.toLowerCase())
        )
      );
      if (hasImprovement) {
        score += 30;
        reasons.push('Helps improve your weak areas');
      }
    }

    // Skill reinforcement (familiar tech stack)
    let techOverlap = 0;
    if (template.techstack && Array.isArray(template.techstack) && 
        skillProfile.dominantTechStack && Array.isArray(skillProfile.dominantTechStack)) {
      techOverlap = template.techstack.filter((tech: string) => 
        skillProfile.dominantTechStack.includes(tech)
      ).length;
      
      if (techOverlap > 0) {
        score += 25 * (techOverlap / Math.max(template.techstack.length, 1));
        if (techOverlap >= 2) {
          reasons.push('Matches your experience');
        } else if (techOverlap >= 1) {
          reasons.push('Builds on your skills');
        }
      }
    }

    // Level progression - more forgiving matching
    const levelProgression: Record<string, Record<string, number>> = {
      'Beginner': { 'Intermediate': 25, 'Advanced': 10, 'Beginner': 20 },
      'Mid-level': { 'Intermediate': 30, 'Advanced': 20, 'Beginner': 15, 'Mid-level': 25 },
      'Intermediate': { 'Advanced': 25, 'Mid-level': 20, 'Beginner': 10, 'Intermediate': 25 },
      'Senior': { 'Advanced': 30, 'Intermediate': 15, 'Senior': 25 },
      'Advanced': { 'Advanced': 20, 'Intermediate': 10, 'Senior': 15 }
    };

    const userLevelMapping = levelProgression[skillProfile.experienceLevel] || levelProgression['Mid-level'];
    const progressionScore = userLevelMapping[template.level] || 15; // Higher fallback score
    score += progressionScore;

    if (progressionScore >= 20) {
      reasons.push(template.level === 'Advanced' ? 'Challenge yourself' : 'Perfect for your level');
    }

    // Trending/popular templates - more generous
    const completionCount = template.completionCount || 0;
    if (completionCount > 5) { // Lower threshold
      score += Math.min(20, completionCount / 3); // More generous scaling
      reasons.push('Popular choice');
    }

    // Type matching
    if (template.type && skillProfile.preferredType) {
      if (Array.isArray(template.type)) {
        if (template.type.includes(skillProfile.preferredType)) {
          score += 15;
          reasons.push('Matches your preferred style');
        }
      } else if (typeof template.type === 'string') {
        if (template.type === skillProfile.preferredType) {
          score += 15;
          reasons.push('Matches your preferred style');
        }
      }
    }

    // Diversity bonus for exploring new tech
    let newTechCount = 0;
    if (template.techstack && Array.isArray(template.techstack) && 
        skillProfile.dominantTechStack && Array.isArray(skillProfile.dominantTechStack)) {
      newTechCount = template.techstack.filter((tech: string) => 
        !skillProfile.dominantTechStack.includes(tech)
      ).length;
      
      if (newTechCount > 0 && newTechCount <= 4) { // Increased range
        score += Math.min(15, newTechCount * 4);
        reasons.push('Explore new technologies');
      }
    }

    // Performance-based adjustments
    if (skillProfile.averageScore >= 80) {
      // High performers get more challenging recommendations
      if (template.level === 'Advanced' || template.level === 'Senior') score += 15;
    } else if (skillProfile.averageScore < 60) {
      // Lower performers get level-appropriate content
      if (template.level === 'Beginner' || template.level === 'Intermediate') score += 15;
    }

    // Ensure variety by boosting scores for templates not yet recommended
    if (recommendations.length < limit) {
      score += 10; // Boost to ensure we get enough recommendations
    }

    // Add default reasons if none exist
    if (reasons.length === 0) {
      reasons.push('Expand your skillset');
      if (template.level) {
        reasons.push(`${template.level} level challenge`);
      }
    }

    console.log(`📊 Template "${template.name}" scored: ${score}, reasons:`, reasons);

    // Lower threshold to ensure more recommendations
    if (score >= 20) {
      recommendations.push({
        ...template,
        recommendationScore: Math.min(score, 100),
        reasons: reasons.slice(0, 2), // Limit to top 2 reasons
        category: determineCategory(reasons)
      });
    }
  });

  console.log(`🎯 Generated ${recommendations.length} recommendations before sorting`);

  // Sort by recommendation score and return top results
  let finalRecommendations = recommendations
    .sort((a, b) => b.recommendationScore - a.recommendationScore)
    .slice(0, limit)
    .map((rec, index) => ({
      ...rec,
      rank: index + 1,
      confidence: Math.min(rec.recommendationScore / 100, 1)
    }));

  // Fallback: If we still don't have enough recommendations, add some random popular templates
  if (finalRecommendations.length < Math.min(limit, 3)) {
    console.log('🔄 Adding fallback recommendations due to insufficient results');
    
    const fallbackTemplates = availableTemplates
      .filter(template => !completedTemplateIds.has(template.id))
      .filter(template => !finalRecommendations.some(rec => rec.id === template.id))
      .sort((a, b) => (b.completionCount || 0) - (a.completionCount || 0))
      .slice(0, limit - finalRecommendations.length);

    const fallbackRecommendations = fallbackTemplates.map((template, index) => ({
      ...template,
      recommendationScore: 50 - (index * 5), // Moderate scores for fallbacks
      reasons: ['Popular template', 'Broaden your experience'],
      category: 'trending',
      rank: finalRecommendations.length + index + 1,
      confidence: 0.5
    }));

    finalRecommendations = [...finalRecommendations, ...fallbackRecommendations];
  }

  console.log(`✨ Final recommendations:`, finalRecommendations.map(r => ({
    name: r.name,
    score: r.recommendationScore,
    reasons: r.reasons
  })));

  return finalRecommendations;
}

function determineCategory(reasons: string[]): string {
  if (reasons.some(r => r.includes('weak areas') || r.includes('improve'))) return 'skill_improvement';
  if (reasons.some(r => r.includes('experience') || r.includes('matches'))) return 'skill_reinforcement';
  if (reasons.some(r => r.includes('Challenge') || r.includes('level'))) return 'level_progression';
  if (reasons.some(r => r.includes('Popular'))) return 'trending';
  if (reasons.some(r => r.includes('new technologies'))) return 'diverse';
  return 'general';
}
