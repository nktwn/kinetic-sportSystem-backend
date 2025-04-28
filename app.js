const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger/swagger.json');
const dotenv = require('dotenv');
const http = require('http'); 
const socketIo = require('socket.io');  
const sequelize = require('./config/db');
const departmentUsersRoutes = require('./routes/departmentUsersRoutes');

// Модели
const User = require('./models/user');
const Department = require('./models/Department');
const Event = require('./models/event');

// Роуты
const authRoutes = require('./routes/authRoutes');
const { router: activitiesRoutes } = require('./routes/activitiesRoutes');
const eventsRoutes = require('./routes/eventsRoutes');
const departmentRoutes = require('./routes/departmentRoutes');

dotenv.config();

const app = express();

// Настройка CORS
const corsOptions = {
  origin: 'http://localhost:9000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Создание HTTP сервера
const server = http.createServer(app);

// Настройка Socket.io
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:9000', 
    methods: ['GET', 'POST'],
  }
});

// Работа с соединениями
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

// Документация Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Маршруты
app.use('/auth', authRoutes);
app.use('/activities', activitiesRoutes);
app.use('/events', eventsRoutes);
app.use('/departments', departmentRoutes);
app.use(departmentUsersRoutes);

// Базовый маршрут
app.get('/', (req, res) => {
  res.json({ message: "Kinetic SportSystem Backend Running..." });
});

// Просто подключаем сервер без sync()
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
