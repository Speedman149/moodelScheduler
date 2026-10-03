import { defineConfig,devices } from "@playwright/test";
import path from "node:path";
process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.join(process.cwd(),".browser-cache");
export default defineConfig({testDir:"./e2e",fullyParallel:false,use:{baseURL:"http://localhost:3000",trace:"retain-on-failure"},webServer:{command:"npm run start -- --port 3000",url:"http://localhost:3000",reuseExistingServer:!process.env.CI,timeout:60000},projects:[{name:"chromium",use:{...devices["Desktop Chrome"]}}]});
