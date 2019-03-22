const crud = require('./data')
const config = require('./config')
//Initialize checker object
const checker = {}
//check all orders
checker.checkOrders = () => {
    //Get all orders
    crud.list('orders', (err, fileList) => {
        if (!err && fileList) {
            for (let i = 0; i < fileList.length; i ++) {
                //Read the data from every order
                crud.read('orders', fileList[i], (err, orderData) => {
                    if (!err && orderData) {
                        //Delete all completed orders older than one week
                        for (const key in orderData) {
                            const keyToDate = parseInt(key, 10)
                            if (keyToDate <= Date.now() - config.checkInterval && orderData[key].completed == true) {
                                delete orderData[key]
                            }
                        }
                        //Update the order data for every user
                        crud.update('orders', fileList[i], orderData, err => {
                            if (err) {
                                console.log(err)
                            }
                        })
                    } else {
                        console.log(err)
                    }
                })
            }
        } else {
            console.log(err)
        }
    })
}
//Check all tokens and deete the expired ones 
checker.checkTokens = () => {
    //Get all tokens
    crud.list('tokens', (err, tokens) => {
        if (!err && tokens) {
            for (let i = 0; i < tokens.length; i++) {
                //Get the information for the current token 
                crud.read('tokens', tokens[i], (err, tokenData) => {
                    if (!err && tokenData) {
                        //Check the token's expitarion time
                       if(tokenData.expires <= Date.now()){
                           //Delete the token if it's expired
                           crud.delete('tokens', tokens[i], err => {
                               if (err) {
                                console.log(err)
                               }
                           })
                       }
                    } else {
                        console.log(err)
                    }
                })
            }
        } else {
            console.log(err)
        }
    })
}
//constantly reinitiate the checker at given interval
checker.loop = () => {
    setInterval(() => {
        checker.checkOrders()
    }, config.checkOrdersInterval)
    setInterval(() => {
        checker.checkTokens()
    }, config.checkTokensInterval)
}
//Initiate the checker
checker.start = () => {
    //Initiate a check for all orders before the loop so it can begin immediatly
    checker.checkOrders()
    //Initiate a check for all tokens before the loop so it can begin immediatly
    checker.checkTokens()
    //Start the loop afret the first check
    checker.loop()
}
//Export checker
module.exports = checker