# CI/CD Setup Guide

## Overview

This document describes how to set up the CI/CD pipeline for the microservices architecture.

---

## GitHub Secrets Configuration

Navigate to your GitHub repository: **Settings → Secrets and variables → Actions**

### Required Secrets (for deployment)

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `VPS_HOST` | Your VPS IP address or domain | `192.168.1.100` or `app.example.com` |
| `VPS_USERNAME` | SSH username for VPS access | `ubuntu` or `root` |
| `VPS_SSH_KEY` | Private SSH key for authentication | Full contents of `~/.ssh/id_rsa` |
| `VPS_PROJECT_PATH` | Absolute path to project on VPS | `/home/ubuntu/bwfc` |

### Optional Secrets (for notifications)

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `VPS_PORT` | SSH port (defaults to 22) | Usually `22` |
| `TG_TOKEN` | Telegram bot token | Create bot via [@BotFather](https://t.me/botfather) |
| `TG_CHAT_ID` | Telegram chat/group ID | Use [@userinfobot](https://t.me/userinfobot) |

---

## Generating SSH Keys

### On your local machine:

```bash
# Generate new SSH key pair
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions_key

# Copy public key to VPS
ssh-copy-id -i ~/.ssh/github_actions_key.pub user@your-vps-ip

# Display private key (copy this to GitHub secret VPS_SSH_KEY)
cat ~/.ssh/github_actions_key
```

### Add to GitHub:
1. Go to repository → Settings → Secrets → New repository secret
2. Name: `VPS_SSH_KEY`
3. Value: Paste the entire private key (including `-----BEGIN` and `-----END` lines)

---

## VPS Setup

### Prerequisites

Your VPS must have:

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Install Git
sudo apt-get install git

# Clone your repository
cd ~
git clone https://github.com/your-username/bwfc.git
cd bwfc

# Test initial deployment
docker compose build --parallel
docker compose up -d
```

### Firewall Configuration

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow application port (if not using reverse proxy)
sudo ufw allow 3000/tcp

# Enable firewall
sudo ufw enable
```

---

## CI/CD Pipeline Stages

### 1. **Setup** (Parallel)
- Installs Bun and dependencies for all 7 services
- Caches `node_modules` per service
- Uses matrix strategy for parallel execution

### 2. **Lint** (Parallel)
- Runs linting for each service (if configured)
- Continues on error to not block pipeline

### 3. **Test** (Sequential)
- Spins up full Docker Compose stack (7 services + 5 databases)
- Waits for services to be healthy
- Runs integration tests using Bun test
- Cleans up containers after tests

### 4. **Build** (Parallel)
- Builds Docker images for all 7 services
- Uses GitHub Actions cache for faster builds
- Runs Trivy security scans on each image
- Uploads security reports to GitHub Security tab

### 5. **Deploy** (Sequential) - Main branch only
- SSH into VPS
- Pulls latest code
- Rebuilds and restarts all containers
- Verifies deployment health
- Cleans up old images

### 6. **Notify** (Always runs)
- Sends Telegram notification with results
- Provides summary in GitHub Actions UI

---

## Pipeline Triggers

### Automatic Triggers

```yaml
# Runs on:
- Push to main/master branch (deploys)
- Pull requests to main/master (tests only)
```

### Manual Trigger

Add this to enable manual runs:

```yaml
on:
  workflow_dispatch:  # Enables manual trigger
```

---

## Key Differences from Previous Pipeline

| Aspect | Previous (Monolith) | Current (Microservices) |
|--------|---------------------|-------------------------|
| **Runtime** | Node.js 24 | Bun (latest) |
| **Package Manager** | npm | bun |
| **Lock File** | package-lock.json | bun.lockb |
| **Services** | 1 service | 7 services |
| **Testing** | Unit tests | Integration tests with Docker Compose |
| **Docker Images** | 1 image | 7 images |
| **Build Strategy** | Single build | Parallel matrix builds |
| **Cache Strategy** | Single cache | Per-service caches |
| **Deployment** | Single container | Multi-container orchestration |
| **Health Checks** | Single endpoint | Multiple databases + Traefik gateway |

---

## Monitoring Pipeline Execution

### GitHub Actions UI

1. Navigate to repository → **Actions** tab
2. View workflow runs and their status
3. Click on any run to see detailed logs
4. Check **Summary** for test results and deployment info

### Security Scanning Results

1. Navigate to repository → **Security** tab
2. Click **Code scanning alerts**
3. View Trivy findings for each service

---

## Local Testing (Before Pushing)

### Run tests locally:

```bash
cd server
bun test
```

### Build all Docker images locally:

```bash
docker compose build --parallel
```

### Test full stack:

```bash
docker compose up -d
# Wait for services to start
sleep 20
# Run integration tests
cd server && bun test
# Check logs
docker compose logs
# Cleanup
docker compose down -v
```

---

## Troubleshooting

### Tests Failing in CI

```bash
# Check if services started properly
docker compose ps

# Check service logs
docker compose logs location-service
docker compose logs traefik

# Verify database connectivity
docker compose exec locations-db pg_isready -U postgres
```

### Build Failures

```bash
# Common issues:
# 1. Missing bun.lockb - run: bun install
# 2. TypeScript errors - run: bun run build in each service
# 3. Dockerfile syntax - test locally: docker build -t test services/location-service
```

### Deployment Failures

```bash
# SSH into VPS manually
ssh -i ~/.ssh/github_actions_key user@vps-ip

# Check Docker daemon
sudo systemctl status docker

# Check disk space
df -h

# Check memory
free -h

# View container status
docker compose ps

# View logs
docker compose logs --tail=100
```

### Cache Issues

If builds are slow or failing:

1. Go to repository → Actions → Caches
2. Delete old caches
3. Re-run workflow

---

## Optimization Tips

### Faster Builds

1. **Enable BuildKit caching**: Already configured via `cache-from/cache-to`
2. **Use multi-stage builds**: Consider for production images
3. **Reduce image size**: Use Alpine base images where possible

### Faster Tests

1. **Parallel test execution**: Already using parallel setup
2. **Skip unnecessary services**: Only start services needed for tests
3. **Use test database snapshots**: Restore instead of migrating

### Cost Optimization

1. **Matrix job limits**: Reduce parallel jobs if hitting runner limits
2. **Conditional deployments**: Only deploy on main branch (already configured)
3. **Cache expiration**: Clean old caches regularly

---

## Security Best Practices

### ✅ Currently Implemented

- [x] SSH key authentication (no passwords)
- [x] Trivy container scanning for vulnerabilities
- [x] SARIF upload to GitHub Security
- [x] Secrets management via GitHub Secrets
- [x] No hardcoded credentials

### 📋 Recommended Additions

- [ ] Enable GitHub branch protection rules
- [ ] Require PR reviews before merge
- [ ] Enable dependency scanning (Dependabot)
- [ ] Add SAST scanning (CodeQL)
- [ ] Implement secrets scanning
- [ ] Add API authentication/authorization
- [ ] Enable Traefik SSL/TLS certificates

---

## GitHub Settings Recommendations

### Branch Protection Rules

**Settings → Branches → Add rule** for `main`:

- [x] Require pull request reviews before merging
- [x] Require status checks to pass before merging
  - Select: `test`, `build`
- [x] Require branches to be up to date before merging
- [x] Include administrators

### Dependabot Alerts

**Settings → Security & analysis**:

- [x] Enable Dependabot alerts
- [x] Enable Dependabot security updates

### Code Scanning

**Settings → Security & analysis**:

- [x] Enable code scanning (CodeQL)

---

## Example Telegram Bot Setup

### 1. Create Bot

1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot`
3. Follow prompts to name your bot
4. Copy the token (looks like `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Get Chat ID

**Option A: Personal Messages**
1. Message [@userinfobot](https://t.me/userinfobot)
2. Copy your user ID

**Option B: Group Chat**
1. Add your bot to the group
2. Send a message in the group
3. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Find `"chat":{"id":-123456789}` in the response

### 3. Add to GitHub Secrets

- `TG_TOKEN`: Your bot token
- `TG_CHAT_ID`: Your chat/user ID

---

## Summary

### Setup Checklist

- [ ] Generate SSH keys
- [ ] Add SSH public key to VPS
- [ ] Add GitHub secrets (VPS_HOST, VPS_USERNAME, VPS_SSH_KEY, VPS_PROJECT_PATH)
- [ ] Configure VPS (Docker, Docker Compose, Git)
- [ ] Clone repository on VPS
- [ ] Test manual deployment on VPS
- [ ] (Optional) Set up Telegram bot
- [ ] (Optional) Add TG_TOKEN and TG_CHAT_ID secrets
- [ ] Push code to trigger first CI/CD run
- [ ] Monitor Actions tab for results
- [ ] Configure branch protection rules

### After Setup

Your CI/CD pipeline will:
- ✅ Automatically test PRs before merge
- ✅ Build and scan all 7 microservices
- ✅ Deploy to VPS on main branch push
- ✅ Send notifications on completion
- ✅ Provide detailed summaries in GitHub UI

**Estimated pipeline runtime**: 5-8 minutes (with caching)
