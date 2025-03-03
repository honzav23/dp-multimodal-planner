# Use Node.js image for building
FROM node:20 AS FE

# Set working directory
WORKDIR /app/FE

COPY FE/package*.json .

RUN npm install

# Copy frontend files
COPY . .

#npm run build

# Expose frontend port
EXPOSE 5173

# Start Nginx
CMD ["npm", "start"]