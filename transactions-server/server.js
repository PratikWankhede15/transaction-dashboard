const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database');
});


// This code is  for inserting multiple records 

// app.post('/insert-products', (req, res) => {
//     const products = req.body;  
  
//     if (!Array.isArray(products) || products.length === 0) {
//       return res.status(400).json({ message: 'Please provide an array of products.' });
//     }
  
//     const values = products.map(product => [
//       product.title,
//       product.price,
//       product.description,
//       product.category,
//       product.image,
//       product.sold ? 1 : 0,  
//       product.dateOfSale
//     ]);
  
//     const sql = `INSERT INTO product_transaction (title, price, description, category, image, sold, dateOfSale) VALUES ?`;
  
//     db.query(sql, [values], (err, results) => {
//       if (err) {
//         console.error('Error inserting products:', err);
//         return res.status(500).json({ message: 'An error occurred while inserting the products.' });
//       }
      
//       res.status(201).json({ message: `${results.affectedRows} products inserted successfully.` });
//     });
//   });


app.get('/transactions', (req, res) => {
    const { search = '', page = 1, perPage = 10, month } = req.query;
  
    if (month && (isNaN(month) || month < 1 || month > 12)) {
      return res.status(400).json({ message: 'Invalid month. Please provide an integer between 1 (January) and 12 (December).' });
    }
  
   
    const monthNumber = month ? parseInt(month) : null;
  
   
    const offset = (page - 1) * perPage;
  
   
    let searchQuery = '';
    let searchValues = [];
    if (search) {
      searchQuery = `AND (title LIKE ? OR description LIKE ? OR price LIKE ?)`;
      searchValues = [`%${search}%`, `%${search}%`, `%${search}%`];
    }
    
 
    let monthQuery = '';
    if (monthNumber) {
      monthQuery = `AND MONTH(dateOfSale) = ?`;
    }
    
  
    
    const sql = `SELECT * FROM product_transaction WHERE 1=1 ${searchQuery} ${monthQuery} ORDER BY dateOfSale DESC LIMIT ${perPage} OFFSET ${offset}`;
  
    
    const values = [
        ...searchValues,
        ...(monthNumber ? [monthNumber] : []), 
      ];
  

    db.query(sql, values, (err, results) => {
      if (err) {
        console.error('Error fetching transactions:', err);
        return res.status(500).json({ message: 'An error occurred while fetching transactions.' });
      }
  
   
      const countSql = `SELECT COUNT(*) AS total FROM product_transaction WHERE 1=1 ${searchQuery} ${monthQuery}`;
  
      db.query(countSql, values.slice(0, 3), (err, countResult) => {
        if (err) {
          console.error('Error fetching transaction count:', err);
          return res.status(500).json({ message: 'An error occurred while counting transactions.' });
        }
  
       
        const totalRecords = countResult[0].total;
        res.status(200).json({
          transactions: results,
          pagination: {
            page: parseInt(page),
            perPage: parseInt(perPage),
            totalRecords: totalRecords,
            totalPages: Math.ceil(totalRecords / perPage)
          }
        });
      });
    });
});

