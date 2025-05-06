// middleware/activityLogger.js
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');

// Define log directory and file
const logDirectory = path.resolve(__dirname, '../logs');
const logFilePath = path.join(logDirectory, 'activity.log');

// Ensure logs directory exists
try {
  if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true });
    console.log(`[Log Setup] Created directory: ${logDirectory}`);
  }
} catch (err) {
  console.error(`[Log Setup Error] Could not create log directory: ${err.message}`);
}

const activityLogger = (req, res, next) => {
  const start = Date.now();

  let userId = null;
  let username = null;

  try {
    // Try to extract token from cookie or Authorization header
    const token =
      req.cookies?.token ||
      (req.headers.authorization || '').split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id || decoded._id || null;
      username = decoded.username || null;
    }
  } catch (err) {
    // Invalid token — ignore user info but continue logging
    console.log("[Auth Error] Could not decode token:", err.message);
  }

  const clientIp =
    req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;

  const method = req.method;
  const url = req.originalUrl;
  const userAgent = req.headers['user-agent'] || null;

  let requestBody = null;
  if (req._body && typeof req.body === 'object') {
    try {
      requestBody = JSON.stringify(req.body);
    } catch (e) {
      requestBody = '[Circular or invalid object]';
    }
  }

  // Hook into response end to capture final status + timing
  const send = res.send;
  res.send = function (data) {
    const status = res.statusCode;
    const responseTime = Date.now() - start;

    // Build log line
    const logLine = [
      format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      `Method: ${method}`,
      `URL: ${url}`,
      `IP: ${clientIp}`,
      `User-Agent: ${userAgent}`,
      `User ID: ${userId || 'N/A'}`,
      `Username: ${username || 'N/A'}`,
      `Status: ${status}`,
      `Response Time: ${responseTime}ms`,
      `Request Body: ${requestBody || 'N/A'}`,
      `Response Body: ${data.toString().substring(0, 200)}...`,
      '\n',
    ].join(' | ');

    // Append to log file
    fs.appendFile(logFilePath, logLine, (err) => {
      if (err) {
        console.error('[Logging Error]', err.message);
      }
    });
    console.log(logLine);
    res.send = send; // Restore original send
    return res.send.apply(this, arguments);
  };

  next();
};

module.exports = activityLogger;