
const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;



// Configurar Multer para manejar archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`); // Generar codigo unico
  }
});

const upload = multer({ storage });

const appointments = []; // Almacenar citas en memoria

// Crear cita medica
app.post('/appointments', upload.single('authorization'), (req, res) => {
  const { cc, date } = req.body;
  const file = req.file;

  if (!cc || !date || !file) {
    return res.status(400).json({ message: 'Faltan datos o archivo' });
  }

  const appointmentCode = uuidv4();

  const newAppointment = {
    code: appointmentCode,
    cc,
    date,
    status: true,
    authorization: file.path
  };

  appointments.push(newAppointment);

  res.json({ code: appointmentCode });
});

app.get("/appointments", (_req, res) => {
  const { date1, date2 } = _req.query;
  if (!date1 || !date2) {
    return res.status(400).json({ message: 'Falta rango de fechas' });
  }

  function filterAppointments(date1,date2){
    const start = new Date(date1);
    const end = new Date(date2);
    return appointments.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= start && itemDate <= end;
  });
  }
  const filteredAppointments= filterAppointments(date1,date2)

  
  res.json(filteredAppointments);
})

 
app.delete("/appointments", (req, res) => {
  const {code} = req.query; 
  if (!code) {
    return res.status(400).json({ message: 'Falta codigo de cita' });
  }

  const index = appointments.findIndex(item => item.code === code);
S

  if(index !== -1){
    appointments[index].status=false;
    return res.status(400).json({ message: "cita "+code+" cancelada con exito"});
  } else{
    return res.status(400).json({ message: 'cita no encontrada' });
  }
})


app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

