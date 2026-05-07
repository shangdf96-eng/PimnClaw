module.exports = {
  apps: [
    {
      name: "pi-mono-im",
      script: "npm",
      args: "run im",
      cwd: "/mnt/05d0ac9f-c990-4b3c-8829-fd9b0049b406/shangdongfang/code/pi-mono",
      env: {
        NODE_ENV: "production",
        PORT: "3000",

        ANTHROPIC_BASE_URL: "https://api.moonshot.cn/anthropic",
        ANTHROPIC_MODEL_ID: "kimi-k2.5",
        ANTHROPIC_API_KEY: "sk-lYcDND3j2tdFn8qF9Qz8qpu60zBbozu4EZkzKGxOrzkLZf0Z"
      }
    }
  ]
};
