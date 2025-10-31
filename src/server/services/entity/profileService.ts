// import { type Drizzle } from "@/server/db";
// import { NeuronError, NeuronErrorCodes } from "@/server/errors/neuron-error";
// import { user } from "../../db/schema/user";
// import { eq } from "drizzle-orm";
// import * as Minio from "minio";



// export class ProfileService {
//   private readonly db: Drizzle;
//   private readonly minio: Minio.Client;
//   private readonly expiration: number = 60 * 60; // 1 hour
//   private readonly fileName: string = "profile-picture";
//   private readonly endpoint: string = process.env.MINIO_ENDPOINT ?? "http://localhost:9000";
//   private readonly bucket: string = process.env.MINIO_BUCKET ?? "neuron";


//   constructor(db: Drizzle) {
//     this.db = db;
//     this.minio = new Minio.Client({ 
//       // TODO: CHANGE on deploy
//       endPoint: "localhost",
//       port: 9000,
//       useSSL: process.env.MINIO_USE_SSL === "true",
//       accessKey: process.env.MINIO_ROOT_USER,
//       secretKey: process.env.MINIO_ROOT_PASSWORD,
//       },
//     );
//   }

//   async getPresignedUrl(userId: string, fileExtension: string): Promise<string> {
//     try {
//       const url = await this.minio.presignedPutObject(
//         this.bucket,
//         `user_${userId}/${this.fileName}.${fileExtension}`,
//         this.expiration
//       );
//       return url;
//     } catch (err) {
//       console.error("Error getting presigned PUT URL:", err);
//       throw new NeuronError("Error getting presigned PUT URL", NeuronErrorCodes.INTERNAL_SERVER_ERROR);
//     }
//   }

//   async updateProfileImage(userId: string, imageUrl: string): Promise<void> {
//     const accessUrl = `${this.endpoint}/${this.bucket}/${imageUrl}`;
//     await this.db.update(user).set({ image: accessUrl }).where(eq(user.id, userId));
//   }


// }