'use strict';

const fs = require('fs');
const path = require('path');
const process = require('process');
const basename = path.basename(__filename);

// Khởi tạo đối tượng models
const models = {};

// Đọc tất cả file trong thư mục models (trừ index.js) và thêm vào đối tượng models
fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const modelName = path.basename(file, '.js');
    const model = require(path.join(__dirname, file));
    models[modelName] = model;
  });

// Export models
module.exports = models; 