import { defineController } from "@evio/visox-http";

export default defineController('GET', [], req => req.response({
  ok: true,
  timestamp: Date.now(),
}));