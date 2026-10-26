# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency definitions
COPY frontend/package.json ./

# Install npm dependencies
RUN npm install

# Copy application source code
COPY frontend/ ./

# Compile production bundle
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

# Copy built assets to Nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
