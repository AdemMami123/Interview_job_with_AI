import { db } from '@/firebase/admin';

export async function POST(request: Request) {
    try {
        const { interviewId, userId } = await request.json();

        if (!interviewId) {
            return Response.json({
                success: false,
                error: 'Interview ID is required'
            }, { status: 400 });
        }

        // Fetch the interview
        const interviewDoc = await db.collection('interviews').doc(interviewId).get();
        
        if (!interviewDoc.exists) {
            return Response.json({
                success: false,
                error: 'Interview not found'
            }, { status: 404 });
        }

        const interviewData = interviewDoc.data();
        
        // Verify user owns this interview (if userId provided)
        if (userId && interviewData?.userId !== userId) {
            return Response.json({
                success: false,
                error: 'Unauthorized access to interview'
            }, { status: 403 });
        }

        if (!interviewData?.transcript || interviewData.transcript.length === 0) {
            return Response.json({
                success: false,
                error: 'No transcript found for enhanced feedback generation'
            }, { status: 400 });
        }

        // Generate enhanced feedback with detailed analysis
        const enhancedFeedback = await generateEnhancedFeedback(
            interviewData.transcript,
            interviewData.role,
            interviewData.level,
            interviewData.techstack
        );

        // Save enhanced feedback to database
        const enhancedFeedbackDoc = await db.collection('enhancedFeedback').add({
            interviewId,
            userId: interviewData.userId,
            ...enhancedFeedback,
            createdAt: new Date().toISOString(),
        });

        return Response.json({
            success: true,
            feedback: {
                id: enhancedFeedbackDoc.id,
                ...enhancedFeedback
            }
        }, { status: 200 });

    } catch (error) {
        console.error('❌ Error generating enhanced feedback:', error);
        return Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const interviewId = searchParams.get('interviewId');
        const userId = searchParams.get('userId');

        if (!interviewId) {
            return Response.json({
                success: false,
                error: 'Interview ID is required'
            }, { status: 400 });
        }

        // Fetch enhanced feedback for this interview
        const feedbackQuery = db.collection('enhancedFeedback')
            .where('interviewId', '==', interviewId)
            .limit(1);

        const feedbackSnapshot = await feedbackQuery.get();
        
        if (feedbackSnapshot.empty) {
            return Response.json({
                success: false,
                error: 'Enhanced feedback not found for this interview'
            }, { status: 404 });
        }

        const feedbackDoc = feedbackSnapshot.docs[0];
        const feedbackData = feedbackDoc.data();

        // Verify user owns this feedback (if userId provided)
        if (userId && feedbackData?.userId !== userId) {
            return Response.json({
                success: false,
                error: 'Unauthorized access to feedback'
            }, { status: 403 });
        }

        return Response.json({
            success: true,
            feedback: {
                id: feedbackDoc.id,
                ...feedbackData
            }
        }, { status: 200 });

    } catch (error) {
        console.error('❌ Error fetching enhanced feedback:', error);
        return Response.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

async function generateEnhancedFeedback(transcript: any[], role: string, level: string, techstack: string[]) {
    // Extract questions and answers from transcript
    const qaExchanges = extractQuestionsAndAnswers(transcript);
    
    // Analyze each question-answer pair
    const questionFeedback = await Promise.all(
        qaExchanges.map(async (qa, index) => {
            return await analyzeQuestionResponse(qa, index + 1, role, level, techstack);
        })
    );

    // Calculate category scores
    const categoryScores = calculateCategoryScores(questionFeedback, role, level);

    // Generate skill assessment
    const skillAssessment = generateSkillAssessment(questionFeedback, role, level);

    // Calculate overall metrics
    const overallScore = Math.round(
        questionFeedback.reduce((sum, q) => sum + q.score, 0) / questionFeedback.length
    );
    
    const accuracy = Math.round(
        (questionFeedback.filter(q => q.accuracy === 'correct').length / questionFeedback.length) * 100
    );

    // Generate improvement plan
    const improvementPlan = generateImprovementPlan(questionFeedback, skillAssessment, role, level);

    // Generate benchmark comparison
    const benchmarkComparison = generateBenchmarkComparison(overallScore, role, level);

    return {
        overallScore,
        maxScore: 100,
        accuracy,
        categoryScores,
        questionFeedback,
        skillAssessment,
        improvementPlan,
        benchmarkComparison
    };
}

function extractQuestionsAndAnswers(transcript: any[]): Array<{question: string, answer: string}> {
    const exchanges = [];
    let currentQuestion = '';
    
    for (let i = 0; i < transcript.length; i++) {
        const entry = transcript[i];
        
        if (entry.role === 'interviewer' || entry.role === 'assistant') {
            // This is a question
            if (entry.content.includes('?') || entry.content.toLowerCase().includes('tell me') || 
                entry.content.toLowerCase().includes('explain') || entry.content.toLowerCase().includes('describe')) {
                currentQuestion = entry.content;
                
                // Look for the next user response
                if (i + 1 < transcript.length && transcript[i + 1].role === 'user') {
                    exchanges.push({
                        question: currentQuestion,
                        answer: transcript[i + 1].content
                    });
                }
            }
        }
    }
    
    return exchanges;
}

async function analyzeQuestionResponse(qa: {question: string, answer: string}, questionNumber: number, role: string, level: string, techstack: string[]) {
    // Simulate AI analysis for question response
    const analysisResult = await performDetailedAnalysis(qa, role, level, techstack);
    
    return {
        questionNumber,
        question: qa.question,
        userAnswer: qa.answer,
        correctAnswer: analysisResult.modelAnswer,
        accuracy: analysisResult.accuracy,
        score: analysisResult.score,
        criteria: analysisResult.criteria,
        feedback: analysisResult.feedback,
        improvements: analysisResult.improvements,
        keywordMatch: analysisResult.keywordMatch
    };
}

async function performDetailedAnalysis(qa: {question: string, answer: string}, role: string, level: string, techstack: string[]) {
    // This would typically use AI/LLM for analysis
    // For now, providing structured analysis based on content
    
    const answerLength = qa.answer.length;
    const hasKeywords = techstack.some(tech => qa.answer.toLowerCase().includes(tech.toLowerCase()));
    const isComplete = answerLength > 50;
    const isClear = !qa.answer.toLowerCase().includes('um') && !qa.answer.toLowerCase().includes('uh');
    
    // Calculate scores based on criteria
    const correctness = hasKeywords ? (answerLength > 100 ? 85 : 70) : (answerLength > 50 ? 50 : 30);
    const completeness = isComplete ? 80 : 40;
    const clarity = isClear ? 85 : 60;
    const relevance = hasKeywords ? 90 : 50;
    
    const overallScore = Math.round((correctness + completeness + clarity + relevance) / 4);
    
    let accuracy: 'correct' | 'partially_correct' | 'incorrect';
    if (overallScore >= 75) accuracy = 'correct';
    else if (overallScore >= 50) accuracy = 'partially_correct';
    else accuracy = 'incorrect';
    
    // Generate keyword analysis
    const expectedKeywords = techstack.concat(['experience', 'project', 'development', 'team', 'problem', 'solution']);
    const foundKeywords = expectedKeywords.filter(keyword => 
        qa.answer.toLowerCase().includes(keyword.toLowerCase())
    );
    const missedKeywords = expectedKeywords.filter(keyword => 
        !qa.answer.toLowerCase().includes(keyword.toLowerCase())
    );
    
    // Generate feedback and improvements
    const feedback = generateQuestionFeedback(overallScore, accuracy, hasKeywords, isComplete);
    const improvements = generateImprovements(accuracy, correctness, completeness, clarity, relevance);
    const modelAnswer = generateModelAnswer(qa.question, role, level, techstack);
    
    return {
        modelAnswer,
        accuracy,
        score: overallScore,
        criteria: {
            correctness,
            completeness,
            clarity,
            relevance
        },
        feedback,
        improvements,
        keywordMatch: {
            expected: expectedKeywords,
            found: foundKeywords,
            missed: missedKeywords
        }
    };
}

function generateQuestionFeedback(score: number, accuracy: string, hasKeywords: boolean, isComplete: boolean): string {
    if (score >= 80) {
        return "Excellent response! You demonstrated strong understanding and provided a comprehensive answer with relevant technical details.";
    } else if (score >= 60) {
        return "Good response with solid understanding. Consider adding more specific examples and technical details to strengthen your answer.";
    } else if (score >= 40) {
        return "Your response shows basic understanding but lacks depth. Focus on providing more detailed explanations and specific examples.";
    } else {
        return "Your response needs significant improvement. Consider studying the topic more thoroughly and practice articulating your thoughts clearly.";
    }
}

function generateImprovements(accuracy: string, correctness: number, completeness: number, clarity: number, relevance: number): string[] {
    const improvements = [];
    
    if (correctness < 70) {
        improvements.push("Study the technical concepts more thoroughly and ensure accuracy in your explanations");
    }
    if (completeness < 70) {
        improvements.push("Provide more comprehensive answers that cover all aspects of the question");
    }
    if (clarity < 70) {
        improvements.push("Practice articulating your thoughts more clearly and avoid filler words");
    }
    if (relevance < 70) {
        improvements.push("Focus on answering the specific question asked and include relevant examples");
    }
    
    if (accuracy === 'incorrect') {
        improvements.push("Review fundamental concepts and practice with similar questions");
    }
    
    return improvements;
}

function generateModelAnswer(question: string, role: string, level: string, techstack: string[]): string {
    // Generate contextual model answers based on question type and role
    if (question.toLowerCase().includes('experience')) {
        return `A strong answer would include specific examples of your ${techstack.join(', ')} experience, mentioning projects you've worked on, challenges you've faced, and solutions you've implemented. For a ${level} ${role}, you should demonstrate both technical competency and problem-solving skills.`;
    } else if (question.toLowerCase().includes('technical') || question.toLowerCase().includes('code')) {
        return `For technical questions, provide clear explanations of concepts, include code examples where appropriate, discuss trade-offs and best practices. Show your understanding of ${techstack.join(', ')} and how they apply to real-world scenarios.`;
    } else {
        return `A comprehensive answer should demonstrate your understanding of the topic, provide specific examples from your experience, and show how your skills align with the ${role} position requirements.`;
    }
}

function calculateCategoryScores(questionFeedback: any[], role: string, level: string) {
    // Define categories based on role and level
    const categories = [
        {
            name: 'Technical Knowledge',
            questions: questionFeedback.filter(q => 
                q.question.toLowerCase().includes('technical') || 
                q.question.toLowerCase().includes('code') ||
                q.question.toLowerCase().includes('algorithm')
            ).length || Math.ceil(questionFeedback.length * 0.4)
        },
        {
            name: 'Problem Solving',
            questions: questionFeedback.filter(q => 
                q.question.toLowerCase().includes('problem') || 
                q.question.toLowerCase().includes('challenge') ||
                q.question.toLowerCase().includes('debug')
            ).length || Math.ceil(questionFeedback.length * 0.3)
        },
        {
            name: 'Communication',
            questions: questionFeedback.length
        },
        {
            name: 'Experience & Projects',
            questions: questionFeedback.filter(q => 
                q.question.toLowerCase().includes('experience') || 
                q.question.toLowerCase().includes('project')
            ).length || Math.ceil(questionFeedback.length * 0.3)
        }
    ];

    return categories.map(category => {
        const relevantQuestions = questionFeedback.slice(0, category.questions);
        const avgScore = relevantQuestions.reduce((sum, q) => sum + q.score, 0) / relevantQuestions.length || 0;
        const avgCriteria = {
            technical: relevantQuestions.reduce((sum, q) => sum + q.criteria.correctness, 0) / relevantQuestions.length || 0,
            communication: relevantQuestions.reduce((sum, q) => sum + q.criteria.clarity, 0) / relevantQuestions.length || 0,
            problemSolving: relevantQuestions.reduce((sum, q) => sum + q.criteria.relevance, 0) / relevantQuestions.length || 0
        };

        let benchmark: 'exceed' | 'meet' | 'approaching' | 'below';
        if (avgScore >= 85) benchmark = 'exceed';
        else if (avgScore >= 70) benchmark = 'meet';
        else if (avgScore >= 55) benchmark = 'approaching';
        else benchmark = 'below';

        return {
            name: category.name,
            score: Math.round(avgScore),
            maxScore: 100,
            questions: category.questions,
            criteria: {
                technical: Math.round(avgCriteria.technical),
                communication: Math.round(avgCriteria.communication),
                problemSolving: Math.round(avgCriteria.problemSolving)
            },
            benchmark,
            comment: generateCategoryComment(category.name, avgScore, benchmark)
        };
    });
}

function generateCategoryComment(categoryName: string, score: number, benchmark: string): string {
    const performanceMap = {
        exceed: "Outstanding performance that exceeds expectations",
        meet: "Solid performance that meets industry standards",
        approaching: "Good foundation with room for improvement",
        below: "Needs focused development in this area"
    };

    return `${performanceMap[benchmark as keyof typeof performanceMap]}. ${
        score >= 80 ? `Strong competency in ${categoryName.toLowerCase()}.` :
        score >= 60 ? `Good understanding of ${categoryName.toLowerCase()} concepts.` :
        `Focus on developing ${categoryName.toLowerCase()} skills further.`
    }`;
}

function generateSkillAssessment(questionFeedback: any[], role: string, level: string) {
    const avgScore = questionFeedback.reduce((sum, q) => sum + q.score, 0) / questionFeedback.length;
    const accurateAnswers = questionFeedback.filter(q => q.accuracy === 'correct').length;
    const confidence = Math.round((accurateAnswers / questionFeedback.length) * 100);

    let skillLevel: 'Expert' | 'Advanced' | 'Intermediate' | 'Beginner' | 'Novice';
    if (avgScore >= 90) skillLevel = 'Expert';
    else if (avgScore >= 80) skillLevel = 'Advanced';
    else if (avgScore >= 65) skillLevel = 'Intermediate';
    else if (avgScore >= 50) skillLevel = 'Beginner';
    else skillLevel = 'Novice';

    const evidence = [];
    const gaps = [];

    // Generate evidence based on performance
    if (accurateAnswers > 0) {
        evidence.push(`Provided ${accurateAnswers} accurate responses out of ${questionFeedback.length} questions`);
    }
    
    const highScoreQuestions = questionFeedback.filter(q => q.score >= 80).length;
    if (highScoreQuestions > 0) {
        evidence.push(`Demonstrated strong competency in ${highScoreQuestions} areas`);
    }

    // Generate gaps based on weaknesses
    const lowScoreQuestions = questionFeedback.filter(q => q.score < 60);
    if (lowScoreQuestions.length > 0) {
        gaps.push(`Needs improvement in ${lowScoreQuestions.length} key areas`);
    }

    const clarityIssues = questionFeedback.filter(q => q.criteria.clarity < 70).length;
    if (clarityIssues > 0) {
        gaps.push("Communication clarity could be enhanced");
    }

    return {
        level: skillLevel,
        confidence,
        evidence,
        gaps
    };
}

function generateImprovementPlan(questionFeedback: any[], skillAssessment: any, role: string, level: string) {
    const immediate = [];
    const shortTerm = [];
    const longTerm = [];
    const resources = [];

    // Generate improvement actions based on weaknesses
    const weakAreas = questionFeedback.filter(q => q.score < 60);
    const clarityIssues = questionFeedback.filter(q => q.criteria.clarity < 70);
    const technicalGaps = questionFeedback.filter(q => q.criteria.correctness < 70);

    if (clarityIssues.length > 0) {
        immediate.push("Practice explaining technical concepts out loud daily");
        shortTerm.push("Join public speaking or communication skills workshops");
    }

    if (technicalGaps.length > 0) {
        immediate.push("Review fundamental concepts in identified weak areas");
        shortTerm.push("Complete hands-on projects to reinforce technical skills");
        longTerm.push("Pursue advanced certifications in your technology stack");
    }

    if (skillAssessment.level === 'Beginner' || skillAssessment.level === 'Novice') {
        shortTerm.push("Build a portfolio of diverse projects");
        longTerm.push("Gain practical experience through internships or junior roles");
    }

    // Add general improvement items
    immediate.push("Practice mock interviews weekly");
    shortTerm.push("Study system design and software architecture principles");
    longTerm.push("Develop leadership and mentoring skills");

    // Generate resources
    resources.push({
        title: "System Design Interview Course",
        type: "course" as const,
        url: "https://example.com/system-design",
        description: "Comprehensive course covering system design principles and interview preparation"
    });

    resources.push({
        title: "Clean Code by Robert Martin",
        type: "book" as const,
        description: "Essential reading for software engineering best practices"
    });

    resources.push({
        title: "LeetCode Practice Platform",
        type: "practice" as const,
        url: "https://leetcode.com",
        description: "Practice coding problems and algorithm challenges"
    });

    resources.push({
        title: "Official Documentation",
        type: "documentation" as const,
        description: "Study official documentation for your technology stack"
    });

    return {
        immediate,
        shortTerm,
        longTerm,
        resources
    };
}

function generateBenchmarkComparison(overallScore: number, role: string, level: string) {
    // Simulate benchmark data based on role and level
    const benchmarks = {
        'Junior': { average: 65, top10: 80 },
        'Mid-level': { average: 72, top10: 85 },
        'Senior': { average: 78, top10: 90 },
        'Lead': { average: 82, top10: 93 }
    };

    const benchmark = benchmarks[level as keyof typeof benchmarks] || benchmarks['Mid-level'];
    
    // Calculate percentile based on score
    let percentile;
    if (overallScore >= benchmark.top10) percentile = Math.min(95, 80 + (overallScore - benchmark.top10) * 2);
    else if (overallScore >= benchmark.average) percentile = 50 + ((overallScore - benchmark.average) / (benchmark.top10 - benchmark.average)) * 30;
    else percentile = Math.max(5, (overallScore / benchmark.average) * 50);

    return {
        percentile: Math.round(percentile),
        averageScore: benchmark.average,
        topPerformers: benchmark.top10
    };
}
