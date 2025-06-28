"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface TranscriptMessage {
  role: string;
  content: string;
}

interface TranscriptViewerProps {
  transcript: TranscriptMessage[];
}

const TranscriptViewer: React.FC<TranscriptViewerProps> = ({ transcript }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!transcript || transcript.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Interview Transcript</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
        >
          {isExpanded ? 'Hide Transcript' : 'Show Transcript'}
        </Button>
      </div>
      
      {isExpanded && (
        <div className="space-y-4 max-h-96 overflow-y-auto border border-gray-700 rounded-lg p-4 bg-gray-800">
          {transcript.map((message, index) => (
            <div 
              key={index} 
              className={`p-3 rounded-lg ${
                message.role === 'user' 
                  ? 'bg-blue-900/30 ml-8 border border-blue-700/50' 
                  : 'bg-gray-700 mr-8 border border-gray-600'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  message.role === 'user' 
                    ? 'bg-blue-800/50 text-blue-300' 
                    : 'bg-gray-600 text-gray-300'
                }`}>
                  {message.role === 'user' ? 'You' : 'Interviewer'}
                </span>
              </div>
              <p className="text-sm text-gray-200 leading-relaxed">{message.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TranscriptViewer;
