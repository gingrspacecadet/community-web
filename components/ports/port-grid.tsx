"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowUp, ArrowDown, Palette } from "lucide-react"

interface GridCell {
  x: number
  y: number
  type: "input" | "output" | null
  color?: string
}

interface PortGridProps {
  gridData: GridCell[]
  onGridChange: (gridData: GridCell[]) => void
  readonly?: boolean
}

// Predefined color palette
const COLORS = [
  { name: "Red", value: "#ef4444", bg: "bg-red-500" },
  { name: "Blue", value: "#3b82f6", bg: "bg-blue-500" },
  { name: "Green", value: "#10b981", bg: "bg-emerald-500" },
  { name: "Yellow", value: "#f59e0b", bg: "bg-amber-500" },
  { name: "Purple", value: "#8b5cf6", bg: "bg-violet-500" },
  { name: "Pink", value: "#ec4899", bg: "bg-pink-500" },
  { name: "Orange", value: "#f97316", bg: "bg-orange-500" },
  { name: "Cyan", value: "#06b6d4", bg: "bg-cyan-500" },
  { name: "Lime", value: "#84cc16", bg: "bg-lime-500" },
  { name: "Indigo", value: "#6366f1", bg: "bg-indigo-500" },
  { name: "Gray", value: "#6b7280", bg: "bg-gray-500" },
  { name: "Black", value: "#000000", bg: "bg-black" },
]

