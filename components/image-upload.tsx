"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const { data: session, status } = useSession()

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return

      // Check if user is authenticated
      if (status === "loading") {
        console.log("Session loading, please wait...")
        return
      }

      if (!session) {
        console.error("User not authenticated")
        return
      }

      const file = acceptedFiles[0]
      setIsUploading(true)

      try {
        // Create a FormData object to send the file
        const formData = new FormData()
        formData.append("file", file)

        console.log("Uploading file:", file.name)
        console.log("Session:", session.user?.email)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          credentials: "include", // Include cookies/session for authentication
        })

        console.log("Upload response status:", response.status)

        if (response.ok) {
          const { url } = await response.json()
          console.log("Upload successful, URL:", url)
          onChange(url)
        } else {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
          console.error("Upload failed:", response.status, errorData)
        }
      } catch (error) {
        console.error("Error uploading file:", error)
      } finally {
        setIsUploading(false)
      }
    },
    [onChange, session, status],
  )

  // Disable dropzone if uploading OR if user is not authenticated
  const isDisabled = isUploading || status === "loading" || !session

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: 1,
    disabled: isDisabled,
  })

  const removeImage = () => {
    onChange("")
  }

  if (value) {
    return (
      <div className="relative group">
        <div className="aspect-video rounded-lg overflow-hidden bg-muted">
          <img src={value || "/placeholder.svg"} alt="Recipe" className="w-full h-full object-cover" />
        </div>
        <Button
          variant="destructive"
          size="sm"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={removeImage}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  // Show different states based on session and upload status
  const getDisplayText = () => {
    if (status === "loading") {
      return "Loading session..."
    }
    if (!session) {
      return "Please log in to upload images"
    }
    if (isUploading) {
      return "Uploading..."
    }
    if (isDragActive) {
      return "Drop your image here"
    }
    return "Drag & drop an image, or click to select"
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed border-border rounded-lg p-8 text-center transition-colors",
        !isDisabled && "cursor-pointer hover:border-accent",
        isDragActive && !isDisabled && "border-accent bg-accent/5",
        isDisabled && "opacity-50 cursor-not-allowed border-muted",
      )}
    >
      <input {...getInputProps()} />
      <div className="space-y-4">
        <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
          {isUploading ? (
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium">{getDisplayText()}</p>
          {session && !isUploading && (
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP up to 10MB</p>
          )}
          {!session && status !== "loading" && (
            <p className="text-xs text-destructive mt-1">Authentication required</p>
          )}
        </div>
      </div>
    </div>
  )
}
