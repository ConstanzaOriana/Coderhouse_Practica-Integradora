const express = require('express');
const app = express();
const http = require('http');
const httpServer = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(httpServer);
const handlebars = require('express-handlebars');
const messageRouter = require('./routers/message.router');
const productRouter = require('./routers/product.router');
const cartRouter = require('./routers/cart.router');
const mongoose = require('mongoose');
const messageModel = require('./models/message.model');

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.engine('handlebars', handlebars.engine());
app.set('views', 'views');
app.set('view engine', 'handlebars');

app.use('/messages', messageRouter);
app.use('/products', productRouter);
app.use('/carts', cartRouter);

const ATLAS_PROVIDER = "mongodb+srv://coderhouse:coderhouse@coderhouse.w0a0mhp.mongodb.net/coderhouse?retryWrites=true&w=majority";
mongoose.connect(ATLAS_PROVIDER, (error) => {
    if(error){
        console.log("Cannot connect to database: " + error);
        process.exit();
    }
});

io.on('connection', socket => {

    console.log('a user has connected');

    (async () => {

        let messagesCurrently = await messageModel.find();
        socket.emit('viewMessages', messagesCurrently);

        socket.on('sendMessage', async data => {
            let { user, message } = data;
            if(!user || !message) return res.send({ status: "Error", error: "Data not found"});
            try{
                await messageModel.create({
                    user,
                    message
                });
            }
            catch(error){
                console.log(`Error: ${error}`);
            }
            let messagesCurrently = await messageModel.find();
            io.sockets.emit('viewMessages', messagesCurrently);
        });
    })();

    socket.on('disconnect', () => {
        console.log('user has disconnected');
    });
    
});

const PORT = 8080;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));




