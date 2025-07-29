// 生成图像
async function onGenerate() {
  try {
    const res = await fetch("https://grsai.dakka.com.cn/v1/draw/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer sk-xxxxx",
      },
      body: JSON.stringify(drawData),
      cache: "no-store",
    });
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
    console.error("Error generating image:", error);
  }
}

// 处理流数据
async function processStream(stream) {
  const reader = stream.getReader();
  let done = false;

  while (!done) {
    const { value, done: readerDone } = await reader.read();
    done = readerDone;

    if (value) {
      try {
        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          if (line.startsWith("data:")) {
            const data = line.substring(5).trim();
            if (data === "[DONE]") {
              done = true;
              break;
            }
            const parsedData = JSON.parse(data);
            console.log(parsedData);
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
      }
    }
  }
}
