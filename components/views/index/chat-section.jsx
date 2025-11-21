"use client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import "./chat-section.css";

// Model size support mapping
const MODEL_SIZE_MAP = {
  "sora-image": ["auto", "1:1", "2:3", "3:2"],
  "nano-banana-fast": [
    "auto",
    "1:1",
    "3:4",
    "4:3",
    "9:16",
    "16:9",
    "2:3",
    "3:2",
    "4:5",
    "5:4",
    "21:9",
  ],
  "nano-banana": [
    "auto",
    "1:1",
    "3:4",
    "4:3",
    "9:16",
    "16:9",
    "2:3",
    "3:2",
    "4:5",
    "5:4",
    "21:9",
  ],
  "nano-banana-pro": [
    "auto",
    "1:1",
    "3:4",
    "4:3",
    "9:16",
    "16:9",
    "2:3",
    "3:2",
    "4:5",
    "5:4",
    "21:9",
  ],
  "veo3.1-fast": ["16:9", "9:16"],
  "veo3.1-pro": ["16:9", "9:16"],
  "sora-2": ["16:9", "9:16"],
};

// 视频模型列表
const VIDEO_MODELS = ["veo3.1-fast", "veo3.1-pro", "sora-2"];

const Home = ({
  drawData,
  setDrawData,
  handleImageUpload,
  onGenerate,
  isGenerate,
}) => {
  const [uploading, setUploading] = useState(false);

  // 判断当前模型是否为视频模型
  const isVideoModel = VIDEO_MODELS.includes(drawData.model);

  // Get available sizes for the current model
  const getAvailableSizes = (model) => {
    return MODEL_SIZE_MAP[model] || ["auto"];
  };

  // Handle model change and update size if needed
  const handleModelChange = (newModel) => {
    const availableSizes = getAvailableSizes(newModel);
    const currentSize = drawData.size;

    // If current size is not available for the new model, use the first available size
    const newSize = availableSizes.includes(currentSize)
      ? currentSize
      : availableSizes[0];

    // Set default duration for sora-2 model
    const newData = { ...drawData, model: newModel, size: newSize };
    if (newModel === "sora-2" && !drawData.duration) {
      newData.duration = 10;
    }

    setDrawData(newData);
  };

  // Render size icon based on aspect ratio
  const renderSizeIcon = (size) => {
    if (size === "auto") {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="16 17 21 12 16 7" />
          <polyline points="8 7 3 12 8 17" />
          <line x1="10" x2="14" y1="12" y2="12" />
        </svg>
      );
    }

    // Calculate width and height based on aspect ratio
    const [width, height] = size.split(":").map(Number);
    const maxSize = 20;
    const ratio = width / height;

    let boxWidth, boxHeight;
    if (ratio > 1) {
      boxWidth = maxSize;
      boxHeight = maxSize / ratio;
    } else {
      boxHeight = maxSize;
      boxWidth = maxSize * ratio;
    }

    return (
      <div
        className="border-[1.5px] border-solid border-current bg-transparent"
        style={{
          width: `${boxWidth}px`,
          height: `${boxHeight}px`,
          minWidth: `${boxWidth}px`,
          minHeight: `${boxHeight}px`,
        }}
      ></div>
    );
  };

  return (
    <>
      <div className="upload flex-1">
        {drawData.urls.length > 0 && (
          <div className="mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {drawData.urls.map((image, index) => (
                <div
                  key={index}
                  className="relative images aspect-square overflow-hidden rounded-lg border border-border transition-all duration-300 hover:shadow-lg hover:scale-105 hover:border-primary animate-fadeIn"
                  style={{
                    opacity: 0,
                    animation: `fadeIn 0.5s ease-in-out ${
                      index * 100
                    }ms forwards`,
                  }}
                >
                  <img
                    src={image}
                    alt={`Uploaded ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => {
                      setDrawData((prev) => ({
                        ...prev,
                        urls: prev.urls.filter((_, i) => i !== index),
                      }));
                    }}
                    className="absolute close-btn opacity-0 cursor-pointer top-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-1 transition-all duration-300 group-hover:opacity-100"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <div className="absolute inset-0 bg-transparent hover:bg-black hover:bg-opacity-10 transition-all duration-300 pointer-events-none"></div>
                  <style jsx>{`
                    @keyframes fadeIn {
                      from {
                        opacity: 0;
                        transform: translateY(10px);
                      }
                      to {
                        opacity: 1;
                        transform: translateY(0);
                      }
                    }
                  `}</style>
                </div>
              ))}
            </div>
          </div>
        )}
        <div
          className={`border-2 mt-4 m-auto border-dashed ${
            drawData.urls.length > 0 ? "border-gray-300" : "border-primary/50"
          } rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer`}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add("border-primary", "bg-primary/10");
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove("border-primary", "bg-primary/10");
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove("border-primary", "bg-primary/10");
            const files = Array.from(e.dataTransfer.files);
            if (files.some((file) => file.type.startsWith("image/"))) {
              const imageFiles = files.filter((file) =>
                file.type.startsWith("image/")
              );
              const event = { target: { files: imageFiles } };
              handleImageUpload(event);
            }
          }}
        >
          <input
            type="file"
            id="image-upload"
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              handleImageUpload(e);
              // Reset the input value after upload to allow selecting the same file again
              e.target.value = null;
            }}
            multiple
          />
          <label htmlFor="image-upload" className="cursor-pointer">
            <div className="flex flex-col items-center justify-center">
              {uploading ? (
                <>
                  <div className="w-12 mb-3 relative">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 text-primary animate-pulse"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center">
                      <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </div>
                  <p className="text-lg font-medium text-primary animate-bounce">
                    Uploading...
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Please wait while we process your image
                  </p>
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-primary/70 mb-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  {!uploading && drawData.urls.length > 0 ? (
                    <div className="flex flex-col items-center">
                      <p className="text-primary">点击添加更多图像</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-lg font-medium text-primary/70">
                        点击上传图像
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        或拖放图像到这里
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        支持 JPG, JPEG, PNG, WEBP 格式
                      </p>
                    </>
                  )}
                </>
              )}
            </div>
          </label>
        </div>

        <div className="mt-3 text-sm text-foreground font-bold flex items-center justify-center">
          <div className="flex items-center gap-2 my-6">
            <svg
              className="h-5 w-5 text-primary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span>
              {isVideoModel
                ? "输入指令以生成视频"
                : "上传图像进行编辑或输入指令以生成新图像"}
            </span>
          </div>
        </div>
      </div>
      {/* Seed Input */}
      <div className="mb-6">
        <div className="mb-3">
          <div className="text-sm font-medium mb-2 text-foreground">
            模型选项
          </div>
          <Select value={drawData.model} onValueChange={handleModelChange}>
            <SelectTrigger className="w-full h-11 bg-input border-primary/50">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3" />
                  </svg>
                  <span>{drawData.model}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sora-image">
                <div className="flex items-center gap-2">
                  <span>sora-image</span>
                </div>
              </SelectItem>
              <SelectItem value="nano-banana-fast">
                <div className="flex items-center gap-2">
                  <span>nano-banana-fast</span>
                </div>
              </SelectItem>
              <SelectItem value="nano-banana">
                <div className="flex items-center gap-2">
                  <span>nano-banana</span>
                </div>
              </SelectItem>
              <SelectItem value="nano-banana-pro">
                <div className="flex items-center gap-2">
                  <span>nano-banana-pro</span>
                </div>
              </SelectItem>
              <SelectItem value="sora-2">
                <div className="flex items-center gap-2">
                  <span>sora-2</span>
                </div>
              </SelectItem>
              <SelectItem value="veo3.1-fast">
                <div className="flex items-center gap-2">
                  <span>veo3.1-fast</span>
                </div>
              </SelectItem>
              <SelectItem value="veo3.1-pro">
                <div className="flex items-center gap-2">
                  <span>veo3.1-pro</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="mb-3">
          <div className="text-sm font-medium mb-2 text-foreground">
            尺寸选项
          </div>
          <Select
            value={drawData.size}
            onValueChange={(value) => setDrawData({ ...drawData, size: value })}
          >
            <SelectTrigger className="w-full h-11 bg-input border-primary/50">
              <SelectValue>
                <div className="flex items-center gap-2">
                  {renderSizeIcon(drawData.size)}
                  <span>{drawData.size}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {getAvailableSizes(drawData.model).map((size) => (
                <SelectItem key={size} value={size}>
                  <div className="flex items-center gap-2">
                    {renderSizeIcon(size)}
                    <span>{size}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Duration option for sora-2 model */}
        {drawData.model === "sora-2" && (
          <div className="mb-3">
            <div className="text-sm font-medium mb-2 text-foreground">
              时长选项
            </div>
            <Select
              value={drawData.duration?.toString() || "10"}
              onValueChange={(value) =>
                setDrawData({ ...drawData, duration: Number(value) })
              }
            >
              <SelectTrigger className="w-full h-11 bg-input border-primary/50">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>{drawData.duration || 10}秒</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">
                  <div className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>10秒</span>
                  </div>
                </SelectItem>
                <SelectItem value="15">
                  <div className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>15秒</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <Textarea
          placeholder="Tell us how you want to edit the image"
          className="resize-none h-[100px] text-foreground p-2 border-primary/50 bg-input"
          rows={4}
          value={drawData.prompt}
          onChange={(e) => setDrawData({ ...drawData, prompt: e.target.value })}
        />
      </div>

      <Button
        className="w-full cursor-pointer h-11 bg-primary hover:bg-primary/80 border border-primary/20 transition-all duration-300 text-primary-foreground"
        disabled={
          (!drawData.prompt && drawData.urls.length === 0) ||
          uploading ||
          isGenerate
        }
        onClick={onGenerate}
      >
        {isGenerate ? (
          <div className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-5 w-5 text-primary-foreground"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>生成中...</span>
          </div>
        ) : isVideoModel ? (
          "生成视频"
        ) : (
          "生成图像"
        )}
      </Button>
    </>
  );
};

export default Home;
