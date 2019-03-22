const crud = require('./data')

let validator = {}
//Validate the provided e-mail
validator.validateEmail = email => {
    const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    if (regex.test(email.toLowerCase())) {
        return email.toLowerCase()
    } else {
        return false
    }
}
//Validate the provided token
validator.validateToken = (phone, token, callback) => {
    crud.read('tokens', token, (err, token) => {
        if (!err && token) {
            if(token.expires >= Date.now() && token.phone === phone){
                callback(true)
            } else {
                callback(false)
            }
        } else {
           callback(false)
        }
    })
}
//Validate all incoming requests
validator.validateRequest = (input, method, callback) => {
    let valid = true
    for (const item in input) {
        //Check the request data depending on the request and format it
        switch (input[item]) {
            case input.firstName:
                input.firstName = typeof(input.firstName) == "string" &&
                input.firstName.trim().length > 0 ? input.firstName.trim() : 
                (method != 'put' ? valid = false : valid = true)
            break
            case input.lastName:
                input.lastName = typeof(input.lastName) == "string" &&
                input.lastName.trim().length > 0 ? input.lastName.trim() :
                (method != 'put' ? valid = false : valid = true)
            break
            case input.phone:
                input.phone = typeof(input.phone) == "string" 
                && input.phone.trim().length == 10 ? 
                input.phone.trim() : valid = false
            break
            case input.password:
                input.password = typeof(input.password) == "string" && 
                input.password.trim().length >= 8 ? input.password.trim() : 
                (method != 'put' ? valid = false : valid = true)
            break
            case input.address:
                input.address = typeof(input.address) == "string" && 
                input.address.trim().length > 0 ? input.address.trim() : 
                (method != 'put' ? valid = false : valid = true)
            case input.email:
                input.email = typeof(input.email) == "string" &&
                input.email.trim().length > 0 ?  input.email.trim() :
                (method != 'put' ? valid = false : valid = true)
            break
            case input.token:
                input.token = typeof(input.token) == "string" 
                && input.token.trim().length == 20 ? 
                input.token.trim() : valid = false
            break
            case input.orderItems:
                input.orderItems = input.orderItems instanceof Object &&
                JSON.stringify(input.orderItems) != {} ? input.orderItems :
                (method != 'put' ? valid = false : valid = true)
            break
            case input.extend:
                input.extend = typeof(input.extend) == "boolean" 
                && input.extend == true ? true : valid = false
            break
            case input.orderId:
                input.orderId = typeof(input.orderId) == "string" 
                && input.orderId.trim().length >= 13 ? 
                input.orderId.trim() : valid = false
            break
        }
    }
        valid == true ? callback(valid, input) : callback(valid)
}
//Calculate the total value of every order, new ones or existing order which is being updated
validator.calculateOrder = (items, callback) => {
    crud.read('menu', 'menu', (err, menu) => {
        if (!err && menu) {
            let price = 0
            for (const item in items) {
                if (menu.hasOwnProperty(item)) {
                    price += menu[item].price * items[item]
                }
            }
            
            callback(false, price.toFixed(2))
        } else {
            callback(500, {'Error': 'Error while calculating order total value'})
        }
    })
}
//Export the validator module
module.exports = validator