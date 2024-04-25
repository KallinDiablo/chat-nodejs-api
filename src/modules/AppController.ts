import express from 'express'

export default class AppController{
    public pathAPI: String
    public router: express.Router

    constructor(pathAPI:String,router?:express.Router){
        this.router = router? express.Router():express.Router() 
        this.pathAPI = pathAPI
    }
}