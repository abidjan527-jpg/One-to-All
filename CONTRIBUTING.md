# Contributing to One-to-All

Thank you for your interest in contributing to One-to-All! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome diverse perspectives
- Focus on constructive feedback
- Report issues to maintainers privately

## Getting Started

### Prerequisites
- Node.js 18+
- Git
- Docker (optional)

### Setup Development Environment

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/One-to-All.git
cd One-to-All

# Install dependencies
npm install

# Create a feature branch
git checkout -b feature/your-feature-name
```

### Development Workflow

```bash
# Run development server
npm run dev

# Run tests
npm test

# Run linter
npm run lint

# Format code
npm run format
```

## Submitting Changes

### Commit Message Guidelines

Follow conventional commits:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation
- `refactor:` for code refactoring
- `test:` for tests
- `chore:` for maintenance

Example:
```
feat: add support for Cohere models

- Implemented Cohere service
- Added route handlers
- Updated model router
```

### Pull Request Process

1. Update documentation as needed
2. Add tests for new features
3. Ensure all tests pass: `npm test`
4. Ensure code is formatted: `npm run format`
5. Create descriptive PR title and description

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added
- [ ] Integration tests added
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
```

## Adding New AI Providers

To add support for a new AI provider:

1. **Create Service File**: `src/services/provider-name.service.ts`
2. **Implement Interface**: Follow the pattern of existing services
3. **Update Router**: Add provider to `aiRouterService` in `src/services/ai-router.service.ts`
4. **Add Tests**: Create test file `src/services/__tests__/provider-name.service.test.ts`
5. **Update Documentation**: Add to README.md

### Service Template

```typescript
export class ProviderService {
  async chatCompletion(params: ChatParams): Promise<any> {
    // Implementation
  }

  async generateEmbeddings(text: string[]): Promise<number[][]> {
    // Implementation
  }

  getAvailableModels(): string[] {
    // Return model names
  }
}

export const providerService = new ProviderService();
```

## Testing

- Write unit tests for services
- Write integration tests for routes
- Maintain >80% code coverage
- Use Jest as the testing framework

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test:coverage

# Watch mode
npm test:watch
```

## Reporting Bugs

Create an issue with:
- Clear title
- Detailed description
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment information

## Suggesting Features

Create an issue with:
- Feature title
- Detailed description
- Use cases
- Potential implementation approach
- Any relevant examples or links

## Documentation

- Keep README.md updated
- Add JSDoc comments to functions
- Update API documentation
- Include examples in PR description

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

- Check existing issues
- Create a discussion
- Contact maintainers

Thank you for contributing! 🎉
