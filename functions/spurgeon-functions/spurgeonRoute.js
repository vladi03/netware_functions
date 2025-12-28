import { onRequest } from "firebase-functions/v2/https";
import { checkCORS, cors, isAuthPasscode, createErrorResponse } from "./lib/utils/routeUtils.js";
import {
  searchSpurgeonIndexService
} from "./server/searchSpurgeonIndexService.js";


const runtimeOptions = {
  timeoutSeconds: Number(process.env.STARTMEETING_TIMEOUT_SECONDS ?? 540),
  memory: process.env.STARTMEETING_MEMORY ?? "256MiB",
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

export const searchSpurgeon = onRequest(runtimeOptions, withMiddleware(createHandler(searchSpurgeonIndexService)));

export default {
  searchSpurgeon
};
