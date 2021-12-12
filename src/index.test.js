import axios from "axios";

const client = axios.create({
  baseURL: "http://localhost:8080",
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    console.trace(error.response);
  }
);

const budgetId = "My-Finances-1-239c5ed";
const accountId = "2021-01";
const id = "2021-01";
const payeeId = "2021-01";

/*
test("post /query", () => {
  client.post("/query");
});
*/
test("get /budget-months", async () => {
  const { data } = await client.get("/budget-months");
});
/*test("post /budget-load", () => {
  client.post("/budget-load", {
    budgetId,
  });
});
*/
test("get /budget/:month", async () => {
  const { data: budgetMonths } = await client.get("/budget-months");
  const randomIndex = Math.floor(Math.random() * budgetMonths.length);
  const month = budgetMonths[randomIndex];
  await client.get(`/budget/${month}`);
});
const randomElement = (array) =>
  array[Math.floor(Math.random() * array.length)];
beforeAll(async () => {});

const randomDate = () => {
  const start = new Date(2019, 0, 1);
  const end = new Date(2022, 0, 1);
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
};

describe("patch /budget/:month/:categoryId amount", () => {
  const originCategory = async () => {
    const { data: budgetMonths } = await client.get("/budget-months");
    const month = randomElement(budgetMonths);
    const { data: categories } = await client.get("/categories");
    const { id: categoryId } = randomElement(
      categories.filter((c) => !c.is_income)
    );
    return { month, categoryId };
  };

  const getCategory = async (month, categoryId) => {
    const { data } = await client.get(`/budget/${month}`);
    for (let categoryGroup of data.categoryGroups) {
      for (let category of categoryGroup.categories) {
        if (category.id === categoryId) {
          return category;
        }
      }
    }
  };

  test("patch amount", async () => {
    const { month, categoryId } = await originCategory();
    const amount = Math.floor(Math.random() * 500);
    await client.patch(`/budget/${month}/${categoryId}`, {
      amount,
    });

    const budgetMonthValues = await getCategory(month, categoryId);
    expect(budgetMonthValues.budgeted).toBe(amount);
  });
  test("patch carryover true", async () => {
    const { month, categoryId } = await originCategory();
    await client.patch(`/budget/${month}/${categoryId}`, {
      carryover: true,
    });
    const category = await getCategory(month, categoryId);
    expect(category.carryover).toBe(true);
  });
  test("patch carryover false", async () => {
    const { month, categoryId } = await originCategory();
    await client.patch(`/budget/${month}/${categoryId}`, {
      carryover: false,
    });
    const category = await getCategory(month, categoryId);
    expect(category.carryover).toBe(false);
  });
});

describe("/accounts/:accountId", () => {
  const account = {
    name: "test-account",
    offbudgeting: false,
    type: "checking",
  };

  let accountId;
  beforeAll(async () => {
    const res = await client.post("/accounts", { account });
    accountId = res.data;
  });
  afterAll(async () => {
    await client.delete(`/accounts/${accountId}`);
  });
  test("post /accounts/:accountId/transactions", async () => {
    const amount = Math.floor(Math.random() * 500);
    const date = randomDate().toISOString().split("T")[0];
    await client.post(`/accounts/${accountId}/transactions`, [
      {
        account: accountId,
        date,
        amount,
      },
    ]);
    const transactions = await client.get(
      `/accounts/${accountId}/transactions?startDate=2019-01-01&endDate=2022-01-01`
    );
    expect(transactions.data.length).toBe(1);
    const returned = transactions.data[0];
    expect(returned.amount).toBe(amount);
    expect(returned.date).toBe(date);
  });
});

/*
test("post /accounts/:accountId/transactions-import", () => {
  client.post(`/accounts/${accountId}/transactions-import`);
});
test("get /accounts/:accountId/transactions", () => {
  client.get(`/accounts/${accountId}/transactions`);
});
test("/transactions/:id", async () => {
  const transactionId = await client.post(
    `/accounts/${accountId}/transactions`
  );
  await client.patch(`/transactions/${transactionId}`);
  await client.delete(`/transactions/${transactionId}`);
});

test("get /accounts", () => {
  client.get("/accounts");
});
test("/accounts /accounts/:id", async () => {
  const newaccountId = await client.post("/accounts");
  await client.patch(`/accounts/${newaccountId}`, {});
  await client.delete(`/accounts/${newaccountId}`);
});
test("post /accounts/:id/close", async () => {
  const newaccountId = await client.post("/accounts");
  await client.post(`/accounts/${id}/close`);
  await client.post(`/accounts/${id}/reopen`);
  await client.delete(`/accounts/${newaccountId}`);
});
test("get /category-groups", () => {
  client.get("/category-groups");
});
test("/category-groups /category-groups/:id", async () => {
  const newCategoryGroupId = await client.post("/category-groups");
  await client.patch(`/category-groups/${newCategoryGroupId}`);
  await client.delete(`/category-groups/${newCategoryGroupId}`);
});

test("get /categories", async () => {
  await client.get("/categories");
});
test("/categories /categories/:id", async () => {
  const newCategoryId = await client.post("/categories", {
    name: "new-category",
  });
  await client.patch(`/categories/${newCategoryId}`, {});
  await client.delete(`/categories/${newCategoryId}`);
});
test("get /payees", () => {
  client.get("/payees");
});
test("/payees /payees/:id", async () => {
  const newPayeeId = await client.post("/payees", {
    name: "new-payee",
  });
  await client.patch(`/payees/${newPayeeId}`, {});
  await client.delete(`/payee/${newPayeeId}`);
});
test("get /payee-rules/:payeeId", () => {
  client.get(`/payee-rules/${payeeId}`);
});
test("/payee-rules /payee-rules/:id", async () => {
  const newPayeeRuleId = await client.post("/payee-rules", {});
  await client.patch(`/payee-rules/${newPayeeRuleId}`);
  await client.delete(`/payee-rules/${newPayeeRuleId}`);
});
*/
