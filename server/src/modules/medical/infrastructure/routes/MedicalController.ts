import {
  attachmentIdParamsSchema,
  createMedicalRecordSchema,
  medicalRecordIdParamsSchema,
  updateMedicalRecordSchema,
} from "@vdp/shared";
import { CQBus } from "@nbottarini/cqbus";
import { z } from "zod";

import { HttpController, RouteRegister } from "../../../common/http/HttpController";
import { NotFoundHttpError, ValidationHttpError } from "../../../common/http/errors";
import { sendCreated } from "../../../common/http/responses";
import { RouteContextHandler } from "../../../common/http/routes";
import { CreateMedicalRecordCommand } from "../../app/CreateMedicalRecordCommand";
import { DeleteAttachmentCommand } from "../../app/DeleteAttachmentCommand";
import { DeleteMedicalRecordCommand } from "../../app/DeleteMedicalRecordCommand";
import { DownloadAttachmentQuery } from "../../app/DownloadAttachmentQuery";
import { GetMedicalRecordsQuery } from "../../app/GetMedicalRecordsQuery";
import { UpdateMedicalRecordCommand } from "../../app/UpdateMedicalRecordCommand";
import { UploadAttachmentCommand } from "../../app/UploadAttachmentCommand";

type RecordIdParams = z.infer<typeof medicalRecordIdParamsSchema>;
type AttachmentParams = z.infer<typeof attachmentIdParamsSchema>;
type CreateRecordBody = z.input<typeof createMedicalRecordSchema>;
type UpdateRecordBody = z.input<typeof updateMedicalRecordSchema>;

export class MedicalController extends HttpController {
  readonly prefix = "/api/v1/medical";

  constructor(private readonly bus: CQBus) {
    super();
  }

  registerRoutes(routes: RouteRegister): void {
    routes
      .get("/records", {}, this.listRecords)
      .post("/records", { body: createMedicalRecordSchema }, this.createRecord)
      .put("/records/:id", { params: medicalRecordIdParamsSchema, body: updateMedicalRecordSchema }, this.updateRecord)
      .delete("/records/:id", { params: medicalRecordIdParamsSchema }, this.deleteRecord)
      // multipart upload — no body schema so Fastify hands us the stream
      .post("/records/:id/attachments", { params: medicalRecordIdParamsSchema }, this.uploadAttachment)
      .get(
        "/records/:id/attachments/:attachmentId/download",
        { params: attachmentIdParamsSchema },
        this.downloadAttachment,
      )
      .delete(
        "/records/:id/attachments/:attachmentId",
        { params: attachmentIdParamsSchema },
        this.deleteAttachment,
      );
  }

  private readonly listRecords: RouteContextHandler<undefined, undefined, undefined> = async ({ reply }) => {
    return reply.send(await this.bus.execute(new GetMedicalRecordsQuery()));
  };

  private readonly createRecord: RouteContextHandler<undefined, undefined, CreateRecordBody> = async ({
    body,
    reply,
  }) => {
    const record = await this.bus.execute(new CreateMedicalRecordCommand(body!));
    return sendCreated(reply, record);
  };

  private readonly updateRecord: RouteContextHandler<RecordIdParams, undefined, UpdateRecordBody> = async ({
    params,
    body,
    reply,
  }) => {
    const record = await this.bus.execute(new UpdateMedicalRecordCommand(params!.id, body!));
    return reply.send(record);
  };

  private readonly deleteRecord: RouteContextHandler<RecordIdParams, undefined, undefined> = async ({
    params,
    reply,
  }) => {
    await this.bus.execute(new DeleteMedicalRecordCommand(params!.id));
    return reply.status(204).send();
  };

  private readonly uploadAttachment: RouteContextHandler<RecordIdParams, undefined, undefined> = async ({
    request,
    params,
    reply,
  }) => {
    const file = await request.file();
    if (!file) throw new ValidationHttpError("No se adjuntó ningún archivo.");

    const content = await file.toBuffer();
    // @fastify/multipart marks the stream truncated when it hits the byte limit.
    if (file.file.truncated) {
      throw new ValidationHttpError("El archivo supera el máximo de 10MB.");
    }

    const attachment = await this.bus.execute(
      new UploadAttachmentCommand(params!.id, file.filename, content),
    );
    return sendCreated(reply, attachment);
  };

  private readonly downloadAttachment: RouteContextHandler<AttachmentParams, undefined, undefined> = async ({
    params,
    reply,
  }) => {
    const result = await this.bus.execute(new DownloadAttachmentQuery(params!.attachmentId));
    if (!result) throw new NotFoundHttpError("Adjunto no encontrado.");

    reply.header("Content-Type", result.mimeType);
    reply.header("Content-Length", result.sizeBytes);
    // inline so the browser can preview PDFs/images; nosniff so it cannot
    // reinterpret the bytes as a different (e.g. executable/HTML) type.
    reply.header("Content-Disposition", `inline; filename="${result.filename}"`);
    reply.header("X-Content-Type-Options", "nosniff");
    return reply.send(result.content);
  };

  private readonly deleteAttachment: RouteContextHandler<AttachmentParams, undefined, undefined> = async ({
    params,
    reply,
  }) => {
    await this.bus.execute(new DeleteAttachmentCommand(params!.attachmentId));
    return reply.status(204).send();
  };
}
