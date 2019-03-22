//Include the required node modules
const https = require('https')
const querystring = require('querystring')
const {StringDecoder} = require('string_decoder')
//Include custom crafted modules
const crud = require('./data')
const config = require('./config')
//Initialize the api object
let api = {}
//Make a payment for the requested order
api.payment = (phone, orderId, orderItems, callback) => {
    //Set and format the request body
    let paymentData = querystring.stringify({
        'amount': orderItems.price * 100,
        'currency': 'usd',
        'source': 'tok_visa',
        'description': 'test'
    })
    //Specify the request details
    const reqDetails = {
        'protocol': 'https:',
        'hostname': config.stripeBaseURL,
        'method': 'POST',
        'path': config.charge,
        'auth': config.stripeSecret,
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(paymentData)
        }
    }
    //Make the actual request
    apiRequest(reqDetails, paymentData, status => {
        if (status == 200) {
            crud.read('users', phone, (err, userData) => {
                if (!err && userData) {
                    delete orderItems.completed
                    api.mailReceipt(userData.validEmail ,orderId, orderItems, res => {
                        console.log('mail receipt: '+res)
                        if (res == 200) {
                            callback(200, {'Message': `Order ${orderId} was created successfully`})
                        } else {
                            callback(500, {'Error': 'Could not create order'})
                        }
                    })
                } else {
                    callback(500, {'Error':'Could not retrieve user information'})
                }
            })
        } else {
            callback(status)
        }
    })
}
//Send receipt via email
api.mailReceipt = (email, orderId, orderItems, callback) => {
    let delimiter = '-'
    crud.read('menu', 'menu', (err, menu) => {
        let price = orderItems.price
        let order = `You have successfully ordered \n`
        delete orderItems.price
        if (!err && menu) {
            for (const pizza in orderItems) {
                if (menu.hasOwnProperty(pizza)) {
                    order += `${pizza}: ${orderItems[pizza]} x ${menu[pizza].price}\n`
                }
            }
            order += delimiter.repeat(50)
            order += `\nThe total cost of the order is ${price}.`
            //Specify the email attributes
            let receiptData = querystring.stringify({
                'to': email,
                'from': config.mailgunSender,
                'subject': `Payment fo order ${orderId}`,
                'text': order
            })
            //Specify the request details
            const reqDetails = {
                'protocol': 'https:',
                'hostname': config.mailgunURL,
                'method': 'POST',
                'path': config.messageURL,
                'auth': config.mailgunKey,
                'headers': {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(receiptData)
                }
            }
            //Make the actual request
            apiRequest(reqDetails, receiptData, result => { 
                console.log('api response for receipt '+result)
                callback(result)})
        } else {
            callback(500, {'Error': 'Could not retrieve the menu'})
        }
    })
}
//Make the request to the selected API
let apiRequest = (details, reqData, callback) => {
    //Initialize the buffer
    let buffer = ''
    //Create the payment request
    const apiReq = https.request(details, res => {
        //Initialize decoder
        let decoder = new StringDecoder('utf-8')
        //Write to the buffer
        res.on('data', data => {
            buffer += decoder.write(data)
        })
        res.on('end', () => {
            buffer += decoder.end()
        })
        //Get the response status code
        const resStatus = res.statusCode
        if (resStatus == 200) {
            //Send the response status code
            callback(resStatus)
        } else {
            callback(resStatus)
        }
    })
    //Send the data related to the current payment
    apiReq.end(reqData)
}
//Export the API module
module.exports = api