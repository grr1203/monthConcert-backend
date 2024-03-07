import fs from "fs";

const envFile = fs.readFileSync("./__tests__/env.ts", "utf8");
eval(envFile);
console.log(process.env);
