import express from "express";
import api from "@actual-app/api";
import { send } from "@actual-app/api/connection.js";
import * as OpenApiValidator from "express-openapi-validator";

const app = express();

app.use(express.json());

app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})

app.use(function (req, res, next) {
  if (Object.keys(req.params).length !== 0) {
    console.log(req.params);
  }
  console.log(`${req.method.toUpperCase()} ${req.url}`);

  next();
});

app.use(
  OpenApiValidator.middleware({
    apiSpec: "./openapi.yaml",
    validateRequests: true,
    validateResponses: true,
    ignoreUndocumented: true,
  })
);

app.use((err, req, res, next) => {
  // format error
  res.status(err.status || 500).json({
    message: err.message,
    errors: err.errors,
  });
});

app.get("/", (_, res) => {
  return res.sendStatus(200);
});

app.post("/_load-budget", (req, res) => {
  const { budgetId } = req.body;
  return send("api/load-budget", { id: budgetId }).then(value => {
    return res.sendStatus(204)
  });
})

app.post("/query", (req, res) => {
  const { query } = req.body;
  return send("api/query", { query: query.serialize() }).then(value => {
    return res.json(value)
  });
});

app.get("/budget-months", (_, res) => {
  send("api/budget-months").then(value => {
    return res.json(value)
  });
});

app.post("/budget-load", (req, res) => {
  const { budgetId } = req.body;
  send("api/load-budget", { id: budgetId }).then(value => {
    return res.json(value)
  });
});

app.get("/budget/:month", (req, res) => {
  const { month } = req.params;
  return send("api/budget-month", { month }).then(value => {
    return res.json(value)
  });
});

app.patch("/budget/:month/:categoryId", (req, res) => {
  const { month, categoryId } = req.params;
  const { carryover, amount } = req.body;
  const hasCarryOver = carryover !== undefined;
  const hasAmount = amount !== undefined;

  if (hasCarryOver) {
    send("api/budget-set-carryover", { month, categoryId, flag: carryover }).then(
      () => res.sendStatus(204)
    );
  }
  if (hasAmount) {
    send("api/budget-set-amount", { month, categoryId, amount }).then(
      () => res.sendStatus(204)
    );
  }
  if (!hasAmount && !hasCarryOver) {
    return res.status(400).send('modifiable fields: ["amount","carryover"]');
  }
  return res.sendStatus(204);
});

app.post("/accounts/:accountId/transactions", (req, res) => {
  const { accountId } = req.params;
  const transactions = req.body;
  send("api/transactions-add", { accountId, transactions }).then(value => {
    if (value === 'ok') {
      return res.status(201).send()
    }
    return res.sendStatus(204)
  })
});

app.post("/accounts/:accountId/transactions-import", (req, res) => {
  const { accountId } = req.params;
  const transactions = req.body;
  return send("api/transactions-import", { accountId, transactions }).then(value => {
    if (value) {
      return res.sendStatus(201)
    }
  })
});

app.get("/accounts/:accountId/transactions", (req, res) => {
  const { accountId } = req.params;
  const { startDate, endDate } = req.query;
  //if (startDate || endDate) {
  return send("api/transactions-get", { accountId, startDate, endDate }).then(value => {
    return res.json(value)
  })
  //}
  //return res.status(400).send;
});

app.get("/accounts/:accountId/filtered-transactions", (req, res) => {
  const { accountId } = req.params;
  const { text } = req.query;
  return send("api/transactions-filter", { accountId, text });
});

app.patch("/transactions/:id", (req, res) => {
  const { id } = req.params;
  const fields = req.body;
  return send("api/transaction-update", { id, fields }).then(value => {
    if (value === 'ok') {
      return res.sendStatus(201)
    }
    return res.sendStatus(400)
  })
});

app.delete("/transactions/:id", (req, res) => {
  const { id } = req.params;
  return send("api/transaction-delete", { id }).then(value => {
    if (value === 'ok') {
      return res.sendStatus(204)
    }
    return res.sendStatus(400)
  })
});

app.get("/accounts", (_, res) => {
  return send("api/accounts-get").then(value => {
    return res.json(value)
  });
});

app.get("/accounts/:id", (req, res) => {
  const { id } = req.params;
  return send("api/accounts-get").then((accounts) => {
    for (let account of accounts) {
      if (account.id === id) {
        return res.json(account);
      }
    }
    return res.sendStatus(404);
  });
});

app.post("/accounts", (req, res) => {
  const { account, initialBalance } = req.body;
  return send("api/account-create", {
    account,
    initialBalance: initialBalance,
  }).then(value => {
    if (value) {
      return res.status(201).send(value)
    }
    return res.sendStatus(400)
  })
});

app.patch("/accounts/:id", (req, res) => {
  const fields = req.body;
  const { id } = req.params;
  send("api/account-update", { id, fields }).then(value => {
    if (value === undefined) {
      return res.sendStatus(204)
    }
    return res.sendStatus(400)
  })
});

app.post("/accounts/:id/close", (req, res) => {
  const { id } = req.params;
  const { transferAccountId, transferCategoryId } = req.body;
  return send("api/account-close", {
    id,
    transferAccountId,
    transferCategoryId,
  }).then(value => {
    if (value === undefined) {
      return res.sendStatus(204)
    }
    return res.sendStatus(400)
  })
});

app.post("/accounts/:id/reopen", (_, res) => {
  return send("api/account-reopen", { id }).then(value => {
    if (value === 'ok') {
      return res.sendStatus(204)
    }
    return res.sendStatus(400)
  })
});

