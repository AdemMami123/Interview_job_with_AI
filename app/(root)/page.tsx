"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import InterviewCard from "@/components/InterviewCard";
import RecommendedInterviews from "@/components/RecommendedInterviews";

// Practice interview templates
const practiceTemplates: Interview[] = [
  {
    id: "template-frontend",
    userId: "",
    role: "Frontend Developer Practice",
    type: "Technical",
    level: "Mid-level",
    techstack: ["React", "TypeScript", "Next.js", "Tailwind CSS"],
    questions: [
      "Tell me about your React experience",
      "How do you handle state management?",
    ],
    finalized: false,
    completed: false,
    status: "pending",
    createdAt: new Date().toISOString(),
  },
  {
    id: "template-fullstack",
    userId: "",
    role: "Full Stack Developer Practice",
    type: "Technical",
    level: "Senior",
    techstack: ["Node.js", "Express", "MongoDB", "React"],
    questions: [
      "Describe your full-stack architecture",
      "How do you handle database optimization?",
    ],
    finalized: false,
    completed: false,
    status: "pending",
    createdAt: new Date().toISOString(),
  },
  {
    id: "template-backend",
    userId: "",
    role: "Backend Developer Practice",
    type: "Technical",
    level: "Mid-level",
    techstack: ["Node.js", "Express", "PostgreSQL", "Redis"],
    questions: [
      "Explain RESTful API design",
      "How do you handle caching strategies?",
    ],
    finalized: false,
    completed: false,
    status: "pending",
    createdAt: new Date().toISOString(),
  },
  {
    id: "template-python",
    userId: "",
    role: "Python Developer Practice",
    type: "Technical",
    level: "Intermediate",
    techstack: ["Python", "Django", "PostgreSQL", "Redis"],
    questions: [
      "Explain Python's GIL and its implications",
      "How do you optimize Django queries?",
    ],
    finalized: false,
    completed: false,
    status: "pending",
    createdAt: new Date().toISOString(),
  },
  {
    id: "template-devops",
    userId: "",
    role: "DevOps Engineer Practice",
    type: "Technical",
    level: "Senior",
    techstack: ["Docker", "Kubernetes", "AWS", "Terraform"],
    questions: [
      "Describe your CI/CD pipeline design",
      "How do you handle infrastructure as code?",
    ],
    finalized: false,
    completed: false,
    status: "pending",
    createdAt: new Date().toISOString(),
  },
  {
    id: "template-mobile",
    userId: "",
    role: "Mobile Developer Practice",
    type: "Technical", 
    level: "Mid-level",
    techstack: ["React Native", "TypeScript", "Firebase", "Redux"],
    questions: [
      "How do you handle cross-platform development?",
      "Explain mobile app performance optimization",
    ],
    finalized: false,
    completed: false,
    status: "pending",
    createdAt: new Date().toISOString(),
  },
];

