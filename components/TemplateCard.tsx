"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getRandomInterviewCover } from "@/lib/utils";
import DisplayTechIcons from "./DisplayTechIcons";
import dayjs from "dayjs";

import {
  Calendar,
  Star,
  BarChart2,
  Edit2,
  Trash2,
  Share2,
  Unlock,
  Lock,
} from "lucide-react";

interface TemplateCardProps {
  template: InterviewTemplate;
  showStats?: boolean;
  isOwner?: boolean;
  onEdit?: (template: InterviewTemplate) => void;
  onDelete?: (templateId: string) => void;
  onToggleVisibility?: (templateId: string, isPublic: boolean) => void;
  onViewResults?: (templateId: string) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  showStats = false,
  isOwner = false,
  onEdit,
  onDelete,
  onToggleVisibility,
  onViewResults,
}) => {
  const [isToggling, setIsToggling] = useState(false);
  const formattedDate = dayjs(template.createdAt).format("MMM D, YYYY");

  const handleToggleVisibility = async () => {
    if (!isOwner || !onToggleVisibility) return;
    setIsToggling(true);
    try {
      await onToggleVisibility(template.id, !template.isPublic);
    } catch (error) {
      console.error("Error toggling visibility:", error);
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = () => {
    if (!isOwner || !onDelete) return;
    const confirmed = confirm(
      `Are you sure you want to delete "${template.name}"? This action cannot be undone.`
    );
    if (confirmed) {
      onDelete(template.id);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Interview Template: ${template.name}`,
        text: `Take this ${template.role} interview created for ${template.level} level candidates`,
        url: template.shareableLink,
      });
    } else {
      navigator.clipboard.writeText(template.shareableLink);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-5 w-[360px] max-sm:w-full shadow-lg hover:shadow-xl transition duration-300">
      <div className="relative">
        {/* Template Type Badge */}
        <div className="absolute top-0 right-0 px-3 py-1 bg-indigo-600 text-white text-xs rounded-bl-lg select-none">
          {template.type.join(", ")}
        </div>

        {/* Visibility Badge */}
        {isOwner && (
          <div className="absolute top-0 left-0 px-2 py-1 bg-gray-700 text-white text-xs rounded-br-lg select-none flex items-center gap-1">
            {template.isPublic ? (
              <>
                <Unlock size={14} /> Public
              </>
            ) : (
              <>
                <Lock size={14} /> Private
              </>
            )}
          </div>
        )}

        <div className="flex flex-col items-center">
          <Image
            src={getRandomInterviewCover()}
            alt="template cover"
            width={90}
            height={90}
            className="rounded-full object-cover border border-gray-600"
          />

          <h3 className="mt-4 text-xl font-semibold text-white text-center capitalize">
            {template.name}
          </h3>

          <div className="flex justify-center gap-4 mt-2 text-gray-400 text-sm">
            <div className="flex items-center gap-1">
              <Calendar size={20} />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star size={20} />
              <span>{template.level}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        {showStats && (
          <div className="flex justify-center gap-4 mt-4 text-sm text-white">
            <div className="flex items-center gap-1">
              <BarChart2 size={20} />
              <span>{template.completionCount} completed</span>
            </div>
            {template.averageScore && template.averageScore > 0 && (
              <div className="flex items-center gap-1">
                <Star size={20} />
                <span>{Math.round(template.averageScore)}% avg</span>
              </div>
            )}
          </div>
        )}

        <p className="mt-4 text-sm text-gray-300 line-clamp-3">
          {template.description ||
            `${template.role} interview for ${template.level} level candidates with ${template.questionCount} questions covering ${
              template.type?.filter((t) => t).join(", ")?.toLowerCase() || "various"
            } topics.`}
        </p>

        <div className="mt-4">
          <DisplayTechIcons techStack={template.techstack} />
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <Link
            href={`/interview/template/${template.id}`}
            className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            🎯 Take Interview
          </Link>

          {isOwner && (
            <div className="grid grid-cols-3 gap-2">
              {onViewResults && template.completionCount > 0 && (
                <button
                  onClick={() => onViewResults(template.id)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm flex justify-center items-center transition"
                  title="View results dashboard"
                >
                  <BarChart2 size={18} />
                </button>
              )}

              {onEdit && (
                <button
                  onClick={() => onEdit(template)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm flex justify-center items-center transition"
                  title="Edit template"
                >
                  <Edit2 size={18} />
                </button>
              )}

              <button
                onClick={handleToggleVisibility}
                disabled={isToggling}
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm flex justify-center items-center transition disabled:opacity-50"
                title={template.isPublic ? "Make private" : "Make public"}
              >
                {isToggling ? (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    ></path>
                  </svg>
                ) : template.isPublic ? (
                  <Lock size={18} />
                ) : (
                  <Unlock size={18} />
                )}
              </button>

              <button
                onClick={handleShare}
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm flex justify-center items-center transition"
                title="Share template"
              >
                <Share2 size={18} />
              </button>

              {onDelete && (
                <button
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm flex justify-center items-center transition"
                  title="Delete template"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-4 flex justify-between text-xs text-gray-500">
          <span>{template.questionCount} questions</span>
          <span>{template.level} level</span>
          {template.isPublic && !isOwner && (
            <span className="text-green-400">Public</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateCard;
