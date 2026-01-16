// "use client";

// import { FilePicker } from "@/components/primitives/file-picker";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { cn } from "@/lib/utils";
// import { useAuth } from "@/providers/client-auth-provider";
// import EditIcon from "@public/assets/icons/edit.svg";

// interface ProfilePictureUploadProps {
//   currentImage?: string;
//   name?: string;
//   disabled?: boolean;
//   userId?: string;
// }

// export function ProfilePictureUpload({
//   currentImage,
//   name,
//   disabled = false,
//   userId,
// }: ProfilePictureUploadProps) {
//   const { user } = useAuth();

//   const displayImage = currentImage ?? user?.image ?? undefined;
//   const displayName = name ?? user?.name ?? "User avatar";
//   const fallback = displayName.trim().slice(0, 2).toUpperCase();

//   return (
//     <div className="flex flex-col items-center gap-3">
//       <FilePicker
//         objectType="user"
//         id={userId ?? user?.id ?? ""}
//         disabled={disabled}
//         targetSize={120}
//         // onUploaded={(objectKey) => {
//         //   const base = process.env.NEXT_PUBLIC_MINIO_PUBLIC_URL!;
//         //   const bucket = process.env.NEXT_PUBLIC_MINIO_BUCKET!;
//         //   const imageUrl = `${base}/${bucket}/${objectKey}`;
//         //   clientApi.profile.update.mutate({ userId: userId ?? user!.id, imageUrl });
//         // }}
//       >
//         {/* Click target */}
//         <button
//           type="button"
//           aria-label="Upload profile picture"
//           aria-disabled={disabled}
//           disabled={disabled}
//           className={cn(
//             "group relative size-[120px] rounded-[25%] outline-none",
//             "focus-visible:ring-2 focus-visible:ring-primary",
//             disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
//           )}
//         >
//           <Avatar
//             className={cn(
//               "h-full w-full overflow-hidden rounded-[25%] border-2 transition-colors",
//               disabled ? "border-border" : "border-border group-hover:border-primary"
//             )}
//           >
//             <AvatarImage
//               src={displayImage}
//               alt={displayName}
//               className="h-full w-full rounded-[25%] object-cover"
//             />
//             <AvatarFallback className="rounded-[25%]">
//               {fallback}
//             </AvatarFallback>
//           </Avatar>

//           {/* Hover overlay */}
//           <div
//             className={cn(
//               "pointer-events-none absolute inset-0 grid place-items-center rounded-[25%]",
//               "bg-black/50 opacity-0 transition-opacity",
//               "group-hover:opacity-100"
//             )}
//           >
//             <EditIcon className="h-6 w-6 fill-white" aria-hidden="true" />
//           </div>
//         </button>
//       </FilePicker>
//     </div>
//   );
// }
