"use client"

import { ReactNode, useEffect, createContext, useContext, useState } from "react"
import { MiniKit, WalletAuthInput } from "@worldcoin/minikit-js"

interface UserData {
  walletAddress?: string
  username?: string
  profilePictureUrl?: string
  isAuthenticated: boolean
  isLoading: boolean
}

interface UserContextType {
  user: UserData
  authenticate: () => Promise<boolean>
}

const UserContext = createContext<UserContextType>({
  user: { isAuthenticated: false, isLoading: true },
  authenticate: async () => false,
})

export const useUser = () => useContext(UserContext).user
export const useAuth = () => useContext(UserContext).authenticate

export default function MiniKitProvider({ children }: { children: ReactNode }) {
  const [userData, setUserData] = useState<UserData>({ isAuthenticated: false, isLoading: true })

  useEffect(() => {
    MiniKit.install("app_a9e1e8a3c65d60bcf0432ec93883b524")

    // Automatically authenticate on app load (silent, non-blocking)
    const initAuth = async () => {
      // Wait a bit for MiniKit to be ready
      await new Promise(resolve => setTimeout(resolve, 500))
      
      if (MiniKit.isInstalled()) {
        const success = await authenticate()
        if (!success) {
           setUserData(prev => ({ ...prev, isLoading: false }))
        }
      } else {
         setUserData(prev => ({ ...prev, isLoading: false }))
      }
    }

    initAuth()
  }, [])

  const authenticate = async (): Promise<boolean> => {
    if (!MiniKit.isInstalled()) {
      console.log("MiniKit not installed, skipping auth")
      return false
    }

    try {
      // Get nonce from backend
      const res = await fetch("/api/nonce")
      const { nonce } = await res.json()

      // Request wallet authentication
      const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
        nonce,
        expirationTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
        statement: "Sign in to PNG.FUN",
      } as WalletAuthInput)

      if (finalPayload.status === "success") {
        // Verify on backend
        const verifyRes = await fetch("/api/complete-siwe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            payload: finalPayload, 
            nonce,
            username: MiniKit.user?.username,
            profilePictureUrl: MiniKit.user?.profilePictureUrl,
          }),
        })

        const verifyData = await verifyRes.json()
        
        if (verifyData.isValid) {
          // Get user data from MiniKit
          setUserData({
            walletAddress: finalPayload.address,
            username: MiniKit.user?.username,
            profilePictureUrl: MiniKit.user?.profilePictureUrl,
            isAuthenticated: true,
            isLoading: false
          })
          return true
        }
      }
      return false
    } catch (error) {
      console.error("Authentication error:", error)
      return false
    }
  }

  return (
    <UserContext.Provider value={{ user: userData, authenticate }}>
      {children}
    </UserContext.Provider>
  )
}
