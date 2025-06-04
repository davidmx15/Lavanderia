const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración del motor de vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Conexión a MySQL
// Conexión a la base de datos
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: 'lavadora_db'
});

db.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
    } else {
        console.log('Conectado a la base de datos MySQL');
    }
});

// Rutas
app.get('/', (req, res) => {
    res.render('Inicio');
});

app.get('/lavadora', (req, res) => {
    res.render('lavadora');
});

app.post('/guardar-ganancia', (req, res) => {
    const { ganancia } = req.body;
    if (!ganancia || isNaN(ganancia)) {
        return res.status(400).send('Ganancia inválida');
    }

    db.query(
        'INSERT INTO corte_lavadora (ganancia) VALUES (?)',
        [ganancia],
        (err) => {
            if (err) {
                console.error('Error al guardar la ganancia:', err);
                return res.status(500).send('Error al guardar');
            }
            res.sendStatus(200);
        }
    );
});

app.get('/corte', (req, res) => {
    db.query('SELECT * FROM corte_lavadora ORDER BY fecha DESC', (err, cortes) => {
        if (err) {
            console.error('Error al obtener cortes:', err);
            return res.status(500).send('Error al obtener los cortes');
        }

        db.query('SELECT SUM(ganancia) AS totalGanancia FROM corte_lavadora', (err, totalResult) => {
            if (err) {
                console.error('Error al obtener suma:', err);
                return res.status(500).send('Error al obtener el total');
            }

            const totalGanancia = totalResult[0].totalGanancia || 0;

            res.render('corte', {
                cortes,
                totalGanancia
            });
        });
    });
});

app.post('/corte/limpiar', (req, res) => {
    db.query('DELETE FROM corte_lavadora', (err, result) => {
        if (err) {
            console.error('Error al limpiar corte:', err);
            return res.status(500).send('Error al limpiar corte');
        }
        res.redirect('/corte');
    });
});

app.get('/corte/ticket', (req, res) => {
    db.query('SELECT * FROM corte_lavadora ORDER BY fecha DESC', (err, cortes) => {
        if (err) {
            console.error('Error al obtener cortes para ticket:', err);
            return res.status(500).send('Error al generar ticket');
        }
        // Suma total
        const totalGanancia = cortes.reduce((sum, c) => sum + Number(c.ganancia), 0);

        res.render('ticket', { cortes, totalGanancia });
    });
});


app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
