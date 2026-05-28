# Stage 1: Build the React application
FROM public.ecr.aws/docker/library/node:20-alpine AS build
WORKDIR /app

# Build args (Vite los embebe en build time — NO sirven como env runtime).
# Los pasa Easypanel como "Build args", no como "Env vars".
ARG VITE_API_URL
ARG VITE_FORJA_MODE=elite
ARG VITE_WA_BOT_NUMBER

# Expose them as environment variables for the Vite build script
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_FORJA_MODE=$VITE_FORJA_MODE
ENV VITE_WA_BOT_NUMBER=$VITE_WA_BOT_NUMBER

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve the React application using Nginx
FROM public.ecr.aws/docker/library/nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
