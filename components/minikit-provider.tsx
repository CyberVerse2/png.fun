"use client"

import { ReactNode, useEffect, createContext, useContext, useState } from "react"
import { MiniKit, WalletAuthInput } from "@worldcoin/minikit-js"

interface UserData {
  walletAddress?: string
  username?: string
  profilePictureUrl?: string
  isAuthenticated: boolean
}

const UserContext = createContext<UserData>({
  isAuthenticated: false,
})

export const useUser = () => useContext(UserContext)

export default function MiniKitProvider({ children }: { children: ReactNode }) {
  const [userData, setUserData] = useState<UserData>({ isAuthenticated: false })

  useEffect(() => {
    MiniKit.install("app_a9e1e8a3c65d60bcf0432ec93883b524")

    // Attempt wallet authentication on app load
    const authenticateUser = async () => {
      if (!MiniKit.isInstalled()) {
        console.log("MiniKit not installed, skipping auth")
        return
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
            body: JSON.stringify({ payload: finalPayload, nonce }),
          })

          const verifyData = await verifyRes.json()
          
          if (verifyData.isValid) {
            // Get user data from MiniKit
            setUserData({
              walletAddress: finalPayload.address,
              username: MiniKit.user?.username,
              profilePictureUrl: MiniKit.user?.profilePictureUrl,
              isAuthenticated: true,
            })
          }
        }
      } catch (error) {
        console.error("Authentication error:", error)
      }
    }

    // Run authentication after MiniKit is installed
    setTimeout(authenticateUser, 500)
  }, [])

  return <UserContext.Provider value={userData}>{children}</UserContext.Provider>
}
