// --- backend/server.js ---

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// --- CONFIGURACIÓN DE SEGURIDAD ---
const ADMIN_PASSWORD = 'adminlaborde2025'; 
const AUTH_TOKEN = 'mimagno123';
// ------------------------------------

app.use(cors());
app.use(express.json());

const dataPath = path.join(__dirname, 'data', 'courses.json');

const readCourses = () => {
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
    fs.writeFileSync(dataPath, '[]', 'utf8');
  }
  const data = fs.readFileSync(dataPath, 'utf8');
  return JSON.parse(data);
};

const writeCourses = (courses) => {
  fs.writeFileSync(dataPath, JSON.stringify(courses, null, 2), 'utf8');
};

// --- RUTAS DE LA API ---

// Endpoint para el inicio de sesión
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ message: 'Login exitoso', token: AUTH_TOKEN });
  } else {
    res.status(401).json({ message: 'Contraseña incorrecta' });
  }
});

// Middleware de autenticación
const authGuard = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader === `Bearer ${AUTH_TOKEN}`) {
    next();
  } else {
    res.status(403).json({ message: 'Acceso denegado. Token inválido o no proporcionado.' });
  }
};

// RUTA GET: Protegida por el authGuard
app.get('/api/courses', authGuard, (req, res) => {
  const courses = readCourses();
  res.json(courses);
});

// RUTA POST: Protegida por el authGuard y actualizada
app.post('/api/courses', authGuard, (req, res) => {
  const courses = readCourses();
  
  // Objeto actualizado para manejar campos opcionales y el nuevo campo de precio
  const newCourse = {
    id: Date.now(),
    name: req.body.name || '',
    module: req.body.module || '',
    part: req.body.part || '',
    date: req.body.date || '',
    price: req.body.price || 0,
  };

  courses.push(newCourse);
  writeCourses(courses);
  res.status(201).json(newCourse);
});

// Pega este bloque en backend/server.js

// RUTA PUT: Para actualizar un curso existente (Editar)
app.put('/api/courses/:id', authGuard, (req, res) => {
  let courses = readCourses();
  const courseId = parseInt(req.params.id, 10);
  const courseIndex = courses.findIndex(course => course.id === courseId);

  if (courseIndex === -1) {
    return res.status(404).json({ message: 'Curso no encontrado' });
  }

  // Creamos el objeto del curso actualizado, manteniendo los datos antiguos
  // si no se envían nuevos en la petición.
  const updatedCourse = {
    ...courses[courseIndex],
    name: req.body.name,
    module: req.body.module,
    part: req.body.part,
    date: req.body.date,
    price: req.body.price,
  };

  courses[courseIndex] = updatedCourse;
  writeCourses(courses);

  res.json(updatedCourse); // Respondemos con el curso ya actualizado
});

// RUTA DELETE: Protegida por el authGuard
app.delete('/api/courses/:id', authGuard, (req, res) => {
  let courses = readCourses();
  const courseId = parseInt(req.params.id, 10);
  const updatedCourses = courses.filter(course => course.id !== courseId);
  
  if (courses.length === updatedCourses.length) {
    return res.status(404).json({ message: 'Curso no encontrado' });
  }

  writeCourses(updatedCourses);
  res.status(200).json({ message: 'Curso eliminado exitosamente' });
});

app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});