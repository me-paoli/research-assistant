# Research Assistant Refactoring Plan (Prototype Focus)

## Overview
This document outlines a simplified refactoring plan focused on creating a clean, maintainable codebase for the research assistant prototype. The plan prioritizes code organization, type safety, and developer experience over security hardening and performance optimization.

## Phase 1: Core Architecture & Type Safety

### 🔴 Critical Issues (Must Fix)

#### API Route Standardization
- [ ] **Migrate all API routes to App Router**
  - Move from `pages/api/` to `src/app/api/`
  - Update all route handlers to use new Next.js 15 patterns
  - Context: Mixed API route patterns causing confusion

- [ ] **Implement consistent error handling**
  - Create simple error handling utilities
  - Standardize error response format
  - Context: Inconsistent error handling across endpoints

- [ ] **Add basic request validation**
  - Use `zod` for simple input validation
  - Validate required fields in API requests
  - Context: No input validation currently

#### Type Safety Improvements
- [ ] **Replace all `any` types**
  - Create proper interfaces for all data structures
  - Add TypeScript interfaces for API responses
  - Context: Loose typing causing development issues

- [ ] **Add environment validation**
  - Create `src/lib/env.ts` to validate required environment variables
  - Use `zod` for runtime validation
  - Context: Currently using `!` assertions which can cause runtime errors

## Phase 2: Code Organization & Maintainability

### 🟡 Code Structure (High Priority)

#### Component Architecture
- [ ] **Break down large components**
  - Split Upload page (421 lines) into smaller components
  - Create reusable UI components
  - Context: Large components are hard to maintain

- [ ] **Create custom hooks**
  - Extract `useFileUpload`, `useInterviewStatus`, `useSearch`
  - Remove duplicate logic across components
  - Context: Repeated logic in multiple components

- [ ] **Implement proper state management**
  - Use React Context or Zustand for shared state
  - Separate UI state from business logic
  - Context: Complex state management in components

#### Code Standards
- [ ] **Add comprehensive ESLint rules**
  - Configure TypeScript rules
  - Add import/export rules
  - Context: Basic ESLint configuration

- [ ] **Implement Prettier**
  - Add Prettier for consistent formatting
  - Context: Inconsistent code formatting

- [ ] **Add JSDoc documentation**
  - Document all public functions and components
  - Add inline comments for complex logic
  - Context: No code documentation

### 🟡 Database & Storage Cleanup

- [ ] **Organize database types**
  - Move all database types to `src/types/database.ts`
  - Create proper interfaces for all tables
  - Context: Types scattered across files

- [ ] **Standardize API responses**
  - Create consistent response formats
  - Add proper TypeScript interfaces
  - Context: Inconsistent API response structures

## Phase 3: Developer Experience

### 🟡 Development Tools

- [ ] **Add development utilities**
  - Create helper functions for common operations
  - Add debugging utilities
  - Context: No development helpers

- [ ] **Improve error messages**
  - Add descriptive error messages
  - Implement better error logging
  - Context: Generic error messages

- [ ] **Add loading states**
  - Implement consistent loading patterns
  - Add skeleton screens where appropriate
  - Context: Inconsistent loading states

### 🟡 Code Quality

- [ ] **Remove duplicate code**
  - Extract common utilities
  - Create shared components
  - Context: Repeated code across files

- [ ] **Improve naming conventions**
  - Use consistent naming patterns
  - Make variable and function names descriptive
  - Context: Inconsistent naming

- [ ] **Add constants file**
  - Move magic numbers and strings to constants
  - Create configuration objects
  - Context: Hardcoded values scattered throughout

## Implementation Guidelines

### Code Organization Best Practices
- Keep components small and focused (< 200 lines)
- Extract reusable logic into hooks
- Use consistent naming conventions
- Separate concerns (UI, business logic, data)
- Document complex functions
- Use proper folder structure

### TypeScript Best Practices
- Use strict TypeScript configuration
- Avoid `any` types - create proper interfaces
- Use discriminated unions for complex state
- Implement proper error types
- Use generic types where appropriate
- Add runtime validation with zod

### Component Best Practices
- Use React.memo for expensive components
- Implement proper loading states
- Add error boundaries for critical components
- Keep components pure when possible
- Use proper prop types

### API Best Practices
- Use consistent response formats
- Add proper error handling
- Validate inputs with zod
- Use descriptive endpoint names
- Add proper HTTP status codes

## Success Metrics

### Code Quality
- [ ] TypeScript strict mode enabled
- [ ] ESLint passes with no warnings
- [ ] All components documented
- [ ] No `any` types in codebase

### Maintainability
- [ ] Component complexity < 200 lines
- [ ] No duplicate code
- [ ] Consistent error handling
- [ ] Proper folder structure

### Developer Experience
- [ ] Clear error messages
- [ ] Consistent loading states
- [ ] Well-documented functions
- [ ] Easy to add new features

## Timeline

- **Week 1**: Phase 1 - Core architecture and type safety
- **Week 2**: Phase 2 - Code organization and structure
- **Week 3**: Phase 3 - Developer experience improvements

## Folder Structure (Target)

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes (migrated from pages/api/)
│   ├── upload/            # Upload page
│   ├── search/            # Search page
│   ├── interviews/        # Interviews list
│   └── analytics/         # Analytics dashboard
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── forms/            # Form components
│   └── layout/           # Layout components
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
│   ├── supabase.ts       # Supabase client
│   ├── storage.ts        # Storage service
│   ├── env.ts           # Environment validation
│   └── utils.ts         # Common utilities
├── types/                # TypeScript type definitions
│   ├── database.ts      # Database types
│   ├── api.ts           # API types
│   └── common.ts        # Common types
└── constants/           # Application constants
```

## Resources

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [React 19 Best Practices](https://react.dev/learn)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zod Documentation](https://zod.dev/)

---

**Note**: This plan focuses on creating a clean, maintainable codebase for rapid prototyping and development. Security, performance optimization, authentication, and automated testing have been intentionally excluded to reduce complexity. 