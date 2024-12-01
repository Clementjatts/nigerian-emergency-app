# Contributing to Nigerian Emergency App

First off, thank you for considering contributing to the Nigerian Emergency App! It's people like you that make this app a valuable resource for emergency response in Nigeria.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Process](#development-process)
4. [Pull Request Process](#pull-request-process)
5. [Coding Standards](#coding-standards)
6. [Testing Guidelines](#testing-guidelines)
7. [Documentation](#documentation)
8. [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI
- Git
- iOS Simulator (Mac) or Android Studio (Android)

### Setup Development Environment

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR-USERNAME/nigerian-emergency-app
   ```
3. Install dependencies:
   ```bash
   cd nigerian-emergency-app
   npm install
   ```
4. Create a branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Process

### 1. Pick an Issue

- Look for issues labeled `good first issue` or `help wanted`
- Comment on the issue to let others know you're working on it
- If no issue exists, create one first

### 2. Local Development

1. Start the development server:
   ```bash
   npm start
   ```

2. Run tests:
   ```bash
   npm test
   ```

3. Lint your code:
   ```bash
   npm run lint
   ```

### 3. Branch Strategy

- `main` - production code
- `develop` - development code
- `feature/*` - new features
- `bugfix/*` - bug fixes
- `hotfix/*` - urgent production fixes

## Pull Request Process

1. **Update Documentation**
   - Add/update relevant documentation
   - Include inline comments for complex code
   - Update API documentation if needed

2. **Write Tests**
   - Add unit tests for new features
   - Ensure all tests pass
   - Include integration tests if needed

3. **Submit PR**
   - Create PR against `develop` branch
   - Fill out PR template completely
   - Link related issues
   - Add screenshots/videos if UI changes

4. **Code Review**
   - Address reviewer comments
   - Keep PR focused and small
   - Ensure CI passes

## Coding Standards

### JavaScript/React Native

```javascript
// Use ES6+ features
const functionName = async () => {
  try {
    // Always use try-catch for async operations
    const result = await someAsyncOperation();
    return result;
  } catch (error) {
    logger.error('Operation failed:', error);
    throw error;
  }
};

// Use TypeScript types
interface Props {
  title: string;
  onPress: () => void;
}

// Component structure
const Component: React.FC<Props> = ({ title, onPress }) => {
  // Hooks at the top
  const [state, setState] = useState(null);
  
  // Effects after hooks
  useEffect(() => {
    // Effect logic
  }, [dependencies]);

  // Methods before render
  const handlePress = () => {
    onPress();
  };

  // Return JSX
  return (
    <View>
      <Text>{title}</Text>
    </View>
  );
};
```

### Style Guide

- Use ESLint and Prettier configurations
- Follow React Native community guidelines
- Use functional components and hooks
- Implement proper error handling
- Write meaningful commit messages

## Testing Guidelines

### Unit Tests

```javascript
describe('Component', () => {
  it('should render correctly', () => {
    const { getByText } = render(<Component />);
    expect(getByText('Expected Text')).toBeTruthy();
  });

  it('should handle press events', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<Component onPress={onPress} />);
    fireEvent.press(getByTestId('button'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

### Integration Tests

- Test component integration
- Test API integration
- Test navigation flows
- Test offline functionality

## Documentation

### Code Documentation

- Use JSDoc for function documentation
- Document complex algorithms
- Include examples in comments
- Update README when needed

### API Documentation

- Document all API endpoints
- Include request/response examples
- Document error responses
- Keep API docs up to date

## Community

### Communication Channels

- GitHub Issues
- Discord Server
- Weekly Dev Meetings
- Monthly Community Calls

### Getting Help

1. Check documentation
2. Search existing issues
3. Ask in Discord
4. Create a new issue

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Invited to core team (consistent contributors)

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.
