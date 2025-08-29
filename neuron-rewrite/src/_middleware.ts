 
// export async function middleware(request: NextRequest) {
//     const session = await auth.api.getSession({
//         headers: await headers()
//     })
 
//     // This itself is not secure, routes must be protected individually as well
//     if(!session) {
//         return NextResponse.redirect(new URL("/auth/signin", request.url));
//     }
 
//     return NextResponse.next();
// }
 
// export const config = {
//   runtime: "nodejs",
// //   matcher: ["/:path"],
// };