const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("speDesktop", {
  platform: process.platform,
  version: "0.1.0",
});
