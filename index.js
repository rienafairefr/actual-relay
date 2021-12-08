import express from "express";
import api from "@actual-app/api";
import * as connection from "@actual-app/api/connection.js";
import * as OpenApiValidator from "express-openapi-validator";

const _send = connection.send;

function send(res, url, data) {
  console.log(url);
  _send(url, data)
    .then((value) => {
      if (value === undefined) {
        return res.sendStatus(204);
      } else {
        console.log(value);
        if (typeof value === "string") {
          res.setHeader("Content-Type", "text/plain");
          res.status(200).send(value);
        } else if (typeof value === "object") {
          console.log(url);
          res.json(value);
        }
      }
    })
    .catch((error) => {
      console.error(error);
      if (error.message.search("not found") !== -1) {
        return res.status(404).send(error.message);
      }
      return res.sendStatus(500);
    });
}

const app = express();
app.use(
  OpenApiValidator.middleware({
    apiSpec: "./openapi.yaml",
    validateRequests: true,
    validateResponses: true,
    ignoreUndocumented: true,
  })
);

await api.init();
console.log("connected to actual's socket");

app.use(express.json());

app.get("/", (_, res) => {
  return res.sendStatus(200);
});

app.post("/query", (req, res) => {
  const { query } = req.body;
  return send(res, "api/query", { query: query.serialize() });
});

app.get("/budget-months", (_, res) => {
  return send(res, "api/budget-months");
});

app.post("/budget-load", (req, res) => {
  const { budgetId } = req.body;
  return send(res, "api/load-budget", { id: budgetId });
});

app.get("/budget/:month", (req, res) => {
  const { month } = req.params;
  return send(res, "api/budget-month", { month });
});

app.patch("/budget/:month/:categoryId", (req, res) => {
  const { month, categoryId } = req.params;
  const { carryover, amount } = req.body;
  const hasCarryOver = carryover !== undefined;
  const hasAmount = amount !== undefined;

  if (hasCarryOver) {
    _send("api/budget-set-carryover", { month, categoryId, flag: carryover });
  }
  if (hasAmount) {
    _send("api/budget-set-amount", { month, categoryId, amount });
  }
  if (!hasAmount && !hasCarryOver) {
    return res.status(400).send('modifiable fields: ["amount","carryover"]');
  }
  return res.sendStatus(204);
});

app.post("/accounts/:accountId/transactions", (req, res) => {
  const { accountId } = req.params;
  const { transactions } = req.body;
  return send(res, "api/transactions-add", { accountId, transactions });
});

app.post("/accounts/:accountId/transactions-import", (req, res) => {
  const { accountId } = req.params;
  const { transactions } = req.body;
  return send(res, "api/transactions-import", { accountId, transactions });
});

app.get("/accounts/:accountId/transactions", (req, res) => {
  const { accountId } = req.params;
  const { text, startDate, endDate } = req.query;
  if (text) {
    return send(res, "api/transactions-filter", { accountId, text });
  }
  if (startDate || endDate) {
    return send("api/transactions-get", { accountId, startDate, endDate });
  }
  return res.sendStatus(400);
});

app.patch("/transactions/:id", (req, res) => {
  const { id } = req.params;
  const fields = req.body;
  return send(res, "api/transaction-update", { id, fields });
});

app.delete("/transactions/:id", (req, res) => {
  const { id } = req.params;
  return send(res, "api/transaction-delete", { id });
});

app.get("/accounts", (_, res) => {
  return send(res, "api/accounts-get");
});

app.post("/accounts", (req, res) => {
  const { account, initialBalance } = req.body;
  return send(res, "api/account-create", {
    account,
    initialBalance: initialBalance,
  });
});

app.patch("/accounts/:id", (req, res) => {
  const fields = req.body;
  const { id } = req.params;
  send(res, "api/account-update", { id, fields });
});

app.post("/accounts/:id/close", (req, res) => {
  const { id } = req.params;
  const { transferAccountId, transferCategoryId } = req.query;
  return send(res, "api/account-close", {
    id,
    transferAccountId,
    transferCategoryId,
  });
});

app.post("/accounts/:id/reopen", (_, res) => {
  return send(res, "api/account-reopen", { id });
});

app.delete("/accounts/:id", (req, res) => {
  const { id } = req.params;
  return send(res, "api/account-delete", { id });
});

app.get("/category-groups", (req, res) => {
  const grouped = req.query.grouped || false;
  return send(res, "api/categories-get", { grouped });
});

app.post("/category-groups", (req, res) => {
  const group = req.body;
  return send(res, "api/category-group-create", { group });
});

app.patch("/category-groups/:id", (req, res) => {
  const fields = req.body;
  return send(res, "api/category-group-update", { id, fields });
});

app.delete("/category-groups/:id", (req, res) => {
  const { transferCategoryId } = req.query;
  const { id } = req.params;
  return send(res, "api/category-group-delete", { id, transferCategoryId });
});

app.get("/categories", (req, res) => {
  const grouped = req.query.grouped || false;
  return send(res, "api/categories-get", { grouped });
});

app.post("/categories", (req, res) => {
  const category = req.body;
  return send(res, "api/category-create", { category });
});

app.patch("/categories/:id", (req, res) => {
  const fields = req.body;
  return send(res, "api/category-update", { id, fields });
});

app.delete("/categories/:id", (req, res) => {
  const { id } = req.params;
  return send(res, "api/category-delete", { id, transferCategoryId });
});

app.get("/payees", (_, res) => {
  return send(res, "api/payees-get");
});

app.post("/payees", (req, res) => {
  const payee = req.body;
  return send(res, "api/payee-create", { payee });
});

app.patch("/payees/:id", (req, res) => {
  const { id } = req.params;
  const fields = req.body;
  return send(res, "api/payee-update", { id, fields });
});

app.delete("/payee/:id", (req, res) => {
  const { id } = req.params;
  return send(res, "api/payee-delete", { id });
});

app.get("/payee-rules/:payeeId", (req, res) => {
  const { payeeId } = req.params;
  return send(res, "api/payee-rules-get", { payeeId });
});

app.post("/payee-rules", (req, res) => {
  const { rule, payeeId } = req.body;
  return send(res, "api/payee-rule-create", { payee_id: payeeId, rule });
});

app.patch("/payee-rules/:id", (req, res) => {
  const fields = req.body;
  const { id } = req.params;
  return send(res, "api/payee-rule-update", { id, fields });
});

app.delete("/payee-rules/:id", (req, res) => {
  const { id } = req.params;
  return send(res, "api/payee-rule-delete", { id });
});

app.listen(8080, () => {
  console.log("Express Listening on port 8080...");
});
