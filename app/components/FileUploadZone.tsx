"use client"

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

interface FileUploadZoneProps {
  onUploadSuccess: (urls: string[]) => void
  onUploadError: (error: string) => void
  maxFiles?: number
  acceptedFileTypes?: string[]
}

export default function FileUploadZone({
  onUploadSuccess,
  onUploadError,
  maxFiles = 5,
  acceptedFileTypes = ['image/jpeg', 'image/png', 'image/webp']
}: FileUploadZoneProps) {
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true)
    const formData = new FormData()
    
    acceptedFiles.forEach(file => {
      formData.append('files', file)
    })

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      onUploadSuccess(data.urls)
    } catch (error) {
      onUploadError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [onUploadSuccess, onUploadError])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': acceptedFileTypes
    },
    maxFiles,
    multiple: true
  })

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input {...getInputProps()} />
      {uploading ? (
        <div className="flex items-center justify-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p>Uploading...</p>
        </div>
      ) : (
        <div>
          {isDragActive ? (
            <p>Drop the files here...</p>
          ) : (
            <div>
              <p>Drag & drop files here, or click to select files</p>
              <p className="text-sm text-gray-500 mt-1">
                Maximum {maxFiles} files. Supported formats: JPG, PNG, WebP
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}