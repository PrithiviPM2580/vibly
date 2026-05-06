"use client"

import Link from "next/link"
import Image from "next/image"
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import UserControl from "@/components/user-control"

export const Navbar = () => {
  return (
    <nav className="fixed top-0 right-0 left-0 z-50 border-b border-transparent bg-transparent p-4 transition-all duration-200">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Vibe" width={24} height={24} />
          <span className="text-lg font-semibold">Vibe</span>
        </Link>
        {/* <SignedOut>
          <div className="flex gap-2">
            <SignUpButton>
              <Button variant="outline" size="sm">
                Sign up
              </Button>
            </SignUpButton>
            <SignInButton>
              <Button size="sm">Sign in</Button>
            </SignInButton>
          </div>
        </SignedOut>
        <SignedIn>
          <UserControl showName />
        </SignedIn> */}
        <div>
          <Show when="signed-out">
            <SignInButton />
            <SignUpButton>
              <button className="h-10 cursor-pointer rounded-full bg-[#6c47ff] px-4 text-sm font-medium text-white sm:h-12 sm:px-5 sm:text-base">
                Sign Up
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </div>
    </nav>
  )
}
