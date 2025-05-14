const express = require('express');
const morgan = require('morgan');
const path = require('path');

const app = express();

// 自定义日志格式
morgan.token('body', (req) => JSON.stringify(req.body));
morgan.token('response-body', (req, res) => {
  if (res._responseBody) {
    return JSON.stringify(res._responseBody);
  }
  return '';
});

// 添加请求体解析中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 自定义日志格式
app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" \nRequest Body: :body \nResponse Body: :response-body\n'));

// 记录响应体
app.use((req, res, next) => {
  const oldSend = res.send;
  res.send = function (data) {
    res._responseBody = data;
    return oldSend.apply(res, arguments);
  };
  next();
});

// 提供静态文件
app.use(express.static(path.join(__dirname, 'dist')));

// 处理所有路由，返回 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = 5173;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});