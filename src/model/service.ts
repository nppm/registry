import { useApplication } from "@evio/visox";
import { Service, TypeORMConnection } from "@evio/visox-typeorm-ioredis-service";
import { RedisServer } from "../server/redis";
import { configs } from "../configs";

export class MergedService extends Service {
  constructor(conn: TypeORMConnection) {
    super({
      conn,
      redis: useApplication(RedisServer),
      key: key => configs.toPath(key)
    })
  }
}

export class TypeORMService extends Service {
  constructor(conn: TypeORMConnection) {
    super({
      conn,
    })
  }
}

export class IORedisService extends Service {
  constructor() {
    super({
      redis: useApplication(RedisServer),
      key: key => configs.toPath(key)
    })
  }
}