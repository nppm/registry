import type { Response } from '@evio/visox-http';
import type { HttpRequest } from './model/request';
import type { Instance } from 'koa-router-find-my-way';
import type { HTTPMethod } from 'find-my-way';
import type { Middleware } from 'koa';
import type { PathFunction } from 'path-to-regexp';

declare module '@evio/visox-http' {
  export type DefineResolver<T extends string = any> = (req: HttpRequest<T>) => Response | Promise<Response>;
  export function defineController<T extends string = any>(methods: HTTPMethod | HTTPMethod[], Middlewares: Middleware[], handler: DefineResolver<T>): {
    mount: (fwm: Instance) => Instance;
    unmount: (fwm: Instance) => void;
    create: (path: string) => void;
    toPath: PathFunction<Record<any, string>>;
  };
}

export type PackageDistTags = Record<string, string>;
export type PackageScripts = Record<string, string>;
export type PackageDependencies = Record<string, string>;
export type PackageUser = Record<string, string>;
export interface PackageRepository {
  type: string,
  url: string,
  directory?: string,
}
export interface PackageBugs {
  url: string,
}

export interface PackageAttachment {
  content_type: string,
  data: string,
  length: number
}

export interface PackageSignature {
  keyid: string,
  sig: string,
}

export interface PackageMaintainer {
  name: string,
  email: string,
}

export interface PackageManifest {
  name: string,
  version: string,
  description: string,
  main?: string,
  scripts?: PackageScripts,
  keywords?: string[],
  author?: PackageUser,
  bugs?: PackageBugs,
  homepage?: string,
  license?: string,
  deprecated?: string,
  repository?: PackageRepository,
  devDependencies?: PackageDependencies,
  dependencies?: PackageDependencies,
  peerDependencies?: PackageDependencies,
  optionDependencies?: PackageDependencies,
  readme?: string,
  readmeFilename?: string,
  _nodeVersion?: string,
  _npmVersion?: string,
  _npmOperationalInternal?: Record<string, string>,
  _npmUser?: PackageUser,
  dist?: {
    integrity?: string,
    shasum?: string,
    tarball?: string,
    fileCount?: number,
    "npm-signature": string,
    signatures?: PackageSignature[],
    unpackedSize?: number
  }
  [key: string]: any,
}

export interface PackageInComingProps {
  _id: string,
  name: string,
  description: string,
  "dist-tags": PackageDistTags,
  versions: Record<string, PackageManifest>,
  access: string,
  _attachments: Record<string, PackageAttachment>,
  maintainers?: PackageMaintainer[]
}

export interface PackageVersionsCompareProps {
  major: Map<number, {
    minor: Map<number, {
      patch: Map<number, Set<string>>,
      max: number,
    }>,
    max: number
  }>,
  max: number,
}