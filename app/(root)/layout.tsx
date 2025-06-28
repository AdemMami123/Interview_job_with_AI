import React from 'react'
import { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { isAuthenticated } from '@/lib/actions/auth.action'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'
const RootLayout = async({children}:{children:ReactNode}) => {
  const isUserAuthenticated = await isAuthenticated(); 
  if(!isUserAuthenticated) redirect('/sign-in');
  return (
    <div className='root-layout'>
      <nav className="flex items-center justify-between p-4 border-b border-gray-200"> 
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Logo" height={32} width={38} />
          <h2 className='text-primary-100'>HireVox </h2>
        </Link>
        <div className="flex items-center gap-4">
          <Link 
            href="/profile" 
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Profile
          </Link>
          <LogoutButton />
        </div>
      </nav>
      <div className="p-4">
        {children}
      </div>
    </div>
  )
}

export default RootLayout