"use client";
import { useState, useEffect, memo, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import JSZip from "jszip";
import { saveAs } from "file-saver";

// 本地存储的键名
const LOCAL_STORAGE_KEY = "savedTasks";
// 最大保存任务数
const MAX_SAVED_TASKS = 200;

// 视频模型列表
const VIDEO_MODELS = ["veo3.1-fast", "veo3.1-pro", "sora-2"];

// 判断是否为视频模型
const isVideoModel = (model) => {
  return VIDEO_MODELS.includes(model);
};

// 单个任务项组件 - 使用memo优化，避免不必要的重新渲染
const TaskItem = memo(
  ({
    image,
    index,
    selectionMode,
    selectedImages,
    onImageLoad,
    onImageError,
    onToggleSelection,
    onOpenPreview,
    getErrorMessage,
  }) => {
    return (
      <div
        key={image.id}
        className={`group relative ${selectionMode ? "cursor-pointer" : ""}`}
        style={{
          animation: `fadeInUp 0.6s ease-out ${index * 100}ms forwards`,
        }}
        onClick={(e) => {
          if (selectionMode) {
            e.stopPropagation();
            onToggleSelection(image.id);
          } else {
            onOpenPreview(image);
          }
        }}
      >
        <div
          className={`relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${
            selectionMode && selectedImages.includes(image.id)
              ? "ring-4 ring-blue-500 ring-opacity-70"
              : ""
          }`}
        >
          {/* 图片/视频容器 - 固定宽高比 */}
          <div className="relative aspect-square bg-gray-100 dark:bg-gray-800">
            {!image.error && image.src ? (
              isVideoModel(image.model) ? (
                <video
                  key={`video-${image.id}`}
                  src={image.src}
                  className={`cursor-pointer w-full h-full object-cover transition-opacity duration-300`}
                  onLoadedData={() => onImageLoad(index)}
                  onError={() => onImageError(index)}
                  preload="metadata"
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={image.src}
                  alt={image.alt}
                  className={`cursor-pointer w-full h-full object-cover transition-opacity duration-300`}
                  onLoad={() => onImageLoad(index)}
                  onError={() => onImageError(index)}
                  loading="lazy"
                />
              )
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-4">
                <svg
                  className="w-8 h-8 mb-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-xs text-center text-gray-500 dark:text-gray-400">
                  {getErrorMessage(image)}
                </span>
              </div>
            )}

            {/* 加载指示器 */}
            {!image.loaded && !image.error && !image.finish && (
              <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center justify-center bg-white/70 dark:bg-black/70 p-2 pointer-events-none">
                {image.progress > 0 ? (
                  /* 进度条 */
                  <div className="w-full">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        进度
                      </span>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {Math.round(image.progress)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(0, image.progress)
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                )}
              </div>
            )}

            {/* 视频播放图标指示器 */}
            {isVideoModel(image.model) &&
              image.src &&
              !image.error &&
              !selectionMode && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-black/50 rounded-full p-3 backdrop-blur-sm">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </div>
                </div>
              )}

            {/* 选择指示器 - 确保在所有图片上显示 */}
            {selectionMode && (
              <div className="absolute top-2 right-2 z-10 pointer-events-none">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    selectedImages.includes(image.id)
                      ? "bg-blue-500 border-blue-500"
                      : "bg-white/70 border-gray-400"
                  }`}
                >
                  {selectedImages.includes(image.id) && (
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // 自定义比较函数：只在这些属性变化时才重新渲染
    return (
      prevProps.image.id === nextProps.image.id &&
      prevProps.image.src === nextProps.image.src &&
      prevProps.image.loaded === nextProps.image.loaded &&
      prevProps.image.error === nextProps.image.error &&
      prevProps.image.progress === nextProps.image.progress &&
      prevProps.image.finish === nextProps.image.finish &&
      prevProps.selectionMode === nextProps.selectionMode &&
      prevProps.selectedImages.includes(prevProps.image.id) ===
        nextProps.selectedImages.includes(nextProps.image.id)
    );
  }
);

TaskItem.displayName = "TaskItem";

// 图片/视频预览模态框组件 - 使用memo优化，避免父组件更新时重新渲染
const ImagePreviewModal = memo(
  ({ previewImage, onClose }) => {
    if (!previewImage) return null;

    const isVideo = isVideoModel(previewImage.model);

    // 视频加载完成后尝试播放
    const handleVideoLoad = useCallback((e) => {
      const video = e.target;
      // 尝试播放视频
      const playPromise = video.play();

      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.log("自动播放被阻止，用户需要手动播放:", error);
          // 自动播放失败不需要特殊处理，用户可以通过controls手动播放
        });
      }
    }, []);

    return (
      <div
        className="fixed inset-0 w-full h-full"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99999,
          overflow: "hidden",
          backgroundColor: "rgba(0, 0, 0, 0.85)",
        }}
        onClick={onClose}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="relative max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            {isVideo ? (
              <video
                key={`preview-video-${previewImage.id}`}
                src={previewImage.src}
                controls
                autoPlay
                loop
                playsInline
                muted={false}
                onLoadedData={handleVideoLoad}
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              >
                您的浏览器不支持视频播放
              </video>
            ) : (
              <img
                src={previewImage.src}
                alt={previewImage.alt}
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              />
            )}
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // 只在 previewImage 的关键属性变化时才重新渲染
    return (
      prevProps.previewImage?.id === nextProps.previewImage?.id &&
      prevProps.previewImage?.src === nextProps.previewImage?.src &&
      prevProps.onClose === nextProps.onClose
    );
  }
);

ImagePreviewModal.displayName = "ImagePreviewModal";

// 下载进度模态框组件 - 使用memo优化
const DownloadProgressModal = memo(
  ({ downloadProgress }) => {
    return (
      <div
        className="fixed inset-0 w-full h-full flex items-center justify-center"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99999,
          overflow: "hidden",
          backgroundColor: "rgba(0, 0, 0, 0.85)",
        }}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            正在打包下载...
          </h3>
          <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700 mb-4">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all duration-300"
              style={{ width: `${downloadProgress}%` }}
            ></div>
          </div>
          <div className="text-center text-gray-700 dark:text-gray-300">
            {Math.round(downloadProgress)}%
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // 只在进度变化超过1%时才重新渲染，减少不必要的更新
    return (
      Math.floor(prevProps.downloadProgress) ===
      Math.floor(nextProps.downloadProgress)
    );
  }
);

DownloadProgressModal.displayName = "DownloadProgressModal";

const Tasks = ({ tasks, setTasks }) => {
  const [images, setImages] = useState(tasks);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  // 从本地存储加载任务
  const loadTasksFromStorage = () => {
    if (typeof window === "undefined") return [];

    try {
      const savedTasks = localStorage.getItem(LOCAL_STORAGE_KEY);
      return savedTasks ? JSON.parse(savedTasks) : [];
    } catch (error) {
      console.error("从本地存储加载任务失败:", error);
      return [];
    }
  };

  // 保存任务到本地存储
  const saveTasksToStorage = (tasksToSave) => {
    if (typeof window === "undefined") return;

    try {
      // 确保只保存最多 MAX_SAVED_TASKS 条任务
      const tasksToStore = tasksToSave.slice(0, MAX_SAVED_TASKS);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasksToStore));
      console.log(`已保存 ${tasksToStore.length} 条任务到本地存储`);
    } catch (error) {
      console.error("保存任务到本地存储失败:", error);
    }
  };

  // 清理和准备任务数据，移除不需要存储的临时状态
  const prepareTasksForStorage = (tasksToPrep) => {
    return tasksToPrep.map((task) => ({
      id: task.id,
      src: task.src,
      alt: task.alt,
      model: task.model, // 保存模型信息以便判断是视频还是图片
      // 只保留必要的数据，不存储临时状态
      // 例如加载状态、错误状态、进度等会在加载时重新设置
    }));
  };

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    // 首次加载时，如果没有传入任务，则尝试从本地存储加载
    if (tasks.length === 0 && loading) {
      const savedTasks = loadTasksFromStorage();
      if (savedTasks.length > 0) {
        console.log(`从本地存储加载了 ${savedTasks.length} 条任务`);
        // 更新图片状态，但保持loading为true直到处理完成
        setImages(
          savedTasks.map((task) => ({
            ...task,
            loaded: false,
            error: false,
          }))
        );
      }
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 当 tasks 变化时更新 images
    if (tasks.length > 0) {
      const updatedImages = tasks.map((task) => ({
        ...task,
        loaded: task.loaded !== undefined ? task.loaded : false,
        error: task.error !== undefined ? task.error : false,
      }));

      // 修复: 不要直接覆盖现有的图片，而是合并新旧图片
      setImages((prevImages) => {
        // 创建ID映射以便快速查找
        const existingImagesMap = new Map(
          prevImages.map((img) => [img.id, img])
        );

        // 优先使用新任务的数据，但保留未包含在新tasks中的旧图片
        const combinedImages = [
          // 首先添加新的任务
          ...updatedImages,
          // 然后添加旧的、不在新任务中的图片
          ...prevImages.filter(
            (img) => !tasks.some((task) => task.id === img.id)
          ),
        ];

        return combinedImages;
      });

      // 保存到本地存储
      // 合并现有存储的任务和新任务，确保不重复
      const existingTasks = loadTasksFromStorage();
      const existingIds = new Set(existingTasks.map((task) => task.id));

      // 过滤出新的、不在存储中的任务
      const newTasks = tasks.filter((task) => !existingIds.has(task.id));

      if (newTasks.length > 0) {
        // 准备要存储的任务，将新任务放在前面，然后是现有任务
        const combinedTasks = [
          ...prepareTasksForStorage(newTasks),
          ...existingTasks,
        ];
        saveTasksToStorage(combinedTasks);
      }

      setLoading(false);
    }
  }, [tasks]);

  // 当退出选择模式时，清空已选择的图片
  useEffect(() => {
    if (!selectionMode) {
      setSelectedImages([]);
    }
  }, [selectionMode]);

  // 当选择模式或选中的图片发生变化时记录日志
  useEffect(() => {
    if (selectionMode) {
      console.log("选择模式已启用，当前选中图片:", selectedImages);
    }
  }, [selectionMode, selectedImages]);

  // 当图片数据变化时记录日志
  useEffect(() => {
    if (!loading) {
      console.log("图片数据已更新:", images.length, "张图片");
    }
  }, [images, loading]);

  const handleImageLoad = (index) => {
    console.log(`图片加载完成: index=${index}`);
    setImages((prev) => {
      const updated = prev.map((img, i) =>
        i === index ? { ...img, loaded: true } : img
      );
      console.log(`更新后的图片状态:`, updated[index]);
      return updated;
    });
  };

  const handleImageError = (index) => {
    setImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, error: true } : img))
    );
  };

  // 获取错误消息
  const getErrorMessage = (task) => {
    if (!task.finish) {
      return "";
    }
    if (!task.failureReason) return "";

    switch (task.failureReason) {
      case "input_moderation":
        return "输入违规";
      case "output_moderation":
        return "输出违规";
      case "error":
        return task.error || "生成失败";
      default:
        return task.failureReason || "未知错误";
    }
  };

  // 清除所有保存的任务
  const clearSavedTasks = () => {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setImages([]);
      setTasks([]);
      console.log("已清除所有本地存储的任务");
    } catch (error) {
      console.error("清除本地存储失败:", error);
    }
  };

  const openPreview = useCallback(
    (image) => {
      if (selectionMode) return;
      if (!image.src) return;
      setPreviewImage(image);
      // 防止背景滚动
      if (typeof document !== "undefined") {
        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";
      }
    },
    [selectionMode]
  );

  const closePreview = useCallback(() => {
    setPreviewImage(null);
    // 恢复背景滚动
    if (typeof document !== "undefined") {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }
  }, []);

  const toggleImageSelection = (imageId) => {
    console.log(`切换图片选择: imageId=${imageId}, 当前选择:`, selectedImages);
    setSelectedImages((prev) => {
      const newSelection = prev.includes(imageId)
        ? prev.filter((id) => id !== imageId)
        : [...prev, imageId];
      console.log(`新的选择状态:`, newSelection);
      return newSelection;
    });
  };

  const toggleSelectionMode = () => {
    setSelectionMode((prev) => !prev);
  };

  // 下载单张图片或视频
  const downloadImage = async (imageUrl, filename) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      // 从Content-Type确定文件类型
      const contentType = response.headers.get("content-type");
      if (contentType) {
        // 如果文件名中已经有扩展名，检查是否与Content-Type匹配
        let fileExtension = filename.match(/\.([^.]+)$/)?.[1];

        // 根据Content-Type获取适当的扩展名
        let contentTypeExtension = "";
        if (contentType.includes("image/jpeg")) {
          contentTypeExtension = "jpg";
        } else if (contentType.includes("image/png")) {
          contentTypeExtension = "png";
        } else if (contentType.includes("image/gif")) {
          contentTypeExtension = "gif";
        } else if (contentType.includes("image/webp")) {
          contentTypeExtension = "webp";
        } else if (contentType.includes("image/svg+xml")) {
          contentTypeExtension = "svg";
        } else if (contentType.includes("video/mp4")) {
          contentTypeExtension = "mp4";
        } else if (contentType.includes("video/webm")) {
          contentTypeExtension = "webm";
        } else if (contentType.includes("video/")) {
          // 其他视频类型，从Content-Type中提取
          const match = contentType.match(/video\/([a-z0-9]+)/i);
          contentTypeExtension = match ? match[1] : "mp4";
        } else if (contentType.includes("image/")) {
          // 其他图片类型，从Content-Type中提取
          const match = contentType.match(/image\/([a-z]+)/i);
          contentTypeExtension = match ? match[1] : "png";
        }

        // 如果没有扩展名或扩展名不匹配Content-Type
        if (
          !fileExtension ||
          (contentTypeExtension &&
            ![
              "jpg",
              "jpeg",
              "png",
              "gif",
              "webp",
              "svg",
              "mp4",
              "webm",
              "mov",
            ].includes(fileExtension.toLowerCase()))
        ) {
          // 移除任何现有扩展名并添加新的
          const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
          filename = `${nameWithoutExt}.${contentTypeExtension}`;
        }
      }

      return { blob, filename };
    } catch (error) {
      console.error("下载文件失败:", error);
      return null;
    }
  };

  // 批量下载选中的图片
  const downloadSelectedImages = async () => {
    if (selectedImages.length === 0) return;

    setDownloading(true);
    setDownloadProgress(0);

    try {
      const zip = new JSZip();
      const selectedImagesData = images.filter((img) =>
        selectedImages.includes(img.id)
      );

      let completedDownloads = 0;
      const downloadPromises = selectedImagesData.map(async (image, index) => {
        // 从URL中提取文件名
        let filename = "";

        if (image.alt) {
          // 如果alt属性存在，使用它作为基础文件名
          filename = image.alt;
          // 确保文件名有扩展名
          if (!filename.match(/\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|mov)$/i)) {
            // 尝试从URL中提取扩展名
            const urlExtMatch = image.src.match(/\.([^./?#]+)($|\?|#)/i);
            const isVideo = isVideoModel(image.model);
            const extension = urlExtMatch
              ? urlExtMatch[1].toLowerCase()
              : isVideo
              ? "mp4"
              : "png";
            filename = `${filename}.${extension}`;
          }
        } else {
          // 从URL中提取文件名
          const urlFilenameMatch = image.src.match(/\/([^/?#]+)($|\?|#)/i);
          if (urlFilenameMatch) {
            filename = urlFilenameMatch[1];
            // 确保文件名有扩展名
            if (
              !filename.match(/\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|mov)$/i)
            ) {
              const isVideo = isVideoModel(image.model);
              filename = `${filename}.${isVideo ? "mp4" : "png"}`;
            }
          } else {
            // 使用默认文件名
            const isVideo = isVideoModel(image.model);
            filename = `${isVideo ? "video" : "image"}-${index + 1}.${
              isVideo ? "mp4" : "png"
            }`;
          }
        }

        // 确保文件名是唯一的
        if (zip.file(filename)) {
          const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
          const extension = filename.match(/\.([^.]+)$/)?.[1] || "png";
          filename = `${nameWithoutExt}-${index + 1}.${extension}`;
        }

        const result = await downloadImage(image.src, filename);

        if (result) {
          zip.file(result.filename, result.blob);
        }

        completedDownloads++;
        setDownloadProgress(
          (completedDownloads / selectedImagesData.length) * 100
        );
      });

      await Promise.all(downloadPromises);

      const zipBlob = await zip.generateAsync(
        {
          type: "blob",
          compression: "DEFLATE",
          compressionOptions: { level: 6 },
        },
        (metadata) => {
          setDownloadProgress(metadata.percent);
        }
      );

      saveAs(zipBlob, "selected-images.zip");
    } catch (error) {
      console.error("批量下载失败:", error);
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
      setSelectionMode(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full py-8">
        {/* 加载骨架屏 - 网格布局 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, index) => (
            <div
              key={index}
              className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  // 空状态组件
  const EmptyState = () => {
    return (
      <div className="w-full flex flex-col items-center justify-center py-16 px-4">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-6 mb-6">
          <svg
            className="w-16 h-16 text-gray-400 dark:text-gray-500"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm16 2H4v12h16V6zM6 8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S8.33 10 7.5 10 6 9.33 6 8.5zm9 6.5l-3-3-2 2-3-3v4h8v-4z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
          暂无生成的内容
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-8">
          您还没有生成任何图片或视频。请使用右边的生成工具创建您的第一个AI内容。
        </p>
      </div>
    );
  };

  return (
    <div className="w-full py-2">
      {/* 批量操作工具栏 */}
      {images.length > 0 && (
        <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectionMode}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectionMode
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              {selectionMode ? "取消选择" : "批量下载"}
            </button>

            {selectionMode && (
              <>
                <button
                  onClick={() => {
                    console.log("全选按钮点击");
                    const allImageIds = images
                      .filter((img) => !img.error) // 只过滤掉有错误的图片
                      .map((img) => img.id);
                    console.log(
                      `准备全选 ${allImageIds.length} 张图片:`,
                      allImageIds
                    );
                    setSelectedImages(allImageIds);
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  全选
                </button>
                <button
                  onClick={() => {
                    console.log("取消全选按钮点击");
                    setSelectedImages([]);
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  取消全选
                </button>
              </>
            )}

            {/* 清除本地存储按钮 */}
            <button
              onClick={() => {
                if (
                  window.confirm(
                    "确定要清除所有本地存储的任务吗？此操作不可撤销。"
                  )
                ) {
                  clearSavedTasks();
                }
              }}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              清除历史
            </button>
          </div>

          {selectionMode && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                已选择 {selectedImages.length} 个文件
              </span>
              <button
                onClick={downloadSelectedImages}
                disabled={selectedImages.length === 0 || downloading}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedImages.length === 0 || downloading
                    ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
                    : "bg-green-500 text-white hover:bg-green-600"
                }`}
              >
                下载选中内容
              </button>
            </div>
          )}
        </div>
      )}

      {selectionMode && (
        <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z"
                clipRule="evenodd"
              />
            </svg>
            <p>
              点击内容可以选择或取消选择。选择完成后，点击"下载选中内容"按钮可将所选内容（图片/视频）打包下载为ZIP压缩包文件。
            </p>
          </div>
        </div>
      )}

      {!selectionMode && images.length > 0 && (
        <div className="bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-sm rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z"
                clipRule="evenodd"
              />
            </svg>
            <p>
              内容有效期为2小时，请尽快下载。最多存储 {MAX_SAVED_TASKS}{" "}
              个任务，超出限制时将自动删除最旧的任务。点击缩略图可预览完整内容。
            </p>
          </div>
        </div>
      )}

      {/* 空状态显示 */}
      {!loading && images.length === 0 ? (
        <EmptyState />
      ) : (
        /* 图片网格 */
        <div className="grid p-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-6 max-h-[70vh] overflow-y-auto">
          {images.map((image, index) => (
            <TaskItem
              key={image.id}
              image={image}
              index={index}
              selectionMode={selectionMode}
              selectedImages={selectedImages}
              onImageLoad={handleImageLoad}
              onImageError={handleImageError}
              onToggleSelection={toggleImageSelection}
              onOpenPreview={openPreview}
              getErrorMessage={getErrorMessage}
            />
          ))}
        </div>
      )}

      {/* 使用Portal渲染模态框到body */}
      {mounted &&
        previewImage &&
        createPortal(
          <ImagePreviewModal
            previewImage={previewImage}
            onClose={closePreview}
          />,
          document.body
        )}
      {mounted &&
        downloading &&
        createPortal(
          <DownloadProgressModal downloadProgress={downloadProgress} />,
          document.body
        )}

      {/* 自定义样式 */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Tasks;
