import { importFctFromDisk } from "../lib/import/run-import";

const summary = importFctFromDisk();
console.log(JSON.stringify(summary, null, 2));
