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
    prompt: `把我的图片转化为一个可爱的卡通Q版（Chibi）潮玩盲盒形象。根据原图内容设计玩偶造型，确保其保留原有特征的同时更加萌趣、灵动。  
如果是人物，优化为Q版比例，添加适当配饰或道具以增强趣味性。
如果是动物或其他物体，赋予其拟人化特征，保持整体和谐可爱。
玩偶材质呈现树脂/软胶质感，表面细节精致，光影效果写实且柔和，展现出高级玩具工艺感。
为该玩偶设计配套的正方形盲盒包装盒：  
包装盒材质为纸质卡盒，颜色和图案与玩偶主题相呼应，形成统一视觉风格。比例和卡通形象一样大。
盒面印有深色系玩偶插画（对比鲜明），以及自定义品牌Logo（如"GrsAi"字样或其他创意名称）。
配合一个小吉祥物图标（可自由选择形状，比如水果、蔬菜、动物等），增添趣味性和辨识度。
整体风格柔和、暖色调为主，背景简洁中性，突出玩偶与包装盒的精致展示效果，仿佛置身于专业商品摄影棚中。`,
    size: "auto",
    variants: 1,
    model: "sora-image",
    urls: [],
  });

  // // 生成随机图片数据
  // const generateRandomImages = () => {
  //   const imageCount = 1; // 显示12张图片
  //   const newImages = [];

  //   for (let i = 0; i < imageCount; i++) {
  //     const width = 200 + Math.floor(Math.random() * 100); // 200-300px宽度
  //     const height = 200 + Math.floor(Math.random() * 100); // 200-300px高度
  //     newImages.push({
  //       id: i + 1,
  //       src: `https://picsum.photos/${width}/${height}?random=${i + 1}`,
  //       alt: `Random Image ${i + 1}`,
  //       loaded: false,
  //       finish: false,
  //       progress: 0,
  //       failureReason: "",
  //       error: "",
  //     });
  //   }

  //   return newImages;
  // };

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
    console.log(savedApiKey);
    return savedApiKey || process.env.API_KEY;
  };

  async function onGenerate() {
    if (isGenerate) {
      return;
    }

    setIsGenerate(true);
    try {
      const res = await fetch(
        "https://grsai.dakka.com.cn/v1/draw/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + getAPIKEY(),
          },
          body: JSON.stringify(drawData),
          cache: "no-store",
        }
      );
      setIsGenerate(false);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      if (res.body) {
        await processStream(res.body);
      } else {
        const data = await res.json();
        console.log("Received data:", data);
      }
    } catch (error) {
      setIsGenerate(false);
      console.error("Error generating image:", error);
    } finally {
      setIsGenerate(false);
    }
  }

  async function processStream(stream) {
    const reader = stream.getReader();
    let done = false;
    let taskIdCreated = null;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;

      if (value) {
        try {
          // Convert the Uint8Array to a string
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split("\n").filter((line) => line.trim() !== "");

          for (const line of lines) {
            if (line.startsWith("data:")) {
              const data = line.substring(5).trim();
              if (data === "[DONE]") {
                done = true;
                break;
              }

              try {
                const parsedData = JSON.parse(data);
                const taskId = parsedData.id;

                // Check if this is a new task or an existing one
                if (taskId === taskIdCreated) {
                  // Update existing task
                  setTasks((prevTasks) => {
                    return prevTasks.map((task) => {
                      if (task.id === taskId) {
                        // Create a new task object with updated properties
                        return {
                          ...task,
                          progress: parsedData.progress,
                          finish: parsedData.status !== "running",
                          failureReason:
                            parsedData.failure_reason || task.failureReason,
                          error: parsedData.error || task.error,
                          src:
                            parsedData.status === "succeeded"
                              ? parsedData.results[0].url
                              : task.src,
                        };
                      }
                      // Return other tasks unchanged
                      return task;
                    });
                  });
                } else if (!taskIdCreated) {
                  // This is the first update for a new task
                  taskIdCreated = taskId;

                  // Create new task with initial data
                  const newTask = {
                    id: taskId,
                    finish: parsedData.status !== "running",
                    loaded: false,
                    failureReason: parsedData.failure_reason || "",
                    error: parsedData.error || "",
                    progress: parsedData.progress || 0,
                    src:
                      parsedData.status === "succeeded"
                        ? parsedData.results[0].url
                        : "",
                    alt: `Generated Image ${taskId}`,
                  };

                  // Add new task to the beginning of the tasks array
                  setTasks((prevTasks) => [newTask, ...prevTasks]);
                }
              } catch (e) {
                console.error("Error parsing JSON:", e);
                setIsGenerate(false);
              }
            } else {
              try {
                const parsedData = JSON.parse(line);
                alert(parsedData.msg);
              } catch (e) {
                console.error("Error parsing non-data line:", e);
              }
            }
          }
        } catch (error) {
          console.error("Error processing stream:", error);
          setIsGenerate(false);
        }
      }
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

  async function handleTask(id) {
    while (true) {
      const res = await fetch(`https://grsai.dakka.com.cn/v1/draw/result`, {
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
      console.log(data);
      if (data.status === "running") {
        setTasks((prev) =>
          prev.map((task) => {
            if (task.id === id) {
              return { ...task, finish: false, progress: data.progress };
            }
            return task;
          })
        );
        await new Promise((resolve) => setTimeout(resolve, 3000));
        continue;
      }
      if (data.status === "succeeded") {
        setTasks((prev) =>
          prev.map((task) => {
            if (task.id === id) {
              return {
                ...task,
                progress: data.progress,
                finish: true,
                src: data.results[0].url,
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
            <Tasks tasks={tasks} />
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
