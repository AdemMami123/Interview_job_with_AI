import { getTechLogos,cn } from '@/lib/utils'
import React from 'react'
import Image from 'next/image'


const DisplayTechIcons = async({techStack}:TechIconProps) => {
    const techIcons=await getTechLogos(techStack);
  return (
    <div className='flex flex-row items-center gap-2'> 
      {techIcons.slice(0,3).map(({tech,url},index)=>(
        <div key={tech} className={cn("relative group bg-gray-800 rounded-full p-2 flex items-center justify-center border border-gray-600 hover:border-gray-400 hover:bg-gray-700 transition-all duration-200")}>
            <span className='absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white text-gray-900 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20 pointer-events-none shadow-lg'>
              {tech}
            </span>
            <Image src={url} alt={tech} width={25} height={25} className="w-5 h-5 object-contain" />
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
  )
}

export default DisplayTechIcons