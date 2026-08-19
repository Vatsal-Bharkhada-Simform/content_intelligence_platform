/* This is a server-side only RootLayout to wrap the Payload Admin Panel. */
import config from '@payload-config'
import '@payloadcms/next/css'
import { RootLayout } from '@payloadcms/next/layouts'
import React from 'react'

type Args = {
  children: React.ReactNode
}

export default function Layout({ children }: Args) {
  return <RootLayout config={config}>{children}</RootLayout>
}
