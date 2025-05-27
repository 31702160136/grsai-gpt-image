import Crypto from "crypto-js"; // 引用AES源码js
// 默认的 KEY 与 iv 如果没有给

export default {
  // 解密方法
  Decrypt(key, iv, word) {
    key = Crypto.enc.Utf8.parse(key);
    iv = Crypto.enc.Utf8.parse(iv);

    const decrypt = Crypto.AES.decrypt(word, key, {
      iv: iv,
      mode: Crypto.mode.CBC,
      padding: Crypto.pad.Pkcs7,
    });
    const decryptedStr = decrypt.toString(Crypto.enc.Utf8);

    return decryptedStr.toString();
  },

  // 加密方法
  Encrypt(keyString, ivString, plaintext) {
    // 将 key 和 iv 转换为 CryptoJS 的格式
    const key = Crypto.enc.Utf8.parse(keyString);
    const iv = Crypto.enc.Utf8.parse(ivString);

    // 加密
    const encrypted = Crypto.AES.encrypt(plaintext, key, {
      iv: iv,
      mode: Crypto.mode.CBC,
      padding: Crypto.pad.Pkcs7,
    });

    // 返回 Base64 编码的密文
    return encrypted.toString();
  },

  // MD5 加密
  EncryptMd5(word) {
    return Crypto.MD5(word).toString();
  },

  SortASCII(object) {
    let keys = [];
    for (let k in object) {
      keys.push(k);
    }
    keys.sort(); // 对属性进行ASCII排序
    let sortedObj = {};
    keys.forEach((key) => {
      sortedObj[key] = object[key]; // 根据排序后的属性，重新构造对象
    });

    return sortedObj;
  },
};
