# Stage 1: Build the React application
FROM public.ecr.aws/docker/library/node:20-alpine AS build
WORKDIR /app

# Declare build arguments (Easypanel will pass these during build time)
ARG VITE_API_URL
ARG VITE_USER_ID

# Expose them as environment variables for the Vite build script
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_USER_ID=$VITE_USER_ID

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve the React application using Nginx
FROM public.ecr.aws/docker/library/nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
