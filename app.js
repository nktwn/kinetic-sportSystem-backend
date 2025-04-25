const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger/swagger.json');
const dotenv = require('dotenv');
const sequelize = require('./config/db');
const http = require('http'); 
const socketIo = require('socket.io');  
const authRoutes = require('./routes/authRoutes');
const { router: activitiesRoutes } = require('./routes/activitiesRoutes');
const eventsRoutes = require('./routes/eventsRoutes');


dotenv.config();

const app = express();

const corsOptions = {
  origin: 'http://localhost:9000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:9000', 
    methods: ['GET', 'POST'],
  }
});

io.on('connection', (socket) => {
  console.log('A user connected');
  
  socket.on('update-role', (data) => {
    console.log('Role update request:', data);
    
    io.emit('role-updated', data); 
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/auth', authRoutes);

app.use('/activities', activitiesRoutes);

app.use('/events', eventsRoutes);

app.get('/', (req, res) => {
  res.json({ message: "Kinetic SportSystem Backend Running..." });
});

sequelize.sync()
  .then(() => {
    server.listen(8000, () => {
      console.log("Server running on http://localhost:8000");
    });
  })
  .catch((error) => console.log("Database connection failed: ", error));

  