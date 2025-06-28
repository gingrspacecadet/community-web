"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { UploadCloud } from "lucide-react"

export default function PlayPage() {
  const [images, setImages] = useState<string[]>([])

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const urls = files.map(file => URL.createObjectURL(file))
    setImages(prev => [...prev, ...urls])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-800 mb-2">Join Bigstone</h1>
        <p className="text-slate-600 text-lg mb-4">Play the Minecraft server: <strong>play.bigstone.ovh</strong></p>
        <p className="text-slate-500">Supports 1.21.6 (or 1.21.1 for Axiom)</p>
      </div>

      <div className="max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <UploadCloud className="w-5 h-5 text-blue-600" />
              Upload a Server Banner or Screenshot
            </CardTitle>
            <CardDescription>Choose a PNG, JPG, or WEBP image to preview it here</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input type="file" accept="image/*" multiple onChange={handleImageUpload} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {images.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`Upload ${idx}`}
                  className="w-full h-auto rounded-lg border shadow"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
