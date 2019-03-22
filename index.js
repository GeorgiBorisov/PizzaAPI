//Include the required NodeJS modules
const http = require('http')
const url = require('url')
const {StringDecoder} = require('string_decoder')
//Include additinal hand crafted modules
const router = require('./router')
const helpers = require('./helpers')
const config = require('./config')
const checker = require('./checker')
//Create the server and process the requests
const server = http.createServer((req, res) => {  
    //Get the request parameters
    let urlParsed = url.parse(req.url, true)
    let path = urlParsed.pathname
    let trimmedPath = path.replace(/^\/+|\/+$/g, '')
    let method = req.method.toLowerCase()
    let headers = req.headers
    let queryString = urlParsed.query
    //Initialize decoder
    let decoder = new StringDecoder('utf-8')
    //Initialize buffer
    let buffer = ''
    //Save the request body to a buffer
    req.on('data', data => {
        buffer += decoder.write(data)
    })
    req.on('end', () => {
        buffer += decoder.end()
        let requestedUrl = routes[trimmedPath] ? routes[trimmedPath] : routes['404']
        //Get the request parameters
        let requestData = {
            'path': trimmedPath,
            'query': queryString,
            'method': method,
            'headers': headers,
            'reqBody': helpers.parseJSON(buffer)
        }  
        //Call the requested URL if such exists and return status code and response
        requestedUrl(requestData, (code, reqBody) => {
            code = typeof(code) == 'number' ? code : 200
            reqBody = typeof(reqBody) == 'object' ? reqBody : {}
            let reqBodyStr = JSON.stringify(reqBody)
            //Send response headers
            res.setHeader('Content-Type', 'application/json')
            //Send status code
            res.writeHead(code)
            //Send response body
            res.end(reqBodyStr)
        })           
    })
//Set the server the listen to a certain port  
}).listen(config.port)
//Initiate the checking of the orders
checker.start()
console.log(`Server is running on port ${config.port}`)
//Valid URLs
const routes = {
    'users': router.users,
    'tokens': router.tokens,
    'products': router.products,
    'orders': router.orders,
    'orders/markCompleted': router.confirmOrder,
    '404': router.notFound
}