app.get('/statistics', (req, res) => {
    const { month } = req.query;

    if (month && (isNaN(month) || month < 1 || month > 12)) {
        return res.status(400).json({ message: 'Invalid month. Please provide an integer between 1 (January) and 12 (December).' });
    }

    const monthNumber = month ? parseInt(month) : null;

    if (!monthNumber) {
        return res.status(400).json({ message: 'Month parameter is required.' });
    }

    const totalSaleSql = `SELECT SUM(price) AS totalSaleAmount FROM product_transaction WHERE MONTH(dateOfSale) = ? AND sold = true`;

    const soldItemsSql = `SELECT COUNT(*) AS totalSoldItems FROM product_transaction WHERE MONTH(dateOfSale) = ? AND sold = true`;

    const notSoldItemsSql = `SELECT COUNT(*) AS totalNotSoldItems FROM product_transaction WHERE MONTH(dateOfSale) = ? AND sold = false`;

    const values = [monthNumber];

    db.query(totalSaleSql, values, (err, totalSaleResult) => {
        if (err) {
            console.error('Error fetching total sale amount:', err);
            return res.status(500).json({ message: 'An error occurred while fetching total sale amount.' });
        }

        db.query(soldItemsSql, values, (err, soldItemsResult) => {
            if (err) {
                console.error('Error fetching total sold items:', err);
                return res.status(500).json({ message: 'An error occurred while fetching sold items count.' });
            }

            db.query(notSoldItemsSql, values, (err, notSoldItemsResult) => {
                if (err) {
                    console.error('Error fetching total not sold items:', err);
                    return res.status(500).json({ message: 'An error occurred while fetching not sold items count.' });
                }

                const totalSaleAmount = totalSaleResult[0].totalSaleAmount || 0;
                const totalSoldItems = soldItemsResult[0].totalSoldItems || 0;
                const totalNotSoldItems = notSoldItemsResult[0].totalNotSoldItems || 0;

                res.status(200).json({
                    month: monthNumber,
                    totalSaleAmount,
                    totalSoldItems,
                    totalNotSoldItems
                });
            });
        });
    });
});

app.get('/price-range-statistics', (req, res) => {
    const { month } = req.query;

    if (month && (isNaN(month) || month < 1 || month > 12)) {
        return res.status(400).json({ message: 'Invalid month. Please provide an integer between 1 (January) and 12 (December).' });
    }

    const monthNumber = month ? parseInt(month) : null;

    if (!monthNumber) {
        return res.status(400).json({ message: 'Month parameter is required.' });
    }

    const priceRanges = [
        { range: '0 - 100', min: 0, max: 100 },
        { range: '101 - 200', min: 101, max: 200 },
        { range: '201 - 300', min: 201, max: 300 },
        { range: '301 - 400', min: 301, max: 400 },
        { range: '401 - 500', min: 401, max: 500 },
        { range: '501 - 600', min: 501, max: 600 },
        { range: '601 - 700', min: 601, max: 700 },
        { range: '701 - 800', min: 701, max: 800 },
        { range: '801 - 900', min: 801, max: 900 },
        { range: '901 and above', min: 901, max: 9999999 }
    ];

    let priceRangeQueries = priceRanges.map((range) => {
        return `SELECT COUNT(*) AS count FROM product_transaction WHERE MONTH(dateOfSale) = ? AND price BETWEEN ? AND ?`;
    });

    const sql = priceRangeQueries.join(' UNION ALL ');

    let values = [];
    for (let range of priceRanges) {
        values.push(monthNumber, range.min, range.max);
    }

    db.query(sql, values, (err, results) => {
        if (err) {
            console.error('Error fetching price range statistics:', err);
            return res.status(500).json({ message: 'An error occurred while fetching price range statistics.' });
        }

        const response = priceRanges.map((range, index) => {
            return {
                range: range.range,
                count: results[index] ? results[index].count : 0
            };
        });

        res.status(200).json({
            month: monthNumber,
            priceRanges: response
        });
    });
});

app.get('/category-statistics', (req, res) => {
    const { month } = req.query;

    if (month && (isNaN(month) || month < 1 || month > 12)) {
        return res.status(400).json({ message: 'Invalid month. Please provide an integer between 1 (January) and 12 (December).' });
    }

    const monthNumber = month ? parseInt(month) : null;

    if (!monthNumber) {
        return res.status(400).json({ message: 'Month parameter is required.' });
    }

    const sql = `SELECT category, COUNT(*) AS count FROM product_transaction WHERE MONTH(dateOfSale) = ? GROUP BY category`;

    db.query(sql, [monthNumber], (err, results) => {
        if (err) {
            console.error('Error fetching category statistics:', err);
            return res.status(500).json({ message: 'An error occurred while fetching category statistics.' });
        }

        const response = results.map(row => ({
            category: row.category,
            count: row.count
        }));

        res.status(200).json({
            month: monthNumber,
            categoryStatistics: response
        });
    });
});

