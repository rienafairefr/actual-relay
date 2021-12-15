import { PORT } from "./globalSetup";
import sh from "shell-exec";

// Used to kill server at the end of the tests
const pid = await sh(`lsof -i tcp:${PORT} | grep LISTEN | awk '{print $2}'`);
try {
  process.kill(pid.stdout.trim(), "SIGINT");
  console.log("killed the server");
} catch (error) {
  console.error("can't kill the server");
  console.error({ pid, error });
}
