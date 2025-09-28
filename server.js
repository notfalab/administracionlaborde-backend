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

// URLs que tienen permiso para conectar.
const allowedOrigins = [
    'https://administracionlaborde-frontend-iylb2nz03.vercel.app', // Tu URL de Vercel
    'https://www.administracionlaborde.com',                    // Tu dominio principal
    'https://administracionlaborde.com',                        // Tu dominio sin 'www'
    'http://127.0.0.1:8080'                                      // Para desarrollo local
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));

app.use(express.json());

// --- FUNCIÓN HELPER ---
const createDataFileIfNotExists = (filePath) => {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '[]', 'utf8');
    }
};

// --- RUTAS DE LOGIN Y AUTH ---
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
    res.status(403).json({ message: 'Acceso denegado.' });
  }
};


// =================================================================
// --- API PARA CURSOS ---
// =================================================================
const coursesDataPath = path.join(__dirname, 'data', 'courses.json');

app.get('/api/courses', authGuard, (req, res) => {
  createDataFileIfNotExists(coursesDataPath);
  const data = fs.readFileSync(coursesDataPath, 'utf8');
  res.json(JSON.parse(data));
});

app.post('/api/courses', authGuard, (req, res) => {
  createDataFileIfNotExists(coursesDataPath);
  const courses = JSON.parse(fs.readFileSync(coursesDataPath, 'utf8'));
  const newCourse = { id: Date.now(), ...req.body };
  courses.push(newCourse);
  fs.writeFileSync(coursesDataPath, JSON.stringify(courses, null, 2));
  res.status(201).json(newCourse);
});

app.put('/api/courses/:id', authGuard, (req, res) => {
    createDataFileIfNotExists(coursesDataPath);
    let courses = JSON.parse(fs.readFileSync(coursesDataPath, 'utf8'));
    const courseId = parseInt(req.params.id, 10);
    const courseIndex = courses.findIndex(c => c.id === courseId);
    if (courseIndex === -1) return res.status(404).json({ message: 'Curso no encontrado' });
    courses[courseIndex] = { ...courses[courseIndex], ...req.body };
    fs.writeFileSync(coursesDataPath, JSON.stringify(courses, null, 2));
    res.json(courses[courseIndex]);
});

app.delete('/api/courses/:id', authGuard, (req, res) => {
    createDataFileIfNotExists(coursesDataPath);
    let courses = JSON.parse(fs.readFileSync(coursesDataPath, 'utf8'));
    const courseId = parseInt(req.params.id, 10);
    const updatedCourses = courses.filter(course => course.id !== courseId);
    if (courses.length === updatedCourses.length) return res.status(404).json({ message: 'Curso no encontrado' });
    fs.writeFileSync(coursesDataPath, JSON.stringify(updatedCourses, null, 2));
    res.status(200).json({ message: 'Curso eliminado' });
});


// =================================================================
// --- API PARA PÓLIZAS ---
// =================================================================
const policiesDataPath = path.join(__dirname, 'data', 'policies.json');

app.get('/api/policies', authGuard, (req, res) => {
  createDataFileIfNotExists(policiesDataPath);
  const data = fs.readFileSync(policiesDataPath, 'utf8');
  res.json(JSON.parse(data));
});

app.post('/api/policies', authGuard, (req, res) => {
  createDataFileIfNotExists(policiesDataPath);
  const policies = JSON.parse(fs.readFileSync(policiesDataPath, 'utf8'));
  const newPolicy = {
      id: Date.now(),
      policyNumber: req.body.policyNumber || '',
      policyHolder: req.body.policyHolder || '',
      insuredItem: req.body.insuredItem || '',
      company: req.body.company || '',
      startDate: req.body.startDate || '',
      renewalDate: req.body.renewalDate || '',
      paymentMethod: req.body.paymentMethod || '',
      paymentDetails: req.body.paymentDetails || '',
      category: req.body.category || '',
      premiumAmount: req.body.premiumAmount || 0
  };
  policies.push(newPolicy);
  fs.writeFileSync(policiesDataPath, JSON.stringify(policies, null, 2));
  res.status(201).json(newPolicy);
});

app.put('/api/policies/:id', authGuard, (req, res) => {
    createDataFileIfNotExists(policiesDataPath);
    let policies = JSON.parse(fs.readFileSync(policiesDataPath, 'utf8'));
    const policyId = parseInt(req.params.id, 10);
    const policyIndex = policies.findIndex(p => p.id === policyId);
    if (policyIndex === -1) return res.status(404).json({ message: 'Póliza no encontrada' });
    policies[policyIndex] = { ...policies[policyIndex], ...req.body };
    fs.writeFileSync(policiesDataPath, JSON.stringify(policies, null, 2));
    res.json(policies[policyIndex]);
});

app.delete('/api/policies/:id', authGuard, (req, res) => {
    createDataFileIfNotExists(policiesDataPath);
    let policies = JSON.parse(fs.readFileSync(policiesDataPath, 'utf8'));
    const policyId = parseInt(req.params.id, 10);
    const updatedPolicies = policies.filter(p => p.id !== policyId);
    if (policies.length === updatedPolicies.length) return res.status(404).json({ message: 'Póliza no encontrada' });
    fs.writeFileSync(policiesDataPath, JSON.stringify(updatedPolicies, null, 2));
    res.status(200).json({ message: 'Póliza eliminada' });
});

// --- INICIAR SERVIDOR ---
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
});

