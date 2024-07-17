const express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('pg');

const app = express();
const port = 3000;

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'test 1',
    password: '2909',
    port: 5432,
});
client.connect();

app.use(bodyParser.urlencoded({ extended: true }));

function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1; 
    const year = date.getFullYear();
    return day + '/' + month + '/' + year;
}

app.get('/', (req, res) => {
    client.query('SELECT * FROM loantabel', (err, result) => {
        if (err) {
            console.error('Error fetching data', err);
            res.send('Error fetching data. Please try again.');
            return;
        }
        const rows = result.rows;

        let html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Loan Application Form</title>
            </head>
            <body>
                <h2>Loan Application Form</h2>
                <form action="/submit" method="post">
                    <label for="name">Name:</label><br>
                    <input type="text" id="name" name="name" required><br><br>
                    
                    <label for="emi">EMI Amount:</label><br>
                    <input type="number" id="emi" name="emi" required><br><br>
                    
                    <label for="date">Date:</label><br>
                    <input type="date" id="date" name="date" required><br><br>
                    
                    <label for="totalLoan">Total Loan:</label><br>
                    <input type="number" id="totalLoan" name="totalLoan" required><br><br>
                    
                    <label for="description">Description:</label><br>
                    <textarea id="description" name="description" required></textarea><br><br>

                    <label for="tenure">Tenure:</label><br>
                    <input type="number" id="tenure" name="tenure" required><br><br>
                    
                    <button type="submit">Submit</button>
                </form>
            </body>
            </html>
        `;

        res.send(html);
    });
});

app.post('/submit', (req, res) => {
    const { name, emi, date, totalLoan, description, tenure} = req.body;

    const query = 'INSERT INTO loantabel (name, emi, date, total_loan, description, tenure) VALUES ($1, $2, $3, $4, $5, $6)';
    const values = [name, emi, date, totalLoan, description, tenure];

    client.query(query, values, (err, result) => {
        if (err) {
            console.error('Error executing query', err);
            res.send('Error saving data. Please try again.');
            return;
        }
        res.redirect('/table');
    });
});

app.get('/table', (req, res) => {
    client.query('SELECT * FROM loantabel', (err, result) => {
        if (err) {
            console.error('Error fetching data', err);
            res.send('Error fetching data. Please try again.');
            return;
        }
        const rows = result.rows;

        let html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Loan Data</title>
            </head>
            <body>
                <h2>Loan Data</h2>
                <table border="1">
                    <tr>
                        <th>Name</th>
                        <th>EMI Amount</th>
                        <th>Date</th>
                        <th>Total Loan</th>
                        <th>Description</th>
                        <th>Tenure</th>
                        <th>Pay EMI</th>
                        <th>Paid EMI</th>
                    </tr>
        `;

        rows.forEach(row => {
            const formattedDate = formatDate(row.date);
            html += `
                <tr>
                    <td>${row.name}</td>
                    <td>${row.emi}</td>
                    <td>${formattedDate}</td>
                    <td>${row.total_loan}</td>
                    <td>${row.description}</td>
                    <td>${row.tenure}</td>
                    <td><button onclick="showPayEMIForm('${row.name}')">Pay EMI</button></td>
                    <td><a href="/paidEMITable?name=${row.name}">View Paid EMI</a></td>
                </tr>
            `;
        });

        html += `
                </table>
                <div id="payEMIForm" style="display:none;">
                    <h3>Pay EMI</h3>
                    <form action="/payEMI" method="post">
                        <label for="payName">Name:</label>
                        <input type="text" id="payName" name="payName" readonly><br><br>
                        <label for="payEMIAmount">EMI Amount:</label>
                        <input type="number" id="payEMIAmount" name="payEMIAmount" required><br><br>
                        <button type="submit">Submit</button>
                    </form>
                </div>
                <script>
                    function showPayEMIForm(name) {
                        document.getElementById('payName').value = name;
                        document.getElementById('payEMIForm').style.display = 'block';
                    }
                </script>
            </body>
            </html>
        `;

        res.send(html);
    });
});

app.post('/payEMI', (req, res) => {
    const { payName, payEMIAmount } = req.body;

    const query = 'INSERT INTO loan_tabel (name, emi) VALUES ($1, $2)';
    const values = [payName, payEMIAmount];

    client.query(query, values, (err, result) => {
        if (err) {
            console.error('Error executing query', err);
            res.send('Error paying EMI. Please try again.');
            return;
        }
        res.redirect('/table');
    });
});

app.get('/paidEMITable', (req, res) => {
    const name = req.query.name;

    client.query('SELECT name, emi FROM loan_tabel WHERE name = $1', [name], (err, result) => {
        if (err) {
            console.error('Error fetching data', err);
            res.status(500).send('Internal Server Error');
            return;
        }

        let html = '<table border="1"><tr><th>Name</th><th>EMI Amount</th></tr>';
        result.rows.forEach(row => {
            html += `<tr><td>${row.name}</td><td>${row.emi}</td></tr>`;
        });
        html += '</table>';
        res.send(html);
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
