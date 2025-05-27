import { atom, createStore } from "jotai";
import { PhotoStatus } from "@/constdefault/constdefine";

export const store = createStore();
export const ResultPhotoStatus = atom(PhotoStatus.finish);
export const ResultPhotoData = atom({});
export const EditTheImage = atom({
  key: "",
  url: "",
});
export const StyleName = atom("");
