const fs = require('fs')
const path = require('path')
const helpers = require('./helpers')
//Initialize CRUD object
let crud = {}
//Get the directory where the storage files are located
crud.baseDir = path.join(__dirname, './storage/')
//Create file
crud.create = (dir, file, data, callback) => {
    fs.open(`${crud.baseDir}${dir}/${file}.json`, 'wx', (err, fileDesc) => {
       if (!err && fileDesc) {
            const strData = JSON.stringify(data)
            fs.writeFile(fileDesc, strData, err => {
                if (!err) {
                fs.close(fileDesc, err => {
                    if (!err) {
                        callback(false)
                    } else {
                        callback('Error while closing the file')
                    }
                }) 
                } else {
                    callback('Could not write to a file')
                }
            })
       } else {
           callback('Could not create the file. File may already exist')
       }
    })
}
//Read file, gitting it's contents
crud.read = (dir, file, callback) => {
    fs.readFile(`${crud.baseDir}${dir}/${file}.json`, 'utf8', (err, data) => {
        if (!err && data) {
            const parsedData = helpers.parseJSON(data)
            callback(false, parsedData)
        } else {
            callback(err)   
        }
    })
}
//Update existing file
crud.update = (dir, file, data, callback) => {
    fs.open(`${crud.baseDir}${dir}/${file}.json`, 'r+', (err, fileDesc) => {
        if (!err && fileDesc) {
            const strData = JSON.stringify(data)
            fs.ftruncate(fileDesc, err => {
                if (!err) {
                    fs.writeFile(fileDesc, strData, err => {
                        if (!err) {
                            fs.close(fileDesc, err => {
                                if (!err) {
                                    callback(false)
                                } else {
                                    callback('Error while closing the file')
                                }
                            })
                        } else {
                            callback('Error while updating the file')
                        }
                    })
                } else {
                    callback('Error while truncating the file')
                }
            })
        } else {
            callback('Could not update the file, it may already exist')
        }
    })
}
//Delete file
crud.delete = (dir, file, callback) => {
    fs.unlink(`${crud.baseDir}${dir}/${file}.json`, err => {
        if (!err) {
            callback(false)
        } else {
            callback('Could not delete file')
        }
    })
}
//List files in selected directory
crud.list = (dir, callback) => {
    //Read the selected directory
    fs.readdir(`${crud.baseDir}${dir}`, (err, files) => {
        //Check if there are files in the selected directory
        if (!err && files && files.length > 0) {
            let fileList = []
            //Iterate over the files
            files.forEach((file) => {
                //Remove the file type extension and add the trimmed file name to an array
                fileList.push(file.replace('.json',''))
            })
            //Return the list of files
            callback(false, fileList)
        } else {
            callback(err, files)
        }
    })
}
//Export the CRUD module
module.exports = crud