app.get('/combined-statistics', async (req, res) => {
    const { month } = req.query;

    if (month && (isNaN(month) || month < 1 || month > 12)) {
        return res.status(400).json({ message: 'Invalid month. Please provide an integer between 1 (January) and 12 (December).' });
    }

    const monthNumber = month ? parseInt(month) : null;

    if (!monthNumber) {
        return res.status(400).json({ message: 'Month parameter is required.' });
    }

    try {
        const statisticsResponse = await getStatistics(monthNumber);
        
        const barChartResponse = await getBarChartData(monthNumber);
        
        const pieChartResponse = await getPieChartData(monthNumber);

        const finalResponse = {
            statistics: statisticsResponse,
            barChartData: barChartResponse,
            pieChartData: pieChartResponse
        };

        res.status(200).json(finalResponse);

    } catch (err) {
        console.error('Error fetching combined data:', err);
        res.status(500).json({ message: 'An error occurred while fetching the combined data.' });
    }
});

function getStatistics(month) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT 
                SUM(price) AS totalSaleAmount, 
                COUNT(CASE WHEN sold = true THEN 1 END) AS totalSoldItems, 
                COUNT(CASE WHEN sold = false THEN 1 END) AS totalNotSoldItems
            FROM product_transaction
            WHERE MONTH(dateOfSale) = ?
        `;

        db.query(sql, [month], (err, results) => {
            if (err) return reject(err);
            resolve(results[0]);
        });
    });
}

function getBarChartData(month) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT COUNT(*) AS count FROM product_transaction WHERE MONTH(dateOfSale) = ? AND price BETWEEN 0 AND 100
            UNION ALL
            SELECT COUNT(*) AS count FROM product_transaction WHERE MONTH(dateOfSale) = ? AND price BETWEEN 101 AND 200
            UNION ALL
            SELECT COUNT(*) AS count FROM product_transaction WHERE MONTH(dateOfSale) = ? AND price BETWEEN 201 AND 300
            UNION ALL
            SELECT COUNT(*) AS count FROM product_transaction WHERE MONTH(dateOfSale) = ? AND price BETWEEN 301 AND 400
            UNION ALL
            SELECT COUNT(*) AS count FROM product_transaction WHERE MONTH(dateOfSale) = ? AND price BETWEEN 401 AND 500
            UNION ALL
            SELECT COUNT(*) AS count FROM product_transaction WHERE MONTH(dateOfSale) = ? AND price BETWEEN 501 AND 600
            UNION ALL
            SELECT COUNT(*) AS count FROM product_transaction WHERE MONTH(dateOfSale) = ? AND price BETWEEN 601 AND 700
            UNION ALL
            SELECT COUNT(*) AS count FROM product_transaction WHERE MONTH(dateOfSale) = ? AND price BETWEEN 701 AND 800
            UNION ALL
            SELECT COUNT(*) AS count FROM product_transaction WHERE MONTH(dateOfSale) = ? AND price BETWEEN 801 AND 900
            UNION ALL
            SELECT COUNT(*) AS count FROM product_transaction WHERE MONTH(dateOfSale) = ? AND price BETWEEN 901 AND 999999
        `;

        const values = Array(10).fill(month); 

        db.query(sql, values, (err, results) => {
            if (err) return reject(err);

            const priceRanges = [
                '0 - 100', '101 - 200', '201 - 300', '301 - 400', 
                '401 - 500', '501 - 600', '601 - 700', '701 - 800', 
                '801 - 900', '901 and above'
            ];

            const response = results.map((row, index) => ({
                range: priceRanges[index],
                count: row.count
            }));

            resolve(response);
        });
    });
}

function getPieChartData(month) {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT category, COUNT(*) AS count
            FROM product_transaction
            WHERE MONTH(dateOfSale) = ?
            GROUP BY category
        `;

        db.query(sql, [month], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
}


const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});