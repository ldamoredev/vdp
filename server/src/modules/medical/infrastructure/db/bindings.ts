import { Database } from "../../../common/base/db/Database";
import { RepositoryRegistry } from "../../../common/base/db/RepositoryRegistry";
import { FileStorage } from "../../../common/base/storage/FileStorage";
import { PostgresFileStorage } from "../../../common/infrastructure/storage/PostgresFileStorage";
import { MedicalRepository } from "../../domain/MedicalRepository";
import { DrizzleMedicalRepository } from "./DrizzleMedicalRepository";

export function registerMedicalRepositories(registry: RepositoryRegistry, db: Database): void {
  registry.register(MedicalRepository, () => new DrizzleMedicalRepository(db));
  // FileStorage is a cross-cutting blob seam; medical is its only consumer for
  // now, so it is composed here. Move to a dedicated bindings file if a second
  // module needs it.
  registry.register(FileStorage, () => new PostgresFileStorage(db));
}
