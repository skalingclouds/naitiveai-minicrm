```markdown
# naitiveai-minicrm Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development conventions and workflows for the `naitiveai-minicrm` repository, a TypeScript project built with the Vite framework. You'll learn how to structure files, write code, commit changes, and run tests according to the project's standards.

## Coding Conventions

### File Naming
- Use **PascalCase** for all file names.
  - Example: `CustomerList.tsx`, `UserProfile.ts`

### Imports
- Use **relative import paths**.
  - Example:
    ```typescript
    import { Customer } from './Customer';
    ```

### Exports
- Use **named exports**.
  - Example:
    ```typescript
    // In Customer.ts
    export const Customer = () => { /* ... */ };
    ```

### Commit Messages
- Use **Conventional Commits** with the `feat` prefix for features.
- Keep commit messages concise (average ~79 characters).
  - Example:
    ```
    feat: add customer search functionality to dashboard
    ```

## Workflows

### Feature Development
**Trigger:** When adding a new feature  
**Command:** `/feature-development`

1. Create a new file using PascalCase.
2. Implement the feature using TypeScript and Vite conventions.
3. Use relative imports for any dependencies.
4. Export components or utilities as named exports.
5. Write or update corresponding test files (`*.test.*`).
6. Commit changes with a conventional message, e.g., `feat: describe your feature`.

### Testing
**Trigger:** When verifying code correctness  
**Command:** `/run-tests`

1. Ensure test files follow the `*.test.*` pattern.
2. Run the project's test command (framework unknown; refer to project scripts).
3. Review test results and fix any failures before committing.

## Testing Patterns

- Test files are named with the `*.test.*` pattern (e.g., `Customer.test.ts`).
- The specific testing framework is not detected; check project dependencies or scripts for details.
- Place test files alongside the code they test or in a dedicated `tests` directory.

## Commands
| Command               | Purpose                                         |
|-----------------------|-------------------------------------------------|
| /feature-development  | Guide for implementing a new feature            |
| /run-tests            | Steps to execute and verify tests               |
```
