"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return

      const file = acceptedFiles[0]
      setIsUploading(true)

      try {
        // Create a FormData object to send the file
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (response.ok) {
          const { url } = await response.json()
          onChange(url)
        } else {
          console.error("Upload failed")
        }
      } catch (error) {
        console.error("Error uploading file:", error)
      } finally {
        setIsUploading(false)
      }
    },
    [onChange],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: 1,
    disabled: isUploading,
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

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-accent",
        isDragActive && "border-accent bg-accent/5",
        isUploading && "opacity-50 cursor-not-allowed",
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
          <p className="text-sm font-medium">
            {isDragActive ? "Drop your image here" : "Drag & drop an image, or click to select"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP up to 10MB</p>
        </div>
      </div>
    </div>
  )
}
