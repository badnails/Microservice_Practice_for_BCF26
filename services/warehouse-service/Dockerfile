FROM oven/bun:1.3.6

WORKDIR /app

# Copy package files
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile || bun install

# Copy source code
COPY . .

# Expose port
EXPOSE 3003

# Health check
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD bun -e "fetch('http://localhost:3003/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Run service
CMD ["bun", "run", "index.ts"]
