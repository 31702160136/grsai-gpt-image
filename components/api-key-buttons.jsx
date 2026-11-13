"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

// HTTP header values must be ISO-8859-1; strip whitespace and invisible chars often pasted with the key
export const sanitizeApiKey = (key) =>
  (key || "").replace(/[\s\u200B-\u200D\u2060\uFEFF\u3000]/g, "");

export const isValidApiKey = (key) => /^[\x21-\x7E]+$/.test(key);

const ApiKeyButtons = () => {
  const [apiKey, setApiKey] = useState("");
  const [open, setOpen] = useState(false);
  const [siteUrl, setSiteUrl] = useState("https://grsai.ai/api-keys");

  // Load API key from localStorage on component mount
  useEffect(() => {
    if (window.location.hostname.endsWith(".com")) {
      setSiteUrl("https://grsai.com/api-keys");
    }

    const savedApiKey = localStorage.getItem("apikey");
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  const handleSaveApiKey = () => {
    const key = sanitizeApiKey(apiKey);
    if (key && !isValidApiKey(key)) {
      alert("API Key 包含非法字符（如中文、全角符号），请重新复制正确的 API Key");
      return;
    }
    localStorage.setItem("apikey", key);
    setApiKey(key);
    setOpen(false);
  };

  const SetOpen = (status) => {
    const savedApiKey = localStorage.getItem("apikey");
    setApiKey(savedApiKey || "");
    setOpen(status);
  };

  return (
    <div className="flex gap-2">
      <Link href={siteUrl} target="_blank">
        <Button variant="outline">获取APIKEY</Button>
      </Link>

      <Dialog open={open} onOpenChange={SetOpen}>
        <DialogTrigger asChild>
          <Button>设置APIKEY</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>设置API Key</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="请输入您的API Key"
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => SetOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveApiKey}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApiKeyButtons;
