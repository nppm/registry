import { defineController } from "@evio/visox-http";
import { NPMError } from "../../../middleware/error";
import { PackageKeyWordService } from "../../../service/package.keyword";

/**
 * Commander npm search
 */
export default defineController('GET', [
  NPMError(404),
], async req => {
  const text = req.getQuery('text');
  const keywords = text ? text.split(' ').map(s => s.trim()) : [];
  const size = Number(req.getQuery('size'));
  const from = Number(req.getQuery('from', '0'));

  if (!keywords.length) return req.response({
    objects: []
  })

  const PackageKeyword = new PackageKeyWordService(req.conn);
  const objects = await PackageKeyword.search(from, size, ...keywords);
  return req.response({
    objects,
    time: new Date(),
  });
})