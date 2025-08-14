const fs = require('fs');
const path = require('path');

const triggerFile = path.join(__dirname, 'trigger-file.txt');

function touchFile() {
  fs.utimes(triggerFile, new Date(), new Date(), (err) => {
    if (err) throw err;
  });
}

touchFile();
