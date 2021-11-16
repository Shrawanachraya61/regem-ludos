import { StringDecoder } from 'string_decoder';

export class LineDecoder {
  private stringDecoder: StringDecoder;
  private remaining: string;
  private lines: string[];

  constructor(encoding = 'utf8') {
    this.stringDecoder = new StringDecoder(encoding as any);
    this.remaining = '';
    this.lines = [];
  }

  public write(buffer: any): string[] {
    const result: string[] = [];
    const value = this.remaining
      ? this.remaining + this.stringDecoder.write(buffer)
      : this.stringDecoder.write(buffer);

    if (value.length < 1) {
      this.lines = this.lines.concat(value);
      return result;
    }
    let start = 0;
    let ch: number;
    while (
      start < value.length &&
      ((ch = value.charCodeAt(start)) === 13 || ch === 10)
    ) {
      start++;
    }
    let idx = start;
    while (idx < value.length) {
      ch = value.charCodeAt(idx);
      if (ch === 13 || ch === 10) {
        result.push(value.substring(start, idx));
        idx++;
        while (
          idx < value.length &&
          ((ch = value.charCodeAt(idx)) === 13 || ch === 10)
        ) {
          idx++;
        }
        start = idx;
      } else {
        idx++;
      }
    }
    this.remaining = start < value.length ? value.substr(start) : '';
    this.lines = this.lines.concat(result);
    return result;
  }

  public end(): string {
    if (this.remaining && this.remaining.length > 0) {
      this.lines = this.lines.concat(this.remaining);
    }
    return this.remaining;
  }

  public getLines(): string[] {
    return this.lines;
  }
}
