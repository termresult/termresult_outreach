import { importFctFromDisk } from "../lib/import/run-import";

const summary = await importFctFromDisk();
console.log(JSON.stringify(summary, null, 2));
