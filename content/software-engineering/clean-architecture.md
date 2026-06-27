---
title: Understanding Clean Architecture
category: Software Engineering
tags: [software-engineering, architecture, principles]
excerpt: An explanation of separating concerns and dependencies in system designs.
date: 2026-06-27
---

Clean architecture is about keeping options open and making code testable.

### The Dependency Rule

Dependencies must only point **inwards** toward the core business logic.

* **Entities**: Core business models.
* **Use Cases**: Application-specific rules.
* **Controllers/Gateways**: Translation layers.
* **UI/Devices**: External systems (frameworks, database).

```javascript
// Example of dependency direction
import { UserEntity } from '../entities/user.js';

export class RegisterUserUseCase {
  execute(userData) {
    return new UserEntity(userData);
  }
}
```
