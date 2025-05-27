"use client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import "./chat-section.css";
const Home = ({
  drawData,
  setDrawData,
  handleImageUpload,
  onGenerate,
  isGenerate,
}) => {
  const [uploading, setUploading] = useState(false);

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
            <span>上传图像进行编辑或输入指令以生成新图像</span>
          </div>
        </div>
      </div>
      {/* Seed Input */}
      <div className="mb-6">
        <div className="flex items-center justify-center mb-3">
          <div className="flex space-x-2">
            {/* 尺寸 */}
            {["auto", "2:3", "3:2", "1:1"].map((size) => (
              <button
                key={size}
                onClick={() => setDrawData({ ...drawData, size: size })}
                style={{
                  borderWidth: drawData.size === size ? "2px" : "1px",
                  borderStyle: "solid",
                  borderColor:
                    drawData.size === size ? "var(--primary)" : "var(--border)",
                  backgroundColor:
                    drawData.size === size
                      ? "rgba(var(--primary-rgb), 0.1)"
                      : "var(--input)",
                  color:
                    drawData.size === size
                      ? "var(--primary)"
                      : "var(--muted-foreground)",
                  borderRadius: "6px",
                  padding: "8px",
                  width: "60px",
                  height: "60px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.3s ease",
                }}
                className="text-sm cursor-pointer"
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="relative flex items-center justify-center w-[20px] h-[20px]">
                    {size === "auto" ? (
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
                    ) : size === "2:3" ? (
                      <div
                        className="w-[13.33px] h-[20px] border-[1.5px] border-solid border-current bg-transparent"
                        style={{ minWidth: "13.33px", minHeight: "20px" }}
                      ></div>
                    ) : size === "3:2" ? (
                      <div
                        className="w-[20px] h-[13.33px] border-[1.5px] border-solid border-current bg-transparent"
                        style={{ minWidth: "20px", minHeight: "13.33px" }}
                      ></div>
                    ) : (
                      <div
                        className="w-[20px] h-[20px] border-[1.5px] border-solid border-current bg-transparent"
                        style={{ minWidth: "20px", minHeight: "20px" }}
                      ></div>
                    )}
                  </div>
                  <span>{size}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
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
        ) : (
          "生成图像"
        )}
      </Button>
    </>
  );
};

export default Home;
