import { spawn, type ChildProcess } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { MongoClient } from "mongodb";

export async function startLocalMongo() {
  // Never connects to an environment-supplied production URI or existing MongoDB process.
  const server = createServer();
  await new Promise<void>((resolvePort, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolvePort); });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Could not reserve a local port.");
  const port = address.port;
  await new Promise<void>((resolvePort, reject) => server.close(error => error ? reject(error) : resolvePort()));
  const dbpath = resolve(process.cwd(), "test-results", `mongo-${port}`);
  await mkdir(dbpath, { recursive: true });
  const binary = process.env.MONGOD_BINARY || (process.platform === "win32" ? "C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe" : "mongod");
  const child: ChildProcess = spawn(binary, ["--dbpath", dbpath, "--bind_ip", "127.0.0.1", "--port", String(port), "--replSet", "daylightTest", "--quiet"], { windowsHide: true, stdio: "ignore" });
  let failure = false;
  child.once("error", () => { failure = true; }); child.once("exit", () => { failure = true; });
  const client = new MongoClient(`mongodb://127.0.0.1:${port}/?directConnection=true`, { serverSelectionTimeoutMS: 300, connectTimeoutMS: 300 });
  async function stop() {
    await client.close().catch(() => {});
    if (child.exitCode === null && !child.killed) {
      const exited = new Promise<void>(done => child.once("exit", () => done()));
      child.kill(); await Promise.race([exited, new Promise<void>(done => setTimeout(done, 5000))]);
    }
  }
  try {
    for (let attempt = 0; ; attempt++) {
      if (failure || attempt > 50) throw new Error("Local mongod did not start; install MongoDB or set MONGOD_BINARY. This check must not silently skip.");
      try { await client.connect(); await client.db("admin").command({ ping: 1 }); break; } catch { await new Promise(done => setTimeout(done, 200)); }
    }
    await client.db("admin").command({ replSetInitiate: { _id: "daylightTest", members: [{ _id: 0, host: `127.0.0.1:${port}` }] } });
    for (let attempt = 0; ; attempt++) {
      const hello = await client.db("admin").command({ hello: 1 });
      if (hello.isWritablePrimary) break;
      if (attempt > 100) throw new Error("Local replica set did not elect a primary.");
      await new Promise(done => setTimeout(done, 100));
    }
    return { client, stop };
  } catch (error) { await stop(); throw error; }
}
