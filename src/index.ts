import handleControllerAndMiddleware from './modules/handleControllerAndMiddleware'
import UserRoutes from './routes/user.routes'
import ChatRoutes from './routes/chat.routes'
const port:Number = 4040
// const userController = new UserController('/api/user')
const userRoutes = new UserRoutes('/api/user')
const chatRoutes = new ChatRoutes('/api/chat')

const app = new handleControllerAndMiddleware([
    userRoutes,
    chatRoutes
],port)
app.listen();