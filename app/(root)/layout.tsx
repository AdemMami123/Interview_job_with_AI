import React from 'react'
import { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FileText, User } from 'lucide-react'
import { isAuthenticated } from '@/lib/actions/auth.action'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'
const RootLayout = async({children}:{children:ReactNode}) => {
  const isUserAuthenticated = await isAuthenticated(); 
  if(!isUserAuthenticated) redirect('/sign-in');
  return (
    <div className='root-layout'>
      <nav className="flex items-center justify-between p-4 max-sm:p-3 border-b border-gray-200"> 
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Logo" height={32} width={38} />
          <h2 className='text-primary-100 max-sm:text-lg'>HireVox </h2>
        </Link>
        <div className="flex items-center gap-6 max-sm:gap-3">
          <Link 
            href="/create-template" 
            className="text-gray-600 hover:text-gray-900 transition-colors font-medium max-sm:text-sm"
            title="Templates"
          >
            <span className="max-sm:hidden">Templates</span>
            <FileText className="sm:hidden w-5 h-5" />
          </Link>
          <Link 
            href="/profile" 
            className="text-gray-600 hover:text-gray-900 transition-colors max-sm:text-sm"
            title="Profile"
          >
            <span className="max-sm:hidden">Profile</span>
            <User className="sm:hidden w-5 h-5" />
          </Link>
          <LogoutButton />
        </div>
      </nav>
      <div className="p-4 max-sm:p-3">
        {children}
      </div>
    </div>
  )
}

export default RootLayout