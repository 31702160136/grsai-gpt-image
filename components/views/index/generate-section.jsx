"use client";
import Tasks from "./tasks-section";
import ChatSection from "./chat-section";
import { useState, useEffect, useRef } from "react";

const DEFAULT_SPLIT_PERCENT = 55;
const MIN_PANE_WIDTH = 300;
const RESIZER_WIDTH = 16;
const API_BASE_URL = "https://grsai.dakka.com.cn";
const NANO_BANANA_MODEL_PREFIX = "nano-banana";
const MINIMAX_H3_MODEL = "minimax-h3";

const isNanoBananaModel = (model) =>
  model?.startsWith(NANO_BANANA_MODEL_PREFIX);
const isMinimaxH3Model = (model) => model === MINIMAX_H3_MODEL;

const GenerateSection = () => {
  const [tasks, setTasks] = useState([]);
  const [prompt, setPrompt] = useState();
  const [uploading, setUploading] = useState(false);
  const [isGenerate, setIsGenerate] = useState(false);
  const [splitPercent, setSplitPercent] = useState(DEFAULT_SPLIT_PERCENT);
  const [isResizing, setIsResizing] = useState(false);
  const layoutRef = useRef(null);
  const isResizingRef = useRef(false);
  const [drawData, setDrawData] = useState({
    prompt: ``,
    size: "auto",
    variants: 1,
    model: "gpt-image-2",
    urls: [],
    audios: [],
    resolution: "768p",
    duration: 10,
    webHook: "-1",
  });

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // 限制上传图片数量
    const maxImages = isMinimaxH3Model(drawData.model) ? 9 : 8;
    if (drawData.urls.length + files.length > maxImages) {
      alert(`最多只能上传${maxImages}张图片`);
      return;
    }
    // 限制图片大小
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        alert("图片大小必须小于6MB");
        return;
      }
    }
    // 只允许图片格式，jpg, jpeg, png
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    // 检查所有上传的文件类型
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        alert("只允许上传 JPG, JPEG, PNG 和 WebP 文件");
        return;
      }
    }

    for (const file of files) {
      try {
        setUploading(true);
        //转为base64
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
          console.log(e.target.result);
          setDrawData((prev) => ({
            ...prev,
            urls: [...prev.urls, e.target.result],
          }));
        };
      } catch (error) {
        console.error("Error uploading image:", error);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleTaskImageDrop = (imageUrl) => {
    if (!imageUrl) return;

    const maxImages = isMinimaxH3Model(drawData.model) ? 9 : 8;
    if (drawData.urls.length >= maxImages) {
      alert(`最多只能上传${maxImages}张图片`);
      return;
    }

    setDrawData((prev) => {
      const limit = isMinimaxH3Model(prev.model) ? 9 : 8;
      if (prev.urls.length >= limit) return prev;

      return {
        ...prev,
        urls: [...prev.urls, imageUrl],
      };
    });
  };

  const handleAudioUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (drawData.audios.length + files.length > 3) {
      alert("最多只能上传3个音频");
      return;
    }
    if (files.some((file) => !file.type.startsWith("audio/"))) {
      alert("请选择有效的音频文件");
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setDrawData((prev) => {
          if (prev.audios.length >= 3) return prev;
          return { ...prev, audios: [...prev.audios, event.target.result] };
        });
      };
      reader.onerror = () => alert(`读取音频 ${file.name} 失败`);
      reader.readAsDataURL(file);
    });
  };

  const getAPIKEY = () => {
    const savedApiKey = localStorage.getItem("apikey");
    return savedApiKey || process.env.API_KEY;
  };

  async function onGenerate() {
    if (isGenerate) {
      return;
    }
    if (!getAPIKEY()) {
      alert("请先设置APIKEY");
      return;
    }
    setIsGenerate(true);
    try {
      if (isMinimaxH3Model(drawData.model)) {
        if (!drawData.prompt.trim()) {
          throw new Error("minimax-h3 必须填写提示词");
        }
        if (
          !Number.isInteger(Number(drawData.duration)) ||
          Number(drawData.duration) < 1 ||
          Number(drawData.duration) > 15
        ) {
          throw new Error("视频时长必须是 1~15 秒的整数");
        }
        if (
          drawData.resolution === "1080p" &&
          Number(drawData.duration) > 10
        ) {
          throw new Error("1080p 视频时长最多为 10 秒");
        }
      }

      // 新版异步接口只接收明确支持的字段，避免发送旧接口参数
      const requestData = {
        model: drawData.model,
        prompt: drawData.prompt,
        images: drawData.urls,
        aspectRatio: drawData.size,
        replyType: "async",
      };
      if (isMinimaxH3Model(drawData.model)) {
        Object.assign(requestData, {
          audios: drawData.audios,
          resolution: drawData.resolution,
          duration: Number(drawData.duration),
        });
      }
      if (isNanoBananaModel(drawData.model) && drawData.imageSize) {
        requestData.imageSize = drawData.imageSize;
      }
      if (drawData.quality) {
        requestData.quality = drawData.quality;
      }
      if (drawData.background) {
        requestData.background = drawData.background;
      }

      // Remove imageSize for models other than nano-banana-pro
      if (
        drawData.model !== "nano-banana-pro" &&
        drawData.model !== "nano-banana-pro-vt" &&
        drawData.model !== "nano-banana-pro-cl" &&
        drawData.model !== "nano-banana-pro-vip" &&
        drawData.model !== "nano-banana-pro-4k-vip" &&
        drawData.model !== "nano-banana-2" &&
        drawData.model !== "nano-banana-2-cl" &&
        drawData.model !== "nano-banana-2-2k-cl" &&
        drawData.model !== "nano-banana-2-4k-cl"
      ) {
        delete requestData.imageSize;
      }

      const res = await fetch(`${API_BASE_URL}/v1/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + getAPIKEY(),
        },
        body: JSON.stringify(requestData),
        cache: "no-store",
      });
      setIsGenerate(false);
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(
          errorData?.error ||
            errorData?.msg ||
            `HTTP error! status: ${res.status}`,
        );
      }
      const data = await res.json();
      if (!data.id || data.status === "failed" || data.status === "violation") {
        throw new Error(data.error || "创建生成任务失败");
      }
      const taskId = data.id;

      const newTask = {
        id: taskId,
        finish: false,
        loaded: false,
        failureReason: "",
        error: "",
        progress: 0,
        src: "",
        alt: `Generated Image ${taskId}`,
        model: drawData.model,
      };

      // Add new task to the beginning of the tasks array
      setTasks((prevTasks) => [newTask, ...prevTasks]);

      handleTask(taskId);
    } catch (error) {
      setIsGenerate(false);
      console.error("Error generating image:", error);
      alert(error.message || "生成任务创建失败");
    } finally {
      setIsGenerate(false);
    }
  }

  // 刷新页面后重新处理未完成的任务
  function reHandlTask() {
    const savedTasks = localStorage.getItem("savedTasks");
    if (!savedTasks) {
      return;
    }
    const tasks = JSON.parse(savedTasks);
    // Set the saved tasks to the state first
    setTasks(tasks);
    // Then handle unfinished tasks
    for (const task of tasks) {
      if (!task.finish) {
        handleTask(task.id);
      }
    }
  }

  function getCNZUrl(url) {
    return url;
    let result = url.replace(/https:\/\//g, ""); // g 标志表示全局替换所有匹配项
    result = result.replace(/http:\/\//g, "");

    // 提取最后一个.之后的字符串
    const lastDotIndex = result.lastIndexOf(".");
    let suffix = "";
    if (lastDotIndex !== -1) {
      suffix = result.substring(lastDotIndex + 1);
      result = result.substring(0, lastDotIndex);
    }

    result = result.replace(/\./g, "_d_");
    result = result.replace(/\//g, "_x_");
    result = result + "." + suffix;

    // 国内中转地址, 解决网络问题
    return "https://grsai-file2.dakka.com.cn/cnzfile/" + result;
  }

  async function handleTask(id) {
    while (true) {
      const res = await fetch(
        `${API_BASE_URL}/v1/api/result?id=${encodeURIComponent(id)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + getAPIKEY(),
          },
          cache: "no-store",
        },
      );
      const result = await res.json().catch(() => null);
      if (!res.ok || !result) {
        setTasks((prev) =>
          prev.map((task) => {
            if (task.id === id) {
              return {
                ...task,
                finish: true,
                progress: 100,
                error:
                  result?.error ||
                  result?.msg ||
                  `查询任务失败（HTTP ${res.status}）`,
                failureReason: result?.status || "查询任务失败",
              };
            }
            return task;
          }),
        );
        break;
      }
      const data = result;
      if (data.status === "running") {
        setTasks((prev) =>
          prev.map((task) => {
            if (task.id === id) {
              return { ...task, finish: false, progress: data.progress };
            }
            return task;
          }),
        );
        await new Promise((resolve) => setTimeout(resolve, 5000));
        continue;
      }
      if (data.status === "succeeded") {
        let resultUrl = "";
        if (data.results && data.results.length > 0) {
          resultUrl = getCNZUrl(data.results[0].url);
        } else if (data.url) {
          resultUrl = getCNZUrl(data.url);
        } else {
          resultUrl = "";
        }
        setTasks((prev) =>
          prev.map((task) => {
            if (task.id === id) {
              return {
                ...task,
                progress: data.progress,
                finish: true,
                src: resultUrl,
              };
            }
            return task;
          }),
        );
        break;
      }
      if (data.status === "failed" || data.status === "violation") {
        setTasks((prev) =>
          prev.map((task) => {
            if (task.id === id) {
              return {
                ...task,
                finish: true,
                progress: 100,
                failureReason:
                  data.failure_reason ||
                  (data.status === "violation" ? "内容违规" : "生成失败"),
                error: data.error,
              };
            }
            return task;
          }),
        );
        break;
      }

      setTasks((prev) =>
        prev.map((task) =>
          task.id === id
            ? {
                ...task,
                finish: true,
                progress: 100,
                failureReason: `未知任务状态：${data.status || "empty"}`,
                error: data.error || "查询任务返回了未知状态",
              }
            : task,
        ),
      );
      break;
    }
  }

  useEffect(() => {
    reHandlTask();
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem("savedTasks", JSON.stringify(tasks));
    }
  }, [tasks]);

  const clampSplitPercent = (nextPercent) => {
    const layoutWidth = layoutRef.current?.getBoundingClientRect().width;
    if (!layoutWidth) {
      return nextPercent;
    }

    const minPercent = (MIN_PANE_WIDTH / layoutWidth) * 100;
    const maxPercent =
      ((layoutWidth - MIN_PANE_WIDTH - RESIZER_WIDTH) / layoutWidth) * 100;

    if (maxPercent < minPercent) {
      return DEFAULT_SPLIT_PERCENT;
    }

    return Math.min(maxPercent, Math.max(minPercent, nextPercent));
  };

  const resizeFromPointer = (clientX) => {
    const layoutRect = layoutRef.current?.getBoundingClientRect();
    if (!layoutRect) return;

    const nextPercent = ((clientX - layoutRect.left) / layoutRect.width) * 100;
    setSplitPercent(clampSplitPercent(nextPercent));
  };

  const stopResizing = (event) => {
    isResizingRef.current = false;
    setIsResizing(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleResizeKeyDown = (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    event.preventDefault();
    const direction = event.key === "ArrowLeft" ? -1 : 1;
    setSplitPercent((current) => clampSplitPercent(current + direction * 2));
  };

  return (
    <>
      <div className="relative z-11 mt-2 m-auto">
        <div
          ref={layoutRef}
          className="flex backdrop-blur-[5px] gap-2 sm:gap-3 md:gap-4 lg:gap-0 rounded-2xl flex-col lg:grid w-full backdrop-filter"
          style={{
            gridTemplateColumns: `${splitPercent}% ${RESIZER_WIDTH}px minmax(${MIN_PANE_WIDTH}px, 1fr)`,
          }}
        >
          <div className="w-full border border-primary/30 min-w-[300px] p-2 sm:p-3 md:p-4 bg-popover/50 rounded-lg shadow-sm">
            <Tasks tasks={tasks} setTasks={setTasks} />
          </div>
          <div
            role="separator"
            aria-label="调整任务区和生成区宽度"
            aria-orientation="vertical"
            aria-valuemin={Math.round(
              clampSplitPercent(0),
            )}
            aria-valuemax={Math.round(
              clampSplitPercent(100),
            )}
            aria-valuenow={Math.round(splitPercent)}
            tabIndex={0}
            className={`group relative hidden lg:flex h-full cursor-col-resize touch-none items-center justify-center outline-none ${
              isResizing ? "bg-primary/10" : ""
            }`}
            onPointerDown={(event) => {
              event.preventDefault();
              isResizingRef.current = true;
              setIsResizing(true);
              event.currentTarget.setPointerCapture(event.pointerId);
              resizeFromPointer(event.clientX);
            }}
            onPointerMove={(event) => {
              if (isResizingRef.current) {
                resizeFromPointer(event.clientX);
              }
            }}
            onPointerUp={stopResizing}
            onPointerCancel={stopResizing}
            onDoubleClick={() => setSplitPercent(DEFAULT_SPLIT_PERCENT)}
            onKeyDown={handleResizeKeyDown}
          >
            <div
              className={`h-12 w-1 rounded-full transition-colors group-hover:bg-primary/60 group-focus-visible:bg-primary ${
                isResizing ? "bg-primary" : "bg-primary/25"
              }`}
            />
          </div>
          <div className="w-full min-w-0 flex flex-col border border-primary/30 p-2 sm:p-3 md:p-4 bg-popover/50 rounded-lg shadow-sm mb-3 lg:mb-0">
            <ChatSection
              drawData={drawData}
              setDrawData={setDrawData}
              handleImageUpload={handleImageUpload}
              handleAudioUpload={handleAudioUpload}
              handleTaskImageDrop={handleTaskImageDrop}
              onGenerate={onGenerate}
              isGenerate={isGenerate}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default GenerateSection;
