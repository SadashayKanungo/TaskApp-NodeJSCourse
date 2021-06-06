const express = require('express')
const multer = require('multer')
require('./db/mongoose.js')

//var underMaintainance = false

const userRouter = require('./routers/user.js')
const taskRouter = require('./routers/task.js')

const app = express()
const port = process.env.PORT

app.use(express.json())

// app.use((req,res,next) => {
//     if(underMaintainance){
//         return res.status(503).send('Server under maintainance')
//     }
//     next()
// })
app.get('/', (req,res)=>{
    res.send('Welcome to Kanungo Task App')
})
app.use(taskRouter)
app.use(userRouter)


const upload = multer({
    dest: 'images'
})
app.post('/upload', upload.single('upload'), (req,res)=>{
    res.send()
})


app.listen(port, ()=>{
    console.log('Listening on port ' + port)
})