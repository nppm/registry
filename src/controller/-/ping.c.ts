import { defineController } from "@evio/visox-http";

export default defineController('GET', [], req => req.response().status(200));