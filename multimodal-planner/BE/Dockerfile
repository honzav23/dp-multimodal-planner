# Use official Deno image
FROM denoland/deno:latest AS BE

# Set working directory
WORKDIR /app/BE

# Copy backend files
COPY BE .

# Install Python dependencies
RUN apt-get update && apt-get install -y python3 python3-pip \
    && pip install -r requirements.txt --break-system-packages

# Expose backend port
EXPOSE 8000

# Run the Deno server
CMD ["deno", "task", "dev"]