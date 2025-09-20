import { redirectToUserDefault } from "@/lib/auth/guard";

export default async function NotFound() {
  await redirectToUserDefault();
}
