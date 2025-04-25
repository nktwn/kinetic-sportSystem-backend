const express = require('express');
const cors = require('cors'); 
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger/swagger.json');
const dotenv = require('dotenv');
const sequelize = require('./config/db');
const authRoutes = require('./routes/authRoutes');
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

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/auth', authRoutes); 

app.get('/', (req, res) => {
  res.json({ message: "Kinetic SportSystem Backend Running..." });
});

sequelize.sync()
  .then(() => {
    app.listen(8000, () => {
      console.log("Server running on http://localhost:8000");
    });
  })
  .catch((error) => console.log("Database connection failed: ", error));
