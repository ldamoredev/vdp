import { FileStorage } from "../../../common/base/storage/FileStorage";

export class FakeFileStorage extends FileStorage {
  readonly blobs = new Map<string, Buffer>();
  private seq = 0;

  async save(content: Buffer): Promise<string> {
    this.seq += 1;
    const ref = `blob-${this.seq}`;
    this.blobs.set(ref, content);
    return ref;
  }

  async read(ref: string): Promise<Buffer | null> {
    return this.blobs.get(ref) ?? null;
  }

  async delete(ref: string): Promise<void> {
    this.blobs.delete(ref);
  }
}
