import axios from 'axios';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Authorization header interceptor
apiClient.interceptors.request.use(
  (config) => {
    const passcode = import.meta.env.VITE_PASSCODES_ADMIN;
    if (passcode) {
      config.headers.Authorization = `Bearer ${passcode}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API service methods

/**
 * Restates a question into a 19th-century Spurgeon-style retrieval query
 * @param {string} question - The original question
 * @param {string} model - The model to use (default: "gpt-4o-mini")
 * @returns {Promise} Response with restated question
 */
export const restateQuestion = async (question, model = 'gpt-4o-mini') => {
  const response = await apiClient.post('/spurgeonFunctions-restateSpurgeonQuestion', {
    question,
    model,
  });
  return response.data;
};

/**
 * Searches the Spurgeon S3 vectors index with an embedding
 * @param {string} question - The search question
 * @param {number} topK - Number of results to return (default: 5)
 * @param {number} contextChars - Characters of context (default: 200)
 * @param {string} model - Embedding model (default: "text-embedding-3-small")
 * @returns {Promise} Search results with excerpts
 */
export const searchSpurgeon = async (
  question,
  topK = 5,
  contextChars = 200,
  model = 'text-embedding-3-small'
) => {
  const response = await apiClient.post('/spurgeonFunctions-searchSpurgeon', {
    question,
    topK,
    contextChars,
    model,
    region: 'us-east-2',
    bucket: 'spurgeon',
    index: 'sermon-bodies-v1',
  });
  return response.data;
};

/**
 * Generates a 500-word devotional from retrieved excerpts
 * @param {string} question - The devotional question
 * @param {Array} excerpts - Array of sermon excerpts
 * @param {string} model - The model to use (default: "gpt-4o-mini")
 * @returns {Promise} Generated devotional
 */
export const generateDevotional = async (
  question,
  excerpts,
  model = 'gpt-4o-mini'
) => {
  const response = await apiClient.post('/spurgeonFunctions-generateSpurgeonDevotional', {
    question,
    excerpts,
    model,
  });
  return response.data;
};

/**
 * Chat endpoint that speaks in Spurgeon's voice with MCP tool orchestration
 * @param {string} message - The user's message
 * @param {Array} history - Chat history array
 * @param {string} model - The model to use (default: "gpt-4o-mini")
 * @param {number} temperature - Response temperature (default: 0.7)
 * @returns {Promise} Chat response with tool runs
 */
export const chat = async (
  message,
  history = [],
  model = 'gpt-4o-mini',
  temperature = 0.7
) => {
  const response = await apiClient.post('/spurgeonFunctions-chat', {
    message,
    history,
    model,
    temperature,
  });
  return response.data;
};

export default {
  restateQuestion,
  searchSpurgeon,
  generateDevotional,
  chat,
};
