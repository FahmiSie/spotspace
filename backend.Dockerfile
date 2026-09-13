FROM node:24-alpine
WORKDIR /app
RUN apk add --no-cache openssl

# Copy dependency files
COPY package*.json ./
# Install dependencies
RUN npm install

# Copy application source code
COPY . ./

# Generate Prisma Client
RUN npx prisma generate

# Build the NestJS application
RUN npm run build

# Expose port and start server
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
