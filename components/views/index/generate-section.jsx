"use client";
import Tasks from "./tasks-section";
import ChatSection from "./chat-section";
import { useState, useEffect } from "react";
const GenerateSection = () => {
  const [tasks, setTasks] = useState([]);
  const [prompt, setPrompt] = useState();
  const [uploading, setUploading] = useState(false);
  const [isGenerate, setIsGenerate] = useState(false);
  const [drawData, setDrawData] = useState({
    prompt: ``,
    size: "auto",
    variants: 1,
    model: "sora-image",
    urls: [],
    webHook: "-1",
  });

  const handleImageUpload = async (e) => {
    // 限制上传图片数量
    if (drawData.urls.length >= 8) {
      alert("最多只能上传8张图片");
      return;
    }
    // 限制图片大小
    for (const file of e.target.files) {
      if (file.size > 10 * 1024 * 1024) {
        alert("图片大小必须小于6MB");
        return;
      }
    }
    // 只允许图片格式，jpg, jpeg, png
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    // 检查所有上传的文件类型
    for (const file of e.target.files) {
      if (!allowedTypes.includes(file.type)) {
        alert("只允许上传 JPG, JPEG, PNG 和 WebP 文件");
        return;
      }
    }

    const files = Array.from(e.target.files);
    if (files.length === 0) return;

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

  const getAPIKEY = () => {
    const savedApiKey = localStorage.getItem("apikey");
    return savedApiKey || process.env.API_KEY;
  };

  const getAPIEndpoint = (model) => {
    const baseUrl = "https://grsai.dakka.com.cn";
    // const baseUrl = "http://127.0.0.1:13002";
    const endpointMap = {
      "sora-image": `${baseUrl}/v1/draw/completions`,
      "nano-banana-fast": `${baseUrl}/v1/draw/nano-banana`,
      "nano-banana": `${baseUrl}/v1/draw/nano-banana`,
      "nano-banana-pro": `${baseUrl}/v1/draw/nano-banana`,
      "nano-banana-pro-vt": `${baseUrl}/v1/draw/nano-banana`,
      "veo3.1-fast": `${baseUrl}/v1/video/veo`,
      "veo3.1-pro": `${baseUrl}/v1/video/veo`,
      "sora-2": `${baseUrl}/v1/video/sora-video`,
    };
    return endpointMap[model] || `${baseUrl}/v1/draw/completions`;
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
      const apiEndpoint = getAPIEndpoint(drawData.model);

      // 根据模型类型转换尺寸参数
      // 只有sora-image使用size参数，其他模型使用aspectRatio参数
      const requestData = { ...drawData };
      if (drawData.model === "sora-image") {
        // sora-image使用size参数
        requestData.size = drawData.size;
      } else {
        // 其他模型使用aspectRatio参数
        requestData.aspectRatio = drawData.size;
        // 删除size参数
        delete requestData.size;
      }

      if (drawData.model.indexOf("veo") !== -1 && drawData.urls.length > 0) {
        requestData.firstFrameUrl = drawData.urls[0];
        delete requestData.urls;
      }

      if (drawData.model.indexOf("sora-2") !== -1 && drawData.urls.length > 0) {
        requestData.url = drawData.urls[0];
        delete requestData.urls;
      }

      // Remove imageSize for models other than nano-banana-pro
      if (
        drawData.model !== "nano-banana-pro" ||
        drawData.model !== "nano-banana-pro-vt"
      ) {
        delete requestData.imageSize;
      }

      const res = await fetch(apiEndpoint, {
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
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      if (data.code !== 0) {
        alert(data.msg);
        return;
      }
      const taskId = data.data.id;

      const newTask = {
        id: taskId,
        finish: false,
        loaded: false,
        failureReason: "",
        error: "",
        progress: 0,
        src: "",
        alt: `Generated Image ${taskId}`,
        model: drawData.model, // Save model to determine if it's a video or image
      };

      // Add new task to the beginning of the tasks array
      setTasks((prevTasks) => [newTask, ...prevTasks]);

      handleTask(taskId);
    } catch (error) {
      setIsGenerate(false);
      console.error("Error generating image:", error);
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

    return "https://grsai-file2.dakka.com.cn/cnzfile/" + result;
  }

  async function handleTask(id) {
    const baseUrl = "https://grsai.dakka.com.cn";
    // const baseUrl = "http://127.0.0.1:13002";
    while (true) {
      const res = await fetch(`${baseUrl}/v1/draw/result`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + getAPIKEY(),
        },
        body: JSON.stringify({
          id,
        }),
      });
      const result = await res.json();
      if (result.code === -22) {
        setTasks((prev) =>
          prev.map((task) => {
            if (task.id === id) {
              return {
                ...task,
                finish: true,
                progress: 100,
                error: "超时",
                failureReason: "超时",
              };
            }
            return task;
          })
        );
        break;
      }
      if (result.code !== 0) {
        alert(result.msg);
        break;
      }
      const data = result.data;
      if (data.status === "running") {
        setTasks((prev) =>
          prev.map((task) => {
            if (task.id === id) {
              return { ...task, finish: false, progress: data.progress };
            }
            return task;
          })
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
          })
        );
        break;
      }
      if (data.status === "failed") {
        setTasks((prev) =>
          prev.map((task) => {
            if (task.id === id) {
              return {
                ...task,
                finish: true,
                progress: 100,
                failureReason: data.failure_reason,
                error: data.error,
              };
            }
            return task;
          })
        );
        break;
      }
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

  return (
    <>
      <div className="relative z-11 mt-2 m-auto">
        <div className="flex backdrop-blur-[5px] gap-2 sm:gap-3 md:gap-4 rounded-2xl flex-col lg:flex-row w-full backdrop-filter">
          <div className="w-full border border-primary/30 min-w-[300px] p-2 sm:p-3 md:p-4 bg-popover/50 rounded-lg shadow-sm lg:flex-[5]">
            <Tasks tasks={tasks} setTasks={setTasks} />
          </div>
          <div className="w-full flex flex-col border border-primary/30 p-2 sm:p-3 md:p-4 bg-popover/50 rounded-lg shadow-sm mb-3 lg:mb-0 lg:flex-[4]">
            <ChatSection
              drawData={drawData}
              setDrawData={setDrawData}
              handleImageUpload={handleImageUpload}
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
