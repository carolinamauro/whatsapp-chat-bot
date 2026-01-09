# GitHub Actions Workflows

This directory contains GitHub Actions workflows for CI/CD automation.

## Workflows

### 1. CI - Continuous Integration (`ci.yml`)

**Triggers:** 
- Pull requests to `main` or `test` branches
- Pushes to `main` branch

**What it does:**
- Installs dependencies
- Runs ESLint
- Runs TypeScript build
- Runs tests
- Performs security audit
- Uploads build artifacts

### 2. Deploy to Test (`deploy-test.yml`)

**Triggers:**
- Pushes to `test` branch

**What it does:**
- Runs full CI pipeline (lint, build, test)
- Deploys to Test environment on Render
- Automatically deploys when code is pushed to `test` branch

### 3. Deploy to Production (`deploy-prod.yml`)

**Triggers:**
- Tags matching pattern `v*.*.*` (e.g., v1.0.0, v2.1.3)

**What it does:**
- Runs full CI pipeline (lint, build, test)
- Deploys to Production environment on Render
- Creates a GitHub Release with deployment info
- Only triggers when you create a version tag

## Setup Instructions

### 1. Configure Render Deploy Hooks

#### For Test Environment:
1. Go to your Render dashboard → Select your Test service
2. Navigate to Settings → Deploy Hook
3. Copy the Deploy Hook URL
4. Go to GitHub repository → Settings → Secrets and variables → Actions
5. Create new repository secret:
   - Name: `RENDER_DEPLOY_HOOK_TEST`
   - Value: [Paste your Test Deploy Hook URL]
6. Create another secret:
   - Name: `RENDER_TEST_URL`
   - Value: Your test service URL (e.g., `https://your-app-test.onrender.com`)

#### For Production Environment:
1. Go to your Render dashboard → Select your Production service
2. Navigate to Settings → Deploy Hook
3. Copy the Deploy Hook URL
4. Go to GitHub repository → Settings → Secrets and variables → Actions
5. Create new repository secret:
   - Name: `RENDER_DEPLOY_HOOK_PROD`
   - Value: [Paste your Production Deploy Hook URL]
6. Create another secret:
   - Name: `RENDER_PROD_URL`
   - Value: Your production service URL (e.g., `https://your-app.onrender.com`)

### 2. Configure Render Services

#### Test Environment Service:
- **Name:** whatsapp-bot-test
- **Branch:** test
- **Build Command:** `npm install && npm run build`
- **Start Command:** `node dist/index.js`
- **Environment Variables:**
  - Add all required env vars from `.env.example`
  - Use test Salesforce credentials
  - Configure test RabbitMQ instance

#### Production Environment Service:
- **Name:** whatsapp-bot-prod
- **Branch:** main (or deploy via manual trigger)
- **Build Command:** `npm install && npm run build`
- **Start Command:** `node dist/index.js`
- **Environment Variables:**
  - Add all required env vars from `.env.example`
  - Use production Salesforce credentials
  - Configure production RabbitMQ instance

### 3. Create GitHub Environment (Optional but Recommended)

For Production deployments with protection rules:

1. Go to repository Settings → Environments
2. Create environment named `production`
3. Add protection rules:
   - Required reviewers (optional)
   - Wait timer (optional)
   - Deployment branches: Only tags

## Usage

### Deploy to Test
```bash
# Make your changes
git add .
git commit -m "Your changes"
git push origin test

# GitHub Actions will automatically:
# 1. Run tests
# 2. Deploy to Test environment on Render
```

### Deploy to Production
```bash
# Make sure your main branch is ready
git checkout main
git pull origin main

# Create and push a version tag
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions will automatically:
# 1. Run tests
# 2. Deploy to Production environment on Render
# 3. Create a GitHub Release
```

### Version Tag Format
Use semantic versioning: `vMAJOR.MINOR.PATCH`
- **MAJOR:** Breaking changes
- **MINOR:** New features (backward compatible)
- **PATCH:** Bug fixes

Examples:
- `v1.0.0` - Initial release
- `v1.1.0` - Added new feature
- `v1.1.1` - Bug fix
- `v2.0.0` - Breaking change

## Monitoring Deployments

### View Workflow Runs
1. Go to repository → Actions tab
2. Select workflow to view runs
3. Click on a run to see detailed logs

### Check Deployment Status
- **Test:** Automatically shown in workflow logs
- **Production:** Check GitHub Releases page

### Rollback if Needed
1. Go to Render dashboard
2. Select your service
3. Navigate to Deploys tab
4. Click "Rollback" on a previous successful deploy

Or create a new tag pointing to an earlier commit:
```bash
git tag -f v1.0.0 <commit-hash>
git push -f origin v1.0.0
```

## Troubleshooting

### Deployment fails on Render
- Check Render logs for errors
- Verify environment variables are set
- Ensure RabbitMQ is accessible
- Check Salesforce credentials

### Tests fail in CI
- Run tests locally first: `npm test`
- Check if all dependencies are in package.json
- Verify Node.js version compatibility

### Deploy hook not triggering
- Verify secret names match exactly
- Check Deploy Hook URL is correct
- Ensure Render service is active

## Best Practices

1. **Always test in Test environment first**
   ```bash
   git push origin test
   # Wait and verify
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Use meaningful commit messages**
   - Helps track changes in deployments

3. **Keep version tags sequential**
   - Don't skip versions

4. **Monitor production deployments**
   - Check logs immediately after deployment
   - Test critical functionality

5. **Set up notifications**
   - Configure GitHub Actions notifications
   - Set up Render deployment notifications

## Environment Variables Required

Both Test and Production Render services need:

```env
SALESFORCE_USERNAME=...
SALESFORCE_PASSWORD=...
SALESFORCE_SECURITY_TOKEN=...
SALESFORCE_LOGIN_URL=https://login.salesforce.com

RABBITMQ_URL=amqp://...
RABBITMQ_QUEUE_NAME=salesforce-operations

BOT_NAME=WhatsApp Bot
BOT_WELCOME_MESSAGE=Hello! How can I help you?

NODE_ENV=production  # or 'test' for test environment
```

## Support

For issues with:
- **Workflows:** Check Actions tab logs
- **Render deployments:** Check Render dashboard logs
- **Application errors:** Check application logs in Render

---

**Note:** Make sure to keep your secrets secure and never commit them to the repository!
