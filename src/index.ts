import express from 'express'

const app = express()

const port:Number = 4040

app.listen(port,()=>{
    console.log(`Server is running in port: ${port}`)
})