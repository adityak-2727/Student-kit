import { MongoCrypt } from "mongodb-client-encryption";
if (!MongoCrypt.libmongocryptVersion) throw new Error("Native MongoDB encryption binding did not load.");
console.info(`Native libmongocrypt loaded: ${MongoCrypt.libmongocryptVersion}; Node ${process.version}; ${process.platform}/${process.arch}. This is load evidence only; encryption:verify exercises storage and keys.`);
