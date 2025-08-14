const express = require('express');
const multer = require('multer');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = 8080;

// Set up multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Predefined units to filter
const unitsToFilter = {
  'pg': [],
   
};

// Helper function to split each row into separate elements
const splitRowIntoElements = (row) => {
  return row
    .replace(/([a-zA-Z])(?=\d)/g, '$1 ')
    .replace(/(\d)(?=[a-zA-Z])/g, '$1 ')
    .replace(/(?=\d)(?<=\d\w)/g, ' ')
    .trim()
    .split(/\s+/);
};

// Process pg array with its own set of conditions
function processPgArray(arrayName, arrayData) {
  const results = [];
  arrayData.forEach((array) => {
    if (array.length >= 5) {
      const firstElement = array[0];
      let fifthElement = array[3];
      let oddElement = arrayData[6][4];
      let OEN = parseFloat(oddElement);
      let fifthElementAsNumber = parseFloat(fifthElement);

      let result = { element: firstElement, passed: false };

      // Define custom conditions for pg array
      if (firstElement === '19-NE-AC' && fifthElementAsNumber <= 0.1) {
        result.passed = true;
        console.log(`${firstElement} in ${arrayName} passed LOD condition 1`);
      } else if (firstElement === 'E-AC' && fifthElementAsNumber <= 2.0) {
        result.passed = true;
        console.log(`${firstElement} in ${arrayName} passed LOD condition 2`);
      } else if (firstElement === 'A-AC' && fifthElementAsNumber <= 2.0) {
        result.passed = true;
        console.log(`${firstElement} in ${arrayName} passed LOD condition 3`);
      } else if (firstElement === 'DHEA-AC' && fifthElementAsNumber <= 0.1) {
        result.passed = true;
        console.log(`${firstElement} in ${arrayName} passed LOD condition 4`);
      } else if (firstElement === '11-KE-AC' && fifthElementAsNumber <= 0.1) {
        result.passed = true;
        console.log(`${firstElement} in ${arrayName} passed LOD condition 5`);
      } else if (firstElement === 'DHT-AC' && fifthElementAsNumber <= 0.1) {
        result.passed = true;
        console.log(`${firstElement} in ${arrayName} passed LOD condition 6`);
      } else if (firstElement === '5' && OEN <= 0.1) {
        result.passed = true;
        console.log(`${firstElement} in ${arrayName} passed LOD condition 7`);
      } else if (firstElement === 'EpiT-AC' && fifthElementAsNumber <= 0.1) {
        result.passed = true;
        console.log(`${firstElement} in ${arrayName} passed LOD condition 8`);
      } else if (firstElement === 'T-AC' && fifthElementAsNumber <= 0.1) {
        result.passed = true;
        console.log(`${firstElement} in ${arrayName} passed LOD condition 9`);
      } else if (firstElement === '11-OHA-3-AC' && fifthElementAsNumber <= 0.2) {
        result.passed = true;
        console.log(`${firstElement} in ${arrayName} passed LOD condition 10`);
      }

      results.push(result);
    }
  });
  return results;
}

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'func.html'));
});

app.post('/upload', upload.single('pdf'), async (req, res) => {
  const pdfPath = req.file.path;

  try {
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdfParse(pdfBuffer);

    const cleanedText = pdfData.text.replace(/\r\n|\r|\n/g, '\n').trim();
    const rows = cleanedText.split('\n').map(splitRowIntoElements);

    rows.forEach((row) => {
      row.forEach((word) => {
        if (word.includes('pg')) {
          unitsToFilter['pg'].push(row);
        }
      });
    });

    const pgResults = processPgArray('pg', unitsToFilter['pg']);

    console.log(JSON.stringify(unitsToFilter, null, 2)); // Log full JSON to console

    const jsonFilePath = writeJsonToFile(
      unitsToFilter,
      path.basename(req.file.originalname, '.pdf')
    );

    res.json({
      message: 'PDF processed successfully.',
      jsonFilePath: jsonFilePath,
      results: pgResults,
    });
  } catch (err) {
    console.error('Error during PDF processing:', err);
    res.status(500).json({ message: 'Error processing PDF', error: err });
  }
});

function writeJsonToFile(data, fileName) {
  const jsonFilePath = path.join(__dirname, 'uploads', fileName + '.json');
  fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2));
  return jsonFilePath;
}

app.use(express.json());

// Route to trigger server restart
app.get('/trigger', (req, res) => {
  exec('node trigger.js', (err) => {
    if (err) {
      console.error('Error triggering restart:', err);
      res.status(500).send('Error triggering restart');
      return;
    }
    res.send('Server restart triggered');
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
