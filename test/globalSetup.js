import axios from "axios";
export const PORT = 8080;
// Make sure server is alive before starting tests
const MAX_REQUESTS = 20;
export default async () => {
  let serverReady = false;
  for (let i = 0; i <= MAX_REQUESTS; i++) {
    try {
      await axios.get(`http://localhost:${PORT}/`);
      serverReady = true;
      break;
    } catch (err) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      continue;
    }
  }

  if (!serverReady) throw new Error(`Server never became ready.`);

  const budgetId = "My-Finances-76b3eb9";
  await axios.post('http://localhost:8080/_load-budget', {
    budgetId
  })
  console.log(`selected budget ${budgetId}`);
};