const page = () => {
  const [userInterviews, setUserInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [userSkillProfile, setUserSkillProfile] = useState<any>(null);

  // Get current user ID (you may need to implement user authentication)
  useEffect(() => {
    const getUser = async () => {
      try {
        // First try to get the authenticated user
        const response = await fetch("/api/auth/current-user");
        if (response.ok) {
          const userData = await response.json();
          if (userData.success && userData.user) {
            setCurrentUserId(userData.user.id);
            setCurrentUserName(userData.user.name || "User");
            setIsAuthenticated(true);
            return;
          }
        }

        // If no authenticated user, fall back to localStorage or create new user
        let userId = localStorage.getItem("userId");
        let userName = localStorage.getItem("userName") || "Anonymous User";

        if (!userId) {
          // Generate a simple user ID if none exists
          userId = `user_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;
          localStorage.setItem("userId", userId);
        }

        setCurrentUserId(userId);
        setCurrentUserName(userName);
        setIsAuthenticated(false);
      } catch (error) {
        console.error("Error getting user:", error);
        // Fall back to guest user
        const guestId = `guest_${Date.now()}`;
        setCurrentUserId(guestId);
        setCurrentUserName("Anonymous User");
        setIsAuthenticated(false);
      }
    };

    getUser();
  }, []);

  // Fetch user's completed interviews
  useEffect(() => {
    const fetchUserInterviews = async () => {
      if (!currentUserId) return;

      try {
        setLoading(true);

        // Fetch user's own completed interviews
        const userResponse = await fetch(
          `/api/interview/list?userId=${currentUserId}&limit=20`
        );
        const userData = await userResponse.json();

        if (userData.success) {
          // Only show completed interviews in the "Your Completed Interviews" section
          const completedInterviews = userData.interviews.filter(
            (interview: Interview) => interview.completed
          );
          setUserInterviews(completedInterviews);
        } else {
          console.error("Failed to fetch interviews:", userData.error);
          setUserInterviews([]);
        }
      } catch (error) {
        console.error("Error fetching interviews:", error);
        setUserInterviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInterviews();
  }, [currentUserId]);

  // Fetch recommendations for all users (authenticated and anonymous)
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!currentUserId) return;

      try {
        setRecommendationsLoading(true);
        const response = await fetch(`/api/interview/recommendations?userId=${currentUserId}&limit=6`);
        const data = await response.json();

        if (data.success) {
          setRecommendations(data.recommendations);
          setUserSkillProfile(data.skillProfile);
        } else {
          console.error("Failed to fetch recommendations:", data.error);
          setRecommendations([]);
        }
      } catch (error) {
        console.error("Error fetching recommendations:", error);
        setRecommendations([]);
      } finally {
        setRecommendationsLoading(false);
      }
    };

    // Fetch recommendations for all users
    if (currentUserId) {
      fetchRecommendations();
    } else {
      setRecommendations([]);
      setRecommendationsLoading(false);
    }
  }, [currentUserId]);

  // Function to change user name (for non-authenticated users)
  const handleNameChange = () => {
    if (!isAuthenticated) {
      const newName = prompt("Enter your name:", currentUserName || "");
      if (newName && newName.trim()) {
        const trimmedName = newName.trim();
        setCurrentUserName(trimmedName);
        localStorage.setItem("userName", trimmedName);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"></div>
          <span>Loading interviews...</span>
        </div>
      </div>
    );
  }

  return (
    <>
     {/* User Welcome Section */}
<div className="mb-6 p-4 bg-gray-900 rounded-2xl border border-gray-700 shadow-sm">
  <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
    <div className="flex items-start gap-4">
      <div className="space-y-1">
        <h3 className="text-xl font-semibold text-white">
          Welcome, {currentUserName}!
        </h3>
        <p className="text-sm text-gray-300 leading-relaxed max-w-md">
          {isAuthenticated
            ? "You're signed in and your progress is saved to your account."
            : "You're browsing as a guest. Sign in to save your interview history across devices."}
        </p>
      </div>
      {!isAuthenticated && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNameChange}
          className="text-blue-400 hover:text-blue-300"
        >
          Edit Name
        </Button>
      )}
    </div>

    {!isAuthenticated && (
      <div className="flex gap-2">
        <Button asChild variant="outline" size="sm" className="border-gray-600 text-white hover:bg-gray-800">
          <Link href="/sign-in">Sign In</Link>
        </Button>
        <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-500 text-white">
          <Link href="/sign-up">Sign Up</Link>
        </Button>
      </div>
    )}
  </div>
</div>


      <section className="card-cta">
        <div className="flex flex-col gap-6 max-w-lg">
          <h2>Get Interview-Ready with AI-Powered Practice & Feedback</h2>
          <p className="text-lg">
            Practice job interviews with AI, get instant feedback, and ace your
            next interview.
          </p>
          <Button asChild className="btn-primary max-sm:w-full">
            <Link href="/interview">Start an Interview</Link>
          </Button>
        </div>
        <Image
          src="/robot.png"
          alt="robot"
          width={500}
          height={500}
          className="max-sm:hidden"
        />
      </section>

      <section className="flex flex-col gap-6 mt-8">
        <h2>
          {isAuthenticated
            ? "Your Completed Interviews"
            : "Your Interview History (Local)"}
        </h2>
        <div className="interviews-section">
          {userInterviews.length > 0 ? (
            userInterviews.map((interview) => (
              <InterviewCard {...interview} key={interview.id} />
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500 py-8">
              <p className="text-lg">No completed interviews yet</p>
              <p className="text-sm">
                {isAuthenticated
                  ? "Complete an interview to see it here with your score and feedback"
                  : "Complete an interview to see it here. Sign in to save interviews permanently across devices."}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-6 mt-8">
        <div className="flex items-center justify-between">
          <div>
            <h2>Recommended Interviews Based on Your Skills</h2>
            <p className="text-sm text-gray-400 mt-1">
              Personalized recommendations based on your interview history and performance
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-800">
            <Link href="/interview">Quick Start</Link>
          </Button>
        </div>
        
        <RecommendedInterviews 
          recommendations={recommendations}
          isLoading={recommendationsLoading}
          userSkillProfile={userSkillProfile}
        />
      </section>
    </>
  );
};

export default page;