export default function PortGrid({ gridData, onGridChange, readonly = false }: PortGridProps) {
  const [selectedTool, setSelectedTool] = useState<"input" | "output" | "erase">("input")
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value)
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null)

  const handleCellClick = (x: number, y: number) => {
    if (readonly) return

    const newGridData = [...gridData]
    const existingIndex = newGridData.findIndex((cell) => cell.x === x && cell.y === y)

    if (selectedTool === "erase") {
      if (existingIndex !== -1) {
        newGridData.splice(existingIndex, 1)
      }
      // Also remove any color cell below this position
      const colorCellIndex = newGridData.findIndex((cell) => cell.x === x && cell.y === y - 1)
      if (colorCellIndex !== -1 && newGridData[colorCellIndex].type === null) {
        newGridData.splice(colorCellIndex, 1)
      }
    } else {
      if (existingIndex !== -1) {
        newGridData[existingIndex] = { x, y, type: selectedTool, color: selectedColor }
      } else {
        newGridData.push({ x, y, type: selectedTool, color: selectedColor })
      }

      // Add color cell below the arrow (if y > 1 to stay within grid)
      if (y > 1) {
        const colorY = y - 1
        const colorCellIndex = newGridData.findIndex((cell) => cell.x === x && cell.y === colorY)

        if (colorCellIndex !== -1) {
          // Update existing color cell
          newGridData[colorCellIndex] = { x, y: colorY, type: null, color: selectedColor }
        } else {
          // Add new color cell
          newGridData.push({ x, y: colorY, type: null, color: selectedColor })
        }
      }
    }

    onGridChange(newGridData)
  }

  const handleCellMouseEnter = (x: number, y: number) => {
    if (!readonly) {
      setHoveredCell({ x, y })
    }
  }

  const handleCellMouseLeave = () => {
    setHoveredCell(null)
  }

  const getCellContent = (x: number, y: number) => {
    const cell = gridData.find((c) => c.x === x && c.y === y)
    if (!cell) return null

    if (cell.type === "input") {
      return <ArrowUp className="w-4 h-4 text-green-600" />
    } else if (cell.type === "output") {
      return <ArrowDown className="w-4 h-4 text-red-600" />
    } else if (cell.type === null && cell.color) {
      // This is a color indicator cell
      return <div className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: cell.color }} />
    }

    return null
  }

  const getCellClass = (x: number, y: number) => {
    const cell = gridData.find((c) => c.x === x && c.y === y)
    const isHovered = hoveredCell?.x === x && hoveredCell?.y === y

    let baseClass = "w-6 h-6 border border-gray-300 flex items-center justify-center text-xs relative transition-colors"

    if (readonly) {
      baseClass += " cursor-default"
    } else {
      baseClass += " cursor-pointer"
    }

    if (cell?.type === "input") {
      baseClass += " bg-green-100"
    } else if (cell?.type === "output") {
      baseClass += " bg-red-100"
    } else if (cell?.type === null && cell?.color) {
      // Color indicator cell - light background
      baseClass += " bg-gray-50"
    } else if (isHovered && !readonly) {
      baseClass += " bg-blue-50 border-blue-300"
    } else if (!readonly) {
      baseClass += " hover:bg-gray-100"
    }

    if (y === 9) {
      baseClass += " border-b-red-300"
    } else if (y === 8) {
      baseClass += " border-t-red-300"
    }
    if (x === 8) {
      baseClass += " border-r-red-300"
    } else if (x === 9) {
      baseClass += " border-l-red-300"
    }

    return baseClass
  }

  const getCurrentColorInfo = () => {
    return COLORS.find((color) => color.value === selectedColor) || COLORS[0]
  }

  return (
    <div className="space-y-4">
      {!readonly && (
        <div className="space-y-4">
          {/* Tool Selection */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={selectedTool === "input" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTool("input")}
              className="flex items-center gap-2"
            >
              <ArrowUp className="w-4 h-4" />
              Input
            </Button>
            <Button
              type="button"
              variant={selectedTool === "output" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTool("output")}
              className="flex items-center gap-2"
            >
              <ArrowDown className="w-4 h-4" />
              Output
            </Button>
            <Button
              type="button"
              variant={selectedTool === "erase" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTool("erase")}
            >
              Erase
            </Button>
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              <span className="text-sm font-medium">Port Color:</span>
              <div className={`w-6 h-6 rounded border-2 border-gray-300 ${getCurrentColorInfo().bg}`} />
              <span className="text-sm text-gray-600">{getCurrentColorInfo().name}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${
                    selectedColor === color.value
                      ? "border-gray-800 ring-2 ring-gray-300"
                      : "border-gray-300 hover:border-gray-500"
                  } ${color.bg}`}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Coordinate Display */}
      {!readonly && (
        <div className="text-center">
          <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {hoveredCell ? `Coordinates: ${hoveredCell.x}x, ${hoveredCell.y}y` : 'Coordinates'}
          </div>
        </div>
      )}

      <div className="inline-block border-2 border-gray-400 p-2 bg-white">
        <div className="grid grid-cols-16 gap-0">
          {Array.from({ length: 16 }, (_, row) =>
            Array.from({ length: 16 }, (_, col) => {
              const x = col + 1
              const y = 16 - row // Flip Y coordinate so (1,1) is bottom-left
              return (
                <div
                  key={`${x}-${y}`}
                  className={getCellClass(x, y)}
                  onClick={() => handleCellClick(x, y)}
                  onMouseEnter={() => handleCellMouseEnter(x, y)}
                  onMouseLeave={handleCellMouseLeave}
                  title={readonly ? `(${x}, ${y})` : undefined}
                >
                  {getCellContent(x, y)}
                </div>
              )
            }),
          )}
        </div>

        <div className="mt-2 text-xs text-gray-500 text-center">
          16x16 Grid - (1,1) is bottom-left corner
          {!readonly && " - Hover to see coordinates"}
        </div>
      </div>

      {!readonly && (
        <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded-lg">
          <p className="font-medium mb-1">💡 How it works:</p>
          <p>• Select a tool (Input/Output) and a color</p>
          <p>• Click on the grid to place arrows</p>
          <p>• A colored dot will appear below each arrow automatically</p>
          <p>• Use different colors to distinguish between different ports</p>
        </div>
      )}
    </div>
  )
}
