# Stage 1: Build the static site with RsBuild
FROM rust:latest AS builder
WORKDIR /app

# Copy your project files into the container
COPY . .

# (Optional) Install RsBuild if it isn’t already available in your project
RUN cargo install rsbuild

# Build your static site (this command should generate your build files)
RUN rsbuild build

# Stage 2: Serve the built static site using Nginx
FROM nginx:stable-alpine

# Copy the built files from the builder stage into Nginx's default directory
# Adjust the path (/app/build/) if your build output folder is different
COPY --from=builder /app/build/ /usr/share/nginx/html/

# (Optional) Copy a custom Nginx config to support client-side routing (e.g., for React Router)
# Uncomment the next two lines if you have a custom nginx.conf file in your project root
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]