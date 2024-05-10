export default class Constraints{
    public mongo_connection:string = process.env.MONGODB_CONNECTION_STRING_LOCALHOST?process.env.MONGODB_CONNECTION_STRING_LOCALHOST: 'mongodb://127.0.0.1:27017/chat-app'
    public api_server:string = process.env.API_HOST?process.env.API_HOST: 'http://localhost:4040'
}
