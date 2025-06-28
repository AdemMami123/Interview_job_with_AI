"use client";
import { cn } from '@/lib/utils';
import { mappings } from '@/constants';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const techIconBaseURL = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons";

const normalizeTechName = (tech: string) => {
    const key = tech.toLowerCase().replace(/\.js$/, "").replace(/\s+/g, "");
    return mappings[key as keyof typeof mappings] || tech.toLowerCase();
};

const DisplayTechIcons = ({ techStack }: TechIconProps) => {
    const [techIcons, setTechIcons] = useState<Array<{ tech: string; url: string }>>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTechIcons = () => {
            const logoURLs = techStack.map((tech) => {
                const normalized = normalizeTechName(tech);
                return {
                    tech,
                    url: `${techIconBaseURL}/${normalized}/${normalized}-original.svg`,
                };
            });

            // For now, we'll use the URLs directly and fallback to default icon if they fail to load
            setTechIcons(logoURLs);
            setLoading(false);
        };

        if (techStack && techStack.length > 0) {
            loadTechIcons();
        } else {
            setLoading(false);
        }
    }, [techStack]);

    if (loading) {
        return (
            <div className='flex flex-row items-center gap-2'>
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
        );
    }

    return (
        <div className='flex flex-row items-center gap-2'> 
            {techIcons.slice(0, 3).map(({ tech, url }, index) => (
                <div key={tech} className={cn("relative group bg-gray-800 rounded-full p-2 flex items-center justify-center border border-gray-600 hover:border-gray-400 hover:bg-gray-700 transition-all duration-200")}>
                    <span className='absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white text-gray-900 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20 pointer-events-none shadow-lg'>
                        {tech}
                    </span>
                    <Image 
                        src={url} 
                        alt={tech} 
                        width={25} 
                        height={25} 
                        className="w-5 h-5 object-contain"
                        onError={(e) => {
                            // Fallback to default tech icon if the specific icon fails to load
                            const target = e.target as HTMLImageElement;
                            target.src = "/tech.svg";
                        }}
                    />
                </div>
            ))}
            {techIcons.length > 3 && (
                <div className="relative group bg-gray-800 rounded-full p-2 flex items-center justify-center border border-gray-600 hover:border-gray-400 hover:bg-gray-700 transition-all duration-200">
                    <span className='absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white text-gray-900 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20 pointer-events-none shadow-lg'>
                        +{techIcons.length - 3} more technologies
                    </span>
                    <span className="text-gray-300 text-xs font-medium">+{techIcons.length - 3}</span>
                </div>
            )}
        </div>
    );
};

export default DisplayTechIcons;