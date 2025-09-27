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

// Estas son las URLs que tienen permiso para conectar.
const allowedOrigins = [
    'https://administracionlaborde-frontend-iylb2nz03.vercel.app', // Tu URL de Vercel
    'https://www.administracionlaborde.com',                    // Tu dominio principal
    'https://administracionlaborde.com'                         // Tu dominio sin 'www'
];

app.use(cors({
    origin: function (origin, callback) {
        // Permite peticiones sin origen (como las de Postman o apps móviles) o si el origen está en la lista blanca.
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));

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

app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ message: 'Login exitoso', token: AUTH_TOKEN });
  } else {
    res.status(401).json({ message: 'Contraseña incorrecta' });
  }
});

const authGuard = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader === `Bearer ${AUTH_TOKEN}`) {
    next();
  } else {
    res.status(403).json({ message: 'Acceso denegado. Token inválido o no proporcionado.' });
  }
};

app.get('/api/courses', authGuard, (req, res) => {
  const courses = readCourses();
  res.json(courses);
});

app.post('/api/courses', authGuard, (req, res) => {
  const courses = readCourses();
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

app.put('/api/courses/:id', authGuard, (req, res) => {
    let courses = readCourses();
    const courseId = parseInt(req.params.id, 10);
    const courseIndex = courses.findIndex(c => c.id === courseId);

    if (courseIndex === -1) {
        return res.status(404).json({ message: 'Curso no encontrado' });
    }

    const updatedCourse = { ...courses[courseIndex], ...req.body };
    courses[courseIndex] = updatedCourse;
    writeCourses(courses);
    res.json(updatedCourse);
});

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
