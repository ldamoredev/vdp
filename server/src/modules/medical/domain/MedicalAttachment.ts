/**
 * A file attached to a medical record. Holds only metadata + the opaque
 * `storageRef` pointing at the bytes in FileStorage — never the bytes
 * themselves. `storageRef` is internal and is not exposed on the API.
 */
export class MedicalAttachment {
  constructor(
    public id: string,
    public recordId: string,
    public filename: string,
    public mimeType: string,
    public sizeBytes: number,
    public storageRef: string,
    public createdAt: Date,
  ) {}

  toSnapshot(): MedicalAttachmentSnapshot {
    return {
      id: this.id,
      recordId: this.recordId,
      filename: this.filename,
      mimeType: this.mimeType,
      sizeBytes: this.sizeBytes,
      storageRef: this.storageRef,
      createdAt: this.createdAt,
    };
  }

  static fromSnapshot(s: MedicalAttachmentSnapshot): MedicalAttachment {
    return new MedicalAttachment(
      s.id,
      s.recordId,
      s.filename,
      s.mimeType,
      s.sizeBytes,
      s.storageRef,
      s.createdAt,
    );
  }
}

export type MedicalAttachmentSnapshot = {
  id: string;
  recordId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storageRef: string;
  createdAt: Date;
};

export type CreateAttachmentData = {
  readonly filename: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly storageRef: string;
};