app.delete("/accounts/:id", (req, res) => {
  const { id } = req.params;
  return send("api/account-delete", { id }).then(value => {
    if (value === undefined) {
      return res.sendStatus(204)
    }
    return res.sendStatus(400)
  }).catch((error) => {
    console.log(error)
  })
});

app.get("/category-groups", (req, res) => {
  return send("api/categories-get", { grouped: true }).then(value => {
    return res.json(value)
  })
});

app.get("/category-groups/:id", (req, res) => {
  const { id } = req.params;
  return send("api/categories-get", { grouped: true }).then((groups) => {
    for (let group of groups) {
      if (group.id === id) {
        return res.json(group);
      }
    }
    return res.sendStatus(404);
  });
});

app.post("/category-groups", (req, res) => {
  const group = req.body;
  return send("api/category-group-create", { group }).then(value => {
    if (value) {
      return res.status(201).send(value)
    }
    return res.sendStatus(400)
  })
});

app.patch("/category-groups/:id", (req, res) => {
  const { id } = req.params;
  const fields = req.body;
  return send("api/category-group-update", { id, fields }).then(value => {
    if (value === 'ok') {
      return res.sendStatus(204)
    }
    return res.sendStatus(400)
  })
});

app.delete("/category-groups/:id", (req, res) => {
  const { transferCategoryId } = req.query;
  const { id } = req.params;
  return send("api/category-group-delete", { id, transferCategoryId }).then(value => {
    if (value === undefined) {
      return res.sendStatus(204)
    }
    return res.sendStatus(400)
  })
});

app.get("/categories", (req, res) => {
  return send("api/categories-get", { grouped: false }).then(value => {
    return res.json(value)
  })
});

app.get("/categories/:id", (req, res) => {
  const { id } = req.params;
  return send("api/categories-get", { grouped: false }).then((categories) => {
    for (let category of categories) {
      if (category.id === id) {
        return res.json(category);
      }
    }
    return res.sendStatus(404);
  });
});

app.post("/categories", (req, res) => {
  const category = req.body;
  return send("api/category-create", { category }).then(value => {
    if (value) {
      return res.status(201).send(value)
    }
    return res.sendStatus(400)
  })
});

app.patch("/categories/:id", (req, res) => {
  const fields = req.body;
  const { id } = req.params;
  return send("api/category-update", { id, fields }).then(value => {
    if (Object.keys(value).length === 0) {
      return res.sendStatus(204)
    }
    return res.sendStatus(400)
  })
});

app.delete("/categories/:id", (req, res) => {
  const { id } = req.params;
  return send("api/category-delete", { id }).then(value => {
    if (Object.keys(value).length === 'ok') {
      return res.sendStatus(204)
    }
    return res.sendStatus(400)
  })
});

app.get("/payees", (_, res) => {
  return send("api/payees-get").then(value => {
    return res.json(value)
  })
});

app.post("/payees", (req, res) => {
  const payee = req.body;
  return send("api/payee-create", { payee }).then(value => {
    if (value) {
      return res.status(201).send(value)
    }
    return res.sendStatus(400)
  })
});

app.patch("/payees/:id", (req, res) => {
  const { id } = req.params;
  const fields = req.body;
  return send("api/payee-update", { id, fields }).then(value => {
    if (value) {
      return res.sendStatus(204)
    }
    return res.sendStatus(400)
  })
});

app.delete("/payees/:id", (req, res) => {
  const { id } = req.params;
  return send("api/payee-delete", { id }).then(value => {
    if (value === 'ok') {
      return res.sendStatus(204)
    }
    return res.sendStatus(400)
  })
});

app.get("/payees/:id", (req, res) => {
  const { id } = req.params;
  return send("api/payees-get").then((payees) => {
    for (let payee of payees) {
      if (payee.id === id) {
        return res.json(payee);
      }
    }
    return res.sendStatus(400);
  });
});

app.get("/payees/:payeeId/rules", (req, res) => {
  const { payeeId } = req.params;
  return send("api/payee-rules-get", { payeeId }).then(value => {
    return res.json(value)
  })
});

app.post("/payees/:payeeId/rules", (req, res) => {
  const { payeeId } = req.params;
  const rule = req.body;
  return send("api/payee-rule-create", { payee_id: payeeId, rule }).then(value => {
    return res.json(value)
  })
});

app.patch("/payee-rules/:id", (req, res) => {
  const fields = req.body;
  const { id } = req.params;
  return send("api/payee-rule-update", { id, fields }).then(value => {
    return res.json(value)
  })
});

app.delete("/payee-rules/:id", (req, res) => {
  const { id } = req.params;
  return send("api/payee-rule-delete", { id }).then(value => {
    return res.json(value)
  })
});

function run() {
  api.init().then(() => {
    console.log("connected to actual's socket");
    const server = app.listen(8080, () => {
      console.log("Express Listening on port 8080...");
    });

    const gracefulShutdownHandler = function gracefulShutdownHandler(signal) {
      console.log(`⚠️ Caught ${signal}, gracefully shutting down`);
      setTimeout(() => {
        console.log("🤞 Shutting down application");
        server.close(function () {
          console.log("👋 All requests stopped, shutting down");
          process.exit();
        });
      }, 0);
    };

    // The SIGINT signal is sent to a process by its controlling terminal when a user wishes to interrupt the process.
    process.on("SIGINT", gracefulShutdownHandler);

    // The SIGTERM signal is sent to a process to request its termination.
    process.on("SIGTERM", gracefulShutdownHandler);
  });
}

if (require.main === module) {
  run();
}

export default {
  run,
};
