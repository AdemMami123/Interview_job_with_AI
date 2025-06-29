"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getRandomInterviewCover } from '@/lib/utils';
import DisplayTechIcons from './DisplayTechIcons';
import dayjs from 'dayjs';

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
  onViewResults
}) => {
  const [isToggling, setIsToggling] = useState(false);

  const formattedDate = dayjs(template.createdAt).format("MMM D, YYYY");

  const handleToggleVisibility = async () => {
    if (!isOwner || !onToggleVisibility) return;

    setIsToggling(true);
    try {
      await onToggleVisibility(template.id, !template.isPublic);
    } catch (error) {
      console.error('Error toggling visibility:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = () => {
    if (!isOwner || !onDelete) return;

    const confirmed = confirm(`Are you sure you want to delete "${template.name}"? This action cannot be undone.`);
    if (confirmed) {
      onDelete(template.id);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Interview Template: ${template.name}`,
        text: `Take this ${template.role} interview created for ${template.level} level candidates`,
        url: template.shareableLink
      });
    } else {
      navigator.clipboard.writeText(template.shareableLink);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="card-border w-[360px] max-sm:w-full min-h-96">
      <div className="card-interview">
        <div>
          {/* Template Type Badge */}
          <div className="absolute top-0 right-0 w-fit px-4 py-2 max-sm:px-3 max-sm:py-1.5 rounded-bl-lg bg-light-400">
            <p className="badge-text max-sm:text-xs">{template.type.join(', ')}</p>
          </div>

          {/* Visibility Badge */}
          {isOwner && (
            <div className="absolute top-0 left-0 w-fit px-2 py-1 max-sm:px-1.5 max-sm:py-0.5 rounded-br-lg bg-gray-700">
              <p className="text-xs max-sm:text-[10px] text-white">
                {template.isPublic ? '🌐 Public' : '🔒 Private'}
              </p>
            </div>
          )}

          <Image
            src={getRandomInterviewCover()}
            alt="template cover"
            width={90}
            height={90}
            className="rounded-full object-fit size-[90px] max-sm:size-[80px]"
          />

          <h3 className="mt-5 max-sm:mt-4 capitalize max-sm:text-lg">
            {template.name}
          </h3>

          <div className="flex flex-row gap-5 max-sm:gap-3 mt-3 max-sm:mt-2">
            <div className="flex flex-row gap-2 max-sm:gap-1.5">
              <Image src="/calendar.svg" alt="calendar" width={22} height={22} className="max-sm:w-5 max-sm:h-5" />
              <p className="max-sm:text-sm">{formattedDate}</p>
            </div>
            <div className="flex flex-row gap-2 items-center">
              <Image src="/star.svg" alt="star" width={22} height={22} />
              <p>{template.level}</p>
            </div>
          </div>

          {/* Stats */}
          {showStats && (
            <div className="flex flex-row gap-4 mt-3 text-sm">
              <div className="flex items-center gap-1">
                <span className="text-green-400">📊</span>
                <span>{template.completionCount} completed</span>
              </div>
              {template.averageScore && template.averageScore > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-blue-400">⭐</span>
                  <span>{Math.round(template.averageScore)}% avg</span>
                </div>
              )}
            </div>
          )}

          <p className="line-clamp-3 mt-5 text-sm leading-relaxed">
            {template.description || `${template.role} interview for ${template.level} level candidates with ${template.questionCount} questions covering ${template.type?.filter(t => t).join(', ')?.toLowerCase() || 'various'} topics.`}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <DisplayTechIcons techStack={template.techstack} />

          <div className="flex flex-row justify-between gap-2">
            {/* Primary Action Button */}
            <Link
              href={`/interview/template/${template.id}`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex-1 text-center"
            >
              Take Interview
            </Link>

            {/* Owner Actions */}
            {isOwner && (
              <div className="flex gap-1 max-sm:gap-1.5 max-sm:flex-wrap">
                {onViewResults && template.completionCount > 0 && (
                  <button
                    onClick={() => onViewResults(template.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 max-sm:px-4 max-sm:py-2.5 rounded-lg max-sm:rounded-xl text-sm max-sm:text-base transition-colors duration-200"
                    title="View results dashboard"
                  >
                    📊
                  </button>
                )}

                {onEdit && (
                  <button
                    onClick={() => onEdit(template)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 max-sm:px-4 max-sm:py-2.5 rounded-lg max-sm:rounded-xl text-sm max-sm:text-base transition-colors duration-200"
                    title="Edit template"
                  >
                    ✏️
                  </button>
                )}

                <button
                  onClick={handleToggleVisibility}
                  disabled={isToggling}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 max-sm:px-4 max-sm:py-2.5 rounded-lg max-sm:rounded-xl text-sm max-sm:text-base transition-colors duration-200"
                  title={template.isPublic ? 'Make private' : 'Make public'}
                >
                  {isToggling ? '⏳' : (template.isPublic ? '🔒' : '🌐')}
                </button>

                <button
                  onClick={handleShare}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 max-sm:px-4 max-sm:py-2.5 rounded-lg max-sm:rounded-xl text-sm max-sm:text-base transition-colors duration-200"
                  title="Share template"
                >
                  📤
                </button>

                {onDelete && (
                  <button
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm transition-colors duration-200"
                    title="Delete template"
                  >
                    🗑️
                  </button>
                )}
              </div>
            )}

            {/* Non-owner Actions */}
            {!isOwner && (
              <button
                onClick={handleShare}
                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm transition-colors duration-200"
                title="Share template"
              >
                📤
              </button>
            )}
          </div>

          {/* Additional Info */}
          <div className="flex justify-between text-xs text-gray-400">
            <span>{template.questionCount} questions</span>
            <span>{template.level} level</span>
            {template.isPublic && !isOwner && (
              <span className="text-green-400">Public</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateCard;
