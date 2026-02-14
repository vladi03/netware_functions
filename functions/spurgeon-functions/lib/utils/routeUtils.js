const normalizeHeaderValue = (value) => {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
};

export const checkCORS = async (request, response, next) => {
  response.set("Access-Control-Allow-Origin", "*");
  response.set(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );
  response.set("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,PATCH,OPTIONS");
  response.set("Access-Control-Max-Age", "86400");

  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }

  await next(request, response);
};

export const cors = async (request, response, next) => {
  response.set("Access-Control-Allow-Origin", "*");
  response.set("Access-Control-Allow-Credentials", "true");

  if (request.method === "OPTIONS") {
    response.set(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    response.set("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,PATCH,OPTIONS");
    response.status(204).send("");
    return;
  }

  await next(request, response);
};

export const isAuthPasscode = async (request, response, next) => {
  const passcode = normalizeHeaderValue(process.env.PASSCODES_ADMIN);
  if (!passcode) {
    console.error("PASSCODES_ADMIN is not configured for StartMeeting routes");
    response.status(500).json({ error: "Passcode is not configured" });
    return;
  }

  const rawHeader = normalizeHeaderValue(request.headers?.authorization);
  const token = rawHeader.startsWith("Bearer ") ? rawHeader.slice(7).trim() : rawHeader;

  if (!token) {
    response.status(401).json({ error: "Authorization header with passcode is required" });
    return;
  }

  if (token !== passcode) {
    response.status(401).json({ error: "Invalid passcode" });
    return;
  }

  await next(request, response);
};

// Helper function to log errors with proper ERROR severity in Cloud Logging
// This ensures that error logs are searchable by severity="ERROR" in Cloud Logging
export const logError = (message, error, additionalData = {}) => {
    console.error(JSON.stringify({
        severity: 'ERROR',
        message: message,
        error: {
            message: error.message,
            stack: error.stack,
            name: error.name
        },
        ...additionalData,
        timestamp: new Date().toISOString()
    }));
};

// Helper function to log warnings with proper WARNING severity
export const logWarning = (message, additionalData = {}) => {
    console.warn(JSON.stringify({
        severity: 'WARNING',
        message: message,
        ...additionalData,
        timestamp: new Date().toISOString()
    }));
};

// Helper function to log info with proper INFO severity
export const logInfo = (message, additionalData = {}) => {
    console.log(JSON.stringify({
        severity: 'INFO',
        message: message,
        ...additionalData,
        timestamp: new Date().toISOString()
    }));
};


export const createErrorResponse = (error) => {
  if (error instanceof ValidationError) {
    return {
      status: error.status ?? 400,
      body: { error: error.message },
    };
  }

  if (error instanceof ExternalApiError) {
    console.error(error.message, { status: error.status, details: error.details });
    return {
      status: error.status || 502,
      body: { error: error.message, details: error.details },
    };
  }

  if (error instanceof ConfigurationError) {
    console.error(error.message);
    return {
      status: 500,
      body: { error: error.message },
    };
  }

  console.error("Unexpected error", error);
  return {
    status: 500,
    body: { error: "Internal server error" },
  };
};

export class ValidationError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "ValidationError";
    this.status = status;
  }
}

export class ConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConfigurationError";
  }
}

export class ExternalApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "ExternalApiError";
    this.status = status;
    this.details = details;
  }
}
