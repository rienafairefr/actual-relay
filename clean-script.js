const axios = require('axios')

const client = axios.create({
    baseURL: "http://localhost:8080",
});

const budgetId = "My-Finances-daf819a";
client.post('/_load-budget', {
    budgetId
}).then(() => {
    console.log(`selected budget ${budgetId}`);

    client
        .get(`/accounts`)
        .then(({ data: accounts }) => {
            console.log(accounts)
            for (let account of accounts) {
                console.log(account)
                client.post(`/accounts/${account.id}/close`, {}).then(res => {
                    console.log(res)
                }).catch((error) => {
                    console.error(error)
                })
            }
        })
        .catch(console.error);

    client.get('/payees').then(({ data: payees }) => {
        console.log(payees)
        for (let payee of payees) {
            if (payee.transfer_acct === null) {
                client.delete(`/payees/${payee.id}`).then(res => {
                    console.log(res)
                }).catch((error) => {
                    console.error(error)
                })
            }
        }
    })

    client.get('/categories').then(({ data: categories }) => {
        console.log(categories)
        for (let category of categories) {
            client.delete(`/categories/${category.id}`).then(res => {
                console.log(res)
            }).catch((error) => {
                console.error(error)
            })
        }
    })
    client.get('/category-groups').then(({ data: categoryGroups }) => {
        console.log(categoryGroups)
        for (let categoryGroup of categoryGroups) {
            client.delete(`/category-groups/${categoryGroup.id}`).then(res => {
                console.log(res)
            }).catch((error) => {
                console.error(error)
            })
        }
    })
})

