# Contributing to ExamForge

Thank you for your interest in improving ExamForge! We appreciate your help in building a better exam simulation platform.

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## How to Contribute

### Reporting Bugs

Before creating a bug report, please check existing issues to ensure the problem hasn't already been reported. When creating an issue, include:
- A clear, descriptive title.
- Steps to reproduce the bug.
- Expected behavior versus actual behavior.
- Screenshots, console logs, or question text snippets if applicable.
- Operating system and browser version.

### Suggesting Enhancements

Feature requests are welcome! When submitting a request:
- Explain why the enhancement would be useful to exam takers or educators.
- Provide clear details or mockups of the proposed behavior.

---

## Development Workflow

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/exam-forge.git
   cd exam-forge
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Create a Feature Branch**
   ```bash
   git checkout -b your-branch-name
   ```

4. **Make Changes and Verify**
   - Ensure code compiles cleanly:
     ```bash
     npm run lint
     npm run build
     ```

5. **Commit Your Work**
   - Write clear, concise, imperative commit messages (e.g., `Add negative marking validation to exam creator` rather than `feat: ...`).

6. **Submit a Pull Request**
   - Open a pull request against the `main` branch.
   - Fill out the PR template describing the changes made and any manual testing performed.

---

## Coding Standards

- **TypeScript**: Strive for strong typing. Avoid unnecessary `any` types where interfaces can be defined.
- **Styling**: Use Tailwind CSS utility classes and design tokens defined in `src/index.css`.
- **Formatting**: 2 spaces for indentation, UTF-8 charset, Unix line endings (`LF`).
