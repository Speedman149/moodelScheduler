import { defineConfig,devices } from "@playwright/test";
import path from "node:path";
process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.join(process.cwd(),".browser-cache");
const port=Number(process.env.PLAYWRIGHT_PORT||3100);
if(!Number.isInteger(port)||port<1||port>65535)throw new Error("PLAYWRIGHT_PORT must be a valid port number");
const baseURL=`http://127.0.0.1:${port}`;
export default defineConfig({testDir:"./e2e",fullyParallel:false,use:{baseURL,trace:"retain-on-failure"},webServer:{command:`npm run start -- --hostname 127.0.0.1 --port ${port}`,url:baseURL,reuseExistingServer:false,timeout:60000},projects:[{name:"chromium",use:{...devices["Desktop Chrome"]}}]});
