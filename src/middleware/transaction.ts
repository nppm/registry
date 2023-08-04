import { useComponent } from "@evio/visox";
import { useTransaction } from "@evio/visox-typeorm";
import { Context, Next } from "koa";
import { DataBaseServer } from "../server/database";

export async function Transaction(ctx: Context, next: Next) {
  const database = await useComponent(DataBaseServer);
  await useTransaction(database, async (runner, roll) => {
    ctx.state.conn = runner;
    ctx.state.roll = roll;
    await next();
  })
}