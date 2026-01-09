# Contributing to WhatsApp Salesforce Chatbot

Thank you for your interest in contributing to this project! We welcome contributions from the community.

## How to Contribute

### Reporting Issues

If you find a bug or have a feature request:

1. Check if the issue already exists in the GitHub Issues
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
   - Your environment details (OS, Node version, etc.)

### Code Contributions

1. **Fork the repository**

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR-USERNAME/whatsapp-chat-bot.git
   cd whatsapp-chat-bot
   ```

3. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Make your changes**
   - Follow the existing code style
   - Maintain hexagonal architecture principles
   - Add tests for new features
   - Update documentation as needed

6. **Test your changes**
   ```bash
   npm run build
   npm run lint
   npm test
   ```

7. **Commit your changes**
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```

8. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

9. **Create a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your fork and branch
   - Provide a clear description of your changes

## Code Style Guidelines

- Use TypeScript for all new code
- Follow the existing hexagonal architecture pattern
- Write clean, self-documenting code
- Add comments for complex logic
- Use meaningful variable and function names
- Keep functions small and focused

## Architecture Guidelines

When adding new features, maintain the hexagonal architecture:

- **Domain Layer**: Add new models or business logic
- **Application Layer**: Add new use cases
- **Infrastructure Layer**: Add new adapters or repositories
- **API Layer**: Add new entry points or controllers

See [ARCHITECTURE.md](ARCHITECTURE.md) for more details.

## Testing Guidelines

- Write unit tests for domain logic
- Write integration tests for adapters
- Ensure all tests pass before submitting PR
- Aim for meaningful test coverage
- Use descriptive test names

## Pull Request Guidelines

- Keep PRs focused and small
- One feature/fix per PR
- Include tests for new features
- Update documentation
- Ensure all checks pass
- Respond to review feedback

## Questions?

Feel free to open an issue for questions or discussions.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Help others learn and grow

Thank you for contributing!
