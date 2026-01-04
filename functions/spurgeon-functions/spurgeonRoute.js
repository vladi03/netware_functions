import { onRequest } from "firebase-functions/v2/https";
import { checkCORS, cors, isAuthPasscode, createErrorResponse } from "./lib/utils/routeUtils.js";
import dotenv from "dotenv";

import { searchSpurgeonIndexService } from "./server/searchSpurgeonIndexService.js";
import { restateSpurgeonQuestionService } from "./server/restateSpurgeonQuestionService.js";
import { generateSpurgeonDevotionalService } from "./server/generateSpurgeonDevotionalService.js";
import { chatSpurgeonService } from "./server/chatSpurgeonService.js";

dotenv.config();


const runtimeOptions = {
  timeoutSeconds: Number(process.env.SPURGEON_TIMEOUT_SECONDS ?? 540),
  memory: process.env.SPURGEON_MEMORY ?? "256MiB",
  minInstances: Number(process.env.MIN_INSTANCES ?? 0),
};

const runtimeOptionsBig = {
  timeoutSeconds: Number(process.env.SPURGEON_TIMEOUT_SECONDS ?? 540),
  memory: process.env.SPURGEON_MEMORY_BIG ?? "512MiB",
  minInstances: Number(process.env.MIN_INSTANCES ?? 0),
};

const buildRequestData = (request) => ({
  body: request.body,
  query: request.query,
  headers: request.headers,
});

const createHandler = (serviceCall) => async (request, response) => {
  try {
    const data = await serviceCall(buildRequestData(request));
    response.status(200).json(data);
  } catch (error) {
    const { status, body } = createErrorResponse(error);
    response.status(status).json(body);
  }
};

const withMiddleware = (handler) => async (request, response) => {
  await checkCORS(request, response, async () =>
    isAuthPasscode(request, response, async () => cors(request, response, handler)),
  );
};

//Wire up and Exported Cloud Functions
export const searchSpurgeon = onRequest(
  runtimeOptionsBig, 
  withMiddleware(createHandler(searchSpurgeonIndexService)));
export const restateSpurgeonQuestion = onRequest(
  runtimeOptions,
  withMiddleware(createHandler(restateSpurgeonQuestionService)),
);
export const generateSpurgeonDevotional = onRequest(
  runtimeOptions,
  withMiddleware(createHandler(generateSpurgeonDevotionalService)),
);
export const chat = onRequest(
  runtimeOptionsBig,
  withMiddleware(createHandler(chatSpurgeonService)),
);

export default {
  searchSpurgeon,
  restateSpurgeonQuestion,
  generateSpurgeonDevotional,
  chat,
};
