import React from 'react'
import { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const RootLayout = ({children}:{children:ReactNode}) => {
  return (
    <div className='root-layout'>
      <nav> 
        <Link href="/" className="flex items-center gap-2">
        <Image src="/logo.svg" alt="Logo" height={32} width={38} />
        <h2 className='text-primary-100'>HireVox </h2>
        </Link>
      </nav>
      {children}
    </div>
  )
}

export default RootLayout