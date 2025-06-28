import React from "react";
import dayjs from "dayjs";
import Image from "next/image";
import { getRandomInterviewCover } from "@/lib/utils";
import Link from "next/link";
import DisplayTechIcons from "./DisplayTechIcons";

// Helper function to convert score to star rating with more granular logic
const getStarRating = (score: number) => {
  if (score >= 95) return 5;
  if (score >= 85) return 4;
  if (score >= 75) return 3;
  if (score >= 65) return 2;
  if (score >= 55) return 1;
  return 0; // Below 55 gets no stars
};

// Helper function to get performance level text and color
const getPerformanceLevel = (score: number) => {
  if (score >= 90) return { text: "Excellent", color: "text-green-600" };
  if (score >= 80) return { text: "Very Good", color: "text-blue-600" };
  if (score >= 70) return { text: "Good", color: "text-yellow-600" };
  if (score >= 60) return { text: "Fair", color: "text-orange-600" };
  return { text: "Needs Improvement", color: "text-red-600" };
};

// Helper function to render stars
const renderStars = (rating: number) => {
  return Array.from({ length: 5 }, (_, index) => (
    <svg
      key={index}
      className={`w-4 h-4 ${index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ));
};

const InterviewCard = ({
  id,
  userId,
  role,
  type,
  techstack,
  extractedTechStack,
  createdAt,
  completedAt,
  score,
  completed = false,
  status,
}: Interview) => {
  const normalizedType = /mix/gi.test(type) ? "Mixed" : type;
  const displayDate = completedAt || createdAt;
  const formDate = dayjs(displayDate).format("MMM D, YYYY");
  const hasScore = completed && score !== undefined;
  const starRating = hasScore ? getStarRating(score!) : 0;
  const performanceLevel = hasScore ? getPerformanceLevel(score!) : null;
  
  // Use extractedTechStack (technologies actually discussed) if available, 
  // otherwise fall back to original techstack
  const displayTechStack = extractedTechStack && extractedTechStack.length > 0 
    ? extractedTechStack 
    : techstack;
  
  // Debug logging for tech stack display
  console.log('InterviewCard Debug:', {
    id,
    role,
    originalTechstack: techstack,
    extractedTechStack,
    displayTechStack,
    completed
  });
  
  // Enhanced description based on performance
  const getInterviewDescription = () => {
    if (completed && hasScore) {
      if (score! >= 90) {
        return `Outstanding performance! Scored ${score}/100 with ${starRating} stars. Excellent technical knowledge and communication skills demonstrated.`;
      } else if (score! >= 80) {
        return `Strong performance with ${score}/100 points and ${starRating} stars. Good technical understanding with clear communication.`;
      } else if (score! >= 70) {
        return `Solid performance achieving ${score}/100 points and ${starRating} stars. Good foundation with room for growth.`;
      } else if (score! >= 60) {
        return `Fair performance with ${score}/100 points and ${starRating} stars. Shows potential with areas for improvement.`;
      } else {
        return `Initial attempt with ${score}/100 points. Great learning opportunity - keep practicing to improve your skills!`;
      }
    } else if (id.startsWith('template-')) {
      return `Practice your ${role.toLowerCase().replace(' practice', '')} skills with this AI-powered interview simulation.`;
    } else {
      return "You haven't taken the interview yet. Take it now to improve your skills.";
    }
  };
  
  return (
    <div className="card-border w-[360px] max-sm:w-full min-h-96">
      <div className="card-interview">
        <div>
          <div className="absolute top-0 right-0 w-fit px-4 py-2 rounded-bl-lg bg-light-400">
            <p className="badge-text">{normalizedType}</p>
          </div>
          <Image src={getRandomInterviewCover()} alt="cover image" width={90} height={90} className="rounded-full object-fit size-[90px]"/>
          <h3 className="mt-5 capitalize">
            {role}
          </h3>
          <div className="flex flex-row gap-5 mt-3">
            <div className="flex flex-row gap-2">
              <Image src="/calendar.svg" alt="calendar" width={22} height={22}/>
              <p>{formDate}</p>
            </div>
            <div className="flex flex-row gap-2 items-center">
              {hasScore ? (
                <div className="flex items-center gap-1">
                  <div className="flex">
                    {renderStars(starRating)}
                  </div>
                  <div className="flex flex-col items-start ml-2">
                    <span className="text-sm font-semibold text-gray-700">({score}/100)</span>
                    {performanceLevel && (
                      <span className={`text-xs font-medium ${performanceLevel.color}`}>
                        {performanceLevel.text}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Image src="/star.svg" alt="star" width={22} height={22}/>
                  <p className="text-gray-500">Not rated</p>
                </div>
              )}
            </div>
          </div>
          <p className="line-clamp-3 mt-5 text-sm leading-relaxed">
            {getInterviewDescription()}
          </p>
        </div>
        
        <div className="flex flex-row justify-between">
          <DisplayTechIcons techStack={displayTechStack} />
          <Link 
            href={completed ? `/interview/${id}/feedback` : id.startsWith('template-') ? '/interview' : `/interview/${id}`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
          >
            {completed ? 'View Feedback' : id.startsWith('template-') ? 'Start Interview' : 'View Interview'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default InterviewCard;
