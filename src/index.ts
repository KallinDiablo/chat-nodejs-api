import handleControllerAndMiddleware from './modules/handleControllerAndMiddleware'
import UserController from './controllers/userController/user.controller'
const port:Number = 4040
const userController = new UserController('/api/user')

const app = new handleControllerAndMiddleware([
    userController
],port)
app.listen();