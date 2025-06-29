"use client";
import { cn } from '@/lib/utils';
import { mappings } from '@/constants';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const techIconBaseURL = "https://cdn.jsdelivr.net/gh/devicons/devicon/icons";

const normalizeTechName = (tech: string) => {
    if (!tech) return '';
    
    // Clean up the tech name more thoroughly
    const key = tech.toLowerCase()
        .replace(/\.js$/, "")
        .replace(/\s+/g, "")
        .replace(/[^\w]/g, "")
        .trim();
    
    return mappings[key as keyof typeof mappings] || tech.toLowerCase().replace(/\s+/g, "");
};

const DisplayTechIcons = ({ techStack }: TechIconProps) => {
    const [techIcons, setTechIcons] = useState<Array<{ tech: string; url: string; fallbacks?: string[] }>>([]);
    const [loading, setLoading] = useState(true);

    // Debug logging
    console.log('DisplayTechIcons Debug:', {
        techStack,
        techStackLength: techStack?.length,
        isArray: Array.isArray(techStack)
    });

    useEffect(() => {
        const loadTechIcons = () => {
            // Ensure we have a valid tech stack array
            if (!techStack || !Array.isArray(techStack) || techStack.length === 0) {
                console.log('No valid tech stack provided, setting empty icons');
                setTechIcons([]);
                setLoading(false);
                return;
            }

            const logoURLs = techStack.map((tech) => {
                const normalized = normalizeTechName(tech);
                const fallbackUrls = [
                    `${techIconBaseURL}/${normalized}/${normalized}-original.svg`,
                    `${techIconBaseURL}/${normalized}/${normalized}-plain.svg`,
                    `${techIconBaseURL}/${normalized}/${normalized}-original-wordmark.svg`
                ];
                
                return {
                    tech,
                    url: fallbackUrls[0], // Start with the first URL
                    fallbacks: fallbackUrls.slice(1)
                };
            });

            setTechIcons(logoURLs);
            setLoading(false);
        };

        if (techStack && techStack.length > 0) {
            loadTechIcons();
        } else {
            console.log('Empty or invalid tech stack, showing fallback');
            setTechIcons([]);
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

    // Handle empty tech stack case
    if (!techIcons || techIcons.length === 0) {
        return (
            <div className='flex flex-row items-center gap-2'>
                <div className="relative group bg-gray-800 rounded-full p-2 flex items-center justify-center border border-gray-600">
                    <span className='absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white text-gray-900 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20 pointer-events-none shadow-lg'>
                        General Interview
                    </span>
                    <Image 
                        src="/tech.svg" 
                        alt="General Tech" 
                        width={25} 
                        height={25} 
                        className="w-5 h-5 object-contain"
                    />
                </div>
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
                            const target = e.target as HTMLImageElement;
                            const currentIcon = techIcons.find(icon => icon.tech === tech);
                            
                            // Try fallback URLs first
                            if (currentIcon?.fallbacks && currentIcon.fallbacks.length > 0) {
                                const nextFallback = currentIcon.fallbacks.shift();
                                if (nextFallback) {
                                    target.src = nextFallback;
                                    return;
                                }
                            }
                            
                            // Final fallback to default tech icon
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