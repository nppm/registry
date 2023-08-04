import { resolve } from 'node:path';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { URL } from 'node:url';
import { spawn } from 'node:child_process';

interface NPPM_RC {
  registries: string[],
  checked: string,
  scopes: string[],
}

export class Registry {
  private readonly nppmrc = resolve(process.env.HOME, 'NPPM.json');
  private readonly value = Registry.getDefaultValue();
  constructor() {
    if (existsSync(this.nppmrc)) {
      this.value = JSON.parse(readFileSync(this.nppmrc, 'utf8'));
    }
  }

  get current() {
    return this.value.checked;
  }

  get scopes() {
    return this.value.scopes
  }

  public save() {
    return writeFileSync(this.nppmrc, JSON.stringify(this.value), 'utf8');
  }

  public remove(uri: string) {
    const index = this.value.registries.indexOf(uri);
    if (!this.value.registries.includes(uri) || index === -1) {
      throw new Error('No such registry in cachestore');
    }

    this.value.registries.splice(index, 1);
    return this;
  }

  public use(uri: string, scopes: string[]) {
    if (!this.value.registries.includes(uri)) {
      throw new Error('No such registry in cachestore');
    }
    this.value.checked = uri;
    this.value.scopes = scopes;
    return this;
  }

  public add(uri: string, checked?: boolean) {
    if (!/^http(s?)\:\/\/[0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*(:(0-9)*)*(\/?)([a-zA-Z0-9\-\.\?\,\'\/\\\+&amp;%$#_]*)?$/.test(uri)) {
      throw new TypeError('Invalid URI string.');
    }
    const obj = new URL(uri);
    const exists = this.value.registries.includes(uri) || this.value.registries.some(url => {
      const _obj = new URL(url);
      if (
        _obj.protocol === obj.protocol &&
        _obj.host === obj.host &&
        _obj.hostname === obj.hostname &&
        _obj.port === obj.port &&
        _obj.pathname === obj.pathname
      ) return true;
    })

    if (exists) throw new Error('URI exists.')

    this.value.registries.push(uri);
    if (!this.value.checked || checked) {
      this.value.checked = uri;
    }

    return obj;
  }

  public list() {
    return this.value.registries;
  }

  static getDefaultValue(): NPPM_RC {
    return {
      registries: ['https://registry.npmmirror.com/'],
      checked: 'https://registry.npmmirror.com/',
      scopes: [],
    }
  }

  public async execScope(uri: string, ...scopes: string[]) {
    for (let i = 0; i < scopes.length; i++) {
      const scope = scopes[i];
      await new Promise<void>((resolve, reject) => {
        const childprocess = spawn('npm', ['config', 'set', scope + ':registry', uri], {
          env: process.env,
          cwd: process.cwd(),
          stdio: 'inherit'
        });
        childprocess.on('exit', code => {
          if (code === 0) return resolve();
          return reject(new Error(`exit with code ${code}`));
        })
      })
    }
  }
}