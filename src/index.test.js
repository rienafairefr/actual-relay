import axios from "axios";
import crypto from "crypto";

const client = axios.create({
  baseURL: "http://localhost:8080",
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log(error.response);
    throw new Error(error.response)
  }
);

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
  const { data: monthValue } = await client.get(`/budget/${month}`);
  expect(monthValue.month).toBe(month)
  console.log(monthValue)
});
const randomElement = (array) =>
  array[Math.floor(Math.random() * array.length)];
beforeAll(async () => { });

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
describe("/payee-rules/:id", () => {
  const originPayee = async () => {
    const { data: payees } = await client.get("/payees");
    const payee = randomElement(payees);
    return { payee };
  };

  test("create payee-rule", async () => {
    const { payee } = await originPayee();
    const payeeRule = {
      type: "equals",
      value: "payee",
    };
    const {
      data: { id: newPayeeRuleId },
    } = await client.post(`/payees/${payee.id}/rules`, payeeRule);
    const getRules = await client.get(`/payees/${payee.id}/rules`);
    await client.delete(`/payee-rules/${newPayeeRuleId}`);
  });

  test("get /payee-rules/:payeeId", async () => {
    const { payee } = await originPayee();
    const data = await client.get(`/payees/${payee.id}/rules`);
    console.log({ data });
  });
});
describe("/accounts/:accountId", () => {
  const account = {
    name: "test-account",
    offbudget: false,
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
    const amount2 = Math.floor(Math.random() * 500);
    const date = randomDate().toISOString().split("T")[0];
    let result = await client.post(`/accounts/${accountId}/transactions`, [
      {
        account: accountId,
        date,
        amount,
      },
    ]);
    const transactions = await client.get(
      `/accounts/${accountId}/transactions`
    );
    expect(transactions.data.length).toBe(1);
    const returned = transactions.data[0];
    expect(returned.amount).toBe(amount);
    expect(returned.date).toBe(date);
    await client.patch(`/transactions/${transactionId}`, {
      amount: amount2,
    });
    const transactions2 = await client.get(
      `/accounts/${accountId}/transactions`
    );
    expect(transactions2.data.length).toBe(1);
    const returned2 = transactions2.data[0];
    expect(returned2.amount).toBe(amount2);
    expect(returned2.date).toBe(date);

    await client.delete(`/transactions/${transactionId}`);
  });


  test("post /accounts/:accountId/transactions-import", async () => {
    const amount = Math.floor(Math.random() * 500);
    const date = randomDate().toISOString().split("T")[0];
    const transactions = Array.from(Array(5).keys()).map((i) => ({
      account: accountId,
      date,
      amount: Math.floor(Math.random() * 500),
      imported_id: i.toString(),
    }));

    const { data: added } = await client.post(
      `/accounts/${accountId}/transactions`,
      transactions
    );

    const afterAdd = await client.get(
      `/accounts/${accountId}/transactions`
    );

    await client.post(`/accounts/${accountId}/transactions-import`, transactions);

    const afterImport = await client.get(
      `/accounts/${accountId}/transactions`
    );
    console.log({ afterAdd, afterImport });
  });
});

test("get /accounts", () => {
  client.get("/accounts");
});
describe('can patch account', () => {
  const fields = [
    ["name", "test-account", "modified-name"],
    ["offbudget", true, false],
    ["offbudget", false, true],
    ["type", "checking", "savings"],
    ["type", "checking", "investment"],
    ["type", "checking", "credit"],
    ["type", "checking", "mortgage"],
    ["type", "checking", "debt"],
    ["type", "checking", "other"],
  ];

  test.each(fields)('can patch account %s from %s to %s', async (fieldName, initialValue, fieldValue) => {
    const account = {
      name: "test-account",
      offbudget: false,
      type: "checking",
      ...{
        [fieldName]: initialValue
      }
    };
    const { data: newAccountId } = await client.post("/accounts", { account });

    const response = await client.patch(`/accounts/${newAccountId}`, {
      [fieldName]: fieldValue
    });
    let { data: modified } = await client.get(`/accounts/${newAccountId}`);
    expect(modified[fieldName]).toBe(fieldValue)

    await client.delete(`/accounts/${newAccountId}`);
  });
})

test("post /accounts/:id/close", async () => {
  const account = {
    name: "test-account",
    offbudget: false,
    type: "checking",
  };
  const { data: newAccountId } = await client.post("/accounts", { account });
  await client.post(`/accounts/${newAccountId}/close`, {});
  const closedAccount = await client.get(`/accounts/${newAccountId}`);
  await client.post(`/accounts/${newAccountId}/reopen`);
  const reopenedAccount = await client.get(`/accounts/${newAccountId}`);
  await client.delete(`/accounts/${newAccountId}`);
});
test("get /category-groups", async () => {
  await client.get("/category-groups");
});
describe("can patch category-group", () => {
  const category = {
    name: "category"
  }
  const fields = [

    ["is_income", true, false],
    ["is_income", false, true],
    ["name", "category-group", "new-category-group"],
  ];
  test.each(fields)("can patch category-group field %s from %s to %s", async (fieldName, initialValue, fieldValue) => {
    const { data: newCategoryGroupId } = await client.post("/category-groups", {
      name: "category-group",
      ...{
        [fieldName]: initialValue
      }
    });

    await client.patch(`/category-groups/${newCategoryGroupId}`, {
      [fieldName]: fieldValue
    });
    const modifiedCategoryGroup = await client.get(`/category-groups/${newCategoryGroupId}`);
    await client.delete(`/category-groups/${newCategoryGroupId}`);
  });
});

test("get /categories", async () => {
  await client.get("/categories");
});
test("/categories /categories/:id", async () => {
  const { data: newCategoryGroupId } = await client.post("/category-groups", {
    name: "test-category-group",
  });
  const { data: newCategoryId } = await client.post("/categories", {
    name: "new-category",
    group_id: newCategoryGroupId,
  });
  const { data: original } = await client.get(`/categories/${newCategoryId}`);
  expect(original.name).toBe("new-category");
  await client.patch(`/categories/${newCategoryId}`, {
    name: "modified-name-category",
  });
  const { data: modified } = await client.get(`/categories/${newCategoryId}`);
  expect(modified.name).toBe("modified-name-category");

  await client.delete(`/categories/${newCategoryId}`);
  await client.delete(`/category-groups/${newCategoryGroupId}`);
});

test("get /payees", async () => {
  client.get("/payees");
  const inexistent = crypto.randomUUID();
  const response = await client.get(`/payees/${inexistent}`);
  console.log(response);
});
test("/payees /payees/:id", async () => {
  const { data: newPayeeId } = await client.post("/payees", {
    name: "new-payee",
  });
  await client.patch(`/payees/${newPayeeId}`, {
    name: "new-payee-modified",
  });
  const { data: modifiedPayees } = await client.get(`/payees`);
  expect(modifiedPayees.filter((p) => p.id === newPayeeId).length).toBe(1);
  console.log(newPayeeId);
  const { data: modifiedPayee } = await client.get(`/payees/${newPayeeId}`);
  expect(modifiedPayee.name).toBe("new-payee-modified");
  //await client.delete(`/payees/${newPayeeId}`);
});
