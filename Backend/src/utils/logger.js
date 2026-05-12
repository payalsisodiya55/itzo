export const logger = {
    info: (msg) => console.log(`✅ [INFO] ${new Date().toLocaleTimeString()}: ${msg}`),
    error: (msg) => console.error(`❌ [ERROR] ${new Date().toLocaleTimeString()}: ${msg}`),
    warn: (msg) => console.warn(`⚠️ [WARN] ${new Date().toLocaleTimeString()}: ${msg}`)
};
