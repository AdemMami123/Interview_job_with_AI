import React from "react";
import dayjs from "dayjs";
import Image from "next/image";
import { getRandomInterviewCover } from "@/lib/utils";
import Link from "next/link";
import DisplayTechIcons from "./DisplayTechIcons";

const InterviewCard = ({
  id,
  userId,
  role,
  type,
  techstack,
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
  
  return (
    <div className="card-border w-[360px] max-sm:w-full min-h-96">
      <div className="card-interview">
        <div>
          <div className="absolute top-0 right-0 w-fit px-4 py-2 rounded-bl-lg bg-light-400">
            <p className="badge-text">{normalizedType}</p>
          </div>
          <Image src={getRandomInterviewCover()} alt="cover image" width={90} height={90} className="rounded-full object-fit size-[90px]"/>
          <h3 className="mt-5 capitalize">
            {role} Interview
          </h3>
          <div className="flex flex-row gap-5 mt-3">
            <div className="flex flex-row gap-2">
              <Image src="/calendar.svg" alt="calendar" width={22} height={22}/>
              <p>{formDate}</p>
            </div>
            <div className="flex flex-row gap-2 items-center">
              <Image src="/star.svg" alt="star" width={22} height={22}/>
              <p>{hasScore ? `${score}/100` : '---/100'}</p>
            </div>
          </div>
          <p className="line-clamp-2 mt-5">
            {completed 
              ? `Interview completed with a score of ${score}/100. Great job!`
              : id.startsWith('template-') 
                ? `Practice your ${role.toLowerCase()} skills with this AI-powered interview simulation.`
                : "You haven't taken the interview yet. Take it now to improve your skills."
            }
          </p>
        </div>
        
        <div className="flex flex-row justify-between">
          <DisplayTechIcons techStack={techstack} />
          <Link href={completed ? `/interview/${id}/feedback` : id.startsWith('template-') ? '/interview' : `/interview/${id}`}>
            {completed ? 'Check Feedback' : id.startsWith('template-') ? 'Start Interview' : 'View Interview'}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default InterviewCard;
